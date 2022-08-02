export { NeuralNet_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as StageParamsCreator from "./NeuralNet_StageParamsCreator.js";
import * as Stage from "../Stage.js";

//!!! ...unfinished... (2022/07/31)
// Is it possible to infer stageCountRequested, blockCountRequested?

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
 
//!!! (2022/08/02 Remarked) They are defined in NeuralNet_StageParamsCreator
//  * @member {number} depthwiseFilterHeight
//  *   The height of depthwise convolution's filter.
//  *
//  * @member {number} depthwiseFilterWidth
//  *   The width of depthwise convolution's filter.
//  *
//  * @member {number} nSqueezeExcitationChannelCountDivisor
//  *   An integer represents the channel count divisor for block's
//  * squeeze-and-excitation's intermediate pointwise convolution channel count.
//  * (ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.Xx)
//  *
//  * @member {number} nActivationId
//  *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx)
//  * after every convolution.

 *
 * @member {Stage.ParamsBase[]} stageParamsArray
 *   The stages parameters of this neural network. It will be created only if
 * ( neuralNetParamsBase.inferencedParams_stageParamsArray_needed() == true ).
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
   * @param {NeuralNet.ParamsBase} neuralNetParamsBase
   *   The neural network parameters of this inferenced neural network parameters.
   */
  constructor( neuralNetParamsBase ) {
    super();
    NeuralNet_InferencedParams.setAsConstructor_self.call( this, neuralNetParamsBase );
  }

  /** @override */
  static setAsConstructor( neuralNetParamsBase ) {
    super.setAsConstructor();
    NeuralNet_InferencedParams.setAsConstructor_self.call( this, neuralNetParamsBase );
    return this;
  }

  /** @override */
  static setAsConstructor_self( neuralNetParamsBase ) {
    this.embeddingParams_create( neuralNetParamsBase );
    this.stageParamsArray_create( neuralNetParamsBase );
  }

  /** @override */
  disposeResources() {
    this.output_channelCount = undefined;
    this.output_width = undefined;
    this.output_height = undefined;

    this.stageParamsLast = undefined;
    this.stageParams0 = undefined;

    this.stageParamsArray_dispose();
    this.stageCount = undefined; // How many stage should be in the neuralNet.

    this.embeddingParams_dispose();
    this.bEmbedVocabularyId = undefined;

    super.disposeResources();
  }

  /**
   * 
   */
   embeddingParams_dispose() {
    if ( this.embeddingParams ) {
      this.embeddingParams.disposeResources_and_recycleToPool();
      this.embeddingParams = null;
    }
  }

  /**
   * 
   */
  embeddingParams_create( neuralNetParamsBase ) {
    this.embeddingParams_dispose();

    this.bEmbedVocabularyId = true; // Neural network should always have embedding layer.

    let EmbeddingParamsClass = neuralNetParamsBase.EmbeddingParamsClass_get();
    this.embeddingParams = EmbeddingParamsClass.Pool.get_or_create_by(
      neuralNetParamsBase.input_height,
      neuralNetParamsBase.input_width,
      neuralNetParamsBase.input_channelCount,
      neuralNetParamsBase.vocabularyChannelCount,
      neuralNetParamsBase.vocabularyCountPerInputChannel,
      this.bEmbedVocabularyId,
      neuralNetParamsBase.bKeepInputTensor
    );
  }

  /**
   * 
   */
  stageParamsArray_dispose() {
    if ( this.stageParamsArray ) {
      this.stageParamsArray.disposeResources_and_recycleToPool();
      this.stageParamsArray = null;
    }
  }

  /**
   * 
   */
  stageParamsArray_create( neuralNetParamsBase ) {
    if ( this.stageParamsArray ) {
      this.stageParamsArray.clear(); // (Re-used if exists.)
    } else {
      this.stageParamsArray = Recyclable.OwnerArray.Pool.get_or_create_by(); // Note: OwnerArray can not accept length as parameter.
    }

    if ( !neuralNetParamsBase.inferencedParams_stageParamsArray_needed() )
      return; // No need to create stageParamsArray.

    let stageParamsCreator;
    try {
      let StageParamsClass = neuralNetParamsBase.StageParamsClass_get();

      // Create every stage.
      stageParamsCreator = NeuralNet_InferencedParams.create_StageParamsCreator_byNeuralNetParams( neuralNetParamsBase );

      this.stageCount = stageParamsCreator.stageCount;
      this.stageParamsArray.length = this.stageCount;

      let stageParams;
      let next_input_height, next_input_width, next_input_channelCount;
      for ( let i = 0; i < this.stageCount; ++i ) { // Stage0, 1, 2, 3, ..., StageLast.

        if ( 0 == i ) { // Stage0.
          stageParamsCreator.configTo_beforeStage0();
        } else { // (i.e. stage1, 2, 3, ...)
          stageParamsCreator.configTo_beforeStageN_exceptStage0(
            i, next_input_height, next_input_width, next_input_channelCount );
        }

        // StageLast. (Note: Stage0 may also be StageLast.) 
        if ( ( this.stageParamsArray.length - 1 ) == i ) {
          stageParamsCreator.configTo_beforeStageLast();
        }

        stageParams = this.stageParamsArray[ i ]
          = stageParamsCreator.create_StageParams( StageParamsClass ); // Create current stage.

        stageParams.inferencedParams_create();

        next_input_height = stageParams.inferencedParasm.output_height;
        next_input_width = stageParams.inferencedParasm.output_width;
        next_input_channelCount = stageParams.inferencedParasm.output_channelCount;
      }

      this.stageParams0 = this.stageParamsArray[ 0 ]; // Shortcut to the first stage.
      this.stageParamsLast = this.stageParamsArray[ this.stageParamsArray.length - 1 ]; // Shortcut to the last stage.

      this.output_height = this.stageParamsLast.inferencedParasm.output_height;
      this.output_width = this.stageParamsLast.inferencedParasm.output_width;
      this.output_channelCount = this.stageParamsLast.inferencedParasm.output_channelCount;

    } finally {
      if ( stageParamsCreator ) {
        stageParamsCreator.channelShuffler = null; // (Because ownership has been transferred to this Stage object.)
        stageParamsCreator.disposeResources_and_recycleToPool();
        stageParamsCreator = null;
      }
    }
  }

  /**
   * @param {NeuralNet.ParamsBase} neuralNetParams
   *   The NeuralNet.ParamsBase object to be referenced.
   *
   * @return {NeuralNet.StageParamsCreator.Base}
   *   Return newly created NeuralNet.StageParamsCreator.Xxx object according to neuralNetParams.nConvStageTypeId.
   */
   static create_StageParamsCreator_byNeuralNetParams( neuralNetParams ) {

    if ( neuralNetParams.stageCountRequested < 1 )
      throw Error( `NeuralNet.InferencedParams.Base.create_StageParamsCreator_byNeuralNetParams(): `
        + `neuralNetParams.stageCountRequested ( ${neuralNetParams.stageCountRequested} ) must be >= 1.` );

    // Currently, only one kind of NeuralNet.StageParamsCreator could be used.
    let aStageParamsCreator = NeuralNet.StageParamsCreator.Base.Pool.get_or_create_by( neuralNetParams );

    return aStageParamsCreator;
  }

  get nActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId( this.nActivationId );
  }

  get nSqueezeExcitationChannelCountDivisorName() {
    return ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.getName_byId( this.nSqueezeExcitationChannelCountDivisor );
  }

  /** @override */
  toString() {
    let str = ``
      + `bEmbedVocabularyId=${this.bEmbedVocabularyId}, `
      + `stageCount=${this.stageCount}, `

//!!! (2022/08/02 Remarked) They are defined in NeuralNet_StageParamsCreator
      // + `depthwiseFilterHeight=${this.depthwiseFilterHeight}, `
      // + `depthwiseFilterWidth=${this.depthwiseFilterWidth}, `
      // + `nActivationName=${this.nActivationName}(${this.nActivationId}), `

      // + `nSqueezeExcitationChannelCountDivisorName=`
      //   + `${this.nSqueezeExcitationChannelCountDivisorName}`
      //   + `(${this.nSqueezeExcitationChannelCountDivisor}), `

      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width}, `
      + `output_channelCount=${this.output_channelCount}, `
    ;
    return str;
  }

}

