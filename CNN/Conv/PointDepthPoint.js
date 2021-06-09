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


//!!! ...unfinished... (2021/06/09) Why are not channelCount1_pointwise1Before and channelCount2_pointwise1Before evolutable
// params (e.g. between 3 - 5)?

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
   * Default is 1 because ( depthwiseStrides == 1 ) and ( depthwisePad == "same" ) is a pre-condition for ( bAddInputToOutput == true ).
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

//!!! ...unfinished... (2021/06/08) could be inferred from channelCount2_pointwise1Before?
// If ( channelCount2_pointwise1Before < 0 ), means need add-input-to-output?
// But this also means add-input-to-output can not be determined by evolution.
//

   * @param {number} inputTensorCount
   *   How many input tensors should be past into apply_and_destroy(). the If null, it will be extracted from inputFloat32Array
   * (i.e. by evolution).
   *   - 0: One input. It will be added to output if ( depthwiseStridesPad == 1 ) ( i.e. ( depthwiseStrides == 1 )
   *        and ( depthwisePad == "same" ) ) and ( channelCount_pointwise1Before == channelCount_pointwise2After ). This could achieve
   *        the residual connection of MobileNetV2.
   *   - 1: One input. It will not be added to output.
   *   - 2: Two input. They will not be added to output. The second input will not be processed by pointwise1 convolution, depthwise
   *        operation. But the second input will be concatenated with the result of depthwise operation. And then the concatenated
   *        result will be processed by pointwise2 convolution.
   *
   */
  constructor( inputFloat32Array, byteOffsetBegin,
    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId,
    inputTensorCount
  ) {

//!!! ...unfinished...
// squeeze-and-excitation ?

    let parameterMap = new Map( [
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
      [ Params.inputTensorCount,                      inputTensorCount ],
    ] );

    return super( inputFloat32Array, byteOffsetBegin, parameterMap );
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

  get pointwise22ChannelCount()   { return this.parameterMapModified.get( Params.pointwise22ChannelCount ); }
  get bPointwise22Bias()          { return this.parameterMapModified.get( Params.bPointwise22Bias ); }
  get pointwise22ActivationId()   { return this.parameterMapModified.get( Params.pointwise22ActivationId ); }
  get pointwise22ActivationName() { return Params.pointwise22ActivationId.getStringOfValue( this.pointwise22ActivationId ); }

  get inputTensorCount()          { return this.parameterMapModified.get( Params.inputTensorCount ); }
}


// Define parameter descriptions.

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

Params.inputTensorCount =        new ParamDesc.Int(                "inputTensorCount",  0, 2 );


/**
 * One step of one block of convolution neural network. There are at most three convolutions inside this object.
 *   - 1x1 pointwise convolution: change channel count. (exapnd)
 *   - NxN depthwise convolution: change channel count. (channel multiplier)
 *   - 1x1 pointwise convolution: change channel count. (shrink)
 *
 * Every convolution (no matter pointwise or depthwise) could exist or not exist. If exists, it could have or have no bias and
 * activation function.
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
 * @member {boolean} bDepthwise
 *   If true, the depthwise convolution (or average pooling, or maximum pooling) exists.
 *
 * @member {string} depthwise_AvgMax_Or_ChannelMultiplier_Name
 *   Depthwise operation name.
 *
 * @member {string} depthwiseActivationName
 *   The activation function name (Params.depthwiseActivationId.valueDesc.Ids.Xxx) after depthwise convolution.
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
 * @member {number} inChannels1
 *   The channel count of the first input tensor (i.e. inputTensors[ 0 ]). This is the same as this.channelCount1_pointwise1Before (from initer()).
 *
 * @member {number} inChannels2
 *   The channel count of the second input tensor (i.e. inputTensors[ 1 ]). This is the same as this.channelCount2_pointwise1Before (from initer()).
 *
 * @member {number} outChannels1
 *   The channel count of the first output tensor. It is the same as this.channelCount_pointwise21After (from initer()).
 *
 * @member {number} outChannels2
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
 * That is ( channelCount_depthwiseAfter_concatenateBefore + channelCount1_pointwise1Before ).
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
 *   How many output tensors will be returned by the parameter outputTensors of apply_and_destroy_or_keep(). At least 1. At most 2.
 *
 * @member {boolean} bAddInputToOutput
 *   It will be true when ( this.inputTensorCount == 0 ). The input (in this case, the main input (i.e. inputTensorArray[ 0 ])
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
   * @param {number} channelCount1_pointwise1Before
   *   The channel count of apply_and_destroy_or_keep()'s first input image (i.e. inputTensors[ 0 ]). This should always be specified
   * and can not be null (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   *
   * @param {number} channelCount2_pointwise1Before
   *   The channel count of apply_and_destroy_or_keep()'s second input image (i.e. inputTensors[ 1 ]). If ( params.inputTensorCount == 2 ),
   * This should always be specified and can not be null (i.e. it will never be extracted from inputFloat32Array and never by evolution).
   * If ( params.inputTensorCount < 2 ), this will be ignored.
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
  * initer( progressParent, channelCount1_pointwise1Before, channelCount2_pointwise1Before, bKeepInputTensor, params ) {

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

    this.channelCount1_pointwise1Before = channelCount1_pointwise1Before;
    this.channelCount2_pointwise1Before = channelCount2_pointwise1Before;

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

    this.inputTensorCount = params.inputTensorCount;
    this.bAddInputToOutput = ( 0 == this.inputTensorCount );

    this.intermediateTensorsArray = new Array( 2 ); // Pre-allocate array to place intermediate 2 tensors. This could reduce memory re-allocation.

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    // 2. The first 1x1 pointwise convolution.
    this.pointwise1 = new Pointwise.Base(
      this.channelCount1_pointwise1Before,
      this.pointwise1ChannelCount, this.bPointwise1Bias, this.pointwise1ActivationId,
      params.defaultInput, this.byteOffsetEnd );

    if ( !this.pointwise1.init() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.pointwise1.byteOffsetEnd;

    this.bPointwise1 = this.pointwise1.bExisted;
    if ( this.bPointwise1 ) {
      this.channelCount_pointwise1After_depthwiseBefore = this.pointwise1.outputChannelCount;
    } else {
      this.channelCount_pointwise1After_depthwiseBefore = channelCount1_pointwise1Before;  // No pointwise1 convolution.
    }

    ++progressToAdvance.value;
    yield progressRoot;  // pointwise1 filters was ready. Report progress.

    // 3. The depthwise operation.
    this.depthwise = new Depthwise.Base(
      this.channelCount_pointwise1After_depthwiseBefore,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight,
      this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId,
      params.defaultInput, this.byteOffsetEnd );

    if ( !this.depthwise.init() )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.depthwise.byteOffsetEnd;

    this.bDepthwise = this.depthwise.bExisted;
    if ( this.bDepthwise ) {
      this.channelCount_depthwiseAfter_concatenateBefore = this.depthwise.outputChannelCount;
    } else {
      this.channelCount_depthwiseAfter_concatenateBefore = this.channelCount_pointwise1After_depthwiseBefore;  // No depthwise operation.
    }

    ++progressToAdvance.value;
    yield progressRoot;  // depthwise filters was ready. Report progress.

    // 4. The pointwise2 convolution.

    // If there are two input tensors, the channel count for pointwise2 will be the concatenated channel count
    // (= depthwise_channel_count + another_input_channel_count ).
    if ( this.inputTensorCount > 1 ) {
      this.channelCount_concatenateAfter_pointwise2Before = this.channelCount_depthwiseAfter_concatenateBefore + this.channelCount2_pointwise1Before;
      this.concatenator = new ConcatAlongAxisId2.Base( false, false );
    } else {
      this.channelCount_concatenateAfter_pointwise2Before = this.channelCount_depthwiseAfter_concatenateBefore;
    }

    // 4.1 Pointwise21
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

    // 4.2 Pointwise22
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

    // 4.3 Pointwise2 (= Pointwise21 + Pointwise22 )
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
      this.pointwise21.setKeepInputTensor( true );
      this.outputTensorCount = 2; // This is the only case which will output two tensors. 
    } else {
      this.outputTensorCount = 1; // All other cases, there will be only one output tensor.
    }

    // 4.4
    ++progressToAdvance.value;
    yield progressRoot;  // pointwise2 filters was ready. Report progress.

    // 5. Configure correct function pointers according to whether keeping or destroying input tensor.
    this.bKeepInputTensor = bKeepInputTensor;


//!!! ...unfinished... (2021/06/09)
// Perhaps, prepare one queue for every input. Push every operation into the queue.
// The first operation in the queue is responsible for keep the input not to be disposed.
// The last operation in the queue is responsible for dispose the input.


    // 5.1
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
    if ( ( this.bAddInputToOutput ) && ( this.depthwise.is_Output_Same_HeightWidth_As_Input() ) ) {
      if ( channelCount1_pointwise1Before == this.channelCount_pointwise21After )
        this.bShould_addInput0ToPointwise21Output = true;

      // Only inputTensors[ 0 ] will be used to add to output. So still check against channelCount1_pointwise1Before
      // (not channelCount2_pointwise1Before).
      if ( channelCount1_pointwise1Before == this.channelCount_pointwise22After )
        this.bShould_addInput0ToPointwise22Output = true;
    }

    this.bShouldAddInputToOutput = this.bShould_addInput0ToPointwise21Output || this.bShould_addInput0ToPointwise22Output;

    // Note: No matter whether pointwise21 or pointwise22 exists, it is possible that only addInput0ToPointwise21Output or
    //       only addInput0ToPointwise22Output or both exist.
    if ( this.bShould_addInput0ToPointwise21Output ) {
      if ( this.bShould_addInput0ToPointwise22Output ) {
        // Both addInput0ToPointwise21Output and addInput0ToPointwise22Output are needed.
        //
        // In this case, the former (addInput0ToPointwise21Output) should keep-input-tensor-0 (i.e. the original input tensor)
        // and keep-input-tensor-1 (i.e. the depthwise output). Otherwise, the addInput0ToPointwise22Output will fail to process it.
        this.addInput0ToPointwise21Output = new AddTwoTensors.Base( true, true );
        this.addInput0ToPointwise22Output = new AddTwoTensors.Base( false, false );
      } else {
        this.addInput0ToPointwise21Output = new AddTwoTensors.Base( false, false );
      }
    } else {
      if ( this.bShould_addInput0ToPointwise22Output ) {
        this.addInput0ToPointwise22Output = new AddTwoTensors.Base( false, false );
      } else {
        // No add-input-to-output is needed.
      }
    }

    // 5.2 Determine which apply_Xxx() function should be used.
    //
    // This should be done before adjusting the first operation from "Xxx_destroy" to "Xxx_keep",
    // because the adjustment might also need to select different apply_Xxx() function.
    this.apply_and_destroy_or_keep = Base.Determine_apply_and_destroy_or_keep.call( this );

    // 5.3 Adjust the destroy-or-keep behavior of the first operation and last operation.
    //
    // If:
    //   - caller request keep-input, or
    //   - caller request add-input-to-output, and some criteria matched.
    // Then:
    //   - change the first operation from "Xxx_destroy" to "Xxx_keep".
    //   - change the total operation if no first operation exists.
    //
    if ( ( bKeepInputTensor ) || ( this.bShouldAddInputToOutput ) ) {

      // 5.3.1 Let the first existed operation of the main input (i.e. inputTensors[ 0 ]) keep-input.

      if ( this.bPointwise1 ) {
        this.pointwise1.setKeepInputTensor( true );    // will NOT dispose inputTensors[ 0 ].

      } else if ( this.bDepthwise ) {
        this.depthwise.setKeepInputTensor( true );     // will NOT dispose inputTensors[ 0 ].

      } else if ( this.concatenator ) {
        // Executed to here means that keep-input but not add-input-to-output (otherwise, there will be no concatenator).
        // That is, there will be a branch input (i.e. inputTensors[ 1 ]). In this case, not only the first operation of the
        // main input (i.e. inputTensors[ 0 ]) but also the first operation of the branch input (i.e. inputTensors[ 1 ]) is
        // the concatenating. So the concatenator is responsible for keeping (i.e. not-disposing) both the inputTensors[ 0 ]
        // and inputTensors[ 1 ].
        this.concatenator.setKeepInputTensor( true, true ); // will NOT dispose inputTensors[ 0 ] and inputTensors[ 1 ].

      } else if ( this.bPointwise21 ) {
        if ( this.bPointwise22 ) {
          // Both pointwise21 and pointwise22 exist, then pointwise21 already keep-input. Now, let pointwise22 keep inputTensors[ 0 ], too.
          this.pointwise22.setKeepInputTensor( true );
        } else {
          this.pointwise21.setKeepInputTensor( true ); // Since only pointwise21 exists, let it keep inputTensors[ 0 ].
        }

      } else if ( this.bPointwise22 ) {
        this.pointwise22.setKeepInputTensor( true );   // Since only pointwise22 exists, let it keep inputTensors[ 0 ].

      } else if ( this.addInput0ToPointwise21Output ) {
        // In this case, only addInput0ToPointwise21Output will exist, and the addInput0ToPointwise22Output will NOT exist.
        //
        // (The only possible case which both addInput0ToPointwise21Output and addInput0ToPointwise22Output exist is that both
        // pointwise21 and pointwise22 exist. And in that case, it never executes to here (it will execute to the above codes).)
        //
        // Since this is the only operation (i.e. no pointwise1, no depthwise, no pointwise21, no pointwise22,
        // no addInput0ToPointwise22Output), it in fact adds inputTensors[ 0 ] to inputTensors[ 0 ] itself. In order to
        // keep-input, it should keep both inputs (they are just the same one inputTensors[ 0 ] in fact) simultaneously.
        // Otherwise, the only inputTensors[ 0 ] will be destroyed.
        this.addInput0ToPointwise21Output.setKeepInputTensor( true, true );

//!!! ...unfinished... (2021/06/08) What if pointwise22 could be add-input-to-output but pointwise21 could not?

      } else {
        // The only case exectued to here is that no-add-input-to-output and no-concatenater. (Otherwise, it will execute to
        // the above codes.)
        //
        // Since there is no operation at all (i.e. no pointwise1, no depthwise, no concat, no pointwise2, no-add-inpu-to-output),
        // just according to whether needs keep-input, change the total operation to return input directly
        // or return clone of input directly.
        //
        // Note: This may be wrong, however, if there are wrongly two input tensors (there should be only one input
        // (i.e. inputTensors[ 0 ]) for should-add-input-to-output).
        if ( bKeepInputTensor ) {
          this.apply_and_destroy_or_keep = Base.keep_input_return_copy_array;
        } else {
          this.apply_and_destroy_or_keep = Base.return_input_directly_array;
        }
      }

      // 5.3.2 If no need to keep-input (but need add-input-to-output), the last add-input-to-output should destroy
      //       inputTensors[ 0 ] after add-input-to-output.
      if ( false == bKeepInputTensor ) {

        if ( this.addInput0ToPointwise21Output ) {
          if ( this.addInput0ToPointwise22Output ) {
            // 5.3.2.1 Both addInput0ToPointwise21Output and addInput0ToPointwise22Output exist.
            //     Let the last add-input-to-output (i.e. addInput0ToPointwise22Output) destroy the inputTensors[ 0 ].
            this.addInput0ToPointwise22Output.setKeepInputTensor0( false );

          } else {
            // 5.3.2.2 Only addInput0ToPointwise21Output exists. Let it destroy the inputTensors[ 0 ].
            this.addInput0ToPointwise21Output.setKeepInputTensor0( false );

          }
        } else {
          if ( this.addInput0ToPointwise22Output ) {
            // 5.3.2.3 Only addInput0ToPointwise22Output exists. Let it destroy the inputTensors[ 0 ].
            this.addInput0ToPointwise22Output.setKeepInputTensor0( false );

          } else {
            // 5.3.2.4 Both addInput0ToPointwise21Output and addInput0ToPointwise22Output do not exist.
            //
            // Executed to here means that no need to keep-input and no need add-input-to-output. This should not happen
            // because here is for should-add-input-to-output (and destroy-input).
            tf.util.assert( ( null != this.addInput0ToPointwise21Output ) || ( null != this.addInput0ToPointwise22Output ),
              "At least, the this.addInput0ToPointwise21Output should exist." );
          }
        }
      }

    }

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
  init( progressParent, channelCount1_pointwise1Before, channelCount2_pointwise1Before, bKeepInputTensor, params ) {

    progressParent = progressParent || ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer( progressParent, channelCount1_pointwise1Before, channelCount2_pointwise1Before, bKeepInputTensor, params );
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

    if ( this.depthwise ) {
      this.depthwise.disposeTensors();
      this.depthwise = null;
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

    if ( this.addInput0ToPointwise21Output ) {
      this.addInputToPointwise21Output = null;
    }

    if ( this.addInput0ToPointwise22Output ) {
      this.addInputToPointwise22Output = null;
    }

    this.intermediateTensorsArray = null;

    this.bShouldAddInputToOutput = this.bShould_addInput0ToPointwise21Output = this.bShould_addInput0ToPointwise22Output = false;

    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /** Determine which apply_Xxx() function should be used.
   * @return {function} Return one of the apply_Xxx function.
   */
  static Determine_apply_and_destroy_or_keep() {

    if ( this.bShouldAddInputToOutput ) { // ( this.inputTensorCount == 0 ) and possible to add-input-to-output.

      // 1. add-input-to-output and (keep-input or destroy-input).

      if ( this.bPointwise21 ) {
        if ( this.bPointwise22 ) {

          // 1.1 Both pointwise21 and pointwise22 exist.
          //
          // Although both pointwise21 and pointwise22 exist, but it may be only pointwise21 or pointwise22 could (or need) add-input-to-output.

          if ( this.bShould_addInput0ToPointwise21Output ) {
            if ( this.bShould_addInput0ToPointwise22Output ) {
              // 1.1.1 Both pointwise21 and pointwise22 exist, and both addInput0ToPointwise21Output and addInput0ToPointwise22Output exist.
              return Base.apply_1_2_and_destroy_or_keep_AddInputToOutput_2;
            } else {
              // 1.1.2 Both pointwise21 and pointwise22 exist, but only addInput0ToPointwise21Output exists.
              return Base.apply_1_2_and_destroy_or_keep_AddInputToOutput_21;
            }
          } else {
            if ( this.bShould_addInput0ToPointwise22Output ) {
              // 1.1.3 Both pointwise21 and pointwise22 exist, but only addInput0ToPointwise22Output exists.
              return Base.apply_1_2_and_destroy_or_keep_AddInputToOutput_22;
            } else {
              // 1.1.4 Both pointwise21 and pointwise22 exist, and both addInput0ToPointwise21Output and addInput0ToPointwise22Output do not exist.

//!!! ...unfinished... (2021/06/09) It should not execute to here.
              
            }
          }

        } else {
          return Base.apply_1_21_and_destroy_or_keep_AddInputToOutput; // 1.2 Only pointwise21 exists (and no pointwise22).
        }
      } else {
        if ( this.bPointwise22 ) {
          return Base.apply_1_22_and_destroy_or_keep_AddInputToOutput; // 1.3 Only pointwise22 exists (and no pointwise21).
        } else {
          return Base.apply_1_21_and_destroy_or_keep_AddInputToOutput; // 1.4 Both pointwise21 and pointwise22 do not exist. (Use pointwise21.)
        }
      }

    } else { // ( this.inputTensorCount >= 1 ) or ( ( this.inputTensorCount == 0 ) but not-possible to add-input-to-output).

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
        // ( this.inputTensorCount == 1 ) or ( ( this.inputTensorCount == 0 ) but not-possible ).

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
            return Base.apply_1_21_and_destroy_or_keep_NoSkipConnection; // 3.4 Both pointwise21 and pointwise22 not existed. (Use pointwise21.)
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
    t1 = this.depthwise.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise21.pfnConvBiasActivation( t1 );
    
    outputTensors[ 0 ] = this.addInput0ToPointwise21Output.pfnAdd( inputTensor, t0 );
    outputTensors[ 1 ] = null;
  }

  /** The only one input will be added to the only one output (pointwise22). The inputTensor may or may not be disposed.*/
  static apply_1_22_and_destroy_or_keep_AddInputToOutput( inputTensors, outputTensors ) {
    let t0, t1;

    let inputTensor = inputTensors[ 0 ];

//!!! ...unfinished... (2021/05/28) What if inputTensors[ 0 ] exists?
//    tf.util.assert( null == inputTensors[ 1 ] );

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensor );
    t1 = this.depthwise.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise22.pfnConvBiasActivation( t1 );

    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = this.addInput0ToPointwise22Output.pfnAdd( inputTensor, t0 );
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
    t1 = this.depthwise.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 0 ] = this.addInput0ToPointwise21Output.pfnAdd( inputTensor, t0 );

    t0 = this.pointwise22.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.addInput0ToPointwise22Output.pfnAdd( inputTensor, t0 );
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
    t1 = this.depthwise.pfnOperationBiasActivation( t0 );

    t0 = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 0 ] = this.addInput0ToPointwise21Output.pfnAdd( inputTensor, t0 );

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
    t1 = this.depthwise.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );

    t0 = this.pointwise22.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.addInput0ToPointwise22Output.pfnAdd( inputTensor, t0 );
  }


  /** The inputTensors[ 1 ] will be concatenated before outputTensors[ 0 ]. */
  static apply_2_21_and_destroy_or_keep_ConcatInput1( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    this.intermediateTensorsArray[ 0 ] = this.depthwise.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = inputTensors[ 1 ];

    t1 = this.concatenator.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = null;
  }

  /** The inputTensors[ 1 ] will be concatenated before outputTensors[ 1 ]. */
  static apply_2_22_and_destroy_or_keep_ConcatInput1( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    this.intermediateTensorsArray[ 0 ] = this.depthwise.pfnOperationBiasActivation( t0 );
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
   *   An array of tensors. If ( this.inputTensorCount == 0 ) or ( this.inputTensorCount == 1 ), the inputTensors[ 0 ] will be used.
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

    this.intermediateTensorsArray[ 0 ] = this.depthwise.pfnOperationBiasActivation( t0 );
    this.intermediateTensorsArray[ 1 ] = inputTensors[ 1 ];

    t1 = this.concatenator.pfnConcat( this.intermediateTensorsArray );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 );
  }


  /** One input to one output (pointwise21) (i.e. no residual connection). The input tensors may or may not be disposed. */
  static apply_1_21_and_destroy_or_keep_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 ); // may destroy t1.
    outputTensors[ 1 ] = null;
  }

  /** One input to one output (pointwise22) (i.e. no residual connection). The input tensors may or may not be disposed. */
  static apply_1_22_and_destroy_or_keep_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = null;
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 ); // may destroy t1.
  }

  /** One input to two output (pointwise21 and pointwise22) (i.e. no residual connection). The input tensors may or may not be disposed. */
  static apply_1_2_and_destroy_or_keep_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );
    t1 = this.depthwise.pfnOperationBiasActivation( t0 );

    outputTensors[ 0 ] = this.pointwise21.pfnConvBiasActivation( t1 );
    outputTensors[ 1 ] = this.pointwise22.pfnConvBiasActivation( t1 ); // may destroy t1.
  }


  /** @return {boolean} Return true if this object initialized (i.e. initer()) successfully. */
  isValid() {
    return this.bInitOk;
  }

  /** @return {number} The channel count of the first input tensor (i.e. inputTensors[ 0 ]). */
  get inChannels1()                            { return this.channelCount1_pointwise1Before; }

  /** @return {number} The channel count of the second input tensor (i.e. inputTensors[ 1 ]). */
  get inChannels2()                            { return this.channelCount2_pointwise1Before; }

  /** @return {number} The channel count of the first output tensor (i.e. outputTensors[ 0 ]). */
  get outChannels1()                          { return this.channelCount_pointwise21After; }

  /** @return {number} The channel count of the second output tensor (i.e. outputTensors[ 1 ]). */
  get outChannels2()                          { return this.channelCount_pointwise22After; }

  /** @return {number} The channel count of both the first and second output tensors. */
  get outChannelsAll()                          { return this.channelCount_pointwise2After; }

  /** @return {string} The description string of all (adjusted) parameters of initer(). */
  get parametersDescription() {
    let str =
        `inChannels1=${this.inChannels1}, inChannels2=${this.inChannels2}, `
      + `outChannels1=${this.outChannels1}, outChannels2=${this.outChannels2}, `

      + `pointwise1ChannelCount=${this.pointwise1ChannelCount}, `
      + `bPointwise1Bias=${this.bPointwise1Bias}, `
      + `pointwise1ActivationName=${this.pointwise1ActivationName}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=${this.depthwise_AvgMax_Or_ChannelMultiplier_Name}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseStridesPad=${this.depthwiseStridesPad}, `
      + `bDepthwiseBias=${this.bDepthwiseBias}, `
      + `depthwiseActivationName=${this.depthwiseActivationName}, `

      + `pointwise21ChannelCount=${this.pointwise21ChannelCount}, `
      + `bPointwise21Bias=${this.bPointwise21Bias}, `
      + `pointwise21ActivationName=${this.pointwise21ActivationName}, `

      + `pointwise22ChannelCount=${this.pointwise22ChannelCount}, `
      + `bPointwise22Bias=${this.bPointwise22Bias}, `
      + `pointwise22ActivationName=${this.pointwise22ActivationName}, `

      + `inputTensorCount=${this.inputTensorCount}, `
      + `bAddInputToOutput=${this.bAddInputToOutput}, `
      + `outputTensorCount=${this.outputTensorCount}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

}
