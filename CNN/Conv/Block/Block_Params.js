export { Params };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
//import * as ChannelCountCalculator from "./Block_ChannelCountCalculator.js";
//import * as Depthwise from "../Depthwise.js";
import { InferencedParams } from "./Block_InferencedParams.js";

/**
 * Pointwise-depthwise-pointwise convolution block parameters.
 *
 *
 * 1. bias
 *
 * How the bias flags (i.e. pointwise1Bias, depthwiseBias, pointwise20Bias) are determined? Basically speaking, they are
 * deterimined by two rules:
 *   - pointwise20 always has bias.
 *   - affine transformation combination rule.
 *
 *
 * 1.1 pointwise2 always has bias
 *
 * The pointwise2 is an always existed operation of a block (i.e. a block may not have pointwise1, may not have depthwise, but always
 * has pointwise2). It is also the final opportunity to add bias (i.e. to achieve affine transformation) for a block. It is feasible
 * to always have bias (i.e. ( pointwise20Bias == true )). This ensures a block's output is affine transformed.
 *
 *
 * 1.2 Affine Transformation Combination Rule
 *
 *   "For multiple affine transformations of the same direction, if there is no non-linear operation in between, they could be combined
 *    into one affine transformation."
 *
 * So called "direction" here is operation direction. For example,
 *   - depthwise convolution's direction is along ( hieght, width ) plane.
 *   - pointwise convolution's direction is along channel axis.
 *
 * Which operations are affine transformations here?
 *   - pointwise convolution: linear (also affine) along channel axis.
 *   - depthwise convolution with ( pad = "valid" ): linear (also affine) along ( hieght, width ) plane.
 *   - bias: affine along channel axis (no matter pointwise's bias or depthwise's bias).
 *
 * Which operations are non-linear here?
 *   - activation
 *   - depthwise convolution with ( pad = "same" ): affine for inner pixels, non-affine for border pixels.
 *   - squeeze-and-excitation
 *
 *
 * 1.2.1 Why depthwise convolution with ( pad = "same" ) is non-affine?
 *
 * The reason is that the depthwise convolution with ( pad = "same" ) will pad zero for border pixels. The quantity of these padded
 * zero are different according to the input border pixel's position (e.g. at corner, or at edge).
 *
 * If a bias operation before depthwise want to be achieved by the bias operation after depthwise, the varying padded zero quantity
 * results in that varying bias is required. However, varying bias is impossible to be achieved since data in the same channel could
 * only have the same bias.
 *
 * On the other hand, the depthwise convolution with ( pad = "valid" ) does not pad any value. The per channel (fixed) bias is
 * sufficient to remedy the previous affine transformation's no-bias.
 *
 *
 * 1.2.2 Why squeeze-and-excitation is non-linear?
 *
 *   - The squeeze (of squeeze-and-excitation): linear because it is depthwise (globale average) convolution with ( pad = "valid" ).
 *
 *   - The intermediate and excitation (of squeeze-and-excitation): usually non-linear because they are pointwise convolution with
 *       activation.
 *
 *   - The final multiplication to input: non-linear operation.
 *
 * So, it is non-linear.
 *
 *
 * 1.2.3 For different directions
 *
 * Affine transformation along different directions can be combined, but can not be replaced by each other.
 *
 *   - The pointwise convolution can not replace depthwise convolution (and vice versa), because the former processes along depth
 *       (i.e. channels) while the later processes along spatial (i.e. height and width).
 *
 *   - The bias of pointwise convolution and depthwise convolution can be replaced by each other, because they all process along
 *       channels.
 *
 *
 * 1.3 bias flags rules
 *
 * After considering all above, the bias flags are determined by:
 *
 *   - The pointwise20Bias (and so pointwise21Bias) always is true.
 *
 *   - For depthwise operation's bias, if:
 *      - depthwise operation existed (i.e. ( bDepthwiseRequestedAndNeeded == true )), and
 *      - there are non-linear operations between depthwise and pointwise2.
 *     Then, ( depthwiseBias == true ).
 *
 *   - For pointwise1 operation's bias, if:
 *      - pointwise1 operation existed (i.e. ( pointwise1ChannelCount > 0 )), and
 *      - there are non-linear operations:
 *         - between pointwise1 and depthwise (if depthwise existed), or
 *         - between pointwise1 and pointwise2 (if depthwise does not exist).
 *     Then, ( pointwise1Bias == true ).
 *
 *
 * 1.4 Others thinking
 *
 * Q: When input ( height, width ) is ( 1, 1 ), is it possible to improvement performance by integrating biases into convolution filters?
 * A: That may not work because using pointwise convolution to generate a constant channel is expensive especially when
 *    channel count is large.
 *
 *
 *
 * @member {number} inputTensorCount
 *   How many input tensors should be passed into Block.apply() as parameter inputTensors[].
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
 * The input1's channel count of Block.apply() should match this value. The Block.input1_channelCount should also the same this value.
 *
 * @member {boolean} pointwise1Bias
 *   If true, there will be a bias after pointwise1 convolution. Usually, it will be true because pointwise1 always has bias. However,
 * if ( pointwise1ChannelCount == 0 ), this flag will be false.
 *
 * @member {number} pointwise1ActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the pointwise1 convolution. Usually, it uses the
 * default activation function (i.e. nActivationId).
 *
 * @member {string} pointwise1ActivationName
 *   The string name of pointwise1ActivationId.
 *
 * @member {boolean} depthwiseBias
 *   If true, there will be a bias after depthwise convolution. It is determined by operations between depthwise and pointwise2.
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
 * @member {boolean} pointwise20Bias
 *   If true, there will be a bias after pointwise20 convolution. It is always true.
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
 * @member {boolean} pointwise21Bias
 *   If true, there will be a bias after pointwise21 (i.e. the second pointwise2 convolution). It is always the same as
 * pointwise20Bias. It is only meaningful if ( pointwise21ChannelCount > 0 ).
 *
 * @member {number} pointwise21ActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after pointwise21 (i.e. the second
 * pointwise2 convolution). It is always the same as pointwise20ActivationId. It is only meaningful if ( pointwise21ChannelCount > 0 ).
 *
 * @member {number} squeezeExcitationActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of squeeze-and-excitation. Usually, it uses the
 * default activation function (i.e. nActivationId).
 *
 * @member {string} squeezeExcitationActivationName
 *   The string name of squeezeExcitationActivationId.
 *
 * @member {number} outputTensorCount
 *   How many output tensors will be returned by the parameter outputTensors[] of Block.apply(). At least 1. At most 2.
 *
 */
class Params extends Weights.Params {

  /**
   * Used as default Block.Params provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Block.Params.Pool", Params, Params.setAsConstructor );

  /**
   * If a parameter's value is null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   * @param {number} input0_height
   *   The height of apply()'s first input image (i.e. inputTensors[ 0 ]; input0). If null, it will be extracted
   * from inputWeightArray (i.e. by evolution).
   *
   * @param {number} input0_width
   *   The width of apply()'s first input image (i.e. inputTensors[ 0 ]; input0). If null, it will be extracted
   * from inputWeightArray (i.e. by evolution).
   *
   * @param {number} input0_channelCount
   *   The channel count of apply()'s first input image (i.e. inputTensors[ 0 ]; input0). If null, it will be extracted
   * from inputWeightArray (i.e. by evolution).
   *
   * @param {number} nConvBlockTypeId
   *   The convolution type id of the block (i.e. ValueDesc.ConvBlockType.Singleton.Ids.Xxx). If null, it will be extracted
   * from inputWeightArray (i.e. by evolution).
   *
   * @param {number} pointwise1ChannelCount
   *   The output channel count of the pointwise1 convolution. If null, it will be extracted from inputWeightArray (i.e. by evolution).
   * If 0, there will be no pointwise convolution before depthwise convolution.
   *
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier
   *   Depthwise operation. If null, it will be extracted from inputWeightArray (i.e. by evolution). If non-null, it should be
   * integer between [ -2, 32 ]:
   *   - Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG (-2): average pooling.
   *   - Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX (-1): max pooling.
   *   - Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.NONE (0): there will be no depthwise operation.
   *   - positive integer between [ 1, 32 ]: depthwise convolution and the number indicates channel multiplier.
   *
   * @param {number} depthwiseFilterHeight
   *   The height of depthwise convolution's filter. At least 1 (so that 1D data could be processed). If null, it will be extracted
   * from inputWeightArray (i.e. by evolution). If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this will be ignored.
   *
   * @param {number} depthwiseFilterWidth
   *   The width of depthwise convolution's filter. At least 2 (so that meaningless ( 1 * 1 ) could be avoided). If null, it will
   * be extracted from inputWeightArray (i.e. by evolution). If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this will be ignored.
   *
   * @param {number} depthwiseStridesPad
   *   The strides and padding of depthwise convolution. If null, it will be extracted from inputWeightArray (i.e. by evolution).
   * If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this depthwiseStridesPad will be ignored. It could be one of:
   *   - ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID (0) (strides = 1, pad = "valid")
   *   - ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME  (1) (strides = 1, pad = "same")
   *   - ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME  (2) (strides = 2, pad = "same")
   *   - ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID (3) (strides = 2, pad = "valid")
   * Default is ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME (1) because ( depthwiseStrides == 1 ) and ( depthwisePad == "same" )
   * is a pre-condition for ( bAddInputToOutputRequested == true ).
   *
   * @param {number} depthwiseActivationId
   *   The activation function id (Params.depthwiseActivationId.valueDesc.Ids.Xxx) after depthwise convolution. If null, it will be
   * extracted from inputWeightArray (i.e. by evolution). If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this activation function
   * will also be ignored.
   *
   * @param {number} pointwise20ChannelCount
   *   The output channel count of the first pointwise2 convolution. If null, it will be extracted from inputWeightArray (i.e. by evolution).
   * If ( pointwise20ChannelCount == 0 ) and ( pointwise21ChannelCount == 0 ), there will be no pointwise convolution after depthwise
   * convolution.
   *
   * @param {number} pointwise20ActivationId
   *   The activation function id (Params.pointwise20ActivationId.valueDesc.Ids.Xxx) after the first pointwise1 convolution. If null,
   * it will be extracted from inputWeightArray (i.e. by evolution). If ( pointwise20ChannelCount == 0 ), this activation function
   * will also be ignored.
   *
   * @param {number} nSqueezeExcitationChannelCountDivisor
   *   An integer represents the channel count divisor for squeeze-and-excitation's intermediate pointwise convolution channel count.
   *
   *     - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-2)
   *       - no squeeze, no excitation, no multiply.
   *       - This object is just a no-op.
   *
   *     - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION (-1)
   *       - no squeeze.
   *       - no intermediate excitation. ( intermediate_outputChannelCount = 0 )
   *       - has only one pointwise convolution (i.e. excitation pointwise convolution). 
   *
   *     - ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.SQUEEZE_EXCITATION (0)
   *       - has squeeze. 
   *       - no intermediate excitation. ( intermediate_outputChannelCount = 0 )
   *       - has only one pointwise convolution (i.e. excitation pointwise convolution). 
   *
   *     - ( nSqueezeExcitationChannelCountDivisor > 0 )
   *       - has squeeze. 
   *       - has intermediate excitation. ( intermediate_outputChannelCount = Math.ceil( inputChannelCount / nSqueezeExcitationChannelCountDivisor ) )
   *       - has two pointwise convolutions (i.e. intermediate pointwise convolution, and excitation pointwise convolution).
   *
   * @param {boolean} bSqueezeExcitationPrefix
   *   If true, the squeeze-and-excitation will be before pointwise2. If false, the squeeze-and-excitation will be after pointwise2.
   * If null, it will be extracted from inputWeightArray (i.e. by evolution).
   * Only used if ( nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-2) ).
   *
   * @param {number} nActivationId
   *   The default activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx). If null, it will be extracted from
   * inputWeightArray (i.e. by evolution). It is used by pointwise1 and squeeze-and-excitation. pointwise1 and
   * squeeze-and-excitation should have activvation even if depthwise and pointwise20 do not have.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks. If it is null, it will be extracted from
   * inputWeightArray (i.e. by evolution).
   *
   */
  constructor(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId,
    bKeepInputTensor
  ) {
    super(
      Params.SequenceArray,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId,
      bKeepInputTensor
    );
    Params.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount, pointwise20ActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    nActivationId,
    bKeepInputTensor
  ) {
    super.setAsConstructor(
      Params.SequenceArray,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId,
      bKeepInputTensor
    );
    Params.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
    this.InferencedParams_dispose();
    super.disposeResources();
  }

  /** Release .inferencedParams */
  InferencedParams_dispose() {
    if ( this.inferencedParams ) {
      this.inferencedParams.disposeResources_and_recycleToPool();
      this.inferencedParams = null;
    }
  }

  /**
   * Extract parameters from inputWeightArray.
   *
   * @return {boolean} Return false, if extraction failed.
   *
   * @override
   */
  init( inputWeightArray, elementOffsetBegin ) {
    let bExtractOk = super.init( inputWeightArray, elementOffsetBegin );
    if ( !bExtractOk )
      return false;

    // Determine input tensor count and whether request add-input-to-output.
    this.inferencedParams = InferencedParams.Pool.get_or_create_by(
      this.input0_height, this.input0_width, this.input0_channelCount,
      this.nConvBlockTypeId,
      this.pointwise1ChannelCount,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth, this.depthwiseStridesPad,
      this.depthwiseActivationId,
      this.pointwise20ChannelCount,
      this.nSqueezeExcitationChannelCountDivisor, this.bSqueezeExcitationPrefix,
      this.nActivationId,
    );

    return bExtractOk;
  }

  get input0_height()                        { return this.getParamValue_byParamDesc( Params.input0_height ); }
  get input0_width()                         { return this.getParamValue_byParamDesc( Params.input0_width ); }
  get input0_channelCount()                  { return this.getParamValue_byParamDesc( Params.input0_channelCount ); }

  /** @return {number} The number version of nConvBlockTypeId. */
  get nConvBlockTypeId()          { return this.getParamValue_byParamDesc( Params.nConvBlockTypeId ); }

  /** @return {string} The string version of nConvBlockTypeId. */
  get nConvBlockTypeName()        { return Params.nConvBlockTypeId.getStringOfValue( this.nConvBlockTypeId ); }

  get pointwise1ChannelCount()      { return this.getParamValue_byParamDesc( Params.pointwise1ChannelCount ); }
  get pointwise1ChannelCount_real() {
    if ( this.inferencedParams.pointwise1ChannelCount_modified != undefined )
      return this.inferencedParams.pointwise1ChannelCount_modified;
    else
      return this.pointwise1ChannelCount;
  }

  /** @return {number} The number version of the depthwise opertion. */
  get depthwise_AvgMax_Or_ChannelMultiplier() { return this.getParamValue_byParamDesc( Params.depthwise_AvgMax_Or_ChannelMultiplier ); }

  /** @return {string} The string version of the depthwise opertion. */
  get depthwise_AvgMax_Or_ChannelMultiplier_Name() {
    return Params.depthwise_AvgMax_Or_ChannelMultiplier.getStringOfValue( this.depthwise_AvgMax_Or_ChannelMultiplier );
  }

  get depthwiseFilterHeight()      { return this.getParamValue_byParamDesc( Params.depthwiseFilterHeight ); }
  get depthwiseFilterHeight_real() {
    if ( this.inferencedParams.depthwiseFilterHeight_modified != undefined )
      return this.inferencedParams.depthwiseFilterHeight_modified;
    else
      return this.depthwiseFilterHeight;
  }

  get depthwiseFilterWidth()      { return this.getParamValue_byParamDesc( Params.depthwiseFilterWidth ); }
  get depthwiseFilterWidth_real() {
    if ( this.inferencedParams.depthwiseFilterWidth_modified != undefined )
      return this.inferencedParams.depthwiseFilterWidth_modified;
    else
      return this.depthwiseFilterWidth;
  }

  get depthwiseStridesPad()       { return this.getParamValue_byParamDesc( Params.depthwiseStridesPad ); }
  get depthwiseStridesPadName()   { return ValueDesc.StridesPad.Singleton.getStringOf( this.depthwiseStridesPad ); }

  get depthwiseActivationId()     { return this.getParamValue_byParamDesc( Params.depthwiseActivationId ); }
  get depthwiseActivationName()   { return Params.depthwiseActivationId.getStringOfValue( this.depthwiseActivationId ); }

  get pointwise20ChannelCount()   { return this.getParamValue_byParamDesc( Params.pointwise20ChannelCount ); }
  get pointwise20ActivationId()   { return this.getParamValue_byParamDesc( Params.pointwise20ActivationId ); }
  get pointwise20ActivationName() { return Params.pointwise20ActivationId.getStringOfValue( this.pointwise20ActivationId ); }

//!!! (2022/07/18 Remarked) Integrated into InferenceParams.
//   // Note: pointwise21 use bias flag and activation id of pointwise20.
//   get pointwise21Bias()           { return this.inferencedParams.pointwise20Bias; }
//   get pointwise21ActivationId()   { return this.pointwise20ActivationId; }
//   get pointwise21ActivationName() { return this.pointwise20ActivationName; }

  get nSqueezeExcitationChannelCountDivisor()     { return this.getParamValue_byParamDesc( Params.nSqueezeExcitationChannelCountDivisor ); }
  get nSqueezeExcitationChannelCountDivisorName() {
    return Params.nSqueezeExcitationChannelCountDivisor.getStringOfValue( this.nSqueezeExcitationChannelCountDivisor );
  }

  get bSqueezeExcitationPrefix()  { return this.getParamValue_byParamDesc( Params.bSqueezeExcitationPrefix ); }

  get nActivationId()             { return this.getParamValue_byParamDesc( Params.nActivationId ); }
  get nActivationName()           { return Params.nActivationId.getStringOfValue( this.nActivationId ); }

  get bKeepInputTensor()          { return this.getParamValue_byParamDesc( Params.bKeepInputTensor ); }


  get output_height() {
    if ( this.inferencedParams.bDepthwiseRequestedAndNeeded )
      return this.inferencedParams.depthwisePadInfo.outputHeight;
    else
      return this.input0_height;
  }

  get output_width() {
    if ( this.inferencedParams.bDepthwiseRequestedAndNeeded )
      return this.inferencedParams.depthwisePadInfo.outputWidth;
    else
      return this.input0_width;
  }

}


// Define parameter descriptions.

Params.input0_height =           new ParamDesc.Int(                 "input0_height",           1, ( 10 * 1024 ) );
Params.input0_width =            new ParamDesc.Int(                 "input0_width",            1, ( 10 * 1024 ) );

/** At least, there should be 1 input channel. */
Params.input0_channelCount =     new ParamDesc.Int(                 "input0_channelCount",     1, ( 10 * 1024 ) );

Params.nConvBlockTypeId =        new ParamDesc.ConvBlockType(       "nConvBlockTypeId" );

Params.pointwise1ChannelCount =  new ParamDesc.Int(                 "pointwise1ChannelCount",  0, ( 10 * 1024 ) );

/** Define depthwise operation's id, range, name.
 *
 * Convert number value into integer between [ -2, 32 ] representing depthwise operation:
 *   - -1: average pooling. (AVG)
 *   - -2: maximum pooling. (MAX)
 *   -  0: no depthwise operation. (NONE)
 *   - [ 1, 32 ]: depthwise convolution with channel multiplier between 1 and 32 (inclusive).
 */
Params.depthwise_AvgMax_Or_ChannelMultiplier = new ParamDesc.AvgMax_Or_ChannelMultiplier( "depthwise_AvgMax_Or_ChannelMultiplier" );


/** Define suitable value for depthwise convolution filter size.
 *
 * At least ( 1 * 1 ), because for depthwise filter size ( height * width ):
 *   - ( 0 * 0 ) is meaningless.
 *   - ( 1 * N ) is necessary for processing 1D data (e.g. sound, or text).
 *
 * For avg pooling or max pooling, it is less meaningful if filter size is ( 1 * 1 ) because the result will be the same as input.
 *
 * For depthwise convolution, it is still meaningful even if filter size is ( 1 * 1 ) because they still could filter value or
 * be used as simple channel multiplier.
 *
 * Avoid too large filter size. Otherwise, performance may be poor.
 *
 *
 * (2021/07/20)
 * Note: In backend WASM, when filter width is 1 (note: filter height does not have this issue and could be 1), it seems that
 * tf.pool() (both AVG and MAX) and tf.depthwiseConv2d() will calculate wrongly. In backend CPU and WebGL, this problem does
 * not exist.
 *
 */
Params.depthwiseFilterHeight =    new ParamDesc.Int(                "depthwiseFilterHeight",   1, ( 10 * 1024 ) );
Params.depthwiseFilterWidth =     new ParamDesc.Int(                "depthwiseFilterWidth",    1, ( 10 * 1024 ) );

Params.depthwiseStridesPad =      new ParamDesc.StridesPad(         "depthwiseStridesPad" );
Params.depthwiseActivationId =    new ParamDesc.ActivationFunction( "depthwiseActivationId" );

// Note: Force pointwise20ChannelCount always not zero. So that input0_channelCount_higherHalf could be determined
// when
//   - ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5)
//   - ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_TAIL (6)
//
Params.pointwise20ChannelCount =  new ParamDesc.Int(                "pointwise20ChannelCount", 1, ( 10 * 1024 ) );
Params.pointwise20ActivationId =  new ParamDesc.ActivationFunction( "pointwise20ActivationId" );

Params.nSqueezeExcitationChannelCountDivisor = new ParamDesc.SqueezeExcitationChannelCountDivisor( "nSqueezeExcitationChannelCountDivisor" );
Params.bSqueezeExcitationPrefix = new ParamDesc.Bool(               "bSqueezeExcitationPrefix" );

Params.nActivationId =            new ParamDesc.ActivationFunction(  "nActivationId" );

Params.bKeepInputTensor =         new ParamDesc.Bool(               "bKeepInputTensor" );


/**
 * Define the order of these parameters. (Fills ParamDesc.Xxx.seqId according to this array's order.)
 */
Params.SequenceArray = new ParamDesc.SequenceArray( [
  Params.input0_height,
  Params.input0_width,
  Params.input0_channelCount,
  Params.nConvBlockTypeId,
  Params.pointwise1ChannelCount,
  Params.depthwise_AvgMax_Or_ChannelMultiplier,
  Params.depthwiseFilterHeight,
  Params.depthwiseFilterWidth,
  Params.depthwiseStridesPad,
  Params.depthwiseActivationId,
  Params.pointwise20ChannelCount,
  Params.pointwise20ActivationId,
  Params.nSqueezeExcitationChannelCountDivisor,
  Params.bSqueezeExcitationPrefix,
  Params.nActivationId,
  Params.bKeepInputTensor,
] );

