export { ValueBoundsSet };

import * as ConvBiasActivation from "../ConvBiasActivation.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";

/**
 * The element value bounds for pointwise convolution-bias-activation.
 *
 */
class ValueBoundsSet extends ConvBiasActivation.ValueBoundsBase {

  /**
   */
  constructor() {
    super();
  }

  /**
   *
   * @param {ConvBiasActivation.ValueBoundsSet} previous_ConvBiasActivation_ValueBoundsSet
   *   The previous convolution-bias-activation value bounds set of this pointwise convolution.   
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
  set_by( previous_ConvBiasActivation_ValueBoundsSet, bPointwise, inputChannelCount, bBias, nActivationId ) {

    // 0. Default as ValueBoundsSet.output of previous convolution-bias-activation.
    this.resetBy_Bounds( previous_ConvBiasActivation_ValueBoundsSet.output );

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
    this.set_output_byActivationId( nActivationId );

    // 4. ActivationEscaping.ScaleTranslateSet.
    this.activationEscaping_ScaleTranslateSet.setBy_currentValueBoundsSet_previousActivationEscaping(
      this, previous_ConvBiasActivation_ValueBoundsSet.activationEscaping_ScaleTranslateSet );
  }

}

