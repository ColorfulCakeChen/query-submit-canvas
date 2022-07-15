export { ShuffleNetV2 };

import * as Pool from "../../../util/Pool.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as ChannelShuffler from "../../ChannelShuffler.js";
import { Params } from "../Stage_Params.js";
import { Base } from "./Base.js";

/**
 * Provide parameters for ShuffleNetV2 (i.e. shuffle channel by ChannelShuffler.ConcatPointwiseConv).
 *
 *
 * 1. Special case: NoPointwise1 ( stageParams.bPointwise1 == false ) ShuffleNetV2 (i.e. without pointwise1, with concatenator).
 * 
 * What is the different of the NoPointwise1 configuration?
 *
 * When the poitwise1 convolution (of every block (including block0)) is discarded (i.e. ( stageParams.bPointwise1 == false ) ),
 * the block0 and block0's branch could be achieved simultaneously by:
 *   - once depthwise convolution (channelMultipler = 2, strides = 2, pad = same, bias, CLIP_BY_VALUE_N3_P3).
 *   - No need to concatenate because the above operation already double channel count.
 *
 * Note that:
 *   - The depthwise1 convolution (channelMultipler = 2, strides = 2) of block0 achieves simultaneously two depthwise
 *     convolution (channelMultipler = 1, strides = 2) of block0 and block0's branch. So, it is one less depthwise
 *     convolution and one less concatenating (than original ShuffleNetV2).
 *
 *
 * 1. Drawback when ( stageParams.bPointwise1 == false )
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
 * If ( stageParams.bPointwise1 == false ), there will be no pointwise1 (i.e. no chance) to shuffle the (first and) last
 * channel's position.
 *
 * So, it may be NOT suggested to use ShuffleNetV2 with ( stageParams.bPointwise1 == false ).
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
    Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( stageParams ) {
    super.setAsConstructor( stageParams );
    Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self( stageParams ) {
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

    this.input0_channelCount = stageParams.sourceChannelCount; // Block0 uses the original input channel count (as input0).
    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // In ShuffleNetV2, all blocks' (except blockLast) output0 is the same depth as source input0.
    this.pointwise20ChannelCount = stageParams.sourceChannelCount;

    // In ShuffleNetV2, all blocks (except blockLast) have both output0 and output1 with same depth as pointwise20 result.
    this.outChannels0 = this.pointwise20ChannelCount;
    this.outChannels1 = this.pointwise20ChannelCount;
  }

  /** @override */
  configTo_afterBlock0() {
    super.configTo_afterBlock0();

    // The ( input0, input1 ) of all blocks (except block0) have the same depth as previous (also block0's) block's ( output0, output1 ).
    this.input0_channelCount = this.outChannels0;

    // (with concatenation, without add-input-to-output).
    //
    // The channel count of input1 must be the same as pointwise20's result. The result of pointwise20 (which operates on input0)
    // will be concatenated with input1.
    //
    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY;

    this.channelShuffler_init(); // In ShuffleNetV2, all blocks (except block0) uses channel shuffler (with two convolution groups).
  }
  
  /**
   * Create channel shuffler if necessary and put in this.channelShuffler.
   *
   * Sub-class could override this method. For example, if sub-class does not need channel shuffler, it could override and do
   * nothing so that it can be avoided to create channel shuffler in sub-class.
   */
  channelShuffler_init() {
    let stageParams = this.stageParams;
    let block0_outChannelsAll = this.outChannels0 + this.outChannels1;

    let outputGroupCount = 2; // Always with two convolution groups.
    let concatenatedDepth = block0_outChannelsAll; // All blocks always have the same total output channel count as block0.
    let concatenatedShape = [ stageParams.sourceHeight, stageParams.sourceWidth, concatenatedDepth ];
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
    this.pointwise20ChannelCount = this.stageParams.sourceChannelCount * 2;

    this.outChannels0 = this.outChannels0 + this.outChannels1;
    this.outChannels1 = 0;
  }
}

