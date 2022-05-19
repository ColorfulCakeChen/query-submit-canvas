export { SameWhenPassThrough_PrefixSqueezeExcitation };

import * as BoundsArraySet from "../BoundsArraySet.js";
import * as SqueezeExcitation from "../SqueezeExcitation.js";
import { SameWhenPassThrough } from "./Pointwise_SameWhenPassThrough.js";


//!!! ...unfinished... (2022/05/14)
// Q: Perhaps, let pointwise1 become squeeze and excitation before depthwise.
// A: It may not be possible because input and output channel count may be different.

//!!! ...unfinished... (2022/05/08) Add squeeze and excitation before pointwise.
// globale avg pooling - pointwise - pointwise - multiplyToInput
// And the, the original pointwise


//!!! ...unfinished... (2022/05/09) What if:
// pointwise1 ( bias, activation )
// depthwise ( channelMultipler > 1, bias / no bias, activation / no activation )
// pointwiseSE ( bias, activation )
// pointwise2 ( bias, activation )
//
// pointwise1 - depthwise - pointwiseSE - multiply - pointwise2
//                        \-------------/
//
// No global average pooloing.
//
//
//
//




/**
 * A Pointwise_SameWhenPassThrough with a SqueezeExcitation in front of it.
 *
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by init(). This is relative to the
 * inputFloat32Array.buffer (not to the inputFloat32Array.byteOffset).
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by init(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ). This is relative to the inputFloat32Array.buffer (not to the inputFloat32Array.byteOffset).
 *

//!!! ...unfinished... (2022/05/19) ValueDesc.SqueezeExcitationReductionRatio.Singleton.Ids.Xxx


 * @member {number} excitationChannelCountReductionRatio
 *   An integer which is the channel count divisor for intermediate pointwise convolution channel count.

//!!! ...unfinished... (2022/05/19)

 *
 *     - If ( excitationChannelCountReductionRatio < 0 ), there will be no squeeze-and-excitation. 
 *
 *     - If ( excitationChannelCountReductionRatio == 0 ), there will be only one pointwise convolution (i.e. excitation
 *         pointwise convolution). 
 *
 *     - If ( excitationChannelCountReductionRatio > 0 ), there will be two pointwise convolutions (i.e. intermediate pointwise
 *         convolution and excitation pointwise convolution).
 *
 * @member {number} inputHeight
 *   The height of the input tensor. If one of inputHeight and inputWidth is not positive (<= 0), there will be no squeeze step
 * (i.e. no global average pooling). This is only used when ( excitationChannelCountReductionRatio >= 0 ) (i.e. has
 * squeeze-and-excitation).
 *
 * @member {number} inputWidth
 *   The width of the input tensor. If one of inputHeight and inputWidth is not positive (<= 0), there will be no squeeze step
 * (i.e. no global average pooling). This is only used when ( excitationChannelCountReductionRatio >= 0 ) (i.e. has
 * squeeze-and-excitation).
 *
 * @member {number} inputChannelCount
 *   The channel count of the input tensor. It must be greater than zero (> 0).
 *
 * @member {number} outputChannelCount
 *   The channel count of the output tensor.
 *
 * @member {ValueDesc.Pointwise_HigherHalfDifferent} nHigherHalfDifferent
 *   The HigherHalfDifferent type for pointwise convolution.
 *

//!!! ...unfinished... (2022/05/19)

 * @member {boolean} bSqueeze
 *   Whether squeeze step is necessary. If one of inputHeight and inputWidth is not positive (<= 0), bSqueeze will be false
 * (i.e. no squeeze step (i.e. no global average pooling)).
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Including inferenced weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including inferenced weights (even if they are
 * used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {function} apply
 *   A method accepts one parameter inputTensor (tf.tensor3d) and return an outputTensor (tf.tensor3d). All intermediate tensors
 * will be disposed. The inputTensor may or may not be disposed (according to setKeepInputTensor()). In fact, this method calls one
 * of Base.Xxx_and_keep() according to the parameters.
 *
 */
class SameWhenPassThrough_PrefixSqueezeExcitation {

//!!! ...unfinished... (2022/05/19)

  /**
   */
  constructor(
    inputHeight, inputWidth, excitationChannelCountReductionRatio,

    inputChannelCount, outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {


    super(
      inputChannelCount, outputChannelCount, bBias, nActivationId,
      ValueDesc.PassThroughStyle.Singleton.Ids.PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING,
      nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );
  }


//!!! new SqueezeExcitation.Base()
// new SameWhenPassThrough()

}
