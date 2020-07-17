/**
 * @file This file is the main (i.e. body) javascript file of neural network web worker. It is not an importable module.
 *
 */

import * as Net from "./Net.js";
import * as WorkerProxy from "./WorkerProxy.js";

/**
 * A wrapper of worker for
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
   *   This worker's id. The id of the first worker should be 0.
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
//??? in cascade ?

    this.workerId = workerId;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;

    let bKeepInputTensor = ???;

    this.neuralNet = new Net();
    this.neuralNet.init( neuralNetConfig, bKeepInputTensor );
  }

  disposeWorker() {
    if ( this.neuralNet ) {
      this.neuralNet.disposeTensors();
      this.neuralNet = null;
    }

//!!! how to dispose net worker in cascade chain?
  }

  apply() {
  }
    
}



if ( globalThis.document ) {
  // In main document context (Not in worker context). Do nothing.

} else {
  // In worker context. Create neural network. Register message handler.

  globalThis.workerBody = new WorkerBody();

  globalThis.onmessage = function( e ) {
    let message = e.data;

    switch ( message.command ) {
      case "init": //{ command: "init", workerId, neuralNetConfig, totalWorkerCount, weightsURL };
        globalThis.workerProxy.init( message.workerId, message.neuralNetConfig, message.totalWorkerCount, message.weightsURL );
        break;

      case "createNextWorker": //{ command: "createNextWorker", neuralNetworkConfig, remainedWorkerCount, weightsURL, workerId };
        globalThis.workerProxy.init_and_create_next( message.neuralNetworkConfig, message.remainedWorkerCount, message.weightsURL, message.workerId );
        break;

      case "disposeWorker": //{ command: "disposeWorker" };
        globalThis.workerProxy.disposeWorker();
        break;

      case "apply": //{ command: "apply" };
        globalThis.workerProxy.apply(  );
        break;

    }
  }
}
