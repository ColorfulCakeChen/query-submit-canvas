export { Out };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as Block from "../../../Conv/Block.js";

/**
 *
 */
class Out extends Recyclable.Root {

  /**
   * Used as default Block_TestParams.Out provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Block_TestParams.Out.Pool", Out, Out.setAsConstructor );

  /**
   */
  constructor(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId,
    bKeepInputTensor
  ) {
    super();
    Out.setAsConstructor_self.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId,
      bKeepInputTensor
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
    nActivationId,
    bKeepInputTensor
  ) {
    super.setAsConstructor();
    Out.setAsConstructor_self.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId,
      bKeepInputTensor
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
    nActivationId,
    bKeepInputTensor
  ) {
    this.input0_height = input0_height;
    this.input0_width = input0_width;
    this.input0_channelCount = input0_channelCount;
    this.nConvBlockTypeId = nConvBlockTypeId;
    this.pointwise1ChannelCount = pointwise1ChannelCount;
    this.depthwise_AvgMax_Or_ChannelMultiplier = depthwise_AvgMax_Or_ChannelMultiplier;
    this.depthwiseFilterHeight = depthwiseFilterHeight;
    this.depthwiseFilterWidth = depthwiseFilterWidth;
    this.depthwiseStridesPad = depthwiseStridesPad;
    this.depthwiseActivationId = depthwiseActivationId;
    this.pointwise20ChannelCount = pointwise20ChannelCount;
    this.pointwise20ActivationId = pointwise20ActivationId;
    this.nSqueezeExcitationChannelCountDivisor = nSqueezeExcitationChannelCountDivisor;
    this.bSqueezeExcitationPrefix = bSqueezeExcitationPrefix;
    this.nActivationId = nActivationId;
    this.bKeepInputTensor = bKeepInputTensor;
  }

  /** @override */
  disposeResources() {
    this.input0_height = undefined;
    this.input0_width = undefined;
    this.input0_channelCount = undefined;
    this.nConvBlockTypeId = undefined;
    this.pointwise1ChannelCount = undefined;
    this.depthwise_AvgMax_Or_ChannelMultiplier = undefined;
    this.depthwiseFilterHeight = undefined;
    this.depthwiseFilterWidth = undefined;
    this.depthwiseStridesPad = undefined;
    this.depthwiseActivationId = undefined;
    this.pointwise20ChannelCount = undefined;
    this.pointwise20ActivationId = undefined;
    this.nSqueezeExcitationChannelCountDivisor = undefined;
    this.bSqueezeExcitationPrefix = undefined;
    this.nActivationId = undefined;
    this.bKeepInputTensor = undefined;

    super.disposeResources();
  }

  /** Fill this.inferencedParams. */
  generate_inferencedParams() {
    if ( !this.inferencedParams ) {
      this.inferencedParams = {};
    }
    Block.Params.set_inferencedParams_by.call( this.inferencedParams,
      this.input0_height, this.input0_width, this.input0_channelCount,
      this.nConvBlockTypeId,
      this.pointwise1ChannelCount,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth,
      this.depthwiseStridesPad, this.depthwiseActivationId,
      this.pointwise20ChannelCount,
      this.nSqueezeExcitationChannelCountDivisor, this.bSqueezeExcitationPrefix,
      this.nActivationId
    );
  }

  /** The inferencedParams.depthwiseFilterHeight_modified is considered*/
  get depthwiseFilterHeight_real() {
    if ( this.inferencedParams.depthwiseFilterHeight_modified != undefined )
      return this.inferencedParams.depthwiseFilterHeight_modified;
    else
      return this.depthwiseFilterHeight;
  }

  /** The inferencedParams.depthwiseFilterWidth_modified is considered*/
  get depthwiseFilterWidth_real() {
    if ( this.inferencedParams.depthwiseFilterWidth_modified != undefined )
      return this.inferencedParams.depthwiseFilterWidth_modified;
    else
      return this.depthwiseFilterWidth;
  }

  get output_height() {
    if ( this.inferencedParams.bDepthwiseRequestedAndNeeded )
      return this.inferencedParams.depthwisePadInfo.outputHeight;
    else
      return this.input0_height;
  }

  get output_width() {
    if ( this.inferencedParams.bDepthwiseRequestedAndNeeded )
      return this.inferencedParams.depthwisePadInfo.outputWidth;
    else
      return this.input0_width;
  }

  get output0_channelCount() {
    return this.pointwise20ChannelCount;
  }

  get output1_channelCount() {
    return this.inferencedParams.pointwise21ChannelCount;
  }

  get output_channelCount() {
    return ( this.output0_channelCount + this.output1_channelCount );
  }

  /** @override */
  toString() {

    let inferencedParams = this.inferencedParams;

    let paramsOutDescription =
        `inputTensorCount=${inferencedParams.inputTensorCount}, `

      + `input0_height=${this.input0_height}, input0_width=${this.input0_width}, `
      + `input0_channelCount=${this.input0_channelCount}, `

      + `input1_height=${inferencedParams.input1_height}, input1_width=${inferencedParams.input1_width}, `
      + `input1_channelCount=${inferencedParams.input1_channelCount}, `

      + `output_height=${this.output_height}, output_width=${this.output_width}, `
      + `output0_channelCount=${this.output0_channelCount}, output1_channelCount=${this.output1_channelCount}, `
      + `output_channelCount=${this.output_channelCount}, `

      + `nConvBlockTypeName=`
      + `${ValueDesc.ConvBlockType.Singleton.getStringOf( this.nConvBlockTypeId )}`
      + `(${this.nConvBlockTypeId}), `

      + `bHigherHalfDifferent=${inferencedParams.bHigherHalfDifferent}, `
      + `bHigherHalfDepthwise2=${inferencedParams.bHigherHalfDepthwise2}, `

      + `pointwise1ChannelCount=${this.inferencedParams.pointwise1ChannelCount}, `
      + `pointwise1Bias=${this.inferencedParams.pointwise1Bias}, `
      + `pointwise1ActivationName=`
        + `${ValueDesc.ActivationFunction.Singleton.getStringOf( inferencedParams.pointwise1ActivationId )}`
        + `(${inferencedParams.pointwise1ActivationId}), `

      + `bDepthwiseRequestedAndNeeded=${inferencedParams.bDepthwiseRequestedAndNeeded}, `
      + `bDepthwise2Requested=${inferencedParams.bDepthwise2Requested}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=`
        + `${ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.getStringOf( this.depthwise_AvgMax_Or_ChannelMultiplier )}`
        + `(${this.depthwise_AvgMax_Or_ChannelMultiplier}), `

      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `depthwiseFilterHeight_real=${this.depthwiseFilterHeight_real}, depthwiseFilterWidth_real=${this.depthwiseFilterWidth_real}, `

      + `depthwiseStridesPad=`
        + `${ValueDesc.StridesPad.Singleton.getStringOf( this.depthwiseStridesPad )}`
        + `(${this.depthwiseStridesPad}), `
      + `depthwiseBias=${this.inferencedParams.depthwiseBias}, `
      + `depthwiseActivationName=`
        + `${Block.Params.depthwiseActivationId.getStringOfValue( this.depthwiseActivationId )}`
        + `(${this.depthwiseActivationId}), `

      + `bConcat1Requested=${inferencedParams.bConcat1Requested}, `

      + `pointwise20ChannelCount=${this.pointwise20ChannelCount}, `
      + `pointwise20Bias=${this.inferencedParams.pointwise20Bias}, `
      + `pointwise20ActivationName=`
        + `${Block.Params.pointwise20ActivationId.getStringOfValue( this.pointwise20ActivationId )}`
        + `(${this.pointwise20ActivationId}), `

      + `nSqueezeExcitationChannelCountDivisorName=`
        + `${ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.getStringOf( this.nSqueezeExcitationChannelCountDivisor )}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `

      + `squeezeExcitationActivationName=`
        + `${ValueDesc.ActivationFunction.Singleton.getStringOf( this.inferencedParams.squeezeExcitationActivationId )}`
        + `(${this.inferencedParams.squeezeExcitationActivationId}), `

      + `bAddInputToOutputRequested=${inferencedParams.bAddInputToOutputRequested}, `
      + `bConcat2ShuffleSplitRequested=${inferencedParams.bConcat2ShuffleSplitRequested}, `
      + `pointwise20_channelShuffler_outputGroupCount=${inferencedParams.pointwise20_channelShuffler_outputGroupCount}, `
      + `outputTensorCount=${inferencedParams.outputTensorCount}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;

    return paramsOutDescription;
  }

}

