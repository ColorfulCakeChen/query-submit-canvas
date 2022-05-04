export { MobileNetV2 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Param.js";
import { Base } from "./Base.js";

/**
 * Provide parameters for MobileNetV2 (i.e. with pointwise1, with add-input-to-output).
 *
 *

//!!! ...unfinished... (2022/05/04) bPointwise1

 * 1. Be ware of ( pointwise1ChannelCountRate == 1 )
 *
 * MobileNetV2 double the channel count by pointwise1. This is different from ShuffleNetV2 which achieves channel count doubling
 * by concatenation.
 *
 * That is, if ( pointwise1ChannelCountRate <= 1 ), there will be only 1 times (not 2 times) channels to be processed in fact.
 * It could be expected that the performance will be faser than ( pointwise1ChannelCountRate == 1 ) in ShuffleNetV2 unfairly.
 *
 * So, the original MobileNetV2 should be ( pointwise1ChannelCountRate == 2 ).
 *
 *
 */
class MobileNetV2 extends Base {

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // step0's inputHeight0, inputWidth0, bias, activation.

    let blockParams = this.blockParams;

    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).

    // In MobileNetV2:
    //   - Step0 can not do add-input-to-output because the input0's ( height, width ) has been halven.
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    If ( blockParams.bPointwise1 == false ) { // use channelMultiplier = 2 or 4 to expand.
      this.pointwise1ChannelCount = 0;                                  // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 4;                   // Quadruple of input0.

    } else {
      this.pointwise1ChannelCount = blockParams.sourceChannelCount * 4; // Quadruple of input0.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }

    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;

    // In MobileNetV2's original design, it is not always "twice". We choose "twice" just for comparing with ShuffleNetV2.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount * 2; // In MobileNetV2, all steps' output0 is double depth of source input0.

    this.bOutput1Requested = false; // In MobileNetV2, all steps do not have output1.

    this.bKeepInputTensor = blockParams.bKeepInputTensor; // Step0 may or may not keep input tensor according to caller's necessary.

    this.outChannels0 = this.pointwise21ChannelCount;
    this.outChannels1 = 0;
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // step1, 2, 3, ...'s inputHeight0, inputWidth0.

    //let blockParams = this.blockParams;

    // The input0 of all steps (except step0) have the same depth as previous (also step0's) step's output0.
    this.channelCount0_pointwise1Before = this.outChannels0;

    // In MobileNetV2:
    //   - All steps (except step0) do add-input-to-output (without concatenation).
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1; // Because step0 has already double output channel count.

    // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In MobileNetV2, although there is no activation function after pointwise21, it should have bias after pointwise21 for
    // the stepLast. The reason is the stepLast does not have the next step's pointwise1 to provide bias to complete affine
    // transformation. It must do it by itself.
    this.bPointwise21Bias = true;
  }

}

