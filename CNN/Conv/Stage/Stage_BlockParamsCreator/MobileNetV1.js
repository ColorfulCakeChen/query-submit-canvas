export { MobileNetV1 };

import * as Pool from "../../../util/Pool.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Stage_Params.js";
import { Base } from "./Base.js";

/**
 * Provide parameters for MobileNetV1 (i.e. no-add-inut-to-output, pointwise1 is same size of pointwise20).
 *
 * Although this the simplest pointwise1-depthwise-pointwise2 architecture, it may be the most efficient neural network if
 * using CLIP_BY_VALUE_N2_P2 (instead of RELU) as activation function.
 *
 * The reasons are:
 *
 *   - Inference speed faster than MobileNetV2: According to experience of ShuffleNetV2_ByMobileNetV1, the CLIP_BY_VALUE_N2_P2
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

  /**
   * Used as default Stage.BlockParamsCreator.MobileNetV1 provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.BlockParamsCreator.MobileNetV1.Pool", MobileNetV1, MobileNetV1.setAsConstructor );

  /**
   */
  constructor( stageParams ) {
    super( stageParams );
    MobileNetV1.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( stageParams ) {
    super.setAsConstructor( stageParams );
    MobileNetV1.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Do nothing.
  }

  ///** @override */
  //disposeResources() {
  //  super.disposeResources();
  //}

  /** @override */
  configTo_beforeBlock0() {
    super.configTo_beforeBlock0(); // block0's input0_height, input0_width, activation.

    let stageParams = this.stageParams;

    this.input0_channelCount = stageParams.sourceChannelCount; // Block0 uses the original input channel count (as input0).

    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL;

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

    this.output0_channelCount = this.pointwise20ChannelCount;
    this.output1_channelCount = 0;
  }

  /** @override */
  configTo_beforeBlockN_exceptBlock0( blockIndex ) {
    super.configTo_beforeBlockN_exceptBlock0( blockIndex ); // block1, 2, 3, ...'s input0_height, input0_width.

    // The input0 of all blocks (except block0) have the same depth as previous (also block0's) block's output0.
    this.input0_channelCount = this.output0_channelCount;
  }

  /** @override */
  configTo_beforeBlockLast() {
    super.configTo_beforeBlockLast(); // blockLast's pointwise20 bias.
  }

}

