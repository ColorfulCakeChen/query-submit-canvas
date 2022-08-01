export { Block_ParamsBase as ParamsBase };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { InferencedParams } from "./Block_InferencedParams.js";

/**
 *
 * @param {ChannelShuffler.Xxx} channelShuffler
 *   The channel shuffler should be used by block. Usually, only ShuffleNetV2 will have
 * it. This Block.ParamsBase dose not own it and will not dispose it (because a channel
 * shuffler usually is shared by multiple blocks).
 */
class Block_ParamsBase extends Recyclable.Root {

  /**
   * Used as default Block.ParamsBase provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Block.ParamsBase.Pool", Block_ParamsBase, Block_ParamsBase.setAsConstructor );

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
    Block_ParamsBase.setAsConstructor_self.call( this,
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
    Block_ParamsBase.setAsConstructor_self.call( this,
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
    this.inferencedParams_dispose();

    this.channelShuffler = null; // Just nullify it, because it is not owned by this block parameters.

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
  inferencedParams_dispose() {
    if ( this.inferencedParams ) {
      this.inferencedParams.disposeResources_and_recycleToPool();
      this.inferencedParams = null;
    }
  }

  /** Fill this.inferencedParams. */
  inferencedParams_create() {
    this.inferencedParams_dispose();
    this.inferencedParams = InferencedParams.Pool.get_or_create_by(
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

  get nConvBlockTypeName() {
    return ValueDesc.ConvBlockType.Singleton.getName_byId( this.nConvBlockTypeId );
  }

  /** The inferencedParams.pointwise1ChannelCount_modified is considered*/
  get pointwise1ChannelCount_real() {
    if ( this.inferencedParams.pointwise1ChannelCount_modified != undefined )
      return this.inferencedParams.pointwise1ChannelCount_modified;
    else
      return this.pointwise1ChannelCount;
  }

  get depthwise_AvgMax_Or_ChannelMultiplier_Name() {
    return ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.getName_byId( this.depthwise_AvgMax_Or_ChannelMultiplier );
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

  get depthwiseStridesPadName() {
    return ValueDesc.StridesPad.Singleton.getName_byId( this.depthwiseStridesPad );
  }

  get depthwiseActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId( this.depthwiseActivationId );
  }

  get pointwise20ActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId( this.pointwise20ActivationId );
  }

  get nSqueezeExcitationChannelCountDivisorName() {
    return ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.getName_byId( this.nSqueezeExcitationChannelCountDivisor );
  }

  get nActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId( this.nActivationId );
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
    let str = ``
      + `input0_height=${this.input0_height}, input0_width=${this.input0_width}, `
      + `input0_channelCount=${this.input0_channelCount}, `

      + `output_height=${this.output_height}, output_width=${this.output_width}, `
      + `output0_channelCount=${this.output0_channelCount}, output1_channelCount=${this.output1_channelCount}, `
      + `output_channelCount=${this.output_channelCount}, `

      + `nConvBlockTypeName=${this.nConvBlockTypeName}(${this.nConvBlockTypeId}), `

      + `depthwise_AvgMax_Or_ChannelMultiplier=`
        + `${this.depthwise_AvgMax_Or_ChannelMultiplier_Name}`
        + `(${this.depthwise_AvgMax_Or_ChannelMultiplier}), `

      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `depthwiseFilterHeight_real=${this.depthwiseFilterHeight_real}, `
      + `depthwiseFilterWidth_real=${this.depthwiseFilterWidth_real}, `

      + `depthwiseStridesPad=${this.depthwiseStridesPadName}(${this.depthwiseStridesPad}), `
      + `depthwiseActivationName=${this.depthwiseActivationName}(${this.depthwiseActivationId}), `

      + `pointwise20ChannelCount=${this.pointwise20ChannelCount}, `
      + `pointwise20ActivationName=${this.pointwise20ActivationName}(${this.pointwise20ActivationId}), `

      + `nSqueezeExcitationChannelCountDivisorName=`
        + `${this.nSqueezeExcitationChannelCountDivisorName}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `

      + `bKeepInputTensor=${this.bKeepInputTensor}, `
      + `${this.inferencedParams}`
    ;

    return str;
  }

}

