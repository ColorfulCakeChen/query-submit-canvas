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
 * @member {number} stridesPad            The strides and padding of (depthwise) convolution. (ValueDesc.StridesPad)
 *
 * @member {number} channelMultiplier     The channel multiplier of the depthwise operation (according to AvgMax_Or_ChannelMultiplier).
 * @member {number} filterSize            The size of the depthwise convolution's filter. (= filterHeight * filterWidth)
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
let PadInfoCalculator = ( ParentClass = Object ) => class extends ParentClass {

  constructor( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad, ...restArgs ) {
    super( ...restArgs );
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

    this.filterSize = this.filterHeight * this.filterWidth;

    // Strides and Padding.
    let stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfoById( stridesPad );
    {
//!!! (2022/06/10 Remarked) Use StridesPad.Info instead.
//       switch ( stridesPad ) {
//         case ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID: this.strides = 1; this.pad = "valid"; break; // (0)
//         default:
//         case ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME:  this.strides = 1; this.pad = "same";  break; // (1)
//         case ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME:  this.strides = 2; this.pad = "same";  break; // (2)
//         case ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID: this.strides = 2; this.pad = "valid"; break; // (3)
//       }

      stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfoById( stridesPad );
      if ( !stridesPadInfo ) { // If not found, using default which could let add-input-to-output possible.
        stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfoById( ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME );
      }

      this.strides = stridesPadInfo.strides;
      this.pad = stridesPadInfo.pad;
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
      if ( stridesPadInfo.pad_isValid() ) {
        this.outputHeight = Math.ceil( ( inputHeight - this.effectFilterHeight + 1 ) / this.stridesHeight );
        this.outputWidth =  Math.ceil( ( inputWidth  - this.effectFilterWidth  + 1 ) / this.stridesWidth  );

        this.padHeight = this.padHeightTop = this.padHeightBottom = this.padWidth = this.padWidthLeft = this.padWidthRight = 0;

      // Determine output image height and width with padding around the input image height and width.
      } else if ( stridesPadInfo.pad_isSame() ) {
        this.outputHeight = Math.ceil( inputHeight / this.stridesHeight );
        this.outputWidth =  Math.ceil( inputWidth  / this.stridesWidth  );

        this.padHeight = Math.max( 0, ( this.outputHeight - 1 ) * this.stridesHeight + this.effectFilterHeight - inputHeight );
        this.padWidth =  Math.max( 0, ( this.outputWidth  - 1 ) * this.stridesWidth  + this.effectFilterWidth  - inputWidth  );

        this.padHeightTop =    Math.floor( this.padHeight / 2 );
        this.padHeightBottom = this.padHeight - this.padHeightTop;
        this.padWidthLeft =    Math.floor( this.padWidth /  2 );
        this.padWidthRight =   this.padWidth  - this.padWidthLeft;

      } else {
        tf.util.assert( false,
          `Depthwise.PadInfoCalculator.set(): `
            + `stridesPadInfo.pad ( ${stridesPadInfo.pad} ) is unknown value.`
        );
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
   * If both effectFilterValue and otherFilterValue are the same as ( 1 / ( filterHeight * filter Width ) ), the result filter
   * will have the same effect as average pooling.
   *
   *
   * @param {number} effectFilterValue
   *   The filter value used for the effect input pixel of the depthwise convolution. For pass-through, it is usually 1.
   * Note: It is not always just at center of filter according to the filter shape and paddding.
   *
   * @param {number} surroundingFilterValue
   *   The filter value used for the surrounding input pixel of the depthwise convolution. For pass-through, it is usually 0.
   *
   * @return {number[]} 
   *   Return the depthwise convolution filters which could pass the input to output unchangely.
   */
  generate_PassThrough_FiltersArray( effectFilterValue, surroundingFilterValue ) {

    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === this.AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === this.AvgMax_Or_ChannelMultiplier ) ) {
      return null; // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    }

    // Make up a depthwise convolution filter.
    let depthwiseFiltersArray = new Array( this.filterHeight * this.filterWidth * this.inputChannelCount * this.channelMultiplier );

    // There is only one position (inside the effect depthwise filter) uses effectFilterValue.
    // All other positions of the filter should be surroundingFilterValue.
    //
    let oneEffectFilterY = this.padHeightTop;
    let oneEffectFilterX = this.padWidthLeft;

    // Note: Unfortunately, this may not work for ( dilation > 1 ) because the non-zero-filter-value might be just at the dilation
    //       position which does not exist in a filter. So, only ( dilation == 1 ) is supported.


//!!! ...unfinished... (2021/12/26) Since these for-loop are in correct order, the filterIndex could just begin at zero and then
// be increased one by one (i.e. without using multiplication).
//
    let filterIndex = 0; // The index in the filter weights array.

    for ( let filterY = 0, effectFilterY = 0; filterY < this.filterHeight; ++filterY ) {
      for ( let dilationFilterY = 0; dilationFilterY < this.dilationHeight; ++dilationFilterY, ++effectFilterY ) {

//!!! (2022/05/26 Remarked) Replaced by filterIndex increment.
//        let filterIndexBaseX = ( filterY * this.filterWidth );

        for ( let filterX = 0, effectFilterX = 0; filterX < this.filterWidth; ++filterX ) {
          for ( let dilationFilterX = 0; dilationFilterX < this.dilationWidth; ++dilationFilterX, ++effectFilterX ) {

            // The filter's dilation part can not be manipulated. (They are always zero.)
            if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
              continue;

//!!! (2022/05/26 Remarked) Replaced by filterIndex increment.
//            let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * this.outputChannelCount );

            for ( let inChannel = 0; inChannel < this.inputChannelCount; ++inChannel ) {

//!!! (2022/05/26 Remarked) Replaced by filterIndex increment.
//              let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * this.channelMultiplier );

              for ( let outChannelSub = 0; outChannelSub < this.channelMultiplier; ++outChannelSub ) {

//!!! (2022/05/26 Remarked) Replaced by filterIndex increment.
//                let filterIndex = filterIndexBaseSubC + outChannelSub;

                if ( ( effectFilterY == oneEffectFilterY ) && ( effectFilterX == oneEffectFilterX ) ) {
                  depthwiseFiltersArray[ filterIndex ] = effectFilterValue;
                } else {
                  depthwiseFiltersArray[ filterIndex ] = surroundingFilterValue;
                }

                ++filterIndex;
              }
            }
          }
        }
      }
    }

    return depthwiseFiltersArray;
  }

}

