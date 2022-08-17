
export { NeuralNet_ParamsBase as ParamsBase } ;

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Embedding from "../Embedding.js";
import * as Stage from "../Stage.js";
import * as Block from "../Block.js";
import { InferencedParams } from "./NeuralNet_InferencedParams.js";

//!!! ...unfinished... (2022/08/02)
// Perhaps, add .blockCountOfStageLast, so that the final stage could have more blocks.

/**
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

//!!! (2022/08/17 Remarked) determined by NeuralNet_StageParamsCreator_Base.
//    stageCountRequested,

    blockCountRequested,
    output_channelCount,
    bKeepInputTensor
  ) {
    super();
    NeuralNet_ParamsBase.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId,

//!!! (2022/08/17 Remarked) determined by NeuralNet_StageParamsCreator_Base.
//      stageCountRequested,

      blockCountRequested,
      output_channelCount,
      bKeepInputTensor
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId,

//!!! (2022/08/17 Remarked) determined by NeuralNet_StageParamsCreator_Base.
//    stageCountRequested,

    blockCountRequested,
    output_channelCount,
    bKeepInputTensor
  ) {
    super.setAsConstructor();
    NeuralNet_ParamsBase.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId,

//!!! (2022/08/17 Remarked) determined by NeuralNet_StageParamsCreator_Base.
//      stageCountRequested,

      blockCountRequested,
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

//!!! (2022/08/17 Remarked) determined by NeuralNet_StageParamsCreator_Base.
//    stageCountRequested,

    blockCountRequested,
    output_channelCount,
    bKeepInputTensor
  ) {
    this.input_height = input_height;
    this.input_width = input_width;
    this.input_channelCount = input_channelCount;
    this.vocabularyChannelCount = vocabularyChannelCount;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.nConvStageTypeId = nConvStageTypeId;

//!!! (2022/08/17 Remarked) determined by NeuralNet_StageParamsCreator_Base.
//    this.stageCountRequested = stageCountRequested;

    this.blockCountRequested = blockCountRequested;
    this.output_channelCount = output_channelCount;
    this.bKeepInputTensor = bKeepInputTensor;
  }

  /** @override */
  disposeResources() {
    this.inferencedParams_dispose();

    this.bKeepInputTensor = undefined;
    this.output_channelCount = undefined;
    this.blockCountRequested = undefined;

//!!! (2022/08/17 Remarked) determined by NeuralNet_StageParamsCreator_Base.
//    this.stageCountRequested = undefined;

    this.nConvStageTypeId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.vocabularyChannelCount = undefined;
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    super.disposeResources();
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

//!!! (2022/08/17 Remarked) determined by NeuralNet_StageParamsCreator_Base.
//      + `stageCountRequested=${this.stageCountRequested}, `

      + `blockCountRequested=${this.blockCountRequested}, `

      + `output_channelCount=${this.output_channelCount}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}, `
      + `${this.inferencedParams}`
    ;
    return str;
  }

}

