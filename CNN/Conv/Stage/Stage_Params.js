export { Stage_Params as Params };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as Block from "../Block.js";
import { ParamsBase } from "./Stage_ParamsBase.js";

/**
 * Convolution stage parameters extracted from inputWeightArray.
 *
 */
class Stage_Params extends Weights.Params( ParamsBase ) {

  /**
   * Used as default Stage.Params provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "Stage.Params.Pool",
    Stage_Params );

  /**
   * If a parameter's value is null, it will be extracted from inputWeightArray
   * (i.e. by evolution).
   *
   * @param {number} input_height
   *   The height of the source image which will be processed by apply(). If
   * null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   * @param {number} input_width
   *   The width of the source image which will be processed by apply(). If
   * null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   * @param {number} input_channelCount
   *   The depth (channel count) of the source image. It may be the output
   * channel count of the previous convolution stage, so it could be large.
   * If null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   * @param {number} nConvStageTypeId
   *   The convolution stage type (ValueDesc.ConvStageType.Singleton.Ids.Xxx).
   * If null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   
//!!! ...unfinished... (2022/06/25)
// Perhaps, just like the ( height, width ) halving and channel count doubling
// by evey stage, the block count could be doubled by evey stage.

   * @param {number} blockCountRequested
   *   How many blocks inside this stage are wanted.
   *   - If null, it will be extracted from inputWeightArray (i.e. by
   *       evolution).
   *   - It must be ( >= 2 ). Because this stage will use one
   *       tf.depthwiseConv2d( strides = 2, pad = "same" ) to shrink (i.e. to
   *       halve height x width) and use ( blockCountRequested - 1 ) times
   *       tf.depthwiseConv2d( strides = 1, pad = "same" ) until the stage end.
   *       These can not be achieved by only one block. So there is at least
   *       two blocks.
   *
   * @param {boolean} bPointwise1
   *   If false, there will be no pointwise1 (i.e. the 1st pointwise
   * convolution). If null, it will be extracted from inputWeightArray (i.e. by
   * evolution).
   *
   * @param {number} depthwiseFilterHeight
   *   The height of depthwise convolution's filter. At least 1 (so that 1D
   * data could be processed). If null, it will be extracted from
   * inputWeightArray (i.e. by evolution).
   *
   * @param {number} depthwiseFilterWidth
   *   The width of depthwise convolution's filter. At least 2 (so that
   * meaningless ( 1 * 1 ) could be avoided). If null, it will be extracted
   * from inputWeightArray (i.e. by evolution).
   *
   * @param {number} nSqueezeExcitationChannelCountDivisor
   *   An integer represents the channel count divisor for
   * squeeze-and-excitation's intermediate pointwise convolution channel count.
   * (ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.Xx)
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx)
   * after every convolution. If null, it will be extracted from
   * inputWeightArray (i.e. by evolution).
   *
   * @param {boolean} bKeepInputTensor
   *   If true, apply() will not dispose inputTensor (i.e. will be kept). If
   * null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   * @param {boolean} bTableLog
   *   If true, the process and result will be logged to console as table (for
   * debug).
   *
   */
  constructor(
    input_height, input_width, input_channelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor,
    bTableLog
  ) {

    // Q: Why the depthwiseChannelMultiplierBlock0 is not listed as a
    //      parameter?
    // A: After considering the following reasons, it is worth to drop this
    //      parameter.
    //
    //   - In reality, it is almost no reason to use only avg/max pooling to
    //       compose a stage because it keep too little information for the
    //       next stage.
    //
    //   - If depthwiseChannelMultiplierBlock0 is specified as
    //       Params.depthwiseChannelMultiplierBlock0.valueDesc.Ids.NONE (0),
    //       the input image will be neither shrinked a little (as
    //       ( blockCountRequested <= 1 )) nor halven (as
    //       ( blockCountRequested >= 2 ). If it is still a parameter it should
    //       be forced to 1 at least (always needs depthwise operation) in this
    //       case.
    //

    super(
      Stage_Params.SequenceArray,
      input_height, input_width, input_channelCount,
      nConvStageTypeId,
      blockCountRequested,
      bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth,
      nSqueezeExcitationChannelCountDivisor,
      nActivationId,
      bKeepInputTensor,
      bTableLog
    );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor(
    input_height, input_width, input_channelCount,
    nConvStageTypeId,
    blockCountRequested,
    bPointwise1,
    depthwiseFilterHeight, depthwiseFilterWidth,
    nSqueezeExcitationChannelCountDivisor,
    nActivationId,
    bKeepInputTensor,
    bTableLog
  ) {
    super.setAsConstructor(
      Stage_Params.SequenceArray,
      input_height, input_width, input_channelCount,
      nConvStageTypeId,
      blockCountRequested,
      bPointwise1,
      depthwiseFilterHeight, depthwiseFilterWidth,
      nSqueezeExcitationChannelCountDivisor,
      nActivationId,
      bKeepInputTensor,
      bTableLog
    );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

  /**
   * @return {boolean} Always return false. Stage.Params needs not and can not
   * generate Block.Params by itself. Only Stage.Base.initer() could do that.
   * The reason is Stage.BlockParamsCreator needs input_height and input_width
   * of previous block. And these could only be available from previous
   * Block.Base which should be created by Stage.Base.initer().
   * 
   * @override
   */
  inferencedParams_blockParamsArray_needed() {
    return false;
  }

  /** @override */
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
      this.input_height
        = this.getParamValue_byParamDesc( Stage_Params.input_height );
      this.input_width
        = this.getParamValue_byParamDesc( Stage_Params.input_width );
      this.input_channelCount
        = this.getParamValue_byParamDesc( Stage_Params.input_channelCount );
      this.nConvStageTypeId
        = this.getParamValue_byParamDesc( Stage_Params.nConvStageTypeId );
      this.blockCountRequested
        = this.getParamValue_byParamDesc( Stage_Params.blockCountRequested );
      this.bPointwise1
        = this.getParamValue_byParamDesc( Stage_Params.bPointwise1 );
      this.depthwiseFilterHeight
        = this.getParamValue_byParamDesc( Stage_Params.depthwiseFilterHeight );
      this.depthwiseFilterWidth
        = this.getParamValue_byParamDesc( Stage_Params.depthwiseFilterWidth );
      this.nSqueezeExcitationChannelCountDivisor
        = this.getParamValue_byParamDesc( Stage_Params.nSqueezeExcitationChannelCountDivisor );
      this.nActivationId
        = this.getParamValue_byParamDesc( Stage_Params.nActivationId );
      this.bKeepInputTensor
        = this.getParamValue_byParamDesc( Stage_Params.bKeepInputTensor );
      this.bTableLog
        = this.getParamValue_byParamDesc( Stage_Params.bTableLog );
    }

    this.inferencedParams_create();

    return bExtractOk;
  }

}


// Define parameter descriptions.
Stage_Params.input_height
  = new ParamDesc.Int(                "input_height",          1, ( 10 * 1024 ) );
Stage_Params.input_width
  = new ParamDesc.Int(                "input_width",           1, ( 10 * 1024 ) );
Stage_Params.input_channelCount
  = new ParamDesc.Int(                "input_channelCount",    1, ( 10 * 1024 ) );

Stage_Params.nConvStageTypeId
  = new ParamDesc.ConvStageType(      "nConvStageTypeId" );

Stage_Params.blockCountRequested
  = new ParamDesc.Int(                "blockCountRequested",   2, ( 10 * 1024 ) );
Stage_Params.bPointwise1
  = new ParamDesc.Bool(               "bPointwise1" );
Stage_Params.depthwiseFilterHeight
  = new ParamDesc.Int(                "depthwiseFilterHeight", 1, ( 10 * 1024 ) );
Stage_Params.depthwiseFilterWidth
  = new ParamDesc.Int(                "depthwiseFilterWidth",  2, ( 10 * 1024 ) );

Stage_Params.nSqueezeExcitationChannelCountDivisor
  = new ParamDesc.SqueezeExcitationChannelCountDivisor(
                                      "nSqueezeExcitationChannelCountDivisor" );

Stage_Params.nActivationId
  = new ParamDesc.ActivationFunction( "nActivationId" );

Stage_Params.bKeepInputTensor
  = new ParamDesc.Bool(               "bKeepInputTensor" );

Stage_Params.bTableLog
  = new ParamDesc.Bool(               "bTableLog" );


/**
 * Define the order of these parameters. (Fills ParamDesc.Xxx.seqId according
 * to this array's order.)
 */
Stage_Params.SequenceArray = new ParamDesc.SequenceArray( [
  Stage_Params.input_height,
  Stage_Params.input_width,
  Stage_Params.input_channelCount,
  Stage_Params.nConvStageTypeId,
  Stage_Params.blockCountRequested,
  Stage_Params.bPointwise1,
  Stage_Params.depthwiseFilterHeight,
  Stage_Params.depthwiseFilterWidth,
  Stage_Params.nSqueezeExcitationChannelCountDivisor,
  Stage_Params.nActivationId,
  Stage_Params.bKeepInputTensor,
  Stage_Params.bTableLog,
] );
