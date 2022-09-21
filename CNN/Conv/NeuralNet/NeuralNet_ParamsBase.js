
export { NeuralNet_ParamsBase as ParamsBase } ;

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Embedding from "../Embedding.js";
import * as Stage from "../Stage.js";
import * as Block from "../Block.js";
import { InferencedParams } from "./NeuralNet_InferencedParams.js";

//!!! ...unfinished... (2022/08/02)
// Perhaps, add parameter bCastToInt32 for controlling whether needs cast input to integer.
// Perhaps, add .blockCountOfStageLast, so that the final stage could have more blocks.

/**
 * NeuralNet parameters base class.
 *
 *
 * @member {number} input_height
 *   The input image's height.
 *
 * @member {number} input_width
 *   The input image's width.
 *
 * @member {number} input_channelCount
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
 * @member {number} blockCountTotalRequested
 *   How many blocks of the whole neural network are wanted. It will be spreaded to
 * every stage. Note that every stage will have at least 2 blocks.
 *
 * @member {number} output_channelCount
 *   The output tensor's channel count.
 *
 * @member {boolean} bKeepInputTensor
 *   If true, apply() will not dispose inputTensor (i.e. will be kept).
 *
 * @member {InferencedParams} inferencedParams
 *   The inferenced parameters of this neural network parameters.
 *
 */
class NeuralNet_ParamsBase extends Recyclable.Root {

  /**
   * Used as default NeuralNet.ParamsBase provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet.ParamsBase.Pool",
    NeuralNet_ParamsBase, NeuralNet_ParamsBase.setAsConstructor );

  /**
   */
  constructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId,
    blockCountTotalRequested,
    output_channelCount,
    bKeepInputTensor
  ) {
    super();
    NeuralNet_ParamsBase.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId,
      blockCountTotalRequested,
      output_channelCount,
      bKeepInputTensor
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId,
    blockCountTotalRequested,
    output_channelCount,
    bKeepInputTensor
  ) {
    super.setAsConstructor();
    NeuralNet_ParamsBase.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId,
      blockCountTotalRequested,
      output_channelCount,
      bKeepInputTensor
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId,
    blockCountTotalRequested,
    output_channelCount,
    bKeepInputTensor
  ) {
    this.input_height = input_height;
    this.input_width = input_width;
    this.input_channelCount = input_channelCount;
    this.vocabularyChannelCount = vocabularyChannelCount;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.nConvStageTypeId = nConvStageTypeId;
    this.blockCountTotalRequested = blockCountTotalRequested;
    this.output_channelCount = output_channelCount;
    this.bKeepInputTensor = bKeepInputTensor;
  }

  /** @override */
  disposeResources() {
    this.inferencedParams_dispose();

    this.bKeepInputTensor = undefined;
    this.output_channelCount = undefined;
    this.blockCountTotalRequested = undefined;
    this.nConvStageTypeId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.vocabularyChannelCount = undefined;
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    super.disposeResources();
  }

  /**
   * Get or create (from pool) NeuralNet.ParamsBase according to this NeuralNet.ParamsBase.
   */
  clone() {
    let another = ParamsBase.Pool.get_or_create_by(
      this.input_height,
      this.input_width,
      this.input_channelCount,
      this.vocabularyChannelCount,
      this.vocabularyCountPerInputChannel,
      this.nConvStageTypeId,
      this.blockCountTotalRequested,
      this.output_channelCount,
      this.bKeepInputTensor
    );
    return another;
  }

  /** Release .inferencedParams */
  inferencedParams_dispose() {
    if ( this.inferencedParams ) {
      this.inferencedParams.disposeResources_and_recycleToPool();
      this.inferencedParams = null;
    }
  }

  /**  */
  inferencedParams_create() {
    this.inferencedParams_dispose();
    this.inferencedParams = InferencedParams.Pool.get_or_create_by( this );
  }

  /**
   * @return {boolean}
   *   Return true, if .inferencedParams will create .embeddingParams and .stageParamsArray
   */
  inferencedParams_embeddingParams_stageParamsArray_needed() {
    return true;
  }

  /**
   * @return {Embedding.ParamsBase|Embedding.Params}
   *   Return which embedding parameter class should be used by InferencedParams.
   */
  EmbeddingParamsClass_get() {
    return Embedding.ParamsBase;
  }

  /**
   * @return {Stage.ParamsBase|Stage.Params}
   *   Return which stage parameter class should be used by InferencedParams.
   */
  StageParamsClass_get() {
    return Stage.ParamsBase;
  }

  /**
   * @return {Block.ParamsBase|Block.Params}
   *   Return which block parameter class should be used by InferencedParams.
   */
  BlockParamsClass_get() {
    return Block.ParamsBase;
  }

  get nConvStageTypeName() {
    return ValueDesc.ConvStageType.Singleton.getName_byId( this.nConvStageTypeId );
  }

  /** @override */
  toString() {
    let str = ``
      + `input_height=${this.input_height}, `
      + `input_width=${this.input_width}, `
      + `input_channelCount=${this.input_channelCount}, `
      + `vocabularyChannelCount=${this.vocabularyChannelCount}, `
      + `vocabularyCountPerInputChannel=${this.vocabularyCountPerInputChannel}, `

      + `nConvStageTypeName=${this.nConvStageTypeName}(${this.nConvStageTypeId}), `

      + `blockCountTotalRequested=${this.blockCountTotalRequested}, `

      + `output_channelCount=${this.output_channelCount}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}, `
      + `${this.inferencedParams}`
    ;
    return str;
  }

}

