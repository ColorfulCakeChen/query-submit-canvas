export { Depthwise_BoundsArray_PerPixel as BoundsArray_PerPixel };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
//import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";

/**
 * 
 */
class Depthwise_BoundsArray_PerPixel extends FloatValue.BoundsArray {

  /**
   * Used as default Depthwise.BoundsArray_PerPixel provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Depthwise.BoundsArray_PerPixel.Pool",
    Depthwise_BoundsArray_PerPixel, Depthwise_BoundsArray_PerPixel.setAsConstructor );

  /**
   */
  constructor( length ) {
     super();
     BoundsArray.setAsConstructor_self.call( this, length );
  }
 
  /** @override */
  static setAsConstructor( length ) {
     super.setAsConstructor();
     BoundsArray.setAsConstructor_self.call( this, length );
     return this;
  }
 
  /** @override */
  static setAsConstructor_self( length ) {
  }
 
  /** @override */
  disposeResources() {
    super.disposeResources();
  }

  /** Accumulate value bounds for the filter position (across the whole virtual input image).
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
   *   The value bounds to be added to virtualImageOutput_afterFilter_BoundsArray_perPixel
   * for the depthwise filter position.
   *
   */
  add_one_byBounds(
    virtualImageInfo, outChannel,
    filterY, filterX,
    tBounds
  ) {
    const virtualImageInput_BeginY = - virtualImageInfo.padHeightTop;
    const virtualImageInput_BeginX = - virtualImageInfo.padWidthLeft;

    let virtualImageOutput_elementIndexBeginY = outChannel;
    let virtualImageOutput_elementIndex = outChannel;

    for ( let outY = 0, inY = virtualImageInput_BeginY + filterY;
          outY < virtualImageInfo.outputHeight;
          ++outY, inY += virtualImageInfo.stridesHeight,
            virtualImageOutput_elementIndexBeginY += virtualImageInfo.outputElementCountY ) {

      if ( inY < 0 )
        continue; // Never access outside of input image. Continue to find out non-negative input image y position.
      else if ( inY >= virtualImageInfo.inputHeight )
        break;    // Never access outside of input image. Break because it is impossible to find inside of input image.

      virtualImageOutput_elementIndex = virtualImageOutput_elementIndexBeginY;
      for ( let outX = 0, inX = virtualImageInput_BeginX + filterX;
            outX < virtualImageInfo.outputWidth;
            ++outX, inX += virtualImageInfo.stridesWidth,
              virtualImageOutput_elementIndex += virtualImageInfo.outputChannelCount ) {

        if ( inX < 0 )
          continue; // Never access outside of input image. Continue to find out non-negative input image x position.
        else if ( inX >= virtualImageInfo.inputWidth )
          break;    // Never access outside of input image. Break because it is impossible to find inside of input image.

        virtualImageOutput_afterFilter_BoundsArray_perPixel.add_one_byBounds(
          virtualImageOutput_elementIndex, tBounds );
      }
    }
  }

}
