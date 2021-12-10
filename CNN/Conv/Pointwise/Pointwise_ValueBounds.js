export { ValueBounds };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";

/**
 *
 * @member {FloatValue.Bounds} input
 *   The bounds of the input element value. Or say, the domain of the pointwise convolution.
 *
 * @member {FloatValue.Bounds} beforeActivation
 *   The bounds of the element value after pointwise convolution and bias operation (but before activation).
 *
 * @member {FloatValue.Bounds} output
 *   The bounds of the output element value. Or say, the range of the pointwise convolution.
 *
 */
class ValueBounds {

  /**
   * @param {FloatValue.Bounds} inputValueBounds
   *   The bounds of the input element value. Or say, the domain of this pointwise convolution.
   */
  constructor( inputValueBounds ) {
    this.input = inputValueBounds.clone(); // (Copy for preventing from modifying.)
  }

  /**
   *
   * @param {tf.tensor4d} filtersTensor4d
   *   The tensor4d for pointwise convolution. If null, it means no pointwise convolution.
   *
   * @param {tf.tensor3d} biasesTensor3d
   *   The tensor3d for bias operation. If null, it means no bias operation.
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
   */
  set_by( filtersTensor4d, biasesTensor3d, nActivationId ) {

    // 0. Default.
    this.beforeActivation = this.input.clone();
    this.output = this.input.clone();

    // 1. Before activation function.
    {
      // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
      const filtersValueBounds = Weights.Base.ValueBounds;
      const biasesValueBounds = Weights.Base.ValueBounds;

      if ( filtersTensor4d ) {
        let inDepth = filtersTensor4d.shape[ 2 ]; // i.e. input channel count.
        this.beforeActivation.multiply_Bounds_multiply_N( filtersValueBounds, inDepth );
      }

      if ( biasesTensor3d )
        this.beforeActivation.add_Bounds( biasesValueBounds );
    }

    // 2. Output.

    // If there is activation function, it dominates the output range.
    if ( this.nActivationId != ValueDesc.ActivationFunction.Singletion.Ids.NONE ) {
      let info = Base.ActivationFunction_getInfoById( this.nActivationId );
      this.output.set_Bounds( info.outputRange );

    // Otherwise, the output range is determined by input domain, filters, biases.
    } else {
      this.output.set_Bounds( this.beforeActivation );
    }
  }

}

