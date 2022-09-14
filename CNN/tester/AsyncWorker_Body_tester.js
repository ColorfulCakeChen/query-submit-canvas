import * as AsyncWorker from "../util/AsyncWorker.js";

//!!! ...unfinished... (2022/09/14) Test importScripts.
let tensorflowJsURL = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.19.0/dist/tf.min.js";
importScripts( tensorflowJsURL ); // Load tensorflow.js library in global scope.

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

AsyncWorker_Body_tester.Singleton = new AsyncWorker_Body_tester(); // Create worker body.

//!!! (2022/09/13 Remarked) AsyncWorker_Body constructor will schedule a timer to do this.
// // Handle messages received before this worker body module loaded.
// AsyncWorker_Body_tester.Singleton.globalThis_temporaryMessageQueue_processMessages();
