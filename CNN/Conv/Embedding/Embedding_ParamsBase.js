export { Embedding_ParamsBase as ParamsBase };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { InferencedParams } from "./Embedding_InferencedParams.js";

/**
 *
 */
class Embedding_ParamsBase extends Recyclable.Root {

  /**
   * Used as default Embedding.ParamsBase provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "Embedding.ParamsBase.Pool",
    Embedding_ParamsBase );

  /**
   */
  constructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel,
    bEmbedVocabularyId,
    bKeepInputTensor,
    bTableLog
  ) {
    super();
    this.#setAsConstructor_self(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel,
      bEmbedVocabularyId,
      bKeepInputTensor,
      bTableLog
    );
  }

  /** @override */
  setAsConstructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel,
    bEmbedVocabularyId,
    bKeepInputTensor,
    bTableLog
  ) {
    super.setAsConstructor();
    this.#setAsConstructor_self(
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel,
      bEmbedVocabularyId,
      bKeepInputTensor,
      bTableLog
    );
  }

  /**  */
  #setAsConstructor_self(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel,
    bEmbedVocabularyId,
    bKeepInputTensor,
    bTableLog
  ) {
    this.input_height = input_height;
    this.input_width = input_width;
    this.input_channelCount = input_channelCount;
    this.channelMultiplier = channelMultiplier;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.bEmbedVocabularyId = bEmbedVocabularyId;
    this.bKeepInputTensor = bKeepInputTensor;
    this.bTableLog = bTableLog;
  }

  /** @override */
  disposeResources() {
    this.inferencedParams_dispose();

    this.bTableLog = undefined;
    this.bKeepInputTensor = undefined;
    this.bEmbedVocabularyId = undefined;
    this.vocabularyCountPerInputChannel = undefined;
    this.channelMultiplier = undefined;
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

  /** Create .inferencedParams */
  inferencedParams_create() {
    this.inferencedParams_dispose();
    this.inferencedParams = InferencedParams.Pool.get_or_create_by(
      this.input_height, this.input_width, this.input_channelCount,
      this.channelMultiplier, this.vocabularyCountPerInputChannel,
      this.bEmbedVocabularyId
    );
  }

  /** @override */
  toString() {
    let str = ``
      + `input_height=${this.input_height}, `
      + `input_width=${this.input_width}, `
      + `input_channelCount=${this.input_channelCount}, `
      + `channelMultiplier=${this.channelMultiplier}, `
      + `vocabularyCountPerInputChannel=`
        + `${this.vocabularyCountPerInputChannel}, `
      + `bEmbedVocabularyId=${this.bEmbedVocabularyId}, `
      + `bKeepInputTensor=${this.bKeepInputTensor}, `
      + `bTableLog=${this.bTableLog}, `
      + `inferencedParams={ ${this.inferencedParams} }`
    ;
    return str;
  }

}
