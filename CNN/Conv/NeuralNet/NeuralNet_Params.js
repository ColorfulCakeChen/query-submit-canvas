export { NeuralNet_Params as Params };

import * as Pool from "../../util/Pool.js";
//import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ParamDesc from "../../Unpacker/ParamDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as Embedding from "../Embedding.js";
import * as Stage from "../Stage.js";
import { ParamsBase } from "./NeuralNet_ParamsBase.js";

//!!! ...unfinished... (2022/07/26)
// Perhaps, add parameter bCastToInt32 for controlling whether needs cast input to integer.

/**
 * NeuralNet parameters.
 *
 * NeuralNet is composed of an embedding and multiple stages.
 *
 *
 * @param {number} input_height
 *   The input image's height.
 *
 * @param {number} input_width
 *   The input image's width.
 *
 * @param {number} input_channelCount
 *   The input image's channel count.
 *
 * @member {number} vocabularyChannelCount
 *   In the embedding layer, every vocabulary will have how many embedding channels.
 * Every input channel will be expanded into so many embedding channels. It could
 * be viewed as embeddingChannelCountPerInputChannel. It must be ( >= 2 ) because
 * it always has ( bEmbedVocabularyId == true ).
 *
 * @member {number} vocabularyCountPerInputChannel
 *   In the embedding layer, every input channel will have how many vocabularies.
 * This is also vocabulary count per vocabulary table (because every input channel
 * has a vocabulary table). For an image data (R-G-B-A four channels), there will
 * be 256 vocabularies per input channel because every channel is represented by
 * one byte (8 bits) which has 2^8 = 256 kinds of possible values.
 *
 * @member {number} nConvStageTypeId
 *   The type (ValueDesc.ConvStageType.Singleton.Ids.Xxx) of every convolution stage.
 *
 * @member {number} stageCountRequested
 *   How many stages inside this neural network are wanted. It must be ( >= 1 ).
 * Every stage will halve height, halve width, double channel count.
 *
 * @member {number} blockCountRequested
 *   How many blocks inside every stage are wanted. It must be ( >= 2 ).
 *
 * @member {boolean} bKeepInputTensor
 *   If true, apply() will not dispose inputTensor (i.e. will be kept).
 *
 * @see Weight.Params
 *
 */
 class NeuralNet_Params extends Weights.Params( ParamsBase ) {

  /**
   * Used as default NeuralNet.Params provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet.Params.Pool", NeuralNet_Params, NeuralNet_Params.setAsConstructor );

  /**
   * If a parameter's value is null, it will be extracted from inputWeightArray (i.e. by evolution).
   *
   */
  constructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel = 256,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested,
    bKeepInputTensor
  ) {
    super(
      NeuralNet_Params.SequenceArray,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested,
      bKeepInputTensor
    );
    NeuralNet_Params.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel = 256,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested,
    bKeepInputTensor
  ) {
    super.setAsConstructor(
      NeuralNet_Params.SequenceArray,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested,
      bKeepInputTensor
    );
    NeuralNet_Params.setAsConstructor_self.call( this );
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
   * @return {boolean} Always return false. NeuralNet.Params needs not and can not
   * generate Stage.Params by itself. Only NeuralNet.Base.initer() could do that.
   * The reason is NeuralNet.StageParamsCreator needs input_height and input_width
   * of previous block. And these could only be available from previous
   * Stage.Base which should be created by NeuralNet.Base.initer().
   * 
   * @override
   */
  inferencedParams_embeddingParams_stageParamsArray_needed() {
    return false;
  }

  /** @override */
  EmbeddingParamsClass_get() {
    return Embedding.Params;
  }

  /** @override */
  StageParamsClass_get() {
    return Stage.Params;
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
      this.input_height = this.getParamValue_byParamDesc( NeuralNet_Params.input_height );
      this.input_width = this.getParamValue_byParamDesc( NeuralNet_Params.input_width );
      this.input_channelCount = this.getParamValue_byParamDesc( NeuralNet_Params.input_channelCount );
      this.vocabularyChannelCount = this.getParamValue_byParamDesc( NeuralNet_Params.vocabularyChannelCount );
      this.vocabularyCountPerInputChannel = this.getParamValue_byParamDesc( NeuralNet_Params.vocabularyCountPerInputChannel );
      this.nConvStageTypeId = this.getParamValue_byParamDesc( NeuralNet_Params.nConvStageTypeId );
      this.stageCountRequested = this.getParamValue_byParamDesc( NeuralNet_Params.stageCountRequested );
      this.blockCountRequested = this.getParamValue_byParamDesc( NeuralNet_Params.blockCountRequested );
      this.bKeepInputTensor = this.getParamValue_byParamDesc( NeuralNet_Params.bKeepInputTensor );
    }

    this.inferencedParams_create();

    return bExtractOk;
  }

}


// Define parameter descriptions.
NeuralNet_Params.input_height =                   new ParamDesc.Int(  "input_height",                   1, ( 10 * 1024 ) );
NeuralNet_Params.input_width =                    new ParamDesc.Int(  "input_width",                    1, ( 10 * 1024 ) );
NeuralNet_Params.input_channelCount =             new ParamDesc.Int(  "input_channelCount",             1, ( 10 * 1024 ) );

NeuralNet_Params.vocabularyChannelCount =         new ParamDesc.Int(  "vocabularyChannelCount",         2, (  1 * 1024 ) );
NeuralNet_Params.vocabularyCountPerInputChannel = new ParamDesc.Int(  "vocabularyCountPerInputChannel", 1, ( 2 ** 24 ) );

NeuralNet_Params.nConvStageTypeId =               new ParamDesc.ConvStageType( "nConvStageTypeId" );
NeuralNet_Params.stageCountRequested =            new ParamDesc.Int(           "stageCountRequested",   1, (  1 * 1024 ) );

NeuralNet_Params.blockCountRequested =            new ParamDesc.Int(           "blockCountRequested",   2, (  1 * 1024 ) );

NeuralNet_Params.bKeepInputTensor =               new ParamDesc.Bool( "bKeepInputTensor" );


/**
 * Define the order of these parameters. (Fills ParamDesc.Xxx.seqId according to this array's order.)
 */
NeuralNet_Params.SequenceArray = new ParamDesc.SequenceArray( [
  NeuralNet_Params.input_height,
  NeuralNet_Params.input_width,
  NeuralNet_Params.input_channelCount,
  NeuralNet_Params.vocabularyChannelCount,
  NeuralNet_Params.vocabularyCountPerInputChannel,
  NeuralNet_Params.nConvStageTypeId,
  NeuralNet_Params.stageCountRequested,
  NeuralNet_Params.blockCountRequested,
  NeuralNet_Params.bKeepInputTensor,
] );

