export { AsyncWorker_Body as Body };

/**
 * The base class for web worker.
 *
 * It should be used in web worker context.
 *
 */
class AsyncWorker_Body {

  /** It will register callback from AsyncWorker_Proxy. */
  constructor() {
    globalThis.onmessage
      = AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy.bind( this );
  }

  /** @override */
  disposeResources() {

//!!! ...unfinished... (2022/09/08) also MessagePort.close().

    close(); // Terminate this worker.

    //super.disposeResources();
  }

  /** Handle message from AsyncWorker_Proxy. */
  static onmessage_from_AsyncWorker_Proxy( e ) {

    // e.data == { processingId, command, args }
    let processingId = e.data.processingId;
    let command = e.data.command;
    let method = this[ command ]; // command name as method name.
    let func = method.bind( this );

//!!! ...unfinished... (2022/09/10)
// Every function should be an async generator.
// Here will postMessage() the { done, value } object back to WorkerProxy.

    try {
      let p = func( e.data.args );

      // For asynchronous function, wait result and then return it.
      if ( p instanceof Promise ) {
        p.then( r => {
          if ( processingId != undefined ) {
            let resultData = { processingId: processingId, workerId: this.workerId, r };
            postMessage( resultData );
          } // Otherwise, no processingId means no need report return value.

        } ).catch( errorReason => {
          let msg = `AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy(): `
            + `workerId=${this.workerId}, processingId=${processingId}, `
            + `command="${command}", asynchronous, failed. `
            + `${errorReason}`;
          console.err( msg );
          //debugger;
        } );

      // For synchronous function, return result immediately.
      } else {
        if ( processingId != undefined ) {
          let resultData = { processingId: processingId, workerId: this.workerId, r };
          postMessage( resultData );
        } // Otherwise, no processingId means no need report return value.
      }

    } catch ( errorReason ) {
      let msg = `AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy(): `
        + `workerId=${this.workerId}, processingId=${processingId}, `
        + `command="${command}", synchronous, failed. `
        + `${errorReason}`;
      console.err( msg );
      //debugger;
    }
  }
  
}

