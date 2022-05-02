export { Base };
export { ShuffleNetV2 };
export { ShuffleNetV2_ByPointwise22 };
export { ShuffleNetV2_ByMobileNetV1 };
export { MobileNetV2 };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "./PointDepthPoint.js";
import * as ChannelShuffler from "./ChannelShuffler.js";
import { Params } from "./Block_Param.js";

/**
 * Basic class for all Params_to_PointDepthPointParams.Xxx classes.
 *
 * Note: In modern deep learning CNN, there is batch normalization after convolution and before activation. The batch normalization
 * has bias internally. We do not have batch normalization in architecture so an explicit bias will be used before every activation
 * function.
 *
 * @member {number} outChannels0
 *   The output0's channel count in current configuration.
 *
 * @member {number} outChannels1
 *   The output1's channel count in current configuration.
 *
 */
class Base {
  /**
   * @param {Params} blockParams
   *   The Block.Params object which provides basic parameters.
   */
  constructor( blockParams ) {
    this.blockParams = blockParams;

    this.inputHeight0 = this.inputWidth0 =
    this.channelCount0_pointwise1Before = this.channelCount1_pointwise1Before =
    this.pointwise1ChannelCount = this.bPointwise1Bias = this.pointwise1ActivationId =
    this.depthwise_AvgMax_Or_ChannelMultiplier = this.depthwiseFilterHeight = this.depthwiseFilterWidth =
    this.depthwiseStridesPad = this.bDepthwiseBias = this.depthwiseActivationId =
    this.pointwise21ChannelCount = this.bPointwise21Bias = this.pointwise21ActivationId =
    this.bOutput1Requested = this.bKeepInputTensor = undefined;

    this.stepCount = // How many step should be in the block.
    this.depthwiseFilterHeight_Default = this.depthwiseFilterWidth_Default = // The default depthwise filter size.
    this.depthwiseFilterHeight_Last = this.depthwiseFilterWidth_Last =       // The last step's depthwise filter size.
    this.outChannels0 = this.outChannels1 = -1;

    this.channelShuffler = undefined;
  }

  /** Called to determine stepCount, depthwiseFilterHeight_Default, depthwiseFilterWidth_Default, depthwiseFilterHeight_Last,
    * depthwiseFilterWidth_Last.
    *
    * Sub-class could override this method to adjust data members.
    */
  determine_stepCount_depthwiseFilterHeightWidth_Default_Last() {
    let blockParams = this.blockParams;
    this.stepCount = blockParams.stepCountRequested; // By default, the step count is just the original step count.

    // By default, all steps uses the original depthwise filter size.
    this.depthwiseFilterHeight_Default = this.depthwiseFilterHeight_Last = blockParams.depthwiseFilterHeight;
    this.depthwiseFilterWidth_Default = this.depthwiseFilterWidth_Last = blockParams.depthwiseFilterWidth;
  }

  /**
   * Called before step0 is about to be created. Sub-class should override this method to adjust data members.
   *
   * Step 0.
   *
   * The special points of a block's step 0 are:
   *   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
   *   - Double channels.
   *     - By concat, if ShuffleNetV2.
   *     - By channelMultiplier of depthwise convolution, if (Our) ShuffleNetV2 when ( pointwise1ChannelCount == 0 ).
   *     - By pointwise1 (for ( pointwise1ChannelCountRate == 1 )) and pointwise21 (for ( pointwise1ChannelCountRate == 0 )), if MobileNetV2.
   */
  configTo_beforeStep0() {}

  /**
   * Called after step0 is created (i.e. before step1, 2, 3, ...). Sub-class should override this method to adjust data members.
   */
  configTo_afterStep0() {}

  /**
   * Called before stepLast is about to be created. Sub-class could override this method to adjust data members.
   */
  configTo_beforeStepLast() {
    // By default, the stepLast of this block (i.e. at-block-end) may use a different activation function after pointwise2 convolution.
    //
    // Even if in MobileNetV2 (pointwise2 convolution does not have activation function in default), this is still true.
    this.pointwise21ActivationId = this.blockParams.nActivationIdAtBlockEnd;

    // Besides, the stepLast may use a different depthwise filter size. This is especially true for NotShuffleNet_NotMobileNet.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Last;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Last;
  }

  /**
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @return {PointDepthPoint.Params}
   *   Create and return a PointDepthPoint.Params according to this object's current state.
   */
  create_PointDepthPointParams( inputFloat32Array, byteOffsetBegin ) {
    let params = new PointDepthPoint.Params(
      inputFloat32Array, byteOffsetBegin,
      this.inputHeight0, this.inputWidth0,
      this.channelCount0_pointwise1Before,
      this.channelCount1_pointwise1Before,
      this.pointwise1ChannelCount, this.bPointwise1Bias, this.pointwise1ActivationId,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth,
      this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId,
      this.pointwise21ChannelCount, this.bPointwise21Bias, this.pointwise21ActivationId,
      this.bOutput1Requested,
      this.bKeepInputTensor
    );
    return params;
  }
}


/**
 * Provide parameters for ShuffleNetV2 (i.e. shuffle channel by ChannelShuffler.ConcatPointwiseConv).
 *
 *
 * 1. Be ware of ( pointwise1ChannelCountRate == 2 )
 *
 * ShuffleNetV2 always double the channel count. It is achieved by concatenation. This is different from MobileNetV2 which achieves
 * channel count doubling by pointwise1.
 *
 * That is, if ( pointwise1ChannelCountRate == 2 ), there will be 4 times (not 2 times) channels to be processed in fact. It could be
 * expected that the performance will be slower than ( pointwise1ChannelCountRate == 2 ) in MobileNetV2 unfairly.
 *
 * So, the original ShuffleNetV2 should be ( pointwise1ChannelCountRate == 1 ).
 *
 *
 * 2. A special case: NoPointwise1 ShuffleNetV2 (i.e. without pointwise1, with concatenator).
 * 
 * Q: How to specify the NoPointwise1 configuration?
 * A: By  (   ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_CHANNEL_SHUFFLER )
 *         or ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_POINTWISE22 )
 *        )
 *    and ( pointwise1ChannelCountRate == 0 )
 *    in the parameters of Block.Params.
 *
 * What is the different of the NoPointwise1 configuration?
 *
 * When the poitwise1 convolution (of every step (including step 0)) is discarded (i.e. ( pointwise1ChannelCountRate == 0 ) ),
 * the step 0 and step 0's branch could be achieved simultaneously by:
 *   - once depthwise convolution (channelMultipler = 2, strides = 2, pad = same, bias, COS).
 *   - No need to concatenate because the above operation already double channel count.
 *
 * Note that:
 *   - The depthwise1 convolution (channelMultipler = 2, strides = 2) of step 0 achieves simultaneously two depthwise
 *     convolution (channelMultipler = 1, strides = 2) of step0 and step0's branch. So, it is one less depthwise
 *     convolution and one less concatenating (than original ShuffleNetV2).
 *
 *   - Even if the pointwise1 convolution is discarded, just two steps of this simplied ShuffleNetV2 still compose an
 *     effective Fourier series which should have enough expressive power for approximating any function. By given
 *     the following configuration in the Block.Params:
 *       - (   ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_CHANNEL_SHUFFLER )
 *          or ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_POINTWISE22 ) )
 *       - ( pointwise1ChannelCountRate == 0 )
 *       - ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.COS) 
 *       - ( nActivationIdAtBlockEnd == ValueDesc.ActivationFunction.Singleton.Ids.NONE)
 *
 *
 * 3. Drawback when ( pointwise1ChannelCountRate == 0 )
 *
 * Channel shuffler has a characteristic that it always does not shuffle the first and last channel (i.e. the channel 0
 * and channel ( N - 1 ) will always be at the same place). In ShuffleNetV2, the pointwise1 could alleviate this issue
 * a little.
 *   - At the step0's branch of a block, the pointwise1 has a chance (the only one chance) to shuffle the last channel.
 *   - Through step1 to stepLast, the the last channel will always stay stationary.
 *     - It is never shuffled by channel shuffler.
 *     - It is never manipulated by any pointwise2 (because there is no pointwise22 in this ShuffleNetV2 configuration).
 *
 * It is hard to say this characteristic is good or bad.
 *   - In good side, it is easy to keep and pass information to the next block.
 *   - In bad side, it wastes a channel (i.e. the last channel) if there is no information needed to be kept and passed
 *       to the next block.
 *
 * If ( pointwise1ChannelCountRate == 0 ), there will be no pointwise1 (i.e. no chance) to shuffle the (first and) last
 * channel's position.
 *
 * So, it is NOT suggested to use ShuffleNetV2 with ( pointwise1ChannelCountRate == 0 ).
 *
 */
class ShuffleNetV2 extends Base {

  /** @override */
  determine_stepCount_depthwiseFilterHeightWidth_Default_Last() {
    super.determine_stepCount_depthwiseFilterHeightWidth_Default_Last();

    let blockParams = this.blockParams;

    // ShuffleNetV2_Xxx must have at least 2 steps because PointDepthPoint can not achieve the head/body/tail of
    // ShuffleNetV2 at the same time.
    tf.util.assert( this.stepCount >= 2,
      `Block.Params_to_PointDepthPointParams.ShuffleNetV2(): `
        + `stepCount ( ${this.stepCount} ) must be at least 2 in ShuffleNetV2_Xxx.` );
  }

  /** @override */
  configTo_beforeStep0() {
    let blockParams = this.blockParams;

    this.inputHeight0 = blockParams.sourceHeight; // step0 inputs the source image size.
    this.inputWidth0 = blockParams.sourceWidth;

    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE; // with concatenation.

    this.bPointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    // In ShuffleNetV2, all steps (except step0 in NoPointwise1) will not double the channel count by depthwise.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;

//!!! ...unfinished... (2021/12/23) should be changed to like MobileNetV2:
//   - depthwise always has bias and activation.
//   - pointwise2 always has no bias and no activation.

    // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
    this.bDepthwiseBias = false;
    this.depthwiseActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE; // In ShuffleNetV2, depthwise convolution doesn't have activation.

    // In ShuffleNetV2, all steps' pointwise21 always has bias and activation.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount; // All steps' (except stepLast) output0 is the same depth as source input0.
    this.bPointwise21Bias = true;
    this.pointwise21ActivationId = blockParams.nActivationId;

    this.bOutput1Requested = true; // In ShuffleNetV2, all steps (except stepLast) have output1 with same depth as source input0.

    // In ShuffleNetV2, all steps usually have pointwise1 convolution before depthwise convolution (i.e. ( pointwise1ChannelCountRate > 0 ) ).
    // Its channel count is adjustable by user's request. Usually, ( pointwise1ChannelCountRate == 1 ). If ( pointwise1ChannelCountRate == 0 ),
    // it is the same as no pointwise1.
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * blockParams.pointwise1ChannelCountRate;

    // NoPointwise1 ShuffleNetV2 (expanding by once depthwise).
    //
    // If step0 does not have pointwise1 convolution before depthwise convolution, the depthwise2 convolution (in original ShuffleNetV2)
    // is not needed. Then, a simpler configuration could be used.
    //
    // Just use once depthwise convolution (but with channel multipler 2) to double the channel count.
    if ( this.pointwise1ChannelCount == 0 ) {
      this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2; // Step0 double the channel count by depthwise channel multiplier.
    }

    this.bKeepInputTensor = blockParams.bKeepInputTensor; // Step0 may or may not keep input tensor according to caller's necessary.

    // In ShuffleNetV2, all steps (except stepLast) have both output0 and output1 with same depth as pointwise21 result.
    this.outChannels0 = this.outChannels1 = this.pointwise21ChannelCount;
  }

  /** @override */
  configTo_afterStep0() {
    let blockParams = this.blockParams;

    this.inputHeight0 = blockParams.outputHeight; // all steps (except step0) inputs half the source image size.
    this.inputWidth0 = blockParams.outputWidth;

    // The ( input0, input1 ) of all steps (except step0) have the same depth as previous (also step0's) step's ( output0, output1 ).
    this.channelCount0_pointwise1Before = this.outChannels0;

    // (with concatenation, without add-input-to-output).
    //
    // The channel count of input1 must be the same as pointwise21's result. The result of pointwise21 (which operates on input0)
    // will be concatenated with input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1;

    // In ShuffleNetV2, all steps (except step0 in NoPointwise1) will not double the channel count by depthwise.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.

    this.channelShuffler_init(); // In ShuffleNetV2, all steps (except step0) uses channel shuffler (with two convolution groups).
  }
  
  /**
   * Create channel shuffler if necessary and put in this.channelShuffler.
   *
   * Sub-class could override this method. For example, if sub-class does not need channel shuffler, it could override and do
   *  nothing so that it can be avoided to create channel shuffler in sub-class.
   */
  channelShuffler_init() {
    let blockParams = this.blockParams;
    let step0_outChannelsAll = this.outChannels0 + this.outChannels1;

    let outputGroupCount = 2; // Always with two convolution groups.
    let concatenatedDepth = step0_outChannelsAll; // All steps always have the same total output channel count as step0.
    let concatenatedShape = [ blockParams.sourceHeight, blockParams.sourceWidth, concatenatedDepth ];
    this.channelShuffler = new ChannelShuffler.ConcatPointwiseConv( concatenatedShape, outputGroupCount );
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In ShuffleNetV2, the stepLast only has output0 (no output1).
    //
    // The output0:
    //   - It will have double channel count of source input0.
    //   - It is the concatenation of pointwise21's result and input1.
    this.bOutput1Requested = false;

    this.outChannels0 = this.outChannels0 + this.outChannels1;
    this.outChannels1 = 0;
  }
}


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
    let blockParams = this.blockParams;

    this.inputHeight0 = blockParams.outputHeight; // all steps (except step0) inputs half the source image size.
    this.inputWidth0 = blockParams.outputWidth;

    // The ( input0, input1 ) of all steps (except step0) have the same depth as previous (also step0's) step's ( output0, output1 ).
    this.channelCount0_pointwise1Before = this.outChannels0;
    this.channelCount1_pointwise1Before = this.outChannels1; // i.e. TWO_INPUTS (with concatenation, without add-input-to-output).

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1; // All steps (except step0 if NoPointwise1 ShuffleNetV2) will not double the channel count.

    // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }

  /** @override */
  channelShuffler_init() {
    // Do nothing. Because pointwise22 has done channel shuffling.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In ShuffleNetV2_ByPointwise22, the stepLast only has output0 (no output1). And the output0 has double channel count of
    // source input0.
    //
    // Note: Although pointwise21 channel count changed, however, the pointwise1ChannelCount is not changed because the final
    // output0 is viewed as concatenation of pointwise21 and pointwise22. In pointwise1's point of view, its pointwise2 does
    // not changed.
    this.pointwise21ChannelCount = this.blockParams.sourceChannelCount * 2;
    this.bOutput1Requested = false;
  }
}


//!!! ...unfinished... (2021/10/14)
/*
 * Accodring to testing, the original ShuffleNetV2 is faster than MobileNetV2 in backend CPU. This may result from lesser
 * computation. However, in backend WASM and WEBGL, MobileNetV2 is faster than the original ShuffleNetV2. The possible
 * reason may be that the concatenation-shuffle-split (even achieved by pointwise convolution) operation is not friendly
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
 * the pointwise1's pass-through can not undo the previous PointDepthPoint's pointwise21 activation escaping scale-translate.
 * The reason is:
 *  - The previous PointDepthPoint's pointwise21 has shuffled the channels.
 *  - The channels tweaked by activation escaping scale-translate are interleaved with other normal channels.
 *  - They are not all in the higher-half channels of this PointDepthPoint's pointwise1.
 *
 * So, force pointwise21 (which is always exists) always with bias and without activation.
 *   - So the pointwise21 could undo all previous activation escaping scale-translate (because it has bias).
 *   - And itself will not tweak its result by activation escaping scale-translate (because it does not have activation).
 *
 */
class ShuffleNetV2_ByMobileNetV1 extends ShuffleNetV2 {

//!!! ...unfinished... (2021/10/14)

//!!! ...unfinished... (2021/11/12)
// When ( pointwise1ChannelCount == 0 ) (i.e. depthwise channel multiplier is 2 ), the depthwise should be just
// the same as Params.to_PointDepthPointParams.ShuffleNetV2_ByPointwise22 and Params.to_PointDepthPointParams.ShuffleNetV2.
//
//     if ( this.pointwise1ChannelCount == 0 ) {
//       this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
//       this.depthwise_AvgMax_Or_ChannelMultiplier = 2;  // Step0 double the channel count by depthwise channel multiplier.
//     }
//
// That is the depthwise needs use ( bHigherHalfDifferent == false ) in this case.

}


//!!! ...unfinished... (2022/05/02)
// Perhaps, class ShuffleNetV2_ByMobileNetV1_padValid.
/**
 * This class is almost the same as ShuffleNetV2_ByMobileNetV1 except the depthwise convolution's padding is "valid" (instead of "same").
 *
 *
 * 1. Reason
 *
 * Q: Why is this configuration necessary?
 * A: The right-most pixel of depthwise convolution seems wrong when ( strides = 1, pad = "same" ) in backend WebGL of some
 *    platforms (e.g. mobile phone Moto e40). But the issue does not exist when ( strides = 2, pad = "same" ) or ( pad = "valid" )
 *    in those platforms.
 *
 * For achieving ShuffleNetV2 with depthwise padding "valid", ShuffleNetV2_ByMobileNetV1 is necessary because other ShuffleNetV2_ByXxx
 * (with depthwise padding "same") could not concatenate two channel groups whic have different image size (due to padding "valid").
 *
 *
 * 2. Drawback
 *
 * The disadvantage is that the right-most and bottom-most pixels will be dropped when pass-through the higher half of depthwise
 * convolution due to padding "valid".
 *
 *
 * 2.1 Drawback and 1D data
 *
 * Although 1D data (e.g. voice) has only one line (i.e. the only bottom-most data) which should not be dropped (otherwise,
 * all data are dropped), this disadvantage will not be a diaster for 1D data.
 *
 * The reason is that depthwise filter size (in some direction) can not be larger than input data size (in that diecrtion).
 * For 1D data, this means that only depthwise convolution with ( depthwiseFilterHeight == 1 ) could be used.
 *
 * When filter size is 1 (in some direction), the output size (in that direction) will always be the same as input even
 * if ( pad = "valid" ). So, the only one bottom-most data will not be dropped diasterly.
 *
 */



/** Provide parameters for MobileNetV2 (i.e. with pointwise1, with add-input-to-output).
 *
 *
 * 1. Be ware of ( pointwise1ChannelCountRate == 1 )
 *
 * MobileNetV2 double the channel count by pointwise1. This is different from ShuffleNetV2 which achieves channel count doubling
 * by concatenation.
 *
 * That is, if ( pointwise1ChannelCountRate <= 1 ), there will be only 1 times (not 2 times) channels to be processed in fact.
 * It could be expected that the performance will be faser than ( pointwise1ChannelCountRate == 1 ) in ShuffleNetV2 unfairly.
 *
 * So, the original MobileNetV2 should be ( pointwise1ChannelCountRate == 2 ).
 *
 *
 */
class MobileNetV2 extends Base {

  /** @override */
  configTo_beforeStep0() {
    let blockParams = this.blockParams;

    this.inputHeight0 = blockParams.sourceHeight; // step0 inputs the source image size.
    this.inputWidth0 = blockParams.sourceWidth;

//!!! (2021/10/11 Remarked) Unfortunately, the sub-class (i.e. NotShuffleNet_NotMobileNet) also call this method.
//     // Currently, MobileNetV2 must have at least 2 steps because PointDepthPoint can not achieve the head/body/tail
//     // of MobileNetV2 at the same time.
//     //
//     // Ideally, this assertion should be placed in determine_stepCount_depthwiseFilterHeightWidth_Default_Last(). However,
//     // the sub-class (i.e. NotShuffleNet_NotMobileNet) could accept step count less than 2. So, assert here.
//     tf.util.assert( this.stepCount >= 2,
//       `Block.Params.to_PointDepthPointParams.MobileNetV2(): `
//         + `stepCount ( ${this.stepCount} ) must be at least 2 in MobileNetV2.` );

    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).

    // In MobileNetV2:
    //   - Step0 can not do add-input-to-output because the input0's ( height, width ) has been halven.
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    this.bPointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;                  // All steps will not double the channel count.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;
    this.bDepthwiseBias = true;
    this.depthwiseActivationId = blockParams.nActivationId;

    // In MobileNetV2's original design, it is not always "twice". We choose "twice" just for comparing with ShuffleNetV2.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount * 2; // In MobileNetV2, all steps' output0 is twice depth of source input0.

    // In MobileNetV2, since there is no activation function after pointwise21, it needs not bias after pointwise21. The reason
    // is the pointwise1 of the next step has bias before activation to complete affine transformation.
    this.bPointwise21Bias = false;

    // In MobileNetV2, the second 1x1 pointwise convolution doesn't have activation function in default.
    //
    // But it could be changed by nActivationIdAtBlockEnd for the last step of the block.
    this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

    this.bOutput1Requested = false;                                  // In MobileNetV2, all steps do not have output1.

    // In MobileNet, all steps have pointwise1 convolution before depthwise convolution. Its channel count is adjustable by user's request.
    // If ( pointwise1ChannelCountRate == 0 ), it is the same as no pointwise1.
    //
    // Q: How to know whether it is MobileNetV2 or MobileNetV1?
    // A: By pointwise1ChannelCountRate.
    //   - If ( pointwise1ChannelCount == 0 ), similar to MobileNetV1. ( pointwise1ChannelCountRate == 0 )
    //   - If ( pointwise1ChannelCount <  pointwise21ChannelCount ), similar to ResNet. (can not be expressed by Block.Params)
    //   - If ( pointwise1ChannelCount == pointwise21ChannelCount ), similar to MobileNetV2 without expanding. ( pointwise1ChannelCountRate == 1 )
    //   - If ( pointwise1ChannelCount >  pointwise21ChannelCount ), similar to MobileNetV2. ( pointwise1ChannelCountRate == 2 )
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * blockParams.pointwise1ChannelCountRate; // In MobileNetV2, the rate is usually 2.

    this.bKeepInputTensor = blockParams.bKeepInputTensor; // Step0 may or may not keep input tensor according to caller's necessary.

    this.outChannels0 = this.pointwise21ChannelCount;
    this.outChannels1 = 0;
  }

  /** @override */
  configTo_afterStep0() {
    let blockParams = this.blockParams;

    this.inputHeight0 = blockParams.outputHeight; // all steps (except step0) inputs half the source image size.
    this.inputWidth0 = blockParams.outputWidth;

    // The input0 of all steps (except step0) have the same depth as previous (also step0's) step's output0.
    this.channelCount0_pointwise1Before = this.outChannels0;

    // In MobileNetV2:
    //   - All steps (except step0) do add-input-to-output (without concatenation).
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT;

    // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;
    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In MobileNetV2, although there is no activation function after pointwise21, it should have bias after pointwise21 for
    // the stepLast. The reason is the stepLast does not have the next step's pointwise1 to provide bias to complete affine
    // transformation. It must do it by itself.
    this.bPointwise21Bias = true;
  }

}

