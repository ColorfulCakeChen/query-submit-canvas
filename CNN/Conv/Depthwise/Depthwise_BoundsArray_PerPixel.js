export { Depthwise_BoundsArray_PerPixel as BoundsArray_PerPixel };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
//import { PadInfoCalculator } from "./Depthwise_PadInfoCalculator.js";

/**
 * A helper class for calculating value bounds of depthwise operation. It will
 * hold every pixel's value bounds.
 *
 * @member {Depthwise.PadInfoCalculator} imageInfo
 *   The input/output image information of the depthwise operation. It is not owned
 * and will not be released by this object.
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
  constructor( imageInfo ) {
     super();
     BoundsArray.setAsConstructor_self.call( this, imageInfo );
  }
 
  /** @override */
  static setAsConstructor( imageInfo ) {
     super.setAsConstructor();
     BoundsArray.setAsConstructor_self.call( this, imageInfo );
     return this;
  }
 
  /** @override */
  static setAsConstructor_self( imageInfo ) {
    this.imageInfo = imageInfo;

    this.length = virtualImageInfo.outputElementCount;
    this.set_all_byN( 0 );
  }
 
  /** @override */
  disposeResources() {
    this.imageInfo = null; // Just nullify it. Do not release it here.
    super.disposeResources();
  }

  /** Accumulate value bounds for the filter position (across the whole virtual input image).
   *
   * Note: filter dilation is not supported. It is assumed as 1.
   *
   *
   * @param {number} outChannel
   *   The filter will be applied and accumulated to this output channel.
   *
   * @param {number} filterY  The Y position inside the depthwise filter.
   * @param {number} filterX  The X position inside the depthwise filter.
   *
   * @param {FloatValue.Bounds} tBounds
   *   The value bounds to be added to imageOutput_afterFilter_BoundsArray_perPixel
   * for the depthwise filter position.
   *
   */
  add_one_outChannel_byBounds(
    outChannel,
    filterY, filterX,
    tBounds
  ) {
    const imageInput_BeginY = - imageInfo.padHeightTop;
    const imageInput_BeginX = - imageInfo.padWidthLeft;

    let imageOutput_elementIndexBeginY = outChannel;
    let imageOutput_elementIndex = outChannel;

    for ( let outY = 0, inY = imageInput_BeginY + filterY;
          outY < imageInfo.outputHeight;
          ++outY, inY += imageInfo.stridesHeight,
            imageOutput_elementIndexBeginY += imageInfo.outputElementCountY ) {

      if ( inY < 0 )
        continue; // Never access outside of input image. Continue to find out non-negative input image y position.
      else if ( inY >= imageInfo.inputHeight )
        break;    // Never access outside of input image. Break because it is impossible to find inside of input image.

      imageOutput_elementIndex = imageOutput_elementIndexBeginY;
      for ( let outX = 0, inX = imageInput_BeginX + filterX;
            outX < imageInfo.outputWidth;
            ++outX, inX += imageInfo.stridesWidth,
              imageOutput_elementIndex += imageInfo.outputChannelCount ) {

        if ( inX < 0 )
          continue; // Never access outside of input image. Continue to find out non-negative input image x position.
        else if ( inX >= imageInfo.inputWidth )
          break;    // Never access outside of input image. Break because it is impossible to find inside of input image.

        imageOutput_afterFilter_BoundsArray_perPixel.add_one_byBounds(
          imageOutput_elementIndex, tBounds );
      }
    }
  }

}
