export { Stage_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Depthwise from "../Depthwise.js";

/**
 * All properties inferenced from Stage.Params.
 *
 * @member {number[]} inputHeightArray
 *   The height of input image of every block.
 *
 * @member {number[]} inputWidthArray
 *   The width of input image of every block.
 *
 * @member {number[]} outputHeightArray
 *   The height of output image of every block.
 *
 * @member {number[]} outputWidthArray
 *   The width of output image of every block.
 *
 * @member {number} outputHeight
 *   The height of output image. Usually, it is roughly half of the input height
 * (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} outputWidth
 *   The width of output image. Usually, it is roughly half of the input width
 * (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} outputChannelCount
 *   The channel count of output image. Usually, it is double the input channel count.
 *
 * @member {number[]} depthwiseFilterHeightArray
 *   The depthwise filter height of input image of every block.
 *
 * @member {number[]} depthwiseFilterWidthArray
 *   The depthwise filter width of input image of every block.
 *
 */
class Stage_InferencedParams extends Recyclable.Root {

  /**
   * Used as default Stage.InferencedParams provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.InferencedParams.Pool",
    Stage_InferencedParams, Stage_InferencedParams.setAsConstructor );

  /**
   *
   */
  constructor(
    sourceHeight, sourceWidth, sourceChannelCount,
    nConvStageTypeId,
    blockCountRequested,
    depthwiseFilterHeight, depthwiseFilterWidth
  ) {
    super();
    Stage_InferencedParams.setAsConstructor_self.call( this,
      sourceHeight, sourceWidth, sourceChannelCount,
      nConvStageTypeId,
      blockCountRequested,
      depthwiseFilterHeight, depthwiseFilterWidth
    );
  }

  /** @override */
  static setAsConstructor(
    sourceHeight, sourceWidth, sourceChannelCount,
    nConvStageTypeId,
    blockCountRequested,
    depthwiseFilterHeight, depthwiseFilterWidth
  ) {
    super.setAsConstructor();
    Stage_InferencedParams.setAsConstructor_self.call( this,
      sourceHeight, sourceWidth, sourceChannelCount,
      nConvStageTypeId,
      blockCountRequested,
      depthwiseFilterHeight, depthwiseFilterWidth
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    sourceHeight, sourceWidth, sourceChannelCount,
    nConvStageTypeId,
    blockCountRequested,
    depthwiseFilterHeight, depthwiseFilterWidth
  ) {
    Stage_InferencedParams.set_inferencedParams_by.call( this,
      sourceHeight, sourceWidth, sourceChannelCount,
      nConvStageTypeId,
      blockCountRequested,
      depthwiseFilterHeight, depthwiseFilterWidth
    );
  }

  /** @override */
  disposeResources() {
    this.height_width_array_dispose();

    this.outputChannelCount = undefined;
    this.outputWidth = undefined;
    this.outputHeight = undefined;

    super.disposeResources();
  }

  /** Release .xxxHeightArray and .xxxWidthArray */
  height_width_array_dispose() {

    if ( this.depthwiseFilterWidthArray ) {
      this.depthwiseFilterWidthArray.disposeResources_and_recycleToPool();
      this.depthwiseFilterWidthArray = null;
    }

    if ( this.depthwiseFilterHeightArray ) {
      this.depthwiseFilterHeightArray.disposeResources_and_recycleToPool();
      this.depthwiseFilterHeightArray = null;
    }

    if ( this.outputWidthArray ) {
      this.outputWidthArray.disposeResources_and_recycleToPool();
      this.outputWidthArray = null;
    }

    if ( this.outputHeightArray ) {
      this.outputHeightArray.disposeResources_and_recycleToPool();
      this.outputHeightArray = null;
    }

    if ( this.inputWidthArray ) {
      this.inputWidthArray.disposeResources_and_recycleToPool();
      this.inputWidthArray = null;
    }

    if ( this.inputHeightArray ) {
      this.inputHeightArray.disposeResources_and_recycleToPool();
      this.inputHeightArray = null;
    }
  }

  /**
   * Determine the following properties:
   *   - this.inputHeightArray
   *   - this.inputWidthArray
   *   - this.outputHeightArray
   *   - this.outputWidthArray
   *   - this.outputHeight
   *   - this.outputWidth
   *   - this.depthwiseFilterWidthArray
   *   - this.depthwiseFilterHeightArray
   *
   * @param {number} sourceHeight  The height of source image.
   * @param {number} sourceWidth   The width of source image.
   */
  static set_outputHeight_outputWidth_by(
    sourceHeight, sourceWidth,
    nConvStageTypeId,
    blockCountRequested,
    depthwiseFilterHeight, depthwiseFilterWidth
  ) {

//!!! ...unfinished... (2022/07/31) should use Stage_BlockParamsCreator to create them.

    this.height_width_array_dispose();
    this.inputHeightArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
    this.inputWidthArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
    this.outputHeightArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
    this.outputWidthArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
    this.depthwiseFilterWidthArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );
    this.depthwiseFilterHeightArray = Recyclable.Array.Pool.get_or_create_by( blockCountRequested );

    // These two parameters are not important for calculating output height and width. Fixing them as constant 1 should be enough.
    const inputChannelCount = 1;
    const AvgMax_Or_ChannelMultiplier = 1;

    let inputHeight, inputWidth, depthwiseFilterHeight_adjusted, depthwiseFilterWidth_adjusted, stridesPad;
    let depthwisePadInfo;

    // block0
    {
      this.inputHeightArray[ 0 ] = inputHeight = sourceHeight;
      this.inputWidthArray[ 0 ] = inputWidth = sourceWidth;

      if ( ValueDesc.ConvStageType.isPadValid( nConvStageTypeId ) ) {

        // When pad is "valid", depthwise conv filter size can not larger than input image size.
        if ( depthwiseFilterHeight > inputHeight )
          this.depthwiseFilterHeightArray[ 0 ] = depthwiseFilterHeight_adjusted = inputHeight;
        else
          this.depthwiseFilterHeightArray[ 0 ] = depthwiseFilterHeight_adjusted = depthwiseFilterHeight;

        if ( depthwiseFilterWidth > inputWidth )
          this.depthwiseFilterWidthArray[ 0 ] = depthwiseFilterWidth_adjusted = inputWidth;
        else
          this.depthwiseFilterWidthArray[ 0 ] = depthwiseFilterWidth_adjusted = depthwiseFilterWidth;

        stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID;

      } else {
        this.depthwiseFilterHeightArray[ 0 ] = depthwiseFilterHeight_adjusted = depthwiseFilterHeight;
        this.depthwiseFilterWidthArray[ 0 ] = depthwiseFilterWidth_adjusted = depthwiseFilterWidth;
        stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;
      }

      depthwisePadInfo = Depthwise.PadInfoCalculatorRoot.Pool.get_or_create_by(
        inputHeight, inputWidth, inputChannelCount,
        AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight_adjusted, depthwiseFilterWidth_adjusted, stridesPad );

      this.outputHeightArray[ 0 ] = depthwisePadInfo.outputHeight;
      this.outputWidthArray[ 0 ] = depthwisePadInfo.outputWidth;
    }

    // block1, 2, 3, ..., blockLast
    for ( let i = 1; i < blockCountRequested; ++i ) {
      this.inputHeightArray[ i ] = inputHeight = depthwisePadInfo.outputHeight;
      this.inputWidthArray[ i ] = inputWidth = depthwisePadInfo.outputWidth;

      if ( ValueDesc.ConvStageType.isPadValid( nConvStageTypeId ) ) {

        // When pad is "valid", depthwise conv filter size can not larger than input image size.
        if ( depthwiseFilterHeight_adjusted > inputHeight )
          this.depthwiseFilterHeightArray[ i ] = depthwiseFilterHeight_adjusted = inputHeight;
        else
          this.depthwiseFilterHeightArray[ i ] = depthwiseFilterHeight_adjusted;

        if ( depthwiseFilterWidth_adjusted > inputWidth )
          this.depthwiseFilterWidthArray[ i ] = depthwiseFilterWidth_adjusted = inputWidth;
        else
          this.depthwiseFilterWidthArray[ i ] = depthwiseFilterWidth_adjusted;

        stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID;

      } else {
        this.depthwiseFilterHeightArray[ i ] = depthwiseFilterHeight_adjusted = depthwiseFilterHeight;
        this.depthwiseFilterWidthArray[ i ] = depthwiseFilterWidth_adjusted = depthwiseFilterWidth;
        stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;
      }

      depthwisePadInfo.set(
        inputHeight, inputWidth, inputChannelCount,
        AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight_adjusted, depthwiseFilterWidth_adjusted, stridesPad );

      this.outputHeightArray[ i ] = depthwisePadInfo.outputHeight;
      this.outputWidthArray[ i ] = depthwisePadInfo.outputWidth;
    }

    this.outputHeight = depthwisePadInfo.outputHeight;
    this.outputWidth = depthwisePadInfo.outputWidth;

    if ( depthwisePadInfo ) {
      depthwisePadInfo.disposeResources_and_recycleToPool();
      depthwisePadInfo = null;
    }

    // In current Stage's design, the output channel always is twice as input.
    this.outputChannelCount = sourceChannelCount * 2;
  }

  /**
   *
   */
  static set_inferencedParams_by(
    sourceHeight, sourceWidth, sourceChannelCount,
    nConvStageTypeId,
    blockCountRequested,
    depthwiseFilterHeight, depthwiseFilterWidth
  ) {
    Stage_InferencedParams.set_outputHeight_outputWidth_by.call( this,
      sourceHeight, sourceWidth,
      nConvStageTypeId,
      blockCountRequested,
      depthwiseFilterHeight, depthwiseFilterWidth
    );
  }

  /** @override */
  toString() {
    let str = ``
      + `outputHeight=${this.outputHeight}, `
      + `outputWidth=${this.outputWidth}, `
      + `outputChannelCount=${this.outputChannelCount}`
    ;
    return str;
  }

}