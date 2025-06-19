export { AsyncWorker_Proxy_tester };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as AsyncWorker from "../util/AsyncWorker.js";
//import * as ValueMax from "../util/ValueMax.js";

/**
 * Hold the worker and its related promise map. It is a wrapper of a neural
 * network web worker for handling and communicating easily.
 *
 */
class AsyncWorker_Proxy_tester extends AsyncWorker.Proxy {

  /**
   * Used as default AsyncWorker.Proxy provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "AsyncWorker.Proxy_tester.Pool",
    AsyncWorker_Proxy_tester );

  /** */
  constructor() {
    super( AsyncWorker_Proxy_tester.workerModuleURL );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor() {
    super.setAsConstructor( AsyncWorker_Proxy_tester.workerModuleURL );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    this.workerId = undefined;
    super.disposeResources();
  }

  /**
   * Initialize this worker proxy.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  initWorker_async( workerId ) {
    this.workerId = workerId;
    return this.createPromise_by_postCommandArgs(
      [ "initWorker", workerId ]
    );
  }

  /**
   * @param {number} intervalMilliseconds
   *   How long to generate the next value.
   *
   * @param {number} valueBegin
   *   The first value in the sequence.
   *
   * @param {number} valueCountTotal
   *   There will be so many value be generated.
   *
   * @param {number} valueCountPerBoost
   *   Every so many value, generate so many values without delay
   * intervalMilliseconds.
   *
   * @return {AsyncWorker.Resulter}
   *   An async iterator tracking the results of this method.
   */
  number_sequence_asyncGenerator(
    intervalMilliseconds,
    valueBegin, valueCountTotal, valueCountPerBoost
  ) {
    let valueParams = new Float32Array( [
      valueBegin, valueCountTotal, valueCountPerBoost ] );

    let resulter = this.createResulter_by_postCommandArgs(
      [ "number_sequence", intervalMilliseconds, valueParams ],
      [ valueParams.buffer ], // Test: transferable object array.
    );

    // Check Test: transferable object array.
    if ( valueParams.buffer.length > 0 )
      throw Error( `AsyncWorker_Proxy_tester.number_sequence(): `
        + `Transferred object should become zero length after postMessage().`
      );

    return resulter;
  }

}

// Assume the web worker module javascript file is a sibling file (i.e. inside
// the same folder) of this module file.
AsyncWorker_Proxy_tester.workerModuleURL
  = new URL( "AsyncWorker_Body_tester.js", import.meta.url );
