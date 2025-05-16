export { AsyncWorker_Body as Body };

import * as Pool from "../Pool.js";
import * as AsyncWorker_Checker from "./AsyncWorker_Checker.js";

/**
 * The base class for web worker. It should be used in web worker context.
 *
 * Its methods (which could be called by AsyncWorker_Proxy by postMessage)
 * should all be async generator (so that they could be handled by
 * AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy() automatically). This
 * is the reason why its class name is called "Async".
 *
 */
class AsyncWorker_Body {

  /**
   * It will register callback for handling messages sent from
   * AsyncWorker_Proxy.
   */
  constructor() {
    globalThis.onmessage
      = AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy.bind( this );

    // Process all messages which are received before this AsyncWorker_Body
    // object created.
    setTimeout( 
      this.globalThis_temporaryMessageQueue_processMessages.bind( this ),
      0
    );

    this.pool_all_issuedCount_before = Pool.All.issuedCount;
  }

  /** Close this worker. */
  async* disposeResources() {

    // Detect whether memory leak.
    try {
      Pool.Asserter.assert_Pool_issuedCount(
        "AsyncWorker_Body.disposeResources()", this.pool_all_issuedCount_before );
    } catch ( e ) {
      console.error( e );
      //debugger;
    }

    close(); // Terminate this worker.
    //yield *super.disposeResources();
  }

  /**
   * This method should be called immediately after this AsyncWorker_Body's
   * sub-class' instance created (currently, this is done by being scheduled
   * immediately in this AsyncWorker_Body's constructor). So that no messages
   * are lost.
   *
   * Note: The AsyncWorker_Body_temporaryMessageQueue is created by
   *       AsyncWorker_BodyStub.js for receiving all messages before this
   *       instance of (sub-class of) AsyncWorker_Body created completely.
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
   * Handle messages from AsyncWorker_Proxy.
   *
   *
   * @param {AsyncWorker_Body} this
   *   The object which has the method function specified by e.data.command.
   *
   * @param {MessageEvent} e
   *   The e.data will be parsed as [ processingId, command, ...args ].
   *
   *   - processingId is the request sequence id for sending back result. If
   *       it is undefined, there will be no result sent back to WorkerProxy
   *       for the method function call.
   *
   *   - command will be used as this object's method name. The method must
   *       be an async generator.
   *       - The method should yield and return an object
   *           { value, transferableObjectArray }.
   *       - The value is the real result of the function.
   *       - The transferableObjectArray is the transferable object array when
   *           postMessage back to WorkerProxy. It could be undefined (but can
   *           not be null).
   *
   *   - args will be passed to the function this[ command ]().
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

          // Check large objects are transferred (rather than copied) to
          // ensure performance.
          {
            let bTransferred = AsyncWorker_Checker
              .ImageData_ArrayBuffer_TypedArray_isTransferred( value );

            if ( !bTransferred )
              throw Error( `AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy(): `
                + `bTransferred ( ${bTransferred} ) should be ( true ) `
                + `after value transferred to worker. `
                + `value=[ ${value} ]`
              );
          }

        } while ( !done );
      }

    } catch ( errorReason ) {
      let msg = `AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy(): `
        + `processingId=${processingId}, `
        + `command="${command}", failed. `
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
  }

  /**
   * A helper function for looping an async generator until done.
   *
   * @return {Promise}
   *   Return a promise resolved as the final (i.e. ( done == true ) ) value
   * of the asyn generator.
   */
  static async asyncGenerator_loopUntilDone_asyncPromise( asyncGenerator ) {
    let asyncGeneratorNext;
    do {
      asyncGeneratorNext = await asyncGenerator.next();
    } while ( !asyncGeneratorNext.done );

    let resultValue = asyncGeneratorNext.value;
    return resultValue;
  }

}

