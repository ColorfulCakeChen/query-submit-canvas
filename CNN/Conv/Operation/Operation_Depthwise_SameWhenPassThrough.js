export { Depthwise_SameWhenPassThrough };
export { Depthwise_SameWhenPassThroughPool };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Pool from "../../util/Pool.js";
import { Depthwise } from "./Operation_Depthwise.js";

/**
 * Depthwise convolution whose output will be the same as input when pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId == ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0 ) (0).
 *
 * Usually, this is used for non-squeeze-and-excitaion depthwise.
 *
 */
class Depthwise_SameWhenPassThrough extends Depthwise {

  /**
   */
  constructor(
    inputTensorPlaceholder0,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent ) {

    super(
      inputTensorPlaceholder0,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0,
      nHigherHalfDifferent );

    Depthwise_SameWhenPassThrough.setAsConstructor.call( this,
      inputTensorPlaceholder0,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      nHigherHalfDifferent );
  }

  /**
   * @param {Depthwise_SameWhenPassThrough} this
   *   The object to be initialized.
   *
   * @return {Depthwise_SameWhenPassThrough}
   *   Return the this object.
   */
  static setAsConstructor(
    inputTensorPlaceholder0,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent ) {

    super.setAsConstructor.call( this,
      inputTensorPlaceholder0,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0,
      nHigherHalfDifferent );

    return this;
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    Depthwise_SameWhenPassThroughPool.Singleton.recycle( this );
  }

}


/**
 * Providing Operation.Depthwise_SameWhenPassThrough
 *
 */
class Depthwise_SameWhenPassThroughPool extends Pool.Root {

  constructor() {
    super( "Operation.Depthwise_SameWhenPassThroughPool",
      Depthwise_SameWhenPassThrough, Depthwise_SameWhenPassThrough.setAsConstructor );
  }

}

/**
 * Used as default Operation.Depthwise_SameWhenPassThrough provider.
 */
Depthwise_SameWhenPassThroughPool.Singleton = new Depthwise_SameWhenPassThroughPool();

