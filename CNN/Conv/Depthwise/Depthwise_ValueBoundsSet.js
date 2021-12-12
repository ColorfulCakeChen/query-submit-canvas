export { ValueBoundsSet };

import * as ConvBiasActivation from "../ConvBiasActivation.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";

/**
 * The value bounds set for depthwise convolution-bias-activation.
 *
 */
class ValueBoundsSet extends ConvBiasActivation.ValueBoundsSet {

  /**
   * @param {ConvBiasActivation.ValueBoundsSet} previous
   *   The previous convolution-bias-activation value bounds set of this depthwise convolution.
   */
  constructor( previous ) {
    super( previous );

//!!! ...unfinished... (2021/12/12) previous?
  }

  /**
   *
   * @param {boolean} bDepthwise
   *   If true, the depthwise convolution (with/without bias, with/without activation) exists. 
   *
   * @param {number} filterHeight
   *   The filter height of the depthwise convolution. 
   *
   * @param {number} filterWidth
   *   The filter width of the depthwise convolution. 
   *
   * @param {boolean} bBias
   *   If true, the bias operation exists. 
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
   */
   set_beforeActivation_output_by( bDepthwise, filterHeight, filterWidth, bBias, nActivationId ) {

    // 0. Default as input.
    this.set_beforeActivation_output_byClone_input();

    // 1. No operation at all.
    if ( !bDepthwise )
      return;

    // 2. Before activation function.
    {
      // Because they are extracted from Weights which should have been regulated by Weights.Base.ValueBounds.Float32Array_RestrictedClone().
      const filtersValueBounds = Weights.Base.ValueBounds;
      const biasesValueBounds = Weights.Base.ValueBounds;

      // Note: For maximum pooling, the multiply_Bounds is a little bit overestimated (but should be acceptable).
      let filterSize = filterHeight * filterWidth;
      this.beforeActivation.multiply_Bounds_multiply_N( filtersValueBounds, filterSize );

      if ( bBias )
        this.beforeActivation.add_Bounds( biasesValueBounds );
    }

    // 3. Output.
    this.set_output_byActivationId( nActivationId );
  }

}

