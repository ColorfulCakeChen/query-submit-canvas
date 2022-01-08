export { FiltersArray_BiasesArray };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ConvBiasActivation from "../ConvBiasActivation.js";
import { ChannelPartInfo } from  "./Pointwise_ChannelPartInfo.js";
import { BoundsArraySet } from  "./Pointwise_BoundsArraySet.js";

/**
 * Extract pointwise convolution filters and biases.
 *
 *
 */
let FiltersArray_BiasesArray = ( Base = Object ) => class extends Base {


//!!! ...unfinished... (2022/01/08)

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
//!!! (2022/01/04 Remarked) use previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet directly.
//
//    * @param {FloatValue.ScaleTranslateArray} extraScaleTranslateArray_byChannelIndex
//    *   The extra scale-translate of every channel. They will be pre-applied to the filter value, bias value and convolution-bias-activation
//    * value bounds set of this depthwise convolution. They are indexed by input channel index.
   *
   * @return {boolean} Return true, if succeeded.
   */
  set_filtersArray_biasesArray_by_extracting(
    inputFloat32Array, byteOffsetBegin,
    previous_ConvBiasActivation_BoundsArraySet
  ) {

    // Q1: Why is the inputFloat32Array not a parameter of constructor?
    // A1: The reason is to avoid keeping it as this.inputFloat32Array so that it could be released by memory garbage collector.
    //
    // Q2: Why is not the sourceWeights kept in this?
    // A2: So that inputFloat32Array could be released.

//!!! ...unfinished... (2022/01/08)


    this.byteOffsetBegin = this.byteOffsetEnd = byteOffsetBegin;

    // Determine shape of the filters, biases, channels.
    let inChannelPartInfoArray;
    let filtersShape_extracted, biasesShape_extracted;
      

//!!! ...unfinished... (2022/01/08)


    // Extracting weights of filters and biases. (Including extra scale.)
    let sourceIndex, filterIndex, biasIndex, outChannel;
    sourceIndex = filterIndex = biasIndex = outChannel = 0;

    // ( inChannelPartIndex == 0 ), lower half channels. (or, all channels)
    // ( inChannelPartIndex == 1 ), higher half channels.
    for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
      let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];
      let inChannelBegin = inChannelPartInfo.beginIndex;
      let inChannelEnd = inChannelPartInfo.endIndex;

      for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {

//!!! ...unfinished... (2022/01/08)

        let undoPreviousEscapingScale = previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleArraySet.undo.scales[ inChannel ];

        for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outChannelCount; ++outChannelSub, ++outChannel ) {

          if ( inChannelPartInfo.isPassThrough_byInputChannelIndex( inChannel ) ) { // For pass-through half channels.

//!!! ...unfinished... (2022/01/08)

          } else { // Non-pass-through half channels.

//!!! ...unfinished... (2022/01/08)

          }

        } // outChannelSub
      } // inChannel

    } // inChannelPartIndex

  }

}
