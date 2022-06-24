export { Depthwise };
export { DepthwisePool };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import { ConvBiasActivation } from "./BoundsArraySet_ConvBiasActivation.js";
import { ChannelPartInfo, FiltersBiasesPartInfo } from  "../Depthwise/Depthwise_ChannelPartInfo.js";

/**
 * The element value bounds set for depthwise convolution-bias-activation.
 *
 *   - Only input0 is used. The input1 is always undefined.
 *   - Only outputChannelCount0 is used. The outputChannelCount1 is always zero.
 *
 * @see ConvBiasActivation
 */
class Depthwise extends ConvBiasActivation {

  /**
   *   - The .input0 will be set as input0.
   *   - The .afterUndoPreviousActivationEscaping will be set according to  input0 and input0.scaleArraySet.undo.scales.
   */
  constructor( input0, outputChannelCount0 ) {
    super( input0, outputChannelCount0 );

    // Infer channelMultiplier.
    this.channelMultiplier = outputChannelCount0 / input0.channelCount;
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    DepthwisePool.Singleton.recycle( this );
  }

  /**
   * Set this.bPassThrough[] according to inChannelPartInfoArray.
   *
   * @param {Depthwise.FiltersBiasesPartInfo[]} aFiltersBiasesPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   *
   * @return {BoundsArraySet.Depthwise}
   *   Return the this object.
   */
  set_bPassThrough_all_byChannelPartInfoArray( aFiltersBiasesPartInfoArray ) {
    
    let inChannelBegin = 0, inChannelEnd = 0,   // [ inChannelBegin, inChannelEnd ) are input channels of the current FiltersBiasesPart.
        outChannelBegin = 0, outChannelEnd = 0; // [ outChannelBegin, outChannelEnd ) are output channels of the current FiltersBiasesPart.

    FiltersBiasesPartIndexLoop:
    for ( let aFiltersBiasesPartIndex = 0; aFiltersBiasesPartIndex < aFiltersBiasesPartInfoArray.length; ++aFiltersBiasesPartIndex ) {
      let aFiltersBiasesPartInfo = aFiltersBiasesPartInfoArray[ aFiltersBiasesPartIndex ];
      let inChannelPartInfoArray = aFiltersBiasesPartInfo.aChannelPartInfoArray;

      inChannelBegin = inChannelEnd;
      outChannelBegin = outChannelEnd;

      {
        let inChannel = inChannelBegin;
        let outChannel = outChannelBegin;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

          for ( let inChannelSub = 0; inChannelSub < inChannelPartInfo.inputChannelCount; ++inChannelSub, ++inChannel ) {
            if ( inChannel >= this.inputChannelCount0 )
              break InChannelPartIndexLoop; // Never exceeds the total input channel count.

            for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub, ++outChannel ) {
              this.bPassThrough[ outChannel ] = inChannelPartInfo.bPassThrough;

            } // outChannelSub, outChannel
          } // inChannelSub, inChannel
        } // inChannelPartIndex

        inChannelEnd = inChannel;
        outChannelEnd = outChannel;
      }

    } // aFiltersBiasesPartIndex

    return this;
  }

}


/**
 * Providing BoundsArraySet.Depthwise
 *
 */
class DepthwisePool extends Pool.Root {

  constructor() {
    super( "BoundsArraySet.DepthwisePool", Depthwise, DepthwisePool.setAsConstructor );
  }

  /**
   * @param {Depthwise} this
   *   The Depthwise object to be initialized.
   *
   * @return {Depthwise}
   *   Return the this object.
   */
  static setAsConstructor( input0, outputChannelCount0 ) {
    this.set_input0_outputChannelCount0( input0, outputChannelCount0 );
    return this;
  }

}

/**
 * Used as default BoundsArraySet.Depthwise provider.
 */
DepthwisePool.Singleton = new DepthwisePool();
