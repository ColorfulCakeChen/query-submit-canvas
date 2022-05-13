export { ShuffleNetV2 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as ChannelShuffler from "../../ChannelShuffler.js";
import { Params } from "../Block_Params.js";
import { Base } from "./Base.js";

/**
 * Provide parameters for ShuffleNetV2 (i.e. shuffle channel by ChannelShuffler.ConcatPointwiseConv).
 *
 *
 * 1. Special case: NoPointwise1 ( blockParams.bPointwise1 == false ) ShuffleNetV2 (i.e. without pointwise1, with concatenator).
 * 
 * What is the different of the NoPointwise1 configuration?
 *
 * When the poitwise1 convolution (of every step (including step0)) is discarded (i.e. ( blockParams.bPointwise1 == false ) ),
 * the step0 and step0's branch could be achieved simultaneously by:
 *   - once depthwise convolution (channelMultipler = 2, strides = 2, pad = same, bias, CLIP_BY_VALUE_N3_P3).
 *   - No need to concatenate because the above operation already double channel count.
 *
 * Note that:
 *   - The depthwise1 convolution (channelMultipler = 2, strides = 2) of step0 achieves simultaneously two depthwise
 *     convolution (channelMultipler = 1, strides = 2) of step0 and step0's branch. So, it is one less depthwise
 *     convolution and one less concatenating (than original ShuffleNetV2).
 *
 *
 * 1. Drawback when ( blockParams.bPointwise1 == false )
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
 * If ( blockParams.bPointwise1 == false ), there will be no pointwise1 (i.e. no chance) to shuffle the (first and) last
 * channel's position.
 *
 * So, it may be NOT suggested to use ShuffleNetV2 with ( blockParams.bPointwise1 == false ).
 *
 */
class ShuffleNetV2 extends Base {

  /** @override */
  determine_stepCount_depthwiseFilterHeightWidth_Default_Last() {
    super.determine_stepCount_depthwiseFilterHeightWidth_Default_Last();

    // ShuffleNetV2_Xxx must have at least 2 steps because PointDepthPoint can not achieve the head/body/tail of
    // ShuffleNetV2 at the same time.
    tf.util.assert( this.stepCount >= 2,
      `Block.StepParamsCreator.ShuffleNetV2.determine_stepCount_depthwiseFilterHeightWidth_Default_Last(): `
        + `stepCount ( ${this.stepCount} ) must be at least 2 in ShuffleNetV2_Xxx.` );
  }

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // step0's inputHeight0, inputWidth0.

    let blockParams = this.blockParams;

    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).

    if ( blockParams.bPointwise1 == false ) {

      // NoPointwise1 ShuffleNetV2 (expanding by once depthwise).
      //
      // If step0 does not have pointwise1 convolution before depthwise convolution, the depthwise2 convolution (in original ShuffleNetV2)
      // is not needed. Then, a simpler configuration could be used.
      //
      // Just use once depthwise convolution (but with channel multipler 2) to double the channel count.
      this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
      this.pointwise1ChannelCount = 0;                                  // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2;                   // Double of input0. (Same as pointwise21.)

    } else {
      this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE; // with concatenation.
      this.pointwise1ChannelCount = blockParams.sourceChannelCount * 2; // Double of input0. (Same as pointwise21.)
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }

    // In ShuffleNetV2, all steps' (except stepLast) output0 is the same depth as source input0.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount;

    this.bOutput1Requested = true; // In ShuffleNetV2, all steps (except stepLast) have output1 with same depth as source input0.

    // In ShuffleNetV2, all steps (except stepLast) have both output0 and output1 with same depth as pointwise21 result.
    this.outChannels0 = this.outChannels1 = this.pointwise21ChannelCount;
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0();

    // The ( input0, input1 ) of all steps (except step0) have the same depth as previous (also step0's) step's ( output0, output1 ).
    this.channelCount0_pointwise1Before = this.outChannels0;

    // (with concatenation, without add-input-to-output).
    //
    // The channel count of input1 must be the same as pointwise21's result. The result of pointwise21 (which operates on input0)
    // will be concatenated with input1.
    //
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1;

    this.channelShuffler_init(); // In ShuffleNetV2, all steps (except step0) uses channel shuffler (with two convolution groups).
  }
  
  /**
   * Create channel shuffler if necessary and put in this.channelShuffler.
   *
   * Sub-class could override this method. For example, if sub-class does not need channel shuffler, it could override and do
   * nothing so that it can be avoided to create channel shuffler in sub-class.
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
    //
    this.pointwise21ChannelCount = this.blockParams.sourceChannelCount * 2;
    this.bOutput1Requested = false;

    this.outChannels0 = this.outChannels0 + this.outChannels1;
    this.outChannels1 = 0;
  }
}

