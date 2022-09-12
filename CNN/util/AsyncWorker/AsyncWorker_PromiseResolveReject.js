export { PromiseResolveReject };
export { PromiseResolveReject_Resulter };
export { processingId_Resulter_Map };

/**
 * Hold a processing's id, promise, resolve (fulfilling function object), reject
 * (rejecting function object).
 *
 * @member {number} processingId
 *   The id of the processing.
 *
 * @member {Promise} promise
 *   The pending promise for the processing.
 *
 * @member {boolean} pending
 *   If true, the promise is still pending. If false, the promise is fulfilled.
 *
 * @member {boolean} done
 *   If true, the promise is the final promise of the processing.
 *
 * @member {Promise} promiseToYieldReturn
 *   The promise used as the yield/return of the processing's async generator
 * PromiseResolveReject_Resulter.
 * 
 */
 class PromiseResolveReject {

  /** */
  constructor( processingId ) {
    this.processingId = processingId;

    this.promise = new Promise( ( resolve, reject ) => {
      this.resolve_internal = resolve;
      this.reject_internal = reject;
    });

    this.pending = true;
    this.done = false;

    this.promiseToYieldReturn = this.promise.then( value => {
      return { done: this.done, value: value };
    } );
  }

  /** Resolve the pending promise for the processing. */
  done_value_resolve( done, value ) {
    if ( !this.bPending )
      return; // A fulfilled promise can not be changed again.
    this.done = done;
    this.resolve_internal( value );
    this.pending = fasle;
  }

  /** Reject the pending promise for the processing. */
  done_value_reject( done, value ) {
    if ( !this.bPending )
      return; // A fulfilled promise can not be changed again.
    this.done = done;
    this.reject_internal( value );
    this.pending = fasle;
  }

}


/**
 * An async generator as the consumer of the processingId's PromiseResolveRejectArray.
 *
 * @member {PromiseResolveReject[]} PromiseResolveRejectArray
 *   All promises waiting for WorkerBody's result of the processing.
 */
 class PromiseResolveReject_Resulter {

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
      throw Error( `PromiseResolveReject_Resulter.next(): `
        + `processingId=${processingId}. `
        + `PromiseResolveReject_Resulter not found in `
        + `processingId_PromiseResolveRejectArray_Map.`
      );
      return { done: true }; // No pending promise for the processing. (should not happen)
    }

    if ( resulter != this ) {
      throw Error( `PromiseResolveReject_Resulter.next(): `
        + `processingId=${processingId}. `
        + `PromiseResolveReject_Resulter in `
        + `processingId_PromiseResolveRejectArray_Map should be this.`
      );
      return { done: true };
    }

    // PromiseResolveRejectArray should never be empty. It should has at least
    // one promise for this resulter to yield/return.
    //
    if ( this.PromiseResolveRejectArray.length < 1 ) {
      throw Error( `PromiseResolveReject_Resulter.next(): `
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


/**
 * A collection PromiseResolveReject_Resulter by processingId as key.
 */
class processingId_Resulter_Map {

  /** */
  constructor() {
    this.map = new Map();
  }

  /**
   * Create a new processingId_Resulter_Map. Record it in this map by processingId
   * as key.
   *
   * This method is the initializer the processingId's PromiseResolveRejectArray.
   *
   * @param {number} processingId
   *   The numeric identifier for the processing.
   *
   * @return {AsyncGenerator}
   *   Return the created PromiseResolveReject_Resulter() object.
   */
  resulter_create_by_processingId( processingId ) {
    let resulter = new PromiseResolveReject_Resulter(
      processingId, processingId_PromiseResolveRejectArray_Map );

    this.map.set( processingId, resulter );

    let thePromiseResolveReject = new PromiseResolveReject( processingId );
    resulter.PromiseResolveRejectArray.push( thePromiseResolveReject );

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
   */
  resolve_by_processingId_done_value( processingId, done, value ) {
    let resulter = this.map.get( processingId );
    if ( !resulter )
      throw Error( `processingId_Resulter_Map.resolve_by_processingId_done_value(): `
        + `processingId=${processingId}. `
        + `The resulter does not exist.`
      );

    if ( resulter.PromiseResolveRejectArray.length <= 0 )
      throw Error( `processingId_Resulter_Map.resolve_by_processingId_done_value(): `
        + `processingId=${processingId}. `
        + `The resulter.PromiseResolveRejectArray should not be empty.`
      );

    // Always resolve the last promise. (Assume it is pending.)
    let lastArrayIndex = thePromiseResolveRejectArray.array.length - 1;
    let currentPromiseResolveReject = resulter.PromiseResolveRejectArray[ lastArrayIndex ];

    if ( !currentPromiseResolveReject.pending )
      throw Error( `processingId_Resulter_Map.resolve_by_processingId_done_value(): `
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
