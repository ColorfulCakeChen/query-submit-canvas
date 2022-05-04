export { ShuffleNetV2_ByPointwise22 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Param.js";
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
 *                            +-------------------------------------------------------------------------------+------------+------------+----------+
 *                            |                       pointwise2 convolution                                  |    bias    | activation | function |
 *                            |-----------------------------------------------------------------+-------------|            |            |   calls  |
 *                            |                             weights                             | computation |            |            |          |
 *                            |--------------------------------+--------------------------------|             |            |            |          |
 *                            |          independent           | shared (for channel shuffling) |             |            |            |          |
 * +----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | Step0    | Original      | ( M *  M ) + ( M *  M ) = 2M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        6M^2 | M + M = 2M | M + M = 2M |        8 |
 * |          | Simplified    | ( M * 2M ) + ( M * 2M ) = 4M^2 |                              0 |        4M^2 | M + M = 2M | M + M = 2M |        6 |
 * |          | Compare       |                     worse 2M^2 |                    better 4M^2 | better 2M^2 |       same |       same | better 2 |
 * |----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | Step1    | Original      |              ( M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * | Step2    | ByPointwise22 | ( M * 2M ) + ( M * 2M ) = 4M^2 |                              0 |        4M^2 | M + M = 2M | M + M = 2M |        6 |
 * |   :      | Compare       |                     worse 3M^2 |                    better 4M^2 | better  M^2 |    worse M |    worse M |  worse 2 |
 * |----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | StepLast | Original      |             (  M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * |          | ByPointwise22 |             ( 2M * 2M ) = 4M^2 |                              0 |        4M^2 |         2M |         2M |        3 |
 * |          | Compare       |                     worse 3M^2 |                    better 4M^2 | better  M^2 |    worse M |    worse M | better 2 |
 * |----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | StepLast | Original      |             (  M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * |          | Simplified    |             (  M *  M ) =  M^2 |                              0 |         M^2 |          M |          M |        3 |
 * |          | Compare       |                           same |                    better 4M^2 | better 4M^2 |       same |       same | better 2 |
 * |----------+---------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * </pre>
 *
 * Step0:
 *   - Two less pointwise convolution computation. Two less function calls.
 *   - But more independent pointwise weights.
 *   - Better.
 *
 * Step1, Step2, ..., Step(N - 1):
 *   - One less pointwise convolution computation.
 *   - But more independent pointwise weights, more bias, more activation function, two more function calls.
 *   - Worse.
 *
 * StepLast:
 *   - One less pointwise convolution computation. Two less function calls.
 *   - But more independent pointwise weights, more bias and more activation function.
 *   - May be better or worse.
 *
 * In summary, this method may result in a slower ShuffleNetV2.
 *
 *
 * 2. Better when ( pointwise1ChannelCountRate == 0 )
 *
 * Different from ShufflerNetV2, the issue of the first and last channel fixed at stationary place does not exist in this
 * ShuffleNetV2_ByPointwise22. The reason is that it uses non-shared pointwise2 instead of channel shuffler. This lets
 * ( pointwise1ChannelCountRate == 0 ) become feasible because it no longer relies on pointwise1 to change the first and
 * last channel position.
 *
 * In addition, the redued computation (because of no pointwise1) could compansate the extra computation (because of
 * non-shared pointwise2).
 *
 * It is suggested to use ShuffleNetV2_ByPointwise22 with ( pointwise1ChannelCountRate == 0 ).
 *
 *
 */
class ShuffleNetV2_ByPointwise22 extends ShuffleNetV2 {

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // Step1, 2, 3, ... are almost the same as ShuffleNetV2.

    // Except that ShuffleNetV2_ByPointwise22 does not have channel shuffler. The pointwise21 and pointwise22 will do channel shuffling.
    this.channelCount1_pointwise1Before = this.outChannels1; // i.e. TWO_INPUTS (with concatenation, without add-input-to-output).

//!!! (2022/05/02 Remarked) It seems enough to set this.channelCount1_pointwise1Before = this.outChannels1 (i.e. TWO_INPUTS).
//
//     let blockParams = this.blockParams;
//
//     this.inputHeight0 = blockParams.outputHeight; // all steps (except step0) inputs half the source image size.
//     this.inputWidth0 = blockParams.outputWidth;
//
//     // The ( input0, input1 ) of all steps (except step0) have the same depth as previous (also step0's) step's ( output0, output1 ).
//     this.channelCount0_pointwise1Before = this.outChannels0;
//     this.channelCount1_pointwise1Before = this.outChannels1; // i.e. TWO_INPUTS (with concatenation, without add-input-to-output).
//
//     // In ShuffleNetV2, all steps (except step0 in NoPointwise1) will not double the channel count by depthwise.
//     this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
//
//     // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
//     this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;
//
//     this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }

  /** @override */
  channelShuffler_init() {
    // Do nothing. Because ShuffleNetV2_ByPointwise22 uses pointwise21 and pointwise22 as channel shuffler.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In ShuffleNetV2_ByPointwise22, the stepLast has only output0 (no output1). And the output0 has double channel count of
    // source input0.
    //
    // Note: Although pointwise21 channel count changed, however, the pointwise1ChannelCount is not changed because the final
    // output0 is viewed as concatenation of pointwise21 and pointwise22. In pointwise1's point of view, its pointwise2 does
    // not changed.
    this.pointwise21ChannelCount = this.blockParams.sourceChannelCount * 2;
    this.bOutput1Requested = false;
  }
}

