/**
 * @file This file is both an importable module and a main javascript file of web worker.
 *
 */

import * as NeuralNetwork from "./NeuralNetwork.js";

export { Proxy };

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
class Proxy {

  /**
   *
   * @param {NeuralNetwork.Config} neuralNetworkConfig
   *   The configuration of the neural network which will be created by this web worker.
   *
   * @param {number} totalWorkerCount
   *   There are how many workers should be created in chain.
   *
   * @param {string} weightsURL
   *   The URL of neural network weights. Every worker will load weights from the URL to initialize one neural network.
   *
   * @param {number} workerId
   *   This worker's id. The id of the first worker should be 0. If ( workerId < ( totalWorkerCount - 1 ) ), the next new worker will be created.
   */
  init_and_create_next( neuralNetworkConfig, totalWorkerCount, weightsURL, workerId ) {
//??? in cascade ?
    this.disposeWorkers();

    this.neuralNetworkConfig = neuralNetworkConfig;
    this.totalWorkerCount = totalWorkerCount;
    this.weightsURL = weightsURL;
    this.workerId = workerId || 0;

    let remainedWorkerCount = totalWorkerCount - workerId;
    if ( remainedWorkerCount <= 0 )
      return;  // Done. All workers in the cascade chain are created.

//     // Assume the "BlocksWorker.js" is the file name of this module file.
//     let workerURL = new URL( "BlocksWorker.js", import.meta.url );

    this.workerURL = import.meta.url;        // Assume this file is both an importable module and a main javascript file of web worker.
    this.workerOptions = { type: "module" }; // So that the worker script could use import statement.
    this.worker = new Worker( this.workerURL, this.workerOptions );

    remainedWorkerCount -= 1; // Because a new worker is just created, the remained count reduces one.
    if ( remainedWorkerCount <= 0 )
      return;  // Done. All workers in the cascade chain are created.

    // Create next worker in the cascade chain.
    let message = {
      command: "createNextWorker",
      neuralNetworkConfig: neuralNetworkConfig,
      totalWorkerCount: totalWorkerCount,
      weightsURL: weightsURL,
      workerId: ( workerId + 1 )
    };
    this.worker.postMessage( message );
  }

  disposeWorkers() {
    if ( this.worker ) {
      let message = { command: "disposeWorker" };
      this.worker.postMessage( message );
      this.worker = null;
    }
  }

  apply() {
  }
    
}



if ( globalThis.document ) {
  // In main document context (Not in worker context). Do nothing.

} else {
  // In worker context. Create neural network. Register message handler.

  globalThis.workerProxy = new Proxy();

  globalThis.onmessage = function( e ) {
    let message = e.data;

    switch ( message.command ) {
      case "createNextWorker": //{ command: "createNextWorker", neuralNetworkConfig, totalWorkerCount, weightsURL, workerId };
        globalThis.workerProxy.init_and_create_next( message.neuralNetworkConfig, message.remainedWorkerCount, message.weightsURL, message.workerId );
        break;

      case "disposeWorker": //{ command: "disposeWorker" };
        globalThis.workerProxy.disposeWorker( message );
        break;

    }
  }
}
