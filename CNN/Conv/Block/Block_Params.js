export { Params };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as Depthwise from "../Depthwise.js";

/**
 * Pointwise-depthwise-pointwise convolution block parameters.
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
 * The input1's channel count of Block.apply() should match this value. The Block.inChannels1 should also the same this value.
 *
 * @member {boolean} bDepthwiseRequestedAndNeeded
 *   Whether depthwise operation is requested and necessary.
 *
 * @member {Depthwise.PadInfoCalculatorRoot} depthwisePadInfo
 *   If ( bDepthwiseRequestedAndNeeded == true ), this info will be set.
 *
 * @member {number} pointwise21ChannelCount
 *   The output channel count of the second pointwise2 convolution. If ( pointwise21ChannelCount == 0 ), it means pointwise21 does
 * not existed.
 *
 * @member {boolean} bPointwise21Bias
 *   If true, there will be a bias after pointwise21 (i.e. the second pointwise2 convolution). It is always the same as
 * bPointwise20Bias. It is only meaningful if ( pointwise21ChannelCount > 0 ).
 *
 * @member {number} pointwise21ActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after pointwise21 (i.e. the second
 * pointwise2 convolution). It is always the same as pointwise20ActivationId. It is only meaningful if ( pointwise21ChannelCount > 0 ).
 *
 * @member {number} outputTensorCount
 *   How many output tensors will be returned by the parameter outputTensors[] of Block.apply(). At least 1. At most 2.
 *
 */
class Params extends Weights.Params {

  /**
   * If a parameter's value is null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {number} input0_height
   *   The height of apply()'s first input image (i.e. inputTensors[ 0 ]; input0). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} input0_width
   *   The width of apply()'s first input image (i.e. inputTensors[ 0 ]; input0). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} input0_channelCount
   *   The channel count of apply()'s first input image (i.e. inputTensors[ 0 ]; input0). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} nConvBlockTypeId
   *   The convolution type id of the block (i.e. ValueDesc.ConvBlockType.Singleton.Ids.Xxx). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} pointwise1ChannelCount
   *   The output channel count of the pointwise1 convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If 0, there will be no pointwise convolution before depthwise convolution.
   *
   * @param {boolean} bPointwise1Bias
   *   If true, there will be a bias after pointwise1 convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If ( pointwise1ChannelCount == 0 ), this bias will also be ignored.
   *
   * @param {number} pointwise1ActivationId
   *   The activation function id (Params.pointwise1ActivationId.valueDesc.Ids.Xxx) after the pointwise1 convolution. If null,
   * it will be extracted from inputFloat32Array (i.e. by evolution). If ( pointwise1ChannelCount == 0 ), this activation function
   * will also be ignored.
   *
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier
   *   Depthwise operation. If null, it will be extracted from inputFloat32Array (i.e. by evolution). If non-null, it should be
   * integer between [ -2, 32 ]:
   *   - Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG (-2): average pooling.
   *   - Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX (-1): max pooling.
   *   - Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.NONE (0): there will be no depthwise operation.
   *   - positive integer between [ 1, 32 ]: depthwise convolution and the number indicates channel multiplier.
   *
   * @param {number} depthwiseFilterHeight
   *   The height of depthwise convolution's filter. At least 1 (so that 1D data could be processed). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution). If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this will be ignored.
   *
   * @param {number} depthwiseFilterWidth
   *   The width of depthwise convolution's filter. At least 2 (so that meaningless ( 1 * 1 ) could be avoided). If null, it will
   * be extracted from inputFloat32Array (i.e. by evolution). If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this will be ignored.
   *
   * @param {number} depthwiseStridesPad
   *   The strides and padding of depthwise convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this depthwiseStridesPad will be ignored. It could be one of:
   *   - ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID (0) (strides = 1, pad = "valid")
   *   - ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME  (1) (strides = 1, pad = "same")
   *   - ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME  (2) (strides = 2, pad = "same")
   *   - ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID (3) (strides = 2, pad = "valid")
   * Default is ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME (1) because ( depthwiseStrides == 1 ) and ( depthwisePad == "same" )
   * is a pre-condition for ( bAddInputToOutputRequested == true ).
   *
   * @param {boolean} bDepthwiseBias
   *   If null, it will be extracted from inputFloat32Array (i.e. by evolution). If true, there will be a bias after depthwise convolution.
   * If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this bias will also be ignored.
   *
   * @param {number} depthwiseActivationId
   *   The activation function id (Params.depthwiseActivationId.valueDesc.Ids.Xxx) after depthwise convolution. If null, it will be
   * extracted from inputFloat32Array (i.e. by evolution). If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this activation function
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
   * If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * Only used if ( nSqueezeExcitationChannelCountDivisor != ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE (-2) ).
   *
   * @param {number} pointwise20ChannelCount
   *   The output channel count of the first pointwise2 convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If ( pointwise20ChannelCount == 0 ) and ( pointwise21ChannelCount == 0 ), there will be no pointwise convolution after depthwise
   * convolution.
   *
   * @param {boolean} bPointwise20Bias
   *   If true, there will be a bias after the first pointwise2 convolution. If null, it will be extracted from inputFloat32Array (i.e. by
   * evolution). If ( pointwise20ChannelCount == 0 ), this bias will also be ignored.
   *
   * @param {number} pointwise20ActivationId
   *   The activation function id (Params.pointwise20ActivationId.valueDesc.Ids.Xxx) after the first pointwise1 convolution. If null,
   * it will be extracted from inputFloat32Array (i.e. by evolution). If ( pointwise20ChannelCount == 0 ), this activation function
   * will also be ignored.
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks. If it is null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   */
  constructor( inputFloat32Array, byteOffsetBegin,
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,

//!!! ...unfinished... (2022/06/16)
// Perhaps, deprecate bPointwise1Bias to reduce quantity of parameters and test cases.
//   - if no pointwise1ActivationId, also no bPointwise1Bias automatically.
//   - if has pointwise1ActivationId, also has bPointwise1Bias automatically.
//
// Or, deprecate bPointwise1Bias and pointwise1ActivationId to reduce quantity of parameters and test cases.
// Let pointwise1ActivationId is the same as pointwise20ActivationId. (!!! WRONG. because pointwise2 need consider the next block.)
//   - if no pointwise1ActivationId, also no bPointwise1Bias automatically.
//   - if has pointwise1ActivationId, also has bPointwise1Bias automatically.
//

    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,

    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    pointwise20ChannelCount, bPointwise20Bias, pointwise20ActivationId,
    bKeepInputTensor
  ) {

    let parameterMap = new Map( [
      [ Params.input0_height,                         input0_height ],
      [ Params.input0_width,                          input0_width ],
      [ Params.input0_channelCount,                   input0_channelCount ],
      [ Params.nConvBlockTypeId,                      nConvBlockTypeId ],
      [ Params.pointwise1ChannelCount,                pointwise1ChannelCount ],
      [ Params.bPointwise1Bias,                       bPointwise1Bias ],
      [ Params.pointwise1ActivationId,                pointwise1ActivationId ],
      [ Params.depthwise_AvgMax_Or_ChannelMultiplier, depthwise_AvgMax_Or_ChannelMultiplier ],
      [ Params.depthwiseFilterHeight,                 depthwiseFilterHeight ],
      [ Params.depthwiseFilterWidth,                  depthwiseFilterWidth ],
      [ Params.depthwiseStridesPad,                   depthwiseStridesPad ],
      [ Params.bDepthwiseBias,                        bDepthwiseBias ],
      [ Params.depthwiseActivationId,                 depthwiseActivationId ],
      [ Params.nSqueezeExcitationChannelCountDivisor, nSqueezeExcitationChannelCountDivisor ],
      [ Params.bSqueezeExcitationPrefix,              bSqueezeExcitationPrefix ],
      [ Params.pointwise20ChannelCount,               pointwise20ChannelCount ],
      [ Params.bPointwise20Bias,                      bPointwise20Bias ],
      [ Params.pointwise20ActivationId,               pointwise20ActivationId ],
      [ Params.bKeepInputTensor,                      bKeepInputTensor ],
    ] );

    super( inputFloat32Array, byteOffsetBegin, parameterMap );
  }

  /**
   * Extract parameters from inputFloat32Array.
   *
   * @return {boolean} Return false, if extraction failed.
   *
   * @override
   */
  extract() {
    let bExtractOk = super.extract();
    if ( !bExtractOk )
      return false;

    // Determine input tensor count and whether request add-input-to-output.
    Params.set_inferencedParams_by.call( this,
      this.input0_height, this.input0_width, this.input0_channelCount,
      this.nConvBlockTypeId,
      this.pointwise1ChannelCount,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth, this.depthwiseStridesPad,
      this.bDepthwiseBias, this.depthwiseActivationId,
      this.nSqueezeExcitationChannelCountDivisor, this.bSqueezeExcitationPrefix,
      this.pointwise20ChannelCount, this.bPointwise20Bias,
    );

    return bExtractOk;
  }

  /**
   * Determine the following properties:
   *   - this.bDepthwiseRequestedAndNeeded
   *
   * When got false, the depthwise could be discarded to improve performance.
   */
  static set_bDepthwiseRequestedAndNeeded_by(
    input0_height, input0_width,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    bPointwise20Bias
  ) {

    if ( depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) {
      this.bDepthwiseRequestedAndNeeded = false; // depthwise is not requested.
      return;
    }

    let stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfoById( depthwiseStridesPad );

    let bChannelCountSame = Depthwise.PadInfoCalculatorRoot.output_channelCount_is_same_as_input( depthwise_AvgMax_Or_ChannelMultiplier );

    let bHeightWidthSame = Depthwise.PadInfoCalculatorRoot.output_height_width_is_same_as_input( input0_height, input0_width,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, stridesPadInfo );

    let bNoNeighborAnalysis = Depthwise.PadInfoCalculatorRoot.output_height_width_is_no_neighbor_analysis( input0_height, input0_width,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth );

    let depthwise_bLinearOrAffine;
    {
      depthwise_bLinearOrAffine =
         ( depthwiseActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) // i.e. depthwise is linear or affine.

          // no squeeze-and-excitation (i.e. between depthwise and pointwise2 is linear or affine)
      && (   ( nSqueezeExcitationChannelCountDivisor == ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) // (-2)

          // or, has squeeze-and-excitation, but after pointwise2. (i.e. between depthwise and pointwise2 is still linear or affine)
          || ( bSqueezeExcitationPrefix == false )
         );
    }

    let depthwise_bLinear;
    {
      depthwise_bLinear = depthwise_bLinearOrAffine
        && (    ( bDepthwiseBias == false ) // It has no bias. (i.e. depthwise is linear)

            // Or, its has bias, but its next operation (i.e. pointwise2) has bias (so its bias could be combined into the next operation's
            // bias). Then it could be viewed as linear.
            || ( ( bDepthwiseBias == true ) && ( bPointwise20Bias == true ) )
           );
    }

    // If a depthwise operation does not change output's ( height, width, channelCount ), does not analyze ( height, width ) neightbors,
    // does not non-linear, then it is equivalent to do nothing.
    //
    let depthwise_bDoesNothing = ( bChannelCountSame && bHeightWidthSame && bNoNeighborAnalysis && depthwise_bLinear );
    if ( depthwise_bDoesNothing )
      this.bDepthwiseRequestedAndNeeded = false; // depthwise is requested, but is not necessary.
    else
      this.bDepthwiseRequestedAndNeeded = true; // depthwise is requested and is necessary.
  }

  /**
   * Determine the following properties:
   *   - this.inputTensorCount
   *   - this.input1_height
   *   - this.input1_width
   *   - this.input1_channelCount
   *   - this.bDepthwiseRequestedAndNeeded
   *   - this.depthwisePadInfo (set if ( this.bDepthwiseRequestedAndNeeded == true ))
   *
   */
  static set_inputTensorCount_input1_height_width_channelCount_bDepthwiseRequestedAndNeeded_depthwisePadInfo_by(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    pointwise20ChannelCount, bPointwise20Bias
  ) {

    // 1. input tensor count.
    this.inputTensorCount = ValueDesc.ConvBlockType.Singleton.inputTensorCount_get( nConvBlockTypeId );

    // 2. depthwise information.

    // 2.1
    this.bDepthwiseRequestedAndNeeded = Params.set_bDepthwiseRequestedAndNeeded_by.call( this,
      input0_height, input0_width,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      bDepthwiseBias, depthwiseActivationId,
      nSqueezeExcitationChannelCountDivisor,
      bSqueezeExcitationPrefix,
      bPointwise20Bias
    );

    // 2.2
    if ( this.bDepthwiseRequestedAndNeeded ) { // When depthwise operation is necessary, infer its information.
      if ( !this.depthwisePadInfo ) {
        this.depthwisePadInfo = new Depthwise.PadInfoCalculatorRoot(
          input0_height, input0_width, input0_channelCount, 
          depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
      } else { // Re-using (instead of re-creating) may improve runtime speed.
        this.depthwisePadInfo.set(
          input0_height, input0_width, input0_channelCount, 
          depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
      }
    }

    // 3. input1 ( height, width, channelCount )

    if ( this.inputTensorCount <= 1 ) { // 3.1 No input1 (i.e. one input; only input0).
      this.input1_height = 0;
      this.input1_width = 0;
      this.input1_channelCount = 0;

    } else { // 3.2 Has input1 (i.e. two inputs).

      // 3.2.1 input1's height and width.
      if ( this.bDepthwiseRequestedAndNeeded ) { // When depthwise operation existed, it dominates height and width.
        this.input1_height = this.depthwisePadInfo.outputHeight;
        this.input1_width = this.depthwisePadInfo.outputWidth;
      } else {
        this.input1_height = input0_height;
        this.input1_width = input0_width;
      }

      // 3.2.2 input1's channel count
      switch ( nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY:
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL:
          this.input1_channelCount = pointwise20ChannelCount; // (Note: pointwise20 always exists.)
          break;

        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY:
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL:
          if ( this.bDepthwiseRequestedAndNeeded ) {
            this.input1_channelCount = this.depthwisePadInfo.outputChannelCount; // i.e. the same as depthwise1's output channel count.
          } else {
            if ( pointwise1ChannelCount > 0 ) {
              this.input1_channelCount = pointwise1ChannelCount;
            } else {
              this.input1_channelCount = input0_channelCount;
            }
          }
          break;

        default: // No input1 (i.e. one input; only input0). It should not execute to here.
          this.input1_height = 0;
          this.input1_width = 0;
          this.input1_channelCount = 0;

          tf.util.assert( ( this.inputTensorCount <= 1 ),
            `Block.Params.set_inputTensorCount_input1_height_width_channelCount_bDepthwiseRequestedAndNeeded_depthwisePadInfo_by(): `
              + `When ( nConvBlockTypeId == `
              + `${ValueDesc.ConvBlockType.Singleton.getStringOf( nConvBlockTypeId )}`
              + `(${nConvBlockTypeId}) ), `
              + `input tensor count ( ${this.inputTensorCount} ) should be one.`
          );
          break;
      }
    }
  }

  /**
   * Determine the following properties:
   *   - this.pointwise21ChannelCount
   */
  static set_pointwise21ChannelCount_by( nConvBlockTypeId, pointwise20ChannelCount ) {

    // Note: Even if ( outputTensorCount == 2 ), it does not means pointwise21 existed.
    let infoConvBlockType = ConvBlockType.Singleton.getInfoById( nConvBlockTypeId );
    if ( infoConvBlockType.bPointwise21 )
      this.pointwise21ChannelCount = pointwise20ChannelCount; // Still may be 0.
    else
      this.pointwise21ChannelCount = 0; // No pointwise21.
  }

  /**
   * Determine the following properties:
   *   - this.inputTensorCount
   *   - this.input1_height
   *   - this.input1_width
   *   - this.input1_channelCount
   *   - this.bDepthwiseRequestedAndNeeded
   *   - this.depthwisePadInfo (set if ( this.bDepthwiseRequestedAndNeeded == true ))
   *   - this.bDepthwise2Requested
   *   - this.bConcat1Requested
   *   - this.bAddInputToOutputRequested
   *   - this.bConcat2ShuffleSplitRequested
   *   - this.bHigherHalfDifferent
   *   - this.bHigherHalfDepthwise2
   *   - this.channelShuffler_outputGroupCount
   *   - this.pointwise21ChannelCount
   *   - this.outputTensorCount
   *
   */
  static set_inferencedParams_by(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    pointwise20ChannelCount, bPointwise20Bias
  ) {

    // 0. Prepare.
    let infoConvBlockType = ConvBlockType.Singleton.getInfoById( nConvBlockTypeId );

    // 1. The input1 channel count.
    Params.set_inputTensorCount_input1_height_width_channelCount_bDepthwiseRequestedAndNeeded_depthwisePadInfo_by.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      bDepthwiseBias, depthwiseActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      pointwise20ChannelCount, bPointwise20Bias
    );

    // 2. The output tensor count.
    this.outputTensorCount = infoConvBlockType.outputTensorCount;

    // 3.
    this.bDepthwise2Requested = infoConvBlockType.bDepthwise2Requested;
    this.bConcat1Requested = infoConvBlockType.bConcat1Requested;
    this.bAddInputToOutputRequested = infoConvBlockType.bAddInputToOutputRequested;
    this.bConcat2ShuffleSplitRequested = infoConvBlockType.bConcat2ShuffleSplitRequested;

    // 4. Whether manipulate the higher half channel of convolution.
    this.bHigherHalfDifferent = infoConvBlockType.bHigherHalfDifferent;
    this.bHigherHalfDepthwise2 = infoConvBlockType.bHigherHalfDepthwise2;
    this.channelShuffler_outputGroupCount = infoConvBlockType.channelShuffler_outputGroupCount;

    // 5. Pointwise21
    //
    // Note: Even if ( outputTensorCount == 2 ), it does not means pointwise21 existed.
    Params.set_pointwise21ChannelCount_by.call( this, nConvBlockTypeId, pointwise20ChannelCount );
  }

  get input0_height()                        { return this.parameterMapModified.get( Params.input0_height ); }
  get input0_width()                         { return this.parameterMapModified.get( Params.input0_width ); }
  get input0_channelCount()                  { return this.parameterMapModified.get( Params.input0_channelCount ); }

//!!! (2022/06/15 Remarked) Replaced by inferenced input1_channelCount.
//  get channelCount1_pointwise1Before()       { return this.parameterMapModified.get( Params.channelCount1_pointwise1Before ); }

  /** @return {number} The number version of nConvBlockTypeId. */
  get nConvBlockTypeId()          { return this.parameterMapModified.get( Params.nConvBlockTypeId ); }

  /** @return {string} The string version of nConvBlockTypeId. */
  get nConvBlockTypeName()        { return Params.nConvBlockTypeId.getStringOfValue( this.nConvBlockTypeId ); }

  get pointwise1ChannelCount()    { return this.parameterMapModified.get( Params.pointwise1ChannelCount ); }
  get bPointwise1Bias()           { return this.parameterMapModified.get( Params.bPointwise1Bias ); }
  get pointwise1ActivationId()    { return this.parameterMapModified.get( Params.pointwise1ActivationId ); }
  get pointwise1ActivationName()  { return Params.pointwise1ActivationId.getStringOfValue( this.pointwise1ActivationId ); }

  /** @return {number} The number version of the depthwise opertion. */
  get depthwise_AvgMax_Or_ChannelMultiplier() { return this.parameterMapModified.get( Params.depthwise_AvgMax_Or_ChannelMultiplier ); }

  /** @return {string} The string version of the depthwise opertion. */
  get depthwise_AvgMax_Or_ChannelMultiplier_Name() {
    return Params.depthwise_AvgMax_Or_ChannelMultiplier.getStringOfValue( this.depthwise_AvgMax_Or_ChannelMultiplier );
  }

  get depthwiseFilterHeight()     { return this.parameterMapModified.get( Params.depthwiseFilterHeight ); }
  get depthwiseFilterWidth()      { return this.parameterMapModified.get( Params.depthwiseFilterWidth ); }

  get depthwiseStridesPad()       { return this.parameterMapModified.get( Params.depthwiseStridesPad ); }
  get depthwiseStridesPadName()   { return ValueDesc.StridesPad.Singleton.getStringOf( this.depthwiseStridesPad ); }

  get bDepthwiseBias()            { return this.parameterMapModified.get( Params.bDepthwiseBias ); }
  get depthwiseActivationId()     { return this.parameterMapModified.get( Params.depthwiseActivationId ); }
  get depthwiseActivationName()   { return Params.depthwiseActivationId.getStringOfValue( this.depthwiseActivationId ); }

  get nSqueezeExcitationChannelCountDivisor()     { return this.parameterMapModified.get( Params.nSqueezeExcitationChannelCountDivisor ); }
  get nSqueezeExcitationChannelCountDivisorName() {
    return Params.nSqueezeExcitationChannelCountDivisor.getStringOfValue( this.nSqueezeExcitationChannelCountDivisor );
  }

  get bSqueezeExcitationPrefix()  { return this.parameterMapModified.get( Params.bSqueezeExcitationPrefix ); }

  get pointwise20ChannelCount()   { return this.parameterMapModified.get( Params.pointwise20ChannelCount ); }
  get bPointwise20Bias()          { return this.parameterMapModified.get( Params.bPointwise20Bias ); }
  get pointwise20ActivationId()   { return this.parameterMapModified.get( Params.pointwise20ActivationId ); }
  get pointwise20ActivationName() { return Params.pointwise20ActivationId.getStringOfValue( this.pointwise20ActivationId ); }

  // Note: pointwise21 use bias flag and activation id of pointwise20.
  get bPointwise21Bias()          { return this.bPointwise20Bias; }
  get pointwise21ActivationId()   { return this.pointwise20ActivationId; }
  get pointwise21ActivationName() { return this.pointwise20ActivationName; }

  get bKeepInputTensor()          { return this.parameterMapModified.get( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.

Params.input0_height =           new ParamDesc.Int(                     "input0_height",                   1, ( 10 * 1024 ) );
Params.input0_width =            new ParamDesc.Int(                     "input0_width",                    1, ( 10 * 1024 ) );

/** At least, there should be 1 input channel. */
Params.input0_channelCount =     new ParamDesc.Int(                "input0_channelCount", 1, ( 10 * 1024 ) );

//!!! (2022/06/15 Remarked) Replaced by inferenced input1_channelCount.
//Params.channelCount1_pointwise1Before =  new ParamDesc.Int(             "channelCount1_pointwise1Before", 0, ( 10 * 1024 ) );

Params.nConvBlockTypeId =                new ParamDesc.ConvBlockType(   "nConvBlockTypeId" );

Params.pointwise1ChannelCount =  new ParamDesc.Int(                     "pointwise1ChannelCount",         0, ( 10 * 1024 ) );
Params.bPointwise1Bias =         new ParamDesc.Bool(                    "bPointwise1Bias" );
Params.pointwise1ActivationId =  new ParamDesc.ActivationFunction(      "pointwise1ActivationId" );

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
Params.depthwiseFilterHeight =    new ParamDesc.Int(                     "depthwiseFilterHeight", 1, ( 10 * 1024 ) );
Params.depthwiseFilterWidth =     new ParamDesc.Int(                     "depthwiseFilterWidth",  1, ( 10 * 1024 ) );

Params.depthwiseStridesPad =      new ParamDesc.StridesPad(              "depthwiseStridesPad" );
Params.bDepthwiseBias =           new ParamDesc.Bool(                    "bDepthwiseBias" );
Params.depthwiseActivationId =    new ParamDesc.ActivationFunction(      "depthwiseActivationId" );

Params.nSqueezeExcitationChannelCountDivisor = new ParamDesc.SqueezeExcitationChannelCountDivisor( "nSqueezeExcitationChannelCountDivisor" );
Params.bSqueezeExcitationPrefix = new ParamDesc.Bool(                   "bSqueezeExcitationPrefix" );

// Note: Force pointwise20ChannelCount always not zero. So that input0_channelCount_higherHalf could be determined
// when
//   - ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5)
//   - ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_TAIL (6)
//
Params.pointwise20ChannelCount =  new ParamDesc.Int(                     "pointwise20ChannelCount", 1, ( 10 * 1024 ) );
Params.bPointwise20Bias =         new ParamDesc.Bool(                    "bPointwise20Bias" );
Params.pointwise20ActivationId =  new ParamDesc.ActivationFunction(      "pointwise20ActivationId" );

Params.bKeepInputTensor =         new ParamDesc.Bool(                    "bKeepInputTensor" );

