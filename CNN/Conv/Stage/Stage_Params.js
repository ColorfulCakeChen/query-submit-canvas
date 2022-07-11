export { Params };

import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";


//!!! ...unfinished... (2022/05/28)
// Add parameter nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix.
//
// Add parameter bPointwise2SqueezeExcitationAtStageEnd control whether this stage's final block's pointwise2 should have
// squeeze-and-excitation.
//


/**
 * Convolution stage parameters.
 *
 * @member {number} outputHeight
 *   The height of output image. It is half of the input height (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} outputWidth
 *   The width of output image. It is half of the input width (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 */
class Params extends Weights.Params {

  /**
   * Used as default Stage.Params provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.Params.Pool", Params, Params.setAsConstructor );

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
   * @param {number} sourceHeight
   *   The height of the source image which will be processed by apply(). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @param {number} sourceWidth
   *   The width of the source image which will be processed by apply(). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @param {number} sourceChannelCount
   *   The depth (channel count) of the source image. It may be the output channel count of the previous convolution stage, so
   * it could be large. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   
//!!! ...unfinished... (2022/06/25)
// Perhaps, just like the ( height, width ) halving and channel count doubling by evey stage,
// the block count could be doubled by evey stage.

   * @param {number} blockCountRequested
   *   How many blocks inside this stage are wanted.
   *   - If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *   - It must be ( >= 2 ). Because this stage will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   *       (i.e. to halve height x width) and use ( blockCountRequested - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" )
   *       until the stage end. These can not be achieved by only one block. So there is at least two blocks.
   *
   * @param {boolean} bPointwise1
   *   If false, there will be no pointwise1 (i.e. the 1st pointwise convolution).If null, it will be extracted from inputFloat32Array
   * (i.e. by evolution).
   *
   * @param {number} depthwiseFilterHeight
   *   The height of depthwise convolution's filter. At least 1 (so that 1D data could be processed). If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} depthwiseFilterWidth
   *   The width of depthwise convolution's filter. At least 2 (so that meaningless ( 1 * 1 ) could be avoided). If null, it will
   * be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after every convolution. If null, it will be
   * extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {boolean} bPointwise2ActivatedAtStageEnd
   *   If true, the blockLast's pointwise2 will have activation function. If false, the blockLast's pointwise2 will have no activation
   * function. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   *   - If there will be next stage after this stage, it usually should be true (i.e. has activation function). The reason is that
   *       this stage's blockLast's pointwise2 (if has no activation function) and the next stage's block0's pointwise1 are essentially
   *       just one pointwise convolution. (Multiple affine transformations can always be combined into just one affine transformation.)
   *
   *     - There is one exception: for MobileNetV2_Xxx, its pointwise2 always has no activation function no matter whether
   *         bPointwise2ActivatedAtStageEnd is true or false. The Reason is that it has add-input-to-output to modify pointwise2
   *         output. So, even if its stage output is not affine transformation (even it has no activation function).
   *
   *   - Only when this stage is the last stage of a neural network, it should be false (i.e. has no activation function). There are
   *       two reasons:
   *
   *     - For ShuffleNetV2_ByMobileNetV1, let it undo activation escaping scales.
   *         In ShuffleNetV2_ByMobileNetV1, if an operation has activation function, the pass-through half part will scale its
   *         convolution filters for escaping the activation function's non-linear parts. This results in its output is wrong
   *         (i.e. different from ShuffleNetV2). In order to resolve this issue, the last operation (i.e. pointwise2) should have
   *         no activation (so it will not scale its convolution filters for escaping the activation function's non-linear parts).
   *
   *     - Even if not ShuffleNetV2_ByMobileNetV1 (i.e. for other ConvStageType), it does have practical advantage in fact. The
   *         output could have any value (i.e. the whole number line). If the last operation (i.e. pointwise2) has activation
   *         function, the output value will be restricted by the activation function (e.g. [ -1, +1 ] for tanh()).
   *
   * @param {number} nConvStageType
   *   The convolution stage type (ValueDesc.ConvStageType.Singleton.Ids.Xxx). If null, it will be extracted from inputFloat32Array
   * (i.e. by evolution).
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply() will not dispose inputTensor (i.e. will be kept). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @return {boolean}
   *   Return false, if initialization failed.
   *
   * @override
   */
  constructor( inputFloat32Array, byteOffsetBegin,
    sourceHeight, sourceWidth, sourceChannelCount,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    nActivationId,
    bPointwise2ActivatedAtStageEnd,
    nConvStageType,
    bKeepInputTensor
  ) {

    // Q: Why the depthwiseChannelMultiplierBlock0 is not listed as a parameter?
    // A: After considering the following reasons, it is worth to drop this parameter.
    //
    //   - In reality, it is almost no reason to use only avg/max pooling to compose a stage because it keep too little information
    //     for the next stage.
    //
    //   - If depthwiseChannelMultiplierBlock0 is specified as Params.depthwiseChannelMultiplierBlock0.valueDesc.Ids.NONE (0), the input
    //     image will not be shrinked a little (for ( blockCountRequested <= 1 )) or will not be halven (for ( blockCountRequested >= 2 ).
    //     If it is still a parameter it should be forced to 1 at least (always needs depthwise operation) in this case.
    //

    let parameterMap = new Map( [
      [ Params.sourceHeight,                   sourceHeight ],
      [ Params.sourceWidth,                    sourceWidth ],
      [ Params.sourceChannelCount,             sourceChannelCount ],
      [ Params.blockCountRequested,             blockCountRequested ],
      [ Params.bPointwise1,                    bPointwise1 ],
      [ Params.depthwiseFilterHeight,          depthwiseFilterHeight ],
      [ Params.depthwiseFilterWidth,           depthwiseFilterWidth ],
      [ Params.nActivationId,                  nActivationId ],
      [ Params.bPointwise2ActivatedAtStageEnd, bPointwise2ActivatedAtStageEnd ],
      [ Params.nConvStageType,                 nConvStageType ],
      [ Params.bKeepInputTensor,               bKeepInputTensor ],
    ] );

    super( inputFloat32Array, byteOffsetBegin, parameterMap );
  }
//!!!
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
    super.disposeResources();
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
    Params.set_inferencedParams_by.call( this,
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

//!!!
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

    Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth.call( this, this.sourceHeight, this.sourceWidth );

    return bExtractOk;
  }

  /**
   * Determine the following properties:
   *   - this.outputHeight
   *   - this.outputWidth
   *
   * @param {number} sourceHeight  The height of source image.
   * @param {number} sourceWidth   The width of source image.
   */
  static set_outputHeight_outputWidth_by_sourceHeight_sourceWidth( sourceHeight, sourceWidth ) {

    // By default, the output ( height, width ) is half of the input (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
    //
    // Note: This calculation copied from the getPadAndOutInfo() of
    // (https://github.com/tensorflow/tfjs/blob/tfjs-v3.8.0/tfjs-core/src/ops/conv_util.ts).
    //

    let stridesHeight = 2, stridesWidth = 2;
    this.outputHeight = Math.ceil( sourceHeight / stridesHeight );
    this.outputWidth =  Math.ceil( sourceWidth  / stridesWidth );
  }
  
  get sourceHeight()              { return this.getParamValue_byParamDesc( Params.sourceHeight ); }
  get sourceWidth()               { return this.getParamValue_byParamDesc( Params.sourceWidth ); }
  get sourceChannelCount()        { return this.getParamValue_byParamDesc( Params.sourceChannelCount ); }


  /** @return {number} The number version of nConvStageTypeId. */
  get nConvStageTypeId()          { return this.getParamValue_byParamDesc( Params.nConvStageTypeId ); }

  /** @return {string} The string version of nConvStageTypeId. */
  get nConvStageTypeName()        { return Params.nConvStageTypeId.getStringOfValue( this.nConvStageTypeId ); }

  get blockCountRequested()       { return this.getParamValue_byParamDesc( Params.blockCountRequested ); }
  get bPointwise1()               { return this.getParamValue_byParamDesc( Params.bPointwise1 ); }

  get depthwiseFilterHeight()     { return this.getParamValue_byParamDesc( Params.depthwiseFilterHeight ); }
  get depthwiseFilterWidth()      { return this.getParamValue_byParamDesc( Params.depthwiseFilterWidth ); }

  get bPointwise2ActivatedAtStageEnd() { return this.getParamValue_byParamDesc( Params.bPointwise2ActivatedAtStageEnd ); }

  get nSqueezeExcitationChannelCountDivisor()     { return this.getParamValue_byParamDesc( Params.nSqueezeExcitationChannelCountDivisor ); }
  get nSqueezeExcitationChannelCountDivisorName() {
    return Params.nSqueezeExcitationChannelCountDivisor.getStringOfValue( this.nSqueezeExcitationChannelCountDivisor );
  }

  get bSqueezeExcitationPrefix()  { return this.getParamValue_byParamDesc( Params.bSqueezeExcitationPrefix ); }

  get nActivationId()             { return this.getParamValue_byParamDesc( Params.nActivationId ); }
  get nActivationName()           { return Params.nActivationId.getStringOfValue( this.nActivationId ); }

  get bKeepInputTensor()          { return this.getParamValue_byParamDesc( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.
Params.sourceHeight =                   new ParamDesc.Int(                "sourceHeight",               1, ( 10 * 1024 ) );
Params.sourceWidth =                    new ParamDesc.Int(                "sourceWidth",                1, ( 10 * 1024 ) );
Params.sourceChannelCount =             new ParamDesc.Int(                "sourceChannelCount",         1, ( 10 * 1024 ) );

//!!! ...unfinished... (2022/06/17) should be renamed to nConvStageTypeId and nConvStageTypeName

Params.nConvStageTypeId =                 new ParamDesc.ConvStageType(      "nConvStageTypeId" );

Params.blockCountRequested =            new ParamDesc.Int(                "blockCountRequested",        2, (  1 * 1024 ) );
Params.bPointwise1 =                    new ParamDesc.Bool(               "bPointwise1" );
Params.depthwiseFilterHeight =          new ParamDesc.Int(                "depthwiseFilterHeight",      1, ( 10 * 1024 ) );
Params.depthwiseFilterWidth =           new ParamDesc.Int(                "depthwiseFilterWidth",       2, ( 10 * 1024 ) );
Params.bPointwise2ActivatedAtStageEnd = new ParamDesc.Bool(               "bPointwise2ActivatedAtStageEnd" );

Params.nSqueezeExcitationChannelCountDivisor = new ParamDesc.SqueezeExcitationChannelCountDivisor( "nSqueezeExcitationChannelCountDivisor" );
Params.bSqueezeExcitationPrefix = new ParamDesc.Bool(               "bSqueezeExcitationPrefix" );

Params.nActivationId =                  new ParamDesc.ActivationFunction( "nActivationId" );

Params.bKeepInputTensor =               new ParamDesc.Bool(               "bKeepInputTensor" );



/**
 * Define the order of these parameters. (Fills ParamDesc.Xxx.seqId according to this array's order.)
 */
Params.SequenceArray = new ParamDesc.SequenceArray( [
  Params.sourceHeight,
  Params.sourceWidth,
  Params.sourceChannelCount,
  Params.nConvStageTypeId,
  Params.blockCountRequested,
  Params.bPointwise1,
  Params.depthwiseFilterHeight,
  Params.depthwiseFilterWidth,
  Params.bPointwise2ActivatedAtStageEnd,
  Params.nSqueezeExcitationChannelCountDivisor,
  Params.bSqueezeExcitationPrefix,
  Params.nActivationId,
  Params.bKeepInputTensor,
] );

