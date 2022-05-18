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
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by init(). This is relative to the
 * inputFloat32Array.buffer (not to the inputFloat32Array.byteOffset).
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by init(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ). This is relative to the inputFloat32Array.buffer (not to the inputFloat32Array.byteOffset).
 *
 * @member {number} inputChannelCount
 *   The channel count of the input tensor. It must be greater than zero (> 0).
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
 * @member {function} pfnSqueezeExcitation_and_keep
 *   A method accepts one parameter inputTensor (tf.tensor3d) and return an outputTensor (tf.tensor3d). All intermediate tensors
 * will be disposed. The inputTensor will NOT be disposed (i.e. will be kept). In fact, this method calls one of Base.Xxx_and_keep()
 * according to the parameters.
 *
 * @member {function} pfnSqueezeExcitation_and_destroy_or_keep
 *   A method accepts one parameter inputTensor (tf.tensor3d) and return an outputTensor (tf.tensor3d). All intermediate tensors
 * will be disposed. This method calls this.pfnSqueezeExcitation_and_keep(), and then may or may not dispose inputTensor according to
 * setKeepInputTensor().
 *
 */
class Base {

//!!! ...unfinished... (2022/05/18)

  /**
   *
   */
  constructor(
    inputChannelCount, intermediateChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf ) {

    tf.util.assert( ( inputChannelCount > 0 ),
      `SqueezeExcitation.constructor(): `
        + `inputChannelCount ( ${inputChannelCount} ) should be greater than zero (> 0).`
    );

    // Note: Inside squeeze-and-excitation, all depthwsie and pointwise convolutions are constnat-when-pass-through.
    //       So that the result for pass-through parts will not affect input when multiply to input.
    //



//!!! ...unfinished... (2022/05/18) squeeze?
    if (  ) {
      this.squeezeDepthwise = new Depthwise.ConstantWhenPassThrough(

  //!!! ...unfinished... (2022/05/18)
        inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth,

        ???ValueDesc.StridesPad.Singleton.STRIDES_1_PAD_SAME, // (stridesPad)

        bBias, nActivationId, nPassThroughStyleId,
        nHigherHalfDifferent, inputChannelCount_lowerHalf
      );
    }

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

    this.disposeTensors();

    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    // 1.

    // 1.1    
    Base.adjust_pfnSqueezeExcitation_and_keep.call( this );

//!!! ...unfinished... (2022/05/18)

    if ( !this.squeezeDepthwise.init( inputFloat32Array, this.byteOffsetEnd, inputScaleBoundsArray ) )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.squeezeDepthwise.byteOffsetEnd;


//!!! ...unfinished... (2022/05/18)

    if ( this.intermediatePointwise ) {
      if ( !this.intermediatePointwise.init( inputFloat32Array, this.byteOffsetEnd, inputScaleBoundsArray ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = this.intermediatePointwise.byteOffsetEnd;

//!!! ...unfinished... (2022/05/18)
    }

//!!! ...unfinished... (2022/05/18)

    if ( !this.excitationPointwise.init( inputFloat32Array, this.byteOffsetEnd, inputScaleBoundsArray ) )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.excitationPointwise.byteOffsetEnd;


    {
//!!! ...unfinished... (2022/05/18) build self boundsArraySet.
//      this.boundsArraySet = ???;

      this.dispose_all_sub_BoundsArraySet();
    }

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
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
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
    delete this.squeezeDepthwise?.boundsArraySet;
    delete this.intermediatePointwise?.boundsArraySet;
    delete this.excitationPointwise.boundsArraySet;
  }

//!!! ...unfinished... (2022/05/18)
  /**
   * Adjust this.pfnSqueezeExcitation_and_destroy_or_keep so that it is either:
   *   - the same as this.pfnSqueezeExcitation_and_keep which will not dispose inputTensor. or,
   *   - pointer to Base.operation_and_destroy() which will dispose inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {
    this.bKeepInputTensor = bKeepInputTensor;

    if ( bKeepInputTensor ) {
      this.pfnSqueezeExcitation_and_destroy_or_keep = this.pfnSqueezeExcitation_and_keep;
    } else {
      this.pfnSqueezeExcitation_and_destroy_or_keep = Base.operation_and_destroy;
    }
  }


//!!! ...unfinished... (2022/05/18)

  /** Determine this.pfnSqueezeExcitation_and_keep data members.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static setup_pfnSqueezeExcitation_and_keep() {


    if ( this.squeezeDepthwise ) {
    }

//!!! ...unfinished... (2022/05/18)

    if ( this.intermediatePointwise ) {
    }

//!!! ...unfinished... (2022/05/18)

    this.excitationPointwise


//!!! ...unfinished... (2022/05/18)
    // Determine whether pointwise operation should exist.
    if ( this.outputChannelCount > 0 ) {
      this.bPointwise = true;

    } else {  // ( outputChannelCount <= 0 )
      if ( this.channelShuffler_outputGroupCount > 0 ) {
        this.bPointwise = true; // all-pass-through-and-channel-shuffling mode. (Otherwise, no way to do channel shuffling.)
        this.bBias = false; // In this case, there is always no biases (no matter how original bBias is).

      } else {
        this.bPointwise = false;
      }
    }

    this.pfnActivation = Base.ActivationFunction_getById( this.nActivationId );

    if ( !this.bPointwise ) {
      // Since there is no operation at all, let pfnConvBiasActivation ignore pfnConv completely.
      this.pfnConvBiasActivation = this.pfnConv = Base.return_input_directly;
      return true;
    }

    this.pfnConv = Base.Conv_and_destroy; // will dispose inputTensor.

    if ( this.bBias ) {
      if ( this.pfnActivation )
        this.pfnConvBiasActivation = Base.ConvBiasActivation_and_destroy_or_keep;
      else
        this.pfnConvBiasActivation = Base.ConvBias_and_destroy_or_keep;
    } else {
      if ( this.pfnActivation )
        this.pfnConvBiasActivation = Base.ConvActivation_and_destroy_or_keep;
       else
        this.pfnConvBiasActivation = Base.Conv_and_destroy_or_keep;
    }
  }

  /** */
  static squeeze_pointwise_excitation_and_keep( inputTensor ) {
    let t0, t1;

//!!! ...unfinished... (2022/05/18)
    t0 = this.squeezeDepthwise( inputTensor );

    t1 = this.intermediatePointwise( t0 );  t0.dispose();
    t0 = this.excitationPointwise( t1 );    t1.dispose();
    t1 = tf.mul( inputTensor, t0 );         t0.dispose();

    return t1;
  }

//!!! ...unfinished... (2022/05/18)


  /** Call this.pfnOperation_and_keep() and then dispose inputTensor. */
  static operation_and_destroy( inputTensor ) {
    let t0 = this.pfnSqueezeExcitation_and_keep( inputTensor );
    inputTensor.dispose();
    return t0;
  }

}
