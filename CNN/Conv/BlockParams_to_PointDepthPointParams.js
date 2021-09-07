export { Base };
export { NotShuffleNet_NotMobileNet };
export { ShuffleNetV2_Slower };
export { MobileNetV2 };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "./PointDepthPoint.js";


/**
 * Basic class for all BlockParams_to_PointDepthPointParams.Xxx classes.
 *
 * Note: In modern deep learning CNN, there is batch normalization after convolution and before activation. The batch normalization
 * has bias internally. We do not have batch normalization in architecture so an explicit bias will be used before every activation
 * function.
 */
class Base {
  /**
   * @param {Params} blockParams
   *   The Block.Params object which provides basic parameters.
   */
  constructor( blockParams ) {
    this.blockParams = blockParams;

    this.channelCount0_pointwise1Before = this.channelCount1_pointwise1Before =
    this.pointwise1ChannelCount = this.pointwise21ChannelCount = this.pointwise22ChannelCount =
    this.depthwise_AvgMax_Or_ChannelMultiplier = this.depthwiseFilterHeight = this.depthwiseStridesPad = 0;

    this.pointwise1Bias = this.depthwiseBias = this.pointwise21Bias = this.pointwise22Bias = false;

    this.pointwise1ActivationId = this.depthwiseActivationId = this.pointwise21ActivationId = this.pointwise22ActivationId
      = ValueDesc.Activation.Singleton.Ids.NONE;

    this.bShouldKeepInputTensor = false;

    this.stepCount = -1; // How many step should be in the block.

    this.depthwiseFilterHeight_Default = -1; // The default depthwise filter size.
    this.depthwiseFilterHeight_Last =  -1;   // The last step's depthwise filter size.
  }

  /** Called to determine stepCount, depthwiseFilterHeight_Default and depthwiseFilterHeight_Last.
    * Sub-class could override this method to adjust data members.
    */
  determine_stepCount_depthwiseFilterHeight_Default_Last() {
    let blockParams = this.blockParams;
    this.stepCount = blockParams.stepCountPerBlock; // By default, the step count is just the original step count.

    // By default, all steps uses the original depthwise filter size.
    this.depthwiseFilterHeight_Default = this.depthwiseFilterHeight_Last = blockParams.depthwiseFilterHeight;
  }

  /** Called before step0 is about to be created. Sub-class should override this method to adjust data members.
   *
   * Step 0.
   *
   * The special points of a block's step 0 are:
   *   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
   *   - Double channels. (By concat if ShuffleNetV2. By second pointwise if MobileNetV2.)
   *   - Expand channels by channelMultiplier of depthwise convolution. (Our ShuffleNetV2_Simplified.)
   */
  configTo_beforeStep0() {}

  /** Called after step0 is created (i.e. before step1, 2, 3, ...). Sub-class should override this method to adjust data members.
   *
   * @param {PointDepthPoint.Base} step0
   *   The just created step0 object.
   */
  configTo_afterStep0( step0 ) {}

  /** Called before stepLast is about to be created. Sub-class could override this method to adjust data members. */
  configTo_beforeStepLast() {
    // By default, the stepLast of this block (i.e. at-block-end) may use a different activation function after pointwise2 convolution.
    //
    // Even if in MobileNetV2 (pointwise2 convolution does not have activation function in default), this is still true.
    this.pointwise21ActivationId = this.pointwise22ActivationId = this.blockParams.nActivationIdAtBlockEnd;

    // Besides, the stepLast may use a different depthwise filter size. This is especially true for NotShuffleNet_NotMobileNet.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Last;
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
      this.channelCount0_pointwise1Before,
      this.channelCount1_pointwise1Before,
      this.pointwise1ChannelCount, this.pointwise1Bias, this.pointwise1ActivationId,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight,
      this.depthwiseStridesPad, this.depthwiseBias, this.depthwiseActivationId,
      this.pointwise21ChannelCount, this.pointwise21Bias, this.pointwise21ActivationId,
      this.pointwise22ChannelCount, this.pointwise22Bias, this.pointwise22ActivationId,
      this.bShouldKeepInputTensor
    );
    return params;
  }
}


/** Provide parameters for pure depthwise-pointwise convolutions. */
class NotShuffleNet_NotMobileNet extends Base {
  /**
   * Compute how many step shoud be used and what is the last step's depthwise filter size, when shrink sourceHeight to outputHeight
   * by depthwise convolution with ( strides = 1, pad = "valid" ).
   *
   * The this.stepCount will be at least 1 (never 0).
   * The this.depthwiseFilterHeight_Last will be at least 1 (at most this.blockParams.depthwiseFilterHeight).
   * 
   * @override
   */
  determine_stepCount_depthwiseFilterHeight_Default_Last() {
    let blockParams = this.blockParams;

    let differenceHeight = blockParams.sourceHeight - blockParams.outputHeight;
    //let differenceWidth =  blockParams.sourceWidth  - blockParams.outputWidth;

    if ( 0 == differenceHeight ) { // 1. No difference between source and output size.
      this.stepCount = 1; // Only one step is needed. (Avoid no steps. At least, there should be one step.)

      // The only one step (also the first and last step) should use filter size 1x1 so that the input size could be kept.
      this.depthwiseFilterHeight_Default = this.depthwiseFilterHeight_Last = 1;

    } else {

      // Since difference between source and output exists, the filter size should be larger than 1x1.
      if ( this.depthwiseFilterHeight_Default <= 1 )
        this.depthwiseFilterHeight_Default = 2; // Otherwise, the image size could not be shrinked.

      // The height of processed image will be reduced a little for any depthwise filter larger than 1x1.
      let heightReducedPerStep = this.depthwiseFilterHeight_Default - 1;

      // The possible step count for reducing sourceHeight to outputHeight by tf.depthwiseConv2d( strides = 1, pad = "valid" ).
      //
      // This value may be less than real step count because the filter size of the last step may be larger than its input.
      let stepCountCandidate = Math.floor( differenceHeight / heightReducedPerStep );

      let differenceHeightLast = differenceHeight - ( stepCountCandidate * heightReducedPerStep ); // The last step should reduce so many height.
      if ( 0 == differenceHeightLast ) {
        // 2. The original depthwiseFilterHeight could achieve the output size at the last step. 
        this.stepCount = stepCountCandidate; // It is the real step count.
        this.depthwiseFilterHeight_Last = this.depthwiseFilterHeight_Default; // The last step uses the default depthwise filter size is enough.

      } else {

        // 3. The original depthwiseFilterHeight could not achieve the output size at the last step.
        //    It is larger than the last step's input size. An extra step with a smaller filter size is needed.
        this.stepCount = stepCountCandidate + 1; // Needs one more step.

        // The extra last step's depthwise filter size should just eliminate the last diffference.
        this.depthwiseFilterHeight_Last = differenceHeightLast + 1;
      }
    }
  }

  /** @override */
  configTo_beforeStep0() {
    let blockParams = this.blockParams;
    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.

    this.pointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 2;                  // Step0 double the channel count by depthwise channel multiplier.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps (except stepLast) uses default depthwise filter size.
    this.depthwiseStridesPad = 0;                                    // In this mode, always ( strides = 1, pad = "valid" ).

    // Because depthwise-pointwise is a complete (cubic) convolution, the bias and activation are not needed in between.
    // The bias and activation function are done after pointwise2.

    // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
    this.depthwiseBias = false;
    this.depthwiseActivationId = ValueDesc.Activation.Singleton.Ids.NONE;

    this.pointwise21ChannelCount = blockParams.sourceChannelCount * blockParams.depthwise_AvgMax_Or_ChannelMultiplier; // Step0 double channel count.
    this.pointwise21Bias = true;
    this.pointwise21ActivationId = blockParams.nActivationId;

    this.pointwise22ChannelCount = 0;                                // In this mode, always no second output.
    this.pointwise22Bias = true;
    this.pointwise22ActivationId = ValueDesc.Activation.Singleton.Ids.NONE;

    // All steps have pointwise1 convolution before depthwise convolution. Its channel count is adjustable by user's request.
    // If ( pointwise1ChannelCountRate == 0 ), it is the same as no pointwise1.
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * blockParams.pointwise1ChannelCountRate;
    
    this.bShouldKeepInputTensor = blockParams.bKeepInputTensor;      // Step0 may or may not keep input tensor according to caller's necessary.
  }

  /** @override */
  configTo_afterStep0( step0 ) {
    this.channelCount0_pointwise1Before = step0.outChannelsAll; // Step0's output channel count is all the other steps' input channel count.
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;             // Except step0, all other steps will not double the channel count.
    this.pointwise21ChannelCount = step0.outChannelsAll;        // Step0's output channel count is all the other steps' output channel count.
    this.bShouldKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }
}


/** Provide parameters for ShuffleNetV2 (i.e. with pointwise1, with concatenator).
 *
 * 1. (Our) Adjusted ShuffleNetV2:
 *
 * Since channel shuffler could achieved efficiently by pointwise convolution, it may be possible to combine the pointwise2
 * convolution (after depthwise convolution) and the pointwise convolution (of channel shuffler). That is:
 *   - Concatenate the output of depthwise convolution and the other output group.
 *   - Pointwise convolution to generate output group 1.
 *   - Pointwise convolution to generate output group 2.
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
 *                         +-------------------------------------------------------------------------------+------------+------------+----------+
 *                         |                       pointwise2 convolution                                  |    bias    | activation | function |
 *                         |-----------------------------------------------------------------+-------------|            |            |   calls  |
 *                         |                             weights                             | computation |            |            |          |
 *                         |--------------------------------+--------------------------------|             |            |            |          |
 *                         |          independent           | shared (for channel shuffling) |             |            |            |          |
 * +----------+------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | Step0    | Original   | ( M *  M ) + ( M *  M ) = 2M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        6M^2 | M + M = 2M | M + M = 2M |        8 |
 * |          | Simplified | ( M * 2M ) + ( M * 2M ) = 4M^2 |                              0 |        4M^2 | M + M = 2M | M + M = 2M |        6 |
 * |          | Compare    |                     worse 2M^2 |                    better 4M^2 | better 2M^2 |       same |       same | better 2 |
 * |----------+------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | Step1    | Original   |              ( M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * | Step2    | Slower     | ( M * 2M ) + ( M * 2M ) = 4M^2 |                              0 |        4M^2 | M + M = 2M | M + M = 2M |        6 |
 * |   :      | Compare    |                     worse 3M^2 |                    better 4M^2 | better  M^2 |    worse M |    worse M |  worse 2 |
 * |----------+------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | StepLast | Original   |             (  M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * |          | Slower     |             ( 2M * 2M ) = 4M^2 |                              0 |        4M^2 |         2M |         2M |        3 |
 * |          | Compare    |                     worse 3M^2 |                    better 4M^2 | better  M^2 |    worse M |    worse M | better 2 |
 * |----------+------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * | StepLast | Original   |             (  M *  M ) =  M^2 | ( M * 2M ) + ( M * 2M ) = 4M^2 |        5M^2 |          M |          M |        5 |
 * |          | Simplified |             (  M *  M ) =  M^2 |                              0 |         M^2 |          M |          M |        3 |
 * |          | Compare    |                           same |                    better 4M^2 | better 4M^2 |       same |       same | better 2 |
 * |----------+------------+--------------------------------+--------------------------------+-------------+------------+------------+----------+
 * </pre>
 *
 * Step0:
 *   - Two less pointwise convolution computation. Two less function calls.
 *   - But more independent pointwise weights.
 *   - Ours is better.
 *
 * Step1, Step2, ..., Step(N - 1):
 *   - One less pointwise convolution computation.
 *   - But more independent pointwise weights, more bias, more activation function, two more function calls.
 *   - Ours is worse.
 *
 * StepLast:
 *   - One less pointwise convolution computation. Two less function calls.
 *   - But more independent pointwise weights, more bias and more activation function.
 *   - Ours may be better or worse.
 *

!!! ...unfinished... (2021/08/19) How to improve?

 *
 * 2. A special case: NoPointwise1 ShuffleNetV2 (i.e. without pointwise1, with concatenator).
 * 
 * Q: How to specify this configuration?
 * A: By ( bChannelShuffler == true ) and ( pointwise1ChannelCountRate == 0 ) in the parameters of Block.Params.
 *
 * What is the different of this configuration?
 *
 * When the poitwise1 convolution (of every step (include step 0 too)) is discarded (i.e. ( pointwise1ChannelCountRate == 0 ) ),
 * the step 0 and step 0's branch could be achieved simultaneously by:
 *   - once depthwise convolution (channelMultipler = 2, strides = 2, pad = same, bias, COS).
 *   - No need to concatenate because the above operation already double channel count.
 *   - twice pointwise2 convolution (every has same as block's input channel count).
 *
 * And, the step 1 (, 2, 3, ..., ( n - 2 ) ) could be achieved by:
 *   - once depthwise convolution (channelMultipler = 1, strides = 1, pad = same, bias, COS).
 *   - concatenate.
 *   - twice pointwise2 convolution (every has same as block's input channel count).
 *
 * And, the last step (i.e. step ( n - 1 ) ) of the block could be achieved by:
 *   - once depthwise convolution (channelMultipler = 1, strides = 1, pad = same, bias, COS).
 *   - concatenate.
 *   - once pointwise2 convolution (has double of block's input channel count).
 *
 * Note that:
 *   - The depthwise1 convolution (channelMultipler = 2, strides = 2) of step 0 achieves simultaneously two depthwise
 *     convolution (channelMultipler = 1, strides = 2) of step 0 and step 0's branch. So, it is one less depthwise
 *     convolution and one less concatenating (than original and our adjusted ShuffleNetV2).
 *
 *   - Even if the pointwise1 convolution is discarded, just two steps of this simplied ShuffleNetV2 still compose an
 *     effective Fourier series which should have enough expressive power for approximating any function. By given
 *     the following configuration in the Block.Params:
 *       - ( bChannelShuffler == true )
 *       - ( pointwise1ChannelCountRate == 0 )
 *       - ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.COS) 
 *       - ( nActivationIdAtBlockEnd == ValueDesc.ActivationFunction.Singleton.Ids.NONE)
 *
 *
 */
class ShuffleNetV2_Slower extends Base {
  /** @override */
  configTo_beforeStep0() {
    let blockParams = this.blockParams;
    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE; // with concatenation.

    this.pointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;                  // All steps will not double the channel count.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseStridesPad = 2;                                    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).

    // If an operation has no activation function, it can have no bias too. Because the next operation's bias can achieve the same result.
    this.depthwiseBias = false;
    this.depthwiseActivationId = ValueDesc.Activation.Singleton.Ids.NONE; // In ShuffleNetV2, depthwise convolution doesn't have activation.

    // In ShuffleNetV2, all steps' pointwise21 always has bias and activation. It achieves both pointwise and channel-shuffling.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount; // All steps' (except stepLast) output0 is the same depth as source input0.
    this.pointwise21Bias = true;
    this.pointwise21ActivationId = blockParams.nActivationId;

    // In ShuffleNetV2, all steps' pointwise22 has bias and activation. It achieves both pointwise and channel-shuffling.
    //
    // Note: Comparing to the original ShuffleNetV2, this might be a little more expensive because every all non-step0
    //       (i.e. step1, step2, ..., stepLast) will do one more bias and activation (although do one less pointwise
    //       convolution).
    this.pointwise22ChannelCount = blockParams.sourceChannelCount; // All steps' (except stepLast) output1 is the same depth as source input1.
    this.pointwise22Bias = true;
    this.pointwise22ActivationId = blockParams.nActivationId;

    // In ShuffleNetV2, all steps have pointwise1 convolution before depthwise convolution. Its channel count is adjustable by user's request.
    // If ( pointwise1ChannelCountRate == 0 ), it is the same as no pointwise1.
    this.pointwise1ChannelCount = this.pointwise21ChannelCount * blockParams.pointwise1ChannelCountRate; // In ShuffleNetV2, the rate is usually 1.

    this.bShouldKeepInputTensor = blockParams.bKeepInputTensor;    // Step0 may or may not keep input tensor according to caller's necessary.

    // NoPointwise1 ShuffleNetV2 (expanding by once depthwise).
    //
    // If step0 does not have pointwise1 convolution before depthwise convolution, the depthwise2
    // convolution (in original ShuffleNetV2) is not needed. Then, a simpler configuration could be used.
    //
    // Just use once depthwise convolution (but with channel multipler 2) to double the channel count.
    if ( this.pointwise1ChannelCount == 0 ) {
      this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT; // no concatenate, no add-input-to-output.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2;  // Step0 double the channel count by depthwise channel multiplier.
    }
  }

  /** @override */
  configTo_afterStep0( step0 ) {

    // The ( input0, input1 ) of all steps (except step0) have the same depth as previous (also step0's) step's ( output0, output1 ).
    this.channelCount0_pointwise1Before = step0.outChannels0;
    this.channelCount1_pointwise1Before = step0.outChannels1; // i.e. TWO_INPUTS (with concatenation, without add-input-to-output).

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1; // All steps (except step0 if NoPointwise1 ShuffleNetV2) will not double the channel count.
    this.depthwiseStridesPad = 1;        // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).

    this.bShouldKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In ShuffleNetV2, the stepLast only has output0 (no output1). And the output0 has double channel count of source input0.
    //
    // Note: Although pointwise21 channel count changed, however, the pointwise1ChannelCount is not changed because the final
    // output0 is viewed as concatenation of pointwise21 and pointwise22. In pointwise1's point of view, its pointwise2 does
    // not changed.
    this.pointwise21ChannelCount = this.blockParams.sourceChannelCount * 2;
    this.pointwise22ChannelCount = 0;
  }
}


/** Provide parameters for MobileNetV1 or MobileNetV2 (i.e. with pointwise1, with add-input-to-output). */
class MobileNetV2 extends Base {

  /** @override */
  configTo_beforeStep0() {
    let blockParams = this.blockParams;
    this.channelCount0_pointwise1Before = blockParams.sourceChannelCount; // Step0 uses the original input channel count (as input0).

    // In MobileNetV2:
    //   - Step0 can not do add-input-to-output because the input0's ( height, width ) has been halven.
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT;

    this.pointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;                  // All steps will not double the channel count.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default; // All steps uses default depthwise filter size.
    this.depthwiseStridesPad = 2;                                    // Step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseBias = true;
    this.depthwiseActivationId = blockParams.nActivationId;

    // In MobileNetV2's original design, it is not always "twice". We choose "twice" just for comparing with ShuffleNetV2.
    this.pointwise21ChannelCount = blockParams.sourceChannelCount * 2; // In MobileNetV2, all steps' output0 is twice depth of source input0.

    // In MobileNetV2, since there is no activation function after pointwise21, it needs not bias after pointwise21. The reason
    // is the pointwise1 of the next step has bias before activation to complete affine transformation.
    this.pointwise21Bias = false;

    // In MobileNetV2, the second 1x1 pointwise convolution doesn't have activation function in default.
    //
    // But it could be changed by nActivationIdAtBlockEnd for the last step of the block.
    this.pointwise21ActivationId = ValueDesc.Activation.Singleton.Ids.NONE;

    this.pointwise22ChannelCount = 0;                                  // In MobileNetV2, all steps do not have output1.
    this.pointwise22Bias = false;
    this.pointwise22ActivationId = ValueDesc.Activation.Singleton.Ids.NONE;

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

    this.bShouldKeepInputTensor = blockParams.bKeepInputTensor;    // Step0 may or may not keep input tensor according to caller's necessary.
  }

  /** @override */
  configTo_afterStep0( step0 ) {
    // The input0 of all steps (except step0) have the same depth as previous (also step0's) step's output0.
    this.channelCount0_pointwise1Before = step0.outChannels0;

    // In MobileNetV2:
    //   - All steps (except step0) do add-input-to-output (without concatenation).
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT;

    this.depthwiseStridesPad = 1;        // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.bShouldKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }
  
  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // Still, stepLast may use a different activation function after pointwise2 convolution.

    // In MobileNetV2, although there is no activation function after pointwise21, it should have bias after pointwise21 for the
    // stepLast. The reason is the stepLast does not have the next step's pointwise1 to provide bias to complete affine
    // transformation. It must do it by itself.
    this.pointwise21Bias = true;
  }

}
