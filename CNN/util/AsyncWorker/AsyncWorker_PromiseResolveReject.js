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
 *   - If undefined, the promise is rejected.
 *   - If false, the promise is resolved to ( done == false ) or pending.
 *   - If true, the promise is resolved to ( done == true ).
 *
 * @member {boolean} final
 *   If true, the promise is the final promise of the processing. (i.e. fulfilled.
 * either resolved ( done == true ) or rejected ( done == undefind ).)
 *
 * @member {Promise} promiseToYieldReturn
 *   The promise used as the yield/return of the processing's async iterator
 * AsyncWorker.Resulter.
 *
 * @member {boolean} hasBeenYielded_byResulter
 *   If true, the promiseToYieldReturn has been yielded by Resulter.next().
 */
 class AsyncWorker_PromiseResolveReject {

  /** */
  constructor( processingId ) {
    this.processingId = processingId;

    this.promise = new Promise( ( resolve, reject ) => {
      this.resolve_internal = resolve;
      this.reject_internal = reject;
    });

    // Note: It is also possible to use Promise.race() to detect the status
    //       of a promise (without this .pending flag).
    this.pending = true;
    this.done = false;

    this.promiseToYieldReturn = this.promise.then( value => {
      return { done: this.done, value: value };
    } );

    this.hasBeenYielded_byResulter = false;
  }

  /** Resolve the pending promise for the processing. */
  done_value_resolve( done, value ) {
    if ( !this.pending )
      return; // A fulfilled promise can not be changed again.
    this.pending = false;
    this.done = done;
    this.value = value;
    this.resolve_internal( value );
  }

  /** Reject the pending promise for the processing. */
  errorReason_reject( errorReason ) {
    if ( !this.pending )
      return; // A fulfilled promise can not be changed again.
    this.pending = false;
    this.done = undefined; // means "reject". (i.e. neither false nor true).
    this.errorReason = errorReason;
    this.reject_internal( errorReason );
  }

  get final() {
    if ( this.pending )
      return false;  // i.e.  not fulfilled.
    if ( this.done ) // i.e. resolved to true.
      return true;
    if ( this.done == undefined ) // i.e. rejected
      return true;
    return false; // i.e. resolved to false, or not fulfilled.
  }

}

