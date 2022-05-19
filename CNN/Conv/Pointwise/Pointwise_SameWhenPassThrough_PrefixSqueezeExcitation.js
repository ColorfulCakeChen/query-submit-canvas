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

//!!! ...unfinished... (2022/05/19) ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.Xxx


 * @member {number} nSqueezeExcitationChannelCountDivisor
 *   An integer which is the channel count divisor for intermediate pointwise convolution channel count.
 *
 *     - If ( nSqueezeExcitationChannelCountDivisor < 0 ), there will be no squeeze-and-excitation.
 *         (ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-1))
 *
 *     - If ( nSqueezeExcitationChannelCountDivisor == 0 ), there will be squeeze-and-excitation with only one pointwise convolution
 *         (i.e. excitation pointwise convolution). 
 *         (ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.ONE_EXCITATION (0)) 
 *
 *     - If ( nSqueezeExcitationChannelCountDivisor > 0 ), there will be squeeze-and-excitation with two pointwise convolutions
 *         (i.e. intermediate pointwise convolution, and excitation pointwise convolution).
 *
 * @member {number} inputHeight
 *   The height of the input tensor. If one of inputHeight and inputWidth is not positive (<= 0), there will be no squeeze step
 * (i.e. no global average pooling). This is only used when ( nSqueezeExcitationChannelCountDivisor >= 0 ) (i.e. has
 * squeeze-and-excitation).
 *
 * @member {number} inputWidth
 *   The width of the input tensor. If one of inputHeight and inputWidth is not positive (<= 0), there will be no squeeze step
 * (i.e. no global average pooling). This is only used when ( nSqueezeExcitationChannelCountDivisor >= 0 ) (i.e. has
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
 * @member {boolean} bSqueezeExcitation
 *   Whether squeeze-and-excitation exists. It will be true if ( nSqueezeExcitationChannelCountDivisor >= 0 ).
 *
 * @member {boolean} bSqueeze
 *   Whether squeeze-and-excitation has squeeze. It will be true if ( nSqueezeExcitationChannelCountDivisor >= 0 ) and ( inputHeight > 0 )
 * and ( inputWidth > 0). It is only meaningful when ( bSqueezeExcitation == true ).
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

//!!! ...unfinished... (2022/05/19)

 * of Base.???() according to the parameters.
 *
 * @see SqueezeExcitation.Base
 * @see Pointwise.SameWhenPassThrough
 *
 */
class SameWhenPassThrough_PrefixSqueezeExcitation {

//!!! ...unfinished... (2022/05/19)

  /**
   */
  constructor(
    nSqueezeExcitationChannelCountDivisor, inputHeight, inputWidth,
    inputChannelCount, outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    this.nSqueezeExcitationChannelCountDivisor = nSqueezeExcitationChannelCountDivisor;
    this.inputHeight = inputHeight;
    this.inputWidth = inputWidth;
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.nHigherHalfDifferent = nHigherHalfDifferent;
    this.inputChannelCount_lowerHalf = inputChannelCount_lowerHalf;
    this.outputChannelCount_lowerHalf = outputChannelCount_lowerHalf;
    this.channelShuffler_outputGroupCount = channelShuffler_outputGroupCount;

    // ( nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) (-1)      
    this.bSqueezeExcitation = ( nSqueezeExcitationChannelCountDivisor >= 0 );
    this.bSqueeze = ( this.bSqueezeExcitation ) && ( inputHeight > 0 ) && ( inputWidth > 0);
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
    Base.setup_pfn.call( this );

    // 2. Initialize sub-operations.

    // 2.1 squeezeExcitation
    let squeezeExcitation_boundsArraySet_output0;
    if ( this.bSqueezeExcitation ) {
      this.squeezeExcitation = new SqueezeExcitation.Base(
        this.nSqueezeExcitationChannelCountDivisor, this.inputHeight, this.inputWidth,
        this.inputChannelCount, this.nActivationId,
        this.nHigherHalfDifferent, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf );

      if ( !this.squeezeExcitation.init( inputFloat32Array, this.byteOffsetEnd, inputScaleBoundsArray ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = this.squeezeExcitation.byteOffsetEnd;

      this.tensorWeightCountTotal += this.squeezeExcitation.tensorWeightCountTotal;
      this.tensorWeightCountExtracted += this.squeezeExcitation.tensorWeightCountExtracted;

      squeezeExcitation_boundsArraySet_output0 = this.squeezeExcitation.boundsArraySet.output0;
    } else {
      squeezeExcitation_boundsArraySet_output0 = inputScaleBoundsArray;
    }

    // 2.2 pointwise
    {
      this.pointwise = new SameWhenPassThrough(
        this.inputChannelCount, this.outputChannelCount, this.bBias, this.nActivationId,
        this.nHigherHalfDifferent,
        this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf,
        this.channelShuffler_outputGroupCount );

      if ( !this.pointwise.init( inputFloat32Array, this.byteOffsetEnd, squeezeExcitation_boundsArraySet_output0 ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = this.excitationPointwise.byteOffsetEnd;

      this.tensorWeightCountTotal += this.pointwise.tensorWeightCountTotal;
      this.tensorWeightCountExtracted += this.pointwise.tensorWeightCountExtracted;
    }

    // 3. BoundsArraySet
    {
      { // Build self BoundsArraySet.
        this.boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray, null,
          this.pointwise.boundsArraySet.output0.channelCount, 0 );

        this.boundsArraySet.set_outputs_all_byBoundsArraySet_Outputs( this.pointwise.boundsArraySet );
      }

      this.dispose_all_sub_BoundsArraySet(); // For reduce memory footprint.
    }

    this.bInitOk = true;
    return this.bInitOk;
  }

  /** Release all tensors. */
  disposeTensors() {
    if ( this.squeezeExcitation ) {
      this.squeezeExcitation.disposeTensors();
      this.squeezeExcitation = null;
    }

    if ( this.pointwise ) {
      this.pointwise.disposeTensors();
      this.pointwise = null;
    }

    this.tensorWeightCountTotal = this.tensorWeightCountExtracted = 0;
    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /**
   * Release all BoundsArraySet of squeezeExcitation, pointwise.
   *
   * This could reduce memory footprint.
   *
   * (Note: This Pointwise.SameWhenPassThrough_PrefixSqueezeExcitation's BoundsArraySet is kept.)
   */
  dispose_all_sub_BoundsArraySet() {
    delete this.squeezeExcitation?.boundsArraySet;
    delete this.pointwise.boundsArraySet;
  }


//!!! ...unfinished... (2022/05/19)

  /**
   * The sub operations' setKeepInputTensor() will be called so that only the first operation is responsible for keeping inputTensor.
   * All other operations should always destroy inputTensor..
   *
   */
  setKeepInputTensor( bKeepInputTensor ) {
    if ( bKeepInputTensor == this.bKeepInputTensor )
      return;

    this.bKeepInputTensor = bKeepInputTensor;
    if ( bKeepInputTensor ) {


//!!! ...unfinished... (2022/05/19)

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



//!!! ...unfinished... (2022/05/19)

  /** Determine data member this.apply.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static setup_pfn() {

//!!! ...unfinished... (2022/05/19)

    if ( this.squeezeDepthwise ) {
      if ( this.intermediatePointwise ) {
        this.apply = Base.squeeze_intermediate_excitation;
      } else {
        this.apply = Base.squeeze_excitation;
      }
    } else {
      if ( this.intermediatePointwise ) {
        this.apply = Base.intermediate_excitation;
      } else {
        this.apply = Base.excitation;
      }
    }
  }



//!!! ...unfinished... (2022/05/19)

  /** */
  static squeeze_intermediate_excitation( inputTensor ) {

//!!! ...unfinished... (2022/05/19)

    let t0, t1;
    t0 = this.squeezeDepthwise.apply( inputTensor );
    t1 = this.intermediatePointwise.apply( t0 );
    t0 = this.excitationPointwise.apply( t1 );

    t1 = tf.mul( inputTensor, t0 );
    t0.dispose();
    return t1;
  }

}
