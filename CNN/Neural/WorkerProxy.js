/**
 * @file This file is an importable module to handle neural (web) worker body.
 *
 */

//import * as Net from "./Net.js";

export { Base };

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
class Base {

  /**
   * Create a web worker and inform it to create a neural network. The worker may create more worker according to workerId and totalWorkerCount.
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
    this.workerId = workerId;
    this.neuralNetConfig = neuralNetConfig;
    this.weightsURL = weightsURL;

    // Assume the main (i.e. body) javascript file of neural network web worker is a sibling file (i.e. inside the same folder) of this module file.
    this.workerURL = new URL( import.meta.url, "WorkerBody.js" );

    this.workerOptions = { type: "module" }; // So that the worker script could use import statement.
    this.worker = new Worker( this.workerURL, this.workerOptions );

    // Initialize the worker.
    let message = {
      command: "init",
      workerId: workerId,
      neuralNetConfig: neuralNetConfig,
      totalWorkerCount: totalWorkerCount,
      weightsURL: weightsURL
    };
    this.worker.postMessage( message );
  }

  /**
   * 
   */
  disposeWorker() {
    if ( this.worker ) {
      let message = { command: "disposeWorker" };
      this.worker.postMessage( message );
      this.worker = null;
    }
  }

  /**
   * 
   */
  processTensor() {
  }

}
