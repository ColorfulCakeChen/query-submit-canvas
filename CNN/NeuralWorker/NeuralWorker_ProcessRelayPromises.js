export { PromiseResolveReject };
export { ProcessRelayPromises };

/**
 * Hold a processing's id, promise, resolve (fulfilling function object), reject
 * (rejecting function object).
 *
 * @member {number}   processingId The id of the processing.
 * @member {number}   workerId     The array index of the worker owns this processing.
 * @member {Promise}  promise      The pending promise for the processing.
 *
 * @member {function} resolve
 *   The fulfilling function object of the pending promise for the processing.
 *
 * @member {function} reject
 *   The rejecting function object of the pending promise for the processing.
 */
 class PromiseResolveReject {

  constructor( processingId, workerId ) {
    this.processingId = processingId;
    this.workerId = workerId;

    this.promise = new Promise( ( resolve, reject ) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

}

/**
 * Hold two PromiseResolveReject.
 *
 * @member {PromiseResolveReject} process
 *   The promise for reporting worker's function execution done.
 *
 * @member {PromiseResolveReject} relay
 *   The promise for reporting scaledSourceImageData received from this web worker.
 */
class ProcessRelayPromises {

  constructor( processingId, workerId ) {
    this.process = new PromiseResolveReject( processingId, workerId );
    this.relay = new PromiseResolveReject( processingId, workerId );
  }

}

