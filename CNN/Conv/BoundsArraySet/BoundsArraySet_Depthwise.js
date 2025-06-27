export { Depthwise };

import * as Pool from "../../util/Pool.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
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
   * Used as default BoundsArraySet.Depthwise provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "BoundsArraySet.Depthwise.Pool",
    Depthwise );

  /**
   *   - The .input0 will be set as input0.
   *   - The .afterUndoPreviousActivationEscaping will be set according to
   *       input0 and input0.scaleArraySet.undo.scales.
   */
  constructor(
    input0, outputChannelCount0, channelShuffler_inputGroupCount ) {
    super(
      input0, outputChannelCount0, channelShuffler_inputGroupCount );
    this.#setAsConstructor_self( input0, outputChannelCount0 );
  }

  /** @override */
  setAsConstructor(
    input0, outputChannelCount0, channelShuffler_inputGroupCount ) {
    super.setAsConstructor(
      input0, outputChannelCount0, channelShuffler_inputGroupCount );
    this.#setAsConstructor_self( input0, outputChannelCount0 );
  }

  /**  */
  #setAsConstructor_self( input0, outputChannelCount0 ) {
    // Infer channelMultiplier.
    this.channelMultiplier = outputChannelCount0 / input0.channelCount;
  }

  ///** @override */
  //disposeResources() {
  //  super.disposeResources();
  //}

  /**
   * Set this.bPassThroughArray[] according to inChannelPartInfoArray.
   *
   * @param {Depthwise.FiltersBiasesPartInfo[]} aFiltersBiasesPartInfoArray
   *   The input channel range array which describe lower/higher half channels
   * index range.
   *
   * @return {BoundsArraySet.Depthwise}
   *   Return the this object.
   */
  set_bPassThroughArray_all_byChannelPartInfoArray( aFiltersBiasesPartInfoArray ) {
    
    // [ inChannelBegin, inChannelEnd ) are input channels of the current
    // FiltersBiasesPart.
    let inChannelBegin = 0, inChannelEnd = 0;

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

      inChannelBegin = inChannelEnd;
      outChannelBegin = outChannelEnd;

      {
        let inChannel = inChannelBegin;
        let outChannel = outChannelBegin;

        InChannelPartIndexLoop:
        for ( let inChannelPartIndex = 0;
          inChannelPartIndex < inChannelPartInfoArray.length;
          ++inChannelPartIndex ) {

          let inChannelPartInfo = inChannelPartInfoArray[ inChannelPartIndex ];

          for ( let inChannelSub = 0;
            inChannelSub < inChannelPartInfo.inputChannelCount;
            ++inChannelSub, ++inChannel ) {

            // Never exceeds the total input channel count.
            if ( inChannel >= this.inputChannelCount0 ) {
              break InChannelPartIndexLoop;
            }

            for ( let outChannelSub = 0;
              outChannelSub < this.channelMultiplier;
              ++outChannelSub, ++outChannel ) {

              this.bPassThroughArray[ outChannel ]
                = inChannelPartInfo.bPassThrough;

            } // outChannelSub, outChannel
          } // inChannelSub, inChannel
        } // inChannelPartIndex

        inChannelEnd = inChannel;
        outChannelEnd = outChannel;
      }

    } // aFiltersBiasesPartIndex

    return this;
  }

  /**
   * Accumulate value bounds for the filter position (across the whole virtual
   * input image).
   *
   * Note: filter dilation is not supported. It is assumed as 1.
   *
   *
   * @param {FloatValue.BoundsArray} virtualImageOutput_afterFilter_BoundsArray_perPixel
   *   Every pixel's value bounds for the virtual output image.
   * 
   * @param {Depthwise.PadInfoCalculator} virtualImageInfo
   *   The imagined input image information.
   *
   * @param {number} outChannel
   *   The 
   *
   * @param {number} filterY  The Y position inside the depthwise filter.
   * @param {number} filterX  The X position inside the depthwise filter.
   *
   * @param {FloatValue.Bounds} tBounds
   *   The value bounds to be added to
   * virtualImageOutput_afterFilter_BoundsArray_perPixel for the depthwise
   * filter position.
   *
   */
  static virtualImageOutput_afterFilter_BoundsArray_add_one_byBounds(
    virtualImageOutput_afterFilter_BoundsArray_perPixel,
    virtualImageInfo, outChannel,
    filterY, filterX,
    tBounds
  ) {
    let virtualImageOutput_elementIndexBeginY = outChannel;
    let virtualImageOutput_elementIndex = outChannel;
    for ( let outY = 0, inY = virtualImageInput_BeginY + filterY;
          outY < virtualImageInfo.outputHeight;
          ++outY, inY += virtualImageInfo.stridesHeight,
            virtualImageOutput_elementIndexBeginY += virtualImageInfo.outputElementCountY ) {

      if ( inY < 0 ) {
        // Never access outside of input image. Continue to find out
        // non-negative input image y position.
        continue;

      } else if ( inY >= virtualImageInfo.inputHeight ) {
        // Never access outside of input image. Break because it is impossible
        // to find inside of input image.
        break;
      }

      virtualImageOutput_elementIndex = virtualImageOutput_elementIndexBeginY;
      for ( let outX = 0, inX = virtualImageInput_BeginX + filterX;
            outX < virtualImageInfo.outputWidth;
            ++outX, inX += virtualImageInfo.stridesWidth,
              virtualImageOutput_elementIndex += virtualImageInfo.outputChannelCount ) {

        if ( inX < 0 ) {
          // Never access outside of input image. Continue to find out
          // non-negative input image x position.
          continue;

        } else if ( inX >= virtualImageInfo.inputWidth ) {
          // Never access outside of input image. Break because it is
          // impossible to find inside of input image.
          break;
        }

        virtualImageOutput_afterFilter_BoundsArray_perPixel.add_one_byBounds(
          virtualImageOutput_elementIndex, tBounds );
      }
    }
  }

}
