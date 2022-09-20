export { NeuralWorker_Proxies as Proxies };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as GSheets from "../util/GSheets.js";
//import * as ValueMax from "../util/ValueMax.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
import * as DEvolution from "../DEvolution.js";
import { Proxy as WorkerProxy } from "./NeuralWorker_Proxy.js";

/**
 * The container of WorkerProxy. It orchestrates these WorkerProxy. Especially, it
 * transfers (scaled) source image data to and from web worker. This could maximize
 * parallel computing under the restriction transferring source image data to every
 * web worker serially.
 *
 * Every worker handles one neural network. When processTensor() is called, the input
 * (usually a large memory block) will be transffered to the 1st worker to start
 * computing, and then transffered to the 2nd worker to start computing, ... etc.
 *
 * When passing large data by Worker.postMessage(), it is preferred by transferring
 * (not by copying). If the large data wants to be transferred (not copied) to many
 * workers, the only possible way is to transferring them serially.
 *
 * However, serially transferring hurts the performance. Workers are better to compute
 * parallelly. So every worker should transfer the (possible scaled) source image data
 * back to this WorkerProxies, and keep computing neural network at the same. And
 * then, this WorkerProxies will transfer the source image data to the next worker
 * as soon as possible.
 *
 * Finally, this WorkerProxies collects all web workers' processTensor() results in
 * a promise. The promise will resolve with an array of typed-array. Every typed-array
 * is the output of one neural network.
 *
 *
 *
 * @member {DEvolution.VersusRangeArray} evolutionVersusRangeArray
 *   The range list of all evolution versus (i.e. parent versus offspring).
 */
class NeuralWorker_Proxies extends Recyclable.Root {

  /**
   * Used as default NeuralWorker.Proxies provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralWorker.Proxies.Pool",
    NeuralWorker_Proxies, NeuralWorker_Proxies.setAsConstructor );

  /** */
  constructor() {
    super();
    NeuralWorker_Proxies.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    NeuralWorker_Proxies.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {

    this.evolutionVersusRangeArray = null; // Normal array. Just nullify it.

//!!! ...unfinished... (2022/08/26)
    this.disposeWorkers();

    super.disposeResources();
  }

//!!! ...unfinished... (2022/09/20)
// How to specify one worker or two workers?

  /**
   * Initialize this worker proxy controller. It will create two web workers and inform
   * them to create a neural network per worker.
   *
   * @param {string} weightsSpreadsheetId
   *   The Google Sheets spreadsheetId of neural network weights. Every worker will
   * load weights from the spreadsheet to initialize one neural network.
   *
   * @param {string} weightsAPIKey
   *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
   *   - If null, Google Visualization Table Query API will be used.
   *   - If not null, Google Sheets API v4 will be used.
   *
   * @param {NeuralNet.ParamsBase} neuralNetParamsBase
   *   The configuration of the neural network to be created by web worker.
   */
  async init( weightsSpreadsheetId, weightsAPIKey, neuralNetParamsBase ) {

//!!! ...unfinished... (2022/09/09) should be set in neuralNetParamsBase.
//     // Because every web worker will copy the input, there is not necessary to keep input.
//     neuralNetParamsBase.bKeepInputTensor = false;

    this.weightsSpreadsheetId = weightsSpreadsheetId;
    this.weightsAPIKey = weightsAPIKey;
    this.neuralNetParamsBase = neuralNetParamsBase;

    this.hardwareConcurrency = navigator.hardwareConcurrency; // logical CPU count.

    // Two web workers are sufficient.
    //
    // Although we might want create as many web worker as logical CPU count, it might
    // not need because our neural networks are learning by differential evolution.
    // Differential evolution evaluates just two entities every time.
    //

//!!! ...unfinished... (2022/08/26) really?

    // Note: How could the two neural networks determine all the actions of so many
    //       game objects? The method is to let the output of one neural network
    //       contains all actions of all game objects. But only half of the output
    //       actions will be used because one neural network only control one alignment
    //       of the game world.
    //
    let totalWorkerCount = this.totalWorkerCount = 2;

    this.workerProxyArray = Pool.OwnerArray.Pool.get_or_create_by();
    this.workerProxyArray.length = totalWorkerCount;

    for ( let i = 0; i < totalWorkerCount; ++i ) {
      let workerProxy = this.workerProxyArray[ i ] = WorkerProxy.Pool.get_or_create_by();
      workerProxy.initWorker_async( i );
    }
  }

  /**
   * 
   */
  disposeWorkers() {
    if ( this.workerProxyArray ) {
      this.workerProxyArray.disposeResources_and_recycleToPool();
      this.workerProxyArray = null;
    }
  }

  /** Load all evolution versus weights ranges. */
  async evolutionVersusRangeArray_loadAsync() {

    if ( !this.evolutionVersusRangeArray ) {
      this.evolutionVersusRangeArray = DEvolution.VersusRangeArray.Pool.get_or_create_by(
        this.weightsSpreadsheetId, this.weightsAPIKey );
    }

    this.evolutionVersusRangeArray.loadAsync();

//!!! ...unfinished... (2022/08/27)

  }

  /**
   * Download image data from source canvas. Pass source image data to every web
   * worker serially by transferring.
   *
   * @param {HTMLCanvasElement} sourceCanvas
   *   The source canvas to be processed. Its shape [ height, width, channelCount ]
   * should be the same as the size which is used when training the neural network.
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker processing promises of
   * the same processingId are resolved. The promise resolves with an array of
   * typed-array. Every typed-array comes from the output tensor of one worker's
   * neural network.
   */
  async processCanvas_Async_ByTransfer( sourceCanvas ) {
    let ctx = sourceCanvas.getContext( '2d' );
    let sourceImageData = ctx.getImageData(
      0, 0, sourceCanvas.width, sourceCanvas.height );
    return this.processImageData_Async_ByTransfer( sourceImageData );
  }

  /**
   * Pass source image data to every web worker serially by transferring.
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. Its shape [ height, width, channelCount ]
   * should be the same as the size which is used when training the neural network.
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker processing promises of
   * the same processingId are resolved. The promise resolves with an array of
   * typed-array. Every typed-array comes from the output tensor of one worker's
   * neural network.
   */
  async processImageData_Async_ByTransfer( sourceImageData ) {

    // Generate a new processing id so that the result returned from worker could
    // be distinguished.
    ++this.processingId;
    let processingId = this.processingId;

    let workerProxy, processRelayPromises, sourceTypedArray;

    // For first (i == 0) web worker, passing source ImageData.
    workerProxy = this.workerProxyArray[ 0 ];
    this.processTensorPromiseArray[ 0 ]
      = workerProxy.imageData_transferBack_processTensor_async(
          processingId, sourceImageData );
    // Now, sourceImageData.data.buffer has become invalid because it is transferred
    // (not copied) to the above web worker.

    // For all other (i >= 1) web workers, passing scaled source typed-array.
    for ( let i = 1; i < this.workerProxyArray.length; ++i ) {

      // Wait the previous web worker transferring back the scaled source typed-array.
      // (after it has been copied into a new tensor inside the web worker).
      processRelayPromises = workerProxy.processRelayPromisesMap.get( processingId );
      sourceTypedArray = await processRelayPromises.relay.promise;

      workerProxy = this.workerProxyArray[ i ];
      this.processTensorPromiseArray[ i ]
        = workerProxy.typedArray_transferBack_processTensor_async(
            processingId, sourceTypedArray );
      // Now, sourceTypedArray.buffer has become invalid because it is transferred
      // (not copied) to the above web worker.
    }

    // Note: Array push() is faster than unshift(), and unshift() is faster than concat().

    // Since all web worker has received the source image data (although serially),
    // wait for all them done.
    let promiseAllSettled = Promise.allSettled( this.processTensorPromiseArray );
    return promiseAllSettled;
  }

  /**
   * Download image data from source canvas, convert to tensor, scale, pass source
   * image data to every web worker parallelly by copying.
   *
   * The tensorflow.js library should have been loaded so that the source image
   * scaling could be done here (not in web worker).
   *
   * @param {HTMLCanvasElement} sourceCanvas
   *   The source canvas to be processed. Its shape [ height, width, channelCount ]
   * should be the same as the size which is used when training the neural network.
   *
   * @return {Promise}
   *   Return a promise which will be resolved when all worker processing promises of
   * the same processingId are resolved. The promise resolves with an array of
   * typed-array. Every typed-array comes from the output tensor of one worker's
   * neural network.
   */
  async processCanvas_Async_ByCopy( sourceCanvas ) {

    // Create (scaled) source tensor so that every web worker needs not scale again
    // and easier to re-create source tensor.
    //
    // The drawback is that the tensorflow.js library should have been loaded here.
    // And the image scaling is done here (not in web worker).
    //
    let scaledSourceTensor
      = this.neuralNetConfig.create_ScaledSourceTensor_from_PixelData( sourceCanvas );

    let sourceTypedArray = await scaledSourceTensor.data();

    // Discard the source tensor because type-array (not tensor) will be passed to
    // web worker
    scaledSourceTensor.dispose();

    // Generate a new processing id so that the result returned from worker could be
    // distinguished.
    ++this.processingId;
    let processingId = this.processingId;

    let workerProxy, processRelayPromises;

    for ( let i = 0; i < this.workerProxyArray.length; ++i ) {
      workerProxy = this.workerProxyArray[ i ];
      this.processTensorPromiseArray[ i ]
        = workerProxy.typedArray_processTensor_async( processingId, sourceTypedArray );
      // The sourceTypedArray is still valid here because it is copied (not
      // transferred) to the above web worker.
    }

    // Since all web worker has received the source typed-array (parallelly), wait
    // for all them done.
    let promiseAllSettled = Promise.allSettled( this.processTensorPromiseArray );
    return promiseAllSettled;
  }

}
