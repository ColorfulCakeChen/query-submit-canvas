export { Params, Base };

import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone from "./ReturnOrClone.js";
import * as Pointwise from "./Pointwise.js";
import * as Depthwise from "./Depthwise.js";
import * as AddTwoTensors from "./AddTwoTensors.js";
import * as ConcatAlongAxisId2 from "./ConcatAlongAxisId2.js";
import * as ConcatShuffleSplit from "./ConcatShuffleSplit.js";
import * as TensorOpCounter from "./TensorOpCounter.js";


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
 *     - If ( this.channelCount1_pointwise1Before == Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
 *         (-3) (ShuffleNetV2's body/tail), it is always 0.
 *
 *     - Otherwise,
 *         - If ( bOutput1Requested == false ), it will be 0.
 *         - If ( bOutput1Requested == true ), it will be the same as pointwise21ChannelCount (note: might also be 0).
 *
 * @member {boolean} bPointwise22Bias
 *   If true, there will be a bias after the second pointwise2 convolution. It is always the same as bPointwise21Bias.
 * It is only meaningful if ( pointwise22ChannelCount > 0 ) (i.e. ( bOutput1Requested == true ) and ( pointwise21ChannelCount > 0 ) ).
 *
 * @member {number} pointwise22ActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the second pointwise2 convolution. It
 * is always the same as pointwise22ActivationId. It is only meaningful if ( pointwise22ChannelCount > 0 )
 * (i.e. ( bOutput1Requested == true ) and ( pointwise21ChannelCount > 0 ) ).
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
   * @param {number} channelCount0_pointwise1Before
   *   The channel count of apply()'s first input image (i.e. inputTensors[ 0 ]; input0). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of apply()'s second input image (i.e. inputTensors[ 1 ]; input1). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3): (ShuffleNetV2's body/tail)
   *       The input1 should exist. The channel count of input1 must be the same as pointwise21's result (i.e.
   *       channelCount_pointwise21After_concat2Before) (Note: not pointwise21ChannelCount because pointwise21ChannelCount may be
   *       zero). The result of pointwise21 (which operates on input0) will be concatenated with input1.
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
   *       The inputTensors[ 1 ] will not be used at all (will be ignored completely). The inputTensors[ 0 ] will be processed by
   *       two pathes: one is by pointwise1 and one depthwise operation, the other is by another depthwise operation (without
   *       pointwise1). These two depthwise operations will have the same configurations (i.e. same depthwise_AvgMax_Or_ChannelMultiplier,
   *       depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId) but have different (filter and bias)
   *       weights. The two depthwise results will be concatenated. The concatenated result will be processed by pointwise2
   *       convolution. This is the only one case which there will be second depthwise.
   *
   *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_ADD_TO_OUTPUT (-1): (MobileNetV2's body and tail).
   *       The inputTensors[ 1 ] will not be used at all (will be ignored completely). The inputTensors[ 0 ] will be processed by
   *       pointwise1, one depthwise operation, and pointwise2 convolution. Finally, the inputTensors[ 0 ] will be added to the
   *       result of pointwise2. This is the only one case which will do add-input-to-output.
   *
   *   - Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT (0): (MobileNetV1 or MobileNetV2's head
   *       or simplified ShuffleNetV2(_ByPointwise22)'s head with ( pointwise1ChannelCount == 0 ) ).
   *       The inputTensors[ 1 ] will not be used at all (will be ignored completely). The inputTensors[ 0 ] will be processed
   *       by pointwise1, one depthwise operation, and pointwise2 convolution.
   *
   *   - ( channelCount1_pointwise1Before > 0 ): TWO_INPUTS: (ShuffleNetV2_ByPointwise22's body/tail).
   *       It should be the channel count of input1.
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
// Perhaps, ( channelCount1_pointwise1Before == -4 ): ONE_INPUT_TWO_DEPTHWISE_ONE_MAX_POOLING
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
   *   The height (and width) of depthwise convolution's filter. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ), this will also be ignored.
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
   *       - If ( this.channelCount1_pointwise1Before == Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
   *           (-3) (ShuffleNetV2's body/tail), the outut1 will always exist. Its channel count will be
   *           channelCount_pointwise21After_concat2Before.
   *
   *       - Otherwise:
   *
   *         - If ( pointwise21ChannelCount > 0 ), then ( pointwise22ChannelCount > 0 ), the output1 will exist. Its channel
   *             count will be pointwise22ChannelCount. Its bias flag and activation function will also  be the same as pointwise21.
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
    channelCount0_pointwise1Before,
    channelCount1_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    bOutput1Requested,
    bKeepInputTensor
  ) {

//!!! ...unfinished...
// squeeze-and-excitation ?

    let parameterMap = new Map( [
      [ Params.channelCount0_pointwise1Before,        channelCount0_pointwise1Before ],
      [ Params.channelCount1_pointwise1Before,        channelCount1_pointwise1Before ],
      [ Params.pointwise1ChannelCount,                pointwise1ChannelCount ],
      [ Params.bPointwise1Bias,                       bPointwise1Bias ],
      [ Params.pointwise1ActivationId,                pointwise1ActivationId ],
      [ Params.depthwise_AvgMax_Or_ChannelMultiplier, depthwise_AvgMax_Or_ChannelMultiplier ],
      [ Params.depthwiseFilterHeight,                 depthwiseFilterHeight ],
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
        || ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) // (-3)
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

    // 2.1 In ShuffleNetV2's body/tail, The output tensor count is totally determined by bOutput1Requested.
    if ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) { // (-3)
      // Do nothing.

    // 2.2 Otherwise, pointwise22 is output1 directly. The pointwise22ChannelCount (which is determined by pointwise21ChannelCount)
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

        // Find out input1's channel count.
        //
        // Although The second input's channel count should be the same as pointwise21's result, however, it is not the
        // same as pointwise21ChannelCount directly because pointwise21ChannelCount may be zero. It should be determined
        // by pointwise21, depthewise1, pointwise1, input0.
        //
        this.input1ChannelCount = pointwise21ChannelCount;
        if ( this.input1ChannelCount <= 0 ) { // If no pointwise21, it is based on depthwise.

          this.input1ChannelCount = pointwise1ChannelCount;
          if ( this.input1ChannelCount <= 0 ) { // If no pointwise1, it is based on input0.
            this.input1ChannelCount = channelCount0_pointwise1Before;
          }

          if ( depthwise_AvgMax_Or_ChannelMultiplier > 0 ) {
            this.input1ChannelCount *= depthwise_AvgMax_Or_ChannelMultiplier;

          } // ( When no channelMultiplier (i.e. ( channelMultiplier <= 0 ) ), it is viewed as ( channelMultiplier == 1 ).
        }

      } else { // One input.
        this.input1ChannelCount = 0;
      }
  }

  /**
   * Determine the following properties:
   *   - this.inputTensorCount
   *   - this.input1ChannelCount
   *   - this.bDepthwise2Requested
   *   - this.bConcat1Requested
   *   - this.bAddInputToOutputRequested
   *   - this.bConcat2ShuffleSplitRequested
   *   - this.outputTensorCount
   *
   * @param {number} channelCount1_pointwise1Before
   * @param {number} pointwise21ChannelCount
   * @param {boolean} bOutput1Requested
   */
  static setFlags_by(
           channelCount0_pointwise1Before, channelCount1_pointwise1Before,
           pointwise1ChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, pointwise21ChannelCount, bOutput1Requested ) {

    // 0. Prepare.

    // 0.1 The input tensor count is totally determined by channelCount1_pointwise1Before.
    Params.set_inputTensorCount_by.call( this, channelCount1_pointwise1Before );

    // 0.2 The output tensor count.
    Params.set_outputTensorCount_by.call( this, channelCount1_pointwise1Before, pointwise21ChannelCount, bOutput1Requested );

    // 0.3 The (estimated) input1 channel count.
    Params.set_input1ChannelCount_by.call( this,
      channelCount0_pointwise1Before, channelCount1_pointwise1Before,
      pointwise1ChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, pointwise21ChannelCount );

    // 1. One input.
    if ( this.inputTensorCount == 1 ) {

      this.bConcat2ShuffleSplitRequested = false; // One input never uses concat2-shuffle-split.

      switch ( channelCount1_pointwise1Before ) {
        // 1.1
        case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT: // ( 0)
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

    // In ShuffleNetV2's body/tail, there is always no pointwise22.
    if ( this.channelCount1_pointwise1Before
           == Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) { // (-3) (ShuffleNetV2's body/tail)
      return 0;

    // Otherwise, pointwise22 is output1 directly. It is determined by both bOutput1Requested and pointwise21ChannelCount.
    } else {
      if ( this.bOutput1Requested )
        return this.pointwise21ChannelCount; // Still may be 0.
      else
        return 0; // No pointwisw22.
    }
  }

  get bPointwise22Bias()          { return this.bPointwise21Bias; }
  get pointwise22ActivationId()   { return this.pointwise21ActivationId; }
  get pointwise22ActivationName() { return this.pointwise21ActivationName; }

  get bKeepInputTensor()          { return this.parameterMapModified.get( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.

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
 * At least 1, because depthwise filter size ( 0 * 0 ) is meaningless.
 *
 * For avg pooling or max pooling, it is less meaningful if filter size is ( 1 * 1 ) because the result will be the same as input.
 * For depthwise convolution, it is meaningful if filter size is ( 1 * 1 ) because they could be used as simple channel multiplier.
 *
 * Avoid too large filter size. Otherwise, performance may be poor.
 */
Params.depthwiseFilterHeight =   new ParamDesc.Int(                     "depthwiseFilterHeight", 1, 9 );

/** Define suitable value for depthwise convolution strides and pad. Integer between [ 0, 2 ]. */
Params.depthwiseStridesPad =     new ParamDesc.Int(                     "depthwiseStridesPad",   0, 2 );

Params.bDepthwiseBias =          new ParamDesc.Bool(                    "bDepthwiseBias" );
Params.depthwiseActivationId =   new ParamDesc.ActivationFunction(      "depthwiseActivationId" );

Params.pointwise21ChannelCount = new ParamDesc.Int(                     "pointwise21ChannelCount", 0, ( 10 * 1024 ) );
Params.bPointwise21Bias =        new ParamDesc.Bool(                    "bPointwise21Bias" );
Params.pointwise21ActivationId = new ParamDesc.ActivationFunction(      "pointwise21ActivationId" );

Params.bOutput1Requested =       new ParamDesc.Bool(                    "bOutput1Requested" );

Params.bKeepInputTensor =        new ParamDesc.Bool(                    "bKeepInputTensor" );


/**
 * One step of one block of convolution neural network. There are at most three convolutions inside this object.
 *   - 1x1 pointwise convolution: change channel count. (exapnd)
 *   - NxN depthwise convolution: change channel count. (channel multiplier)
 *   - 1x1 pointwise convolution: change channel count. (shrink)
 *
 * Every convolution (no matter pointwise or depthwise) could exist or not exist. If exists, it could have or have no bias and
 * activation function.
 *
 *
 * There are six main combinations:
 *
 *   - When ( channelCount1_pointwise1Before == -3 ) and ( bOutput1Requested == true ): TWO_INPUTS_CONCAT_POINTWISE21_INPUT1: TWO_OUTPUT:
 * (ShuffleNetV2's body)
 * <pre>
 * input0 - pointwise1 - depthwise1 - pointwise21 - concat2ShuffleSplit - output0
 * input1 ----------------------------------------/                     \ output1
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -3 ) and ( bOutput1Requested == false ): TWO_INPUTS_CONCAT_POINTWISE21_INPUT1: ONE_OUTPUT:
 * (ShuffleNetV2's tail)
 * <pre>
 * input0 - pointwise1 - depthwise1 - pointwise21 - concat2(ShuffleSplit) - output0
 * input1 ----------------------------------------/
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -2 ): ONE_INPUT_TWO_DEPTHWISE:
 * (simplified ShuffleNetV2's head with ( pointwise1ChannelCount >= 1 ) )
 * <pre>
 * input0 - pointwise1 - depthwise1 - concat1 - pointwise21
 *        \------------- depthwise2 /         \ pointwise22
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -1 ): ONE_INPUT_ADD_TO_OUTPUT: (MobileNetV2's body and tail)
 * <pre>
 *        /------------------------------------------------------\
 * input0 - pointwise1 - depthwise1 ---------------- pointwise21 - addInput0ToPointwise21
 *        \                                        \ pointwise22 - addInput0ToPointwise22
 *         \-----------------------------------------------------/
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == 0 ): ONE_INPUT:
 * (MobileNetV1 or MobileNetV2's head or simplified ShuffleNetV2(_ByPointwise22)'s head with ( pointwise1ChannelCount == 0 ) )
 * <pre>
 * input0 - pointwise1 - depthwise1 ---------------- pointwise21
 *                                                 \ pointwise22
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before > 0 ): TWO_INPUTS: (ShuffleNetV2_ByPointwise22's body and tail)
 * <pre>
 * input0 - pointwise1 - depthwise1 - concat1 - pointwise21
 * input1 --------------------------/         \ pointwise22
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
 *  If true, this object initialized (i.e. initer()) successfully.
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
 * @member {boolean} bPointwise1
 *   If true, the pointwise1 convolution exists.
 *
 * @member {string} pointwise1ActivationName
 *   The activation function id (Params.pointwise1ActivationId.valueDesc.Ids.Xxx) after the first pointwise convolution.
 *
 * @member {boolean} bDepthwise1
 *   If true, the first depthwise convolution (or average pooling, or maximum pooling) exists.
 *
 * @member {boolean} bDepthwise2
 *   If true, the second depthwise convolution (or average pooling, or maximum pooling) exists.
 *
 * @member {string} depthwise_AvgMax_Or_ChannelMultiplier_Name
 *   Depthwise operation name.
 *
 * @member {string} depthwiseActivationName
 *   The activation function name (Params.depthwiseActivationId.valueDesc.Ids.Xxx) after depthwise convolution.
 *
 * @member {boolean} bPointwise2
 *   If true, the pointwise2 (i.e. pointwise21 or/and pointwise22) convolution exists.
 *
 * @member {boolean} bPointwise21
 *   If true, the first pointwise2 convolution exists.
 *
 * @member {boolean} bPointwise22
 *   If true, the second pointwise2 convolution exists.
 *
 * @member {string} pointwise21ActivationName
 *   The activation function id (Params.pointwise21ActivationId.valueDesc.Ids.Xxx) after the first pointwise2 convolution.
 *
 * @member {string} pointwise22ActivationName
 *   The name of activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the second pointwise2 convolution.
 * It is only meaningful if ( pointwise22ChannelCount > 0 ) (i.e. ( bPointwise22 == true ) and ( pointwise21ChannelCount > 0 ) ).
 *
 * @member {number} inChannels0
 *   The channel count of the first input tensor (i.e. inputTensors[ 0 ]). This is the same as this.channelCount0_pointwise1Before (from initer()).
 *
 * @member {number} inChannels1
 *   The channel count of the second input tensor (i.e. inputTensors[ 1 ]). It is zero or positive (never negative).
 *     - If ( this.channelCount1_pointwise1Before >= 0 ), inChannels1 is the same as this.channelCount1_pointwise1Before.
 *     - If ( this.channelCount1_pointwise1Before == Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ),
 *         (-3), inChannels1 will be the same as channelCount_pointwise21After_concat2Before.
 *     - Otherwise, inChannels1 will be zero.
 *
 * @member {number} outChannels0
 *   The channel count of the outputTensor[ 0 ]. Even if ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ),
 * this will still be non-zero.
 *
 * @member {number} outChannels1
 *   The channel count of the outputTensor[ 1 ]. If ( pointwise22ChannelCount == 0 ), this will be zero.
 *
 * @member {number} channelCount_pointwise1After_depthwise1Before
 *   The channel count after the first 1x1 pointwise convolution. If ( pointwise1ChannelCount > 0 ), it equals pointwise1ChannelCount.
 * If ( pointwise1ChannelCount == 0 ), it equals inChannels0.
 *
 * @member {number} channelCount_depthwise1After_concat1Before
 *   The channel count after the first depthwise convolution which applies to the result of pointwise1.
 *   - If depthwise1 exists, it will be the channel count of depthwise1's output.
 *     - When ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ), it equals
 *         ( channelCount_pointwise1After_depthwise1Before * depthwise_AvgMax_Or_ChannelMultiplier ).
 *     - When ( depthwise_AvgMax_Or_ChannelMultiplier == Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG  ) (i.e. -2)
 *         or ( depthwise_AvgMax_Or_ChannelMultiplier == Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX  ) (i.e. -1)
 *         or ( depthwise_AvgMax_Or_ChannelMultiplier == Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.NONE ) (i.e.  0),
 *         it equals channelCount_pointwise1After_depthwise1Before.
 *   - If depthwise1 does not exist, it will be the channel count of previous operation (i.e. pointwise1)
 *       which is channelCount_pointwise1After_depthwise1Before.
 *
 * @member {number} channelCount_depthwise2After_concat1Before
 *   The channel count after the second depthwise convolution which applies to input0 or input1. If depthwise2 does not exist,
 * this will be the same as Math.max( 0, channelCount1_pointwise1Before ) (i.e. the depthwise2 will be viewed as short circuit
 * to input1).
 *
 * @member {number} channelCount_concat1After_pointwise2Before
 *   The channel count before pointwise2. It is may be the concatenated result of input0 (with depthwise1, with/without depthwise2)
 * with/without input1 (without depthwise2).
 *
 * @member {number} channelCount_pointwise21After_concat2Before
 *   The channel count after the pointwise21 convolution.
 *     - If ( pointwise21ChannelCount > 0 ), it equals pointwise21ChannelCount.
 *     - If ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount != 0 ), it will be 0.
 *     - If ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ), it equals channelCount_concat1After_pointwise2Before.
 *
 * @member {number} channelCount_pointwise22After_concat2Before
 *   The channel count after the pointwise22 convolution. If ( pointwise22ChannelCount > 0 ), it equals pointwise22ChannelCount.
 * If ( pointwise22ChannelCount == 0 ), it will be 0.
 *
 * @member {number} channelCount_pointwise2After_concat2Before
 *   The channel count after all pointwise2 convolution.
 *
 *     - Basically, it will be ( channelCount_pointwise21After_concat2Before + channelCount_pointwise22After_concat2Before )
 *         if at least one pointwise2 convolution existed.
 *
 *     - If both ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ), it will be channelCount_concat1After_pointwise2Before.
 *
 * @member {ChannelShuffler.ConcatPointwiseConv} channelShuffler_ConcatPointwiseConv
 *   The channelShuffler. It must be implemented by ChannelShuffler.ConcatPointwiseConv with ( outputGroupCount == 2 ).
 *
 *     - It will not be disposed by this object (i.e. it is supposed to be shared with outter callers).
 *
 *     - The channelShuffler's outputGroupCount must be 2 (i.e. split into two groups after channel-shuffling).
 *
 *     - It is only used when
 *         ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
 *         (-3) (i.e. channel shuffle the concatenated pointwise21 and input1).
 *
 *     - The channelShuffler.shuffleInfo.totalChannelCount should be the same as the channel count of the concatenation
 *         of pointwise21 and input1.
 *
 * @member {function} apply
 *   This is a method. It has two parameters inputTensors and outputTensors. The inputTensors (tf.tensor3d[]) represents the images
 * ( height x width x channel ) which will be processed. The outputTensors (tf.tensor3d[]) will be placed one or two tf.tensor3d as
 * the result. All intermediate tensors will be disposed. The inputTensors may or may not be disposed. In fact, this method calls
 * one of apply_X_Y_Concat1_depthwise1_depthwise2(), apply_X_Y_and_destroy_AddInputToOutput(),
 * apply_X_Y_NoSkipConnection(), apply_X_Y_ConcatInput1(),
 * return_input_directly_array(), keep_input_return_copy_array() according to the initer()'s parameters.
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
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   */
  * initer( progressParent, params, channelShuffler_ConcatPointwiseConv ) {

    // 0. Prepare

    // Estimate the maximum value of progress.
    let progressMax =
      1    // for extracting parameters from inputFloat32Array.
      + 1  // for extracting pointwise1 filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for extracting depthwise filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for concat1.
      + 1  // for extracting pointwise2 filters (and biases) from inputFloat32Array and building tensors.
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
    this.depthwiseStridesPad = params.depthwiseStridesPad;
    this.bDepthwiseBias = params.bDepthwiseBias;
    this.depthwiseActivationId = params.depthwiseActivationId;
    this.depthwiseActivationName = params.depthwiseActivationName;

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
      this.bDepthwise2Requested = params.bDepthwise2Requested;
      this.bConcat1Requested = params.bConcat1Requested;
      this.bAddInputToOutputRequested = params.bAddInputToOutputRequested;
      this.bConcat2ShuffleSplitRequested = params.bConcat2ShuffleSplitRequested;
      this.outputTensorCount = params.outputTensorCount;
    }

    this.intermediateTensorsArray = new Array( 2 ); // Pre-allocate array to place intermediate 2 tensors. This could reduce memory re-allocation.

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    // For analyzing every tensor processed by how many operations. These will be used to determine whether
    // the operation should dispose its input tensor.
    let TensorOpCounterId = -1;
    let TensorOpCounters = {
      input0: new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_input0", null, null ),
      input1: new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_input1", null, null ),
    };

    // 2. The first 1x1 pointwise convolution.
    this.pointwise1 = new Pointwise.Base(
      this.channelCount0_pointwise1Before,
      this.pointwise1ChannelCount, this.bPointwise1Bias, this.pointwise1ActivationId );

    if ( !this.pointwise1.init( params.defaultInput, this.byteOffsetEnd ) )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.pointwise1.byteOffsetEnd;

    this.bPointwise1 = this.pointwise1.bExisted;
    if ( this.bPointwise1 ) {
      this.channelCount_pointwise1After_depthwise1Before = this.pointwise1.outputChannelCount;
      TensorOpCounters.pointwise1 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_pointwise1", this.pointwise1, TensorOpCounters.input0 );

    } else {
      this.channelCount_pointwise1After_depthwise1Before = this.channelCount0_pointwise1Before;  // No pointwise1 convolution.
      TensorOpCounters.pointwise1 = TensorOpCounters.input0; // Its output is just its input tensor.
    }

    ++progressToAdvance.value;
    yield progressRoot;  // pointwise1 filters was ready. Report progress.

    // 3. The depthwise operation.
    //
    // Note: When ( pad == valid ), it seems that depthwise (avg/max pooling) filter size can not greater than input image size.

    // 3.1 The first depthwise operation.
    this.depthwise1 = new Depthwise.Base(
      this.channelCount_pointwise1After_depthwise1Before,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight,
      this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId );

    if ( !this.depthwise1.init( params.defaultInput, this.byteOffsetEnd ) )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.depthwise1.byteOffsetEnd;

    this.bDepthwise1 = this.depthwise1.bExisted;
    if ( this.bDepthwise1 ) {
      this.channelCount_depthwise1After_concat1Before = this.depthwise1.outputChannelCount;
      TensorOpCounters.depthwise1 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_depthwise1", this.depthwise1, TensorOpCounters.pointwise1 );

    } else {
      this.channelCount_depthwise1After_concat1Before = this.channelCount_pointwise1After_depthwise1Before;  // No depthwise1 operation.
      TensorOpCounters.depthwise1 = TensorOpCounters.pointwise1; // Its output is just its input tensor.
    }

    // 3.2 The second depthwise operation.
    this.bDepthwise2 = false;
    if ( this.bDepthwise2Requested ) {

      // Q: Why does depthwise2 use the same configuration as depthwise1?
      // A: To ensure both result have the same ( height, width ) so that could be inputted to concatenator). This is especially
      //    true for StridesPad.
      this.depthwise2 = new Depthwise.Base(

        // The depthwise2 processes the inputTensors[ 0 ] directly (i.e. not the pointwise1 result of inputTensors[ 0 ], and
        // not inputTensors[ 1 ]).
        this.channelCount0_pointwise1Before,

        this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight,
        this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId );

      if ( !this.depthwise2.init( params.defaultInput, this.byteOffsetEnd ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = this.depthwise2.byteOffsetEnd;

      this.bDepthwise2 = this.depthwise2.bExisted;
      if ( this.bDepthwise2 ) {
        // The depthwise2 is requested and created. It means ONE_INPUT_TWO_DEPTHWISE.
        this.channelCount_depthwise2After_concat1Before = this.depthwise2.outputChannelCount;
        TensorOpCounters.depthwise2 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_depthwise2", this.depthwise2, TensorOpCounters.input0 );

      } else {
        // The depthwise2 is requested but not created. It means no depthwise operation (i.e. ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ).
        // In this case, the depthwise2 should be short circuit to inputTensor[ 0 ] (i.e. not inputTensor[ 1 ]).
        this.channelCount_depthwise2After_concat1Before = this.channelCount0_pointwise1Before;
        TensorOpCounters.depthwise2 = TensorOpCounters.input0;
      }

    } else {
      // Since the depthwise2 is not requested, it is always short circuit to input1 (i.e. not input0).
      this.channelCount_depthwise2After_concat1Before = Math.max( 0, this.channelCount1_pointwise1Before ); // At least 0. Avoid negative.
      TensorOpCounters.depthwise2 = TensorOpCounters.input1;
    }

    ++progressToAdvance.value;
    yield progressRoot;  // depthwise filters was ready. Report progress.

    // 4. Concat1
    if ( this.bConcat1Requested ) {
      
      this.channelCount_concat1After_pointwise2Before
        = this.channelCount_depthwise1After_concat1Before + this.channelCount_depthwise2After_concat1Before;

      this.concat1 = new ConcatAlongAxisId2.Base( false, false );

      TensorOpCounters.concat1 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_concat1",
        this.concat1, TensorOpCounters.depthwise1, TensorOpCounters.depthwise2 );

    } else {
      this.channelCount_concat1After_pointwise2Before = this.channelCount_depthwise1After_concat1Before;
      TensorOpCounters.concat1 = TensorOpCounters.depthwise1;
    }

    ++progressToAdvance.value;
    yield progressRoot;  // concat1 was ready. Report progress.

    // 5. The pointwise2 convolution.

    // 5.1 Pointwise21
    this.pointwise21 = new Pointwise.Base(
      this.channelCount_concat1After_pointwise2Before,
      this.pointwise21ChannelCount, this.bPointwise21Bias, this.pointwise21ActivationId );

    if ( !this.pointwise21.init( params.defaultInput, this.byteOffsetEnd ) )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.pointwise21.byteOffsetEnd;

    this.bPointwise21 = this.pointwise21.bExisted;
    if ( this.bPointwise21 ) {
      this.channelCount_pointwise21After_concat2Before = this.pointwise21ChannelCount;
    } else {
      this.channelCount_pointwise21After_concat2Before = 0;  // No first pointwise2 convolution.
    }

    // 5.2 Pointwise22
    if ( this.pointwise22ChannelCount > 0 ) {

      this.pointwise22 = new Pointwise.Base(
        this.channelCount_concat1After_pointwise2Before,
        this.pointwise22ChannelCount, this.bPointwise22Bias, this.pointwise22ActivationId );

      if ( !this.pointwise22.init( params.defaultInput, this.byteOffsetEnd ) )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = this.pointwise22.byteOffsetEnd;

      this.bPointwise22 = this.pointwise22.bExisted;

    } else { // Since pointwise22 is not requested (i.e. channel count is not positive), do not create the object for saving memory.
      this.bPointwise22 = false;
    }

    if ( this.bPointwise22 ) {
      this.channelCount_pointwise22After_concat2Before = this.pointwise22ChannelCount;
    } else {
      this.channelCount_pointwise22After_concat2Before = 0;  // No second pointwise2 convolution.
    }

    // 5.3 Pointwise2 (= Pointwise21 + Pointwise22 )
    this.bPointwise2 = ( this.bPointwise21 || this.bPointwise22 );
    this.channelCount_pointwise2After_concat2Before = this.pointwise21ChannelCount + this.pointwise22ChannelCount;

    if ( !this.bPointwise2 ) {
      // If there is not any pointwise2 convolution, the result channel count will not be zero. It should be the channel count after
      // depthwise1 operation together with the input1 channel count (if existed). And it should be at the first output tensor
      // (i.e. outputTensors[ 0 ]).
      this.channelCount_pointwise2After_concat2Before = this.channelCount_pointwise21After_concat2Before
        = this.channelCount_concat1After_pointwise2Before;
    }

    // Determine inChannels1.
    if ( this.channelCount1_pointwise1Before
                  == Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) { // (-3)
      this.inChannels1 = this.channelCount_pointwise21After_concat2Before; // The channel count of pointwise21's result.

    } else {
      this.inChannels1 = Math.max( 0, this.channelCount1_pointwise1Before );
    }      

    tf.util.assert( this.inChannels1 == params.input1ChannelCount,
      `PointDepthPoint.initer(): this.inChannels1 ( ${this.inChannels1} ) `
        + `should be the same as params.input1ChannelCount ( ${params.input1ChannelCount} ).`
    );

    // 5.4
    ++progressToAdvance.value;
    yield progressRoot;  // pointwise2 filters was ready. Report progress.

    // 6. Add-input-to-output

    // 6.1
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
    //   - if MobileNetV2 and not step 0, should not destroy input tensor so that can add input to output.
    //   - However, even if MobileNetV2, only if not setp 0 (whose strides == 2) of a block can add input to output.
    if ( ( this.bAddInputToOutputRequested ) && ( this.depthwise1.is_Output_Same_HeightWidth_As_Input() ) ) {

      // Note:
      //
      // Usually, if no pointwise21, then no addInput0ToPointwise21.
      // Usually, if no pointwise22, then no addInput0ToPointwise22.
      //
      // However, there is one exception: When both no pointwise21 and no pointwise22, there might be addInput0ToPointwise21
      // if channelCount_concat1After_pointwise2Before (which is already assigned to channelCount_pointwise21After_concat2Before in this case)
      // has the same dimension as inputTensors[ 0 ].

      if ( this.channelCount0_pointwise1Before == this.channelCount_pointwise21After_concat2Before ) {
        this.bShould_addInput0ToPointwise21 = true;
        this.addInput0ToPointwise21 = new AddTwoTensors.Base();
      }

      // Only inputTensors[ 0 ] will be used to add to output. So still check against channelCount0_pointwise1Before
      // (not channelCount1_pointwise1Before).
      if ( this.channelCount0_pointwise1Before == this.channelCount_pointwise22After_concat2Before ) {
        this.bShould_addInput0ToPointwise22 = true;
        this.addInput0ToPointwise22 = new AddTwoTensors.Base();
      }
    }

    this.bShouldAddInputToOutput = this.bShould_addInput0ToPointwise21 || this.bShould_addInput0ToPointwise22;

    // 6.2
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

    // 6.3
    ++progressToAdvance.value;
    yield progressRoot;  // add-input-to-output was ready. Report progress.

    // 7. Concat2-Shuffle-Split
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
            `PointDepthPoint.initer(): When concat2-shuffle-split, `
              + `output channel count ( ${this.outputTensorCount} ) must be either 1 or 2.`
          );
          break;
      }

      // Only if channel shuffler is used, it is recorded in data member.
      this.channelShuffler_ConcatPointwiseConv = channelShuffler_ConcatPointwiseConv;

      this.concat2ShuffleSplit = new ConcatShuffleSplit.Base( channelShuffler_ConcatPointwiseConv, bShuffleSplit, false, false );

      // In theory, concat2 use the result of add-input0-to-pointwise21 as first parameter. In reality, it usually uses the result
      // of pointwise21 (without add-input0-to-output) as first parameter.
      TensorOpCounters.concat2ShuffleSplit = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + TensorOpCounters_NamePostfix,
        this.concat2ShuffleSplit, TensorOpCounters.addInput0ToPointwise21, TensorOpCounters.input1 );

    } else {
      // Since no concat2(-shuffle-split), the final output come from pointwise2 (and add-input-to-output) directly.
      this.outChannels0 = this.channelCount_pointwise21After_concat2Before;
      this.outChannels1 = this.channelCount_pointwise22After_concat2Before;

      // Note: It should also be okay to set to TensorOpCounters.addInput0ToPointwise22).
      TensorOpCounters.concat2ShuffleSplit = TensorOpCounters.addInput0ToPointwise21;
    }

    ++progressToAdvance.value;
    yield progressRoot;  // concat2-Shuffle-Split was ready. Report progress.

    // 8. Configure correct function pointers according to whether keeping or destroying input tensor.

    // 8.1 Determine which apply_Xxx() function should be used.
    //
    // This should be done before adjusting the first operation from "Xxx_destroy" to "Xxx_keep",
    // because the adjustment might also need to select different apply_Xxx() function.
    this.apply = Base.Determine_apply.call( this );

    // 8.2 Adjust the destroy-or-keep behavior of every tensor according to whether the operation is the first operation or last operation.
    {
      let alwaysKeepSet;
      if ( this.bKeepInputTensor ) { // User requests to keep input tensors.
        alwaysKeepSet = new Set( [ TensorOpCounters.input0, TensorOpCounters.input1 ] );
      }

      // Using Set (instead of Array) so that duplicated TensorOpCounter will only be analyzed once.
      // Note: When an operation does not exist, its output TensorOpCounter will be just its input TensorOpCounter (so duplicated).
      let TensorOpCounterSet = new Set( [
        TensorOpCounters.pointwise1,  TensorOpCounters.depthwise1, TensorOpCounters.depthwise2, TensorOpCounters.concat1,
        TensorOpCounters.pointwise21, TensorOpCounters.addInput0ToPointwise21,
        TensorOpCounters.pointwise22, TensorOpCounters.addInput0ToPointwise22,
        TensorOpCounters.concat2ShuffleSplit
      ] );

      for ( let TensorOpCounter of TensorOpCounterSet ) {
        TensorOpCounter.setKeepInputTensor_IfNotLastOperation_Or_In( alwaysKeepSet );
      }
    }

    // 8.3
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
  init( progressParent, params, channelShuffler_ConcatPointwiseConv ) {

    progressParent = progressParent || ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer( progressParent, params, channelShuffler_ConcatPointwiseConv );
    let initerNext;
    do {
      initerNext = initer.next();
    } while ( ! initerNext.done ); // When ( false == initerNext.done ), the ( initerNext.value ) will be progressParent.getRoot().

    let bInitOk = initerNext.value; // When ( true == initerNext.done ), the ( initerNext.value ) will be initialization successfully or failed.
    return bInitOk;
  }

  /** Release all tensors. */
  disposeTensors() {
    if ( this.pointwise1 ) {
      this.pointwise1.disposeTensors();
      this.pointwise1 = null;
    }

    if ( this.depthwise1 ) {
      this.depthwise1.disposeTensors();
      this.depthwise1 = null;
    }

    if ( this.depthwise2 ) {
      this.depthwise2.disposeTensors();
      this.depthwise2 = null;
    }

    if ( this.concat1 ) {
      this.concat1 = null;
    }

    if ( this.pointwise21 ) {
      this.pointwise21.disposeTensors();
      this.pointwise21 = null;
    }

    if ( this.pointwise22 ) {
      this.pointwise22.disposeTensors();
      this.pointwise22 = null;
    }

    if ( this.addInput0ToPointwise21 ) {
      this.addInputToPointwise21Output = null;
    }

    if ( this.addInput0ToPointwise22 ) {
      this.addInputToPointwise22Output = null;
    }

    if ( this.concat2ShuffleSplit ) {
      this.concat2ShuffleSplit = null;
    }

    if ( this.channelShuffler_ConcatPointwiseConv ) {
      this.channelShuffler_ConcatPointwiseConv = null; // Note: Do not dispose the channel shuffler here.
    }

    this.intermediateTensorsArray = null;

    this.inputTensorCount
      = this.bPointwise1
      = this.bDepthwise1 = this.bDepthwise2 = this.bDepthwise2Requested
      = this.bConcat1Requested
      = this.bPointwise21 = this.bPointwise22 = this.bOutput1Requested = this.bAddInputToOutputRequested
      = this.bShouldAddInputToOutput = this.bShould_addInput0ToPointwise21 = this.bShould_addInput0ToPointwise22
      = this.bConcat2ShuffleSplitRequested
      = this.outputTensorCount
      = undefined;

    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /** Determine which apply_Xxx() function should be used.
   * @return {function} Return one of the apply_Xxx function.
   */
  static Determine_apply() {

    switch ( this.channelCount1_pointwise1Before ) {

      // 1.
      //
      // ( this.inputTensorCount > 1 ).
      case Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1: // (-3) (ShuffleNetV2's body/tail)
        
        tf.util.assert( ( this.bConcat2ShuffleSplitRequested == true ),
            `PointDepthPoint.Determine_apply(): When concat2-shuffle-split, `
              + `bConcat2ShuffleSplitRequested ( ${this.bConcat2ShuffleSplitRequested} ) should be true `
              + `when channelCount1_pointwise1Before ( ${this.channelCount1_pointwise1Before} ) is TWO_INPUTS_CONCAT_POINTWISE21_INPUT1.`
          );

        return Base.apply_2_Concat2_pointwise21_input1_ShuffleSplit; // 1.1 ShuffleNetV2's body or tail.
        break;

      // 2.
      //
      // ( this.inputTensorCount == 1 )
      case Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_TWO_DEPTHWISE: // (-2) (simplified ShuffleNetV2's head)
        if ( this.bPointwise21 ) {
          if ( this.bPointwise22 ) {
            return Base.apply_1_2_Concat1_depthwise1_depthwise2;  // 2.1 Both pointwise21 and pointwise22 existed.
          } else {
            return Base.apply_1_21_Concat1_depthwise1_depthwise2; // 2.2 Only pointwise21 existed (and no pointwise22).
          }
        } else {
          if ( this.bPointwise22 ) {
            return Base.apply_1_22_Concat1_depthwise1_depthwise2; // 2.3 Only pointwise22 existed (and no pointwise21).
          } else {
            return Base.apply_1_21_Concat1_depthwise1_depthwise2; // 2.4 Both pointwise21 and pointwise22 not existed. (Use pointwise21.)
          }
        }
        break;

      case Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_ADD_TO_OUTPUT: // (-1) (MobileNetV2)
      case Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT:               // ( 0) (MobileNetV1)

        if ( this.bShouldAddInputToOutput ) { // ( this.bAddInputToOutputRequested == true ) and possible to add-input-to-output.

          // 3. add-input-to-output.
          //
          // ( this.inputTensorCount == 1 )

          if ( this.bPointwise21 ) {
            if ( this.bPointwise22 ) {

              // 3.1 Both pointwise21 and pointwise22 exist.
              //
              // Although both pointwise21 and pointwise22 exist, but it may be only pointwise21 or pointwise22 could (or need) add-input-to-output.

              if ( this.bShould_addInput0ToPointwise21 ) {
                if ( this.bShould_addInput0ToPointwise22 ) {
                  // 3.1.1 Both pointwise21 and pointwise22 exist, and both addInput0ToPointwise21 and addInput0ToPointwise22 exist.
                  return Base.apply_1_2_AddInputToOutput_2;
                } else {
                  // 3.1.2 Both pointwise21 and pointwise22 exist, but only addInput0ToPointwise21 exists.
                  return Base.apply_1_2_AddInputToOutput_21;
                }
              } else {
                if ( this.bShould_addInput0ToPointwise22 ) {
                  // 3.1.3 Both pointwise21 and pointwise22 exist, but only addInput0ToPointwise22 exists.
                  return Base.apply_1_2_AddInputToOutput_22;
                } else {
                  // 3.1.4 Both pointwise21 and pointwise22 exist, but both addInput0ToPointwise21 and addInput0ToPointwise22 do not exist.

                  // It should not execute to here.
                  tf.util.assert( false,
                    `PointDepthPoint.Determine_apply(), this.bShouldAddInputToOutput (${this.bShouldAddInputToOutput}) `
                      + `should equal this.bShould_addInput0ToPointwise21 (${this.bShould_addInput0ToPointwise21}) `
                      + ` or this.bShould_addInput0ToPointwise22 (${this.bShould_addInput0ToPointwise22}). ${this.parametersDescription}`);

                  return undefined;
                }
              }

            } else {
              return Base.apply_1_21_AddInputToOutput; // 3.2 Only pointwise21 exists (and no pointwise22).
            }
          } else {
            if ( this.bPointwise22 ) {
              return Base.apply_1_22_AddInputToOutput; // 3.3 Only pointwise22 exists (and no pointwise21).
            } else {
              // 3.4 Both pointwise21 and pointwise22 do not exist. (Use pointwise21, but channel count is the same as channel count before pointwise2.)
              return Base.apply_1_21_AddInputToOutput;
            }
          }

        } else {

          // 4. no-add-input-to-output, no-concat, and destroy-input (or keep-input).
          //
          // ( this.inputTensorCount == 1 ) or ( ( this.bAddInputToOutputRequested == true ) but not-possible to add-input-to-output ).

          if ( this.bPointwise21 ) {
            if ( this.bPointwise22 ) {
              return Base.apply_1_2_NoSkipConnection;  // 4.1 Both pointwise21 and pointwise22 existed.
            } else {
              return Base.apply_1_21_NoSkipConnection; // 4.2 Only pointwise21 existed (and no pointwise22).
            }
          } else {
            if ( this.bPointwise22 ) {
              return Base.apply_1_22_NoSkipConnection; // 4.3 Only pointwise22 existed (and no pointwise21).
            } else {
              // 4.4 Both pointwise21 and pointwise22 not existed.

              // no pointwise1, no depthwise1, no concat1, no pointwise21, no addInput0ToPointwise21, no pointwise22, no addInput0ToPointwise22
              if ( !this.bPointwise1 && !this.bDepthwise1 ) {

                // Note: This may be wrong, however, if there are wrongly two input tensors (there should be only one input
                // (i.e. inputTensors[ 0 ]) for should-add-input-to-output).
                if ( this.bKeepInputTensor )
                  return Base.keep_input_return_copy_array; // 4.4.1
                else
                  return Base.return_input_directly_array;  // 4.4.2

              } else {
                return Base.apply_1_21_NoSkipConnection; // 4.4.3 At least, there are pointwise1 or depthwise. (Use pointwise21.)
              }

            }
          }

        }
        break;

      // 5. (no-add-input-to-output but has) concat1.
      //
      // ( this.inputTensorCount > 1 ).
      default: // Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_XXX (> 0) (ShuffleNetV2_ByPointwise22's body/tail)

        if ( this.bPointwise21 ) {
          if ( this.bPointwise22 ) {
            return Base.apply_2_2_Concat1_depthwise1_input1;  // 5.1 Both pointwise21 and pointwise22 existed.
          } else {
            return Base.apply_2_21_Concat1_depthwise1_input1; // 5.2 Only pointwise21 existed (and no pointwise22).
          }
        } else {
          if ( this.bPointwise22 ) {
            return Base.apply_2_22_Concat1_depthwise1_input1; // 5.3 Only pointwise22 existed (and no pointwise21).
          } else {
            return Base.apply_2_21_Concat1_depthwise1_input1; // 5.4 Both pointwise21 and pointwise22 not existed. (Use pointwise21.)
          }
        }
        break;
    }
  }

  /**
   * The inputTensors[ 1 ] will be concatenated with pointwise21. If only outputTensors[ 0 ]. it is the result.
   * It both outputTensors[ 0 ] and outputTensors[ 1 ], it will be shuffled and splitted.
   * The input tensors may or may not be disposed.
   *
   * @param {tf.tensor[]} inputTensors
   *   An array of tensors. Both the inputTensors[ 0 ] and inputTensors[ 1 ] will be used.
   *
   * @param {tf.tensor[]} outputTensors
   *   An array for returning the result (output) tensors. If ( this.outputTensorCount == 1 ), the outputTensors[ 0 ] will
   * be the result. If ( this.outputTensorCount == 2 ), the outputTensors[ 0 ] and outputTensors[ 1 ] will be the result.
   */
  static apply_2_Concat2_pointwise21_input1_ShuffleSplit( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    this.intermediateTensorsArray[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    this.intermediateTensorsArray[ 1 ] = inputTensors[ 1 ];

    this.concat2ShuffleSplit.pfnConcatShuffleSplit( this.intermediateTensorsArray, outputTensors );
  }


  /** The inputTensors[ 0 ] will be branched by depthwise2 and concatenated with depthwise1 before outputTensors[ 0 ]. */
  static apply_1_21_Concat1_depthwise1_depthwise2( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );

    this.intermediateTensorsArray[ 0 ] = this.depthwise1.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = this.depthwise2.pfnOperationBiasActivation( inputTensor );

    t1 = this.concat1.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = null;
  }

  /** The inputTensors[ 0 ] will be branched by depthwise2 and concatenated with depthwise1 before outputTensors[ 1 ]. */
  static apply_1_22_Concat1_depthwise1_depthwise2( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );

    this.intermediateTensorsArray[ 0 ] = this.depthwise1.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = this.depthwise2.pfnOperationBiasActivation( inputTensor );

    t1 = this.concat1.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 );
  }

  /**
   * The inputTensors[ 0 ] will be branched by depthwise2 and concatenated with depthwise1 before outputTensors[ 0 ] and outputTensors[ 1 ].
   * The input tensors may or may not be disposed.
   */
  static apply_1_2_Concat1_depthwise1_depthwise2( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );

    this.intermediateTensorsArray[ 0 ] = this.depthwise1.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = this.depthwise2.pfnOperationBiasActivation( inputTensor );

    t1 = this.concat1.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 );
  }


  /** The only one input will be added to the only one output (pointwise21). The inputTensor may or may not be disposed.*/
  static apply_1_21_AddInputToOutput( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise21.pfnConvBiasActivation( t1 );

    outputTensors[ 0 ] = this.addInput0ToPointwise21.pfnAdd( inputTensor, t0 );
    outputTensors[ 1 ] = null;
  }

  /** The only one input will be added to the only one output (pointwise22). The inputTensor may or may not be disposed.*/
  static apply_1_22_AddInputToOutput( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise22.pfnConvBiasActivation( t1 );

    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = this.addInput0ToPointwise22.pfnAdd( inputTensor, t0 );
  }


  /** Both outputTensors[ 0 ] and outputTensors[ 1 ] exist. The inputTensors[ 0 ] will be added to both of them.
   * The inputTensor may or may not be disposed.
   */
  static apply_1_2_AddInputToOutput_2( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 0 ] = this.addInput0ToPointwise21.pfnAdd( inputTensor, t0 );

    t0 = this.pointwise22.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.addInput0ToPointwise22.pfnAdd( inputTensor, t0 );
  }

  /** Both outputTensors[ 0 ] and outputTensors[ 1 ] exist. The inputTensors[ 0 ] will be added to only outputTensors[ 0 ].
   * The inputTensor may or may not be disposed.
   */
  static apply_1_2_AddInputToOutput_21( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 0 ] = this.addInput0ToPointwise21.pfnAdd( inputTensor, t0 );

    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 );
  }

  /** Both outputTensors[ 0 ] and outputTensors[ 1 ] exist. The inputTensors[ 0 ] will be added to only outputTensors[ 1 ].
   * The inputTensor may or may not be disposed.
   */
  static apply_1_2_AddInputToOutput_22( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );

    t0 = this.pointwise22.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.addInput0ToPointwise22.pfnAdd( inputTensor, t0 );
  }


  /** One input to one output (pointwise21) (i.e. no residual connection). The input tensors may or may not be disposed. */
  static apply_1_21_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 ); // may destroy t1.
    outputTensors[ 1 ] = null;
  }

  /** One input to one output (pointwise22) (i.e. no residual connection). The input tensors may or may not be disposed. */
  static apply_1_22_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 ); // may destroy t1.
  }

  /** One input to two output (pointwise21 and pointwise22) (i.e. no residual connection). The input tensors may or may not be disposed. */
  static apply_1_2_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 ); // may destroy t1.
  }


  /** The inputTensors[ 1 ] will be concatenated with depthwise1 before outputTensors[ 0 ]. */
  static apply_2_21_Concat1_depthwise1_input1( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    this.intermediateTensorsArray[ 0 ] = this.depthwise1.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = inputTensors[ 1 ];

    t1 = this.concat1.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = null;
  }

  /** The inputTensors[ 1 ] will be concatenated with depthwise1 before outputTensors[ 1 ]. */
  static apply_2_22_Concat1_depthwise1_input1( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    this.intermediateTensorsArray[ 0 ] = this.depthwise1.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = inputTensors[ 1 ];

    t1 = this.concat1.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 );
  }

  /**
   * The inputTensors[ 1 ] will be concatenated with depthwise1 before outputTensors[ 0 ] and outputTensors[ 1 ].
   * The input tensors may or may not be disposed.
   *
   * @param {tf.tensor[]} inputTensors
   *   An array of tensors. If ( this.inputTensorCount == 1 ), the inputTensors[ 0 ] will be used.
   * If ( this.inputTensorCount == 2 ), the inputTensors[ 0 ] and inputTensors[ 1 ] will be used.
   *
   * @param {tf.tensor[]} outputTensors
   *   An array for returning the result (output) tensors. If ( this.outputTensorCount == 1 ), the outputTensors[ 0 ] will
   * be the result. If ( this.outputTensorCount == 2 ), the outputTensors[ 0 ] and outputTensors[ 1 ] will be the result.
   */
  static apply_2_2_Concat1_depthwise1_input1( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    this.intermediateTensorsArray[ 0 ] = this.depthwise1.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = inputTensors[ 1 ];

    t1 = this.concat1.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 );
  }


  /** @return {number} The channel count of the first input tensor (i.e. inputTensors[ 0 ]). */
  get inChannels0()    { return this.channelCount0_pointwise1Before; }

  /**
   * @member {number} outChannelsAll
   *   The channel count of all output tensors (i.e. both outputTensor[ 0 ] and outputTensor[ 1 ]).
   */
  get outChannelsAll() {
     return ( this.outChannels0 + this.outChannels1 );
  }

  /** @return {string} The description string of all (adjusted) parameters of initer(). */
  get parametersDescription() {
    let str =
        `inputTensorCount=${this.inputTensorCount}, `

      + `inChannels0=${this.inChannels0}, inChannels1=${this.inChannels1}, `
      + `outChannels0=${this.outChannels0}, outChannels1=${this.outChannels1}, outChannelsAll=${this.outChannelsAll}, `

      + `channelCount1_pointwise1Before_Name=${this.channelCount1_pointwise1Before_Name}(${this.channelCount1_pointwise1Before}), `

      + `pointwise1ChannelCount=${this.pointwise1ChannelCount}, `
      + `bPointwise1Bias=${this.bPointwise1Bias}, `
      + `pointwise1ActivationName=${this.pointwise1ActivationName}(${this.pointwise1ActivationId}), `

      + `bDepthwise2Requested=${this.bDepthwise2Requested}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=${this.depthwise_AvgMax_Or_ChannelMultiplier_Name}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseStridesPad=${this.depthwiseStridesPad}, `
      + `bDepthwiseBias=${this.bDepthwiseBias}, `
      + `depthwiseActivationName=${this.depthwiseActivationName}(${this.depthwiseActivationId}), `

      + `bConcat1Requested=${this.bConcat1Requested}, `

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
