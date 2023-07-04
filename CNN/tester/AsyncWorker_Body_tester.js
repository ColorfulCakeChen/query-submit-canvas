import * as AsyncWorker from "../util/AsyncWorker.js";
import * as PartTime from "../util/PartTime.js";

/**
 * The implementation of a neural network web worker.
 *
 */
export default class AsyncWorker_Body_tester extends AsyncWorker.Body {

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

    //!!! (2022/09/14 Temp Add) Test importScripts.
    //let tensorflowJsURL = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.19.0/dist/tf.min.js";
    //importScripts( tensorflowJsURL ); // Load tensorflow.js library in global scope.

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
   *   Every so many value, generate so many values without delay
   * intervalMilliseconds.
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
        yield PartTime.delayedValue( intervalMilliseconds, { value: value } );
      }

      // Counting how many number has been generated in the boost (non-boost)
      // block.
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
