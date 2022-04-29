export { Params };

//import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
//import * as PointDepthPoint from "./PointDepthPoint.js";
//import * as ChannelShuffler from "./ChannelShuffler.js";

/**
 * Convolution block parameters.
 *
 * @member {number} outputHeight
 *   The height of output image. It is half of the input height (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
 *
 * @member {number} outputWidth
 *   The width of output image. It is half of the input width (i.e. result of depthwise convolution with ( strides = 2, pad = "same" ) ).
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
   * @param {number} sourceHeight
   *   The height of the source image which will be processed by apply_and_destroy_or_keep(). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @param {number} sourceWidth
   *   The width of the source image which will be processed by apply_and_destroy_or_keep(). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @param {number} sourceChannelCount
   *   The depth (channel count) of the source image. It may be the output channel count of the previous convolution block, so
   * it could be large. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} stepCountRequested
   *   How many steps inside this block are wanted.
   *   - If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   *   - If one (== 1), the step count will be automatically calculated so that the block's output has half of source's
   *     ( height, width ) and double channel count (depth).
   *       - Every step will use depthwise convolution ( strides = 1, pad = "valid" ) and pointwise21. So every step will
   *         shrink the input a little.
   *       - The step0's depthwise convolution will also use channel multiplier 2 to double the channel count.
   *       - The stepLast may use a smaller depthwise filter so that it could just make ( output height, width ) as half of source.
   *       - If ( depthwiseFilterHeight == 1 ), the depthwiseFilterHeight will become 2 forcibly. Otherwise, the source size
   *         could not be shrinked.
   *
   *   - If ( stepCountRequested >= 2 ), this block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   *       (i.e. to halve height x width) and use ( stepCountRequested - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" )
   *       until the block end. (This can not be achieved by only one step. So there is at least two steps.)
   *
   * @param {number} pointwise1ChannelCountRate
   *   The first 1x1 pointwise convolution output channel count over of the second 1x1 pointwise convolution output channel count.
   * That is, pointwise1ChannelCount = ( pointwise21ChannelCount * pointwise1ChannelCountRate ).
   *   - If ( pointwise1ChannelCountRate == null ), it will be extracted from inputFloat32Array (i.e. by evolution).
   *   - If ( pointwise1ChannelCountRate == 0 ), there will be no pointwise1.
   *   - If ( pointwise1ChannelCountRate == 1 ), will be similar to MobileNetV1 (no expanding) or ShuffleNetV2 (expanding by twice depthwise).
   *   - If ( pointwise1ChannelCountRate == 2 ), will be similar to MobileNetV2 (expanding by twice pointhwise1).
   *
   * @param {string} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after every convolution. If null, it will be
   * extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {string} nActivationIdAtBlockEnd
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the convolution of the last PointDepthPoint's
   * pointwise2ActivationId of this block. If null, it will be extracted from inputFloat32Array (i.e. by evolution). If the output of
   * this block needs to be any arbitrary value, it is recommended not to use activation at the end of this block
   * (i.e. nActivationIdAtBlockEnd == ValueDesc.ActivationFunction.Singleton.Ids.NONE) so that it will not be restricted by the range
   * of the activation function.
   *
   * @param {boolean} nWhetherShuffleChannel
   *   Whether a (concatenator and) channel shuffler will be used.
   *
   *   - If ( nWhetherShuffleChannel == null ), it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   *   - If ( stepCountRequested <= 1 ), this flag will be ignored.
   *       This block will be NotShuffleNet_NotMobileNet. There will be no channel shuffler.
   *
   *   - If ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.NONE ), (0),
   *       this block will be MobileNetV1 or MobileNetV2 (i.e. with add-input-to-output, no channel shuffler).
   *
   *   - If ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_CHANNEL_SHUFFLER ), (1),
   *       this block will be ShuffleNetV2. There is a channel shuffler by concat-shuffle-split.
   *
   *   - If ( nWhetherShuffleChannel == ValueDesc.WhetherShuffleChannelSingleton.Ids.BY_POINTWISE22 ), (2),
   *       this block will be ShuffleNetV2_ByPointwise22. There is a channel shuffler by pointwise22.
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
    stepCountRequested,
    pointwise1ChannelCountRate,
    depthwiseFilterHeight, nActivationId, nActivationIdAtBlockEnd,
    nWhetherShuffleChannel,
    bKeepInputTensor
  ) {

    // Q: Why the depthwiseChannelMultiplierStep0 is not listed as a parameter?
    // A: After considering the following reasons, it is worth to drop this parameter.
    //
    //   - In reality, it is almost no reason to use only avg/max pooling to compose a block because it keep too little information
    //     for the next block.
    //
    //   - If depthwiseChannelMultiplierStep0 is specified as Params.depthwiseChannelMultiplierStep0.valueDesc.Ids.NONE (0), the input
    //     image will not be shrinked a little (for ( stepCountRequested <= 1 )) or will not be halven (for ( stepCountRequested >= 2 ).
    //     If it is still a parameter it should be forced to 1 at least (always needs depthwise operation) in this case.
    //

    let parameterMap = new Map( [
      [ Params.sourceHeight,               sourceHeight ],
      [ Params.sourceWidth,                sourceWidth ],
      [ Params.sourceChannelCount,         sourceChannelCount ],
      [ Params.stepCountRequested,         stepCountRequested ],
      [ Params.pointwise1ChannelCountRate, pointwise1ChannelCountRate ],
      [ Params.depthwiseFilterHeight,      depthwiseFilterHeight ],
      [ Params.nActivationId,              nActivationId ],
      [ Params.nActivationIdAtBlockEnd,    nActivationIdAtBlockEnd ],
      [ Params.nWhetherShuffleChannel,     nWhetherShuffleChannel ],
      [ Params.bKeepInputTensor,           bKeepInputTensor ],
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
  
  get sourceHeight()                { return this.parameterMapModified.get( Params.sourceHeight ); }
  get sourceWidth()                 { return this.parameterMapModified.get( Params.sourceWidth ); }
  get sourceChannelCount()          { return this.parameterMapModified.get( Params.sourceChannelCount ); }

  get stepCountRequested()          { return this.parameterMapModified.get( Params.stepCountRequested ); }
  get pointwise1ChannelCountRate()  { return this.parameterMapModified.get( Params.pointwise1ChannelCountRate ); }

  get depthwiseFilterHeight()       { return this.parameterMapModified.get( Params.depthwiseFilterHeight ); }
  get nActivationId()               { return this.parameterMapModified.get( Params.nActivationId ); }
  get nActivationIdName()           { return Params.nActivationId.getStringOfValue( this.nActivationId ); }
  get nActivationIdAtBlockEnd()     { return this.parameterMapModified.get( Params.nActivationIdAtBlockEnd ); }
  get nActivationIdAtBlockEndName() { return Params.nActivationIdAtBlockEnd.getStringOfValue( this.nActivationIdAtBlockEnd ); }

  get nWhetherShuffleChannel()      { return this.parameterMapModified.get( Params.nWhetherShuffleChannel ); }
  get nWhetherShuffleChannelName()  { return Params.nWhetherShuffleChannel.getStringOfValue( this.nWhetherShuffleChannel ); }

  get bKeepInputTensor()            { return this.parameterMapModified.get( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.
Params.sourceHeight =               new ParamDesc.Int(                   "sourceHeight",               1, ( 10 * 1024 ) );
Params.sourceWidth =                new ParamDesc.Int(                   "sourceWidth",                1, ( 10 * 1024 ) );
Params.sourceChannelCount =         new ParamDesc.Int(                   "sourceChannelCount",         1, ( 10 * 1024 ) );
Params.stepCountRequested =         new ParamDesc.Int(                   "stepCountRequested",         1, (  1 * 1024 ) );
Params.pointwise1ChannelCountRate = new ParamDesc.Int(                   "pointwise1ChannelCountRate", 0,             2 );
Params.depthwiseFilterHeight =      new ParamDesc.Int(                   "depthwiseFilterHeight",      1,             9 );
Params.nActivationId =              new ParamDesc.ActivationFunction(    "nActivationId" );
Params.nActivationIdAtBlockEnd =    new ParamDesc.ActivationFunction(    "nActivationIdAtBlockEnd" );
Params.nWhetherShuffleChannel =     new ParamDesc.WhetherShuffleChannel( "nWhetherShuffleChannel" );
Params.bKeepInputTensor =           new ParamDesc.Bool(                  "bKeepInputTensor" );

