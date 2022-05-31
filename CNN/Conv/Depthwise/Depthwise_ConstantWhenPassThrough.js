export { ConstantWhenPassThrough };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { Base } from "./Depthwise_Base.js";

/**
 * Depthwise convolution whose output will be constant value (no matter what input) when pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId == ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1 ) (1).
 *
 * Usually, this is used for squeeze-and-excitaion depthwise.
 *
 */
class ConstantWhenPassThrough extends Base {

  /**
   */
  constructor(
    inputTensorPlaceholder0,
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf ) {

    super(
      inputTensorPlaceholder0,
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1,
      nHigherHalfDifferent, inputChannelCount_lowerHalf );

  }

}
