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
 * Suppose
 *   - The previous PointDepthPoint (or convolution-bias-activation)
 *     - output channel count is q.
 *     - output is W = ( w1, w2, ..., wq ).
 *
 *
 * 1.
 *
 * Suppose
 *   - This pointwise1
 *     - input channel count is q.
 *     - per output channel filter weights are Q = ( Q1, Q2, ..., Qq ) and will be modified to Q' = ( Q1', Q2', ..., Qq' ).
 *     - per output channel bias weights are R and will be modified to R'.
 *     - activation function is f()
 *     - activation escaping is ( scale = a, translate = b )
 *     - per output channel original is X  = ( x1 , x2 , ..., xq  ) = W * Q  + R
 *     - per output channel modified is X' = ( x1', x2', ..., xq' ) = W * Q' + R' = ( a * X + b )
 *     - f(X') = f( AX + B ) is guaranteed still kept linear although activation function f() is non-linear.
 *
 * Find out Q' and R' so that X' = ( a * X + B )
 *   X' = ( a * X + B )
 *      = a * ( W * Q + R ) + b
 *      = a * W * Q + a * R + b
 *      = W * ( a * Q ) + ( a * R + b )
 *   X' = W * Q' + R'
 *
 * Got
 *  Q' = a * Q
 *  R' = a * R + b
 *
 *
 * 2.
 *
 * Suppose
 *   - This depthwise
 *     - filter size is s.
 *     - per output channel filter weights are S = ( S1, S2, ..., Ss ) and will be modified to S' = ( S1', S2', ..., Ss' ).
 *     - per output channel bias weights are T and will be modified to T'.
 *     - activation function is g()
 *     - activation escaping is ( scale = c, translate = d )
 *     - per output channel original is Y  = ( y1 , y2 , ..., ys  ) = X' * S  + T
 *     - per output channel modified is Y' = ( y1', y2', ..., ys' ) = X' * S' + T' = ( c * Y + d )
 *     - g(X') = g( CY + D ) is guaranteed still kept linear although activation function g() is non-linear.
 *
 * Find out S' and T' so that Y' = ( c * Y + d )
 *   Y' = ( c * Y + d )
 *      = c * ( X' * S + T ) + d
 *      = c * X' * S + c * T + d
 *      = X' * ( c * S ) + ( c * T + d )
 *   Y' = X' * S' + T'
 *
 * Got
 *  S' = c * S
 *  R' = c * T + d
 *

//!!! ...unfinished... (2022/01/5)

 * Find out S" and T" so that Y" = X' * S" + T" = ( W * Q + R ) * S + T
 *   Y" = X' * S" + T"
 *      = ( W * ( a * Q ) + ( a * R + b ) ) * S" + T"
 *      = ( ( W * Q * a ) + ( R * a ) + b ) * S" + T"
 *      = ( ( W * Q + R ) * a ) + b ) * S" + T"
 *      = ( W * Q + R ) * ( a * S" ) + ( b * S" + T" )
 *
 *   Y" = ( W * Q + R ) * S + T
 *
 * Got
 *   S = a * S"
 *   T = b * S" + T"
 *
 *   S" = S / a
 *   T" = T - b * S"
 *
 * Verification:
 *   Y" = X' * S" + T"
 *      = ( W * ( a * Q ) + ( a * R + b ) ) * S" + T"
 *      = ( W * ( a * Q ) + ( a * R + b ) ) * ( S / a ) + ( T - b * S" )
 *      = ( W * Q * S ) + ( R * S ) + ( b * ( S / a ) ) ) + ( T - b * ( S / a ) )
 *      = ( W * Q + R ) * S + T
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * 3.
 *
 * Suppose
 *   - This pointwise2 (always has bias, always has no activation)
 *     - input channel count is u.
 *     - per output channel filter weights are U = ( U1, U2, ..., Uu ) and will be modified to U' = ( U1', U2', ..., Uu' ).
 *     - per output channel bias weights are V and will be modified to V'.
 *     - activation function is none.
 *     - per output channel is Z = ( z1 , z2 , ..., zu  ) = Y' * U' + V' = ( ( W * Q + R ) * S + T ) * U + V
 *
 * Find out U' and V':
 *   Z = Y' * U' + V'
 *     = ( X' * ( c * S ) + ( c * T + d ) ) * U' + V'
 *     = ( ( W * ( a * Q ) + ( a * R + b ) ) * ( c * S ) + ( c * T + d ) ) * U' + V'
 *
 *     = ( ( W * a * Q + a * R + b ) * ( c * S ) + ( c * T + d ) ) * U' + V'
 *     = ( ( W * a * Q * c * S + a * R * c * S + B * c * S ) + ( c * T + d ) ) * U' + V'
 *     = ( W * a * Q * c * S + a * R * c * S + b * c * S + c * T + d ) * U' + V'
 *     = ( W * a * Q * c * S * U' + a * R * c * S * U' + b * c * S * U' + c * T * U' + d * U' ) + V'
 *
 *     = ( W * Q * S * ( U' * a * c ) ) + R * S * ( U' * a * c ) + T * ( U' * c ) + ( b * c * S * U' + d * U' + V' )
 *     = ( W * Q * S * ( U' * a * c ) ) + R * S * ( U' * a * c ) + ( T * ( U' * a * c ) - T * ( U' * a * c ) )
 *         + T * ( U' * c ) + ( b * c * S * U' + d * U' + V' )
 *     = ( W * Q * S * ( U' * a * c ) ) + R * S * ( U' * a * c ) + T * ( U' * a * c )
 *         - T * ( U' * a * c ) + T * ( U' * c ) + ( b * c * S * U' + d * U' + V' )
 *
 *     = ( ( W * Q * S ) + R * S + T ) * ( U' * a * c ) + ( ( - T * U' * a * c ) + ( T * U' * c ) + ( b * c * S * U' ) + ( d * U' ) + V' ) )
 *     = ( ( W * Q + R ) * S + T ) * ( U' * a * c ) + ( ( T * U' * c ) - ( T * a * U' * c ) + ( b * S * U' * c ) + ( d * U' ) + V' )
 *
 *   Z = ( ( W * Q + R ) * S + T ) * U + V
 *     = ( W * Q * S + R * S + T ) * U + V
 *     = W * Q * S * U + R * S * U + T * U + V
 *
 * Got
 *   U = U' * a * c
 *   V = ( T * U' * c ) - ( T * a * U' * c ) + ( b * S * U' * c ) + ( d * U' ) + V'
 *     = ( T - ( T * a ) + ( b * S ) ) * ( U' * c ) + ( d * U' ) + V'
 *     = ( ( T - ( T * a ) + ( b * S ) ) * c ) + d ) * U' ) + V'
 *
 * Got
 *   U' = U / ( a * c )
 *   V' = V - ( ( T - ( T * a ) + ( b * S ) ) * c ) + d ) * U' )
 *      = V - ( ( T - ( T * a ) + ( b * S ) ) * c ) + d ) * ( U / ( a * c ) ) )
 *      = V - ( ( T * c ) - ( T * A * c ) + ( b * S * c ) + d ) * ( U / ( a * c ) ) )
 *      = V - ( ( T * U / a ) - ( T * U ) + ( b * S * U / a ) + ( d * U / ( a * c ) ) )
 *      = V - ( T * U / a ) + ( T * U ) - ( b * S * U / a ) - ( d * U / ( a * c ) )
 *
 * Verification:
 *   Z = Y' * U' + V'
 *     = ( X' * ( c * S ) + ( c * T + d ) ) * U' + V'
 *     = ( ( W * ( a * Q ) + ( a * R + b ) ) * ( c * S ) + ( c * T + d ) ) * U' + V'
 *     = ( ( W * ( a * Q ) + ( a * R + b ) ) * ( c * S ) + ( c * T + d ) ) * ( U / ( a * c ) ) + V'
 *     = ( ( W * a * Q * c * S ) + ( a * R * c * S ) + ( b * c * S ) ) + ( c * T ) + d ) * ( U / ( a * c ) ) + V'
 *     = ( W * Q * S * U ) + ( R * S * U ) + ( b * S * U / a ) + ( T * U / a ) + ( d * U / ( a * c ) ) + V'
 *     = ( W * Q * S * U ) + ( R * S * U ) + ( b * S * U / a ) + ( T * U / a ) + ( d * U / ( a * c ) )
 *         + V - ( T * U / a ) + ( T * U ) - ( b * S * U / a ) - ( d * U / ( a * c ) )
 *
 *     = ( W * Q * S * U ) + ( R * S * U ) + ( b * S * U / a ) + ( T * U / a ) + ( d * U / ( a * c ) )
 *                         + V + ( T * U ) - ( b * S * U / a ) - ( T * U / a ) - ( d * U / ( a * c ) )
 *
 *     = ( W * Q * S * U ) + ( R * S * U ) + V + ( T * U )
 *     = ( W * Q + R ) * ( S * U ) + V + ( T * U )
 *     = ( W * Q + R ) * ( S * U ) + ( T * U ) + V
 *     = ( ( W * Q + R ) * S + T ) * U ) + V
 *
 *
 *







//!!! ...unfinished... (2022/01/05) Old

 * 1.
 *
 * Suppose
 *   - This pointwise1
 *     - input channel count is q.
 *     - per output channel filter weights are Q = ( Q1, Q2, ..., Qq ).
 *     - per output channel bias weights are R.
 *     - activation escaping is ( scale = A, translate = B )
 *     - per channel .beforeActivation is X = ( x1, x2, ..., xq ) = W * Q + R.
 *     - per channel .output is ( AX + B )
 *
 *   - This depthwise
 *     - filter size is s.
 *     - per output channel filter weights are S = ( S1, S2, ..., Ss ).
 *     - per output channel bias weights are T.
 *     - activation escaping is ( scale = C, translate = D )
 *     - per channel .beforeActivation is Y = ( y1, y2, ..., ys ) = ( AX + B ) * S + T.
 *     - per channel .output is ( CY + D )
 *
 *   - This pointwise2 (always has bias, always has no activation)
 *     - input channel count is u.
 *     - per input channel extra scale-translate is ( scale = E, translate = F )
 *     - per output channel filter weights are U = ( U1, U2, ..., Uu ).
 *     - per output channel bias weights are F + V.
 *     - per channel .output is Z = ( z1, z2, ..., zu ) = ( CY + D ) * ( E * U ) + ( F + V ).
 *
 * Find out the extra scale-translate ( E, F ) so that Z = ( ( W * Q + R ) * S + T ) * U + V
 *   Z = ( CY + D ) * ( E * U ) + ( F + V )
 *     = ( C * ( ( AX + B ) * S + T ) + D ) * ( E * U ) + ( F + V )
 *     = ( C * ( ( A * ( W * Q + R ) + B ) * S + T ) + D ) * ( E * U ) + ( F + V )
 *     = 
 *
 *
 *
 *

//!!!
 *   - This pointwise (or depthwise) filter weights are U = ( U1, U2, ... Um ).
 *   - This pointwise (or depthwise) filter weights are U = ( U1, U2, ... Um ).
 *   - This pointwise input channel count is m. (Or, this depthwise filter size is m.)
 *   - This pointwise (or depthwise) filter weights are U = ( U1, U2, ... Um ).
 *   - This pointwise (or depthwise) bias weights are V.
 *
 * This pointwise (or depthwise) .beforeActivation will be:
 *   Y = ( AX + B ) * U + V
 *     = ( ( Ax1 + B ) * U1 ) + ( ( Ax2 + B ) * U2 ) + ... + ( ( Axm + B ) * Um ) + V
 *     = ( AU1x1 + BU1 ) + ( AU2x2 + BU2 ) + ... + ( AUmxm + BUm ) + V
 *     = ( AU1x1 + AU2x2 + ... + AUmxm ) + ( BU1 + BU2 + ... + BUm ) + V
 *     = A * ( U1x1 + U2x2 + ... + Umxm ) + B * ( U1 + U2 + ... + Um ) + V
 *
 * Suppose
 *   - This pointwise (or depthwise) activation escaping is ( scale = C, translate = D )
 *
 *
 * This pointwise (or depthwise) .output will be:
 *   Z = CY + D
 *     = C * ( A * ( U1x1 + U2x2 + ... + Umxm ) + B * ( U1 + U2 + ... + Um ) + V ) + D
 *     = AC * ( U1x1 + U2x2 + ... + Umxm ) + C * ( B * ( U1 + U2 + ... + Um ) + V ) + D
 *
 * How to get back ( UX + V ) from Z?
 *   ( UX + V ) = ( U1x1 + U2x2 + ... + Umxm ) + V
 *
 * Let:
 *   - undo.scale = 1 / AC
 *   - undo.translate = V - ( C * ( B * ( U1 + U2 + ... + Um ) + V ) + D ) * undo.scale
 *
 * Apply ( undo.scale, undo.translate ) to Z:
 *   ( Z * undo.scale ) + undo.translate
 *   = ( AC * ( U1x1 + U2x2 + ... + Umxm ) + C * ( B * ( U1 + U2 + ... + Um ) + V ) + D ) * undo.scale + undo.translate
 *   = AC * ( U1x1 + U2x2 + ... + Umxm ) * undo.scale + ( C * ( B * ( U1 + U2 + ... + Um ) + V ) + D ) * undo.scale + undo.translate
 *   = AC * ( U1x1 + U2x2 + ... + Umxm ) / AC + ( C * ( B * ( U1 + U2 + ... + Um ) + V ) + D ) * undo.scale + undo.translate
 *   = ( U1x1 + U2x2 + ... + Umxm ) + ( C * ( B * ( U1 + U2 + ... + Um ) + V ) + D ) * undo.scale + undo.translate
 *   = ( U1x1 + U2x2 + ... + Umxm ) + ( C * ( B * ( U1 + U2 + ... + Um ) + V ) + D ) * undo.scale + V
 *                                  - ( C * ( B * ( U1 + U2 + ... + Um ) + V ) + D ) * undo.scale
 *   = ( U1x1 + U2x2 + ... + Umxm ) + V
 *   = ( UX + V )
 *

//!!! (2022/01/05 Remarked) Old Wrong!
//  *   - undo.scale = 1 / ( AU1 + AU2 + ... + AUm )
//  *   - undo.translate = D - ( C * ( BU1 + BU2 + ... + BUm + V ) / ( AU1 + AU2 + ... + AUm ) ) - ( D / ( AU1 + AU2 + ... + AUm ) )
//  *                    = D - ( C * ( BU1 + BU2 + ... + BUm + V ) * undo.scale ) - ( D * undo.scale )
//  *                    = D - ( C * ( BU1 + BU2 + ... + BUm + V ) + D ) * undo.scale
//  *
//  * Apply ( undo.scale, undo.translate ) to Z:
//  *   ( Z * undo.scale ) + undo.translate
//  *   = ( C * ( AU1 + AU2 + ... + AUm ) * x + ( C * ( BU1 + BU2 + ... + BUm + V ) + D ) ) * undo.scale + undo.translate
//  *   = ( C * ( AU1 + AU2 + ... + AUm ) * x * undo.scale ) + ( ( C * ( BU1 + BU2 + ... + BUm + V ) + D ) * undo.scale ) + undo.translate
//  *   = ( C * ( AU1 + AU2 + ... + AUm ) * x / ( AU1 + AU2 + ... + AUm ) ) + ( ( C * ( BU1 + BU2 + ... + BUm + V ) + D ) * undo.scale ) + undo.translate
//  *   = Cx + ( ( C * ( BU1 + BU2 + ... + BUm + V ) + D ) * undo.scale ) + undo.translate
//  *   = Cx + ( ( C * ( BU1 + BU2 + ... + BUm + V ) + D ) * undo.scale ) + ( D - ( C * ( BU1 + BU2 + ... + BUm + V ) + D ) * undo.scale )
//  *   = Cx + ( ( C * ( BU1 + BU2 + ... + BUm + V ) + D ) * undo.scale ) + D
//  *        - ( ( C * ( BU1 + BU2 + ... + BUm + V ) + D ) * undo.scale )
//  *   = Cx + D
 *
 *
 * 2. What if this pointwise (or depthwise) does not have filter weights ( U1, U2, ... Um )? (e.g avg/max pooling)
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 * 3. What if this pointwise (or depthwise) does not have bias weights V?
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */
