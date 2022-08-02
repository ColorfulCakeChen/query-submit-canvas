export { ShuffleNetV2 };

import * as Pool from "../../../util/Pool.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as ChannelShuffler from "../../ChannelShuffler.js";
//import { Params } from "../Stage_Params.js";
import { Base } from "./Stage_BlockParamsCreator_Base.js";

/**
 * Provide parameters for ShuffleNetV2 (i.e. shuffle channel by ChannelShuffler.ConcatPointwiseConv).
 *
 *
 * 1. Last Channel Stationary
 *
 * Channel shuffler has a characteristic that it always does not shuffle the first and last channel (i.e. the channel 0
 * and channel ( N - 1 ) will always be at the same place). In ShuffleNetV2, the pointwise1 could alleviate this issue
 * a little.
 *   - At the block0's branch of a stage, the pointwise1 has a chance (the only one chance) to shuffle the last channel.
 *   - Through block1 to blockLast, the the last channel will always stay stationary.
 *     - It is never shuffled by channel shuffler.
 *     - It is never manipulated by any pointwise2 (because there is no pointwise21 in this ShuffleNetV2 configuration).
 *
 * It is hard to say this characteristic is good or bad.
 *   - In good side, it is easy to keep and pass information to the next stage.
 *   - In bad side, it wastes a channel (i.e. the last channel) if there is no information needed to be kept and passed
 *       to the next stage.
 *
 */
class ShuffleNetV2 extends Base {

  /**
   * Used as default Stage.BlockParamsCreator.ShuffleNetV2 provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.BlockParamsCreator.ShuffleNetV2.Pool", ShuffleNetV2, ShuffleNetV2.setAsConstructor );

  /**
   */
  constructor( stageParams ) {
    super( stageParams );
    ShuffleNetV2.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( stageParams ) {
    super.setAsConstructor( stageParams );
    ShuffleNetV2.setAsConstructor_self.call( this );
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
  determine_blockCount_depthwiseFilterHeightWidth_Default_Last() {
    super.determine_blockCount_depthwiseFilterHeightWidth_Default_Last();

    // ShuffleNetV2_Xxx must have at least 2 blocks because PointDepthPoint can not achieve the head/body/tail of
    // ShuffleNetV2 at the same time.
    if ( this.blockCount < 2 )
      throw Error( `Stage.BlockParamsCreator.ShuffleNetV2.determine_blockCount_depthwiseFilterHeightWidth_Default_Last(): `
        + `blockCount ( ${this.blockCount} ) must be at least 2 in ShuffleNetV2_Xxx.` );
  }

  /** @override */
  configTo_beforeBlock0() {
    super.configTo_beforeBlock0(); // block0's input0_height, input0_width, activation.

    let stageParams = this.stageParams;

    this.input0_channelCount = stageParams.input_channelCount; // Block0 uses the original input channel count (as input0).
    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD;

    if ( stageParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0; // NoPointwise1.
    } else {
      this.pointwise1ChannelCount = stageParams.input_channelCount; // same as input0_channelCount.
    }

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // In ShuffleNetV2, all blocks' (except blockLast) output0 is the same depth as source input0.
    this.pointwise20ChannelCount = stageParams.input_channelCount;

    // In ShuffleNetV2, all blocks (except blockLast) have both output0 and output1 with same depth as pointwise20 result.
    this.output0_channelCount = this.pointwise20ChannelCount;
    this.output1_channelCount = this.pointwise20ChannelCount;

    if ( !this.channelShuffler )
      this.channelShuffler_init(); // In ShuffleNetV2, all blocks (except blockLast) uses channel shuffler (with two convolution groups).
  }

  /** @override */
  configTo_beforeBlockN_exceptBlock0( blockIndex, input_height, input_width ) {
    super.configTo_beforeBlockN_exceptBlock0( blockIndex, input_height, input_width );

    // The ( input0, input1 ) of all blocks (except block0) have the same depth as previous (also block0's) block's ( output0, output1 ).
    this.input0_channelCount = this.output0_channelCount;

    // (with concatenation, without add-input-to-output).
    //
    // The channel count of input1 must be the same as pointwise20's result. The result of pointwise20 (which operates on input0)
    // will be concatenated with input1.
    //
    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY;
  }

  /**
   * Create channel shuffler if necessary and put in this.channelShuffler.
   *
   * Sub-class could override this method. For example, if sub-class does not need channel shuffler, it could override and do
   * nothing so that it can be avoided to create channel shuffler in sub-class.
   */
  channelShuffler_init() {
    let stageParams = this.stageParams;
    let block0_outChannelsAll = this.output0_channelCount + this.output1_channelCount;

    let outputGroupCount = 2; // Always with two convolution groups.
    let concatenatedDepth = block0_outChannelsAll; // All blocks always have the same total output channel count as block0.
    let concatenatedShape = [ stageParams.input_height, stageParams.input_width, concatenatedDepth ];
    this.channelShuffler = ChannelShuffler.ConcatPointwiseConv.Pool.get_or_create_by( concatenatedShape, outputGroupCount );
  }

  /** @override */
  configTo_beforeBlockLast() {
    super.configTo_beforeBlockLast(); // Still, blockLast may use a different activation function after pointwise2 convolution.

    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL;

    // In ShuffleNetV2, the blockLast only has output0 (no output1).
    //
    // The output0:
    //   - It will have double channel count of source input0.
    //   - It is the concatenation of pointwise20's result and input1.
    //
    // The pointwise20ChannelCount is still the same as input_channelCount (i.e. original input0_channelCount).
    // The input1_channelCount is also the same as input_channelCount (i.e. original input0_channelCount).
    //
    this.output0_channelCount = this.output0_channelCount + this.output1_channelCount;
    this.output1_channelCount = 0;
  }
}

