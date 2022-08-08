export { PadInfoCalculator };
export { PadInfoCalculatorRoot };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";

/**
 * According to input image size and depthwise convolution parameters, calculate the padding information of the depthwise convolution.
 *
 * @member {number} inputHeight           Input image height.
 * @member {number} inputWidth            Input image width.
 * @member {number} inputChannelCount     Input image channel count.
 * @member {number} AvgMax_Or_ChannelMultiplier   Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.Xxx)
 * @member {number} filterHeight          The height of the depthwise convolution's filter.
 * @member {number} filterWidth           The width of the depthwise convolution's filter.
 * @member {number} stridesPad            The strides and padding of (depthwise) convolution. (ValueDesc.StridesPad.Singleton.Ids.Xxx)
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
 * @member {ValueDesc.StridesPad.Info} stridesPadInfo  The information getted according to stridesPad.
 *
 * @member {number} strides               The strides along the image's height and width dimension (according to stridesPad).
 * @member {number} stridesHeight         The strides along the image's height dimension (according to stridesPad).
 * @member {number} stridesWidth          The strides along the image's width dimension (according to stridesPad).
 *
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
let PadInfoCalculator = ( ParentClass = Object ) => class PadInfoCalculator extends Recyclable.Base( ParentClass ) {

  /**
   * Used as default Depthwise.PadInfoCalculator provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Depthwise.PadInfoCalculator.Pool", PadInfoCalculator, PadInfoCalculator.setAsConstructor );

  /**
   *
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad, ...restArgs ) {

    super( ...restArgs );
    PadInfoCalculator.setAsConstructor_self.call( this,
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
  }

  /** @override */
  static setAsConstructor(
     inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad, ...restArgs ) {

    super.setAsConstructor.apply( this, restArgs );
    PadInfoCalculator.setAsConstructor_self.call( this,
      inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) {
    this.set( inputHeight, inputWidth, inputChannelCount, AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
  }

  /** @override */
  disposeResources() {
    this.inputHeight = undefined;
    this.inputWidth = undefined;
    this.inputChannelCount = undefined;
    this.AvgMax_Or_ChannelMultiplier = undefined;
    this.filterHeight = undefined;
    this.filterWidth = undefined;
    this.stridesPad = undefined;

    this.channelMultiplier = undefined;

    this.filterSize = undefined;

    this.stridesPadInfo = undefined;

    this.strides = undefined;
    this.pad = undefined;

    this.stridesHeight = undefined;
    this.stridesWidth = undefined;

    this.dilationHeight = undefined;
    this.dilationWidth = undefined;

    this.effectFilterHeight = undefined;
    this.effectFilterWidth = undefined;
    this.effectFilterSize = undefined;

    this.outputHeight = undefined;
    this.outputWidth = undefined;

    this.padHeight = undefined;
    this.padWidth = undefined;

    this.padHeightTop = undefined;
    this.padHeightBottom = undefined;
    this.padWidthLeft = undefined;
    this.padWidthRight = undefined;

    this.outputChannelCount = undefined;
    this.outputElementCount = undefined;

    super.disposeResources();
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
    this.stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfo_byId( stridesPad );
    {
      if ( !this.stridesPadInfo ) { // If not found, using default which could let add-input-to-output possible.
        this.stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfo_byId( ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME );
      }

      this.strides = this.stridesPadInfo.strides;
      this.pad = this.stridesPadInfo.pad;
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
      if ( this.stridesPadInfo.pad_isValid() ) {
        this.outputHeight = Math.ceil( ( inputHeight - this.effectFilterHeight + 1 ) / this.stridesHeight );
        this.outputWidth =  Math.ceil( ( inputWidth  - this.effectFilterWidth  + 1 ) / this.stridesWidth  );

        this.padHeight = this.padHeightTop = this.padHeightBottom = this.padWidth = this.padWidthLeft = this.padWidthRight = 0;

        if ( ( this.outputHeight <= 0 ) || ( this.outputWidth <= 0 ) )
          throw Error(
            `Depthwise.PadInfoCalculator.set(): `
              + `effect filter ( height, width )=( ${this.effectFilterHeight}, ${this.effectFilterWidth} ) `
              + `should not be larger than `
              + `image input ( height, width )=( ${inputHeight}, ${inputWidth} ) `
              + `when pad="valid".`
          );

      // Determine output image height and width with padding around the input image height and width.
      } else if ( this.stridesPadInfo.pad_isSame() ) {
        this.outputHeight = Math.ceil( inputHeight / this.stridesHeight );
        this.outputWidth =  Math.ceil( inputWidth  / this.stridesWidth  );

        this.padHeight = Math.max( 0, ( this.outputHeight - 1 ) * this.stridesHeight + this.effectFilterHeight - inputHeight );
        this.padWidth =  Math.max( 0, ( this.outputWidth  - 1 ) * this.stridesWidth  + this.effectFilterWidth  - inputWidth  );

        this.padHeightTop =    Math.floor( this.padHeight / 2 );
        this.padHeightBottom = this.padHeight - this.padHeightTop;
        this.padWidthLeft =    Math.floor( this.padWidth /  2 );
        this.padWidthRight =   this.padWidth  - this.padWidthLeft;

      } else {
        throw Error(
          `Depthwise.PadInfoCalculator.set(): `
            + `stridesPadInfo.pad ( ${this.stridesPadInfo.pad} ) is unknown value.`
        );
      }
    }

    this.outputChannelCount = inputChannelCount * this.channelMultiplier;
    this.outputElementCount = ( this.outputHeight * this.outputWidth * this.outputChannelCount );
  }


  /** @return {boolean} If the channel count of this depthwise operation's output is the same as its input, return true. */
  output_channelCount_is_same_as_input() {
    return PadInfoCalculator.output_channelCount_is_same_as_input( this.AvgMax_Or_ChannelMultiplier );
  }

  /** @return {boolean} If the ( height, width ) of this depthwise operation's output is the same as its input, return true. */
  output_height_width_is_same_as_input() {
    return PadInfoCalculator.output_height_width_is_same_as_input( this.inputHeight, this.inputWidth,
      this.AvgMax_Or_ChannelMultiplier, this.filterHeight, this.filterWidth, this.stridesPadInfo );
  }

  /** @return {boolean} If this depthwise operation does not analyze the neighbor in the direction of height and width, return true. */
  output_height_width_is_no_neighbor_analysis() {
    return PadInfoCalculator.output_height_width_is_no_neighbor_analysis( this.inputHeight, this.inputWidth,
      this.AvgMax_Or_ChannelMultiplier, this.filterHeight, this.filterWidth );
  }


  /**
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier  Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.Xxx)
   *
   * @return {boolean} If the channel count of the depthwise operation's output is the same as its input, return true.
   */
  static output_channelCount_is_same_as_input( depthwise_AvgMax_Or_ChannelMultiplier ) {
    return ( depthwise_AvgMax_Or_ChannelMultiplier <= 1 ); // e.g. avg pooling, or max pooling, or none, or ( channelMultipler == 1 ).
  }

  /**
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier       Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.Xxx)
   * @param {ValueDesc.StridesPad.Info} depthwiseStridesPadInfo  The information of stridesPad.
   *
   * @return {boolean} If the ( height, width ) of the depthwise operation's output is the same as its input, return true.
   */
  static output_height_width_is_same_as_input(
    inputHeight, inputWidth,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPadInfo
  ) {
    return (
         ( depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) // (0), no-op
      || ( ( 1 == inputHeight ) && ( 1 == inputWidth ) )  // input's height and width can not be shrinked any more.
      || (   ( 1 == depthwiseStridesPadInfo.strides )     // Not shrinked by strides.
          && (   ( depthwiseStridesPadInfo.pad_isSame() ) // Not shrinked by filters for ( pad is "same" ).
              || ( depthwiseStridesPadInfo.pad_isValid() && ( 1 == depthwiseFilterHeight ) && ( 1 == depthwiseFilterWidth ) ) // Not shrinked by filters for ( pad is "valid" ). (i.e. ( filter size is 1x1 ) )
             )
         )
    );
  }

  /**
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier  Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.Xxx)
   *
   * @return {boolean} If the depthwise operation does not analyze the neighbor in the direction of height and width, return true.
   */
  static output_height_width_is_no_neighbor_analysis(
    inputHeight, inputWidth,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth
  ) {
    return (
         ( depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) // (0), no-op
      || ( ( 1 == inputHeight ) && ( 1 == inputWidth ) )  // input's height and width do not have neighbor to be analyzed.
      || ( ( 1 == depthwiseFilterHeight ) && ( 1 == depthwiseFilterWidth ) ) // The filters do not analyze any neighbor.
    );
  }

}


/**
 * Almost the same as Depthwise.PadInfoCalculator class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of Depthwise.PadInfoCalculatorRoot (so it is named "Root" which can not have parent class).
 */
class PadInfoCalculatorRoot extends PadInfoCalculator() {
}

