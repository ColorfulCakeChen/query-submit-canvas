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
//!!! ...unfinished...

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
   * Scale the source image data, transfer scaled source image data back to WorkerProxy, compute neural network, pass result to WorkerProxy.
   *
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing result.
   *
   * @param {ImageData} sourceImageData
   *   The image data to be processed.
   */
  processTensor( processingId, sourceImageData ) {

    // Create (scaled) source image so that we can always dispose all tensors (including sourceTensor) except the returning tensor.
    //
    // Usually, only the first web worker ( workerId == 0 ) will be responsible for scaling the source image data to default size.
    // After that, all other web worker received the already scaled image data.
    let scaledSourceTensor = this.neuralNet.create_ScaledSourceTensor_from_ImageData_or_Canvas( sourceImageData );

    // Convert back to scaled source ImageData, and transfer back to WorkerProxy (and inform WorkerController).
    //
    // The reason why it is done asynchronously is for not blocking the following computation of neural network.
    this.transferBackSourceImageDataAsync( processingId, scaledSourceTensor );

    // At the same time (the scaled source image data is transferring back to WorkerProxy and then WorkerController), this worker is still computing
    // the neural network parallelly.
    let resultTensor3d = this.neuralNet.apply_and_destroy_or_keep( scaledSourceTensor, true );

    let resultTypedArray = await resultTensor3d.data();
    resultTensor3d.dispose(); // The result tensor should be disposed.

    // Pass the output of neural network to WorkerProxy and then WorkerController.
    let message = { command: "processTensorResult", workerId: this.workerId, processingId: processingId, resultTypedArray: resultTypedArray };
    postMessage( message, [ message.resultTypedArray.buffer ] );
  }

  /**
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing result.
   *
   * @param {ImageData} originalSourceImageData
   *   The original image data past to processTensor(). If its size is the same as scaledSourceTensor, this original will be transferred back to
   * WorkerController. In this case, scaledSourceTensor.data() will not be called.
   *
   * @param {tf.tensor3d} scaledSourceTensor
   *   The scaled source image tensor3d. If its size is different from originalSourceImageData, its data will be asynchronously downloaded
   * and transferred back to WorkerController.
   *
   * @return {Promise} Return a promise which resolves with the resultArray.
   */
  async transferBackSourceImageDataAsync( processingId, originalSourceImageData, scaledSourceTensor ) {

    let scaledSourceImageData;

    if (   ( scaledSourceTensor.shape[ 0 ] == originalSourceImageData.height )
        && ( scaledSourceTensor.shape[ 1 ] == originalSourceImageData.width  ) ) {

      // Since scaledSourceTensor is the same size as originalSourceImageData (i.e. does not be scaled), it is not necessary to download from scaledSourceTensor.
      scaledSourceImageData = originalSourceImageData;

    } else {

      // Convert back to scaled source ImageData asynchronously.
      let scaledSourceImageDataTypedArray = await scaledSourceTensor.data();
      scaledSourceImageData = { height: scaledSourceTensor.shape[ 0 ], width: scaledSourceTensor.shape[ 1 ], data: scaledSourceImageDataTypedArray };
    }

    // Transfer back to WorkerProxy (and inform WorkerController).
    let message = { command: "transferBackSourceImageData", workerId: this.workerId, processingId: processingId, sourceImageData: scaledSourceImageData };
    postMessage( message, [ message.sourceImageData.data.buffer ] );
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
      globalThis.NeuralNet = await import( "./Net.js" ); // Load neural network library in globalThis.NeuralNet scope.

//!!! ...unfinished...
///      globalThis.workerBody.init( message.workerId, message.neuralNetConfig, message.weightsURL, message.nextWorkerId );
      globalThis.workerBody.init( message.workerId, message.neuralNetConfig, message.weightsURL );
      break;

    case "disposeWorker": //{ command: "disposeWorker" };
      globalThis.workerBody.disposeWorker();
      break;

    case "processTensor": //{ command: "processTensor", processingId, sourceImageData };
      globalThis.workerBody.processTensor( message.processingId, message.sourceImageData );
      break;

  }
}
