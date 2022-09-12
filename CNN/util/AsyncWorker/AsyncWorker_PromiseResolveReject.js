export { PromiseResolveReject };
export { processingId_PromiseResolveRejectArray_Map };

//!!! (2022/09/10 Remarked) replaced by AsyncIterator.
//export { ProcessRelayPromises };

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
 *
 *
 * @member {PromiseResolveReject[]} array
 *   All promises for resulter to yield/return.
 *
 * @member {AsyncGenerator} resulter
 *   The result sync generator for passing result of WorkerBody to WorkerProxy's caller.
 */
class PromiseResolveRejectArray {

  /** */
  constructor( resulter ) {
    this.resulter = resulter;
    this.array = new Array();
  }

}


/**
 * A collection PromiseResolveReject[] by processingId as key.
 */
class processingId_PromiseResolveRejectArray_Map {

  /** */
  constructor() {
    this.map = new Map();
  }

  /**
   * Create a new PromiseResolveRejectArray and Resulter. Record them in this map
   * by processingId as key.
   *
   * This method is the initializer the processingId's PromiseResolveRejectArray.
   *
   * @param {number} processingId
   *   The numeric identifier for the processing.
   *
   * @return {AsyncGenerator}
   *   Return the created Resulter() object.
   */
  resulter_PromiseResolveRejectArray_create_by_processingId( processingId ) {
    let resulter = processingId_PromiseResolveRejectArray_Map.Resulter( processingId );

    thePromiseResolveRejectArray = new PromiseResolveRejectArray( resulter );
    this.map.set( processingId, thePromiseResolveRejectArray );

    let thePromiseResolveReject = new PromiseResolveReject( processingId );
    thePromiseResolveRejectArray.array.push( thePromiseResolveReject );

    return resulter;
  }

//!!! (2022/09/12 Remarked) should be done by Resulter.
//   /**
//    * Remove the processingId's result array.
//    *
//    * @param {number} processingId
//    *   The numeric identifier for the removing from this Map.
//    *
//    * @return {boolean}
//    *   Return true, if processingId existed and has been removed. Return false,
//    * if processingId does not exist.
//    */
//   PromiseResolveRejectArray_remove_by_processingId( processingId ) {
//     return this.map.delete( processingId );
//   }

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
    let thePromiseResolveRejectArray = this.map.get( processingId );
    if ( !thePromiseResolveRejectArray )
      return; // The pending promise does not exist.

    if ( thePromiseResolveRejectArray.array.length <= 0 )
      return; // The pending promise does not exist.

    // Always resolve the last promise. (Assume it is pending.)
    let thePromiseResolveReject = thePromiseResolveRejectArray.array[
      thePromiseResolveRejectArray.array.length - 1 ];

    // 1. Resolve the pending promise to the specified value.
    thePromiseResolveReject.resolve( value );

    // 2. Prepare new pending promise.
    let thePromiseResolveRejectNext = new PromiseResolveReject( processingId );
    thePromiseResolveRejectNext.done = done;

    // 2.1 The web worker says the processing is not yet completed, create a new
    //     pending promise for the same processing for waiting future result from
    //     web worker.
    if ( !done ) {
      thePromiseResolveRejectArray.push( thePromiseResolveRejectNext );

    // 2.2 Since web worker says the processing is done, do not create any more
    //     pending promise because the processing will have no more result coming
    //     from web worker in the future.
    } else {

//!!! ...unfinished... (2022/09/12)
// Perhaps, should call AsyncGenerator.return() to end the resulter?
// Problem: What if the resulter still has some promise not yet yield?
//
// If the resulter has yielded the last pending promise, call AsyncGenerator.return()
// to end the resulter. Otherwise, place the resolved promised at the end so
// the resulter could return it.
//
// Problem: How to know resulter has yielded which promise?
// Problem: The resulter how to know a promise is the final promise?

    }

//!!! (2022/09/12 Remarked) Old Codes. The delete should be done by resulter.
//     // 2. Remove or create new pending promise.
//
//     // 2.1 Since web worker says the processing is done, remove the pending promise
//     //     because the processing will have no more result coming from web worker
//     //     in the future.
//     if ( done ) {
//       this.map.delete( processingId );
//
//     // 2.2 The web worker says the processing is not yet completed, create a new
//     //     pending promise for the same processing for waiting future result from
//     //     web worker.
//     } else {
//       this.set_new_by_processingId( processingId );
//     }
  }

  /**
   * This async generator could be used as the processing method's result.
   * 
   * This async generator is the consumer of the processingId's
   * PromiseResolveRejectArray.
   *
   * @return {AsyncGenerator}
   *   An async generator. Its .next() returns a promise resolved to { done, value }.
   * The value will be:
   *
   *   - The resolved value of the processingId's PromiseResolveReject.promise, if
   *       the processingId's PromiseResolveReject exists.
   *       (i.e. { done: false, value: resolved_PromiseResolveReject.promise } )
   *
   *   - undefined, if the corresponding PromiseResolveReject does not exist.
   *       (i.e. { done: true, value: undefined } )
   *
   */
  async *Resulter( processingId ) {
    let thePromiseResolveRejectArray = this.map.get( processingId );
    if ( !thePromiseResolveRejectArray )
      return; // No pending promise for the processing. (should not happen)

    try {

      while ( thePromiseResolveRejectArray.length >= 1 ) {

        // Always yield the first promise.
        let thePromiseResolveReject = thePromiseResolveRejectArray[ 0 ];

        // 1. Advance to next promise.

        // 1.1 If the promise has been fulfilled, remove it so that it will not be
        //     yielded again in the future.
        if ( !thePromiseResolveReject.pending ) {
          thePromiseResolveRejectArray.shift();

        // 1.2 Otherwise, the first pending promise will be yielded again and again
        //     (until it has been fulfilled).
        }

        // 2. Yield or return the promise.

        // 2.1 If this is the final promise, return it (and end this resulter).
        if ( thePromiseResolveReject.done ) {
          return thePromiseResolveReject.promise;

        // 2.2 Otherwise, yield the promise.
        //
        // Note: If this yielded pending promise become done in the later, the
        //       resolve_by_processingId_done_value() will focibly terminate
        //       this resulter by calling resulter.return().
        } else {
          yield thePromiseResolveReject.promise;
        }
      }

      // 3. In theory, never executed here. (i.e. thePromiseResolveRejectArray should
      //    never be empty. It should has at least one promise for this resulter to
      //    yield/return.)
      throw Error( `processingId_PromiseResolveRejectArray_Map.Resulter(): `
        + `processingId=${processingId}. `
        + `PromiseResolveRejectArray should never be empty.`
      );

    } finally {
      // When this resulter return (no matter by here or by outter calling .return()),
      // it means no more pending promise for the processing. So remove the
      // PromiseResolveRejectArray of the processing.
      this.map.delete( processingId );
    }

  }

}


//!!! (2022/09/10 Remarked) replaced by AsyncIterator.
// /**
//  * Hold two PromiseResolveReject.
//  *
//  * @member {PromiseResolveReject} process
//  *   The promise for reporting worker's function execution done.
//  *
//  * @member {PromiseResolveReject} relay
//  *   The promise for reporting scaledSourceImageData received from this web worker.
//  */
// class ProcessRelayPromises {
//
//   constructor( processingId, workerId ) {
//     this.process = new PromiseResolveReject( processingId, workerId );
//     this.relay = new PromiseResolveReject( processingId, workerId );
//   }
//
// }

