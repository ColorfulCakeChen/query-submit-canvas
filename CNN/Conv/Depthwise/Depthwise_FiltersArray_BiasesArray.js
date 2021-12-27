export { FiltersArray_BiasesArray };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
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
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {ConvBiasActivation.ValueBoundsSet} previous_ConvBiasActivation_ValueBoundsSet
   *   The previous convolution-bias-activation value bounds set of this depthwise convolution.
   *
   * @return {boolean} Return true, if succeeded.
   */
  extract_DepthwiseFiltersBiases(
   inputFloat32Array, byteOffsetBegin, previous_ConvBiasActivation_ValueBoundsSet ) {


    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why are not filtersWeights and biasesWeights kept in this?
    // A2: So that inputFloat32Array could be released.


    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

//!!! ...unfinished... (2021/12/27)

//    let filterIndexArray = new Array( this.filterHeight * this.filterWidth * this.inputChannelCount * this.channelMultiplier );
    let filterIndexArray = new Array();

    for ( let filterY = 0, effectFilterY = 0; filterY < this.filterHeight; ++filterY ) {
      for ( let dilationFilterY = 0; dilationFilterY < this.dilationHeight; ++dilationFilterY, ++effectFilterY ) {
        let filterIndexBaseX = ( filterY * this.filterWidth );

        for ( let filterX = 0, effectFilterX = 0; filterX < this.filterWidth; ++filterX ) {
          for ( let dilationFilterX = 0; dilationFilterX < this.dilationWidth; ++dilationFilterX, ++effectFilterX ) {

            // The filter's dilation part needs not be extracted from weights array. (They are always zero.)
            if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
              continue;

            let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * this.outputChannelCount );

            for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {
              let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * this.channelMultiplier );

              for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub ) {
                let filterIndex = filterIndexBaseSubC + outChannelSub;

                filterIndexArray.push( filterIndex );
                //console.log( `${filterIndex}, ` );

              }
            }
          }
        }
      }
    }

    return filterIndexArray;
    //debugger;
    
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
