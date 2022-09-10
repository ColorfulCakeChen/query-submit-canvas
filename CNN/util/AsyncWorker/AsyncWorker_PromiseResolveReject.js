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
   * 
   */
  resolve_by_processingId_done_value( processingId, done, value ) {

//!!! ...unfinished... (2022/09/10)
// Every WorkerProxy method function should be an async generator.
//
// Here should receive { done, value } object from WorkerBody.
// The corresponding PromiseResolveReject.resolve() to the value.
//
//   - if ( done == false ), create a new PromiseResolveReject placed at the
//       smae position (i.e. replace old one) for waiting future result.
//
//   - if ( done == true ), delete the entry of processingId from PromiseResolveRejectMap.
//       because there will be no more result coming in the future.
// 
//

    let thePromiseResolveReject = this.map.get( processingId );
    if ( !thePromiseResolveReject )
      return; // The pending promise does not exist.

    // 1. Resolve the pending promise to the specified value.
    thePromiseResolveReject.resolve( value );

    // 2. Remove or create new pending promise.

    // 2.1 Since web worker says the processing is done, remove the pending promise
    //     because the processing will have no more result coming from web worker
    //      in the future.
    if ( done ) {
      this.map.delete( processingId );

    // 2.2 The web worker says the processing is not yet completed, create a new
    //     pending promise and place it at the smae position (i.e. replace old one)
    //     for waiting future result.
    } else {
      this.set_new_by_processingId( processingId );
    }
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

