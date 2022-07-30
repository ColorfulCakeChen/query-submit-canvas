export { NeuralNet_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

//!!! ...unfinished... (2022/07/31)
// Is it possible to infer stageCountRequested, blockCountRequested,
// nSqueezeExcitationChannelCountDivisor?

/**
 * All properties inferenced from NeuralNet.Params.
 *
 * @param {number} output_height
 *   The output image's height.
 *
 * @param {number} output_width
 *   The output image's width.
 *
 * @member {number} output_channelCount
 *   The output image's channel count. It is always depending on channelMultiplier and equals to ( inChannels * channelMultiplier ).
 *
 *
 * @see NeuralNet.Params
 */
class NeuralNet_InferencedParams extends Recyclable.Root {

  /**
   * Used as default NeuralNet.InferencedParams provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet.InferencedParams.Pool",
    NeuralNet_InferencedParams, NeuralNet_InferencedParams.setAsConstructor );

  /**
   *
   */
  constructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested, nSqueezeExcitationChannelCountDivisor,
  ) {
    super();
    NeuralNet_InferencedParams.set_inferencedParams_by.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested, nSqueezeExcitationChannelCountDivisor,
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested, nSqueezeExcitationChannelCountDivisor,
  ) {
    super.setAsConstructor();
    NeuralNet_InferencedParams.set_inferencedParams_by.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested, nSqueezeExcitationChannelCountDivisor,
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested, nSqueezeExcitationChannelCountDivisor,
  ) {
    NeuralNet_InferencedParams.set_inferencedParams_by.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested, nSqueezeExcitationChannelCountDivisor,
    );
  }

  /** @override */
  disposeResources() {

 //!!! ...unfinished... (2022/07/31)

    this.bEmbedVocabularyId = undefined;
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
   *   - this.bEmbedVocabularyId
   *
   */
  static set_inferencedParams_by(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested, nSqueezeExcitationChannelCountDivisor,
  ) {

 //!!! ...unfinished... (2022/07/31)
 // Perhaps, use Stage_InferencedParams to find out every stage's output heigh and width.
 // however, need know depthwiseFilterHeight, depthwiseFilterWidth

    this.depthwiseFilterHeight = 3; // Always use ( 3 * 3 ) depthwise filter.
    this.depthwiseFilterWidth = 3;

    this.output_height = input_height;
    this.output_width = input_width;
    this.output_channelCount = input_channelCount * channelMultiplier;

    this.bEmbedVocabularyId = true;
  }

  /** @override */
  toString() {

 //!!! ...unfinished... (2022/07/31)

   let strDescription = ``
      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width}, `
      + `output_channelCount=${this.output_channelCount}, `
      + `bEmbedVocabularyId=${this.bEmbedVocabularyId}, `
    ;
    return strDescription;
  }

}