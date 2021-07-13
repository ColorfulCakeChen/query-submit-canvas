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
import * as TensorOpCounter from "./TensorOpCounter.js";


//!!! ...unfinished... (2021/06/09) Why are not channelCount0_pointwise1Before and channelCount1_pointwise1Before evolutable
// params (e.g. between 3 - 5)?

//!!! ...unfinished... (2021/07/01) Pointwise21's filter should be able pass in by external (for achieving channel-shuffle).

/**
 * Pointwise-depthwise-pointwise convolution layer parameters.
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
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of apply_and_destroy_or_keep()'s second input image (i.e. inputTensors[ 1 ]).
   *
   *   - ( channelCount1_pointwise1Before > 0 ): TWO-INPUTS: It should be the channel count of inputTensors[ 1 ]. The inputTensors[ 1 ]
   *     will not be processed by any pointwise1 and depthwise operation. It will be concatenated directly with the result of depthwise
   *     operation of inputTensors[ 0 ]. The concatenated result will be processed by pointwise2 convolution.
   *
   *   - ( channelCount1_pointwise1Before == 0 ): ONE-INPUT: The inputTensors[ 1 ] will not be used at all (will be ignored completely).
   *     The inputTensors[ 0 ] will be processed by pointwise1, one depthwise operation, and pointwise2 convolution.
   *
   *   - ( channelCount1_pointwise1Before == -1 ): ONE-INPUT-ADD-TO-OUTPUT: The inputTensors[ 1 ] will not be used at all (will be ignored
   *     completely). The inputTensors[ 0 ] will be processed by pointwise1, one depthwise operation, and pointwise2 convolution. Finally,
   *     the inputTensors[ 0 ] will be added to the result of pointwise2. This is the only one case which will do add-input-to-output.
   *
   *   - ( channelCount1_pointwise1Before == -2 ): ONE-INPUT-TWO-DEPTHWISE: The inputTensors[ 1 ] will not be used at all (will be ignored
   *     completely). The inputTensors[ 0 ] will be processed by two pathes: one is by pointwise1 and one depthwise operation, the other
   *     is by another depthwise operation (without pointwise1). These two depthwise operations will have the same configurations
   *     (i.e. same depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId)
   *     but have different (filter and bias) weights. The two depthwise results will be concatenated. The concatenated result will
   *     be processed by pointwise2 convolution. This is the only one case which there will be second depthwise.
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
   * @param {number} pointwise22ChannelCount
   *   The output channel count of the second pointwise2 convolution. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   * If ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ), there will be no pointwise convolution after depthwise convolution.
   * This second pointwise2 convolution This could achieve some kinds of channel shuffling of ShuffleNetV2.
   *
   * @param {boolean} bPointwise22Bias
   *   If true, there will be a bias after the second pointwise2 convolution. If null, it will be extracted from inputFloat32Array (i.e. by
   * evolution). If ( pointwise22ChannelCount == 0 ), this bias will also be ignored.
   *
   * @param {number} pointwise21ActivationId
   *   The activation function id (Params.pointwise22ActivationId.valueDesc.Ids.Xxx) after the second pointwise2 convolution. If null,
   * it will be extracted from inputFloat32Array (i.e. by evolution). If ( pointwise22ChannelCount == 0 ), this activation function
   * will also be ignored.
   *

// !!! ...unfinished... (2021/07/12 Remarked) be deprecated by channelCount1_pointwise1Before.
//
// //!!! ...unfinished... (2021/06/08) could be inferred from channelCount1_pointwise1Before?
// // If ( channelCount1_pointwise1Before < 0 ), means need add-input-to-output?
// // But this also means add-input-to-output can not be determined by evolution.
// //
//
//    * @param {number} inputTensorCount
//    *   How many input tensors should be past into apply_and_destroy(). the If null, it will be extracted from inputFloat32Array
//    * (i.e. by evolution).
//    *   - 0: One input. It will be added to output if ( depthwiseStridesPad == 1 ) ( i.e. ( depthwiseStrides == 1 )
//    *        and ( depthwisePad == "same" ) ) and ( channelCount_pointwise1Before == channelCount_pointwise2After ). This could achieve
//    *        the residual connection of MobileNetV2.
//    *   - 1: One input. It will not be added to output.
//    *   - 2: Two input. They will not be added to output. The second input will not be processed by pointwise1 convolution, depthwise
//    *        operation. But the second input will be concatenated with the result of depthwise operation. And then the concatenated
//    *        result will be processed by pointwise2 convolution.
   *
   */
  constructor( inputFloat32Array, byteOffsetBegin,
    channelCount1_pointwise1Before,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId
// !!! ...unfinished... (2021/07/12 Remarked) be deprecated by channelCount1_pointwise1Before.
//     inputTensorCount
  ) {

//!!! ...unfinished...
// squeeze-and-excitation ?

    let parameterMap = new Map( [
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
      [ Params.pointwise22ChannelCount,               pointwise22ChannelCount ],
      [ Params.bPointwise22Bias,                      bPointwise22Bias ],
      [ Params.pointwise22ActivationId,               pointwise22ActivationId ],
// !!! ...unfinished... (2021/07/12 Remarked) be deprecated by channelCount1_pointwise1Before.
//      [ Params.inputTensorCount,                      inputTensorCount ],
    ] );

    return super( inputFloat32Array, byteOffsetBegin, parameterMap );
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
    Params.setFlags_by_channelCount1_pointwise1Before.call( this, this.channelCount1_pointwise1Before );
    return bExtractOk;
  }

  /**
   * Determine input tensor count, whether request depthwise2, whether request concatenator, and whether request add-input-to-output.
   *
   * @param {number} channelCount1_pointwise1Before
   *   According to this integer, the flags will be set in this.inputTensorCount, this.bDepthwise2Requested, this.bConcatenatorRequested,
   * this.bAddInputToOutputRequested.
   */
  static setFlags_by_channelCount1_pointwise1Before( channelCount1_pointwise1Before ) {

    if ( channelCount1_pointwise1Before > 0 ) {
      this.inputTensorCount = 2; this.bDepthwise2Requested = false; this.bConcatenatorRequested = true; this.bAddInputToOutputRequested = false;
    }

    switch ( channelCount1_pointwise1Before ) {
      case  0: this.inputTensorCount = 1; this.bDepthwise2Requested = this.bConcatenatorRequested = false; this.bAddInputToOutputRequested = false;
        break;

      case -1: this.inputTensorCount = 1; this.bDepthwise2Requested = this.bConcatenatorRequested = false; this.bAddInputToOutputRequested =  true;
        break;

      case -2: this.inputTensorCount = 1; this.bDepthwise2Requested = this.bConcatenatorRequested =  true; this.bAddInputToOutputRequested = false;
        break;
    }
  }

  get channelCount1_pointwise1Before() { return this.parameterMapModified.get( Params.channelCount1_pointwise1Before ); }

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

  get pointwise22ChannelCount()   { return this.parameterMapModified.get( Params.pointwise22ChannelCount ); }
  get bPointwise22Bias()          { return this.parameterMapModified.get( Params.bPointwise22Bias ); }
  get pointwise22ActivationId()   { return this.parameterMapModified.get( Params.pointwise22ActivationId ); }
  get pointwise22ActivationName() { return Params.pointwise22ActivationId.getStringOfValue( this.pointwise22ActivationId ); }

// !!! ...unfinished... (2021/07/12 Remarked) be deprecated by channelCount1_pointwise1Before.
//  get inputTensorCount()          { return this.parameterMapModified.get( Params.inputTensorCount ); }
}


// Define parameter descriptions.

Params.channelCount1_pointwise1Before =  new ParamDesc.Int(        "channelCount1_pointwise1Before", -2, ( 10 * 1024 ) );

Params.pointwise1ChannelCount =  new ParamDesc.Int(                "pointwise1ChannelCount", 0, ( 10 * 1024 ) );
Params.bPointwise1Bias =         new ParamDesc.Bool(               "bPointwise1Bias" );
Params.pointwise1ActivationId =  new ParamDesc.ActivationFunction( "pointwise1ActivationId" );

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
Params.depthwiseFilterHeight =   new ParamDesc.Int(                "depthwiseFilterHeight", 1, 9 );

/** Define suitable value for depthwise convolution strides and pad. Integer between [ 0, 2 ]. */
Params.depthwiseStridesPad =     new ParamDesc.Int(                "depthwiseStridesPad",   0, 2 );

Params.bDepthwiseBias =          new ParamDesc.Bool(               "bDepthwiseBias" );
Params.depthwiseActivationId =   new ParamDesc.ActivationFunction( "depthwiseActivationId" );

Params.pointwise21ChannelCount = new ParamDesc.Int(                "pointwise21ChannelCount", 0, ( 10 * 1024 ) );
Params.bPointwise21Bias =        new ParamDesc.Bool(               "bPointwise21Bias" );
Params.pointwise21ActivationId = new ParamDesc.ActivationFunction( "pointwise21ActivationId" );

Params.pointwise22ChannelCount = new ParamDesc.Int(                "pointwise22ChannelCount", 0, ( 10 * 1024 ) );
Params.bPointwise22Bias =        new ParamDesc.Bool(               "bPointwise22Bias" );
Params.pointwise22ActivationId = new ParamDesc.ActivationFunction( "pointwise22ActivationId" );

// !!! ...unfinished... (2021/07/12 Remarked) be deprecated by channelCount1_pointwise1Before.
//Params.inputTensorCount =        new ParamDesc.Int(                "inputTensorCount",  0, 2 );


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
 * There four main combinations:
 *
 *   - When ( channelCount1_pointwise1Before > 0 ): TWO-INPUTS: (ShuffleNetV2's tail)
 * <pre>
 * input0 - pointwise1 - depthwise1 - concatenator - pointwise21
 * input1 --------------------------/              \ pointwise22
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == 0 ): ONE-INPUT: (MobileNetV1)
 * <pre>
 * input0 - pointwise1 - depthwise1 ---------------- pointwise21
 *                                                 \ pointwise22
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -1 ): ONE-INPUT-ADD-TO-OUTPUT: (MobileNetV2)
 * <pre>
 *        /------------------------------------------------------\
 * input0 - pointwise1 - depthwise1 ---------------- pointwise21 - addInput0ToPointwise21
 *        \                                        \ pointwise22 - addInput0ToPointwise22
 *         \-----------------------------------------------------/
 * </pre>
 *
 *
 *   - When ( channelCount1_pointwise1Before == -2 ): ONE-INPUT-TWO-DEPTHWISE: (ShuffleNetV2's head)
 * <pre>
 * input0 - pointwise1 - depthwise1 - concatenator - pointwise21
 *        \------------- depthwise2 /              \ pointwise22
 * </pre>
 *
 *
 *
 *
 *
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by initer().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by initer(). Where to extract next weights.
 * Only meaningful when ( this.isValid() == true ).
 *
 * @member {boolean} bPointwise1
 *   If true, the pointwise1 convolution exists.
 *
 * @member {string} pointwise1ActivationName
 *   The activation function id (Params.pointwise1ActivationId.valueDesc.Ids.Xxx) after the first pointwise convolution.
 *
 * @member {boolean} bDepthwise2Requested
 *   It will be true only when ( channelCount1_pointwise1Before == -2 ). If true, it means a second depthwise might be needed.
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
 * @member {boolean} bConcatenatorRequested
 *   It will be true when ( channelCount1_pointwise1Before > 0 ) or ( channelCount1_pointwise1Before == -2 ). If true, it means
 * a concatenator (before pointwise2) is needed.
 *
 * @member {boolean} bPointwise2
 *   If true, the pointwise2 (i.e. pointwise21 or/and pointwise22)  convolution exists.
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
 *   The activation function id (Params.pointwise22ActivationId.valueDesc.Ids.Xxx) after the second pointwise2 convolution.
 *
 * @member {number} inChannels0
 *   The channel count of the first input tensor (i.e. inputTensors[ 0 ]). This is the same as this.channelCount0_pointwise1Before (from initer()).
 *
 * @member {number} inChannels1
 *   The channel count of the second input tensor (i.e. inputTensors[ 1 ]). This is the same as this.channelCount1_pointwise1Before (from initer()).
 *
 * @member {number} outChannels0
 *   The channel count of the first output tensor. It is the same as this.channelCount_pointwise21After (from initer()).
 *
 * @member {number} outChannels1
 *   The channel count of the second output tensor. It is the same as this.channelCount_pointwise22After (from initer()).
 *
 * @member {number} outChannels
 *   The channel count of all output tensor. It is the same as this.channelCount_pointwise2After (from initer()).
 *
 * @member {number} channelCount_pointwise1After_depthwiseBefore
 *   The channel count after the first 1x1 pointwise convolution. If ( pointwise1ChannelCount > 0 ), it equals pointwise1ChannelCount.
 * If ( pointwise1ChannelCount == 0 ), it equals inChannels.
 *
 * @member {number} channelCount_depthwiseAfter_concatenateBefore
 *   The channel count after the NxN depthwise convolution. If ( depthwise_AvgMax_Or_ChannelMultiplier >= 1 ), it equals
 * ( channelCount_pointwise1After_depthwiseBefore * depthwise_AvgMax_Or_ChannelMultiplier ). If
 * Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG (-2)
 * or Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX (-1)
 * or Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.NONE (0), it equals channelCount_pointwise1After_depthwiseBefore.
 *
 * @member {number} channelCount_concatenateAfter_pointwise2Before
 *   The channel count after depthwise operation together with the second input channel count (if existed).
 * That is ( channelCount_depthwiseAfter_concatenateBefore + channelCount0_pointwise1Before ).
 *
 * @member {number} channelCount_pointwise21After
 *   The channel count after the first pointwise2 convolution. If ( pointwise21ChannelCount > 0 ), it equals pointwise21ChannelCount.
 * If ( pointwise21ChannelCount == 0 ), it will be 0.
 *
 * @member {number} channelCount_pointwise22After
 *   The channel count after the second pointwise2 convolution. If ( pointwise22ChannelCount > 0 ), it equals pointwise22ChannelCount.
 * If ( pointwise22ChannelCount == 0 ), it will be 0.
 *
 * @member {number} channelCount_pointwise2After
 *   The channel count after all pointwise2 convolution. Basically, it will be ( channelCount_pointwise21After + channelCount_pointwise22After )
 * if at least one pointwise2 convolution existed. If both ( pointwise21ChannelCount == 0 ) and ( pointwise22ChannelCount == 0 ), it
 * will be channelCount_concatenateAfter_pointwise2Before.
 *
 * @member {number} outputTensorCount
 *   How many output tensors will be returned by the parameter outputTensors of apply_and_destroy_or_keep(). At least 1. At most 2. It is
 * determined by bPointwise21 and bPointwise22.
 *
 * @member {boolean} bAddInputToOutputRequested
 *   It will be true when ( this.channelCount1_pointwise1Before == -1 ). The input (in this case, the main input (i.e. inputTensorArray[ 0 ])
 * will be added to the output for achieving skip connection.
 *
 * @member {function} apply_and_destroy_or_keep
 *   This is a method. It has two parameters inputTensors and outputTensors. The inputTensors (tf.tensor3d[]) represents the images
 * ( height x width x channel ) which will be processed. The outputTensors (tf.tensor3d[]) will be placed one or two tf.tensor3d as the result.
 * All intermediate tensors will be disposed. The inputTensors may or may not be disposed. In fact, this method calls one of
 * apply_X_Y_and_destroy_AddInputToOutput(), apply_X_Y_and_keep_AddInputToOutput(), apply_X_Y_and_destroy_or_keep_NoSkipConnection(),
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
   * @param {number} channelCount0_pointwise1Before
   *   The channel count of apply_and_destroy_or_keep()'s first input image (i.e. inputTensors[ 0 ]). This should always be specified
   * and can not be null (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply_and_destroy_or_keep() will not dispose inputTensor (i.e. keep). For example, for the branch of step 0 of ShuffleNetV2.
   * For another example, the input image should be shared across many neural networks. If it is null, it will be viewed as falsy
   * (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   *
   * @param {Params} params
   *   A Params object. The params.extract() will be called to extract parameters.
   *   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   */
  * initer( progressParent, channelCount0_pointwise1Before, bKeepInputTensor, params ) {

    // 0. Prepare

    // Estimate the maximum value of progress.
    let progressMax =
      1    // for extracting parameters from inputFloat32Array.
      + 1  // for extracting pointwise1 filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for extracting depthwise filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for extracting pointwise2 filters (and biases) from inputFloat32Array and building tensors.
      + 1  // for all pointwise1-depthwise-pointwise2 filters (and biases) ready.
      ;

    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild( new ValueMax.Percentage.Concrete( progressMax ) );

    this.disposeTensors();  // Also initialize some member function pointers to no_operation().

    this.channelCount0_pointwise1Before = channelCount0_pointwise1Before;

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
    this.channelCount1_pointwise1Before = params.channelCount1_pointwise1Before;

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

    this.pointwise22ChannelCount = params.pointwise22ChannelCount;
    this.bPointwise22Bias = params.bPointwise22Bias;
    this.pointwise22ActivationId = params.pointwise22ActivationId;
    this.pointwise22ActivationName = params.pointwise22ActivationName;

    // Determine input tensor count and whether request add-input-to-output.
    this.inputTensorCount = params.inputTensorCount;
    this.bDepthwise2Requested = params.bDepthwise2Requested;
    this.bConcatenatorRequested = params.bConcatenatorRequested;
    this.bAddInputToOutputRequested = params.bAddInputToOutputRequested;

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
      this.pointwise1ChannelCount, this.bPointwise1Bias, this.pointwise1ActivationId,
      params.defaultInput, this.byteOffsetEnd );

    if ( !this.pointwise1.init() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.pointwise1.byteOffsetEnd;

    this.bPointwise1 = this.pointwise1.bExisted;
    if ( this.bPointwise1 ) {
      this.channelCount_pointwise1After_depthwiseBefore = this.pointwise1.outputChannelCount;
      TensorOpCounters.pointwise1 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_pointwise1", this.pointwise1, TensorOpCounters.input0 );

    } else {
      this.channelCount_pointwise1After_depthwiseBefore = channelCount0_pointwise1Before;  // No pointwise1 convolution.
      TensorOpCounters.pointwise1 = TensorOpCounters.input0; // Its output is just its input tensor.
    }

    ++progressToAdvance.value;
    yield progressRoot;  // pointwise1 filters was ready. Report progress.

//!!! ...unfinished (2021/07/10) When pad=valid, it seems that depthwise (avg/max pooling) filter size can not greater than input image size.

    // 3. The depthwise operation.

    // 3.1 The first depthwise operation.
    this.depthwise1 = new Depthwise.Base(
      this.channelCount_pointwise1After_depthwiseBefore,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight,
      this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId,
      params.defaultInput, this.byteOffsetEnd );

    if ( !this.depthwise1.init() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.depthwise1.byteOffsetEnd;

    this.bDepthwise1 = this.depthwise1.bExisted;
    if ( this.bDepthwise1 ) {
      this.channelCount_depthwise1After_concatenateBefore = this.depthwise1.outputChannelCount;
      TensorOpCounters.depthwise1 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_depthwise1", this.depthwise1, TensorOpCounters.pointwise1 );

    } else {
      this.channelCount_depthwise1After_concatenateBefore = this.channelCount_pointwise1After_depthwiseBefore;  // No depthwise1 operation.
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
        this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId,
        params.defaultInput, this.byteOffsetEnd );

      if ( !this.depthwise2.init() )
        return false;  // e.g. input array does not have enough data.
      this.byteOffsetEnd = this.depthwise2.byteOffsetEnd;

      this.bDepthwise2 = this.depthwise2.bExisted;
      if ( this.bDepthwise2 ) {
        this.channelCount_depthwise2After_concatenateBefore = this.depthwise2.outputChannelCount;
        TensorOpCounters.depthwise2 = new TensorOpCounter.Base( ( ++TensorOpCounterId ) + "_depthwise2", this.depthwise2, TensorOpCounters.input0 );

      } else {
        // The depthwise2 is requested but not created. It means ( depthwise_AvgMax_Or_ChannelMultiplier == 0 ). In this case,
        // the depthwise2 should be short circuit to inputTensor[ 0 ] (i.e. not inputTensor[ 1 ]).
        this.channelCount_depthwise2After_concatenateBefore = channelCount0_pointwise1Before;
        TensorOpCounters.depthwise2 = TensorOpCounters.input0;
      }

    } else {
      // The depthwise2 is not requested. In this case, the depthwise2 should be short circuit to inputTensor[ 1 ] (i.e. not inputTensor[ 0 ]).
      this.channelCount_depthwise2After_concatenateBefore = this.channelCount1_pointwise1Before;
      TensorOpCounters.depthwise2 = TensorOpCounters.input1;
    }

    ++progressToAdvance.value;
    yield progressRoot;  // depthwise filters was ready. Report progress.


    // 4. Concatenator
    //
    // If ( there are two input tensors ) or ( there is one input tensor but there is depthwise2 ), the channel count for pointwise2 input
    // will be the concatenated channel count (= depthwise1_channel_count + depthwise2_channel_count ).
    if ( this.bConcatenatorRequested ) {
      
      this.channelCount_concatenateAfter_pointwise2Before
        = this.channelCount_depthwise1After_concatenateBefore + this.channelCount_depthwise2After_concatenateBefore;

      this.concatenator = new ConcatAlongAxisId2.Base( false, false );

      TensorOpCounters.concatenator = new TensorOpCounter.Base(
        ( ++TensorOpCounterId ) + "_concatenator", this.concatenator, TensorOpCounters.depthwise1, TensorOpCounters.depthwise2 );

    } else {
      this.channelCount_concatenateAfter_pointwise2Before = this.channelCount_depthwise1After_concatenateBefore;
      TensorOpCounters.concatenator = TensorOpCounters.depthwise1;
    }


    // 5. The pointwise2 convolution.

    // 5.1 Pointwise21
    this.pointwise21 = new Pointwise.Base(
      this.channelCount_concatenateAfter_pointwise2Before,
      this.pointwise21ChannelCount, this.bPointwise21Bias, this.pointwise21ActivationId,
      params.defaultInput, this.byteOffsetEnd );

    if ( !this.pointwise21.init() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.pointwise21.byteOffsetEnd;

    this.bPointwise21 = this.pointwise21.bExisted;
    if ( this.bPointwise21 ) {
      this.channelCount_pointwise21After = this.pointwise21ChannelCount;
    } else {
      this.channelCount_pointwise21After = 0;  // No first pointwise2 convolution.
    }

    // 5.2 Pointwise22
    this.pointwise22 = new Pointwise.Base(
      this.channelCount_concatenateAfter_pointwise2Before,
      this.pointwise22ChannelCount, this.bPointwise22Bias, this.pointwise22ActivationId,
      params.defaultInput, this.byteOffsetEnd );

    if ( !this.pointwise22.init() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.pointwise22.byteOffsetEnd;

    this.bPointwise22 = this.pointwise22.bExisted;
    if ( this.bPointwise22 ) {
      this.channelCount_pointwise22After = this.pointwise22ChannelCount;
    } else {
      this.channelCount_pointwise22After = 0;  // No second pointwise2 convolution.
    }

    // 5.3 Pointwise2 (= Pointwise21 + Pointwise22 )
    this.bPointwise2 = ( this.bPointwise21 || this.bPointwise22 );
    this.channelCount_pointwise2After = this.pointwise21ChannelCount + this.pointwise22ChannelCount;

    if ( !this.bPointwise2 ) {
      // If there is not any pointwise2 convolution, the result channel count will not be zero. It should be the channel count after
      // depthwise operation together with the second input channel count (if existed). And it should be at the first output tensor
      // (i.e. outputTensors[ 0 ]).
      this.channelCount_pointwise2After = this.channelCount_pointwise21After = this.channelCount_concatenateAfter_pointwise2Before;
    }

    // If both pointwise21 and pointwise22 existed, the pointwise21 should keep-input-tensor.
    // Otherwise, the pointwise22 will fail to process it.
    if ( this.bPointwise21 && this.bPointwise22 ) {

//!!! ...unfinished... (2021/07/10 Remarked) should already be integrated into TensorOpCounters analyzing.
//      this.pointwise21.setKeepInputTensor( true );

      this.outputTensorCount = 2; // This is the only case which will output two tensors. 
    } else {
      this.outputTensorCount = 1; // All other cases, there will be only one output tensor.
    }

    // 5.4
    ++progressToAdvance.value;
    yield progressRoot;  // pointwise2 filters was ready. Report progress.

    // 6. Configure correct function pointers according to whether keeping or destroying input tensor.
    this.bKeepInputTensor = bKeepInputTensor;

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
      // if channelCount_concatenateAfter_pointwise2Before (which is already assigned to channelCount_pointwise21After in this case)
      // has the same dimension as inputTensors[ 0 ].

      if ( channelCount0_pointwise1Before == this.channelCount_pointwise21After ) {
        this.bShould_addInput0ToPointwise21 = true;
        this.addInput0ToPointwise21 = new AddTwoTensors.Base();
      }

      // Only inputTensors[ 0 ] will be used to add to output. So still check against channelCount0_pointwise1Before
      // (not channelCount1_pointwise1Before).
      if ( channelCount0_pointwise1Before == this.channelCount_pointwise22After ) {
        this.bShould_addInput0ToPointwise22 = true;
        this.addInput0ToPointwise22 = new AddTwoTensors.Base();
      }
    }

    this.bShouldAddInputToOutput = this.bShould_addInput0ToPointwise21 || this.bShould_addInput0ToPointwise22;

    // Q: Why not create TensorOpCounter in the above codes?
    // A: The reason is that let addInput0ToPointwise21 in front of pointwise22.
    //    This is because apply_X_X_and_destroy_or_keep_AddInputToOutput_X() does them in this order.
    {
      if ( this.bPointwise21 )
        TensorOpCounters.pointwise21 = new TensorOpCounter.Base(
          ( ++TensorOpCounterId ) + "_pointwise21", this.pointwise21, TensorOpCounters.concatenator );
      else
        TensorOpCounters.pointwise21 = TensorOpCounters.concatenator; // Its output is just its input tensor.

      // Note: This should be before pointwise22.
      if ( this.bShould_addInput0ToPointwise21 )
        TensorOpCounters.addInput0ToPointwise21 = new TensorOpCounter.Base(
          ( ++TensorOpCounterId ) + "_addInput0ToPointwise21", this.addInput0ToPointwise21, TensorOpCounters.input0, TensorOpCounters.pointwise21 );
      else
        TensorOpCounters.addInput0ToPointwise21 = TensorOpCounters.pointwise21;

      if ( this.bPointwise22 )
        TensorOpCounters.pointwise22 = new TensorOpCounter.Base(
          ( ++TensorOpCounterId ) + "_pointwise22", this.pointwise22, TensorOpCounters.concatenator );
      else
        TensorOpCounters.pointwise22 = TensorOpCounters.concatenator; // Its output is just its input tensor.

      // Only inputTensors[ 0 ] will be used to add to output. So still check against channelCount0_pointwise1Before
      // (not channelCount1_pointwise1Before).
      if ( this.bShould_addInput0ToPointwise22 )
        TensorOpCounters.addInput0ToPointwise22 = new TensorOpCounter.Base(
          ( ++TensorOpCounterId ) + "_addInput0ToPointwise22", this.addInput0ToPointwise22, TensorOpCounters.input0, TensorOpCounters.pointwise22 );
      else
        TensorOpCounters.addInput0ToPointwise22 = TensorOpCounters.pointwise22;
    }

    // 6.2 Determine which apply_Xxx() function should be used.
    //
    // This should be done before adjusting the first operation from "Xxx_destroy" to "Xxx_keep",
    // because the adjustment might also need to select different apply_Xxx() function.
    this.apply_and_destroy_or_keep = Base.Determine_apply_and_destroy_or_keep.call( this );

    // 6.3 Adjust the destroy-or-keep behavior of every tensor according to whether the operation is the first operation or last operation.
    {
      let alwaysKeepSet;
      if ( bKeepInputTensor ) { // User requests to keep input tensors.
        alwaysKeepSet = new Set( [ TensorOpCounters.input0, TensorOpCounters.input1 ] );
      }

      // Using Set (instead of Array) so that duplicated TensorOpCounter will only be analyzed once.
      // Note: When an operation does not exist, its output TensorOpCounter will be just its input TensorOpCounter (so duplicated).
      let TensorOpCounterSet = new Set( [
        TensorOpCounters.pointwise1,  TensorOpCounters.depthwise1, TensorOpCounters.depthwise2, TensorOpCounters.concatenator,
        TensorOpCounters.pointwise21, TensorOpCounters.addInput0ToPointwise21,
        TensorOpCounters.pointwise22, TensorOpCounters.addInput0ToPointwise22
      ] );

      for ( let TensorOpCounter of TensorOpCounterSet ) {
        TensorOpCounter.setKeepInputTensor_IfNotLastOperation_Or_In( alwaysKeepSet );
      }
    }

    // 6.4
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
  init( progressParent, channelCount0_pointwise1Before, channelCount1_pointwise1Before, bKeepInputTensor, params ) {

    progressParent = progressParent || ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer( progressParent, channelCount0_pointwise1Before, channelCount1_pointwise1Before, bKeepInputTensor, params );
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

    if ( this.concatenator ) {
      this.concatenator = null;
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

    this.intermediateTensorsArray = null;

    this.bPointwise1
      = this.bDepthwise2Requested = this.bDepthwise1 = this.bDepthwise2 =
      = this.bConcatenatorRequested
      = this.bPointwise21 = this.bPointwise22
      = this.bShouldAddInputToOutput = this.bShould_addInput0ToPointwise21 = this.bShould_addInput0ToPointwise22 = false;

    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /** Determine which apply_Xxx() function should be used.
   * @return {function} Return one of the apply_Xxx function.
   */
  static Determine_apply_and_destroy_or_keep() {

//!!! ...unfinished (2021/07/12) When ( bDepthwise2Requested == true ), need depthwise2.

    if ( this.bShouldAddInputToOutput ) { // ( this.bAddInputToOutputRequested == true ) and possible to add-input-to-output.

      // 1. add-input-to-output and (keep-input or destroy-input).

      if ( this.bPointwise21 ) {
        if ( this.bPointwise22 ) {

          // 1.1 Both pointwise21 and pointwise22 exist.
          //
          // Although both pointwise21 and pointwise22 exist, but it may be only pointwise21 or pointwise22 could (or need) add-input-to-output.

          if ( this.bShould_addInput0ToPointwise21 ) {
            if ( this.bShould_addInput0ToPointwise22 ) {
              // 1.1.1 Both pointwise21 and pointwise22 exist, and both addInput0ToPointwise21 and addInput0ToPointwise22 exist.
              return Base.apply_1_2_and_destroy_or_keep_AddInputToOutput_2;
            } else {
              // 1.1.2 Both pointwise21 and pointwise22 exist, but only addInput0ToPointwise21 exists.
              return Base.apply_1_2_and_destroy_or_keep_AddInputToOutput_21;
            }
          } else {
            if ( this.bShould_addInput0ToPointwise22 ) {
              // 1.1.3 Both pointwise21 and pointwise22 exist, but only addInput0ToPointwise22 exists.
              return Base.apply_1_2_and_destroy_or_keep_AddInputToOutput_22;
            } else {
              // 1.1.4 Both pointwise21 and pointwise22 exist, but both addInput0ToPointwise21 and addInput0ToPointwise22 do not exist.

              // It should not execute to here.
              tf.util.assert( false,
                `PointDepthPoint.Determine_apply_and_destroy_or_keep(), this.bShouldAddInputToOutput (${this.bShouldAddInputToOutput}) `
                  + `should equal this.bShould_addInput0ToPointwise21 (${this.bShould_addInput0ToPointwise21}) `
                  + ` or this.bShould_addInput0ToPointwise22 (${this.bShould_addInput0ToPointwise22}). ${this.parametersDescription}`);

              return undefined;
            }
          }

        } else {
          return Base.apply_1_21_and_destroy_or_keep_AddInputToOutput; // 1.2 Only pointwise21 exists (and no pointwise22).
        }
      } else {
        if ( this.bPointwise22 ) {
          return Base.apply_1_22_and_destroy_or_keep_AddInputToOutput; // 1.3 Only pointwise22 exists (and no pointwise21).
        } else {
          // 1.4 Both pointwise21 and pointwise22 do not exist. (Use pointwise21, but channel cout is the same as channel cout before pointwise2.)
          return Base.apply_1_21_and_destroy_or_keep_AddInputToOutput;
        }
      }

    } else { // ( this.inputTensorCount >= 1 ) or ( ( this.bAddInputToOutputRequested == true ) but not-possible to add-input-to-output).

      if ( this.inputTensorCount > 1 ) {
        // 2. (no-add-input-to-output but) concat and destroy-input (or keep-input).

        if ( this.bPointwise21 ) {
          if ( this.bPointwise22 ) {
            return Base.apply_2_2_and_destroy_or_keep_ConcatInput1;  // 2.1 Both pointwise21 and pointwise22 existed.
          } else {
            return Base.apply_2_21_and_destroy_or_keep_ConcatInput1; // 2.2 Only pointwise21 existed (and no pointwise22).
          }
        } else {
          if ( this.bPointwise22 ) {
            return Base.apply_2_22_and_destroy_or_keep_ConcatInput1; // 2.3 Only pointwise22 existed (and no pointwise21).
          } else {
            return Base.apply_2_21_and_destroy_or_keep_ConcatInput1; // 2.4 Both pointwise21 and pointwise22 not existed. (Use pointwise21.)
          }
        }

      } else {
        // 3. no-add-input-to-output, no-concat, and destroy-input (or keep-input).
        //
        // ( this.inputTensorCount == 1 ) or ( ( this.bAddInputToOutputRequested == true ) but not-possible ).

        if ( this.bPointwise21 ) {
          if ( this.bPointwise22 ) {
            return Base.apply_1_2_and_destroy_or_keep_NoSkipConnection;  // 3.1 Both pointwise21 and pointwise22 existed.
          } else {
            return Base.apply_1_21_and_destroy_or_keep_NoSkipConnection; // 3.2 Only pointwise21 existed (and no pointwise22).
          }
        } else {
          if ( this.bPointwise22 ) {
            return Base.apply_1_22_and_destroy_or_keep_NoSkipConnection; // 3.3 Only pointwise22 existed (and no pointwise21).
          } else {
             // 3.4 Both pointwise21 and pointwise22 not existed.

//!!! ...unfinished... (2021/06/29 Remarked)
//            return Base.apply_1_21_and_destroy_or_keep_NoSkipConnection; // 3.4 Both pointwise21 and pointwise22 not existed. (Use pointwise21.)

            // no pointwise1, no depthwise1, no concatenator, no pointwise21, no addInput0ToPointwise21, no pointwise22, no addInput0ToPointwise22
            if ( !this.bPointwise1 && !this.bDepthwise1 ) {

//!!! ...unfinished... (2021/06/29) should be tested.

              // Note: This may be wrong, however, if there are wrongly two input tensors (there should be only one input
              // (i.e. inputTensors[ 0 ]) for should-add-input-to-output).
              if ( this.bKeepInputTensor )
                return Base.keep_input_return_copy_array; // 3.4.1
              else
                return Base.return_input_directly_array;  // 3.4.2

            } else {
              return Base.apply_1_21_and_destroy_or_keep_NoSkipConnection; // 3.4.3 At least, there are pointwise1 or depthwise. (Use pointwise21.)
            }
            
          }
        }

      }
    }
  }


  /** The only one input will be added to the only one output (pointwise21). The inputTensor may or may not be disposed.*/
  static apply_1_21_and_destroy_or_keep_AddInputToOutput( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

//!!! ...unfinished... (2021/05/28) What if inputTensors[ 0 ] exists?
//    tf.util.assert( null == inputTensors[ 1 ] );

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise21.pfnConvBiasActivation( t1 );

    outputTensors[ 0 ] = this.addInput0ToPointwise21.pfnAdd( inputTensor, t0 );
    outputTensors[ 1 ] = null;
  }

  /** The only one input will be added to the only one output (pointwise22). The inputTensor may or may not be disposed.*/
  static apply_1_22_and_destroy_or_keep_AddInputToOutput( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

//!!! ...unfinished... (2021/05/28) What if inputTensors[ 0 ] exists?
//    tf.util.assert( null == inputTensors[ 1 ] );

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise22.pfnConvBiasActivation( t1 );

    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = this.addInput0ToPointwise22.pfnAdd( inputTensor, t0 );
  }


  /** Both outputTensors[ 0 ] and outputTensors[ 1 ] exist. The inputTensors[ 0 ] will be added to both of them.
   * The inputTensor may or may not be disposed.
   */
  static apply_1_2_and_destroy_or_keep_AddInputToOutput_2( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

//!!! ...unfinished... (2021/05/28) What if inputTensors[ 0 ] exists?
//    tf.util.assert( null == inputTensors[ 1 ] );

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
  static apply_1_2_and_destroy_or_keep_AddInputToOutput_21( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

//!!! ...unfinished... (2021/05/28) What if inputTensors[ 0 ] exists?
//    tf.util.assert( null == inputTensors[ 1 ] );

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 0 ] = this.addInput0ToPointwise21.pfnAdd( inputTensor, t0 );

    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 );
  }

  /** Both outputTensors[ 0 ] and outputTensors[ 1 ] exist. The inputTensors[ 0 ] will be added to only outputTensors[ 1 ].
   * The inputTensor may or may not be disposed.
   */
  static apply_1_2_and_destroy_or_keep_AddInputToOutput_22( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

//!!! ...unfinished... (2021/05/28) What if inputTensors[ 0 ] exists?
//    tf.util.assert( null == inputTensors[ 1 ] );

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );

    t0 = this.pointwise22.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.addInput0ToPointwise22.pfnAdd( inputTensor, t0 );
  }


  /** The inputTensors[ 1 ] will be concatenated before outputTensors[ 0 ]. */
  static apply_2_21_and_destroy_or_keep_ConcatInput1( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    this.intermediateTensorsArray[ 0 ] = this.depthwise1.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = inputTensors[ 1 ];

    t1 = this.concatenator.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = null;
  }

  /** The inputTensors[ 1 ] will be concatenated before outputTensors[ 1 ]. */
  static apply_2_22_and_destroy_or_keep_ConcatInput1( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    this.intermediateTensorsArray[ 0 ] = this.depthwise1.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = inputTensors[ 1 ];

    t1 = this.concatenator.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 );
  }

  /**
   * The inputTensors[ 1 ] will be concatenated before outputTensors[ 0 ] and outputTensors[ 1 ].
   * The input tensors may or may not be disposed.
   *
   * @param {tf.tensor[]} inputTensors
   *   An array of tensors. If ( this.inputTensorCount == 1 ), the inputTensors[ 0 ] will be used.
   * If ( this.inputTensorCount == 2 ), the inputTensors[ 0 ] and inputTensors[ 1 ] will be used.
   *
   * @param {tf.tensor[]} outputTensors
   *   An array for returning the result (output) tensors. If ( this.outputTensorCount == 0 ) or ( this.outputTensorCount == 1 ),
   * the outputTensors[ 0 ] will be the result. If ( this.outputTensorCount == 2 ), the outputTensors[ 0 ] and outputTensors[ 1 ] will
   * be the result.
   */
  static apply_2_2_and_destroy_or_keep_ConcatInput1( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    this.intermediateTensorsArray[ 0 ] = this.depthwise1.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = inputTensors[ 1 ];

    t1 = this.concatenator.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 );
  }


  /** One input to one output (pointwise21) (i.e. no residual connection). The input tensors may or may not be disposed. */
  static apply_1_21_and_destroy_or_keep_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 ); // may destroy t1.
    outputTensors[ 1 ] = null;
  }

  /** One input to one output (pointwise22) (i.e. no residual connection). The input tensors may or may not be disposed. */
  static apply_1_22_and_destroy_or_keep_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 ); // may destroy t1.
  }

  /** One input to two output (pointwise21 and pointwise22) (i.e. no residual connection). The input tensors may or may not be disposed. */
  static apply_1_2_and_destroy_or_keep_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise1.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 ); // may destroy t1.
  }


  /** @return {boolean} Return true if this object initialized (i.e. initer()) successfully. */
  isValid() {
    return this.bInitOk;
  }

  /** @return {number} The channel count of the first input tensor (i.e. inputTensors[ 0 ]). */
  get inChannels0()    { return this.channelCount0_pointwise1Before; }

  /** @return {number} The channel count of the second input tensor (i.e. inputTensors[ 1 ]). */
  get inChannels1()    { return this.channelCount1_pointwise1Before; }

  /** @return {number} The channel count of the first output tensor (i.e. outputTensors[ 0 ]). */
  get outChannels0()   { return this.channelCount_pointwise21After; }

  /** @return {number} The channel count of the second output tensor (i.e. outputTensors[ 1 ]). */
  get outChannels1()   { return this.channelCount_pointwise22After; }

  /** @return {number} The channel count of both the first and second output tensors. */
  get outChannelsAll() { return this.channelCount_pointwise2After; }

  /** @return {string} The description string of all (adjusted) parameters of initer(). */
  get parametersDescription() {
    let str =
        `inChannels0=${this.inChannels0}, inChannels1=${this.inChannels0}, `
      + `outChannels0=${this.outChannels0}, outChannels1=${this.outChannels0}, `

      + `pointwise1ChannelCount=${this.pointwise1ChannelCount}, `
      + `bPointwise1Bias=${this.bPointwise1Bias}, `
      + `pointwise1ActivationName=${this.pointwise1ActivationName}, `

      + `bDepthwise2Requested=${this.bDepthwise2Requested}, `
      + `depthwise_AvgMax_Or_ChannelMultiplier=${this.depthwise_AvgMax_Or_ChannelMultiplier_Name}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseStridesPad=${this.depthwiseStridesPad}, `
      + `bDepthwiseBias=${this.bDepthwiseBias}, `
      + `depthwiseActivationName=${this.depthwiseActivationName}, `

      + `bConcatenatorRequested=${this.bConcatenatorRequested}, `

      + `pointwise21ChannelCount=${this.pointwise21ChannelCount}, `
      + `bPointwise21Bias=${this.bPointwise21Bias}, `
      + `pointwise21ActivationName=${this.pointwise21ActivationName}, `

      + `pointwise22ChannelCount=${this.pointwise22ChannelCount}, `
      + `bPointwise22Bias=${this.bPointwise22Bias}, `
      + `pointwise22ActivationName=${this.pointwise22ActivationName}, `

      + `inputTensorCount=${this.inputTensorCount}, `
      + `bDepthwise2Requested=${this.bDepthwise2Requested}, `
      + `bConcatenatorRequested=${this.bConcatenatorRequested}, `
      + `bAddInputToOutputRequested=${this.bAddInputToOutputRequested}, `

      + `outputTensorCount=${this.outputTensorCount}, `
    
      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

}
