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

    this.stageCount = undefined; // How many stage should be in the neuralNet.

    this.output0_channelCount = undefined;
    this.output1_channelCount = undefined;

    this.bKeepInputTensor = undefined;
    this.nActivationId = undefined;
    this.nSqueezeExcitationChannelCountDivisor = undefined;
    this.bPointwise2ActivatedAtStageEnd = undefined;
    this.depthwiseFilterWidth = undefined;
    this.depthwiseFilterHeight = undefined;
    this.bPointwise1 = undefined;
    this.blockCountRequested = undefined;
    this.nConvStageTypeId = undefined;
    this.input0_channelCount = undefined;
    this.input0_width = undefined;
    this.input0_height = undefined;

    this.neuralNetParams = undefined; // Just nullify it. Do not release it here.

    super.disposeResources();
  }

  /**
   * Called before stage0 is about to be created. Sub-class should override this method to adjust data members.
   *
   * Stage 0.
   *
   * The special points of a neuralNet's stage 0 are:
   *   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
   *   - Double channels. (Please see explanation of class NeuralNet.Base)
   */
  configTo_beforeStage0() {
    let neuralNetParams = this.neuralNetParams;

    this.input0_height = neuralNetParams.sourceHeight; // stage0 inputs the source image size.
    this.input0_width = neuralNetParams.sourceWidth;
    //this.input0_channelCount; // Sub-class should determine it.

    this.activation_setup_forStage0(); // activation of depthwise1 and pointwise2.

    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // stage0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;

    this.nSqueezeExcitationChannelCountDivisor = neuralNetParams.nSqueezeExcitationChannelCountDivisor;

    this.bKeepInputTensor = neuralNetParams.bKeepInputTensor; // stage0 may or may not keep input tensor according to caller's necessary.

    this.output_height = neuralNetParams.inferencedParams.outputHeightArray[ 0 ];
    this.output_width = neuralNetParams.inferencedParams.outputWidthArray[ 0 ];
  }

  /**
   * Called before every stage (excluding stage0, including stage1, 2, ...). Sub-class should override this method to adjust data members.
   *
   * @param {number} stageIndex
   *   The id (i.e. 1, 2, ...) of the stage which will be created.
   */
  configTo_beforeStageN_exceptStage0( stageIndex ) {
    let neuralNetParams = this.neuralNetParams;

    this.input0_height = neuralNetParams.inferencedParams.inputHeightArray[ stageIndex ];
    this.input0_width = neuralNetParams.inferencedParams.inputWidthArray[ stageIndex ];
    //this.input0_channelCount; // Sub-class should determine it.

    // All stages (except stage0 in NoPointwise1) will not double the channel count by depthwise, because stage0 has already double
    // output channel count.
    //
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // All stages (except stage0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all stages (except stage0) should not keep input tensor.

    this.output_height = neuralNetParams.inferencedParams.outputHeightArray[ stageIndex ];
    this.output_width = neuralNetParams.inferencedParams.outputWidthArray[ stageIndex ];
  }

  /**
   * Called before stageLast is about to be created. Sub-class could override this method to adjust data members.
   */
  configTo_beforeStageLast() {

    // Besides, the stageLast may use a different depthwise filter size. This is especially true for NotShuffleNet_NotMobileNet.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Last;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Last;

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
