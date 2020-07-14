
class BlocksWorker {

  /**
   *
   * @param {number} remainedWorkerCount
   *   There are still how many workers (not including this one) should be created in chain.
   *
   * @param {string} weightsURL
   *   The URL of neural network weights. Every worker will load weights from the URL to initialize one neural network.
   */
  init( remainedWorkerCount, weightsURL ) {
    if ( remainedWorkerCount > 0 ) {
      let message = { command: "init", remainedWorkerCount: remainedWorkerCount, weightsURL: weightsURL };
      this.nextWorker = new Worker("./BlocksWorker.js");
      this.nextWorker.postMessage( message );
    }
  }

  disposeWorker( message ) {
    if ( this.nextWorker ) {
      let message = { command: "disposeWorker" };
      this.nextWorker.postMessage( message );
    }
  }

}


if ( self.document ) {
  // In main document context (Not in worker context). Do nothing.

} else {
  // In worker context. Create neural network. Register message handler.

  globalThis.theWorker = new BlocksWorker();

  globalThis.onmessage = function( e ) {
    let message = e.data;

    switch ( message.command ) {
      case "init": //{ command: "init", remainedWorkerCount: remainedWorkerCount, weightsURL: weightsURL };
        globalThis.theWorker.init( message.remainedWorkerCount - 1, message.weightsURL );
        break;

      case "disposeWorker": //{ command: "disposeWorker" };
        globalThis.theWorker.disposeWorker( message );
        break;

    }
  }
}
