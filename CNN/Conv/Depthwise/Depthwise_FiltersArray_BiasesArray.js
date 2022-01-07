export { FiltersArray_BiasesArray };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ConvBiasActivation from "../ConvBiasActivation.js";
import { ChannelPartInfo } from  "./Depthwise_ChannelPartInfo.js";
import { BoundsArraySet } from  "./Depthwise_BoundsArraySet.js";
import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";

/**
 * Extract depthwise convolution filters and biases.
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

//!!! ...unfinished... (2021/12/29)

 *
 * @member {BoundsArraySet} boundsArraySet
 *   The element value bounds (per channel) of input, beforeActivation, and output for this depthwise convolution.
 *
 * @member {number} inputHeight
 *   The height of input image. When ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ),
 * it will be used to create the higher-half-pass-through depthwise filters.
 *
 * @member {number} inputWidth
 *   The width of input image. When ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ),
 * it will be used to create the higher-half-pass-through depthwise filters.
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half channel count of input image. When ( nHigherHalfDifferent != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ),
 * it will be used and must be a positive integer.
 *
 * @member {ValueDesc.Depthwise_HigherHalfDifferent} nHigherHalfDifferent
 *   - If ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ), it is just a normal depthwise convolution.
 *
//!!! ...unfinished... (2021/11/12) What if channel multiplier is 0? is 2?
 *   - If true:
 *
 *     - Can not be used when:
 *       - ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
 *       - ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier )
 *
 *     - If ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2 ),
 *         (i.e. bHigherHalfDepthwise2, for depthwise1 of ShuffleNetV2_ByMopbileNetV1's head),
 *         the filters for the input channels between 0 and ( inputChannelCount_lowerHalf - 1 ) are depthwise1, between
 *         ( inputChannelCount_lowerHalf ) and ( inputChannelCount - 1 ) are depthwise2. These two filters (and biases) will be
 *         extracted in sequence, but they will be combined into one larger filters (and biases). This makes these filters' weights
 *         are arranged the same as ShuffleNetV2's head. So that the same filters weights could be used in these two architectures
 *         for comparing performance and correctness.
 *
 *     - If ( nHigherHalfDifferent == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ),
 *         (i.e. bHigherHalfPassThrough, for depthwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail),
 *         the filters for the input channels between ( inputChannelCount_lowerHalf ) and ( inputChannelCount - 1 ) will just pass
 *         through the input to output.
 *

//!!! ...unfinished... (2021/12/29)

 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 *
 * @member {number[]} filtersShape
 *   The shape of the depthwise convolution filters array.
 *
 * @member {number[]} biasesShape
 *   The shape of the depthwise convolution biases array.
 *
 * @member {number[]} filtersArray
 *   The depthwise convolution filters array.
 *
 * @member {number[]} biasesArray
 *   The depthwise convolution biases array.
 *
 * @see PadInfoCalculator
 */
let FiltersArray_BiasesArray = ( Base = Object ) => class extends PadInfoCalculator( Base ) {

  /**
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    bBias, nActivationId,
    nHigherHalfDifferent, inputChannelCount_lowerHalf ) {

    super( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );

    this.boundsArraySet = new BoundsArraySet( inputChannelCount, this.outputChannelCount );
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.nHigherHalfDifferent = nHigherHalfDifferent;
    this.inputChannelCount_lowerHalf = inputChannelCount_lowerHalf;

    // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier ) ) {

      if ( nHigherHalfDifferent != ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE ) {
        let msg = `Depthwise.FiltersArray_BiasesArray.constructor(): `
          + `nHigherHalfDifferent ( ${ValueDesc.Depthwise_HigherHalfDifferent.Singleton.getStringOf( nHigherHalfDifferent )} ) `
          + `should be ( NONE ) when `
          + `AvgMax_Or_ChannelMultiplier is ( ${ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.getStringOf( AvgMax_Or_ChannelMultiplier )} )`
          ;

        throw msg;
      }
    }

    tf.util.assert( ( this.inputChannelCount_lowerHalf <= inputChannelCount ),
      `Depthwise.FiltersArray_BiasesArray.constructor(): `
        + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) can not be larger than `
        + `inputChannelCount ( ${this.inputChannelCount} ).`
    );
  }

  /**
   * Extract depthwise filters and biases.
   *
   * The following properties will be modified:
   *   - this.byteOffsetBegin
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted
   *
   *
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
   *   The previous convolution-bias-activation value bounds set of this depthwise convolution.
   *

//!!! (2022/01/04 Remarked) use previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet directly.
//
//    * @param {FloatValue.ScaleTranslateArray} extraScaleTranslateArray_byChannelIndex
//    *   The extra scale-translate of every channel. They will be pre-applied to the filter value, bias value and convolution-bias-activation
//    * value bounds set of this depthwise convolution. They are indexed by input channel index.

   *
   * @return {boolean} Return true, if succeeded.
   */
  set_filtersArray_biasesArray_by_extract(
    inputFloat32Array, byteOffsetBegin,
    previous_ConvBiasActivation_BoundsArraySet
  ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why is not the sourceWeights kept in this?
    // A2: So that inputFloat32Array could be released.


    tf.util.assert( ( this.inputChannelCount == previous_ConvBiasActivation_BoundsArraySet.output.lowers.length ),
      `Depthwise.FiltersArray_BiasesArray.set_filtersArray_biasesArray_by_extract(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as `
        + `outputChannelCount of previous convolution-bias-activation ( ${previous_ConvBiasActivation_BoundsArraySet.output.lowers.length} ).`
    );

    tf.util.assert( ( this.inputChannelCount == previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales.length ),
      `Depthwise.FiltersArray_BiasesArray.set_filtersArray_biasesArray_by_extract(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as the length of `
        + `activationEscaping_ScaleArraySet.undo of previous convolution-bias-activation `
        + `( ${previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales.length} ).`
    );


    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    // Determine shape of the filters, biases, channels.
    let inChannelPartInfoArray;
    let filtersShape_extracted, biasesShape_extracted;

//!!! (2021/12/29 Remarked)
//     let inChannelBeginArray, inChannelEndArray;
//
//     // For pass-through filters, there is only one position (inside the effect depthwise filter) with non-zero value. All other
//     // positions of the filters should be zero.
//     //
//     // Note: Unfortunately, the pass-through feature may not work for ( dilation > 1 ) because the non-zero-filter-value might be
//     //       just at the dilation position which does not exist in a filter. So, only ( dilation == 1 ) is supported.
//     let effectFilterY_passThrough = this.padHeightTop;
//     let effectFilterX_passThrough = this.padWidthLeft;

    // Set up inChannelPartInfoArray and filtersShape and biasesShape.
    {
      if ( this.AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

        this.poolWindowShape = [ this.filterHeight, this.filterWidth ]; // avg/max pooling do not have this.filtersShape to be extracted.
        if ( this.bBias )
          this.biasesShape = biasesShape_extracted = [ this.outputChannelCount ];

        inChannelPartInfoArray = [ new ChannelPartInfo( 0, this.inputChannelCount ) ];

      } else if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).

        this.filtersShape = [ this.filterHeight, this.filterWidth, this.inputChannelCount, this.channelMultiplier ];
        if ( this.bBias )
          this.biasesShape = [ this.outputChannelCount ];

        switch ( this.nHigherHalfDifferent ) {
          default:
          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0)
            inChannelPartInfoArray = [ new ChannelPartInfo( 0, this.inputChannelCount ) ];
            filtersShape_extracted = this.filtersShape;
            biasesShape_extracted =  this.biasesShape;
            break;

          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2: // (1)
            inChannelPartInfoArray = [
              new ChannelPartInfo(                                0, this.inputChannelCount_lowerHalf ),
              new ChannelPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount           ) ];
            filtersShape_extracted = this.filtersShape;
            biasesShape_extracted =  this.biasesShape;
            break;

          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (2)
            inChannelPartInfoArray = [
              new ChannelPartInfo(                                0, this.inputChannelCount_lowerHalf ),
              new ChannelPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount, this.padHeightTop, this.padWidthLeft ) ];
            filtersShape_extracted = [ this.filterHeight, this.filterWidth, this.inputChannelCount_lowerHalf, this.channelMultiplier ];
            biasesShape_extracted =  [ this.inputChannelCount_lowerHalf ];
            break;
        }

      } else { // No depthwise (i.e. zero) (so no channel multiplier).
        inChannelPartInfoArray = []; // Note: Even if ( this.bBias == true ), the biasesArray will still not be extracted.
      }
    }

    // Prepare result filters and biases array.
    if ( this.filtersShape )
      this.filtersArray = new Array( tf.util.sizeFromShape( this.filtersShape ) );
    if ( this.biasesShape )
      this.biasesArray = new Array( tf.util.sizeFromShape( this.biasesShape ) );

    // Calculate weights count of filters and biases to be extracted.
    let weightsCount_extracted = 0;
    if ( filtersShape_extracted )
      weightsCount_extracted += tf.util.sizeFromShape( filtersShape_extracted );
    if ( biasesShape_extracted )
      weightsCount_extracted += tf.util.sizeFromShape( biasesShape_extracted );

    // Prepare source weights to be extracted.
    let sourceWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, weightsCount_extracted );
    if ( !sourceWeights.extract() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = sourceWeights.defaultByteOffsetEnd;
    this.tensorWeightCountExtracted = weightsCount_extracted;

    // Prepare value bounds.

    this.boundsArraySet.set_all_by_inChannelPartInfoArray(
      this.channelMultiplier, this.nActivationId, this.filtersArray, this.biasesArray,
      inChannelPartInfoArray, previous_ConvBiasActivation_BoundsArraySet );

//!!! ...unfinished... (2022/01/07)
//    let undoScaleTranslateArray = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet.undo;
//
//     let pendingUndo = new FloatValue.ScaleTranslateArray( this.outputChannelCount );
// //!!! ...unfinished... (2022/01/04) problem: input/output channels are different.
// //    pendingUndo.set_byScaleTranslateArray( previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet.undo );


    let sourceIndex, filterIndex, biasIndex;
    sourceIndex = filterIndex = biasIndex = 0;

    let perWeightBounds = new FloatValue.Bounds( 0, 0 ); // Value bounds for one element of a filter.
//!!! ...unfinished... (2021/12/29)


    // ( inChannelPartIndex == 0 ), lower half channels. (or, all channels)
    // ( inChannelPartIndex == 1 ), higher half channels.
    for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
      let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
      let inChannelBegin = inChannelPartInfo.beginIndex;
      let inChannelEnd = inChannelPartInfo.endIndex;

      if ( this.filtersArray ) {
//        let filterValue;

        for ( let filterY = 0, effectFilterY = 0; filterY < this.filterHeight; ++filterY ) {
          for ( let dilationFilterY = 0; dilationFilterY < this.dilationHeight; ++dilationFilterY, ++effectFilterY ) {

            // (2021/12/27 Remarked) Because loop order arrangement, increasing filterIndex one-by-one is enough (without multiplication).
            //let filterIndexBaseX = ( filterY * this.filterWidth );

            for ( let filterX = 0, effectFilterX = 0; filterX < this.filterWidth; ++filterX ) {
              for ( let dilationFilterX = 0; dilationFilterX < this.dilationWidth; ++dilationFilterX, ++effectFilterX ) {

                // The filter's dilation part needs not be extracted from weights array. (They are always zero.)
                if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
                  continue;

                // (2021/12/27 Remarked) Because loop order arrangement, increasing filterIndex one-by-one is enough (without multiplication).
                //let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * this.outputChannelCount );

                let outChannel = inChannelBegin * this.channelMultiplier;

                for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {

                  // (2021/12/27 Remarked) Because loop order arrangement, increasing filterIndex one-by-one is enough (without multiplication).
                  //let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * this.channelMultiplier );

//!!! ...unfinished... (2022/01/07)
                  let undoScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];

                  this.boundsArraySet.afterUndoPreviousActivationEscaping.set_one_byBoundsArray( inChannel, this.boundsArraySet.input, inChannel );
                  this.boundsArraySet.afterUndoPreviousActivationEscaping.multiply_one_byN( inChannel, undoScale );

                  for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {

                    // (2021/12/27 Remarked) Because loop order arrangement, increasing filterIndex one-by-one is enough (without multiplication).
                    //let filterIndex = filterIndexBaseSubC + outChannelSub;

//!!! ...unfinished... (2022/01/07)
                    this.boundsArraySet.afterFilter.set_one_byBoundsArray(
                      outChannel, this.boundsArraySet.afterUndoPreviousActivationEscaping, inChannel );

                    this.boundsArraySet.afterFilter.multiply_one_byBounds( outChannel, filtersValueBounds );

//!!! ...unfinished... (2022/01/07)
                    this.boundsArraySet.afterBias;

//!!! ...unfinished... (2022/01/07) Only if pass-through, the activationEscaping_ScaleArraySet is necessary.
                    this.boundsArraySet.activationEscaping_ScaleArraySet.do.set_one_by_fromLowerUpper_toLowerUpper(
                      outChannel, fromLower, fromUpper, toLower, toUpper );

                    this.boundsArraySet.afterActivationEscaping;
                    this.boundsArraySet.afterActivation;


//!!! ...unfinished... (2022/01/04) value-bounds?
                    pendingUndo.scales[ outChannel ] = 1; // Since it could be applied, no more pending.

                    if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
                      if ( inChannelPartInfo.isPassThrough_FilterPosition_NonZero( effectFilterY, effectFilterX ) ) {
                        this.filtersArray[ filterIndex ] = extraScale; // The only one position with non-zero value.

                        perWeightBounds
                          .set_byBoundsArray( this.boundsArraySet.input, inChannel )
                          .multiply_byN( extraScale ); // pre(-extra)-scale.

                      } else {
                        this.filtersArray[ filterIndex ] = 0; // All other positions of the filter are zero.
                        perWeightBounds.set_byN( 0 );
                      }

//!!! ...unfinished... (2022/01/04) value-bounds?

                    } else { // Not pass-through half channels.
//                      filterValue = Weights.Base.ValueBounds.clamped_or_zeroIfNaN( sourceWeights[ sourceIndex ] ) * extraScale;
                      this.filtersArray[ filterIndex ] = sourceWeights[ sourceIndex ] * extraScale;

                      perWeightBounds
                        .set_byBoundsArray( this.boundsArraySet.input, inChannel )
                        .multiply_byN( extraScale ) // pre(-extra)-scale.
                        .multiply_byN( filtersValueBounds ); // This filters' weight.

                      ++sourceIndex;
                    }

                    this.boundsArraySet.beforeActivation.add_one_byBounds( outChannel, perWeightBounds );

                    ++filterIndex;
                  }
                }
              }
            }
          }
        }

      } else { // ( !this.filtersArray ). No filters array to be extracted. (i.e. avg/max pooling)

//!!! ...unfinished... (2022/01/04) value-bounds?

        let outChannel = inChannelBegin * this.channelMultiplier;
        for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {
          let extraScale = undoScaleTranslateArray.scales[ inChannel ];

          for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {
            pendingUndo.scales[ outChannel ] = extraScale; // Since avg/max pooling can not do pre-scale, it is still pending.

            // Because avg/max pooling will not change value bounds, it is still the same as input.
            this.boundsArraySet.beforeActivation.set_one_byBoundsArray( outChannel, this.boundsArraySet.input, inChannel );
          }
        }

      }


      if ( this.biasesArray ) {
//        let biasValue;

//!!! ...unfinished... (2021/12/28) 

        let outChannel = inChannelBegin * this.channelMultiplier;
        for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {
          
//!!! (2022/01/04 Remarked) use previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet directly.
//        let extraTranslate = extraScaleTranslateArray_byChannelIndex.translates[ inChannel ];
          let extraTranslate = undoScaleTranslateArray.translates[ inChannel ];

          for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {

            pendingUndo.translates[ outChannel ] = 0; // Since it could be applied, no more pending.

            this.boundsArraySet.beforeActivation
              .add_one_byN( outChannel, extraTranslate ); // pre(-extra)-translate

            if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
              this.biasesArray[ biasIndex ] = extraTranslate;

            } else { // Not pass-through half channels.
//              biasValue = Weights.Base.ValueBounds.valueClamped_or_zeroIfNaN( sourceWeights[ sourceIndex ] ) + extraTranslate;
              this.biasesArray[ biasIndex ] = extraTranslate + sourceWeights[ sourceIndex ];

              this.boundsArraySet.beforeActivation.add_one_byBounds( outChannel, biasesValueBounds ); // Shift the value bounds by this bias.

              ++sourceIndex;
            }

            ++biasIndex;
          }
        }

      } else { // ( !this.biasesArray ). No biases array to be extracted.

        let outChannel = inChannelBegin * this.channelMultiplier;
        for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {
          let extraTranslate = undoScaleTranslateArray.translates[ inChannel ];
          for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {
            pendingUndo.translates[ outChannel ] = extraTranslate; // Since it could not be applied, still pending.
          }
        }


      }

    } // inChannelPartIndex


//!!! ...unfinished... (2022/01/04) What if this depthwise does not have filters and/or biases, the escaping value-bounds?

    // ActivationEscaping.ScaleTranslateArraySet of value bounds.
    this.boundsArraySet.activationEscaping_ScaleTranslateArraySet.set_by_currentBoundsArraySet_previousActivationEscaping(
      this.boundsArraySet, previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet );

//!!! ...unfinished... (2022/01/04) How to combine pendingUndo and newUndo?


//!!! ...unfinished... (2022/01/07)
    // Value bounds of output (i.e. after activation)
    this.boundsArraySet.set_afterActivation_by_afterActivationEscaping_ActivationId( this.nActivationId );

    
// let inputHeight = 10;
// let inputWidth = 10;
// let inputChannelCount = 2;
// let AvgMax_Or_ChannelMultiplier = 2; //2;
// let filterHeight = 2; //3;
// let filterWidth = 2; //3;
// let stridesPad = 0;
//
// let padInfo = new ( PadInfoCalculator() )( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) ;
// let filterIndexArray = padInfo.test_findOut_filterIndex_inSequence();
// console.log( filterIndexArray );

  }

}
