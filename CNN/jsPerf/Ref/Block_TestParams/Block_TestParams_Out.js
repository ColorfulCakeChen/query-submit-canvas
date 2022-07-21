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
    this.InferencedParams_dispose();

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

  /** Release .inferencedParams */
  InferencedParams_dispose() {
    if ( this.inferencedParams ) {
      this.inferencedParams.disposeResources_and_recycleToPool();
      this.inferencedParams = null;
    }
  }

  /** Fill this.inferencedParams. */
  generate_inferencedParams() {
    this.InferencedParams_dispose();

    this.inferencedParams = Block.InferencedParams.Pool.get_or_create_by(
      this.input0_height, this.input0_width, this.input0_channelCount,
      this.nConvBlockTypeId,
      this.pointwise1ChannelCount,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth,
      this.depthwiseStridesPad, this.depthwiseActivationId,
      this.pointwise20ChannelCount, this.pointwise20ActivationId,
      this.nSqueezeExcitationChannelCountDivisor, this.bSqueezeExcitationPrefix,
      this.nActivationId
    );
  }

  /** The inferencedParams.pointwise1ChannelCount_modified is considered*/
  get pointwise1ChannelCount_real() {
    if ( this.inferencedParams.pointwise1ChannelCount_modified != undefined )
      return this.inferencedParams.pointwise1ChannelCount_modified;
    else
      return this.pointwise1ChannelCount;
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

//!!! ...unfinished... (2022/07/21)
// For ShuffleNetV2's tail, output0_channelCount is not the same as pointwise20ChannelCount.
//    return this.pointwise20ChannelCount;

    switch ( this.nConvBlockTypeId ) {
      case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL:
        return ( this.pointwise20ChannelCount + this.inferencedParams.input1_channelCount );
        break;

      default:
        return this.pointwise20ChannelCount;
        break;
    }
  }

  get output1_channelCount() {

//!!! ...unfinished... (2022/07/21)
//    return this.inferencedParams.pointwise21ChannelCount;

    switch ( this.nConvBlockTypeId ) {
      case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY:
        return this.inferencedParams.input1_channelCount;
        break;

      default:
        return this.inferencedParams.pointwise21ChannelCount;
        break;
    }
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
      + `${ValueDesc.ConvBlockType.Singleton.getName_byId( this.nConvBlockTypeId )}`
      + `(${this.nConvBlockTypeId}), `

      + `bHigherHalfDifferent=${inferencedParams.bHigherHalfDifferent}, `
      + `bHigherHalfDepthwise2=${inferencedParams.bHigherHalfDepthwise2}, `

      + `pointwise1ChannelCount=${this.inferencedParams.pointwise1ChannelCount}, `
      + `pointwise1Bias=${this.inferencedParams.pointwise1Bias}, `
      + `pointwise1ActivationName=`
        + `${ValueDesc.ActivationFunction.Singleton.getName_byId( inferencedParams.pointwise1ActivationId )}`
        + `(${inferencedParams.pointwise1ActivationId}), `

      + `bDepthwiseRequestedAndNeeded=${inferencedParams.bDepthwiseRequestedAndNeeded}, `
      + `bDepthwise2Requested=${inferencedParams.bDepthwise2Requested}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=`
        + `${ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.getName_byId( this.depthwise_AvgMax_Or_ChannelMultiplier )}`
        + `(${this.depthwise_AvgMax_Or_ChannelMultiplier}), `

      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `depthwiseFilterHeight_real=${this.depthwiseFilterHeight_real}, depthwiseFilterWidth_real=${this.depthwiseFilterWidth_real}, `

      + `depthwiseStridesPad=`
        + `${ValueDesc.StridesPad.Singleton.getName_byId( this.depthwiseStridesPad )}`
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
        + `${ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.getName_byId( this.nSqueezeExcitationChannelCountDivisor )}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `

      + `squeezeExcitationActivationName=`
        + `${ValueDesc.ActivationFunction.Singleton.getName_byId( this.inferencedParams.squeezeExcitationActivationId )}`
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

