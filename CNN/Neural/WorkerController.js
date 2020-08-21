/**
 * @file This file is an importable module to handle neural (web) worker body by worker proxy.
 *
 */

import * as WorkerProxy from "./WorkerProxy.js";
//import * as ValueMax from "../ValueMax.js";
//import * as Net from "./Net.js";

export { Base };


/**
 * The container of WorkerProxy. It orchestrates these WorkerProxy. Especially, it transfers (scaled) source image data to and from
 * web worker. This could maximize parallel computing under the restriction transferring source image data to every web worker serially.
 *
 * Every worker handles one neural network. When processTensor() is called, the input (usually a large memory block)
 * will be transffered to the 1st worker to start computing, and then transffered to the 2nd worker to start computing, ... etc.
 *
 * When passing large data by Worker.postMessage(), it is preferred by transferring (not by copying). If the large data wants to be
 * transferred (not copied) to many workers, the only possible way is to transferring them serially.
 *
 * However, serially transferring hurts the performance. Workers are better to compute parallelly. So every worker should transfer the
 * (possible scaled) source image data back to this WorkerController, and keep computing neural network at the same. And then, this
 * WorkerController will transfer the source image data to the next worker as soon as possible.
 *
 * Finally, this WorkerController collects all web workers' processTensor() results in a promise. The promise will resolve with an array
 * of typed-array. Every typed-array is the output of one neural network.
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
      this.workerProxyArray = null;
    }

    this.initProgressAll = null;
  }

  /**
   * Download image data from source canvas. Pass source image data to every web worker serially by transferring.
   *
   * @param {HTMLCanvasElement} sourceCanvas
   *   The source canvas to be processed. Its shape [ height, width, channel ] should be the same as the size which is used when
   * training the neural network.
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker processing promises of the same processingId are resolved. The promise
   * resolves with an array of typed-array. Every typed-array comes from the output tensor of one worker's neural network.
   */
  async processCanvas_Async_ByTransfer( sourceCanvas ) {
    let ctx = sourceCanvas.getContext( '2d' );
    let sourceImageData = ctx.getImageData( 0, 0, sourceCanvas.width, sourceCanvas.height );
    return this.processImageData_Async_ByTransfer( sourceImageData );
  }

  /**
   * Pass source image data to every web worker serially by transferring.
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. Its shape [ height, width, channel ] should be the same as the size which is used when
   * training the neural network.
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker processing promises of the same processingId are resolved. The promise
   * resolves with an array of typed-array. Every typed-array comes from the output tensor of one worker's neural network.
   */
  async processImageData_Async_ByTransfer( sourceImageData ) {

    let processingId = ++this.processingId; // Generate a new processing id so that the result returned from worker could be distinguished.

    let workerProxy, processRelayPromises, sourceTypedArray;

    // For first (i == 0) web worker, passing source ImageData.
    workerProxy = this.workerProxyArray[ 0 ];
    this.processTensorPromiseArray[ 0 ] = workerProxy.processImageDataAsync( processingId, sourceImageData );
    // Now, sourceImageData.data.buffer has become invalid because it is transferred (not copied) to the above web worker.

    // For all other (i >= 1) web workers, passing scaled source typed-array.
    for ( let i = 1; i < this.workerProxyArray.length; ++i ) {

      // Wait the previous web worker transferring back the scaled source typed-array. (after it has been copied into a new tensor inside the web worker).
      processRelayPromises = workerProxy.processRelayPromisesMap.get( processingId );
      sourceTypedArray = await processRelayPromises.relay.promise;

      workerProxy = this.workerProxyArray[ i ];
      this.processTensorPromiseArray[ i ] = workerProxy.processTypedArrayAsync( processingId, sourceTypedArray );
      // Now, sourceTypedArray.buffer has become invalid because it is transferred (not copied) to the above web worker.
    }

    // Note: Array push() is faster than unshift(), and unshift() is faster than concat().

    // Since all web worker has received the source image data (although serially), wait for all them done.
    let promiseAllSettled = Promise.allSettled( this.processTensorPromiseArray );
    return promiseAllSettled;
  }

  /**
   * Download image data from source canvas. Pass source image data to every web worker parallelly by copying.
   *
   * @param {HTMLCanvasElement} sourceCanvas
   *   The source canvas to be processed. Its shape [ height, width, channel ] should be the same as the size which is used when
   * training the neural network.
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker processing promises of the same processingId are resolved. The promise
   * resolves with an array of typed-array. Every typed-array comes from the output tensor of one worker's neural network.
   */
  async processCanvas_Async_ByCopy( sourceCanvas ) {

    // Create (scaled) source tensor so that every web worker needs not scale again and easier to re-create source tensor.
    //
    // The drawback is that here should have tensorflow.js library loaded.
    let scaledSourceTensor = this.neuralNetConfig.create_ScaledSourceTensor_from_ImageData_or_Canvas( sourceCanvas );
    let scaledSourceTypedArray = await scaledSourceTensor.data();
    scaledSourceTensor.dispose(); // Discard the source tensor because type-array (not tensor) will be past to web worker

//!!! ...unfinished...
    let processingId = ++this.processingId; // Generate a new processing id so that the result returned from worker could be distinguished.

//!!! ...unfinished...

    let workerProxy, processRelayPromises, sourceTypedArray;

    // For first (i == 0) web worker, passing source ImageData.
    workerProxy = this.workerProxyArray[ 0 ];
    this.processTensorPromiseArray[ 0 ] = workerProxy.processImageDataAsync( processingId, sourceImageData );
    // Now, sourceImageData.data.buffer has become invalid because it is transferred (not copied) to the above web worker.

    // For all other (i >= 1) web workers, passing scaled source typed-array.
    for ( let i = 1; i < this.workerProxyArray.length; ++i ) {

      // Wait the previous web worker transferring back the scaled source typed-array. (after it has been copied into a new tensor inside the web worker).
      processRelayPromises = workerProxy.processRelayPromisesMap.get( processingId );
      sourceTypedArray = await processRelayPromises.relay.promise;

      workerProxy = this.workerProxyArray[ i ];
      this.processTensorPromiseArray[ i ] = workerProxy.processTypedArrayAsync( processingId, sourceTypedArray );
      // Now, sourceTypedArray.buffer has become invalid because it is transferred (not copied) to the above web worker.
    }

    // Note: Array push() is faster than unshift(), and unshift() is faster than concat().

    // Since all web worker has received the source image data (although serially), wait for all them done.
    let promiseAllSettled = Promise.allSettled( this.processTensorPromiseArray );
    return promiseAllSettled;
  }

}
