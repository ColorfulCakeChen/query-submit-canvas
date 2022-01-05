export { ScaleTranslateArraySet };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ConvBiasActivation from "./ConvBiasActivation.js";

/**
 * Several scale-translate for escaping a value bounds from being activated (i.e. being non-linearized) by activation function.
 *
 *
 * @member {FloatValue.ScaleTranslateArray} doWithoutPreviousUndo
 *   The scale-translate for moving current value bounds into the linear domain of the activation function. That is, for letting
 * ConvBiasActivation.BoundsArraySet.beforeActivation escape from activation function's non-linear domain into linear domain.
 *
 * @member {FloatValue.ScaleTranslateArray} do
 *   The result of combining this.doWithoutPreviousUndo with previous ActivationEscape.ScaleTranslateSet.undo. It both undo the
 * previous escaping scale-translate and do itself escaping scale-translate.
 *
 * @member {FloatValue.ScaleTranslateArray} undo
 *   If apply this.undo (important: scale first, translate second), it will have the effect of undoing the this.do.
 */
class ScaleTranslateArraySet {

  constructor() {
    this.doWithoutPreviousUndo = new FloatValue.ScaleTranslateArray();
    this.do = new FloatValue.ScaleTranslateArray();
    this.undo = new FloatValue.ScaleTranslateArray();
  }

  clone() {
    let result = new ScaleTranslateArraySet();
    result.set_byScaleTranslateSet( this );
    return result;
  }

  /**
   * @param {ScaleTranslateArraySet} aScaleTranslateSet
   *   The ScaleTranslateSet to be copied.
   */
  set_byScaleTranslateArraySet( aScaleTranslateArraySet ) {
    this.doWithoutPreviousUndo.set_all_byScaleTranslateArray( aScaleTranslateArraySet.doWithoutPreviousUndo );
    this.do.set_all_byScaleTranslateArray( aScaleTranslateArraySet.do );
    this.undo.set_all_byScaleTranslateArray( aScaleTranslateArraySet.undo );
  }

  /** Reset all scale-translate values. Default is ( scale = 1, translate = 0 ) (i.e. no scale and no translate). */
  reset_by_scale_translate( scale = 1, translate = 0 ) {
    this.doWithoutPreviousUndo.set_all_by_scale_translate( scale , translate );
    this.do.set_all_by_scale_translate( scale , translate );
    this.undo.set_all_by_scale_translate( scale , translate );
  }

//!!! ...unfinished... (2021/12/26)
/**
 * - For depthwise with ( pad == same ), it seems that the activation escaping can not be undone completely, because pad is always 0
 *   (can not scale-translate). Unless, pad can be non-zero?
 *
 *   - Fortunately, this is not a problem for pass-through channels. Because the pass-through filter value is also 0 in the padded
 *       position, the result is not affected. (But its a big problem for non-pass-through channels.)
 *
 *   - Perhaps, force use ( pad == valid ) so that the activation escaping always can be undone completely.
 *
 *     - In original ShuffleNetV2, using ( pad == same ) is necessary for concatenating ( depthwise1, input1 ).
 *
 *     - In our combined-depthwise1-with-higher-half-pass-through (i.e. ONE_INPUT_HALF_THROUGH_XXX), the ( depthwise1, input1 )
 *         already combined together. There is no concatenation issue. So using ( pad == valid ) is possible.
 *
 *     - However, this is not so good for pass-through channels. Because the pass-through filter value is 0 at the right-bottom
 *         corner, the image value will be destroyed.
 *
 * - If previous convolution does not have activation escaping do (i.e. is a normal convolution without pass-through)，this
 *     this convolution's .do should be different.
 *
 * - Perhaps, there should be value-bounds and activation-escaping scale-translate for every single channel (i.e. lower-array,
 *     upper-array, scale-array and translate-array). Even if channels are shuffled, they could be still tracked correctly.
 *
 * - When extractFilters() and extractBiases(), pre-apply the per channel undoing scale and translate to filter-value, bias-value,
 *     and their bounds. (The .do and .undo should also affect the value bounds.)
 *
 * - When across Block (i.e. at ShuffleNetV2_ByMobileNetV1's head), the higher-half-copy-lower-half channels's value bounds
 *     does not come from previous corresponding channels. They comes from the lower-half channels which they copied from.
 *
 */

  /**
   * Set the following properties:
   *   - this.doWithoutPreviousUndo
   *   - this.do
   *   - this.undo
   *
   * @param {ConvBiasActivation.BoundsArraySet} current_ConvBiasActivation_BoundsArraySet
   *   The BoundsArraySet of current convolution-bias-activation for calculating this.doWithoutPreviousUndo.
   *
   * @param {ScaleTranslateArraySet} previous_ActivationEscaping_ScaleTranslateArraySet
   *   The ActivationEscaping.ScaleTranslateArraySet of previous convolution-bias-activation for calculating this.do.
   */
  set_by_currentBoundsArraySet_previousActivationEscaping(
    current_ConvBiasActivation_BoundsArraySet, previous_ActivationEscaping_ScaleTranslateArraySet ) {

    // Calculate the scale-translate for escaping from activation function's non-linear domain into linear domain.
    //
    // Note: This does not work for avg/max pooling.
    this.doWithoutPreviousUndo.set_all_by_fromBoundsArray_ToBoundsArray(
      current_ConvBiasActivation_BoundsArraySet.beforeActivation, current_ConvBiasActivation_BoundsArraySet.output );

    // Combine undoing previous activation escaping scale-translate and doing current activation escaping scale-translate.
    this.do.set_all_byScaleTranslateArray( previous_ActivationEscaping_ScaleTranslateArraySet.undo );
    this.do.scaleTranslate_all_byScaleTranslateArray( this.doWithoutPreviousUndo );

    // Prepare the undoing scale-translate for the next convolution-bias-activation.
    this.undo.set_all_byUndo_ScaleTranslateArray( this.do );
  }

}

/**
 * Suppose
 *   - The previous .beforeActivation is x.
 *   - The previous activation escaping is ( scale = A, translate = B )
 *   - The previous .output is ( Ax + B )
 *
 * Suppose
 *   - This pointwise input channel count is m.
 *   - This pointwise filter weights are ( U1, U2, ... Um ).
 *   - This pointwise bias weights are V.
 *
 * This pointwise .beforeActivation will be:
 *   y = ( ( Ax + B ) * U1 ) + ( ( Ax + B ) * U2 ) + ... + ( ( Ax + B ) * Um ) + V
 *     = ( AU1x + BU1 ) + ( AU2x + BU2 ) + ... + ( AUmx + BUm ) + V
 *     = ( AU1x + AU2x + ... + AUmx ) + ( BU1 + BU2 + ... + BUm ) + V
 *     = ( AU1 + AU2 + ... + AUm ) * x + ( BU1 + BU2 + ... + BUm + V )
 *
 * Suppose
 *   - This pointwise activation escaping is ( scale = C, translate = D )
 *
 * This pointwise .output will be:
 *   z = Cy + D
 *     = C * ( ( AU1 + AU2 + ... + AUm ) * x + ( BU1 + BU2 + ... + BUm + V ) ) + D
 *     = C * ( AU1 + AU2 + ... + AUm ) * x + ( C * ( BU1 + BU2 + ... + BUm + V ) ) + D
 *     = ( ACU1 + ACU2 + ... + ACUm ) * x + ( BCU1 + BCU2 + ... + BCUm + CV + D )
 *
 * How to get ( Cx + D )?
 *
 * Let
 *   - undo.scale = ( AU1 + AU2 + ... + AUm )
 *
 * undo.scale * z = Cx + ( ( C * ( BU1 + BU2 + ... + BUm + V ) ) + D ) / ( AU1 + AU2 + ... + AUm )
 *    = Cx + ( ( C * ( BU1 + BU2 + ... + BUm + V ) ) / ( AU1 + AU2 + ... + AUm ) + D / ( ( AU1 + AU2 + ... + AUm ) )
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
