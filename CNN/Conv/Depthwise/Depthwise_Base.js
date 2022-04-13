export { Base };

// import * as FloatValue from "../../Unpacker/FloatValue.js";
 import * as ValueDesc from "../../Unpacker/ValueDesc.js";
// import * as Weights from "../../Unpacker/Weights.js";
import * as TwoTensors from "../../util/TwoTensors.js";
import * as ReturnOrClone_Activation from "../ReturnOrClone_Activation.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { FiltersArray_BiasesArray } from "./Depthwise_FiltersArray_BiasesArray.js";

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
 * Base.return_input_directly(), Base.keep_input_return_copy(), Avg_and_destroy(), Avg_and_keep(), Max_and_destroy(), Max_and_keep(),
 * Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 * @member {function} pfnOperationBiasActivation
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensors may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Operation_and_destroy_or_keep(), OperationBias_and_destroy_or_keep(),
 * OperationActivation_and_destroy_or_keep(), OperationBiasActivation_and_destroy_or_keep() according to the parameters.
 *
 * @see FiltersArray_BiasesArray
 */
class Base extends FiltersArray_BiasesArray( TwoTensors.filtersTensor4d_biasesTensor3d( ReturnOrClone_Activation.Base ) ) {

  /**
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf ) {

    super(
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
      bBias, nActivationId,
      nHigherHalfDifferent, inputChannelCount_lowerHalf );

  }

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous convolution-bias-activation value bounds
   * set of this depthwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why are not filtersWeights and biasesWeights kept in this?
    // A2: So that inputFloat32Array could be released.

    this.disposeTensors();

    // 1.

    // 1.1 Determine operation functions.
    Base.Setup_bDepthwise_pfn.call( this );

    let bExtractOk;
    if ( !this.bDepthwise ) {
      bExtractOk = true; // 2. no operation at all. No depthwise (e.g. zero or negative number) (so no channel multiplier, too).

      this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;
      this.tensorWeightCountExtracted = this.tensorWeightCountTotal = 0;

      this.boundsArraySet = new BoundsArraySet.Depthwise( inputScaleBoundsArray, inputScaleBoundsArray.channelCount );
      this.boundsArraySet.output0.set_all_byScaleBoundsArray( inputScaleBoundsArray ); // Bypass previous to next.

    } else {

      bExtractOk = super.init( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray );
      if ( bExtractOk ) {
        try {
          if ( this.filtersShape && this.filtersArray ) {
            this.filtersTensor4d = tf.tensor( this.filtersArray, this.filtersShape );
            this.filtersArray = null; // Release for reducing memory usage.
          }

          if ( this.biasesShape && this.biasesArray ) {
            this.biasesTensor3d = tf.tensor( this.biasesArray, this.biasesShape );
            this.biasesArray = null; // Release for reducing memory usage.
          }

        } catch ( e ) {  // If failed (e.g. memory not enough), return false.      
          bExtractOk = false;
        }
      }

//!!! (2022/02/21 Remarked) integrated into super class .init()
//
// //!!! ...unfinished... (2021/11/12) What if ( bHigherHalfDifferent == true ) when average/maximum pooling?
// // when ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE?
//
//       if ( this.bDepthwiseAvg || this.bDepthwiseMax ) { // 3. Depthwise by AVG or MAX pooling (so no channel multiplier).
//         bExtractOk = Base.extractAs_AvgMaxPooling.call( this, inputFloat32Array );
//
//       } else if ( this.bDepthwiseConv ) { // 4. Depthwise by convolution (with channel multiplier).
//
// //!!! ...unfinished... (2021/12/26)
// // The boundsArraySet.activationEscaping_ScaleTranslateSet.undo should also be applied to the real filter value and bias value of
// // this convolution-bias (either normal or pass-through or depthwise2).
// //
// // Problem: What if this convolution-bias-activation could only undo partially (e.g. this convolution does not have bias)?
// //
//
//         switch ( this.nHigherHalfDifferent ) {
//           case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0) 4.0 Normal depthwise convolution.
//             bExtractOk = Base.extractAs_NormalDepthwise.call( this, inputFloat32Array );
//             break;
//
//           case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2: // (1) 4.1 bHigherHalfDepthwise2
//             bExtractOk = Base.extractAs_HigherHalfDepthwise2.call( this, inputFloat32Array );
//             break;
//
//           case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (2) 4.2 bHigherHalfPassThrough
//             bExtractOk = Base.extractAs_HigherHalfPassThrough.call( this, inputFloat32Array );
//             break;
//
//           default:
//             tf.util.assert( false,
//               `Depthwise.Base.init(): `
//                 + `Unknown nHigherHalfDifferent ( {this.nHigherHalfDifferent} ) `
//                 + `( ${ValueDesc.Depthwise_HigherHalfDifferent.Singleton.getStringOf( this.nHigherHalfDifferent )} ) `
//                 + `value.`
//             );
//             break;
//         }
//       }
    }

    this.bInitOk = bExtractOk;
    return this.bInitOk;
  }

  /** Release tensors.
   */
  disposeTensors() {
    super.disposeTensors(); // Release filtersTensor4d and biasesTensor3d.

    this.pfnOperationBiasActivation = this.pfnOperation = this.pfnActivation = null;

    // If these properties does not exist, assigning value (even undefined) to them will create them. Avoid it.
    {
      if ( this.bDepthwiseAvg )
        this.bDepthwiseAvg = undefined;

      if ( this.bDepthwiseMax )
        this.bDepthwiseMax = undefined;

      if ( this.bDepthwiseConv )
        this.bDepthwiseConv = undefined;
    }

    this.bDepthwise = false;
    this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /**
   * Adjust this.pfnOperation (and this.pfnOperationBiasActivation if need) so that this.pfnOperation() and this.pfnOperationBiasActivation()
   * will or will not dispose its inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {
    if ( bKeepInputTensor == this.bKeepInputTensor )
      return;

    this.bKeepInputTensor = bKeepInputTensor;
    if ( bKeepInputTensor ) {

      switch ( this.pfnOperation ) {

        // Just clone input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
        // Note: pfnOperationBiasActivation should not be changed here because there might be bias and activation.
        case Base.return_input_directly: this.pfnOperation = Base.keep_input_return_copy; break;

        case Base.Avg_and_destroy:       this.pfnOperation = Base.Avg_and_keep;  break;
        case Base.Max_and_destroy:       this.pfnOperation = Base.Max_and_keep;  break;
        case Base.Conv_and_destroy:      this.pfnOperation = Base.Conv_and_keep; break;

        // Just clone input if unknown depthwise operation.
        // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
        default:                         this.pfnOperation = this.pfnOperationBiasActivation = Base.keep_input_return_copy;
          tf.util.assert( false, `Unknown depthwise operation. (${this.pfnOperation}) when setKeepInputTensor( ${bKeepInputTensor} )` );
          break;
      }

    } else {

      switch ( this.pfnOperation ) {

        // Just return input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
        // Note: pfnOperationBiasActivation should not be changed here because there might be bias and activation.
        case Base.keep_input_return_copy: this.pfnOperation = Base.return_input_directly; break;

        case Base.Avg_and_keep:           this.pfnOperation = Base.Avg_and_destroy;  break;
        case Base.Max_and_keep:           this.pfnOperation = Base.Max_and_destroy;  break;
        case Base.Conv_and_keep:          this.pfnOperation = Base.Conv_and_destroy; break;

        // Just return input if unknown depthwise operation.
        // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
        default:                          this.pfnOperation = this.pfnOperationBiasActivation = Base.return_input_directly;
          tf.util.assert( false, `Unknown depthwise operation. (${this.pfnOperation}) when setKeepInputTensor( ${bKeepInputTensor} )` );
          break;
      }

    }
  }

  get bExisted() {
    return this.bDepthwise;
  }

  /** Determine this.bDepthwiseXxx and this.pfnXxx data members.
   *
   * @param {Base} this
   *   The Base object to be determined and modified.
   */
  static Setup_bDepthwise_pfn() {

    // 1.
    if ( this.AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

      // if 1x1 AVG pooling ( and strides is 1 ), or 1x1 MAX pooling ( and strides is 1 ), or illegal pooling type (i.e. not AVG, not MAX):
      //   - As no depthwise operation (i.e. ( this.bDepthwise == false ) )
      //   - Just return input (i.e. ( this.pfnOperation == Base.return_input_directly ) )

      // When 1x1 AVG or MAX pooling (and strides is 1), the result of depthwise operation (not include bias and activation) is the same as input.
      let bOperationResultSameAsInput = ( ( 1 == this.filterHeight ) && ( 1 == this.filterWidth ) && ( 1 == this.strides ) );

      switch ( this.AvgMax_Or_ChannelMultiplier ) {
        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG:
          this.bDepthwise = this.bDepthwiseAvg = true;
          if ( bOperationResultSameAsInput )
            this.pfnOperation = Base.return_input_directly; // For speeding up performance. (Note: It might still has bias and/or activation.)
          else
            this.pfnOperation = Base.Avg_and_destroy;
          break;

        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX:
          this.bDepthwise = this.bDepthwiseMax = true;
          if ( bOperationResultSameAsInput )
            this.pfnOperation = Base.return_input_directly; // For speeding up performance. (Note: It might still has bias and/or activation.)
          else
            this.pfnOperation = Base.Max_and_destroy;
          break;
      }

    } else if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).
      this.bDepthwise = this.bDepthwiseConv = true;

      this.pfnOperation = Base.Conv_and_destroy; // will dispose inputTensor.

    } else { // No depthwise (e.g. zero or negative number) (so no channel multiplier).
      this.bDepthwise = false;
    }

    // 2.
    this.pfnActivation = Base.ActivationFunction_getById( this.nActivationId );

    // 3.
    if ( this.bDepthwise ) {
      if ( this.bBias ) {
        if ( this.pfnActivation )
          this.pfnOperationBiasActivation = Base.OperationBiasActivation_and_destroy_or_keep;
        else
          this.pfnOperationBiasActivation = Base.OperationBias_and_destroy_or_keep;
      } else {
        if ( this.pfnActivation )
          this.pfnOperationBiasActivation = Base.OperationActivation_and_destroy_or_keep;
         else
          this.pfnOperationBiasActivation = Base.Operation_and_destroy_or_keep;
      }
    } else {
      // Since there is no operation at all, let pfnOperationBiasActivation ignore pfnOperation completely.
      this.pfnOperationBiasActivation = this.pfnOperation = Base.return_input_directly;
    }
  }

//!!! (2022/02/21 Remarked) integrated into super class .init()

//   /**
//    * Extract depthwise convolution filters from inputFloat32Array (at this.byteOffsetEnd). The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *
//    * @param {Base} this                       The Base object to be modified.
//    * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
//    * @param {number} filterHeight             The height of the depthwise convolution filters.
//    * @param {number} filterWidth              The width of the depthwise convolution filters.
//    * @param {number} inputChannelCount        The input channel count of the depthwise convolution filters.
//    * @param {number} channelMultiplier        The channel multiplier of the depthwise convolution filters.
//    *
//    * @return {tf.tensor4d}                    The extracted depthwise filters. Return null, if failed.
//    */
//   static extractFilters( inputFloat32Array, filterHeight, filterWidth, inputChannelCount, channelMultiplier ) {
//     let filtersShape = [ filterHeight, filterWidth, inputChannelCount, channelMultiplier ];
//     return Base.extractTensor.call( this, inputFloat32Array, filtersShape );
//   }

//   /**
//    * Extract biases of average/maximum pooling from inputFloat32Array.
//    *
//    * The following data members will be used:
//    *   - this.byteOffsetEnd
//    *   - this.filterHeight
//    *   - this.filterWidth
//    *   - this.inputChannelCount
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount
//    *   - this.inputChannelCount_toBeExtracted
//    *   - this.outputChannelCount_toBeExtracted
//    *   - this.biasesTensor3d
//    *
//    * @param {Base} this                       The Base object to be modified.
//    * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
//    *
//    * @return {boolean}                        Return true, if succeeded. Return false, if failed.
//    */
//   static extractAs_AvgMaxPooling( inputFloat32Array ) {

//     this.outputChannelCount = this.inputChannelCount; // No channel multiplier.

//     this.poolWindowShape = [ this.filterHeight, this.filterWidth ];

//     // In normal depthwise avg/max pooling, use specified specified channel count as extracted channel count.
//     // Although they are not used to extract avg/max filters, they will be used for extracting bias.
//     this.inputChannelCount_toBeExtracted = this.inputChannelCount;
//     this.outputChannelCount_toBeExtracted = this.outputChannelCount;

//     if ( this.bBias ) {
//       this.biasesTensor3d = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_toBeExtracted );
//       if ( !this.biasesTensor3d )
//         return false;
//     }

//     return true;
//   }

//   /**
//    * Extract filters and biases of normal dethwise convolution from inputFloat32Array.
//    *
//    * The following data members will be used:
//    *   - this.byteOffsetEnd
//    *   - this.filterHeight
//    *   - this.filterWidth
//    *   - this.inputChannelCount
//    *   - this.AvgMax_Or_ChannelMultiplier
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount
//    *   - this.inputChannelCount_toBeExtracted
//    *   - this.outputChannelCount_toBeExtracted
//    *   - this.filtersTensor4d
//    *   - this.biasesTensor3d
//    *
//    * @param {Base} this                       The Base object to be modified.
//    * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
//    *
//    * @return {boolean}                        Return true, if succeeded. Return false, if failed.
//    */
//   static extractAs_NormalDepthwise( inputFloat32Array ) {

//     this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

//     this.inputChannelCount_toBeExtracted = this.inputChannelCount;
//     this.outputChannelCount_toBeExtracted = this.outputChannelCount;

//     this.filtersTensor4d = Base.extractFilters.call( this, inputFloat32Array,
//       this.filterHeight, this.filterWidth, this.inputChannelCount_toBeExtracted, this.AvgMax_Or_ChannelMultiplier );

//     if ( !this.filtersTensor4d )
//       return false;

//     if ( this.bBias ) {
//       this.biasesTensor3d = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_toBeExtracted );
//       if ( !this.biasesTensor3d )
//         return false;
//     }

//     return true;
//   }

//   /**
//    * Extract filters and biases of HigherHalfDepthwise2 from inputFloat32Array.
//    *
//    * The following data members will be used:
//    *   - this.byteOffsetEnd
//    *   - this.filterHeight
//    *   - this.filterWidth
//    *   - this.inputChannelCount
//    *   - this.inputChannelCount_lowerHalf
//    *   - this.AvgMax_Or_ChannelMultiplier
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount
//    *   - this.inputChannelCount_toBeExtracted
//    *   - this.outputChannelCount_toBeExtracted
//    *   - this.filtersTensor4d
//    *   - this.biasesTensor3d
//    *
//    * @param {Base} this                       The Base object to be modified.
//    * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
//    *
//    * @return {boolean}                        Return true, if succeeded. Return false, if failed.
//    */
//   static extractAs_HigherHalfDepthwise2( inputFloat32Array ) {

//     this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

//     tf.util.assert( ( this.inputChannelCount_lowerHalf > 0 ),
//       `Depthwise.Base.extractAs_HigherHalfDepthwise2(): `
//         + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) must be positive.`
//     );

//     this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;

//     this.outputChannelCount_lowerHalf = this.inputChannelCount_lowerHalf * this.AvgMax_Or_ChannelMultiplier;
//     this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

//     // Extract filters and biases for the specified channel count, but in different sequence.
//     this.inputChannelCount_toBeExtracted = this.inputChannelCount;
//     this.outputChannelCount_toBeExtracted = this.outputChannelCount;

//     // The extraction order is important: filter1, bias1, filter2, bias2.
//     //
//     // In ShuffleNetV2's head, the filters and biases of depthwise2 are after depthwise1. In ShuffleNetV2_ByMobileNetV1's
//     // head, although depthwise1 and depthwise2 are combined into depthwise1, they should be extracted in sequence and
//     // then combined. So that they could use the same filters and biases weights array to generate the same result.
//     let filtersTensor4d_lowerHalf, biasesTensor3d_lowerHalf, filtersTensor4d_higherHalf, biasesTensor3d_higherHalf;
//     try {
//       filtersTensor4d_lowerHalf = Base.extractFilters.call( this, inputFloat32Array,
//         this.filterHeight, this.filterWidth, this.inputChannelCount_lowerHalf, this.AvgMax_Or_ChannelMultiplier );

//       if ( !filtersTensor4d_lowerHalf )
//         return false;

//       if ( this.bBias ) {
//         biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );
//         if ( !biasesTensor3d_lowerHalf )
//           return false;
//       }

//       filtersTensor4d_higherHalf = Base.extractFilters.call( this, inputFloat32Array,
//         this.filterHeight, this.filterWidth, this.inputChannelCount_higherHalf, this.AvgMax_Or_ChannelMultiplier );

//       if ( !filtersTensor4d_higherHalf )
//         return false;

//       if ( this.bBias ) {
//         biasesTensor3d_higherHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_higherHalf );
//         if ( !biasesTensor3d_higherHalf )
//           return false;
//       }

//       // Combine lower-half and higher-half.
//       let allFiltersArray = [ filtersTensor4d_lowerHalf, filtersTensor4d_higherHalf ];
// //!!! (2021/11/10 Remarked)
// //      this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. channel axis; axis id 3).
//       this.filtersTensor4d = tf.concat( allFiltersArray, 2 ); // Along the last second axis (i.e. input channel axis; axis id 2).

//       if ( this.bBias ) {
//         let allBiasesArray = [ biasesTensor3d_lowerHalf, biasesTensor3d_higherHalf ];
//         this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).
//       }

//     } catch ( e ) {
//       return false; // e.g. memory not enough.

//     } finally {

//       if ( biasesTensor3d_higherHalf )
//         biasesTensor3d_higherHalf.dispose();

//       if ( filtersTensor4d_higherHalf )
//         filtersTensor4d_higherHalf.dispose();

//       if ( biasesTensor3d_lowerHalf )
//         biasesTensor3d_lowerHalf.dispose();

//       if ( filtersTensor4d_lowerHalf )
//         filtersTensor4d_lowerHalf.dispose();
//     }

//     return true;
//   }

//   /**
//    * Extract filters and biases of HigherHalfPassThrough from inputFloat32Array.
//    *
//    * The following data members will be used:
//    *   - this.byteOffsetEnd
//    *   - this.filterHeight
//    *   - this.filterWidth
//    *   - this.inputChannelCount
//    *   - this.inputChannelCount_lowerHalf
//    *   - this.AvgMax_Or_ChannelMultiplier
//    *   - this.inputHeight
//    *   - this.inputWidth
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount
//    *   - this.inputChannelCount_toBeExtracted
//    *   - this.outputChannelCount_toBeExtracted
//    *   - this.filtersTensor4d
//    *   - this.biasesTensor3d
//    *
//    * @param {Base} this                       The Base object to be modified.
//    * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
//    *
//    * @return {boolean}                        Return true, if succeeded. Return false, if failed.
//    */
//   static extractAs_HigherHalfPassThrough( inputFloat32Array ) {

//     this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

//     tf.util.assert( ( this.inputChannelCount_lowerHalf > 0 ),
//       `Depthwise.Base.extractAs_HigherHalfPassThrough(): `
//         + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) must be positive.`
//     );

//     this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;

//     this.outputChannelCount_lowerHalf = this.inputChannelCount_lowerHalf * this.AvgMax_Or_ChannelMultiplier;
//     this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

//     // Just extract filters and biases for half of the specified channel count.
//     this.inputChannelCount_toBeExtracted = this.inputChannelCount_lowerHalf;
//     this.outputChannelCount_toBeExtracted = this.outputChannelCount_lowerHalf;

//     let higherHalfPassThrough;
//     try {

//       // The other half is just filters and biases for pass-through.
//       higherHalfPassThrough = new PassThrough(
//         this.inputHeight, this.inputWidth, this.inputChannelCount_higherHalf,
//         this.AvgMax_Or_ChannelMultiplier, this.filterHeight, this.filterWidth, this.stridesPad, this.bBias,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.scale,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.translate
//       );

//       if ( !higherHalfPassThrough.bInitOk )
//         return false;

//       let filtersTensor4d_lowerHalf;
//       try {
//         filtersTensor4d_lowerHalf = Base.extractFilters.call( this, inputFloat32Array,
//           this.filterHeight, this.filterWidth, this.inputChannelCount_lowerHalf, this.AvgMax_Or_ChannelMultiplier );

//         if ( !filtersTensor4d_lowerHalf )
//           return false;

//         let allFiltersArray = [ filtersTensor4d_lowerHalf, higherHalfPassThrough.filtersTensor4d ];
// //!!! (2021/11/10 Remarked)
// //      this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. channel axis; axis id 3).
//         this.filtersTensor4d = tf.concat( allFiltersArray, 2 ); // Along the last second axis (i.e. input channel axis; axis id 2).

//       } finally {
//         if ( filtersTensor4d_lowerHalf )
//           filtersTensor4d_lowerHalf.dispose();
//       }

//       if ( this.bBias ) {
//         let biasesTensor3d_lowerHalf;
//         try {
//           biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );
//           if ( !biasesTensor3d_lowerHalf )
//             return false;

//           let allBiasesArray = [ biasesTensor3d_lowerHalf, higherHalfPassThrough.biasesTensor3d ];
//           this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).

//         } finally {
//           if ( biasesTensor3d_lowerHalf )
//             biasesTensor3d_lowerHalf.dispose();
//         }
//       }

//     } catch ( e ) {
//       return false; // e.g. memory not enough.

//     } finally {

//       if ( higherHalfPassThrough ) {
//         higherHalfPassThrough.disposeTensors();
//       }

//     }

//     return true;
//   }

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
  static Operation_and_destroy_or_keep( inputTensor ) {
    return this.pfnOperation( inputTensor ); // may destroy or keep.
  }

  static OperationBias_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnOperation( inputTensor ); // may destroy or keep.

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    return t1;
  }

  static OperationActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnOperation( inputTensor ); // may destroy or keep.

    let t1 = this.pfnActivation( t0 );
    t0.dispose();

    return t1;
  }

  static OperationBiasActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnOperation( inputTensor ); // may destroy or keep.

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    t0 = this.pfnActivation( t1 );
    t1.dispose();

    return t0;
  }

}
