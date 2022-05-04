export { MobileNetV1 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Param.js";
import { Base } from "./Base.js";

/**
 * Provide parameters for MobileNetV1 (i.e. no-add-inut-to-output, pointwise1 is same size of pointwise21).
 *
 * Although this the simplest pointwise1-depthwise-pointwise2 architecture, it may be the most efficient neural network if
 * using CLIP_BY_VALUE_N3_P3 (instead of RELU) as activation function.
 *
 * The reasons are:
 *
 *   - Better than MobileNetV2: According to experience of ShuffleNetV2_ByMobileNetV1, the CLIP_BY_VALUE_N3_P3 activation
 *     function could achieve skipping connection (i.e. residual connection) without add-input-to-output (i.e MobileNetV2).
 *
 *   - Better than ShuffleNetV2_ByMobileNetV1: All block's every step's pointwise21 needs not bias. Only the last block's
 *     stepLast's pointwise21 needs bias.
 *
 *
 *
 */
class MobileNetV1 extends Base {

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // step0's inputHeight0, inputWidth0, bias, activation.

    let blockParams = this.blockParams;

    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).

    // In MobileNetV1, all steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    If ( blockParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0;                                  // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2;                   // Double of input0. (Same as pointwise21.)

    } else {
      this.pointwise1ChannelCount = blockParams.sourceChannelCount * 2; // Double of input0. (Same as pointwise21.)
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }

    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;

    // In MobileNetV2, all steps' output0 is double depth of source input0.
    //
    // Note: In MobileNetV2's original design, it is not always "twice". We choose "twice" just for comparing with ShuffleNetV2.
    //
    this.pointwise21ChannelCount = blockParams.sourceChannelCount * 2;

    this.bOutput1Requested = false; // In MobileNetV2, all steps do not have output1.

    this.bKeepInputTensor = blockParams.bKeepInputTensor; // Step0 may or may not keep input tensor according to caller's necessary.

    this.outChannels0 = this.pointwise21ChannelCount;
    this.outChannels1 = 0;
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // step1, 2, 3, ...'s inputHeight0, inputWidth0.

    // The input0 of all steps (except step0) have the same depth as previous (also step0's) step's output0.
    this.channelCount0_pointwise1Before = this.outChannels0;

    // In MobileNetV1, all steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1; // Because step0 has already double output channel count.

    // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // stepLast's pointwise21 bias.
  }

}

