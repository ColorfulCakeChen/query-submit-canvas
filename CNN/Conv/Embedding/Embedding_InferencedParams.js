export { Embedding_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 * All properties inferenced from Embedding.Params.
 *
 * @member {number} output_height
 *   The output image's height.
 *
 * @member {number} output_width
 *   The output image's width.
 *
 * @member {number} output_channelCount
 *   The output image's channel count. It is always depending on channelMultiplier and equals to ( inChannels * channelMultiplier ).
 *
 * @member {number} vocabularyIdMax
 *   The maximum legal vocabulary id. The legal vocabulary id should be in [ 0, ( vocabularyCountPerInputChannel - 1 ) ].
 *
 * @member {number} weightCountPerVocabularyTable_extracted
 *   The weight count should be extracted from inputWeightArray for one input channel.
 *
 * @member {number} weightCountPerVocabularyTable
 *   The weight count for one input channel.
 *
 * @member {number} tensorWeightCountExtracted
 *   The wieght count extracted from inputWeightArray and used in tensors. Not including Params, because they are not used
 * in tensors. Not including embedded vocabulary id (even if ( bEmbedVocabularyId == true )), because they are not extracted
 * from inputWeightArray.
 *
 * @member {number} tensorWeightCountTotal
 *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including embedded
 * vocabulary id.
 *
 * @see Embedding.Params
 */
class Embedding_InferencedParams extends Recyclable.Root {

  /**
   * Used as default Embedding.InferencedParams provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Embedding.InferencedParams.Pool",
    Embedding_InferencedParams, Embedding_InferencedParams.setAsConstructor );

  /**
   *
   */
  constructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    super();
    Embedding_InferencedParams.set_inferencedParams_by.call( this,
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    super.setAsConstructor();
    Embedding_InferencedParams.set_inferencedParams_by.call( this,
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    Embedding_InferencedParams.set_inferencedParams_by.call( this,
      input_height, input_width, input_channelCount,
      channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
    );
  }

  /** @override */
  disposeResources() {
    this.tensorWeightCountTotal = undefined;
    this.tensorWeightCountExtracted = undefined;
    this.weightCountPerVocabularyTable = undefined;
    this.weightCountPerVocabularyTable_extracted = undefined;
    this.vocabularyIdMax = undefined;
    this.output_channelCount = undefined;
    this.output_width = undefined;
    this.output_height = undefined;
    super.disposeResources();
  }

  /**
   * Determine the following properties:
   *   - this.output_height
   *   - this.output_width
   *   - this.output_channelCount
   *   - this.vocabularyIdMax
   *   - this.weightCountPerVocabularyTable_extracted
   *   - this.weightCountPerVocabularyTable
   *   - this.tensorWeightCountExtracted
   *   - this.tensorWeightCountTotal
   *
   */
  static set_inferencedParams_by(
    input_height, input_width, input_channelCount,
    channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId
  ) {
    this.output_height = input_height;
    this.output_width = input_width;
    this.output_channelCount = input_channelCount * channelMultiplier;

    this.vocabularyIdMax = vocabularyCountPerInputChannel - 1; // maximum legal vocabulary id.

    if ( bEmbedVocabularyId )
      this.weightCountPerVocabularyTable_extracted = ( channelMultiplier - 1 ) * vocabularyCountPerInputChannel;
    else
      this.weightCountPerVocabularyTable_extracted = channelMultiplier * vocabularyCountPerInputChannel;

    this.weightCountPerVocabularyTable = channelMultiplier * vocabularyCountPerInputChannel;

    this.tensorWeightCountExtracted = this.weightCountPerVocabularyTable_extracted * input_channelCount;
    this.tensorWeightCountTotal = this.weightCountPerVocabularyTable * input_channelCount;
  }

  /** @override */
  toString() {
    let strDescription = ``
      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width}, `
      + `output_channelCount=${this.output_channelCount}, `
      + `vocabularyIdMax=${this.vocabularyIdMax}, `
      + `weightCountPerVocabularyTable_extracted=${this.weightCountPerVocabularyTable_extracted}, `
      + `weightCountPerVocabularyTable=${this.weightCountPerVocabularyTable}, `
      + `tensorWeightCountExtracted=${this.tensorWeightCountExtracted}, `
      + `tensorWeightCountTotal=${this.tensorWeightCountTotal}`
    ;
    return strDescription;
  }

}