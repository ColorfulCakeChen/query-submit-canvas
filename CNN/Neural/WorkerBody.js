/**
 * @file This file is the main (i.e. body) javascript file of neural network web worker. It is not an importable module.
 *
 */

// In module (non-classic) web worker, static import is available. But at the same time, importScripts() will not be avbailable.
// For solving this problem, using classic (non-module) web worker so that tensorflow.js can be loaded by importScripts().
// At the same time, using dynamic import() to load ourselves module because import() can be used in classic (non-module) script.
//
//import * as Net from "./Net.js";

/**
 * The implementation of a neural network web worker.
 *
 */
class WorkerBody {

  /**
   *
   * @param {number} workerId
   *   A non-negative integer represents this worker's id. The id of the first worker should be 0.
   *
   * @param {Net.Config} neuralNetConfig
   *   The configuration of the neural network which will be created by this web worker.
   *
   * @param {string} weightsURL
   *   The URL of neural network weights. Every worker will load weights from the URL to initialize one neural network.
   */
  init( workerId = 0, neuralNetConfig, weightsURL ) {

    if ( workerId < 0 )
      workerId = 0;

    this.workerId = workerId;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;

    let bKeepInputTensor = false; // Because every web worker will copy the input, there is not necessary to keep input.

    this.neuralNet = new Net();
    this.neuralNet.init( neuralNetConfig, bKeepInputTensor );
  }

  disposeWorker() {
    if ( this.neuralNet ) {
      this.neuralNet.disposeTensors();
      this.neuralNet = null;
    }

//!!!??? calling close() when the next worker disposed ?
    close();
  }

  /**
   * Convert source image data to tensor3d, scale it, transfer scaled source typed-array back to WorkerProxy, compute neural network,
   * pass result back to WorkerProxy.
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing resultso that WorkerProxy could find back corresponding promise.
   *
   * @param {ImageData} sourceImageData
   *   The image data to be processed. The size should be [ sourceImageData.height, sourceImageData.width ]
   * = [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ] ]. And it should RGBA 4 channels.
   */
  imageData_transferBack_processTensor( processingId, sourceImageData ) {

    // Create (scaled) source image so that then neural network can process it.
    //
    // Usually, only the first web worker ( workerId == 0 ) is responsible for scaling the source image data to default size.
    // After that, all other web worker received the already scaled typed-array.
    //
    // The reason why not use source ImageData directly is that the next web worker could re-create tensor3d more effficiently.
    //
    // ImageData uses Uint8ClampedArray internally. If it is past directly, the next web worker needs create tensor3d by fromPixel()
    // which internally converts twice: from Uint8ClampedArray to Int32Array and from Int32Array to tensor3d.
    //
    // If passing typed-array (Float32Array), the next web worker could use it to re-create tensord3d directly.
    let scaledSourceTensor = this.neuralNetConfig.create_ScaledSourceTensor_from_ImageData_or_Canvas( sourceImageData );

    // Download the scaledSourceTensor as typed-array (asynchronously), and transfer it back to WorkerProxy (and inform WorkerController).
    //
    // The reason why it is done asynchronously is for not blocking the following computation of neural network.
    this.transferBackSourceScaledTensorAsync( processingId, scaledSourceTensor );

    // At the same time (the scaled source typed-array data is transferring back to WorkerProxy and then WorkerController), this worker is
    // still computing the neural network parallelly.
    this.processTensorAndDispose( processingId, scaledSourceTensor );
  }

  /**
   * Transfer scaled source typed-array data back to WorkerProxy, re-create source tensor, compute neural network, pass result back to WorkerProxy.
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing resultso that WorkerProxy could find back corresponding promise.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-data to be processed. Its shape should be [ height, width, channel ] =
   * [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ].
   */
  typedArray_transferBack_processTensor( processingId, sourceTypedArray ) {
    let shape = [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ];

    // Re-create (scaled) source tensor.
    //
    // This should be done before calling transferBackSourceTypedArray() which will transfer (not copy) the sourceTypedArray and invalid it.
    let scaledSourceTensor = tf.tensor3d( sourceTypedArray, shape );

    // Transfer (not copy) the sourceTypedArray back to WorkerProxy). This will invalid sourceTypedArray.
    this.transferBackSourceTypedArray( processingId, sourceTypedArray );

    // At the same time (the sourceTypedArray is transferring back to WorkerProxy and then WorkerController), this worker is still computing
    // the neural network parallelly.
    this.processTensorAndDispose( processingId, scaledSourceTensor );
  }

  /**
   * Re-create source tensor, compute neural network, pass result back to WorkerProxy.
   *
   * It will not transfer source back to WorkerProxy. This is different from typedArray_TransferBack_processTensor().
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing resultso that WorkerProxy could find back corresponding promise.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-data to be processed. Its shape should be [ height, width, channel ] =
   * [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ].
   */
  typedArray_processTensor( processingId, sourceTypedArray ) {
    let shape = [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ];
    let scaledSourceTensor = tf.tensor3d( sourceTypedArray, shape ); // Re-create (scaled) source tensor.
    this.processTensorAndDispose( processingId, scaledSourceTensor );
  }

  /**
   * Compute neural network, and pass result back to WorkerProxy.
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing resultso that WorkerProxy could find back corresponding promise.
   *
   * @param {tf.tensor3d} scaledSourceTensor
   *   The source tensor3d to be processed. The scaledSourceTensor.shape should be [ height, width, channel ] =
   * [ this.neuralNet.sourceImageHeightWidth[ 0 ], this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ].
   * This tensor will be disposed when processing is done.
   */
  processTensorAndDispose( processingId, scaledSourceTensor ) {

    // Note: scaledSourceTensor will be dispose because this.neuralNet is initialized with ( bKeepInputTensor == false ).
    let resultTensor3d = this.neuralNet.apply_and_destroy_or_keep( scaledSourceTensor, true );

    let resultTypedArray = resultTensor3d.dataSync(); // Download synchronously (because here is web worker).
    resultTensor3d.dispose(); // The result tensor should also be disposed.

    // Pass the output of neural network to WorkerProxy (and inform WorkerController).
    let message = { command: "processTensorResult", workerId: this.workerId, processingId: processingId, resultTypedArray: resultTypedArray };
    postMessage( message, [ message.resultTypedArray.buffer ] );
  }

  /**
   * Download the scaledSourceTensor as typed-array (Float32Array) asynchronously. Transfer the typed-array back to WorkerProxy
   * (and inform WorkerController) so that it can be past to next web worker.
   *
   * @param {number} processingId
   *   The id of this processing. It is used by WorkerProxy to found back corresponding promise.
   *
   * @param {tf.tensor3d} scaledSourceTensor
   *   The scaled source tensor3d generated by processImageData().
   */
  async transferBackSourceScaledTensorAsync( processingId, scaledSourceTensor ) {
    let sourceTypedArray = await scaledSourceTensor.data(); // Download scaled source tensor3d as typed-array (Float32Array) asynchronously.
    this.transferBackSourceTypedArray( processingId, sourceTypedArray );
  }

  /**
   * Transfer source typed-array back to WorkerProxy (and inform WorkerController) so that it can be past to next web worker.
   *
   * @param {number} processingId
   *   The id of this processing. It is used by WorkerProxy to found back corresponding promise.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-array past to processTypedArray(). This will become invalid after this call because it will be transferred (not
   * copied) back to WorkerProxy.
   */
  transferBackSourceTypedArray( processingId, sourceTypedArray ) {
    let message = { command: "transferBackSourceTypedArray", workerId: this.workerId, processingId: processingId, sourceTypedArray: sourceTypedArray };
    postMessage( message, [ message.sourceTypedArray.buffer ] );
  }

}



if ( globalThis.document ) {
  return; // In main document context (Not in worker context). Do nothing.

// In worker context. Register message handler.

globalThis.workerBody = new WorkerBody();

globalThis.onmessage = function( e ) {
  let message = e.data;

  switch ( message.command ) {


//!!! ...unfinished...
//    case "init": //{ command: "init", workerId, tensorflowJsURL, neuralNetConfig, weightsURL, nextWorkerId };
    case "init": //{ command: "init", workerId, tensorflowJsURL, neuralNetConfig, weightsURL };
      nextWorkerId: ( nextWorkerProxy ) ? nextWorkerProxy.workerId : null

//!!! ...unfinished... global scope ? report progress ?
      importScripts( message.tensorflowJsURL );          // Load tensorflow javascript library in global scope.
      globalThis.NeuralNet = await import( "./Net.js" ); // Load neural network library in globalThis.NeuralNet scope.

//!!! ...unfinished...
///      globalThis.workerBody.init( message.workerId, message.neuralNetConfig, message.weightsURL, message.nextWorkerId );
      globalThis.workerBody.init( message.workerId, message.neuralNetConfig, message.weightsURL );
      break;

    case "disposeWorker": //{ command: "disposeWorker" };
      globalThis.workerBody.disposeWorker();
      break;

    case "imageData_transferBack_processTensor": //{ command: "imageData_transferBack_processTensor", processingId, sourceImageData };
      globalThis.workerBody.imageData_transferBack_processTensor( message.processingId, message.sourceImageData );
      break;

    case "typedArray_transferBack_processTensor": //{ command: "typedArray_transferBack_processTensor", processingId, sourceTypedArray };
      globalThis.workerBody.typedArray_TransferBack_processTensor( message.processingId, message.sourceTypedArray );
      break;

    case "typedArray_processTensor": //{ command: "typedArray_processTensor", processingId, sourceTypedArray };
      globalThis.workerBody.typedArray_processTensor( message.processingId, message.sourceTypedArray );
      break;
  }
}
