export { Pointwise_ConstantWhenPassThrough };

import * as Pool from "../../util/Pool.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
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
   * Used as default Operation.Pointwise_ConstantWhenPassThrough provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Operation.Pointwise_ConstantWhenPassThrough.Pool",
    Pointwise_ConstantWhenPassThrough, Pointwise_ConstantWhenPassThrough.setAsConstructor );

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

    Pointwise_ConstantWhenPassThrough.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor(
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super.setAsConstructor(
      inputTensorPlaceholder0,
      outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1,
      nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );

    Pointwise_ConstantWhenPassThrough.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

}

