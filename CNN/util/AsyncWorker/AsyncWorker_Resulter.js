export { AsyncWorker_Resulter as Resulter };

//import { PromiseResolveReject } from "./AsyncWorker_PromiseResolveReject.js";
//import { processingId_Resulter_Map } from "./AsyncWorker_processingId_Resulter_Map.js";

/**
 * An async iterator as the consumer of the processingId's
 * PromiseResolveRejectArray.
 *
 * @member {PromiseResolveReject[]} PromiseResolveRejectArray
 *   All promises waiting for WorkerBody's result of the processing.
 *
 * @member {AsyncWorker_processingId_Resulter_Map} processingId_Resulter_Map
 *   All resulters for WorkerBody's all responses.
 */
class AsyncWorker_Resulter {

  /** */
  constructor( processingId, processingId_Resulter_Map ) {
    this.processingId = processingId;
    this.PromiseResolveRejectArray = new Array();
    this.processingId_Resulter_Map = processingId_Resulter_Map;
  }

  /**
   * Note: This .next() should be called until promise resolved to
   *       { done: true }. Otherwise, this resulter will not be removed from
   *       processingId_Resulter_Map. This will result in memory not been
   *       released.
   *
   * @return {Promise}
   *   Return a promise representing the WorkerBody's result of the processing.
   * It will resolve to { done, value } or reject.
   */
  next() {
    let thePromiseResolveReject;

    do {
      // PromiseResolveRejectArray should never be empty. It should has at
      // least one promise for this resulter to yield/return.
      //
      if ( this.PromiseResolveRejectArray.length < 1 ) {
        throw Error( `AsyncWorker.Resulter.next(): `
          + `processingId=${processingId}. `
          + `PromiseResolveRejectArray should never be empty.`
        );
        return { done: true };
      }

      // 1. Always yield the first promise.
      thePromiseResolveReject = this.PromiseResolveRejectArray[ 0 ];

      // 2. If it is a pending promise, yield it.
      if ( thePromiseResolveReject.pending ) {

        // In theory, when caller received a pending promise, it should await
        // before call this .next() again. So, if the pending promise has been
        // yielded before, this .next() should not be called again.
        if ( thePromiseResolveReject.hasBeenYielded_byResulter ) {
          throw Error( `AsyncWorker.Resulter.next(): `
            + `processingId=${processingId}. `
            + `A pending PromiseResolveReject should not been yielded before.`
          );
        }
        break;
      }

      // 3. Otherwise, the promise has been fulfilled. Remove it from queue so
      //    that it will not be yielded again in the future.
      this.PromiseResolveRejectArray.shift();

    // 4. If the fulfilled promise has been returned by this resulter.next()
    //    before (i.e. It has been returned when it was still pending), try
    //    next promise so that it will not be yielded/returned duplicatedly.
    //
    } while ( thePromiseResolveReject.hasBeenYielded_byResulter );

    // 5. Mark it as been yielded.
    thePromiseResolveReject.hasBeenYielded_byResulter = true;

    // 6. Handle final promise.
    this.processingId_Resulter_Map
      .removeResulter_by_PromiseResolveReject_final( thePromiseResolveReject );

    // 7. Yield/Return the promise which will resolve to { done, value } or
    //    reject.
    return thePromiseResolveReject.promiseToYieldReturn;
  }

  /**
   * Automatically .next() until done.
   *
   * @return {Promise}
   *   Return a promise resolved to the final value (i.e. the Xxx of the
   * { done: true, value: Xxx }) of this resulter.
   */
  async untilDone() {
    let resulterNext;
    do {
      resulterNext = await this.next();
    } while ( !resulterNext.done );
    return resulterNext.value;
  }

}

