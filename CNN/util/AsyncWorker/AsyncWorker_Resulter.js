export { AsyncWorker_Resulter as Resulter };

//import { PromiseResolveReject } from "./AsyncWorker_PromiseResolveReject.js";
//import { processingId_PromiseResolveRejectArray_Map }
//  from "./AsyncWorker_PromiseResolveReject.js";

/**
 * An async generator as the consumer of the processingId's PromiseResolveRejectArray.
 *
 * @member {PromiseResolveReject[]} PromiseResolveRejectArray
 *   All promises waiting for WorkerBody's result of the processing.
 */
 class AsyncWorker_Resulter {

  /** */
  constructor( processingId, processingId_PromiseResolveRejectArray_Map ) {
    this.processingId = processingId;
    this.PromiseResolveRejectArray = new Array();
    this.processingId_PromiseResolveRejectArray_Map
      = processingId_PromiseResolveRejectArray_Map;
  }

  /**
   * Note: This .next() should be called until promise resolved to { done: true }.
   *       Otherwise, this resulter will not be removed from
   *       processingId_PromiseResolveRejectArray_Map. This will result in memory
   *       not been released.
   *
   * @return {Promise}
   *   Return a promise resolved to { done, value } which represents the WorkerBody's
   * result of the processing.
   */
  next() {
    let resulter
      = this.processingId_PromiseResolveRejectArray_Map.map.get( this.processingId );
    if ( !resulter ) {
      throw Error( `AsyncWorker_Resulter.next(): `
        + `processingId=${processingId}. `
        + `AsyncWorker_Resulter not found in `
        + `processingId_PromiseResolveRejectArray_Map.`
      );
      return { done: true }; // No pending promise for the processing. (should not happen)
    }

    if ( resulter != this ) {
      throw Error( `AsyncWorker_Resulter.next(): `
        + `processingId=${processingId}. `
        + `AsyncWorker_Resulter in `
        + `processingId_PromiseResolveRejectArray_Map should be this.`
      );
      return { done: true };
    }

    // PromiseResolveRejectArray should never be empty. It should has at least
    // one promise for this resulter to yield/return.
    //
    if ( this.PromiseResolveRejectArray.length < 1 ) {
      throw Error( `AsyncWorker_Resulter.next(): `
        + `processingId=${processingId}. `
        + `PromiseResolveRejectArray should never be empty.`
      );
      return { done: true };
    }

    // 0. Always yield the first promise.
    let thePromiseResolveReject = this.PromiseResolveRejectArray[ 0 ];

    // 1. Prepare the next promise.

    // 1.1 The first pending promise will be yielded again and again
    //     (until it has been fulfilled and handled by here).
    if ( thePromiseResolveReject.pending ) {
      // Do nothing.

    // 1.2 Otherwise, the promise has been fulfilled. Remove it so that it will not
    //     be yielded again in the future.
    } else {
      this.PromiseResolveRejectArray.shift();

      // 2. Handle final promise.
      //
      // If the promise is done (so it is also not pending), it means no more result
      // will be received from the WorkerBody. So remove the entire result queue
      // (i.e. PromiseResolveRejectArray) of the processing.
      if ( thePromiseResolveReject.done ) {
        this.map.delete( this.processingId );
      }
    }

    // 3. Yield/Return the promise which will resolve to { done, value }.
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

