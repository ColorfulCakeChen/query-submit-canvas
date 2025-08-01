export { Bounds };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
//import { ScaleTranslate } from "./ScaleTranslate.js";
//import { BoundsArray } from "./BoundsArray.js";

/**
 * Describe the [ lower, upper ] bounds of a 32-bits floating-point value.
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
class Bounds extends Recyclable.Root {

  /**
   * Used as default FloatValue.Bounds provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "FloatValue.Bounds.Pool",
    Bounds );

  /** The minimum positive normal value of float32 ( 2 ** ( -126 ) ). */
  static FLOAT32_MIN_POSITIVE = 2 ** ( -126 );

  /**
   */
  constructor( lower, upper ) {
    super();
    this.#setAsConstructor_self( lower, upper );
  }

  /** @override */
  setAsConstructor( lower, upper ) {
    super.setAsConstructor();
    this.#setAsConstructor_self( lower, upper );
  }

  /**  */
  #setAsConstructor_self( aLower, aUpper ) {
    this.set_byLowerUpper( aLower, aUpper );
  }

  /** @override */
  disposeResources() {
    this.lower = undefined;
    this.upper = undefined;
    super.disposeResources();
  }

  /**
   * @return {Bounds}
   *   Return newly created object which is a copy of this Bounds.
   */
  clone() {
    return Bounds.Pool.get_or_create_by( this.lower, this.upper );
  }

  get difference() {
    let difference = ( this.upper - this.lower );
    return difference;
  }


  /**
   * @param {number} N
   *   The value to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lower <= N ) and ( .upper >= N ).
   */
  is_contain_N( N ) {
    if ( ( this.lower <= N ) && ( this.upper >= N ) )
      return true;
    return false;
  }

  /**
   * @param {number} aLower
   *   The lower bound to be compared.
   *
   * @param {number} aUpper
   *   The upper bound to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lower <= aLower ) and ( .upper >= aUpper ).
   */
  is_contain_LowerUpper( aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    if ( ( this.lower <= lower ) && ( this.upper >= upper ) )
      return true;
    return false;
  }

  /**
   * @param {Bounds} aBounds
   *   The bounds to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lower <= aBounds.lower ) and
   * ( .upper >= aBounds.upper ).
   */
  is_contain_Bounds( aBounds ) {
    return this.is_contain_LowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   The bounds array to be compared.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {boolean}
   *   Return true, if ( .lower <= aBounds.lower ) and
   * ( .upper >= aBounds.upper ).
   */
  is_contain_BoundsArray_one( aBoundsArray, aIndex ) {
    return this.is_contain_LowerUpper(
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }

  
 /**
   * @param {number} aLower
   *   The lower bound to be compared.
   *
   * @param {number} aUpper
   *   The upper bound to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lower >= aLower ) and ( .upper <= aUpper ).
   */
  is_in_LowerUpper( aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    if ( ( this.lower >= lower ) && ( this.upper <= upper ) )
      return true;
    return false;
  }

  /**
   * @param {Bounds} aBounds
   *   The bounds to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lower >= aBounds.lower ) and
   * ( .upper <= aBounds.upper ).
   */
  is_in_Bounds( aBounds ) {
    return this.is_in_LowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   The bounds array to be compared.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {boolean}
   *   Return true, if ( .lower >= aBoundsArray.lowers[ aIndex ] )
   * and ( .upper <= aBoundsArray.uppers[ aIndex ] ).
   */
  is_in_BoundsArray_one( aBoundsArray, aIndex ) {
    return this.is_in_LowerUpper(
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }


  /**
   * Set ( this.lower, this.upper ) to ( +Infinity, -Infinity ). This can not
   * be achieved by set_byLowerUpper() because ( lower > upper ). Usually, this
   * method is used mainly before calling .enlarge_byN() to find out bounds.
   *
   * @return {Bounds}
   *   Return this (modified) object which is [ +Infinity, -Infinity ].
   */
  set_by_PositiveInfinity_NegativeInfinity() {
    this.lower = +Infinity;
    this.upper = -Infinity;
    return this;
  }

  /**
   * @param {number} N
   *   Set ( this.lower, this.upper ) by N.
   *
   * @return {Bounds}
   *   Return this (modified) object which is [ n, N ].
   */
  set_byN( N ) {
    this.lower = this.upper = ( N );
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
    if ( aLower < aUpper ) { // Confirm ( lower <= upper ).
      this.lower = ( aLower );
      this.upper = ( aUpper );
    } else {
      this.lower = ( aUpper );
      this.upper = ( aLower );
    }
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
   * @param {number[]} Ns
   *   Set ( this.lower, this.upper ) by ( Ns[ aIndex ], Ns[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  set_byNs( Ns, aIndex ) {
    return this.set_byN( Ns[ aIndex ] );
  }

  /**
   * @param {number[]} aLowers
   *   Set ( this.lower, this.upper ) by
   * ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   *
   * @param {number[]} aUppers
   *   Set ( this.lower, this.upper ) by
   * ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  set_byLowersUppers( aLowers, aUppers, aIndex ) {
    return this.set_byLowerUpper( aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Set ( this.lower, this.upper ) by
   * ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  set_byBoundsArray( aBoundsArray, aIndex ) {
    return this.set_byLowerUpper(
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }


  /**
   * @param {number} N
   *   Enlarge this bounds so that [ this.lower, this.upper ] contains N.
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  enlarge_byN( N ) {
    if ( this.lower > N )
      this.lower = N;
    if ( this.upper < N )
      this.upper = N;
    return this;
  }

  /**
   * @param {number} aLower
   *   The lower bound to be contained.
   *
   * @param {number} aUpper
   *   The upper bound to be contained.
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  enlarge_byLowerUpper( aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    if ( this.lower > lower )
      this.lower = lower;
    if ( this.upper < upper )
      this.upper = upper;
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   The bounds to be contained.
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
   enlarge_byBounds( aBounds ) {
    return this.enlarge_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   The bounds array to be contained.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
   enlarge_byBoundsArray_one( aBoundsArray, aIndex ) {
    return this.enlarge_byLowerUpper(
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }

  /**
   * @return {Bounds}
   *   Return this (modified) object whose bounds is enlarged a little to the
   * nearest two's integer power.
   */
  enalrge_byIntegerPowersOfTwo() {
    const lower = this.lower;
    const upper = this.upper;
    const lowerEnlarged = Bounds.enalrge_byIntegerPowersOfTwo_lower( lower );
    const upperEnlarged = Bounds.enalrge_byIntegerPowersOfTwo_upper( upper );
    this.lower = lowerEnlarged;
    this.upper = upperEnlarged;
    return this;
  }

  /**
   * @param {number}
   *   The original lower of the bounds.
   *
   * @return {number}
   *   Return the modified lower which is enlarged a little to the nearest
   * two's integer power. If lower is 0 (which does not have logarithm), the
   * largest normal negative value (of float32) will be used instead.
   */
  static enalrge_byIntegerPowersOfTwo_lower( lower ) {
    let lowerEnlarged;
    if ( lower > 0 ) {
      const lowerAbs = lower;
      const lowerLog2 = Math.log2( lowerAbs );
      const lowerLog2Floor = Math.floor( lowerLog2 );
      lowerEnlarged = ( 2 ** lowerLog2Floor );

    } else if ( lower < 0 ) {
      const lowerAbs = - lower;
      const lowerLog2 = Math.log2( lowerAbs );
      const lowerLog2Ceil = Math.ceil( lowerLog2 );
      lowerEnlarged = - ( 2 ** lowerLog2Ceil );

    } else { // ( lower === 0 )
      lowerEnlarged = - Bounds.FLOAT32_MIN_POSITIVE;
    }
    return lowerEnlarged;
  }

  /**
   * @param {number}
   *   The original upper of the bounds.
   *
   * @return {number}
   *   Return the modified upper which is enlarged a little to the nearest
   * two's integer power. If upper is 0 (which does not have logarithm), the
   * smallest normal positive value (of float32) will be used instead.
   */
  static enalrge_byIntegerPowersOfTwo_upper( upper ) {
    let upperEnlarged;
    if ( upper > 0 ) {
      const upperAbs = upper;
      const upperLog2 = Math.log2( upperAbs );
      const upperLog2Ceil = Math.ceil( upperLog2 );
      upperEnlarged = ( 2 ** upperLog2Ceil );

    } else if ( upper < 0 ) {
      const upperAbs = - upper;
      const upperLog2 = Math.log2( upperAbs );
      const upperLog2Floor = Math.floor( upperLog2 );
      upperEnlarged = - ( 2 ** upperLog2Floor );

    } else { // ( upper === 0 )
      upperEnlarged = Bounds.FLOAT32_MIN_POSITIVE;
    }
    return upperEnlarged;
  }


  /**
   * @param {number} aLower
   *   Clamp this.lower by aLower.
   *
   * @param {number} aUpper
   *   Clamp this.upper by aUpper.
   *
   * @return {Bounds}
   *   Return this (modified) object which is
   * [ max( this.lower, aLower ), min( this.upper, aUpper ) ].
   */
  clamp_byLowerUpper( aLower, aUpper ) {
    let anotherLower, anotherUpper; // Confirm ( anotherLower <= anotherUpper )
    if ( aLower < aUpper ) {
      anotherLower = ( aLower );
      anotherUpper = ( aUpper );
    } else {
      anotherLower = ( aUpper );
      anotherUpper = ( aLower );
    }

    // Because two bounds may be totally non-intersected, both thisLower and
    // thisUpper needs be clamped by [ aLower, aUpper ].
    const lower_clamped = Math.min( Math.max(
      anotherLower, this.lower ), anotherUpper );

    const upper_clamped = Math.min( Math.max(
      anotherLower, this.upper ), anotherUpper );

    if ( lower_clamped < upper_clamped ) { // Confirm ( lower <= upper )
      this.lower = lower_clamped;
      this.upper = upper_clamped;
    } else {
      this.lower = upper_clamped;
      this.upper = lower_clamped;
    }
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Clamp [ this.lower, this.upper ] by
   * [ aBounds.lower, aBounds.upper ].
   *
   * @return {Bounds}
   *   Return this (modified) object which is
   * [ max( this.lower, aBounds.lower ), min( this.upper, aBounds.upper ) ].
   */
  clamp_byBounds( aBounds ) {
    return this.clamp_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} aLowers
   *   Clamp this.lower by aLowers[ aIndex ].
   *
   * @param {number[]} aUppers
   *   Clamp this.upper by aUppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  clamp_byLowersUppers( aLowers, aUppers, aIndex ) {
    return this.clamp_byLowerUpper( aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Clamp ( this.lower, this.upper ) by
   * ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  clamp_byBoundsArray( aBoundsArray, aIndex ) {
    return this.clamp_byLowerUpper(
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }


  /**
   * @param {number} N
   *   Add this Bounds.lower by N, and also add this Bounds.upper by N.
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as
   * this.add_LowerUpper( N, N ).
   */
  add_byN( N ) {

    // Confirm the lower and upper. And then, add corresponds.
    let thisLower, thisUpper;
    if ( this.lower < this.upper ) {
      thisLower = this.lower;
      thisUpper = this.upper;
    } else {
      thisLower = this.upper;
      thisUpper = this.lower;
    }

    this.lower = ( thisLower + N );
    this.upper = ( thisUpper + N );
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
   *   Return this (modified) object which is added by Bounds
   * [ aLower, aUpper ].
   */
  add_byLowerUpper( aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    // Confirm the lower and upper. And then, add corresponds.
    let thisLower, thisUpper;
    if ( this.lower < this.upper ) {
      thisLower = this.lower;
      thisUpper = this.upper;
    } else {
      thisLower = this.upper;
      thisUpper = this.lower;
    }

    this.lower = ( thisLower + lower );
    this.upper = ( thisUpper + upper );
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
   * @param {number[]} Ns
   *   Add ( this.lower, this.upper ) by ( Ns[ aIndex ], Ns[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  add_byNs( Ns, aIndex ) {
    return this.add_byN( Ns[ aIndex ] );
  }

  /**
   * @param {number[]} aLowers
   *   Add ( this.lower, this.upper ) by
   * ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   *
   * @param {number[]} aUppers
   *   Add ( this.lower, this.upper ) by
   * ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  add_byLowersUppers( aLowers, aUppers, aIndex ) {
    return this.add_byLowerUpper( aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Add ( this.lower, this.upper ) by
   * ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  add_byBoundsArray( aBoundsArray, aIndex ) {
    return this.add_byLowerUpper(
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }


  /**
   * @param {number} N
   *   The multiplier of this.lower and this.upper.
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as
   * this.multiply_LowerUpper( N, N ) or repeating N times
   * this.add_Bounds( this ).
   */
  multiply_byN( N ) {
    // Because the different sign of lower and upper, it needs compute all
    // combinations to determine the bounds of result.
    const lower_N = ( this.lower * N );
    const upper_N = ( this.upper * N );
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
   *   Return this (modified) object which is multiplied by Bounds
   * [ aLower, aUpper ].
   */
  multiply_byLowerUpper( aLower, aUpper ) {
    // Because the different sign of lower and upper, it needs compute all
    // combination to determine the bounds of result.
    const lower_lower = ( this.lower * aLower );
    const lower_upper = ( this.lower * aUpper );
    const upper_lower = ( this.upper * aLower );
    const upper_upper = ( this.upper * aUpper );
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
   * @param {number[]} Ns
   *   Multiply ( this.lower, this.upper ) by ( Ns[ aIndex ], Ns[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  multiply_byNs( Ns, aIndex ) {
    return this.multiply_byN( Ns[ aIndex ] );
  }

  /**
   * @param {number[]} aLowers
   *   Multiply ( this.lower, this.upper ) by
   * ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   *
   * @param {number[]} aUppers
   *   Multiply ( this.lower, this.upper ) by
   * ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  multiply_byLowersUppers( aLowers, aUppers, aIndex ) {
    return this.multiply_byLowerUpper( aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Multiply ( this.lower, this.upper ) by
   * ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  multiply_byBoundsArray( aBoundsArray, aIndex ) {
    return this.multiply_byLowerUpper(
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }

  /**
   * @param {Bounds} aBounds
   *   The first multiplier (a Bounds).
   *
   * @param {number} N
   *   The second multiplier (a number).
   *
   * @return {Bounds}
   *   Return this (modified) object which is the sumed Bounds of repeating N
   * times of multiplying this by aBounds.
   */
  multiply_byBounds_multiply_byN( aBounds, N ) {
    return this.multiply_byBounds( aBounds ).multiply_byN( N );
  }


  /**
   * @param {number} N
   *   The divisor of this.lower and this.upper.
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  divide_byN( N ) {
    // Because the different sign of lower and upper, it needs compute all
    // combinations to determine the bounds of result.
    const lower_N = ( this.lower / N );
    const upper_N = ( this.upper / N );
    this.lower = Math.min( lower_N, upper_N );
    this.upper = Math.max( lower_N, upper_N );
    return this;
  }


  /**
   * @param {ScaleTranslate} aScaleTranslate
   *   Multiply this Bounds by aScaleTranslate.scale, and then add this Bounds
   * by aScaleTranslate.translate.
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as
   * this.multiply_N( aScaleTranslate.scale ).add_N( aScaleTranslate.translate ).
   */
  scaleTranslate_byScaleTranslate( aScaleTranslate ) {
    return this.multiply_byN( aScaleTranslate.scale ).add_byN( aScaleTranslate.translate );
  }


  /**
   * @return {Bounds}
   *   Return this (modified) object whose .lower and .upper has been
   * fround()ed.
   */
  fround() {
    this.lower = Math.fround( this.lower );
    this.upper = Math.fround( this.upper );
    return this;
  }


  /**
   * @return {Bounds}
   *   Return this (modified) object whose .lower and .upper has been
   * trunc()ed to integer.
   */
  trunc() {
    this.lower = Math.trunc( this.lower );
    this.upper = Math.trunc( this.upper );
    return this;
  }


  /**
   * @param {number} value
   *   The value to be clamped. (will be converted to 32-bits floating-point
   * number.)
   *
   * @return {number}
   *   Return value clamped between this Bounds [ this.lower, this.upper ]. If
   * value is NaN, it will become zero first and then be clamped between this
   * Bounds [ this.lower, this.upper ].
   */
  clamp_or_zeroIfNaN( value ) {
    if ( Number.isNaN( value ) )
      value = 0; // If NaN, view it as 0.
    return Math.max( this.lower, Math.min( value, this.upper ) );
  }

  /**
   * Confirm:
   *   - Every element is not NaN. (If it is, become 0.)
   *   - Every element is between [ this.lower, this.upper ].
   *
   * @param {number[]|Float32Array} sourceArray
   *   The source number array or Float32Array.
   *
   * @return {Float32Array}
   *   Return a copy of source. Every element (float32):
   *     - If ( Number.isNaN( element ) == true ), let it become 0.
   *     - Otherwise, Math.max( lower, Math.min( element, upper ) ).
   */
  Float32Array_RestrictedClone( sourceArray ) {
    let resultArray = new Float32Array( sourceArray.length );
    for ( let i = 0; i < sourceArray.length; ++i ) {
      const element = Math.fround( sourceArray[ i ] );
      if ( !Number.isNaN( element ) ) {
        resultArray[ i ]
          = Math.max( this.lower, Math.min( element, this.upper ) );

      // Otherwise (i.e. NaN), let it become 0. (Just do nothing, because
      // Float32Array is initialized to zero by default.)
      }
    }
    return resultArray;
  }

  /** @override */
  toString() {
    let str = `lower=${this.lower}, upper=${this.upper}`;
    return str;
  }

}
