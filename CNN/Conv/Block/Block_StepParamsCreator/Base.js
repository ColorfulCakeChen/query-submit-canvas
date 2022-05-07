export { Base };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "../../PointDepthPoint.js";
import { Params } from "../Block_Params.js";
import { MobileNetV1 } from "./MobileNetV1.js";
import { MobileNetV1_padValid } from "./MobileNetV1_padValid.js";
import { MobileNetV2 } from "./MobileNetV2.js";
import { MobileNetV2_Thin } from "./MobileNetV2_Thin.js";
import { ShuffleNetV2 } from "./ShuffleNetV2.js";
import { ShuffleNetV2_ByPointwise22 } from "./ShuffleNetV2_ByPointwise22.js";
import { ShuffleNetV2_ByMobileNetV1 } from "./ShuffleNetV2_ByMobileNetV1.js";
import { ShuffleNetV2_ByMobileNetV1_padValid } from "./ShuffleNetV2_ByMobileNetV1_padValid.js";

/**
 * Basic class for all Block.StepParamsCreator.Xxx classes.
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

//!!! (2022/05/07 Remarked) Always bias. But not always activation. According to bPointwise2ActivatedAtBlockEnd ans whether MobileNetV2.
//     if ( ( ValueDesc.ConvBlockType.isMobileNet( blockParams.nConvBlockType ) ) && ( blockParams.bPointwise1 == true ) ) {
//
//       // When MobileNet with ( bPointwise1 == true ), all non-stepLast's pointwise21 could have no bias. The next step's
//       // pointwise1's bias could remedy it because pointwise21 is affine (i.e. does not have activation function). This
//       // could improve performance.
//       //
//       this.bPointwise21Bias = false;
//     } else {
//       this.bPointwise21Bias = true;
//     }
//
//     this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;


    this.bPointwise21Bias = true; // All steps' outputs needs bias (even if MobileNetV2_Xxx).

    // MobileNetV2_Xxx's pointwise2 always does not have activation function.
    //
    // The reason is that MobileNetV2_Xxx's pointwise2 has add-input-to-output so its step's output is not affine transformation
    // (even if no activation function). It and the next step's pointwise1 is not continusous multiple affine transformation
    // and will not become just one affine transformation.
    //
    if ( ValueDesc.ConvBlockType.isMobileNetV2( blockParams.nConvBlockType ) ) {
      this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;

    // For all other ConvBlockType, all non-stepLast's pointwise2 must have activation function (to become non-affine transformation).
    // The reason is to avoid the previous step's pointwise2 and the next step's pointwis1 become just one affine transformation.
    } else {
      this.pointwise21ActivationId = blockParams.nActivationId;
    }
  }

  /**
   * Config the bias and activation of pointwise1, depthwise1, pointwise2 for stepLast.
   */
  bias_activation_setup_forStepLast() {
    let blockParams = this.blockParams;

//!!! (2022/05/07 Remarked) Always bias. But not always activation. According to bPointwise2ActivatedAtBlockEnd ans whether MobileNetV2.
//
//     // Only if requested, the stepLast's pointwise21 could have no bias. Usually, this is used when the next block's
//     // step0's ( blockParams.bPointwise1 == true ) so that it could remedy this block's stepLast's pointwise21 has no bias.
//     //
//     if ( blockParams.bPointwise2BiasAtBlockEnd == false ) {
//       this.bPointwise21Bias = false;
//
//     // In general cases, the stepLast's pointwise21 must have bias, although there is no activation function after it.
//     // The reason is the stepLast does not have the next step's pointwise1 to provide bias to complete affine
//     // transformation. It must do it by itself.
//     //
//     } else {
//       this.bPointwise21Bias = true;
//     }


    // MobileNetV2_Xxx's pointwise2 always does not have activation function.
    //
    // The reason is that MobileNetV2_Xxx's pointwise2 has add-input-to-output so its step's output is not affine transformation
    // (even if no activation function). It and the next step's pointwise1 is not continusous multiple affine transformation
    // and will not become just one affine transformation.
    //
    if ( ValueDesc.ConvBlockType.isMobileNetV2( blockParams.nConvBlockType ) ) {
      this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
      
    // For all other ConvBlockType, whether stepLast's pointwise2 has activation function is according to specified flag.
    } else {
      if ( blockParams.bPointwise2ActivatedAtBlockEnd == false ) {
        this.pointwise21ActivationId = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
      } else {
        this.pointwise21ActivationId = blockParams.nActivationId;
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
   *   Return newly created Block.StepParamsCreator.Xxx object according to blockParams.nConvBlockType.
   */
  static create_byBlockParams( blockParams ) {

    tf.util.assert( ( blockParams.stepCountRequested >= 2 ),
      `Block.StepParamsCreator.Base.create_byBlockParams(): `
        + `blockParams.stepCountRequested ( ${blockParams.stepCountRequested} ) must be >= 2.` );

    tf.util.assert(
      (   ( blockParams.nConvBlockType >= 0 )
       && ( blockParams.nConvBlockType < Base.nConvBlockType_to_StepParamsCreator_ClassArray.length )
      ),
      `Block.StepParamsCreator.Base.create_byBlockParams(): `
        + `unknown blockParams.nConvBlockType ( ${blockParams.nConvBlockType} ) value.`
    );

    let classStepParamsCreator = Base.nConvBlockType_to_StepParamsCreator_ClassArray[ blockParams.nConvBlockType ];
    let aStepParamsCreator = new classStepParamsCreator( blockParams );

    return aStepParamsCreator;
  }

}

/**
 * Mapping nConvBlockType (number as array index) to StepParamsCreator class object.
 */
Base.nConvBlockType_to_StepParamsCreator_ClassArray[] = [
  MobileNetV1,                         // ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1 (0)
  MobileNetV1_padValid,                // ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1_PAD_VALID (1)
  MobileNetV2,                         // ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2 (2)
  MobileNetV2_Thin,                    // ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN (3)
  ShuffleNetV2,                        // ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2 (4)
  ShuffleNetV2_ByPointwise22,          // ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22 (5)
  ShuffleNetV2_ByMobileNetV1,          // ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (6)
  ShuffleNetV2_ByMobileNetV1_padValid, // ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (7)
];
