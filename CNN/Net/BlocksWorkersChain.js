//import * as BlocksWorker from "./BlocksWorker.js";

export { Base };

/**
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
   *
   * @param {number} chainedWorkerCount
   *   There will be so many workers created in chain.
   *
   * @param {string} weightsURL
   *   The URL of neural network weights. Every worker will load weights from the URL to initialize one neural network.
   */
  init( chainedWorkerCount, weightsURL ) {
    disposeWorkers();

    let message = { command: "init", remainedWorkerCount: chainedWorkerCount, weightsURL: weightsURL };

    this.worker0 = new Worker("./BlocksWorker.js");
    this.worker0.postMessage( message );
  }

  disposeWorkers() {
    if ( this.worker0 ) {
      let message = { command: "disposeWorker" };
      this.worker0.postMessage( message );
      this.worker0 = null;
    }
  }

  apply() {
  }
    
}
