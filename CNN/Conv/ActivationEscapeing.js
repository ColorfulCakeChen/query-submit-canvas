export { ScaleTranslateSet };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ConvBiasActivation from "./ConvBiasActivation.js";

/**
 * Several scale-translate for escaping a value bounds from being activated (i.e. being non-linearized) by activation function.
 *
 *
 * @member {FloatValue.ScaleTranslate} doWithoutPreviousUndo
 *   The scale-translate for moving current value bounds into the linear domain of the activation function. That is, for letting
 * ConvBiasActivation.ValueBoundsSet.beforeActivation escape from activation function's non-linear domain into linear domain.
 *
 * @member {FloatValue.ScaleTranslate} do
 *   The result of combining this.doWithoutPreviousUndo with previous ActivationEscape.ScaleTranslateSet.undo. It both undo the
 * previous escaping scale-translate and do itself escaping scale-translate.
 *
 * @member {FloatValue.ScaleTranslate} undo
 *   If apply this.undo (important: scale first, translate second), it will have the effect of undoing the this.do.
 */
class ScaleTranslateSet {

  constructor() {
    this.doWithoutPreviousUndo = new FloatValue.ScaleTranslate();
    this.do = new FloatValue.ScaleTranslate();
    this.undo = new FloatValue.ScaleTranslate();
  }

  clone() {
    let result = new ScaleTranslateSet();
    result.setBy_ScaleTranslateSet( this );
    return result;
  }

  /**
   * @param {ScaleTranslateSet} another
   *   The ScaleTranslateSet to be copied.
   */
  setBy_ScaleTranslateSet( another ) {
    this.doWithoutPreviousUndo.setBy_ScaleTranslate( another.doWithoutPreviousUndo );
    this.do.setBy_ScaleTranslate( another.do );
    this.undo.setBy_ScaleTranslate( another.undo );
  }

  /** Reset all scale-translate values. Default is ( scale = 1, translate = 0 ) (i.e. no scale and no translate). */
  reset( scale = 1, translate = 0 ) {
    this.doWithoutPreviousUndo.set( scale , translate );
    this.do.set( scale , translate );
    this.undo.set( scale , translate );
  }

//!!! ...unfinished... (2021/12/26)
//
// - For depthwise with ( pad == same ), it seems that the activation escaping can not be undone completely, because pad is always 0
//   (can not scale-translate). Unless, pad can be non-zero?
//
//   - Perhaps, force use ( pad == valid ) so that the activation escaping always can be undone completely.
//   - In original ShuffleNetV2, using ( pad == same ) is necessary for concatenating ( depthwise1, input1 ).
//   - However, in our combined-depthwise1-with-higher-half-pass-through (i.e. ONE_INPUT_HALF_THROUGH_XXX), the ( depthwise1, input1 )
//       already combined together. There is no concatenation issue. So using ( pad == valid ) is possible.
//
// - If previous convolution does not have activation escaping do (i.e. is a normal convolution without pass-through)，this
//     this convolution's .do should be different.
//
// - Perhaps, there should be value-bounds and activation-escaping scale-translate for every single channel (i.e. lower-array,
//     upper-array, scale-array and translate-array). Even if channels are shuffled, they could be still tracked correctly.
//
// - When extractFilters() and extractBiases(), pre-apply the per channel undoing scale and translate to filter-value, bias-value,
//     and their bounds. (The .do and .undo should also affect the value bounds.)
//
// - When across Block (i.e. at ShuffleNetV2_ByMobileNetV1's head), the higher-half-copy-lower-half channels's value bounds
//     does not come from previous corresponding channels. They comes from the lower-half channels which they copied from.
//

  /**
   * Set the following properties:
   *   - this.doWithoutPreviousUndo
   *   - this.do
   *   - this.undo
   *
   * @param {ConvBiasActivation.ValueBoundsSet} current_ConvBiasActivation_ValueBoundsSet
   *   The ValueBoundsSet of current convolution-bias-activation for calculating this.doWithoutPreviousUndo.
   *
   * @param {ScaleTranslateSet} previous_ActivationEscaping_ScaleTranslateSet
   *   The ActivationEscaping.ScaleTranslateSet of previous convolution-bias-activation for calculating this.do.
   */
  setBy_currentValueBoundsSet_previousActivationEscaping(
    current_ConvBiasActivation_ValueBoundsSet, previous_ActivationEscaping_ScaleTranslateSet ) {

    // Calculate the scale-translate for escaping from activation function's non-linear domain into linear domain.
    //
    // Note: This does not work for avg/max pooling.
    this.doWithoutPreviousUndo.setBy_fromBounds_ToBounds(
      current_ConvBiasActivation_ValueBoundsSet.beforeActivation, current_ConvBiasActivation_ValueBoundsSet.output );

//!!! ...unfinished... (2021/12/26)
// The .undo should also be applied to the real filter value and bias value of this convolution-bias (i.e. not just applied here ScaleTranslate).
//
// Problem: What if this convolution-bias-activation could only undo partially (e.g. this convolution does not have bias)?
//   How should the .undo of this convolution-bias-activation be calculated?


    // Combine undoing previous activation escaping scale-translate and doing current activation escaping scale-translate.
    this.do.setBy_ScaleTranslate( previous_ActivationEscaping_ScaleTranslateSet.undo );
    this.do.scaleTranslateBy( this.doWithoutPreviousUndo );

    // Prepare the undoing scale-translate for the next convolution-bias-activation.
    this.undo.setBy_undoScaleTranslate( this.do );
  }

}

