export { ConstantWhenPassThrough };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { Base } from "./Pointwise_Base.js";

/**
 * Pointwise convolution whose output will be constant value (no matter what input) when pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId == ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING ) (1).
 *
 * Usually, this is used for squeeze-and-excitaion pointwise.
 *
 */
class ConstantWhenPassThrough extends Base {

  /**
   */
  constructor(
    inputChannelCount, outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super(
      inputChannelCount, outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING,
      nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );
  }

}
