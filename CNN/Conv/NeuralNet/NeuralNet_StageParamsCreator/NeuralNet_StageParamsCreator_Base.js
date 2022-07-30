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
    this.channelShuffler_dispose();

    this.stageCount = undefined; // How many stage should be in the neuralNet.
    this.depthwiseFilterHeight_Default = undefined;
    this.depthwiseFilterWidth_Default = undefined; // The default depthwise filter size.
    this.depthwiseFilterHeight_Last = undefined;
    this.depthwiseFilterWidth_Last = undefined;    // The last stage's depthwise filter size.
    this.output0_channelCount = undefined;
    this.output1_channelCount = undefined;

    this.bKeepInputTensor = undefined;
    this.nActivationId = undefined;
    this.bSqueezeExcitationPrefix = undefined;
    this.nSqueezeExcitationChannelCountDivisor = undefined;
    this.pointwise20ActivationId = undefined;
    this.pointwise20ChannelCount = undefined;
    this.depthwiseActivationId = undefined;
    this.depthwiseStridesPad = undefined;
    this.depthwiseFilterWidth = undefined;
    this.depthwiseFilterHeight = undefined;
    this.depthwise_AvgMax_Or_ChannelMultiplier = undefined;
    this.pointwise1ChannelCount = undefined;
    this.nConvStageTypeId = undefined;
    this.input0_channelCount = undefined;
    this.input0_width = undefined;
    this.input0_height = undefined;

    this.neuralNetParams = undefined; // Just nullify it. Do not release it here.

    super.disposeResources();
  }

  /**
   *
   */
  channelShuffler_dispose() {
    if ( this.channelShuffler ) {
      this.channelShuffler.disposeResources_and_recycleToPool();
      this.channelShuffler = false;
    }
  }

  /** Called to determine stageCount, depthwiseFilterHeight_Default, depthwiseFilterWidth_Default, depthwiseFilterHeight_Last,
    * depthwiseFilterWidth_Last.
    *
    * Sub-class could override this method to adjust data members.
    */
  determine_stageCount_depthwiseFilterHeightWidth_Default_Last() {
    let neuralNetParams = this.neuralNetParams;
    this.stageCount = neuralNetParams.stageCountRequested; // By default, the stage count is just the original stage count.

    // By default, all stages uses the original depthwise filter size.
    this.depthwiseFilterHeight_Default = this.depthwiseFilterHeight_Last = neuralNetParams.depthwiseFilterHeight;
    this.depthwiseFilterWidth_Default = this.depthwiseFilterWidth_Last = neuralNetParams.depthwiseFilterWidth;
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

    this.activation_setup_forStageLast(); // activation of depthwise1 and pointwise2
  }

  /**
   * Config the activation of pointwise1, depthwise1, pointwise2 and squeeze-and-excitation for stage0.
   */
  activation_setup_forStage0() {
    let neuralNetParams = this.neuralNetParams;

    // 1. depthwise
    {
      // MobileNetV2_Xxx's depthwise has activation (before prefix squeeze-and-excitation and to remedy its pointwise2's no activation).
      //
      if ( ValueDesc.ConvNeuralNetType.isMobileNetV2( neuralNetParams.nConvNeuralNetTypeId ) ) {
        this.depthwiseActivationId = neuralNetParams.nActivationId;

      // non-MobileNetV2_Xxx's depthwise has no activation. (since they will be done at pointwise2.)
      //
      } else {
        this.depthwiseActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
      }
    }

    // 2. pointwise2
    {
      // MobileNetV2_Xxx's pointwise2 always does not have activation function.
      //
      // The reason is that MobileNetV2_Xxx's pointwise2 has add-input-to-output so its stage's output is not affine transformation
      // (even if no activation function). It and the next stage's pointwise1 is not continuous multiple affine transformation
      // and will not become just one affine transformation.
      //
      if ( ValueDesc.ConvNeuralNetType.isMobileNetV2( neuralNetParams.nConvNeuralNetTypeId ) ) {
        this.pointwise20ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

      // For all other ConvNeuralNetType, all non-stageLast's pointwise2 must have activation function (to become non-affine transformation).
      // The reason is to avoid the previous stage's pointwise2 and the next stage's pointwis1 become just one affine transformation.
      } else {
        this.pointwise20ActivationId = neuralNetParams.nActivationId;
      }
    }

    // 3. pointwise1 and squeeze-and-excitation
    this.nActivationId = neuralNetParams.nActivationId;
    
    // 4. squeeze-and-excitation prefix or postfix
    {
      if ( ValueDesc.ConvNeuralNetType.isMobileNetV2( neuralNetParams.nConvNeuralNetTypeId ) ) { // MobileNetV2_Xxx uses prefix squeeze-and-excitation.
        this.bSqueezeExcitationPrefix = true;

      } else { // non-MobileNetV2_Xxx uses postfix squeeze-and-excitation.
        this.bSqueezeExcitationPrefix = false;
      }
    }
  }

  /**
   * Config the activation of pointwise1, depthwise1, pointwise2 and squeeze-and-excitation for stageLast.
   */
  activation_setup_forStageLast() {
    let neuralNetParams = this.neuralNetParams;

    // pointwise2
    {
      // MobileNetV2_Xxx's pointwise2 always does not have activation function.
      //
      // The reason is that MobileNetV2_Xxx's pointwise2 has add-input-to-output so its stage's output is not affine transformation
      // (even if no activation function). It and the next stage's pointwise1 is not continuous multiple affine transformation
      // and will not become just one affine transformation.
      //
      if ( ValueDesc.ConvNeuralNetType.isMobileNetV2( neuralNetParams.nConvNeuralNetTypeId ) ) {
        this.pointwise20ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

      // For all other ConvNeuralNetType, whether stageLast's pointwise2 has activation function is according to the specified flag.
      } else {
        if ( neuralNetParams.bPointwise2ActivatedAtNeuralNetEnd == false ) {
          this.pointwise20ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
        } else {
          this.pointwise20ActivationId = neuralNetParams.nActivationId;
        }
      }
    }
  }

  get nConvStageTypeName() {
    return ValueDesc.ConvStageType.Singleton.getName_byId( this.nConvStageTypeId );
  }

  get depthwise_AvgMax_Or_ChannelMultiplier_Name() {
    return ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.getName_byId( this.depthwise_AvgMax_Or_ChannelMultiplier );
  }

  get depthwiseActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId( this.depthwiseActivationId );
  }

  get pointwise20ActivationName() {
    return ValueDesc.ActivationFunction.Singleton.getName_byId( this.pointwise20ActivationId );
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
      this.pointwise1ChannelCount,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth, this.depthwiseStridesPad,
      this.depthwiseActivationId,
      this.pointwise20ChannelCount, this.pointwise20ActivationId,
      this.nSqueezeExcitationChannelCountDivisor, this.bSqueezeExcitationPrefix,
      this.nActivationId,
      this.bKeepInputTensor
    );
    return params;
  }

}
