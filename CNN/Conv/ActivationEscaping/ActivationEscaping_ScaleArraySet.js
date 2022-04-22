export { ScaleArraySet };

import * as FloatValue from "../../Unpacker/FloatValue.js";

/**
 * Several scale arrays for escaping a value bounds from being activated (i.e. being non-linearized) by activation function.
 *
 *
 * 1. Analysis
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
 * <pre>
 *   Y' = S' * X' + T'
 *      = S' * ( a * X + b ) + T'
 *      = ( a * S' ) * X + ( b * S' + T' )
 * </pre>
 *
 * On the other hand:
 * <pre>
 *   Y' = c * Y + d
 *      = c * ( S * X + T ) + d
 *      = c * S * X + c * T + d
 *      = ( c * S ) * X + ( c * T + d )
 * </pre>
 *
 * Implied:
 * <pre>
 *   a * S' = c * S
 *   b * S' + T' = c * T + d
 * </pre>
 *
 * Got:
 * <pre>
 *   S' = ( c / a ) * S
 *   T' = ( c * T ) - ( b * S' ) + d
 *      = ( c * T ) - b * ( ( c / a ) * S ) + d
 *      = ( c * T ) - ( b * ( c / a ) * S ) + d
 * </pre>
 *
 * Verification:
 * <pre>
 *   Y' = S' * X' + T'
 *      = ( ( c / a ) * S ) * ( a * X + b ) + ( ( c * T ) - ( b * ( c / a ) * S ) + d )
 *      = ( c * S * X ) + ( b * ( c / a ) * S ) + ( c * T ) - ( b * ( c / a ) * S ) + d
 *      = ( c * S * X ) + ( c * T ) + d
 *      = c * ( S * X + T ) + d
 *      = c * Y + d
 * </pre>
 *
 *
 * 2. Problem:
 *   - Every element (not only every channel) needs have itself T' because T' depends on S.
 *     - This is difficult to be implemented.
 *
 *   - However, if the activation escaping could have only scale and without translate (i.e. translate = b = d = 0 ), this issue
 *       could be reduced.
 *
 *   - This implies the output range of the activation function should include both negative and positive near the origin point.
 *     - So that only scale is enough to escape their non-linear part of these activation function.
 *
 *   - For example, sin(), tanh(), erf() are feasible.
 *     - But cos(), relu(), relu6(), sigmoid() are not feasible because their output always non-negative near the origin point.
 *         These functions always need bias (i.e. non-zero translate) to escape their non-linear part.
 *
 *

//!!! ...unfinished... (2022/01/06)

 *
 *
 * 3. What if this pointwise (or depthwise) does not have filter weights ( S1, S2, ... Ss )? (e.g avg/max pooling)
 *
 *
 *
 * 4. What if this pointwise (or depthwise) does not have bias weights T?
 *
 *
 *
 * @member {FloatValue.ScaleArray} do
 *   The scale for moving current value bounds into the linear domain of the activation function. That is, for letting
 * ConvBiasActivation.BoundsArraySet.afterBias_beforeActivationEscaping escape from activation function's non-linear domain
 * into linear domain (i.e. generate ConvBiasActivation.BoundsArraySet.afterActivationEscaping_beforeActivation).
 *
 * @member {FloatValue.ScaleArray} undo
 *   If apply this.undo, it will have the effect of undoing the this.do.
 */
class ScaleArraySet {

  constructor( arrayLength ) {
    this.do = new FloatValue.ScaleArray( arrayLength );
    this.undo = new FloatValue.ScaleArray( arrayLength );
  }

  get length() {
    return this.do.length;
  }

  set length( newLength ) {
    this.do.length = newLength;
    this.undo.length = newLength;
  }

  /**
   * @return {ScaleArraySet} Return a newly created ScaleArraySet which is a copy of this ScaleArraySet.
   */
  clone() {
    let result = new ScaleArraySet();
    result.set_byScaleSet( this );
    return result;
  }

  /**
   * @param {number} N  Set all scales[] by ( N ). Default are ( N = 1 ) (i.e. no scale).
   *
   * @return {ScaleArraySet} Return this (modified) object.
   */
  set_all_byN( N = 1 ) {
    this.do.set_all_byN( N );
    this.undo.set_all_byN( N );
    return this;
  }

  /**
   * @param {ScaleArraySet} aScaleArraySet  The ScaleArraySet to be copied.
   *
   * @return {ScaleArraySet} Return this (modified) object.
   */
  set_all_byScaleArraySet( aScaleArraySet ) {
    this.do.set_all_byScaleArray( aScaleArraySet.do );
    this.undo.set_all_byScaleArray( aScaleArraySet.undo );
    return this;
  }

  /**
   * The this.length will be modified.
   *
   * @param {ScaleArraySet} inputScaleArraySet0  The ScaleArraySet of the 1st input.
   * @param {ScaleArraySet} inputScaleArraySet1  The ScaleArraySet of the 2nd input.
   *
   * @return {ScaleArraySet} Return this (modified) object.
   */
  set_all_byScaleArraySet_concat_input0_input1( inputScaleArraySet0, inputScaleArraySet1 ) {
    this.do.set_all_byScaleArray_concat_input0_input1( inputScaleArraySet0.do, inputScaleArraySet1.do );
    this.undo.set_all_byScaleArray_concat_input0_input1( inputScaleArraySet0.undo, inputScaleArraySet1.undo );
    return this;
  }

  /**
   * Rearrange elements by interleaving as ( groupCount == 2 ). This element count must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements temporarily. Provide this array could reduce memory re-allocation
   * and improve performance.
   *
   * @return {ScaleArraySet} Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo( arrayTemp ) {
    this.do.set_all_byInterleave_asGrouptTwo( arrayTemp );
    this.undo.set_all_byInterleave_asGrouptTwo( arrayTemp );
    return this;
  }

  /**
   * @param {ScaleArraySet} lowerHalfScaleArraySet   The ScaleArraySet of the 1st output. Its .length will be modified.
   * @param {ScaleArraySet} higherHalfScaleArraySet  The ScaleArraySet of the 2nd output. Its .length will be modified.
   *
   * @return {ScaleArraySet} Return this (unmodified) object.
   */
  split_to_lowerHalf_higherHalf( lowerHalfScaleArraySet, higherHalfScaleArraySet ) {
    this.do.split_to_lowerHalf_higherHalf( lowerHalfScaleArraySet.do, higherHalfScaleArraySet.do );
    this.undo.split_to_lowerHalf_higherHalf( lowerHalfScaleArraySet.undo, higherHalfScaleArraySet.undo );
    return this;
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
 * - If previous convolution does not have activation escaping .do (i.e. is a normal convolution without pass-through),
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

}

