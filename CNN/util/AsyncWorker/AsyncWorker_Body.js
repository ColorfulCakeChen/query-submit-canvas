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

  /** Handle message from AsyncWorker_Proxy.
   * It will 
   *
   * @param {AsyncWorker_Body} this
   *   The object which has the method function specified by e.data.command.
   *
   * @param {MessageEvent} e
   *   - e.data.processingId is the request sequence id.
   *
   *   - e.data.command will be used as this object's method name. The method must
   *       be an async generator.
   *
   *   - e.data.args will be passed to the function this[ e.data.command ]().
   */
  static async onmessage_from_AsyncWorker_Proxy( e ) {

    // e.data == { processingId, command, args }
    let processingId = e.data.processingId;
    let command = e.data.command;
    let method = this[ command ]; // command name as method name.
    let func = method.bind( this );

//!!! ...unfinished... (2022/09/10)
// Every function should be an async generator.
// Here will postMessage() the { done, value } object back to WorkerProxy.

    try {
      let asyncGenerator = func( e.data.args );

      if ( processingId != undefined ) {
        let done_value;
        do {
          done_value = await asyncGenerator.next();
            let resultData = { processingId: processingId, done_value };

  //!!! ...unfinished... (2022/09/10)
  // How to specify Transferable Objects array?

            postMessage( resultData );

        } while ( !done_value.done );

      } else { // Otherwise, no processingId means no need report return value.
        for await ( let value of asyncGenerator ) {
          // Do nothing. Just complete the async generator.
        }
      }

    } catch ( errorReason ) {
      let msg = `AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy(): `
        + `processingId=${processingId}, `
        + `command="${command}", failed. `
        + `${errorReason}`;
      console.err( msg );
      //debugger;
    }


// //!!! (2022/09/10 Remarked) Every function should be an async generator..
//     try {
//       let p = func( e.data.args );
//
//       // For asynchronous function, wait result and then return it.
//       if ( p instanceof Promise ) {
//         p.then( r => {
//           if ( processingId != undefined ) {
//             let resultData = { processingId: processingId, workerId: this.workerId, r };
//             postMessage( resultData );
//           } // Otherwise, no processingId means no need report return value.
//
//         } ).catch( errorReason => {
//           let msg = `AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy(): `
//             + `workerId=${this.workerId}, processingId=${processingId}, `
//             + `command="${command}", asynchronous, failed. `
//             + `${errorReason}`;
//           console.err( msg );
//           //debugger;
//         } );
//
//       // For synchronous function, return result immediately.
//       } else {
//         if ( processingId != undefined ) {
//           let resultData = { processingId: processingId, workerId: this.workerId, r };
//           postMessage( resultData );
//         } // Otherwise, no processingId means no need report return value.
//       }
//
//     } catch ( errorReason ) {
//       let msg = `AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy(): `
//         + `workerId=${this.workerId}, processingId=${processingId}, `
//         + `command="${command}", synchronous, failed. `
//         + `${errorReason}`;
//       console.err( msg );
//       //debugger;
//     }
  }
  
}

