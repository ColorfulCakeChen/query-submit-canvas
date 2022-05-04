export { ShuffleNetV2 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as ChannelShuffler from "../../ChannelShuffler.js";
import { Params } from "../Block_Param.js";
import { Base } from "./Base.js";


/**
 * Provide parameters for ShuffleNetV2 (i.e. shuffle channel by ChannelShuffler.ConcatPointwiseConv).
 *
 *
 * 1. Be ware of ( pointwise1ChannelCountRate == 2 )
 *
 * ShuffleNetV2 always double the channel count. It is achieved by concatenation. This is different from MobileNetV2 which achieves
 * channel count doubling by pointwise1.
 *
 * That is, if ( pointwise1ChannelCountRate == 2 ), there will be 4 times (not 2 times) channels to be processed in fact. It could be
 * expected that the performance will be slower than ( pointwise1ChannelCountRate == 2 ) in MobileNetV2 unfairly.
 *
 * So, the original ShuffleNetV2 should be ( pointwise1ChannelCountRate == 1 ).
 *
 *
 * 2. A special case: NoPointwise1 ShuffleNetV2 (i.e. without pointwise1, with concatenator).
 * 
 * Q: How to specify the NoPointwise1 configuration?
 * A: By  (   ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_CHANNEL_SHUFFLER )
 *         or ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_POINTWISE22 )
 *        )
 *    and ( pointwise1ChannelCountRate == 0 )
 *    in the parameters of Block.Params.
 *
 * What is the different of the NoPointwise1 configuration?
 *
 * When the poitwise1 convolution (of every step (including step 0)) is discarded (i.e. ( pointwise1ChannelCountRate == 0 ) ),
 * the step 0 and step 0's branch could be achieved simultaneously by:
 *   - once depthwise convolution (channelMultipler = 2, strides = 2, pad = same, bias, COS).
 *   - No need to concatenate because the above operation already double channel count.
 *
 * Note that:
 *   - The depthwise1 convolution (channelMultipler = 2, strides = 2) of step 0 achieves simultaneously two depthwise
 *     convolution (channelMultipler = 1, strides = 2) of step0 and step0's branch. So, it is one less depthwise
 *     convolution and one less concatenating (than original ShuffleNetV2).
 *
 *   - Even if the pointwise1 convolution is discarded, just two steps of this simplied ShuffleNetV2 still compose an
 *     effective Fourier series which should have enough expressive power for approximating any function. By given
 *     the following configuration in the Block.Params:
 *       - (   ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_CHANNEL_SHUFFLER )
 *          or ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_POINTWISE22 ) )
 *       - ( pointwise1ChannelCountRate == 0 )
 *       - ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.COS) 
 *       - ( nActivationIdAtBlockEnd == ValueDesc.ActivationFunction.Singleton.Ids.NONE)
 *
 *
 * 3. Drawback when ( pointwise1ChannelCountRate == 0 )
 *
 * Channel shuffler has a characteristic that it always does not shuffle the first and last channel (i.e. the channel 0
 * and channel ( N - 1 ) will always be at the same place). In ShuffleNetV2, the pointwise1 could alleviate this issue
 * a little.
 *   - At the step0's branch of a block, the pointwise1 has a chance (the only one chance) to shuffle the last channel.
 *   - Through step1 to stepLast, the the last channel will always stay stationary.
 *     - It is never shuffled by channel shuffler.
 *     - It is never manipulated by any pointwise2 (because there is no pointwise22 in this ShuffleNetV2 configuration).
 *
 * It is hard to say this characteristic is good or bad.
 *   - In good side, it is easy to keep and pass information to the next block.
 *   - In bad side, it wastes a channel (i.e. the last channel) if there is no information needed to be kept and passed
 *       to the next block.
 *
 * If ( pointwise1ChannelCountRate == 0 ), there will be no pointwise1 (i.e. no chance) to shuffle the (first and) last
 * channel's position.
 *
 * So, it is NOT suggested to use ShuffleNetV2 with ( pointwise1ChannelCountRate == 0 ).
 *
 */
class ShuffleNetV2 extends Base {

  /** @override */
  determine_stepCount_depthwiseFilterHeightWidth_Default_Last() {
    super.determine_stepCount_depthwiseFilterHeightWidth_Default_Last();

    let blockParams = this.blockParams;

    // ShuffleNetV2_Xxx must have at least 2 steps because PointDepthPoint can not achieve the head/body/tail of
    // ShuffleNetV2 at the same time.
    tf.util.assert( this.stepCount >= 2,
      `Block.Params_to_PointDepthPointParams.ShuffleNetV2(): `
        + `stepCount ( ${this.stepCount} ) must be at least 2 in ShuffleNetV2_Xxx.` );
  }

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // step0's inputHeight0, inputWidth0.

    let blockParams = this.blockParams;

//!!! (2022/05/03 Remarked) be moved to class Base.
//     this.inputHeight0 = blockParams.sourceHeight; // step0 inputs the source image size.
//     this.inputWidth0 = blockParams.sourceWidth;

    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE; // with concatenation.

    this.bPointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    // In ShuffleNetV2, all steps (except step0 in NoPointwise1) will not double the channel count by depthwise.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;

//!!! ...unfinished... (2021/12/23) should be changed to like MobileNetV2:
//   - depthwise always has bias and activation.
//   - pointwise2 always has no bias and no activation.

    // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
    this.bDepthwiseBias = false;
    this.depthwiseActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE; // In ShuffleNetV2, depthwise convolution doesn't have activation.

    // In ShuffleNetV2, all steps' pointwise21 always has bias and activation.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount; // All steps' (except stepLast) output0 is the same depth as source input0.
    this.bPointwise21Bias = true;
    this.pointwise21ActivationId = blockParams.nActivationId;

    this.bOutput1Requested = true; // In ShuffleNetV2, all steps (except stepLast) have output1 with same depth as source input0.

    // In ShuffleNetV2, all steps usually have pointwise1 convolution before depthwise convolution (i.e. ( pointwise1ChannelCountRate > 0 ) ).
    // Its channel count is adjustable by user's request. Usually, ( pointwise1ChannelCountRate == 1 ). If ( pointwise1ChannelCountRate == 0 ),
    // it is the same as no pointwise1.
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * blockParams.pointwise1ChannelCountRate;

    // NoPointwise1 ShuffleNetV2 (expanding by once depthwise).
    //
    // If step0 does not have pointwise1 convolution before depthwise convolution, the depthwise2 convolution (in original ShuffleNetV2)
    // is not needed. Then, a simpler configuration could be used.
    //
    // Just use once depthwise convolution (but with channel multipler 2) to double the channel count.
    if ( this.pointwise1ChannelCount == 0 ) {
      this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2; // Step0 double the channel count by depthwise channel multiplier.
    }

    this.bKeepInputTensor = blockParams.bKeepInputTensor; // Step0 may or may not keep input tensor according to caller's necessary.

    // In ShuffleNetV2, all steps (except stepLast) have both output0 and output1 with same depth as pointwise21 result.
    this.outChannels0 = this.outChannels1 = this.pointwise21ChannelCount;
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // step1, 2, 3, ...'s inputHeight0, inputWidth0.

    let blockParams = this.blockParams;

//!!! (2022/05/03 Remarked) be moved to class Base.
//     this.inputHeight0 = blockParams.outputHeight; // all steps (except step0) inputs half the source image size.
//     this.inputWidth0 = blockParams.outputWidth;

    // The ( input0, input1 ) of all steps (except step0) have the same depth as previous (also step0's) step's ( output0, output1 ).
    this.channelCount0_pointwise1Before = this.outChannels0;

    // (with concatenation, without add-input-to-output).
    //
    // The channel count of input1 must be the same as pointwise21's result. The result of pointwise21 (which operates on input0)
    // will be concatenated with input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1;

    // In ShuffleNetV2, all steps (except step0 in NoPointwise1) will not double the channel count by depthwise.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.

    this.channelShuffler_init(); // In ShuffleNetV2, all steps (except step0) uses channel shuffler (with two convolution groups).
  }
  
  /**
   * Create channel shuffler if necessary and put in this.channelShuffler.
   *
   * Sub-class could override this method. For example, if sub-class does not need channel shuffler, it could override and do
   *  nothing so that it can be avoided to create channel shuffler in sub-class.
   */
  channelShuffler_init() {
    let blockParams = this.blockParams;
    let step0_outChannelsAll = this.outChannels0 + this.outChannels1;

    let outputGroupCount = 2; // Always with two convolution groups.
    let concatenatedDepth = step0_outChannelsAll; // All steps always have the same total output channel count as step0.
    let concatenatedShape = [ blockParams.sourceHeight, blockParams.sourceWidth, concatenatedDepth ];
    this.channelShuffler = new ChannelShuffler.ConcatPointwiseConv( concatenatedShape, outputGroupCount );
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In ShuffleNetV2, the stepLast only has output0 (no output1).
    //
    // The output0:
    //   - It will have double channel count of source input0.
    //   - It is the concatenation of pointwise21's result and input1.
    this.bOutput1Requested = false;

    this.outChannels0 = this.outChannels0 + this.outChannels1;
    this.outChannels1 = 0;
  }
}

