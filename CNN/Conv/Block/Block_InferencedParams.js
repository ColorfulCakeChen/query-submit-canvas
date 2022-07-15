export { InferencedParams };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ActivationEscaping from "../ActivationEscaping.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
//import { Params } from "./Params.js";

!!! ...unfinished... (2022/07/14)
// Perhaps, porting all Block.Params.set_Xxx_by() static method to here.
//
// Renamed to class Block.InferencedParams
//
//

/**
 * Calculate the channel count of lower half (of input and output) and higher half (of input and output) for pointwise1 of
 * ShuffleNetV2_ByMopbileNetV1's head/body/tail.
 *
 * @member {number} nConvBlockTypeId
 *   The convolution type id of the block (i.e. ValueDesc.ConvBlockType.Singleton.Ids.Xxx).
 *
 * @member {number} inputChannelCount
 *   The total input channel count of pointwise1.
 *
 * @member {number} outputChannelCount
 *   The total output channel count of pointwise1.
 *
 * @member {number} inputChannelCount_lowerHalf
 *   The lower half of the input channel count.
 *
 * @member {number} inputChannelCount_higherHalf
 *   The higher half of the input channel count.
 *
 * @member {number} outputChannelCount_lowerHalf
 *   The lower half of the output channel count.
 *
 * @member {number} outputChannelCount_higherHalf
 *   The higher half of the output channel count.
 *
 * @member {ValueDesc.Pointwise_HigherHalfDifferent} nHigherHalfDifferent
 *   It will be one of the following:
 *   - ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.NONE (0)
 *   - ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH (1)
 *   - ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_COPY_LOWER_HALF (2)
 *
 */
class InferencedParams extends Recyclable.Root {

  /**
   * Used as default Block.InferencedParams provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Block.InferencedParams.Pool", InferencedParams, InferencedParams.setAsConstructor );

  /**
   *
   */
  constructor(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix
  ) {
    super();
    InferencedParams.setAsConstructor_self.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix );
  }

  /** @override */
  static setAsConstructor(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix
  ) {
    super.setAsConstructor();
    InferencedParams.setAsConstructor_self.call( this,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    input0_height, input0_width, input0_channelCount,
    nConvBlockTypeId,
    pointwise1ChannelCount,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
    depthwiseActivationId,
    pointwise20ChannelCount,
    nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
  ) {

//!!! ...unfinished... (2022/07/14) Create input TensorPlaceholder.

    Params.set_inputTensorCount_input1_height_width_channelCount_depthwise_inferenced_by.call( ???,
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      depthwiseActivationId,
      pointwise20ChannelCount,
      nSqueezeExcitationChannelCountDivisor, bSqueezeExcitationPrefix,
    );

    Params.set_pointwise1_nHigherHalfDifferent_modify_pointwise1ChannelCount_pointwise1Bias_pointwise1ActivationId_by.call( ???,
      input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount
    );

    Params.set_input0_input1_TensorPlaceholder.call( ???,
      inputTensorCount,
      input0_height, input0_width, input0_channelCount, inputScaleBoundsArray0,
      input1_height, input1_width, input1_channelCount, inputScaleBoundsArray1,
      pointwise1_inputChannelCount_lowerHalf, pointwise1_inputChannelCount_higherHalf,
    );

  }

  /** @override */
  disposeResources() {
!!!

    this.nConvBlockTypeId = undefined;
    this.inputChannelCount = undefined;
    this.outputChannelCount = undefined;

    this.nHigherHalfDifferent = undefined;
    this.inputChannelCount_lowerHalf = undefined;
    this.inputChannelCount_higherHalf = undefined;
    this.outputChannelCount_lowerHalf = undefined;
    this.outputChannelCount_higherHalf = undefined;

    super.disposeResources();
  }

  /**
   *
   * @param {ActivationEscaping.ScaleBoundsArray|TensorPlaceholder.Base} input_ScaleBoundsArray_or_TensorPlaceholder
   *   The input's information.
   *     - If it is an ActivationEscaping.ScaleBoundsArray object, a new TensorPlaceholder will be created and returned.
   *     - If it is a TensorPlaceholder.Base object, it will be returned (not cloned) directly.
   *
   * @return {TensorPlaceholder.Base}
   *   Return either a newly created TensorPlaceholder or input_ScaleBoundsArray_or_TensorPlaceholder directly.
   */
  static create_or_check_TensorPlaceholder_by(
    input_height, input_width, input_channelCount,
    input_channelCount_lowerHalf, input_channelCount_higherHalf,
    input_ScaleBoundsArray_or_TensorPlaceholder
  ) {

    // 1.
    if ( input_ScaleBoundsArray_or_TensorPlaceholder instanceof ActivationEscaping.ScaleBoundsArray ) {
      let inputScaleBoundsArray = input_ScaleBoundsArray_or_TensorPlaceholder;

      if ( inputScaleBoundsArray.length != input_channelCount )
        throw Error( `Block.input_TensorPlaceholder.create_or_check_TensorPlaceholder_by(): `
          + `inputScaleBoundsArray's length ( ${inputScaleBoundsArray.length} ) should be the same as `
          + `input's channel count ( ${input_channelCount} ).`
        );

      let inputTensorPlaceholder = TensorPlaceholder.Base.Pool.get_or_create_by();
      inputTensorPlaceholder.set_height_width_channelCount_scaleBoundsArray(
        input_height, input_width,
        input_channelCount, input_channelCount_lowerHalf, input_channelCount_higherHalf,
        inputScaleBoundsArray );

      return inputTensorPlaceholder;

    // 2.
    } else if ( input_ScaleBoundsArray_or_TensorPlaceholder instanceof TensorPlaceholder.Base ) {

      let inputTensorPlaceholder = input_ScaleBoundsArray_or_TensorPlaceholder;
      let inputScaleBoundsArray = inputTensorPlaceholder.scaleBoundsArray;

      if (   ( inputTensorPlaceholder.height != input_height )
          && ( inputTensorPlaceholder.width != input_width )
          && ( inputTensorPlaceholder.channelCount != input_channelCount )
          && ( inputTensorPlaceholder.channelCount_lowerHalf != input_channelCount_lowerHalf )
          && ( inputTensorPlaceholder.channelCount_higherHalf != input_channelCount_higherHalf )
         )
        throw Error( `Block.input_TensorPlaceholder.create_or_check_TensorPlaceholder_by(): `
          + `inputTensorPlaceholder's ( height, width, channelCount, channelCount_lowerHalf, channelCount_higherHalf ) = `
          + `( ${inputTensorPlaceholder.height}, ${inputTensorPlaceholder.width}, ${inputTensorPlaceholder.channelCount}, `
            + `${inputTensorPlaceholder.channelCount_lowerHalf}, ${inputTensorPlaceholder.channelCount_higherHalf} ) `
          + `should be `
          + `( ${input_height}, ${input_width}, ${input_channelCount}, ${input_channelCount_lowerHalf}, ${input_channelCount_higherHalf} ).`
        );

      if ( inputScaleBoundsArray.length != input_channelCount )
        throw Error( `Block.input_TensorPlaceholder.create_or_check_TensorPlaceholder_by(): `
          + `inputScaleBoundsArray's length ( ${inputScaleBoundsArray.length} ) should be the same as `
          + `input's channel count ( ${input_channelCount} ).`
        );

      return inputTensorPlaceholder;

    // 3.
    } else {
      throw Error( `Block.input_TensorPlaceholder.create_or_check_TensorPlaceholder_by(): `
        + `input_ScaleBoundsArray_or_TensorPlaceholder shoulde be an instance of either `
        + `ActivationEscaping.ScaleBoundsArray or TensorPlaceholder.Base.`
      );
    }
  }

  /**
   * Determine the following properties:
   *   - this.input0
   *   - this.input1
   *
   * @param {ActivationEscaping.ScaleBoundsArray|TensorPlaceholder.Base} input0_ScaleBoundsArray_or_TensorPlaceholder
   *   The input0's information.
   *     - If it is an ActivationEscaping.ScaleBoundsArray object, a new TensorPlaceholder will be created.
   *     - If it is a TensorPlaceholder.Base object, it will be used (not cloned) as input0's TensorPlaceholder directly.
   *
   * @param {ActivationEscaping.ScaleBoundsArray|TensorPlaceholder.Base} input1_ScaleBoundsArray_or_TensorPlaceholder
   *   The input1's information.
   *     - If it is an ActivationEscaping.ScaleBoundsArray object, a new TensorPlaceholder will be created.
   *     - If it is a TensorPlaceholder.Base object, it will be used (not cloned) as input1's TensorPlaceholder directly.
   *
   *
   *
   */
  static set_input0_input1_TensorPlaceholder_by(
    inputTensorCount,
    input0_height, input0_width, input0_channelCount, input0_ScaleBoundsArray_or_TensorPlaceholder,
    input1_height, input1_width, input1_channelCount, input1_ScaleBoundsArray_or_TensorPlaceholder,
    pointwise1_inputChannelCount_lowerHalf, pointwise1_inputChannelCount_higherHalf,
  ) {

    if ( inputScaleBoundsArray0.length != input0_channelCount )
      throw Error( `Block.Params.set_input0_input1_TensorPlaceholder(): `
        + `inputScaleBoundsArray0's length ( ${inputScaleBoundsArray0.length} ) should be the same as `
        + `input0's channel count ( ${input0_channelCount} ).`
      );

    this.input0 = TensorPlaceholder.Base.Pool.get_or_create_by();
    this.input0.set_height_width_channelCount_scaleBoundsArray(
      input0_height, input0_width,
      input0_channelCount, pointwise1_inputChannelCount_lowerHalf, pointwise1_inputChannelCount_higherHalf,
      inputScaleBoundsArray0 );

    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY (3) )
    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL (4) )
    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY (10) )
    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL (11) )
    //
    if ( inputTensorCount > 1 ) {

      if ( inputScaleBoundsArray1.length != input1_channelCount )
        throw Error( `Block.Params.set_input0_input1_TensorPlaceholder(): `
          + `inputScaleBoundsArray1's length ( ${inputScaleBoundsArray1.length} ) should be the same as `
          + `input1's channel count ( ${input1_channelCount} ).`
        );

      this.input1 = TensorPlaceholder.Base.Pool.get_or_create_by();
      this.input1.set_height_width_channelCount_scaleBoundsArray(
        input1_height, input1_width, input1_channelCount,
        undefined, undefined, // channelCount_lowerHalf, channelCount_higherHalf
        inputScaleBoundsArray1 );
    }
  }

}

