export { FiltersArray_BiasesArray };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";

/**
 * Half channels information. Describe channel index range of lower half or higher half
 */
class HalfPartInfo {

  /**
   * @param {number} effectFilterY_passThrough, effectFilterX_passThrough
   *   For pass-through filters, there is only one position (inside the effect depthwise filter) with non-zero value. All other
   * positions of the filters should be zero.
   *   - Note: Unfortunately, the pass-through feature may not work for ( dilation > 1 ) because the non-zero-filter-value might
   *       be just at the dilation position which does not exist in a filter. So, only ( dilation == 1 ) is supported.
   *   - Negative value means this part is not for pass-through.
   */
  constructor( inChannelBegin, inChannelEnd, effectFilterY_passThrough = -1, effectFilterX_passThrough = -1 ) {
    this.inChannelBegin = inChannelBegin;
    this.inChannelEnd = inChannelEnd;
    this.effectFilterY_passThrough = effectFilterY_passThrough;
    this.effectFilterX_passThrough = effectFilterX_passThrough;
  }

  /**
   * @return {boolean} Return true, if this is the half channels for pass-through input to output.
   */
  isPassThrough() {
    if ( ( this.effectFilterY_passThrough < 0 ) || ( this.effectFilterX_passThrough < 0 ) ) // Not pass-through half channels.
      return false;
    return true;
  }

  /**
   * @return {boolean} Return true, if the specified position should be non-zero for pass-through input to output.
   */
  isPassThrough_FilterPosition_NonZero( effectFilterY, effectFilterX ) {
    if ( ( effectFilterY == this.effectFilterY_passThrough ) && ( effectFilterX == this.effectFilterX_passThrough ) ) {
      return true;
    return false;
  }      
}


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
 * @member {ValueBoundsSet} valueBoundsSet
 *   The element value bounds of input, beforeActivation, and output for this depthwise convolution.
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

    this.valueBoundsSet = new ValueBoundsSet();
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
   * @param {ConvBiasActivation.ValueBoundsSet} previous_ConvBiasActivation_ValueBoundsSet
   *   The previous convolution-bias-activation value bounds set of this depthwise convolution.
   *
   * @param {FloatValue.ScaleTranslateArray} extraScaleTranslateArray_byChannelIndex
   *   The extra scale-translate of every channel. They will be pre-applied to the filter value, bias value and convolution-bias-activation
   * value bounds set of this depthwise convolution. They are indexed by input channel index.
   *
   * @return {boolean} Return true, if succeeded.
   */
  set_filtersArray_biasesArray_by_extract(
    inputFloat32Array, byteOffsetBegin,
    previous_ConvBiasActivation_ValueBoundsSet,
    extraScaleTranslateArray_byChannelIndex,
  ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why are not filtersWeights and biasesWeights kept in this?
    // A2: So that inputFloat32Array could be released.


    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    // Determine shape of the filters, biases, channels.
    let halfPartInfoArray;
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
      
    {
      if ( this.AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

        this.poolWindowShape = [ this.filterHeight, this.filterWidth ]; // avg/max pooling do not have this.filtersShape to be extracted.
        if ( this.bBias )
          this.biasesShape = biasesShape_extracted = [ this.outputChannelCount ];

        halfPartInfoArray = [ new HalfPartInfo( 0, this.inputChannelCount ) ];

      } else if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).

        this.filtersShape = [ this.filterHeight, this.filterWidth, this.inputChannelCount, this.channelMultiplier ];
        if ( this.bBias )
          this.biasesShape = [ this.outputChannelCount ];

        switch ( this.nHigherHalfDifferent ) {
          default:
          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0)
            halfPartInfoArray = [ new HalfPartInfo( 0, this.inputChannelCount ) ];
            filtersShape_extracted = this.filtersShape;
            biasesShape_extracted =  this.biasesShape;
            break;

          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2: // (1)
            halfPartInfoArray = [
              new HalfPartInfo(                                0, this.inputChannelCount_lowerHalf ),
              new HalfPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount           ) ];
            filtersShape_extracted = this.filtersShape;
            biasesShape_extracted =  this.biasesShape;
            break;

          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (2)
            halfPartInfoArray = [
              new HalfPartInfo(                                0, this.inputChannelCount_lowerHalf ),
              new HalfPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount, this.padHeightTop, this.padWidthLeft ) ];
            filtersShape_extracted = [ this.filterHeight, this.filterWidth, this.inputChannelCount_lowerHalf, this.channelMultiplier ];
            biasesShape_extracted =  [ this.inputChannelCount_lowerHalf ];
            break;
        }

      } else { // No depthwise (i.e. zero) (so no channel multiplier).
        halfPartInfoArray = []; // Note: Even if ( this.bBias == true ), the biasesArray will still not be extracted.
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



    let sourceIndex, filterIndex, biasIndex;
    sourceIndex = filterIndex = biasIndex = 0;

//!!! ...unfinished... (2021/12/29)


    // ( halfPartIndex == 0 ), lower half channels. (or, all channels)
    // ( halfPartIndex == 1 ), higher half channels.
    for ( let halfPartIndex = 0; halfPartIndex < halfPartInfoArray.length; ++halfPartIndex ) {
      let halfPartInfo = halfPartInfoArray[ halfPartIndex ];
      let inChannelBegin = halfPartInfo.inChannelBegin;
      let inChannelEnd = halfPartInfo.inChannelEnd;
//       let effectFilterY_passThrough = halfPartInfo.effectFilterY_passThrough;
//       let effectFilterX_passThrough = halfPartInfo.effectFilterX_passThrough;

      if ( this.filtersArray ) {

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

                for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {

                  // (2021/12/27 Remarked) Because loop order arrangement, increasing filterIndex one-by-one is enough (without multiplication).
                  //let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * this.channelMultiplier );

                  for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub ) {

                    // (2021/12/27 Remarked) Because loop order arrangement, increasing filterIndex one-by-one is enough (without multiplication).
                    //let filterIndex = filterIndexBaseSubC + outChannelSub;

//!!! ...unfinished... (2021/12/29) pre-scale? pass-through? value-bounds?
                    let filterValue;
                    if ( halfPartInfo.isPassThrough() ) { // For pass-through half channels.
                      if ( halfPartInfo.isPassThrough_FilterPosition_NonZero( effectFilterY, effectFilterX ) ) {
                        filterValue = 1; // The only one position with non-zero value.
                      } else {
                        filterValue = 0; // All other positions of the filter are zero.
                      }

                    } else { // Not pass-through half channels.
                      filterValue = sourceWeights[ sourceIndex ];
                    }

                    let extraScale = extraScaleTranslateArray_byChannelIndex.scales[ inChannel ];
                    this.filtersArray[ filterIndex ] = filterValue * extraScale;

                    ++sourceIndex;
                    ++filterIndex;
                  }
                }
              }
            }
          }
        }

      // No filters array needs to be filled. (i.e. avg/max pooling)
      }

      if ( this.biasesArray ) {

//!!! ...unfinished... (2021/12/28) 

        for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {
          for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub ) {

//!!! ...unfinished... (2021/12/29) pre-translate? pass-through? value-bounds?
            let biasValue;
            if ( halfPartInfo.isPassThrough() ) { // For pass-through half channels.
              biasValue = 0;

            } else { // Not pass-through half channels.
              biasValue = sourceWeights[ sourceIndex ];
            }

            let extraTranslate = extraScaleTranslateArray_byChannelIndex.translates[ inChannel ];
            this.biasesArray[ biasIndex ] = biasValue + extraTranslate;

            ++sourceIndex;
            ++biasIndex;
          }
        }

      }

    }


    
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
