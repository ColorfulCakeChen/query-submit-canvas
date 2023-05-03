export { AsyncWorker_processingId_Resulter_Map as processingId_Resulter_Map };

import { Resulter } from "./AsyncWorker_Resulter.js";
import { PromiseResolveReject } from "./AsyncWorker_PromiseResolveReject.js";

/**
 * A collection of AsyncWorker.Resulter by processingId as key.
 */
class AsyncWorker_processingId_Resulter_Map {

  /** */
  constructor() {
    this.map = new Map();
  }

  get size() {
    return this.map.size;
  }

  /** */
  clear() {
    this.map.clear();
  }

  /**
   * Create a new AsyncWorker.Resulter. Record it in this map by processingId
   * as key.
   *
   * This method is the initializer the processingId's
   * PromiseResolveRejectArray.
   *
   * @param {number} processingId
   *   The numeric identifier of the processing.
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async iterator for receving result from WorkerBody of the
   * processing.
   */
  createResulter_by_processingId( processingId ) {
    let resulter = new Resulter( processingId, this );

    let thePromiseResolveReject = new PromiseResolveReject( processingId );
    resulter.PromiseResolveRejectArray.push( thePromiseResolveReject );

    this.map.set( processingId, resulter );

    return resulter;
  }

  /**
   * 
   * If the (not pending (i.e. fulfilled)) promise was resolved to
   * ( done == true ) or rejected, there will be no more result received from
   * the WorkerBody in the future. So remove the resulter and its entire result
   * queue (i.e. PromiseResolveRejectArray) of the processing.
   *
   *
   * Note: Both the following two codes handle resulter removing (according to
   *       which one happen last):
   *   - AsyncWorker_Resulter.next()
   *   - AsyncWorker_processingId_Resulter_Map
   *       .resolve_or_reject_by_processingId_done_value()
   *
   * @param {AsyncWork_PromiseResolveReject} aPromiseResolveReject 
   *   The promise to be removed. Only if it is final and has been yielded, it
   * will be removed. Otherwise, do nothing.
   */
  removeResulter_by_PromiseResolveReject_final( aPromiseResolveReject ) {
    if (   ( aPromiseResolveReject.final )
        && ( aPromiseResolveReject.hasBeenYielded_byResulter )
       ) {
      this.map.delete( aPromiseResolveReject.processingId );
    }
  }

  /**
   * @param {number} processingId
   *   The numeric identifier of the processing.
   *
   * @return {AsyncWorker_Resulter}
   *   Return the resulter of the processing.
   */
  getResulter_by_processingId( processingId ) {
    let resulter = this.map.get( processingId );
    return resulter;
  }

  /**
   * Suppose every method function of WorkerProxy is an async generator.
   *
   * When WorkerProxy receives [ processingId, done, value ] object from
   * WorkerBody, please call this method. It will resolve or reject the
   * corresponding pending promise.
   *
   *   - if ( done == undefind ), reject the pending PromiseResolveReject.
   *
   *   - if ( done == true ), resolve the pending PromiseResolveReject.
   *
   *   - if ( done == false ), resolve the pending PromiseResolveReject. And
   *       append a new pending PromiseResolveReject for waiting future result
   *       from WorkerBody.
   *
   * This method is the producer for the processingId's
   * PromiseResolveRejectArray.
   *
   *
   * @param {number} processingId
   *   The numeric identifier of the processing.
   *
   * @param {boolean} done
   *   If true, this is the final value of the processing. If false, there will
   * be more result values coming from the WorkerBody. If undfined, the
   * WorkerBody is failed to execute the processing.
   *
   * @param {any} value
   *   The result value of this step of the processing. If
   * ( done == undefined ), this value represents errorReason (of rejecting).
   * Otherwise, it is the value of resolving.
   */
  resolve_or_reject_by_processingId_done_value( processingId, done, value ) {
    let resulter = this.getResulter_by_processingId( processingId );
    if ( !resulter )
      throw Error( `AsyncWorker.processingId_Resulter_Map.`
        + `resolve_by_processingId_done_value(): `
        + `processingId=${processingId}. `
        + `The resulter does not exist.`
      );

    if ( resulter.PromiseResolveRejectArray.length <= 0 )
      throw Error( `AsyncWorker.processingId_Resulter_Map.`
        + `resolve_by_processingId_done_value(): `
        + `processingId=${processingId}. `
        + `The resulter.PromiseResolveRejectArray should not be empty.`
      );

    // Always resolve the last promise. (Assume it is pending.)
    let lastArrayIndex = resulter.PromiseResolveRejectArray.length - 1;
    let currentPromiseResolveReject
      = resulter.PromiseResolveRejectArray[ lastArrayIndex ];

    if ( !currentPromiseResolveReject.pending )
      throw Error( `AsyncWorker.processingId_Resulter_Map.`
        + `resolve_by_processingId_done_value(): `
        + `processingId=${processingId}, lastArrayIndex=${lastArrayIndex}. `
        + `The last element of PromiseResolveRejectArray should be pending.`
      );

    // 1. If the done is undefined, it means "reject". (i.e. neither false nor
    //    true).
    if ( done == undefined ) {

      // 1.1 Reject the current pending promise to the errorReason.
      //     (In this case, the value represents errorReason.)
      currentPromiseResolveReject.errorReason_reject( value );

    // 2. Otherwise, it is a regular result message (i.e. either false (not
    //    done) or true (done)).
    } else {

      // 2.1 Prepare next pending promise.

      // 2.1.1 Since web worker says the processing is done, do not create any
      //       more pending promise because the processing will have no more
      //       result coming from web worker in the future.
      if ( done ) {
        // Do nothing.

      // 2.1.2 The web worker says the processing is not yet completed, create
      //       a new pending promise for the same processing for waiting future
      //       result from web worker.
      } else {
        let nextPromiseResolveReject = new PromiseResolveReject( processingId );
        resulter.PromiseResolveRejectArray.push( nextPromiseResolveReject );
      }

      // 2.2 Resolve the current pending promise to the specified value.
      currentPromiseResolveReject.done_value_resolve( done, value );
    }

    // 3. Handle final promise.
    this.removeResulter_by_PromiseResolveReject_final(
      currentPromiseResolveReject );
  }

  /**
   * Reject all pending PromiseResolveReject.
   *
   * This is usually used when an AsyncWorker will be terminated forcibly.
   * Rejecting these pending promises could avoid these promises' awaiters be
   * blocked forever.
   *
   * @param {any} errorReason 
   *   The information of the rejecting.
   */
  reject_all_pending_by_errorReason( errorReason ) {
    for ( let resulter of this.map.values() ) {
      if ( resulter.PromiseResolveRejectArray.length <= 0 )
        continue; // No promised could be rejected. (should not happen)

      // Always reject the last promise, because it is the only one promise
      // which is possible still pending.
      let lastArrayIndex = resulter.PromiseResolveRejectArray.length - 1;
      let currentPromiseResolveReject
        = resulter.PromiseResolveRejectArray[ lastArrayIndex ];

      if ( !currentPromiseResolveReject.pending )
        continue; // A fulfilled promised can not be rejected.

      // Reject the current pending promise to the errorReason.
      currentPromiseResolveReject.errorReason_reject( errorReason );

      // Handle final promise.
      this.removeResulter_by_PromiseResolveReject_final(
        currentPromiseResolveReject );
    }
  }

}
