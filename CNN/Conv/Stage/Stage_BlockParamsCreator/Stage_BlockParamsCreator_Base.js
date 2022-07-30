export { Stage_BlockParamsCreator_Base as Base };

import * as Pool from "../../../util/Pool.js";
import * as Recyclable from "../../../util/Recyclable.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as Block from "../../Block.js";
import { Params } from "../Stage_Params.js";

/**
 * Base class for all Stage.BlockParamsCreator.Xxx classes.
 *
 *
 * @member {number} output0_channelCount
 *   The output0's channel count in current configuration.
 *
 * @member {number} output1_channelCount
 *   The output1's channel count in current configuration.
 *
 */
class Stage_BlockParamsCreator_Base extends Recyclable.Root {

  /**
   * Used as default Stage.BlockParamsCreator.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Stage.BlockParamsCreator.Base.Pool",
    Stage_BlockParamsCreator_Base, Stage_BlockParamsCreator_Base.setAsConstructor );

  /**
   * @param {Params} stageParams
   *   The Stage.Params object which provides basic parameters. It will be referenced (i.e. not cloned, not owned, not released)
   * by this Stage.BlockParamsCreator.Base onject.
   */
  constructor( stageParams ) {
    super();
    Stage_BlockParamsCreator_Base.setAsConstructor_self.call( this, stageParams );
  }

  /** @override */
  static setAsConstructor( stageParams ) {
    super.setAsConstructor();
    Stage_BlockParamsCreator_Base.setAsConstructor_self.call( this, stageParams );
    return this;
  }

  /** @override */
  static setAsConstructor_self( stageParams ) {
    this.stageParams = stageParams;
  }

  /** @override */
  disposeResources() {
    this.channelShuffler_dispose();

    this.blockCount = undefined; // How many block should be in the stage.
    this.depthwiseFilterHeight_Default = undefined;
    this.depthwiseFilterWidth_Default = undefined; // The default depthwise filter size.
    this.depthwiseFilterHeight_Last = undefined;
    this.depthwiseFilterWidth_Last = undefined;    // The last block's depthwise filter size.
    this.output0_channelCount = undefined;
    this.output1_channelCount = undefined;
    this.output_height = undefined;
    this.output_width = undefined;

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
    this.nConvBlockTypeId = undefined;
    this.input0_channelCount = undefined;
    this.input0_width = undefined;
    this.input0_height = undefined;

    this.stageParams = undefined; // Just nullify it. Do not release it here.

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

  /** Called to determine blockCount, depthwiseFilterHeight_Default, depthwiseFilterWidth_Default, depthwiseFilterHeight_Last,
    * depthwiseFilterWidth_Last.
    *
    * Sub-class could override this method to adjust data members.
    */
  determine_blockCount_depthwiseFilterHeightWidth_Default_Last() {
    let stageParams = this.stageParams;
    this.blockCount = stageParams.blockCountRequested; // By default, the block count is just the original block count.

    // By default, all blocks uses the original depthwise filter size.
    this.depthwiseFilterHeight_Default = this.depthwiseFilterHeight_Last = stageParams.depthwiseFilterHeight;
    this.depthwiseFilterWidth_Default = this.depthwiseFilterWidth_Last = stageParams.depthwiseFilterWidth;
  }

  /**
   * Called before block0 is about to be created. Sub-class should override this method to adjust data members.
   *
   * Block 0.
   *
   * The special points of a stage's block 0 are:
   *   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
   *   - Double channels. (Please see explanation of class Stage.Base)
   */
  configTo_beforeBlock0() {
    let stageParams = this.stageParams;

    this.input0_height = stageParams.sourceHeight; // block0 inputs the source image size.
    this.input0_width = stageParams.sourceWidth;
    //this.input0_channelCount; // Sub-class should determine it.

    this.activation_setup_forBlock0(); // activation of depthwise1 and pointwise2.

    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // block0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;

    this.nSqueezeExcitationChannelCountDivisor = stageParams.nSqueezeExcitationChannelCountDivisor;

    this.bKeepInputTensor = stageParams.bKeepInputTensor; // block0 may or may not keep input tensor according to caller's necessary.

    this.output_height = stageParams.inferencedParams.outputHeightArray[ 0 ];
    this.output_width = stageParams.inferencedParams.outputWidthArray[ 0 ];
  }

  /**
   * Called before every block (excluding block0, including block1, 2, ...). Sub-class should override this method to adjust data members.
   *
   * @param {number} blockIndex
   *   The id (i.e. 1, 2, ...) of the block which will be created.
   */
  configTo_beforeBlockN_exceptBlock0( blockIndex ) {
    let stageParams = this.stageParams;

    this.input0_height = stageParams.inferencedParams.inputHeightArray[ blockIndex ];
    this.input0_width = stageParams.inferencedParams.inputWidthArray[ blockIndex ];
    //this.input0_channelCount; // Sub-class should determine it.

    // All blocks (except block0 in NoPointwise1) will not double the channel count by depthwise, because block0 has already double
    // output channel count.
    //
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // All blocks (except block0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all blocks (except block0) should not keep input tensor.

    this.output_height = stageParams.inferencedParams.outputHeightArray[ blockIndex ];
    this.output_width = stageParams.inferencedParams.outputWidthArray[ blockIndex ];
  }

  /**
   * Called before blockLast is about to be created. Sub-class could override this method to adjust data members.
   */
  configTo_beforeBlockLast() {

    // Besides, the blockLast may use a different depthwise filter size. This is especially true for NotShuffleNet_NotMobileNet.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Last;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Last;

    this.activation_setup_forBlockLast(); // activation of depthwise1 and pointwise2
  }

  /**
   * Config the activation of pointwise1, depthwise1, pointwise2 and squeeze-and-excitation for block0.
   */
  activation_setup_forBlock0() {
    let stageParams = this.stageParams;

    // 1. depthwise
    {
      // MobileNetV2_Xxx's depthwise has activation (before prefix squeeze-and-excitation and to remedy its pointwise2's no activation).
      //
      if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageTypeId ) ) {
        this.depthwiseActivationId = stageParams.nActivationId;

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
      // The reason is that MobileNetV2_Xxx's pointwise2 has add-input-to-output so its block's output is not affine transformation
      // (even if no activation function). It and the next block's pointwise1 is not continuous multiple affine transformation
      // and will not become just one affine transformation.
      //
      if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageTypeId ) ) {
        this.pointwise20ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

      // For all other ConvStageType, all non-blockLast's pointwise2 must have activation function (to become non-affine transformation).
      // The reason is to avoid the previous block's pointwise2 and the next block's pointwis1 become just one affine transformation.
      } else {
        this.pointwise20ActivationId = stageParams.nActivationId;
      }
    }

    // 3. pointwise1 and squeeze-and-excitation
    this.nActivationId = stageParams.nActivationId;
    
    // 4. squeeze-and-excitation prefix or postfix
    {
      if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageTypeId ) ) { // MobileNetV2_Xxx uses prefix squeeze-and-excitation.
        this.bSqueezeExcitationPrefix = true;

      } else { // non-MobileNetV2_Xxx uses postfix squeeze-and-excitation.
        this.bSqueezeExcitationPrefix = false;
      }
    }
  }

  /**
   * Config the activation of pointwise1, depthwise1, pointwise2 and squeeze-and-excitation for blockLast.
   */
  activation_setup_forBlockLast() {
    let stageParams = this.stageParams;

    // pointwise2
    {
      // MobileNetV2_Xxx's pointwise2 always does not have activation function.
      //
      // The reason is that MobileNetV2_Xxx's pointwise2 has add-input-to-output so its block's output is not affine transformation
      // (even if no activation function). It and the next block's pointwise1 is not continuous multiple affine transformation
      // and will not become just one affine transformation.
      //
      if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageTypeId ) ) {
        this.pointwise20ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

      // For all other ConvStageType, whether blockLast's pointwise2 has activation function is according to the specified flag.
      } else {
        if ( stageParams.bPointwise2ActivatedAtStageEnd == false ) {
          this.pointwise20ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
        } else {
          this.pointwise20ActivationId = stageParams.nActivationId;
        }
      }
    }
  }

  get nConvBlockTypeName() {
    return ValueDesc.ConvBlockType.Singleton.getName_byId( this.nConvBlockTypeId );
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
   * @return {Block.Params}
   *   Create and return a Block.Params according to this object's current state.
   */
  create_BlockParams() {
    let params = Block.Params.Pool.get_or_create_by(
      this.input0_height, this.input0_width, this.input0_channelCount,
      this.nConvBlockTypeId,
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
