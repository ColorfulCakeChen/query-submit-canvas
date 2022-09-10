export { PromiseResolveReject };
export { PromiseResolveRejectMap };

//!!! (2022/09/10 Remarked) replaced by AsyncIterator.
//export { ProcessRelayPromises };

/**
 * Hold a processing's id, promise, resolve (fulfilling function object), reject
 * (rejecting function object).
 *
 * @member {number}   processingId The id of the processing.
 * @member {Promise}  promise      The pending promise for the processing.
 *
 * @member {function} resolve
 *   The fulfilling function object of the pending promise for the processing.
 *
 * @member {function} reject
 *   The rejecting function object of the pending promise for the processing.
 */
 class PromiseResolveReject {

  constructor( processingId ) {
    this.processingId = processingId;

    this.promise = new Promise( ( resolve, reject ) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

}

/**
 * A collection PromiseResolveReject by processingId as key.
 */
class PromiseResolveRejectMap {

  /** */
  constructor() {
    this.map = new Map();
  }

  /**
   * @param {number} processingId
   *   The numeric identifier for the processing.
   *
   * @return {PromiseResolveReject}
   *   Return the created PromiseResolveReject object.
   */
  set_new_by_processingId( processingId ) {
    let thePromiseResolveReject = new PromiseResolveReject( processingId );
    this.map.set( processingId, thePromiseResolveReject );
    return thePromiseResolveReject;
  }

  /**
   * @param {number} processingId
   *   The numeric identifier for the removing from this Map.
   *
   * @return {boolean}
   *   Return true, if processingId existed and has been removed. Return false,
   * if processingId does not exist.
   */
  remove_by_processingId( processingId ) {
    return this.map.delete( processingId );
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
  async *resulter( processingId ) {
    let thePromiseResolveReject = this.map.get( processingId );
    if ( thePromiseResolveReject )
      yield thePromiseResolveReject.promise;
    else
      return;
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

