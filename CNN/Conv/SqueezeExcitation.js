export { Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as BoundsArraySet from "./BoundsArraySet.js";
import * as ReturnOrClone from "../ReturnOrClone.js";
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
// o should undo previous activation  escaping scale
// o when pass-through, filter = 0, bias = 1 (not: filter 1, bias 0)
// o even if there is pass-through, it is not necessary to activation escaping scale.
// o The bounds array set of output (which is input multiplied by squeeze-and-excitation) should include squeeze-and-excitation.
//   However, the activation escaping scale should be the same as input's activation escaping scale.
//   So that the next operation (e.g. pointwise2) could restore the correct input (with squeeze-and-excitation) 。
//
// PASS_THROUGH_STYLE_FILTER_1_BIAS_0_ACTIVATION_ESCAPING
// PASS_THROUGH_STYLE_FILTER_0_BIAS_1_ACTIVATION_NO_ESCAPING



//!!! ...unfinished... (2022/05/23)
// Since multiply is useful in squeeze-and-excitation, what about divide.
// e.g. tf.mul( input, x ) replaced by tf.div( input, tf.abs( x ) + 1 )
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
 * @member {number} nSqueezeExcitationChannelCountDivisor
 *   An integer represents the channel count divisor for squeeze-and-excitation's intermediate pointwise convolution channel count.
 *
 *     - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-2)
 *       - no squeeze, no excitation, no multiply.
 *       - This object is just a no-op.
 *
 *     - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION_1 (-1)
 *       - no squeeze.
 *       - no intermediate excitation. ( intermediateChannelCount = 0 )
 *       - has only one pointwise convolution (i.e. excitation pointwise convolution). 
 *
 *     - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.SQUEEZE_EXCITATION_1 (0)
 *       - has squeeze. 
 *       - no intermediate excitation. ( intermediateChannelCount = 0 )
 *       - has only one pointwise convolution (i.e. excitation pointwise convolution). 
 *
 *     - ( nSqueezeExcitationChannelCountDivisor > 0 )
 *       - has squeeze. 
 *       - has intermediate excitation. ( intermediateChannelCount = Math.ceil( inputChannelCount / nSqueezeExcitationChannelCountDivisor ) )
 *       - has two pointwise convolutions (i.e. intermediate pointwise convolution, and excitation pointwise convolution).
 *
 * @member {number} inputHeight
 *   The height of the input tensor. (Please see also bSqueeze explanation.)
 *
 * @member {number} inputWidth
 *   The width of the input tensor. (Please see also bSqueeze explanation.)
 *
 * @member {number} inputChannelCount
 *   The channel count of the input tensor. It must be greater than zero (> 0).
 *
 * @member {ValueDesc.Pointwise_HigherHalfDifferent} nPointwise_HigherHalfDifferent
 *   The HigherHalfDifferent type for pointwise convolution in squeeze-and-excitation.
 *
 * @member {boolean} bExisted
 *   If true, this squeeze-and-excitation exists. If false, this object is a no-op (i.e. no squeeze, no excitation, no multiply).
 *
 * @member {number} intermediateChannelCount
 *   The channel count of intermediate pointwise convolution.
 *
 *     - If ( nSqueezeExcitationChannelCountDivisor <= 0 ), it will be 0 (i.e. no intermediate pointwise convolution).
 *       - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-2)
 *       - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION_1 (-1)
 *       - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.SQUEEZE_EXCITATION_1 (0)
 *
 *     - If ( nSqueezeExcitationChannelCountDivisor > 0 ), it will be Math.ceil( inputChannelCount / nSqueezeExcitationChannelCountDivisor ).
 *
 * @member {number} outputChannelCount
 *   Always the same as inputChannelCount.
 *
 * @member {boolean} bSqueeze
 *   Whether squeeze (i.e. global average pooling) exists. It will be false in the following cases:
 *
 *     - ( nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) (-2)
 *       - since this object is just a no-op.
 *
 *     - ( nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION_1 ) (-1)
 *       - squeeze is not required.
 *
 *     - ( inputHeight <= 0 ) or ( inputWidth <= 0 )
 *       - squeeze can not be done.
 *
 *     - ( inputHeight == 1 ) and ( inputWidth == 1 )
 *       - squeeze is not necessary. (already squeezed.)
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
 * of Base.squeeze_intermediate_excitation(), Base.squeeze_excitation(), Base.intermediate_excitation(), Base.excitation(),
 * according to the parameters.
 *
 */
class Base extends ReturnOrClone.Base {

  /**
   *
   */
  constructor(
    nSqueezeExcitationChannelCountDivisor, inputHeight, inputWidth,
    inputChannelCount, nActivationId,
    nPointwise_HigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf ) {

    this.nSqueezeExcitationChannelCountDivisor = nSqueezeExcitationChannelCountDivisor;
    this.inputHeight = inputHeight;
    this.inputWidth = inputWidth;
    this.inputChannelCount = inputChannelCount;
    this.nActivationId = nActivationId;
    this.nPointwise_HigherHalfDifferent = nPointwise_HigherHalfDifferent;
    this.inputChannelCount_lowerHalf = inputChannelCount_lowerHalf;
    this.outputChannelCount_lowerHalf = outputChannelCount_lowerHalf;

    tf.util.assert( ( inputChannelCount > 0 ),
      `SqueezeExcitation.Base.constructor(): `
        + `inputChannelCount ( ${inputChannelCount} ) should be greater than zero (> 0).`
    );
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
    Base.setup_bExisted.call( this );
    Base.setup_intermediateChannelCount.call( this );
    Base.setup_outputChannelCount.call( this );
    Base.setup_bSqueeze.call( this );
    Base.setup_pfn.call( this );

    if ( !this.bExisted ) { // 2. no operation at all.
      this.boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray, null, inputScaleBoundsArray.channelCount );
      this.boundsArraySet.output0.set_all_byScaleBoundsArray( inputScaleBoundsArray ); // Bypass previous to next.

    } else { // 3.

      // 3.1 Initialize sub-operations.

      // Note: Inside squeeze-and-excitation, all depthwsie and pointwise convolutions are constant-when-pass-through.
      //       So that the result for pass-through parts will not affect input when multiply to input.
      //

      // 3.1.1 squeezeDepthwise
      let squeezeDepthwise_boundsArraySet_output0;
      if ( this.bSqueeze ) {
        this.squeezeDepthwise = new Depthwise.ConstantWhenPassThrough(
          this.inputHeight, this.inputWidth, this.inputChannelCount,
          ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG,    // global average pooling.
          this.inputHeight, this.inputWidth,                          // ( filterSize == inputImageSize ) means global pooling.
          ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID,     // To shrink to ( 1 x 1 ) image, pad should be "valid" (i.e. not "same").
          false,                                                      // (bBias) squeeze has no bias (since it also has no activation).
          ValueDesc.ActivationFunction.Singleton.Ids.NONE,            // (nActivationId) squeeze has no activation.
          ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE, // (global) average pooling must be no higher-half-different.
          -1 // (inputChannelCount_lowerHalf) Used since ValueDesc.Depthwise_HigherHalfDifferent.Singleton.NONE
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

      // 3.1.2 intermediatePointwise
      let intermediatePointwise_boundsArraySet_output0;
      if ( this.intermediateChannelCount > 0 ) {

        // If it has no activation, it could be no bias because the next operation's (i.e. excitationPointwise) bias will achieve it.
        let bBias_intermediatePointwise;
        if ( this.nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
          bBias_intermediatePointwise = false;
        } else {
          bBias_intermediatePointwise = true;
        }

        this.intermediatePointwise = new Pointwise.ConstantWhenPassThrough(
          squeezeDepthwise_boundsArraySet_output0.channelCount,
          this.intermediateChannelCount,
          bBias_intermediatePointwise,
          this.nActivationId,
          this.nPointwise_HigherHalfDifferent,
          this.intermediate_inputChannelCount_lowerHalf, this.intermediate_outputChannelCount_lowerHalf,
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

      // 3.1.3 excitationPointwise
      {
        this.excitationPointwise = new Pointwise.ConstantWhenPassThrough(
          intermediatePointwise_boundsArraySet_output0.channelCount,
          this.outputChannelCount,
          true, // (bBias) the final operation should always have bias (even if no activation).
          this.nActivationId,
          this.nPointwise_HigherHalfDifferent,
          this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,
          0, // Inside squeeze-and-excitation, never shuffle channels. ( channelShuffler_outputGroupCount == 0 ).
        );

        if ( !this.excitationPointwise.init( inputFloat32Array, this.byteOffsetEnd, intermediatePointwise_boundsArraySet_output0 ) )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = this.excitationPointwise.byteOffsetEnd;

        this.tensorWeightCountTotal += this.excitationPointwise.tensorWeightCountTotal;
        this.tensorWeightCountExtracted += this.excitationPointwise.tensorWeightCountExtracted;
      }

      // 3.2 BoundsArraySet
      {
        { // Build self BoundsArraySet.
          this.boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray, null,
            this.excitationPointwise.boundsArraySet.output0.channelCount, 0 );

          this.boundsArraySet.set_outputs_all_byBoundsArraySet_Outputs( this.excitationPointwise.boundsArraySet );

          // The BoundsArraySet for tf.mul() input by excitation.
          //
          // Note: Not multiply_all_byScaleBoundsArray_one() which handles broadcasting across channels. The
          // multiply_all_byScaleBoundsArray_all() already can handle broadcasting in the same channel.
          //
          this.boundsArraySet.output0.multiply_all_byScaleBoundsArray_all( inputScaleBoundsArray );
        }

        this.dispose_all_sub_BoundsArraySet(); // For reduce memory footprint.
      }
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
   * The sub operations' setKeepInputTensor() will be called so that only the first operation is responsible for keeping inputTensor.
   * All other operations should always destroy inputTensor..
   *
   */
  setKeepInputTensor( bKeepInputTensor ) {
    if ( bKeepInputTensor == this.bKeepInputTensor )
      return;

    this.bKeepInputTensor = bKeepInputTensor;

    if ( this.bExisted ) {

      // Note: The first operation is responsible for keeping inputTensor. All other operations should always destroy inputTensor.
      if ( bKeepInputTensor ) {
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

    } else { // There is no operation at all.
      if ( bKeepInputTensor ) {
        this.apply = Base.keep_input_return_copy;
      } else {
        this.apply = Base.return_input_directly;
      }
    }
  }


  /** Determine data member this.bExisted
   *
   * @param {Base} this  The Base object to be determined and modified.
   */
  static setup_bExisted() {
    if ( this.nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) { // (-2)
      this.bExisted = false;
    } else {
      this.bExisted = true;
    }
  }

  /** Determine data member this.intermediateChannelCount
   *
   * @param {Base} this  The Base object to be determined and modified.
   */
  static setup_intermediateChannelCount() {
    if ( this.nSqueezeExcitationChannelCountDivisor <= 0 ) {
      this.intermediateChannelCount = this.intermediate_inputChannelCount_lowerHalf = this.intermediate_outputChannelCount_lowerHalf = 0;
    } else {
      this.intermediateChannelCount
        = Math.ceil( this.inputChannelCount / this.nSqueezeExcitationChannelCountDivisor );
      this.intermediate_inputChannelCount_lowerHalf
        = Math.ceil( this.inputChannelCount_lowerHalf / this.nSqueezeExcitationChannelCountDivisor );
      this.intermediate_outputChannelCount_lowerHalf
        = Math.ceil( this.outputChannelCount_lowerHalf / this.nSqueezeExcitationChannelCountDivisor );
    }
  }

  /** Determine data member this.outputChannelCount
   *
   * @param {Base} this  The Base object to be determined and modified.
   */
  static setup_outputChannelCount() {
    this.outputChannelCount = this.inputChannelCount; // For squeeze-and-excitation, output channel count is always the same as input.
  }

  /** Determine data member this.bSqueeze
   *
   * @param {Base} this  The Base object to be determined and modified.
   */
  static setup_bSqueeze() {
    if (
            // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-2), no-op.
            // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION_1 (-1), squeeze is not required.
            //
            ( this.nSqueezeExcitationChannelCountDivisor < 0 )

         || ( ( this.inputHeight <= 0 ) || ( this.inputWidth <= 0 ) ) // squeeze can not be done.
         || ( ( this.inputHeight == 1 ) && ( this.inputWidth == 1 ) ) // squeeze is not necessary. (already squeezed.)
       ) {

      this.bSqueeze = false;
    } else {
      this.bSqueeze = true;
    }
  }

  /** Determine data member this.apply.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static setup_pfn() {
    if ( this.bExisted ) {
      if ( this.bSqueeze ) {
        if ( this.intermediateChannelCount > 0 ) {
          this.apply = Base.squeeze_intermediate_excitation;
        } else {
          this.apply = Base.squeeze_excitation;
        }
      } else {
        if ( this.intermediateChannelCount > 0 ) {
          this.apply = Base.intermediate_excitation;
        } else {
          this.apply = Base.excitation;
        }
      }
    } else { // There is no operation at all.
      this.apply = Base.return_input_directly;
    }
  }


  /** */
  static squeeze_intermediate_excitation( inputTensor ) {
    let t0, t1;
    t0 = this.squeezeDepthwise.apply( inputTensor );
    t1 = this.intermediatePointwise.apply( t0 );
    t0 = this.excitationPointwise.apply( t1 );

    t1 = tf.mul( inputTensor, t0 );
    t0.dispose();
    return t1;
  }

  /** */
  static squeeze_excitation( inputTensor ) {
    let t0, t1;
    t0 = this.squeezeDepthwise.apply( inputTensor );
    t1 = this.excitationPointwise.apply( t0 );

    t0 = tf.mul( inputTensor, t1 );
    t1.dispose();
    return t0;
  }

  /** */
  static intermediate_excitation( inputTensor ) {
    let t0, t1;
    t0 = this.intermediatePointwise.apply( inputTensor );
    t1 = this.excitationPointwise.apply( t0 );

    t0 = tf.mul( inputTensor, t1 );
    t1.dispose();
    return t0;
  }

  /** */
  static excitation( inputTensor ) {
    let t0, t1;
    t0 = this.excitationPointwise.apply( inputTensor );

    t1 = tf.mul( inputTensor, t0 );
    t0.dispose();
    return t1;
  }

}
