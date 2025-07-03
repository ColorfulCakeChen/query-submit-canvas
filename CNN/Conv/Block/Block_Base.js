export { Block_Base as Base };

import * as HierarchicalNameable from "../../util/HierarchicalNameable.js";
import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
//import * as Weights from "../../Unpacker/Weights.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as Operation from "../Operation.js";
import * as ChannelShuffler from "../ChannelShuffler.js";
import { Params } from "./Block_Params.js";
import { InferencedParams } from "./Block_InferencedParams.js";
import { inputTensorPlaceholder_creator }
  from "./Block_inputTensorPlaceholder_creator.js";

/**
 * One block of a stage of convolution neural network. Basically, there are
 * three convolutions inside this object.
 *   - 1x1 pointwise convolution: change channel count. (exapnd)
 *   - NxN depthwise convolution: change channel count. (channel multiplier)
 *   - 1x1 pointwise convolution: change channel count. (shrink)
 *
 * The pointwise1 and depthwise convolution could exist or not exist. The
 * pointwise2 convolution must exist. If a convolution exists, it could have or
 * have no bias and activation function.
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
 * The channelShuffler of original ShuffleNetV2 is achieved by tf.reshape()
 * operation. According to experiments, however, the channelShuffler could be
 * acheived by pointwise convolution more efficiently (than reshape). This
 * results in our simplified ShuffleNetV2 structure: replacing
 * pointwise-concat-shuffle-split with concat-pointwise. It should be more
 * efficient because less operations are used than original structure.
 *
 *
 * 
 * Fused Convolution
 * 
 * Q: Combine depthwise-pointwise-bias into one conv2d. Compare these two
 *    architecture's performance in GPU (WebGL). Is combined faster in GPU?
 *
 * A: No. Fused conv2d is slower than depthwise-pointwise-bias in WebGL.
 *
 * 
 *
 * @member {boolean} bInitOk
 *   If true, this object initialized (i.e. initer()) successfully.
 *
 * @member {number} weightElementOffsetBegin
 *   The position which is started (inclusive) to extract from inputWeightArray
 * by initer().
 *
 * @member {number} weightElementOffsetEnd
 *   The position which is ended to (non-inclusive) extract from
 * inputWeightArray by initer(). Where to extract next weights. Only meaningful
 * when ( this.bInitOk == true ).
 *
 * @member {number} inputTensorCount
 *   How many input tensors will be used by apply().
 *
 * @member {number} input1_height
 *   The height of the second input (i.e. input1). If there is no input1, it
 * will be 0. This is inferenced from other parameters. The input1's height of
 * Block.apply() should match this value.
 *
 * @member {number} input1_width
 *   The width of the second input (i.e. input1). If there is no input1, it
 * will be 0. This is inferenced from other parameters. The input1's width of
 * Block.apply() should match this value.
 *
 * @member {number} input1_channelCount
 *   The channel count of the second input (i.e. input1). If there is no
 * input1, it will be 0. This is inferenced from other parameters. The input1's
 * channel count of Block.apply() should match this value.
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
 *   If true, the concat2 (after pointwise2) is needed. It may or may not
 * follow channel shuffling and splitting.
 *
 * @member {boolean} bAddInputToOutputRequested
 *   If true, the input (in this case, the main input (i.e. input0)) will be
 * added to the output for achieving skip connection.
 *
 * @member {boolean} bAddInputToOutput0
 *   If true, the input (in this case, the main input (i.e. input0)) is added
 * to the output0 for achieving skip connection.
 *
 * @member {boolean} bAddInputToOutput1
 *   If true, the input (in this case, the main input (i.e. input0)) is added
 * to the output1 for achieving skip connection.
 *
 * @member {boolean} bHigherHalfDifferent
 *   Only if ( channelShuffler != null ), this is meaningful. If true, the
 * higher half input channels are processed differently. For pointwise
 * convolution, the higher half may copy lower half, or the higher half may
 * just pass through the input to output. For depthwise convolution, please
 * see bHigherHalfDepthwise2.
 *
 * @member {boolean} bHigherHalfDepthwise2
 *   Only if ( bHigherHalfDifferent == true ), this is meaningful. If true,
 * the depthwise1 will use higher half channels to achieve the depthwise2. If
 * false, the depthwise1's higher half channels just pass through the input to
 * output.
 *
 * @member {number} pointwise20_channelShuffler_outputGroupCount
 *   The output group count of the pointwise20's channel shuffler when
 * ( nHigherHalfDifferent ==
 * ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ).
 * Either 0 or 2. Usually 2 ony if SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD or
 * SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY.
 *
 * @member {number} pointwise21ChannelCount
 *   The output channel count of the second pointwise2 convolution. If
 * ( pointwise21ChannelCount == 0 ), it means pointwise21 does not existed.
 *
 * @member {number} outputTensorCount
 *   How many output tensors will be generated by apply(). At least 1. At most
 * 2.
 *
 * @member {string} pointwise1ActivationName
 *   The activation function id (Params.pointwise1ActivationId.valueDesc.Ids.Xxx)
 * after the first pointwise convolution.
 *
 * @member {string} depthwise_AvgMax_Or_ChannelMultiplier_Name
 *   Depthwise operation name.
 *
 * @member {string} depthwiseActivationName
 *   The activation function name (Params.depthwiseActivationId.valueDesc.Ids.Xxx)
 * after depthwise convolution.
 *
 * @member {string} pointwise20ActivationName
 *   The activation function id (Params.pointwise20ActivationId.valueDesc.Ids.Xxx)
 * after the first pointwise2 convolution.
 *
 * @member {string} pointwise21ActivationName
 *   The name of activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx)
 * after the second pointwise2 convolution. It is only meaningful if
 * ( pointwise21ChannelCount > 0 ) (i.e. ( bPointwise21 == true ) and
 * ( pointwise20ChannelCount > 0 ) ).
 *
 * @member {number} input0_channelCount
 *   The channel count of the first input tensor (i.e. inputTensors[ 0 ]). This
 * is the same as this.input0_channelCount (from initer()).
 *
 * @member {number} input1_channelCount
 *   The channel count of the second input tensor (i.e. inputTensors[ 1 ]). It
 * is zero or positive (never negative).
 *
 * @member {TensorPlaceholder.Base} input0
 *   The TensorPlaceholder object which represents this operation's 1st input.
 *
 * @member {TensorPlaceholder.Base} input1
 *   The TensorPlaceholder object which represents this operation's 2nd input.
 * It exists only if ( this.inputTensorCount > 1 ).
 *
 * @member {number} output_height
 *   The height of the output image. If depthwise does not exist, it will be
 * the same as input0_height. Otherwise, depthwise determines output_height.
 *
 * @member {number} output_width
 *   The width of the output image. If depthwise does not exist, it will be the
 * same as input0_width. Otherwise, depthwise determines output_width.
 *
 * @member {number} output0_channelCount
 *   The channel count of the outputTensor[ 0 ]. In theory, even if
 * ( pointwise20ChannelCount == 0 ) and ( pointwise21ChannelCount == 0 ),
 * this will still be non-zero. However, now the pointwise20ChannelCount should
 * always be not zero. 
 *
 * @member {number} output1_channelCount
 *   The channel count of the outputTensor[ 1 ]. If
 * ( pointwise21ChannelCount == 0 ), this will be zero.
 *
 * @member {number} output_channelCount
 *   The channel count of all output tensors (i.e. both outputTensor[ 0 ] and
 * outputTensor[ 1 ]).
 *
 * @member {TensorPlaceholder.Base} output0
 *   The TensorPlaceholder object which represents this operation's 1st output.
 *
 * @member {TensorPlaceholder.Base} output1
 *   The TensorPlaceholder object which represents this operation's 2nd output.
 * It exists only if ( this.outputTensorCount >= 2 ).
 *
 * @member {ChannelShuffler.ConcatPointwiseConv} channelShuffler_ConcatPointwiseConv
 *   The channelShuffler. It must be implemented by
 * ChannelShuffler.ConcatPointwiseConv with ( outputGroupCount == 2 ).
 *
 *     - It will not be disposed by this object (i.e. it is supposed to be
 *         shared with outter callers).
 *
 *     - The channelShuffler's outputGroupCount must be 2 (i.e. split into two
 *         groups after channel-shuffling).
 *
 *     - It is used when:
 *       - ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD )
 *         ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY )
 *         ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL )
 *         - The channelShuffler_ConcatPointwiseConv will be used.
 *         - The channelShuffler.shuffleInfo.totalChannelCount should be the
 *             same as the channel count of the concatenation of pointwise20
 *             and input1.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they
 * are not used in tensors. Including inferenced weights, if they are used in
 * tensors. (Not including channelShuffler.)
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not
 * including Params, because they are not used in tensors. Not including
 * inferenced weights (even if they are used in tensors), because they are not
 * extracted from inputWeightArray. (Not including channelShuffler.)
 *
 * @member {function} apply
 *   This is a data member which is a pointer to a function. The function
 * processes .input0.realTensor (and .input1.realTensor) as inputTensor(s). It
 * puts to .output0.realTensor as outputTensor. The inputTensors may or may not
 * be disposed according to setKeepInputTensor(). All intermediate tensors will
 * be disposed.
 *
 */
class Block_Base extends HierarchicalNameable.SeparatorDot_Root {

  /**
   * Used as default Block.Base provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "Block.Base.Pool",
    Block_Base );

  /**
   */
  constructor( parentNameable, name ) {
    super( parentNameable, name );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor( parentNameable, name ) {
    super.setAsConstructor( parentNameable, name );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    // Nothing to do here (for Block.Base).
  }

  /**
   * Generator for initializing this object.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent.
   * The created progressToAdvance will be increased when every time advanced.
   * The progressParent.root_get() will be returned when every time yield.
   *
   * @param {number[]|Float32Array} inputWeightArray
   *   The weights source array to be extracted from. It will not be kept by
   * this object.
   *
   * @param {number} weightElementOffsetBegin
   *   The beginning position (i.e. array index) to extract from
   * inputWeightArray.
   *
   * @param {Params} params
   *   A Params object. The params.init() will be called to extract parameters.
   * This params will be owned and destroyed by this .initer(). So caller
   * should not use it again.
   *
   * @param {ActivationEscaping.ScaleBoundsArray|TensorPlaceholder.Base} input0_ScaleBoundsArray_or_TensorPlaceholder
   *   The element value bounds (per channel) or TensorPlaceholder of input0.
   *
   *     - If it is an ActivationEscaping.ScaleBoundsArray object:
   *         - A new TensorPlaceholder will be created.
   *         - ( .input0_bOwned == true )
   *         - TensorPlaceholder will be released by here (Block.Base).
   *         - ActivationEscaping.ScaleBoundsArray will NOT be released by
   *             here (Block.Base).
   *
   *     - If it is a TensorPlaceholder.Base object (usually, it is the
   *         .output0 of the previous Block):
   *         - It will be used (not cloned, not owned) as input0's
   *             TensorPlaceholder directly.
   *         - ( .input0_bOwned == false )
   *         - TensorPlaceholder will NOT be released by here (Block.Base).
   *         - ActivationEscaping.ScaleBoundsArray will NOT be released by
   *             here (Block.Base).
   *
   * @param {ActivationEscaping.ScaleBoundsArray|TensorPlaceholder.Base} input1_ScaleBoundsArray_or_TensorPlaceholder
   *   The element value bounds (per channel) or TensorPlaceholder of input1.
   *
   *     - If it is an ActivationEscaping.ScaleBoundsArray object:
   *         - A new TensorPlaceholder will be created.
   *         - ( .input1_bOwned == true )
   *         - TensorPlaceholder will be released by here (Block.Base).
   *         - ActivationEscaping.ScaleBoundsArray will NOT be released by
   *             here (Block.Base).
   *
   *     - If it is a TensorPlaceholder.Base object (usually, it is the
   *         .output0 of the previous Block):
   *         - It will be used (not cloned, not owned) as input0's
   *             TensorPlaceholder directly.
   *         - ( .input1bOwned == false )
   *         - TensorPlaceholder will NOT be released by here (Block.Base).
   *         - ActivationEscaping.ScaleBoundsArray will NOT be released by
   *             here (Block.Base).
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.root_get() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   */
  * initer(
    progressParent, inputWeightArray, weightElementOffsetBegin, params,
    input0_ScaleBoundsArray_or_TensorPlaceholder,
    input1_ScaleBoundsArray_or_TensorPlaceholder,
  ) {

    // 0. Prepare

    this.weightElementOffsetEnd = this.weightElementOffsetBegin
      = weightElementOffsetBegin;

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

    let progressRoot = progressParent.root_get();
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) );

    // 1. Extract parameters.
    try {
      if ( !params )
        return false;

      if ( !params.init( inputWeightArray, weightElementOffsetBegin ) )
        return false;  // e.g. input array does not have enough data.

      // Record where to extract next weights. Only meaningful when
      // ( this.bInitOk == true ).
      this.weightElementOffsetEnd = params.weightElementOffsetEnd;

      // Get parameters' real (adjusted) values.
      //
      // Do not keep params in this.params. Copy them to reduce memory usage.
      this.input0_height = params.input0_height;
      this.input0_width = params.input0_width;
      this.input0_channelCount = params.input0_channelCount;

      this.nConvBlockTypeId = params.nConvBlockTypeId;
      this.nConvBlockTypeName = params.nConvBlockTypeName;
      this.nConvBlockTypeNameWithInt = params.nConvBlockTypeNameWithInt;

      this.pointwise1ChannelCount
        = params.pointwise1ChannelCount_real;
      this.pointwise1Bias
        = params.inferencedParams.pointwise1Bias;
      this.pointwise1ActivationId
        = params.inferencedParams.pointwise1ActivationId;
      this.pointwise1ActivationName
        = params.inferencedParams.pointwise1ActivationName;
      this.pointwise1_nHigherHalfDifferent
        = params.inferencedParams.pointwise1_nHigherHalfDifferent;
      this.pointwise1_inputChannelCount_lowerHalf
        = params.inferencedParams.pointwise1_inputChannelCount_lowerHalf;
      this.pointwise1_inputChannelCount_higherHalf
        = params.inferencedParams.pointwise1_inputChannelCount_higherHalf;
      this.pointwise1_outputChannelCount_lowerHalf
        = params.inferencedParams.pointwise1_outputChannelCount_lowerHalf;

      this.depthwise_AvgMax_Or_ChannelMultiplier
        = params.depthwise_AvgMax_Or_ChannelMultiplier;
      this.depthwise_AvgMax_Or_ChannelMultiplier_Name
        = params.depthwise_AvgMax_Or_ChannelMultiplier_Name;
      this.depthwiseFilterHeight
        = params.depthwiseFilterHeight_real;
      this.depthwiseFilterWidth
        = params.depthwiseFilterWidth_real;
      this.depthwiseStridesPad
        = params.depthwiseStridesPad;
      this.depthwiseStridesPadName
        = params.depthwiseStridesPadName;
      this.depthwiseBias
        = params.inferencedParams.depthwiseBias;
      this.depthwiseActivationId
        = params.depthwiseActivationId;
      this.depthwiseActivationName
        = params.depthwiseActivationName;
      this.depthwise1_nHigherHalfDifferent
        = params.inferencedParams.depthwise1_nHigherHalfDifferent;
      this.depthwise1_inputChannelCount_lowerHalf
        = params.inferencedParams.depthwise1_inputChannelCount_lowerHalf;

      this.pointwise20ChannelCount
        = params.pointwise20ChannelCount;
      this.pointwise20Bias
        = params.inferencedParams.pointwise20Bias;
      this.pointwise20ActivationId
        = params.pointwise20ActivationId;
      this.pointwise20ActivationName
        = params.pointwise20ActivationName;
      this.pointwise20_nHigherHalfDifferent
        = params.inferencedParams.pointwise20_nHigherHalfDifferent;
      this.pointwise20_outputChannelCount_lowerHalf
        = params.inferencedParams.pointwise20_outputChannelCount_lowerHalf;
      this.pointwise20_channelShuffler_outputGroupCount
        = params.inferencedParams.pointwise20_channelShuffler_outputGroupCount;

      this.nSqueezeExcitationChannelCountDivisor
        = params.nSqueezeExcitationChannelCountDivisor;
      this.nSqueezeExcitationChannelCountDivisorName
        = params.nSqueezeExcitationChannelCountDivisorName;
      this.bSqueezeExcitationPrefix
        = params.bSqueezeExcitationPrefix;

      this.nActivationId = params.nActivationId;
      this.nActivationName = params.nActivationName;

      this.bKeepInputTensor = params.bKeepInputTensor;
      this.bTableLog = params.bTableLog;

      // The parameters which are inferenced from the above parameters.
      {
        this.inputTensorCount
          = params.inferencedParams.inputTensorCount;
        this.input1_height
          = params.inferencedParams.input1_height;
        this.input1_width
          = params.inferencedParams.input1_width;
        this.input1_channelCount
          = params.inferencedParams.input1_channelCount;

        this.bDepthwiseRequestedAndNeeded
          = params.inferencedParams.bDepthwiseRequestedAndNeeded;

        this.depthwisePadInfo
          = params.inferencedParams.depthwisePadInfo;

        // (Because ownership is transferred.)
        params.inferencedParams.depthwisePadInfo = null;

        this.bDepthwise2Requested
          = params.inferencedParams.bDepthwise2Requested;
        this.bConcat1Requested
          = params.inferencedParams.bConcat1Requested;
        this.bAddInputToOutputRequested
          = params.inferencedParams.bAddInputToOutputRequested;
        this.bConcat2ShuffleSplitRequested
          = params.inferencedParams.bConcat2ShuffleSplitRequested;
        this.bHigherHalfDifferent
          = params.inferencedParams.bHigherHalfDifferent;
        this.bHigherHalfDepthwise2
          = params.inferencedParams.bHigherHalfDepthwise2;

        this.pointwise21ChannelCount
          = params.inferencedParams.pointwise21ChannelCount;
        this.pointwise21Bias
          = params.inferencedParams.pointwise21Bias;
        this.pointwise21ActivationId
          = params.inferencedParams.pointwise21ActivationId;
        this.pointwise21ActivationName
          = params.inferencedParams.pointwise21ActivationName;

        this.squeezeExcitationActivationId
          = params.inferencedParams.squeezeExcitationActivationId;
        this.squeezeExcitationActivationName
          = params.inferencedParams.squeezeExcitationActivationName;

        this.outputTensorCount
          = params.inferencedParams.outputTensorCount;
      }

      // No matter whether the channel shuffler is used, it is always recorded
      // in data member.
      this.channelShuffler_ConcatPointwiseConv = params.channelShuffler;
      if ( this.channelShuffler_ConcatPointwiseConv ) {
        if ( !( this.channelShuffler_ConcatPointwiseConv
                  instanceof ChannelShuffler.ConcatPointwiseConv ) )
          throw Error ( `Block.Base.initer(): `
            + `channelShuffler `
            + `( ${this.channelShuffler_ConcatPointwiseConv} ) `
            + `should be an instanceof ChannelShuffler.ConcatPointwiseConv`
          );
      }

    } finally {
      if ( params ) {
        params.disposeResources_and_recycleToPool();
        params = null;
      }
    }

    progressToAdvance.value_advance();
    yield progressRoot;  // Parameters extracted. Report progress.


    // 2. pointwise1

    // 2.1 Prepare Input TensorPlaceholder and Operation Array.

    // 2.1.1 Prepare input tensor placeholders.
    inputTensorPlaceholder_creator.set_input0_input1_TensorPlaceholder_by
      .call( this,
        this.inputTensorCount,
        this.input0_height, this.input0_width, this.input0_channelCount,
        input0_ScaleBoundsArray_or_TensorPlaceholder,
        this.input1_height, this.input1_width, this.input1_channelCount,
        input1_ScaleBoundsArray_or_TensorPlaceholder,
        this.pointwise1_inputChannelCount_lowerHalf,
        this.pointwise1_inputChannelCount_higherHalf
      );

    // 2.1.2 Create sub operation array.
    this.operationArray = Operation.TwinArray.Pool.get_or_create_by(
      this, "Operation.TwinArray", this.bTableLog,
      this.input0, this.input1, this.outputTensorCount );

    // Note: Once an operation is created (even if it just do nothing (e.g.
    //       ( pointwise1.bExisted == false ) ), it should always be appended
    //       to this.operationArray. The reason is that a created operation
    //       has already registered as the finalOperation of .endingInputX.
    //       Unless it could be un-registered, otherwise it should always be
    //       put into queue.


    // 2.2 The pointwise1 convolution.
    if ( this.pointwise1ChannelCount > 0 ) {

      let pointwise1;
      try {
        pointwise1 = Operation.Pointwise_SameWhenPassThrough.Pool
          .get_or_create_by(
            this, "pointwise1", this.bTableLog,
            this.operationArray.endingInput0,
            this.pointwise1ChannelCount,
            this.pointwise1Bias, this.pointwise1ActivationId,
            this.pointwise1_nHigherHalfDifferent,
            this.pointwise1_outputChannelCount_lowerHalf,

            // Default channelShuffler_inputGroupCount for pointwise1 is zero
            // (never positive).
            0,

            // Default channelShuffler_outputGroupCount for pointwise1 is zero
            // (never positive).
            0
          );

        if ( !pointwise1.init(
                inputWeightArray, this.weightElementOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.weightElementOffsetEnd = pointwise1.weightElementOffsetEnd;

        this.operationArray.operation_append( pointwise1 );
        pointwise1 = null;

      } finally {
        if ( pointwise1 ) {
          pointwise1.disposeResources_and_recycleToPool();
          pointwise1 = null;
        }
      }
    }

    progressToAdvance.value_advance();
    yield progressRoot;  // pointwise1 filters was ready. Report progress.

    // 3. The depthwise operation.
    //
    // Note: When ( pad == valid ), it seems that depthwise (avg/max pooling)
    //       filter size can not greater than input image size.

    // The depthwise2 processes the input0 directly (i.e. not the pointwise1
    // result of input0, and not input1).
    let depthwise2_input0 = this.input0; // (Note: Not .endingInput0, Not .input1)

    // Only if depthwise operation is requested and necessary, create them.
    if ( this.bDepthwiseRequestedAndNeeded ) {

      let depthwise1;
      let depthwise2;
      try {
        // 3.1 The depthwise1 operation.
        {
          depthwise1 = Operation.Depthwise_SameWhenPassThrough.Pool
            .get_or_create_by(
              this, "depthwise1", this.bTableLog,
              this.operationArray.endingInput0,
              this.depthwise_AvgMax_Or_ChannelMultiplier,
              this.depthwiseFilterHeight, this.depthwiseFilterWidth,
              this.depthwiseStridesPad,
              this.depthwiseBias, this.depthwiseActivationId,
              this.depthwise1_nHigherHalfDifferent,
              0, // No channelShuffler_inputGroupCount.
              0, // No cannelShuffler_outputGroupCount.
            );

          if ( !depthwise1.init(
                  inputWeightArray, this.weightElementOffsetEnd ) )
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
        if ( this.bDepthwise2Requested ) {

          // Q: Why does depthwise2 use the same configuration as depthwise1?
          // A: To ensure both result have the same ( height, width ) so that
          //    could be inputted to concatenator). This is especially true for
          //    StridesPad.
          depthwise2 = Operation.Depthwise_SameWhenPassThrough.Pool
            .get_or_create_by(
              this, "depthwise2", this.bTableLog,
              depthwise2_input0,
              this.depthwise_AvgMax_Or_ChannelMultiplier,
              this.depthwiseFilterHeight, this.depthwiseFilterWidth,
              this.depthwiseStridesPad, this.depthwiseBias, this.depthwiseActivationId,

              // depthwise2 never has higher-half-different.
              ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE,

              0, // No channelShuffler_inputGroupCount.
              0  // No channelShuffler_outputGroupCount.
            );

          if ( !depthwise2.init(
                  inputWeightArray, this.weightElementOffsetEnd ) )
            return false;  // e.g. input array does not have enough data.
          this.weightElementOffsetEnd = depthwise2.weightElementOffsetEnd;

          // Note:
          //   - If ( depthwise2.bExisted == true ), the depthwise2 is
          //       requested and created. It means ONE_INPUT_TWO_DEPTHWISE.
          //
          //   - If ( depthwise2.bExisted == false ), the depthwise2 is
          //       requested but not created. It means no depthwise operation
          //       (i.e. ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ). In
          //       this case, the depthwise2 should be short circuit to
          //       inputTensor[ 0 ] (i.e. not inputTensor[ 1 ]).

        } else {
          // Since the depthwise2 is not requested, it is always short circuit
          // to input1 (i.e. not input0).
        }

        this.operationArray.operation_append( depthwise1, depthwise2 );
        depthwise1 = null;
        depthwise2 = null;

      } finally {
        if ( depthwise1 ) {
          depthwise1.disposeResources_and_recycleToPool();
          depthwise1 = null;
        }
        if ( depthwise2 ) {
          depthwise2.disposeResources_and_recycleToPool();
          depthwise2 = null;
        }
      }

    // Otherwise, the depthwise operation is either ( not requested ) or
    // ( requested but not necessary ). The later case could improve
    // performance.
    } else {

      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD (2) )
      //
      // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD (9) )
      // (i.e. ShuffleNetV2_ByPointwise21's head with ( pointwise1ChannelCount >= 1 ))
      //
      // Even if no depthwise, however, a .endingInput1 is necessary for
      // concat1 to operate on. So create a dummy one.
      if ( this.bDepthwise2Requested ) {
        // Note: The two inputs of depthwise12Dummy might be the same one in
        //       fact.
        let depthwise12Dummy = Operation.Dummy.Pool.get_or_create_by(
          this, "depthwise12Dummy", this.bTableLog,
          this.operationArray.endingInput0, depthwise2_input0, 2 );
        this.operationArray.operation_append( depthwise12Dummy );
      }
    }

    progressToAdvance.value_advance();
    yield progressRoot;  // depthwise filters was ready. Report progress.

    // 4. Concat1
    if ( this.bConcat1Requested ) {
      let concat1 = Operation.ConcatAlongAxisId2.Pool.get_or_create_by(
        this, "concat1", this.bTableLog,
        this.operationArray.endingInput0, this.operationArray.endingInput1 );
      this.operationArray.operation_append( concat1 );
    }

    progressToAdvance.value_advance();
    yield progressRoot;  // concat1 was ready. Report progress.

    // 5. The squeeze-and-excitation prefix pointwise2

    if ( this.bSqueezeExcitationPrefix )
      if ( !Block_Base.operationArray_append_SqueezeExcitation.call( this,
              this.pointwise20_nHigherHalfDifferent, inputWeightArray,
              0, // No channelShuffler_outputGroupCount.
              "prefix"
            )
         )
        return false;  // e.g. input array does not have enough data.

    // 5.3
    // squeeze-and-excitation (prefix pointwise2) was ready. Report progress.
    progressToAdvance.value_advance();
    yield progressRoot;

    // 6. The pointwise2 convolution.
    {
      let pointwise20;
      let pointwise21;
      try {
        // 6.1 Pointwise20
        //
        // Note:
        //   - When ( bHigherHalfDifferent == true ) and
        //       ( channelShuffler_outputGroupCount > 0 ), it means output
        //       channels will be shuffled.
        //
        //   - When ( pointwise20ChannelCount == 0 ), it usually means no
        //       pointwise20 (i.e. ( pointwise20.bExisted == false ) ).
        //
        //   - When both ( pointwise20ChannelCount == 0 ) and
        //       ( bHigherHalfDifferent == true ) and
        //       ( channelShuffler_outputGroupCount > 0 ), the pointwise20 will
        //       exist (i.e. ( pointwise20.bExisted == true ) ). Otherwise, the
        //       output channels could not be shuffled. In this case, it will
        //       pass through all input to output, but the output will be
        //       channel shuffled.
        //
        //       - However, this situation is difficult to be handled. We
        //           re-design Params so that the pointwise20ChannelCount is
        //           always not zero.
        //
        pointwise20 = Operation.Pointwise_SameWhenPassThrough.Pool
          .get_or_create_by(
            this, "pointwise20", this.bTableLog,
            this.operationArray.endingInput0,
            this.pointwise20ChannelCount,
            this.pointwise20Bias, this.pointwise20ActivationId,
            this.pointwise20_nHigherHalfDifferent,
            this.pointwise20_outputChannelCount_lowerHalf,
            0, // No channelShuffler_inputGroupCount.
            this.pointwise20_channelShuffler_outputGroupCount
          );

        if ( !pointwise20.init(
                inputWeightArray, this.weightElementOffsetEnd ) )
          return false;  // e.g. input array does not have enough data.
        this.weightElementOffsetEnd = pointwise20.weightElementOffsetEnd;

        // 6.2 Pointwise21
        if ( this.pointwise21ChannelCount > 0 ) {

          let pointwise21_input0;
          {
            if ( this.operationArray.endingInput1 )
              // If there is .endingInput1, use it as pointwise21's input.
              pointwise21_input0 = this.operationArray.endingInput1;
            else
              pointwise21_input0 = this.operationArray.endingInput0;
          }

          pointwise21 = Operation.Pointwise_SameWhenPassThrough.Pool
            .get_or_create_by(
              this, "pointwise21", this.bTableLog,
              pointwise21_input0,
              this.pointwise21ChannelCount,
              this.pointwise21Bias, this.pointwise21ActivationId,
              this.pointwise20_nHigherHalfDifferent,
              this.pointwise20_outputChannelCount_lowerHalf,
              0, // No channelShuffler_inputGroupCount.
              this.pointwise20_channelShuffler_outputGroupCount
            );

          // Note: Strictly speaking, sometimes pointwise21 is dependent on
          //       depthwise2. But it does not matter for BoundsArraySet
          //       because depthwise1 and depthwise2 should have the same
          //       output value bounds.
          //
          if ( !pointwise21.init(
                  inputWeightArray, this.weightElementOffsetEnd ) )
            return false;  // e.g. input array does not have enough data.
          this.weightElementOffsetEnd = pointwise21.weightElementOffsetEnd;

        } else {
          // Since pointwise21 is not requested (i.e. channel count is not
          // positive), do not create the object for saving memory.
        }

        // 6.3 Pointwise2 (= Pointwise20 + Pointwise21 )
        this.operationArray.operation_append( pointwise20, pointwise21 );
        pointwise20 = null;
        pointwise21 = null;

      } finally {
        if ( pointwise20 ) {
          pointwise20.disposeResources_and_recycleToPool();
          pointwise20 = null;
        }
        if ( pointwise21 ) {
          pointwise21.disposeResources_and_recycleToPool();
          pointwise21 = null;
        }
      }
    }

    // 6.4
    progressToAdvance.value_advance();
    yield progressRoot;  // pointwise2 filters was ready. Report progress.

    // 7. The squeeze-and-excitation postfix pointwise2
      
    // 7.1
    if ( !this.bSqueezeExcitationPrefix ) // (i.e. postfix)
      if ( !Block_Base.operationArray_append_SqueezeExcitation.call( this,
              this.pointwise20_nHigherHalfDifferent, inputWeightArray,

              // Postfix squeeze-and-excitation's channels are shuffled if
              // pointwise2 did.
              this.pointwise20_channelShuffler_outputGroupCount,

              "postfix"
            )
         )
        return false;  // e.g. input array does not have enough data.

    // 7.2
    // squeeze-and-excitation (postfix pointwise2) was ready. Report progress.
    progressToAdvance.value_advance();
    yield progressRoot;

    // 8. Add-input-to-output

    // 8.1
    //
    // Although caller could request add-input-to-output, it may or may not
    // doable. Only if the dimension of output is the same as the dimension
    // of input, it is possible to add-input-to-output.
    //
    // Only if depthwise stride is "1" and pad is "same" (or pad is "valid" but
    // filter size 1x1), the dimension 0 (height) and 1 (width) of the output
    // will be the same as input.
    //
    // Only if output channel is equals to input channel, the dimension 2
    // (channel) of the output will be the same as input.
    //
    // For example:
    //   - if MobileNetV2 and not stage's block0, should not destroy input
    //       tensor so that can add input to output.
    //   - However, even if MobileNetV2, only if not block0 (whose ( strides ==
    //       ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME (2) ) ) of
    //       a stage, the add-input-to-output can be done.
    //
    this.bAddInputToOutput0 = false;
    this.bAddInputToOutput1 = false;
    if ( this.bAddInputToOutputRequested ) {

      // Note:
      //
      // Usually, if no pointwise20, then no addInput0ToPointwise20.
      // Usually, if no pointwise21, then no addInput0ToPointwise21.
      //
      // However, there is one exception: When both no pointwise20 and no
      // pointwise21, there might be addInput0ToPointwise20. Fortunately, now
      // pointwise20ChannelCount is always not zero. So this situation will not
      // happen.
      //

      let addInput0ToPointwise20;
      if ( this.operationArray.endingInput0
             ?.is_height_width_channelCount_same_byTensorPlaceholder(
                 this.input0 ) ) {
        addInput0ToPointwise20 = Operation.AddTwoTensors.Pool.get_or_create_by(
          this, "addInput0ToPointwise20", this.bTableLog,
          this.input0, this.operationArray.endingInput0 );
        this.bAddInputToOutput0 = true;
      }

      // Note: Only input0 (not input1) will be used to add to output.
      let addInput0ToPointwise21;
      if ( this.operationArray.endingInput1
             ?.is_height_width_channelCount_same_byTensorPlaceholder(
                 this.input0 ) ) {
        addInput0ToPointwise21 = Operation.AddTwoTensors.Pool.get_or_create_by(
          this, "addInput0ToPointwise21", this.bTableLog,
          this.input0, this.operationArray.endingInput1 );
        this.bAddInputToOutput1 = true;
      }

      this.operationArray.operation_append(
        addInput0ToPointwise20, addInput0ToPointwise21 );
    }

    // 8.2
    progressToAdvance.value_advance();
    yield progressRoot;  // add-input-to-output was ready. Report progress.

    // 9. Concat2-Shuffle-Split
    if ( this.bConcat2ShuffleSplitRequested ) {

      let bShuffleSplit;
      switch ( this.outputTensorCount ) {
        case 1: bShuffleSplit = false; break;
        case 2: bShuffleSplit = true;  break;

        default:
          throw Error( `Block.Base.initer(): When concat2-shuffle-split, `
              + `output channel count ( ${this.outputTensorCount} ) `
              +  `must be either 1 or 2.`
          );
          break;
      }

      let concat2ShuffleSplit = Operation.ConcatShuffleSplit.Pool
        .get_or_create_by(
          this, "concat2ShuffleSplit", this.bTableLog,
          this.operationArray.endingInput0, this.operationArray.endingInput1,
          this.channelShuffler_ConcatPointwiseConv, bShuffleSplit );

      this.operationArray.operation_append( concat2ShuffleSplit );

    } else {
      // Since no concat2(-shuffle-split), the final output come from
      // pointwise2 (and add-input-to-output) directly.
    }

    progressToAdvance.value_advance();
    yield progressRoot;  // concat2-Shuffle-Split was ready. Report progress.

    // 10. Configure correct function pointers according to whether keeping
    //     or destroying input tensor.

    // 10.1 Determine which apply_Xxx() function should be used.
    Block_Base.setup_apply_block.call( this );

    // 10.2 Adjust the destroy-or-keep behavior of every tensor according to
    //      whether the operation is the final operation of the tensor.
    //
    // When caller requests to keep input tensor, all input tensors should be
    // kept.
    //
    this.operationArray.setKeepInputTensor(
      this.bKeepInputTensor, this.bKeepInputTensor )

    // 10.3 If no need for table log (debug), reduce memory footprint by
    //      releasing unused (intermediate) bounds array set.
    if ( !this.bTableLog ) {
      this.dispose_intermediate_ScaleBoundsArray();
    }

    // 10.4
    // All pointwise1-depthwise-pointwise2 filters was ready. Report progress.
    progressToAdvance.value_advance();
    yield progressRoot;

    this.bInitOk = true;
    return true;
  }

  /**
   * Initialize this object by calling initer() and advance the generator by
   * loop until done.
   *
   * @return {boolean}
   *   - Return true, if succeeded (and progressParent.valuePercentage will be
   *       equal to 100).
   *   - Return false, if failed (and progressParent.valuePercentage will be
   *       less than 100).
   *
   * @see this.initer()
   */
  init(
    progressParent, inputWeightArray, weightElementOffsetBegin, params,
    input0_ScaleBoundsArray_or_TensorPlaceholder,
    input1_ScaleBoundsArray_or_TensorPlaceholder,
  ) {

    let initer = this.initer(
      progressParent, inputWeightArray, weightElementOffsetBegin, params,
      input0_ScaleBoundsArray_or_TensorPlaceholder,
      input1_ScaleBoundsArray_or_TensorPlaceholder,
    );

    let initerNext;
    do {
      initerNext = initer.next();

    // When ( false == initerNext.done ), the ( initerNext.value ) will be
    // progressParent.root_get().
    } while ( ! initerNext.done );

    // When ( true == initerNext.done ), the ( initerNext.value ) will be
    // initialization successfully or failed.
    let bInitOk = initerNext.value;
    return bInitOk;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources()
   * before return).
   *
   * @override
   */
  disposeResources() {
    this.apply = null;

    // 1. Because .outputX are not created by this block, they should not be
    //    released by this block.
    //
    // Note: The .outputX are just read only property returning
    //       .operationArray.outputX.

    // 2.
    if ( this.operationArray ) {
      this.operationArray.disposeResources_and_recycleToPool();
      this.operationArray = null;
    }

    // 3. The .inputX may or may not be created by this block, they should be
    //    released by this block according to .Xxx_bOwned flag.
    {
      if ( this.input1 ) {
        if ( this.input1_bOwned ) {
          // It is referenced to inputScaleBoundsArray0 which should not be
          // released here. So nullify it.
          this.input1.scaleBoundsArray = null;
          this.input1.disposeResources_and_recycleToPool();
        } else {
          // .input1 is totally created by caller. Do not release it (and do
          // not nullify .input1.scaleBoundsArray) here.
        }
        this.input1_bOwned = undefined;
        this.input1 = null;
      }
 
      if ( this.input0 ) {
        if ( this.input0_bOwned ) {
          // It is referenced to inputScaleBoundsArray1 which should not be
          // released here. So nullify it.
          this.input0.scaleBoundsArray = null;
          this.input0.disposeResources_and_recycleToPool();
        } else {
          // .input0 is totally created by caller. Do not release it (and do
          // not nullify .input0.scaleBoundsArray) here.
        }
        this.input0_bOwned = undefined;
        this.input0 = null;
      }
    }

    // 4.
    if ( this.channelShuffler_ConcatPointwiseConv ) {
      // Note: Do not dispose the channel shuffler here.
      this.channelShuffler_ConcatPointwiseConv = null;
    }

    // 5.
    if ( this.depthwisePadInfo ) {
      this.depthwisePadInfo.disposeResources_and_recycleToPool();
      this.depthwisePadInfo = null;
    }

    // 6.

    // The parameters which are inferenced from the other parameters.
    {
      this.outputTensorCount = undefined;

      this.squeezeExcitationActivationName = undefined;
      this.squeezeExcitationActivationId = undefined;

      this.pointwise21ActivationName = undefined;
      this.pointwise21ActivationId = undefined;
      this.pointwise21Bias = undefined;
      this.pointwise21ChannelCount = undefined;

      this.bHigherHalfDepthwise2 = undefined;
      this.bHigherHalfDifferent = undefined;
      this.bConcat2ShuffleSplitRequested = undefined;
      this.bAddInputToOutputRequested = undefined;
      this.bConcat1Requested = undefined;
      this.bDepthwise2Requested = undefined;

      this.bDepthwiseRequestedAndNeeded = undefined;

      this.input1_channelCount = undefined;
      this.input1_width = undefined;
      this.input1_height = undefined;

      this.inputTensorCount = undefined;
    }

    this.bTableLog = undefined;
    this.bKeepInputTensor = undefined;

    this.nActivationName = undefined;
    this.nActivationId = undefined;

    this.bSqueezeExcitationPrefix = undefined;
    this.nSqueezeExcitationChannelCountDivisorName = undefined;
    this.nSqueezeExcitationChannelCountDivisor = undefined;

    this.pointwise20_channelShuffler_outputGroupCount = undefined;
    this.pointwise20_outputChannelCount_lowerHalf = undefined;
    this.pointwise20_nHigherHalfDifferent = undefined;
    this.pointwise20ActivationName = undefined;
    this.pointwise20ActivationId = undefined;
    this.pointwise20Bias = undefined;
    this.pointwise20ChannelCount = undefined;

    this.depthwise1_inputChannelCount_lowerHalf = undefined;
    this.depthwise1_nHigherHalfDifferent = undefined;
    this.depthwiseActivationName = undefined;
    this.depthwiseActivationId = undefined;
    this.depthwiseBias = undefined;
    this.depthwiseStridesPadName = undefined;
    this.depthwiseStridesPad = undefined;
    this.depthwiseFilterWidth = undefined;
    this.depthwiseFilterHeight = undefined;
    this.depthwise_AvgMax_Or_ChannelMultiplier_Name = undefined;
    this.depthwise_AvgMax_Or_ChannelMultiplier = undefined;

    this.pointwise1_outputChannelCount_lowerHalf = undefined;
    this.pointwise1_inputChannelCount_higherHalf = undefined;
    this.pointwise1_inputChannelCount_lowerHalf = undefined;
    this.pointwise1_nHigherHalfDifferent = undefined;
    this.pointwise1ActivationName = undefined;
    this.pointwise1ActivationId = undefined;
    this.pointwise1Bias = undefined;
    this.pointwise1ChannelCount = undefined;

    this.nConvBlockTypeNameWithInt = undefined;
    this.nConvBlockTypeName = undefined;
    this.nConvBlockTypeId = undefined;

    this.input0_channelCount = undefined;
    this.input0_width = undefined;
    this.input0_height = undefined;

    // 7.
    this.weightElementOffsetEnd = undefined;
    this.weightElementOffsetBegin = undefined;
    this.bInitOk = undefined;

    super.disposeResources();
  }

  /**
   * Release all ScaleBoundsArray (inside tensor placeholder) except
   * this.inputX and this.outputX
   *
   * This could reduce memory footprint by releasing unused scale bounds array.
   */
  dispose_intermediate_ScaleBoundsArray() {
    this.operationArray.dispose_intermediate_ScaleBoundsArray();
  }

  /**
   * Append a sequence operations to achieve squeeze-and-excitation.
   *
   * Since multiplication is useful in squeeze-and-excitation, what about
   * division? e.g. tf.mul( input, x ) replaced by
   * tf.div( input, tf.abs( x ) + 1 )
   *
   *
   * 1. squeeze-and-excitation with multiplication and division:
   *
   *   depthwise ---- excitationPointwise1 - multiply ---- pointwise
   *              \-----------------------------------/ /
   *               \- excitationPointwise2 - divide ---/
   *
   * Effects:
   *  - depthwise separates neighbor pixels into different channels (of same
   *      pixel).
   *  - ( depthwise * excitationPointwise1 ) provides proportional by neighbor
   *      pixels.
   *  - ( ( depthwise * excitationPointwise1 ) / excitationPointwise2 )
   *      provides inversely proportional by neighbor pixels.
   *  - pointwise provides summation to neighbor pixels.
   *
   * To avoid dividing by zero, the division may use
   * tf.div( input, tf.abs( excitationPointwise2 ) + 1 ) instead of
   * tf.div( input, excitationPointwise2 ) directly.
   *
   *
   * 2. separable convolution original
   *
   *   depthwise - pointwise
   *
   * Effects:
   *  - depthwise separates neighbor pixels into different channels (of same
   *      pixel).
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
   *  - depthwise separates neighbor pixels into different channels (of same
   *      pixel).
   *  - ( depthwise * excitation2 ) provides proportional to neighbor pixels.
   *  - Can't inversely proportional by neighbor pixels.
   *  - pointwise provides summation to neighbor pixels.
   *
   *
   *
   * @param {Block.Base} this
   *   The object to be modified. The .operationArray and
   * .weightElementOffsetEnd will be modified.
   *
   * @param {ValueDesc.Pointwise_HigherHalfDifferent} nPointwise_HigherHalfDifferent
   *   The HigherHalfDifferent type for squeeze-and-excitation.
   *
   * @param {Float32Array} inputWeightArray
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {number} channelShuffler_outputGroupCount
   *
   * @param {string} prefix_or_postfix
   *   A string (either "prefix" or "postfix"). Used for table log name.
   *
   * @return {boolean} Return true, if succeeded.
   */
  static operationArray_append_SqueezeExcitation(
    nPointwise_HigherHalfDifferent, inputWeightArray,
    channelShuffler_outputGroupCount,
    prefix_or_postfix
  ) {

    if ( this.nSqueezeExcitationChannelCountDivisor
           == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) // (-2)
      return true; // No sequeeze-and-excitation.

    // Note1: Inside squeeze-and-excitation, all depthwsie and pointwise
    //        convolutions are constant-when-pass-through so that the result
    //        for pass-through parts will not affect input when multiply to
    //        input.
    //

    // 0.

    const bTableLog = this.bTableLog;

    const SE_nameBag
      = ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.nameBag;

    // Used for output because output dimension should be the same as input.
    let input0 = this.operationArray.endingInput0;
    let input1 = this.operationArray.endingInput1;

    // For
    //   - ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2 (8)
    //   - ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD (9)
    //
    // Although they have pointwise21, however, their squeeze-and-excitation-1
    // uses .endingInput0 (i.e. not endingInput1) as input. So, if there is no
    // input1, use input0 instead.
    //
    if ( !input1 )
      input1 = input0;

    // Assume .endingInput0 and endingInput1 have the same height and width.
    // So, checking .endingInput0 should be enough.
    let inputHeight = input0.height;
    let inputWidth = input0.width;

    // 0.1 Whether squeeze (i.e. global average pooling) exists. It will be
    //     false in the following cases:
    //
    //   - ( nSqueezeExcitationChannelCountDivisor
    //         == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) (-2)
    //     - since this object is just a no-op.
    //
    //   - ( nSqueezeExcitationChannelCountDivisor
    //         == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION ) (-1)
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
    //   - If ( nSqueezeExcitationChannelCountDivisor <= 0 ), it will be false
    //       (i.e. no intermediate pointwise convolution).
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

      // global average pooling.
      const squeezeAvgMax_Or_ChannelMultiplier
        = ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG;

      // ( filterSize == inputImageSize ) means global pooling.
      const squeezeFilterHeight = inputHeight;
      const squeezeFilterWidth = inputWidth;

      // To shrink to ( 1 x 1 ) image, pad should be "valid" (i.e. not "same").
      const squeezeStridesPad
        = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID;

      // squeeze has no bias (since it also has no activation).
      const squeezeBias = false;

      // squeeze has no activation.
      const squeezeActivationId
        = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

      // (global) average pooling must be no higher-half-different.
      const squeezeHigherHalfDifferent
        = ValueDesc.Depthwise_HigherHalfDifferent.Singleton.Ids.NONE;

      let squeezeDepthwise0;
      let squeezeDepthwise1;
      try {
        {
          squeezeDepthwise0 = Operation.Depthwise_ConstantWhenPassThrough.Pool
            .get_or_create_by( this,
              SE_nameBag.get_by( 0, prefix_or_postfix, "squeezeDepthwise" ),
              bTableLog,
              this.operationArray.endingInput0,
              squeezeAvgMax_Or_ChannelMultiplier,
              squeezeFilterHeight, squeezeFilterWidth, squeezeStridesPad,
              squeezeBias, squeezeActivationId, squeezeHigherHalfDifferent,
              0, // No channelShuffler_inputGroupCount for avg pooling.
              0, // No channelShuffler_outputGroupCount for avg pooling.
            );

          if ( !squeezeDepthwise0.init(
                  inputWeightArray, this.weightElementOffsetEnd ) )
            return false;  // e.g. input array does not have enough data.
          this.weightElementOffsetEnd
            = squeezeDepthwise0.weightElementOffsetEnd;
        }

        if ( this.pointwise21ChannelCount > 0 ) {
          squeezeDepthwise1 = Operation.Depthwise_ConstantWhenPassThrough.Pool
            .get_or_create_by( this,
              SE_nameBag.get_by( 1, prefix_or_postfix, "squeezeDepthwise" ),
              bTableLog,
              this.operationArray.endingInput1
                ? this.operationArray.endingInput1
                : this.operationArray.endingInput0,
              squeezeAvgMax_Or_ChannelMultiplier,
              squeezeFilterHeight, squeezeFilterWidth, squeezeStridesPad,
              squeezeBias, squeezeActivationId, squeezeHigherHalfDifferent,
              0, // No channelShuffler_inputGroupCount for avg pooling.
              0, // No channelShuffler_outputGroupCount for avg pooling.
            );

          if ( !squeezeDepthwise1.init(
                  inputWeightArray, this.weightElementOffsetEnd ) )
            return false;  // e.g. input array does not have enough data.
          this.weightElementOffsetEnd
            = squeezeDepthwise1.weightElementOffsetEnd;
        }

        this.operationArray.operation_append(
          squeezeDepthwise0, squeezeDepthwise1 );
        squeezeDepthwise0 = null;
        squeezeDepthwise1 = null;

      } finally {
        if ( squeezeDepthwise0 ) {
          squeezeDepthwise0.disposeResources_and_recycleToPool();
          squeezeDepthwise0 = null;
        }
        if ( squeezeDepthwise1 ) {
          squeezeDepthwise1.disposeResources_and_recycleToPool();
          squeezeDepthwise1 = null;
        }
      }
    }

    // 2. intermediatePointwise
    if ( bIntermediate ) {

      let intermediatePointwise0;
      let intermediatePointwise1;
      try {
        {
          intermediatePointwise0
            = Block_Base.SequeezeExcitation_intermediatePointwise_create_init
                .call( this,
                  SE_nameBag.get_by( 0, prefix_or_postfix,
                    "intermediatePointwise",
                    this.nSqueezeExcitationChannelCountDivisor ),
                  this.operationArray.endingInput0,
                  this.squeezeExcitationActivationId,
                  nPointwise_HigherHalfDifferent, inputWeightArray,
                  channelShuffler_outputGroupCount );

          if ( !intermediatePointwise0 )
            return false;  // e.g. input array does not have enough data.
        }

        if ( this.pointwise21ChannelCount > 0 ) {
          intermediatePointwise1
            = Block_Base.SequeezeExcitation_intermediatePointwise_create_init
                .call( this,
                  SE_nameBag.get_by( 1, prefix_or_postfix,
                    "intermediatePointwise",
                    this.nSqueezeExcitationChannelCountDivisor ),
                  this.operationArray.endingInput1
                    ? this.operationArray.endingInput1
                    : this.operationArray.endingInput0,
                  this.squeezeExcitationActivationId,
                  nPointwise_HigherHalfDifferent, inputWeightArray,
                  channelShuffler_outputGroupCount );

          if ( !intermediatePointwise1 )
            return false;  // e.g. input array does not have enough data.
        }

        this.operationArray.operation_append(
          intermediatePointwise0, intermediatePointwise1 );

        intermediatePointwise0 = null;
        intermediatePointwise1 = null;

      } finally {
        if ( intermediatePointwise0 ) {
          intermediatePointwise0.disposeResources_and_recycleToPool();
          intermediatePointwise0 = null;
        }
        if ( intermediatePointwise1 ) {
          intermediatePointwise1.disposeResources_and_recycleToPool();
          intermediatePointwise1 = null;
        }
      }
    }

    // 3. excitationPointwise
    {
      // the ending of squeeze-and-excitation should always have bias (even if
      // no activation).
      const excitationPointwise_bBias = true;

      // Since the previous operation's output channels has been shuffled, use
      // the same as shuffler in input channels to neutralize its effect.
      const excitationPointwise_channelShuffler_inputGroupCount
        = channelShuffler_outputGroupCount;

      let excitationPointwise0;
      let excitationPointwise1;
      try {
        {
          // excitation's output should have same channel count as input.
          const excitationPointwise0_outputChannelCount
            = input0.channelCount;
          const excitationPointwise0_outputChannelCount_lowerHalf
            = input0.channelCount_lowerHalf;
          const excitationPointwise0_nActivationId
            = this.squeezeExcitationActivationId;

          excitationPointwise0
            = Operation.Pointwise_ConstantWhenPassThrough.Pool
                .get_or_create_by( this,
                  SE_nameBag.get_by( 0, prefix_or_postfix,
                    "excitationPointwise" ),
                  bTableLog,
                  this.operationArray.endingInput0,
                  excitationPointwise0_outputChannelCount,
                  excitationPointwise_bBias,
                  excitationPointwise0_nActivationId,
                  nPointwise_HigherHalfDifferent,
                  excitationPointwise0_outputChannelCount_lowerHalf,
                  excitationPointwise_channelShuffler_inputGroupCount,

                  // Keep the same output channels shuffling.
                  channelShuffler_outputGroupCount
                );

          if ( !excitationPointwise0.init(
                  inputWeightArray, this.weightElementOffsetEnd ) )
            return false;  // e.g. input array does not have enough data.
          this.weightElementOffsetEnd
            = excitationPointwise0.weightElementOffsetEnd;
        }

        if ( this.pointwise21ChannelCount > 0 ) {
          const excitationPointwise1_outputChannelCount
            = input1.channelCount;
          const excitationPointwise1_outputChannelCount_lowerHalf
            = input1.channelCount_lowerHalf;
          const excitationPointwise1_nActivationId
            = this.squeezeExcitationActivationId;

          excitationPointwise1
            = Operation.Pointwise_ConstantWhenPassThrough.Pool
                .get_or_create_by( this,
                  SE_nameBag.get_by( 1, prefix_or_postfix,
                    "excitationPointwise" ),
                  bTableLog,
                  this.operationArray.endingInput1
                    ? this.operationArray.endingInput1
                    : this.operationArray.endingInput0,
                  excitationPointwise1_outputChannelCount,
                  excitationPointwise_bBias,
                  excitationPointwise1_nActivationId,
                  nPointwise_HigherHalfDifferent,
                  excitationPointwise1_outputChannelCount_lowerHalf,
                  excitationPointwise_channelShuffler_inputGroupCount,

                  // Keep the same output channels shuffling.
                  channelShuffler_outputGroupCount
                );

          if ( !excitationPointwise1.init(
                  inputWeightArray, this.weightElementOffsetEnd ) )
            return false;  // e.g. input array does not have enough data.
          this.weightElementOffsetEnd
            = excitationPointwise1.weightElementOffsetEnd;
        }

        this.operationArray.operation_append(
          excitationPointwise0, excitationPointwise1 );

        excitationPointwise0 = null;
        excitationPointwise1 = null;

      } finally {
        if ( excitationPointwise0 ) {
          excitationPointwise0.disposeResources_and_recycleToPool();
          excitationPointwise0 = null;
        }
        if ( excitationPointwise1 ) {
          excitationPointwise1.disposeResources_and_recycleToPool();
          excitationPointwise1 = null;
        }
      }
    }

    // 4. Mutiply
    {
      let multiply0 = Operation.MultiplyTwoTensors.Pool.get_or_create_by(
        this,
        SE_nameBag.get_by( 0, prefix_or_postfix, "multiply" ),
        bTableLog,
        input0, this.operationArray.endingInput0 );

      let multiply1;
      if ( this.pointwise21ChannelCount > 0 ) {
        multiply1 = Operation.MultiplyTwoTensors.Pool.get_or_create_by(
          this,
          SE_nameBag.get_by( 1, prefix_or_postfix, "multiply" ),
          bTableLog,
          input1, this.operationArray.endingInput1 );
      }

      this.operationArray.operation_append( multiply0, multiply1 );
    }

    return true;
  }

  /**
   * @param {Block.Base} this
   *   The object to be modified. The .weightElementOffsetEnd will be modified.
   *
   * @param {string} nameForTableLog
   *   The name string used when log the operation as table.
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
   *   Return the created (and initialized) intermediate pointwise of
   * squeeze-and-excitation, if succeeded. Return null, if failed.
   */
  static SequeezeExcitation_intermediatePointwise_create_init(
    nameForTableLog,
    inputTensorPlaceholder,
    nActivationId,
    nPointwise_HigherHalfDifferent, inputWeightArray,
    channelShuffler_outputGroupCount ) {

    const bTableLog = this.bTableLog;

    const intermediate_inputChannelCount
      = inputTensorPlaceholder.channelCount;
    const intermediate_inputChannelCount_lowerHalf
      = inputTensorPlaceholder.channelCount_lowerHalf;
    const intermediate_inputChannelCount_higherHalf
      = inputTensorPlaceholder.channelCount_higherHalf;

    if (   (   ( intermediate_inputChannelCount_lowerHalf == undefined )
            && ( intermediate_inputChannelCount_higherHalf != undefined ) )
        || (   ( intermediate_inputChannelCount_lowerHalf != undefined )
            && ( intermediate_inputChannelCount_higherHalf == undefined ) )
       )
      throw Error( `Block.Base`
        + `.SequeezeExcitation_intermediatePointwise_create_init(): `
        + `intermediate_inputChannelCount_lowerHalf `
          + `( ${intermediate_inputChannelCount_lowerHalf} ) and `
        + `intermediate_inputChannelCount_higherHalf `
          + `( ${intermediate_inputChannelCount_higherHalf} ) `
        + `should be either both undefined or both non-undefined.`
      );

    // Note: Using itself input channel count as dividend.
    let intermediate_outputChannelCount_lowerHalf;
    if ( intermediate_inputChannelCount_lowerHalf != undefined )
      intermediate_outputChannelCount_lowerHalf
        = Math.ceil( intermediate_inputChannelCount_lowerHalf
            / this.nSqueezeExcitationChannelCountDivisor );

    // Note: Using itself input channel count as dividend.
    let intermediate_outputChannelCount_higherHalf;
    if ( intermediate_inputChannelCount_higherHalf != undefined )
      intermediate_outputChannelCount_higherHalf
        = Math.ceil( intermediate_inputChannelCount_higherHalf
            / this.nSqueezeExcitationChannelCountDivisor );

    let intermediate_outputChannelCount;
    {
      if (   ( intermediate_outputChannelCount_lowerHalf != undefined )
          && ( intermediate_outputChannelCount_higherHalf != undefined ) )
        intermediate_outputChannelCount
          = intermediate_outputChannelCount_lowerHalf
              + intermediate_outputChannelCount_higherHalf;
      else
        intermediate_outputChannelCount = Math.ceil(
          intermediate_inputChannelCount
            / this.nSqueezeExcitationChannelCountDivisor );

      // Since higher-half is just pass-through, it could be discarded totally.
      //
      // Note: Only if no channel shuffling (i.e.
      // ( channelShuffler_outputGroupCount != 0 )), this discarding could be
      // done.
      //
      if ( nPointwise_HigherHalfDifferent
             == ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ) // (4)
        if ( channelShuffler_outputGroupCount == 0 )
          intermediate_outputChannelCount
            = intermediate_outputChannelCount_lowerHalf;
    }

    const intermediate_nActivationId = nActivationId;

    // If it has no activation, it could be no bias because the next
    // operation's (i.e. excitationPointwise) bias will achieve it.
    const intermediate_bBias
      = ( intermediate_nActivationId
            == ValueDesc.ActivationFunction.Singleton.Ids.NONE )
          ? false : true;

    const intermediate_nHigherHalfDifferent = nPointwise_HigherHalfDifferent;

    // Since the previous operation's output channels has been shuffled, use
    // the same as shuffler in input channels to neutralize its effect.
    const intermediate_channelShuffler_inputGroupCount
      = channelShuffler_outputGroupCount;


    let intermediatePointwise
      = Operation.Pointwise_ConstantWhenPassThrough.Pool.get_or_create_by(
          this, nameForTableLog, bTableLog,
          inputTensorPlaceholder,
          intermediate_outputChannelCount,
          intermediate_bBias, intermediate_nActivationId,
          intermediate_nHigherHalfDifferent,
          intermediate_outputChannelCount_lowerHalf,
          intermediate_channelShuffler_inputGroupCount,

          // Keep the same output channels shuffling.
          channelShuffler_outputGroupCount
        );

    if ( !intermediatePointwise.init(
            inputWeightArray, this.weightElementOffsetEnd ) ) {
      intermediatePointwise.disposeResources_and_recycleToPool();
      intermediatePointwise = null;
      return null;  // e.g. input array does not have enough data.
    }
    this.weightElementOffsetEnd = intermediatePointwise.weightElementOffsetEnd;

    return intermediatePointwise;
  }

  /** Setup .apply. */
  static setup_apply_block() {
    this.apply = Block_Base.apply_block;
  }

  /**
   * Call .operationArray.apply() directly. The .input0.realTensor ( and
   * .input1.realTensor) will be used directly.
   */
  static apply_block() {
    const bTableLog = this.bTableLog;
    if ( bTableLog ) {
      const blockName = this.nameString_get();
      console.group(
        `${blockName} ( ConvBlockType = ${this.nConvBlockTypeNameWithInt} )` );
    }

    this.operationArray.apply();

    if ( bTableLog )
      console.groupEnd();  // groupLabel "Block_Base"
  }


  get output_height() { return this.operationArray.output0.height; }
  get output_width() { return this.operationArray.output0.width; }


  get output0_channelCount() {
    return this.operationArray.output0.channelCount;
  }

  get output0_scaleBoundsArray() {
    return this.operationArray.output0.scaleBoundsArray;
  }

  get output1_channelCount() {
    if ( this.operationArray.output1 )
      return this.operationArray.output1.channelCount;
    return 0;
  }

  get output1_scaleBoundsArray() {
    if ( this.operationArray.output1 )
      return this.operationArray.output1.scaleBoundsArray;
    return null;
  }

  get output_channelCount() {
     return ( this.output0_channelCount + this.output1_channelCount );
  }


  get output0() { return this.operationArray.output0; }
  get output1() { return this.operationArray.output1; }


  get tensorWeightCountExtracted() {
    return this.operationArray.tensorWeightCountExtracted; }
  get tensorWeightCountTotal() {
    return this.operationArray.tensorWeightCountTotal; }


  /**
   * @return {string}
   *   The description string of all (adjusted) parameters of initer().
   *
   * @override
   */
  toString() {
    let str = ``
      + `inputTensorCount=${this.inputTensorCount}, `

      + `input0_height=${this.input0_height}, `
      + `input0_width=${this.input0_width}, `
      + `input0_channelCount=${this.input0_channelCount}, `

      + `input1_height=${this.input1_height}, `
      + `input1_width=${this.input1_width}, `
      + `input1_channelCount=${this.input1_channelCount}, `

      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width}, `
      + `output0_channelCount=${this.output0_channelCount}, `
      + `output1_channelCount=${this.output1_channelCount}, `
      + `output_channelCount=${this.output_channelCount}, `

      + `nConvBlockTypeName=${this.nConvBlockTypeName}`
        + `(${this.nConvBlockTypeId}), `

      + `bHigherHalfDifferent=${this.bHigherHalfDifferent}, `
      + `bHigherHalfDepthwise2=${this.bHigherHalfDepthwise2}, `

      + `pointwise1ChannelCount=${this.pointwise1ChannelCount}, `
      + `pointwise1Bias=${this.pointwise1Bias}, `
      + `pointwise1ActivationName=${this.pointwise1ActivationName}`
        + `(${this.pointwise1ActivationId}), `

      + `bDepthwiseRequestedAndNeeded=${this.bDepthwiseRequestedAndNeeded}, `
      + `bDepthwise2Requested=${this.bDepthwise2Requested}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=`
        + `${this.depthwise_AvgMax_Or_ChannelMultiplier_Name}`
        + `(${this.depthwise_AvgMax_Or_ChannelMultiplier}), `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `depthwiseStridesPad=${this.depthwiseStridesPadName}`
        + `(${this.depthwiseStridesPad}), `
      + `depthwiseBias=${this.depthwiseBias}, `
      + `depthwiseActivationName=${this.depthwiseActivationName}`
        + `(${this.depthwiseActivationId}), `

      + `bConcat1Requested=${this.bConcat1Requested}, `

      + `pointwise20ChannelCount=${this.pointwise20ChannelCount}, `
      + `pointwise20Bias=${this.pointwise20Bias}, `
      + `pointwise20ActivationName=${this.pointwise20ActivationName}`
        + `(${this.pointwise20ActivationId}), `

      + `pointwise21ChannelCount=${this.pointwise21ChannelCount}, `
      + `pointwise21Bias=${this.pointwise21Bias}, `
      + `pointwise21ActivationName=${this.pointwise21ActivationName}`
        + `(${this.pointwise21ActivationId}), `

      + `nSqueezeExcitationChannelCountDivisorName=`
        + `${this.nSqueezeExcitationChannelCountDivisorName}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `
      + `bSqueezeExcitationPrefix=${this.bSqueezeExcitationPrefix}, `
      + `squeezeExcitationActivationId=`
        + `${this.squeezeExcitationActivationName}`
        + `(${this.squeezeExcitationActivationId}), `

      + `bAddInputToOutputRequested=${this.bAddInputToOutputRequested}, `
      + `bConcat2ShuffleSplitRequested=${this.bConcat2ShuffleSplitRequested}, `
      + `pointwise20_channelShuffler_outputGroupCount=`
        + `${this.pointwise20_channelShuffler_outputGroupCount}, `

      + `channelShuffler_ConcatPointwiseConv.outputGroupCount=`
        + `${ this.channelShuffler_ConcatPointwiseConv
                ? this.channelShuffler_ConcatPointwiseConv.outputGroupCount
                : 0 }, `

      + `outputTensorCount=${this.outputTensorCount}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}, `
      + `bTableLog=${this.bTableLog}`
      ;
    return str;
  }

}
