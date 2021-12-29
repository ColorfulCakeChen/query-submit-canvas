export { BoundsArray };

import { Bounds } from "./Bounds.js";
//import { ScaleTranslate } from "./ScaleTranslate.js";
import { ScaleTranslateArray } from "./ScaleTranslateArray.js";

/**
 * Describe the [ lower, upper ] bounds of an array of floating-point values.
 *
 * @member {number[]} lowers
 *   The lower bound array of the range.
 *
 * @member {number[]} uppers
 *   The upper bound array of the range.
 */
class BoundsArray {

  constructor( length ) {
    this.lowers = new Array( length );
    this.uppers = new Array( length );
  }

  /**
   * @return {Bounds}
   *   Return newly created object which is a copy of this BoundsArray.
   */
  clone() {
    let result = new BoundsArray( this.lowers.length );
    result.set_BoundsArray_byAll( this );
    return result;
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number} aLower     Set this BoundsArray.lowers[ thisIndex ] by aLower.
   * @param {number} aUpper     Set this BoundsArray.uppers[ thisIndex ] by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_LowersUpper_byIndex( thisIndex, aLower, aUpper ) {
    this.lowers[ thisIndex ] = Math.min( aLower, aUpper ); // Confirm ( lower <= upper ).
    this.uppers[ thisIndex ] = Math.max( aLower, aUpper );
    return this;
  }

  /**
   * @param {number} aLower  Set this Bounds.lowers by aLower.
   * @param {number} aUpper  Set this Bounds.uppers by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object which is [ aLower, aUpper ].
   */
  set_LowerUpper_byAll( aLower, aUpper ) {
    let lower = Math.min( aLower, aUpper ); // Confirm ( lower <= upper ).
    let upper = Math.max( aLower, aUpper );
    this.lowers.fill( lower );
    this.uppers.fill( upper );
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {Bounds} aBounds    Set this BoundsArray by aBounds.
   *
   * @return {BoundsArray} Return this (modified) object whose values are copied from aBounds.
   */
  set_Bounds_byIndex( thisIndex, aBounds ) {
    return this.set_LowerUpper_byIndex( thisIndex, aBounds.lower, aBounds.upper );
  }

  /**
   * @param {Bounds} aBounds   Set this BoundsArray by aBounds.
   *
   * @return {BoundsArray} Return this (modified) object whose values are copied from aBounds.
   */
  set_Bounds_byAll( aBounds ) {
    return this.set_LowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} aLowers  Set this BoundsArray.lowers[ thisIndex ] by aLowers[ aIndex ].
   * @param {number[]} aUppers  Set this BoundsArray.uppers[ thisIndex ] by aUppers[ aIndex ].
   * @param {number} aIndex     The array index of aLlowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_LowersUppers_byIndex( thisIndex, aLowers, aUppers, aIndex ) {
    this.set_LowersUppers_byIndex( thisIndex, aLowers[ aIndex ], aUppers[ aIndex ] );
    return this;
  }

  /**
   * @param {number[]} aLowers
   *   Set this Bounds.lowers by aLowers.
   *
   * @param {number[]} aUppers
   *   Set this Bounds.uppers by aUppers.
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is [ aLowers, aUppers ].
   */
  set_LowersUppers_byAll( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.set_LowersUpper_byIndex( i, aLowers, aUppers, i );
    }
    return this;
  }

  /**
   * @param {number} thisIndex     The array index of this.lowers[] and this.uppers[].
   * @param {Bounds} aBoundsArray  Set this BoundsArray by aBoundsArray.
   * @param {number} aIndex        The array index of aLlowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_BoundsArray_byIndex( thisIndex, aBoundsArray, aIndex ) {
    return this.set_LowersUpper_byIndex( thisIndex, aBoundsArray.lowers, aBoundsArray.uppers, aIndex );
  }

  /**
   * @param {Bounds} aBoundsArray
   *   Set this BoundsArray by aBoundsArray.
   *
   * @return {BoundsArray}
   *   Return this (modified) object whose values are copied from aBoundsArray.
   */
  set_BoundsArray_byAll( aBoundsArray ) {
    return this.set_LowersUppers_byAll( aBoundsArray.lowers, aBoundsArray.uppers );
  }

//!!! ...unfinished... (2021/12/29) byIndex, byAll
  /**
   * @param {BoundsArray} aBoundsArray
   *   Add this Bounds by aBounds.
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is added by aBoundsArray.
   */
  add_BoundsArray( aBoundsArray ) {
    return this.add_LowersUppers( aBoundsArray.lowers, aBoundsArray.uppers );
  }

  /**
   * @param {number[]} aLower
   *   Add this Bounds.lowers by aLowers.
   *
   * @param {number[]} aUpper
   *   Add this Bounds.uppers by aUppers.
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is added by BoundsArray [ aLowers, aUppers ].
   */
  add_LowersUppers( aLowers, aUppers ) {
    let thisLower, thisUpper;
    for ( let i = 0; i < this.lowers.length; ++i ) { // Confirm the lower and upper. And then, add corresponds.
      thisLower = Math.min( this.lowers[ i ], this.uppers[ i ] );
      thisUpper = Math.max( this.lowers[ i ], this.uppers[ i ] );
      this.lowers[ i ] = thisLower + Math.min( aLowers[ i ], aUppers[ i ] );
      this.uppers[ i ] = thisUpper + Math.max( aLowers[ i ], aUppers[ i ] );
    }
    return this;
  }

  /**
   * @param {number[]} Ns
   *   Add this Bounds.lower by N, and also add this Bounds.upper by N.
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as this.add_LowerUpper( N, N ).
   */
  add_Ns( Ns ) {
    return this.add_LowersUppers( Ns, Ns );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Multiply this BoundsArray by aBoundsArray.
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is multiplied by aBoundsArray.
   */
  multiply_Bounds( aBoundsArray ) {
    return this.multiply_LowersUppers( aBoundsArray.lowers, aBoundsArray.uppers );
  }

  /**
   * @param {number[]} aLowers
   *   Multiply this Bounds.lowers by aLowers or aUppers.
   *
   * @param {number[]} aUppers
   *   Multiply this Bounds.uppers by aLowers or aUppers.
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is multiplied by BoundsArray [ aLowers, aUppers ].
   */
  multiply_LowersUppers( aLowers, aUppers ) {
    // Because the different sign of lower and upper, it needs compute all combination to determine the bounds of result.
    let lower_lower, lower_upper, upper_lower, upper_upper;
    for ( let i = 0; i < this.lowers.length; ++i ) {
      lower_lower = this.lowers[ i ] * aLowers[ i ];
      lower_upper = this.lowers[ i ] * aUppers[ i ];
      upper_lower = this.uppers[ i ] * aLowers[ i ];
      upper_upper = this.uppers[ i ] * aUppers[ i ];
      this.lowers[ i ] = Math.min( lower_lower, lower_upper, upper_lower, upper_upper );
      this.uppers[ i ] = Math.max( lower_lower, lower_upper, upper_lower, upper_upper );
    }
    return this;
  }

  /**
   * @param {number[]} Ns
   *   The multiplier of this.lower and this.upper.
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is the same as this.multiply_LowersUppers( Ns, Ns ) or repeating N times this.add_BoundsArray( this ).
   */
  multiply_Ns( Ns ) {
    // Because the different sign of lower and upper, it needs compute all combinations to determine the bounds of result.
    let lower_N, upper_N;
    for ( let i = 0; i < this.lowers.length; ++i ) {
      lower_N = this.lowers[ i ] * Ns[ i ];
      upper_N = this.uppers[ i ] * Ns[ i ];
      this.lowers[ i ] = Math.min( lower_N, upper_N );
      this.uppers[ i ] = Math.max( lower_N, upper_N );
    }
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   The first multiplier (a BoundsArray).
   *
   * @param {number[]} Ns
   *   The second multiplier (a number array).
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is the sumed BoundsArray of repeating N times of multiplying this by aBoundsArray.
   */
  multiply_BoundsArray_multiply_Ns( aBoundsArray, Ns ) {
    return this.multiply_BoundsArray( aBoundsArray ).multiply_Ns( Ns );
  }

  /**
   * @param {ScaleTranslateArray} aScaleTranslateArray
   *   Multiply this BoundsArray by aScaleTranslateArray.scales, and then add this BoundsArray by aScaleTranslateArray.translates.
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is the same as this.multiply_N( aScaleTranslate.scale ).add_N( aScaleTranslate.translate ).
   */
  apply_ScaleTranslateArray( aScaleTranslateArray ) {
    return this.multiply_Ns( aScaleTranslateArray.scales ).add_Ns( aScaleTranslateArray.translates );
  }

  /**
   * @param {number} value
   *   The value to be clamped.
   *
   * @param {number} arrayIndex
   *   Use which Bounds of this BoundsArray to clamp the value.
   *
   * @return {number}
   *   If value is NaN, return zero. Otherwise, return value clamped between this BoundsArray[ arrayIndex ][ this.lower, this.upper ].
   */
  valueClamped_or_zeroIfNaN( value, arrayIndex ) {
    if ( !Number.isNaN( value ) )
      return Math.max( this.lowers[ arrayIndex ], Math.min( value, this.uppers[ arrayIndex ] ) );
    else
      return 0; // If NaN, let it become 0.
  }

}

