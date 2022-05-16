export { ShuffleNetV2_ByPointwise22 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Stage_Params.js";
import { ShuffleNetV2 } from "./ShuffleNetV2.js";

/**
 * Provide parameters for ShuffleNetV2_ByPointwise22 (i.e. shuffle channel by pointwise22).
 *
 * 1. ShuffleNetV2_ByPointwise22:
 *
 * Since channel shuffler could achieved efficiently by pointwise convolution, it is possible to combine the pointwise2
 * convolution (after depthwise convolution) and the pointwise convolution (of channel shuffler). That is:
 *   - Concatenate the output of depthwise convolution and the other output group.
 *   - Pointwise convolution to generate output group 1. (i.e. pointwise21)
 *   - Pointwise convolution to generate output group 2. (i.e. pointwise22)
 *
 * Although the channel shuffler is achieved by pointwise convolution without bias and activation function, however,
 * the pointwise21 convolution (before channel shuffler) indeed has bias and activation function. After combining
 * these two pointwise convolutions (the original pointwise2 and the channel shuffler), the total result is twice
 * pointwise convolution: pointwise21 and pointwise22. They should all have bias and activation function to achieve
 * both pointwise convolution and channel-shuffling.
 *
 * The pointwise21 and pointwise22 convolution achieves not only pointwise convolution but also channel shuffling.
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
 * | Block2    | ByPointwise22 | ( M * 2M ) + ( M * 2M ) = 4M^2 |                              0 |        4M^2 | M + M = 2M | M + M = 2M |        6 |
 * |   :       | Compare       |                     worse 3M^2 |                    better 4M^2 | better  M^2 |    worse M |    worse M |  worse 2 |
 * |-----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | BlockLast | Original      |             (  M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * |           | ByPointwise22 |             ( 2M * 2M ) = 4M^2 |                              0 |        4M^2 |         2M |         2M |        3 |
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
 * 2. Better when ( stageParams.bPointwise1 == false )
 *
 * Different from ShufflerNetV2, the issue of the first and last channel fixed at stationary place does not exist in this
 * ShuffleNetV2_ByPointwise22. The reason is that it uses non-shared pointwise2 instead of channel shuffler. This lets
 * ( stageParams.bPointwise1 == false ) become feasible because it no longer relies on pointwise1 to change the first and
 * last channel position.
 *
 * In addition, the redued computation (because of no pointwise1) could compansate the extra computation (because of
 * non-shared pointwise2).
 *
 * It is suggested to use ShuffleNetV2_ByPointwise22 with ( stageParams.bPointwise1 == false ).
 *
 *
 */
class ShuffleNetV2_ByPointwise22 extends ShuffleNetV2 {

  constructor( stageParams ) {
    super( stageParams );
  }

  /** @override */
  configTo_beforeBlock0() {
    super.configTo_beforeBlock0(); // Block0 is the same as ShuffleNetV2.
  }

  /** @override */
  configTo_afterBlock0() {
    super.configTo_afterBlock0(); // Block1, 2, 3, ... are almost the same as ShuffleNetV2.

    // Except that ShuffleNetV2_ByPointwise22 does not have channel shuffler. The pointwise21 and pointwise22 will do channel shuffling.
    this.channelCount1_pointwise1Before = this.outChannels1; // i.e. TWO_INPUTS (with concatenation, without add-input-to-output).
  }

  /** @override */
  channelShuffler_init() {
    // Do nothing. Because ShuffleNetV2_ByPointwise22 uses pointwise21 and pointwise22 as channel shuffler.
  }

  /** @override */
  configTo_beforeBlockLast() {
    super.configTo_beforeBlockLast(); // BlockLast is the same as ShuffleNetV2.
  }
}

