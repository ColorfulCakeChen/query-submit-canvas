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

}

