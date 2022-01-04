export { BoundsArraySet };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ActivationEscaping from "./ActivationEscaping.js";

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
 * @member {ActivationEscaping.ScaleTranslateArraySet} activationEscaping_ScaleTranslateArraySet
 *   The scale-translate for moving beforeActivation bounds into the linear domain of the activation function. That is, for
 * letting beforeActivation escape from activation function's non-linear domain.
 */
class BoundsArraySet {

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
    this.activationEscaping_ScaleTranslateArraySet = new ActivationEscaping.ScaleTranslateArraySet();
  }

  clone() {
    let result = new BoundsArraySet();
    result.set_byBoundsArraySet( this );
    return result;
  }

  /**
   * @param {BoundsArraySet} aBoundsArraySet
   *   The BoundsArraySet to be copied.
   *
   * @return {BoundsArraySet}
   *   Return this (modified) object which is copied from aBoundsArraySet.
   */
  set_byBoundsArraySet( aBoundsArraySet ) {
    this.input.set_all_byBoundsArray( aBoundsArraySet.input );
    this.beforeActivation.set_all_byBoundsArray( aBoundsArraySet.beforeActivation );
    this.output.set_all_byBoundsArray( aBoundsArraySet.output );

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.
    this.activationEscaping_ScaleTranslateArraySet.set_byScaleTranslateArraySet( aBoundsArraySet.activationEscaping_ScaleTranslateArraySet );
    return this;
  }

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set this.input, this.beforeActivation, this.output all the same as the specified aBounds. Set the
   * this.activationEscaping_ScaleTranslateArraySet to default ( 1, 0 );
   *
   * @return {BoundsArraySet}
   *   Return this (modified) object which is copied from aBoundsArraySet.
   */
  reset_byBounds( aBounds ) {
    this.input.set_all_byBounds( aBounds );
    this.beforeActivation.set_all_byBounds( aBounds );
    this.output.set_all_byBounds( aBounds );

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.
    this.activationEscaping_ScaleTranslateArraySet.reset_by_scale_translate( 1, 0 ); // scale 1 and translate 0. (i.e. no scale and no translate.)
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
      this.output.set_all_byBoundsArray( this.beforeActivation );

    // Otherwise, the activation function dominates the output range.
    } else {
      let info = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );
      this.output.set_all_byBounds( info.outputRange );
    }

  }

}

