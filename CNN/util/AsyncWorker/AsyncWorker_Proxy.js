export { AsyncWorker_Proxy as Proxy };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
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

    {
 //!!! ...unfinished... (2022/09/08) also MessagePort.close().

      // Note: No processingId, because this command needs not return value.
      {
        let data = { command: "disposeResources" };
        this.worker.postMessage( data );
        this.worker = null;
      }
    }

    this.thePromiseResolveRejectMap.clear();

    super.disposeResources();
  }

  /**
   * Dispatch messages come from the owned web worker.
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

    // e.data == { processingId, done_value }
    let processingId = e.data.processingId;
    let done_value = e.data.done_value;


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

    // Discard result with non-existed processing id. (e.g. already handled old
    // processing result)
    let thePromiseResolveReject = this.thePromiseResolveRejectMap.get( processingId );
    if ( !thePromiseResolveReject )
      return;

    thePromiseResolveReject.process.resolve( result );

//!!! ...unfinished... When will fail?
    //processRelayPromises.reject();

//!!! ...unfinished... Whether should the older (i.e. smaller) processingId be cleared from map? (Could the processing be out of order?)

//!!! ...unfinished... (2022/09/09)
// What about processRelayPromises.relay?
// When to resolve it (before the promise be deleted)?

    // Clear the info entry of handled processing result.
    this.thePromiseResolveRejectMap.delete( processingId );


  }

}
