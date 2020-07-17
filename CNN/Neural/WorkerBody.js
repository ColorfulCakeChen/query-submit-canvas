/**
 * @file This file is the main (i.e. body) javascript file of neural network web worker. It is not an importable module.
 *
 */

import * as Net from "./Net.js";
import * as WorkerProxy from "./WorkerProxy.js";

/**
 * The implementation of a neural network web worker.
 *
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
   * If ( ( totalWorkerCount - workerId ) > 0 ), this method will create a neural network.
   * If ( ( totalWorkerCount - workerId ) > 1 ), this method will create the next neural network web worker, too.
   *
   * @param {number} workerId
   *   A non-negative integer represents this worker's id. The id of the first worker should be 0.
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
  init( workerId, neuralNetConfig, totalWorkerCount, weightsURL ) {

    workerId = workerId | 0;
    if ( workerId < 0 )
      workerId = 0;

    this.workerId = workerId;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;

    let remainedWorkerCount = totalWorkerCount - workerId; // How many web worker should be created.
    if ( remainedWorkerCount <= 0 )
      return; // Should not happen. If happened, just return without creating any neural network.

    let bKeepInputTensor = false; // Because every web worker will copy the input, there is not necessary to keep input.

    this.neuralNet = new Net();
    this.neuralNet.init( neuralNetConfig, bKeepInputTensor );

    remainedWorkerCount -= 1; // "-1" for a neural network is created.
    if ( remainedWorkerCount <= 0 )
      return; // All neural network web worker are created.

    let nextWorkerId = workerId + 1;
    let nextWorkerProxy = this.nextWorkerProxy = new WorkerProxy.Base();
    nextWorkerProxy.init( nextWorkerId, neuralNetConfig, totalWorkerCount, weightsURL ); // Create the next web worker in cascade chain.
  }

  disposeWorker() {
    if ( this.neuralNet ) {
      this.neuralNet.disposeTensors();
      this.neuralNet = null;
    }

    if ( this.nextWorkerProxy ) { // Dispose the next web worker in cascade chain.
      this.nextWorkerProxy.disposeWorker();
      this.nextWorkerProxy = null;
    }

//!!!??? calling close() when the next worker disposed ?
    close();
  }

  processTensor() {
  }
    
}



if ( globalThis.document ) {
  // In main document context (Not in worker context). Do nothing.

} else {
  // In worker context. Register message handler.

  globalThis.workerBody = new WorkerBody();

  globalThis.onmessage = function( e ) {
    let message = e.data;

    switch ( message.command ) {
      case "init": //{ command: "init", workerId, neuralNetConfig, totalWorkerCount, weightsURL };
        globalThis.workerProxy.init( message.workerId, message.neuralNetConfig, message.totalWorkerCount, message.weightsURL );
        break;

      case "disposeWorker": //{ command: "disposeWorker" };
        globalThis.workerProxy.disposeWorker();
        break;

      case "apply": //{ command: "processTensor" };
        globalThis.workerProxy.processTensor(  );
        break;

    }
  }
}
