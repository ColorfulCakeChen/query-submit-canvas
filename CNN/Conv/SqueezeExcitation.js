export { Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ActivationEscaping from "./ActivationEscaping.js";
import * as BoundsArraySet from "./BoundsArraySet.js";
import * as Depthwise from "./Depthwise.js";
import * as Pointwise from "./Pointwise.js";


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
 * @member {function} pfnSqueezeExcitation
 *   A method accepts one parameter inputTensor (tf.tensor3d) and return an outputTensor (tf.tensor3d). All intermediate tensors
 * will be disposed. The inputTensor may or may not be disposed (according to setKeepInputTensor()). In fact, this method calls one
 * of Base.Xxx_and_keep() according to the parameters.
 *
 */
class Base {

//!!! ...unfinished... (2022/05/18)
// Perhaps, rename excitationPointwise to excitation2Pointwise, and intermediatePointwise to excitation1Pointwise.

  /**
   *
   */
  constructor(
    inputChannelCount, intermediateChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf ) {

    this.inputChannelCount = inputChannelCount;
    this.intermediateChannelCount = intermediateChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;

    this.nHigherHalfDifferent = nHigherHalfDifferent;
    this.inputChannelCount_lowerHalf = inputChannelCount_lowerHalf;
    this.outputChannelCount_lowerHalf = outputChannelCount_lowerHalf;

    tf.util.assert( ( inputChannelCount > 0 ),
      `SqueezeExcitation.Base.constructor(): `
        + `inputChannelCount ( ${inputChannelCount} ) should be greater than zero (> 0).`
    );

    this.outputChannelCount = this.inputChannelCount, // For squeeze-and-excitation, output channel count is always the same as input.
  }

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous operation value bounds set
   * of this operation. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray ) {

    this.disposeTensors();

    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    // 1. Determine operation functions.
    Base.setup_pfnSqueezeExcitation.call( this );


//!!! ...unfinished... (2022/05/18) bBias?
//  If no activation, it is enough to let the only last operation have ( bBias == true ).
//


    // 2. Initialize sub-operations.

    // Note: Inside squeeze-and-excitation, all depthwsie and pointwise convolutions are constant-when-pass-through.
    //       So that the result for pass-through parts will not affect input when multiply to input.
    //

//!!! ...unfinished... (2022/05/18) squeeze?

    // 2.1
    let squeezeDepthwise_boundsArraySet_output0;
    if (  ) {
      this.squeezeDepthwise = new Depthwise.ConstantWhenPassThrough(

  //!!! ...unfinished... (2022/05/18)
        inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth,

        ???ValueDesc.StridesPad.Singleton.STRIDES_1_PAD_SAME, // (stridesPad)

        bBias, nActivationId, nPassThroughStyleId,
        nHigherHalfDifferent, inputChannelCount_lowerHalf
      );

      if ( !this.squeezeDepthwise.init( inputFloat32Array, this.byteOffsetEnd, inputScaleBoundsArray ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = this.squeezeDepthwise.byteOffsetEnd;

      this.tensorWeightCountTotal += this.squeezeDepthwise.tensorWeightCountTotal;
      this.tensorWeightCountExtracted += this.squeezeDepthwise.tensorWeightCountExtracted;

      squeezeDepthwise_boundsArraySet_output0 = this.squeezeDepthwise.boundsArraySet.output0;
    } else {
      squeezeDepthwise_boundsArraySet_output0 = inputScaleBoundsArray;
    }

    // 2.2
    let intermediatePointwise_boundsArraySet_output0;
    if ( this.intermediateChannelCount > 0 ) {
      this.intermediatePointwise = new Pointwise.ConstantWhenPassThrough(
        squeezeDepthwise_boundsArraySet_output0.channelCount,
        this.intermediateChannelCount,
        this.bBias, this.nActivationId,
        this.nHigherHalfDifferent,

//!!! ...unfinished... (2022/05/18) should half of intermediateChannelCount?
// Could it be restored to inputChannelCount_lowerHalf and outputChannelCount_lowerHalf at excitationPointwise?

        this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,

        0, // Inside squeeze-and-excitation, never shuffle channels. ( channelShuffler_outputGroupCount == 0 ).
      );

      if ( !this.intermediatePointwise.init( inputFloat32Array, this.byteOffsetEnd, squeezeDepthwise_boundsArraySet_output0 ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = this.intermediatePointwise.byteOffsetEnd;

      this.tensorWeightCountTotal += this.intermediatePointwise.tensorWeightCountTotal;
      this.tensorWeightCountExtracted += this.intermediatePointwise.tensorWeightCountExtracted;

      intermediatePointwise_boundsArraySet_output0 = this.intermediatePointwise.boundsArraySet.output0;
    } else {
      intermediatePointwise_boundsArraySet_output0 = squeezeDepthwise_boundsArraySet_output0;
    }

    // 2.3
    {
      this.excitationPointwise = new Pointwise.ConstantWhenPassThrough(
        intermediatePointwise_boundsArraySet_output0.channelCount,
        this.outputChannelCount,
        this.bBias, this.nActivationId,
        this.nHigherHalfDifferent,


//!!! ...unfinished... (2022/05/18) should half of intermediateChannelCount.
        this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,
        0, // Inside squeeze-and-excitation, never shuffle channels. ( channelShuffler_outputGroupCount == 0 ).
      );



      if ( !this.excitationPointwise.init( inputFloat32Array, this.byteOffsetEnd, intermediatePointwise_boundsArraySet_output0 ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = this.excitationPointwise.byteOffsetEnd;

      this.tensorWeightCountTotal += this.excitationPointwise.tensorWeightCountTotal;
      this.tensorWeightCountExtracted += this.excitationPointwise.tensorWeightCountExtracted;
    }

    // 3. BoundsArraySet
    {
      { // Build self BoundsArraySet.
        this.boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray, null,
          this.excitationPointwise.boundsArraySet.output0.channelCount, 0 );

        this.boundsArraySet.set_outputs_all_byBoundsArraySet_Outputs( this.excitationPointwise.boundsArraySet );

        // The BoundsArraySet for tf.mul() input by excitation.
        //
        // Note: Not multiply_all_byScaleBoundsArray_one(). The reason is that it is supported to broadcast in the same channel
        // (i.e. not across channels).
        //
        this.boundsArraySet.output0.multiply_all_byScaleBoundsArray_all( inputScaleBoundsArray );
      }

      this.dispose_all_sub_BoundsArraySet(); // For reduce memory footprint.
    }

    this.bInitOk = true;
    return this.bInitOk;
  }

  /** Release all tensors. */
  disposeTensors() {
    if ( this.squeezeDepthwise ) {
      this.squeezeDepthwise.disposeTensors();
      this.squeezeDepthwise = null;
    }

    if ( this.intermediatePointwise ) {
      this.intermediatePointwise.disposeTensors();
      this.intermediatePointwise = null;
    }

    if ( this.excitationPointwise ) {
      this.excitationPointwise.disposeTensors();
      this.excitationPointwise = null;
    }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /**
   * Release all BoundsArraySet of squeezeDepthwise, intermediatePointwise, excitationPointwise.
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

  /**
   * Adjust this.pfnSqueezeExcitation_and_destroy_or_keep so that it is either:
   *   - the same as this.pfnSqueezeExcitation_and_keep which will not dispose inputTensor. or,
   *   - pointer to Base.operation_and_destroy() which will dispose inputTensor.
   *
   * The sub operations' setKeepInputTensor() will also be called.
   *
   */
  setKeepInputTensor( bKeepInputTensor ) {
    if ( bKeepInputTensor == this.bKeepInputTensor )
      return;

    this.bKeepInputTensor = bKeepInputTensor;
    if ( bKeepInputTensor ) {

      // Note: The first operation is responsible for keep inputTensor. All other operations should always destroy inputTensor.
      if ( this.squeezeDepthwise ) {
        this.squeezeDepthwise.setKeepInputTensor( true );
        this.intermediatePointwise.setKeepInputTensor( false );
        this.excitationPointwise.setKeepInputTensor( false );
      } else {
        if ( this.intermediatePointwise ) {
          this.intermediatePointwise.setKeepInputTensor( true );
          this.excitationPointwise.setKeepInputTensor( false );
        } else {
          this.excitationPointwise.setKeepInputTensor( true );
        }
      }

    } else {
      this.squeezeDepthwise?.setKeepInputTensor( false );
      this.intermediatePointwise?.setKeepInputTensor( false );
      this.excitationPointwise.setKeepInputTensor( false );
    }
  }


  /** Determine data member this.pfnSqueezeExcitation.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static setup_pfnSqueezeExcitation() {
    if ( this.squeezeDepthwise ) {
      if ( this.intermediatePointwise ) {
        this.pfnSqueezeExcitation = Base.squeeze_intermediate_excitation;
      } else {
        this.pfnSqueezeExcitation = Base.squeeze_excitation;
      }
    } else {
      if ( this.intermediatePointwise ) {
        this.pfnSqueezeExcitation = Base.intermediate_excitation;
      } else {
        this.pfnSqueezeExcitation = Base.excitation;
      }
    }
  }


  /** */
  static squeeze_intermediate_excitation( inputTensor ) {
    let t0, t1;
    t0 = this.squeezeDepthwise.pfnOperationBiasActivation( inputTensor );
    t1 = this.intermediatePointwise.pfnConvBiasActivation( t0 );
    t0 = this.excitationPointwise.pfnConvBiasActivation( t1 );

    t1 = tf.mul( inputTensor, t0 );
    t0.dispose();
    return t1;
  }

  /** */
  static squeeze_excitation_and_keep( inputTensor ) {
    let t0, t1;
    t0 = this.squeezeDepthwise.pfnOperationBiasActivation( inputTensor );
    t1 = this.excitationPointwise.pfnConvBiasActivation( t0 );

    t0 = tf.mul( inputTensor, t1 );
    t1.dispose();
    return t0;
  }

  /** */
  static intermediate_excitation_and_keep( inputTensor ) {
    let t0, t1;
    t0 = this.intermediatePointwise.pfnConvBiasActivation( inputTensor );
    t1 = this.excitationPointwise.pfnConvBiasActivation( t0 );

    t0 = tf.mul( inputTensor, t1 );
    t1.dispose();
    return t0;
  }

  /** */
  static excitation_and_keep( inputTensor ) {
    let t0, t1;
    t0 = this.excitationPointwise.pfnConvBiasActivation( inputTensor );

    t1 = tf.mul( inputTensor, t0 );
    t0.dispose();
    return t1;
  }

}
