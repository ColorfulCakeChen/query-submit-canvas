export { BoundsArraySet };

import * as ConvBiasActivation from "../ConvBiasActivation.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import { ChannelPartInfo, FiltersBiasesPartInfo } from  "./Pointwise_ChannelPartInfo.js";

/**
 * The element value bounds for pointwise convolution-bias-activation.
 *
 */
class BoundsArraySet extends ConvBiasActivation.BoundsArraySet {

  /**
   */
  constructor( inputChannelCount, outputChannelCount ) {
    super( inputChannelCount, outputChannelCount );
  }

  /**
   * Set this.bPassThrough[] according to inChannelPartInfoArray.
   *
   * @param {Pointwise.FiltersBiasesPartInfo[]} aFiltersBiasesPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   */
  set_bPassThrough_all_byChannelPartInfoArray( aFiltersBiasesPartInfoArray ) {
    //!!! (2022/02/24 Remarked) No need process input channel.
    //let inChannel = 0;

    let outChannelBegin = 0;
    let outChannelEnd = 0;   // Non-inclusive. (i.e. [ outChannelBegin, outChannelEnd ) is current output channel for extracting weights.

    FiltersBiasesPartIndexLoop:
    for ( let aFiltersBiasesPartIndex = 0; aFiltersBiasesPartIndex < aFiltersBiasesPartInfoArray.length; ++aFiltersBiasesPartIndex ) {
      let aFiltersBiasesPartInfo = aFiltersBiasesPartInfoArray[ aFiltersBiasesPartIndex ];
      let inChannelPartInfoArray = aFiltersBiasesPartInfo.aChannelPartInfoArray;

      //!!! (2022/02/24 Remarked) No need process input channel.
      //for ( let inChannelSub = 0; inChannelSub < aFiltersBiasesPartInfo.inputChannelCount; ++inChannelSub, ++inChannel ) {
      //  if ( inChannel >= this.inputChannelCount )
      //    break FiltersBiasesPartIndexLoop; // Never exceeds the total input channel count.

      {
        let outChannel = 0;
        outChannelEnd = outChannelBegin;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

          for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel, ++outChannelEnd ) {
            if ( outChannel >= this.outputChannelCount )
              break InChannelPartIndexLoop; // Never exceeds the total output channel count.

            if ( outChannel >= outChannelBegin ) {

              if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
                this.bPassThrough[ outChannel ] = true;

              } else { // Non-pass-through half channels.
                this.bPassThrough[ outChannel ] = false;
              }

            } else {
              // Do nothing. All output channels which is not in range fills bPassThrough in another run.
            }

          } // outChannelSub, outChannel
        } // inChannelPartIndex
      }

      //!!! (2022/02/24 Remarked) No need process input channel.
      //} // inChannelSub, inChannel

      outChannelBegin = outChannelEnd; // Advanced after every FiltersBiasesPart.

    } // aFiltersBiasesPartIndex

    //!!! (2022/02/24 Remarked) No need process input channel.
    //tf.util.assert( ( inChannel == this.input.length ),
    //  `Pointwise.BoundsArraySet.set_bPassThrough_all_byChannelPartInfoArray(): `
    //    + `aFiltersBiasesPartInfoArray[] total input channel count ( ${inChannel} ) should be ( ${this.input.length} ).` );

    tf.util.assert( ( outChannelEnd == this.output.length ),
      `Pointwise.BoundsArraySet.set_bPassThrough_all_byChannelPartInfoArray(): `
        + `aFiltersBiasesPartInfoArray[ inChannelPartInfoArray[] ] total output channel count ( ${outChannelEnd} ) `
        + `should be ( ${this.output.length} ).` );
  }

}

