export { NonSqueezeExcitation };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { Base } from "./Depthwise_Base.js";

/**
 * Depthwise with
 * ( nPassThroughStyleId == ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING ) (0).
 *
 */
class NonSqueezeExcitation extends Base {

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
