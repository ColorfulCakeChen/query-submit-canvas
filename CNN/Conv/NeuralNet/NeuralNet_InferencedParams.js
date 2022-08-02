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
 * @member {Stage.ParamsBase[]} stageParamsArray
 *   The stages parameters of this neural network. It will be created only if
 * ( neuralNetParamsBase.inferencedParams_stageParamsArray_needed() == true ).
 *

!!! ...unfinished... (2022/08/02)

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

    this.bEmbedVocabularyId = true; // Neural network should always have embedding layer.

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

    this.bEmbedVocabularyId = undefined;

    super.disposeResources();
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
      let next_input_height, next_input_width;
      for ( let i = 0; i < this.stageCount; ++i ) { // Stage0, 1, 2, 3, ..., StageLast.

//!!! ...unfinished... (2022/08/02)

        if ( 0 == i ) { // Stage0.
          stageParamsCreator.configTo_beforeStage0();
        } else { // (i.e. block1, 2, 3, ...)
          stageParamsCreator.configTo_beforeStageN_exceptStage0( i, next_input_height, next_input_width );
        }

        // StageLast. (Note: Stage0 may also be StageLast.) 
        //
        // If this is the last block of this stage (i.e. at-stage-end)
        //   - a different depthwise filter size may be used.
        //   - a different activation function may be used after pointwise2 convolution.
        if ( ( this.stageParamsArray.length - 1 ) == i ) {
          stageParamsCreator.configTo_beforeStageLast();
        }

        stageParams = this.stageParamsArray[ i ]
          = stageParamsCreator.create_StageParams( StageParamsClass ); // Create current block.

        if ( !this.channelShuffler ) { // If channelShuffler is got first time, keep it.

          // If channelShuffler is not null, keep it so that its tensors could be released.
          let channelShuffler = stageParamsCreator.channelShuffler;
          if ( channelShuffler ) {

            if ( ( this.channelShuffler ) && ( this.channelShuffler != channelShuffler ) )
              throw Error( `Stage.ParamsBase.stageParamsArray_create(): `
                + `At most, only one (and same) channel shuffler could be used (and shared by all blocks of a stage).` );

            this.channelShuffler = channelShuffler;
            stageParamsCreator.channelShuffler = null; // (Ownership transferred.)

          // If channelShuffler is null, do not use it. Otherwise, the this.channelShuffler
          // will be cleared and could not be used for releasing tensors.
          }

        // If channelShuffler has ever got, never change it.
        }

        stageParams.channelShuffler = this.channelShuffler; // Stage.Params needs channel shuffler info (but does not own it).

        stageParams.inferencedParams_create();

        next_input_height = stageParams.output_height;
        next_input_width = stageParams.output_width;
      }

      this.stageParams0 = this.stageParamsArray[ 0 ]; // Shortcut to the first block.
      this.stageParamsLast = this.stageParamsArray[ this.stageParamsArray.length - 1 ]; // Shortcut to the last block.

      this.outputHeight = this.stageParamsLast.output_height;
      this.outputWidth = this.stageParamsLast.output_width;
      this.outputChannelCount = this.stageParamsLast.output_channelCount;

    } finally {
      if ( stageParamsCreator ) {
        stageParamsCreator.channelShuffler = null; // (Because ownership has been transferred to this Stage object.)
        stageParamsCreator.disposeResources_and_recycleToPool();
        stageParamsCreator = null;
      }
    }
  }

  /**
   * @param {Stage.ParamsBase} stageParams
   *   The Stage.ParamsBase object to be referenced.
   *
   * @return {Base}
   *   Return newly created Stage.StageParamsCreator.Xxx object according to stageParams.nConvStageTypeId.
   */
   static create_StageParamsCreator_byStageParams( stageParams ) {

    if ( stageParams.blockCountRequested < 2 )
      throw Error( `Stage.InferencedParams.Base.create_StageParamsCreator_byStageParams(): `
        + `stageParams.blockCountRequested ( ${stageParams.blockCountRequested} ) must be >= 2.` );

    if ( !(   ( stageParams.nConvStageTypeId >= 0 )
           && ( stageParams.nConvStageTypeId < Stage_InferencedParams.nConvStageTypeId_to_StageParamsCreator_ClassArray.length )
          ) 
       )
      throw Error( `Stage.InferencedParams.create_StageParamsCreator_byStageParams(): `
        + `unknown stageParams.nConvStageTypeId ( ${stageParams.nConvStageTypeId} ) value.`
      );

    let classStageParamsCreator = Stage_InferencedParams.nConvStageTypeId_to_StageParamsCreator_ClassArray[ stageParams.nConvStageTypeId ];
    let aStageParamsCreator = classStageParamsCreator.Pool.get_or_create_by( stageParams );

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


/**
 * Mapping nConvStageTypeId (number as array index) to StageParamsCreator class object.
 */
 Stage_InferencedParams.nConvStageTypeId_to_StageParamsCreator_ClassArray = [
  StageParamsCreator.MobileNetV1,                         // ValueDesc.ConvStageType.Ids.MOBILE_NET_V1 (0)
  StageParamsCreator.MobileNetV1_padValid,                // ValueDesc.ConvStageType.Ids.MOBILE_NET_V1_PAD_VALID (1)
  StageParamsCreator.MobileNetV2_Thin,                    // ValueDesc.ConvStageType.Ids.MOBILE_NET_V2_THIN (2)
  StageParamsCreator.MobileNetV2,                         // ValueDesc.ConvStageType.Ids.MOBILE_NET_V2 (3)
  StageParamsCreator.ShuffleNetV2,                        // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2 (4)
  StageParamsCreator.ShuffleNetV2_ByMobileNetV1,          // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5)
  StageParamsCreator.ShuffleNetV2_ByMobileNetV1_padValid, // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (6)
  StageParamsCreator.ShuffleNetV2_ByPointwise21,          // ValueDesc.ConvStageType.Ids.SHUFFLE_NET_V2_BY_POINTWISE21 (7)
];
