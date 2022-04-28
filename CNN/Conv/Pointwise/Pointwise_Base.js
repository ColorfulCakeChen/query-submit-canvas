export { Base };

//import * as FloatValue from "../../Unpacker/FloatValue.js";
//import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as Weights from "../../Unpacker/Weights.js";
import * as TwoTensors from "../../util/TwoTensors.js";
import * as ReturnOrClone_Activation from "../ReturnOrClone_Activation.js";
//import * as ChannelShuffler from "../ChannelShuffler.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
import { FiltersArray_BiasesArray } from "./Pointwise_FiltersArray_BiasesArray.js";

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
 * Base.return_input_directly(), Base.keep_input_return_copy(), Conv_and_destroy(), Conv_and_keep() according to the parameters.
 *
 * @member {function} pfnConvBiasActivation
 *   This is a method. It has one parameter inputTensor and return a outputTensor. The inputTensor (tf.tensor3d) represents the image
 * ( height x width x channel ) which will be processed. The outputTensor (tf.tensor3d) represents the result.
 * All intermediate tensors will be disposed. The inputTensors may or may not be disposed. In fact, this method calls one of
 * Base.return_input_directly(), Base.keep_input_return_copy(), Conv_and_destroy_or_keep(), ConvBias_and_destroy_or_keep(),
 * ConvActivation_and_destroy_or_keep(), ConvBiasActivation_and_destroy_or_keep() according to the parameters.
 *
 * @see FiltersArray_BiasesArray
 */
class Base extends FiltersArray_BiasesArray( TwoTensors.filtersTensor4d_biasesTensor3d( ReturnOrClone_Activation.Base ) ) {

  /**
   */
  constructor(
    inputChannelCount, outputChannelCount, bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount ) {

    super(
      inputChannelCount, outputChannelCount, bBias, nActivationId,
      nHigherHalfDifferent, inputChannelCount_lowerHalf, outputChannelCount_lowerHalf, channelShuffler_outputGroupCount );
  }

  /**
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray
   *   The element value bounds (per channel) of input. Usually, it is The .output of the previous convolution-bias-activation value bounds
   * set of this pointwise convolution. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Provide this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray, arrayTemp_forInterleave_asGrouptTwo ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why not keep filtersWeights and biasesWeights in data members of this?
    // A2: Their underlying ArrayBuffer is inputFloat32Array.buffer. If this.filtersWeights and this.biasesWeights are kept,
    //     the inputFloat32Array.buffer could not be released by memory garbage collector.

    this.disposeTensors();

    // 1.

    // 1.1    
    Base.Setup_bPointwise_pfn.call( this );

    let bExtractOk;
    if ( !this.bPointwise ) {
      bExtractOk = true; // 2. no operation at all.

      this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;
      this.tensorWeightCountExtracted = this.tensorWeightCountTotal = 0;

      this.boundsArraySet = new BoundsArraySet.Pointwise( inputScaleBoundsArray, inputScaleBoundsArray.channelCount );
      this.boundsArraySet.output0.set_all_byScaleBoundsArray( inputScaleBoundsArray ); // Bypass previous to next.

    } else { // 3.

      bExtractOk = super.init( inputFloat32Array, byteOffsetBegin, inputScaleBoundsArray, arrayTemp_forInterleave_asGrouptTwo );
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
// //!!! ...unfinished... (2021/12/26)
// // The boundsArraySet.activationEscaping_ScaleTranslateSet.undo should also be applied to the real filter value and bias value of
// // this convolution-bias (either normal or pass-through or copy-lower).
// //
// // Problem: What if this convolution-bias-activation could only undo partially (e.g. this convolution does not have bias)?
// //
//
//       switch ( this.nHigherHalfDifferent ) {
//         // 3.0 Normal pointwise convolution and bias.
//         case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0)
//           bExtractOk = Base.extractAs_NormalPointwise.call( this, inputFloat32Array );
//           break;
//
//         // 3.1 bHigherHalfCopyLowerHalf_LowerHalfPassThrough
//         case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH: // (1)
//           bExtractOk = Base.extractAs_HigherHalfCopyLowerHalf_LowerHalfPassThrough.call( this, inputFloat32Array );
//           break;
//
//         // 3.2 bHigherHalfCopyLowerHalf
//         case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF: // (2)
//           bExtractOk = Base.extractAs_HigherHalfCopyLowerHalf.call( this, inputFloat32Array );
//           break;
//
//         // 3.3 bHigherHalfPointwise22
//         case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_POINTWISE22: // (3)
//           bExtractOk = Base.extractAs_HigherHalfPointwise22.call( this, inputFloat32Array );
//           break;
//
//         // 3.4
//         case ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (4)
//           if ( this.outputChannelCount > 0 ) { // 3.4.1.1 bHigherHalfPassThrough
//             bExtractOk = Base.extractAs_HigherHalfPassThrough.call( this, inputFloat32Array );
//
//           } else { // ( outputChannelCount <= 0 ), // 3.4.2.1 bAllPassThrough
//             bExtractOk = Base.extractAs_AllPassThrough.call( this, inputFloat32Array );
//           }
//
//           // 3.4.1.2 bHigherHalfPassThroughShuffle
//           // 3.4.2.2 bAllPassThroughShuffle
//           if ( bExtractOk ) {
//             if ( this.channelShuffler_outputGroupCount > 0 ) {
//               Base.shuffle_filters_biases.call( this ); // Pre-shuffle channels by shuffling the filters and biases.
//             }
//           }
//           break;
//
//         default:
//           tf.util.assert( ( false ),
//             `Pointwise.init(): `
//               + `nHigherHalfDifferent ( ${this.nHigherHalfDifferent} ) is unknown value.`
//           );
//           break;
//       }
    }

    this.bInitOk = bExtractOk;
    return this.bInitOk;
  }

  disposeTensors() {
    super.disposeTensors(); // Release filtersTensor4d and biasesTensor3d.

    this.pfnConvBiasActivation = this.pfnConv = this.pfnActivation = null;

    this.bPointwise = false;
    this.byteOffsetEnd = -1;
    this.bKeepInputTensor = false;  // Default will dispose input tensor.
    this.bInitOk = false;
  }

  /**
   * Adjust this.pfnConv (and this.pfnConvBiasActivation if need) so that this.pfnConv() and this.pfnConvBiasActivation() will or will not
   * dispose its inputTensor.
   */
  setKeepInputTensor( bKeepInputTensor ) {
    this.bKeepInputTensor = bKeepInputTensor;

    if ( this.bExisted ) {
      if ( bKeepInputTensor ) {
        this.pfnConv = Base.Conv_and_keep;
      } else {
        this.pfnConv = Base.Conv_and_destroy;
      }
    } else {
      // Since there is no operation at all, let pfnConvBiasActivation ignore pfnConv completely.
      if ( bKeepInputTensor ) {
        this.pfnConvBiasActivation = this.pfnConv = Base.keep_input_return_copy;
      } else {
        this.pfnConvBiasActivation = this.pfnConv = Base.return_input_directly;
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
  static Setup_bPointwise_pfn() {

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

//!!! (2022/02/21 Remarked) integrated into super class .init()

//   /**
//    * Extract pointwise convolution filters from inputFloat32Array (at this.byteOffsetEnd). The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *
//    * @param {Base} this                       The Base object to be modified.
//    * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
//    * @param {number} inputChannelCount        The input channel count of the pointwise convolution filters.
//    * @param {number} outputChannelCount       The output channel count of the pointwise convolution filters.
//    *
//    * @return {tf.tensor4d}                    The extracted depthwise filters. Return null, if failed.
//    */
//   static extractFilters( inputFloat32Array, inputChannelCount, outputChannelCount ) {
//     let filtersShape = [ 1, 1, inputChannelCount, outputChannelCount ];
//     return Base.extractTensor.call( this, inputFloat32Array, filtersShape );
//   }

//   /**
//    * Extract filters and biases of normal pointwise convolution from inputFloat32Array.
//    *
//    * The following data members will be used:
//    *   - this.byteOffsetEnd
//    *   - this.inputChannelCount
//    *   - this.outputChannelCount
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount_Real
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
//   static extractAs_NormalPointwise( inputFloat32Array ) {

//     this.outputChannelCount_Real = this.outputChannelCount;

//     // Extract all weights as specified input/output channels.
//     this.inputChannelCount_toBeExtracted = this.inputChannelCount;
//     this.outputChannelCount_toBeExtracted = this.outputChannelCount;

//     this.filtersTensor4d = Base.extractFilters.call( this, inputFloat32Array, this.inputChannelCount, this.outputChannelCount );
//     if ( !this.filtersTensor4d )
//       return false;

//     if ( this.bBias ) {
//       this.biasesTensor3d = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount );
//       if ( !this.biasesTensor3d )
//         return false;
//     }

//     return true;
//   }

//   /**
//    * Extract filters and biases of AllPassThrough from inputFloat32Array.
//    *
//    * The following data members will be used:
//    *   - this.byteOffsetEnd
//    *   - this.inputChannelCount
//    *   - this.outputChannelCount
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount_Real
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
//   static extractAs_AllPassThrough( inputFloat32Array ) {

//     this.bAllPassThrough = true;

//     let higherHalfPassThrough;
//     try {

//       // The real outputChannelCount is the same as inputChannelCount. (Note: this.outputChannelCount is zero here.)
//       this.outputChannelCount_Real = this.inputChannelCount;

//       this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted = 0; // Does not extract any weights.

//       higherHalfPassThrough = new PassThrough(
//         this.inputChannelCount, // Use all (not just higher half) input channels.
//         this.outputChannelCount_Real,
//         0, // Pass through all the input channels.
//         this.bBias,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.scale,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.translate
//       );

//       if ( !higherHalfPassThrough.bInitOk )
//         return false;

//       this.filtersTensor4d = higherHalfPassThrough.filtersTensor4d; // all pass through.
//       this.biasesTensor3d = null; // always does not have biases (no matter how bBias is).

//       higherHalfPassThrough.filtersTensor4d = null; // So that it will not be disposed. (It has been used as this.filtersTensor4d.)

//     } catch ( e ) {
//       return false; // e.g. memory not enough.

//     } finally {

//       if ( higherHalfPassThrough ) {
//         higherHalfPassThrough.disposeTensors();
//       }
//     }

//     return true;
//   }

//   /**
//    * Extract filters and biases of HigherHalfCopyLowerHalf_LowerHalfPassThrough from inputFloat32Array.
//    *
//    * The following data members will be used:
//    *   - this.byteOffsetEnd
//    *   - this.inputChannelCount
//    *   - this.outputChannelCount
//    *   - this.inputChannelCount_lowerHalf
//    *   - this.outputChannelCount_lowerHalf
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount_Real
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
//   static extractAs_HigherHalfCopyLowerHalf_LowerHalfPassThrough( inputFloat32Array ) {

//     this.bHigherHalfCopyLowerHalf_LowerHalfPassThrough = true;

//     let lowerHalfPassThrough, higherHalfPassThrough;
//     try {

//       this.outputChannelCount_Real = this.outputChannelCount;

//       this.inputChannelCount_toBeExtracted = this.outputChannelCount_toBeExtracted = 0; // Does not extract any weights.

//       // Note: In this case, the inputChannelCount_higherHalf is not used.
//       //this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
//       this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

//       lowerHalfPassThrough = new PassThrough(
//         this.inputChannelCount, // Use all (not just lower half) input channels.
//         this.outputChannelCount_lowerHalf,
//         0, // Pass through the lower channels to lower channels (i.e. pass through lower channels).
//         this.bBias,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.scale,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.translate
//       );

//       if ( !lowerHalfPassThrough.bInitOk )
//         return false;

//       higherHalfPassThrough = new PassThrough(
//         this.inputChannelCount, // Use all (not just higher half) input channels.
//         this.outputChannelCount_higherHalf,
//         0, // Pass through the lower channels to higher channels (i.e. copy them to higher channels).
//         this.bBias,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.scale,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.translate
//       );

//       if ( !higherHalfPassThrough.bInitOk )
//         return false;

//       let allFiltersArray = [ lowerHalfPassThrough.filtersTensor4d, higherHalfPassThrough.filtersTensor4d ];
//       this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. outDepth axis; axis id 3).

//       if ( this.bBias ) {
//         let allBiasesArray = [ lowerHalfPassThrough.biasesTensor3d, higherHalfPassThrough.biasesTensor3d ];
//         this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).
//       }

//     } catch ( e ) {
//       return false; // e.g. memory not enough.

//     } finally {
//       if ( higherHalfPassThrough ) {
//         higherHalfPassThrough.disposeTensors();
//       }

//       if ( lowerHalfPassThrough ) {
//         lowerHalfPassThrough.disposeTensors();
//       }
//     }

//     return true;
//   }

//   /**
//    * Extract filters and biases of HigherHalfCopyLowerHalf from inputFloat32Array.
//    *
//    * The following data members will be used:
//    *   - this.byteOffsetEnd
//    *   - this.inputChannelCount
//    *   - this.outputChannelCount
//    *   - this.inputChannelCount_lowerHalf
//    *   - this.outputChannelCount_lowerHalf
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount_Real
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
//   static extractAs_HigherHalfCopyLowerHalf( inputFloat32Array ) {

//     this.bHigherHalfCopyLowerHalf = true;

//     let higherHalfPassThrough;
//     try {

//       this.outputChannelCount_Real = this.outputChannelCount;

//       this.inputChannelCount_toBeExtracted = this.inputChannelCount_lowerHalf;
//       this.outputChannelCount_toBeExtracted = this.outputChannelCount_lowerHalf;

//       this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
//       this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

//       higherHalfPassThrough = new PassThrough(
//         this.inputChannelCount, // Use all (not just higher half) input channels.
//         this.outputChannelCount_higherHalf,
//         0, // Pass through the lower channels to higher channels (i.e. copy them to higher channels).
//         this.bBias,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.scale,
//         this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.translate
//       );

//       if ( !higherHalfPassThrough.bInitOk )
//         return false;

//       {
//         let filtersTensor4d_lowerHalf_expanded;
//         try {
//           let filtersTensor4d_lowerHalf;
//           try {
//             filtersTensor4d_lowerHalf = Base.extractFilters.call( this, inputFloat32Array,
//               this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf );

//             if ( !filtersTensor4d_lowerHalf )
//               return false;

//             // Expand the lower filters (by postfix zeros) so that they accept the whole inputChannelCount as input.
//             filtersTensor4d_lowerHalf_expanded = Base.expandTensor4d_Zeros_AlongAxisId2(
//               filtersTensor4d_lowerHalf, 0, this.inputChannelCount_higherHalf ); // So that accepts inputChannelCount as input.

//             if ( !filtersTensor4d_lowerHalf_expanded )
//               return false;

//           } finally {
//             if ( filtersTensor4d_lowerHalf )
//               filtersTensor4d_lowerHalf.dispose();
//           }

//           let allFiltersArray = [ filtersTensor4d_lowerHalf_expanded, higherHalfPassThrough.filtersTensor4d ];
//           this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. outDepth axis; axis id 3).

//         } finally {
//           if ( filtersTensor4d_lowerHalf_expanded )
//             filtersTensor4d_lowerHalf_expanded.dispose();
//         }
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

//   /**
//    * Extract filters and biases of HigherHalfPointwise22 from inputFloat32Array.
//    *
//    * The following data members will be used:
//    *   - this.byteOffsetEnd
//    *   - this.inputChannelCount
//    *   - this.outputChannelCount
//    *   - this.inputChannelCount_lowerHalf
//    *   - this.outputChannelCount_lowerHalf
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount_Real
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
//   static extractAs_HigherHalfPointwise22( inputFloat32Array ) {

//     this.bHigherHalfPointwise22 = true;

//     this.outputChannelCount_Real = this.outputChannelCount;

//     // Extract all weights as specified input/output channels (just like a normal pointwise convolution, but with a different arrangement).
//     this.inputChannelCount_toBeExtracted = this.inputChannelCount;
//     this.outputChannelCount_toBeExtracted = this.outputChannelCount;

//     this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
//     this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

//     // If the channel count can not be halved (e.g. ( inputChannelCount == 1 ) or ( outputChannelCount == 1 ) ), treated as normal pointwise.
//     if ( ( 0 == this.inputChannelCount_higherHalf ) || ( 0 == this.outputChannelCount_higherHalf ) ) {
//       return Base.extractAs_NormalPointwise.call( this, inputFloat32Array );
//     }

//     let filtersTensor4d_lowerHalf, biasesTensor3d_lowerHalf, filtersTensor4d_higherHalf, biasesTensor3d_higherHalf;
//     let filtersTensor4d_lowerHalf_expanded, filtersTensor4d_higherHalf_expanded;
//     try {
//       // The extracting order is important: lowerHalfFilter, lowerHalfBias, higherHalfFilter, higherHalfBias.
//       {
//         filtersTensor4d_lowerHalf = Base.extractFilters.call( this,
//           inputFloat32Array, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf );

//         if ( !filtersTensor4d_lowerHalf )
//           return false;

//         if ( this.bBias ) {
//           biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );
//           if ( !biasesTensor3d_lowerHalf )
//             return false;
//         }

//         filtersTensor4d_higherHalf = Base.extractFilters.call( this,
//           inputFloat32Array, this.inputChannelCount_higherHalf, this.outputChannelCount_higherHalf );

//         if ( !filtersTensor4d_higherHalf )
//           return false;

//         if ( this.bBias ) {
//           biasesTensor3d_higherHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_higherHalf );
//           if ( !biasesTensor3d_higherHalf )
//             return false;
//         }
//       }

//       // Expand the lower filters (by postfix zeros) and higher filters (by prefix zeros) so that they accept the whole inputChannelCount as input.
//       {
//         filtersTensor4d_lowerHalf_expanded = Base.expandTensor4d_Zeros_AlongAxisId2(
//           filtersTensor4d_lowerHalf, 0, this.inputChannelCount_higherHalf );

//         if ( !filtersTensor4d_lowerHalf_expanded )
//             return false;

//         filtersTensor4d_higherHalf_expanded = Base.expandTensor4d_Zeros_AlongAxisId2(
//           filtersTensor4d_higherHalf, this.inputChannelCount_lowerHalf, 0 ); // So that accepts inputChannelCount as input.

//         if ( !filtersTensor4d_higherHalf_expanded )
//             return false;
//       }

//       // Combine lower and higher into one larger filters and biases.
//       let allFiltersArray = [ filtersTensor4d_lowerHalf_expanded, filtersTensor4d_higherHalf_expanded ];
//       this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. outDepth axis; axis id 3).

//       if ( this.bBias ) {
//         let allBiasesArray = [ biasesTensor3d_lowerHalf, biasesTensor3d_higherHalf ];
//         this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).
//       }

//     } catch ( e ) {
//       return false; // e.g. memory not enough.

//     } finally {
//       if ( filtersTensor4d_higherHalf_expanded )
//         filtersTensor4d_higherHalf_expanded.dispose();

//       if ( filtersTensor4d_lowerHalf_expanded )
//         filtersTensor4d_lowerHalf_expanded.dispose();

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
//    *   - this.inputChannelCount
//    *   - this.outputChannelCount
//    *   - this.inputChannelCount_lowerHalf
//    *   - this.outputChannelCount_lowerHalf
//    *
//    * The following data members will be modified:
//    *   - this.byteOffsetEnd
//    *   - this.tensorWeightCountExtracted
//    *   - this.outputChannelCount_Real
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

//     this.bHigherHalfPassThrough = true;

//     let higherHalf;
//     try {

//       this.outputChannelCount_Real = this.outputChannelCount;

//       this.inputChannelCount_toBeExtracted = this.inputChannelCount_lowerHalf;
//       this.outputChannelCount_toBeExtracted = this.outputChannelCount_lowerHalf;

//       // 1.
//       this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;
//       this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

//       // 2.

//       if ( this.outputChannelCount_higherHalf <= 0 ) {
//         // 2.1 Nothing more needs to be done. (filtersTensor4d_lowerHalf_expanded is enough.)
        
//       } else {

//         if ( this.inputChannelCount_higherHalf <= 0 ) { // 2.2 higherHalfAllZeros
//           higherHalf = new AllZeros( this.inputChannelCount, this.outputChannelCount_higherHalf );
          
//         } else { // 2.3 ( inputChannelCount_higherHalf > 0 ) && ( outputChannelCount_higherHalf > 0 ), higherHalfPassThrough
//           higherHalf = new PassThrough(
//             this.inputChannelCount, // Use all (not just higher half) input channels.
//             this.outputChannelCount_higherHalf,
//             this.outputChannelCount_lowerHalf, // Pass through the higher channels.
//             this.bBias,
//             this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.scale,
//             this.boundsArraySet.activationEscaping_ScaleTranslateSet.do.translate
//           );
//         }

//         if ( !higherHalf.bInitOk )
//           return false;
//       }

//       // 3.
//       {
//         let filtersTensor4d_lowerHalf_expanded;
//         try {
//           let filtersTensor4d_lowerHalf;
//           try {
//             filtersTensor4d_lowerHalf = Base.extractFilters.call( this,
//               inputFloat32Array, this.inputChannelCount_lowerHalf, this.outputChannelCount_lowerHalf );

//             if ( !filtersTensor4d_lowerHalf )
//               return false;

//             // Expand the lower filters (by postfix zeros) so that they accept the whole inputChannelCount as input.
//             filtersTensor4d_lowerHalf_expanded = Base.expandTensor4d_Zeros_AlongAxisId2(
//               filtersTensor4d_lowerHalf, 0, this.inputChannelCount_higherHalf );

//           } finally {
//             if ( filtersTensor4d_lowerHalf )
//               filtersTensor4d_lowerHalf.dispose();
//           }

//           if ( higherHalf ) {
//             let allFiltersArray = [ filtersTensor4d_lowerHalf_expanded, higherHalf.filtersTensor4d ];
//             this.filtersTensor4d = tf.concat( allFiltersArray, 3 ); // Along the last axis (i.e. outDepth axis; axis id 3).
//           } else {
//             this.filtersTensor4d = filtersTensor4d_lowerHalf_expanded;
//             filtersTensor4d_lowerHalf_expanded = null; // So that it will not be disposed now.
//           }

//         } finally {
//           if ( filtersTensor4d_lowerHalf_expanded )
//             filtersTensor4d_lowerHalf_expanded.dispose();
//         }
//       }

//       // 4.
//       if ( this.bBias ) {
//         let biasesTensor3d_lowerHalf;
//         try {
//           biasesTensor3d_lowerHalf = Base.extractBiases.call( this, inputFloat32Array, this.outputChannelCount_lowerHalf );

//           if ( !biasesTensor3d_lowerHalf )
//             return false;

//           if ( higherHalf ) {
//             let allBiasesArray = [ biasesTensor3d_lowerHalf, higherHalf.biasesTensor3d ];
//             this.biasesTensor3d = tf.concat( allBiasesArray, 2 ); // Along the last axis (i.e. channel axis; axis id 2).
//           } else {
//             this.biasesTensor3d = biasesTensor3d_lowerHalf;
//             biasesTensor3d_lowerHalf = null; // So that it will not be disposed now.
//           }

//         } finally {
//           if ( biasesTensor3d_lowerHalf )
//             biasesTensor3d_lowerHalf.dispose();
//         }
//       }

//     } catch ( e ) {
//       return false; // e.g. memory not enough.

//     } finally {
//       if ( higherHalf ) {
//         higherHalf.disposeTensors();
//       }
//     }

//     return true;
//   }

//   /**
//    * Pre-shuffle channels by shuffling the filters and biases.
//    *
//    * The following data members will be modified:
//    *   - this.filtersTensor4d
//    *   - this.biasesTensor3d
//    *
//    * @param {Base} this                       The Base object to be modified.
//    */
//   static shuffle_filters_biases() {

// //!!! ...unfinished... (2021/11/23) What if input (or output) channel count can not be divided by 2 (= outputGroupCount)?

//     if ( this.filtersTensor4d ) { // Shuffle the filters along the last (i.e. channel) axis.
//       let filtersChannelShuffler = new ChannelShuffler.ShuffleInfo( this.filtersTensor4d.shape, this.channelShuffler_outputGroupCount );
//       let filtersTensor4d_shuffled = filtersChannelShuffler.reshapeTransposeReshape( this.filtersTensor4d );

//       this.filtersTensor4d.dispose();
//       this.filtersTensor4d = filtersTensor4d_shuffled;
//     }

//     if ( this.biasesTensor3d ) { // Shuffle the biases along the last (i.e. channel) axis.
//       let biasesChannelShuffler = new ChannelShuffler.ShuffleInfo( this.biasesTensor3d.shape, this.channelShuffler_outputGroupCount );
//       let biasesTensor3d_shuffled = biasesChannelShuffler.reshapeTransposeReshape( this.biasesTensor3d );

//       this.biasesTensor3d.dispose();
//       this.biasesTensor3d = biasesTensor3d_shuffled;
//     }
//   }

//   /** Expand a tensor4d by zeros along the last second axis (i.e. the axis id 2; the inDepth axis of a pointwise convolution's filters).
//    *
//    * @param {tf.tensor4d} inputTensor4d
//    *   The tensor4d to be expanded.
//    *
//    * @param {number} prefixCount
//    *   How many zeros will be added at the prefix of the input along axis id 2.
//    *
//    * @param {number} postCount
//    *   How many zeros will be added at the postfix of the input along axis id 2.
//    *
//    * @return {tf.tensor4d}
//    *   The expanded tensor4d.
//    */
//   static expandTensor4d_Zeros_AlongAxisId2( inputTensor4d, prefixCount, postfixCount ) {

//     if ( !inputTensor4d )
//       return null;

//     let resultTensor4d, zerosPrefix, zerosPostfix;
//     try {
//       let lastSecondAxisId = 2; // Along the second last axis (i.e. inDepth axis; axis id 2).

//       if ( prefixCount > 0 ) {
//         let prefixShape = inputTensor4d.shape.slice(); // Clone the shape array of the input.
//         prefixShape[ lastSecondAxisId ] = prefixCount;
//         zerosPrefix = tf.zeros( prefixShape );
//       }

//       if ( postfixCount > 0 ) {
//         let postfixShape = inputTensor4d.shape.slice(); // Clone the shape array of the input.
//         postfixShape[ lastSecondAxisId ] = postfixCount;
//         zerosPostfix = tf.zeros( postfixShape );
//       }

//       if ( zerosPrefix ) {
//         if ( zerosPostfix ) {
//           resultTensor4d = tf.concat( [ zerosPrefix, inputTensor4d, zerosPostfix ], lastSecondAxisId ); // Both prefix and postfix.
//         } else {
//           resultTensor4d = tf.concat( [ zerosPrefix, inputTensor4d ], lastSecondAxisId ); // Only prefix.
//         }
//       } else {
//         if ( zerosPostfix ) {
//           resultTensor4d = tf.concat( [ inputTensor4d, zerosPostfix ], lastSecondAxisId ); // Only postfix.
//         } else {
//           resultTensor4d = inputTensor4d.clone(); // No prefix, no postfix.
//         }
//       }

//     } catch ( e ) {
//       return null;

//     } finally {
//       if ( zerosPostfix ) {
//         zerosPostfix.dispose();
//       }

//       if ( zerosPrefix ) {
//         zerosPrefix.dispose();
//       }
//     }

//     return resultTensor4d;
//   }

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
  static Conv_and_destroy_or_keep( inputTensor ) {
    return this.pfnConv( inputTensor );
  }

  static ConvBias_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    return t1;
  }

  static ConvActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = this.pfnActivation( t0 );
    t0.dispose();

    return t1;
  }

  static ConvBiasActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    t0 = this.pfnActivation( t1 );
    t1.dispose();

    return t0;
  }

}
