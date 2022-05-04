export { Params };

import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";

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
   *   The height of the source image which will be processed by apply(). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @param {number} sourceWidth
   *   The width of the source image which will be processed by apply(). If null, it will be extracted from
   * inputFloat32Array (i.e. by evolution).
   *
   * @param {number} sourceChannelCount
   *   The depth (channel count) of the source image. It may be the output channel count of the previous convolution block, so
   * it could be large. If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   * @param {number} stepCountRequested
   *   How many steps inside this block are wanted.
   *   - If null, it will be extracted from inputFloat32Array (i.e. by evolution).
   *   - It must be ( >= 2 ). Because this block will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   *       (i.e. to halve height x width) and use ( stepCountRequested - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" )
   *       until the block end. These can not be achieved by only one step. So there is at least two steps.
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
   * @param {number} nConvBlockType
   *   The type of this convolution block (ValueDesc.ConvBlockType.Singleton.Ids.Xxx).
   *
   *   - If ( nConvBlockType == null ), it will be extracted from inputFloat32Array (i.e. by evolution).
   *
   *   - ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1 (0):
   *       This block will be MobileNetV1 (i.e. no add-input-to-output, no channel shuffler).
   *
   *   - ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2 (1):
   *       This block will be (original) MobileNetV2 (i.e. with add-input-to-output, no channel shuffler).
   *       Its pointwise1 will be twice size of pointwise21
   *
   *   - ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN (2):
   *       This block will be (thin) MobileNetV2 (i.e. with add-input-to-output, no channel shuffler).
   *       Its pointwise1 will be the same size of pointwise21
   *
   *   - ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2 (3):
   *       This block will be ShuffleNetV2. There is a channel shuffler for concat-shuffle-split.
   *
   *   - ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22 (4):
   *       This block will be ShuffleNetV2_ByPointwise22. The channel shuffling is done by pointwise22.
   *
   *   - ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5):
   *       This block will be ShuffleNetV2_ByMobileNetV1. The channel shuffling is integrated inside pointwise1, depthwise1, pointwise21.
   *
   *   - ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (6):
   *       This block will be ShuffleNetV2_ByMobileNetV1. The channel shuffling is integrated inside pointwise1, depthwise1, pointwise21.
   *       Its depthwise1 will use ( pad = "valid" ).
   *
   * @param {boolean} bLastBlock
   *   Whether is this block the last block in multiple blocks situation. It is used to determine whether the stepLast's
   * pointwise2 could have no bias. Because the stepLast's pointwise2 usually should have bias. If null, it will be extracted
   * from inputFloat32Array (i.e. by evolution).
   * 
   * Note: It is only useful when both this and next block (i.e. blocks) are MobileNet with ( bPointwise1 == true ).
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
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    nActivationId,
    nConvBlockType,
    bLastBlock,
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
      [ Params.bPointwise1,                bPointwise1 ],
      [ Params.depthwiseFilterHeight,      depthwiseFilterHeight ],
      [ Params.depthwiseFilterWidth,       depthwiseFilterWidth ],
      [ Params.nActivationId,              nActivationId ],
      [ Params.nConvBlockType,             nConvBlockType ],
      [ Params.bLastBlock,                 bLastBlock ],
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
  get bPointwise1()                 { return this.parameterMapModified.get( Params.bPointwise1 ); }

  get depthwiseFilterHeight()       { return this.parameterMapModified.get( Params.depthwiseFilterHeight ); }
  get depthwiseFilterWidth()        { return this.parameterMapModified.get( Params.depthwiseFilterWidth ); }

  get nActivationId()               { return this.parameterMapModified.get( Params.nActivationId ); }
  get nActivationIdName()           { return Params.nActivationId.getStringOfValue( this.nActivationId ); }

  get nConvBlockType()              { return this.parameterMapModified.get( Params.nConvBlockType ); }
  get nConvBlockTypeName()          { return Params.nConvBlockType.getStringOfValue( this.nConvBlockType ); }

  get bLastBlock()                  { return this.parameterMapModified.get( Params.bLastBlock ); }
  get bKeepInputTensor()            { return this.parameterMapModified.get( Params.bKeepInputTensor ); }
}


// Define parameter descriptions.
Params.sourceHeight =               new ParamDesc.Int(                   "sourceHeight",               1, ( 10 * 1024 ) );
Params.sourceWidth =                new ParamDesc.Int(                   "sourceWidth",                1, ( 10 * 1024 ) );
Params.sourceChannelCount =         new ParamDesc.Int(                   "sourceChannelCount",         1, ( 10 * 1024 ) );
Params.stepCountRequested =         new ParamDesc.Int(                   "stepCountRequested",         2, (  1 * 1024 ) );
Params.bPointwise1 =                new ParamDesc.Bool(                  "bPointwise1" );
Params.depthwiseFilterHeight =      new ParamDesc.Int(                   "depthwiseFilterHeight",      1, ( 10 * 1024 ) );
Params.depthwiseFilterWidth =       new ParamDesc.Int(                   "depthwiseFilterWidth",       2, ( 10 * 1024 ) );
Params.nActivationId =              new ParamDesc.ActivationFunction(    "nActivationId" );
Params.nConvBlockType =             new ParamDesc.ConvBlockType(         "nConvBlockType" );
Params.bLastBlock =                 new ParamDesc.Bool(                  "bLastBlock" );
Params.bKeepInputTensor =           new ParamDesc.Bool(                  "bKeepInputTensor" );

