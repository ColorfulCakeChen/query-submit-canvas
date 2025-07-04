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
   * Used as default NeuralNet.StageParamsCreator.Base provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralNet.StageParamsCreator.Base.Pool",
    NeuralNet_StageParamsCreator_Base );

  /**
   * @param {Params} neuralNetParams
   *   The NeuralNet.Params object which provides basic parameters. It will be
   * referenced (i.e. not cloned, not owned, not released) by this
   * NeuralNet.StageParamsCreator.Base onject.
   */
  constructor( neuralNetParams ) {
    super();
    this.#setAsConstructor_self.call( neuralNetParams );
  }

  /** @override */
  setAsConstructor( neuralNetParams ) {
    super.setAsConstructor();
    this.#setAsConstructor_self.call( neuralNetParams );
  }

  /**  */
  #setAsConstructor_self( neuralNetParams ) {
    this.neuralNetParams = neuralNetParams;
  }

  /** @override */
  disposeResources() {
    this.blockFinalParams_dispose();

    this.bTableLog = undefined;
    this.bKeepInputTensor = undefined;
    this.nActivationId = undefined;
    this.nSqueezeExcitationChannelCountDivisor = undefined;
    this.depthwiseFilterWidth = undefined;
    this.depthwiseFilterHeight = undefined;
    this.bPointwise1 = undefined;
    this.blockCountPerStage = undefined;
    this.nConvStageTypeId = undefined;
    this.input_channelCount = undefined;
    this.input_width = undefined;
    this.input_height = undefined;

    this.stageCount = undefined; // How many stage should be in the neuralNet.

    // Just nullify it. Do not release it here.
    this.neuralNetParams = undefined;

    super.disposeResources();
  }

  /** */
  blockFinalParams_dispose() {
    if ( this.blockFinalParams ) {
      this.blockFinalParams.disposeResources_and_recycleToPool();
      this.blockFinalParams = null;
    }
  }

  /** Called to determine stageCount and blockCountPerStage.
    *
    * Sub-class could override this method to adjust data members.
   *
   * @param {number} input_height
   *   The input height of the stage0 which will be created. If null or
   * undefined, the .neuralNetParams.inferencedParams.input_height will be
   * used instead.
   *
   * @param {number} input_width
   *   The input width of the stage0 which will be created. If null or
   * undefined, the .neuralNetParams.inferencedParams.input_width will be
   * used instead.
   *
   * @param {number} input_channelCount
   *   The input channel count of the stage0 which will be created. If null or
   * undefined, the .neuralNetParams.inferencedParams.input_channelCount will
   * be used instead.
    */
  determine_stageCount_blockCountPerStage(
    input_height, input_width, input_channelCount ) {

    let neuralNetParams = this.neuralNetParams;

    {
      if ( input_height == undefined )
        input_height = neuralNetParams.inferencedParams.input_height;

      if ( input_width == undefined )
        input_width = neuralNetParams.inferencedParams.input_width;

      if ( input_channelCount == undefined )
        input_channelCount
          = neuralNetParams.inferencedParams.input_channelCount;
    }

    // 1. stageCount
    //
    // Because every stage will double output channel count, find out
    // stageCount so that the stageLast's output channel count is (a little)
    // larger than the requested output_channelCount.
    {
      let embedding_output_channelCount
        = input_channelCount * neuralNetParams.vocabularyChannelCount;

      let expandFactor = Math.ceil(
        neuralNetParams.output_channelCount / embedding_output_channelCount );

      this.stageCount = Math.max(
        1, // (at least, one stage.)
        Math.ceil( Math.log2( expandFactor ) )
      );
    }

    // 2. blockCountPerStage
    //
    // Average total block count to every stage.
    {
      this.blockCountPerStage = Math.max(
        2, // (at least, two blocks (i.e. blockFirst and blockLast) per stage.)
        Math.ceil( neuralNetParams.blockCountTotalRequested / this.stageCount )
      );
    }
  }

  /**
   * Called before stage0 is about to be created.
   *
   * @param {number} input_height
   *   The input height of the stage0 which will be created. If null or
   * undefined, the .neuralNetParams.inferencedParams.input_height will be
   * used instead.
   *
   * @param {number} input_width
   *   The input width of the stage0 which will be created. If null or
   * undefined, the .neuralNetParams.inferencedParams.input_width will be
   * used instead.
   *
   * @param {number} input_channelCount
   *   The input channel count of the stage0 which will be created. If null or
   * undefined, the .neuralNetParams.inferencedParams.input_channelCount will
   * be used instead.
   */
  configTo_beforeStage0( input_height, input_width, input_channelCount ) {
    const neuralNetParams = this.neuralNetParams;

    {
      if ( input_height == undefined )
        input_height = neuralNetParams.inferencedParams.input_height;

      if ( input_width == undefined )
        input_width = neuralNetParams.inferencedParams.input_width;

      if ( input_channelCount == undefined )
        input_channelCount
          = neuralNetParams.inferencedParams.input_channelCount;
    }

    this.input_height = input_height;
    this.input_width = input_width;

    // The channel count is expanded by prefix embedding layer.
    this.input_channelCount
      = input_channelCount * neuralNetParams.vocabularyChannelCount;

    this.nConvStageTypeId = neuralNetParams.nConvStageTypeId;

    this.bPointwise1 = true; // Always use pointwise1.

    this.depthwiseFilterHeight = 3; // Always use ( 3 * 3 ) depthwise filter.
    this.depthwiseFilterWidth = 3;

    // Use the MobileNetV3 suggested squeeze-and-excitation divisor.
    this.nSqueezeExcitationChannelCountDivisor = 4;

    // Always use the only suggested activation function.
    this.nActivationId
      = ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2;

    // Because NeuralNet always has an embedding layer (in front of stage0),
    // all stages should not keep input tensor (no matter what
    // neuralNetParams.bKeepInputTensor is).
    this.bKeepInputTensor = false;

    this.bTableLog = neuralNetParams.bTableLog;
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
   *   The input channel count of the stage which will be created.
   */
  configTo_beforeStageN_exceptStage0(
    stageIndex, input_height, input_width, input_channelCount ) {

    //let neuralNetParams = this.neuralNetParams;

    this.input_height = input_height;
    this.input_width = input_width;
    this.input_channelCount = input_channelCount;
  }

  /**
   * Called before stageLast is about to be created. Sub-class could override
   * this method to adjust data members.
   */
  configTo_beforeStageLast() {
  }

  /**
   * Called before blockFinal is about to be created. It will create
   * .blockFinalParams.
   *
   * Sub-class could override this method to adjust data members.
   *
   * @param {Block.ParamsBase|Block.Params} BlockParamsClass
   *   Which kinds of block parameters object should be created.
   *
   * @param {number} input_height
   *   The input height of the blockFinal.
   *
   * @param {number} input_width
   *   The input width of the blockFinal.
   *
   * @param {number} input_channelCount
   *   The input channel counr of the blockFinal.
   */
  configTo_beforeBlockFinal(
    BlockParamsClass,
    input_height, input_width, input_channelCount ) {

    const neuralNetParams = this.neuralNetParams;

    const input0_height = input_height;
    const input0_width = input_width;
    const input0_channelCount = input_channelCount;

    // Final block uses general pointwise-depthwise-pointwise (i.e.
    // MobileNetV1).
    const nConvBlockTypeId
      = ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL;

    const pointwise1ChannelCount = input_channelCount; // (No expanding)

    // (Always global average pooling)
    const depthwise_AvgMax_Or_ChannelMultiplier
      = ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG;

    const depthwiseFilterHeight = input_height; // (global average pooling)
    const depthwiseFilterWidth = input_width; // (global average pooling)

    const depthwiseStridesPad // (global average pooling)
      = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID;

    const depthwiseActivationId = this.nActivationId;

    // pointwise20 uses the requested output channel count.
    const pointwise20ChannelCount = neuralNetParams.output_channelCount;

    // pointwise20 always has no activation function, so that any number could
    // be generated.
    const pointwise20ActivationId
      = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

    const nSqueezeExcitationChannelCountDivisor
      = this.nSqueezeExcitationChannelCountDivisor;

    // Final block is non-MobileNetV2 (in fact, is MobileNetV1). So, it always
    // uses postfix squeeze-and-excitation.
    const bSqueezeExcitationPrefix = false;

    const nActivationId = this.nActivationId;

    // Final block always disposes input because there is always a stageLast in
    // front of it to be responsible for keep-input-tensor (if needs).
    const bKeepInputTensor = false;

    const bTableLog = neuralNetParams.bTableLog;


    this.blockFinalParams_dispose();
    this.blockFinalParams = BlockParamsClass.Pool.get_or_create_by(
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier,
      depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount, pointwise20ActivationId,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
      nActivationId,
      bKeepInputTensor,
      bTableLog
    );
  }

  // The following read only properties is useful when debugging, although they
  // are not used in program.

  get nConvStageTypeName() {
    return ValueDesc.ConvStageType.Singleton.getName_byId(
      this.nConvStageTypeId );
  }

  get nSqueezeExcitationChannelCountDivisorName() {
    return ( ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton
      .getName_byId( this.nSqueezeExcitationChannelCountDivisor ) );
  }

  get nActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId(
      this.nActivationId );
  }

  /**
   *
   * @param {Stage.ParamsBase|Stage.Params} StageParamsClass
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
      this.blockCountPerStage,
      this.bPointwise1,
      this.depthwiseFilterHeight, this.depthwiseFilterWidth,
      this.nSqueezeExcitationChannelCountDivisor,
      this.nActivationId,
      this.bKeepInputTensor,
      this.bTableLog
    );
    return params;
  }

}
