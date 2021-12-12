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

//!!! ...unfinished... (2021/12/12)

}

