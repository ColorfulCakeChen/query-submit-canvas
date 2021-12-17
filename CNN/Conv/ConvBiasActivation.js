export { ValueBoundsSet };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ActivationEscapeing from "./ActivationEscapeing.js";

/**
 * Several element value bounds for convolution-bias-activation operations.
 *
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
 * @member {ActivationEscapeing.ScaleTranslateSet} activationEscaping_ScaleTranslateSet
 *   The scale-translate for moving beforeActivation bounds into the linear domain of the activation function. That is, for
 * letting beforeActivation escape from activation function's non-linear domain.
 */
class ValueBoundsSet {

  /**
   */
  constructor() {
    this.input = Weights.Base.ValueBounds.clone();
    this.beforeActivation = Weights.Base.ValueBounds.clone();
    this.output = Weights.Base.ValueBounds.clone();
    this.activationEscaping_ScaleTranslateSet = new ActivationEscapeing.ScaleTranslateSet();
  }

  clone() {
    let result = new ValueBoundsSet();
    result.setBy_ValueBoundsSet( this );
    return result;
  }

  /**
   * @param {ValueBoundsSet} another
   *   The ValueBoundsSet to be copied.
   */
  setBy_ValueBoundsSet( another ) {
    this.input.set_Bounds( another.input );
    this.beforeActivation.set_Bounds( another.beforeActivation );
    this.output.set_Bounds( another.output );
    this.activationEscaping_ScaleTranslateSet.setBy_ScaleTranslateSet( another.activationEscaping_ScaleTranslateSet );
  }

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set this.input, this.beforeActivation, this.output all the same as the specified aBounds. Set the
   * this.activationEscaping_ScaleTranslateSet to default ( 1, 0 );
   */
  resetBy_Bounds( aBounds ) {
    this.input.set_Bounds( aBounds );
    this.beforeActivation.set_Bounds( aBounds );
    this.output.set_Bounds( aBounds );
    this.activationEscaping_ScaleTranslateSet.reset( 1, 0 ); // scale 1 and translate 0. (i.e. no scale and no translate.)
  }

  /**
   * Determine output value bounds. Set this.output according to this.beforeActivation and the specified nActivationId.
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
   *     - If ( nActivationId == ValueDesc.ActivationFunction.Singletion.Ids.NONE ), this.output will be the same as this.beforeActivation.
   *     - Otherwise, this.output will be the same as the output range of the activation function.
   */
  set_output_byActivationId( nActivationId ) {

    // If there is no activation function, the output range is determined by input domain, filters, biases.
    if ( this.nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
      this.output.set_Bounds( this.beforeActivation );

    // Otherwise, the activation function dominates the output range.
    } else {
      let info = ValueDesc.ActivationFunction.Singletion.getInfoById( this.nActivationId );
      this.output.set_Bounds( info.outputRange );
    }

  }

}

