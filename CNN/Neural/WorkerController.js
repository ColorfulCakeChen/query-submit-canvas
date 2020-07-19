/**
 * @file This file is an importable module to handle neural (web) worker body.
 *
 */

//import * as Net from "./Net.js";

export { Base };

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
   * Initialize this controller. It will create many web workers and inform them to create a neural network per worker.
   *
   * @param {Net.Config} neuralNetConfig
   *   The configuration of the neural network which will be created by this web worker.
   *
   * @param {number} totalWorkerCount
   *   There are how many workers should be created in chain.
   *
   * @param {string} weightsURL
   *   The URL of neural network weights. Every worker will load weights from the URL to initialize one neural network.
   */
  init( neuralNetConfig, totalWorkerCount, weightsURL ) {
    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;
    this.processingId = -1; // The current processing id. Negative means processTensor() has not been called. Every processTensor() call will use a new id.

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

    this.workerArray = new Array( totalWorkerCount );
    for ( let i = 0; i < totalWorkerCount; ++i ) {
      let worker = new Worker( this.workerURL, this.workerOptions );
      this.workerArray[ i ] = worker;

      worker.onmessage = Base.onmessage_fromWorker.bind( this ); // Register callback from the web worker.

      message.workerId = i;
      worker.postMessage( message );  // Initialize the worker.
    }    
  }

  /**
   * 
   */
  disposeWorker() {
    if ( this.workerArray ) {
      for ( let i = 0; i < this.workerArray.length; ++i ) {
        let message = { command: "disposeWorker" };
        this.workerArray[ i ].postMessage( message );
      }
      this.workerArray  = null;
    }
  }

  /**
   * @param {ImageData} sourceImageData
   *   The image data to be processed.
   *
   * @param {tf.tensor3d[]} resultArray
   *   If ( resultArray != null ), all result (new) tensors will be filled into this array. This could reduce the array memory
   * re-allocation and improve performance. If ( resultArray == null ), all result tensors will be disposed and nothing will be
   * returned. No matter in which case, all other intermediate tensors were disposed.
   *
   * @return {Promise} Return a promise which resolves with the resultArray.
   */
  async processTensor( sourceImageData, resultArray ) {

 //!!! Transferring typed-array is better than ImageData because the ImageData should be re-constructed to typed-array again by another web worker.

//!!! process id for matching to return resultArray ?

    ++this.processingId; // Generate a new processing id so that the result returned from worker could be distinguished.

    let message = { command: "processTensor", processingId: this.processingId, sourceImageData: sourceImageData };
    for ( let i = 0; i < this.workerArray.length; ++i ) {
      this.workerArray[ i ].postMessage( message, [ message.sourceImageData.data.buffer ] );
    }

//!!! How to return resultArray ?

    let p = new Promise( ( resolve, reject ) => {

      resolve( resultArray );
    });
    
    return p;
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

    if ( processingId != this.processingId )
      return; // Discard result with wrong processing id. (e.g. old processing result)

//!!! ...unfinished...

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
