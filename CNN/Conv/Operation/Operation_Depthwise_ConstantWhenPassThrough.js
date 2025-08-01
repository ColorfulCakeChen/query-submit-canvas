export { Depthwise_ConstantWhenPassThrough };

import * as Pool from "../../util/Pool.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { Depthwise } from "./Operation_Depthwise.js";

/**
 * Depthwise convolution whose output will be constant value (no matter what
 * input) when pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId ==
 *       ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1 ) (1).
 *
 * Usually, this is used for squeeze-and-excitaion depthwise.
 *
 */
class Depthwise_ConstantWhenPassThrough extends Depthwise {

  /**
   * Used as default Operation.Depthwise_ConstantWhenPassThrough provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "Operation.Depthwise_ConstantWhenPassThrough.Pool",
    Depthwise_ConstantWhenPassThrough );

  /**
   */
  constructor(
    parentNameable, name, bTableLog,
    inputTensorPlaceholder0,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent ) {

    super(
      parentNameable, name, bTableLog,
      inputTensorPlaceholder0,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1,
      nHigherHalfDifferent );

    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor(
    parentNameable, name, bTableLog,
    inputTensorPlaceholder0,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent,
    channelShuffler_inputGroupCount, channelShuffler_outputGroupCount ) {

    super.setAsConstructor(
      parentNameable, name, bTableLog,
      inputTensorPlaceholder0,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1,
      nHigherHalfDifferent );

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
