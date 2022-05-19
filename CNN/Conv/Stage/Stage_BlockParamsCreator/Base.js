export { Base }; // Stage.BlockParamsCreator.Base

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as Block from "../../Block.js";
import { Params } from "../Stage_Params.js";

/**
 * Base class for all Stage.BlockParamsCreator.Xxx classes.
 *
 *
 * @member {number} outChannels0
 *   The output0's channel count in current configuration.
 *
 * @member {number} outChannels1
 *   The output1's channel count in current configuration.
 *
 */
class Base {

  /**
   * @param {Params} stageParams
   *   The Stage.Params object which provides basic parameters.
   */
  constructor( stageParams ) {
    this.stageParams = stageParams;

    this.inputHeight0 = this.inputWidth0 =
    this.channelCount0_pointwise1Before = this.channelCount1_pointwise1Before =
    this.pointwise1ChannelCount = this.bPointwise1Bias = this.pointwise1ActivationId =
    this.depthwise_AvgMax_Or_ChannelMultiplier = this.depthwiseFilterHeight = this.depthwiseFilterWidth =
    this.depthwiseStridesPad = this.bDepthwiseBias = this.depthwiseActivationId =
    this.pointwise21ChannelCount = this.bPointwise21Bias = this.pointwise21ActivationId =
    this.bOutput1Requested = this.bKeepInputTensor = undefined;

    this.blockCount = // How many block should be in the stage.
    this.depthwiseFilterHeight_Default = this.depthwiseFilterWidth_Default = // The default depthwise filter size.
    this.depthwiseFilterHeight_Last = this.depthwiseFilterWidth_Last =       // The last block's depthwise filter size.
    this.outChannels0 = this.outChannels1 = -1;

    this.channelShuffler = undefined;
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

    this.inputHeight0 = stageParams.sourceHeight; // block0 inputs the source image size.
    this.inputWidth0 = stageParams.sourceWidth;

    this.bias_activation_setup_forBlock0(); // bias, activation of pointwise1, depthwise1, pointwise2

    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // block0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;

    this.bKeepInputTensor = stageParams.bKeepInputTensor; // block0 may or may not keep input tensor according to caller's necessary.
  }

  /**
   * Called after block0 is created (i.e. before block1, 2, 3, ...). Sub-class should override this method to adjust data members.
   */
  configTo_afterBlock0() {
    this.inputHeight0 = this.stageParams.outputHeight; // all blocks (except block0) inputs half the source image size.
    this.inputWidth0 = this.stageParams.outputWidth;

    // All blocks (except block0 in NoPointwise1) will not double the channel count by depthwise, because block0 has already double
    // output channel count.
    //
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // All blocks (except block0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all blocks (except block0) should not keep input tensor.
  }

  /**
   * Called before blockLast is about to be created. Sub-class could override this method to adjust data members.
   */
  configTo_beforeBlockLast() {

    // Besides, the blockLast may use a different depthwise filter size. This is especially true for NotShuffleNet_NotMobileNet.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Last;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Last;

    this.bias_activation_setup_forBlockLast(); // bias, activation of pointwise1, depthwise1, pointwise2
  }

  /**
   * Config the bias and activation of pointwise1, depthwise1, pointwise2 for block0.
   */
  bias_activation_setup_forBlock0() {
    let stageParams = this.stageParams;

    // pointwise1
    {
      this.bPointwise1Bias = true;
      this.pointwise1ActivationId = stageParams.nActivationId;
    }

    // depthwise
    {
      // MobileNetV2_Xxx's depthwise have bias and activation (to remedy its pointwise2's no activation).
      //
      if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageType ) ) {
        this.bDepthwiseBias = true;
        this.depthwiseActivationId = stageParams.nActivationId;

      // non-MobileNetV2_Xxx's depthwise have no bias and no activation. (since they will be done at pointwise2.)
      //
      } else {
        this.bDepthwiseBias = false;
        this.depthwiseActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
      }
    }

    // pointwise2
    {
      this.bPointwise21Bias = true; // All blocks' outputs needs bias (even if MobileNetV2_Xxx).

      // MobileNetV2_Xxx's pointwise2 always does not have activation function.
      //
      // The reason is that MobileNetV2_Xxx's pointwise2 has add-input-to-output so its block's output is not affine transformation
      // (even if no activation function). It and the next block's pointwise1 is not continuous multiple affine transformation
      // and will not become just one affine transformation.
      //
      if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageType ) ) {
        this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

      // For all other ConvStageType, all non-blockLast's pointwise2 must have activation function (to become non-affine transformation).
      // The reason is to avoid the previous block's pointwise2 and the next block's pointwis1 become just one affine transformation.
      } else {
        this.pointwise21ActivationId = stageParams.nActivationId;
      }
    }
  }

  /**
   * Config the bias and activation of pointwise1, depthwise1, pointwise2 for blockLast.
   */
  bias_activation_setup_forBlockLast() {
    let stageParams = this.stageParams;

    // pointwise2
    {
      // MobileNetV2_Xxx's pointwise2 always does not have activation function.
      //
      // The reason is that MobileNetV2_Xxx's pointwise2 has add-input-to-output so its block's output is not affine transformation
      // (even if no activation function). It and the next block's pointwise1 is not continuous multiple affine transformation
      // and will not become just one affine transformation.
      //
      if ( ValueDesc.ConvStageType.isMobileNetV2( stageParams.nConvStageType ) ) {
        this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

      // For all other ConvStageType, whether blockLast's pointwise2 has activation function is according to the specified flag.
      } else {
        if ( stageParams.bPointwise2ActivatedAtStageEnd == false ) {
          this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
        } else {
          this.pointwise21ActivationId = stageParams.nActivationId;
        }
      }
    }
  }

  /**
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpreted as weights.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @return {Block.Params}
   *   Create and return a Block.Params according to this object's current state.
   */
  create_BlockParams( inputFloat32Array, byteOffsetBegin ) {
    let params = new Block.Params(
      inputFloat32Array, byteOffsetBegin,
      this.inputHeight0, this.inputWidth0,
      this.channelCount0_pointwise1Before,
      this.channelCount1_pointwise1Before,
      this.pointwise1ChannelCount, this.bPointwise1Bias, this.pointwise1ActivationId,
      this.depthwise_AvgMax_Or_ChannelMultiplier, this.depthwiseFilterHeight, this.depthwiseFilterWidth,
      this.depthwiseStridesPad, this.bDepthwiseBias, this.depthwiseActivationId,
      this.pointwise21ChannelCount, this.bPointwise21Bias, this.pointwise21ActivationId,
      this.bOutput1Requested,
      this.bKeepInputTensor
    );
    return params;
  }

}
