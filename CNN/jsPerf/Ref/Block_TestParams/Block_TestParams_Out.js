export { Out };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as Depthwise from "../../../Conv/Depthwise.js";

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

  /** */
  toString() {
    return `testParams.id=${this.id}`;
  }

//!!! ...unfinished... (2022/07/15) seems not used.
  get output_height() {
    if ( this.bDepthwiseRequestedAndNeeded )
      return this.depthwisePadInfo.outputHeight;
    else
      return this.input0_height;
  }

//!!! ...unfinished... (2022/07/15) seems not used.
  get output_width() {
    if ( this.bDepthwiseRequestedAndNeeded )
      return this.depthwisePadInfo.outputWidth;
    else
      return this.input0_width;
  }

  /**
   * @param {Block_TestParams.out} this
   *   The testParams.outfor creating description.
   *
   * @return {string}
   *   The description of this.
   */
  static TestParams_Out_toString() {

    let inferencedParams = this.inferencedParams;

    let paramsOutDescription =
        `inputTensorCount=${inferencedParams.inputTensorCount}, `

      + `input0_height=${this.input0_height}, input0_width=${this.input0_width}, `
      + `inChannels0=${this.input0_channelCount}, `

      + `input1_height=${inferencedParams.input1_height}, input1_width=${inferencedParams.input1_width}, `
      + `inChannels1=${inferencedParams.input1_channelCount}, `

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

