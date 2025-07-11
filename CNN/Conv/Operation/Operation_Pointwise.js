export { Pointwise };

import * as Pool from "../../util/Pool.js";
import * as TwoTensors from "../../util/TwoTensors.js";
import * as TableLogger from "../../util/TableLogger.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ReturnOrClone from "../ReturnOrClone.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import { FiltersArray_BiasesArray }
  from "../Pointwise/Pointwise_FiltersArray_BiasesArray.js";
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
 *   This is a method. It has one parameter inputTensor and return a
 * outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor
 * (tf.tensor3d) represents the result. All intermediate tensors will be
 * disposed. The inputTensor may or may not be disposed. In fact, this method
 * calls one of return_input_directly(), keep_input_return_copy(),
 * Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 * @member {function} apply
 *   This is a method. It processes this.input0.realTensor as inputTensor and
 * puts to this.output0.realTensor as outputTensor. The inputTensor
 * (tf.tensor3d) represents the image ( height x width x channel ) which will
 * be processed. The outputTensor (tf.tensor3d) represents the result. All
 * intermediate tensors will be disposed. The inputTensor may or may not be
 * disposed. In fact, this method calls one of
 * output0_return_input0_directly(), output0_return_input0_cloned(),
 * Conv_and_destroy_or_keep(), ConvBias_and_destroy_or_keep(),
 * ConvActivation_and_destroy_or_keep(),
 * ConvBiasActivation_and_destroy_or_keep() according to the parameters.
 *
 * @see Operation.Base
 * @see Pointwise.FiltersArray_BiasesArray
 */
class Pointwise extends Base( FiltersArray_BiasesArray(
  TwoTensors.filtersTensor4d_biasesTensor3d( ReturnOrClone.Root ) ) ) {

  /**
   * Used as default Operation.Pointwise provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "Operation.Pointwise.Pool",
    Pointwise );

  /**
   */
  constructor(
    parentNameable, name, bTableLog,
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf,
    channelShuffler_inputGroupCount, channelShuffler_outputGroupCount ) {

    super(
      parentNameable, name, bTableLog,
      inputTensorPlaceholder0, null, 1,
      inputTensorPlaceholder0.channelCount, outputChannelCount,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent,
      inputTensorPlaceholder0.channelCount_lowerHalf,
      outputChannelCount_lowerHalf,
      channelShuffler_inputGroupCount, channelShuffler_outputGroupCount );

    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor(
    parentNameable, name, bTableLog,
    inputTensorPlaceholder0,
    outputChannelCount, bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent, outputChannelCount_lowerHalf,
    channelShuffler_inputGroupCount, channelShuffler_outputGroupCount ) {

    super.setAsConstructor(
      parentNameable, name, bTableLog,
      inputTensorPlaceholder0, null, 1,
      inputTensorPlaceholder0.channelCount, outputChannelCount,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent,
      inputTensorPlaceholder0.channelCount_lowerHalf,
      outputChannelCount_lowerHalf,
      channelShuffler_inputGroupCount, channelShuffler_outputGroupCount );

    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    // Do nothing.
  }

  /**
   * @param {number[]|Float32Array} inputWeightArray
   *   A number array whose values will be interpreted as weights.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputWeightArray, weightElementOffsetBegin ) {

    // Q1: Why is the inputWeightArray not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputWeightArray so that
    //     it could be released by memory garbage collector.
    //
    // Q2: Why not keep filtersWeights and biasesWeights in data members of
    //     this?
    // A2: Their underlying ArrayBuffer is inputWeightArray.buffer. If
    //     this.filtersWeights and this.biasesWeights are kept,
    //     the inputWeightArray.buffer could not be released by memory garbage
    //     collector.


    // 1. Determine operation functions.
    Pointwise.setup_bPointwise_pfn.call( this );

    let bExtractOk;
    if ( !this.bPointwise ) {
      bExtractOk = true; // 2. no operation at all.

      this.weightElementOffsetBegin = this.weightElementOffsetEnd
        = weightElementOffsetBegin;
      this.weightElementExtractedCount = 0;

      // Bypass previous to next.
      //
      // Note: The .outputX and .inputX should always be different object (but
      //       can have the same content). Otherwise, the apply() will destroy
      //       the content of .inputX (especially when keep-input-tensor).
      this.output0
        .set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder(
          this.input0 );

    } else { // 3.

      bExtractOk = super.init( inputWeightArray,
        weightElementOffsetBegin, this.input0.scaleBoundsArray );
      if ( bExtractOk ) {
        try {

          if ( this.filtersShape && this.filtersArray ) {
            this.filtersTensor4d
              = tf.tensor( this.filtersArray, this.filtersShape );

            // If no need for table log (debug), reduce memory footprint by
            // releasing already used filters array.
            if ( !this.bTableLog ) {
              this.filtersArray.disposeResources_and_recycleToPool();
              this.filtersArray = null; // Release for reducing memory usage.

            } else { // Otherwise, create table log subheader for filters.
              this.TableLog_subheader_for_filters
                = TableLogger.Base.Singleton.subheader_create_for_pointwiseFilters(
                    this.filtersArray,
                    this.filtersShape[ 2 ],   // inDepth
                    this.filtersShape[ 3 ] ); // outDepth
            }

            // Note: Because .filtersShape will be kept by .filtersTensor4d
            //       internally, it can not be released here.
          }

          if ( this.biasesShape && this.biasesArray ) {
            this.biasesTensor3d
              = tf.tensor( this.biasesArray, this.biasesShape );

            // If no need for table log (debug), reduce memory footprint by
            // releasing already used biases array.
            if ( !this.bTableLog ) {
              this.biasesArray.disposeResources_and_recycleToPool();
              this.biasesArray = null; // Release for reducing memory usage.

            } else { // Otherwise, create table log subheader for biases.
              this.TableLog_subheader_for_biases
                = TableLogger.Base.Singleton.subheader_create_for_biases(
                    this.biasesArray,
                    this.biasesShape[ 2 ] ); // Note: Assume biases is tensor3d.
            }

            // Note: Because .biasesShape will be kept by .biasesTensor3d
            //       internally, it can not be released here.
          }

          this.output0.set_height_width_channelCount_scaleBoundsArray(
            this.input0.height, // (Pointwise convolution does not change height.)
            this.input0.width,  // (Pointwise convolution does not change width.)
            this.outputChannelCount,
            this.outputChannelCount_lowerHalf,
            this.outputChannelCount_higherHalf,
            this.boundsArraySet.output0
          );

          // Because it has already been transferred to TensorPlaceholder
          // this.output0
          this.boundsArraySet.output0 = null;

          // If no need for table log (debug), reduce memory footprint by
          // releasing unused (intermediate) bounds array set.
          if ( !this.bTableLog ) {
            this.boundsArraySet.disposeResources_and_recycleToPool();
            this.boundsArraySet = null;
          }

        } catch ( e ) {  // If failed (e.g. memory not enough), return false.      
          bExtractOk = false;
        }
      }

    }

    this.bInitOk = bExtractOk;
    return this.bInitOk;
  }

  /** @override */
  disposeResources() {
    this.TableLog_subheader_for_biases = undefined;
    this.TableLog_subheader_for_filters = undefined;

    this.pfnActivation = null;
    this.pfnConv = null;

    this.bPointwise = undefined;
    this.bKeepInputTensor = undefined;

    super.disposeResources(); // Release filtersTensor4d and biasesTensor3d.
  }

  /**
   * Adjust this.pfnConv (and this.apply if need) so that this.pfnConv() and
   * this.apply() will or will not dispose its inputTensor.
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
      // Since there is no operation at all, let apply ignore pfnConv
      // completely.
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

  /**
   * @override
   */
  get tensorWeightCountExtracted() {
    return this.weightElementExtractedCount;
  }

  /**
   * @override
   */
  get tensorWeightCountTotal() {
    return this.tensorWeightCountTotal_internal;
  }

  /** Determine this.bPointwise and this.pfnXxx data members.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static setup_bPointwise_pfn() {
    // (Because this method will arrange function pointer as
    // not-keep-input-tensor.)
    this.bKeepInputTensor = false;

    // 0. Determine whether pointwise operation should exist.
    if ( this.outputChannelCount > 0 ) {
      this.bPointwise = true;
    } else {  // ( outputChannelCount <= 0 )
      this.bPointwise = false;
    }

    // 1.
    this.pfnConv = Pointwise.Conv_and_destroy; // will dispose inputTensor.

    // 2.
    this.pfnActivation
      = Pointwise.ActivationFunction_get_byId( this.nActivationId );

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
      // Since there is no operation at all, let apply ignore pfnConv
      // completely.
      this.pfnConv = Pointwise.return_input_directly;
      this.apply = Pointwise.output0_return_input0_directly;
    }
  }


  /**
   * Pointwise Convolution (1x1). (The inputTensor will not be disposed so that
   * it can be used for achieving skip connection.)
   */
  static Conv_and_keep( inputTensor ) {

    // 1x1, Stride = 1
    const t0 = tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" );

    if ( this.bTableLog )
      this.TableLog_tensor3d_if_requested(
        "conv",
        this.TableLog_subheader_for_filters,
        t0,
        this.boundsArraySet.afterFilter,
        this.boundsArraySet.bPassThroughArray );

    return t0;
  }

  static Conv_and_destroy( inputTensor ) {
    try {

      const t0 = tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" );

      if ( this.bTableLog )
        this.TableLog_tensor3d_if_requested(
          "conv",
          this.TableLog_subheader_for_filters,
          t0,
          this.boundsArraySet.afterFilter,
          this.boundsArraySet.bPassThroughArray );

      return t0;

    } finally {
      inputTensor.dispose();
    }
  }

  
  /** Pointwise Convolution, Bias and Activation. */
  static Conv_and_destroy_or_keep() {
    if ( this.bTableLog ) {
      const nameString = this.nameString_get();
      console.groupCollapsed( nameString );
    }

    this.output0.realTensor = this.pfnConv( this.input0.realTensor );

    if ( this.bTableLog )
      console.groupEnd();
  }

  static ConvBias_and_destroy_or_keep() {
    if ( this.bTableLog ) {
      const nameString = this.nameString_get();
      console.groupCollapsed( nameString );
    }

    let t0 = this.pfnConv( this.input0.realTensor );

    let t1;
    try {
      t1 = tf.add( t0, this.biasesTensor3d );

      if ( this.bTableLog )
        this.TableLog_tensor3d_if_requested(
          "bias",
          this.TableLog_subheader_for_biases,
          t1,
          this.boundsArraySet.afterBias,
          this.boundsArraySet.bPassThroughArray );

    } finally {
      t0.dispose();
    }

    this.output0.realTensor = t1;

    if ( this.bTableLog )
      console.groupEnd();
  }

  static ConvActivation_and_destroy_or_keep() {
    if ( this.bTableLog ) {
      const nameString = this.nameString_get();
      console.groupCollapsed( nameString );
    }

    let t0 = this.pfnConv( this.input0.realTensor );

    let t1;
    try {
      t1 = this.pfnActivation( t0 );

      if ( this.bTableLog )
        // Use .output0.scaleBoundsArray instead of .boundsArraySet.output0
        // (because it has been transferred to there).
        this.TableLog_tensor3d_activation_if_requested(
          this.nActivationId, t1,
          this.output0.scaleBoundsArray,
          this.boundsArraySet.bPassThroughArray );

    } finally {
      t0.dispose();
    }

    this.output0.realTensor = t1;

    if ( this.bTableLog )
      console.groupEnd();
  }

  static ConvBiasActivation_and_destroy_or_keep() {
    if ( this.bTableLog ) {
      const nameString = this.nameString_get();
      console.groupCollapsed( nameString );
    }

    let t0 = this.pfnConv( this.input0.realTensor );

    let t1;
    try {
      t1 = tf.add( t0, this.biasesTensor3d );

      if ( this.bTableLog )
        this.TableLog_tensor3d_if_requested(
          "bias",
          this.TableLog_subheader_for_biases,
          t1,
          this.boundsArraySet.afterBias,
          this.boundsArraySet.bPassThroughArray );

    } finally {
      t0.dispose();
    }

    try {
      t0 = this.pfnActivation( t1 );

      if ( this.bTableLog )
        // Use .output0.scaleBoundsArray instead of .boundsArraySet.output0
        // (because it has been transferred to there).
        this.TableLog_tensor3d_activation_if_requested(
          this.nActivationId, t0,
          this.output0.scaleBoundsArray,
          this.boundsArraySet.bPassThroughArray );

    } finally {
      t1.dispose();
    }

    this.output0.realTensor = t0;

    if ( this.bTableLog )
      console.groupEnd();
  }

}
