export { Pointwise_ConstantWhenPassThrough };
export { Pointwise_ConstantWhenPassThroughPool };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Pool from "../../util/Pool.js";
import { Pointwise } from "./Operation_Pointwise.js";

/**
 * Pointwise convolution whose output will be constant value (no matter what input) when pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId == ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1 ) (1).
 *
 * Usually, this is used for squeeze-and-excitaion pointwise.
 *
 */
class Pointwise_ConstantWhenPassThrough extends Pointwise {

  /**
   */
  constructor(
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super(
      inputTensorPlaceholder0,
      outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1,
      nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );

    this.setAsConstructor(
      inputTensorPlaceholder0,
      outputChannelCount, bBias, nActivationId,
      nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );
  }

  /**
   * @return {Pointwise_ConstantWhenPassThrough}
   *   Return the this object.
   */
  setAsConstructor(
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super.setAsConstructor(
      inputTensorPlaceholder0,
      outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1,
      nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );

    return this;
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    Pointwise_ConstantWhenPassThroughPool.Singleton.recycle( this );
  }

}


/**
 * Providing Operation.Pointwise_ConstantWhenPassThrough
 *
 */
class Pointwise_ConstantWhenPassThroughPool extends Pool.Root {

  constructor() {
    super( Pointwise_ConstantWhenPassThrough, Pointwise_ConstantWhenPassThrough.setAsConstructor );
  }

}

/**
 * Used as default Operation.Pointwise_ConstantWhenPassThrough provider.
 */
Pointwise_ConstantWhenPassThroughPool.Singleton = new Pointwise_ConstantWhenPassThroughPool();

