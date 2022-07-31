export { Stage_Params as Params };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as Block from "../Block.js";
import { ParamsBase } from "./Stage_ParamsBase.js";

//!!! ...unfinished... (2022/05/28)
//
// Add parameter bPointwise2SqueezeExcitationAtStageEnd control whether this stage's final block's pointwise2 should have
// squeeze-and-excitation.
//


/**
 * Convolution stage parameters extracted from inputWeightArray.
 *
 */
class Stage_Params extends Weights.Params( ParamsBase ) {

  /**
   * Used as default Stage.Params provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.Params.Pool", Stage_Params, Stage_Params.setAsConstructor );

  /**
   * If a parameter's value is null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   * @param {number} sourceHeight
   *   The height of the source image which will be processed by apply(). If null, it will be extracted from
   * inputWeightArray (i.e. by evolution).
   *
   * @param {number} sourceWidth
   *   The width of the source image which will be processed by apply(). If null, it will be extracted from
   * inputWeightArray (i.e. by evolution).
   *
   * @param {number} sourceChannelCount
   *   The depth (channel count) of the source image. It may be the output channel count of the previous convolution stage, so
   * it could be large. If null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   * @param {number} nConvStageTypeId
   *   The convolution stage type (ValueDesc.ConvStageType.Singleton.Ids.Xxx). If null, it will be extracted from inputWeightArray
   * (i.e. by evolution).
   *
   
//!!! ...unfinished... (2022/06/25)
// Perhaps, just like the ( height, width ) halving and channel count doubling by evey stage,
// the block count could be doubled by evey stage.

   * @param {number} blockCountRequested
   *   How many blocks inside this stage are wanted.
   *   - If null, it will be extracted from inputWeightArray (i.e. by evolution).
   *   - It must be ( >= 2 ). Because this stage will use one tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink
   *       (i.e. to halve height x width) and use ( blockCountRequested - 1 ) times tf.depthwiseConv2d( strides = 1, pad = "same" )
   *       until the stage end. These can not be achieved by only one block. So there is at least two blocks.
   *
   * @param {boolean} bPointwise1
   *   If false, there will be no pointwise1 (i.e. the 1st pointwise convolution).If null, it will be extracted from inputWeightArray
   * (i.e. by evolution).
   *
   * @param {number} depthwiseFilterHeight
   *   The height of depthwise convolution's filter. At least 1 (so that 1D data could be processed). If null, it will be extracted
   * from inputWeightArray (i.e. by evolution).
   *
   * @param {number} depthwiseFilterWidth
   *   The width of depthwise convolution's filter. At least 2 (so that meaningless ( 1 * 1 ) could be avoided). If null, it will
   * be extracted from inputWeightArray (i.e. by evolution).
   *
   * @param {boolean} bPointwise2ActivatedAtStageEnd
   *   If true, the blockLast's pointwise2 will have activation function. If false, the blockLast's pointwise2 will have no activation
   * function. If null, it will be extracted from inputWeightArray (i.e. by evolution).
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
   *
   * @param {number} nSqueezeExcitationChannelCountDivisor
   *   An integer represents the channel count divisor for squeeze-and-excitation's intermediate pointwise convolution channel count.
   * (ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.Xx)
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after every convolution. If null, it will be
   * extracted from inputWeightArray (i.e. by evolution).
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply() will not dispose inputTensor (i.e. will be kept). If null, it will be extracted from
   * inputWeightArray (i.e. by evolution).
   *
   */
  constructor(
    sourceHeight, sourceWidth, sourceChannelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    bPointwise2ActivatedAtStageEnd,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
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

    super(
      Stage_Params.SequenceArray,
      sourceHeight, sourceWidth, sourceChannelCount,
      nConvStageTypeId,
      blockCountRequested,
      bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth,
      bPointwise2ActivatedAtStageEnd,
      nSqueezeExcitationChannelCountDivisor,
      nActivationId,
      bKeepInputTensor
    );
    Stage_Params.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor(
    sourceHeight, sourceWidth, sourceChannelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    bPointwise2ActivatedAtStageEnd,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor
  ) {
    super.setAsConstructor(
      Stage_Params.SequenceArray,
      sourceHeight, sourceWidth, sourceChannelCount,
      nConvStageTypeId,
      blockCountRequested,
      bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth,
      bPointwise2ActivatedAtStageEnd,
      nSqueezeExcitationChannelCountDivisor,
      nActivationId,
      bKeepInputTensor
    );
    Stage_Params.setAsConstructor_self.call( this );
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
   * (In fact, this method should never be used. The reason is the same as why
   * Stage.Params.init() should not call .InferencedParams_create())
   *
   * @override
   */
  BlockParamsClass_get() {
    return Block.Params;
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

    {
      this.sourceHeight = this.getParamValue_byParamDesc( Stage_Params.sourceHeight );
      this.sourceWidth = this.getParamValue_byParamDesc( Stage_Params.sourceWidth );
      this.sourceChannelCount = this.getParamValue_byParamDesc( Stage_Params.sourceChannelCount );
      this.nConvStageTypeId = this.getParamValue_byParamDesc( Stage_Params.nConvStageTypeId );
      this.blockCountRequested = this.getParamValue_byParamDesc( Stage_Params.blockCountRequested );
      this.bPointwise1 = this.getParamValue_byParamDesc( Stage_Params.bPointwise1 );
      this.depthwiseFilterHeight = this.getParamValue_byParamDesc( Stage_Params.depthwiseFilterHeight );
      this.depthwiseFilterWidth = this.getParamValue_byParamDesc( Stage_Params.depthwiseFilterWidth );
      this.bPointwise2ActivatedAtStageEnd = this.getParamValue_byParamDesc( Stage_Params.bPointwise2ActivatedAtStageEnd );
      this.nSqueezeExcitationChannelCountDivisor = this.getParamValue_byParamDesc( Stage_Params.nSqueezeExcitationChannelCountDivisor );
      this.nActivationId = this.getParamValue_byParamDesc( Stage_Params.nActivationId );
      this.bKeepInputTensor = this.getParamValue_byParamDesc( Stage_Params.bKeepInputTensor );
    }

    // (2022/07/31 Remarked)
    //
    // Stage.Params needs not and can not generate Block.Params by itself. Only
    // Stage.Base.initer() could do that.
    //
    // The reason is Stage.BlockParamsCreator needs input_height and input_width
    // of previous block. And these could only be available from previous Block.Base
    // which should be created by Stage.Base.initer().
    // 
    // 
    //this.InferencedParams_create();

    return bExtractOk;
  }

//!!! (2022/07/30 Remarked) Use parent class's data properties instead.
  // get sourceHeight()              { return this.getParamValue_byParamDesc( Stage_Params.sourceHeight ); }
  // get sourceWidth()               { return this.getParamValue_byParamDesc( Stage_Params.sourceWidth ); }
  // get sourceChannelCount()        { return this.getParamValue_byParamDesc( Stage_Params.sourceChannelCount ); }

  // /** @return {number} The number version of nConvStageTypeId. */
  // get nConvStageTypeId()          { return this.getParamValue_byParamDesc( Stage_Params.nConvStageTypeId ); }

  // /** @return {string} The string version of nConvStageTypeId. */
  // get nConvStageTypeName()        { return Stage_Params.nConvStageTypeId.getStringOfValue( this.nConvStageTypeId ); }

  // get blockCountRequested()       { return this.getParamValue_byParamDesc( Stage_Params.blockCountRequested ); }
  // get bPointwise1()               { return this.getParamValue_byParamDesc( Stage_Params.bPointwise1 ); }

  // get depthwiseFilterHeight()     { return this.getParamValue_byParamDesc( Stage_Params.depthwiseFilterHeight ); }
  // get depthwiseFilterWidth()      { return this.getParamValue_byParamDesc( Stage_Params.depthwiseFilterWidth ); }

  // get bPointwise2ActivatedAtStageEnd() { return this.getParamValue_byParamDesc( Stage_Params.bPointwise2ActivatedAtStageEnd ); }

  // get nSqueezeExcitationChannelCountDivisor()     { return this.getParamValue_byParamDesc( Stage_Params.nSqueezeExcitationChannelCountDivisor ); }
  // get nSqueezeExcitationChannelCountDivisorName() {
  //   return Stage_Params.nSqueezeExcitationChannelCountDivisor.getStringOfValue( this.nSqueezeExcitationChannelCountDivisor );
  // }

  // get nActivationId()             { return this.getParamValue_byParamDesc( Stage_Params.nActivationId ); }
  // get nActivationName()           { return Stage_Params.nActivationId.getStringOfValue( this.nActivationId ); }

  // get bKeepInputTensor()          { return this.getParamValue_byParamDesc( Stage_Params.bKeepInputTensor ); }
}


// Define parameter descriptions.
Stage_Params.sourceHeight =                   new ParamDesc.Int(                "sourceHeight",               1, ( 10 * 1024 ) );
Stage_Params.sourceWidth =                    new ParamDesc.Int(                "sourceWidth",                1, ( 10 * 1024 ) );
Stage_Params.sourceChannelCount =             new ParamDesc.Int(                "sourceChannelCount",         1, ( 10 * 1024 ) );

Stage_Params.nConvStageTypeId =               new ParamDesc.ConvStageType(      "nConvStageTypeId" );

Stage_Params.blockCountRequested =            new ParamDesc.Int(                "blockCountRequested",        2, (  1 * 1024 ) );
Stage_Params.bPointwise1 =                    new ParamDesc.Bool(               "bPointwise1" );
Stage_Params.depthwiseFilterHeight =          new ParamDesc.Int(                "depthwiseFilterHeight",      1, ( 10 * 1024 ) );
Stage_Params.depthwiseFilterWidth =           new ParamDesc.Int(                "depthwiseFilterWidth",       2, ( 10 * 1024 ) );
Stage_Params.bPointwise2ActivatedAtStageEnd = new ParamDesc.Bool(               "bPointwise2ActivatedAtStageEnd" );

Stage_Params.nSqueezeExcitationChannelCountDivisor = new ParamDesc.SqueezeExcitationChannelCountDivisor( "nSqueezeExcitationChannelCountDivisor" );
//Stage_Params.bSqueezeExcitationPrefix =       new ParamDesc.Bool(               "bSqueezeExcitationPrefix" );

Stage_Params.nActivationId =                  new ParamDesc.ActivationFunction( "nActivationId" );

Stage_Params.bKeepInputTensor =               new ParamDesc.Bool(               "bKeepInputTensor" );



/**
 * Define the order of these parameters. (Fills ParamDesc.Xxx.seqId according to this array's order.)
 */
Stage_Params.SequenceArray = new ParamDesc.SequenceArray( [
  Stage_Params.sourceHeight,
  Stage_Params.sourceWidth,
  Stage_Params.sourceChannelCount,
  Stage_Params.nConvStageTypeId,
  Stage_Params.blockCountRequested,
  Stage_Params.bPointwise1,
  Stage_Params.depthwiseFilterHeight,
  Stage_Params.depthwiseFilterWidth,
  Stage_Params.bPointwise2ActivatedAtStageEnd,
  Stage_Params.nSqueezeExcitationChannelCountDivisor,
  Stage_Params.nActivationId,
  Stage_Params.bKeepInputTensor,
] );

