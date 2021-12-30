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
   * @param {number} N          Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( N, N ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_one_byN( thisIndex, N ) {
    this.lowers[ thisIndex ] = N;
    this.uppers[ thisIndex ] = N;
    return this;
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
   * @param {Bounds} aBounds    Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object whose values are copied from aBounds.
   */
  set_one_byBounds( thisIndex, aBounds ) {
    return this.set_one_byLowerUpper( thisIndex, aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} Ns       Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( Ns[ aIndex ], Ns[ aIndex ] ).
   * @param {number} aIndex     The array index of Ns[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_one_byNs( thisIndex, Ns, aIndex ) {
    return this.set_one_byN( thisIndex, Ns[ aIndex ] );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} aLowers  Set this.lowers[ thisIndex ] by aLowers[ aIndex ].
   * @param {number[]} aUppers  Set this.uppers[ thisIndex ] by aUppers[ aIndex ].
   * @param {number} aIndex     The array index of aLowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_one_byLowersUppers( thisIndex, aLowers, aUppers, aIndex ) {
    return this.set_one_byLowersUpper( thisIndex, aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex     The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBoundsArray
   *   Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex        The array index of aLowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.set_one_byLowersUppers( thisIndex, aBoundsArray.lowers, aBoundsArray.uppers, aIndex );
  }


  /**
   * @param {number} N  Set all ( this.lowers[], this.uppers[] ) by ( N, N ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_all_byN( N ) {
    this.lowers.fill( N );
    this.uppers.fill( N );
    return this;
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
   * @param {Bounds} aBounds  Set all ( this.lowers[], this.uppers[] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object whose values are copied from aBounds.
   */
  set_all_byBounds( aBounds ) {
    return this.set_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} Ns  Set all ( this.lowers[], this.uppers[] ) by ( Ns[], Ns[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  set_all_byNs( Ns ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.set_one_byNs( i, Ns, i );
    }
    return this;
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
   * @param {Bounds} aBoundsArray  Set all ( this.lowers[], this.uppers[] ) by ( aBoundsArray.lowers[], aBoundsArray.uppers[] ).
   *
   * @return {BoundsArray} Return this (modified) object whose values are copied from aBoundsArray.
   */
  set_all_byBoundsArray( aBoundsArray ) {
    return this.set_all_byLowersUppers( aBoundsArray.lowers, aBoundsArray.uppers );
  }


  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number} N          Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( N, N ).
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as this.add_one_byLowerUpper( N, N ).
   */
  add_one_byN( thisIndex, N ) {
    let thisLower = Math.min( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ); // Confirm the lower and upper. And then, add corresponds.
    let thisUpper = Math.max( this.lowers[ thisIndex ], this.uppers[ thisIndex ] );
    this.lowers[ thisIndex ] = thisLower + N;
    this.uppers[ thisIndex ] = thisUpper + N;
    return this;
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
   * @param {Bounds} aBounds    Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_one_byBounds( thisIndex, aBounds ) {
    return this.add_one_byLowerUpper( thisIndex, aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} Ns       Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( Ns[ aIndex ], Ns[ aIndex ] ).
   * @param {number} aIndex     The array index of Ns[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_one_byNs( thisIndex, Ns, aIndex ) {
    return this.add_one_byN( thisIndex, Ns[ aIndex ] );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} aLowers  Add this.lowers[ thisIndex ] by aLowers[ aIndex ].
   * @param {number[]} aUppers  Add this.uppers[ thisIndex ] by aUppers[ aIndex ].
   * @param {number} aIndex     The array index of aLowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
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
   * @return {BoundsArray} Return this (modified) object.
   */
  add_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.add_one_byLowersUpper( thisIndex, aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }

  /**
   * @param {number} N  Add all ( this.lowers[], this.uppers[] ) by ( N, N ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byN( N ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.add_one_byN( i, N );
    }
    return this;
  }

  /**
   * @param {number} aLower  Add all this.lowers[] by aLower.
   * @param {number} aUpper  Add all this.uppers[] by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byLowerUpper( aLower, aUpper ) {
    let extraLower = Math.min( aLower, aUpper ); // Confirm the lower and upper.
    let extraUpper = Math.max( aLower, aUpper );
    for ( let i = 0; i < this.lowers.length; ++i ) {
      let thisLower = Math.min( this.lowers[ i ], this.uppers[ i ] ); // Confirm the lower and upper. And then, add corresponds.
      let thisUpper = Math.max( this.lowers[ i ], this.uppers[ i ] );
      this.lowers[ i ] = thisLower + extraLower;
      this.uppers[ i ] = thisUpper + extraUpper;
    }
    return this;
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
   * @param {number[]} Ns  Add all ( this.lowers[], this.uppers[] ) by ( Ns, Ns ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byNs( Ns ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.add_one_byN( i, Ns[ i ] );
    }
    return this;
  }

  /**
   * @param {number[]} aLowers  Add all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   * @param {number[]} aUppers  Add all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
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


  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number} N          Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( N, N ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_one_byN( thisIndex, N ) {
    // Because the different sign of lower and upper, it needs compute all combination to determine the bounds of result.
    let lower_N = this.lowers[ thisIndex ] * N;
    let upper_N = this.uppers[ thisIndex ] * N;
    this.lowers[ thisIndex ] = Math.min( lower_N, upper_N );
    this.uppers[ thisIndex ] = Math.max( lower_N, upper_N );
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number} aLower     Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by aLower.
   * @param {number} aUpper     Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_one_byLowerUpper( thisIndex, aLower, aUpper ) {
    // Because the different sign of lower and upper, it needs compute all combination to determine the bounds of result.
    let lower_lower = this.lowers[ thisIndex ] * aLower;
    let lower_upper = this.lowers[ thisIndex ] * aUpper;
    let upper_lower = this.uppers[ thisIndex ] * aLower;
    let upper_upper = this.uppers[ thisIndex ] * aUpper;
    this.lowers[ thisIndex ] = Math.min( lower_lower, lower_upper, upper_lower, upper_upper );
    this.uppers[ thisIndex ] = Math.max( lower_lower, lower_upper, upper_lower, upper_upper );
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {Bounds} aBounds    Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_one_byBounds( thisIndex, aBounds ) {
    return this.multiply_one_byLowerUpper( thisIndex, aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} Ns       Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( Ns[ aIndex ], Ns[ aIndex ] ).
   * @param {number} aIndex     The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_one_byNs( thisIndex, Ns, aIndex ) {
    return this.multiply_one_byN( thisIndex, Ns[ aIndex ] );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} aLowers  Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   * @param {number[]} aUppers  Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   * @param {number} aIndex     The array index of aLowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_one_byLowersUppers( thisIndex, aLowers, aUppers, aIndex ) {
    return this.multiply_one_byLowerUpper( thisIndex, aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   *
   * @param {BoundsArray} aBoundsArray
   *   Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex     The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.multiply_one_byLowersUppers( thisIndex, aBoundsArray.lowers, aBoundsArray.uppers, aIndex );
  }


//!!! ...unfinished... (2021/12/29) byIndex, byAll
  /**
   * @param {number} N  Multiply all ( this.lowers[], this.uppers[] ) by ( N, N ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_all_byN( N ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.multiply_one_byN( i, N );
    }
    return this;
  }

  /**
   * @param {number} aLower  Add all this.lowers[] by aLower.
   * @param {number} aUpper  Add all this.uppers[] by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byLowerUpper( aLower, aUpper ) {
    let extraLower = Math.min( aLower, aUpper ); // Confirm the lower and upper.
    let extraUpper = Math.max( aLower, aUpper );
    for ( let i = 0; i < this.lowers.length; ++i ) {
      let thisLower = Math.min( this.lowers[ i ], this.uppers[ i ] ); // Confirm the lower and upper. And then, add corresponds.
      let thisUpper = Math.max( this.lowers[ i ], this.uppers[ i ] );
      this.lowers[ i ] = thisLower + extraLower;
      this.uppers[ i ] = thisUpper + extraUpper;
    }
    return this;
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
   * @param {number[]} Ns  Add all ( this.lowers[], this.uppers[] ) by ( Ns, Ns ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byNs( Ns ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.add_one_byN( i, Ns[ i ] );
    }
    return this;
  }

  /**
   * @param {number[]} aLowers  Add all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   * @param {number[]} aUppers  Add all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  add_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
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



//!!!
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

