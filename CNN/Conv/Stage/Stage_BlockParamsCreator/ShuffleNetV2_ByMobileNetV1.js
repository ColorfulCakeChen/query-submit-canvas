export { ShuffleNetV2_ByMobileNetV1 };

import * as Pool from "../../../util/Pool.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
//import { Params } from "../Stage_Params.js";
import { Base } from "./Stage_BlockParamsCreator_Base.js";

/*
 * Provide parameters for ShuffleNetV2_ByMobileNetV1 (i.e. concatenate, shuffle channel, split by integrated pointwise1, depthwise1,
 * pointwise20).
 *
 *
 * 1. Motivation
 *
 * Accodring to testing, the original ShuffleNetV2 is faster than MobileNetV2 in backend CPU. This may result from lesser
 * computation. However, in backend WASM and WEBGL, MobileNetV2 is faster than the original ShuffleNetV2. The possible
 * reason may be that the concatenate-shuffle-split (even achieved by pointwise convolution) operation is not friendly
 * for WASM and WebGL.
 *
 * This results in an idea that:
 *
 *   - Use MobileNetV1 structure (i.e. no add-input-to-output) but pointwise1 already exists.
 *
 *   - Manipulate the filter weights of pointwise1, depthwise1, pointwise20 so that they achieve the same effect of shuffling
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
 *
 * 2. Last Channel Stationary
 *
 * Just like ShuffleNetV2, The last channel also always stays stationary in ShuffleNetV2_ByMobileNetV1. Even worse, because
 * ShuffleNetV2_ByMobileNetV1 uses scaling to achieve activation escaping. The stationary last channel never have chance to
 * be re-calicated (i.e. it will accumulate floating-point error between scaling/un-scaling).
 *
 * So, the last channel may be have obvious difference from ShuffleNetV2. A possible workaround may always not use the last
 * channel data of final stage's output.
 *
 *
 */
class ShuffleNetV2_ByMobileNetV1 extends Base {

  /**
   * Used as default Stage.BlockParamsCreator.ShuffleNetV2_ByMobileNetV1 provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.BlockParamsCreator.ShuffleNetV2_ByMobileNetV1.Pool",
    ShuffleNetV2_ByMobileNetV1, ShuffleNetV2_ByMobileNetV1.setAsConstructor );

  /**
   */
  constructor( stageParams ) {
    super( stageParams );
    ShuffleNetV2_ByMobileNetV1.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( stageParams ) {
    super.setAsConstructor( stageParams );
    ShuffleNetV2_ByMobileNetV1.setAsConstructor_self.call( this );
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
    super.configTo_beforeBlock0(); // Use same input0 (height, width, channel count), activation, depthwise filter size (as ShuffleNetV2).

    let stageParams = this.stageParams;

    this.input0_channelCount = stageParams.input_channelCount; // Block0 uses the original input channel count (as input0).
    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD;

    if ( stageParams.bPointwise1 == false ) {

      // In ShuffleNetV2_ByMobileNetV1's head, if ( stageParams.bPointwise1 == false ), pointwise1ChannelCount is also 0.
      //
      // But, in this case, pointwise1 will still be created by Block intrinsically and output double of input0.
      //
      // The input0 will just be pass-through as pointwise1's lower half.
      // The input0 will also be copied as pointwise1's higher half.
      //
      this.pointwise1ChannelCount = 0;                             // NoPointwise1. (Intrinsically, Double of input0. (Same as pointwise20.))

    } else {

      // In ShuffleNetV2_ByMobileNetV1's head, if ( stageParams.bPointwise1 == true ), pointwise1ChannelCount is always the same as
      // input0's channel count.
      //
      // But, in this case, pointwise1 will still and output double of input0 intrinsically.
      //
      // The input0 will be processed by pointwise1's lower half.
      // The input0 will be copied as pointwise1's higher half.
      //
      this.pointwise1ChannelCount = stageParams.input_channelCount; // (Intrinsically, Double of input0. (Same as pointwise20.))
    }

    // In ShuffleNetV2_ByMobileNetV1's head, depthwise always output the same channel count of pointwise1 real output channel count
    // (which has already been doubled as twice of input0's channel count by PointDepthPoint internally).
    //
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // In ShuffleNetV2_ByMobileNetV1, pointwise20ChannelCount is always twice of original input0's channel count.
    this.pointwise20ChannelCount = stageParams.input_channelCount * 2;

    // In ShuffleNetV2_ByMobileNetV1, all blocks have only output0 (with same depth as pointwise20 result) and no output1.
    this.output0_channelCount = this.pointwise20ChannelCount;
    this.output1_channelCount = 0;
  }

  /** @override */
  configTo_beforeBlockN_exceptBlock0( blockIndex, input_height, input_width ) {
    super.configTo_beforeBlockN_exceptBlock0( blockIndex, input_height, input_width );

    let stageParams = this.stageParams;

    this.input0_channelCount = this.output0_channelCount;
    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY;

    // In ShuffleNetV2_ByMobileNetV1's body/tail, if ( stageParams.bPointwise1 == false ), pointwise1ChannelCount is also 0.
    // In this case, pointwise1 will not be created by PointDepthPoint (i.e. different from block0).
    //
    if ( stageParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0; // (Intrinsically, zero, too.)

    // In ShuffleNetV2_ByMobileNetV1's body/tail, if ( stageParams.bPointwise1 == true ), pointwise1ChannelCount is always the
    // same as pointwise20 output channel count (which is already doubled as twice of block0's input0).
    //
    // The input0's lower half will be processed by pointwise1's lower half.
    // The input0's higher half will be pass-through as pointwise1's higher half.
    //
    } else {
      this.pointwise1ChannelCount = this.pointwise20ChannelCount;
    }
  }

  /** @override */
  channelShuffler_init() {
    // Do nothing. Because pointwise20 has done channel shuffling.
  }

  /** @override */
  configTo_beforeBlockLast() {
    super.configTo_beforeBlockLast();
    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL;
  }
}

