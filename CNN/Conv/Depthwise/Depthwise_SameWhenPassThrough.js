export { SameWhenPassThrough };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { Base } from "./Depthwise_Base.js";

/**
 * Depthwise convolution whose output will be the same as input when pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId == ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING ) (0).
 *
 */
class SameWhenPassThrough extends Base {

//!!! ...unfinished... (2022/05/16)

  /**
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf ) {

    super(
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,

      // For depthwise (i.e. not squeeze-and-excitaion pointwise), pass-through style should be
      // ( filterValue = 1, biasValue = 0, with activation escaping).
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING,

      nHigherHalfDifferent, inputChannelCount_lowerHalf );

  }

}
