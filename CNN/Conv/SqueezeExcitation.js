export { Base };

//import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as Weights from "../Unpacker/Weights.js";
import * as BoundsArraySet from "./BoundsArraySet.js";
import * as Depthwise from "./Depthwise.js";
import * as Pointwise from "./Pointwise.js";


//!!! ...unfinished... (2022/05/14)
// Q: Perhaps, let pointwise1 become squeeze and excitation before depthwise.
// A: It may not be possible because input and output channel count may be different.


//!!! ...unfinished... (2022/05/15)
// Fo half copy and pass-through, the squeeze and excitation should also pass-through
// (i.e filter = 0, bias = 1) (compare to pass-through for addition operation: filter = 1, bias = 0)
//
// pointwiseSE's filterValueAdjusted = undoDepthwiseActivationEscapingScale * filterValue
//
// pointwise2's filterValueAdjusted = undoDepthwiseActivationEscapingScale * undoPointwiseSEActivationEscapingScale * filterValue
//
//
//
// o should undo previous activation escaping scale
// o when pass-through, filter = 0, bias = 1 (not: filter 1, bias 0)
// o even if there is pass-through, it is not necessary to activation escaping scale.
// o The bounds array set of output (which is input multiplied by squeeze-and-excitation) should include squeeze-and-excitation.
//   However, the activation escaping scale should be the same as input's activation escaping scale.
//   So that the next operation (e.g. pointwise2) could restore the correct input (with squeeze-and-excitation) 。
//
// PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING
// PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING


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
 *
 * @member {number} inputChannelCount
 *   The channel count of the input tensor.
 *
 * @member {number} intermediateChannelCount
 *   The channel count between squeeze and excitation.
 *
 *     - If ( intermediateChannelCount <= 0 ), there will be only one pointwise convolution (i.e. excitation pointwise convolution). 
 *
 *     - If ( intermediateChannelCount > 0 ), there will be two pointwise convolutions (i.e. pointwise convolution before
 *         excitation, and excitation pointwise convolution).
 *
 * @member {number} outputChannelCount
 *   Always the same as inputChannelCount.
 *
 * @member {ValueDesc.Pointwise_HigherHalfDifferent} nHigherHalfDifferent
 *   The HigherHalfDifferent type for pointwise convolution in squeeze-and-excitation.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Including inferenced weights, if they are used in tensors.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including inferenced weights (even if they are
 * used in tensors), because they are not extracted from inputFloat32Array.
 *
 */
class Base extends {

//!!! ...unfinished... (2022/05/18)

  /**
   *
   */
  constructor(
    inputChannelCount, intermediateChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf ) {

    // Note: Inside squeeze-and-excitation, all depthwsie and pointwise convolutions are constnat-when-pass-through.
    //       So that the result for pass-through parts will not affect input when multiply to input.
    //


//!!! ...unfinished... (2022/05/18) squeeze?
    this.squeezeDepthwise = new Depthwise.ConstantWhenPassThrough(

//!!! ...unfinished... (2022/05/18)
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth,

      ???ValueDesc.StridesPad.Singleton.STRIDES_1_PAD_SAME, // (stridesPad)

      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent, inputChannelCount_lowerHalf
    );


    this.intermediateChannelCount = intermediateChannelCount;
    if ( intermediateChannelCount > 0 ) {
      this.intermediatePointwise = new Pointwise.ConstantWhenPassThrough(
        inputChannelCount,
        intermediateChannelCount,
        bBias, nActivationId,
        nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf,
        0, // Inside squeeze-and-excitation, never shuffle channels. ( channelShuffler_outputGroupCount == 0 ).
      );
    }

    this.excitationPointwise = new Pointwise.ConstantWhenPassThrough(
      intermediateChannelCount,
      inputChannelCount, // For squeeze-and-excitation, output channel count always the same as input.
      bBias, nActivationId,
      nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf,
      0, // Inside squeeze-and-excitation, never shuffle channels. ( channelShuffler_outputGroupCount == 0 ).
    );


  }

//!!! ...unfinished... (2022/05/18)

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous convolution-bias-activation value bounds
   * set of this pointwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray ) {

//!!! ...unfinished... (2022/05/18)


//!!! ...unfinished... (2022/05/18) boundsArraySet. dispose

//!!! ...unfinished... (2022/05/18)
//       this.tensorWeightCountTotal += ???this.pointwise1.tensorWeightCountTotal;
//       this.tensorWeightCountExtracted += ???this.pointwise1.tensorWeightCountExtracted;
  }

//!!! ...unfinished... (2022/05/15) should deletel sub pointwise.boundsArraySet


  /** Release all tensors. */
  disposeTensors() {

//!!! ...unfinished... (2022/05/18)

    if ( this.pointwise1 ) {
      this.pointwise1.disposeTensors();
      this.pointwise1 = null;
    }

    if ( this.depthwise1 ) {
      this.depthwise1.disposeTensors();
      this.depthwise1 = null;
    }

    if ( this.depthwise2 ) {
      this.depthwise2.disposeTensors();
      this.depthwise2 = null;
    }

    if ( this.pointwise21 ) {
      this.pointwise21.disposeTensors();
      this.pointwise21 = null;
    }

    if ( this.addInput0ToPointwise22 ) {
      this.addInputToPointwise22Output = null;
    }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /**

//!!! ...unfinished... (2022/05/18)

   * Release all BoundsArraySet of pointwise1, depthwise1, depthwise2, pointwise21, pointwise22,
   * concat1, addInput0ToPointwise21, addInput0ToPointwise22, concat2ShuffleSplit.
   *
   * This could reduce memory footprint.
   *
   * (Note: This SqueezeExcitation's BoundsArraySet is kept.)
   */
  dispose_all_sub_BoundsArraySet() {

//!!! ...unfinished... (2022/05/18)

    delete this.pointwise1?.boundsArraySet;
    delete this.depthwise1?.boundsArraySet;
    delete this.depthwise2?.boundsArraySet;
    delete this.pointwise21?.boundsArraySet;
    delete this.pointwise22?.boundsArraySet;
  }

}
