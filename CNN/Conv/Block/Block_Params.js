export { Params };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as Depthwise from "../Depthwise.js";

/**
 * Pointwise-depthwise-pointwise convolution block parameters.
 *
 * @member {number} input1_channelCount
 *   The channel count of the second input (i.e. input1). This is referred (estimated) from other parameters. The inputTensors[ 1 ]'s
 * channel count of Block.apply() should match this value. The Block.inChannels1 should also the same this value.
 *
 * @member {boolean} bDepthwiseRequestedAndNeeded
 *   Whether depthwise operation is requested and necessary.
 *
 * @member {boolean} bPointwise21
 *   Whether the 2nd pointwise2 existed.
 *
 * @member {number} pointwise21ChannelCount
 *   The output channel count of the second pointwise2 convolution. If ( bPointwise21 == false ), then ( pointwise21ChannelCount == 0 ).
 *
 * @member {boolean} bPointwise21Bias
 *   If true, there will be a bias after pointwise21 (i.e. the second pointwise2 convolution). It is always the same as
 * bPointwise20Bias. It is only meaningful if ( pointwise21ChannelCount > 0 ).
 *
 * @member {number} pointwise21ActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after pointwise21 (i.e. the second
 * pointwise2 convolution). It is always the same as pointwise20ActivationId. It is only meaningful if ( pointwise21ChannelCount > 0 ).
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
   * @param {number} channelCount0_pointwise1Before
   *   The channel count of apply()'s first input image (i.e. inputTensors[ 0 ]; input0). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of apply()'s second input image (i.e. inputTensors[ 1 ]; input1). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} nConvBlockTypeId
   *   The convolution type id of the block (i.e. ValueDesc.ConvBlockType.Singleton.Ids.Xxx). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *

//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//    * @param {number} channelCount1_pointwise1Before
//    *   The channel count of apply()'s second input image (i.e. inputTensors[ 1 ]; input1). If null, it will be extracted
//    * from inputFloat32Array (i.e. by evolution).
//    *
//    *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.SHUFFLE_NET_V2_HEAD (-6): (ShuffleNetV2's head).
//    *       - The input1 will not be used at all (will be ignored completely).
//    *       - The input0 will be processed by two pathes: one is by pointwise1 and depthwise1 operation, the other is by depthwise2
//    *           operation (without pointwise1).
//    *       - These two depthwise operations will have the same configurations (i.e. same depthwise_AvgMax_Or_ChannelMultiplier,
//    *           depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId) but have
//    *           different (filter and bias) weights.
//    *       - The two depthwise results will be processed by itself pointwise indidually.
//    *       - The two pointwise results will be concatenated, shuffled, splitted.
//    *
//    *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_HALF_THROUGH (-5): (ShuffleNetV2_ByMobileNetV1's body/tail)
//    *       - The input1 will not be used at all (will be ignored completely).
//    *       - The input0 will be processed by pointwise1, depthwise1 operation, and pointwise2 convolution.
//    *       - ( bOutput1Requested is ignored. The output1 never esixts.)
//    *       - It uses the same procedure as Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT (0).
//    *       - The higher half of pointwise1, depthwise1, pointwise2 just pass through (i.e. do not change) the higher half of input0.
//    *       - The lower half of pointwise2's result will be shuffled with the higher half of pointwise2's result.
//    *       - Compared to TWO_INPUTS_CONCAT_POINTWISE20_INPUT1 (-3) (ShuffleNetV2's body/tail), it is slower in backend CPU because
//    *           of more computations. But strangely, it seems faster in backend WASM and WEBGL.
//    *
//    *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4): (ShuffleNetV2_ByMobileNetV1's head)
//    *       - Almost the same as ONE_INPUT_HALF_THROUGH (-5).
//    *       - The pointwise1 will double channel count by copying input0 to higher half channels.
//    *       - The depthwise1 will process (not just pass through) the higher half channels.
//    *       - Compared to SHUFFLE_NET_V2_BY_POINTWISE21_HEAD (-2) (simplified ShuffleNetV2's head), it is slower in backend CPU because
//    *           of more computations. But strangely, it seems faster in backend WASM and WEBGL.
//    *
//    *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE20_INPUT1 (-3): (ShuffleNetV2's body/tail)
//    *       - The input1 should exist. The channel count of input1 must be the same as pointwise20's result (i.e.
//    *           channelCount_pointwise20After_concat2Before) (Note: not pointwise20ChannelCount because pointwise20ChannelCount may
//    *           be zero). The result of pointwise20 (which operates on input0) will be concatenated with input1.
//    *
//    *       - If ( bOutput1Requested == true ): (ShuffleNetV2's body)
//    *           - The concatenated [ pointwise20, input1 ] will be channel-shuffled and splitted into [ output0, output1 ].
//    *           - The output0 and output1 will have the same channel count as pointwise20 result (i.e. channelCount_pointwise20After_concat2Before).
//    *
//    *       - If ( bOutput1Requested == false ): (ShuffleNetV2's tail)
//    *           - The concatenated [ pointwise20, input1 ] will become output0.
//    *           - The output0 will have twice channel count as pointwise20 result (i.e. ( channelCount_pointwise20After_concat2Before * 2 ) ).
//    *
//    *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD (-2): (ShuffleNetV2_ByPointwise21's head).
//    *       - The input1 will not be used at all (will be ignored completely).
//    *       - The input0 will be processed by two pathes: one is by pointwise1 and depthwise1 operation, the other is by depthwise2
//    *           operation (without pointwise1).
//    *       - These two depthwise operations will have the same configurations (i.e. same depthwise_AvgMax_Or_ChannelMultiplier,
//    *           depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId) but have
//    *           different (filter and bias) weights.
//    *       - The two depthwise results will be concatenated. The concatenated result will be processed by pointwise2 convolution.
//    *
//    *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_ADD_TO_OUTPUT (-1): (MobileNetV2's body and tail).
//    *       - The input1 will not be used at all (will be ignored completely).
//    *       - The input0 will be processed by pointwise1, depthwise1 operation, and pointwise2 convolution.
//    *       - The input0 will be added to the result of pointwise2.
//    *       - This is the only one case which will do add-input-to-output.
//    *
//    *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT (0): (MobileNetV1 or MobileNetV2's head
//    *       or ShuffleNetV2_ByPointwise21's head with ( pointwise1ChannelCount == 0 ) ).
//    *       - The input1 will not be used at all (will be ignored completely).
//    *       - The input0 will be processed by pointwise1, depthwise1 operation, and pointwise2 convolution.
//    *
//    *   - ( channelCount1_pointwise1Before > 0 ): TWO_INPUTS: (ShuffleNetV2_ByPointwise21's body/tail).
//    *       - It should be the channel count of input1.
//    *
//    *       - The input1 will not be processed by any pointwise1 and depthwise operation.
//    *
//    *       - The input1 will be concatenated with the result of depthwise operation of input0. The concatenated result will be
//    *           processed by pointwise2 convolution.
//    *
//    *       - The output0 will be the result of pointwise20.
//    *
//    *       - If ( bOutput1Requested == true ), the output1 will be the result of pointwise21.
//    *
//    *
//
// //!!! ...unfinished... (2021/07/27)
// // Perhaps, ( channelCount1_pointwise1Before == -7 ): ONE_INPUT_TWO_DEPTHWISE_ONE_MAX_POOLING
// //
// // A max pooling will be used as a branch of input0. The max pooling result of input0 should be concatenated with the
// // two depthwise convolutions' result of input0. The reason is that max pooling could provide information which is difficult achieved
// // by a depthwise convolution. (Thinks that for a while: how to calculate maximum value by linear combination (i.e. add-multiply).)


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

//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//    * @param {number} bOutput1Requested
//    *   Whether to generate output1. Sometimes, it also control whether to create pointwise21. The reason why not let caller specify
//    * pointwise21ChannelCount directly is for ensuring that the pointwise21ChannelCount is either 0 or the same as pointwise20's
//    * result (otherwise the concat-shuffle-split could not work). (Please see the explanation of channelCount1_pointwise1Before and
//    * pointwise21ChannelCount, too.)
//    *
//    *     - If ( bOutput1Requested == null ), it will be extracted from inputFloat32Array (i.e. by evolution). 
//    *
//    *     - If ( bOutput1Requested == false ), there is always no output1.
//    *
//    *     - If ( bOutput1Requested == true ):
//    *
//    *       - If ( this.channelCount1_pointwise1Before
//    *                == Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE20_INPUT1 )
//    *           (-3) (ShuffleNetV2's body/tail),
//    *           the output1 will exist. Its channel count will be channelCount_pointwise20After_concat2Before.
//    *
//    *       - If ( this.channelCount1_pointwise1Before
//    *                == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 )
//    *           (-4) (ShuffleNetV2_ByMobileNetV1's head),
//    *           the output1 never exists.
//    *
//    *       - If ( this.channelCount1_pointwise1Before
//    *                == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH )
//    *           (-5) (ShuffleNetV2_ByMobileNetV1's body/tail),
//    *           the output1 never exists.
//    *
//    *       - Otherwise:
//    *
//    *         - If ( pointwise20ChannelCount > 0 ), then ( pointwise21ChannelCount > 0 ), the output1 will exist. Its channel
//    *             count will be pointwise21ChannelCount. Its bias flag and activation function will also be the same as pointwise20.
//    *
//    *         - If ( pointwise20ChannelCount <= 0 ), then ( pointwise21ChannelCount <= 0 ), there will be no output1.

   *
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks. If it is null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   */
  constructor( inputFloat32Array, byteOffsetBegin,
    input0_height, input0_width,
    channelCount0_pointwise1Before,
    channelCount1_pointwise1Before,
    nConvBlockTypeId,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    pointwise20ChannelCount, bPointwise20Bias, pointwise20ActivationId,

//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//    bOutput1Requested,

    bKeepInputTensor
  ) {

    let parameterMap = new Map( [
      [ Params.input0_height,                          input0_height ],
      [ Params.input0_width,                           input0_width ],
      [ Params.channelCount0_pointwise1Before,        channelCount0_pointwise1Before ],
      [ Params.channelCount1_pointwise1Before,        channelCount1_pointwise1Before ],
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

//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//      [ Params.bOutput1Requested,                     bOutput1Requested ],

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
    Params.setFlags_by.call( this,
      this.input0_height, this.input0_width,
      this.channelCount0_pointwise1Before, this.channelCount1_pointwise1Before,
      this.nConvBlockTypeId,
      this.pointwise1ChannelCount,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth, this.depthwiseStridesPad,
      this.bDepthwiseBias, this.depthwiseActivationId,
      this.nSqueezeExcitationChannelCountDivisor, this.bSqueezeExcitationPrefix,
      this.pointwise20ChannelCount, this.bPointwise20Bias,

//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//      this.bOutput1Requested
    );

    return bExtractOk;
  }

  /**
   * Determine the following properties:
   *   - this.inputTensorCount
   */
//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//   static set_inputTensorCount_by( channelCount1_pointwise1Before ) {
//
//     // The input tensor count is totally determined by channelCount1_pointwise1Before.
//     if (   ( channelCount1_pointwise1Before > 0 )
//         || ( channelCount1_pointwise1Before
//                == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE20_INPUT1 ) // (-3)
//        )
//       this.inputTensorCount = 2; // Two inputs.
//     else
//       this.inputTensorCount = 1; // One input.

  static set_inputTensorCount_by( nConvBlockTypeId ) {
    this.inputTensorCount = ValueDesc.ConvBlockType.Singleton.inputTensorCount_get( nConvBlockTypeId );
  }

  /**
   * Determine the following properties:
   *   - this.outputTensorCount
   */
//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//   static set_outputTensorCount_by( channelCount1_pointwise1Before, pointwise20ChannelCount, bOutput1Requested ) {
//
//     // 1.
//     if ( bOutput1Requested == true )
//       this.outputTensorCount = 2; // Two outputs.
//     else
//       this.outputTensorCount = 1; // One output.
//
//     // 2.1 In (-3) (ShuffleNetV2's body/tail), The output tensor count is totally determined by bOutput1Requested.
//     if ( channelCount1_pointwise1Before
//            == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE20_INPUT1 ) { // (-3)
//       // Do nothing.
//
//     // 2.2 In (-4) (ShuffleNetV2_ByMobileNetV1's head) and (-5) (ShuffleNetV2_ByMobileNetV1's body/tail), The output tensor count is always 1.
//     } else if (   ( channelCount1_pointwise1Before
//                      == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 ) // (-4)
//                || ( channelCount1_pointwise1Before
//                      == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) // (-5)
//               ) {
//       this.outputTensorCount = 1; // One output.
//
//     // 2.3 Otherwise, pointwise21 is output1 directly. The pointwise21ChannelCount (which is determined by pointwise20ChannelCount)
//     //     determines it.
//     } else {
//       if ( pointwise20ChannelCount == 0 ) { // No pointwise20, then no pointwise21. So only one output.
//         this.outputTensorCount = 1; // One output.
//       }
//     }

  static set_outputTensorCount_by( nConvBlockTypeId ) {
    this.inputTensorCount = ValueDesc.ConvBlockType.Singleton.outputTensorCount_get( nConvBlockTypeId );
  }

  /**
   * Determine the following properties:
   *   - this.input1_channelCount
   */
  static set_input1_channelCount_by(
           channelCount1_pointwise1Before,
           nConvBlockTypeId,
           pointwise1ChannelCount, pointwise20ChannelCount ) {

//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//     if ( channelCount1_pointwise1Before > 0 ) { // Two inputs.
//       this.input1_channelCount = channelCount1_pointwise1Before; // The second input's channel count as specifying.
//
//     } else if ( channelCount1_pointwise1Before
//                   == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE20_INPUT1 ) { // (-3) Two inputs.
//
//       this.input1_channelCount = pointwise20ChannelCount;
//
//     } else { // One input.
//       this.input1_channelCount = 0;
//     }

    let inputTensorCount = ValueDesc.ConvBlockType.Singleton.inputTensorCount_get( nConvBlockTypeId );
    switch ( nConvBlockTypeId ) {
      case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY:
      case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL:
        this.input1_channelCount = pointwise20ChannelCount;
        break;

      case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY:
      case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL:
        
//!!! ...unfinished... (2022/06/14)
// Perhaps, deprecate channelCount1_pointwise1Before since it should be the same as channelCount0_pointwise1Before in this case.
// It could be inferenced totally. (input1_height, input1_width, input1_channelCount)

        this.input1_channelCount = channelCount1_pointwise1Before; // The second input's channel count as specifying.
        break;

      default: // One input.
        this.input1_channelCount = 0;
        break;
    }
  }

  /**
   * Determine the following properties:
   *   - this.bDepthwiseRequestedAndNeeded
   *
   * When got false, the depthwise could be discarded to improve performance.
   */
  static set_bDepthwiseRequestedAndNeeded_by(
    inputHeight, inputWidth,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor,
    bSqueezeExcitationPrefix,
    bPointwise20Bias
  ) {

    if ( depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) {
      this.bDepthwiseRequestedAndNeeded = false; // depthwise is not requested.
      return;
    }

    let stridesPadInfo = ValueDesc.StridesPad.Singleton.getInfoById( depthwiseStridesPad );

    let bChannelCountSame = Depthwise.PadInfoCalculatorRoot.output_channelCount_is_same_as_input( depthwise_AvgMax_Or_ChannelMultiplier );

    let bHeightWidthSame = Depthwise.PadInfoCalculatorRoot.output_height_width_is_same_as_input( inputHeight, inputWidth,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, stridesPadInfo );

    let bNoNeighborAnalysis = Depthwise.PadInfoCalculatorRoot.output_height_width_is_no_neighbor_analysis( inputHeight, inputWidth,
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
   *   - this.input1_channelCount
   *   - this.bDepthwiseRequestedAndNeeded
   *   - this.bDepthwise2Requested
   *   - this.bConcat1Requested
   *   - this.bAddInputToOutputRequested
   *   - this.bConcat2ShuffleSplitRequested
   *   - this.bHigherHalfDifferent
   *   - this.bHigherHalfDepthwise2
   *   - this.bPointwise21
   *   - this.pointwise21ChannelCount
   *   - this.outputTensorCount
   *
   */
  static setFlags_by(
    inputHeight, inputWidth,
    channelCount0_pointwise1Before, channelCount1_pointwise1Before,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    bDepthwiseBias, depthwiseActivationId,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    pointwise20ChannelCount, bPointwise20Bias
  ) {

    // 0. Prepare.

    let infoConvBlockType = ConvBlockType.Singleton.getInfoById( nConvBlockTypeId );

    // 0.1 The input tensor count is totally determined by channelCount1_pointwise1Before.
    Params.set_inputTensorCount_by.call( this, nConvBlockTypeId );

    // 0.2 The output tensor count.
    Params.set_outputTensorCount_by.call( this, nConvBlockTypeId );

    // 0.3 The (estimated) input1 channel count.
    Params.set_input1_channelCount_by.call( this, channelCount1_pointwise1Before, pointwise1ChannelCount, pointwise20ChannelCount );

    // 0.4 Whether depthwise is requested and necessary.
    Params.set_bDepthwiseRequestedAndNeeded_by.call( this,
      inputHeight, inputWidth,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      bDepthwiseBias, depthwiseActivationId,
      nSqueezeExcitationChannelCountDivisor,
      bSqueezeExcitationPrefix,
      bPointwise20Bias
    );

    // 1.
    this.bDepthwise2Requested = infoConvBlockType.bDepthwise2Requested;
    this.bConcat1Requested = infoConvBlockType.bConcat1Requested;
    this.bAddInputToOutputRequested = infoConvBlockType.bAddInputToOutputRequested;
    this.bConcat2ShuffleSplitRequested = infoConvBlockType.bConcat2ShuffleSplitRequested;

    // 2. Whether manipulate the higher half channel of convolution.
    this.bHigherHalfDifferent = infoConvBlockType.bHigherHalfDifferent;
    this.bHigherHalfDepthwise2 = infoConvBlockType.bHigherHalfDepthwise2;

    // 3. Pointwise21
    //
    // Note: Even if ( outputTensorCount == 2 ), it does not means pointwise21 existed.
    Params.set_pointwise21ChannelCount_by.call( this, nConvBlockTypeId, pointwise20ChannelCount );
  }

  get input0_height()                        { return this.parameterMapModified.get( Params.input0_height ); }
  get input0_width()                         { return this.parameterMapModified.get( Params.input0_width ); }
  get channelCount0_pointwise1Before()      { return this.parameterMapModified.get( Params.channelCount0_pointwise1Before ); }
  get channelCount1_pointwise1Before()      { return this.parameterMapModified.get( Params.channelCount1_pointwise1Before ); }

  /** @return {number} The number version of nConvBlockTypeId. */
  get nConvBlockTypeId()      { return this.parameterMapModified.get( Params.nConvBlockTypeId ); }

  /** @return {string} The string version of nConvBlockTypeId. */
  get nConvBlockTypeName() {
    return Params.nConvBlockTypeId.getStringOfValue( this.nConvBlockTypeId );
  }

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

//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//  get bOutput1Requested()         { return this.parameterMapModified.get( Params.bOutput1Requested ); }

  // Note: pointwise21 use bias flag and activation id of pointwise20.
  get bPointwise21Bias()          { return this.bPointwise20Bias; }
  get pointwise21ActivationId()   { return this.pointwise20ActivationId; }
  get pointwise21ActivationName() { return this.pointwise20ActivationName; }

  get bKeepInputTensor()          { return this.parameterMapModified.get( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.

Params.input0_height =            new ParamDesc.Int(                     "input0_height",                   1, ( 10 * 1024 ) );
Params.input0_width =             new ParamDesc.Int(                     "input0_width",                    1, ( 10 * 1024 ) );

/** At least, there should be 1 input channel. */
Params.channelCount0_pointwise1Before =  new ParamDesc.Int(             "channelCount0_pointwise1Before", 1, ( 10 * 1024 ) );

//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//Params.channelCount1_pointwise1Before =  new ParamDesc.channelCount1_pointwise1Before( "channelCount1_pointwise1Before" );
Params.channelCount1_pointwise1Before =  new ParamDesc.Int(             "channelCount1_pointwise1Before", 0, ( 10 * 1024 ) );

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
Params.depthwiseFilterHeight =   new ParamDesc.Int(                     "depthwiseFilterHeight", 1, ( 10 * 1024 ) );
Params.depthwiseFilterWidth =    new ParamDesc.Int(                     "depthwiseFilterWidth",  1, ( 10 * 1024 ) );

Params.depthwiseStridesPad =     new ParamDesc.StridesPad(              "depthwiseStridesPad" );
Params.bDepthwiseBias =          new ParamDesc.Bool(                    "bDepthwiseBias" );
Params.depthwiseActivationId =   new ParamDesc.ActivationFunction(      "depthwiseActivationId" );

Params.nSqueezeExcitationChannelCountDivisor = new ParamDesc.SqueezeExcitationChannelCountDivisor( "nSqueezeExcitationChannelCountDivisor" );
Params.bSqueezeExcitationPrefix = new ParamDesc.Bool(                   "bSqueezeExcitationPrefix" );

// Note: Force pointwise20ChannelCount always not zero. So that channelCount0_pointwise1Before_higherHalf could be determined
// when ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH (-5).
Params.pointwise20ChannelCount = new ParamDesc.Int(                     "pointwise20ChannelCount", 1, ( 10 * 1024 ) );
Params.bPointwise20Bias =        new ParamDesc.Bool(                    "bPointwise20Bias" );
Params.pointwise20ActivationId = new ParamDesc.ActivationFunction(      "pointwise20ActivationId" );

//!!! (2022/06/14 Remarked) replaced by ConvBlockType.
//Params.bOutput1Requested =       new ParamDesc.Bool(                    "bOutput1Requested" );

Params.bKeepInputTensor =        new ParamDesc.Bool(                    "bKeepInputTensor" );

