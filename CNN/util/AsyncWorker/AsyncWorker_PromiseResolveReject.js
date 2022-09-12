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
 * @member {boolean} bPending
 *   If true, the promise is still pending. If false, the promise is fulfilled.
 * 
 * @member {Promise} promise
 *   The pending promise for the processing.
 *
 */
 class PromiseResolveReject {

  constructor( processingId ) {
    this.processingId = processingId;
    this.bPending = true;

    this.promise = new Promise( ( resolve, reject ) => {
      this.resolve_internal = resolve;
      this.reject_internal = reject;
    });
  }

  /** Resolve the pending promise for the processing. */
  resolve( value ) {
    if ( !this.bPending )
      return; // A fulfilled promise can not be changed again.
    this.resolve_internal( value );
    this.bPending = fasle;
  }

  /** Reject the pending promise for the processing. */
  reject( value ) {
    if ( !this.bPending )
      return; // A fulfilled promise can not be changed again.
    this.reject_internal( value );
    this.bPending = fasle;
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
   * Create a new PromiseResolveRejectArray and Resulter. Record them in map by
   * processingId as key.
   *
   * @param {number} processingId
   *   The numeric identifier for the processing.
   *
   * @return {AsyncGenerator}
   *   Return the created Resulter() object.
   */
  resulter_create_by_processingId( processingId ) {
    let resulter = processingId_PromiseResolveRejectArray_Map.Resulter( processingId );

    thePromiseResolveRejectArray = new PromiseResolveRejectArray( resulter );
    this.map.set( processingId, thePromiseResolveRejectArray );

    thePromiseResolveRejectArray

    let thePromiseResolveRejectArray = this.map.get( processingId );
    if ( !thePromiseResolveRejectArray ) {
    }

    let thePromiseResolveReject = new PromiseResolveReject( processingId );
    thePromiseResolveRejectArray.array.push( thePromiseResolveReject );

    return thePromiseResolveReject;
  }

  /**
   * Remove the processingId's result array.
   *
   * @param {number} processingId
   *   The numeric identifier for the removing from this Map.
   *
   * @return {boolean}
   *   Return true, if processingId existed and has been removed. Return false,
   * if processingId does not exist.
   */
  PromiseResolveRejectArray_remove_by_processingId( processingId ) {
    return this.map.delete( processingId );
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
   */
  resolve_by_processingId_done_value( processingId, done, value ) {
    let thePromiseResolveRejectArray = this.map.get( processingId );
    if ( !thePromiseResolveRejectArray )
      return; // The pending promise does not exist.

    if ( thePromiseResolveRejectArray.length <= 0 )
      return; // The pending promise does not exist.

    // Always resolve the last promise. (Assume it is pending.)
    let thePromiseResolveReject
      = thePromiseResolveRejectArray[ thePromiseResolveRejectArray.length - 1 ];

    // 1. Resolve the pending promise to the specified value.
    thePromiseResolveReject.resolve( value );

    // 2. Prepare new pending promise.

    // 2.1 The web worker says the processing is not yet completed, create a new
    //     pending promise for the same processing for waiting future result from
    //     web worker.
    if ( !done ) {
      let thePromiseResolveRejectNext = new PromiseResolveReject( processingId );
      thePromiseResolveRejectArray.push( thePromiseResolveRejectNext );

    // 2.2 Since web worker says the processing is done, do not create any more
    //     pending promise because the processing will have no more result coming
    //     from web worker in the future.
    } else {

//!!! ...unfinished... (2022/09/12)
// Perhaps, should call AsyncGenerator.return() to end the result?
// Problem: What if the resulter still has some promise not yet yield?

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

    try {

      let thePromiseResolveRejectArray = this.map.get( processingId );
      if ( !thePromiseResolveRejectArray )
        return; // No pending promise for the processing.

      if ( thePromiseResolveRejectArray.length <= 0 ) {
        // No more pending promise for the processing.
        this.map.delete( processingId );
        return;
      }

  //!!! ...unfinished... (2022/09/12)
      // Always yield/return the first promise.
      let thePromiseResolveReject = thePromiseResolveRejectArray[ 0 ];
      if ( thePromiseResolveReject.bPending ) {

      } else {

      }

      let thePromiseResolveReject = this.map.get( processingId );
      if ( thePromiseResolveReject )
        yield thePromiseResolveReject.promise;
      else
        return;

    } finally {
      // When this resulter return, it means all no more pending promise for the
      // processing. So remove the PromiseResolveRejectArray of the processing.
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

