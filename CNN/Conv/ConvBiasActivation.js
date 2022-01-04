export { ValueBoundsSet };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ActivationEscapeing from "./ActivationEscapeing.js";

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.

/**
 * Several element value bounds for convolution-bias-activation operations.
 *
 *
 * @member {FloatValue.BoundsArray} input
 *   The bounds of the input element value. Or say, the domain of the convolution-bias-activation.
 *
 * @member {FloatValue.BoundsArray} beforeActivation
 *   The bounds of the element value after convolution and bias operation (but before activation).
 *
 * @member {FloatValue.BoundsArray} output
 *   The bounds of the output element value. Or say, the range of the convolution-bias-activation.
 *
 * @member {ActivationEscapeing.ScaleTranslateSet} activationEscaping_ScaleTranslateSet
 *   The scale-translate for moving beforeActivation bounds into the linear domain of the activation function. That is, for
 * letting beforeActivation escape from activation function's non-linear domain.
 */
class ValueBoundsSet {

  /**
   */
  constructor( inputChannelCount, outputChannelCount ) {
    this.input = new FloatValue.BoundsArray( inputChannelCount );
    this.input.set_all_byBounds( Weights.Base.ValueBounds );

    this.beforeActivation = new FloatValue.BoundsArray( outputChannelCount );
    this.beforeActivation.set_all_byBounds( Weights.Base.ValueBounds );

    this.output = new FloatValue.BoundsArray( outputChannelCount );
    this.output.set_all_byBounds( Weights.Base.ValueBounds );

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.
    this.activationEscaping_ScaleTranslateSet = new ActivationEscapeing.ScaleTranslateSet();
  }

  clone() {
    let result = new ValueBoundsSet();
    result.setBy_ValueBoundsSet( this );
    return result;
  }

  /**
   * @param {ValueBoundsSet} aValueBoundsSet
   *   The ValueBoundsSet to be copied.
   *
   * @return {ValueBoundsSet}
   *   Return this (modified) object which is copied from aValueBoundsSet.
   */
  set_ValueBoundsSet( aValueBoundsSet ) {
    this.input.set_BoundsArray( aValueBoundsSet.input );
    this.beforeActivation.set_BoundsArray( aValueBoundsSet.beforeActivation );
    this.output.set_BoundsArray( aValueBoundsSet.output );

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.
    this.activationEscaping_ScaleTranslateSet.setBy_ScaleTranslateSet( aValueBoundsSet.activationEscaping_ScaleTranslateSet );
    return this;
  }

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set this.input, this.beforeActivation, this.output all the same as the specified aBounds. Set the
   * this.activationEscaping_ScaleTranslateSet to default ( 1, 0 );
   *
   * @return {ValueBoundsSet}
   *   Return this (modified) object which is copied from aValueBoundsSet.
   */
  resetBy_Bounds( aBounds ) {
    this.input.set_BoundsArray( aBounds );
    this.beforeActivation.set_BoundsArray( aBounds );
    this.output.set_BoundsArray( aBounds );

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.
    this.activationEscaping_ScaleTranslateSet.reset( 1, 0 ); // scale 1 and translate 0. (i.e. no scale and no translate.)
    return this;
  }

  /**
   * Determine output value bounds. Set this.output according to this.beforeActivation and the specified nActivationId.
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
   *     - If ( nActivationId == ValueDesc.ActivationFunction.Singletion.Ids.NONE ), this.output will be the same as this.beforeActivation.
   *     - Otherwise, this.output will be the same as the output range of the activation function.
   */
  set_output_by_beforeActivation_ActivationId( nActivationId ) {

    // If there is no activation function, the output range is determined by input domain, filters, biases.
    if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
      this.output.set_BoundsArray( this.beforeActivation );

    // Otherwise, the activation function dominates the output range.
    } else {
      let info = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );
      this.output.set_Bounds( info.outputRange );
    }

  }

}

