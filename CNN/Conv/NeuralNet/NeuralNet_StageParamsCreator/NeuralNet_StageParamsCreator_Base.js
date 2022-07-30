export { NeuralNet_StageParamsCreator_Base as Base };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as Stage from "../../Stage.js";
import { Params } from "../NeuralNet_Params.js";

/**
 * Base class for all NeuralNet.StageParamsCreator.Xxx classes.
 *
 *
 * @member {number} output0_channelCount
 *   The output0's channel count in current configuration.
 *
 * @member {number} output1_channelCount
 *   The output1's channel count in current configuration.
 *
 */
class NeuralNet_StageParamsCreator_Base extends Recyclable.Root {

  /**
   * Used as default NeuralNet.StageParamsCreator.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet.StageParamsCreator.Base.Pool",
    NeuralNet_StageParamsCreator_Base, NeuralNet_StageParamsCreator_Base.setAsConstructor );

  /**
   * @param {Params} neuralNetParams
   *   The NeuralNet.Params object which provides basic parameters. It will be referenced (i.e. not cloned, not owned, not released)
   * by this NeuralNet.StageParamsCreator.Base onject.
   */
  constructor( neuralNetParams ) {
    super();
    NeuralNet_StageParamsCreator_Base.setAsConstructor_self.call( this, neuralNetParams );
  }

  /** @override */
  static setAsConstructor( neuralNetParams ) {
    super.setAsConstructor();
    NeuralNet_StageParamsCreator_Base.setAsConstructor_self.call( this, neuralNetParams );
    return this;
  }

  /** @override */
  static setAsConstructor_self( neuralNetParams ) {
    this.neuralNetParams = neuralNetParams;
  }

  /** @override */
  disposeResources() {

    this.output_channelCount = undefined;
    this.output_width = undefined;
    this.output_height = undefined;

    this.stageCount = undefined; // How many stage should be in the neuralNet.

    this.bKeepInputTensor = undefined;
    this.nActivationId = undefined;
    this.nSqueezeExcitationChannelCountDivisor = undefined;
    this.bPointwise2ActivatedAtStageEnd = undefined;
    this.depthwiseFilterWidth = undefined;
    this.depthwiseFilterHeight = undefined;
    this.bPointwise1 = undefined;
    this.blockCountRequested = undefined;
    this.nConvStageTypeId = undefined;
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    this.neuralNetParams = undefined; // Just nullify it. Do not release it here.

    super.disposeResources();
  }

  /**
   * Called before stage0 is about to be created.
   */
  configTo_beforeStage0() {
    let neuralNetParams = this.neuralNetParams;

//!!! ...unfinished... (2022/07/30)
    this.input_height = neuralNetParams.input_height;
    this.input_width = neuralNetParams.input_width;
    this.input_channelCount = neuralNetParams.input_channelCount;

    this.bEmbedVocabularyId = true;

    this.nConvStageTypeId = neuralNetParams.nConvStageTypeId;

    this.blockCountRequested = neuralNetParams.blockCountRequested;
    this.bPointwise1 = true; // Always use pointwise1.

    this.depthwiseFilterHeight = 3; // Always use ( 3 * 3 ) depthwise filter.
    this.depthwiseFilterWidth = 3;

    this.bPointwise2ActivatedAtStageEnd = true; // All stages (except stageLast) have activation function.

    // Use the suggested squeeze-and-excitation divisor.
    this.nSqueezeExcitationChannelCountDivisor = 16;

    // Always use the only suggested activation function.
    this.nActivationId = ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2;

//!!!
    // Because NeuralNet always has an embedding layer (in front of stage0),
    // all stages should not keep input tensor (no matter what
    // neuralNetParams.bKeepInputTensor is).
    this.bKeepInputTensor = false;

//!!! ...unfinished... (2022/07/30)
    this.output_height = neuralNetParams.inferencedParams.outputHeightArray[ 0 ];
    this.output_width = neuralNetParams.inferencedParams.outputWidthArray[ 0 ];
    this.output_channelCount = ;
  }

  /**
   * Called before every stage (excluding stage0, including stage1, 2, ...).
   *
   * @param {number} stageIndex
   *   The id (i.e. 1, 2, ...) of the stage which will be created.
   */
  configTo_beforeStageN_exceptStage0( stageIndex ) {
    let neuralNetParams = this.neuralNetParams;

//!!! ...unfinished... (2022/07/30)
    this.input_height = neuralNetParams.inferencedParams.inputHeightArray[ stageIndex ];
    this.input_width = neuralNetParams.inferencedParams.inputWidthArray[ stageIndex ];
    this.input_channelCount = ???;

//!!! ...unfinished... (2022/07/30)
    this.output_height = neuralNetParams.inferencedParams.outputHeightArray[ stageIndex ];
    this.output_width = neuralNetParams.inferencedParams.outputWidthArray[ stageIndex ];
    this.output_channelCount = ;
  }

  /**
   * Called before stageLast is about to be created. Sub-class could override this method to adjust data members.
   */
  configTo_beforeStageLast() {

    // Only the final stage's output does not have activation function.
    this.bPointwise2ActivatedAtStageEnd = false;
  }

  get nConvStageTypeName() {
    return ValueDesc.ConvStageType.Singleton.getName_byId( this.nConvStageTypeId );
  }

  get nSqueezeExcitationChannelCountDivisorName() {
    return ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.getName_byId( this.nSqueezeExcitationChannelCountDivisor );
  }

  get nActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId( this.nActivationId );
  }

  /**
   *
   * @return {Stage.Params}
   *   Create and return a Stage.Params according to this object's current state.
   */
  create_StageParams() {
    let params = Stage.Params.Pool.get_or_create_by(
      this.input0_height, this.input0_width, this.input0_channelCount,
      this.nConvStageTypeId,
      this.blockCountRequested,
      this.bPointwise1,
      this.depthwiseFilterHeight, this.depthwiseFilterWidth,
      this.bPointwise2ActivatedAtStageEnd,
      this.nSqueezeExcitationChannelCountDivisor,
      this.nActivationId,
      this.bKeepInputTensor
    );
    return params;
  }

}
