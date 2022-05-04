export { MobileNetV2 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Param.js";
import { Base } from "./Base.js";


//!!! ...unfinished... (2022/05/02)

/**
 * Provide parameters for MobileNetV2 (i.e. with pointwise1, with add-input-to-output).
 *
 *
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
    super.configTo_beforeStep0(); // step0's inputHeight0, inputWidth0.

    let blockParams = this.blockParams;

//!!! (2022/05/03 Remarked) be moved to class Base.
//     this.inputHeight0 = blockParams.sourceHeight; // step0 inputs the source image size.
//     this.inputWidth0 = blockParams.sourceWidth;

//!!! (2021/10/11 Remarked) Unfortunately, the sub-class (i.e. NotShuffleNet_NotMobileNet) also call this method.
//     // Currently, MobileNetV2 must have at least 2 steps because PointDepthPoint can not achieve the head/body/tail
//     // of MobileNetV2 at the same time.
//     //
//     // Ideally, this assertion should be placed in determine_stepCount_depthwiseFilterHeightWidth_Default_Last(). However,
//     // the sub-class (i.e. NotShuffleNet_NotMobileNet) could accept step count less than 2. So, assert here.
//     tf.util.assert( this.stepCount >= 2,
//       `Block.Params.to_PointDepthPointParams.MobileNetV2(): `
//         + `stepCount ( ${this.stepCount} ) must be at least 2 in MobileNetV2.` );

    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).

    // In MobileNetV2:
    //   - Step0 can not do add-input-to-output because the input0's ( height, width ) has been halven.
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    this.bPointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;                  // All steps will not double the channel count.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;
    this.bDepthwiseBias = true;
    this.depthwiseActivationId = blockParams.nActivationId;

    // In MobileNetV2's original design, it is not always "twice". We choose "twice" just for comparing with ShuffleNetV2.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount * 2; // In MobileNetV2, all steps' output0 is twice depth of source input0.

    // In MobileNetV2, since there is no activation function after pointwise21, it needs not bias after pointwise21. The reason
    // is the pointwise1 of the next step has bias before activation to complete affine transformation.
    this.bPointwise21Bias = false;

    // In MobileNetV2, the second 1x1 pointwise convolution doesn't have activation function in default.
    //
    // But it could be changed by nActivationIdAtBlockEnd for the last step of the block.
    this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

    this.bOutput1Requested = false;                                  // In MobileNetV2, all steps do not have output1.

//!!! ...unfinished... (2022/05/04)
// If ( bPointwise1 == false ), should use channelMultiplier = 2 or 4 to expand.

    // In MobileNet, all steps have pointwise1 convolution before depthwise convolution. Its channel count is adjustable by user's request.
    // If ( pointwise1ChannelCountRate == 0 ), it is the same as no pointwise1.
    //
    // Q: How to know whether it is MobileNetV2 or MobileNetV1?
    // A: By pointwise1ChannelCountRate.
    //   - If ( pointwise1ChannelCount == 0 ), similar to MobileNetV1. ( pointwise1ChannelCountRate == 0 )
    //   - If ( pointwise1ChannelCount <  pointwise21ChannelCount ), similar to ResNet. (can not be expressed by Block.Params)
    //   - If ( pointwise1ChannelCount == pointwise21ChannelCount ), similar to MobileNetV2 without expanding. ( pointwise1ChannelCountRate == 1 )
    //   - If ( pointwise1ChannelCount >  pointwise21ChannelCount ), similar to MobileNetV2. ( pointwise1ChannelCountRate == 2 )
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * blockParams.pointwise1ChannelCountRate; // In MobileNetV2, the rate is usually 2.

    this.bKeepInputTensor = blockParams.bKeepInputTensor; // Step0 may or may not keep input tensor according to caller's necessary.

    this.outChannels0 = this.pointwise21ChannelCount;
    this.outChannels1 = 0;
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // step1, 2, 3, ...'s inputHeight0, inputWidth0.

    let blockParams = this.blockParams;

//!!! (2022/05/03 Remarked) be moved to class Base.
//     this.inputHeight0 = blockParams.outputHeight; // all steps (except step0) inputs half the source image size.
//     this.inputWidth0 = blockParams.outputWidth;

    // The input0 of all steps (except step0) have the same depth as previous (also step0's) step's output0.
    this.channelCount0_pointwise1Before = this.outChannels0;

    // In MobileNetV2:
    //   - All steps (except step0) do add-input-to-output (without concatenation).
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT;

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

