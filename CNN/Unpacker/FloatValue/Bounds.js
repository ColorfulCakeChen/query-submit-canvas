export { Bounds };

import { ScaleTranslate } from "./ScaleTranslate.js";

/**
 * Describe the [ lower, upper ] bounds of a floating-point value
 *
 * @member {number} lower
 *   The lower bound of the range.
 *
 * @member {number} upper
 *   The upper bound of the range.
 *
 * @member {number} difference
 *   The distance between lower and upper.
 */
class Bounds {

  constructor( lower, upper ) {
    this.lower = Math.min( lower, upper ); // Confirm ( lower <= upper ).
    this.upper = Math.max( lower, upper );
  }

  get difference() {
    let difference = this.upper - this.lower;
    return difference;
  }

  /**
   * @return {Bounds}
   *   Return newly created object which is a copy of this Bounds.
   */
  clone() {
    return new Bounds( this.lower, this.upper );
  }

  /**
   * @param {number} N
   *   Set ( this.lower, this.upper ) by N.
   *
   * @return {Bounds} Return this (modified) object which is [ n, N ].
   */
  set_byN( N ) {
    this.lower = this.upper = N;
    return this;
  }

  /**
   * @param {number} aLower
   *   Set this Bounds.lower by aLower.
   *
   * @param {number} aUpper
   *   Set this Bounds.upper by aUpper.
   *
   * @return {Bounds}
   *   Return this (modified) object which is [ aLower, aUpper ].
   */
  set_byLowerUpper( aLower, aUpper ) {
    this.lower = Math.min( aLower, aUpper ); // Confirm ( lower <= upper ).
    this.upper = Math.max( aLower, aUpper );
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Set this Bounds by aBounds.
   *
   * @return {Bounds}
   *   Return this (modified) object whose values are copied from aBounds.
   */
  set_byBounds( aBounds ) {
    return this.set_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} N
   *   Add this Bounds.lower by N, and also add this Bounds.upper by N.
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as this.add_LowerUpper( N, N ).
   */
  add_byN( N ) {
    // Confirm the lower and upper. And then, add corresponds.
    let thisLower = Math.min( this.lower, this.upper );
    let thisUpper = Math.max( this.lower, this.upper );
    this.lower = thisLower + N;
    this.upper = thisUpper + N;
    return this;
  }

  /**
   * @param {number} aLower
   *   Add this Bounds.lower by aLower.
   *
   * @param {number} aUpper
   *   Add this Bounds.upper by aUpper.
   *
   * @return {Bounds}
   *   Return this (modified) object which is added by Bounds [ aLower, aUpper ].
   */
  add_byLowerUpper( aLower, aUpper ) {
    // Confirm the lower and upper. And then, add corresponds.
    let thisLower = Math.min( this.lower, this.upper );
    let thisUpper = Math.max( this.lower, this.upper );
    this.lower = thisLower + Math.min( aLower, aUpper );
    this.upper = thisUpper + Math.max( aLower, aUpper );
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Add this Bounds by aBounds.
   *
   * @return {Bounds}
   *   Return this (modified) object which is added by aBounds.
   */
  add_byBounds( aBounds ) {
    return this.add_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} N
   *   The multiplier of this.lower and this.upper.
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as this.multiply_LowerUpper( N, N ) or repeating N times this.add_Bounds( this ).
   */
  multiply_byN( N ) {
    // Because the different sign of lower and upper, it needs compute all combinations to determine the bounds of result.
    let lower_N = this.lower * N;
    let upper_N = this.upper * N;
    this.lower = Math.min( lower_N, upper_N );
    this.upper = Math.max( lower_N, upper_N );
    return this;
  }

  /**
   * @param {number} aLower
   *   Multiply this Bounds.lower by aLower.
   *
   * @param {number} aUpper
   *   Multiply this Bounds.upper by aUpper.
   *
   * @return {Bounds}
   *   Return this (modified) object which is multiplied by Bounds [ aLower, aUpper ].
   */
  multiply_byLowerUpper( aLower, aUpper ) {
    // Because the different sign of lower and upper, it needs compute all combination to determine the bounds of result.
    let lower_lower = this.lower * aLower;
    let lower_upper = this.lower * aUpper;
    let upper_lower = this.upper * aLower;
    let upper_upper = this.upper * aUpper;
    this.lower = Math.min( lower_lower, lower_upper, upper_lower, upper_upper );
    this.upper = Math.max( lower_lower, lower_upper, upper_lower, upper_upper );
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Multiply this Bounds by aBounds.
   *
   * @return {Bounds}
   *   Return this (modified) object which is multiplied by aBounds.
   */
  multiply_byBounds( aBounds ) {
    return this.multiply_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {Bounds} aBounds
   *   The first multiplier (a Bounds).
   *
   * @param {number} N
   *   The second multiplier (a number).
   *
   * @return {Bounds}
   *   Return this (modified) object which is the sumed Bounds of repeating N times of multiplying this by aBounds.
   */
  multiply_byBounds_multiply_byN( aBounds, N ) {
    return this.multiply_byBounds( aBounds ).multiply_byN( N );
  }

  /**
   * @param {ScaleTranslate} aScaleTranslate
   *   Multiply this Bounds by aScaleTranslate.scale, and then add this Bounds by aScaleTranslate.translate.
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as this.multiply_N( aScaleTranslate.scale ).add_N( aScaleTranslate.translate ).
   */
  apply_byScaleTranslate( aScaleTranslate ) {
    return this.multiply_byN( aScaleTranslate.scale ).add_byN( aScaleTranslate.translate );
  }

  /**
   * @param {number} value
   *   The value to be clamped.
   *
   * @return {number}
   *   If value is NaN, return zero. Otherwise, return value clamped between this Bounds [ this.lower, this.upper ].
   */
  clamp_or_zeroIfNaN( value ) {
    if ( !Number.isNaN( value ) )
      return Math.max( this.lower, Math.min( value, this.upper ) );
    else
      return 0; // If NaN, let it become 0.
  }

  /**
   * Confirm:
   *   - Every element is not NaN. (If it is, become 0.)
   *   - Every element is between [ lower, upper ].
   *
   * @param {Float32Array} source
   *   The source Float32Array.
   *
   * @return {Float32Array}
   *   Return a copy of source. Every element (float32):
   *     - If ( Number.isNaN( element ) == true ), let it become 0.
   *     - Otherwise, Math.max( lower, Math.min( element, upper ) ).
   */
  Float32Array_RestrictedClone( sourceArray ) {
    let resultArray = new Float32Array( sourceArray.length );
    for ( let i = 0; i < sourceArray.length; ++i ) {
      let element = sourceArray[ i ];
      if ( !Number.isNaN( element ) ) {
        resultArray[ i ] = Math.max( this.lower, Math.min( element, this.upper ) );
      } // If NaN, let it become 0. (Just do nothing, because Float32Array is initialized to zero by default.)
    }
    return resultArray;
  }

}

