export { Depthwise_ConstantWhenPassThrough };
export { Depthwise_ConstantWhenPassThroughPool };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Pool from "../../util/Pool.js";
import { Depthwise } from "./Operation_Depthwise.js";

/**
 * Depthwise convolution whose output will be constant value (no matter what input) when pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId == ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1 ) (1).
 *
 * Usually, this is used for squeeze-and-excitaion depthwise.
 *
 */
class Depthwise_ConstantWhenPassThrough extends Depthwise {

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
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1,
      nHigherHalfDifferent );

    Depthwise_ConstantWhenPassThrough.setAsConstructor.call( this,
      inputTensorPlaceholder0,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      nHigherHalfDifferent );
  }

  /**
   * @param {Depthwise_ConstantWhenPassThrough} this
   *   The object to be initialized.
   *
   * @return {Depthwise_ConstantWhenPassThrough}
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
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1,
      nHigherHalfDifferent );

    return this;
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    Depthwise_ConstantWhenPassThroughPool.Singleton.recycle( this );
  }

}


/**
 * Providing Operation.Depthwise_ConstantWhenPassThrough
 *
 */
class Depthwise_ConstantWhenPassThroughPool extends Pool.Root {

  constructor() {
    super( "Operation.Depthwise_ConstantWhenPassThroughPool",
      Depthwise_ConstantWhenPassThrough, Depthwise_ConstantWhenPassThrough.setAsConstructor );
  }

}

/**
 * Used as default Operation.Depthwise_ConstantWhenPassThrough provider.
 */
Depthwise_ConstantWhenPassThroughPool.Singleton = new Depthwise_ConstantWhenPassThroughPool();

