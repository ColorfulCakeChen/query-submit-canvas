//import * as TwinsWorker from "./TwinsWorker.js";

export { Base };

/**
 * Many workers cascade in chain. When apply() is called, the input (usually a large memory block) will be transffered to the 1st worker to start
 * computing, and then transffered to the 2nd worker to start computing, ... etc.
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
   */
  init( chainedWorkerCount ) {
    this.worker0 = new Worker("./BlocksWorker.js");
    this.worker1 = new Worker("./TwinsWorker.js");
    this.workers = [ this.worker0, this.worker1 ];
  }

  disposeTensors() {
    if ( this.workers ) {
      for ( let i = 0; i < this.workers.length; ++i ) {
        let worker = this.workers[ i ];
        worker.postMessage( ??? );
      }
      this.workers = null;
    }
  }

}
