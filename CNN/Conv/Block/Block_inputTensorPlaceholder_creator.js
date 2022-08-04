export { inputTensorPlaceholder_creator };

import * as ActivationEscaping from "../ActivationEscaping.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";

/**
 * A helper for preparing input TensorPlaceholder of Block.Base (especially for ShuffleNetV2_ByMopbileNetV1's head/body/tail).
 *
 *
 */
class inputTensorPlaceholder_creator {

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
        throw Error( `Block.inputTensorPlaceholder_creator.create_or_check_TensorPlaceholder_by(): `
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
          || ( inputTensorPlaceholder.width != input_width )
          || ( inputTensorPlaceholder.channelCount != input_channelCount )
          || ( inputTensorPlaceholder.channelCount_lowerHalf != input_channelCount_lowerHalf )
          || ( inputTensorPlaceholder.channelCount_higherHalf != input_channelCount_higherHalf )
         )
        throw Error( `Block.inputTensorPlaceholder_creator.create_or_check_TensorPlaceholder_by(): `
          + `inputTensorPlaceholder's ( height, width, channelCount ( channelCount_lowerHalf, channelCount_higherHalf ) ) = `
          + `( ${inputTensorPlaceholder.height}, ${inputTensorPlaceholder.width}, ${inputTensorPlaceholder.channelCount} `
            + `( ${inputTensorPlaceholder.channelCount_lowerHalf}, ${inputTensorPlaceholder.channelCount_higherHalf} ) ) `
          + `should be `
          + `( ${input_height}, ${input_width}, ${input_channelCount} `
            + `( ${input_channelCount_lowerHalf}, ${input_channelCount_higherHalf} ) ).`
        );

      if ( inputScaleBoundsArray.length != input_channelCount )
        throw Error( `Block.inputTensorPlaceholder_creator.create_or_check_TensorPlaceholder_by(): `
          + `inputScaleBoundsArray's length ( ${inputScaleBoundsArray.length} ) should be the same as `
          + `input's channel count ( ${input_channelCount} ).`
        );

      return inputTensorPlaceholder;

    // 3.
    } else {
      throw Error( `Block.inputTensorPlaceholder_creator.create_or_check_TensorPlaceholder_by(): `
        + `input_ScaleBoundsArray_or_TensorPlaceholder shoulde be an instance of either `
        + `ActivationEscaping.ScaleBoundsArray or TensorPlaceholder.Base.`
      );
    }
  }

  /**
   * Determine the following properties:
   *   - this.input0
   *   - this.input0_bOwned
   *   - this.input1
   *   - this.input1_bOwned
   *
   * @param {ActivationEscaping.ScaleBoundsArray|TensorPlaceholder.Base} input0_ScaleBoundsArray_or_TensorPlaceholder
   *   The input0's information.
   *
   *     - If it is an ActivationEscaping.ScaleBoundsArray object, a new TensorPlaceholder will be created.
   *         .input0_bOwned will be true (which means caller is responsible for releasing it).
   *
   *     - If it is a TensorPlaceholder.Base object, it will be used (not cloned) as input0's TensorPlaceholder directly.
   *         .input0_bOwned will be false.
   *
   * @param {ActivationEscaping.ScaleBoundsArray|TensorPlaceholder.Base} input1_ScaleBoundsArray_or_TensorPlaceholder
   *   The input1's information.
   *
   *     - If it is an ActivationEscaping.ScaleBoundsArray object, a new TensorPlaceholder will be created.
   *         .input1_bOwned will be true (which means caller is responsible for releasing it).
   *
   *     - If it is a TensorPlaceholder.Base object, it will be used (not cloned) as input1's TensorPlaceholder directly.
   *         .input1_bOwned will be false.
   *
   */
  static set_input0_input1_TensorPlaceholder_by(
    inputTensorCount,
    input0_height, input0_width, input0_channelCount, input0_ScaleBoundsArray_or_TensorPlaceholder,
    input1_height, input1_width, input1_channelCount, input1_ScaleBoundsArray_or_TensorPlaceholder,
    pointwise1_inputChannelCount_lowerHalf, pointwise1_inputChannelCount_higherHalf
  ) {

    // 1. input0
    this.input0 = inputTensorPlaceholder_creator.create_or_check_TensorPlaceholder_by(
      input0_height, input0_width, input0_channelCount,
      pointwise1_inputChannelCount_lowerHalf, pointwise1_inputChannelCount_higherHalf,
      input0_ScaleBoundsArray_or_TensorPlaceholder
    );

    if ( this.input0 == input0_ScaleBoundsArray_or_TensorPlaceholder )
      this.input0_bOwned = false;
    else 
      this.input0_bOwned = true; // Because it is created here.

    // 2. input1
    //
    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY (3) )
    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL (4) )
    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY (10) )
    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_TAIL (11) )
    //
    if ( inputTensorCount > 1 ) {

      this.input1 = inputTensorPlaceholder_creator.create_or_check_TensorPlaceholder_by(
        input1_height, input1_width, input1_channelCount,
        undefined, undefined, // channelCount_lowerHalf, channelCount_higherHalf
        input1_ScaleBoundsArray_or_TensorPlaceholder
      );

      if ( this.input1 == input1_ScaleBoundsArray_or_TensorPlaceholder )
        this.input1_bOwned = false;
      else 
        this.input1_bOwned = true; // Because it is created here.

    } else {
      if ( input1_ScaleBoundsArray_or_TensorPlaceholder != null )
        throw Error( `Block.inputTensorPlaceholder_creator.set_input0_input1_TensorPlaceholder_by(): `
          + `input1_ScaleBoundsArray_or_TensorPlaceholder ( ${input1_ScaleBoundsArray_or_TensorPlaceholder} ) should null `
          + `when ( inputTensorCount ( ${inputTensorCount} ) <= 1 ).`
        );
    }
  }

}

