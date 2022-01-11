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
   * @return {BoundsArray}
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
    return this.set_one_byLowerUpper( thisIndex, aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex     The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBoundsArray
   *   Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex        The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
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
   * @return {BoundsArray} Return this (modified) object.
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


//!!!
  
  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number} aLower     Clamp this.lowers[ thisIndex ] by aLower.
   * @param {number} aUpper     Clamp this.uppers[ thisIndex ] by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  clamp_one_byLowerUpper( thisIndex, aLower, aUpper ) {
    let thisLower = Math.min( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ); // Confirm ( lower <= upper )
    let thisUpper = Math.max( this.lowers[ thisIndex ], this.uppers[ thisIndex ] );
    let anotherLower = Math.min( aLower, aUpper ); // Confirm ( anotherLower <= anotherUpper )
    let anotherUpper = Math.max( aLower, aUpper );
    let lower_clamped = Math.max( thisLower, anotherLower ); // Clamp this by another.
    let upper_clamped = Math.min( thisUpper, anotherUpper );
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {Bounds} aBounds    Clamp ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  clamp_one_byBounds( thisIndex, aBounds ) {
    return this.clamp_one_byLowerUpper( thisIndex, aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   * @param {number[]} aLowers  Clamp this.lowers[ thisIndex ] by aLowers[ aIndex ].
   * @param {number[]} aUppers  Clamp this.uppers[ thisIndex ] by aUppers[ aIndex ].
   * @param {number} aIndex     The array index of aLowers[] and aUppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  clamp_one_byLowersUppers( thisIndex, aLowers, aUppers, aIndex ) {
    return this.clamp_one_byLowerUpper( thisIndex, aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex  The array index of this.lowers[] and this.uppers[].
   *
   * @param {BoundsArray} aBoundsArray
   *   Clamp ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex     The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  clamp_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.clamp_one_byLowerUpper( thisIndex, aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }

  /**
   * @param {number} aLower  Clamp all this.lowers[] by aLower.
   * @param {number} aUpper  Clamp all this.uppers[] by aUpper.
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  clamp_all_byLowerUpper( aLower, aUpper ) {
!!!
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
   * @param {Bounds} aBounds  Clamp all ( this.lowers[], this.uppers[] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  clamp_all_byBounds( aBounds ) {
    return this.clamp_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} aLowers  Clamp all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   * @param {number[]} aUppers  Clamp all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  clamp_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.clamp_one_byLowerUpper( i, aLowers[ i ], aUppers[ i ] );
    }
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray  Clamp all ( this.lowers[], this.uppers[] ) by ( aBoundsArray.lowers[], aBoundsArray.uppers[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  clamp_all_byBoundsArray( aBoundsArray ) {
    return this.clamp_all_byLowersUppers( aBoundsArray.lowers, aBoundsArray.uppers );
  }


//!!!
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
    return this.add_one_byLowerUpper( thisIndex, aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
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
   * @param {number[]} Ns  Add all ( this.lowers[], this.uppers[] ) by ( Ns[], Ns[] ).
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
   * @param {number} aLower  Multiply all ( this.lowers[], this.uppers[] ) by ( aLower, aUpper ).
   * @param {number} aUpper  Multiply all ( this.lowers[], this.uppers[] ) by ( aLower, aUpper ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_all_byLowerUpper( aLower, aUpper ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.multiply_one_byLowerUpper( i, aLower, aUpper );
    }
    return this;
  }

  /**
   * @param {Bounds} aBounds  Multiply all ( this.lowers[], this.uppers[] ) by ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_all_byBounds( aBounds ) {
    return this.multiply_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} Ns  Multiply all ( this.lowers[], this.uppers[] ) by ( Ns[], Ns[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_all_byNs( Ns ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.multiply_one_byN( i, Ns[ i ] );
    }
    return this;
  }

  /**
   * @param {number[]} aLowers  Multiply all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   * @param {number[]} aUppers  Multiply all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.multiply_one_byLowerUpper( i, aLowers[ i ], aUppers[ i ] );
    }
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray  Multiply all ( this.lowers[], this.uppers[] ) by ( aBoundsArray.lowers[], aBoundsArray.uppers[] ).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_all_byBoundsArray( aBoundsArray ) {
    return this.multiply_all_byLowersUppers( aBoundsArray.lowers, aBoundsArray.uppers );
  }


  /**
   * @param {BoundsArray} aBoundsArray  The first multiplier (a BoundsArray).
   * @param {number[]} Ns               The second multiplier (a number array).
   *
   * @return {BoundsArray} Return this (modified) object.
   */
  multiply_all_byBoundsArray_multiply_all_byNs( aBoundsArray, Ns ) {
    return this.multiply_all_byBoundsArray( aBoundsArray ).multiply_all_byNs( Ns );
  }

  /**
   * @param {ScaleTranslateArray} aScaleTranslateArray
   *   Multiply all this by aScaleTranslateArray.scales[], and then add all this BoundsArray by aScaleTranslateArray.translates[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  scaleTranslate_all_byScaleTranslateArray( aScaleTranslateArray ) {
    return this.multiply_all_byNs( aScaleTranslateArray.scales ).add_all_byNs( aScaleTranslateArray.translates );
  }

  /**
   * @param {number} thisIndex  Use which Bounds of this BoundsArray to clamp the value.
   * @param {number} value      The value to be clamped.
   *
   * @return {number}
   *   Return value clamped between this Bounds [ this.lower, this.upper ]. If value is NaN, it will become zero first and then be clamped
   * between this BoundsArray[ arrayIndex ][ this.lower, this.upper ].
   */
  one_clamp_or_zeroIfNaN( thisIndex, value ) {
    if ( Number.isNaN( value ) )
      value = 0; // If NaN, view it as 0.
    return Math.max( this.lowers[ thisIndex ], Math.min( value, this.uppers[ thisIndex ] ) );
  }

}

