/**
 * @file This file is both an importable module and a main javascript file of web worker.
 *
 */

//import * as Blocks from "./Blocks.js";
export { Proxy };

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
class Proxy {

  /**
   *
   * @param {number} remainedWorkerCount
   *   There are still how many workers (not including this one) should be created in chain.
   *
   * @param {string} weightsURL
   *   The URL of neural network weights. Every worker will load weights from the URL to initialize one neural network.
   */
  init( remainedWorkerCount, weightsURL ) {
    this.disposeWorkers();

    if ( remainedWorkerCount <= 0 )
      return;  // Done. All workers in the cascde chain are created.

//     // Assume the "BlocksWorker.js" is the file name of this module file.
//     let workerURL = new URL( "BlocksWorker.js", import.meta.url );

    this.workerURL = import.meta.url;        // Assume this file is both an importable module and a main javascript file of web worker.
    this.workerOptions = { type: "module" }; // So that the worker script could use import statement.
    this.worker = new Worker( this.workerURL, this.workerOptions );

    let message = { command: "init", remainedWorkerCount: ( remainedWorkerCount - 1 ), weightsURL: weightsURL };
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
      case "init": //{ command: "init", remainedWorkerCount: remainedWorkerCount, weightsURL: weightsURL };
        globalThis.workerProxy.init( message.remainedWorkerCount - 1, message.weightsURL );
        break;

      case "disposeWorker": //{ command: "disposeWorker" };
        globalThis.workerProxy.disposeWorker( message );
        break;

    }
  }
}
