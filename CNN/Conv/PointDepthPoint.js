export { Params, Base };

import * as ValueMax from "../ValueMax.js";
//import * as ValueRange from "../Unpacker/ValueRange.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ReturnOrClone from "./ReturnOrClone.js";

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
Params.depthwiseFilterHeight =   new ParamDesc.Int( "depthwiseFilterHeight", 1, 9 );

/** Define suitable value for depthwise convolution strides and pad. Integer between [ 0, 2 ]. */
Params.depthwiseStridesPad =     new ParamDesc.Int( "depthwiseStridesPad",   0, 2 );

Params.bDepthwiseBias =          new ParamDesc.Bool(               "bDepthwiseBias" );
Params.depthwiseActivationId =   new ParamDesc.ActivationFunction( "depthwiseActivationId" );

Params.pointwise21ChannelCount = new ParamDesc.Int(                "pointwise21ChannelCount", 0, ( 10 * 1024 ) );
Params.bPointwise21Bias =        new ParamDesc.Bool(               "bPointwise21Bias" );
Params.pointwise21ActivationId = new ParamDesc.ActivationFunction( "pointwise21ActivationId" );

Params.pointwise22ChannelCount = new ParamDesc.Int(                "pointwise22ChannelCount", 0, ( 10 * 1024 ) );
Params.bPointwise22Bias =        new ParamDesc.Bool(               "bPointwise22Bias" );
Params.pointwise22ActivationId = new ParamDesc.ActivationFunction( "pointwise22ActivationId" );

Params.inputTensorCount =        new ParamDesc.Int(                "inputTensorCount",  0, 2 ) );


/**
 * Handle initialization of pointwise convolution (1x1 conv2d), bias and activation.
 *
 * @member {number} byteOffsetBegin
 *   The position which is started (inclusive) to extract from inputFloat32Array.buffer by init().
 *
 * @member {number} byteOffsetEnd
 *   The position which is ended to (non-inclusive) extract from inputFloat32Array.buffer by init(). Where to extract next weights.
 * Only meaningful when ( this.bInitOk == true ).
 *
 * @member {boolean} bExisted
 *   If true, the pointwise convolution exist.
 */
class Pointwise {

  constructor( inputChannelCount, outputChannelCount, bBias, nActivationId, inputFloat32Array, byteOffsetBegin ) {
    this.inputChannelCount = inputChannelCount;
    this.outputChannelCount = outputChannelCount;
    this.bBias = bBias;
    this.nActivationId = nActivationId;
    this.inputFloat32Array = inputFloat32Array;
    this.byteOffsetBegin = byteOffsetBegin;
  }

  init() {
    this.bExisted = ( this.outputChannelCount > 0 );
    this.pfnActivation = Base.getActivationFunction( this.nActivationId );

    if ( this.bExisted ) {

      //this.filterHeightWidth = [ 1, 1 ];
      this.filtersShape =      [ 1, 1, this.inputChannelCount, this.outputChannelCount ];
      this.biasesShape =       [ 1, 1, this.outputChannelCount ];

      this.filtersWeights = new Weights.Base( this.inputFloat32Array, this.byteOffsetEnd, this.filtersShape );
      if ( !this.filtersWeights.extract() )
        return false;  // e.g. input array does not have enough data.

      this.byteOffsetEnd = this.filtersWeights.defaultByteOffsetEnd;

      this.filtersTensor4d = tf.tensor4d( this.filtersWeights.weights, this.filtersShape );
      this.pfnConv = Pointwise.Conv_and_destroy; // will dispose inputTensor.

      if ( this.bBias ) {
        this.biasesWeights = new Weights.Base( this.inputFloat32Array, this.byteOffsetEnd, this.biasesShape );
        if ( !this.pointwise1BiasesWeights.extract() )
          return false;  // e.g. input array does not have enough data.
        this.byteOffsetEnd = this.biasesWeights.defaultByteOffsetEnd;

        this.biasesTensor3d = tf.tensor3d( this.biasesWeights.weights, this.pointwise1BiasesShape );

        if ( this.pfnActivation )
          this.pfnConvBiasActivation = Pointwise.ConvBiasActivation_and_destroy_or_keep;
        else
          this.pfnConvBiasActivation = Pointwise.ConvBias_and_destroy_or_keep;

      } else {

        if ( this.pfnActivation )
          this.pfnConvBiasActivation = Pointwise.ConvActivation_and_destroy_or_keep;
         else
          this.pfnConvBiasActivation = Pointwise.Conv_and_destroy_or_keep;

      }

    } else {
      this.pfnConv = Base.return_input_directly;
      this.pfnConvBiasActivation = Pointwise.Conv_and_destroy_or_keep;
    }

    this.bInitOk = true;
  }

  disposeTensors() {
    if ( this.filtersTensor4d ) {
      tf.dispose( this.filtersTensor4d );
      this.filtersTensor4d = null;
    }

    if ( this.biasesTensor3d ) {
      tf.dispose( this.biasesTensor3d );
      this.biasesTensor3d = null;
    }

    this.filtersWeights = this.biasesWeights = this.pfnConvBiasActivation = this.pfnConv = this.pfnActivation = null;
    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /** Pointwise Convolution (1x1). (The inputTensor will not be disposed so that it can be used for achieving skip connection.) */
  static Conv_and_keep( inputTensor ) {
    return tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" ); // 1x1, Stride = 1
  }

  static Conv_and_destroy( inputTensor ) {
    let t = tf.conv2d( inputTensor, this.filtersTensor4d, 1, "valid" );
    inputTensor.dispose();
    return t;
  }

  /** Pointwise Convolution, Bias and Activation. */
  static Conv_and_destroy_or_keep( inputTensor ) {
    return this.pfnConv( inputTensor );
  }

  static ConvBias_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    return t1;
  }

  static ConvActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = this.pfnActivation( t0 );
    t0.dispose();

    return t1;
  }

  static ConvBiasActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfnConv( inputTensor );

    let t1 = tf.add( t0, this.biasesTensor3d );
    t0.dispose();

    t0 = this.pfnActivation( t1 );
    t1.dispose();

    return t0;
  }

}


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
 *   If true, the pointwise1 convolution exist.
 *
 * @member {string} pointwise1ActivationName
 *   The activation function id (Params.pointwise1ActivationId.valueDesc.Ids.Xxx) after the first pointwise convolution.
 *
 * @member {boolean} bDepthwise
 *   If true, the depthwise convolution (or average pooling, or maximum pooling) exist.
 *
 * @member {boolean} bDepthwiseAvg
 *   If true, the depthwise average pooling exist.
 *
 * @member {boolean} bDepthwiseMax
 *   If true, the depthwise maximum pooling exist.
 *
 * @member {boolean} bDepthwiseConv
 *   If true, the depthwise convolution exist.
 *
 * @member {string} depthwise_AvgMax_Or_ChannelMultiplier_Name
 *   Depthwise operation name.
 *
 * @member {string} depthwiseActivationName
 *   The activation function name (Params.depthwiseActivationId.valueDesc.Ids.Xxx) after depthwise convolution.
 *
 * @member {boolean} bPointwise2
 *   If true, the pointwise2 convolution exist.
 *
 * @member {boolean} bPointwise21
 *   If true, the first pointwise2 convolution exist.
 *
 * @member {boolean} bPointwise22
 *   If true, the second pointwise2 convolution exist.
 *
 * @member {string} pointwise21ActivationName
 *   The activation function id (Params.pointwise21ActivationId.valueDesc.Ids.Xxx) after the first pointwise2 convolution.
 *
 * @member {string} pointwise22ActivationName
 *   The activation function id (Params.pointwise22ActivationId.valueDesc.Ids.Xxx) after the second pointwise2 convolution.
 *
 * @member {number} inChannels
 *   Input channel count. This is the same as this.channelCount_pointwise1Before (from initer()).
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
 * That is ( channelCount_depthwiseAfter_concatenateBefore + channelCount_pointwise1Before ).
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

//!!! ...unfinished... (2021/04/18) should always  two?

 * @member {number} outputTensorCount
 *   How many output tensors will be returned by the parameter outputTensors of apply_and_destroy_or_keep().
 *
 * @member {function} apply_and_destroy_or_keep
 *   This is a method. It has two parameters inputTensors and outputTensors. The inputTensors (tf.tensor3d[]) represents the images
 * ( height x width x channel ) which will be processed. The outputTensors (tf.tensor3d[]) will be placed one or two tf.tensor3d as the result.
 * All intermediate tensors will be disposed. The inputTensors may or may not be disposed. In fact, this method calls one of
 * apply_and_destroy_AddInputToOutput(), apply_and_keep_AddInputToOutput(), apply_and_destroy_or_keep_NoSkipConnection(),
 * return_input_directly(), keep_input_return_copy() according to the initer()'s parameters.
 */
class Base extends ReturnOrClone.Base {

  /**
   * Generator for initializing this object.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
   *
   * @param {number} channelCount_pointwise1Before
   *   The channel count of apply_and_destroy_or_keep()'s input image. This should always be specified and can not be null
   * (i.e. it will never be extracted from inputFloat32Array and never by evolution).
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
  * initer( progressParent, channelCount_pointwise1Before, bKeepInputTensor, params ) {

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

    this.channelCount_pointwise1Before = channelCount_pointwise1Before;

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

//!!! ...unfinished... (2021/04/18)
    this.outputTensorCount = params.outputTensorCount;

    this.bAddInputToOutput = ( 0 == this.inputTensorCount );

    ++progressToAdvance.value;
    yield progressRoot;  // Parameters extracted. Report progress.

    // 2. The first 1x1 pointwise convolution.
    this.pointwise1 = new Pointwise(
      this.channelCount_pointwise1Before,
      this.pointwise1ChannelCount, this.bPointwise1Bias, this.pointwise1ActivationId,
      params.defaultInput, this.byteOffsetEnd );

    if ( !this.pointwise1.bInitOk )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.pointwise1.byteOffsetEnd;

    this.bPointwise1 = this.pointwise1.bExisted;
    if ( this.bPointwise1 ) {
      this.channelCount_pointwise1After_depthwiseBefore = this.pointwise1ChannelCount;
    } else {
      this.channelCount_pointwise1After_depthwiseBefore = channelCount_pointwise1Before;  // No pointwise1 convolution.
    }

    ++progressToAdvance.value;
    yield progressRoot;  // pointwise1 filters was ready. Report progress.

    // 3. The depthwise operation.

    this.bDepthwise = this.bDepthwiseAvg = this.bDepthwiseMax = this.bDepthwiseConv = false;               // Assume no depthwise.
    this.channelCount_depthwiseAfter_concatenateBefore = this.channelCount_pointwise1After_depthwiseBefore; // So no channel multiplier.

    this.depthwiseFilterWidth = this.depthwiseFilterHeight;  // Assume depthwise filter's width equals its height.

    if ( this.depthwise_AvgMax_Or_ChannelMultiplier < 0 ) { // Depthwise by AVG or MAX pooling (so no channel multiplier).

      // if 1x1 AVG pooling, or 1x1 MAX pooling, or illegal pooling type (i.e. not AVG, not MAX):
      //   - As no depthwise operation (i.e. ( this.bDepthwise == true ) )
      //   - Just return input (i.e. ( this.pfn_depthwiseOperation == Base.return_input_directly ) )

      if ( ( 1 == this.depthwiseFilterHeight ) && ( 1 == this.depthwiseFilterWidth ) ) {
        // Do nothing, because the result of 1x1 AVG or MAX pooling is just the same as input.
      } else {
        switch ( this.depthwise_AvgMax_Or_ChannelMultiplier ) {
          case Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG:
            this.bDepthwise = this.bDepthwiseAvg = true;
            this.pfn_depthwiseOperation = Base.depthwiseAvg_and_destroy;
            break;

          case Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX:
            this.bDepthwise = this.bDepthwiseMax = true;
            this.pfn_depthwiseOperation = Base.depthwiseMax_and_destroy;
            break;
        }
      }

    } else {
      if ( this.depthwise_AvgMax_Or_ChannelMultiplier >= 1 ) { // Depthwise by convolution (with channel multiplier).
        this.bDepthwise = this.bDepthwiseConv = true;

        this.channelCount_depthwiseAfter_concatenateBefore
          = this.channelCount_pointwise1After_depthwiseBefore * this.depthwise_AvgMax_Or_ChannelMultiplier;

        this.depthwiseFiltersShape
          = [ this.depthwiseFilterHeight, this.depthwiseFilterWidth,
              this.channelCount_pointwise1After_depthwiseBefore, this.depthwise_AvgMax_Or_ChannelMultiplier ];

        this.depthwiseFiltersWeights = new Weights.Base( params.defaultInput, this.byteOffsetEnd, this.depthwiseFiltersShape );
        if ( !this.depthwiseFiltersWeights.extract() )
          return false;  // e.g. input array does not have enough data.

        this.byteOffsetEnd = this.depthwiseFiltersWeights.defaultByteOffsetEnd;

        this.depthwiseFiltersTensor4d = tf.tensor4d( this.depthwiseFiltersWeights.weights, this.depthwiseFiltersShape );
        this.pfn_depthwiseOperation = Base.depthwiseConv_and_destroy; // will dispose inputTensor.

      } else { // No depthwise (e.g. zero or negative number) (so no channel multiplier).
      }
    }

    switch ( this.depthwiseStridesPad ) {
      case 0:  this.depthwiseStrides = 1; this.depthwisePad = "valid"; break;
      default:
      case 1:  this.depthwiseStrides = 1; this.depthwisePad = "same";  break;
      case 2:  this.depthwiseStrides = 2; this.depthwisePad = "same";  break;
    }

    this.depthwiseActivationFunction = Base.getActivationFunction( this.depthwiseActivationId );

    this.depthwiseFilterHeightWidth = [ this.depthwiseFilterHeight, this.depthwiseFilterWidth ];
    this.depthwiseBiasesShape =       [ 1, 1, this.channelCount_depthwiseAfter_concatenateBefore ];

    if ( this.bDepthwise ) {

      if ( this.bDepthwiseBias ) {
        this.depthwiseBiasesWeights = new Weights.Base( params.defaultInput, this.byteOffsetEnd, this.depthwiseBiasesShape );
        if ( !this.depthwiseBiasesWeights.extract() )
          return false;  // e.g. input array does not have enough data.

        this.byteOffsetEnd = this.depthwiseBiasesWeights.defaultByteOffsetEnd;

        this.depthwiseBiasesTensor3d = tf.tensor3d( this.depthwiseBiasesWeights.weights, this.depthwiseBiasesShape );

        if ( this.depthwiseActivationFunction )
          this.pfn_depthwiseOperationBiasActivation = Base.depthwiseOperationBiasActivation_and_destroy_or_keep;
        else
          this.pfn_depthwiseOperationBiasActivation = Base.depthwiseOperationBias_and_destroy_or_keep;

      } else {

        if ( this.depthwiseActivationFunction )
          this.pfn_depthwiseOperationBiasActivation = Base.depthwiseOperationActivation_and_destroy_or_keep;
         else
          this.pfn_depthwiseOperationBiasActivation = Base.depthwiseOperation_and_destroy_or_keep;

      }

    }

    ++progressToAdvance.value;
    yield progressRoot;  // depthwise filters was ready. Report progress.

//!!!
    // 4. The pointwise2 convolution.

//!!! ...unfinished... (2021/04/18) This should be the concatenated channel count (if two input tensors).
    // Assume all input tensor have the same channel count.
    if ( this.inputTensorCount > 1 )
      this.channelCount_concatenateAfter_pointwise2Before = this.channelCount_depthwiseAfter_concatenateBefore + this.channelCount_pointwise1Before;
    else
      this.channelCount_concatenateAfter_pointwise2Before = this.channelCount_depthwiseAfter_concatenateBefore;
    

    // 4.1 Pointwise21
    this.pointwise21 = new Pointwise(
      this.channelCount_concatenateAfter_pointwise2Before,
      this.pointwise21ChannelCount, this.bPointwise21Bias, this.pointwise21ActivationId,
      params.defaultInput, this.byteOffsetEnd );

    if ( !this.pointwise21.bInitOk )
      return false;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = this.pointwise21.byteOffsetEnd;

    this.bPointwise21 = this.pointwise21.bExisted;
    if ( this.bPointwise21 ) {
      this.channelCount_pointwise21After = this.pointwise21ChannelCount;
    } else {
      this.channelCount_pointwise21After = 0;  // No first pointwise2 convolution.
    }

    // 4.2 Pointwise22
    this.pointwise22 = new Pointwise(
      this.channelCount_concatenateAfter_pointwise2Before,
      this.pointwise22ChannelCount, this.bPointwise22Bias, this.pointwise22ActivationId,
      params.defaultInput, this.byteOffsetEnd );

    if ( !this.pointwise22.bInitOk )
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
      // depthwise operation together with the second input channel count (if existed).
      this.channelCount_pointwise2After = this.channelCount_concatenateAfter_pointwise2Before;
    }


//!!! (2021/04/18 Remarked) Using class Pointwise instead.
//     this.bPointwise2 = ( this.pointwise2ChannelCount > 0 );
//     this.pointwise2ActivationFunction = Base.getActivationFunction( this.pointwise2ActivationId );
//
//     if ( this.bPointwise2 ) {
//       this.channelCount_pointwise2After = this.pointwise2ChannelCount;
//
//       //this.pointwise2FilterHeightWidth = [ 1, 1 ];
//       this.pointwise2FiltersShape =      [ 1, 1, this.channelCount_depthwiseAfter_pointwise2Before, this.channelCount_pointwise2After ];
//       this.pointwise2BiasesShape =       [ 1, 1, this.channelCount_pointwise2After ];
//
//       this.pointwise2FiltersWeightsArray = new Array( this.outputTensorCount );
//       this.pointwise2FiltersTensor4dArray = new Array( this.outputTensorCount );
//
//       this.pointwise2BiasesWeightsArray = new Array( this.outputTensorCount );
//       this.pointwise2BiasesTensor3dArray = new Array( this.outputTensorCount );
//
//       for ( let i = 0; i < this.outputTensorCount; ++i ) {
//
//         let pointwise2FiltersWeights = this.pointwise2FiltersWeightsArray[ i ]
//               = new Weights.Base( params.defaultInput, this.byteOffsetEnd, this.pointwise2FiltersShape );
//
//         if ( !pointwise2FiltersWeights.extract() )
//           return false;  // e.g. input array does not have enough data.
//
//         this.byteOffsetEnd = pointwise2FiltersWeights.defaultByteOffsetEnd;
//  
//         let pointwise2FiltersTensor4d = this.pointwise2FiltersTensor4dArray[ i ]
//               = tf.tensor4d( pointwise2FiltersWeights.weights, this.pointwise2FiltersShape );
//
// //!!! ...unfinished... (2021/04/17) What if two output tensors?
//         this.pfn_pointwise2Conv = Base.pointwise2Conv_and_destroy; // will dispose inputTensor.
//
//         if ( this.bPointwise2Bias ) {
//           let pointwise2BiasesWeights = this.pointwise2BiasesWeightsArray[ i ]
//                 = new Weights.Base( params.defaultInput, this.byteOffsetEnd, this.pointwise2BiasesShape );
//
//           if ( !pointwise2BiasesWeights.extract() )
//             return false;  // e.g. input array does not have enough data.
//
//           this.byteOffsetEnd = pointwise2BiasesWeights.defaultByteOffsetEnd;
//
//           let pointwise2BiasesTensor3d = this.pointwise2BiasesTensor3dArray[ i ]
//                 = tf.tensor3d( pointwise2BiasesWeights.weights, this.pointwise2BiasesShape );
//
// //!!! ...unfinished... (2021/04/17) What if two output tensors?
//           this.pfn_pointwise2Bias = Base.pointwise2Bias_and_destroy;
//         }
//
// //!!! ...unfinished... (2021/04/17) What if two output tensors?
//         if ( this.pointwise2ActivationFunction )
//           this.pfn_pointwise2Activation = Base.pointwise2Activation_and_destroy;
//       }
//
//     } else {
//       this.channelCount_pointwise2After = this.channelCount_depthwiseAfter_pointwise2Before;
//     }

    ++progressToAdvance.value;
    yield progressRoot;  // pointwise2 filters was ready. Report progress.

    // 5. Configure correct function pointers according to whether keeping or destroying input tensor.
    this.bKeepInputTensor = bKeepInputTensor;

    // Although caller could request add-input-to-output, it may or may not doable.
    // Only if the dimension of output is the same as the dimension of input, it is possible to add-input-to-output.
    //
    // Only if stride is "1" and pad is "same", the dimension 0 (height) and 1 (width) of the output will be the same as input.
    // Only if output channel is equals to input channel, the dimension 2 (channel) of the output will be the same as input.
    //
    // For example:
    //   - if MobileNetV2 and not step 0, should not destroy input tensor so that can add input to output.
    //   - However, even if MobileNetV2, only if not setp 0 (whose strides == 2) of a block can add input to output.
    let bShouldAddInputToOutput = this.bShouldAddInputToOutput
     = (   ( this.bAddInputToOutput )
        && (   ( this.depthwiseStrides == 1 )
            && ( this.depthwisePad == "same" )
            && ( channelCount_pointwise1Before == this.channelCount_pointwise2After )
           )
       );

    // Determine which apply_Xxx() function should be used.
    //
    // This should be done before adjusting the first operation from "Xxx_destroy" to "Xxx_keep",
    // because the adjustment might also need to select different apply_Xxx() function.
    if ( bShouldAddInputToOutput ) {

      if ( bKeepInputTensor )
        this.apply_and_destroy_or_keep = Base.apply_and_keep_AddInputToOutput;    // will NOT dispose inputTensor.
      else
        this.apply_and_destroy_or_keep = Base.apply_and_destroy_AddInputToOutput; // will dispose inputTensor.

    } else {
      this.apply_and_destroy_or_keep = Base.apply_and_destroy_or_keep_NoSkipConnection; // will or will NOT dispose inputTensor.
    }

    // If:
    //   - caller request keep-input, or
    //   - caller request add-input-to-output, and some criteria matched.
    // Then:
    //   - change the first operation from "Xxx_destroy" to "Xxx_keep".
    //   - change the total operation if no first operation exists.
    //
    if ( ( bKeepInputTensor ) || ( bShouldAddInputToOutput ) ) {

//!!! ...unfinished... (2021/04/17)
//!!! Should move this.operationArray[ 1 ] (i.e. destroyInputSingle() or destroyInputArray()) to position before Base.addInputToOutput.
//       this.operationArray[ 1 ];
//       this.operationArray.slpice(  );

      // Find out the first existed operation. Change it to "Xxx_keep" version. So that the
      // apply_and_destroy_or_keep()'s input tensor will not be destroy and can be added to output.
      if ( this.bPointwise1 ) {
//!!! (2021/04/18 Remarked) Using class Pointwise instead.
//        this.pfn_pointwise1Conv = Base.pointwise1Conv_and_keep; // will NOT dispose inputTensor.
        this.pfnConv = Pointwise.Conv_and_keep; // will NOT dispose inputTensor.

      } else if ( this.bDepthwise ) {
        switch ( this.pfn_depthwiseOperation ) {

          // Just clone input if 1x1 AVG/MAX pooling or illegal pooling type (i.e. not AVG, not MAX).
          case Base.return_input_directly:     this.pfn_depthwiseOperation = Base.keep_input_return_copy; break;

          case Base.depthwiseAvg_and_destroy:  this.pfn_depthwiseOperation = Base.depthwiseAvg_and_keep;  break;
          case Base.depthwiseMax_and_destroy:  this.pfn_depthwiseOperation = Base.depthwiseMax_and_keep;  break;
          case Base.depthwiseConv_and_destroy: this.pfn_depthwiseOperation = Base.depthwiseConv_and_keep; break;

          // Just clone input if unknown depthwise operation.
          default:                             this.pfn_depthwiseOperation = Base.keep_input_return_copy;
            tf.util.assert( false, `Unknown depthwise operation. (${this.pfn_depthwiseOperation})` );
            break;
        }

      } else if ( this.bPointwise2 ) {
//!!! ...unfinished... (2021/04/18) What if two output tensors? Pointwise21 or Pointwise22 is responsible for it?
        this.pfn_pointwise2Conv = Base.pointwise2Conv_and_keep; // will NOT dispose inputTensor.

      } else {

        // Since there is no operation at all (i.e. no pointwise1, no depthwise, no pointwise2), let's forget
        // add-input-to-output (because it is not meaningful in this case). Just according to whether needs
        // keep-input, change the total operation to return input directly or return clone of input directly.
        if ( bKeepInputTensor ) {
          this.apply_and_destroy_or_keep = Base.keep_input_return_copy;
        } else {
          this.apply_and_destroy_or_keep = Base.return_input_directly;
        }

      }

    } else {
      // Since it is not required to keep-input and not possible to add-input-to-output, it is not necessary to
      // use "Xxx_keep" operation. Using "Xxx_destroy" operation is sufficient.
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
  init( progressParent, channelCount_pointwise1Before, bKeepInputTensor, params ) {

    progressParent = progressParent || ( new ValueMax.Percentage.Aggregate() );

    let initer = this.initer( progressParent, channelCount_pointwise1Before, bKeepInputTensor, params );
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

    if ( this.depthwiseFiltersTensor4d ) {
      tf.dispose( this.depthwiseFiltersTensor4d );
      this.depthwiseFiltersTensor4d = null;
    }

    if ( this.depthwiseBiasesTensor3d ) {
      tf.dispose( this.depthwiseBiasesTensor3d );
      this.depthwiseBiasesTensor3d = null;
    }

    if ( this.pointwise21 ) {
      this.pointwise21.disposeTensors();
      this.pointwise21 = null;
    }

    if ( this.pointwise22 ) {
      this.pointwise22.disposeTensors();
      this.pointwise22 = null;
    }

//!!! (2021/04/18 Remarked) Using class Pointwise instead.
//     if ( this.pointwise2FiltersTensor4dArray ) {
//       tf.dispose( this.pointwise2FiltersTensor4dArray );
//       this.pointwise2FiltersTensor4dArray = null;
//     }
//
//     if ( this.pointwise2BiasesTensor3dArray ) {
//       tf.dispose( this.pointwise2BiasesTensor3dArray );
//       this.pointwise2BiasesTensor3dArray = null;
//     }

//!!! ...unfinished... (2021/04/17) Using this.operationInput[], this.operationArray[], this.operationParams[], this.operationReturns[] for skipping non-existed operation.
//     this.operationInput = null;
//     this.operationArray = [];
//     this.operationParams = [];  // Every operation takes input parameters from this array.
//     this.operationReturns = []; // Every operation puts returned values into this array.
//
//     this.pfn_head = this.pfn_lastPrev =
//     this.pfn_pointwise1ConvPrev =     this.pfn_pointwise1BiasPrev = this.pfn_pointwise1ActivationPrev =
//     this.pfn_depthwiseOperationPrev = this.pfn_depthwiseBiasPrev =  this.pfn_depthwiseActivationPrev =
//     this.pfn_pointwise2ConvPrev =     this.pfn_pointwise2BiasPrev = this.pfn_pointwise2ActivationPrev =
//     this.pfn_addInputToOutputPrev =   this.pfn_destroyInputPrev =   this.pfn_outputPrev = Base.return_input_directly;


//!!! ...unfinished... (2021/04/18)
    this.pfn_depthwiseOperation = this.pfn_depthwiseOperationBiasActivation =
//!!! (2021/04/18 Remarked) Using class Pointwise instead.
//    this.pfn_pointwise2Conv =     this.pfn_pointwise2Bias =           this.pfn_pointwise2Activation =
      Base.return_input_directly;

    this.depthwiseFiltersWeights = this.depthwiseBiasesWeights =
//!!! (2021/04/18 Remarked) Using class Pointwise instead.
//    this.pointwise2FiltersWeightsArray = this.pointwise2BiasesWeightsArray =
      null;

    this.byteOffsetBegin = this.byteOffsetEnd = -1;
    this.bInitOk = false;
  }

  /** Convert activation function id to function object. */
  static getActivationFunction( nActivationId ) {
    let pfn = ValueDesc.ActivationFunction.Singleton.integerToObjectMap.get( nActivationId );
    return pfn;
  }


//!!! ...unfinished... (2021/04/17) Using this.operationArray, this.operationParams, this.operationReturns for skipping non-existed operation.
//   static destroyInputSingle() {
//     this.operationInput.dispose();
//   }
//
//   static destroyInputArray() {
//     this.operationInput[ 0 ].dispose();
//     this.operationInput[ 1 ].dispose();
//   }
//
// //!!! ...unfinished... (2021/04/17) Using this.operationArray, this.operationParams, this.operationReturns for skipping non-existed operation.
//   static pointwise1Conv() {
//     this.operationReturns[ 0 ] = tf.conv2d( this.operationParams[ 0 ], this.pointwise1FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
// //!!! What about this.operationReturns[ 1 ] ?
//   }


//!!! (2021/04/18 Remarked) Using class Pointwise instead.
//   /** Pointwise1 Convolution (1x1). (The inputTensor will not be disposed so that it can be used for achieving skip connection.) */
//   static pointwise1Conv_and_keep( inputTensor ) {
//     return tf.conv2d( inputTensor, this.pointwise1FiltersTensor4d, 1, "valid" ); // 1x1, Stride = 1
//   }
//
//   static pointwise1Conv_and_destroy( inputTensor ) {
//     let t = tf.conv2d( inputTensor, this.pointwise1FiltersTensor4d, 1, "valid" );
//     inputTensor.dispose();
//     return t;
//   }
//
//   /** Pointwise1 Convolution Bias Activation. */
//   static pointwise1Conv_and_destroy_or_keep( inputTensor ) {
//     return this.pfn_pointwise1Conv( inputTensor );
//   }
//
//   static pointwise1ConvBias_and_destroy_or_keep( inputTensor ) {
//     let t0 = this.pfn_pointwise1Conv( inputTensor );
//
//     let t1 = tf.add( t0, this.pointwise1BiasesTensor3d );
//     t0.dispose();
//
//     return t1;
//   }
//
//   static pointwise1ConvActivation_and_destroy_or_keep( inputTensor ) {
//     let t0 = this.pfn_pointwise1Conv( inputTensor );
//
//     let t1 = this.pointwise1ActivationFunction( t0 );
//     t0.dispose();
//
//     return t1;
//   }
//
//   static pointwise1ConvBiasActivation_and_destroy_or_keep( inputTensor ) {
//     let t0 = this.pfn_pointwise1Conv( inputTensor );
//
//     let t1 = tf.add( t0, this.pointwise1BiasesTensor3d );
//     t0.dispose();
//
//     t0 = this.pointwise1ActivationFunction( t1 );
//     t1.dispose();
//
//     return t0;
//   }


  /** Depthwise Average Pooling. */
  static depthwiseAvg_and_keep( inputTensor ) {
    return tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "avg", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
  }

  static depthwiseAvg_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "avg", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Max Pooling. */
  static depthwiseMax_and_keep( inputTensor ) {
    return tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "max", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
  }

  static depthwiseMax_and_destroy( inputTensor ) {
    let t = tf.pool( inputTensor, this.depthwiseFilterHeightWidth, "max", this.depthwisePad, 1, this.depthwiseStrides ); // dilations = 1
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Convolution. */
  static depthwiseConv_and_keep( inputTensor ) {
    return tf.depthwiseConv2d( inputTensor, this.depthwiseFiltersTensor4d, this.depthwiseStrides, this.depthwisePad );
  }

  static depthwiseConv_and_destroy( inputTensor ) {
    let t = tf.depthwiseConv2d( inputTensor, this.depthwiseFiltersTensor4d, this.depthwiseStrides, this.depthwisePad );
    inputTensor.dispose();
    return t;
  }

  /** Depthwise Operation Bias Activation. */
  static depthwiseOperation_and_destroy_or_keep( inputTensor ) {
    return this.pfn_depthwiseOperation( inputTensor ); // may destroy or keep.
  }

  static depthwiseOperationBias_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfn_depthwiseOperation( inputTensor ); // may destroy or keep.

    let t1 = tf.add( t0, this.depthwiseBiasesTensor3d );
    t0.dispose();

    return t1;
  }

  static depthwiseOperationActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfn_depthwiseOperation( inputTensor ); // may destroy or keep.

    let t1 = this.depthwiseActivationFunction( t0 );
    t0.dispose();

    return t1;
  }

  static depthwiseOperationBiasActivation_and_destroy_or_keep( inputTensor ) {
    let t0 = this.pfn_depthwiseOperation( inputTensor ); // may destroy or keep.

    let t1 = tf.add( t0, this.depthwiseBiasesTensor3d );
    t0.dispose();

    t0 = this.depthwiseActivationFunction( t1 );
    t1.dispose();

    return t0;
  }

//!!! (2021/04/18 Remarked) Using class Pointwise instead.
//   /** Pointwise2 convolution (1x1). (The inputTensor will not be disposed so that it can be used for achieving skip connection.) */
//   static pointwise2Conv_and_keep( inputTensor ) {
//     return tf.conv2d( inputTensor, this.pointwise2FiltersTensor4d, 1, "valid" );
//   }
//
//   static pointwise2Conv_and_destroy( inputTensor ) {
//     let t = tf.conv2d( inputTensor, this.pointwise2FiltersTensor4d, 1, "valid" );
//     inputTensor.dispose();
//     return t;
//   }
//
// //!!! (2021/04/18 Remarked) Old Codes.
//   static pointwise2Bias_and_destroy( inputTensor ) {
//     let t = tf.add( inputTensor, this.pointwise2BiasesTensor3d );
//     inputTensor.dispose();
//     return t;
//   }
//
//   static pointwise2Activation_and_destroy( inputTensor ) {
//     let t = this.pointwise2ActivationFunction( inputTensor );
//     inputTensor.dispose();
//     return t;
//   }
//
//
// //!!! ...unfinished... (2021/04/18) What if two output tensors?
//
//   /** Pointwise2 Convolution Bias Activation. */
//   static pointwise2Conv_and_destroy_or_keep( inputTensor ) {
//     return this.pfn_pointwise2Conv( inputTensor );
//   }
//
//   static pointwise2ConvBias_and_destroy_or_keep( inputTensor ) {
//     let t0 = this.pfn_pointwise2Conv( inputTensor );
//
//     let t1 = tf.add( t0, this.pointwise2BiasesTensor3d );
//     t0.dispose();
//
//     return t1;
//   }
//
//   static pointwise2ConvActivation_and_destroy_or_keep( inputTensor ) {
//     let t0 = this.pfn_pointwise1Conv( inputTensor );
//
//     let t1 = this.pointwise2ActivationFunction( t0 );
//     t0.dispose();
//
//     return t1;
//   }
//
//   static pointwise1ConvBiasActivation_and_destroy_or_keep( inputTensor ) {
//     let t0 = this.pfn_pointwise2Conv( inputTensor );
//
//     let t1 = tf.add( t0, this.pointwise2BiasesTensor3d );
//     t0.dispose();
//
//     t0 = this.pointwise2ActivationFunction( t1 );
//     t1.dispose();
//
//     return t0;
//   }



//!!! ...unfinished... (2021/04/17) Using this.operationInput[], this.operationArray[], this.operationParams[], this.operationReturns[] for skipping non-existed operation.
//  this.operationInput = ???;


  /** The input will be added to output for achieving skip connection. The inputTensor will be kept (not disposed).*/
  static apply_and_keep_AddInputToOutput( inputTensors, outputTensors ) {
    let t0, t1;

    // The pointwise1 convolution.
    //
    // inputTensor should NOT be disposed here. It should be disposed later (after residual connection).
    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    // The depthwise convolution (or average pooling, or max pooling).
    t1 = this.pfn_depthwiseOperationBiasActivation( t0 );

//!!! ...unfinished... (2021/04/17) What if two output tensors?
    // The pointwise21 convolution.
    t0 = this.pointwise21.pfnConvBiasActivation( t1 );
//!!! (2021/04/18 Remarked) Using class Pointwise instead.
//     // The second 1x1 pointwise convolution.
//     t0 = this.pfn_pointwise2Conv( t1 );
//     t1 = this.pfn_pointwise2Bias( t0 );
//     t0 = this.pfn_pointwise2Activation( t1 );

    // Skip connection.
//!!! ...unfinished... (2021/04/18) What if two input tensors?
    t1 = tf.add( inputTensor, t0 );
    t0.dispose();

    // The inputTensor is kept (not disposed).

    return t1;
  }

  /** The input will be added to output for achieving skip connection. The inputTensor will be disposed. */
  static apply_and_destroy_AddInputToOutput( inputTensors, outputTensors ) {
    let t = Base.apply_and_keep_AddInputToOutput.call( this, inputTensor );
    inputTensor.dispose();
    return t;
  }

  /**
   * The input will not be added to output (i.e. no residual connection).
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
  static apply_and_destroy_or_keep_NoSkipConnection( inputTensors, outputTensors ) {
    let t0, t1;

    // The pointwise1 convolution.
    t0 = this.pointwise1.pfnConvBiasActivation( inputTensors[ 0 ] );

    // The depthwise convolution (or average pooling, or max pooling).
    t1 = this.pfn_depthwiseOperationBiasActivation( t0 );

//!!! ...unfinished... (2021/04/17) What if two output tensors?
    // The pointwise21 convolution.
    t0 = this.pointwise21.pfnConvBiasActivation( t1 );
//!!! (2021/04/18 Remarked) Using class Pointwise instead.
//     t0 = this.pfn_pointwise2Conv( t1 );
//     t1 = this.pfn_pointwise2Bias( t0 );
//     t0 = this.pfn_pointwise2Activation( t1 );

    return t0;
  }

  /** @return {boolean} Return true if this object initialized (i.e. initer()) successfully. */
  isValid() {
    return this.bInitOk;
  }

  get inChannels()                            { return this.channelCount_pointwise1Before; }
  
  /** @return {number} The channel count of the first output tensor.*/
  get outChannels1()                          { return this.channelCount_pointwise21After; }

  /** @return {number} The channel count of the second output tensor.*/
  get outChannels2()                          { return this.channelCount_pointwise22After; }

  /** @return {string} The description string of all (adjusted) parameters of initer(). */
  get parametersDescription() {
    let str =
        `pointwise1ChannelCount=${this.pointwise1ChannelCount}, `
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

//!!! ...unfinished... (2021/04/18) What about pointwiese21 and pointwiese22?
      + `outputTensorCount=${this.outputTensorCount}, `

      + `bAddInputToOutput=${this.bAddInputToOutput}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}`
    ;
    return str;
  }

}
