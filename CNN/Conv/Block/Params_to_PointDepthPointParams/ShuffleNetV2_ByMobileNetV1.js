export { ShuffleNetV2_ByMobileNetV1 };
export { ShuffleNetV2_ByMobileNetV1_padValid };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Param.js";
import { ShuffleNetV2 } from "./ShuffleNetV2.js";

/*
 * Provide parameters for ShuffleNetV2_ByMobileNetV1 (i.e. concatenate, shuffle channel, split by integrated pointwise1, depthwise,
 * pointwise21).
 *
 *
 * 1. Motivation
 *
 * Accodring to testing, the original ShuffleNetV2 is faster than MobileNetV2 in backend CPU. This may result from lesser
 * computation. However, in backend WASM and WEBGL, MobileNetV2 is faster than the original ShuffleNetV2. The possible
 * reason may be that the concatenate-shuffle-split (even achieved by pointwise convolution) operation is not friendly
 * for WASM and WEBGL.
 *
 * This results in an idea that:
 *   - Use MobileNetV2 structure but with ( pointwise1ChannelCountRate == 1 ) and without add-input-to-output. (So, it is more
 *       like MobileNetV1.)
 *   - Manipulate the filter weights of pointwise1, depthwise1, pointwise21 so that they achieve the same effect of shuffling
 *       but without concatenation and splitting.
 *
 * This may become a faster ShuffleNetV2 in backend WASM and WEBGL (but a slower ShuffleNetV2 in backend CPU).
 *
 *
 * Q1: Why not just use MobileNet instead of ShuffleNetV2, since its structure is MobileNet?
 * A1: The filter weights count is different. MobileNet has more (a lot) filter weights needed to be learned than ShuffleNetV2.
 *     The learning (or say, evolving) performance should be faster by using ShuffleNetV2 (rather than MobileNet).
 *

//!!! ...unfinished... (2021/12/23)

 * Q2: Why pointwise21 has bias but has no activation?
 * A2: So that the activation escaping scale-translate of pointwise1 and depthwise1 can be undone.
 *
 * Otherwise, when channelCount1_pointwise1Before == ONE_INPUT_HALF_THROUGH (-5) (ShuffleNetV2_ByMobileNetV1's body/tail),
 * the pointwise1's pass-through can not undo the previous PointDepthPoint's pointwise21 activation escaping scales.
 * The reason is:
 *  - The previous PointDepthPoint's pointwise21 has shuffled the channels.
 *  - The channels tweaked by activation escaping scales are interleaved with other normal channels.
 *  - They are not all in the higher-half channels of this PointDepthPoint's pointwise1.
 *
 * So, force pointwise21 (which is always exists) always with bias and without activation.
 *   - So the pointwise21 could undo all previous activation escaping scales (because it has bias).
 *   - And itself will not tweak its result by activation escaping scales (because it does not have activation).
 *
 */
class ShuffleNetV2_ByMobileNetV1 extends ShuffleNetV2 {

//!!! ...unfinished... (2021/11/12)
// When ( pointwise1ChannelCount == 0 ) (i.e. depthwise channel multiplier is 2 ), the depthwise should be just
// the same as Params_to_PointDepthPointParams.ShuffleNetV2_ByPointwise22 and Params_to_PointDepthPointParams.ShuffleNetV2.
//
//     if ( this.pointwise1ChannelCount == 0 ) {
//       this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
//       this.depthwise_AvgMax_Or_ChannelMultiplier = 2;  // Step0 double the channel count by depthwise channel multiplier.
//     }
//
// That is the depthwise needs use ( bHigherHalfDifferent == false ) in this case.


  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // Use same input0 (height, width, channel count), bias, activation, depthwise filter size (as ShuffleNetV2).

    let blockParams = this.blockParams;

    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1; // (-4)

    // In ShuffleNetV2_ByMobileNetV1's head, if ( pointwise1ChannelCountRate != 0 ), pointwise1ChannelCount is always the same as input0's
    // channel count. (i.e. pointwise1ChannelCountRate is always viewed as 1.)
    //
    // The input0 will be processed by pointwise1's lower half.
    // The input0 will be copied as pointwise1's higher half.
    //
    if ( this.pointwise1ChannelCountRate > 0 ) {
      this.pointwise1ChannelCount = blockParams.sourceChannelCount;

    // In ShuffleNetV2_ByMobileNetV1's head, if ( pointwise1ChannelCountRate == 0 ), pointwise1ChannelCount is also 0.
    // But, in this case, pointwise1 will still be created by PointDepthPoint.
    //
    // The input0 will just be pass-through as pointwise1's lower half.
    // The input0 will also be copied as pointwise1's higher half.
    //
    } else {
      this.pointwise1ChannelCount = 0;
    }

    // In ShuffleNetV2_ByMobileNetV1's head, depthwise always output the same channel count of pointwise1 real output channel count
    // (which has already been doubled as twice of input0's channel count by PointDepthPoint internally).
    //
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // In ShuffleNetV2_ByMobileNetV1's head, pointwise21ChannelCount is always twice of input0's channel count.
    //
    this.pointwise21ChannelCount = blockParams.sourceChannelCount * 2;

    // In ShuffleNetV2_ByMobileNetV1, there is always only output0 (i.e. no output1).
    this.bOutput1Requested = false;

    // In ShuffleNetV2_ByMobileNetV1's head, all steps have only output0 (with same depth as pointwise21 result) and no output1.
    this.outChannels0 = this.pointwise21ChannelCount;
    this.outChannels1 = 0;
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // Step1, 2, 3, ... are almost the same as ShuffleNetV2.

    // Except that ShuffleNetV2_ByMobileNetV1 does not have channel shuffler. The pointwise21 will do channel shuffling.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH; // (-5)
    
    // In ShuffleNetV2_ByMobileNetV1's body/tail, if ( pointwise1ChannelCountRate != 0 ), pointwise1ChannelCount is always the same
    // as pointwise21 output channel count. (i.e. pointwise1ChannelCountRate is always viewed as 1.)
    //
    // The input0's lower half will be processed by pointwise1's lower half.
    // The input0's higher half will be pass-through as pointwise1's higher half.
    //
    if ( this.pointwise1ChannelCountRate > 0 ) {
      this.pointwise1ChannelCount = this.pointwise21ChannelCount;

    // In ShuffleNetV2_ByMobileNetV1's body/tail, if ( pointwise1ChannelCountRate == 0 ), pointwise1ChannelCount is also 0.
    // In this case, pointwise1 will not be created by PointDepthPoint.
    //
    } else {
      this.pointwise1ChannelCount = 0;
    }
  }

  /** @override */
  channelShuffler_init() {
    // Do nothing. Because pointwise21 has done channel shuffling.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In ShuffleNetV2_ByMobileNetV1, the stepLast still has only output0 (no output1). And the output0 has double channel count of
    // source input0.
  }
}

