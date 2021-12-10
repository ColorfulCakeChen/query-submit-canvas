export { Base };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";

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
 */
class Base {

  /**
   * @param {FloatValue.Bounds} inputValueBounds
   *   The bounds of the input element value. Or say, the domain of this pointwise convolution.
   */
  constructor( inputValueBounds ) {
    this.input = inputValueBounds.clone(); // (Copy for preventing from modifying.)
    this.beforeActivation = this.input.clone();
    this.output = this.input.clone();
  }

//!!! ...unfinished... (2021/12/10)

  /**
   *
   * @param {boolean} bPointwise
   *   If true, the pointwise convolution (with/without bias, with/without activation) exists. 
   *
   * @param {number} inputChannelCount
   *   The input channel count of the pointwise convolution. 
   *
   * @param {boolean} bBias
   *   If true, the bias operation exists. 
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
   */
  set_by( bPointwise, inputChannelCount, bBias, nActivationId ) {

    // 0. Default.
    this.beforeActivation = this.input.clone();
    this.output = this.input.clone();

    // 1. No operation at all.
    if ( !bPointwise )
      return;

    // 2. Before activation function.
    {
      // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
      const filtersValueBounds = Weights.Base.ValueBounds;
      const biasesValueBounds = Weights.Base.ValueBounds;

      this.beforeActivation.multiply_Bounds_multiply_N( filtersValueBounds, inputChannelCount );

      if ( bBias )
        this.beforeActivation.add_Bounds( biasesValueBounds );
    }

    // 3. Output.

    // If there is activation function, it dominates the output range.
    if ( this.nActivationId != ValueDesc.ActivationFunction.Singletion.Ids.NONE ) {
      let info = ValueDesc.ActivationFunction.Singletion.getInfoById( this.nActivationId );
      this.output.set_Bounds( info.outputRange );

    // Otherwise, the output range is determined by input domain, filters, biases.
    } else {
      this.output.set_Bounds( this.beforeActivation );
    }
  }

}

