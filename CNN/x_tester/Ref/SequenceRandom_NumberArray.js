export { Bag };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import * as RandTools from "../../util/RandTools.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";

/**
 * A pool for number array which is created with sequence and randomized
 * offset. It could reduce re-creating them of same parameters again and again
 * to improve performance.
 *
 */
class Bag extends Recyclable.Base( MultiLayerMap.Base ) {

  /**
   * Used as default SequenceRandom_NumberArray.Bag provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "SequenceRandom_NumberArray.Bag.Pool",
    Bag );

  /**
   *
   */
  constructor() {
    super();
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor() {
    super.setAsConstructor();
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    this.clear();
    super.disposeResources();
  }

  /** @override */
  clear() {
    for ( let numberArray of this.values() ) {
      numberArray.disposeResources_and_recycleToPool();
    }

    super.clear();
  }

  /**

//!!! (2025/07/09 Remarked) seems not used.
//    * Similar to
//    * TestParams_Base.ensure_object_property_numberArray_length_filled(). But
//    * the property will be a shared number array. Its value may be shared with
//    * other caller.
//    *
//    * The property will be a shared number array. Its value may be shared with
//    * other caller.

   *
   * For improve test case performance because of number array re-using (instead
   * of re-generating).
   *
   *
   * @param {object} io_object
   *   The object to be checked and modified.
   *
   * @param {string} propertyName
   *   The property io_object[ propertyName ] will be ensured as a number
   * array.
   *
   * @param {number} height
   *   The length of axis0 of the io_object[ propertyName ].
   *
   * @param {number} width
   *   The length of axis1 of the io_object[ propertyName ].
   *
   * @param {number} channelCount
   *   The length of axis2 of the io_object[ propertyName ].
   *
   * @param {number} valueBegin
   *   The first value of filled sequence.
   *
   * @param {number} valueStep
   *   The incremental value of every next filled value in the sequence.
   *
   * @param {number} randomOffsetMin
   *   The random number offet lower bound.
   *
   * @param {number} randomOffsetMax
   *   The random number offet upperer bound.
   *
   * @return {Recyclable.NumberArray_withBounds}
   *    Return a shared number array. Its value will be shared with other
   * caller (i.e. Please do NOT modify them).
   */
  get_by_elementCount_randomOffsetMin_randomOffsetMax(
    height, width, channelCount,
    valueBegin = 0, valueStep = 1,
    randomOffsetMin = 0, randomOffsetMax = 0,
    divisorForRemainder = ( 2 ** 26 ),
    alwaysFixedRandomMinMax = undefined
   ) {

    let numberArray = this.get_or_create_by_arguments1_etc(
      Bag.create_by, this,
      height, width, channelCount,
      valueBegin, valueStep,
      randomOffsetMin, randomOffsetMax, divisorForRemainder,
      alwaysFixedRandomMinMax
    );

    return numberArray;
  }

  /**
   *
   */
  static create_by(
    height, width, channelCount,
    valueBegin, valueStep,
    randomOffsetMin, randomOffsetMax, divisorForRemainder,
    alwaysFixedRandomMinMax
  ) {

    // For debug.
    //if ( Number.isNaN( elementCount ) ) {
    //  debugger;
    //}

    let numberArray
      = Recyclable.NumberArray_withBounds.Pool.get_or_create_by();

    RandTools.fill_numberArray( numberArray,
      height, width, channelCount,
      valueBegin, valueStep,
      randomOffsetMin, randomOffsetMax, divisorForRemainder,
      alwaysFixedRandomMinMax
    );
    return numberArray;
  }

}
