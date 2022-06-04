export { Pointwise };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as TwoTensors from "../../util/TwoTensors.js";
import * as ReturnOrClone from "../ReturnOrClone.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { FiltersArray_BiasesArray } from "../Pointwise/Pointwise_FiltersArray_BiasesArray.js";
import { Base } from "./Operation_Base.js";

/**
 * Handle pointwise convolution (1x1 conv2d), bias and activation.
 *
 *
 * @member {boolean} bExisted
 *   If true, this pointwise convolution exists. The same as this.bPointwise.
 *
 * @member {boolean} bPointwise
 *   If true, this pointwise convolution exists. The same as this.bExisted.
 *
 * @member {boolean} bInitOk
 *   If true, the init() is successful.
 *
 * @member {function} pfnConv
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method calls one of
 * return_input_directly(), keep_input_return_copy(), Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 * @member {function} apply
 *   This is a method. It processes this.input0.realTensor as inputTensor and puts to this.output0.realTensor as outputTensor. The
 * inputTensor (tf.tensor3d) represents the image ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d)
 * represents the result. All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method 
 * calls one of output0_return_input0_directly(), output0_return_input0_cloned(), Conv_and_destroy_or_keep(),
 * ConvBias_and_destroy_or_keep(), ConvActivation_and_destroy_or_keep(), ConvBiasActivation_and_destroy_or_keep()
 * according to the parameters.
 *
 * @see Operration.Base
 * @see Pointwise.FiltersArray_BiasesArray
 */
class Pointwise extends Base( TwoTensors.filtersTensor4d_biasesTensor3d( ReturnOrClone.Base() ) ) {

//!!! (2022/06/04 Remarked) inputTensorPlaceholder0 has input info.
//   /**
//    */
//   constructor(
//     inputTensorPlaceholder0,
//     inputChannelCount, outputChannelCount, bBias, nActivationId, nPassThroughStyleId,
//     nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {
//
//     super(
//       inputTensorPlaceholder0, null, 1,
//       inputChannelCount, outputChannelCount, bBias, nActivationId, nPassThroughStyleId,
//       nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );
//   }

  /**
   */
  constructor(
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super( inputTensorPlaceholder0, null, 1 );

    this.theFiltersArray_BiasesArray = new FiltersArray_BiasesArray(
      inputTensorPlaceholder0.channelCount, outputChannelCount, bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent, inputTensorPlaceholder0.channelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );
  }


  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin, arrayTemp_forInterleave_asGrouptTwo ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why not keep filtersWeights and biasesWeights in data members of this?
    // A2: Their underlying ArrayBuffer is inputFloat32Array.buffer. If this.filtersWeights and this.biasesWeights are kept,
    //     the inputFloat32Array.buffer could not be released by memory garbage collector.

    this.disposeTensors();

    // 1. Determine operation functions.
    Pointwise.setup_bPointwise_pfn.call( this );

    let bExtractOk;
    if ( !this.bPointwise ) {
      bExtractOk = true; // 2. no operation at all.

      this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;
      this.tensorWeightCountExtracted = this.tensorWeightCountTotal = 0;

//!!! (2022/06/04 Remarked) Already in TensorPlaceholder
//       this.boundsArraySet = new BoundsArraySet.Pointwise( inputScaleBoundsArray, inputScaleBoundsArray.channelCount );
//       this.boundsArraySet.output0.set_all_byScaleBoundsArray( inputScaleBoundsArray ); // Bypass previous to next.

      // Bypass previous to next.
      //
      // Note: The .outputX and .inputX should always be different object (but can have the same content).
      //       Otherwise, the apply() will destroy the content of .inputX (especially when keep-input-tensor).
      this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input0 );

    } else { // 3.

      bExtractOk = this.theFiltersArray_BiasesArray.init(
        inputFloat32Array, byteOffsetBegin, this.input0.scaleBoundsArray, arrayTemp_forInterleave_asGrouptTwo );

      if ( bExtractOk ) {
        try {
          if ( this.theFiltersArray_BiasesArray.filtersShape && this.theFiltersArray_BiasesArray.filtersArray ) {
            this.filtersTensor4d = tf.tensor( this.theFiltersArray_BiasesArray.filtersArray, this.theFiltersArray_BiasesArray.filtersShape );

//!!! (2022/06/04 Remarked) Release all theFiltersArray_BiasesArray instead.
//            this.filtersShape = this.filtersArray = null; // Release for reducing memory usage.
          }

          if ( this.theFiltersArray_BiasesArray.biasesShape && this.theFiltersArray_BiasesArray.biasesArray ) {
            this.biasesTensor3d = tf.tensor( this.theFiltersArray_BiasesArray.biasesArray, this.theFiltersArray_BiasesArray.biasesShape );

//!!! (2022/06/04 Remarked) Release all theFiltersArray_BiasesArray instead.
//            this.biasesShape = this.biasesArray = null; // Release for reducing memory usage.
          }

          this.output0.set_height_width_channelCount_scaleBoundsArray(
            this.input0.height, // (Pointwise convolution does not change height.)
            this.input0.width,   // (Pointwise convolution does not change width.)
            this.theFiltersArray_BiasesArray.outputChannelCount,
            this.theFiltersArray_BiasesArray.outputChannelCount_lowerHalf,
            this.theFiltersArray_BiasesArray.outputChannelCount_higherHalf,
            this.theFiltersArray_BiasesArray.boundsArraySet.output0
          );

          this.theFiltersArray_BiasesArray.filtersShape = null; // Release for reducing memory usage.

        } catch ( e ) {  // If failed (e.g. memory not enough), return false.      
          bExtractOk = false;
        }
      }

    }

    this.bInitOk = bExtractOk;
    return this.bInitOk;
  }

  disposeTensors() {
    super.disposeTensors(); // Release filtersTensor4d and biasesTensor3d.

    this.apply = this.pfnConv = this.pfnActivation = null;

    this.bPointwise = false;
    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /**
   * Adjust this.pfnConv (and this.apply if need) so that this.pfnConv() and this.apply() will or will not
   * dispose its inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {
    if ( bKeepInputTensor == this.bKeepInputTensor )
      return;

    this.bKeepInputTensor = bKeepInputTensor;

    if ( this.bExisted ) {
      if ( bKeepInputTensor ) {
        this.pfnConv = Pointwise.Conv_and_keep;
      } else {
        this.pfnConv = Pointwise.Conv_and_destroy;
      }
    } else {
      // Since there is no operation at all, let apply ignore pfnConv completely.
      if ( bKeepInputTensor ) {
        this.pfnConv = Pointwise.keep_input_return_copy;
        this.apply = Pointwise.output0_return_input0_cloned;
      } else {
        this.pfnConv = Pointwise.return_input_directly;
        this.apply = Pointwise.output0_return_input0_directly;
      }
    }
  }

  get bExisted() {
    return this.bPointwise;
  }

  /** Determine this.bPointwise and this.pfnXxx data members.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static setup_bPointwise_pfn() {

    // 0. Determine whether pointwise operation should exist.
    if ( this.outputChannelCount > 0 ) {
      this.bPointwise = true;

    } else {  // ( outputChannelCount <= 0 )
      if ( this.channelShuffler_outputGroupCount > 0 ) {

//!!! ...unfinished... (2022/05/20)
        // Perhaps, deprecate this special case. Since pointwise2 always exists now.
        // So assert if executed here.
        tf.util.assert( false,
          `Operation.Pointwise.setup_bPointwise_pfn(): `
            + `When outputChannelCount ( ${this.outputChannelCount} ) is not positive, `
            + `channelShuffler_outputGroupCount ( ${this.channelShuffler_outputGroupCount} ) should not be positive.`
        );

        this.bPointwise = true; // all-pass-through-and-channel-shuffling mode. (Otherwise, no way to do channel shuffling.)
        this.bBias = false; // In this case, there is always no biases (no matter how original bBias is).

//!!! ...unfinished... (2022/05/20) What about nActivationId?

      } else {
        this.bPointwise = false;
      }
    }

    // 1.
    this.pfnConv = Pointwise.Conv_and_destroy; // will dispose inputTensor.

    // 2.
    this.pfnActivation = Pointwise.ActivationFunction_getById( this.nActivationId );

    // 3.
    if ( this.bPointwise ) {
      if ( this.bBias ) {
        if ( this.pfnActivation )
          this.apply = Pointwise.ConvBiasActivation_and_destroy_or_keep;
        else
          this.apply = Pointwise.ConvBias_and_destroy_or_keep;
      } else {
        if ( this.pfnActivation )
          this.apply = Pointwise.ConvActivation_and_destroy_or_keep;
         else
          this.apply = Pointwise.Conv_and_destroy_or_keep;
      }
    } else {
      // Since there is no operation at all, let apply ignore pfnConv completely.
      this.pfnConv = Pointwise.return_input_directly;
      this.apply = Pointwise.output0_return_input0_directly;
    }
  }


  /** Pointwise Convolution (1x1). (The inputTensor will not be disposed so that it can be used for achieving skip connection.) */
  static Conv_and_keep( inputTensor ) {
    return tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" ); // 1x1, Stride = 1
  }

  static Conv_and_destroy( inputTensor ) {
    let t = tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" );
    inputTensor.dispose();
    return t;
  }

  
  /** Pointwise Convolution, Bias and Activation. */
  static Conv_and_destroy_or_keep() {
    this.output0.realTensor = this.pfnConv( this.input0.realTensor );
  }

  static ConvBias_and_destroy_or_keep() {
    let t0 = this.pfnConv( this.input0.realTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    this.output0.realTensor = t1;
  }

  static ConvActivation_and_destroy_or_keep() {
    let t0 = this.pfnConv( this.input0.realTensor );

    let t1 = this.pfnActivation( t0 );
    t0.dispose();

    this.output0.realTensor = t1;
  }

  static ConvBiasActivation_and_destroy_or_keep() {
    let t0 = this.pfnConv( this.input0.realTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    t0 = this.pfnActivation( t1 );
    t1.dispose();

    this.output0.realTensor = t0;
  }

}
