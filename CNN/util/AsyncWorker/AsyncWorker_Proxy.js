export { AsyncWorker_Proxy as Proxy };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import { PromiseResolveReject } from "./AsyncWorker_PromiseResolveReject.js";
import { PromiseResolveRejectMap } from "./AsyncWorker_PromiseResolveReject.js";

/**
 * Hold the worker and its related promise map. It is a wrapper of a neural network
 * web worker for handling and communicating easily.
 *
 * @member {number} workerId  The array index of this worker proxy.
 * @member {Worker} worker    The worker.
 *
 * @member {PromiseResolveRejectMap} thePromiseResolveRejectMap
 *   Every worker has a result pending promise map. The key of the map is processing
 * id. The value of the map is a PromiseResolveReject.
 *
 */
class AsyncWorker_Proxy extends Recyclable.Root {

  /**
   * Used as default AsyncWorker.Proxy provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "AsyncWorker.Proxy.Pool",
    AsyncWorker_Proxy, AsyncWorker_Proxy.setAsConstructor );

  /** */
  constructor() {
    super();
    AsyncWorker_Proxy.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    AsyncWorker_Proxy.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    if ( this.thePromiseResolveRejectMap )
      this.thePromiseResolveRejectMap.clear();
    else
      this.thePromiseResolveRejectMap = new PromiseResolveRejectMap();
  }

  /** @override */
  disposeResources() {
    this.thePromiseResolveRejectMap.clear();
    super.disposeResources();
  }

  /**
   * Dispatch messages come from the owned web worker. Please register this method
   * as this WorkerProxy's Worker.onmessage.
   *
   * @param {AsyncWorker_Proxy} this
   *   The "this" should be binded to this AsyncWorker_Proxy object.
   */
  static onmessage_from_AsyncWorker_Body( e ) {

//!!! (2022/09/10 Remarked) no workerId
//     // e.data == { processingId, workerId, result }
//     let processingId = e.data.processingId;
//     let workerId = e.data.workerId;
//     let result = e.data.result;
//
//     if ( workerId != this.workerId )
//       return; // Ignore if wrong worker id.

    // ( e.data == { processingId, done, value } )
    let { processingId, done, value } = e.data;

    this.thePromiseResolveRejectMap.resolve_by_processingId_done_value(
      processingId, done, value );
  }

}
