export { AsyncWorker_processingId_Resulter_Map as processingId_Resulter_Map };

import { Resulter } from "./AsyncWorker_Resulter.js";

/**
 * A collection AsyncWorker.Resulter by processingId as key.
 */
class AsyncWorker_processingId_Resulter_Map {

  /** */
  constructor() {
    this.map = new Map();
  }

  /**
   * Create a new AsyncWorker.Resulter. Record it in this map by processingId
   * as key.
   *
   * This method is the initializer the processingId's PromiseResolveRejectArray.
   *
   * @param {number} processingId
   *   The numeric identifier of the processing.
   *
   * @return {AsyncGenerator}
   *   Return the created AsyncWorker.Resulter object.
   */
  resulter_create_by_processingId( processingId ) {
    let resulter = new Resulter( processingId, this );

    let thePromiseResolveReject = new PromiseResolveReject( processingId );
    resulter.PromiseResolveRejectArray.push( thePromiseResolveReject );

    this.map.set( processingId, resulter );

    return resulter;
  }

  /**
   * Suppose every method function of WorkerProxy is an async generator.
   *
   * When WorkerProxy receives { done, value } object from WorkerBody, please call
   * this method. It will resolve the corresponding pending promise by
   * PromiseResolveReject.resolve( value ). And the,
   *
   *   - if ( done == false ), create a new PromiseResolveReject placed at the
   *       same position (i.e. replace old one) for waiting future result from
   *       web worker.
   *
   *   - if ( done == true ), remove the PromiseResolveReject of processingId from
   *       this map because the processing will have no more result coming from
   *       web worker in the future.
   *
   *
   * This method is the producer the processingId's PromiseResolveRejectArray.
   *
   *
   * @param {number} processingId
   *   The numeric identifier of the processing.
   *
   * @param {boolean} done
   *   If true, this is the final value of the processing. If false, there will be
   * more result values coming from the WorkerBody.
   *
   * @param {any} value
   *   The result value of this step of the processing.
   */
  resolve_by_processingId_done_value( processingId, done, value ) {
    let resulter = this.map.get( processingId );
    if ( !resulter )
      throw Error(
          `AsyncWorker.processingId_Resulter_Map.resolve_by_processingId_done_value(): `
        + `processingId=${processingId}. `
        + `The resulter does not exist.`
      );

    if ( resulter.PromiseResolveRejectArray.length <= 0 )
      throw Error(
          `AsyncWorker.processingId_Resulter_Map.resolve_by_processingId_done_value(): `
        + `processingId=${processingId}. `
        + `The resulter.PromiseResolveRejectArray should not be empty.`
      );

    // Always resolve the last promise. (Assume it is pending.)
    let lastArrayIndex = thePromiseResolveRejectArray.array.length - 1;
    let currentPromiseResolveReject = resulter.PromiseResolveRejectArray[ lastArrayIndex ];

    if ( !currentPromiseResolveReject.pending )
      throw Error(
          `AsyncWorker.processingId_Resulter_Map.resolve_by_processingId_done_value(): `
        + `processingId=${processingId}, lastArrayIndex=${lastArrayIndex}. `
        + `The last element of PromiseResolveRejectArray should be pending.`
      );

    // 1. Prepare next pending promise.

    // 1.1 Since web worker says the processing is done, do not create any more
    //     pending promise because the processing will have no more result coming
    //     from web worker in the future.
    if ( done ) {
      // Do nothing.

    // 1.2 The web worker says the processing is not yet completed, create a new
    //     pending promise for the same processing for waiting future result from
    //     web worker.
    } else {
      let nextPromiseResolveReject = new PromiseResolveReject( processingId );
      resulter.PromiseResolveRejectArray.push( nextPromiseResolveReject );
    }

    // 2. Resolve the current pending promise to the specified value.
    currentPromiseResolveReject.done_value_resolve( done, value );
  }

}
