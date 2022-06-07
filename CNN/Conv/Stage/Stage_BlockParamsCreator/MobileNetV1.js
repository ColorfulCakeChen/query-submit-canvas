export { MobileNetV1 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Stage_Params.js";
import { Base } from "./Base.js";

/**
 * Provide parameters for MobileNetV1 (i.e. no-add-inut-to-output, pointwise1 is same size of pointwise20).
 *
 * Although this the simplest pointwise1-depthwise-pointwise2 architecture, it may be the most efficient neural network if
 * using CLIP_BY_VALUE_N3_P3 (instead of RELU) as activation function.
 *
 * The reasons are:
 *
 *   - Inference speed faster than MobileNetV2: According to experience of ShuffleNetV2_ByMobileNetV1, the CLIP_BY_VALUE_N3_P3
 *       activation function could achieve skipping connection (i.e. residual connection) without add-input-to-output (i.e MobileNetV2).
 *
 *   - Inference speed could be faster than ShuffleNetV2_ByMobileNetV1: MobileNetV1_Xxx's all blocks could have no pointwise1.
 *       ShuffleNetV2_ByMobileNetV1's block0 always have pointwise1 (even if ( stageParams.bPointwise1 == false ), it still exists
 *       internally). (But ShuffleNetV2_ByMobileNetV1's learning speed is faster than MobileNetv1 because less filter weights
 *       need to be learned.)
 *
 *
 *
 */
class MobileNetV1 extends Base {

  constructor( stageParams ) {
    super( stageParams );
  }

  /** @override */
  configTo_beforeBlock0() {
    super.configTo_beforeBlock0(); // block0's inputHeight0, inputWidth0, bias, activation.

    let stageParams = this.stageParams;

    this.channelCount0_pointwise1Before = stageParams.sourceChannelCount; // Block0 uses the original input channel count (as input0).

    // In MobileNetV1, all blocks (include block0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    if ( stageParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0;                                  // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2;                   // Double of input0. (Same as pointwise20.)

    } else {
      this.pointwise1ChannelCount = stageParams.sourceChannelCount * 2; // Double of input0. (Same as pointwise20.)
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }

    // All blocks' output0 is double depth of source input0.
    //
    // Note: In original MobileNet(V2) design, it is not always "twice". We choose "twice" just for comparing with ShuffleNetV2.
    //
    this.pointwise20ChannelCount = stageParams.sourceChannelCount * 2;

    this.bOutput1Requested = false; // In MobileNet, all blocks do not have output1.

    this.outChannels0 = this.pointwise20ChannelCount;
    this.outChannels1 = 0;
  }

  /** @override */
  configTo_afterBlock0() {
    super.configTo_afterBlock0(); // block1, 2, 3, ...'s inputHeight0, inputWidth0.

    // The input0 of all blocks (except block0) have the same depth as previous (also block0's) block's output0.
    this.channelCount0_pointwise1Before = this.outChannels0;

    // In MobileNetV1, all blocks (include block0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;
  }

  /** @override */
  configTo_beforeBlockLast() {
    super.configTo_beforeBlockLast(); // blockLast's pointwise20 bias.
  }

}

