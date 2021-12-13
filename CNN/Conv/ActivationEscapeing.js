export { ScaleTranslateSet };

import * as FloatValue from "../../Unpacker/FloatValue.js";
//import * as ValueDesc from "../../Unpacker/ValueDesc.js";


/**
 * Several scale-translate for escaping a value bounds from being activated (i.e. being non-linearized) by activation function.
 *
 *

//!!! ...unfinished... (2021/12/12)

 * @member {FloatValue.ScaleTranslate} doWithoutPreviousUndo
 *   The scale-translate for letting the value bounds moving into the linear domain of the activation function. That is,
 * for letting ConvBiasActivation.ValueBoundsSet.beforeActivation escape from activation function's non-linear domain.
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

}

