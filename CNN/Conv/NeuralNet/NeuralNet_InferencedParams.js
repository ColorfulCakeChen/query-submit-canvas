export { NeuralNet_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

//!!! ...unfinished... (2022/07/31)
// Is it possible to infer stageCountRequested, blockCountRequested,

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
    blockCountRequested
  ) {
    super();
    NeuralNet_InferencedParams.set_inferencedParams_by.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested
    );
  }

  /** @override */
  static setAsConstructor(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested
  ) {
    super.setAsConstructor();
    NeuralNet_InferencedParams.set_inferencedParams_by.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested
  ) {
    NeuralNet_InferencedParams.set_inferencedParams_by.call( this,
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageTypeId, stageCountRequested,
      blockCountRequested
    );
  }

  /** @override */
  disposeResources() {

 //!!! ...unfinished... (2022/07/31)

    this.output_channelCount = undefined;
    this.output_width = undefined;
    this.output_height = undefined;

    this.nActivationId = undefined;
    this.nSqueezeExcitationChannelCountDivisor = undefined;
    this.depthwiseFilterWidth = undefined;
    this.depthwiseFilterHeight = undefined;
    this.bEmbedVocabularyId = undefined;

    super.disposeResources();
  }

  /**
   * Determine the following properties:
   *   - this.depthwiseFilterHeight
   *   - this.depthwiseFilterWidth
   *   - this.bEmbedVocabularyId
   *   - this.nActivationId
   *   - this.nSqueezeExcitationChannelCountDivisor
   *   - this.output_height
   *   - this.output_width
   *   - this.output_channelCount
   *
   */
  static set_inferencedParams_by(
    input_height, input_width, input_channelCount,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    nConvStageTypeId, stageCountRequested,
    blockCountRequested
  ) {

 //!!! ...unfinished... (2022/07/31)

    this.depthwiseFilterHeight = 3; // Always use ( 3 * 3 ) depthwise filter.
    this.depthwiseFilterWidth = 3;

    this.bEmbedVocabularyId = true;

    // Always use the only suggested activation function.
    this.nActivationId = ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2;

    // Use the suggested squeeze-and-excitation divisor.
    this.nSqueezeExcitationChannelCountDivisor = 16;

 //!!! ...unfinished... (2022/07/31)
 // Perhaps, use Stage_InferencedParams to find out every stage's output heigh and width.
 // however, need know depthwiseFilterHeight, depthwiseFilterWidth

    this.output_height = input_height;
    this.output_width = input_width;
    this.output_channelCount = input_channelCount * channelMultiplier;

  }

  get nActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId( this.nActivationId );
  }

  get nSqueezeExcitationChannelCountDivisorName() {
    return ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.getName_byId( this.nSqueezeExcitationChannelCountDivisor );
  }

  /** @override */
  toString() {

 //!!! ...unfinished... (2022/07/31)

    let strDescription = ``
      + `bEmbedVocabularyId=${this.bEmbedVocabularyId}, `
      + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      + `depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      + `nActivationName=${this.nActivationName}(${this.nActivationId}), `

      + `nSqueezeExcitationChannelCountDivisorName=`
        + `${this.nSqueezeExcitationChannelCountDivisorName}`
        + `(${this.nSqueezeExcitationChannelCountDivisor}), `

      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width}, `
      + `output_channelCount=${this.output_channelCount}, `
    ;
    return strDescription;
  }

}