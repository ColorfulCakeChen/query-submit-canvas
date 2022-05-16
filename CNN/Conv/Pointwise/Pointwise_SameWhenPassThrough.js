export { SameWhenPassThrough };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { Base } from "./Pointwise_Base.js";

/**
 * Pointwise convolution whose output will be the same as input when pass-through.
 *
 * It has the following properties:
 *   - ( nPassThroughStyleId == ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING ) (0).
 *
 * Usually, this is used for non-squeeze-and-excitaion pointwise.
 *
 */
class SameWhenPassThrough extends Base {

  /**
   */
  constructor(
    inputChannelCount, outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super(
      inputChannelCount, outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING,
      nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );
  }

}
