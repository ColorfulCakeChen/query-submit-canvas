/**
 * @file This file is an importable module to handle neural (web) worker body.
 *
 */

//import * as Net from "./Net.js";

export { Base };


/**
 * Hold a processing's id, promise, resolve (fulfilling function object), reject (rejecting function object).
 *
 * @member {number}   workerId     The array index of the worker owns this processing.
 * @member {number}   processingId The id of the processing.
 * @member {Promise}  promise      The pending promise for the processing.
 * @member {function} resolve      The fulfilling function object of the pending promise for the processing.
 * @member {function} reject       The rejecting function object of the pending promise for the processing.
 */
class WorkerPendingPromiseInfo {

  constructor( workerId, processingId ) {
    this.workerId = workerId;
    this.processingId = processingId;
  }

}

/**
 * Hold the worker and its related promise map.
 *
 * @member {number} workerId              The array index of this worker proxy.
 * @member {Worker} worker                The worker.
 * @member {Map}    pendingPromiseInfoMap The map for promise of the unhandled processing.
 */
class WorkerProxy {

  constructor( workerId ) {
    this.workerId = workerId;

    // Every worker has a result promise map. The key of the map is processing id. The value of the map is a WorkerPendingPromiseInfo.
    this.pendingPromiseInfoMap = new Map();
  }

}

/**
 * The wrapper of a neural network web worker for handling easily.
 *
!!! ...unfinished... cascade is slow when return all result. Master / Slaves should be faster.

 * Many workers cascade in chain. Every worker handles one neural network. When apply() is called, the input (usually a large memory block)
 * will be transffered to the 1st worker to start computing, and then transffered to the 2nd worker to start computing, ... etc.
 *
 * When passing large data by Worker.postMessage(), it is preferred by transferring (not by copying). If the large data wants to be transferred
 * to many workers, the only possible way is to transferring them serially. This is why the workers are arranged in cascade chain.
 *
 * However, serially transferring hurts the performance. Workers are better to compute parallelly. So every worker should transfer data to next
 * worker as soon as possible. When they get the first part of calculation result (rather than wait for all calculation done), they should
 * transfer the input data to the next worker immediately.
 *
 */
class Base {

  /**
   * Initialize this worker controller. It will create two web workers and inform them to create a neural network per worker.
   *
   * @param {Net.Config} neuralNetConfig
   *   The configuration of the neural network which will be created by this web worker.
   *
   * @param {number} totalWorkerCount
   *   There are how many workers should be created in chain.
   *
   * @param {string} weightsURL
   *   The URL of neural network weights. Every worker will load weights from the URL to initialize one neural network.
   *
!!! game_object_id_array.length as totalWorkerCount.
!!! Handle game object created and destroyed. Create and destroy web worker in needed.

   * @param {number[]} game_object_id_array
   *   The id for game objects.
   */
  init(
      neuralNetConfig, totalWorkerCount, weightsURL,
      game_object_id_array
  ) {

    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;
    this.processingId = -1; // The current processing id. Negative means processTensor() has not been called. Every processTensor() call will use a new id.

    this.hardwareConcurrency = navigator.hardwareConcurrency; // logical CPU count.

//!!! ...unfinished... According to logical CPU count, create so many web worker.
//!!! ...unfinished... Perhaps, two web workers are sufficient.
    // Our neural networks are learning by differential evolution. Differential evolution evaluates just two entities every time.

    // Assume the main (i.e. body) javascript file of neural network web worker is a sibling file (i.e. inside the same folder) of this module file.
    this.workerURL = new URL( import.meta.url, "WorkerBody.js" );

    this.workerOptions = { type: "module" }; // So that the worker script could use import statement.

    // Worker Initialization message.
    let message = {
      command: "init",
      //workerId: workerId,
      neuralNetConfig: neuralNetConfig,
      totalWorkerCount: totalWorkerCount,
      weightsURL: weightsURL
    };

    this.workerProxyArray = new Array( totalWorkerCount );
    for ( let i = 0; i < totalWorkerCount; ++i ) {
      let workerProxy = new WorkerProxy( i );
      this.workerProxyArray[ i ] = workerProxy;

      let worker = workerProxy.worker = new Worker( this.workerURL, this.workerOptions );

      worker.onmessage = Base.onmessage_fromWorker.bind( this ); // Register callback from the web worker.

      message.workerId = i;
      worker.postMessage( message );  // Initialize the worker.
    } 

    this.resultPromiseArray = new Array( totalWorkerCount ); // Pre-allocation for reducing re-allocation.
  }

  /**
   * 
   */
  disposeWorkers() {
    if ( this.workerProxyArray ) {
      for ( let i = 0; i < this.workerProxyArray.length; ++i ) {
        let message = { command: "disposeWorker" };
        this.workerProxyArray[ i ].worker.postMessage( message );
      }
      this.workerProxyArray  = null;
    }
  }

  /**
   * @param {ImageData} sourceImageData
   *   The image data to be processed.
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker pending promises of the same processingId are resolved. The promise
   * resolved with an array of typed-array. Every type-array comes from the output tensor of one worker's neural network.
   */
  async processTensor( sourceImageData ) {

 //!!! Transferring typed-array is better than ImageData because the ImageData should be re-constructed to typed-array again by another web worker.

    let processingId = ++this.processingId; // Generate a new processing id so that the result returned from worker could be distinguished.

    let message = { command: "processTensor", processingId: processingId, sourceImageData: sourceImageData };
    for ( let i = 0; i < this.workerProxyArray.length; ++i ) {
      let workerProxy = this.workerProxyArray[ i ];

      workerProxy.worker.postMessage( message, [ message.sourceImageData.data.buffer ] );

      let pendingPromiseInfo = WorkerPendingPromiseInfo( i, processingId );

      pendingPromiseInfo.promise = this.resultPromiseArray[ i ] = new Promise( ( resolve, reject ) => {
        pendingPromiseInfo.resolve = resolve;
        pendingPromiseInfo.reject = reject;
      });

      // Record the function object (resolve and reject) in a map so that the promise can be found and resolved when processing is done.
      workerProxy.pendingPromiseInfoMap.set( processingId, pendingPromiseInfo );
    }

    let promiseAllSettled = Promise.allSettled( this.resultPromiseArray );
    return promiseAllSettled;
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

    let workerProxy = this.workerProxyArray[ workerId ];
    if ( !workerProxy )
      return; // Discard result with non-existed worker id. (e.g. out of worker array index)

    let pendingPromiseInfo = workerProxy.pendingPromiseInfoMap.get( processingId );
    if ( !pendingPromiseInfo )
      return; // Discard result with non-existed processing id. (e.g. already handled old processing result)

    pendingPromiseInfo.resolve( resultTypedArray );

//!!! ...unfinished... When will fail?
    //pendingPromiseInfo.reject();

//!!! ...unfinished... Whether should the older (i.e. smaller) processingId be cleared from map? (Could the processing be out of order?)

    workerProxy.pendingPromiseInfoMap.delete( processingId ); // Clear the info entry of handled processing result.
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
      case "processTensorResult": //{ command: "processTensorResult", workerId, processingId, resultTypedArray };
        this.processTensor_onResult( message.workerId, message.processingId, message.resultTypedArray );
        break;

    }
  }
  
}
