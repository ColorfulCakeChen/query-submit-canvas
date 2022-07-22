export { ShuffleNetV2_ByPointwise21 };

import * as Pool from "../../../util/Pool.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Stage_Params.js";
import { Base } from "./Base.js";

/**
 * Provide parameters for ShuffleNetV2_ByPointwise21 (i.e. shuffle channel by pointwise21).
 *
 * 1. ShuffleNetV2_ByPointwise21:
 *
 * Since channel shuffler could achieved efficiently by pointwise convolution, it is possible to combine the pointwise2
 * convolution (after depthwise convolution) and the pointwise convolution (of channel shuffler). That is:
 *   - Concatenate the output of depthwise convolution and the other output group.
 *   - Pointwise convolution to generate output group 1. (i.e. pointwise20)
 *   - Pointwise convolution to generate output group 2. (i.e. pointwise21)
 *
 * Although the channel shuffler is achieved by pointwise convolution without bias and activation function, however,
 * the pointwise20 convolution (before channel shuffler) indeed has bias and activation function. After combining
 * these two pointwise convolutions (the original pointwise2 and the channel shuffler), the total result is twice
 * pointwise convolution: pointwise20 and pointwise21. They should all have bias and activation function to achieve
 * both pointwise convolution and channel-shuffling.
 *
 * The pointwise20 and pointwise21 convolution achieves not only pointwise convolution but also channel shuffling.
 * Suppose the input channel count is M. Compare ours to the original ShuffleNetV2:
 *
 * <pre>
 *                             +-------------------------------------------------------------------------------+------------+------------+----------+
 *                             |                       pointwise2 convolution                                  |    bias    | activation | function |
 *                             |-----------------------------------------------------------------+-------------|            |            |   calls  |
 *                             |                             weights                             | computation |            |            |          |
 *                             |--------------------------------+--------------------------------|             |            |            |          |
 *                             |          independent           | shared (for channel shuffling) |             |            |            |          |
 * +-----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | Block0    | Original      | ( M *  M ) + ( M *  M ) = 2M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        6M^2 | M + M = 2M | M + M = 2M |        8 |
 * |           | Simplified    | ( M * 2M ) + ( M * 2M ) = 4M^2 |                              0 |        4M^2 | M + M = 2M | M + M = 2M |        6 |
 * |           | Compare       |                     worse 2M^2 |                    better 4M^2 | better 2M^2 |       same |       same | better 2 |
 * |-----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | Block1    | Original      |              ( M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * | Block2    | ByPointwise21 | ( M * 2M ) + ( M * 2M ) = 4M^2 |                              0 |        4M^2 | M + M = 2M | M + M = 2M |        6 |
 * |   :       | Compare       |                     worse 3M^2 |                    better 4M^2 | better  M^2 |    worse M |    worse M |  worse 2 |
 * |-----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | BlockLast | Original      |             (  M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * |           | ByPointwise21 |             ( 2M * 2M ) = 4M^2 |                              0 |        4M^2 |         2M |         2M |        3 |
 * |           | Compare       |                     worse 3M^2 |                    better 4M^2 | better  M^2 |    worse M |    worse M | better 2 |
 * |-----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | BlockLast | Original      |             (  M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * |           | Simplified    |             (  M *  M ) =  M^2 |                              0 |         M^2 |          M |          M |        3 |
 * |           | Compare       |                           same |                    better 4M^2 | better 4M^2 |       same |       same | better 2 |
 * |-----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * </pre>
 *
 * Block0:
 *   - Two less pointwise convolution computation. Two less function calls.
 *   - But more independent pointwise weights.
 *   - Better.
 *
 * Block1, Block2, ..., Block(N - 1):
 *   - One less pointwise convolution computation.
 *   - But more independent pointwise weights, more bias, more activation function, two more function calls.
 *   - Worse.
 *
 * BlockLast:
 *   - One less pointwise convolution computation. Two less function calls.
 *   - But more independent pointwise weights, more bias and more activation function.
 *   - May be better or worse.
 *
 * In summary, this method may result in a slower ShuffleNetV2.
 *
 *
 * 2. Better Special case: NoPointwise1 ( stageParams.bPointwise1 == false )
 * 
 * What is the different of the NoPointwise1 configuration?
 *
 * When the poitwise1 convolution (of every block (including block0)) is discarded (i.e. ( stageParams.bPointwise1 == false ) ),
 * the block0 and block0's branch could be achieved simultaneously by:
 *   - once depthwise convolution (channelMultipler = 2, strides = 2, pad = same, bias, CLIP_BY_VALUE_N2_P2).
 *   - No need to concatenate because the above operation already double channel count.
 *
 * Note that:
 *   - The depthwise1 convolution (channelMultipler = 2, strides = 2) of block0 achieves simultaneously two depthwise
 *     convolution (channelMultipler = 1, strides = 2) of block0 and block0's branch. So, it is one less depthwise
 *     convolution and one less concatenating (than original ShuffleNetV2).
 *
 * The redued computation (because of no pointwise1) could compansate the extra computation (because of non-shared pointwise2).
 *
 * It is worth considering to use ShuffleNetV2_ByPointwise21 with ( stageParams.bPointwise1 == false ).
 *
 *
 * 3. No Last Channel Stationary
 *
 * Different from ShufflerNetV2, the issue of last channel fixed at stationary place does not exist in this
 * ShuffleNetV2_ByPointwise21. The reason is that it uses non-shared pointwise2 instead of channel shuffler.
 *
 *
 */
class ShuffleNetV2_ByPointwise21 extends Base {

  /**
   * Used as default Stage.BlockParamsCreator.ShuffleNetV2_ByPointwise21 provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.BlockParamsCreator.ShuffleNetV2_ByPointwise21.Pool",
    ShuffleNetV2_ByPointwise21, ShuffleNetV2_ByPointwise21.setAsConstructor );

  /**
   */
  constructor( stageParams ) {
    super( stageParams );
    ShuffleNetV2_ByPointwise21.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( stageParams ) {
    super.setAsConstructor( stageParams );
    ShuffleNetV2_ByPointwise21.setAsConstructor_self.call( this );
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
    super.configTo_beforeBlock0(); // Block0 is a little similar to ShuffleNetV2.

    let stageParams = this.stageParams;

    this.input0_channelCount = stageParams.sourceChannelCount; // Block0 uses the original input channel count (as input0).

    if ( stageParams.bPointwise1 == false ) {

      // NoPointwise1 ShuffleNetV2_ByPointwise21 (expanding by once depthwise).
      //
      // If block0 does not have pointwise1 convolution before depthwise convolution, the depthwise2 convolution is not
      // necessary. Then, a simpler configuration could be used.
      //
      // Just use once depthwise convolution (but with channel multipler 2) to double the channel count.
      //
      this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2;

      this.pointwise1ChannelCount = 0;                                  // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2;                   // Double of input0. (Double of pointwise20.)

    } else {
      this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD;
      this.pointwise1ChannelCount = stageParams.sourceChannelCount * 2; // Double of input0. (Double of pointwise20.)
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }

    // In ShuffleNetV2_ByPointwise21, all blocks' (except blockLast) output0 is the same depth as source input0.
    this.pointwise20ChannelCount = stageParams.sourceChannelCount;

    // In ShuffleNetV2_ByPointwise21, all blocks (except blockLast) have both output0 and output1 with same depth as pointwise20 result.
    this.output0_channelCount = this.pointwise20ChannelCount;
    this.output1_channelCount = this.pointwise20ChannelCount;
  }

  /** @override */
  configTo_beforeBlockN_exceptBlock0( blockIndex ) {
    super.configTo_beforeBlockN_exceptBlock0( blockIndex );

    let stageParams = this.stageParams;

    this.input0_channelCount = this.output0_channelCount;
    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY;

    if ( stageParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0;                              // NoPointwise1.
    } else {
      this.pointwise1ChannelCount = stageParams.sourceChannelCount; // Same as original input0. (Same as pointwise20.)
    }
  }

  /** @override */
  channelShuffler_init() {
    // Do nothing. Because ShuffleNetV2_ByPointwise21 uses pointwise20 and pointwise21 as channel shuffler.
  }

  /** @override */
  configTo_beforeBlockLast() {
    super.configTo_beforeBlockLast();

    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL;

    // In ShuffleNetV2_ByPointwise21, the blockLast only has output0 (no output1).
    //
    // The output0:
    //   - It will have double channel count of source input0.
    //   - It is the concatenation of pointwise20's result and input1.
    //
    // The pointwise20ChannelCount is still the same as sourceChannelCount (i.e. original input0_channelCount).
    // The input1_channelCount is also the same as sourceChannelCount (i.e. original input0_channelCount).
    //
    this.output0_channelCount = this.output0_channelCount + this.output1_channelCount;
    this.output1_channelCount = 0;
  }
}

