export { Params };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";


//!!! ...unfinished... (2021/08/18)
// tf.batchNorm() is faster than tf.add() when with broadcasting by CPU.
// Whether batchNorm could be used as bias? even activation function?
//


/**
 * Pointwise-depthwise-pointwise convolution layer parameters.
 *
 * @member {number} input1ChannelCount
 *   The channel count of the second input (i.e. input1). This is referred (estimated) from other parameters. The inputTensors[ 1 ]'s
 * channel count of PointDepthPoint.apply() should match this value. The PointDepthPoint.inChannels1 should also the same this value.
 *
 * @member {number} pointwise22ChannelCount
 *   The output channel count of the second pointwise2 convolution. If ( pointwise21ChannelCount == 0 ) and
 * ( pointwise22ChannelCount == 0 ), there will be no pointwise convolution after depthwise convolution. The pointwise22
 * convolution could achieve some kinds of channel shuffling of ShuffleNetV2_ByPointwise22.
 *
 *     - If this.channelCount1_pointwise1Before is the following, pointwise22ChannelCount is always 0.
 *       - Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1
 *         (-3) (ShuffleNetV2's body/tail).
 *
 *       - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1
 *         (-4) (ShuffleNetV2_ByMobileNetV1's head).
 *
 *       - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_HALF_THROUGH
 *         (-5) (ShuffleNetV2_ByMobileNetV1's body/tail).
 *
 *     - Otherwise,
 *         - If ( bOutput1Requested == false ), it will be 0.
 *         - If ( bOutput1Requested == true ), it will be the same as pointwise21ChannelCount (note: might also be 0).
 *
 * @member {boolean} bPointwise22Bias
 *   If true, there will be a bias after pointwise22 (i.e. the second pointwise2 convolution). It is always the same as
 * bPointwise21Bias. It is only meaningful if ( pointwise22ChannelCount > 0 ).
 *
 * @member {number} pointwise22ActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after pointwise22 (i.e. the second
 * pointwise2 convolution). It is always the same as pointwise21ActivationId. It is only meaningful if ( pointwise22ChannelCount > 0 ).
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
   * @param {number} inputHeight0
   *   The height of apply()'s first input image (i.e. inputTensors[ 0 ]; input0). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} inputWidth0
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
   *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_HALF_THROUGH (-5): (ShuffleNetV2_ByMobileNetV1's body/tail)
   *       - The input1 will not be used at all (will be ignored completely).
   *       - The input0 will be processed by pointwise1, depthwise1 operation, and pointwise2 convolution.
   *       - ( bOutput1Requested is ignored. The output1 never esixts.)
   *       - It uses the same procedure as Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT (0).
   *       - The higher half of pointwise1, depthwise1, pointwise2 just pass through (i.e. do not change) the higher half of input0.
   *       - The lower half of pointwise2's result will be shuffled with the higher half of pointwise2's result.
   *       - Compared to TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3) (ShuffleNetV2's body/tail), it is slower in backend CPU because
   *           of more computations. But strangely, it seems faster in backend WASM and WEBGL.
   *
   *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4): (ShuffleNetV2_ByMobileNetV1's head)
   *       - Almost the same as ONE_INPUT_HALF_THROUGH (-5).
   *       - The only different is that the higher half of depthwise1 does not just pass through.
   *       - Compared to ONE_INPUT_TWO_DEPTHWISE (-2) (simplified ShuffleNetV2's head), it is slower in backend CPU because
   *           of more computations. But strangely, it seems faster in backend WASM and WEBGL.
   *
   *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3): (ShuffleNetV2's body/tail)
   *       - The input1 should exist. The channel count of input1 must be the same as pointwise21's result (i.e.
   *           channelCount_pointwise21After_concat2Before) (Note: not pointwise21ChannelCount because pointwise21ChannelCount may
   *           be zero). The result of pointwise21 (which operates on input0) will be concatenated with input1.
   *
   *       - If ( bOutput1Requested == true ): (ShuffleNetV2's body)
   *           - The concatenated [ pointwise21, input1 ] will be channel-shuffled and splitted into [ output0, output1 ].
   *           - The output0 and output1 will have the same channel count as pointwise21 result (i.e. channelCount_pointwise21After_concat2Before).
   *
   *       - If ( bOutput1Requested == false ): (ShuffleNetV2's tail)
   *           - The concatenated [ pointwise21, input1 ] will become output0.
   *           - The output0 will have twice channel count as pointwise21 result (i.e. ( channelCount_pointwise21After_concat2Before * 2 ) ).
   *
   *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_TWO_DEPTHWISE (-2): (simplified ShuffleNetV2's head).
   *       - The input1 will not be used at all (will be ignored completely).
   *       - The input0 will be processed by two pathes: one is by pointwise1 and depthwise1 operation, the other is by depthwise2
   *           operation (without pointwise1).
   *       - These two depthwise operations will have the same configurations (i.e. same depthwise_AvgMax_Or_ChannelMultiplier,
   *           depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId) but have different
   *           (filter and bias) weights.
   *       - The two depthwise results will be concatenated. The concatenated result will be processed by pointwise2 convolution.
   *       - This is the only one case which there will be depthwise2.
   *
   *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_ADD_TO_OUTPUT (-1): (MobileNetV2's body and tail).
   *       - The input1 will not be used at all (will be ignored completely).
   *       - The input0 will be processed by pointwise1, depthwise1 operation, and pointwise2 convolution.
   *       - The input0 will be added to the result of pointwise2.
   *       - This is the only one case which will do add-input-to-output.
   *
   *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT (0): (MobileNetV1 or MobileNetV2's head
   *       or simplified ShuffleNetV2(_ByPointwise22)'s head with ( pointwise1ChannelCount == 0 ) ).
   *       - The input1 will not be used at all (will be ignored completely).
   *       - The input0 will be processed by pointwise1, depthwise1 operation, and pointwise2 convolution.
   *
   *   - ( channelCount1_pointwise1Before > 0 ): TWO_INPUTS: (ShuffleNetV2_ByPointwise22's body/tail).
   *       - It should be the channel count of input1.
   *
   *       - The input1 will not be processed by any pointwise1 and depthwise operation.
   *
   *       - The input1 will be concatenated with the result of depthwise operation of input0. The concatenated result will be
   *           processed by pointwise2 convolution.
   *
   *       - The output0 will be the result of pointwise21.
   *
   *       - If ( bOutput1Requested == true ), the output1 will be the result of pointwise22.
   *
   *

//!!! ...unfinished... (2021/07/27)
// Perhaps, ( channelCount1_pointwise1Before == -6 ): ONE_INPUT_TWO_DEPTHWISE_ONE_MAX_POOLING
//
// A max pooling will be used as a branch of input0. The max pooling result of input0 should be concatenated with the
// two depthwise convolutions' result of input0. The reason is that max pooling could provide information which is difficult achieved
// by a depthwise convolution. (Thinks that for a while: how to calculate maximum value by linear combination (i.e. add-multiply).)


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
   * If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this depthwiseStridesPad will also be ignored. It has three possible value:
   *   - 0: means ( depthwiseStrides == 1 ) and ( depthwisePad == "valid" )
   *   - 1: means ( depthwiseStrides == 1 ) and ( depthwisePad == "same" )
   *   - 2: means ( depthwiseStrides == 2 ) and ( depthwisePad == "same" )
   * Default is 1 because ( depthwiseStrides == 1 ) and ( depthwisePad == "same" ) is a pre-condition for ( bAddInputToOutputRequested == true ).
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
   * @param {number} pointwise21ChannelCount
   *   The output channel count of the first pointwise2 convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ), there will be no pointwise convolution after depthwise convolution.
   *
   * @param {boolean} bPointwise21Bias
   *   If true, there will be a bias after the first pointwise2 convolution. If null, it will be extracted from inputFloat32Array (i.e. by
   * evolution). If ( pointwise21ChannelCount == 0 ), this bias will also be ignored.
   *
   * @param {number} pointwise21ActivationId
   *   The activation function id (Params.pointwise21ActivationId.valueDesc.Ids.Xxx) after the first pointwise1 convolution. If null,
   * it will be extracted from inputFloat32Array (i.e. by evolution). If ( pointwise21ChannelCount == 0 ), this activation function
   * will also be ignored.
   *
   * @param {number} bOutput1Requested
   *   Whether to generate output1. Sometimes, it also control whether to create pointwise22. The reason why not let caller specify
   * pointwise22ChannelCount directly is for ensuring that the pointwise22ChannelCount is either 0 or the same as pointwise21's
   * result (otherwise the concat-shuffle-split could not work). (Please see the explanation of channelCount1_pointwise1Before and
   * pointwise22ChannelCount, too.)
   *
   *     - If ( bOutput1Requested == null ), it will be extracted from inputFloat32Array (i.e. by evolution). 
   *
   *     - If ( bOutput1Requested == false ), there is always no output1.
   *
   *     - If ( bOutput1Requested == true ):
   *
   *       - If ( this.channelCount1_pointwise1Before
   *                == Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
   *           (-3) (ShuffleNetV2's body/tail),
   *           the output1 will exist. Its channel count will be channelCount_pointwise21After_concat2Before.
   *
   *       - If ( this.channelCount1_pointwise1Before
   *                == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 )
   *           (-4) (ShuffleNetV2_ByMobileNetV1's head),
   *           the output1 never exists.
   *
   *       - If ( this.channelCount1_pointwise1Before
   *                == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH )
   *           (-5) (ShuffleNetV2_ByMobileNetV1's body/tail),
   *           the output1 never exists.
   *
   *       - Otherwise:
   *
   *         - If ( pointwise21ChannelCount > 0 ), then ( pointwise22ChannelCount > 0 ), the output1 will exist. Its channel
   *             count will be pointwise22ChannelCount. Its bias flag and activation function will also be the same as pointwise21.
   *
   *         - If ( pointwise21ChannelCount <= 0 ), then ( pointwise22ChannelCount <= 0 ), there will be no output1.
   *
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks. If it is null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   */
  constructor( inputFloat32Array, byteOffsetBegin,
    inputHeight0, inputWidth0,
    channelCount0_pointwise1Before,
    channelCount1_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    bOutput1Requested,
    bKeepInputTensor
  ) {

//!!! ...unfinished...
// squeeze-and-excitation ?

    let parameterMap = new Map( [
      [ Params.inputHeight0,                          inputHeight0 ],
      [ Params.inputWidth0,                           inputWidth0 ],
      [ Params.channelCount0_pointwise1Before,        channelCount0_pointwise1Before ],
      [ Params.channelCount1_pointwise1Before,        channelCount1_pointwise1Before ],
      [ Params.pointwise1ChannelCount,                pointwise1ChannelCount ],
      [ Params.bPointwise1Bias,                       bPointwise1Bias ],
      [ Params.pointwise1ActivationId,                pointwise1ActivationId ],
      [ Params.depthwise_AvgMax_Or_ChannelMultiplier, depthwise_AvgMax_Or_ChannelMultiplier ],
      [ Params.depthwiseFilterHeight,                 depthwiseFilterHeight ],
      [ Params.depthwiseFilterWidth,                  depthwiseFilterWidth ],
      [ Params.depthwiseStridesPad,                   depthwiseStridesPad ],
      [ Params.bDepthwiseBias,                        bDepthwiseBias ],
      [ Params.depthwiseActivationId,                 depthwiseActivationId ],
      [ Params.pointwise21ChannelCount,               pointwise21ChannelCount ],
      [ Params.bPointwise21Bias,                      bPointwise21Bias ],
      [ Params.pointwise21ActivationId,               pointwise21ActivationId ],
      [ Params.bOutput1Requested,                     bOutput1Requested ],
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
      this.channelCount0_pointwise1Before, this.channelCount1_pointwise1Before,
      this.pointwise1ChannelCount, this.depthwise_AvgMax_Or_ChannelMultiplier, this.pointwise21ChannelCount, this.bOutput1Requested );

    return bExtractOk;
  }

  /**
   * Determine the following properties:
   *   - this.inputTensorCount
   */
  static set_inputTensorCount_by( channelCount1_pointwise1Before ) {

    // The input tensor count is totally determined by channelCount1_pointwise1Before.
    if (   ( channelCount1_pointwise1Before > 0 )
        || ( channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) // (-3)
       )
      this.inputTensorCount = 2; // Two inputs.
    else
      this.inputTensorCount = 1; // One input.
  }

  /**
   * Determine the following properties:
   *   - this.outputTensorCount
   */
  static set_outputTensorCount_by( channelCount1_pointwise1Before, pointwise21ChannelCount, bOutput1Requested ) {

    // 1.
    if ( bOutput1Requested == true )
      this.outputTensorCount = 2; // Two outputs.
    else
      this.outputTensorCount = 1; // One output.

    // 2.1 In (-3) (ShuffleNetV2's body/tail), The output tensor count is totally determined by bOutput1Requested.
    if ( channelCount1_pointwise1Before
           == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) { // (-3)
      // Do nothing.

    // 2.2 In (-4) (ShuffleNetV2_ByMobileNetV1's head) and (-5) (ShuffleNetV2_ByMobileNetV1's body/tail), The output tensor count is always 1.
    } else if (   ( channelCount1_pointwise1Before
                     == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 ) // (-4)
               || ( channelCount1_pointwise1Before
                     == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) // (-5)
              ) {
      this.outputTensorCount = 1; // One output.

    // 2.3 Otherwise, pointwise22 is output1 directly. The pointwise22ChannelCount (which is determined by pointwise21ChannelCount)
    //     determines it.
    } else {
      if ( pointwise21ChannelCount == 0 ) { // No pointwise21, then no pointwise22. So only one output.
        this.outputTensorCount = 1; // One output.
      }
    }
  }

  /**
   * Determine the following properties:
   *   - this.input1ChannelCount
   */
  static set_input1ChannelCount_by(
           channelCount0_pointwise1Before, channelCount1_pointwise1Before,
           pointwise1ChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, pointwise21ChannelCount ) {

    if ( channelCount1_pointwise1Before > 0 ) { // Two inputs.
      this.input1ChannelCount = channelCount1_pointwise1Before; // The second input's channel count as specifying.

    } else if ( channelCount1_pointwise1Before
                  == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) { // (-3) Two inputs.

      this.input1ChannelCount = pointwise21ChannelCount;

    } else { // One input.
      this.input1ChannelCount = 0;
    }
  }

  /**
   * Determine the following properties:
   *   - this.inputTensorCount
   *   - this.input1ChannelCount
   *   - this.bHigherHalfDifferent
   *   - this.bHigherHalfDepthwise2
   *   - this.bDepthwise2Requested
   *   - this.bConcat1Requested
   *   - this.bAddInputToOutputRequested
   *   - this.bConcat2ShuffleSplitRequested
   *   - this.outputTensorCount
   *
   * @param {number} channelCount0_pointwise1Before
   * @param {number} channelCount1_pointwise1Before
   * @param {number} pointwise1ChannelCount
   * @param {number} depthwise_AvgMax_Or_ChannelMultiplier
   * @param {number} pointwise21ChannelCount
   * @param {boolean} bOutput1Requested
   *
   */
  static setFlags_by(
           channelCount0_pointwise1Before, channelCount1_pointwise1Before,
           pointwise1ChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, pointwise21ChannelCount, bOutput1Requested,
           channelShuffler ) {

    // 0. Prepare.

    // 0.1 The input tensor count is totally determined by channelCount1_pointwise1Before.
    Params.set_inputTensorCount_by.call( this, channelCount1_pointwise1Before );

    // 0.2 The output tensor count.
    Params.set_outputTensorCount_by.call( this, channelCount1_pointwise1Before, pointwise21ChannelCount, bOutput1Requested );

    // 0.3 The (estimated) input1 channel count.
    Params.set_input1ChannelCount_by.call( this,
      channelCount0_pointwise1Before, channelCount1_pointwise1Before,
      pointwise1ChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, pointwise21ChannelCount );

    // 0.4 Whether manipulate the higher half channel of convolution.
    this.bHigherHalfDifferent = this.bHigherHalfDepthwise2 = false;
    switch ( channelCount1_pointwise1Before ) {
      case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1: // (-4)
        this.bHigherHalfDepthwise2 = true;
        // No break. Falling-through.

      case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH: // (-5)
        this.bHigherHalfDifferent = true;
        break;
    }

    // 1. One input.
    if ( this.inputTensorCount == 1 ) {

      this.bConcat2ShuffleSplitRequested = false; // One input never uses concat2-shuffle-split.

      switch ( channelCount1_pointwise1Before ) {
        // 1.1
        case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT: // ( 0)
        case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1: // (-4)
        case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH: // (-5)
          this.bDepthwise2Requested = this.bConcat1Requested = false; this.bAddInputToOutputRequested = false; break;

        // 1.2 The only case uses add-input-to-output. (MobileNetV2)
        case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT: // (-1)
          this.bDepthwise2Requested = this.bConcat1Requested = false; this.bAddInputToOutputRequested =  true; break;

        // 1.3 The only case uses depthwise2. (simplified ShuffleNetV2's head)
        case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE: // (-2)
          this.bDepthwise2Requested = this.bConcat1Requested =  true; this.bAddInputToOutputRequested = false; break;
      }

    } else { // 2. Two inputs. //( this.inputTensorCount == 2 )

      this.bDepthwise2Requested = false; // Two inputs never use depthwise2.
      this.bAddInputToOutputRequested = false; // Two inputs never do add-input-to-output. (It always use concatenation.)

      if ( channelCount1_pointwise1Before > 0 ) { // (i.e. ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_XXX)

        // According to ( this.outputTensorCount ), it could be:
        //
        // 2.1 Two-inputs-one-output: by concat1. (ShuffleNetV2_ByPointwise22's tail)
        // 2.2 Two-inputs-two-outputs: by concat1. (ShuffleNetV2_ByPointwise22's body)
        //
        this.bConcat1Requested =  true; this.bConcat2ShuffleSplitRequested = false;
              
      } else { // (i.e. ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3) )

        // According to ( this.outputTensorCount ), it could be:
        //
        // 2.3 Two-inputs-one-output: by concat2(-shuffle-split). (ShuffleNetV2's tail)
        // 2.4 Two-inputs-two-outputs: by concat2-shuffle-split. (ShuffleNetV2's body)
        //
        this.bConcat1Requested = false; this.bConcat2ShuffleSplitRequested =  true;
      }

    }
  }

  get inputHeight0()                        { return this.parameterMapModified.get( Params.inputHeight0 ); }
  get inputWidth0()                         { return this.parameterMapModified.get( Params.inputWidth0 ); }
  get channelCount0_pointwise1Before()      { return this.parameterMapModified.get( Params.channelCount0_pointwise1Before ); }

  /** @return {number} The number version of channelCount1_pointwise1Before. */
  get channelCount1_pointwise1Before()      { return this.parameterMapModified.get( Params.channelCount1_pointwise1Before ); }

  /** @return {string} The string version of channelCount1_pointwise1Before. */
  get channelCount1_pointwise1Before_Name() {
    return Params.channelCount1_pointwise1Before.getStringOfValue( this.channelCount1_pointwise1Before );
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
  get bDepthwiseBias()            { return this.parameterMapModified.get( Params.bDepthwiseBias ); }
  get depthwiseActivationId()     { return this.parameterMapModified.get( Params.depthwiseActivationId ); }
  get depthwiseActivationName()   { return Params.depthwiseActivationId.getStringOfValue( this.depthwiseActivationId ); }

  get pointwise21ChannelCount()   { return this.parameterMapModified.get( Params.pointwise21ChannelCount ); }
  get bPointwise21Bias()          { return this.parameterMapModified.get( Params.bPointwise21Bias ); }
  get pointwise21ActivationId()   { return this.parameterMapModified.get( Params.pointwise21ActivationId ); }
  get pointwise21ActivationName() { return Params.pointwise21ActivationId.getStringOfValue( this.pointwise21ActivationId ); }

  get bOutput1Requested()         { return this.parameterMapModified.get( Params.bOutput1Requested ); }

  /**
   * Determined by channelCount1_pointwise1Before, bOutput1Requested, pointwise21ChannelCount.
   */
  get pointwise22ChannelCount()   {

    switch ( this.channelCount1_pointwise1Before ) {
      // In the following cases, there is always no pointwise22.
      //   - TWO_INPUTS_CONCAT_POINTWISE21_INPUT1    : (-3) (ShuffleNetV2's body/tail)
      //   - ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1: (-4) (ShuffleNetV2_ByMobileNetV1's head)
      //   - ONE_INPUT_HALF_THROUGH                  : (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
      //
      // Note: TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3) (ShuffleNetV2's body/tail) does not have pointwise22, but could have output1.
      //
      case Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1:  // (-3) (ShuffleNetV2's body/tail)
      case Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1: // (-4) (ShuffleNetV2_ByMobileNetV1's head)
      case Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_HALF_THROUGH:  // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
        return 0;
        break;

      // Otherwise, pointwise22 is output1 directly. It is determined by both bOutput1Requested and pointwise21ChannelCount.
      default:
        if ( this.bOutput1Requested )
          return this.pointwise21ChannelCount; // Still may be 0.
        else
          return 0; // No pointwisw22.
        break;
    }
  }

  // Note: pointwise22 use bias flag and activation id of pointwise21.

  get bPointwise22Bias()          { return this.bPointwise21Bias; }
  get pointwise22ActivationId()   { return this.pointwise21ActivationId; }
  get pointwise22ActivationName() { return this.pointwise21ActivationName; }

  get bKeepInputTensor()          { return this.parameterMapModified.get( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.

Params.inputHeight0 =            new ParamDesc.Int(                     "inputHeight0",                   1, ( 10 * 1024 ) );
Params.inputWidth0 =             new ParamDesc.Int(                     "inputWidth0",                    1, ( 10 * 1024 ) );

/** At least, there should be 1 input channel. */
Params.channelCount0_pointwise1Before =  new ParamDesc.Int(             "channelCount0_pointwise1Before", 1, ( 10 * 1024 ) );
Params.channelCount1_pointwise1Before =  new ParamDesc.channelCount1_pointwise1Before( "channelCount1_pointwise1Before" );

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

/** Define suitable value for depthwise convolution strides and pad. */
Params.depthwiseStridesPad =     new ParamDesc.StridesPad(              "depthwiseStridesPad" );

Params.bDepthwiseBias =          new ParamDesc.Bool(                    "bDepthwiseBias" );
Params.depthwiseActivationId =   new ParamDesc.ActivationFunction(      "depthwiseActivationId" );

// Note: Force pointwise21ChannelCount always not zero. So that channelCount0_pointwise1Before_higherHalf could be determined
// when ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH (-5).
Params.pointwise21ChannelCount = new ParamDesc.Int(                     "pointwise21ChannelCount", 1, ( 10 * 1024 ) );
Params.bPointwise21Bias =        new ParamDesc.Bool(                    "bPointwise21Bias" );
Params.pointwise21ActivationId = new ParamDesc.ActivationFunction(      "pointwise21ActivationId" );

Params.bOutput1Requested =       new ParamDesc.Bool(                    "bOutput1Requested" );

Params.bKeepInputTensor =        new ParamDesc.Bool(                    "bKeepInputTensor" );

