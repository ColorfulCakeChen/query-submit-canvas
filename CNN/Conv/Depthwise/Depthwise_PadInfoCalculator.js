export { PadInfoCalculator };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";

/**
 * According to input image size and depthwise convolution parameters, calculate the padding information of the depthwise convolution.
 *
 * @member {number} inputHeight           Input image height.
 * @member {number} inputWidth            Input image width.
 * @member {number} inputChannelCount     Input image channel count.
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
 * @member {number} outputHeight          Output image height.
 * @member {number} outputWidth           Output image width.
 * @member {number} outputChannelCount    Output image channel count.
 * @member {number} outputElementCount    Output image elements count (= ( outputHeight * outputWidth * outputChannelCount ) ).
 */
let PadInfoCalculator = ( Base = Object ) => class extends Base {

  constructor( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) {
    super();
    this.set( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
  }

  /**
   *
   */
  set( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) {
    this.inputHeight = inputHeight;
    this.inputWidth = inputWidth;
    this.inputChannelCount = inputChannelCount;
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
        this.outputHeight = Math.ceil( ( inputHeight - this.effectFilterHeight + 1 ) / this.stridesHeight );
        this.outputWidth =  Math.ceil( ( inputWidth  - this.effectFilterWidth  + 1 ) / this.stridesWidth  );

        this.padHeight = this.padHeightTop = this.padHeightBottom = this.padWidth = this.padWidthLeft = this.padWidthRight = 0;

      // Determine output image height and width with padding around the input image height and width.
      } else if ( this.pad == "same" ) {
        this.outputHeight = Math.ceil( inputHeight / this.stridesHeight );
        this.outputWidth =  Math.ceil( inputWidth  / this.stridesWidth  );

        this.padHeight = Math.max( 0, ( this.outputHeight - 1 ) * this.stridesHeight + this.effectFilterHeight - inputHeight );
        this.padWidth =  Math.max( 0, ( this.outputWidth  - 1 ) * this.stridesWidth  + this.effectFilterWidth  - inputWidth  );

        this.padHeightTop =    Math.floor( this.padHeight / 2 );
        this.padHeightBottom = this.padHeight - this.padHeightTop;
        this.padWidthLeft =    Math.floor( this.padWidth /  2 );
        this.padWidthRight =   this.padWidth  - this.padWidthLeft;
      }
    }

    this.outputChannelCount = inputChannelCount * this.channelMultiplier;
    this.outputElementCount = ( this.outputHeight * this.outputWidth * this.outputChannelCount );
  }

  /**
   * @return {boolean}
   *   If the ( height, width ) of this depthwise operation output is the same as its input, return true.
   */
  is_Output_Same_HeightWidth_As_Input() {

    // If this depthwise operation does not existed, the output will have the same ( height, width ) as input.
    // In fact, they are the same one in this case.
    if ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE === this.AvgMax_Or_ChannelMultiplier )
      return true;

    if ( this.strides != 1 )
      return false; // If strides is not 1, it is impossible to output same ( height, width ) as input.

    if ( this.pad == "same" )
      return true; // If ( strides is 1 ) and ( pad is "same" ), the output will have the same ( height, width ) as input.

    // Or, although ( strides is 1 ) and ( pad is "valid" ) but ( filter size is 1x1 ), the output will have the same ( height, width ) as input.
    if ( ( this.pad == "valid" ) && ( this.filterHeight == 1 ) && ( this.filterWidth == 1 ) )
      return true;

    return false;
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
    let depthwiseFiltersArray = new Array( this.filterHeight * this.filterWidth * this.inputChannelCount * this.channelMultiplier );

    // There is only one position (inside the effect depthwise filter) with value one. All other positions of the filter should be zero.
    let oneEffectFilterY = this.padHeightTop;
    let oneEffectFilterX = this.padWidthLeft;

    // Note: Unfortunately, this may not work for ( dilation > 1 ) because the non-zero-filter-value might be just at the dilation
    //       position which does not exist in a filter. So, only ( dilation == 1 ) is supported.

//    let filterIndex = 0; // The index in the filter weights array.

    for ( let filterY = 0, effectFilterY = 0; filterY < this.filterHeight; ++filterY ) {
      for ( let dilationFilterY = 0; dilationFilterY < this.dilationHeight; ++dilationFilterY, ++effectFilterY ) {

        let filterIndexBaseX = ( filterY * this.filterWidth );

        for ( let filterX = 0, effectFilterX = 0; filterX < this.filterWidth; ++filterX ) {
          for ( let dilationFilterX = 0; dilationFilterX < this.dilationWidth; ++dilationFilterX, ++effectFilterX ) {

            // The filter's dilation part can not be manipulated. (They are always zero.)
            if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
              continue;

            let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * this.outputChannelCount );

            for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {

              for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub ) {

                let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * this.channelMultiplier );

                let filterIndex = filterIndexBaseSubC + outChannelSub;

                if ( ( effectFilterY == oneEffectFilterY ) && ( effectFilterX == oneEffectFilterX ) ) {
                  depthwiseFiltersArray[ filterIndex ] = filterValue; // The only one position with value non-zero.
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

//!!! ...unfinished... (2021/12/26) For testing to find out how to arrange the for-loop so that the filterIndex is in sequence order.
// This will be used how to extract depthwise filters value faster.

  test_findOut_filterIndex_inSequence() {

//    let filterIndexArray = new Array( this.filterHeight * this.filterWidth * this.inputChannelCount * this.channelMultiplier );
    let filterIndexArray = new Array();

    for ( let filterY = 0, effectFilterY = 0; filterY < this.filterHeight; ++filterY ) {
      for ( let dilationFilterY = 0; dilationFilterY < this.dilationHeight; ++dilationFilterY, ++effectFilterY ) {
        let filterIndexBaseX = ( filterY * this.filterWidth );

        for ( let filterX = 0, effectFilterX = 0; filterX < this.filterWidth; ++filterX ) {
          for ( let dilationFilterX = 0; dilationFilterX < this.dilationWidth; ++dilationFilterX, ++effectFilterX ) {

            // The filter's dilation part needs not be extracted from weights array. (They are always zero.)
            if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
              continue;

            let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * this.outputChannelCount );

            for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {

              for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub ) {

                  let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * this.channelMultiplier );

                  let filterIndex = filterIndexBaseSubC + outChannelSub;

                  filterIndexArray.push( filterIndex );
                  //console.log( `${filterIndex}, ` );

              }
            }
          }
        }
      }
    }

    return filterIndexArray;
    //debugger;
    
// let inputHeight = 10;
// let inputWidth = 10;
// let inputChannelCount = 2;
// let AvgMax_Or_ChannelMultiplier = 2; //2;
// let filterHeight = 2; //3;
// let filterWidth = 2; //3;
// let stridesPad = 0;
//
// let padInfo = new ( PadInfoCalculator() )( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) ;
// let filterIndexArray = padInfo.test_findOut_filterIndex_inSequence();
// console.log( filterIndexArray );

  }

}

