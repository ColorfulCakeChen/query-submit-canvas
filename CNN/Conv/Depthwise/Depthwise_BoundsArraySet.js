export { BoundsArraySet };

import * as ConvBiasActivation from "../ConvBiasActivation.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";

/**
 * The element value bounds set for depthwise convolution-bias-activation.
 *
 */
class BoundsArraySet extends ConvBiasActivation.BoundsArraySet {

  /**
   */
  constructor() {
    super();
  }

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.

  /**
   *
   * @param {ConvBiasActivation.BoundsArraySet} previous_ConvBiasActivation_BoundsArraySet
   *   The previous convolution-bias-activation value bounds set of this depthwise convolution.   
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
   set_by( previous_ConvBiasActivation_BoundsArraySet, bDepthwise, filterHeight, filterWidth, bBias, nActivationId ) {

    // 0. Default as BoundsArraySet.output of previous convolution-bias-activation.
    this.reset_byBounds( previous_ConvBiasActivation_BoundsArraySet.output );

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
      this.beforeActivation.multiply_all_byBounds( filtersValueBounds ).multiply_all_byN( filterSize );

      if ( bBias )
        this.beforeActivation.add_all_byBounds( biasesValueBounds );


//!!! ...unfinished... (2021/12/26)
// The .undo should also be applied to the real filter value and bias value of this convolution-bias (i.e. not just applied here ScaleTranslate).
//
// Problem: What if this convolution-bias-activation could only undo partially (e.g. this convolution does not have bias)?
//   How should the .undo of this convolution-bias-activation be calculated?
      {
        this.beforeActivation.multiply_all_byN(
          previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet.undo.scale );

        if ( this.bBias )
          this.beforeActivation.add_all_byN(
            previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet.undo.translate );
      }

    }

    // 3. Output.
    this.set_output_by_beforeActivation_ActivationId( nActivationId );

    // 4. ActivationEscaping.ScaleTranslateArraySet.
    this.activationEscaping_ScaleTranslateArraySet.set_by_currentBoundsArraySet_previousActivationEscaping(
      this, previous_ConvBiasActivation_BoundsArraySet.activationEscaping_ScaleTranslateArraySet );
  }

}

