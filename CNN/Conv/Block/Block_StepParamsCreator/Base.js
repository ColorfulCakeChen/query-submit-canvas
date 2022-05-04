export { Base };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "../../PointDepthPoint.js";
import { Params } from "../Block_Params.js";
import { MobileNetV1 } from "./MobileNetV1.js";
import { MobileNetV2 } from "./MobileNetV2.js";
import { MobileNetV2_Thin } from "./MobileNetV2_Thin.js";
import { ShuffleNetV2 } from "./ShuffleNetV2.js";
import { ShuffleNetV2_ByPointwise22 } from "./ShuffleNetV2_ByPointwise22.js";
import { ShuffleNetV2_ByMobileNetV1 } from "./ShuffleNetV2_ByMobileNetV1.js";
import { ShuffleNetV2_ByMobileNetV1_padValid } from "./ShuffleNetV2_ByMobileNetV1_padValid.js";


//!!! ...unfinished... (2022/05/04)
// How to let only the last block's stepLast's pointwise21 has bias when multiple convolution blocks are used?
// Let other block's every step's pointwise21 has no-bias.
//


/**
 * Basic class for all Params_to_PointDepthPointParams.Xxx classes.
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
   * @param {Params} blockParams
   *   The Block.Params object which provides basic parameters.
   */
  constructor( blockParams ) {
    this.blockParams = blockParams;

    this.inputHeight0 = this.inputWidth0 =
    this.channelCount0_pointwise1Before = this.channelCount1_pointwise1Before =
    this.pointwise1ChannelCount = this.bPointwise1Bias = this.pointwise1ActivationId =
    this.depthwise_AvgMax_Or_ChannelMultiplier = this.depthwiseFilterHeight = this.depthwiseFilterWidth =
    this.depthwiseStridesPad = this.bDepthwiseBias = this.depthwiseActivationId =
    this.pointwise21ChannelCount = this.bPointwise21Bias = this.pointwise21ActivationId =
    this.bOutput1Requested = this.bKeepInputTensor = undefined;

    this.stepCount = // How many step should be in the block.
    this.depthwiseFilterHeight_Default = this.depthwiseFilterWidth_Default = // The default depthwise filter size.
    this.depthwiseFilterHeight_Last = this.depthwiseFilterWidth_Last =       // The last step's depthwise filter size.
    this.outChannels0 = this.outChannels1 = -1;

    this.channelShuffler = undefined;
  }

  /** Called to determine stepCount, depthwiseFilterHeight_Default, depthwiseFilterWidth_Default, depthwiseFilterHeight_Last,
    * depthwiseFilterWidth_Last.
    *
    * Sub-class could override this method to adjust data members.
    */
  determine_stepCount_depthwiseFilterHeightWidth_Default_Last() {
    let blockParams = this.blockParams;
    this.stepCount = blockParams.stepCountRequested; // By default, the step count is just the original step count.

    // By default, all steps uses the original depthwise filter size.
    this.depthwiseFilterHeight_Default = this.depthwiseFilterHeight_Last = blockParams.depthwiseFilterHeight;
    this.depthwiseFilterWidth_Default = this.depthwiseFilterWidth_Last = blockParams.depthwiseFilterWidth;
  }

  /**
   * Called before step0 is about to be created. Sub-class should override this method to adjust data members.
   *
   * Step 0.
   *
   * The special points of a block's step 0 are:
   *   - halve the height x width. (Both ShuffleNetV2 and MobileNetV2) (by depthwise convolution with strides = 2)
   *   - Double channels. (Please see explanation of class Block.Base)
   */
  configTo_beforeStep0() {
    let blockParams = this.blockParams;

    this.inputHeight0 = blockParams.sourceHeight; // step0 inputs the source image size.
    this.inputWidth0 = blockParams.sourceWidth;

    this.bias_activation_setup_forStep0(); // bias, activation of pointwise1, depthwise1, pointwise2

    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Default;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Default;

    // step0 uses depthwise ( strides = 2, pad = "same" ) to halve ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME;

    // All steps' output0 is double depth of source input0.
    //
    // Note: In original MobileNet(V2) design, it is not always "twice". We choose "twice" just for comparing with ShuffleNetV2.
    //
    this.pointwise21ChannelCount = blockParams.sourceChannelCount * 2;

    this.bKeepInputTensor = blockParams.bKeepInputTensor; // step0 may or may not keep input tensor according to caller's necessary.
  }

  /**
   * Called after step0 is created (i.e. before step1, 2, 3, ...). Sub-class should override this method to adjust data members.
   */
  configTo_afterStep0() {
    this.inputHeight0 = this.blockParams.outputHeight; // all steps (except step0) inputs half the source image size.
    this.inputWidth0 = this.blockParams.outputWidth;

    // All steps (except step0 in NoPointwise1) will not double the channel count by depthwise, because step0 has already double
    // output channel count.
    //
    this.depthwise_AvgMax_Or_ChannelMultiplier = 1;

    // All steps (except step0) uses depthwise ( strides = 1, pad = "same" ) to keep ( height, width ).
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME;

    this.bKeepInputTensor = false; // No matter bKeepInputTensor, all steps (except step0) should not keep input tensor.
  }

  /**
   * Called before stepLast is about to be created. Sub-class could override this method to adjust data members.
   */
  configTo_beforeStepLast() {

    // Besides, the stepLast may use a different depthwise filter size. This is especially true for NotShuffleNet_NotMobileNet.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Last;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Last;

    this.bias_activation_setup_forStepLast(); // bias, activation of pointwise1, depthwise1, pointwise2
  }

  /**
   * Config the bias and activation of pointwise1, depthwise1, pointwise2 for step0.
   */
  bias_activation_setup_forStep0() {
    let blockParams = this.blockParams;

    this.bPointwise1Bias = true;
    this.pointwise1ActivationId = blockParams.nActivationId;

    this.bDepthwiseBias = true;
    this.depthwiseActivationId = blockParams.nActivationId;

    if ( ( blockParams.bPointwise1 == true ) && ( ValueDesc.ConvBlockType.isMobileNet( blockParams.nConvBlockType ) ) ) {

      // When MobileNet with ( bPointwise1 == true ), all non-stepLast's pointwise21 could have no bias. The next step's
      // pointwise1's bias could remedy it because pointwise21 is affine (i.e. does not have activation function). This
      // could improve performance.
      //
      this.bPointwise21Bias = false;
    } else {
      this.bPointwise21Bias = true;
    }

    this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
  }

  /**
   * Config the bias and activation of pointwise1, depthwise1, pointwise2 for stepLast.
   */
  bias_activation_setup_forStepLast() {

//!!! ...unfinished... (2022/05/04)
// How to let only the last block's stepLast's pointwise21 has bias when multiple convolution blocks are used?
// Let other block's every step's pointwise21 has no-bias.
//


    // The stepLast's pointwise21 must always have bias, although there is no activation function after pointwise21.
    // The reason is the stepLast does not have the next step's pointwise1 to provide bias to complete affine
    // transformation. It must do it by itself.
    //
    // This is still true for MobileNet with ( bPointwise1 == true ).
    //
    this.bPointwise21Bias = true;
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
   * @return {PointDepthPoint.Params}
   *   Create and return a PointDepthPoint.Params according to this object's current state.
   */
  create_PointDepthPointParams( inputFloat32Array, byteOffsetBegin ) {
    let params = new PointDepthPoint.Params(
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
  
  /**
   * @param {Params} blockParams
   *   The Block.Params object to be reference.
   *
   * @return {Base}
   *   Return newly created Block.Params_to_PointDepthPointParams.Xxx object according to blockParams.nConvBlockType.
   */
  static create_byBlockParams( blockParams ) {

    tf.util.assert( ( blockParams.stepCountRequested >= 2 ),
      `Block.StepParamsCreator.Base.create_byBlockParams(): `
        + `blockParams.stepCountRequested ( ${blockParams.stepCountRequested} ) must be >= 2.` );

    switch ( blockParams.nConvBlockType ) {
      case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1: // (0)
        return new Params_to_PointDepthPointParams.MobileNetV1( blockParams ); break;

      case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2: // (1)
        return new Params_to_PointDepthPointParams.MobileNetV2( blockParams ); break;

      case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN: // (2)
        return new Params_to_PointDepthPointParams.MobileNetV2_Thin( blockParams ); break;

      case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2: // (3)
        return new Params_to_PointDepthPointParams.ShuffleNetV2( blockParams ); break;

      case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (4)
        return new Params_to_PointDepthPointParams.ShuffleNetV2_ByPointwise22( blockParams ); break;

      case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (5)
        return new Params_to_PointDepthPointParams.ShuffleNetV2_ByMobileNetV1( blockParams ); break;

      case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (6)
        return new Params_to_PointDepthPointParams.ShuffleNetV2_ByMobileNetV1_padValid( blockParams ); break;

      default:
        tf.util.assert( false,
          `Block.StepParamsCreator.Base.create_byBlockParams(): `
            + `unknown this.nConvBlockType ( ${blockParams.nConvBlockType} ) value.` );
        break;
    }
  }

}

