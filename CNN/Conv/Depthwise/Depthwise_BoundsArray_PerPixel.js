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
 * @member {number[]} neighborCounts
 *   Every pixel is add from how many neighbors. Usually they are the same as
 * depthwise filter size. But if pad=same, the border pixels will have
 * different neighbor count.
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

    if ( this.neighborCounts )
      this.neighborCounts.length = length;
    else
      this.neighborCounts = new Array( length );

    this.length = imageInfo.outputElementCount;
    this.set_all_byN( 0 );
    this.neighborCounts.fill( 0 );
  }
 
  /** @override */
  disposeResources() {
    this.neighborCounts.length = 0;
    this.imageInfo = null; // Just nullify it. Do not release it here.
    super.disposeResources();
  }

  set length( newLength ) {
    super.length = newLength;
    this.neighborCounts.length = newLength;
  }

  /**
   * @return {Depthwise_BoundsArray_PerPixel}
   *   Return newly created object which is a copy of this BoundsArray.
   */
  clone() {
    let result = Depthwise_BoundsArray_PerPixel.Pool.get_or_create_by( this.length );
    result.set_all_byBoundsArray( this );
    result.neighborCounts_set_all_byBoundsArray( this );
    return result;
  }

  /**
   * @param {number} thisIndex  The array index of this.neighborCounts[].
   * @param {number} N          Set ( this.neighborCounts[ thisIndex ] ) by ( N ).
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  neighborCounts_set_one_byN( thisIndex, N ) {
    this.neighborCounts[ thisIndex ] = N;
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.neighborCounts[].
   * @param {number[]} Ns       Set ( this.neighborCounts[ thisIndex ] ) by ( Ns[ aIndex ] ).
   * @param {number} aIndex     The array index of Ns[].
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  neighborCounts_set_one_byNs( thisIndex, Ns, aIndex ) {
    this.neighborCounts[ thisIndex ] = Ns[ aIndex ];
    return this;
  }

  /**
   * @param {number} N          Set ( this.neighborCounts[] ) by ( N ).
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  neighborCounts_set_all_byN( N ) {
    this.neighborCounts.fill( N );
    return this;
  }

  /**
   * @param {number[]} Ns  Set all ( this.neighborCounts[] ) by ( Ns[] ).
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  neighborCounts_set_all_byNs( Ns ) {
    for ( let i = 0; i < this.neighborCounts.length; ++i ) {
      this.neighborCounts[ i ] = Ns[ i ];
    }
    return this;
  }

  /**
   * @param {Depthwise_BoundsArray_PerPixel} aBoundsArray  Set all ( this.neighborCounts[] ) by ( aBoundsArray.neighborCounts[] ).
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  neighborCounts_set_all_byBoundsArray( aBoundsArray ) {
    return this.neighborCounts_set_all_byNs( aBoundsArray.neighborCounts_set_all_byNs );
  }


  /** Accumulate value bounds for the filter position (across the whole virtual input image).
   *
   * Note: filter dilation is not supported. It is assumed as 1.
   *
   *
   * @param {number} outputChannel
   *   The filter will be applied and accumulated to this output channel.
   *
   * @param {number} filterY  The Y position inside the depthwise filter.
   * @param {number} filterX  The X position inside the depthwise filter.
   *
   * @param {FloatValue.Bounds} tBounds
   *   The value bounds to be added to this BoundsArray_PerPixel for the
   * specified depthwise filter position.
   *
   */
  add_one_outputChannel_byBounds(
    outputChannel,
    filterY, filterX,
    tBounds
  ) {
    const imageInput_BeginY = - this.imageInfo.padHeightTop;
    const imageInput_BeginX = - this.imageInfo.padWidthLeft;

    let imageOutput_elementIndexBeginY = outputChannel;
    let imageOutput_elementIndex = outputChannel;

    for ( let outY = 0, inY = imageInput_BeginY + filterY;
          outY < this.imageInfo.outputHeight;
          ++outY, inY += this.imageInfo.stridesHeight,
            imageOutput_elementIndexBeginY += this.imageInfo.outputElementCountY ) {

      if ( inY < 0 )
        continue; // Never access outside of input image. Continue to find out non-negative input image y position.
      else if ( inY >= this.imageInfo.inputHeight )
        break;    // Never access outside of input image. Break because it is impossible to find inside of input image.

      imageOutput_elementIndex = imageOutput_elementIndexBeginY;
      for ( let outX = 0, inX = imageInput_BeginX + filterX;
            outX < this.imageInfo.outputWidth;
            ++outX, inX += this.imageInfo.stridesWidth,
              imageOutput_elementIndex += this.imageInfo.outputChannelCount ) {

        if ( inX < 0 )
          continue; // Never access outside of input image. Continue to find out non-negative input image x position.
        else if ( inX >= this.imageInfo.inputWidth )
          break;    // Never access outside of input image. Break because it is impossible to find inside of input image.

        // For Avg pooling, the divisor should include filter dilation but exclude input image outside.
        //
        // This accumulation should be done after confirm ( inY, inX ) is inside the input image.
        ++this.neighborCounts[ imageOutput_elementIndex ];

        this.add_one_byBounds( imageOutput_elementIndex, tBounds );
      }
    }
  }

  /**
   * Collapse every pixel's value bounds to per output channel value bounds.
   *
   * @param {FloatValue.BoundsArray} aBoundsArray
   *   The collapsed result will be stored to aBoundsArray.
   */
  collapse_byOutputChannel_toBoundsArray( aBoundsArray ) {
    aBoundsArray.length = this.imageInfo.outputChannelCount;
    aBoundsArray.set_all_by_PositiveInfinity_NegativeInfinity(); // (so that could be enlarged.)

    let imageOutput_elementIndex = 0;
    for ( let outY = 0; outY < this.imageInfo.outputHeight; ++outY ) {
      for ( let outX = 0; outX < this.imageInfo.outputWidth; ++outX ) {
        for ( let outC = 0; outC < this.imageInfo.outputChannelCount; ++outC, ++imageOutput_elementIndex ) {
          aBoundsArray.enlarge_one_byBoundsArray_one( outC, this, imageOutput_elementIndex );
        }
      }
    }
  }

}
