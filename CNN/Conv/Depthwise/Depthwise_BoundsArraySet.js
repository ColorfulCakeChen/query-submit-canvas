export { BoundsArraySet };

import * as ConvBiasActivation from "../ConvBiasActivation.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import { ChannelPartInfo } from  "./Depthwise_ChannelPartInfo.js";

/**
 * The element value bounds set for depthwise convolution-bias-activation.
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
   * @param {Depthwise.ChannelPartInfo[]} inChannelPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   */
  set_bPassThrough_all_byChannelPartInfoArray( inChannelPartInfoArray ) {
    let inChannel = 0;
    let outChannel = 0;

    InChannelPartIndexLoop:
    for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
      let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

      for ( let inChannelSub = 0; inChannelSub < inChannelPartInfo.inputChannelCount; ++inChannelSub, ++inChannel ) {
        if ( inChannel >= this.inputChannelCount )
          break InChannelPartIndexLoop; // Never exceeds the total input channel count.

        for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {
          this.bPassThrough[ outChannel ] = inChannelPartInfo.bPassThrough;

        } // outChannelSub, outChannel
      } // inChannelSub, inChannel
    } // inChannelPartIndex

  }

}

