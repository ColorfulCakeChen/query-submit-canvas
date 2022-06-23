export { Pointwise };
export { PointwisePool };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import { ConvBiasActivation } from "./BoundsArraySet_ConvBiasActivation.js";
import { ChannelPartInfo, FiltersBiasesPartInfo } from  "../Pointwise/Pointwise_ChannelPartInfo.js";

/**
 * The element value bounds for pointwise convolution-bias-activation.
 *
 *   - Only input0 is used. The input1 is always undefined.
 *   - Only outputChannelCount0 is used. The outputChannelCount1 is always zero.
 *
 * @see ConvBiasActivation
 */
class Pointwise extends ConvBiasActivation {

  /**
   *   - The .input0 will be set as input0.
   *   - The .afterUndoPreviousActivationEscaping will be set according to  input0 and input0.scaleArraySet.undo.scales.
   */
  constructor( input0, outputChannelCount0 ) {
    super( input0, outputChannelCount0 );
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    //this.disposeResources();
    PointwisePool.Singleton.recycle( this );
  }

  /**
   * Set this.bPassThrough[] according to inChannelPartInfoArray.
   *
   * @param {Pointwise.FiltersBiasesPartInfo[]} aFiltersBiasesPartInfoArray
   *   The input channel range array which describe lower/higher half channels index range.
   *
   * @return {BoundsArraySet.Pointwise}
   *   Return the this object.
   */
  set_bPassThrough_all_byChannelPartInfoArray( aFiltersBiasesPartInfoArray ) {

    let outChannelBegin = 0, outChannelEnd = 0; // [ outChannelBegin, outChannelEnd ) are output channels of the current FiltersBiasesPart.

    FiltersBiasesPartIndexLoop:
    for ( let aFiltersBiasesPartIndex = 0; aFiltersBiasesPartIndex < aFiltersBiasesPartInfoArray.length; ++aFiltersBiasesPartIndex ) {
      let aFiltersBiasesPartInfo = aFiltersBiasesPartInfoArray[ aFiltersBiasesPartIndex ];
      let inChannelPartInfoArray = aFiltersBiasesPartInfo.aChannelPartInfoArray;

      outChannelBegin = outChannelEnd; // Begin from the ending of the previous FiltersBiasesPart.

      {
        let outChannel = outChannelBegin;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0; inChannelPartIndex < inChannelPartInfoArray.length; ++inChannelPartIndex ) {
          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

          for ( let outChannelSub = 0; outChannelSub < inChannelPartInfo.outputChannelCount; ++outChannelSub, ++outChannel ) {
            if ( outChannel >= this.outputChannelCount0 )
              break InChannelPartIndexLoop; // Never exceeds the total output channel count.

              this.bPassThrough[ outChannel ] = inChannelPartInfo.bPassThrough;

          } // outChannelSub, outChannel
        } // inChannelPartIndex

        outChannelEnd = outChannel; // Record the ending output channel index of the current FiltersBiasesPart.
      }

    } // aFiltersBiasesPartIndex

    return this;
  }

}


/**
 * Providing BoundsArraySet.Pointwise
 *
 */
class PointwisePool extends Pool.Root {

  constructor() {
    super( Pointwise, PointwisePool.setAsConstructor );
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
 * Used as default BoundsArraySet.Pointwise provider.
 */
PointwisePool.Singleton = new PointwisePool();
