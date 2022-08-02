export { NeuralNet_StageParamsCreator_Base as Base };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as Stage from "../../Stage.js";
//import { Params } from "../NeuralNet_Params.js";

/**
 * Base class for all NeuralNet.StageParamsCreator.Xxx classes.
 *
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

    this.stageCount = undefined; // How many stage should be in the neuralNet.

    this.neuralNetParams = undefined; // Just nullify it. Do not release it here.

    super.disposeResources();
  }

  /** Called to determine stageCount.
    *
    * Sub-class could override this method to adjust data members.
    */
  determine_stageCount() {
    let neuralNetParams = this.neuralNetParams;

    this.stageCount = neuralNetParams.stageCountRequested; // By default, the stage count is just the requested original stage count.
  }

  /**
   * Called before stage0 is about to be created.
   */
  configTo_beforeStage0() {
    let neuralNetParams = this.neuralNetParams;

    this.input_height = neuralNetParams.input_height;
    this.input_width = neuralNetParams.input_width;

    // The channel count is expanded by prefix embedding layer.
    this.input_channelCount
      = neuralNetParams.input_channelCount * neuralNetParams.vocabularyChannelCount;

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

    // Because NeuralNet always has an embedding layer (in front of stage0),
    // all stages should not keep input tensor (no matter what
    // neuralNetParams.bKeepInputTensor is).
    this.bKeepInputTensor = false;
  }

  /**
   * Called before every stage (excluding stage0, including stage1, 2, ...).
   *
   * @param {number} stageIndex
   *   The id (i.e. 1, 2, ...) of the stage which will be created.
   *
   * @param {number} input_height
   *   The input height of the stage which will be created.
   *
   * @param {number} input_width
   *   The input width of the stage which will be created.
   *
   * @param {number} input_channelCount
   *   The input channel counr of the stage which will be created.
   */
  configTo_beforeStageN_exceptStage0(
    stageIndex, input_height, input_width, input_channelCount ) {

    //let neuralNetParams = this.neuralNetParams;

    this.input_height = input_height;
    this.input_width = input_width;
    this.input_channelCount = input_channelCount;
  }

  /**
   * Called before stageLast is about to be created. Sub-class could override this method to adjust data members.
   */
  configTo_beforeStageLast() {

    // Only the final stage's output does not have activation function.
    this.bPointwise2ActivatedAtStageEnd = false;
  }

  // The following read only properties is useful when debugging, although they
  // are not used in program.

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
   * @paramm {Stage.ParamsBase|Stage.Params} StageParamsClass
   *   Which kinds of stage parameters object should be created.
   *
   * @return {Stage.ParamsBase|Stage.Params}
   *   Create and return a Stage.ParamsBase or Stage.Params according to this
   * object's current state.
   */
  create_StageParams( StageParamsClass ) {
    let params = StageParamsClass.Pool.get_or_create_by(
      this.input_height, this.input_width, this.input_channelCount,
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
