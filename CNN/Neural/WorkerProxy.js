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

    let p = this.promise = new Promise( ( resolve, reject ) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

}

/**
 * Hold the worker and its related promise map.
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
   *
   * @param {WorkerController} workerController
   *   The container of this worker proxy.
   */
  init( workerId, tensorflowJsURL, neuralNetConfig, weightsURL, initProgress, workerController ) {
    this.workerId = workerId;
    this.tensorflowJsURL = tensorflowJsURL;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;
    this.initProgress = initProgress;
    this.workerController = workerController;

    // Every worker has a result pending promise map. The key of the map is processing id. The value of the map is a PromiseResolveReject.
    this.promiseResolveRejectMap = new Map();
    
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
  }

//!!! ...unfinished... How the collect all processTensor() promise to WorkerController (since they are called serially)?
// by Promise chain?
//!!! ...unfinished... Generate two promise. One for processTensor result. Another for passing source image data to next web worker.

  /**
   * @param {number} processingId
   *   The processing id for distinguishing different processing request and result.
   *
   * @param {ImageData} sourceImageData
   *   The image data to be processed.
   *
   * @param {function} pfnNextWorkerProcessTensor
   *   If not null, it will be called as 
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker pending promises of the same processingId are resolved. The promise
   * resolved with an array of typed-array. Every type-array comes from the output tensor of one worker's neural network.
   */
  async processTensor( processingId, sourceImageData, pfnNextWorkerProcessTensor ) {

 //!!! Transferring typed-array is better than ImageData because the ImageData should be re-constructed to typed-array again by another web worker.

//!!! ...unfinished... sourceImageData should be pass to next worker serially.

    let message = { command: "processTensor", processingId: processingId, sourceImageData: sourceImageData };
    this.worker.postMessage( message, [ message.sourceImageData.data.buffer ] );

    // Record the a promise's function object (resolve and reject) in a map so that the promise can be found and resolved when processing is done.
    let promiseResolveReject = new PromiseResolveReject( this.workerId, processingId );
    this.promiseResolveRejectMap.set( processingId, promiseResolveReject );

//!!! ...unfinished...
    return promiseResolveReject.promise;
  }

//!!! ...unfinished...
  nextWorkerProcessTensor( workerId, processingId, sourceImageData ) {

    if ( workerId != this.workerId )
      return; // Ignore if wrong worker id.

    if ( !this.pfnNextWorkerProcessTensor )
      return; // There is not next web worker (i.e. this is the last web worker).

    // The source image data is sent from this.processTensor() to this web worker and from this web worker back to here.
    // Now, pass (i.e. serially) the source image data to next web worker.
    //
    // The reason to pass source image data serially is because the source image data (usually large) is tranferred (not copied) to web worker.
    // Since it is not copied, it can only be past from one worker to another (i.e. one by one).
    this.pfnNextWorkerProcessTensor( processingId, sourceImageData );
  }

  /**
   * Handle messages from the progress of loading library of web workers.
   */
  initLibraryProgress_onReport( workerId ) {
  }

  /**
   * Handle messages from the progress of loading neural network of web workers.
   */
  initNeuralNetProgress_onReport( workerId ) {
  }

  /**
   * Dispatch messages come from the owned web worker.
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
  processTensor_onResult( workerId, processingId, resultTypedArray ) {

    if ( workerId != this.workerId )
      return; // Ignore if wrong worker id.

    let promiseResolveReject = this.promiseResolveRejectMap.get( processingId );
    if ( !promiseResolveReject )
      return; // Discard result with non-existed processing id. (e.g. already handled old processing result)

    promiseResolveReject.resolve( resultTypedArray );

//!!! ...unfinished... When will fail?
    //pendingPromiseInfo.reject();

//!!! ...unfinished... Whether should the older (i.e. smaller) processingId be cleared from map? (Could the processing be out of order?)

    this.pendingPromiseInfoMap.delete( processingId ); // Clear the info entry of handled processing result.
  }

  /**
   * Dispatch messages come from the owned web worker.
   *
   * @param {Base} this
   *   Should be binded to this object.
   */
  static onmessage_fromWorker( e ) {
    let message = e.data;

//!!! ...unfinished... 

    switch ( message.command ) {
      case "initLibraryProgressReport": //{ command: "initLibraryProgressReport", workerId, ,  };
        //this.initLibraryProgress_onReport( message.workerId, ,  );
        break;

      case "initNeuralNetProgressReport": //{ command: "initNeuralNetProgressReport", workerId, ,  };
        //this.initNeuralNetProgress_onReport( message.workerId, ,  );
        break;

      case "nextWorkerProcessTensor": //{ command: "nextWorkerProcessTensor", workerId, processingId, sourceImageData };
        this.nextWorkerProcessTensor( message.workerId, message.processingId, message.sourceImageData );
        break;

      case "processTensorResult": //{ command: "processTensorResult", workerId, processingId, resultTypedArray };
        this.processTensor_onResult( message.workerId, message.processingId, message.resultTypedArray );
        break;

    }
  }

}
