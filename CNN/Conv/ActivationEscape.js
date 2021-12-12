export { ScaleTranslateSet };

import * as FloatValue from "../../Unpacker/FloatValue.js";
//import * as ValueDesc from "../../Unpacker/ValueDesc.js";


/**
 * Several scale-translate for escaping a value bounds from being activated (i.e. being non-linearized) by activation function.
 *
 *
 * @member {FloatValue.ScaleTranslate} doWithoutPreviousUndo
 *   The scale-translate for letting the value bounds moving into the linear domain of the activation function. That is,
 * for letting beforeActivation escape from activation function's non-linear domain.
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

