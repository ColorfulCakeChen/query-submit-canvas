/**
 * @file This file is an importable module to handle and communicate to the neural network (web) worker body.
 *
 */

//import * as ValueMax from "../ValueMax.js";
import * as NeuralNetProgress from "./NetProgress.js";
//import * as GVizTQ from "../util/GVizTQ.js";

export { PendingPromiseInfo, WorkerProxy_Base as Base };


/**
 * Hold a processing's id, promise, resolve (fulfilling function object), reject (rejecting function object).
 *
 * @member {number}   workerId     The array index of the worker owns this processing.
 * @member {number}   processingId The id of the processing.
 * @member {Promise}  promise      The pending promise for the processing.
 * @member {function} resolve      The fulfilling function object of the pending promise for the processing.
 * @member {function} reject       The rejecting function object of the pending promise for the processing.
 */
class PromiseResolveReject {

  constructor( workerId, processingId ) {
    this.workerId = workerId;
    this.processingId = processingId;

    this.promise = new Promise( ( resolve, reject ) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

}

/**
 * Hold two PromiseResolveReject.
 *
 * @member {PromiseResolveReject}   process The promise for reporting processTensor() done.
 * @member {PromiseResolveReject}   relay   The promise for reporting scaledSourceImageData is received from this web worker.
 */
class ProcessRelayPromises {

  constructor( workerId, processingId ) {
    this.process = new PromiseResolveReject( workerId, processingId );
    this.relay = new PromiseResolveReject( workerId, processingId );
  }

}

/**
 * Hold the worker and its related promise map. It is a wrapper of a neural network web worker for handling easily.
 *
 * @member {number} workerId              The array index of this worker proxy.
 * @member {Worker} worker                The worker.
 * @member {Map}    pendingPromiseInfoMap The map for promise of the unhandled processing.
 */
class WorkerProxy_Base {

  /**
   * Initialize this worker proxy. It will create one web worker and inform it to create one neural network.
   *
   * @param {number} workerId
   *   This id of this worker proxy (and web worker). This is the array index in the parent container (i.e. WorkerController).
   *
   * @param {string} tensorflowJsURL
   *   The URL of tensorflow javascript library. Every worker will load the library from the URL.
   *
   * @param {Net.Config} neuralNetConfig
   *   The configuration of the neural network which will be created by this web worker.
   *
   * @param {string} weightsSpreadsheetId
   *   The Google Sheets spreadsheetId of neural network weights. Every worker will load weights from the spreadsheet to initialize one neural network.
   *
   * @param {string} weightsAPIKey
   *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
   *
   * @param {NeuralNetProgress.InitProgress} initProgress
   *   This worker proxy will modify initProgress to report its web worker's initialization progress.
   */
  init( workerId, tensorflowJsURL, neuralNetConfig, weightsSpreadsheetId, weightsAPIKey, initProgress ) {
    this.workerId = workerId;
    this.tensorflowJsURL = tensorflowJsURL;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsSpreadsheetId = weightsSpreadsheetId;
    this.weightsAPIKey = weightsAPIKey;
    this.initProgress = initProgress;

    // Every worker has a result pending promise map. The key of the map is processing id. The value of the map is a ProcessRelayPromises.
    this.processRelayPromisesMap = new Map();

    // Assume the main (i.e. body) javascript file of neural network web worker is a sibling file (i.e. inside the same folder) of this module file.
    this.workerURL = new URL( import.meta.url, "WorkerBody.js" );

    // Should not use "module" type worker, otherwise the worker can not use importScripts() to load tensorflow.js library.
    //this.workerOptions = { type: "module" }; // So that the worker script could use import statement.
    this.workerOptions = null;

    let worker = this.worker = new Worker( this.workerURL, this.workerOptions );
    worker.onmessage = WorkerProxy_Base.onmessage_fromWorker.bind( this ); // Register callback from the web worker.

    // Worker Initialization message.
    let message = {
      command: "init",
      workerId: workerId,
      tensorflowJsURL: tensorflowJsURL,
      neuralNetConfig: neuralNetConfig,
      weightsSpreadsheetId: weightsSpreadsheetId,
      weightsAPIKey: weightsAPIKey
    };

    worker.postMessage( message );  // Inform the worker to initialize.
  }

  /**
   * 
   */
  disposeWorker() {
    {
      let message = { command: "disposeWorker" };
      this.worker.postMessage( message );
      this.worker  = null;
    }

    this.initProgress = null;
  }

  /**
   * @param {number} processingId
   *   The processing id for distinguishing different processing request and result.
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. Its shape should be [ height, width, channel ] = [ this.neuralNet.sourceImageHeightWidth[ 0 ],
   * this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ]. This usually is called for the first web worker
   * in chain. The web worker will tansfer back a scaled typed-array. The scaled typed-array should be used to call the next web worker's
   * typedArray_transferBack_processTensor_async().
   *
   * @return {Promise}
   *   Return a promise which will be resolved when this (WorkerProxy owned) web worker's neural network computing done. It resolved with
   * a typed-array which comes from the output tensor of the web worker's neural network.
   */
  async imageData_transferBack_processTensor_async( processingId, sourceImageData ) {

    // Prepare promises and their function object (resolve and reject) in a map so that the promises can be found and resolved when processing is done.
    //
    // The processRelayPromises.relay.promise will be await by outter (i.e. WorkerController) to transfer source typed-array to every web worker serially.
    // The processRelayPromises.process.promise will be returned as the result of this processTensor().
    let processRelayPromises = new ProcessRelayPromises( this.workerId, processingId );
    this.processRelayPromisesMap.set( processingId, processRelayPromises );
    
    // Transfer (not copy) the source image data to this (worker proxy owned) web worker.
    let message = { command: "imageData_transferBack_processTensor", processingId: processingId, sourceImageData: sourceImageData };
    this.worker.postMessage( message, [ message.sourceImageData.data.buffer ] );
    // Now, sourceImageData.data.buffer has become invalid because it is transferred (not copied) to web worker.

    return processRelayPromises.process.promise;
  }

  /**
   * @param {number} processingId
   *   The processing id for distinguishing different processing request and result.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-data to be processed. Its shape should be [ height, width, channel ] = [ this.neuralNet.sourceImageHeightWidth[ 0 ],
   * this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ]. This usually is come from the previous web work
   * by on_transferBackSourceTypedArray(). This usually is called for the second (and after) web worker in chain. The web worker will
   * tansfer back this scaled typed-array. The scaled typed-array should continuously be used to call the next web worker's
   * typedArray_transferBack_processTensor_async().
   *
   * @return {Promise}
   *   Return a promise which will be resolved when this (WorkerProxy owned) web worker's neural network computing done. It resolved with
   * a typed-array which comes from the output tensor of the web worker's neural network.
   */
  async typedArray_transferBack_processTensor_async( processingId, sourceTypedArray ) {

    // Prepare promises and their function object (resolve and reject) in a map so that the promises can be found and resolved when processing is done.
    //
    // The processRelayPromises.relay.promise will be await by outter (i.e. WorkerController) to transfer source typed-array to every web worker serially.
    // The processRelayPromises.process.promise will be returned as the result of this processTensor().
    let processRelayPromises = new ProcessRelayPromises( this.workerId, processingId );
    this.processRelayPromisesMap.set( processingId, processRelayPromises );
    
    // Transfer (not copy) the source typed-array to this (worker proxy owned) web worker.
    let message = { command: "typedArray_transferBack_processTensor", processingId: processingId, sourceTypedArray: sourceTypedArray };
    this.worker.postMessage( message, [ message.sourceTypedArray.buffer ] );
    // Now, sourceTypedArray.buffer has become invalid because it is transferred (not copied) to web worker.

    return processRelayPromises.process.promise;
  }

  /**
   * This will not transfer source back to WorkerProxy. This is different from typedArray_transferBack_processTensor_async().
   *
   * @param {number} processingId
   *   The processing id for distinguishing different processing request and result.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-data to be processed. Its shape should be [ height, width, channel ] = [ this.neuralNet.sourceImageHeightWidth[ 0 ],
   * this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ]. This usually is come from the previous web work
   * by on_transferBackSourceTypedArray().
   *
   * @return {Promise}
   *   Return a promise which will be resolved when this (WorkerProxy owned) web worker's neural network computing done. It resolved with
   * a typed-array which comes from the output tensor of the web worker's neural network.
   */
  async typedArray_processTensor_async( processingId, sourceTypedArray ) {

    // Prepare promises and their function object (resolve and reject) in a map so that the promises can be found and resolved when processing is done.
    //
    // The processRelayPromises.relay.promise will not be used because the source typed-array will not be transferred back here.
    // The processRelayPromises.process.promise will be returned as the result of this processTensor().
    let processRelayPromises = new ProcessRelayPromises( this.workerId, processingId );
    this.processRelayPromisesMap.set( processingId, processRelayPromises );

    // Copy (not transfer) the source typed-array to this (worker proxy owned) web worker.
    let message = { command: "typedArray_processTensor", processingId: processingId, sourceTypedArray: sourceTypedArray };
    this.worker.postMessage( message );

    return processRelayPromises.process.promise;
  }

  /**
   * Handle messages from the progress of loading library of web workers.
   */
  initLibraryProgress_onReport( workerId ) {
//!!! ...unfinished...
    this.initProgress.libraryDownload;
    this.initProgress.weightsDownload;
    this.initProgress.weightsParse;

  }

  /**
   * Handle messages from the progress of loading neural network of web workers.
   */
  initNeuralNetProgress_onReport( workerId ) {
//!!! ...unfinished...
  }

  /**
   * Handle messages from the progress of initialization of web workers.
   */
  on_reportInitProgress( message ) {
//!!! ...unfinished...
    switch ( message.subCommand ) {
      case "restAccumulation": //{ command: "reportInitProgress", subCommand: "restAccumulation", workerId, ,  };
        //this.on_initProgress_restAccumulation( message.workerId, ,  );
        break;

      case "libraryDownload": //{ command: "reportInitProgress", subCommand: "libraryDownload", workerId, ,  };
        //this.on_initProgress_libraryDownload( message.workerId, ,  );
        break;
    }
  }

  /**
   * Called when the scaled source typed-array from web worker is received.
   */
  on_transferBackSourceTypedArray( workerId, processingId, sourceTypedArray ) {

    if ( workerId != this.workerId )
      return; // Ignore if wrong worker id.

    let processRelayPromises = this.processRelayPromisesMap.get( processingId );
    if ( !processRelayPromises )
      return; // Ignore if processing id does not existed. (e.g. already handled)

    processRelayPromises.relay.resolve( sourceTypedArray ); // This will be received by WorkerController.

    // Here, the processRelayPromises should not be removed from processRelayPromisesMap.
    // It will be removed when processTensor() done completely (i.e. inside on_processTensorResult()).
  }

  /**
   * Called when the processed tensor from web worker is received.
   *
   * @param {number} workerId
   *   The id of the worker which sent the result back.
   *
   * @param {number} processingId
   *   The processing id of the result.
   *
   * @param {TypedArray} resultTypedArray
   *   The result of the returned processing. It is the downloaded data of the result tensor.
   */
  on_processTensorResult( workerId, processingId, resultTypedArray ) {

    if ( workerId != this.workerId )
      return; // Ignore if wrong worker id.

    let processRelayPromises = this.processRelayPromisesMap.get( processingId );
    if ( !processRelayPromises )
      return; // Discard result with non-existed processing id. (e.g. already handled old processing result)

    processRelayPromises.process.resolve( resultTypedArray );

//!!! ...unfinished... When will fail?
    //processRelayPromises.reject();

//!!! ...unfinished... Whether should the older (i.e. smaller) processingId be cleared from map? (Could the processing be out of order?)

    this.processRelayPromisesMap.delete( processingId ); // Clear the info entry of handled processing result.
  }

  /**
   * Dispatch messages come from the owned web worker.
   *
   * @param {Base} this
   *   Should be binded to this object.
   */
  static onmessage_fromWorker( e ) {
    let message = e.data;

    switch ( message.command ) {
//!!! ...unfinished... 
      case "reportInitProgress": //{ command: "reportInitProgress", subCommand, workerId, ,  };
        this.on_reportInitProgress( message );
        break;

      case "transferBackSourceTypedArray": //{ command: "transferBackSourceTypedArray", workerId, processingId, sourceTypedArray };
        this.on_transferBackSourceTypedArray( message.workerId, message.processingId, message.sourceTypedArray );
        break;

      case "processTensorResult": //{ command: "processTensorResult", workerId, processingId, resultTypedArray };
        this.on_processTensorResult( message.workerId, message.processingId, message.resultTypedArray );
        break;

    }
  }

}
