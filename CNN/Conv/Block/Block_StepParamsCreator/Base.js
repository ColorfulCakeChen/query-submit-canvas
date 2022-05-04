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

/**
 * Basic class for all Params_to_PointDepthPointParams.Xxx classes.
 *
 * Note: In modern deep learning CNN, there is batch normalization after convolution and before activation. The batch normalization
 * has bias internally. We do not have batch normalization in architecture so an explicit bias will be used before every activation
 * function.
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
    this.inputHeight0 = this.blockParams.sourceHeight; // step0 inputs the source image size.
    this.inputWidth0 = this.blockParams.sourceWidth;

    this.bias_activation_setup_forStep0(); // bias, activation of pointwise1, depthwise1, pointwise2
  }

  /**
   * Called after step0 is created (i.e. before step1, 2, 3, ...). Sub-class should override this method to adjust data members.
   */
  configTo_afterStep0() {
    this.inputHeight0 = this.blockParams.outputHeight; // all steps (except step0) inputs half the source image size.
    this.inputWidth0 = this.blockParams.outputWidth;
  }

  /**
   * Called before stepLast is about to be created. Sub-class could override this method to adjust data members.
   */
  configTo_beforeStepLast() {

//!!! (2022/05/04 Remarked) ShuffleNetV2_ByMobileNetV1 can not work.
//     // By default, the stepLast of this block (i.e. at-block-end) may use a different activation function after pointwise2 convolution.
//     //
//     // Even if in MobileNetV2 (pointwise2 convolution does not have activation function in default), this is still true.
//     this.pointwise21ActivationId = this.blockParams.nActivationIdAtBlockEnd;

    // Besides, the stepLast may use a different depthwise filter size. This is especially true for NotShuffleNet_NotMobileNet.
    this.depthwiseFilterHeight = this.depthwiseFilterHeight_Last;
    this.depthwiseFilterWidth = this.depthwiseFilterWidth_Last;
  }

  /**
   * Config the bias and activation of pointwise1, depthwise1, pointwise2.
   *
   * In original MobileNetV2:
   *   - pointwise1: bias, activation.
   *   - depthwise1: bias, activation.
   *   - pointwise2: bias, no activation.
   *
   * In original ShuffleNetV2:
   *   - pointwise1: bias, activation.
   *   - depthwise1: bias, no activation.
   *   - pointwise2: bias, activation.
   *
   * We use the former configuration (i.e. original MobileNetV2) in all classes Block.Params_to_PointDepthPointParams.Xxx.
   *
   *
   * 1. Reason
   *
   * The reason is for ShuffleNetV2_ByMobileNetV1 to undo activation escaping scales.
   *
   * In ShuffleNetV2_ByMobileNetV1, if an operation has activation function, it will scale its convolution filters for escaping
   * the activation function's non-linear parts. This results in its output is wrong (i.e. different from ShuffleNetV2). In order
   * to resolve this issue, the last operation (i.e. pointwise2) should have no activation (so it will not scale its convolution
   * filters for escaping the activation function's non-linear parts).
   *
   *
   * 2. Advantage
   *
   * Although it is for solving ShuffleNetV2_ByMobileNetV1's issue, it does have practical advantage. The output could have any
   * value (i.e. the whole number line). If the last operation (i.e. pointwise2) has activation function, the output value will
   * be restricted by the activation function (e.g. [ -1, +1 ] for tanh()).
   *
   *
   * 3. Drawback
   *
   * However, the original ShuffleNetV2 configuration also has its own advantage: the bias of its depthwise1 could be dropped
   * (and speed up performance). This is because:
   *
   *   "If an operation has no activation function, it can have no bias too. Because the next operation's bias can
   *    achieve the same result."
   *
   * In MobileNetV2 configuration, this advantage is disappeared. The no-activation is at pointwise2. It does not have a next
   * operation to remedy its bias. So it does not have chance to spped up performance by dropping bias.
   *
   */
  bias_activation_setup_forStep0() {
    this.bPointwise1Bias = true;
    this.pointwise1ActivationId = this.blockParams.nActivationId;

    this.bDepthwiseBias = true;
    this.depthwiseActivationId = this.blockParams.nActivationId;

    this.bPointwise21Bias = true;
    this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
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

