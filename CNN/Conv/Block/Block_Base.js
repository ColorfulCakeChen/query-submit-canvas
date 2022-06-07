export { Base };

import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ReturnOrClone from "../ReturnOrClone.js";
import * as BoundsArraySet from "../BoundsArraySet.js";
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
 * input0 - pointwise1 - depthwise1 - (squeezeExcitation) - pointwise21 (include pointwise211 and pointwise212)
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -3 ) and ( bOutput1Requested == true ): TWO_INPUTS_CONCAT_POINTWISE21_INPUT1: TWO_OUTPUT:
 * (ShuffleNetV2's body)
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitation) - pointwise21 - concat2ShuffleSplit - output0
 * input1 --------------------------------------------------------------/                     \ output1
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -3 ) and ( bOutput1Requested == false ): TWO_INPUTS_CONCAT_POINTWISE21_INPUT1: ONE_OUTPUT:
 * (ShuffleNetV2's tail)
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitation) - pointwise21 - concat2(ShuffleSplit) - output0
 * input1 --------------------------------------------------------------/
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -2 ): ONE_INPUT_TWO_DEPTHWISE:
 * (simplified ShuffleNetV2's head with ( pointwise1ChannelCount >= 1 ) )
 * <pre>
 * input0 - pointwise1 - depthwise1 - concat1 - (squeezeExcitation) - pointwise21
 *        \------------- depthwise2 /         \ (squeezeExcitation) - pointwise22
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -1 ): ONE_INPUT_ADD_TO_OUTPUT: (MobileNetV2's body and tail)
 * <pre>
 *        /----------------------------------------------------------------------------\
 * input0 - pointwise1 - depthwise1 ---------------- (squeezeExcitation) - pointwise21 - addInput0ToPointwise21
 *        \                                        \ (squeezeExcitation) - pointwise22 - addInput0ToPointwise22
 *         \---------------------------------------------------------------------------/
 * </pre>
 *
 *
 *   - When
 *     - ( channelCount1_pointwise1Before == 0 ): ONE_INPUT:
 *       (MobileNetV1 or MobileNetV2's head or simplified ShuffleNetV2(_ByPointwise22)'s head with ( blockParams.bPointwise1 == false ) )
 * <pre>
 * input0 - pointwise1 - depthwise1 ---------------- (squeezeExcitation) - pointwise21
 *                                                 \ (squeezeExcitation) - pointwise22
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before > 0 ): TWO_INPUTS: (ShuffleNetV2_ByPointwise22's body and tail)
 * <pre>
 * input0 - pointwise1 - depthwise1 - concat1 - (squeezeExcitation) - pointwise21
 * input1 --------------------------/         \ (squeezeExcitation) - pointwise22
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
 *   How many input tensors will be past into apply() as parameter inputTensors[].
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
 * @member {number} outputHeight
 *   The height of the output image. If depthwise does not exist, it will be the same as inputHeight0. Otherwise, depthwise
 * determines outputHeight.
 *
 * @member {number} outputWidth
 *   The width of the output image. If depthwise does not exist, it will be the same as inputWidth0. Otherwise, depthwise
 * determines outputWidth.
 *
 * @member {number} outChannels0
 *   The channel count of the outputTensor[ 0 ]. Even if ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ),
 * this will still be non-zero.
 *
 * @member {number} outChannels1
 *   The channel count of the outputTensor[ 1 ]. If ( pointwise22ChannelCount == 0 ), this will be zero.
 *
 * @member {number} outChannelsAll
 *   The channel count of all output tensors (i.e. both outputTensor[ 0 ] and outputTensor[ 1 ]).
 *

//!!! ...unfinished... (2022/06/05)
//
//  * @member {number} channelCount_pointwise1After_depthwise1Before
//  *   The channel count after the first 1x1 pointwise convolution. If ( pointwise1ChannelCount > 0 ), it equals pointwise1ChannelCount.
//  * If ( pointwise1ChannelCount == 0 ), it equals inChannels0.
//  *
//  * @member {number} channelCount_depthwise1After_concat1Before
//  *   The channel count after the first depthwise convolution which applies to the result of pointwise1.
//  *   - If depthwise1 exists, it will be the channel count of depthwise1's output.
//  *     - When ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ), it equals
//  *         ( channelCount_pointwise1After_depthwise1Before * depthwise_AvgMax_Or_ChannelMultiplier ).
//  *     - When ( depthwise_AvgMax_Or_ChannelMultiplier == Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG  ) (i.e. -2)
//  *         or ( depthwise_AvgMax_Or_ChannelMultiplier == Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX  ) (i.e. -1)
//  *         or ( depthwise_AvgMax_Or_ChannelMultiplier == Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.NONE ) (i.e.  0),
//  *         it equals channelCount_pointwise1After_depthwise1Before.
//  *   - If depthwise1 does not exist, it will be the channel count of previous operation (i.e. pointwise1)
//  *       which is channelCount_pointwise1After_depthwise1Before.
//  *
//  * @member {number} channelCount_depthwise2After_concat1Before
//  *   The channel count after the second depthwise convolution which applies to input0 or input1. If depthwise2 does not exist,
//  * this will be the same as Math.max( 0, channelCount1_pointwise1Before ) (i.e. the depthwise2 will be viewed as short circuit
//  * to input1).
//  *
//  * @member {number} channelCount_concat1After_pointwise2Before
//  *   The channel count before pointwise2. It is may be the concatenated result of input0 (with depthwise1, with/without depthwise2)
//  * with/without input1 (without depthwise2).
//  *
//  * @member {number} channelCount_pointwise21After_concat2Before
//  *   The channel count after the pointwise21 convolution.
//  *     - If ( pointwise21ChannelCount > 0 ), it equals pointwise21ChannelCount.
//  *     - If ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount != 0 ), it will be 0.
//  *     - If ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ), it equals channelCount_concat1After_pointwise2Before.
//  *
//  * @member {number} channelCount_pointwise22After_concat2Before
//  *   The channel count after the pointwise22 convolution. If ( pointwise22ChannelCount > 0 ), it equals pointwise22ChannelCount.
//  * If ( pointwise22ChannelCount == 0 ), it will be 0.
//  *
//  * @member {number} channelCount_pointwise2After_concat2Before
//  *   The channel count after all pointwise2 convolution.
//  *
//  *     - Basically, it will be ( channelCount_pointwise21After_concat2Before + channelCount_pointwise22After_concat2Before )
//  *         if at least one pointwise2 convolution existed.
//  *
//  *     - If both ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ), it will be channelCount_concat1After_pointwise2Before.
//  *


//!!! ...unfinished... (2022/06/05) Perhaps, output TensorPlaceholders are enough?

 * @member {BoundsArraySet.InputsOutputs} boundsArraySet
 *   The element value bounds of this Block's input/output.

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

      //this.bPointwise1 = pointwise1.bExisted;
      this.operation_append( this.pointwise1 );
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

        //this.bDepthwise2 = depthwise2.bExisted;
        //
        // Note:
        //   - If ( depthwise2.bExisted == true ), the depthwise2 is requested and created. It means ONE_INPUT_TWO_DEPTHWISE.
        //
        //   - If ( depthwise2.bExisted == false ), the depthwise2 is requested but not created. It means no depthwise operation
        //     (i.e. ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ). In this case, the depthwise2 should be short circuit to
        //     inputTensor[ 0 ] (i.e. not inputTensor[ 1 ]).

      } else {
        // Since the depthwise2 is not requested, it is always short circuit to input1 (i.e. not input0).
        //this.bDepthwise2 = false;
      }

      this.operation_append( depthwise1, depthwise2 );
    }

    ++progressToAdvance.value;
    yield progressRoot;  // depthwise filters was ready. Report progress.

    // 4. Concat1
    if ( this.bConcat1Requested ) {
      let concat1 = new Operation.ConcatAlongAxisId2( this.operationArray.endingInput0, this.operationArray.endingInput1 );
      this.operation_append( concat1 );
    }

    ++progressToAdvance.value;
    yield progressRoot;  // concat1 was ready. Report progress.


//!!! ...unfinished... (2022/06/07)
    // 5. The squeeze-and-excitation prefix pointwise2

//     this.nSqueezeExcitationChannelCountDivisor = params.nSqueezeExcitationChannelCountDivisor;
//     this.nSqueezeExcitationChannelCountDivisorName = params.nSqueezeExcitationChannelCountDivisorName;
//     this.bSqueezeExcitationPrefix = params.bSqueezeExcitationPrefix;

    ++progressToAdvance.value;
    yield progressRoot;  // squeeze-and-excitation (prefix pointwise2) was ready. Report progress.


//!!! ...unfinished... (2022/06/07)

//!!! ...unfinished... (2022/05/21)
// It seems that all squeeze-and-excitation (of pointwise21 and pointwise22) should be extracted, and then pointwise21 and pointwise22
// should be extracted. ?? So that the weights arranged the same between ShuffleNetV2_byPointwise22 and ShuffleNetV2_byMobileNetV1??
//
// No. This problem seems not existed because Block_TestParams already arrange them properly.


    // 6. The pointwise2 convolution.
    {
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

      //this.bPointwise21 = pointwise21.bExisted;

      // 6.2 Pointwise22
      if ( this.pointwise22ChannelCount > 0 ) {
        let pointwise22 = new Operation.Pointwise_SameWhenPassThrough(
          this.operationArray.endingInput0, // Note: the same as pointwise21's input (i.e. not .endingInput1).
          this.pointwise22ChannelCount, this.bPointwise22Bias, this.pointwise22ActivationId,
          nHigherHalfDifferent_pointwise2, outputChannelCount_lowerHalf_pointwise2, channelShuffler_outputGroupCount_pointwise2
        );

        // Note: Strictly speaking, sometimes pointwise22 is dependent on depthwise2. But it does not matter for BoundsArraySet
        // because depthwise1 and depthwise2 should have the same output value bounds. And so concat1_boundsArraySet_output0.
        //
        if ( !pointwise22.init( params.defaultInput, this.byteOffsetEnd, arrayTemp_forInterleave_asGrouptTwo ) )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = pointwise22.byteOffsetEnd;

        //this.bPointwise22 = pointwise22.bExisted;

      } else { // Since pointwise22 is not requested (i.e. channel count is not positive), do not create the object for saving memory.
        //this.bPointwise22 = false;
      }

      // 6.3 Pointwise2 (= Pointwise21 + Pointwise22 )
      //this.bPointwise2 = ( this.bPointwise21 || this.bPointwise22 );
    }

    // 6.4
    ++progressToAdvance.value;
    yield progressRoot;  // pointwise2 filters was ready. Report progress.


//!!! ...unfinished... (2022/06/07)
    // 7. The squeeze-and-excitation postfix pointwise2

    ++progressToAdvance.value;
    yield progressRoot;  // squeeze-and-excitation (postfix pointwise2) was ready. Report progress.

    // 8. Add-input-to-output

//!!! (2022/06/07 Remarked)
//     // Because addInput0ToPointwise21 and addInput0ToPointwise21 may not exist, track it by local variable (which will be used by
//     // concat2ShuffleSplit and this Block final bounds arrray set).
//     //
//     let addInput0ToPointwise21_boundsArraySet_output0 = this.pointwise21.boundsArraySet.output0;
//     let addInput0ToPointwise22_boundsArraySet_output0 = this.pointwise22?.boundsArraySet.output0;

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
    if (   ( this.bAddInputToOutputRequested )
        && ( this.operationArray.endingInput0.is_height_width_channelCount_same_byTensorPlaceholder( this.operationArray.input0 ) )
       ) {

//!!! ...unfinished... (2022/06/07)

      // Note:
      //
      // Usually, if no pointwise21, then no addInput0ToPointwise21.
      // Usually, if no pointwise22, then no addInput0ToPointwise22.
      //
      // However, there is one exception: When both no pointwise21 and no pointwise22, there might be addInput0ToPointwise21
      // if channelCount_concat1After_pointwise2Before (which is already assigned to channelCount_pointwise21After_concat2Before
      // in this case) has the same dimension as inputTensors[ 0 ].

      if ( this.channelCount0_pointwise1Before == this.channelCount_pointwise21After_concat2Before ) {
        this.bShould_addInput0ToPointwise21 = true;
        this.addInput0ToPointwise21 = new AddTwoTensors.Base( false, false, inputScaleBoundsArray0, this.pointwise21.boundsArraySet.output0 );
        addInput0ToPointwise21_boundsArraySet_output0 = this.addInput0ToPointwise21.boundsArraySet.output0;
      }

      // Only inputTensors[ 0 ] will be used to add to output. So still check against channelCount0_pointwise1Before
      // (not channelCount1_pointwise1Before).
      if ( this.channelCount0_pointwise1Before == this.channelCount_pointwise22After_concat2Before ) {
        this.bShould_addInput0ToPointwise22 = true;
        this.addInput0ToPointwise22 = new AddTwoTensors.Base( false, false, inputScaleBoundsArray0, this.pointwise22.boundsArraySet.output0 );
        addInput0ToPointwise22_boundsArraySet_output0 = this.addInput0ToPointwise22.boundsArraySet.output0;
      }
    }

    this.bShouldAddInputToOutput = this.bShould_addInput0ToPointwise21 || this.bShould_addInput0ToPointwise22;

    // 8.2
    //
    // Q: Why not create TensorOpCounter in the above codes?
    // A: The reason is that let addInput0ToPointwise21 in front of pointwise22.
    //    This is because apply_X_X_AddInputToOutput_X() does them in this order.
    {
      if ( this.bPointwise21 )
        TensorOpCounters.pointwise21 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_pointwise21",
          this.pointwise21, TensorOpCounters.concat1 );
      else
        TensorOpCounters.pointwise21 = TensorOpCounters.concat1; // Its output is just its input tensor.

      // Note: This should be before pointwise22.
      if ( this.bShould_addInput0ToPointwise21 )
        TensorOpCounters.addInput0ToPointwise21 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_addInput0ToPointwise21",
          this.addInput0ToPointwise21, TensorOpCounters.input0, TensorOpCounters.pointwise21 );
      else
        TensorOpCounters.addInput0ToPointwise21 = TensorOpCounters.pointwise21;

      if ( this.bPointwise22 )
        TensorOpCounters.pointwise22 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_pointwise22",
          this.pointwise22, TensorOpCounters.concat1 );
      else
        TensorOpCounters.pointwise22 = TensorOpCounters.concat1; // Its output is just its input tensor.

      // Only inputTensors[ 0 ] will be used to add to output. So still use TensorOpCounters.input0 (not TensorOpCounters.input1) as input.
      if ( this.bShould_addInput0ToPointwise22 )
        TensorOpCounters.addInput0ToPointwise22 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_addInput0ToPointwise22",
          this.addInput0ToPointwise22, TensorOpCounters.input0, TensorOpCounters.pointwise22 );
      else
        TensorOpCounters.addInput0ToPointwise22 = TensorOpCounters.pointwise22;
    }

    // 8.3
    ++progressToAdvance.value;
    yield progressRoot;  // add-input-to-output was ready. Report progress.

    // 9. Concat2-Shuffle-Split
    if ( this.bConcat2ShuffleSplitRequested ) {

      let bShuffleSplit, TensorOpCounters_NamePostfix;
      switch ( this.outputTensorCount ) {
        case 1:
          bShuffleSplit = false;
          TensorOpCounters_NamePostfix = "_concat2"; // only concat2, no shuffle, no split.
          this.outChannels0 = ( this.channelCount_pointwise21After_concat2Before * 2 ); // Twice of pointwise21.
          this.outChannels1 = 0;
          break;

        case 2:
          bShuffleSplit = true;
          TensorOpCounters_NamePostfix = "_concat2ShuffleSplit";
          this.outChannels0 =
          this.outChannels1 = this.channelCount_pointwise21After_concat2Before; // Both output0 and output1 will have the same channel count.
          break;

        default:
          tf.util.assert( ( ( this.outputTensorCount == 1 ) || ( this.outputTensorCount == 2 ) ),
            `Block.Base.initer(): When concat2-shuffle-split, `
              + `output channel count ( ${this.outputTensorCount} ) must be either 1 or 2.`
          );
          break;
      }

      this.concat2ShuffleSplit = new ConcatShuffleSplit.Base( channelShuffler_ConcatPointwiseConv, bShuffleSplit, false, false,
        addInput0ToPointwise21_boundsArraySet_output0, inputScaleBoundsArray1, arrayTemp_forInterleave_asGrouptTwo );

      {
        this.boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray0, inputScaleBoundsArray1,
          this.concat2ShuffleSplit.boundsArraySet.output0.channelCount, this.concat2ShuffleSplit.boundsArraySet.output1?.channelCount );

        this.boundsArraySet.set_outputs_all_byBoundsArraySet_Outputs( this.concat2ShuffleSplit.boundsArraySet );
      }

      // In theory, concat2 use the result of add-input0-to-pointwise21 as first parameter. In reality, it usually uses the result
      // of pointwise21 (without add-input0-to-output) as first parameter.
      TensorOpCounters.concat2ShuffleSplit = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + TensorOpCounters_NamePostfix,
        this.concat2ShuffleSplit, TensorOpCounters.addInput0ToPointwise21, TensorOpCounters.input1 );

    } else {
      // Since no concat2(-shuffle-split), the final output come from pointwise2 (and add-input-to-output) directly.
      this.outChannels0 = this.channelCount_pointwise21After_concat2Before;
      this.outChannels1 = this.channelCount_pointwise22After_concat2Before;

      {
        this.boundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray0, inputScaleBoundsArray1,
          addInput0ToPointwise21_boundsArraySet_output0.channelCount, addInput0ToPointwise22_boundsArraySet_output0?.channelCount );

        this.boundsArraySet.output0.set_all_byScaleBoundsArray( addInput0ToPointwise21_boundsArraySet_output0 );
        this.boundsArraySet.output1?.set_all_byScaleBoundsArray( addInput0ToPointwise22_boundsArraySet_output0 );
      }

      // Note: It should also be okay to set to TensorOpCounters.addInput0ToPointwise22).
      TensorOpCounters.concat2ShuffleSplit = TensorOpCounters.addInput0ToPointwise21;
    }

    ++progressToAdvance.value;
    yield progressRoot;  // concat2-Shuffle-Split was ready. Report progress.

    // 10. Configure correct function pointers according to whether keeping or destroying input tensor.

    // 10.1 Determine which apply_Xxx() function should be used.
    Base.setup_apply_block().call( this );

    // 10.2 Adjust the destroy-or-keep behavior of every tensor according to whether the operation is the first operation or last operation.
    this.operationArray.setKeepInputTensor( this.bKeepInputTensor, this.bKeepInputTensor ); // User requests to keep input tensors.

    // 10.3
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
   * Release all BoundsArraySet of pointwise1, depthwise1, depthwise2, pointwise21, pointwise22,
   * concat1, addInput0ToPointwise21, addInput0ToPointwise22, concat2ShuffleSplit.
   *
   * This could reduce memory footprint.
   *
   * (Note: This Block's BoundsArraySet is kept.)
   */
  dispose_all_sub_BoundsArraySet() {

//!!! ...unfinished... (2022/06/04) However, some information (i.e. ScaleBoundsArray) is still kept in every TensorPlaceholder.
// Perhaps, remove those ScaleBoundsArray all except in the first input and last output TensorPlaceholder.



//!!! (2022/06/04 Remakred) The sub operation already release them.
//     delete this.pointwise1?.boundsArraySet;
//     delete this.depthwise1?.boundsArraySet;
//     delete this.depthwise2?.boundsArraySet;
//     delete this.pointwise21?.boundsArraySet;
//     delete this.pointwise22?.boundsArraySet;
//     delete this.concat1?.boundsArraySet;
//     delete this.addInput0ToPointwise21?.boundsArraySet;
//     delete this.addInput0ToPointwise22?.boundsArraySet;
//     delete this.concat2ShuffleSplit?.boundsArraySet;
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


  get outputHeight() {
    return this.operationArray.output0.height;
  }

  get outputWidth() {
    return this.operationArray.output0.width;
  }


  get inChannels0() {
    return this.operationArray.input0.channelCount;
  }

  get inChannels1() {
    if ( this.operationArray.input1 )
      return this.operationArray.input1.channelCount;
    return 0;
  }

  get outChannelsAll() {
     return ( this.outChannels0 + this.outChannels1 );
  }


  get tensorWeightCountExtracted() {
    return this.operationArray.tensorWeightCountExtracted;
  }

  get tensorWeightCountTotal() {
    return this.operationArray.tensorWeightCountTotal;
  }


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
