export { ScaleTranslateSet };

import * as FloatValue from "../../Unpacker/FloatValue.js";
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

  /** Reset all scale-translate values. Default is ( scale = 1, translate = 0 ) (i.e. no scale and no translate). */
  reset( scale = 1, translate = 0 ) {
    this.doWithoutPreviousUndo.set( scale , translate );
    this.do.set( scale , translate );
    this.undo.set( scale , translate );
  }

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
    current_ConvBiasActivation_ValueBoundsSet, previous_ActivationEscaping_ScaleTranslateSet) {

    // Calculate the scale-translate for escaping from activation function's non-linear domain into linear domain.
    //
    // Note: This does not work for avg/max pooling.
    this.doWithoutPreviousUndo.setBy_fromBounds_ToBounds(
      current_ConvBiasActivation_ValueBoundsSet.beforeActivation, current_ConvBiasActivation_ValueBoundsSet.output );

    // Combine the undoing the previous activation escaping scale-translate, and doing current activation escaping scale-translate.
    this.do.setBy_ScaleTranslate( previous_ActivationEscaping_ScaleTranslateSet.undo );
    this.do.scaleTranslateBy( this.doWithoutPreviousUndo );

    // Prepare the undoing scale-translate for the next convolution-bias-activation.
    this.undo.setBy_undoScaleTranslate( this.do );
  }

//!!! ...unfinished... (2021/12/12)
}

