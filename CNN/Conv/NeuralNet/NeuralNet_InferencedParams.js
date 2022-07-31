export { NeuralNet_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as Stage from "../Stage.js";

//!!! ...unfinished... (2022/07/31)
// Is it possible to infer stageCountRequested, blockCountRequested,

/**
 * All properties inferenced from NeuralNet.Params.
 *
 * @member {boolean} bEmbedVocabularyId
 *   If true, one of embedding channels will be an auto-generated vocabulary id (i.e. 0, 1, 2, ...). So only
 * ( channelMultiplier - 1 ) embedding channels will be extracted from inputWeightArray. The extra vocabulary id
 * channel achieves residual connection. Residual connection means apply_and_destroy_or_keep() will append (concatenate)
 * input to output. Since apply_and_destroy_or_keep()'s input is just vocabulary id (one channel or multiple channels),
 * pre-embedded vocabulary id inside the embedding table acheives the same effect by less computation (but more memory).
 *
 * @member {number} depthwiseFilterHeight
 *   The height of depthwise convolution's filter.
 *
 * @member {number} depthwiseFilterWidth
 *   The width of depthwise convolution's filter.
 *
 * @member {number} nSqueezeExcitationChannelCountDivisor
 *   An integer represents the channel count divisor for block's
 * squeeze-and-excitation's intermediate pointwise convolution channel count.
 * (ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.Xx)
 *
 * @member {number} nActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx)
 * after every convolution.
 *
 * @member {number[]} input_heightArray
 *   The input image's height of every stage.
 *
 * @member {number[]} input_widthArray
 *   The input image's width of every stage.
 *
 * @member {number[]} input_channelCountArray
 *   The input image's channel count of every stage.
 *
 * @member {number[]} output_heightArray
 *   The output image's height of every stage.
 *
 * @member {number[]} output_widthArray
 *   The output image's width of every stage.
 *
 * @member {number[]} output_channelCountArray
 *   The output image's channel count of every stage.
 *
 * @member {number} output_height
 *   The output image's height of this neural network.
 *
 * @member {number} output_width
 *   The output image's width of this neural network.
 *
 * @member {number} output_channelCount
 *   The output image's channel count of this neural network.
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
    NeuralNet_InferencedParams.setAsConstructor_self.call( this,
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
    NeuralNet_InferencedParams.setAsConstructor_self.call( this,
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

    this.height_width_channelCount_array_dispose();

    this.stageCount = undefined; // How many stage should be in the neuralNet.

    this.nSqueezeExcitationChannelCountDivisor = undefined;
    this.nActivationId = undefined;
    this.depthwiseFilterWidth = undefined;
    this.depthwiseFilterHeight = undefined;
    this.bEmbedVocabularyId = undefined;

    super.disposeResources();
  }

  /** Release .xxx_heightArray, .xxx_widthArray, .xxx_channelCountArray */
  height_width_channelCount_array_dispose() {

    if ( this.output_channelCountArray ) {
      this.output_channelCountArray.disposeResources_and_recycleToPool();
      this.output_channelCountArray = null;
    }

    if ( this.output_widthArray ) {
      this.output_widthArray.disposeResources_and_recycleToPool();
      this.output_widthArray = null;
    }

    if ( this.output_heightArray ) {
      this.output_heightArray.disposeResources_and_recycleToPool();
      this.output_heightArray = null;
    }

    if ( this.input_channelCountArray ) {
      this.input_channelCountArray.disposeResources_and_recycleToPool();
      this.input_channelCountArray = null;
    }

    if ( this.input_widthArray ) {
      this.input_widthArray.disposeResources_and_recycleToPool();
      this.input_widthArray = null;
    }

    if ( this.input_heightArray ) {
      this.input_heightArray.disposeResources_and_recycleToPool();
      this.input_heightArray = null;
    }
  }

  /**
   * Determine the following properties:
   *   - this.bEmbedVocabularyId
   *   - this.depthwiseFilterHeight
   *   - this.depthwiseFilterWidth
   *   - this.nActivationId
   *   - this.nSqueezeExcitationChannelCountDivisor
   *   - this.stageCount
   *   - this.input_heightArray
   *   - this.input_widthArray
   *   - this.input_channelCountArray
   *   - this.output_heightArray
   *   - this.output_widthArray
   *   - this.output_channelCountArray
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

    this.bEmbedVocabularyId = true;


//!!! ...unfinished... (2022/07/31) should use NeuralNet_StageParamsCreator_Base to create them.

    this.depthwiseFilterHeight = 3; // Always use ( 3 * 3 ) depthwise filter.
    this.depthwiseFilterWidth = 3;

    // Always use the only suggested activation function.
    this.nActivationId = ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2;

    // Use the suggested squeeze-and-excitation divisor.
    this.nSqueezeExcitationChannelCountDivisor = 16;

    this.stageCount = stageCountRequested; // How many stage should be in the neuralNet.

 //!!! ...unfinished... (2022/07/31)
 // Perhaps, use Stage_InferencedParams to find out every stage's output heigh and width.
 // however, need know depthwiseFilterHeight, depthwiseFilterWidth
    {
      this.height_width_array_dispose();
      this.input_heightArray = Recyclable.Array.Pool.get_or_create_by( this.stageCount );
      this.input_widthArray = Recyclable.Array.Pool.get_or_create_by( this.stageCount );
      this.input_channelCountArray = Recyclable.Array.Pool.get_or_create_by( this.stageCount );
      this.output_heightArray = Recyclable.Array.Pool.get_or_create_by( this.stageCount );
      this.output_widthArray = Recyclable.Array.Pool.get_or_create_by( this.stageCount );
      this.output_channelCountArray = Recyclable.Array.Pool.get_or_create_by( this.stageCount );

      let stage_inferencedParams;

      // stage0
      {
        this.input_heightArray[ 0 ] = input_height;
        this.input_widthArray[ 0 ] = input_width;
        this.input_channelCountArray[ 0 ] = vocabularyChannelCount; // (after embedding)

        stage_inferencedParams = Stage.inferencedParams.Pool.get_or_create_by(
          this.input_heightArray[ i ], this.input_widthArray[ i ],
          nConvStageTypeId,
          blockCountRequested,
          this.depthwiseFilterHeight, this.depthwiseFilterWidth
        );

        this.output_heightArray[ 0 ] = stage_inferencedParams.outputHeight;
        this.output_widthArray[ 0 ] = stage_inferencedParams.outputWidth;
        this.output_channelCountArray[ 0 ] = stage_inferencedParams.outputChannelCount;
      }

      // stage1, 2, 3, ...
      for ( let i = 1; i < this.stageCount; ++i ) {
        this.input_heightArray[ i ] = stage_inferencedParams.outputHeight;
        this.input_widthArray[ i ] = stage_inferencedParams.outputWidth;
        this.input_channelCountArray[ i ] = stage_inferencedParams.outputChannelCount;

        stage_inferencedParams.disposeResources_and_recycleToPool();
        stage_inferencedParams = null;

        stage_inferencedParams = Stage.inferencedParams.Pool.get_or_create_by(
          this.input_heightArray[ i ], this.input_widthArray[ i ],
          nConvStageTypeId,
          blockCountRequested,
          this.depthwiseFilterHeight, this.depthwiseFilterWidth
        );

        this.output_heightArray[ i ] = stage_inferencedParams.outputHeight;
        this.output_widthArray[ i ] = stage_inferencedParams.outputWidth;
        this.output_channelCountArray[ i ] = stage_inferencedParams.outputChannelCount;
      }

      this.output_height = stage_inferencedParams.outputHeight;
      this.output_width = stage_inferencedParams.outputWidth;
      this.output_channelCount = stage_inferencedParams.outputChannelCount;

      stage_inferencedParams.disposeResources_and_recycleToPool();
      stage_inferencedParams = null;
    }

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