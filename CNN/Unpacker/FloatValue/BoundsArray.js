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
    result.set_all_byBoundsArray( this );
    return result;
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number} aLower     Set this.lowers[ thisIndex ] by aLower.
   * @param {number} aUpper     Set this.uppers[ thisIndex ] by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_one_byLowerUpper( thisIndex, aLower, aUpper ) {
    this.lowers[ thisIndex ] = Math.min( aLower, aUpper ); // Confirm ( lower <= upper ).
    this.uppers[ thisIndex ] = Math.max( aLower, aUpper );
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number} N          Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( N, N ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_one_byN( thisIndex, N ) {
    return this.set_one_byLowerUpper( thisIndex, N, N );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {Bounds} aBounds    Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object whose values are copied from aBounds.
   */
  set_one_byBounds( thisIndex, aBounds ) {
    return this.set_one_byLowerUpper( thisIndex, aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} aLowers  Set this.lowers[ thisIndex ] by aLowers[ aIndex ].
   * @param {number[]} aUppers  Set this.uppers[ thisIndex ] by aUppers[ aIndex ].
   * @param {number} aIndex     The array index of aLlowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_one_byLowersUppers( thisIndex, aLowers, aUppers, aIndex ) {
    this.set_one_byLowersUpper( thisIndex, aLowers[ aIndex ], aUppers[ aIndex ] );
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} Ns       Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( Ns[ aIndex ], Ns[ aIndex ] ).
   * @param {number} aIndex     The array index of aLlowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_one_byNs( thisIndex, Ns, aIndex ) {
    return this.set_one_byLowersUppers( thisIndex, Ns, Ns, aIndex );
  }

  /**
   * @param {number} thisIndex     The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBoundsArray
   *   Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex        The array index of aLlowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.set_one_byLowersUppers( thisIndex, aBoundsArray.lowers, aBoundsArray.uppers, aIndex );
  }


  /**
   * @param {number} aLower  Set all this.lowers[] by aLower.
   * @param {number} aUpper  Set all this.uppers[] by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object which is [ aLower, aUpper ].
   */
  set_all_byLowerUpper( aLower, aUpper ) {
    let lower = Math.min( aLower, aUpper ); // Confirm ( lower <= upper ).
    let upper = Math.max( aLower, aUpper );
    this.lowers.fill( lower );
    this.uppers.fill( upper );
    return this;
  }

  /**
   * @param {number} N  Set all ( this.lowers[], this.uppers[] ) by ( N, N ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_all_byN( N ) {
    return this.set_all_byLowerUpper( N, N );
  }

  /**
   * @param {Bounds} aBounds  Set all ( this.lowers[], this.uppers[] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object whose values are copied from aBounds.
   */
  set_all_byBounds( aBounds ) {
    return this.set_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} aLowers  Set all this.lowers[] by aLowers[].
   * @param {number[]} aUppers  Set all this.uppers[] by aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object which is [ aLowers, aUppers ].
   */
  set_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.set_one_byLowersUppers( i, aLowers, aUppers, i );
    }
    return this;
  }

  /**
   * @param {number[]} Ns  Set all ( this.lowers[], this.uppers[] ) by ( Ns[], Ns[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_all_byNs( Ns ) {
    return this.set_all_byLowersUppers( Ns, Ns );
  }

  /**
   * @param {Bounds} aBoundsArray  Set all ( this.lowers[], this.uppers[] ) by ( aBoundsArray.lowers[], aBoundsArray.uppers[] ).
   *
   * @return {BoundsArray} Return this (modified) object whose values are copied from aBoundsArray.
   */
  set_all_byBoundsArray( aBoundsArray ) {
    return this.set_all_byLowersUppers( aBoundsArray.lowers, aBoundsArray.uppers );
  }


  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number} aLower     Add this.lowers[ thisIndex ] by aLower.
   * @param {number} aUpper     Add this.uppers[ thisIndex ] by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_one_byLowerUpper( thisIndex, aLower, aUpper ) {
    let thisLower = Math.min( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ); // Confirm the lower and upper. And then, add corresponds.
    let thisUpper = Math.max( this.lowers[ thisIndex ], this.uppers[ thisIndex ] );
    this.lowers[ thisIndex ] = thisLower + Math.min( aLower, aUpper );
    this.uppers[ thisIndex ] = thisUpper + Math.max( aLower, aUpper );
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number} N          Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( N, N ).
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as this.add_one_byLowerUpper( N, N ).
   */
  add_one_byN( thisIndex, N ) {
    return this.add_one_byLowerUpper( thisIndex, N, N );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {Bounds} aBounds    Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_one_byBounds( thisIndex, aBounds ) {
    return this.add_one_byLowerUpper( thisIndex, aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} aLowers  Add this.lowers[ thisIndex ] by aLowers[ aIndex ].
   * @param {number[]} aUppers  Add this.uppers[ thisIndex ] by aUppers[ aIndex ].
   * @param {number} aIndex     The array index of aLlowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object..
   */
  add_one_byLowersUppers( thisIndex, aLowers, aUppers, aIndex ) {
    return this.add_one_byLowerUpper( thisIndex, aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   *
   * @param {BoundsArray} aBoundsArray
   *   Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex     The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is added by aBoundsArray.
   */
  add_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.add_one_byLowersUppers( thisIndex, aBoundsArray.lowers, aBoundsArray.uppers, aIndex );
  }

  /**
   * @param {number} aLower  Add all this.lowers[] by aLower.
   * @param {number} aUpper  Add all this.uppers[] by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byLowerUpper( aLower, aUpper ) {
    for ( let i = 0; i < this.lowers.length; ++i ) { // Confirm the lower and upper. And then, add corresponds.
      this.add_one_byLowerUpper( i, aLower, aUpper );
    }
    return this;
  }

  /**
   * @param {number[]} Ns  Add all ( this.lowers[], this.uppers[] ) by ( Ns, Ns ).
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as this.add_all_byLowerUpper( Ns, Ns ).
   */
  add_all_byNs( Ns ) {
    return this.add_all_byLowerUpper( Ns, Ns );
  }

  /**
   * @param {Bounds} aBounds  Add all ( this.lowers[], this.uppers[] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byBounds( aBounds ) {
    return this.add_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} aLowers  Add all this.lowers[] by aLowers[].
   * @param {number[]} aUppers  Add all this.uppers[] by aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) { // Confirm the lower and upper. And then, add corresponds.
      this.add_one_byLowerUpper( i, aLowers[ i ], aUppers[ i ] );
    }
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray  Add all ( this.lowers[], this.uppers[] ) by ( aBoundsArray.lowers[], aBoundsArray.uppers[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byBoundsArray( aBoundsArray ) {
    return this.add_all_byLowersUppers( aBoundsArray.lowers, aBoundsArray.uppers );
  }

//!!! ...unfinished... (2021/12/29) byIndex, byAll
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

