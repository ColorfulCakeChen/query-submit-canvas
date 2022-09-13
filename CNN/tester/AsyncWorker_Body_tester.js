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

( async () => {

globalThis.AsyncWorker = await import( "../util/AsyncWorker.js" );

/**
 * @return {Promise}
 *   Return a promise which will be resolved as specified value after specified
 * milliseconds.
 */
function delayedValue( milliseconds, value ) {
  return new Promise( ( resolve /*, reject*/ ) => {
    setTimeout( () => resolve( value ), milliseconds );
  } );
}

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
   */
  async* initWorker( workerId ) {
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
   *   Every so many value, generate so many values without delay intervalMilliseconds.
   */
  async* number_sequence(
    intervalMilliseconds,
    [ valueBegin, valueCountTotal, valueCountPerBoost ]
  ) {

    let bBoost = ( Math.random() < 0.5 );

    let countInBlock = 0;
    let value = valueBegin;
    for ( let i = 0; i < ( valueCountTotal - 1 ); ++i ) {

      if ( bBoost ) {
        yield { value: value }; // No delay.

      } else {
        yield delayedValue( intervalMilliseconds, { value: value } );
      }

      // Counting how many number has been generated in the boost (non-boost) block.
      ++countInBlock;
      if ( countInBlock == valueCountPerBoost ) {
        bBoost = !bBoost; // Toogle between boost and non-boost.
        countInBlock = 0;
      }

      ++value;
    }

    // Generate the final value by return;
    return { value: value };
  }

}


// In main document context (Not in worker context). Do nothing. (Should not happen)
if ( globalThis.document )
  return;

// In worker context.
AsyncWorker_Body_tester.Singleton = new AsyncWorker_Body_tester(); // Create worker body.

} )();
