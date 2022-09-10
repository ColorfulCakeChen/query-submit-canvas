export { PromiseResolveReject };
export { PromiseResolveRejectMap };
export { ProcessRelayPromises };

// import * as Pool from "../util/Pool.js";
// import * as Recyclable from "../util/Recyclable.js";

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

//!!! ...unfinished... (2022/09/10)
/**
 * A collection PromiseResolveReject by processingid as key.
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
   * @param {number} workerId
   *   The numeric identifier for the web worker of the processing.
   *
   * @return {PromiseResolveReject}
   *   Return the created PromiseResolveReject object.
   */
  add_by_processingId( processingId, workerId ) {
    let thePromiseResolveReject = new PromiseResolveReject( processingId, workerId );
    this.map.set( processingId, thePromiseResolveReject );
    return thePromiseResolveReject;
  }

  /** */
  async * ( processingId ) {
    let done_value = processingId_done_value_Map.get( processingId );
    if ( done_value ) {
      if ( done_value.done ) {
        return done_value.value;
      } else {
        yield done_value.value;
      }
    } else {
      yield undefined;
    }
  }

}


//!!!
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

