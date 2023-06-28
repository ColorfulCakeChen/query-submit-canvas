export { ScaleArraySet };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";

/**
 * Several scale arrays for escaping a value bounds from being activated (i.e.
 * being non-linearized) by activation function.
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
 *     - f(X') = f( a * X + b ) is guaranteed still kept linear although
 *         activation function f() is non-linear.
 *
 *   - This pointwise (or depthwise)
 *     - This pointwise input channel count is s. (Or, this depthwise filter
 *         size is s.)
 *     - output channel count is u.
 *     - per output channel filter weights are S = ( S1, S2, ..., Ss ) and will
 *         be modified to S' = ( S1', S2', ..., Ss' ).
 *     - per output channel bias weights are T = ( T1, T2, ..., Tu ) and will
 *         be modified to T' = ( T1', T2', ..., Tu' ).
 *     - activation function is g()
 *     - activation escaping is ( scale = c, translate = d )
 *     - per output channel original is
 *         Y  = ( y1 , y2 , ..., yu  ) = S  * X  + T
 *     - per output channel modified is
 *         Y' = ( y1', y2', ..., yu' ) = S' * X' + T' = c * Y + d
 *     - g(Y') = g( c * Y + d ) is guaranteed still kept linear although
 *         activation function g() is non-linear.
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
 *   - Every element (not only every channel) needs have itself T' because T'
 *       depends on S.
 *     - This is difficult to be implemented.
 *
 *   - However, if the activation escaping could have only scale and without
 *       translate (i.e. translate = b = d = 0 ), this issue could be reduced.
 *
 *   - This implies the output range of the activation function should include
 *       both negative and positive near the origin point.
 *     - So that only scale is enough to escape their non-linear part of these
 *         activation function.
 *
 *   - For example, sin(), tanh(), erf() are feasible.
 *     - But cos(), relu(), relu6(), sigmoid() are not feasible because their
 *         output is always non-negative near the origin point. These functions
 *         always need bias (i.e. non-zero translate) to escape their
 *         non-linear part.
 *
 *
 *
 * @member {FloatValue.ScaleArray} do
 *   The scale for moving current value bounds into the linear domain of the
 * activation function. That is, for letting
 * ConvBiasActivation.BoundsArraySet.afterBias_beforeActivationEscaping escape
 * from activation function's non-linear domain into linear domain (i.e.
 * generate
 * ConvBiasActivation.BoundsArraySet.afterActivationEscaping_beforeActivation).
 *
 * @member {FloatValue.ScaleArray} undo
 *   If apply this.undo, it will have the effect of undoing the this.do.
 */
class ScaleArraySet extends Recyclable.Root {

  /**
   * Used as default ActivationEscaping.ScaleArraySet provider for conforming
   * to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "ActivationEscaping.ScaleArraySet.Pool",
    ScaleArraySet, ScaleArraySet.setAsConstructor );

  /**
   */
  constructor( arrayLength ) {
    super();
    ScaleArraySet.setAsConstructor_self.call( this, arrayLength );
  }

  /** @override */
  static setAsConstructor( arrayLength ) {
    super.setAsConstructor();
    ScaleArraySet.setAsConstructor_self.call( this, arrayLength );
    return this;
  }

  /** @override */
  static setAsConstructor_self( arrayLength ) {
    this.do = FloatValue.ScaleArray.Pool.get_or_create_by( arrayLength );
    this.undo = FloatValue.ScaleArray.Pool.get_or_create_by( arrayLength );
  }

  /** @override */
  disposeResources() {
    if ( this.undo ) {
      this.undo.disposeResources_and_recycleToPool();
      this.undo = null;
    }
    if ( this.do ) {
      this.do.disposeResources_and_recycleToPool();
      this.do = null;
    }
    super.disposeResources();
  }

  get length() {
    return this.do.length;
  }

  set length( newLength ) {
    this.do.length = newLength;
    this.undo.length = newLength;
  }

  /**
   * @return {ScaleArraySet}
   *   Return a newly created ScaleArraySet which is a copy of this
   * ScaleArraySet.
   */
  clone() {
    let result = ScaleArraySet.Pool.get_or_create_by( this.length );
    result.set_byScaleSet( this );
    return result;
  }


  /**
   * Assert this and aScaleArraySet have the same length and values.
   *
   * @param {ScaleArraySet} aScaleArraySet  The ScaleArraySet to be compared.
   *
   * @return {ScaleArraySet} Return this (un-modified) object.
   */
  assert_all_byScaleArraySet_all_equal( aScaleArraySet ) {
    const funcNameInMessage = "assert_all_byScaleArraySet_all_equal";

    if ( this.length != aScaleArraySet.length )
      throw Error( `ActivationEscaping.ScaleArraySet.${funcNameInMessage}(): `
        + `length count of this ( ${this.length} ) should be the same as `
        + `length count of aScaleArraySet ( ${aScaleArraySet.length} ).`
      );

    for ( let i = 0; i < this.do.length; ++i ) {
      if ( this.do.scales[ i ] != aScaleArraySet.do.scales[ i ] )
        throw Error( `ActivationEscaping.ScaleArraySet.${funcNameInMessage}(): `
          + `this.do.scales[ ${i} ] ( ${this.do.scales[ i ]} ) should be the same as `
          + `aScaleArraySet.do.scales[ ${i} ] ( ${aScaleArraySet.do.scales[ i ]} ).`
        );
    }

    for ( let i = 0; i < this.undo.length; ++i ) {
      if ( this.undo[ i ] != aScaleArraySet.undo[ i ] )
        throw Error( `ActivationEscaping.ScaleArraySet.${funcNameInMessage}(): `
          + `this.undo.scales[ ${i} ] ( ${this.undo.scales[ i ]} ) should be the same as `
          + `aScaleArraySet.undo.scales[ ${i} ] ( ${aScaleArraySet.undo.scales[ i ]} ).`
        );
    }

    return this;
  }

  /**
   * Assert this all have the same value as aScaleArraySet.do.scales[ aIndex ]
   * and aScaleArraySet.undo.scales[ aIndex ].
   *
   * @param {ScaleArraySet} aScaleArraySet
   *   The aScaleArraySet.do.scales[ aIndex ] and
   * aScaleArraySet.undo.scales[ aIndex ] will be used to compare.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.do.scales[] and
   * aBoundsArray.undo.scales[].
   *
   * @return {ScaleArraySet}
   *   Return this (un-modified) object.
   */
  assert_all_byScaleArraySet_one_equal( aScaleArraySet, aIndex ) {
    const funcNameInMessage = "assert_all_byScaleArraySet_one_equal";

    for ( let i = 0; i < this.do.length; ++i ) {
      if ( this.do.scales[ i ] != aScaleArraySet.do.scales[ aIndex ] )
        throw Error( `ActivationEscaping.ScaleArraySet.${funcNameInMessage}(): `
          + `this.do.scales[ ${i} ] ( ${this.do.scales[ i ]} ) should be the same as `
          + `aScaleArraySet.do.scales[ ${aIndex} ] ( ${aScaleArraySet.do.scales[ aIndex ]} ).`
        );
    }

    for ( let i = 0; i < this.undo.length; ++i ) {
      if ( this.undo[ i ] != aScaleArraySet.undo[ aIndex ] )
        throw Error( `ActivationEscaping.ScaleArraySet.${funcNameInMessage}(): `
          + `this.undo.scales[ ${i} ] ( ${this.undo.scales[ i ]} ) should be the same as `
          + `aScaleArraySet.undo.scales[ ${aIndex} ] ( ${aScaleArraySet.undo.scales[ aIndex ]} ).`
        );
    }

    return this;
  }


  /**
   * @param {number} N
   *   Set all scales[] by ( N ). Default are ( N = 1 ) (i.e. no scale).
   *
   * @return {ScaleArraySet}
   *   Return this (modified) object.
   */
  set_all_byN( N = 1 ) {
    this.do.set_all_byN( N );
    this.undo.set_all_byN( N );
    return this;
  }

  /**
   * @param {ScaleArraySet} aScaleArraySet
   *   The ScaleArraySet to be copied.
   *
   * @return {ScaleArraySet}
   *   Return this (modified) object.
   */
  set_all_byScaleArraySet( aScaleArraySet ) {
    this.do.set_all_byScaleArray( aScaleArraySet.do );
    this.undo.set_all_byScaleArray( aScaleArraySet.undo );
    return this;
  }

  /**
   * The this.length will be modified.
   *
   * @param {ScaleArraySet} inputScaleArraySet0
   *   The ScaleArraySet of the 1st input.
   *
   * @param {ScaleArraySet} inputScaleArraySet1
   *   The ScaleArraySet of the 2nd input.
   *
   * @return {ScaleArraySet}
   *   Return this (modified) object.
   */
  set_all_byScaleArraySet_concat_input0_input1(
    inputScaleArraySet0, inputScaleArraySet1 ) {

    this.do.set_all_byScaleArray_concat_input0_input1(
      inputScaleArraySet0.do, inputScaleArraySet1.do );
    this.undo.set_all_byScaleArray_concat_input0_input1(
      inputScaleArraySet0.undo, inputScaleArraySet1.undo );
    return this;
  }

  /**
   * Rearrange elements by interleaving as ( groupCount == 2 ). This element
   * count must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements temporarily.
   * Providing this array could reduce memory re-allocation and improve
   * performance.
   *
   * @return {ScaleArraySet}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo_inPlace( arrayTemp ) {
    this.do.set_all_byInterleave_asGrouptTwo_inPlace( arrayTemp );
    this.undo.set_all_byInterleave_asGrouptTwo_inPlace( arrayTemp );
    return this;
  }

  /**
   * Rearrange bounds by interleaving as ( groupCount == 2 ).
   *
   * @param {ScaleArraySet} aScaleArraySet
   *   The source ScaleArraySet to be copied from. Its element count must be
   * even (i.e. divisible by 2).
   *
   * @return {ScaleArraySet}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo_byScaleArraySet( aScaleArraySet ) {
    this.do.set_all_byInterleave_asGrouptTwo_byScaleArray(
      aScaleArraySet.do );
    this.undo.set_all_byInterleave_asGrouptTwo_byScaleArray(
      aScaleArraySet.undo );
    return this;
  }

  /**
   * Rearrange bounds by undoing interleaving as ( groupCount == 2 ).
   *
   * @param {ScaleArraySet} aScaleArraySet
   *   The source ScaleArraySet to be copied from. Its element count must be
   * even (i.e. divisible by 2).
   *
   * @return {ScaleArraySet}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo_undo_byScaleArraySet( aScaleArraySet ) {
    this.do.set_all_byInterleave_asGrouptTwo_undo_byScaleArray(
      aScaleArraySet.do );
    this.undo.set_all_byInterleave_asGrouptTwo_undo_byScaleArray(
      aScaleArraySet.undo );
    return this;
  }

  /**
   * @param {ScaleArraySet} lowerHalfScaleArraySet
   *   The ScaleArraySet of the 1st output. Its .length will be modified.
   *
   * @param {ScaleArraySet} higherHalfScaleArraySet
   *   The ScaleArraySet of the 2nd output. Its .length will be modified.
   *
   * @return {ScaleArraySet}
   *   Return this (unmodified) object.
   */
  split_to_lowerHalf_higherHalf(
    lowerHalfScaleArraySet, higherHalfScaleArraySet ) {

    this.do.split_to_lowerHalf_higherHalf(
      lowerHalfScaleArraySet.do, higherHalfScaleArraySet.do );
    this.undo.split_to_lowerHalf_higherHalf(
      lowerHalfScaleArraySet.undo, higherHalfScaleArraySet.undo );
    return this;
  }

  
  /**
   * @param {ScaleArraySet} aScaleArraySet
   *   The ScaleArraySet to multiply.
   *
   * @return {ScaleArraySet}
   *   Return this (modified) object.
   */
  multiply_all_byScaleArraySet_all( aScaleArraySet ) {
    this.do.multiply_all_byScaleArray( aScaleArraySet.do );
    this.undo.multiply_all_byScaleArray( aScaleArraySet.undo );
    return this;
  }

  /**
   * @param {ScaleArraySet} aScaleArraySet
   *   The aScaleArraySet.do.scales[ aIndex ] and
   * aScaleArraySet.undo.scales[ aIndex ] will be used to multiply.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.do.scales[] and
   * aBoundsArray.undo.scales[].
   *
   * @return {ScaleArraySet} Return this (modified) object.
   */
  multiply_all_byScaleArraySet_one( aScaleArraySet, aIndex ) {
    this.do.multiply_all_byN( aScaleArraySet.do.scales[ aIndex ] );
    this.undo.multiply_all_byN( aScaleArraySet.undo.scales[ aIndex ] );
    return this;
  }

}

