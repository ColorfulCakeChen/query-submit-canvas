export { Base };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";

/**
 *
 * @member {FloatValue.Bounds} input
 *   The bounds of the input element value. Or say, the domain of the convolution-bias-activation.
 *
 * @member {FloatValue.Bounds} beforeActivation
 *   The bounds of the element value after convolution and bias operation (but before activation).
 *
 * @member {FloatValue.Bounds} output
 *   The bounds of the output element value. Or say, the range of the convolution-bias-activation.
 *
 * @member {FloatValue.ScaleTranslate} beforeActivation_to_activationLinearDomain_ScaleTranslate
 *   The scale-translate for letting beforeActivation bounds moving into the linear domain of the activation function. That is,
 * for letting beforeActivation escape from activation function's non-linear domain.
 */
class Base {

  /**
   * @param {FloatValue.Bounds} inputValueBounds
   *   The bounds of the input element value. Or say, the domain of this convolution-bias-activation.
   */
  constructor( inputValueBounds ) {
    this.input = inputValueBounds.clone(); // (Copy for preventing from modifying.)
  }

  /**
   * Set this.input, this.beforeActivation, this.output by copying the specified inputValueBounds.
   *
   * @param {FloatValue.Bounds} inputValueBounds
   *   The bounds of the input element value. Or say, the domain of this convolution-bias-activation.
   */
  set_all_byClone( inputValueBounds ) {
    this.input = inputValueBounds.clone();
    this.set_beforeActivation_output_byClone_input();
  }

  /**
   * Set this.beforeActivation and this.output by copying this.input.
   */
  set_beforeActivation_output_byClone_input() {
    this.beforeActivation = this.input.clone();
    this.output = this.input.clone();
    this.beforeActivation_to_activationLinearDomain_ScaleTranslate( 1, 0 ); // scale 1 and translate 0. i.e. no change.
  }

  /**
   * Set this.output according to this.beforeActivation and the specified nActivationId. This method will also calculate
   * this.beforeActivation_to_activationLinearDomain_ScaleTranslate.
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
   *     - If ( nActivationId == ValueDesc.ActivationFunction.Singletion.Ids.NONE ), this.output will be the same as this.beforeActivation.
   *     - Otherwise, this.output will be the same as the output range of the activation function.
   */
  set_output_byActivationId( nActivationId ) {

    // 1. Determine output value bounds.
    {
      // If there is no activation function, the output range is determined by input domain, filters, biases.
      if ( this.nActivationId == ValueDesc.ActivationFunction.Singletion.Ids.NONE ) {
        this.output.set_Bounds( this.beforeActivation );

      // Otherwise, the activation function dominates the output range.
      } else {
        let info = ValueDesc.ActivationFunction.Singletion.getInfoById( this.nActivationId );
        this.output.set_Bounds( info.outputRange );
      }
    }

    // 2. Calculate the scale-translate for escaping activation function's non-linear domain.
    this.beforeActivation_to_activationLinearDomain_ScaleTranslate.setBy_FromTo( this.beforeActivation, this.output );
  }

//!!! ...unfinished... (2021/12/11) combine undoPreviousScaleTranslate with this keepLinearScaleTranslate.

}

