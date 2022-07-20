export { InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";

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
 *   The height of output image. It is half of the input height (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} outputWidth
 *   The width of output image. It is half of the input width (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 */
class InferencedParams extends Recyclable.Root {

  /**
   * Used as default Stage.InferencedParams provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.InferencedParams.Pool", InferencedParams, InferencedParams.setAsConstructor );

  /**
   *
   */
  constructor(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId
  ) {
    super();
    InferencedParams.setAsConstructor_self.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId
    );
  }

  /** @override */
  static setAsConstructor(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId
  ) {
    super.setAsConstructor();
    InferencedParams.setAsConstructor_self.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId
  ) {
    InferencedParams.set_inferencedParams_by.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId
    );
  }

  /** @override */
  disposeResources() {
    this.height_width_array_dispose();

    this.outputWidth = undefined;
    this.outputHeight = undefined;

    super.disposeResources();
  }

  /** Release .inutHeightArray, .inputWidthArray, .outputHeightArray, .outputWidthArray */
  height_width_array_dispose() {
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

    // These two parameters are not important for calculating output height and width. Fixing them as constant 1 should be enough.
    const inputChannelCount = 1;
    const AvgMax_Or_ChannelMultiplier = 1;

    let inputHeight, inputWidth, depthwiseFilterHeight_adjusted, depthwiseFilterWidth_adjusted, stridesPad;
    let depthwisePadInfo;

    // block0
    {
      inputHeight = sourceHeight;
      inputWidth = sourceWidth

      depthwiseFilterHeight_adjusted = depthwiseFilterHeight;
      depthwiseFilterWidth_adjusted = depthwiseFilterWidth;

      if ( ValueDesc.ConvStageType.isPadValid( nConvStageTypeId ) ) {

        // When pad is "valid", depthwise conv filter size can not larger than input image size.
        if ( depthwiseFilterHeight_adjusted > inputHeight )
          depthwiseFilterHeight_adjusted = inputHeight;

        if ( depthwiseFilterWidth_adjusted > inputWidth )
          depthwiseFilterWidth_adjusted = inputWidth;

        stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID;

      } else {
        stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;
      }

      depthwisePadInfo = Depthwise.PadInfoCalculatorRoot.Pool.get_or_create_by(
        inputHeight, inputWidth, inputChannelCount,
        AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight_adjusted, depthwiseFilterWidth_adjusted, stridesPad );
    }

    // block1, 2, 3, ..., blockLast
    for ( let i = 1; i < blockCountRequested; ++i ) {
      inputHeight = depthwisePadInfo.outputHeight;
      inputWidth = depthwisePadInfo.outputWidth;

      if ( ValueDesc.ConvStageType.isPadValid( nConvStageTypeId ) ) {

        // When pad is "valid", depthwise conv filter size can not larger than input image size.
        if ( depthwiseFilterHeight_adjusted > inputHeight )
          depthwiseFilterHeight_adjusted = inputHeight;

        if ( depthwiseFilterWidth_adjusted > inputWidth )
          depthwiseFilterWidth_adjusted = inputWidth;

        stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID;

      } else {
        stridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;
      }

      depthwisePadInfo.set(
        inputHeight, inputWidth, inputChannelCount,
        AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight_adjusted, depthwiseFilterWidth_adjusted, stridesPad );
    }

    this.outputHeight = depthwisePadInfo.outputHeight;
    this.outputWidth = depthwisePadInfo.outputWidth;

    if ( depthwisePadInfo ) {
      depthwisePadInfo.disposeResources_and_recycleToPool();
      depthwisePadInfo = null;
    }

//!!! (2022/07/19 Remarked) Old Codes
//     // By default, the block0's output ( height, width ) is half of the input (i.e. result of depthwise convolution with
//     // ( strides = 2, pad = "same" ) ).
//     //
//     // Note: This calculation copied from the getPadAndOutInfo() of
//     // (https://github.com/tensorflow/tfjs/blob/tfjs-v3.8.0/tfjs-core/src/ops/conv_util.ts).
//     //
//     let stridesHeight = 2, stridesWidth = 2;
//     this.outputHeight = Math.ceil( sourceHeight / stridesHeight );
//     this.outputWidth =  Math.ceil( sourceWidth  / stridesWidth );
  }

}