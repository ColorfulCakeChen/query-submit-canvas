/**
 * @file This file is an importable module to handle and communicate to the neural network (web) worker body.
 *
 */

import * as ValueMax from "../ValueMax.js";
//import * as Net from "./Net.js";

export { InitProgress, InitProgressAll, PendingPromiseInfo, Base };


/**
 * Aggregate initialization progress of one web worker.
 * Including: download tensorflow and neural network library, download neural network weights, parse neural network weights.
 */
class InitProgress extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new ValueMax.Percentage.Concrete(), // Increased when downloading tensorflow and neural network library.
      new ValueMax.Percentage.Concrete(), // Increased when downloading neural network weights.
      new ValueMax.Percentage.Concrete(), // Increased when parsing neural network weights.
    ];

    super( children );
    [ this.libraryDownload, this.weightsDownload, this.weightsParse ] = children;
  }
}

/**
 * Aggregate initialization progress of two workers.
 */
class InitProgressAll extends ValueMax.Percentage.Aggregate {
  constructor() {
    let children = [
      new InitProgress(), // Increased when web worker 1 initializing.
      new InitProgress(), // Increased when web worker 2 initializing.
    ];

    super( children );
    [ this.worker1, this.worker2 ] = children;
  }
}

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
class Base {

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
   * @param {string} weightsURL
   *   The URL of neural network weights. Every worker will load weights from the URL to initialize one neural network.
   *
   * @param {InitProgress} initProgress
   *   This worker proxy will modify theInitProgress to report its web worker's initialization progress.
   */
  init( workerId, tensorflowJsURL, neuralNetConfig, weightsURL, initProgress ) {
    this.workerId = workerId;
    this.tensorflowJsURL = tensorflowJsURL;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;
    this.initProgress = initProgress;

    // Every worker has a result pending promise map. The key of the map is processing id. The value of the map is a ProcessRelayPromises.
    this.processRelayPromisesMap = new Map();

//!!! ...unfinished...

    // Assume the main (i.e. body) javascript file of neural network web worker is a sibling file (i.e. inside the same folder) of this module file.
    this.workerURL = new URL( import.meta.url, "WorkerBody.js" );

    // Should not use "module" type worker, otherwise the worker can not use importScripts() to load tensorflow library.
    //this.workerOptions = { type: "module" }; // So that the worker script could use import statement.
    this.workerOptions = null;

    let worker = this.worker = new Worker( this.workerURL, this.workerOptions );
    worker.onmessage = Base.onmessage_fromWorker.bind( this ); // Register callback from the web worker.

    // Worker Initialization message.
    let message = {
      command: "init",
      workerId: workerId,
      tensorflowJsURL: tensorflowJsURL,
      neuralNetConfig: neuralNetConfig,
      weightsURL: weightsURL
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
    this.nextWorkerProxy = null;
  }

  /**
   * @param {number} processingId
   *   The processing id for distinguishing different processing request and result.
   *
   * @param {ImageData} sourceImageData
   *   The image data to be processed.
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker pending promises of the same processingId are resolved. The promise
   * resolved with an array of typed-array. Every type-array comes from the output tensor of one worker's neural network.
   */
  async processTensor( processingId, sourceImageData ) {

    // Prepare promises and their function object (resolve and reject) in a map so that the promises can be found and resolved when processing is done.
    //
    // The processRelayPromises.relay.promise will be await by outter (i.e. WorkerController) to transfer source image data to every web worker serially.
    // The processRelayPromises.process.promise will be returned as the result of this processTensor().
    let processRelayPromises = new ProcessRelayPromises( this.workerId, processingId );
    this.processRelayPromisesMap.set( processingId, processRelayPromises );
    
    // Transfer (not copy) the source image data to this (worker proxy owned) web worker.
    let message = { command: "processTensor", processingId: processingId, sourceImageData: sourceImageData };
    this.worker.postMessage( message, [ message.sourceImageData.data.buffer ] );
    // Now, sourceImageData.data.buffer has become invalid because it is transferred (not copied) to web worker.

    return processRelayPromises.process.promise;
  }

  /**
   * Handle messages from the progress of loading library of web workers.
   */
  initLibraryProgress_onReport( workerId ) {
//!!! ...unfinished...
  }

  /**
   * Handle messages from the progress of loading neural network of web workers.
   */
  initNeuralNetProgress_onReport( workerId ) {
//!!! ...unfinished...
  }

  /**
   * Called when the scaled source image data from web worker is received.
   */
  on_transferBackSourceImageData( workerId, processingId, sourceImageData ) {

    if ( workerId != this.workerId )
      return; // Ignore if wrong worker id.

    let processRelayPromises = this.processRelayPromisesMap.get( processingId );
    if ( !processRelayPromises )
      return; // Ignore if processing id does not existed. (e.g. already handled)

    processRelayPromises.relay.resolve( sourceImageData ); // This will be received by WorkerController.

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
      case "initLibraryProgressReport": //{ command: "initLibraryProgressReport", workerId, ,  };
//!!! ...unfinished...
        //this.initLibraryProgress_onReport( message.workerId, ,  );
        break;

      case "initNeuralNetProgressReport": //{ command: "initNeuralNetProgressReport", workerId, ,  };
//!!! ...unfinished... 
        //this.initNeuralNetProgress_onReport( message.workerId, ,  );
        break;

      case "transferBackSourceImageData": //{ command: "transferBackSourceImageData", workerId, processingId, sourceImageData };
        this.on_transferBackSourceImageData( message.workerId, message.processingId, message.sourceImageData );
        break;

      case "processTensorResult": //{ command: "processTensorResult", workerId, processingId, resultTypedArray };
        this.on_processTensorResult( message.workerId, message.processingId, message.resultTypedArray );
        break;

    }
  }

}
