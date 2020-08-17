/**
 * @file This file is an importable module to handle neural (web) worker body by worker proxy.
 *
 */

import * as WorkerProxy from "./WorkerProxy.js";
//import * as ValueMax from "../ValueMax.js";
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
   * Initialize this worker controller. It will create two web workers and inform them to create a neural network per worker.
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
!!! game_object_id_array.length as totalWorkerCount.
!!! Handle game object created and destroyed. Create and destroy web worker in needed.

   * @param {number[]} game_object_id_array
   *   The id for game objects.
   */
  init(
      tensorflowJsURL,
      neuralNetConfig, totalWorkerCount, weightsURL
//      game_object_id_array
  ) {

    this.tensorflowJsURL = tensorflowJsURL;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;

    this.processingId = -1; // The current processing id. Negative means processTensor() has not been called. Every processTensor() call will use a new id.

    this.hardwareConcurrency = navigator.hardwareConcurrency; // logical CPU count.

//!!! ...unfinished... According to logical CPU count, create so many web worker.
//!!! ...unfinished... Perhaps, two web workers are sufficient.
    // Our neural networks are learning by differential evolution. Differential evolution evaluates just two entities every time.
    // The output of one neural network will contain action signals of all game obejcts. However, only half of the output will be used
    // because one neural network only control one alignment of the game world.

    this.initProgressAll = new WorkerProxy.InitProgressAll(); // Statistics of progress of all workers' initialization.

    this.workerProxyArray = new Array( totalWorkerCount );
    for ( let i = 0; i < totalWorkerCount; ++i ) {
      let initProgress = this.initProgressAll.childrren[ i ];
      let workerProxy = this.workerProxyArray[ i ] = new WorkerProxy.Base();
      workerProxy.init( i, tensorflowJsURL, neuralNetConfig, weightsURL, initProgress );
    } 

    this.processTensorPromiseArray = new Array( totalWorkerCount ); // Pre-allocation for reducing re-allocation.
  }

  /**
   * 
   */
  disposeWorkers() {
    if ( this.workerProxyArray ) {
      for ( let i = 0; i < this.workerProxyArray.length; ++i ) {
        this.workerProxyArray[ i ].disposeWorker();
      }
      this.workerProxyArray  = null;
    }

    this.initProgressAll = null;
  }

  /**
   * @param {ImageData} sourceImageData
   *   The image data to be processed.
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker processing promises of the same processingId are resolved. The promise
   * resolved with an array of typed-array. Every type-array comes from the output tensor of one worker's neural network.
   */
  async processTensor( sourceImageData ) {

 //!!! Transferring typed-array is better than ImageData because the ImageData should be re-constructed to typed-array again by another web worker.

    let processingId = ++this.processingId; // Generate a new processing id so that the result returned from worker could be distinguished.

    for ( let i = 0; i < this.workerProxyArray.length; ++i ) {
      let workerProxy = this.workerProxyArray[ i ];

      // Transfer (not copy) the source image data to one web worker.
      this.processTensorPromiseArray[ i ] = workerProxy.processTensor( processingId, sourceImageData );

      // Now, sourceImageData.data.buffer has become invalid because it is transferred (not copied) to the above web worker.

      // No matter whether this is the last web worker in chain, wait for it sending back the source image data (after it
      // has scaled (and so had a copy of) the source image data).
      //
      // Re-used the variable sourceImageData to receive the source image data sent back from the web worker. It will be pass to the next web worker.
      let processRelayPromises = workerProxy.processRelayPromisesMap.get( processingId );
      sourceImageData = await processRelayPromises.relay.promise;
    }

//!!! ...unfinished... Array push() is faster than unshift(), and unshift() is faster than concat().

    // Since all web worker has received the source image data (although serially), wait for all them done.
    let promiseAllSettled = Promise.allSettled( this.processTensorPromiseArray );
    return promiseAllSettled;
  }

  
}
