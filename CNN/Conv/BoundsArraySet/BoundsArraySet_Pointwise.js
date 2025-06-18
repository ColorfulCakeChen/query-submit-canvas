export { Pointwise };

import * as Pool from "../../util/Pool.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { ConvBiasActivation } from "./BoundsArraySet_ConvBiasActivation.js";
import { ChannelPartInfo, FiltersBiasesPartInfo } from  "../Pointwise/Pointwise_ChannelPartInfo.js";

/**
 * The element value bounds for pointwise convolution-bias-activation.
 *
 *   - Only input0 is used. The input1 is always undefined.
 *   - Only outputChannelCount0 is used. The outputChannelCount1 is always
 *       zero.
 *
 * @see ConvBiasActivation
 */
class Pointwise extends ConvBiasActivation {

  /**
   * Used as default BoundsArraySet.Pointwise provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "BoundsArraySet.Pointwise.Pool",
    Pointwise );

  /**
   *   - The .input0 will be set as input0.
   *   - The .afterUndoPreviousActivationEscaping will be set according to
   *       input0 and input0.scaleArraySet.undo.scales.
   */
  constructor(
    input0, outputChannelCount0, channelShuffler_inputGroupCount ) {
    super(
      input0, outputChannelCount0, channelShuffler_inputGroupCount );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor(
    input0, outputChannelCount0, channelShuffler_inputGroupCount ) {
    super.setAsConstructor(
      input0, outputChannelCount0, channelShuffler_inputGroupCount );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    // Do nothing.
  }

  ///** @override */
  //disposeResources() {
  //  super.disposeResources();
  //}

  /**
   * Set this.bPassThrough[] according to inChannelPartInfoArray.
   *
   * @param {Pointwise.FiltersBiasesPartInfo[]} aFiltersBiasesPartInfoArray
   *   The input channel range array which describe lower/higher half channels
   * index range.
   *
   * @return {BoundsArraySet.Pointwise}
   *   Return the this object.
   */
  set_bPassThrough_all_byChannelPartInfoArray( aFiltersBiasesPartInfoArray ) {

    // [ outChannelBegin, outChannelEnd ) are output channels of the current
    // FiltersBiasesPart.
    let outChannelBegin = 0, outChannelEnd = 0;

    FiltersBiasesPartIndexLoop:
    for ( let aFiltersBiasesPartIndex = 0;
      aFiltersBiasesPartIndex < aFiltersBiasesPartInfoArray.length;
      ++aFiltersBiasesPartIndex ) {

      let aFiltersBiasesPartInfo
        = aFiltersBiasesPartInfoArray[ aFiltersBiasesPartIndex ];

      let inChannelPartInfoArray = aFiltersBiasesPartInfo;

      // Begin from the ending of the previous FiltersBiasesPart.
      outChannelBegin = outChannelEnd;

      {
        let outChannel = outChannelBegin;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0;
          inChannelPartIndex < inChannelPartInfoArray.length;
          ++inChannelPartIndex ) {

          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

          for ( let outChannelSub = 0;
            outChannelSub < inChannelPartInfo.outputChannelCount;
            ++outChannelSub, ++outChannel ) {

            // Never exceeds the total output channel count.
            if ( outChannel >= this.outputChannelCount0 ) {
              break InChannelPartIndexLoop;
            }

            this.bPassThrough[ outChannel ] = inChannelPartInfo.bPassThrough;

          } // outChannelSub, outChannel
        } // inChannelPartIndex

        // Record the ending output channel index of the current
        // FiltersBiasesPart.
        outChannelEnd = outChannel;
      }

    } // aFiltersBiasesPartIndex

    return this;
  }

}
