export { ScaleTranslateArraySet };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ConvBiasActivation from "./ConvBiasActivation.js";

/**
 * Several scale-translate for escaping a value bounds from being activated (i.e. being non-linearized) by activation function.
 *
 *
 * @member {FloatValue.ScaleTranslateArray} doWithoutPreviousUndo
 *   The scale-translate for moving current value bounds into the linear domain of the activation function. That is, for letting
 * ConvBiasActivation.BoundsArraySet.beforeActivation escape from activation function's non-linear domain into linear domain.
 *
 * @member {FloatValue.ScaleTranslateArray} do
 *   The result of combining this.doWithoutPreviousUndo with previous ActivationEscape.ScaleTranslateSet.undo. It both undo the
 * previous escaping scale-translate and do itself escaping scale-translate.
 *
 * @member {FloatValue.ScaleTranslateArray} undo
 *   If apply this.undo (important: scale first, translate second), it will have the effect of undoing the this.do.
 */
class ScaleTranslateArraySet {

  constructor() {
    this.doWithoutPreviousUndo = new FloatValue.ScaleTranslateArray();
    this.do = new FloatValue.ScaleTranslateArray();
    this.undo = new FloatValue.ScaleTranslateArray();
  }

  clone() {
    let result = new ScaleTranslateArraySet();
    result.set_byScaleTranslateSet( this );
    return result;
  }

  /**
   * @param {ScaleTranslateArraySet} aScaleTranslateSet
   *   The ScaleTranslateSet to be copied.
   */
  set_byScaleTranslateArraySet( aScaleTranslateArraySet ) {
    this.doWithoutPreviousUndo.set_all_byScaleTranslateArray( aScaleTranslateArraySet.doWithoutPreviousUndo );
    this.do.set_all_byScaleTranslateArray( aScaleTranslateArraySet.do );
    this.undo.set_all_byScaleTranslateArray( aScaleTranslateArraySet.undo );
  }

  /** Reset all scale-translate values. Default is ( scale = 1, translate = 0 ) (i.e. no scale and no translate). */
  reset_by_scale_translate( scale = 1, translate = 0 ) {
    this.doWithoutPreviousUndo.set_all_by_scale_translate( scale , translate );
    this.do.set_all_by_scale_translate( scale , translate );
    this.undo.set_all_by_scale_translate( scale , translate );
  }

//!!! ...unfinished... (2021/12/26)
/**
 * - For depthwise with ( pad == same ), it seems that the activation escaping can not be undone completely, because pad is always 0
 *   (can not scale-translate). Unless, pad can be non-zero?
 *
 *   - Fortunately, this is not a problem for pass-through channels. Because the pass-through filter value is also 0 in the padded
 *       position, the result is not affected. (But its a big problem for non-pass-through channels.)
 *
 *   - Perhaps, force use ( pad == valid ) so that the activation escaping always can be undone completely.
 *
 *     - In original ShuffleNetV2, using ( pad == same ) is necessary for concatenating ( depthwise1, input1 ).
 *
 *     - In our combined-depthwise1-with-higher-half-pass-through (i.e. ONE_INPUT_HALF_THROUGH_XXX), the ( depthwise1, input1 )
 *         already combined together. There is no concatenation issue. So using ( pad == valid ) is possible.
 *
 *     - However, this is not so good for pass-through channels. Because the pass-through filter value is 0 at the right-bottom
 *         corner, the image value will be destroyed.
 *
 * - If previous convolution does not have activation escaping do (i.e. is a normal convolution without pass-through)，this
 *     this convolution's .do should be different.
 *
 * - Perhaps, there should be value-bounds and activation-escaping scale-translate for every single channel (i.e. lower-array,
 *     upper-array, scale-array and translate-array). Even if channels are shuffled, they could be still tracked correctly.
 *
 * - When extractFilters() and extractBiases(), pre-apply the per channel undoing scale and translate to filter-value, bias-value,
 *     and their bounds. (The .do and .undo should also affect the value bounds.)
 *
 * - When across Block (i.e. at ShuffleNetV2_ByMobileNetV1's head), the higher-half-copy-lower-half channels's value bounds
 *     does not come from previous corresponding channels. They comes from the lower-half channels which they copied from.
 *
 */

  /**
   * Set the following properties:
   *   - this.doWithoutPreviousUndo
   *   - this.do
   *   - this.undo
   *
   * @param {ConvBiasActivation.BoundsArraySet} current_ConvBiasActivation_BoundsArraySet
   *   The BoundsArraySet of current convolution-bias-activation for calculating this.doWithoutPreviousUndo.
   *
   * @param {ScaleTranslateArraySet} previous_ActivationEscaping_ScaleTranslateArraySet
   *   The ActivationEscaping.ScaleTranslateArraySet of previous convolution-bias-activation for calculating this.do.
   */
  set_by_currentBoundsArraySet_previousActivationEscaping(
    current_ConvBiasActivation_BoundsArraySet, previous_ActivationEscaping_ScaleTranslateArraySet ) {

    // Calculate the scale-translate for escaping from activation function's non-linear domain into linear domain.
    //
    // Note: This does not work for avg/max pooling.
    this.doWithoutPreviousUndo.set_all_by_fromBoundsArray_ToBoundsArray(
      current_ConvBiasActivation_BoundsArraySet.beforeActivation, current_ConvBiasActivation_BoundsArraySet.output );

    // Combine undoing previous activation escaping scale-translate and doing current activation escaping scale-translate.
    this.do.set_all_byScaleTranslateArray( previous_ActivationEscaping_ScaleTranslateArraySet.undo );
    this.do.scaleTranslate_all_byScaleTranslateArray( this.doWithoutPreviousUndo );

    // Prepare the undoing scale-translate for the next convolution-bias-activation.
    this.undo.set_all_byUndo_ScaleTranslateArray( this.do );
  }

}

/**
 *
 * 1.
 *
 * Suppose
 *   - The previous convolution-bias-activation (i.e. pointwise or depthwise)
 *     - output channel count is q.
 *     - activation function is f()
 *     - activation escaping is ( scale = a, translate = b )
 *     - per output channel original is X  = ( x1 , x2 , ..., xq  )
 *     - per output channel modified is X' = ( x1', x2', ..., xq' ) = a * X + b
 *     - f(X') = f( a * X + b ) is guaranteed still kept linear although activation function f() is non-linear.
 *
 *   - This pointwise (or depthwise)
 *     - This pointwise input channel count is s. (Or, this depthwise filter size is s.)
 *     - output channel count is u.
 *     - per output channel filter weights are S = ( S1, S2, ..., Ss ) and will be modified to S' = ( S1', S2', ..., Ss' ).
 *     - per output channel bias weights are T = ( T1, T2, ..., Tu ) and will be modified to T' = ( T1', T2', ..., Tu' ).
 *     - activation function is g()
 *     - activation escaping is ( scale = c, translate = d )
 *     - per output channel original is Y  = ( y1 , y2 , ..., yu  ) = S  * X  + T
 *     - per output channel modified is Y' = ( y1', y2', ..., yu' ) = S' * X' + T' = c * Y + d
 *     - g(Y') = g( c * Y + d ) is guaranteed still kept linear although activation function g() is non-linear.
 *
 * Find out S' and T'.
 *
 * On one hand:
 *   Y' = S' * X' + T'
 *      = S' * ( a * X + b ) + T'
 *      = ( a * S' ) * X + ( b * S' + T' )
 *
 * On the other hand:
 *   Y' = c * Y + d
 *      = c * ( S * X + T ) + d
 *      = c * S * X + c * T + d
 *      = ( c * S ) * X + ( c * T + d )
 *
 * Implied:
 *   a * S' = c * S
 *   b * S' + T' = c * T + d
 *
 * Got:
 *   S' = ( c / a ) * S
 *   T' = ( c * T ) - ( b * S' ) + d
 *      = ( c * T ) - b * ( ( c / a ) * S ) + d
 *      = ( c * T ) - ( b * ( c / a ) * S ) + d
 *
 * Verification:
 *   Y' = S' * X' + T'
 *      = ( ( c / a ) * S ) * ( a * X + b ) + ( ( c * T ) - ( b * ( c / a ) * S ) + d )
 *      = ( c * S * X ) + ( b * ( c / a ) * S ) + ( c * T ) - ( b * ( c / a ) * S ) + d
 *      = ( c * S * X ) + ( c * T ) + d
 *      = c * ( S * X + T ) + d
 *      = c * Y + d
 *
 * Problem:
 *   - Every element (not only every channel) needs have itself T' because T' depends on S.
 *     - This is difficult to be implemented.
 *
 *   - However, if the activation escaping could have only scale and withou translate (i.e. translate = 0 ), this issue could be
 *       reduced.
 *
 *   - This implies the output range of the activation function should include both negative and positive.
 *     - So that only scale is enough to escape their non-linear part of these activation function.
 *
 *   - For example, sin(), tanh(), erf() are feasible.
 *     - But relu(), relu6(), sigmoid() are not feasible because their output always non-negative. These functions always need
 *         bias to escape their non-linear part.
 *
 *

//!!! ...unfinished... (2022/01/06)

 *
 *
 * 2. What if this pointwise (or depthwise) does not have filter weights ( S1, S2, ... Ss )? (e.g avg/max pooling)
 *
 *
 *
 *
 *
 * 3. What if this pointwise (or depthwise) does not have bias weights T?
 *
 *
 *
 *
 */
