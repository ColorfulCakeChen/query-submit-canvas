export { Depthwise };

import * as Pool from "../../util/Pool.js";
import * as TwoTensors from "../../util/TwoTensors.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ReturnOrClone from "../ReturnOrClone.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import { FiltersArray_BiasesArray } from "../Depthwise/Depthwise_FiltersArray_BiasesArray.js";
import { Base } from "./Operation_Base.js";

/**
 * Handle depthwise convolution, bias and activation.
 *
 * @member {boolean} bExisted
 *   If true, this depthwise operation exists. The same as this.bDepthwise.
 *
 * @member {boolean} bDepthwise
 *   If true, this depthwise operation exists. The same as this.bExisted.
 *
 * @member {boolean} bDepthwiseAvg
 *   If true, this depthwise operation exists. And it is depthwise average pooling.
 *
 * @member {boolean} bDepthwiseMax
 *   If true, this depthwise operation exists. And it is depthwise maximum pooling.
 *
 * @member {boolean} bDepthwiseConv
 *   If true, this depthwise operation exist. And it is depthwise convolution.
 *
 * @member {boolean} bInitOk
 *   If true, the init() is successful.
 *
 * @member {function} pfnOperation
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method calls one of
 * return_input_directly(), keep_input_return_copy(), Avg_and_destroy(), Avg_and_keep(), Max_and_destroy(), Max_and_keep(),
 * Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 * @member {function} apply
 *   This is a method. It processes this.input0.realTensor as inputTensor and puts to this.output0.realTensor as outputTensor. The
 * inputTensor (tf.tensor3d) represents the image ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d)
 * represents the result. All intermediate tensors will be disposed. The inputTensor may or may not be disposed. In fact, this method 
 * calls one of output0_return_input0_directly(), output0_return_input0_cloned(), Operation_and_destroy_or_keep(),
 * OperationBias_and_destroy_or_keep(), OperationActivation_and_destroy_or_keep(), OperationBiasActivation_and_destroy_or_keep()
 * according to the parameters.
 *
 * @see Operration.Base
 * @see Depthwise.FiltersArray_BiasesArray
 */
class Depthwise extends Base( FiltersArray_BiasesArray( TwoTensors.filtersTensor4d_biasesTensor3d( ReturnOrClone.Root ) ) ) {

  /**
   * Used as default Operation.Depthwise provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Operation.Depthwise.Pool", Depthwise, Depthwise.setAsConstructor );

  /**
   */
  constructor(
    inputTensorPlaceholder0,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent ) {

    super(
      inputTensorPlaceholder0, null, 1,
      inputTensorPlaceholder0.height, inputTensorPlaceholder0.width, inputTensorPlaceholder0.channelCount,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent, inputTensorPlaceholder0.channelCount_lowerHalf );

    Depthwise.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor(
    inputTensorPlaceholder0,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId, nPassThroughStyleId,
    nHigherHalfDifferent ) {

    super.setAsConstructor(
      inputTensorPlaceholder0, null, 1,
      inputTensorPlaceholder0.height, inputTensorPlaceholder0.width, inputTensorPlaceholder0.channelCount,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId, nPassThroughStyleId,
      nHigherHalfDifferent, inputTensorPlaceholder0.channelCount_lowerHalf );

    Depthwise.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
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
    // A1: The reason is to avoid keeping it as this.inputWeightArray so that it could be released by memory garbage collector.
    //
    // Q2: Why are not filtersWeights and biasesWeights kept in this?
    // A2: So that inputWeightArray could be released.


    // 1. Determine operation functions.
    Depthwise.setup_bDepthwise_pfn.call( this );

    let bExtractOk;
    if ( !this.bDepthwise ) {
      bExtractOk = true; // 2. no operation at all. No depthwise (e.g. zero or negative number) (so no channel multiplier, too).

      this.weightElementOffsetBegin = this.weightElementOffsetEnd = weightElementOffsetBegin;
      this.weightElementExtractedCount = 0;

      // Bypass previous to next.
      //
      // Note: The .outputX and .inputX should always be different object (but can have the same content).
      //       Otherwise, the apply() will destroy the content of .inputX (especially when keep-input-tensor).
      this.output0.set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( this.input0 );

    } else { // 3.

      bExtractOk = super.init( inputWeightArray, weightElementOffsetBegin, this.input0.scaleBoundsArray );
      if ( bExtractOk ) {
        try {

!!! ...unfinished... (2022/07/05)
// The .shape of tf.tensor (i.e. this.filtersTensor4d, this.biasesTensor3d) will keep the this.filtersShape (which is a Recyclable.Array)
// That is a problem because here will recycle the .filtersShape and .biasesShape.

          if ( this.filtersShape && this.filtersArray ) {
            this.filtersTensor4d = tf.tensor( this.filtersArray, this.filtersShape );
            this.filtersShape.disposeResources_and_recycleToPool(); this.filtersShape = null; // Release for reducing memory usage.
            this.filtersArray.disposeResources_and_recycleToPool(); this.filtersArray = null;
          }

          if ( this.biasesShape && this.biasesArray ) {
            this.biasesTensor3d = tf.tensor( this.biasesArray, this.biasesShape );
            this.biasesShape.disposeResources_and_recycleToPool(); this.biasesShape = null; // Release for reducing memory usage.
            this.biasesArray.disposeResources_and_recycleToPool(); this.biasesArray = null;
          }

          this.output0.set_height_width_channelCount_scaleBoundsArray(
            this.outputHeight,
            this.outputWidth,
            this.outputChannelCount,
            this.outputChannelCount_lowerHalf,
            this.outputChannelCount_higherHalf,
            this.boundsArraySet.output0
          );

          // Release for reducing memory usage. (Since it has been inside the output tensor placeholder.)
          {
            this.boundsArraySet.output0 = null; // Because it has already been transferred to TensorPlaceholder this.output0
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
    this.pfnActivation = null;
    this.pfnOperation = null;

    // If these properties does not exist, assigning value (even undefined) to them will create them. Avoid it.
    {
      if ( this.bDepthwiseAvg != undefined )
        this.bDepthwiseAvg = undefined;

      if ( this.bDepthwiseMax != undefined )
        this.bDepthwiseMax = undefined;

      if ( this.bDepthwiseConv != undefined )
        this.bDepthwiseConv = undefined;
    }

    this.bDepthwise = undefined;
    this.bKeepInputTensor = undefined;

    super.disposeResources(); // Release filtersTensor4d and biasesTensor3d.
  }

  /**
   * Adjust this.pfnOperation (and this.apply if need) so that this.pfnOperation() and this.apply()
   * will or will not dispose its inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {

//!!! (2022/06/23 Remarked) It seems no this problem now.
//     // So that do nothing if disposeResources() has been called (i.e. .pfnOperation has been cleared).
//     //
//     // This could happen when Operation.TwinArray.disposeResources() which cause TensorPlaceholder.finalOperationOld.setKeepInputTensor()
//     // called.
//     //
//     if ( !this.bInitOk )
//       return;

    if ( bKeepInputTensor == this.bKeepInputTensor )
      return;

    this.bKeepInputTensor = bKeepInputTensor;
    if ( bKeepInputTensor ) {

      switch ( this.pfnOperation ) {

        // Just clone input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
        // Note: apply should not be changed here because there might be bias and activation.
        case Depthwise.return_input_directly: this.pfnOperation = Depthwise.keep_input_return_copy; break;

        case Depthwise.Avg_and_destroy:       this.pfnOperation = Depthwise.Avg_and_keep;  break;
        case Depthwise.Max_and_destroy:       this.pfnOperation = Depthwise.Max_and_keep;  break;
        case Depthwise.Conv_and_destroy:      this.pfnOperation = Depthwise.Conv_and_keep; break;

        // Just clone input if unknown depthwise operation.
        // Since there is no operation at all, let apply ignore pfnOperation completely.
        default:
          throw Error( `Unknown depthwise operation (${this.pfnOperation}) when setKeepInputTensor( ${bKeepInputTensor} )` );
          this.pfnOperation = Depthwise.keep_input_return_copy;
          this.apply = Depthwise.output0_return_input0_cloned;
          break;
      }

    } else {

      switch ( this.pfnOperation ) {

        // Just return input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
        // Note: apply should not be changed here because there might be bias and activation.
        case Depthwise.keep_input_return_copy: this.pfnOperation = Depthwise.return_input_directly; break;

        case Depthwise.Avg_and_keep:           this.pfnOperation = Depthwise.Avg_and_destroy;  break;
        case Depthwise.Max_and_keep:           this.pfnOperation = Depthwise.Max_and_destroy;  break;
        case Depthwise.Conv_and_keep:          this.pfnOperation = Depthwise.Conv_and_destroy; break;

        // Just return input if unknown depthwise operation.
        // Since there is no operation at all, let apply ignore pfnOperation completely.
        default:
          throw Error( `Unknown depthwise operation (${this.pfnOperation}) when setKeepInputTensor( ${bKeepInputTensor} )` );
          this.pfnOperation = Depthwise.return_input_directly;
          this.apply = Depthwise.output0_return_input0_directly;
          break;
      }

    }
  }

  get bExisted() {
    return this.bDepthwise;
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

  /** Determine this.bDepthwiseXxx and this.pfnXxx data members.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static setup_bDepthwise_pfn() {
    this.bKeepInputTensor = false; // (Because this method will arrange function pointer as not-keep-input-tensor.)

    // 1.
    if ( this.AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

      // if 1x1 AVG pooling ( and strides is 1 ), or 1x1 MAX pooling ( and strides is 1 ), or illegal pooling type (i.e. not AVG, not MAX):
      //   - As no depthwise operation (i.e. ( this.bDepthwise == false ) )
      //   - Just return input (i.e. ( this.pfnOperation == Depthwise.return_input_directly ) )

      // When 1x1 AVG or MAX pooling (and strides is 1), the result of depthwise operation (not include bias and activation) is the same as input.
      let bOperationResultSameAsInput = ( ( 1 == this.filterHeight ) && ( 1 == this.filterWidth ) && ( 1 == this.strides ) );

      switch ( this.AvgMax_Or_ChannelMultiplier ) {
        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG:
          this.bDepthwise = this.bDepthwiseAvg = true;
          if ( bOperationResultSameAsInput )
            this.pfnOperation = Depthwise.return_input_directly; // For speeding up performance. (Note: It might still has bias and/or activation.)
          else
            this.pfnOperation = Depthwise.Avg_and_destroy;
          break;

        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX:
          this.bDepthwise = this.bDepthwiseMax = true;
          if ( bOperationResultSameAsInput )
            this.pfnOperation = Depthwise.return_input_directly; // For speeding up performance. (Note: It might still has bias and/or activation.)
          else
            this.pfnOperation = Depthwise.Max_and_destroy;
          break;
      }

    } else if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).
      this.bDepthwise = this.bDepthwiseConv = true;

      this.pfnOperation = Depthwise.Conv_and_destroy; // will dispose inputTensor.

    } else { // No depthwise (e.g. zero or negative number) (so no channel multiplier).
      this.bDepthwise = false;
    }

    // 2.
    this.pfnActivation = Depthwise.ActivationFunction_getById( this.nActivationId );

    // 3.
    if ( this.bDepthwise ) {
      if ( this.bBias ) {
        if ( this.pfnActivation )
          this.apply = Depthwise.OperationBiasActivation_and_destroy_or_keep;
        else
          this.apply = Depthwise.OperationBias_and_destroy_or_keep;
      } else {
        if ( this.pfnActivation )
          this.apply = Depthwise.OperationActivation_and_destroy_or_keep;
         else
          this.apply = Depthwise.Operation_and_destroy_or_keep;
      }
    } else {
      // Since there is no operation at all, let apply ignore pfnOperation completely.
      this.apply = Depthwise.output0_return_input0_directly;
      this.pfnOperation = Depthwise.return_input_directly;
    }
  }


  /** Depthwise Average Pooling. */
  static Avg_and_keep( inputTensor ) {
    return tf.pool( inputTensor, this.poolWindowShape, "avg", this.pad, 1, this.strides ); // dilations = 1
  }

  static Avg_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.poolWindowShape, "avg", this.pad, 1, this.strides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Max Pooling. */
  static Max_and_keep( inputTensor ) {
    return tf.pool( inputTensor, this.poolWindowShape, "max", this.pad, 1, this.strides ); // dilations = 1
  }

  static Max_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.poolWindowShape, "max", this.pad, 1, this.strides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Convolution. */
  static Conv_and_keep( inputTensor ) {
    return tf.depthwiseConv2d( inputTensor, this.filtersTensor4d, this.strides, this.pad );
  }

  static Conv_and_destroy( inputTensor ) {
    let t = tf.depthwiseConv2d( inputTensor, this.filtersTensor4d, this.strides, this.pad );
    inputTensor.dispose();
    return t;
  }


  /** Depthwise Operation, Bias and Activation. */
  static Operation_and_destroy_or_keep() {
    this.output0.realTensor = this.pfnOperation( this.input0.realTensor ); // may destroy or keep.
  }

  static OperationBias_and_destroy_or_keep() {
    let t0 = this.pfnOperation( this.input0.realTensor ); // may destroy or keep.

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    this.output0.realTensor = t1;
  }

  static OperationActivation_and_destroy_or_keep() {
    let t0 = this.pfnOperation( this.input0.realTensor ); // may destroy or keep.

    let t1 = this.pfnActivation( t0 );
    t0.dispose();

    this.output0.realTensor = t1;
  }

  static OperationBiasActivation_and_destroy_or_keep() {
    let t0 = this.pfnOperation( this.input0.realTensor ); // may destroy or keep.

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    t0 = this.pfnActivation( t1 );
    t1.dispose();

    this.output0.realTensor = t0;
  }

}

