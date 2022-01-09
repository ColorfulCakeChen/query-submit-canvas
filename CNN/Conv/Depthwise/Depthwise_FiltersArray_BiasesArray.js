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
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors.
 *
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
   *   - this.boundsArraySet
   *   - this.poolWindowShape ( if ( this.AvgMax_Or_ChannelMultiplier < 0 ) )
   *   - this.filtersShape    ( if ( this.AvgMax_Or_ChannelMultiplier > 0 ) )
   *   - this.filtersArray    ( if ( this.AvgMax_Or_ChannelMultiplier > 0 ) )
   *   - this.biasesShape     ( if ( this.bBias == true ) )
   *   - this.biasesArray     ( if ( this.bBias == true ) )
   *
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
   *   The previous convolution-bias-activation value bounds set of this depthwise convolution.
   *
   * @return {boolean} Return true, if succeeded.
   */
  init( inputFloat32Array, byteOffsetBegin, previous_ConvBiasActivation_BoundsArraySet ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why is not the sourceWeights kept in this?
    // A2: So that inputFloat32Array could be released.


    tf.util.assert( ( this.inputChannelCount == previous_ConvBiasActivation_BoundsArraySet.output.lowers.length ),
      `Depthwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as `
        + `outputChannelCount of previous convolution-bias-activation ( ${previous_ConvBiasActivation_BoundsArraySet.output.lowers.length} ).`
    );

    tf.util.assert( ( this.inputChannelCount == previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales.length ),
      `Depthwise.FiltersArray_BiasesArray.init(): `
        + `inputChannelCount ( ${this.inputChannelCount} ) should be the same as the length of `
        + `activationEscaping_ScaleArraySet.undo of previous convolution-bias-activation `
        + `( ${previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales.length} ).`
    );


    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

//!!! ...unfinished... (2022/01/09)
// Even if ( this.AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ),
// this function should work correctly and BoundsArraySet should result in pass-through input to output.

//!!! (2022/01/09 Remarked) Wrong!
//     if ( this.AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE )
//       return true; // Nothing needs to be extracted.

    // Determine shape of the filters, biases, channels.
    let inChannelPartInfoArray;
    let filtersShape_extracted, biasesShape_extracted;

    // Set up inChannelPartInfoArray and filtersShape and biasesShape.
    {
      if ( this.AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

        this.outputChannelCount = this.inputChannelCount; // No channel multiplier.

        // In normal depthwise avg/max pooling, use specified specified channel count as extracted channel count.
        // Although they are not used to extract avg/max filters, they will be used for extracting bias.
        this.inputChannelCount_toBeExtracted = this.inputChannelCount;
        this.outputChannelCount_toBeExtracted = this.outputChannelCount;

        this.poolWindowShape = [ this.filterHeight, this.filterWidth ]; // avg/max pooling do not have this.filtersShape to be extracted.
        if ( this.bBias )
          this.biasesShape = biasesShape_extracted = [ this.outputChannelCount ];

        inChannelPartInfoArray = [ new ChannelPartInfo( 0, this.inputChannelCount ) ];

      } else if ( this.AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).

        this.filtersShape = [ this.filterHeight, this.filterWidth, this.inputChannelCount, this.channelMultiplier ];
        if ( this.bBias )
          this.biasesShape = [ this.outputChannelCount ];

        switch ( this.nHigherHalfDifferent ) {
          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE: // (0)
            this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;
            this.inputChannelCount_toBeExtracted = this.inputChannelCount;
            this.outputChannelCount_toBeExtracted = this.outputChannelCount;
            inChannelPartInfoArray = [ new ChannelPartInfo( 0, this.inputChannelCount ) ];
            filtersShape_extracted = this.filtersShape;
            biasesShape_extracted =  this.biasesShape;
            break;

          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2: // (1)

            this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

            tf.util.assert( ( this.inputChannelCount_lowerHalf > 0 ),
              `Depthwise.FiltersArray_BiasesArray.extractAs_HigherHalfDepthwise2(): `
                + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) must be positive.`
            );

            this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;

            this.outputChannelCount_lowerHalf = this.inputChannelCount_lowerHalf * this.AvgMax_Or_ChannelMultiplier;
            this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

            // Extract filters and biases for the specified channel count, but in different sequence.
            this.inputChannelCount_toBeExtracted = this.inputChannelCount;
            this.outputChannelCount_toBeExtracted = this.outputChannelCount;

            inChannelPartInfoArray = [
              new ChannelPartInfo(                                0, this.inputChannelCount_lowerHalf ),
              new ChannelPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount           ) ];
            filtersShape_extracted = this.filtersShape;
            biasesShape_extracted =  this.biasesShape;
            break;

          case ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH: // (2)

            this.outputChannelCount = this.inputChannelCount * this.AvgMax_Or_ChannelMultiplier;

            tf.util.assert( ( this.inputChannelCount_lowerHalf > 0 ),
              `Depthwise.FiltersArray_BiasesArray.extractAs_HigherHalfPassThrough(): `
                + `inputChannelCount_lowerHalf ( ${this.inputChannelCount_lowerHalf} ) must be positive.`
            );

            this.inputChannelCount_higherHalf = this.inputChannelCount - this.inputChannelCount_lowerHalf;

            this.outputChannelCount_lowerHalf = this.inputChannelCount_lowerHalf * this.AvgMax_Or_ChannelMultiplier;
            this.outputChannelCount_higherHalf = this.outputChannelCount - this.outputChannelCount_lowerHalf;

            // Just extract filters and biases for half of the specified channel count.
            this.inputChannelCount_toBeExtracted = this.inputChannelCount_lowerHalf;
            this.outputChannelCount_toBeExtracted = this.outputChannelCount_lowerHalf;

            inChannelPartInfoArray = [
              new ChannelPartInfo(                                0, this.inputChannelCount_lowerHalf ),
              new ChannelPartInfo( this.inputChannelCount_lowerHalf, this.inputChannelCount, this.padHeightTop, this.padWidthLeft ) ];
            filtersShape_extracted = [ this.filterHeight, this.filterWidth, this.inputChannelCount_lowerHalf, this.channelMultiplier ];
            biasesShape_extracted =  [ this.outputChannelCount_lowerHalf ];
            break;

          default:
            tf.util.assert( ( false ),
              `Depthwise.FiltersArray_BiasesArray.init(): `
                + `nHigherHalfDifferent ( ${this.nHigherHalfDifferent} ) is unknown value.`
            );
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
      previous_ConvBiasActivation_BoundsArraySet, inChannelPartInfoArray,
      this.channelMultiplier, this.nActivationId, this.filtersArray, this.biasesArray
    );

    // Extracting weights of filters and biases. (Including extra scale.)
    let sourceIndex, filterIndex, biasIndex;
    sourceIndex = filterIndex = biasIndex = 0;

    // ( inChannelPartIndex == 0 ), lower half channels. (or, all channels)
    // ( inChannelPartIndex == 1 ), higher half channels.
    for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
      let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
      let inChannelBegin = inChannelPartInfo.inChannelBegin;
      let inChannelEnd = inChannelPartInfo.inChannelEnd;

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

                let outChannel = inChannelBegin * this.channelMultiplier;
                for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {

                  // (2021/12/27 Remarked) Because loop order arrangement, increasing filterIndex one-by-one is enough (without multiplication).
                  //let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * this.channelMultiplier );

                  let undoPreviousEscapingScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];

                  for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {

                    // (2021/12/27 Remarked) Because loop order arrangement, increasing filterIndex one-by-one is enough (without multiplication).
                    //let filterIndex = filterIndexBaseSubC + outChannelSub;

                    let doEscapingScale = this.boundsArraySet.activationEscaping_ScaleArraySet.do.scales[ outChannel ];
                    let extraScale = undoPreviousEscapingScale * doEscapingScale;

                    if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
                      if ( inChannelPartInfo.isPassThrough_FilterPosition_NonZero( effectFilterY, effectFilterX ) ) {
                        this.filtersArray[ filterIndex ] = extraScale; // The only one position with non-zero value.
                      } else {
                        this.filtersArray[ filterIndex ] = 0; // All other positions of the filter are zero.
                      }

                    } else { // Non-pass-through half channels.
                      //this.filtersArray[ filterIndex ] = Weights.Base.ValueBounds.clamped_or_zeroIfNaN( sourceWeights[ sourceIndex ] ) * extraScale;
                      this.filtersArray[ filterIndex ] = sourceWeights[ sourceIndex ] * extraScale;

                      ++sourceIndex;
                    }

                    ++filterIndex;
                  }
                }
              }
            }
          }
        }

      } else { // ( !this.filtersArray ). No filters array to be extracted. (i.e. avg/max pooling)

        // Confirm no need to undo previous activaction-escaping, because avg/max pooling can not that.
        for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {
          let undoPreviousEscapingScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];

          tf.util.assert( ( undoPreviousEscapingScale == 1 ),
            `Depthwise.FiltersArray_BiasesArray.set_filtersArray_biasesArray_by_extract(): `
              + `undoPreviousEscapingScale[ ${inChannel} ] ( ${undoPreviousEscapingScale} ) must be 1 for avg/max pooling.`
          );
        }
      }

      if ( this.biasesArray ) {

        let outChannel = inChannelBegin * this.channelMultiplier;
        for ( let inChannel = inChannelBegin; inChannel < inChannelEnd; ++inChannel ) {
          for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {

            let doEscapingScale = this.boundsArraySet.activationEscaping_ScaleArraySet.do.scales[ outChannel ];
            let extraScale = doEscapingScale; // Note: bias is not responsible for undoPreviousEscapingScale. (i.e. the filter already done it)

            if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
              this.biasesArray[ biasIndex ] = 0;

            } else { // Non-pass-through half channels.
              //this.biasesArray[ biasIndex ] = Weights.Base.ValueBounds.valueClamped_or_zeroIfNaN( sourceWeights[ sourceIndex ] ) * extraScale;
              this.biasesArray[ biasIndex ] = sourceWeights[ sourceIndex ] * extraScale;

              ++sourceIndex;
            }

            ++biasIndex;
          }
        }

      } else { // ( !this.biasesArray ). No biases array to be extracted.
        // Do nothing.
      }

    } // inChannelPartIndex

    {
      this.tensorWeightCountTotal = 0;

      if ( this.filtersShape )
        this.tensorWeightCountTotal += tf.util.sizeFromShape( this.filtersShape );

      if ( this.biasesShape )
        this.tensorWeightCountTotal += tf.util.sizeFromShape( this.biasesShape );
    }

    return true;
  }

}
