export { PadInfoCalculator };
export { PadInfoCalculatorRoot };

import * as MultiLayerMap from "../../util/MultiLayerMap.js";
import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";

/**
 * According to input image size and depthwise convolution parameters,
 * calculate the padding information of the depthwise convolution.
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
 * @member {string}                    stridesPad_NameWithInt  The debug name of stridesPad. (e.g. STRIDES_1_PAD_VALID(0))
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
 * @member {number} outputElementCountY   Output image elements count per height (= ( outputWidth * outputChannelCount ) ).
 * @member {number} outputElementCount    Output image elements count (= ( outputHeight * outputElementCountY ) ).
 * 
 * @member {string} TableLog_filterName   The debug name of this depthwise operation. (e.g. conv_3x2_STRIDES_1_PAD_VALID(0))
 *
 */
let PadInfoCalculator = ( ParentClass = Object ) => class PadInfoCalculator
  extends Recyclable.Base( ParentClass ) {

  /**
   * Used as default Depthwise.PadInfoCalculator provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "Depthwise.PadInfoCalculator.Pool",
    PadInfoCalculator );

  /**
   *
   */
  constructor(
    inputHeight, inputWidth, inputChannelCount,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    ...restArgs ) {

    super( ...restArgs );
    this.#setAsConstructor_self(
      inputHeight, inputWidth, inputChannelCount,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
  }

  /** @override */
  setAsConstructor(
    inputHeight, inputWidth, inputChannelCount,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad,
    ...restArgs ) {

    super.setAsConstructor.apply( this, restArgs );
    this.#setAsConstructor_self(
      inputHeight, inputWidth, inputChannelCount,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
  }

  /**  */
  #setAsConstructor_self(
    inputHeight, inputWidth, inputChannelCount,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) {
    this.set( inputHeight, inputWidth, inputChannelCount,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
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
    this.stridesPad_NameWithInt = undefined;

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
    this.outputElementCountY = undefined;
    this.outputElementCount = undefined;

    this.TableLog_filterName = undefined;

    super.disposeResources();
  }

  /**
   *
   */
  set( inputHeight, inputWidth, inputChannelCount,
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) {

    this.inputHeight = inputHeight;
    this.inputWidth = inputWidth;
    this.inputChannelCount = inputChannelCount;
    this.AvgMax_Or_ChannelMultiplier = AvgMax_Or_ChannelMultiplier;
    this.filterHeight = filterHeight;
    this.filterWidth = filterWidth;
    this.stridesPad = stridesPad;

    // Q: What about ( filterHeight <= 0 ) or ( filterWidth <= 0 )?
    // A: The result is unknown.

    this.channelMultiplier = AvgMax_Or_ChannelMultiplier;
    if (   ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG
               === AvgMax_Or_ChannelMultiplier )
        || ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX
               === AvgMax_Or_ChannelMultiplier ) ) {
      this.channelMultiplier = 1;
    }

    this.filterSize = this.filterHeight * this.filterWidth;

    // Strides and Padding.
    this.stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfo_byId( stridesPad );
    {
      // If not found, using default which could let add-input-to-output possible.
      if ( !this.stridesPadInfo ) {
        const stridesPad_default
          = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

        this.stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfo_byId(
          stridesPad_default );

        this.stridesPad_NameWithInt
          = ValueDesc.StridesPad.Singleton.getNameWithInt_byId(
              stridesPad_default );

      } else {
        this.stridesPad_NameWithInt
          = ValueDesc.StridesPad.Singleton.getNameWithInt_byId( stridesPad );
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

    // (The following codes for output image height and width and padding calculation
    // are copied from
    // https://github.com/tensorflow/tfjs/blob/tfjs-v3.8.0/tfjs-core/src/ops/conv_util.ts)
    {
      // Determine output image height and width without padding.
      if ( this.stridesPadInfo.pad_isValid() ) {
        this.outputHeight = Math.ceil(
          ( inputHeight - this.effectFilterHeight + 1 ) / this.stridesHeight );
        this.outputWidth =  Math.ceil(
          ( inputWidth  - this.effectFilterWidth  + 1 ) / this.stridesWidth  );

        this.padHeight = this.padHeightTop = this.padHeightBottom
          = this.padWidth = this.padWidthLeft = this.padWidthRight = 0;

        if ( ( this.outputHeight <= 0 ) || ( this.outputWidth <= 0 ) )
          throw Error(
            `Depthwise.PadInfoCalculator.set(): `
              + `effect filter ( height, width )=`
                + `( ${this.effectFilterHeight}, ${this.effectFilterWidth} ) `
              + `should not be larger than `
              + `image input ( height, width )=( ${inputHeight}, ${inputWidth} ) `
              + `when pad="valid".`
          );

      // Determine output image height and width with padding around the input
      // image height and width.
      } else if ( this.stridesPadInfo.pad_isSame() ) {
        this.outputHeight = Math.ceil( inputHeight / this.stridesHeight );
        this.outputWidth =  Math.ceil( inputWidth  / this.stridesWidth  );

        this.padHeight = Math.max( 0,
          ( this.outputHeight - 1 ) * this.stridesHeight
            + this.effectFilterHeight - inputHeight );

        this.padWidth =  Math.max( 0,
          ( this.outputWidth  - 1 ) * this.stridesWidth
            + this.effectFilterWidth  - inputWidth  );

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
    this.outputElementCountY = this.outputWidth * this.outputChannelCount;
    this.outputElementCount = this.outputHeight * this.outputElementCountY;
  }

  /**
   * @return {string}
   *   A string describing the name of this depthwise operation. It is mainly
   * used for table log.
   *   - If .TableLog_filterName exists, return it directly.
   *   - Otherwise, create and return it.
   */
  TableLog_filterName_get() {
    if ( this.TableLog_filterName )
      return this.TableLog_filterName; // Return cached name.

    this.TableLog_filterName
      = Depthwise_FilterName_Bag.Singleton.get_by(
          this.AvgMax_Or_ChannelMultiplier,
          this.filterHeight, this.filterWidth, this.stridesPad );

    return this.TableLog_filterName;
  }

  /**
   * @return {boolean}
   *   If the channel count of this depthwise operation's output is the same as
   * its input, return true.
   */
  output_channelCount_is_same_as_input() {
    return PadInfoCalculator.output_channelCount_is_same_as_input(
      this.AvgMax_Or_ChannelMultiplier );
  }

  /**
   * @return {boolean}
   *   If the ( height, width ) of this depthwise operation's output is the
   * same as its input, return true.
   */
  output_height_width_is_same_as_input() {
    return PadInfoCalculator.output_height_width_is_same_as_input(
      this.inputHeight, this.inputWidth,
      this.AvgMax_Or_ChannelMultiplier,
      this.filterHeight, this.filterWidth, this.stridesPadInfo );
  }

  /**
   * @return {boolean}
   *   If this depthwise operation does not analyze the neighbor in the
   * direction of height and width, return true.
   */
  output_height_width_is_no_neighbor_analysis() {
    return PadInfoCalculator.output_height_width_is_no_neighbor_analysis(
      this.inputHeight, this.inputWidth,
      this.AvgMax_Or_ChannelMultiplier, this.filterHeight, this.filterWidth );
  }


  /**
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier
   *   Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.Xxx)
   *
   * @return {boolean}
   *   If the channel count of the depthwise operation's output is the same as
   * its input, return true.
   */
  static output_channelCount_is_same_as_input(
    depthwise_AvgMax_Or_ChannelMultiplier ) {

    // e.g. avg pooling, or max pooling, or none, or ( channelMultipler == 1 ).
    return ( depthwise_AvgMax_Or_ChannelMultiplier <= 1 );
  }

  /**
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier
   *   Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.Xxx)
   *
   * @param {ValueDesc.StridesPad.Info} depthwiseStridesPadInfo
   *   The information of stridesPad.
   *
   * @return {boolean}
   *   If the ( height, width ) of the depthwise operation's output is the same
   * as its input, return true.
   */
  static output_height_width_is_same_as_input(
    inputHeight, inputWidth,
    depthwise_AvgMax_Or_ChannelMultiplier,
    depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPadInfo
  ) {
    return (
         // (0), no-op
         ( depthwise_AvgMax_Or_ChannelMultiplier
             == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE )

         // input's height and width can not be shrinked any more.
      || ( ( 1 == inputHeight ) && ( 1 == inputWidth ) )

      || (
             // Not shrinked by strides.
             ( 1 == depthwiseStridesPadInfo.strides )

          && (
                 // Not shrinked by filters for ( pad is "same" ).
                 (   ( depthwiseStridesPadInfo.pad_isSame() ) )

                 // Not shrinked by filters for ( pad is "valid" ).
                 // (i.e. ( filter size is 1x1 ) )
              || (   ( depthwiseStridesPadInfo.pad_isValid() )
                  && ( 1 == depthwiseFilterHeight )
                  && ( 1 == depthwiseFilterWidth ) )
             )
         )
    );
  }

  /**
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier
   *   Depthwise operation. (ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.Xxx)
   *
   * @return {boolean}
   *   If the depthwise operation does not analyze the neighbor in the
   * direction of height and width, return true.
   */
  static output_height_width_is_no_neighbor_analysis(
    inputHeight, inputWidth,
    depthwise_AvgMax_Or_ChannelMultiplier,
    depthwiseFilterHeight, depthwiseFilterWidth
  ) {
    return (
         // (0), no-op
         ( depthwise_AvgMax_Or_ChannelMultiplier
             == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE )

         // input's height and width do not have neighbor to be analyzed.
      || ( ( 1 == inputHeight ) && ( 1 == inputWidth ) )

         // The filters do not analyze any neighbor.
      || ( ( 1 == depthwiseFilterHeight ) && ( 1 == depthwiseFilterWidth ) )
    );
  }

}


/**
 * Almost the same as Depthwise.PadInfoCalculator class except its parent class
 * is fixed to Object. In other words, caller can not specify the parent class
 * of Depthwise.PadInfoCalculatorRoot (so it is named "Root" which can not have
 * parent class).
 */
class PadInfoCalculatorRoot extends PadInfoCalculator() {
}


/**
 * A pool for Depthwise operation debug name
 * (e.g. conv_3x2_STRIDES_1_PAD_VALID(0))
 *
 * It could reduce re-creating them again and again so that memory heap
 * fragmentation could be reduced (and then performance be improved).
 */
class Depthwise_FilterName_Bag extends MultiLayerMap.Base {

  /**  */
  constructor() {
    super();
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
  }

  /**
   * @see Depthwise_FilterName_Bag.create_by()
   */
  get_by(
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) {

    return this.get_or_create_by_arguments1_etc(
      Depthwise_FilterName_Bag.create_by, this,
      AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad );
  }

  /**
   * @param {number} AvgMax_Or_ChannelMultiplier
   *   Depthwise operation (avg, max, or channel multiplier).
   * (ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.Xxx)
   *
   * @param {number} filterHeight
   *   The height of the depthwise convolution's filter.
   *
   * @param {number} filterWidth
   *   The width of the depthwise convolution's filter.
   *
   * @param {number} stridesPad
   *   The strides and padding of (depthwise) convolution.
   * (ValueDesc.StridesPad.Singleton.Ids.Xxx)
   *
   * @return {string}
   *   Return a string "conv_3x2_STRIDES_1_PAD_VALID(0)" according to the
   * above parameters.
   */
  static create_by(
    AvgMax_Or_ChannelMultiplier, filterHeight, filterWidth, stridesPad ) {

    // 1.
    let op_name;
    if ( AvgMax_Or_ChannelMultiplier < 0 ) {

      switch ( AvgMax_Or_ChannelMultiplier ) {
        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG:
          op_name = "avg";
          break;

        case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX:
          op_name = "max";
          break;

        default:
          op_name
            = `unknown( AvgMax_Or_ChannelMultiplier = ${AvgMax_Or_ChannelMultiplier} )`;
          break;
      }

    } else if ( AvgMax_Or_ChannelMultiplier == 0 ) {
      op_name = `none`;

    } else { // ( AvgMax_Or_ChannelMultiplier > 0 )
      op_name = `conv_channelMultiplier_${AvgMax_Or_ChannelMultiplier}`;
    }

    // 2. operator size
    const op_size = `${filterHeight}x${filterWidth}`;

    // 3. stridesPad
    const stridesPad_NameWithInt
      = ValueDesc.StridesPad.Singleton.getNameWithInt_byId( stridesPad );

    // 4. 
    const depthwise_filterName
      = `${op_name}_${op_size}_${stridesPad_NameWithInt}`;

    return depthwise_filterName;
  }

}

Depthwise_FilterName_Bag.Singleton = new Depthwise_FilterName_Bag();
