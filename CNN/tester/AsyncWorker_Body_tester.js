/**
 * @file This file is the main (i.e. body) javascript file of neural network web worker.
 * It is not an importable module.
 *
 * In module (non-classic) web worker, static import is available. But at the same
 * time, importScripts() will not be avbailable. For solving this problem, using
 * classic (non-module) web worker so that tensorflow.js can be loaded by
 * importScripts(). At the same time, using dynamic import() to load ourselves module
 * because import() can be used in classic (non-module) script.
 */


globalThis.AsyncWorker = await import( "../util/AsyncWorker.js" );

/**
 * The implementation of a neural network web worker.
 *
 */
class AsyncWorker_Body_tester extends AsyncWorker.Body {

  /** */
  constructor() {
    super(); // register callback from Worker_Proxy.
  }

  /** @override */
  async* disposeResources() {
    yield *super.disposeResources();
  }

  /**
   *
   * @param {number} workerId
   *   A non-negative integer represents this worker's id. The id of the first worker
   * should be 0.
   *
   * @param {string} tensorflowJsURL
   *   The URL of tensorflow javascript library. Every worker will load the library
   * from the URL.
   *
   * @param {NeuralNet.ParamsBase} neuralNetParamsBase
   *   The configuration of the neural network to be created by web worker.
   */
  async* initWorker( { workerId = 0 } ) {
    if ( workerId < 0 )
      workerId = 0;

    this.workerId = workerId;

    // Load libraries dynamically in global scope.
    {
      // [ globalThis.Pool,
      //   globalThis.Recyclable,
      //   globalThis.ValueMax,
      // ] = await Promise.all( [
      //   import( "../util/Pool.js" ),
      //   import( "../util/Recyclable.js" ),
      //   import( "../util/ValueMax.js" ),
      // ] );
    }

    return { value: true };
  }

  /**
   * @param {number} markValue
   *   A value representing which alignment this neural network plays currently.
   * For example, in a OX (connect-three) game:
   *   - ( markValue == 0 ) means this neural network plays O side currently.
   *   - ( markValue == 255 ) means this neural network plays X side currently.
   */
  async* number_sequence( {
    delayMilliseconds,
    valueBegin, valueEnd, valueStep,
    valueBoostCount
    } ) {

    this.alignmentMarkValue = markValue;
    return { value: markValue };
  }

}


// In main document context (Not in worker context). Do nothing. (Should not happen)
if ( globalThis.document )
  return;

// In worker context.
AsyncWorker_Body_tester.Singleton = new AsyncWorker_Body_tester(); // Create worker body.
