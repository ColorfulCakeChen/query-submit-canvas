export { AsyncWorker_PromiseResolveReject as PromiseResolveReject };

/**
 * Hold a processing's id, promise, resolve (fulfilling function object), reject
 * (rejecting function object).
 *
 * @member {number} processingId
 *   The numeric identifier of the processing.
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
 * AsyncWorker.Resulter.
 * 
 */
 class AsyncWorker_PromiseResolveReject {

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
    if ( !this.pending )
      return; // A fulfilled promise can not be changed again.
    this.pending = false;
    this.done = done;
    this.resolve_internal( value );
  }

  /** Reject the pending promise for the processing. */
  done_value_reject( done, value ) {
    if ( !this.pending )
      return; // A fulfilled promise can not be changed again.
    this.pending = false;
    this.done = done;
    this.reject_internal( value );
  }

}

