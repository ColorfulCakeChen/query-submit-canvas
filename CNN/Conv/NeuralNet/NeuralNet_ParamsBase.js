
export { NeuralNet_ParamsBase as ParamsBase } ;

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { InferencedParams } from "./NeuralNet_InferencedParams.js";

/**
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
    nConvStageTypeId, stageCountRequested,
    blockCountRequested,
    bKeepInputTensor
  ) {
    super();
    NeuralNet_ParamsBase.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested,
      bKeepInputTensor
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested,
    bKeepInputTensor
  ) {
    super.setAsConstructor();
    NeuralNet_ParamsBase.setAsConstructor_self.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested,
      bKeepInputTensor
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested,
    bKeepInputTensor
  ) {
    this.input_height = input_height;
    this.input_width = input_width;
    this.input_channelCount = input_channelCount;
    this.vocabularyChannelCount = vocabularyChannelCount;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.nConvStageTypeId = nConvStageTypeId;
    this.stageCountRequested = stageCountRequested;
    this.blockCountRequested = blockCountRequested;
    this.bKeepInputTensor = bKeepInputTensor;
  }

  /** @override */
  disposeResources() {
    this.inferencedParams_dispose();

    this.bKeepInputTensor = undefined;
    this.blockCountRequested = undefined;
    this.stageCountRequested = undefined;
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
    this.inferencedParams = InferencedParams.Pool.get_or_create_by(
      this.input_height, this.input_width, this.input_channelCount,

//!!! ...unfinished... (2022/07/30)
      this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
      this.nConvStageTypeId, this.stageCountRequested,
      this.blockCountRequested
    );
  }

  get nConvStageTypeName() {
    return ValueDesc.ConvStageType.Singleton.getName_byId( this.nConvStageTypeId );
  }

  /** @override */
  toString() {

//!!! ...unfinished... (2022/07/30)

    let strDescription = ``
      + `input_height=${this.input_height}, `
      + `input_width=${this.input_width}, `
      + `input_channelCount=${this.input_channelCount}, `
      + `vocabularyChannelCount=${this.vocabularyChannelCount}, `
      + `vocabularyCountPerInputChannel=${this.vocabularyCountPerInputChannel}, `

      + `nConvStageTypeId=${this.nConvStageTypeName}(${this.nConvStageTypeId}), `
      + `stageCountRequested=${this.stageCountRequested}, `

      + `blockCountRequested=${this.blockCountRequested}, `

      + `bKeepInputTensor=${this.bKeepInputTensor}, `
      + `${this.inferencedParams}`
    ;
    return strDescription;
  }

}

