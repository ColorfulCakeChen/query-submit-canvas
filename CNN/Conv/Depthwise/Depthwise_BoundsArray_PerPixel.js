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
 * @member {number[]} accumulationCounts
 *   Every pixel is added how many times. Usually they are the same as
 * depthwise filter size. But if pad=same, the border pixels will have
 * different accumulation count.
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

    if ( this.accumulationCounts )
      this.accumulationCounts.length = length;
    else
      this.accumulationCounts = new Array( length );

    this.length = imageInfo.outputElementCount;
    this.set_all_byN( 0 );
    this.accumulationCounts.fill( 0 );
  }
 
  /** @override */
  disposeResources() {
    this.accumulationCounts.length = 0;
    this.imageInfo = null; // Just nullify it. Do not release it here.
    super.disposeResources();
  }

  set length( newLength ) {
    super.length = newLength;
    this.accumulationCounts.length = newLength;
  }

  /**
   * @return {Depthwise_BoundsArray_PerPixel}
   *   Return newly created object which is a copy of this BoundsArray.
   */
  clone() {
    let result = Depthwise_BoundsArray_PerPixel.Pool.get_or_create_by( this.length );
    result.set_all_byBoundsArray( this );
    result.accumulationCounts_set_all_byBoundsArray( this );
    return result;
  }

  /**
   * @param {number} thisIndex  The array index of this.accumulationCounts[].
   * @param {number} N          Set ( this.accumulationCounts[ thisIndex ] ) by ( N ).
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  accumulationCounts_set_one_byN( thisIndex, N ) {
    this.accumulationCounts[ thisIndex ] = N;
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.accumulationCounts[].
   * @param {number[]} Ns       Set ( this.accumulationCounts[ thisIndex ] ) by ( Ns[ aIndex ] ).
   * @param {number} aIndex     The array index of Ns[].
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  accumulationCounts_set_one_byNs( thisIndex, Ns, aIndex ) {
    this.accumulationCounts[ thisIndex ] = Ns[ aIndex ];
    return this;
  }

  /**
   * @param {number} N          Set ( this.accumulationCounts[] ) by ( N ).
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  accumulationCounts_set_all_byN( N ) {
    this.accumulationCounts.fill( N );
    return this;
  }

  /**
   * @param {number[]} Ns  Set all ( this.accumulationCounts[] ) by ( Ns[] ).
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  accumulationCounts_set_all_byNs( Ns ) {
    for ( let i = 0; i < this.accumulationCounts.length; ++i ) {
      this.accumulationCounts[ i ] = Ns[ i ];
    }
    return this;
  }

  /**
   * @param {Depthwise_BoundsArray_PerPixel} aBoundsArray  Set all ( this.accumulationCounts[] ) by ( aBoundsArray.accumulationCounts[] ).
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  accumulationCounts_set_all_byBoundsArray( aBoundsArray ) {
    return this.accumulationCounts_set_all_byNs( aBoundsArray.accumulationCounts_set_all_byNs );
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

        // It should include filter dilation but exclude input image outside.
        //
        // This accumulation should be done after confirm ( inY, inX ) is inside the input image.
        ++this.accumulationCounts[ imageOutput_elementIndex ];

        this.add_one_byBounds( imageOutput_elementIndex, tBounds );
      }
    }
  }

  /**
   * Divide every value bounds by itself's .accumulationCounts[].
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
   */
  divide_all_by_accumulationCounts() {
    let imageOutput_elementIndex = 0;
    for ( let outY = 0; outY < this.imageInfo.outputHeight; ++outY ) {
      for ( let outX = 0; outX < this.imageInfo.outputWidth; ++outX ) {
        for ( let outC = 0; outC < this.imageInfo.outputChannelCount; ++outC, ++imageOutput_elementIndex ) {
          this.divide_one_byNs( imageOutput_elementIndex, this.accumulationCounts );
        }
      }
    }
    return this;
  }

  /**
   * Collapse every pixel's value bounds to per output channel value bounds.
   *
   * @param {FloatValue.BoundsArray} aBoundsArray
   *   The collapsed result will be stored to aBoundsArray.
   *
   * @return {Depthwise_BoundsArray_PerPixel} Return this (modified) object.
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
    return this;
  }

}
