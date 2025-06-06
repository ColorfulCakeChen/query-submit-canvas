export { Depthwise_SameWhenPassThrough };

import * as Pool from "../../util/Pool.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { Depthwise } from "./Operation_Depthwise.js";

/**
 * Depthwise convolution whose output will be the same as input when
 * pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId ==
 *       ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0 ) (0).
 *
 * Usually, this is used for non-squeeze-and-excitaion depthwise.
 *
 */
class Depthwise_SameWhenPassThrough extends Depthwise {

  /**
   * Used as default Operation.Depthwise_SameWhenPassThrough provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "Operation.Depthwise_SameWhenPassThrough.Pool",
    Depthwise_SameWhenPassThrough,
    Depthwise_SameWhenPassThrough.setAsConstructor );

  /**
   */
  constructor(
    parentNameable, name,
    inputTensorPlaceholder0, bTableLog,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent ) {

    super(
      parentNameable, name,
      inputTensorPlaceholder0, bTableLog,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0,
      nHigherHalfDifferent );

    Depthwise_SameWhenPassThrough.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor(
    parentNameable, name,
    inputTensorPlaceholder0, bTableLog,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent ) {

    super.setAsConstructor(
      parentNameable, name,
      inputTensorPlaceholder0, bTableLog,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0,
      nHigherHalfDifferent );

    Depthwise_SameWhenPassThrough.setAsConstructor_self.call( this );
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
