export { Pointwise_SameWhenPassThrough };
export { Pointwise_SameWhenPassThroughPool };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Pool from "../../util/Pool.js";
import { Pointwise } from "./Operation_Pointwise.js";

/**
 * Pointwise convolution whose output will be the same as input when pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId == ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0 ) (0).
 *
 * Usually, this is used for non-squeeze-and-excitaion pointwise.
 *
 */
class Pointwise_SameWhenPassThrough extends Pointwise {

  /**
   */
  constructor(
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super(
      inputTensorPlaceholder0,
      outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0,
      nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );

    this.setAsConstructor(
      inputTensorPlaceholder0,
      outputChannelCount, bBias, nActivationId,
      nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );
  }

  /**
   * @return {Pointwise_SameWhenPassThrough}
   *   Return the this object.
   */
  setAsConstructor(
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super.setAsConstructor(
      inputTensorPlaceholder0,
      outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0,
      nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );

    return this;
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    Pointwise_SameWhenPassThroughPool.Singleton.recycle( this );
  }

}


/**
 * Providing Operation.Pointwise_SameWhenPassThrough
 *
 */
class Pointwise_SameWhenPassThroughPool extends Pool.Root {

  constructor() {
    super( Pointwise_SameWhenPassThrough, Pointwise_SameWhenPassThrough.setAsConstructor );
  }

}

/**
 * Used as default Operation.Pointwise_SameWhenPassThrough provider.
 */
Pointwise_SameWhenPassThroughPool.Singleton = new Pointwise_SameWhenPassThroughPool();

