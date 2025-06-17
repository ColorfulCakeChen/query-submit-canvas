export { NeuralNet_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Block from "../Block.js";
import * as StageParamsCreator from "./NeuralNet_StageParamsCreator.js";

import { FeedbackShape as NeuralNet_FeedbackShape }
  from "./NeuralNet_FeedbackShape.js";

/**
 * All properties inferenced from NeuralNet.Params.
 *
 * @member {boolean} bEmbedVocabularyId
 *   If true, one of embedding channels will be an auto-generated vocabulary id
 * (i.e. 0, 1, 2, ...). So only ( channelMultiplier - 1 ) embedding channels
 * will be extracted from inputWeightArray. The extra vocabulary id channel
 * achieves residual connection. Residual connection means
 * apply_and_destroy_or_keep() will append (concatenate) input to output. Since
 * apply_and_destroy_or_keep()'s input is just vocabulary id (one channel or
 * multiple channels), pre-embedded vocabulary id inside the embedding table
 * acheives the same effect by less computation (but more memory).
 *
 * @member {number} stageCount
 *   How many stages inside this neural network. It is ( >= 1 ). Every stage
 * will halve height, halve width, double channel count.
 *
 * @member {number} blockCountPerStage
 *   How many blocks inside every stage. It is ( >= 2 ).
 *
 * @member {number} blockCountTotal
 *   How many blocks in the whole neural network.
 * (= ( stageCount * blockCountPerStage ) ). It is greater than or equal to
 * blockCountTotalRequested.
 *
 * @member {Stage.ParamsBase[]} stageParamsArray
 *   The stages parameters of this neural network. It will be created only if
 * ( neuralNetParamsBase.inferencedParams_embeddingParams_stageParamsArray_needed()
 * == true ).
 *
 * @member {Block.ParamsBase} blockFinalParams
 *   The parameter of this neural network's final block (for squish output
 * shape to [ 1, 1, output_channelCount ]. It will be created only if
 * ( neuralNetParamsBase.inferencedParams_embeddingParams_stageParamsArray_needed()
 * == true ).
 *
 * @member {number} stageLast_output_height
 *   The stageLast's output image's height of this neural network.
 *
 * @member {number} stageLast_output_width
 *   The stageLast's output image's width of this neural network.
 *
 * @member {number} stageLast_output_channelCount
 *   The stageLast's image's channel count of this neural network.
 *
 * @member {number} output_height
 *   The output image's height of this neural network. It should always be 1.
 *
 * @member {number} output_width
 *   The output image's width of this neural network. It should always be 1.
 *
 * @member {NeuralNet.FeedbackShape} feedbackShape
 *   The shape of for feedback neural network's previous output to next input.
 * It exists only if ( neuralNetParamsBase.has_implicit_input == true ).
 *
 * @see NeuralNet.Params
 */
class NeuralNet_InferencedParams extends Recyclable.Root {

  /**
   * Used as default NeuralNet.InferencedParams provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet.InferencedParams.Pool",
    NeuralNet_InferencedParams,
    NeuralNet_InferencedParams.setAsConstructor );

  /**
   *
   * @param {NeuralNet.ParamsBase} neuralNetParamsBase
   *   The neural network parameters of this inferenced neural network
   * parameters.
   */
  constructor( neuralNetParamsBase ) {
    super();
    this.#setAsConstructor_self( neuralNetParamsBase );
  }

  /** @override */
  setAsConstructor( neuralNetParamsBase ) {
    super.setAsConstructor();
    this.#setAsConstructor_self( neuralNetParamsBase );
  }

  /** @override */
  #setAsConstructor_self( neuralNetParamsBase ) {
    this.inputShape_create( neuralNetParamsBase );
    this.embeddingParams_create( neuralNetParamsBase );
    this.stageParamsArray_blockFinalParams_create( neuralNetParamsBase );
  }

  /** @override */
  disposeResources() {
    this.output_width = undefined;
    this.output_height = undefined;

    this.stageLast_output_channelCount = undefined;
    this.stageLast_output_width = undefined;
    this.stageLast_output_height = undefined;

    this.blockFinalParams_dispose();

    this.stageParamsLast = undefined;
    this.stageParams0 = undefined;

    this.blockCountTotal = undefined;
    this.blockCountPerStage = undefined;

    this.stageParamsArray_dispose();
    this.stageCount = undefined; // How many stage should be in the neuralNet.

    this.embeddingParams_dispose();
    this.bEmbedVocabularyId = undefined;

    this.inputShape_dispose();

    super.disposeResources();
  }

  /**
   * 
   */
  inputShape_dispose() {
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    this.implicit_input_channelCount = undefined;
    this.implicit_input_width = undefined;
    this.implicit_input_height = undefined;

    this.feedbackShape = undefined;
  }

  /**
   * 
   */
  inputShape_create( neuralNetParamsBase ) {
    this.inputShape_dispose();

    if ( neuralNetParamsBase.has_implicit_input ) {

      if ( !this.feedbackShape )
        this.feedbackShape = new NeuralNet_FeedbackShape();

      this.feedbackShape.init(
        neuralNetParamsBase.explicit_input_height,
        neuralNetParamsBase.explicit_input_width,
        neuralNetParamsBase.explicit_input_channelCount,
        neuralNetParamsBase.output_channelCount // feedback_valueCount
      );

      this.implicit_input_height = this.feedbackShape.implicit_input_height;
      this.implicit_input_width = this.feedbackShape.implicit_input_width;
      this.implicit_input_channelCount
        = this.feedbackShape.implicit_input_channelCount;

      this.input_height = this.feedbackShape.input_height;
      this.input_width = this.feedbackShape.input_width;
      this.input_channelCount = this.feedbackShape.input_channelCount;

    } else {
      this.feedbackShape = undefined;

      // height and channelCount are always the same as explicit_Xxx.
      this.implicit_input_height
        = neuralNetParamsBase.explicit_input_height;

      this.implicit_input_width = 0;

      this.implicit_input_channelCount
        = neuralNetParamsBase.explicit_input_channelCount;

      // height and channelCount are always the same as explicit_Xxx.
      this.input_height
        = neuralNetParamsBase.explicit_input_height;

      this.input_width
        = neuralNetParamsBase.explicit_input_width;

      this.input_channelCount
        = neuralNetParamsBase.explicit_input_channelCount;
    }
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

    // Neural network should always have embedding layer.
    this.bEmbedVocabularyId = true;

    if ( !neuralNetParamsBase
           .inferencedParams_embeddingParams_stageParamsArray_needed() )
      return; // No need to create .embeddingParams.

    let EmbeddingParamsClass = neuralNetParamsBase.EmbeddingParamsClass_get();
    this.embeddingParams = EmbeddingParamsClass.Pool.get_or_create_by(
      this.input_height, this.input_width, this.input_channelCount,
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

  /** */
  blockFinalParams_dispose() {
    if ( this.blockFinalParams ) {
      this.blockFinalParams.disposeResources_and_recycleToPool();
      this.blockFinalParams = null;
    }
  }

  /**
   * (Also create blockFinalParams.)
   */
  stageParamsArray_blockFinalParams_create( neuralNetParamsBase ) {
    if ( this.stageParamsArray ) {
      this.stageParamsArray.clear(); // (Re-used if exists.)
    } else {
      // Note: OwnerArray can not accept length as parameter.
      this.stageParamsArray = Recyclable.OwnerArray.Pool.get_or_create_by();
    }

    this.blockFinalParams_dispose();

    if ( !neuralNetParamsBase
           .inferencedParams_embeddingParams_stageParamsArray_needed() )
      return; // No need to create .stageParamsArray.

    let stageParamsCreator;
    try {
      let StageParamsClass = neuralNetParamsBase.StageParamsClass_get();

      // Create every stage.
      stageParamsCreator = NeuralNet_InferencedParams
        .create_StageParamsCreator_byNeuralNetParams( neuralNetParamsBase );

      // Note: Because this inferencedParams is still creating, the input
      //       shape can not be extracted by stageParamsCreator automatically.
      //       So, pass them obviously.
      stageParamsCreator.determine_stageCount_blockCountPerStage(
        this.input_height, this.input_width, this.input_channelCount );

      this.stageCount = stageParamsCreator.stageCount;
      this.stageParamsArray.length = this.stageCount;

      this.blockCountPerStage = stageParamsCreator.blockCountPerStage;
      this.blockCountTotal = this.stageCount * this.blockCountPerStage;

      let stageParams;
      let next_input_height, next_input_width, next_input_channelCount;

      // Stage0, 1, 2, 3, ..., StageLast.
      for ( let i = 0; i < this.stageCount; ++i ) {

        if ( 0 == i ) { // Stage0.

          // Note: Because this inferencedParams is still creating, the input
          //       shape can not be extracted by stageParamsCreator
          //       automatically. So, pass them obviously.
          stageParamsCreator.configTo_beforeStage0(
            this.input_height, this.input_width, this.input_channelCount );

        } else { // (i.e. stage1, 2, 3, ...)
          stageParamsCreator.configTo_beforeStageN_exceptStage0(
            i, next_input_height, next_input_width, next_input_channelCount );
        }

        // StageLast. (Note: Stage0 may also be StageLast.) 
        if ( ( this.stageParamsArray.length - 1 ) == i ) {
          stageParamsCreator.configTo_beforeStageLast();
        }

        // Create current stage.
        stageParams = this.stageParamsArray[ i ]
          = stageParamsCreator.create_StageParams( StageParamsClass );

        stageParams.inferencedParams_create();

        next_input_height = stageParams.inferencedParams.output_height;
        next_input_width = stageParams.inferencedParams.output_width;
        next_input_channelCount
          = stageParams.inferencedParams.output_channelCount;
      }

      // Shortcut to the first stage.
      this.stageParams0 = this.stageParamsArray[ 0 ];

      // Shortcut to the last stage.
      this.stageParamsLast
        = this.stageParamsArray[ this.stageParamsArray.length - 1 ];

      this.stageLast_output_height
        = this.stageParamsLast.inferencedParams.output_height;

      this.stageLast_output_width
        = this.stageParamsLast.inferencedParams.output_width;

      this.stageLast_output_channelCount
        = this.stageParamsLast.inferencedParams.output_channelCount;

      // BlockFinal
      {
        let BlockParamsClass = neuralNetParamsBase.BlockParamsClass_get();

        stageParamsCreator.configTo_beforeBlockFinal(
          BlockParamsClass,
          this.stageLast_output_height,
          this.stageLast_output_width,
          this.stageLast_output_channelCount );

        this.blockFinalParams = stageParamsCreator.blockFinalParams;

        // (Because ownship has transferrred.)
        stageParamsCreator.blockFinalParams = null;

        this.blockFinalParams.inferencedParams_create();

        this.output_height
          = this.blockFinalParams.output_height; // (should be 1.)
        this.output_width
          = this.blockFinalParams.output_width; // (should be 1.)
      }

    } finally {
      if ( stageParamsCreator ) {
        // (Because ownership has been transferred to this Stage object.)        
        stageParamsCreator.channelShuffler = null;
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
   *   Return newly created NeuralNet.StageParamsCreator.Xxx object according
   * to neuralNetParams.nConvStageTypeId.
   */
  static create_StageParamsCreator_byNeuralNetParams( neuralNetParams ) {

    // Currently, only one kind of NeuralNet.StageParamsCreator could be used.
    let aStageParamsCreator = StageParamsCreator.Base.Pool.get_or_create_by(
      neuralNetParams );

    return aStageParamsCreator;
  }

  get nActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId(
      this.nActivationId );
  }

  get nSqueezeExcitationChannelCountDivisorName() {
    return ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton
      .getName_byId( this.nSqueezeExcitationChannelCountDivisor );
  }

  /** @override */
  toString() {
    let str = `feedbackShape={ ${this.feedbackShape} }, `

      + `implicit_input_height=${this.implicit_input_height}, `
      + `implicit_input_width=${this.implicit_input_width}, `
      + `implicit_input_channelCount=${this.implicit_input_channelCount}, `

      + `input_height=${this.input_height}, `
      + `input_width=${this.input_width}, `
      + `input_channelCount=${this.input_channelCount}, `

      + `bEmbedVocabularyId=${this.bEmbedVocabularyId}, `
      + `stageCount=${this.stageCount}, `
      + `blockCountPerStage=${this.blockCountPerStage}, `
      + `blockCountTotal=${this.blockCountTotal}, `
      + `stageLast_output_height=${this.stageLast_output_height}, `
      + `stageLast_output_width=${this.stageLast_output_width}, `
      + `stageLast_output_channelCount=${this.stageLast_output_channelCount}, `
      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width}`
      ;
    return str;
  }

}
