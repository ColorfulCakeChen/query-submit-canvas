export { NeuralNet_InferencedParams as InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Block from "../Block.js";
import * as StageParamsCreator from "./NeuralNet_StageParamsCreator.js";

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
 * @member {Stage.ParamsBase[]} stageParamsArray
 *   The stages parameters of this neural network. It will be created only if
 * ( neuralNetParamsBase.inferencedParams_embeddingParams_stageParamsArray_needed() == true ).
 *
 * @member {Block.ParamsBase} blockFinalParams
 *   The final block's of this neural network. It will be created only if
 * ( neuralNetParamsBase.inferencedParams_embeddingParams_stageParamsArray_needed() == true ).
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
    this.blockFinalParams_create( neuralNetParamsBase );
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

    if ( !neuralNetParamsBase.inferencedParams_embeddingParams_stageParamsArray_needed() )
      return; // No need to create .embeddingParams.

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

    if ( !neuralNetParamsBase.inferencedParams_embeddingParams_stageParamsArray_needed() )
      return; // No need to create .stageParamsArray.

    let stageParamsCreator;
    try {
      let StageParamsClass = neuralNetParamsBase.StageParamsClass_get();

      // Create every stage.
      stageParamsCreator = NeuralNet_InferencedParams.create_StageParamsCreator_byNeuralNetParams( neuralNetParamsBase );
      stageParamsCreator.determine_stageCount();

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

        next_input_height = stageParams.inferencedParams.output_height;
        next_input_width = stageParams.inferencedParams.output_width;
        next_input_channelCount = stageParams.inferencedParams.output_channelCount;
      }

      this.stageParams0 = this.stageParamsArray[ 0 ]; // Shortcut to the first stage.
      this.stageParamsLast = this.stageParamsArray[ this.stageParamsArray.length - 1 ]; // Shortcut to the last stage.

      this.stageLast_output_height = this.stageParamsLast.inferencedParams.output_height;
      this.stageLast_output_width = this.stageParamsLast.inferencedParams.output_width;
      this.stageLast_output_channelCount = this.stageParamsLast.inferencedParams.output_channelCount;

    } finally {
      if ( stageParamsCreator ) {
        stageParamsCreator.channelShuffler = null; // (Because ownership has been transferred to this Stage object.)
        stageParamsCreator.disposeResources_and_recycleToPool();
        stageParamsCreator = null;
      }
    }
  }

  /** */
  blockFinalParams_dispose() {
    if ( this.blockFinalParams ) {
      this.blockFinalParams.disposeResources_and_recycleToPool();
      this.blockFinalParams = null;
    }
  }

  /** */
  blockFinalParams_create( neuralNetParamsBase ) {
    this.blockFinalParams_dispose();

    if ( !neuralNetParamsBase.inferencedParams_embeddingParams_stageParamsArray_needed() )
      return; // No need to create .stageParamsArray.

    const input0_height = this.stageLast_output_height;
    const input0_width = this.stageLast_output_width;
    const input0_channelCount = this.stageLast_output_channelCount;
    const nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL; // (Always MobileNetV1)
    const pointwise1ChannelCount = this.stageLast_output_channelCount; // (No expanding)
    const depthwise_AvgMax_Or_ChannelMultiplier = ValueDesc.AvgMax_Or_ChannelMultiplierSingleton.Ids.AVG; // (Always global average pooling)
    const depthwiseFilterHeight = this.stageLast_output_height; // (global average pooling)
    const depthwiseFilterWidth = this.stageLast_output_width; // (global average pooling)
    const depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID; // (global average pooling)
    const depthwiseActivationId = neuralNetParamsBase.???;
    const pointwise20ChannelCount = neuralNetParamsBase.output_channelCount;
    const pointwise20ActivationId = ???;
    const nSqueezeExcitationChannelCountDivisor = ???;
    const bSqueezeExcitationPrefix = ???
    const nActivationId = ???;
    const bKeepInputTensor = false; // (Always destroy input because there is stageLast always in front of blockFinal.)

    this.blockFinalParams = Block.ParamsBase.Pool.get_or_create_by(
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId,
      bKeepInputTensor
    );

    this.output_height = this.blockFinalParams.output_height; // (should be 1.)
    this.output_width = this.blockFinalParams.output_width; // (should be 1.)
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
    let aStageParamsCreator = StageParamsCreator.Base.Pool.get_or_create_by( neuralNetParams );

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
      + `stageLast_output_height=${this.stageLast_output_height}, `
      + `stageLast_output_width=${this.stageLast_output_width}, `
      + `stageLast_output_channelCount=${this.stageLast_output_channelCount}, `
      + `output_height=${this.output_height}, `
      + `output_width=${this.output_width} `
    ;
    return str;
  }

}

