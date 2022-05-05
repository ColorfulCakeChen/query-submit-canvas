export { ShuffleNetV2_ByMobileNetV1 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Param.js";
import { ShuffleNetV2 } from "./ShuffleNetV2.js";

/*
 * Provide parameters for ShuffleNetV2_ByMobileNetV1 (i.e. concatenate, shuffle channel, split by integrated pointwise1, depthwise1,
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
 *
 *   - Use MobileNetV1 structure (i.e. no add-input-to-output) but pointwise1 already exists.
 *
 *   - Manipulate the filter weights of pointwise1, depthwise1, pointwise21 so that they achieve the same effect of shuffling
 *       but without concatenation and splitting.
 *
 * This may become a faster ShuffleNetV2 in backend WASM and WEBGL (but a slower ShuffleNetV2 in backend CPU due to more
 * computation).
 *
 *
 * Q1: Why not just use MobileNetV1 instead of ShuffleNetV2, since its structure is MobileNetV1?
 * A1: The filter weights count is different. MobileNetV1 has more (a lot) filter weights needed to be learned than ShuffleNetV2.
 *     The learning (or say, evolving) performance should be faster by using ShuffleNetV2 (rather than MobileNetV1).
 *
 */
class ShuffleNetV2_ByMobileNetV1 extends ShuffleNetV2 {

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // Use same input0 (height, width, channel count), bias, activation, depthwise filter size (as ShuffleNetV2).

    let blockParams = this.blockParams;

    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1; // (-4)

    if ( blockParams.bPointwise1 == false ) {

      // In ShuffleNetV2_ByMobileNetV1's head, if ( blockParams.bPointwise1 == false ), pointwise1ChannelCount is also 0.
      //
      // But, in this case, pointwise1 will still be created by PointDepthPoint intrinsically and output double of input0.
      //
      // The input0 will just be pass-through as pointwise1's lower half.
      // The input0 will also be copied as pointwise1's higher half.
      //
      this.pointwise1ChannelCount = 0;                             // NoPointwise1. (Intrinsically, Double of input0. (Same as pointwise21.))

    } else {

      // In ShuffleNetV2_ByMobileNetV1's head, if ( blockParams.bPointwise1 == true ), pointwise1ChannelCount is always the same as
      // input0's channel count.
      //
      // But, in this case, pointwise1 will still and output double of input0 intrinsically.
      //
      // The input0 will be processed by pointwise1's lower half.
      // The input0 will be copied as pointwise1's higher half.
      //
      this.pointwise1ChannelCount = blockParams.sourceChannelCount; // (Intrinsically, Double of input0. (Same as pointwise21.))
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

    let blockParams = this.blockParams;

    // Except that ShuffleNetV2_ByMobileNetV1 does not have channel shuffler. The pointwise21 will do channel shuffling.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH; // (-5)

    // In ShuffleNetV2_ByMobileNetV1's body/tail, if ( blockParams.bPointwise1 == false ), pointwise1ChannelCount is also 0.
    // In this case, pointwise1 will not be created by PointDepthPoint (i.e. different from step0).
    //
    if ( blockParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0;

    // In ShuffleNetV2_ByMobileNetV1's body/tail, if ( blockParams.bPointwise1 == true ), pointwise1ChannelCount is always the
    // same as pointwise21 output channel count (which is already doubled as twice of step0's input0).
    //
    // The input0's lower half will be processed by pointwise1's lower half.
    // The input0's higher half will be pass-through as pointwise1's higher half.
    //
    } else {
      this.pointwise1ChannelCount = this.pointwise21ChannelCount;
    }
  }

  /** @override */
  channelShuffler_init() {
    // Do nothing. Because pointwise21 has done channel shuffling.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // StepLast is the same as ShuffleNetV2.
  }
}

