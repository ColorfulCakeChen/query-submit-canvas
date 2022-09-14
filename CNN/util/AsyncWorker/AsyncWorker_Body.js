export { AsyncWorker_Body as Body };

/**
 * The base class for web worker. It should be used in web worker context.
 *
 * Its methods (which could be called by AsyncWorker_Proxy) should all be
 * async generator (so that they could be handled by onmessage_from_AsyncWorker_Proxy()
 * automatically). The is the reason why its class name is called "Async".
 *
 */
class AsyncWorker_Body {

  /** It will register callback from AsyncWorker_Proxy. */
  constructor() {
    globalThis.onmessage
      = AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy.bind( this );

    // Process all messages received before this AsyncWorker_Body object created.
    setTimeout( 
      this.globalThis_temporaryMessageQueue_processMessages.bind( this ),
      0
    );
  }

  /** Close this worker. */
  async* disposeResources() {
    close(); // Terminate this worker.
    //yield *super.disposeResources();
  }

  /**
   * This method should be called immediately after this AsyncWorker_Body's
   * sub-class' instance created. So that no messages are lost.
   *
   * Note: the AsyncWorker_Body_temporaryMessageQueue is created by
   *       AsyncWorker_Proxy.create_WorkerBodyStub_Codes_DataURI()
   *       for receiving all messages before this AsyncWorker_Body object
   *       created completely.
   */
  globalThis_temporaryMessageQueue_processMessages() {
    let temporaryMessageQueue = globalThis.AsyncWorker_Body_temporaryMessageQueue;
    if ( !temporaryMessageQueue )
      return;

    // To prevent this method be re-entranced (because
    // AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy will also call this
    // method), remove the temporary message queue.
    //
    delete globalThis.AsyncWorker_Body_temporaryMessageQueue;

    while ( temporaryMessageQueue.length > 0 ) {
      let e = temporaryMessageQueue.shift();
      AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy.call( this, e );
    }
  }

  /**
   * Handle message from AsyncWorker_Proxy.
   *
   *
   * @param {AsyncWorker_Body} this
   *   The object which has the method function specified by e.data.command.
   *
   * @param {MessageEvent} e
   *   - e.data.processingId is the request sequence id.
   *
   *   - e.data.command will be used as this object's method name. The method must
   *       be an async generator.
   *       - The method should yield and return an object { value, transfer }.
   *       - The value is the real result of the function.
   *       - The tansfer is the transferable object array when postMessage. It
   *           could be undefined (but can not be null).
   *
   *   - e.data.args will be passed to the function this[ e.data.command ]().
   */
  static async onmessage_from_AsyncWorker_Proxy( e ) {

    // Ensure all messages in temporary message queue are handled first
    // because they are received before this message handler being setup.
    //
    // Note: Although AsyncWorker_Body constructor has schedule a timer to
    //       do this, some messages may be received before the timer
    //       executed (but after this message handler has been setup). So,
    //       here needs check the temporary message queue again.
    //
    this.globalThis_temporaryMessageQueue_processMessages();

    // e.data == [ processingId, command, ...args ]
    let [ processingId, command, ...args ] = e.data;

    try {
      // 1. Start the command (asynchronously).
      let method = this[ command ]; // command name as method name.
      let func = method.bind( this );
      let asyncGenerator = func( ...args );

      // 2. Execute the command (asynchronously).

      // 2.1 If no processingId, it means no need to report return value.
      if ( processingId == undefined ) {
        for await ( let { value, transferableObjectArray } of asyncGenerator ) {
          // Do nothing. Just complete the async generator.
        }

      // 2.2 Otherwise, post every step's result back to WorkerProxy.
      } else { 
        let done, value;
        let transferableObjectArray;
        do {
          ( { done, value: { value, transferableObjectArray } }
            = await asyncGenerator.next() );
          let resultData = [ processingId, done, value ];
          postMessage( resultData, transferableObjectArray );
        } while ( !done );
      }

    } catch ( errorReason ) {
      let msg = `AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy(): `
        + `processingId=${processingId}, `
        + `command="${command}", failed.\n`
        + `${errorReason}`;
      console.error( msg );
      //debugger;

      // When failure, it still need post back failure message. Otherwise,
      // WorkerProxy will be blocked (because it still await the result).
      //
      let done = undefined; // means "reject". (i.e. neither false nor true).
      let value = msg;
      let resultData = [ processingId, done, value ];
      postMessage( resultData );
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
//           console.error( msg );
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
//       console.error( msg );
//       //debugger;
//     }
  }
  
}

