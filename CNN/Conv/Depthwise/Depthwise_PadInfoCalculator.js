export { PadInfoCalculator };

/**
 * According to input image size and depthwise convolution parameters, calculate the padding information of the depthwise convolution.
 *
 * @member {number} imageInHeight         Input image height.
 * @member {number} imageInWidth          Input image width.
 * @member {number} imageInDepth          Input image channel count.
 * @member {number} AvgMax_Or_ChannelMultiplier   Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier)
 * @member {number} filterHeight          The height of the depthwise convolution's filter.
 * @member {number} filterWidth           The width of the depthwise convolution's filter.
 * @member {number} stridesPad            The strides and padding of depthwise convolution. (PointDepthPoint.Params.depthwiseStridesPad)
 *
 * @member {number} channelMultiplier     The channel multiplier of the depthwise operation (according to AvgMax_Or_ChannelMultiplier).
 *
 * @member {number} dilationHeight        The depthwise filters's dilation across height dimension.
 * @member {number} dilationWidth         The depthwise filters's dilation across width dimension.
 *
 * @member {number} effectFilterHeight    The effect height of the depthwise convolution's filter including the dilationHeight.
 * @member {number} effectFilterWidth     The effect width of the depthwise convolution's filter including the dilationWidth.
 * @member {number} effectFilterSize      The effect size of the depthwise convolution's filter. (= effectFilterHeight * effectFilterWidth)
 *
 * @member {number} strides               The strides along the image's height and width dimension (according to stridesPad).
 * @member {number} stridesHeight         The strides along the image's height dimension (according to stridesPad).
 * @member {number} stridesWidth          The strides along the image's width dimension (according to stridesPad).

 * @member {number} pad                   The padding along the image's height and width dimension (according to stridesPad).
 * @member {number} padHeight             The padding along the input image's height dimension.
 * @member {number} padHeightTop          The padding along the input image's height dimension at the top.
 * @member {number} padHeightBottom       The padding along the input image's height dimension at the bottom.
 * @member {number} padWidth              The padding along the input image's width dimension.
 * @member {number} padWidthLeft          The padding along the input image's width dimension at the left.
 * @member {number} padWidthRight         The padding along the input image's width dimension at the right.
 *
 * @member {number} imageOutHeight        Output image height.
 * @member {number} imageOutWidth         Output image width.
 * @member {number} imageOutDepth         Output image channel count.
 * @member {number} imageOutLength        Output image elements count (= ( imageOutHeight * imageOutWidth * imageOutDepth ) ).
 */
class PadInfoCalculator {
  
  constructor( imageInHeight, imageInWidth, imageInDepth, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) {
    this.imageInHeight = imageInHeight;
    this.imageInWidth = imageInWidth;
    this.imageInDepth = imageInDepth;
    this.AvgMax_Or_ChannelMultiplier = AvgMax_Or_ChannelMultiplier;
    this.filterHeight = filterHeight;
    this.filterWidth = filterWidth;
    this.stridesPad = stridesPad;

//!!! ...unfinished... (2021/03/17) What about ( filterHeight <= 0 ) or ( filterWidth <= 0 )?

    this.channelMultiplier = AvgMax_Or_ChannelMultiplier;
    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === AvgMax_Or_ChannelMultiplier ) ) {
      this.channelMultiplier = 1;
    }

    // Strides and Padding.
    switch ( stridesPad ) {
      case 0:  this.strides = 1; this.pad = "valid"; break;
      default:
      case 1:  this.strides = 1; this.pad = "same";  break;
      case 2:  this.strides = 2; this.pad = "same";  break;
    }

    // Assume strides width equals strides height.
    this.stridesHeight = this.strides;
    this.stridesWidth = this.strides;

    // Currently, we can only handle dilation = 1.
    this.dilationHeight = 1;
    this.dilationWidth = 1;

    // Effect filter size (includes dilation).
    this.effectFilterHeight = this.dilationHeight * ( this.filterHeight - 1 ) + 1;
    this.effectFilterWidth =  this.dilationWidth  * ( this.filterWidth  - 1 ) + 1;
    this.effectFilterSize = this.effectFilterHeight * this.effectFilterWidth;

    // (The following codes for output image height and width and padding calculation are copied from
    // https://github.com/tensorflow/tfjs/blob/tfjs-v3.8.0/tfjs-core/src/ops/conv_util.ts)
    {
      // Determine output image height and width without padding.
      if ( this.pad == "valid" ) {
        this.imageOutHeight = Math.ceil( ( imageInHeight - this.effectFilterHeight + 1 ) / this.stridesHeight );
        this.imageOutWidth =  Math.ceil( ( imageInWidth  - this.effectFilterWidth  + 1 ) / this.stridesWidth  );

        this.padHeight = this.padHeightTop = this.padHeightBottom = this.padWidth = this.padWidthLeft = this.padWidthRight = 0;

      // Determine output image height and width with padding around the input image height and width.
      } else if ( this.pad == "same" ) {
        this.imageOutHeight = Math.ceil( imageInHeight / this.stridesHeight );
        this.imageOutWidth =  Math.ceil( imageInWidth  / this.stridesWidth  );

        this.padHeight = Math.max( 0, ( this.imageOutHeight - 1 ) * this.stridesHeight + this.effectFilterHeight - imageInHeight );
        this.padWidth =  Math.max( 0, ( this.imageOutWidth  - 1 ) * this.stridesWidth  + this.effectFilterWidth  - imageInWidth  );

        this.padHeightTop =    Math.floor( this.padHeight / 2 );
        this.padHeightBottom = this.padHeight - this.padHeightTop;
        this.padWidthLeft =    Math.floor( this.padWidth /  2 );
        this.padWidthRight =   this.padWidth  - this.padWidthLeft;
      }
    }

    this.imageOutDepth = imageInDepth * this.channelMultiplier;
    this.imageOutLength = ( this.imageOutHeight * this.imageOutWidth * this.imageOutDepth );
  }

  /**
   * @param {number} filterValue
   *   The (non-zero) value used in the pass-through depthwise convolution filter. Default is 1.
   *
   * @return {number[]} 
   *   Return the depthwise convolution filters which could pass the input to output unchangely.
   */
  generate_PassThrough_FiltersArray( filterValue = 1 ) {

    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === this.AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === this.AvgMax_Or_ChannelMultiplier ) ) {
      return null; // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    }

    // Make up a depthwise convolution filter.
    let depthwiseFiltersArray = new Array( this.filterHeight * this.filterWidth * this.imageInDepth * this.channelMultiplier );

    // There is only one position (inside the effect depthwise filter) with value one. All other positions of the filter should be zero.
    let oneEffectFilterY = this.padHeightTop;
    let oneEffectFilterX = this.padWidthLeft;

    // Note: Unfortunately, this does not work for ( dilation > 1 ). So, only ( dilation == 1 ) is supported.
    for ( let inChannel = 0; inChannel < this.imageInDepth; ++inChannel ) {

      for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub ) {

        for ( let filterY = 0, effectFilterY = 0; filterY < this.filterHeight; ++filterY ) {
          for ( let dilationFilterY = 0; dilationFilterY < this.dilationHeight; ++dilationFilterY, ++effectFilterY ) {
            let filterIndexBaseX = ( filterY * this.filterWidth );

            for ( let filterX = 0, effectFilterX = 0; filterX < this.filterWidth; ++filterX ) {
              for ( let dilationFilterX = 0; dilationFilterX < this.dilationWidth; ++dilationFilterX, ++effectFilterX ) {

                // The filter's dilation part can not be manipulated. (They are always zero.)
                if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
                  continue;

                let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * this.imageOutDepth );
                let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * this.channelMultiplier );

                let filterIndex = filterIndexBaseSubC + outChannelSub;

                if ( ( effectFilterY == oneEffectFilterY ) && ( effectFilterX == oneEffectFilterX ) ) {
//!!! (2021/12/07 Remarked)
//                  depthwiseFiltersArray[ filterIndex ] = 1; // The only one position with value one.
                  depthwiseFiltersArray[ filterIndex ] = filterValue; // The only one position with value non-zero.
                  filterValue
                } else {
                  depthwiseFiltersArray[ filterIndex ] = 0; // All other positions of the filter are value zero.
                }
              }
            }
          }
        }
      }
    }

    return depthwiseFiltersArray;
  }

}

