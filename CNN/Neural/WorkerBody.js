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
//!!! ...unfinished...
   * If ( ( totalWorkerCount - workerId ) > 0 ), this method will create a neural network.
   * If ( ( totalWorkerCount - workerId ) > 1 ), this method will create the next neural network web worker, too.
   *
   * @param {number} workerId
   *   A non-negative integer represents this worker's id. The id of the first worker should be 0.
   *
   * @param {Net.Config} neuralNetConfig
   *   The configuration of the neural network which will be created by this web worker.
   *
   * @param {string} weightsURL
   *   The URL of neural network weights. Every worker will load weights from the URL to initialize one neural network.
   *
//!!! ...unfinished...
   * @param {number} nextWorkerId
   *   The next web worker id in chain. If null, this is the last worker in chain.
   */
//!!! ...unfinished...
//  init( workerId, neuralNetConfig, weightsURL, nextWorkerId ) {
  init( workerId, neuralNetConfig, weightsURL ) {

    workerId = workerId | 0;
    if ( workerId < 0 )
      workerId = 0;

    this.workerId = workerId;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;
//!!! ...unfinished...
//    this.nextWorkerId = nextWorkerId;

//!!!
//     let remainedWorkerCount = totalWorkerCount - workerId; // How many web worker should be created.
//     if ( remainedWorkerCount <= 0 )
//       return; // Should not happen. If happened, just return without creating any neural network.

    let bKeepInputTensor = false; // Because every web worker will copy the input, there is not necessary to keep input.

    this.neuralNet = new Net();
    this.neuralNet.init( neuralNetConfig, bKeepInputTensor );

//!!!
//     remainedWorkerCount -= 1; // "-1" for a neural network is created.
//     if ( remainedWorkerCount <= 0 )
//       return; // All neural network web worker are created.
//
//     let nextWorkerId = workerId + 1;
//     let nextWorkerProxy = this.nextWorkerProxy = new WorkerProxy.Base();
//     nextWorkerProxy.init( nextWorkerId, neuralNetConfig, totalWorkerCount, weightsURL ); // Create the next web worker in cascade chain.
  }

  disposeWorker() {
    if ( this.neuralNet ) {
      this.neuralNet.disposeTensors();
      this.neuralNet = null;
    }

//!!! ...unfinished...
//     if ( this.nextWorkerProxy ) { // Dispose the next web worker in cascade chain.
//       this.nextWorkerProxy.disposeWorker();
//       this.nextWorkerProxy = null;
//     }

//!!!??? calling close() when the next worker disposed ?
    close();
  }

  /**
   * @param {number} processingId
   *   The id of this processing. It is used when reporting processing result.
   *
   * @param {ImageData} sourceImageData
   *   The image data to be processed.
   *
???
   * @param {tf.tensor3d[]} resultArray
   *   If ( resultArray != null ), all result (new) tensors will be filled into this array. This could reduce the array memory
   * re-allocation and improve performance. If ( resultArray == null ), all result tensors will be disposed and nothing will be
   * returned. No matter in which case, all other intermediate tensors were disposed.
   *
   * @return {Promise} Return a promise which resolves with the resultArray.
   */
  processTensor( processingId, sourceImageData ) {

    // Create (scaled) source image so that we can always dispose all tensors (including sourceTensor) except the returning tensor.
    //
    // Usually, only the first web worker ( workerId == 0 ) will be responsible for scaling the source image data to default size.
    // After that, all other web worker received the already scaled image data.
    let scaledSourceTensor = this.neuralNet.create_ScaledSourceTensor_from_ImageData_or_Canvas( sourceImageData );

//!!! ...unfinished...
    
    let resultTypedArray = resultTensor.data();

    let message = { command: "sendBackSourceImageData", workerId: this.workerId, processingId: processingId, sourceImageData: sourceImageData };
    postMessage( message, [ message.sourceImageData.data.buffer ] );

//!!! ...unfinished... The result tensor should be disposed.
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
