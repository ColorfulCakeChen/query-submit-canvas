export { Pointwise_SameWhenPassThrough };

import * as Pool from "../../util/Pool.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { Pointwise } from "./Operation_Pointwise.js";

/**
 * Pointwise convolution whose output will be the same as input when
 * pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId ==
 *       ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0 ) (0).
 *
 * Usually, this is used for non-squeeze-and-excitaion pointwise.
 *
 */
class Pointwise_SameWhenPassThrough extends Pointwise {

  /**
   * Used as default Operation.Pointwise_SameWhenPassThrough provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "Operation.Pointwise_SameWhenPassThrough.Pool",
    Pointwise_SameWhenPassThrough );

  /**
   */
  constructor(
    parentNameable, name, bTableLog,
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf,
    channelShuffler_inputGroupCount, channelShuffler_outputGroupCount ) {

    super(
      parentNameable, name, bTableLog,
      inputTensorPlaceholder0,
      outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0,
      nHigherHalfDifferent, outputChannelCount_lowerHalf,
      channelShuffler_inputGroupCount, channelShuffler_outputGroupCount );

    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor(
    parentNameable, name, bTableLog,
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf,
    channelShuffler_inputGroupCount, channelShuffler_outputGroupCount ) {

    super.setAsConstructor(
      parentNameable, name, bTableLog,
      inputTensorPlaceholder0,
      outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0,
      nHigherHalfDifferent, outputChannelCount_lowerHalf,
      channelShuffler_inputGroupCount, channelShuffler_outputGroupCount );

    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

}
