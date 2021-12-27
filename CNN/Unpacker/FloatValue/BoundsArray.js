export { BoundsArray };

//import { ScaleTranslate } from "./ScaleTranslate.js";
import { ScaleTranslateArray } from "./ScaleTranslateArray.js";

/**
 * Describe the [ lower, upper ] bounds of an array of floating-point values.
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

//!!! (2021/12/27 Remarked)
//   constructor( lower, upper ) {
//     this.lower = Math.min( lower, upper ); // Confirm ( lower <= upper ).
//     this.upper = Math.max( lower, upper );
//   }

  constructor( length ) {
    this.lowers = new Array( length );
    this.uppers = new Array( length );
  }

//!!! (2021/12/27 Remarked)
//   get difference() {
//     let difference = this.upper - this.lower;
//     return difference;
//   }

  /**
   * @return {Bounds}
   *   Return newly created object which is a copy of this Bounds.
   */
  clone() {
    let result = new Bounds( this.lowers.length );
    result.set_BoundsArray( this );
    return result;
  }

  /**
   * @param {Bounds} aBoundsArray
   *   Set this BoundsArray by aBoundsArray.
   *
   * @return {BoundsArray}
   *   Return this (modified) object whose values are copied from aBounds.
   */
  set_BoundsArray( aBoundsArray ) {
    return this.set_LowersUppers( aBoundsArray.lowers, aBoundsArray.uppers );
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
  set_LowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.length; ++i ) {
      this.lowers[ i ] = Math.min( aLowers[ i ], aUppers[ i ] ); // Confirm ( lower <= upper ).
      this.uppers[ i ] = Math.max( aLowers[ i ], aUppers[ i ] );
    }
    return this;
  }

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
    for ( let i = 0; i < this.length; ++i ) { // Confirm the lower and upper. And then, add corresponds.
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
    for ( let i = 0; i < this.length; ++i ) {
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
    for ( let i = 0; i < this.length; ++i ) {
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

}

