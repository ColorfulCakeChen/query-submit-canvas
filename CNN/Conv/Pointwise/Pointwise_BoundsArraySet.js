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
    let inChannel = 0;

    FiltersBiasesPartIndexLoop:
    for ( let aFiltersBiasesPartIndex = 0; aFiltersBiasesPartIndex < aFiltersBiasesPartInfoArray.length; ++aFiltersBiasesPartIndex ) {
      let aFiltersBiasesPartInfo = aFiltersBiasesPartInfoArray[ aFiltersBiasesPartIndex ];
      let inChannelPartInfoArray = aFiltersBiasesPartInfo.aChannelPartInfoArray;

      for ( let inChannelSub = 0; inChannelSub < aFiltersBiasesPartInfo.inputChannelCount; ++inChannelSub, ++inChannel ) {
        if ( inChannel >= this.inputChannelCount )
          break FiltersBiasesPartIndexLoop; // Never exceeds the total input channel count.

//!!! ...unfinished... (2022/02/24) aFiltersBiasesPartInfoArray

      let outChannel = 0;

      InChannelPartIndexLoop:
      for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
        let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

        for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
          if ( outChannel >= this.outputChannelCount )
            break InChannelPartIndexLoop; // Never exceeds the total output channel count.

          if ( inChannelPartInfo.bPassThrough ) { // For pass-through half channels.
            this.bPassThrough[ outChannel ] = true;

          } else { // Non-pass-through half channels. (i.e. input multiply filter weight.)
            this.bPassThrough[ outChannel ] = false;
          }

        } // outChannelSub, outChannel
      } // inChannelPartIndex
    } // aFiltersBiasesPartIndex
  }


//!!! ...unfinished... (2022/01/09)
// Even if ( this.outputChannelCount <= 0 ),
// this function should work correctly and BoundsArraySet should result in pass-through input to output.

}

