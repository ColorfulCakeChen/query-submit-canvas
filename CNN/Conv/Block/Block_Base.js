export { Base };

import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ReturnOrClone from "../ReturnOrClone.js";

//!!! (2022/06/07 Remarked) seems not necessary because already has TensorPlaceholder.
//import * as BoundsArraySet from "../BoundsArraySet.js";

import * as ChannelCountCalculator from "../ChannelCountCalculator.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as Operation from "../Operation.js";
import { Params } from "./Block_Params.js";


//!!! ...unfinished... (2022/05/28)
// Perhaps, checking the BoundsArraySet of every step. If a step's all channels' BoundsArraySet will not activated by the
// activation function (suppose using CLIP_BY_VALUE_XXX), automatically drop the activation function call and combine the
// bias to the next opeartion.
//
// For example, if pointwise1 does not activated (according to its BoundsArraySet.afterBias), the pointwise1's bias could
// be combined into the next step (i.e. depthwise) and never call pointwise1's activation function.
//
// Note: The next step should be either pointwise or depthwise with pad="valid" ( can not be depthwise with pad="same" ).
//
//
//
//
// This is an automatical optimization according to static weights (i.e. this does not work for squeeze-and-excitation
// which is dynamic weights).


//!!! ...unfinished... (2022/05/28) (Deprecated)
// Test: combining depthwise-pointwise-bias into one conv2d. Compare these two architecture's performance in GPU (WebGL).
// Is combined faster in GPU?
//
// Perhaps, in backend WebGL (GPU), automatically combining depthwise-pointwise-bias into one conv2d to improve performance.
//
// No. Fused conv2d is slower than depthwise-pointwise-bias in WebGL.


/**
 * One block of a stage of convolution neural network. Basically, there are three convolutions inside this object.
 *   - 1x1 pointwise convolution: change channel count. (exapnd)
 *   - NxN depthwise convolution: change channel count. (channel multiplier)
 *   - 1x1 pointwise convolution: change channel count. (shrink)
 *
 * The pointwise1 and depthwise convolution could exist or not exist. The pointwise2 convolution must exist. If a convolution
 * exists, it could have or have no bias and activation function.
 *
 *
 * There are seven main combinations:
 *
 *
 *   - When
 *     - ( channelCount1_pointwise1Before == -5 ): ONE_INPUT_HALF_THROUGH: (ShuffleNetV2_ByMobileNetV1's body/tail)
 *     - ( channelCount1_pointwise1Before == -4 ): ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1: (ShuffleNetV2_ByMobileNetV1's head)
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise21 (include pointwise211 and pointwise212) - (squeezeExcitationPostfix)
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -3 ) and ( bOutput1Requested == true ): TWO_INPUTS_CONCAT_POINTWISE21_INPUT1: TWO_OUTPUT:
 * (ShuffleNetV2's body)
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix) - concat2ShuffleSplit - output0
 * input1 -------------------------------------------------------------------------------------------------/                     \ output1
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -3 ) and ( bOutput1Requested == false ): TWO_INPUTS_CONCAT_POINTWISE21_INPUT1: ONE_OUTPUT:
 * (ShuffleNetV2's tail)
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix) - concat2(ShuffleSplit) - output0
 * input1 -------------------------------------------------------------------------------------------------/
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -2 ): ONE_INPUT_TWO_DEPTHWISE:
 * (simplified ShuffleNetV2's head with ( pointwise1ChannelCount >= 1 ) )
 * <pre>
 * input0 - pointwise1 - depthwise1 - concat1 - (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix)
 *        \------------- depthwise2 /         \ (squeezeExcitationPrefix) - pointwise22 - (squeezeExcitationPostfix)
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -1 ): ONE_INPUT_ADD_TO_OUTPUT: (MobileNetV2's body and tail)
 * <pre>
 *        /------------------------------------------------------------------------------------------------\
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix) - addInput0ToPointwise21
 *        \                         \ (squeezeExcitationPrefix) - pointwise22 - (squeezeExcitationPostfix) - addInput0ToPointwise22
 *         \-----------------------------------------------------------------------------------------------/
 * </pre>
 *
 *
 *   - When
 *     - ( channelCount1_pointwise1Before == 0 ): ONE_INPUT:
 *       (MobileNetV1 or MobileNetV2's head or simplified ShuffleNetV2(_ByPointwise22)'s head with ( blockParams.bPointwise1 == false ) )
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix)
 *                                  \ (squeezeExcitationPrefix) - pointwise22 - (squeezeExcitationPostfix)
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before > 0 ): TWO_INPUTS: (ShuffleNetV2_ByPointwise22's body and tail)
 * <pre>
 * input0 - pointwise1 - depthwise1 - concat1 - (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix)
 * input1 --------------------------/         \ (squeezeExcitationPrefix) - pointwise22 - (squeezeExcitationPostfix)
 * </pre>
 *
 *
 *
 * Strictly speaking, the real (original) ShuffleNetV2 is more like the following:
 *
 * (original ShuffleNetV2's head)
 * <pre>
 * input0 - pointwise1 - depthwise1 - pointwise21 - concat2 - channelShuffler
 *        \------------- depthwise2 - pointwise22 /
 * </pre>
 *
 * (original ShuffleNetV2's tail)
 * <pre>
 * input0 - channelSplitter - pointwise1 - depthwise1 - pointwise21 - concat2 - channelShuffler
 *                          \---------------------------------------/
 * </pre>
 *
 * The channelShuffler of original ShuffleNetV2 is achieved by tf.reshape() operation. According to experiments, however, the
 * channelShuffler could be acheived by pointwise convolution more efficiently (than reshape). This results in our simplified
 * ShuffleNetV2 structure: replacing pointwise-concat-shuffle-split with concat-pointwise. It should be more efficient because
 * less operations are used than original structure.
 *
 *
 *
 *
 * @member {boolean} bInitOk
 *   If true, this object initialized (i.e. initer()) successfully.
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by initer().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by initer(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
 *
 * @member {number} inputTensorCount
 *   How many input tensors will be passed into apply() as parameter inputTensors[].
 *
 * @member {boolean} bHigherHalfDifferent
 *   Only if ( channelShuffler != null ), this is meaningful. If true, the higher half input channels are processed differently.
 * For pointwise convolution, the higher half may copy lower half, or the higher half may just pass through the input to output.
 * For depthwise convolution, please see bHigherHalfDepthwise2.
 *
 * @member {boolean} bHigherHalfDepthwise2
 *   Only if ( bHigherHalfDifferent == true ), this is meaningful. If true, the depthwise1 will use higher half channels to achieve
 * the depthwise2. If false, the depthwise1's higher half channels just pass through the input to output.
 *
 * @member {boolean} bDepthwise2Requested
 *   It will be true only when ( channelCount1_pointwise1Before == -2 ). If true, it means a second depthwise might be needed.
 *
 * @member {boolean} bConcat1Requested
 *   If true, the concat1 (after depthwise and before pointwise2) is needed.
 *
 * @member {boolean} bConcat2ShuffleSplitRequested
 *   If true, the concat2 (after pointwise2) is needed. It may or may not follow channel shuffling and splitting.
 *
 * @member {boolean} bAddInputToOutputRequested
 *   It will be true when ( this.channelCount1_pointwise1Before == -1 ). The input (in this case, the main input (i.e. inputTensorArray[ 0 ])
 * will be added to the output for achieving skip connection.
 *
 * @member {number} outputTensorCount
 *   How many output tensors will be returned by the parameter outputTensors of apply(). At least 1. At most 2. It is
 * determined by channelCount1_pointwise1Before and pointwise22ChannelCount.
 *

//!!! (2022/06/07 Remarrked) No longer recorded.
//  * @member {boolean} bPointwise1
//  *   If true, the pointwise1 convolution exists.

 *
 * @member {string} pointwise1ActivationName
 *   The activation function id (Params.pointwise1ActivationId.valueDesc.Ids.Xxx) after the first pointwise convolution.
 *

//!!! (2022/06/07 Remarrked) No longer recorded.
//  * @member {boolean} bDepthwise1
//  *   If true, the first depthwise convolution (or average pooling, or maximum pooling) exists.
//  *
//  * @member {boolean} bDepthwise2
//  *   If true, the second depthwise convolution (or average pooling, or maximum pooling) exists.
 
 *
 * @member {string} depthwise_AvgMax_Or_ChannelMultiplier_Name
 *   Depthwise operation name.
 *
 * @member {string} depthwiseActivationName
 *   The activation function name (Params.depthwiseActivationId.valueDesc.Ids.Xxx) after depthwise convolution.
 *

//!!! (2022/06/07 Remarrked) No longer recorded.
//  * @member {boolean} bPointwise2
//  *   If true, the pointwise2 (i.e. pointwise21 or/and pointwise22) convolution exists.
//  *
//  * @member {boolean} bPointwise21
//  *   If true, the first pointwise2 convolution exists.
//  *
//  * @member {boolean} bPointwise22
//  *   If true, the second pointwise2 convolution exists.

 *
 * @member {string} pointwise21ActivationName
 *   The activation function id (Params.pointwise21ActivationId.valueDesc.Ids.Xxx) after the first pointwise2 convolution.
 *
 * @member {string} pointwise22ActivationName
 *   The name of activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the second pointwise2 convolution.
 * It is only meaningful if ( pointwise22ChannelCount > 0 ) (i.e. ( bPointwise22 == true ) and ( pointwise21ChannelCount > 0 ) ).
 *
 * @member {number} inChannels0
 *   The channel count of the first input tensor (i.e. inputTensors[ 0 ]). This is the same as this.channelCount0_pointwise1Before
 * (from initer()).
 *
 * @member {number} inChannels1
 *   The channel count of the second input tensor (i.e. inputTensors[ 1 ]). It is zero or positive (never negative).
 *     - If ( this.channelCount1_pointwise1Before >= 0 ), inChannels1 is the same as this.channelCount1_pointwise1Before.
 *     - If ( this.channelCount1_pointwise1Before == Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ),
 *         (-3), inChannels1 will be the same as channelCount_pointwise21After_concat2Before.
 *     - Otherwise, inChannels1 will be zero.
 *
 * @member {TensorPlaceholder.Base} input0
 *   The TensorPlaceholder object which represents this operation's 1st input.
 *
 * @member {TensorPlaceholder.Base} input1
 *   The TensorPlaceholder object which represents this operation's 2nd input. It exists only if ( this.inputTensorCount > 1 ).
 *
 * @member {number} outputHeight
 *   The height of the output image. If depthwise does not exist, it will be the same as inputHeight0. Otherwise, depthwise
 * determines outputHeight.
 *
 * @member {number} outputWidth
 *   The width of the output image. If depthwise does not exist, it will be the same as inputWidth0. Otherwise, depthwise
 * determines outputWidth.
 *
 * @member {number} outChannels0
 *   The channel count of the outputTensor[ 0 ]. In theory, even if ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ),
 * this will still be non-zero. However, now the pointwise21ChannelCount should always be not zero. 
 *
 * @member {number} outChannels1
 *   The channel count of the outputTensor[ 1 ]. If ( pointwise22ChannelCount == 0 ), this will be zero.
 *
 * @member {number} outChannelsAll
 *   The channel count of all output tensors (i.e. both outputTensor[ 0 ] and outputTensor[ 1 ]).
 *
 * @member {TensorPlaceholder.Base} output0
 *   The TensorPlaceholder object which represents this operation's 1st output.
 *
 * @member {TensorPlaceholder.Base} output1
 *   The TensorPlaceholder object which represents this operation's 2nd output. It exists only if ( this.outputTensorCount >= 2 ).
 *

//!!! ...unfinished... (2022/06/05) Perhaps, output TensorPlaceholders are enough?

//!!! (2022/06/07 Remarked) seems not necessary because already has TensorPlaceholder.
//  * @member {BoundsArraySet.InputsOutputs} boundsArraySet
//  *   The element value bounds of this Block's input/output.

 *
 * @member {ChannelShuffler.ConcatPointwiseConv} channelShuffler_ConcatPointwiseConv
 *   The channelShuffler. It must be implemented by ChannelShuffler.ConcatPointwiseConv with ( outputGroupCount == 2 ).
 *
 *     - It will not be disposed by this object (i.e. it is supposed to be shared with outter callers).
 *
 *     - The channelShuffler's outputGroupCount must be 2 (i.e. split into two groups after channel-shuffling).
 *
 *     - It is used when:
 *       - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
 *           (-3) (ShuffleNetV2's body/tail) (i.e. channel shuffle the concatenated pointwise21 and input1).
 *         - The channelShuffler.shuffleInfo.totalChannelCount should be the same as the channel count of the concatenation
 *             of pointwise21 and input1.
 *
 *       - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 )
 *           (-4) (ShuffleNetV2_ByMobileNetV1's head)
 *
 *       - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH )
 *           (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors. (Not including channelShuffler.)
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
 * (Not including channelShuffler.)
 *
 * @member {function} apply
 *   A data member pointer to a function accepts two parameters ( inputTensors, outputTensors ). The inputTensors (tf.tensor3d[])
 * represents the images ( height x width x channel ) which will be processed. The outputTensors (tf.tensor3d[]) will be placed
 * one or two tf.tensor3d as the result. All intermediate tensors will be disposed. The inputTensors may or may not be disposed.
 * In fact, this method calls one of apply__input0_input1__output0_output1(), apply__input0_input1__output0(),
 * apply__input0__output0_output1(), apply__input0__output0() according to the initer()'s parameters.
 *
 */
class Base extends ReturnOrClone.Base {

  /**
   * Generator for initializing this object.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
   *
   * @param {Params} params
   *   A Params object. The params.extract() will be called to extract parameters.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Block value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray1
   *   The element value bounds (per channel) of input1. Usually, it is The .output1 of the previous Block value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   */
  * initer(
    progressParent, params,
    inputScaleBoundsArray0, inputScaleBoundsArray1,
    channelShuffler_ConcatPointwiseConv,
    arrayTemp_forInterleave_asGrouptTwo ) {

    // 0. Prepare

    // 0.1 Estimate the maximum value of progress.
    let progressMax =
        1  // for extracting parameters from inputFloat32Array.
      + 1  // for extracting pointwise1 filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for extracting depthwise filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for concat1.
      + 1  // for extracting squeeze-and-excitation prefix pointwise2.
      + 1  // for extracting pointwise2 filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for extracting squeeze-and-excitation postfix pointwise2.
      + 1  // for add-input-to-output.
      + 1  // for concat2-shuffle-split.
      + 1  // for all pointwise1-depthwise-pointwise2 filters (and biases) ready.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( new ValueMax.Percentage.Concrete( progressMax ) );

    this.disposeTensors();  // Also initialize some member function pointers to no_operation().

    // 1. Extract parameters.
    if ( !params )
      return false;

    this.byteOffsetEnd = this.byteOffsetBegin = params.defaultByteOffsetBegin;

    if ( !params.extract() )
      return false;  // e.g. input array does not have enough data.

    // Record where to extract next weights. Only meaningful when ( this.bInitOk == true ).
    this.byteOffsetEnd = params.defaultByteOffsetEnd;

    // Get parameters' real (adjusted) values.
    //
    // Do not keep params in this.params so that the inputFloat32Array could be released.
    this.inputHeight0 = params.inputHeight0;
    this.inputWidth0 = params.inputWidth0;
    this.channelCount0_pointwise1Before = params.channelCount0_pointwise1Before;
    this.channelCount1_pointwise1Before = params.channelCount1_pointwise1Before;
    this.channelCount1_pointwise1Before_Name = params.channelCount1_pointwise1Before_Name;

    this.pointwise1ChannelCount = params.pointwise1ChannelCount;
    this.bPointwise1Bias = params.bPointwise1Bias;
    this.pointwise1ActivationId = params.pointwise1ActivationId;
    this.pointwise1ActivationName = params.pointwise1ActivationName;

    this.depthwise_AvgMax_Or_ChannelMultiplier = params.depthwise_AvgMax_Or_ChannelMultiplier;
    this.depthwise_AvgMax_Or_ChannelMultiplier_Name = params.depthwise_AvgMax_Or_ChannelMultiplier_Name;
    this.depthwiseFilterHeight = params.depthwiseFilterHeight;
    this.depthwiseFilterWidth = params.depthwiseFilterWidth;
    this.depthwiseStridesPad = params.depthwiseStridesPad;
    this.depthwiseStridesPadName = params.depthwiseStridesPadName;
    this.bDepthwiseBias = params.bDepthwiseBias;
    this.depthwiseActivationId = params.depthwiseActivationId;
    this.depthwiseActivationName = params.depthwiseActivationName;

    this.nSqueezeExcitationChannelCountDivisor = params.nSqueezeExcitationChannelCountDivisor;
    this.nSqueezeExcitationChannelCountDivisorName = params.nSqueezeExcitationChannelCountDivisorName;
    this.bSqueezeExcitationPrefix = params.bSqueezeExcitationPrefix;

    this.pointwise21ChannelCount = params.pointwise21ChannelCount;
    this.bPointwise21Bias = params.bPointwise21Bias;
    this.pointwise21ActivationId = params.pointwise21ActivationId;
    this.pointwise21ActivationName = params.pointwise21ActivationName;

    this.bOutput1Requested = params.bOutput1Requested;
    this.pointwise22ChannelCount = params.pointwise22ChannelCount;
    this.bPointwise22Bias = params.bPointwise22Bias;
    this.pointwise22ActivationId = params.pointwise22ActivationId;
    this.pointwise22ActivationName = params.pointwise22ActivationName;

    this.bKeepInputTensor = params.bKeepInputTensor;

    // The parameters which are determined (inferenced) from the above parameters.
    {
      this.inputTensorCount = params.inputTensorCount;
      this.bHigherHalfDifferent = params.bHigherHalfDifferent;
      this.bHigherHalfDepthwise2 = params.bHigherHalfDepthwise2;
      this.bDepthwise2Requested = params.bDepthwise2Requested;
      this.bConcat1Requested = params.bConcat1Requested;
      this.bAddInputToOutputRequested = params.bAddInputToOutputRequested;
      this.bConcat2ShuffleSplitRequested = params.bConcat2ShuffleSplitRequested;
      this.outputTensorCount = params.outputTensorCount;
    }

    // No matter whether the channel shuffler is used, it is always recorded in data member.
    this.channelShuffler_ConcatPointwiseConv = channelShuffler_ConcatPointwiseConv;

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.


    // 2. pointwise1

    // 2.1 Prepare Input TensorPlaceholder and Operation Array.

    // 2.1.1 Prepare partial pointwise1 arguments.

    // Assume not higher-half-different.
    let nHigherHalfDifferent_pointwise1 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE;
    let inputChannelCount_lowerHalf_pointwise1 = undefined;
    let outputChannelCount_lowerHalf_pointwise1 = undefined;

//!!! ...unfinished... (2021/11/15) What if ( depthwise_AvgMax_Or_ChannelMultiplier > 1 )?

    if ( this.bHigherHalfDifferent == true ) {

      // (i.e. ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4) )
      // (i.e. pointwise1 of ShuffleNetV2_ByMobileNetV1's head)
      if ( this.bHigherHalfDepthwise2 == true ) {

        inputChannelCount_lowerHalf_pointwise1 = this.channelCount0_pointwise1Before;

        if ( this.pointwise1ChannelCount > 0 ) {
          nHigherHalfDifferent_pointwise1 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF;
          outputChannelCount_lowerHalf_pointwise1 = this.pointwise1ChannelCount; // For depthwise1 (by specified channel count)

        } else {
          nHigherHalfDifferent_pointwise1
            = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH;

          // Since this is an almost copy operation, bias and activation is not necessary.
          this.bPointwise1Bias = false;
          this.pointwise1ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

          outputChannelCount_lowerHalf_pointwise1 = this.channelCount0_pointwise1Before; // For depthwise1 (by pass-through-input-to-output)
        }

        // Enlarge pointwise1 to ( pointwise1_channel_count + input_channel_count ) so that depthwise1 could include depthwise2.
        this.pointwise1ChannelCount
          = (  outputChannelCount_lowerHalf_pointwise1 // For depthwise1.
             + this.channelCount0_pointwise1Before     // For depthwise2 (by depthwise1).
            );

      } else { // (i.e. pointwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)

        // So that bHigherHalfPassThrough (or bAllPassThrough).
        nHigherHalfDifferent_pointwise1 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH;

        let pointwise1_higherHalfPassThrough = new ChannelCountCalculator.HigherHalfPassThrough(
          this.channelCount0_pointwise1Before, this.pointwise1ChannelCount );

        inputChannelCount_lowerHalf_pointwise1 = pointwise1_higherHalfPassThrough.inputChannelCount_lowerHalf;
        outputChannelCount_lowerHalf_pointwise1 = pointwise1_higherHalfPassThrough.outputChannelCount_lowerHalf;
      }

    // In other cases, Pointwise.Base could handle ( pointwise1ChannelCount == 0 ) correctly.
    }

    // 2.1.2 Create inputs tensor placeholders and sub operation array.
    {
      let inputTensorPlaceholder0, inputTensorPlaceholder1;

      inputTensorPlaceholder0 = new TensorPlaceholder.Base();
      inputTensorPlaceholder0.set_height_width_channelCount_scaleBoundsArray(
        this.inputHeight0, this.inputWidth0,
        this.channelCount0_pointwise1Before, inputChannelCount_lowerHalf_pointwise1, outputChannelCount_lowerHalf_pointwise1,
        inputScaleBoundsArray0 );

      if ( this.inputTensorCount > 1 ) {
        inputTensorPlaceholder1 = new TensorPlaceholder.Base();
        inputTensorPlaceholder1.set_height_width_channelCount_scaleBoundsArray(
          this.inputHeight0, this.inputWidth0, params.input1ChannelCount,
          undefined, undefined, // channelCount_lowerHalf, channelCount_higherHalf
          inputScaleBoundsArray1 );
      }

      this.operationArray = new ( Operation.TwinArray() )( inputTensorPlaceholder0, inputTensorPlaceholder1 );
    }

    // Note: Once an operation is created (even if it just do nothing (e.g. ( pointwise1.bExisted == false ) ), it should always
    //       be appended to this.operationArray. The reason is that a created operation has already registered as the finalOperation
    //       of .endingInputX. Unless it could be un-registered, otherwise it should always be put into queue.


    // 2.2 The pointwise1 convolution.
    if ( this.pointwise1ChannelCount > 0 ) {

      let pointwise1 = new Operation.Pointwise_SameWhenPassThrough(
        this.operationArray.endingInput0,
        this.pointwise1ChannelCount, this.bPointwise1Bias, this.pointwise1ActivationId,
        nHigherHalfDifferent_pointwise1,
        outputChannelCount_lowerHalf_pointwise1,
        0 // Default channelShuffler_outputGroupCount for pointwise1, is zero (never positive).
      );

      if ( !pointwise1.init( params.defaultInput, this.byteOffsetEnd ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = pointwise1.byteOffsetEnd;

//!!! (2022/06/07 Remarked)
      //this.bPointwise1 = pointwise1.bExisted;

      this.operationArray.operation_append( pointwise1 );
    }

    ++progressToAdvance.value;
    yield progressRoot;  // pointwise1 filters was ready. Report progress.

    // 3. The depthwise operation.
    //
    // Note: When ( pad == valid ), it seems that depthwise (avg/max pooling) filter size can not greater than input image size.

    // Only if depthwise operation is specified, creating them.
    if ( this.AvgMax_Or_ChannelMultiplier != 0 ) {

      // 3.1 The depthwise1 operation.
      let depthwise1;
      {
        let nHigherHalfDifferent_depthwise1 = ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE;

        if ( this.bHigherHalfDifferent == true ) {

          // (i.e. ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4) )
          // (i.e. bHigherHalfDepthwise2, for depthwise1 of ShuffleNetV2_ByMobileNetV1's head)
          if ( this.bHigherHalfDepthwise2 == true ) {
            nHigherHalfDifferent_depthwise1 = ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2;

          // If depthwise1's higher half is responsible for achieving pass-through, it needs height and width of input image.
          //
          // (i.e. ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH (-5) )
          // (i.e. bHigherHalfPassThrough, for depthwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)
          } else {
            nHigherHalfDifferent_depthwise1 = ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH;
          }
        }

        depthwise1 = new Operation.Depthwise_SameWhenPassThrough(
          this.operationArray.endingInput0,
          this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth,
          this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId,
          nHigherHalfDifferent_depthwise1
        );

        if ( !depthwise1.init( params.defaultInput, this.byteOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = depthwise1.byteOffsetEnd;

//!!! (2022/06/07 Remarked)
        //this.bDepthwise1 = depthwise1.bExisted;
      }

      // 3.2 The depthwise2 operation.
      let depthwise2;
      if ( this.bDepthwise2Requested ) {

        // Q: Why does depthwise2 use the same configuration as depthwise1?
        // A: To ensure both result have the same ( height, width ) so that could be inputted to concatenator). This is especially
        //    true for StridesPad.
        depthwise2 = new Operation.Depthwise_SameWhenPassThrough(

          // The depthwise2 processes the inputTensors[ 0 ] directly (i.e. not the pointwise1 result of inputTensors[ 0 ], and
          // not inputTensors[ 1 ]).
          this.operationArray.endingInput1,

          this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth,
          this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId,
          ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE // depthwise2 never has higher-half-different.
        );

        if ( !depthwise2.init( params.defaultInput, this.byteOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = depthwise2.byteOffsetEnd;

//!!! (2022/06/07 Remarked)
        //this.bDepthwise2 = depthwise2.bExisted;


        // Note:
        //   - If ( depthwise2.bExisted == true ), the depthwise2 is requested and created. It means ONE_INPUT_TWO_DEPTHWISE.
        //
        //   - If ( depthwise2.bExisted == false ), the depthwise2 is requested but not created. It means no depthwise operation
        //     (i.e. ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ). In this case, the depthwise2 should be short circuit to
        //     inputTensor[ 0 ] (i.e. not inputTensor[ 1 ]).

      } else {
        // Since the depthwise2 is not requested, it is always short circuit to input1 (i.e. not input0).

//!!! (2022/06/07 Remarked)
        //this.bDepthwise2 = false;
      }

      this.operationArray.operation_append( depthwise1, depthwise2 );
    }

    ++progressToAdvance.value;
    yield progressRoot;  // depthwise filters was ready. Report progress.

    // 4. Concat1
    if ( this.bConcat1Requested ) {
      let concat1 = new Operation.ConcatAlongAxisId2( this.operationArray.endingInput0, this.operationArray.endingInput1 );
      this.operationArray.operation_append( concat1 );
    }

    ++progressToAdvance.value;
    yield progressRoot;  // concat1 was ready. Report progress.

    // 5. The squeeze-and-excitation prefix pointwise2

    // 5.1 Determine Pointwise_HigherHalfDifferent. (Both squeeze-and-excitation and pointwise2 needs it.)

    // Assume not higher-half-different.
    let nHigherHalfDifferent_pointwise2 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE;
    let outputChannelCount_lowerHalf_pointwise2 = undefined;
    let channelShuffler_outputGroupCount_pointwise2 = 0;

    if ( this.bHigherHalfDifferent == true ) {

      // In this case, it should be according to half of pointwise21ChannelCount (just like pointwise1).
      // Note: Unlike pointwise1ChannelCount (which may be zero), pointwise21ChannelCount is always positive.
      outputChannelCount_lowerHalf_pointwise2 = Math.ceil( this.pointwise21ChannelCount / 2 );

      // For bHigherHalfAnotherPointwise (i.e. ( pointwise21ChannelCount > 0 ) ) or bAllPassThrough (i.e. ( pointwise21ChannelCount == 0 ) ).
      //
      // (i.e. ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4) )
      // (i.e. pointwise2 of ShuffleNetV2_ByMobileNetV1's head)
      if ( this.bHigherHalfDepthwise2 == true ) {
        nHigherHalfDifferent_pointwise2 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE;

      // For bHigherHalfPassThroughShuffle (i.e. ( pointwise21ChannelCount > 0 ) ) or bAllPassThroughShuffle (i.e. ( pointwise21ChannelCount == 0 ) ).
      //
      // (i.e. ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH (-5) )
      // (i.e. pointwise2 of ShuffleNetV2_ByMobileNetV1's body/tail)
      } else {
        nHigherHalfDifferent_pointwise2 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH;
        channelShuffler_outputGroupCount_pointwise2 = channelShuffler_ConcatPointwiseConv.outputGroupCount; // positive value.
      }
    }

    // 5.2 The squeeze-and-excitation prefix pointwise2
    if ( this.bSqueezeExcitationPrefix )
      if ( !Base.operationArray_append_SqueezeExcitation.call( this, nHigherHalfDifferent_pointwise2, params.defaultInput ) )
        return false;  // e.g. input array does not have enough data.

    // 5.3
    ++progressToAdvance.value;
    yield progressRoot;  // squeeze-and-excitation (prefix pointwise2) was ready. Report progress.

    // 6. The pointwise2 convolution.
    {
      // 6.1 Pointwise21
      //
      // Note:
      //   - When ( bHigherHalfDifferent == true ) and ( channelShuffler_outputGroupCount > 0 ), it means output channels will be shuffled.
      //
      //   - When ( pointwise21ChannelCount == 0 ), it usually means no pointwise21 (i.e. ( pointwise21.bExisted == false ) ).
      //
      //   - When both ( pointwise21ChannelCount == 0 ) and ( bHigherHalfDifferent == true )
      //       and ( channelShuffler_outputGroupCount > 0 ), the pointwise21 will exist (i.e. ( pointwise21.bExisted == true ) ).
      //       Otherwise, the output channels could not be shuffled. In this case, it will pass through all input to output,
      //       but the output will be channel shuffled.
      //
      //       - However, this situation is difficult to be handled. We re-design Params so that the pointwise21ChannelCount is always
      //           not zero.
      //
      let pointwise21 = new Operation.Pointwise_SameWhenPassThrough(
        this.operationArray.endingInput0,
        this.pointwise21ChannelCount, this.bPointwise21Bias, this.pointwise21ActivationId,
        nHigherHalfDifferent_pointwise2, outputChannelCount_lowerHalf_pointwise2, channelShuffler_outputGroupCount_pointwise2
      );

      if ( !pointwise21.init( params.defaultInput, this.byteOffsetEnd, arrayTemp_forInterleave_asGrouptTwo ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = pointwise21.byteOffsetEnd;

//!!! (2022/06/07 Remarked)
      //this.bPointwise21 = pointwise21.bExisted;

      // 6.2 Pointwise22
      let pointwise22;
      if ( this.pointwise22ChannelCount > 0 ) {
        pointwise22 = new Operation.Pointwise_SameWhenPassThrough(
          this.operationArray.endingInput0, // Note: the same as pointwise21's input (i.e. not .endingInput1).
          this.pointwise22ChannelCount, this.bPointwise22Bias, this.pointwise22ActivationId,
          nHigherHalfDifferent_pointwise2, outputChannelCount_lowerHalf_pointwise2, channelShuffler_outputGroupCount_pointwise2
        );

        // Note: Strictly speaking, sometimes pointwise22 is dependent on depthwise2. But it does not matter for BoundsArraySet
        // because depthwise1 and depthwise2 should have the same output value bounds.
        //
        if ( !pointwise22.init( params.defaultInput, this.byteOffsetEnd, arrayTemp_forInterleave_asGrouptTwo ) )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = pointwise22.byteOffsetEnd;

//!!! (2022/06/07 Remarked)
        //this.bPointwise22 = pointwise22.bExisted;

      } else { // Since pointwise22 is not requested (i.e. channel count is not positive), do not create the object for saving memory.
        //this.bPointwise22 = false;
      }

      // 6.3 Pointwise2 (= Pointwise21 + Pointwise22 )
//!!! (2022/06/07 Remarked)
      //this.bPointwise2 = ( this.bPointwise21 || this.bPointwise22 );

      this.operationArray.operation_append( pointwise21, pointwise22 );
    }

    // 6.4
    ++progressToAdvance.value;
    yield progressRoot;  // pointwise2 filters was ready. Report progress.

    // 7. The squeeze-and-excitation postfix pointwise2
      
    // 7.1
    if ( !this.bSqueezeExcitationPrefix ) // (i.e. postfix)
      if ( !Base.operationArray_append_SqueezeExcitation.call( this, nHigherHalfDifferent_pointwise2, params.defaultInput ) )
        return false;  // e.g. input array does not have enough data.

    // 7.2
    ++progressToAdvance.value;
    yield progressRoot;  // squeeze-and-excitation (postfix pointwise2) was ready. Report progress.

    // 8. Add-input-to-output

    // 8.1
    //
    // Although caller could request add-input-to-output, it may or may not doable.
    // Only if the dimension of output is the same as the dimension of input, it is possible to add-input-to-output.
    //
    // Only if depthwise stride is "1" and pad is "same" (or pad is "valid" but filter size 1x1), the dimension 0 (height)
    // and 1 (width) of the output will be the same as input.
    //
    // Only if output channel is equals to input channel, the dimension 2 (channel) of the output will be the same as input.
    //
    // For example:
    //   - if MobileNetV2 and not stage's block0, should not destroy input tensor so that can add input to output.
    //   - However, even if MobileNetV2, only if not block0 (whose strides == ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME (2))
    //       of a stage, the add-input-to-output can be done.
    //
    if ( this.bAddInputToOutputRequested ) {

      // Note:
      //
      // Usually, if no pointwise21, then no addInput0ToPointwise21.
      // Usually, if no pointwise22, then no addInput0ToPointwise22.
      //
      // However, there is one exception: When both no pointwise21 and no pointwise22, there might be addInput0ToPointwise21.
      // Fortunately, now pointwise21ChannelCount is always not zero. So this situation will not happen.
      //

      let addInput0ToPointwise21;
      if ( this.operationArray.endingInput0?.is_height_width_channelCount_same_byTensorPlaceholder( this.operationArray.input0 ) ) {
//!!! (2022/06/07 Remarked)
        //this.bShould_addInput0ToPointwise21 = true;
        addInput0ToPointwise21 = new Operation.AddTwoTensors( this.operationArray.input0, this.operationArray.endingInput0 );
      }

      // Note: Only input0 (not input1) will be used to add to output.
      let addInput0ToPointwise22;
      if ( this.operationArray.endingInput1?.is_height_width_channelCount_same_byTensorPlaceholder( this.operationArray.input0 ) ) {
//!!! (2022/06/07 Remarked)
        //this.bShould_addInput0ToPointwise22 = true;
        addInput0ToPointwise22 = new Operation.AddTwoTensors( this.operationArray.input0, this.operationArray.endingInput1 );
      }

      this.operationArray.operation_append( addInput0ToPointwise21, addInput0ToPointwise22 );
    }

//!!! (2022/06/07 Remarked)
    //this.bShouldAddInputToOutput = this.bShould_addInput0ToPointwise21 || this.bShould_addInput0ToPointwise22;

    // 8.2
    ++progressToAdvance.value;
    yield progressRoot;  // add-input-to-output was ready. Report progress.

    // 9. Concat2-Shuffle-Split
    if ( this.bConcat2ShuffleSplitRequested ) {

      let bShuffleSplit;
      switch ( this.outputTensorCount ) {
        case 1: bShuffleSplit = false; break;
        case 2: bShuffleSplit = true;  break;

        default:
          tf.util.assert( ( ( this.outputTensorCount == 1 ) || ( this.outputTensorCount == 2 ) ),
            `Block.Base.initer(): When concat2-shuffle-split, `
              + `output channel count ( ${this.outputTensorCount} ) must be either 1 or 2.`
          );
          break;
      }

      let concat2ShuffleSplit = new Operation.ConcatShuffleSplit(
        this.operationArray.endingInput0, this.operationArray.input1,
        channelShuffler_ConcatPointwiseConv, bShuffleSplit, arrayTemp_forInterleave_asGrouptTwo );

      this.operationArray.operation_append( concat2ShuffleSplit );

    } else {
      // Since no concat2(-shuffle-split), the final output come from pointwise2 (and add-input-to-output) directly.
    }

    ++progressToAdvance.value;
    yield progressRoot;  // concat2-Shuffle-Split was ready. Report progress.

    // 10. Configure correct function pointers according to whether keeping or destroying input tensor.

    // 10.1 Determine which apply_Xxx() function should be used.
    Base.setup_apply_block.call( this );

    // 10.2 Adjust the destroy-or-keep behavior of every tensor according to whether the operation is the final operation of the tensor.
    //
    // When caller requests to keep input tensor, all input tensors should be kept.
    //
    this.operationArray.setKeepInputTensor( this.bKeepInputTensor, this.bKeepInputTensor )

    // 10.3 Reduce memory footprint by releasing unused (intermediate) bounds array set.
    this.dispose_intermediate_ScaleBoundsArray();

    // 10.4
    ++progressToAdvance.value;
    yield progressRoot;  // All pointwise1-depthwise-pointwise2 filters was ready. Report progress.

    this.bInitOk = true;
    return true;
  }

  /**
   * Initialize this object by calling initer() and advance the generator by loop until done.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   If null, a temporary progress object will be created.
   *
   * @return {boolean}
   *   Return true if successfully (and progressParent.valuePercentage will be equal to 100).
   *   Return false if failed (and progressParent.valuePercentage will be less than 100).
   */
  init(
    progressParent, params, inputScaleBoundsArray0, inputScaleBoundsArray1, channelShuffler_ConcatPointwiseConv,
    arrayTemp_forInterleave_asGrouptTwo ) {

    progressParent = progressParent ?? ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer(
      progressParent, params, inputScaleBoundsArray0, inputScaleBoundsArray1, channelShuffler_ConcatPointwiseConv,
      arrayTemp_forInterleave_asGrouptTwo );

    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /** Release all tensors. */
  disposeTensors() {

    if ( this.operationArray ) {
      this.operationArray.disposeTensors();
      this.operationArray = null;
    }

    if ( this.channelShuffler_ConcatPointwiseConv ) {
      this.channelShuffler_ConcatPointwiseConv = null; // Note: Do not dispose the channel shuffler here.
    }

    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /**
   * Release all ScaleBoundsArray (inside tensor placeholder) except this.inputX and this.outputX
   *
   * This could reduce memory footprint by releasing unused scale bounds array.
   */
  dispose_intermediate_ScaleBoundsArray() {
    this.operationArray.dispose_intermediate_ScaleBoundsArray();
  }
 
  /**
   * Append a sequence operations to achieve squeeze-and-excitation.
   *
   * Since multiplication is useful in squeeze-and-excitation, what about division?
   * e.g. tf.mul( input, x ) replaced by tf.div( input, tf.abs( x ) + 1 )
   *
   *
   * 1. squeeze-and-excitation with multiplication and division:
   *
   *   depthwise ---- excitationPointwise1 - multiply ---- pointwise
   *              \-----------------------------------/ /
   *               \- excitationPointwise2 - divide ---/
   *
   * Effects:
   *  - depthwise separates neighbor pixels into different channels (of same pixel).
   *  - ( depthwise * excitationPointwise1 ) provides proportional by neighbor pixels.
   *  - ( ( depthwise * excitationPointwise1 ) / excitationPointwise2 ) provides inversely proportional by neighbor pixels.
   *  - pointwise provides summation to neighbor pixels.
   *
   * To avoid dividing by zero, the division may use tf.div( input, tf.abs( excitationPointwise2 ) + 1 ) instead of
   * tf.div( input, excitationPointwise2 ) directly.
   *
   *
   * 2. separable convolution original
   *
   *   depthwise - pointwise
   *
   * Effects:
   *  - depthwise separates neighbor pixels into different channels (of same pixel).
   *  - Can't proportional by neighbor pixels.
   *  - Can't inversely proportional by neighbor pixels.
   *  - pointwise provides summation to neighbor pixels.
   *
   *
   * 3. squeeze-and-excitation original
   *
   *   depthwise - excitation1 - excitation2 - multiply - pointwise
   *             \---------------------------/
   *
   * Effects:
   *  - depthwise separates neighbor pixels into different channels (of same pixel).
   *  - ( depthwise * excitation2 ) provides proportional to neighbor pixels.
   *  - Can't inversely proportional by neighbor pixels.
   *  - pointwise provides summation to neighbor pixels.
   *
   *
   *
   * @param {Block.Base} this
   *   The object to be modified.
   *
   * @param {ValueDesc.Pointwise_HigherHalfDifferent} nPointwise_HigherHalfDifferent
   *   The HigherHalfDifferent type for squeeze-and-excitation.
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean} Return true, if succeeded.   
   */
  static operationArray_append_SqueezeExcitation( nPointwise_HigherHalfDifferent, inputFloat32Array ) {

    // Note: Inside squeeze-and-excitation, all depthwsie and pointwise convolutions are constant-when-pass-through
    //       so that the result for pass-through parts will not affect input when multiply to input.
    //

    // 0.
   
    // Assume .endingInput0 and endingInput1 have the same height and width. So, checking .endingInput0 should be enough.
    let inputHeight = this.operationArray.endingInput0.height;
    let inputWidth = this.operationArray.endingInput0.width;

    // 0.1 Whether squeeze (i.e. global average pooling) exists. It will be false in the following cases:
    //
    //   - ( nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) (-2)
    //     - since this object is just a no-op.
    //
    //   - ( nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION ) (-1)
    //     - squeeze is not required.
    //
    //   - ( inputHeight <= 0 ) or ( inputWidth <= 0 )
    //     - squeeze can not be done.
    //
    //   - ( inputHeight == 1 ) and ( inputWidth == 1 )
    //     - squeeze is not necessary. (already squeezed.)
    //
    let bSqueeze;
    if (
            // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-2), no-op.
            // ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION (-1), squeeze is not required.
            //
            ( this.nSqueezeExcitationChannelCountDivisor < 0 )

         || ( ( inputHeight <= 0 ) || ( inputWidth <= 0 ) ) // squeeze can not be done.
         || ( ( inputHeight == 1 ) && ( inputWidth == 1 ) ) // squeeze is not necessary. (already squeezed.)
       ) {

      bSqueeze = false;
    } else {
      bSqueeze = true;
    }
 
    // 0.2 Whether intermediate pointwise convolution exists.
    //
    //   - If ( nSqueezeExcitationChannelCountDivisor <= 0 ), it will be false (i.e. no intermediate pointwise convolution).
    //     - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-2)
    //     - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION (-1)
    //     - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.SQUEEZE_EXCITATION (0)
    //
    //   - If ( nSqueezeExcitationChannelCountDivisor > 0 ), it will be true.
    //
    let bIntermediate;
    if ( this.nSqueezeExcitationChannelCountDivisor <= 0 ) {
      bIntermediate = false;
    } else {
      bIntermediate = true;
    }

    // 1. squeezeDepthwise
    if ( bSqueeze ) {
      const squeezeAvgMax_Or_ChannelMultiplier = ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG;    // global average pooling.
      const squeezeFilterHeight = inputHeight; // ( filterSize == inputImageSize ) means global pooling.
      const squeezeFilterWidth = inputWidth;
      const squeezeStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID; // To shrink to ( 1 x 1 ) image, pad should be "valid" (i.e. not "same").
      const squeezeBias = false; // squeeze has no bias (since it also has no activation).
      const squeezeActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE; // squeeze has no activation.
      const squeezeHigherHalfDifferent = ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE  // (global) average pooling must be no higher-half-different.

      let squeezeDepthwise1;
      {
        squeezeDepthwise1 = new Operation.Depthwise_ConstantWhenPassThrough(
          this.operationArray.endingInput0,
          squeezeAvgMax_Or_ChannelMultiplier, squeezeFilterHeight, squeezeFilterWidth, squeezeStridesPad,
          squeezeBias, squeezeActivationId, squeezeHigherHalfDifferent
        );

        if ( !squeezeDepthwise1.init( inputFloat32Array, this.byteOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = squeezeDepthwise1.byteOffsetEnd;
      }

      let squeezeDepthwise2;
      if ( this.pointwise22ChannelCount > 0 ) {
        squeezeDepthwise2 = new Operation.Depthwise_ConstantWhenPassThrough(
          this.operationArray.endingInput1,
          squeezeAvgMax_Or_ChannelMultiplier, squeezeFilterHeight, squeezeFilterWidth, squeezeStridesPad,
          squeezeBias, squeezeActivationId, squeezeHigherHalfDifferent
        );

        if ( !squeezeDepthwise2.init( inputFloat32Array, this.byteOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = squeezeDepthwise2.byteOffsetEnd;
      }

      this.operationArray.operation_append( squeezeDepthwise1, squeezeDepthwise2 );
    }

//!!! ...unfinished... (2022/06/07)
//    let outputChannelCount = this.inputChannelCount; // For squeeze-and-excitation, output channel count is always the same as input.
 
//!!! ...unfinished... (2022/06/07)
    this.nSqueezeExcitationChannelCountDivisor;

    //this.bSqueezeExcitationPrefix

    return true;
  }

  /**
   * Setup .apply according .inputTensorCount and .outputTensorCount.
   *   - If ( this.inputTensorCount == 1 ), the inputTensors[ 0 ] will be used.
   *   - If ( this.inputTensorCount == 2 ), the inputTensors[ 0 ] and inputTensors[ 1 ] will be used.
   *   - If ( this.outputTensorCount == 1 ), the outputTensors[ 0 ] will be the result and outputTensors[ 1 ] will be undefined.
   *   - If ( this.outputTensorCount == 2 ), the outputTensors[ 0 ] and outputTensors[ 1 ] will be the result.
   *
   * The input tensors may or may not be disposed.
   *
   */
  static setup_apply_block() {
    if ( this.inputTensorCount >= 2 ) {
      if ( this.outputTensorCount >= 2 ) {
        this.apply = Base.apply__input0_input1__output0_output1;
      } else {
        this.apply = Base.apply__input0_input1__output0;
      }
    } else {
      if ( this.outputTensorCount >= 2 ) {
        this.apply = Base.apply__input0__output0_output1;
      } else {
        this.apply = Base.apply__input0__output0;
      }
    }
  }

  /** Use inputTensors[ 0 ] and inputTensors[ 1 ]. Generate outputTensors[ 0 ] and outputTensors[ 1 ]. */
  static apply__input0_input1__output0_output1( inputTensors, outputTensors ) {
    this.operationArray.input0.realTensor = inputTensors[ 0 ];
    this.operationArray.input1.realTensor = inputTensors[ 1 ];
    this.operationArray.apply();
    outputTensors[ 0 ] = this.operationArray.output0.realTensor;
    outputTensors[ 1 ] = this.operationArray.output1.realTensor;
  }

  /** Use inputTensors[ 0 ] and inputTensors[ 1 ]. Generate outputTensors[ 0 ] only (i.e. outputTensors[ 1 ] always null). */
  static apply__input0_input1__output0( inputTensors, outputTensors ) {
    this.operationArray.input0.realTensor = inputTensors[ 0 ];
    this.operationArray.input1.realTensor = inputTensors[ 1 ];
    this.operationArray.apply();
    outputTensors[ 0 ] = this.operationArray.output0.realTensor;
    outputTensors[ 1 ] = null;
  }

  /** Use inputTensors[ 0 ] only (i.e. ignore inputTensors[ 1 ]). Generate outputTensors[ 0 ] and outputTensors[ 1 ]. */
  static apply__input0__output0_output1( inputTensors, outputTensors ) {
    this.operationArray.input0.realTensor = inputTensors[ 0 ];
    this.operationArray.apply();
    outputTensors[ 0 ] = this.operationArray.output0.realTensor;
    outputTensors[ 1 ] = this.operationArray.output1.realTensor;
  }

  /** Use inputTensors[ 0 ] only (i.e. ignore inputTensors[ 1 ]). Generate outputTensors[ 0 ] only (i.e. outputTensors[ 1 ] always null). */
  static apply__input0__output0( inputTensors, outputTensors ) {
    this.operationArray.input0.realTensor = inputTensors[ 0 ];
    this.operationArray.apply();
    outputTensors[ 0 ] = this.operationArray.output0.realTensor;
    outputTensors[ 1 ] = null;
  }


  get inChannels0() {
    return this.operationArray.input0.channelCount;
  }

  get inChannels1() {
    if ( this.operationArray.input1 )
      return this.operationArray.input1.channelCount;
    return 0;
  }

  get input0() { return this.operationArray.input0; }
  get input1() { return this.operationArray.input1; }


  get outputHeight() { return this.operationArray.output0.height; }
  get outputWidth() { return this.operationArray.output0.width; }


  get outChannels0() {
    return this.operationArray.output0.channelCount;
  }

  get outChannels1() {
    if ( this.operationArray.output1 )
      return this.operationArray.output1.channelCount;
    return 0;
  }

  get outChannelsAll() {
     return ( this.outChannels0 + this.outChannels1 );
  }


  get output0() { return this.operationArray.output0; }
  get output1() { return this.operationArray.output1; }


  get tensorWeightCountExtracted() { return this.operationArray.tensorWeightCountExtracted; }
  get tensorWeightCountTotal()     { return this.operationArray.tensorWeightCountTotal; }


  /** @return {string} The description string of all (adjusted) parameters of initer(). */
  get parametersDescription() {
    let str = ``
      + `inputTensorCount=${this.inputTensorCount}, `

      + `inputHeight0=${this.inputHeight0}, inputWidth0=${this.inputWidth0}, `
      + `inChannels0=${this.inChannels0}, inChannels1=${this.inChannels1}, `

      + `outputHeight=${this.outputHeight}, outputWidth=${this.outputWidth}, `
      + `outChannels0=${this.outChannels0}, outChannels1=${this.outChannels1}, outChannelsAll=${this.outChannelsAll}, `

      + `channelCount1_pointwise1Before_Name=${this.channelCount1_pointwise1Before_Name}(${this.channelCount1_pointwise1Before}), `

      + `bHigherHalfDifferent=${this.bHigherHalfDifferent}, `
      + `bHigherHalfDepthwise2=${this.bHigherHalfDepthwise2}, `

      + `pointwise1ChannelCount=${this.pointwise1ChannelCount}, `
      + `bPointwise1Bias=${this.bPointwise1Bias}, `
      + `pointwise1ActivationName=${this.pointwise1ActivationName}(${this.pointwise1ActivationId}), `

      + `bDepthwise2Requested=${this.bDepthwise2Requested}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=${this.depthwise_AvgMax_Or_ChannelMultiplier_Name}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `depthwiseStridesPad=${this.depthwiseStridesPadName}(${this.depthwiseStridesPad}), `
      + `bDepthwiseBias=${this.bDepthwiseBias}, `
      + `depthwiseActivationName=${this.depthwiseActivationName}(${this.depthwiseActivationId}), `

      + `bConcat1Requested=${this.bConcat1Requested}, `

      + `nSqueezeExcitationChannelCountDivisorName=${this.nSqueezeExcitationChannelCountDivisorName}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `
      + `bSqueezeExcitationPrefix=${this.bSqueezeExcitationPrefix}, `

      + `pointwise21ChannelCount=${this.pointwise21ChannelCount}, `
      + `bPointwise21Bias=${this.bPointwise21Bias}, `
      + `pointwise21ActivationName=${this.pointwise21ActivationName}(${this.pointwise21ActivationId}), `

      + `bOutput1Requested=${this.bOutput1Requested}, `
      + `pointwise22ChannelCount=${this.pointwise22ChannelCount}, `
      + `bPointwise22Bias=${this.bPointwise22Bias}, `
      + `pointwise22ActivationName=${this.pointwise22ActivationName}(${this.pointwise22ActivationId}), `

      + `bAddInputToOutputRequested=${this.bAddInputToOutputRequested}, `
      + `bConcat2ShuffleSplitRequested=${this.bConcat2ShuffleSplitRequested}, `
      + `outputTensorCount=${this.outputTensorCount}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

}
