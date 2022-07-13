export { Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
//import * as Weights from "../../Unpacker/Weights.js";
import * as ChannelCountCalculator from "../ChannelCountCalculator.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as Operation from "../Operation.js";
import { Params } from "./Block_Params.js";


//!!! ...unfinished... (2022/07/12)
// When input ( height, width ) is ( 1, 1 ), biases could be integrated into convolution filters to improvement performance.
//

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
 * There are twelve combinations:
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL (0) ):
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise20 - (squeezeExcitationPostfix)
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL (1) ):
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise20 - (squeezeExcitationPostfix) - addInput0ToPointwise20
 *        \------------------------------------------------------------------------------------------------/
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD (2) ):
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise20 - (squeezeExcitationPostfix) - concat2ShuffleSplit - output0
 *        \------------- depthwise2 - (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix) /                     \ output1
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY (3) ):
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise20 - (squeezeExcitationPostfix) - concat2ShuffleSplit - output0
 * input1 -------------------------------------------------------------------------------------------------/                     \ output1
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL (4) ):
 * <pre>
 * input0 - pointwise1 - depthwise1 - (squeezeExcitationPrefix) - pointwise20 - (squeezeExcitationPostfix) - concat2             - output0
 * input1 -------------------------------------------------------------------------------------------------/ (no_Shuffle
 *                                                                                                            _no_Split)
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) )
 * <pre>
 * input0 - pointwise1         - depthwise1      - (squeezeExcitationPrefix) - pointwise20                  - (squeezeExcitationPostfix)
 *          (higher_half         (higher_half                                  (higher_half
 *           _copy_lower_half)    _depthwise2)                                  _another_pointwise_shuffle)
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY (6) )
 * <pre>
 * input0 - pointwise1         - depthwise1      - (squeezeExcitationPrefix) - pointwise20                  - (squeezeExcitationPostfix)
 *          (higher_half         (higher_half                                  (higher_half
 *           _pass_through)       _pass_through)                                _pass_through_shuffle)
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL (7) )
 * <pre>
 * input0 - pointwise1         - depthwise1      - (squeezeExcitationPrefix) - pointwise20                  - (squeezeExcitationPostfix)
 *          (higher_half         (higher_half                                  (higher_half
 *           _pass_through)       _pass_through)                                _pass_through_no_shuffle)
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2 (8) ):
 * (ShuffleNetV2_ByPointwise21's head when ( pointwise1ChannelCount == 0 ) )
 * <pre>
 * input0 - (pointwise1) - depthwise1 - (squeezeExcitationPrefix) - pointwise20 - (squeezeExcitationPostfix)
 *                                    \ (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix)
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD (9) ):
 * (ShuffleNetV2_ByPointwise21's head when ( pointwise1ChannelCount >= 1 ) )
 * <pre>
 * input0 - pointwise1 - depthwise1 - concat1 - (squeezeExcitationPrefix) - pointwise20 - (squeezeExcitationPostfix)
 *        \------------- depthwise2 /         \ (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix)
 * </pre>
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY (10) ):
 * <pre>
 * input0 - pointwise1 - depthwise1 - concat1 - (squeezeExcitationPrefix) - pointwise20 - (squeezeExcitationPostfix)
 * input1 --------------------------/         \ (squeezeExcitationPrefix) - pointwise21 - (squeezeExcitationPostfix)
 * </pre>
 *
 *
 *   - When ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL (11) ):
 * <pre>
 * input0 - pointwise1 - depthwise1 - concat1 - (squeezeExcitationPrefix) - pointwise20 - (squeezeExcitationPostfix)
 * input1 --------------------------/
 * </pre>
 *
 *
 *
 * Strictly speaking, the real (original) ShuffleNetV2 is more like the following:
 *
 * (original ShuffleNetV2's head)
 * <pre>
 * input0 - pointwise1 - depthwise1 - pointwise20 - concat2 - channelShuffler
 *        \------------- depthwise2 - pointwise21 /
 * </pre>
 *
 * (original ShuffleNetV2's tail)
 * <pre>
 * input0 - channelSplitter - pointwise1 - depthwise1 - pointwise20 - concat2 - channelShuffler
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
 * @member {number} weightElementOffsetBegin
 *   The position which is started (inclusive) to extract from inputweightArray by initer().
 *
 * @member {number} weightElementOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputWeightArray by initer(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
 *
 * @member {number} inputTensorCount
 *   How many input tensors will be passed into apply() as parameter inputTensors[].
 *
 * @member {number} input1_height
 *   The height of the second input (i.e. input1). If there is no input1, it will be 0. This is inferenced from other parameters.
 * The input1's height of Block.apply() should match this value.
 *
 * @member {number} input1_width
 *   The width of the second input (i.e. input1). If there is no input1, it will be 0. This is inferenced from other parameters.
 * The input1's width of Block.apply() should match this value.
 *
 * @member {number} input1_channelCount
 *   The channel count of the second input (i.e. input1). If there is no input1, it will be 0. This is inferenced from other parameters.
 * The input1's channel count of Block.apply() should match this value. The Block.inChannels1 should also the same this value.
 *
 * @member {boolean} bDepthwiseRequestedAndNeeded
 *   Whether depthwise operation is requested and necessary.
 *
 * @member {Depthwise.PadInfoCalculatorRoot} depthwisePadInfo
 *   If ( bDepthwiseRequestedAndNeeded == true ), this info will be set.
 *
 * @member {boolean} bDepthwise2Requested
 *   If true, the depthwise2 is needed.
 *
 * @member {boolean} bConcat1Requested
 *   If true, the concat1 (after depthwise and before pointwise2) is needed.
 *
 * @member {boolean} bConcat2ShuffleSplitRequested
 *   If true, the concat2 (after pointwise2) is needed. It may or may not follow channel shuffling and splitting.
 *
 * @member {boolean} bAddInputToOutputRequested
 *   If true, the input (in this case, the main input (i.e. input0)) will be added to the output for achieving skip connection.
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
 * @member {number} pointwise20_channelShuffler_outputGroupCount
 *   The output group count of the pointwise20's channel shuffler when
 * ( nHigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ). Either 0 or 2.
 * Usually 2 ony if SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD or SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY.
 *
 * @member {number} pointwise21ChannelCount
 *   The output channel count of the second pointwise2 convolution. If ( pointwise21ChannelCount == 0 ), it means pointwise21 does
 * not existed.
 *
 * @member {number} outputTensorCount
 *   How many output tensors will be returned by the parameter outputTensors of apply(). At least 1. At most 2.
 *
 * @member {string} pointwise1ActivationName
 *   The activation function id (Params.pointwise1ActivationId.valueDesc.Ids.Xxx) after the first pointwise convolution.
 *
 * @member {string} depthwise_AvgMax_Or_ChannelMultiplier_Name
 *   Depthwise operation name.
 *
 * @member {string} depthwiseActivationName
 *   The activation function name (Params.depthwiseActivationId.valueDesc.Ids.Xxx) after depthwise convolution.
 *
 * @member {string} pointwise20ActivationName
 *   The activation function id (Params.pointwise20ActivationId.valueDesc.Ids.Xxx) after the first pointwise2 convolution.
 *
 * @member {string} pointwise21ActivationName
 *   The name of activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the second pointwise2 convolution.
 * It is only meaningful if ( pointwise21ChannelCount > 0 ) (i.e. ( bPointwise21 == true ) and ( pointwise20ChannelCount > 0 ) ).
 *
 * @member {number} inChannels0
 *   The channel count of the first input tensor (i.e. inputTensors[ 0 ]). This is the same as this.input0_channelCount
 * (from initer()).
 *
 * @member {number} inChannels1
 *   The channel count of the second input tensor (i.e. inputTensors[ 1 ]). It is zero or positive (never negative).
 *
 * @member {TensorPlaceholder.Base} input0
 *   The TensorPlaceholder object which represents this operation's 1st input.
 *
 * @member {TensorPlaceholder.Base} input1
 *   The TensorPlaceholder object which represents this operation's 2nd input. It exists only if ( this.inputTensorCount > 1 ).
 *
 * @member {number} outputHeight
 *   The height of the output image. If depthwise does not exist, it will be the same as input0_height. Otherwise, depthwise
 * determines outputHeight.
 *
 * @member {number} outputWidth
 *   The width of the output image. If depthwise does not exist, it will be the same as input0_width. Otherwise, depthwise
 * determines outputWidth.
 *
 * @member {number} outChannels0
 *   The channel count of the outputTensor[ 0 ]. In theory, even if ( pointwise20ChannelCount == 0 ) and ( pointwise21ChannelCount == 0 ),
 * this will still be non-zero. However, now the pointwise20ChannelCount should always be not zero. 
 *
 * @member {number} outChannels1
 *   The channel count of the outputTensor[ 1 ]. If ( pointwise21ChannelCount == 0 ), this will be zero.
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
 * @member {ChannelShuffler.ConcatPointwiseConv} channelShuffler_ConcatPointwiseConv
 *   The channelShuffler. It must be implemented by ChannelShuffler.ConcatPointwiseConv with ( outputGroupCount == 2 ).
 *
 *     - It will not be disposed by this object (i.e. it is supposed to be shared with outter callers).
 *
 *     - The channelShuffler's outputGroupCount must be 2 (i.e. split into two groups after channel-shuffling).
 *
 *     - It is used when:
 *       - ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD )
 *         ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY )
 *         ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL )
 *         - The channelShuffler_ConcatPointwiseConv will be used.
 *         - The channelShuffler.shuffleInfo.totalChannelCount should be the same as the channel count of the concatenation
 *             of pointwise20 and input1.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
 * weights, if they are used in tensors. (Not including channelShuffler.)
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not including Params, because they are not used in
 * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputWeightArray.
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
class Base extends Recyclable.Root {

  /**
   * Used as default Block.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Block.Base.Pool", Base, Base.setAsConstructor );

  /**
   */
  constructor() {
    super();
    Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Nothing to do here (for Block.Base).
  }

  /**
   * Generator for initializing this object.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
   *
   * @param {number[]|Float32Array} inputWeightArray
   *   The underlying weights source array to be extracted from. It will not be kept by this object.
   *
   * @param {Params} params
   *   A Params object. The params.init() will be called to extract parameters. This params will be owned and destroyed by this .initer().
   * So caller should not use it again.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Block value bounds set.
   * It will be referenced (i.e. kept, but not cloned and not released) by this object. So caller should not modify them, but
   * caller is responsible for releasing it.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray1
   *   The element value bounds (per channel) of input1. Usually, it is The .output1 of the previous Block value bounds set.
   * It will be referenced (i.e. kept, but not cloned and not released) by this object. So caller should not modify them, but
   * caller is responsible for releasing it.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   */
  * initer(
    progressParent, inputWeightArray, weightElementOffsetBegin, params,
    inputScaleBoundsArray0, inputScaleBoundsArray1,
    channelShuffler_ConcatPointwiseConv
  ) {

    // 0. Prepare

    this.weightElementOffsetEnd = this.weightElementOffsetBegin = weightElementOffsetBegin;
    this.bInitOk = false;

    // 0.1 Estimate the maximum value of progress.
    let progressMax =
        1  // for extracting parameters from inputWeightArray.
      + 1  // for extracting pointwise1 filters (and biases) from inputWeightArray and building tensors.
      + 1  // for extracting depthwise filters (and biases) from inputWeightArray and building tensors.
      + 1  // for concat1.
      + 1  // for extracting squeeze-and-excitation prefix pointwise2.
      + 1  // for extracting pointwise2 filters (and biases) from inputWeightArray and building tensors.
      + 1  // for extracting squeeze-and-excitation postfix pointwise2.
      + 1  // for add-input-to-output.
      + 1  // for concat2-shuffle-split.
      + 1  // for all pointwise1-depthwise-pointwise2 filters (and biases) ready.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) );

    // 1. Extract parameters.
    if ( !params )
      return false;

    if ( !params.init( inputWeightArray, weightElementOffsetBegin ) )
      return false;  // e.g. input array does not have enough data.

    // Record where to extract next weights. Only meaningful when ( this.bInitOk == true ).
    this.weightElementOffsetEnd = params.weightElementOffsetEnd;

    // Get parameters' real (adjusted) values.
    //
    // Do not keep params in this.params so that the inputWeightArray could be released.
    this.input0_height = params.input0_height;
    this.input0_width = params.input0_width;
    this.input0_channelCount = params.input0_channelCount;

    this.nConvBlockTypeId = params.nConvBlockTypeId;
    this.nConvBlockTypeName = params.nConvBlockTypeName;

    this.pointwise1ChannelCount = params.pointwise1ChannelCount;
    this.pointwise1Bias = params.pointwise1Bias;
    this.pointwise1ActivationId = params.pointwise1ActivationId;
    this.pointwise1ActivationName = params.pointwise1ActivationName;

    this.depthwise_AvgMax_Or_ChannelMultiplier = params.depthwise_AvgMax_Or_ChannelMultiplier;
    this.depthwise_AvgMax_Or_ChannelMultiplier_Name = params.depthwise_AvgMax_Or_ChannelMultiplier_Name;
    this.depthwiseFilterHeight = params.depthwiseFilterHeight;
    this.depthwiseFilterWidth = params.depthwiseFilterWidth;
    this.depthwiseStridesPad = params.depthwiseStridesPad;
    this.depthwiseStridesPadName = params.depthwiseStridesPadName;
    this.depthwiseBias = params.depthwiseBias;
    this.depthwiseActivationId = params.depthwiseActivationId;
    this.depthwiseActivationName = params.depthwiseActivationName;
    this.depthwise1_nHigherHalfDifferent = params.depthwise1_nHigherHalfDifferent;

    this.pointwise20ChannelCount = params.pointwise20ChannelCount;
    this.pointwise20Bias = params.pointwise20Bias;
    this.pointwise20ActivationId = params.pointwise20ActivationId;
    this.pointwise20ActivationName = params.pointwise20ActivationName;

    this.nSqueezeExcitationChannelCountDivisor = params.nSqueezeExcitationChannelCountDivisor;
    this.nSqueezeExcitationChannelCountDivisorName = params.nSqueezeExcitationChannelCountDivisorName;
    this.bSqueezeExcitationPrefix = params.bSqueezeExcitationPrefix;

    this.nActivationId = params.nActivationId;
    this.nActivationName = params.nActivationName;

    this.bKeepInputTensor = params.bKeepInputTensor;

    // The parameters which are inferenced from the above parameters.
    {
      this.inputTensorCount = params.inputTensorCount;
      this.input1_height = params.input1_height;
      this.input1_width = params.input1_width;
      this.input1_channelCount = params.input1_channelCount;

      this.bDepthwiseRequestedAndNeeded = params.bDepthwiseRequestedAndNeeded;
      this.depthwisePadInfo = params.depthwisePadInfo;

      this.bDepthwise2Requested = params.bDepthwise2Requested;
      this.bConcat1Requested = params.bConcat1Requested;
      this.bAddInputToOutputRequested = params.bAddInputToOutputRequested;
      this.bConcat2ShuffleSplitRequested = params.bConcat2ShuffleSplitRequested;
      this.bHigherHalfDifferent = params.bHigherHalfDifferent;
      this.bHigherHalfDepthwise2 = params.bHigherHalfDepthwise2;
      this.pointwise20_channelShuffler_outputGroupCount = params.pointwise20_channelShuffler_outputGroupCount;

      this.pointwise21ChannelCount = params.pointwise21ChannelCount;
      this.pointwise21Bias = params.pointwise21Bias;
      this.pointwise21ActivationId = params.pointwise21ActivationId;
      this.pointwise21ActivationName = params.pointwise21ActivationName;
      
      this.squeezeExcitationActivationId = params.squeezeExcitationActivationId;
      this.squeezeExcitationActivationName = params.squeezeExcitationActivationName;

      this.outputTensorCount = params.outputTensorCount;
    }

    params.disposeResources_and_recycleToPool();
    params = null;

    // No matter whether the channel shuffler is used, it is always recorded in data member.
    this.channelShuffler_ConcatPointwiseConv = channelShuffler_ConcatPointwiseConv;

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.


    // 2. pointwise1

    // 2.1 Prepare Input TensorPlaceholder and Operation Array.

    // 2.1.1 Prepare partial pointwise1 arguments.

//!!! ...unfinished... (2022/06/14)
// Perhaps, moved to Block.Params.set_Xxx_by()
// inputHeight1, inputWidth1, 
// inputChannelCount_lowerHalf_pointwise1, outputChannelCount_lowerHalf_pointwise1


    // Assume not higher-half-different.
    let nHigherHalfDifferent_pointwise1 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE;
    let inputChannelCount_lowerHalf_pointwise1 = undefined;
    let outputChannelCount_lowerHalf_pointwise1 = undefined;

    let depthwise1_channelShuffler_outputGroupCount = 0; // (i.e. Whether Shuffle.)

//!!! ...unfinished... (2021/11/15) What if ( depthwise_AvgMax_Or_ChannelMultiplier > 1 )?

    if ( this.bHigherHalfDifferent == true ) {

      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) )
      // (i.e. pointwise1 of ShuffleNetV2_ByMobileNetV1's head)
      if ( this.bHigherHalfDepthwise2 == true ) {

        inputChannelCount_lowerHalf_pointwise1 = this.input0_channelCount;

        if ( this.pointwise1ChannelCount > 0 ) {
          nHigherHalfDifferent_pointwise1 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF;
          outputChannelCount_lowerHalf_pointwise1 = this.pointwise1ChannelCount; // For depthwise1 (by specified channel count)

        } else {

!!! ...unfinished... (2022/07/12)
// when
//   - ShuffleNetV2_byMobileNetV1_head and
//   - (pointwise1ChannelCount == 0 )
//       i.e. ( nHigherHalfDifferent_pointwise1
//                == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH )
//   - ( nHigherHalfDifferent_depthwise1 == ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_DEPTHWISE2 ) and 
//   - depthwise ( channelMultiplier == 1 )
//
// Use depthwise ( channelMultiplier == 2 ) could achieve almost the same effect but depthwise is pre-channel-shuffled.
// So, in this case, pointwise1 (higher half copy lower, lower half pass through) could be discarded. But
// the ( channelShuffler_inputGroupCount == 2 ) should be used for prefix squeeze-and-excitation and pointwise2. So that
// they could undo the depthwise's pre-channel-shuffling.
//
// depthwise1_channelShuffler_outputGroupCount = this.pointwise20_channelShuffler_outputGroupCount; // (i.e. Whether Shuffle.)
//
// Problem: When depthwise from ( channelMultiplier == 1 ) to ( channelMultiplier == 2 ), what about the filters weights?
//
//

          nHigherHalfDifferent_pointwise1
            = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH;

          // Since this is an almost copy operation, bias and activation is not necessary.
          this.pointwise1Bias = false;
          this.pointwise1ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

          outputChannelCount_lowerHalf_pointwise1 = this.input0_channelCount; // For depthwise1 (by pass-through-input-to-output)
        }

        // Enlarge pointwise1 to ( pointwise1_channel_count + input_channel_count ) so that depthwise1 could include depthwise2.
        this.pointwise1ChannelCount
          = (  outputChannelCount_lowerHalf_pointwise1 // For depthwise1.
             + this.input0_channelCount                // For depthwise2 (by depthwise1).
            );

      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY (6) )
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL (7) )
      // (i.e. pointwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)
      } else {

        // So that bHigherHalfPassThrough (or bAllPassThrough).
        nHigherHalfDifferent_pointwise1 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH;

        let pointwise1_higherHalfPassThrough = ChannelCountCalculator.HigherHalfPassThrough.Pool.get_or_create_by(
          this.input0_channelCount, this.pointwise1ChannelCount );

        inputChannelCount_lowerHalf_pointwise1 = pointwise1_higherHalfPassThrough.inputChannelCount_lowerHalf;
        outputChannelCount_lowerHalf_pointwise1 = pointwise1_higherHalfPassThrough.outputChannelCount_lowerHalf;

        pointwise1_higherHalfPassThrough.disposeResources_and_recycleToPool();
        pointwise1_higherHalfPassThrough = null;
      }

    // In other cases, Pointwise.Base could handle ( pointwise1ChannelCount == 0 ) correctly.
    }

    // 2.1.2 Create inputs tensor placeholders and sub operation array.
    {
      if ( inputScaleBoundsArray0.length != this.input0_channelCount )
        throw Error( `Block.Base.initer(): `
          + `inputScaleBoundsArray0's length ( ${inputScaleBoundsArray0.length} ) should be the same as `
          + `input0's channel count ( ${this.input0_channelCount} ).`
        );

      let inputChannelCount_higherHalf_pointwise1 = this.input0_channelCount - inputChannelCount_lowerHalf_pointwise1;

      this.input0 = TensorPlaceholder.Base.Pool.get_or_create_by();
      this.input0.set_height_width_channelCount_scaleBoundsArray(
        this.input0_height, this.input0_width,

//!!! (2022/07/12 Remarked) should be input higher half ( not ouput lower half ).
//        this.input0_channelCount, inputChannelCount_lowerHalf_pointwise1, outputChannelCount_lowerHalf_pointwise1,
        this.input0_channelCount, inputChannelCount_lowerHalf_pointwise1, inputChannelCount_higherHalf_pointwise1,

        inputScaleBoundsArray0 );

      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY (3) )
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL (4) )
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY (10) )
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL (11) )
      //
      if ( this.inputTensorCount > 1 ) {

        if ( inputScaleBoundsArray1.length != this.input1_channelCount )
          throw Error( `Block.Base.initer(): `
            + `inputScaleBoundsArray1's length ( ${inputScaleBoundsArray1.length} ) should be the same as `
            + `input1's channel count ( ${this.input1_channelCount} ).`
          );

        this.input1 = TensorPlaceholder.Base.Pool.get_or_create_by();
        this.input1.set_height_width_channelCount_scaleBoundsArray(
          this.input1_height, this.input1_width, this.input1_channelCount,
          undefined, undefined, // channelCount_lowerHalf, channelCount_higherHalf
          inputScaleBoundsArray1 );
      }

      this.operationArray = Operation.TwinArray.Pool.get_or_create_by( this.input0, this.input1, this.outputTensorCount );
    }

    // Note: Once an operation is created (even if it just do nothing (e.g. ( pointwise1.bExisted == false ) ), it should always
    //       be appended to this.operationArray. The reason is that a created operation has already registered as the finalOperation
    //       of .endingInputX. Unless it could be un-registered, otherwise it should always be put into queue.


    // 2.2 The pointwise1 convolution.
    if ( this.pointwise1ChannelCount > 0 ) {

      let pointwise1 = Operation.Pointwise_SameWhenPassThrough.Pool.get_or_create_by(
        this.operationArray.endingInput0,
        this.pointwise1ChannelCount, this.pointwise1Bias, this.pointwise1ActivationId,
        nHigherHalfDifferent_pointwise1,
        outputChannelCount_lowerHalf_pointwise1,
        0, // Default channelShuffler_inputGroupCount for pointwise1 is zero (never positive).
        0  // Default channelShuffler_outputGroupCount for pointwise1 is zero (never positive).
      );

      if ( !pointwise1.init( inputWeightArray, this.weightElementOffsetEnd ) )
        return false;  // e.g. input array does not have enough data.
      this.weightElementOffsetEnd = pointwise1.weightElementOffsetEnd;

      this.operationArray.operation_append( pointwise1 );
    }

    ++progressToAdvance.value;
    yield progressRoot;  // pointwise1 filters was ready. Report progress.

    // 3. The depthwise operation.
    //
    // Note: When ( pad == valid ), it seems that depthwise (avg/max pooling) filter size can not greater than input image size.

    // The depthwise2 processes the input0 directly (i.e. not the pointwise1 result of input0, and not input1).
    let depthwise2_input0 = this.input0; // (Note: Not .endingInput0, Not .input1)

    // Only if depthwise operation is requested and necessary, create them.
    if ( this.bDepthwiseRequestedAndNeeded ) {

      // 3.1 The depthwise1 operation.
      let depthwise1;
      {
        depthwise1 = Operation.Depthwise_SameWhenPassThrough.Pool.get_or_create_by(
          this.operationArray.endingInput0,
          this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth,
          this.depthwiseStridesPad, this.depthwiseBias, this.depthwiseActivationId,
          this.depthwise1_nHigherHalfDifferent,
          ???channelShuffler_inputGroupCount, ???channelShuffler_outputGroupCount
        );

        if ( !depthwise1.init( inputWeightArray, this.weightElementOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.weightElementOffsetEnd = depthwise1.weightElementOffsetEnd;
      }

      // 3.2 The depthwise2 operation.
      //
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD (2) )
      //
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD (9) )
      // (i.e. ShuffleNetV2_ByPointwise21's head with ( pointwise1ChannelCount >= 1 ))
      //
      let depthwise2;
      if ( this.bDepthwise2Requested ) {

        // Q: Why does depthwise2 use the same configuration as depthwise1?
        // A: To ensure both result have the same ( height, width ) so that could be inputted to concatenator). This is especially
        //    true for StridesPad.
        depthwise2 = Operation.Depthwise_SameWhenPassThrough.Pool.get_or_create_by(
          depthwise2_input0,
          this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth,
          this.depthwiseStridesPad, this.depthwiseBias, this.depthwiseActivationId,
          ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE, // depthwise2 never has higher-half-different.
          ???channelShuffler_inputGroupCount, ???channelShuffler_outputGroupCount
        );

        if ( !depthwise2.init( inputWeightArray, this.weightElementOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.weightElementOffsetEnd = depthwise2.weightElementOffsetEnd;

        // Note:
        //   - If ( depthwise2.bExisted == true ), the depthwise2 is requested and created. It means ONE_INPUT_TWO_DEPTHWISE.
        //
        //   - If ( depthwise2.bExisted == false ), the depthwise2 is requested but not created. It means no depthwise operation
        //     (i.e. ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ). In this case, the depthwise2 should be short circuit to
        //     inputTensor[ 0 ] (i.e. not inputTensor[ 1 ]).

      } else {
        // Since the depthwise2 is not requested, it is always short circuit to input1 (i.e. not input0).
      }

      this.operationArray.operation_append( depthwise1, depthwise2 );

    // Otherwise, the depthwise operation is either ( not requested ) or ( requested but not necessary ).
    // The later case could improve performance.
    } else {

      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD (2) )
      //
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD (9) )
      // (i.e. ShuffleNetV2_ByPointwise21's head with ( pointwise1ChannelCount >= 1 ))
      //
      // Even if no depthwise, however, a .endingInput1 is necessary for concat1 to operate on. So create a dummy one.
      if ( this.bDepthwise2Requested ) {
        // Note: The two inputs of depthwise12Dummy might be the same one in fact.
        let depthwise12Dummy = Operation.Dummy.Pool.get_or_create_by( this.operationArray.endingInput0, depthwise2_input0, 2 );
        this.operationArray.operation_append( depthwise12Dummy );
      }
    }

    ++progressToAdvance.value;
    yield progressRoot;  // depthwise filters was ready. Report progress.

    // 4. Concat1
    if ( this.bConcat1Requested ) {
      let concat1 = Operation.ConcatAlongAxisId2.Pool.get_or_create_by( this.operationArray.endingInput0, this.operationArray.endingInput1 );
      this.operationArray.operation_append( concat1 );
    }

    ++progressToAdvance.value;
    yield progressRoot;  // concat1 was ready. Report progress.

    // 5. The squeeze-and-excitation prefix pointwise2

    // 5.1 Determine Pointwise_HigherHalfDifferent. (Both squeeze-and-excitation and pointwise2 needs it.)

    // Assume not higher-half-different.
    let nHigherHalfDifferent_pointwise2 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE;
    let outputChannelCount_lowerHalf_pointwise2 = undefined;
    let pointwise20_channelShuffler_outputGroupCount = this.pointwise20_channelShuffler_outputGroupCount; // (i.e. Whether Shuffle.)

    if ( this.bHigherHalfDifferent == true ) {

      // In this case, it should be according to half of pointwise20ChannelCount (just like pointwise1).
      // Note: Unlike pointwise1ChannelCount (which may be zero), pointwise20ChannelCount is always positive.
      outputChannelCount_lowerHalf_pointwise2 = Math.ceil( this.pointwise20ChannelCount / 2 );

      // For bHigherHalfAnotherPointwise(Shuffle) (i.e. ( pointwise20ChannelCount > 0 ) ).
      //
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) )
      // (i.e. pointwise2 of ShuffleNetV2_ByMobileNetV1's head)
      if ( this.bHigherHalfDepthwise2 == true ) {
        nHigherHalfDifferent_pointwise2 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_ANOTHER_POINTWISE;

      // For bHigherHalfPassThrough(Shuffle) (i.e. ( pointwise20ChannelCount > 0 ) ).
      //
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY (6) )
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL (7) )
      // (i.e. pointwise2 of ShuffleNetV2_ByMobileNetV1's body/tail)
      } else {
        nHigherHalfDifferent_pointwise2 = ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH;
      }
    }

    // 5.2 The squeeze-and-excitation prefix pointwise2
    if ( this.bSqueezeExcitationPrefix )
      if ( !Base.operationArray_append_SqueezeExcitation.call( this,
              nHigherHalfDifferent_pointwise2, inputWeightArray,
              depthwise1_channelShuffler_outputGroupCount // Prefix squeeze-and-excitation's channels are shuffled if depthwise1 did.
            )
         )
        return false;  // e.g. input array does not have enough data.

    // 5.3
    ++progressToAdvance.value;
    yield progressRoot;  // squeeze-and-excitation (prefix pointwise2) was ready. Report progress.

    // 6. The pointwise2 convolution.
    {
      // 6.1 Pointwise20
      //
      // Note:
      //   - When ( bHigherHalfDifferent == true ) and ( channelShuffler_outputGroupCount > 0 ), it means output channels will be shuffled.
      //
      //   - When ( pointwise20ChannelCount == 0 ), it usually means no pointwise20 (i.e. ( pointwise20.bExisted == false ) ).
      //
      //   - When both ( pointwise20ChannelCount == 0 ) and ( bHigherHalfDifferent == true )
      //       and ( channelShuffler_outputGroupCount > 0 ), the pointwise20 will exist (i.e. ( pointwise20.bExisted == true ) ).
      //       Otherwise, the output channels could not be shuffled. In this case, it will pass through all input to output,
      //       but the output will be channel shuffled.
      //
      //       - However, this situation is difficult to be handled. We re-design Params so that the pointwise20ChannelCount is always
      //           not zero.
      //
      let pointwise20 = Operation.Pointwise_SameWhenPassThrough.Pool.get_or_create_by(
        this.operationArray.endingInput0,
        this.pointwise20ChannelCount, this.pointwise20Bias, this.pointwise20ActivationId,
        nHigherHalfDifferent_pointwise2, outputChannelCount_lowerHalf_pointwise2,
        0, // No channelShuffler_inputGroupCount.
        pointwise20_channelShuffler_outputGroupCount
      );

      if ( !pointwise20.init( inputWeightArray, this.weightElementOffsetEnd ) )
        return false;  // e.g. input array does not have enough data.
      this.weightElementOffsetEnd = pointwise20.weightElementOffsetEnd;

      // 6.2 Pointwise21
      let pointwise21;
      if ( this.pointwise21ChannelCount > 0 ) {

        let pointwise21_input0;
        {
          if ( this.operationArray.endingInput1 )
            pointwise21_input0 = this.operationArray.endingInput1; // If there is .endingInput1, use it as pointwise21's input.
          else
            pointwise21_input0 = this.operationArray.endingInput0;
        }

        pointwise21 = Operation.Pointwise_SameWhenPassThrough.Pool.get_or_create_by(
          pointwise21_input0,
          this.pointwise21ChannelCount, this.pointwise21Bias, this.pointwise21ActivationId,
          nHigherHalfDifferent_pointwise2, outputChannelCount_lowerHalf_pointwise2,
          0, // No channelShuffler_inputGroupCount.
          pointwise20_channelShuffler_outputGroupCount
        );

        // Note: Strictly speaking, sometimes pointwise21 is dependent on depthwise2. But it does not matter for BoundsArraySet
        // because depthwise1 and depthwise2 should have the same output value bounds.
        //
        if ( !pointwise21.init( inputWeightArray, this.weightElementOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.weightElementOffsetEnd = pointwise21.weightElementOffsetEnd;

      } else { // Since pointwise21 is not requested (i.e. channel count is not positive), do not create the object for saving memory.
      }

      // 6.3 Pointwise2 (= Pointwise20 + Pointwise21 )

      this.operationArray.operation_append( pointwise20, pointwise21 );
    }

    // 6.4
    ++progressToAdvance.value;
    yield progressRoot;  // pointwise2 filters was ready. Report progress.

    // 7. The squeeze-and-excitation postfix pointwise2
      
    // 7.1
    if ( !this.bSqueezeExcitationPrefix ) // (i.e. postfix)
      if ( !Base.operationArray_append_SqueezeExcitation.call( this,
              nHigherHalfDifferent_pointwise2, inputWeightArray,
              pointwise20_channelShuffler_outputGroupCount, // Postfix squeeze-and-excitation's channels are shuffled along input channels.
            )
         )
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
      // Usually, if no pointwise20, then no addInput0ToPointwise20.
      // Usually, if no pointwise21, then no addInput0ToPointwise21.
      //
      // However, there is one exception: When both no pointwise20 and no pointwise21, there might be addInput0ToPointwise20.
      // Fortunately, now pointwise20ChannelCount is always not zero. So this situation will not happen.
      //

      let addInput0ToPointwise20;
      if ( this.operationArray.endingInput0?.is_height_width_channelCount_same_byTensorPlaceholder( this.input0 ) ) {
        addInput0ToPointwise20 = Operation.AddTwoTensors.Pool.get_or_create_by( this.input0, this.operationArray.endingInput0 );
      }

      // Note: Only input0 (not input1) will be used to add to output.
      let addInput0ToPointwise21;
      if ( this.operationArray.endingInput1?.is_height_width_channelCount_same_byTensorPlaceholder( this.input0 ) ) {
        addInput0ToPointwise21 = Operation.AddTwoTensors.Pool.get_or_create_by( this.input0, this.operationArray.endingInput1 );
      }

      this.operationArray.operation_append( addInput0ToPointwise20, addInput0ToPointwise21 );
    }

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
          throw Error(
            `Block.Base.initer(): When concat2-shuffle-split, `
              + `output channel count ( ${this.outputTensorCount} ) must be either 1 or 2.`
          );
          break;
      }

      let concat2ShuffleSplit = Operation.ConcatShuffleSplit.Pool.get_or_create_by(
        this.operationArray.endingInput0, this.operationArray.endingInput1,
        channelShuffler_ConcatPointwiseConv, bShuffleSplit );

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

//!!! (2022/06/10 Temp Remarked) For debug.
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
   * @param {Params} params
   *   A Params object. The params.init() will be called to extract parameters. This params will be owned and destroyed by this .init().
   * So caller should not use it again.
   *
   * @param {number[]|Float32Array} inputWeightArray
   *   The underlying weights source array to be extracted from. It will not be kept by this object.
   *
   * @return {boolean}
   *   Return true if successfully (and progressParent.valuePercentage will be equal to 100).
   *   Return false if failed (and progressParent.valuePercentage will be less than 100).
   */
  init(
    progressParent, inputWeightArray, weightElementOffsetBegin, params,
    inputScaleBoundsArray0, inputScaleBoundsArray1, channelShuffler_ConcatPointwiseConv,
  ) {

    progressParent = progressParent ?? ( ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let initer = this.initer(
      progressParent, inputWeightArray, weightElementOffsetBegin, params,
      inputScaleBoundsArray0, inputScaleBoundsArray1, channelShuffler_ConcatPointwiseConv,
    );

    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   *
   * @override
   */
  disposeResources() {
    this.apply = null;

    // 1. Because .outputX are not created by this block, they should not be released by this block.
    //
    // Note: The .outputX are just read only property returning .operationArray.outputX.

    // 2.
    if ( this.operationArray ) {
      this.operationArray.disposeResources_and_recycleToPool();
      this.operationArray = null;
    }

    // 3. Because .inputX are created by this block (but .inputX.scaleBoundArray are not), they should be released by this block
    //    (except .inputX.scaleBoundArray).
    {
      if ( this.input1 ) {
        this.input1.scaleBoundsArray = null; // It is referenced to inputScaleBoundsArray0 which should not be released here. So nullify it.
        this.input1.disposeResources_and_recycleToPool();
        this.input1 = null;
      }
 
      if ( this.input0 ) {
        this.input0.scaleBoundsArray = null; // It is referenced to inputScaleBoundsArray1 which should not be released here. So nullify it.
        this.input0.disposeResources_and_recycleToPool();
        this.input0 = null;
      }
    }

    // 4.
    if ( this.channelShuffler_ConcatPointwiseConv ) {
      this.channelShuffler_ConcatPointwiseConv = null; // Note: Do not dispose the channel shuffler here.
    }

    // 5.
    this.weightElementOffsetBegin = this.weightElementOffsetEnd = -1;
    this.bInitOk = false;

    super.disposeResources();
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
   *   The object to be modified. The .operationArray and .weightElementOffsetEnd will be modified.
   *
   * @param {ValueDesc.Pointwise_HigherHalfDifferent} nPointwise_HigherHalfDifferent
   *   The HigherHalfDifferent type for squeeze-and-excitation.
   *
   * @param {Float32Array} inputWeightArray
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @return {boolean} Return true, if succeeded.
   */
  static operationArray_append_SqueezeExcitation(
    nPointwise_HigherHalfDifferent, inputWeightArray,
    channelShuffler_outputGroupCount ) {

    if ( this.nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) // (-2)
      return true; // No sequeeze-and-excitation.

    // Note1: Inside squeeze-and-excitation, all depthwsie and pointwise convolutions are constant-when-pass-through
    //        so that the result for pass-through parts will not affect input when multiply to input.
    //

    // 0.

    let input0 = this.operationArray.endingInput0; // will be used for output because output dimension should be the same as input.
    let input1 = this.operationArray.endingInput1;

    // For
    //   - ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2 (8)
    //   - ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD (9)
    //
    // Although they have pointwise21, however, their squeeze-and-excitation-1 uses .endingInput0 (i.e. not endingInput1) as input.
    // So, if there is no input1, use input0 instead.
    //
    if ( !input1 )
      input1 = input0;

    // Assume .endingInput0 and endingInput1 have the same height and width. So, checking .endingInput0 should be enough.
    let inputHeight = input0.height;
    let inputWidth = input0.width;

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

      let squeezeDepthwise0;
      {
        squeezeDepthwise0 = Operation.Depthwise_ConstantWhenPassThrough.Pool.get_or_create_by(
          this.operationArray.endingInput0,
          squeezeAvgMax_Or_ChannelMultiplier, squeezeFilterHeight, squeezeFilterWidth, squeezeStridesPad,
          squeezeBias, squeezeActivationId, squeezeHigherHalfDifferent,
          0, 0, // No channelShuffler_inputGroupCount, No channelShuffler_outputGroupCount. Because avg pooling can not do it.
        );

        if ( !squeezeDepthwise0.init( inputWeightArray, this.weightElementOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.weightElementOffsetEnd = squeezeDepthwise0.weightElementOffsetEnd;
      }

      let squeezeDepthwise1;
      if ( this.pointwise21ChannelCount > 0 ) {
        squeezeDepthwise1 = Operation.Depthwise_ConstantWhenPassThrough.Pool.get_or_create_by(
          this.operationArray.endingInput1 ? this.operationArray.endingInput1 : this.operationArray.endingInput0,
          squeezeAvgMax_Or_ChannelMultiplier, squeezeFilterHeight, squeezeFilterWidth, squeezeStridesPad,
          squeezeBias, squeezeActivationId, squeezeHigherHalfDifferent,
          0, 0, // No channelShuffler_inputGroupCount, No channelShuffler_outputGroupCount. Because avg pooling can not do it.
        );

        if ( !squeezeDepthwise1.init( inputWeightArray, this.weightElementOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.weightElementOffsetEnd = squeezeDepthwise1.weightElementOffsetEnd;
      }

      this.operationArray.operation_append( squeezeDepthwise0, squeezeDepthwise1 );
    }

    // 2. intermediatePointwise
    if ( bIntermediate ) {

      let intermediatePointwise0;
      {
        intermediatePointwise0 = Base.SequeezeExcitation_intermediatePointwise_create_init.call( this,
          this.operationArray.endingInput0,
          this.squeezeExcitationActivationId, nPointwise_HigherHalfDifferent, inputWeightArray,
          channelShuffler_outputGroupCount );

        if ( !intermediatePointwise0 )
          return false;  // e.g. input array does not have enough data.
      }

      let intermediatePointwise1;
      if ( this.pointwise21ChannelCount > 0 ) {
        intermediatePointwise1 = Base.SequeezeExcitation_intermediatePointwise_create_init.call( this,
          this.operationArray.endingInput1 ? this.operationArray.endingInput1 : this.operationArray.endingInput0,
          this.squeezeExcitationActivationId, nPointwise_HigherHalfDifferent, inputWeightArray,
          channelShuffler_outputGroupCount );

        if ( !intermediatePointwise1 )
          return false;  // e.g. input array does not have enough data.
      }

      this.operationArray.operation_append( intermediatePointwise0, intermediatePointwise1 );
    }

    // 3. excitationPointwise
    {
      const excitationPointwise_bBias = true; // the ending of squeeze-and-excitation should always have bias (even if no activation).

      // Since the previous operation's output channels has been shuffled, use the same as shuffler in input channels to neutralize its
      // effect.
      const excitationPointwise_channelShuffler_inputGroupCount = channelShuffler_outputGroupCount;

      let excitationPointwise0;
      {
        const excitationPointwise0_outputChannelCount = input0.channelCount; // excitation's output should have same channel count as input.
        const excitationPointwise0_outputChannelCount_lowerHalf = input0.channelCount_lowerHalf;
        const excitationPointwise0_nActivationId = this.squeezeExcitationActivationId;

        excitationPointwise0 = Operation.Pointwise_ConstantWhenPassThrough.Pool.get_or_create_by(
          this.operationArray.endingInput0,
          excitationPointwise0_outputChannelCount, excitationPointwise_bBias, excitationPointwise0_nActivationId,
          nPointwise_HigherHalfDifferent, excitationPointwise0_outputChannelCount_lowerHalf,
          excitationPointwise_channelShuffler_inputGroupCount,
          channelShuffler_outputGroupCount // Keep the same output channels shuffling.
        );

        if ( !excitationPointwise0.init( inputWeightArray, this.weightElementOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.weightElementOffsetEnd = excitationPointwise0.weightElementOffsetEnd;
      }

      let excitationPointwise1;
      if ( this.pointwise21ChannelCount > 0 ) {
        const excitationPointwise1_outputChannelCount = input1.channelCount;
        const excitationPointwise1_outputChannelCount_lowerHalf = input1.channelCount_lowerHalf;
        const excitationPointwise1_nActivationId = this.squeezeExcitationActivationId;

        excitationPointwise1 = Operation.Pointwise_ConstantWhenPassThrough.Pool.get_or_create_by(
          this.operationArray.endingInput1 ? this.operationArray.endingInput1 : this.operationArray.endingInput0,
          excitationPointwise1_outputChannelCount, excitationPointwise_bBias, excitationPointwise1_nActivationId,
          nPointwise_HigherHalfDifferent, excitationPointwise1_outputChannelCount_lowerHalf,
          excitationPointwise_channelShuffler_inputGroupCount,
          channelShuffler_outputGroupCount // Keep the same output channels shuffling.
        );

        if ( !excitationPointwise1.init( inputWeightArray, this.weightElementOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.weightElementOffsetEnd = excitationPointwise1.weightElementOffsetEnd;
      }

      this.operationArray.operation_append( excitationPointwise0, excitationPointwise1 );
    }

    // 4. Mutiply
    {
      let multiply0 = Operation.MultiplyTwoTensors.Pool.get_or_create_by( input0, this.operationArray.endingInput0 );

      let multiply1;
      if ( this.pointwise21ChannelCount > 0 ) {
        multiply1 = Operation.MultiplyTwoTensors.Pool.get_or_create_by( input1, this.operationArray.endingInput1 );
      }

      this.operationArray.operation_append( multiply0, multiply1 );
    }

    return true;
  }

  /**
   * @param {Block.Base} this
   *   The object to be modified. The .weightElementOffsetEnd will be modified.
   *
   * @param {TensorPlaceholder.Base} inputTensorPlaceholder
   *   The input tensor placeholder of this intermediate pointwise.
   *
   * @param {ValueDesc.Pointwise_HigherHalfDifferent} nPointwise_HigherHalfDifferent
   *   The HigherHalfDifferent type for squeeze-and-excitation.
   *
   * @param {Float32Array} inputWeightArray
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @return {Operation.Pointwise}
   *   Return the created (and initialized) intermediate pointwise of squeeze-and-excitation, if succeeded. Return null, if failed.
   */
  static SequeezeExcitation_intermediatePointwise_create_init(
    inputTensorPlaceholder, nActivationId, nPointwise_HigherHalfDifferent, inputWeightArray,
    channelShuffler_outputGroupCount ) {

    const intermediate_inputChannelCount = inputTensorPlaceholder.channelCount;
    const intermediate_inputChannelCount_lowerHalf = inputTensorPlaceholder.channelCount_lowerHalf;
    const intermediate_inputChannelCount_higherHalf = inputTensorPlaceholder.channelCount_higherHalf;

    if (   ( ( intermediate_inputChannelCount_lowerHalf == undefined ) && ( intermediate_inputChannelCount_higherHalf != undefined ) )
        || ( ( intermediate_inputChannelCount_lowerHalf != undefined ) && ( intermediate_inputChannelCount_higherHalf == undefined ) )
       )
      throw Error( `Block.Base.SequeezeExcitation_intermediatePointwise_create_init(): `
        + `intermediate_inputChannelCount_lowerHalf ( ${intermediate_inputChannelCount_lowerHalf} ) and `
        + `intermediate_inputChannelCount_higherHalf ( ${intermediate_inputChannelCount_higherHalf} ) `
        + `should be either both undefined or both non-undefined.`
      );

    let intermediate_outputChannelCount_lowerHalf;
    if ( intermediate_inputChannelCount_lowerHalf != undefined )
      intermediate_outputChannelCount_lowerHalf // Note: Using itself input channel count as dividend.
        = Math.ceil( intermediate_inputChannelCount_lowerHalf / this.nSqueezeExcitationChannelCountDivisor );

    let intermediate_outputChannelCount_higherHalf;
    if ( intermediate_inputChannelCount_higherHalf != undefined )
      intermediate_outputChannelCount_higherHalf // Note: Using itself input channel count as dividend.
        = Math.ceil( intermediate_inputChannelCount_higherHalf / this.nSqueezeExcitationChannelCountDivisor );

    let intermediate_outputChannelCount;
    {
      if ( ( intermediate_outputChannelCount_lowerHalf != undefined ) && ( intermediate_outputChannelCount_higherHalf != undefined ) )
        intermediate_outputChannelCount = intermediate_outputChannelCount_lowerHalf + intermediate_outputChannelCount_higherHalf;
      else
        intermediate_outputChannelCount = Math.ceil( intermediate_inputChannelCount / this.nSqueezeExcitationChannelCountDivisor );

      // Since higher-half is just pass-through, it could be discarded totally.
      //
      // Note: Only if no channel shuffling (i.e. ( channelShuffler_outputGroupCount != 0 )), this discarding could be done.
      //
      if ( nPointwise_HigherHalfDifferent == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ) // (4)
        if ( channelShuffler_outputGroupCount == 0 )
          intermediate_outputChannelCount = intermediate_outputChannelCount_lowerHalf;
    }

    const intermediate_nActivationId = nActivationId;

    // If it has no activation, it could be no bias because the next operation's (i.e. excitationPointwise) bias will achieve it.
    const intermediate_bBias = ( intermediate_nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) ? false : true;

    const intermediate_nHigherHalfDifferent = nPointwise_HigherHalfDifferent;

    // Since the previous operation's output channels has been shuffled, use the same as shuffler in input channels to neutralize its
    // effect.
    const intermediate_channelShuffler_inputGroupCount = channelShuffler_outputGroupCount;


    let intermediatePointwise = Operation.Pointwise_ConstantWhenPassThrough.Pool.get_or_create_by(
      inputTensorPlaceholder,
      intermediate_outputChannelCount, intermediate_bBias, intermediate_nActivationId,
      intermediate_nHigherHalfDifferent, intermediate_outputChannelCount_lowerHalf,
      intermediate_channelShuffler_inputGroupCount,
      channelShuffler_outputGroupCount // Keep the same output channels shuffling.
    );

    if ( !intermediatePointwise.init( inputWeightArray, this.weightElementOffsetEnd ) )
      return null;  // e.g. input array does not have enough data.
    this.weightElementOffsetEnd = intermediatePointwise.weightElementOffsetEnd;

    return intermediatePointwise;
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
    this.input0.realTensor = inputTensors[ 0 ];
    this.input1.realTensor = inputTensors[ 1 ];
    this.operationArray.apply();
    outputTensors[ 0 ] = this.operationArray.output0.realTensor;
    outputTensors[ 1 ] = this.operationArray.output1.realTensor;
  }

  /** Use inputTensors[ 0 ] and inputTensors[ 1 ]. Generate outputTensors[ 0 ] only (i.e. outputTensors[ 1 ] always null). */
  static apply__input0_input1__output0( inputTensors, outputTensors ) {
    this.input0.realTensor = inputTensors[ 0 ];
    this.input1.realTensor = inputTensors[ 1 ];
    this.operationArray.apply();
    outputTensors[ 0 ] = this.operationArray.output0.realTensor;
    outputTensors[ 1 ] = null;
  }

  /** Use inputTensors[ 0 ] only (i.e. ignore inputTensors[ 1 ]). Generate outputTensors[ 0 ] and outputTensors[ 1 ]. */
  static apply__input0__output0_output1( inputTensors, outputTensors ) {
    this.input0.realTensor = inputTensors[ 0 ];
    this.operationArray.apply();
    outputTensors[ 0 ] = this.operationArray.output0.realTensor;
    outputTensors[ 1 ] = this.operationArray.output1.realTensor;
  }

  /** Use inputTensors[ 0 ] only (i.e. ignore inputTensors[ 1 ]). Generate outputTensors[ 0 ] only (i.e. outputTensors[ 1 ] always null). */
  static apply__input0__output0( inputTensors, outputTensors ) {
    this.input0.realTensor = inputTensors[ 0 ];
    this.operationArray.apply();
    outputTensors[ 0 ] = this.operationArray.output0.realTensor;
    outputTensors[ 1 ] = null;
  }


  get inChannels0() {
    return this.input0.channelCount;
  }

  get inChannels1() {
    if ( this.input1 )
      return this.input1.channelCount;
    return 0;
  }


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


  /**
   * @return {string} The description string of all (adjusted) parameters of initer().
   *
   * @override
   */
  toString() {
    let str = ``
      + `inputTensorCount=${this.inputTensorCount}, `

      + `input0_height=${this.input0_height}, input0_width=${this.input0_width}, `
      + `inChannels0=${this.inChannels0}, `

      + `input1_height=${this.input1_height}, input1_width=${this.input1_width}, `
      + `inChannels1=${this.inChannels1}, `

      + `outputHeight=${this.outputHeight}, outputWidth=${this.outputWidth}, `
      + `outChannels0=${this.outChannels0}, outChannels1=${this.outChannels1}, outChannelsAll=${this.outChannelsAll}, `

      + `nConvBlockTypeName=${this.nConvBlockTypeName}(${this.nConvBlockTypeId}), `

      + `bHigherHalfDifferent=${this.bHigherHalfDifferent}, `
      + `bHigherHalfDepthwise2=${this.bHigherHalfDepthwise2}, `

      + `pointwise1ChannelCount=${this.pointwise1ChannelCount}, `
      + `pointwise1Bias=${this.pointwise1Bias}, `
      + `pointwise1ActivationName=${this.pointwise1ActivationName}(${this.pointwise1ActivationId}), `

      + `bDepthwiseRequestedAndNeeded=${this.bDepthwiseRequestedAndNeeded}, `
      + `bDepthwise2Requested=${this.bDepthwise2Requested}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=${this.depthwise_AvgMax_Or_ChannelMultiplier_Name}`
        + `(${this.depthwise_AvgMax_Or_ChannelMultiplier}), `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `depthwiseStridesPad=${this.depthwiseStridesPadName}(${this.depthwiseStridesPad}), `
      + `depthwiseBias=${this.depthwiseBias}, `
      + `depthwiseActivationName=${this.depthwiseActivationName}(${this.depthwiseActivationId}), `

      + `bConcat1Requested=${this.bConcat1Requested}, `

      + `pointwise20ChannelCount=${this.pointwise20ChannelCount}, `
      + `pointwise20Bias=${this.pointwise20Bias}, `
      + `pointwise20ActivationName=${this.pointwise20ActivationName}(${this.pointwise20ActivationId}), `

      + `pointwise21ChannelCount=${this.pointwise21ChannelCount}, `
      + `pointwise21Bias=${this.pointwise21Bias}, `
      + `pointwise21ActivationName=${this.pointwise21ActivationName}(${this.pointwise21ActivationId}), `

      + `nSqueezeExcitationChannelCountDivisorName=${this.nSqueezeExcitationChannelCountDivisorName}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `
      + `bSqueezeExcitationPrefix=${this.bSqueezeExcitationPrefix}, `
      + `squeezeExcitationActivationId=${this.squeezeExcitationActivationName}(${this.squeezeExcitationActivationId}), `

      + `bAddInputToOutputRequested=${this.bAddInputToOutputRequested}, `
      + `bConcat2ShuffleSplitRequested=${this.bConcat2ShuffleSplitRequested}, `
      + `pointwise20_channelShuffler_outputGroupCount=${this.pointwise20_channelShuffler_outputGroupCount}, `

      + `channelShuffler_ConcatPointwiseConv.outputGroupCount=`
        + `${ this.channelShuffler_ConcatPointwiseConv ? this.channelShuffler_ConcatPointwiseConv.outputGroupCount : 0 }, `

      + `outputTensorCount=${this.outputTensorCount}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

}

