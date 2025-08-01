export { BoundsArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { Bounds } from "./Bounds.js";
import { ScaleTranslateArray } from "./ScaleTranslateArray.js";
import { ArrayInterleaver } from "./ArrayInterleaver.js";

/**
 * Describe the [ lower, upper ] bounds of an array of 32-bits floating-point
 * values.
 *
 * @member {number[]} lowers
 *   The lower bound array of the range.
 *
 * @member {number[]} uppers
 *   The upper bound array of the range.
 *
 * @member {number} length
 *   The length of this bound array. Setting it will change the length.
 */
class BoundsArray extends Recyclable.Root {

  /**
   * Used as default FloatValue.BoundsArray provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "FloatValue.BoundsArray.Pool",
    BoundsArray );

  /**
   */
  constructor( length ) {
    super();
    this.#setAsConstructor_self( length );
  }

  /** @override */
  setAsConstructor( length ) {
    super.setAsConstructor();
    this.#setAsConstructor_self( length );
  }

  /**  */
  #setAsConstructor_self( length = 0 ) {
    if ( this.lowers )
      this.lowers.length = length;
    else
      this.lowers = new Array( length );

    if ( this.uppers )
      this.uppers.length = length;
    else
      this.uppers = new Array( length );
  }

  /** @override */
  disposeResources() {

//!!! (2025/07/08 Temp Added) For Debug.
//     // Find out when appear strange data member "undefined".
//     // (2025/07/08 Temp Added) For Debug.
//     if ( Number.isNaN( this.lowers[ undefined] ) )
//       debugger;

    this.lowers.length = 0;
    this.uppers.length = 0;
    super.disposeResources();
  }

  get length() {
    return this.lowers.length;
  }

  set length( newLength ) {
    this.lowers.length = newLength;
    this.uppers.length = newLength;
  }

  /**
   * @return {BoundsArray}
   *   Return newly created object which is a copy of this BoundsArray.
   */
  clone() {
    let result = BoundsArray.Pool.get_or_create_by( this.lowers.length );
    result.set_all_byBoundsArray( this );
    return result;
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} N
   *   The value to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lowers[ thisIndex ] <= N ) and
   * ( .uppers[ thisIndex ] >= N ).
   */
  is_one_contain_N( thisIndex, N ) {
    if (   ( this.lowers[ thisIndex ] <= N )
        && ( this.uppers[ thisIndex ] >= N ) )
      return true;
    return false;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} aLower
   *   The lower bound to be compared.
   *
   * @param {number} aUpper
   *   The upper bound to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lowers[ thisIndex ] <= aLower ) and
   * ( .uppers[ thisIndex ] >= aUpper ).
   */
  is_one_contain_LowerUpper( thisIndex, aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    if (   ( this.lowers[ thisIndex ] <= lower )
        && ( this.uppers[ thisIndex ] >= upper ) )
      return true;
    return false;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBounds
   *   The bounds to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lowers[ thisIndex ] <= aBounds.lower )
   * and ( .uppers[ thisIndex ] >= aBounds.upper ).
   */
  is_one_contain_Bounds( thisIndex, aBounds ) {
    return this.is_one_contain_LowerUpper( thisIndex,
      aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {BoundsArray} aBoundsArray
   *   The bounds array to be compared.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {boolean}
   *   Return true, if ( .lowers[ thisIndex ] <= aBoundsArray.lowers[ aIndex ] )
   * and ( .uppers[ thisIndex ] >= aBoundsArray.uppers[ aIndex ] ).
   */
  is_one_contain_BoundsArray_one( thisIndex, aBoundsArray, aIndex ) {
    return this.is_one_contain_LowerUpper( thisIndex,
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }

  /**
   * @param {number} N
   *   The value to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lowers[] <= N ) and ( .uppers[] >= N ).
   */
  is_all_contain_N( N ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      if ( ( this.lowers[ i ] <= N ) && ( this.uppers[ i ] >= N ) )
        continue;
      return false;
    }
    return true;
  }

  /**
   * @param {number} aLower
   *   The lower bound to be compared.
   *
   * @param {number} aUpper
   *   The upper bound to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lowers[] <= aLower ) and ( .uppers[] >= aUpper ).
   */
  is_all_contain_LowerUpper( aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    for ( let i = 0; i < this.lowers.length; ++i ) {
      if ( ( this.lowers[ i ] <= lower ) && ( this.uppers[ i ] >= upper ) )
        continue;
      return false;
    }
    return true;
  }

  /**
   * @param {Bounds} aBounds
   *   The bounds to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lowers[] <= aBounds.lower ) and
   * ( .uppers[] >= aBounds.upper ).
   */
  is_all_contain_Bounds( aBounds ) {
    return this.is_all_contain_LowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   The bounds array to be compared.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {boolean}
   *   Return true, if ( .lowers[] <= aBoundsArray.lowers[ aIndex ] )
   * and ( .uppers[] >= aBoundsArray.uppers[ aIndex ] ).
   */
  is_all_contain_BoundsArray_one( aBoundsArray, aIndex ) {
    return this.is_all_contain_LowerUpper(
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} aLower
   *   The lower bound to be compared.
   *
   * @param {number} aUpper
   *   The upper bound to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lowers[ thisIndex ] >= aLower ) and
   * ( .uppers[ thisIndex ] <= aUpper ).
   */
  is_one_in_LowerUpper( thisIndex, aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    if (   ( this.lowers[ thisIndex ] >= lower )
        && ( this.uppers[ thisIndex ] <= upper ) )
      return true;
    return false;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBounds
   *   The bounds to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lowers[ thisIndex ] >= aBounds.lower )
   * and ( .uppers[ thisIndex ] <= aBounds.upper ).
   */
  is_one_in_Bounds( thisIndex, aBounds ) {
    return this.is_one_in_LowerUpper( thisIndex,
      aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {BoundsArray} aBoundsArray
   *   The bounds array to be compared.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {boolean}
   *   Return true, if ( .lowers[ thisIndex ] >= aBoundsArray.lowers[ aIndex ] )
   * and ( .uppers[ thisIndex ] <= aBoundsArray.uppers[ aIndex ] ).
   */
  is_one_in_BoundsArray_one( thisIndex, aBoundsArray, aIndex ) {
    return this.is_one_in_LowerUpper( thisIndex,
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
   *   Return true, if ( .lowers[] >= aLower ) and ( .uppers[] <= aUpper ).
   */
  is_all_in_LowerUpper( aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    for ( let i = 0; i < this.lowers.length; ++i ) {
      if ( ( this.lowers[ i ] >= lower ) && ( this.uppers[ i ] <= upper ) )
        continue;
      return false;
    }
    return true;
  }

  /**
   * @param {Bounds} aBounds
   *   The bounds to be compared.
   *
   * @return {boolean}
   *   Return true, if ( .lowers[] >= aBounds.lower ) and
   * ( .uppers[] <= aBounds.upper ).
   */
  is_all_in_Bounds( aBounds ) {
    return this.is_all_in_LowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   The bounds array to be compared.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {boolean}
   *   Return true, if ( .lowers[] >= aBoundsArray.lowers[ aIndex ] )
   * and ( .uppers[] <= aBoundsArray.uppers[ aIndex ] ).
   */
  is_all_in_BoundsArray_one( aBoundsArray, aIndex ) {
    return this.is_all_in_LowerUpper(
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} N
   *   Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( N, N ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_one_byN( thisIndex, N ) {
    this.lowers[ thisIndex ] = N;
    this.uppers[ thisIndex ] = N;
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} aLower
   *   Set this.lowers[ thisIndex ] by aLower.
   *
   * @param {number} aUpper
   *   Set this.uppers[ thisIndex ] by aUpper.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_one_byLowerUpper( thisIndex, aLower, aUpper ) {
    if ( aLower < aUpper ) { // Confirm ( lower <= upper ).
      this.lowers[ thisIndex ] = ( aLower );
      this.uppers[ thisIndex ] = ( aUpper );
    } else {
      this.lowers[ thisIndex ] = ( aUpper );
      this.uppers[ thisIndex ] = ( aLower );
    }
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBounds
   *   Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object whose values are copied from aBounds.
   */
  set_one_byBounds( thisIndex, aBounds ) {
    return this.set_one_byLowerUpper( thisIndex,
      aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number[]} Ns
   *   Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( Ns[ aIndex ], Ns[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of Ns[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_one_byNs( thisIndex, Ns, aIndex ) {
    return this.set_one_byN( thisIndex, Ns[ aIndex ] );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number[]} aLowers
   *   Set this.lowers[ thisIndex ] by aLowers[ aIndex ].
   *
   * @param {number[]} aUppers
   *   Set this.uppers[ thisIndex ] by aUppers[ aIndex ].
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_one_byLowersUppers( thisIndex, aLowers, aUppers, aIndex ) {
    return this.set_one_byLowerUpper( thisIndex,
      aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBoundsArray
   *   Set ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.set_one_byLowersUppers( thisIndex,
      aBoundsArray.lowers, aBoundsArray.uppers, aIndex );
  }


  /**
   * Set all ( this.lowers[], this.uppers[] ) to ( +Infinity, -Infinity ). This
   * can not be achieved by set_byLowerUpper() because ( lower > upper ).
   * Usually, this method is used mainly before calling .enlarge_one_byN() to
   * find out bounds.
   *
   * @return {Bounds}
   *   Return this (modified) object which is [ +Infinity, -Infinity ].
   */
   set_all_by_PositiveInfinity_NegativeInfinity() {
    this.lowers.fill( +Infinity );
    this.uppers.fill( -Infinity );
    return this;
  }

  /**
   * @param {number} N
   *   Set all ( this.lowers[], this.uppers[] ) by ( N, N ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_all_byN( N ) {
    this.lowers.fill( N );
    this.uppers.fill( N );
    return this;
  }

  /**
   * @param {number} aLower
   *   Set all this.lowers[] by aLower.
   *
   * @param {number} aUpper
   *   Set all this.uppers[] by aUpper.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_all_byLowerUpper( aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    this.lowers.fill( lower );
    this.uppers.fill( upper );
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Set all ( this.lowers[], this.uppers[] ) by
   * ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object whose values are copied from aBounds.
   */
  set_all_byBounds( aBounds ) {
    return this.set_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} Ns
   *   Set all ( this.lowers[], this.uppers[] ) by ( Ns[], Ns[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_all_byNs( Ns ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.set_one_byNs( i, Ns, i );
    }
    return this;
  }

  /**
   * @param {number[]} aLowers
   *   Set all this.lowers[] by aLowers[].
   *
   * @param {number[]} aUppers
   *   Set all this.uppers[] by aUppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object which is [ aLowers, aUppers ].
   */
  set_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.set_one_byLowersUppers( i, aLowers, aUppers, i );
    }
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Set all ( this.lowers[], this.uppers[] ) by
   * ( aBoundsArray.lowers[], aBoundsArray.uppers[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object whose values are copied from aBoundsArray.
   */
  set_all_byBoundsArray( aBoundsArray ) {
    return this.set_all_byLowersUppers(
      aBoundsArray.lowers, aBoundsArray.uppers );
  }

  /**
   * The this.length will be modified.
   *
   * @param {BoundsArray} inputBoundsArray0
   *   The BoundsArray of the 1st input.
   *
   * @param {BoundsArray} inputBoundsArray1
   *   The BoundsArray of the 2nd input.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_all_byBoundsArray_concat_input0_input1(
    inputBoundsArray0, inputBoundsArray1 ) {

    let totalLength
      =   ( inputBoundsArray0?.length ?? 0 )
        + ( inputBoundsArray1?.length ?? 0 );

    this.length = totalLength;

    // Concat value bounds array.
    let inChannel = 0;

    if ( inputBoundsArray0 ) {
      for ( let inChannel0 = 0;
        inChannel0 < inputBoundsArray0.length; ++inChannel0, ++inChannel ) {
        this.set_one_byBoundsArray( inChannel, inputBoundsArray0, inChannel0 );
      }
    }

    if ( inputBoundsArray1 ) {
      for ( let inChannel1 = 0;
        inChannel1 < inputBoundsArray1.length; ++inChannel1, ++inChannel ) {
        this.set_one_byBoundsArray( inChannel, inputBoundsArray1, inChannel1 );
      }
    }

    return this;
  }

  /**
   * Rearrange bounds by interleaving as ( groupCount == 2 ). This element
   * count must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements temporarily.
   * Providing this array could reduce memory re-allocation and improve
   * performance.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo_inPlace( arrayTemp ) {

    ArrayInterleaver.interleave_asGrouptTwo_alongWidth_inPlace(
      this.lowers, 1, this.lowers.length, arrayTemp );

    ArrayInterleaver.interleave_asGrouptTwo_alongWidth_inPlace(
      this.uppers, 1, this.uppers.length, arrayTemp );

    return this;
  }

  /**
   * Rearrange bounds by interleaving as ( groupCount == 2 ).
   *
   * @param {BoundsArray} aBoundsArray
   *   The source BoundsArray to be copied from. Its element count must be even
   * (i.e. divisible by 2).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo_byBoundsArray( aBoundsArray ) {
    let elementCount = aBoundsArray.length;

    if ( ( elementCount % 2 ) != 0 )
      throw Error( `FloatValue.BoundsArray`
        + `.set_all_byInterleave_asGrouptTwo_byBoundsArray(): `
        + `elementCount ( ${elementCount} ) `
        + `must be even (i.e. divisible by 2).`
      );

    this.length = elementCount;
    let elementCountHalf = ( elementCount / 2 );

    ArrayInterleaver.interleave_asGrouptTwo_from_to(
      aBoundsArray.lowers, 0, this.lowers, 0, elementCountHalf );

    ArrayInterleaver.interleave_asGrouptTwo_from_to(
      aBoundsArray.uppers, 0, this.uppers, 0, elementCountHalf );

    return this;
  }

  /**
   * Rearrange bounds by undoing interleaving as ( groupCount == 2 ).
   *
   * @param {BoundsArray} aBoundsArray
   *   The source BoundsArray to be copied from. Its element count must be even
   * (i.e. divisible by 2).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo_undo_byBoundsArray( aBoundsArray ) {
    let elementCount = aBoundsArray.length;

    if ( ( elementCount % 2 ) != 0 )
      throw Error( `FloatValue.BoundsArray`
        + `.set_all_byInterleave_asGrouptTwo_undo_byBoundsArray(): `
        + `elementCount ( ${elementCount} ) `
        + `must be even (i.e. divisible by 2).`
      );

    this.length = elementCount;
    let elementCountHalf = ( elementCount / 2 );

    ArrayInterleaver.interleave_asGrouptTwo_from_to_undo(
      aBoundsArray.lowers, 0, this.lowers, 0, elementCountHalf );

    ArrayInterleaver.interleave_asGrouptTwo_from_to_undo(
      aBoundsArray.uppers, 0, this.uppers, 0, elementCountHalf );

    return this;
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} N
   *   Enlarge bounds so that [ this.lowers[ thisIndex ],
   * this.uppers[ thisIndex ] ] contains N.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
   enlarge_one_byN( thisIndex, N ) {
    if ( this.lowers[ thisIndex ] > N )
      this.lowers[ thisIndex ] = N;
    if ( this.uppers[ thisIndex ] < N )
      this.uppers[ thisIndex ] = N;
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} aLower
   *   The lower bound to be contained.
   *
   * @param {number} aUpper
   *   The upper bound to be contained.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
   enlarge_one_byLowerUpper( thisIndex, aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    if ( this.lowers[ thisIndex ] > lower )
      this.lowers[ thisIndex ] = lower;
    if ( this.uppers[ thisIndex ] < upper )
      this.uppers[ thisIndex ] = upper;
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBounds
   *   The bounds to be contained.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  enlarge_one_byBounds( thisIndex, aBounds ) {
    return this.enlarge_one_byLowerUpper( thisIndex,
      aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {BoundsArray} aBoundsArray
   *   The bounds array to be contained.
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  enlarge_one_byBoundsArray_one( thisIndex, aBoundsArray, aIndex ) {
    return this.enlarge_one_byLowerUpper( thisIndex,
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object whose bounds
   * [ .lowers[ aIndex ], .uppers[ aIndex ] ] is enlarged a little to the
   * nearest two's integer power.
   */
  enalrge_one_byIntegerPowersOfTwo( thisIndex ) {
    const lower = this.lowers[ thisIndex ];
    const upper = this.uppers[ thisIndex ];
    const lowerEnlarged = Bounds.enalrge_byIntegerPowersOfTwo_lower( lower );
    const upperEnlarged = Bounds.enalrge_byIntegerPowersOfTwo_upper( upper );
    this.lowers[ thisIndex ] = lowerEnlarged;
    this.uppers[ thisIndex ] = upperEnlarged;
    return this;
  }


  /**
   * @param {number} N
   *   Enlarge every bounds so that [ this.lowers[], this.uppers[] ]
   * contains N.
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  enlarge_all_byN( N ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      if ( this.lowers[ i ] > N )
        this.lowers[ i ] = N;
      if ( this.uppers[ i ] < N )
        this.uppers[ i ] = N;
    }
    return this;
  }

  /**
   * @return {BoundsArray}
   *   Return this (modified) object whose bounds [ .lowers[], .uppers[] ]
   * is enlarged a little to the nearest two's integer power.
   */
  enalrge_all_byIntegerPowersOfTwo() {
    const elementCount = this.lowers.length;
    let lower, upper;
    let lowerEnlarged, upperEnlarged;
    for ( let i = 0; i < elementCount; ++i ) {
      lower = this.lowers[ i ];
      upper = this.uppers[ i ];
      lowerEnlarged = Bounds.enalrge_byIntegerPowersOfTwo_lower( lower );
      upperEnlarged = Bounds.enalrge_byIntegerPowersOfTwo_upper( upper );
      this.lowers[ i ] = lowerEnlarged;
      this.uppers[ i ] = upperEnlarged;
    }
    return this;
  }

  /**
   * @param {boolean[]} bPassThroughArray
   *   A boolean array (whose .length should be the same as this.length). If
   * true for a channel, the channel's value bounds will not be adjusted.
   *
   * @return {BoundsArray}
   *   Return this (modified) object whose bounds [ .lowers[], .uppers[] ]
   * is enlarged a little to the nearest two's integer power (except bounds
   * with ( bPassThroughArray[ i ] == true ) ).
   */
  enalrge_all_byIntegerPowersOfTwo_exceptPassThrough( bPassThroughArray ) {
    const elementCount = this.lowers.length;
    let bPassThrough;
    let lower, upper;
    let lowerEnlarged, upperEnlarged;
    for ( let i = 0; i < elementCount; ++i ) {
      bPassThrough = bPassThroughArray[ i ];
      if ( bPassThrough )
        continue;
      lower = this.lowers[ i ];
      upper = this.uppers[ i ];
      lowerEnlarged = Bounds.enalrge_byIntegerPowersOfTwo_lower( lower );
      upperEnlarged = Bounds.enalrge_byIntegerPowersOfTwo_upper( upper );
      this.lowers[ i ] = lowerEnlarged;
      this.uppers[ i ] = upperEnlarged;
    }
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} aLower
   *   Clamp this.lowers[ thisIndex ] by aLower.
   *
   * @param {number} aUpper
   *   Clamp this.uppers[ thisIndex ] by aUpper.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  clamp_one_byLowerUpper( thisIndex, aLower, aUpper ) {
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
      anotherLower, this.lowers[ thisIndex ] ), anotherUpper );

    const upper_clamped = Math.min( Math.max(
      anotherLower, this.uppers[ thisIndex ] ), anotherUpper );

    if ( lower_clamped < upper_clamped ) { // Confirm ( lower <= upper )
      this.lowers[ thisIndex ] = lower_clamped;
      this.uppers[ thisIndex ] = upper_clamped;
    } else {
      this.lowers[ thisIndex ] = upper_clamped;
      this.uppers[ thisIndex ] = lower_clamped;
    }
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBounds
   *   Clamp ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  clamp_one_byBounds( thisIndex, aBounds ) {
    return this.clamp_one_byLowerUpper( thisIndex,
      aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number[]} aLowers
   *   Clamp this.lowers[ thisIndex ] by aLowers[ aIndex ].
   *
   * @param {number[]} aUppers
   *   Clamp this.uppers[ thisIndex ] by aUppers[ aIndex ].
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  clamp_one_byLowersUppers( thisIndex, aLowers, aUppers, aIndex ) {
    return this.clamp_one_byLowerUpper( thisIndex,
      aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {BoundsArray} aBoundsArray
   *   Clamp ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  clamp_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.clamp_one_byLowerUpper( thisIndex,
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }

  /**
   * @param {number} aLower
   *   Clamp all this.lowers[] by aLower.
   *
   * @param {number} aUpper
   *   Clamp all this.uppers[] by aUpper.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  clamp_all_byLowerUpper( aLower, aUpper ) {
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
    for ( let i = 0; i < this.lowers.length; ++i ) {

      const lower_clamped = Math.min( Math.max(
        anotherLower, this.lowers[ i ] ), anotherUpper );

      const upper_clamped = Math.min( Math.max(
        anotherLower, this.uppers[ i ] ), anotherUpper );

      if ( lower_clamped < upper_clamped ) { // Confirm ( lower <= upper )
        this.lowers[ i ] = lower_clamped;
        this.uppers[ i ] = upper_clamped;
      } else {
        this.lowers[ i ] = upper_clamped;
        this.uppers[ i ] = lower_clamped;
      }
    }
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Clamp all ( this.lowers[], this.uppers[] ) by
   * ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  clamp_all_byBounds( aBounds ) {
    return this.clamp_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} aLowers
   *   Clamp all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   *
   * @param {number[]} aUppers
   *   Clamp all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  clamp_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.clamp_one_byLowerUpper( i, aLowers[ i ], aUppers[ i ] );
    }
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Clamp all ( this.lowers[], this.uppers[] ) by
   * ( aBoundsArray.lowers[], aBoundsArray.uppers[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  clamp_all_byBoundsArray( aBoundsArray ) {
    return this.clamp_all_byLowersUppers(
      aBoundsArray.lowers, aBoundsArray.uppers );
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} N
   *   Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by ( N, N ).
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as
   * this.add_one_byLowerUpper( N, N ).
   */
  add_one_byN( thisIndex, N ) {

    // Confirm ( thisLower <= thisUupper ). And then, add corresponds.
    let thisLower, thisUpper;
    if ( this.lowers[ thisIndex ] < this.uppers[ thisIndex ] ) {
      thisLower = this.lowers[ thisIndex ];
      thisUpper = this.uppers[ thisIndex ];
    } else {
      thisLower = this.uppers[ thisIndex ];
      thisUpper = this.lowers[ thisIndex ];
    }

    this.lowers[ thisIndex ] = ( thisLower + N );
    this.uppers[ thisIndex ] = ( thisUpper + N );
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} aLower
   *   Add this.lowers[ thisIndex ] by aLower.
   *
   * @param {number} aUpper
   *   Add this.uppers[ thisIndex ] by aUpper.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_one_byLowerUpper( thisIndex, aLower, aUpper ) {
    let lower, upper; // Confirm ( lower <= upper ).
    if ( aLower < aUpper ) {
      lower = ( aLower );
      upper = ( aUpper );
    } else {
      lower = ( aUpper );
      upper = ( aLower );
    }

    // Confirm ( thisLower <= thisUupper ). And then, add corresponds.
    let thisLower, thisUpper;
    if ( this.lowers[ thisIndex ] < this.uppers[ thisIndex ] ) {
      thisLower = this.lowers[ thisIndex ];
      thisUpper = this.uppers[ thisIndex ];
    } else {
      thisLower = this.uppers[ thisIndex ];
      thisUpper = this.lowers[ thisIndex ];
    }

    this.lowers[ thisIndex ] = ( thisLower + lower );
    this.uppers[ thisIndex ] = ( thisUpper + upper );
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBounds
   *   Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_one_byBounds( thisIndex, aBounds ) {
    return this.add_one_byLowerUpper( thisIndex,
      aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number[]} Ns
   *   Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( Ns[ aIndex ], Ns[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of Ns[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_one_byNs( thisIndex, Ns, aIndex ) {
    return this.add_one_byN( thisIndex, Ns[ aIndex ] );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number[]} aLowers
   *   Add this.lowers[ thisIndex ] by aLowers[ aIndex ].
   *
   * @param {number[]} aUppers
   *   Add this.uppers[ thisIndex ] by aUppers[ aIndex ].
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_one_byLowersUppers( thisIndex, aLowers, aUppers, aIndex ) {
    return this.add_one_byLowerUpper( thisIndex,
      aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {BoundsArray} aBoundsArray
   *   Add ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.add_one_byLowerUpper( thisIndex,
      aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] );
  }

  /**
   * @param {number} N
   *   Add all ( this.lowers[], this.uppers[] ) by ( N, N ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_all_byN( N ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.add_one_byN( i, N );
    }
    return this;
  }

  /**
   * @param {number} aLower
   *   Add all this.lowers[] by aLower.
   *
   * @param {number} aUpper
   *   Add all this.uppers[] by aUpper.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_all_byLowerUpper( aLower, aUpper ) {
    let anotherLower, anotherUpper; // Confirm ( anotherLower <= anotherUpper )
    if ( aLower < aUpper ) {
      anotherLower = ( aLower );
      anotherUpper = ( aUpper );
    } else {
      anotherLower = ( aUpper );
      anotherUpper = ( aLower );
    }

    let thisLower, thisUpper;
    for ( let i = 0; i < this.lowers.length; ++i ) {

      // Confirm ( thisLower <= thisUupper ). And then, add corresponds.
      if ( this.lowers[ i ] < this.uppers[ i ] ) {
        thisLower = this.lowers[ i ];
        thisUpper = this.uppers[ i ];
      } else {
        thisLower = this.uppers[ i ];
        thisUpper = this.lowers[ i ];
      }

      this.lowers[ i ] = ( thisLower + anotherLower );
      this.uppers[ i ] = ( thisUpper + anotherUpper );
    }
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Add all ( this.lowers[], this.uppers[] ) by
   * ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_all_byBounds( aBounds ) {
    return this.add_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} Ns
   *   Add all ( this.lowers[], this.uppers[] ) by ( Ns[], Ns[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_all_byNs( Ns ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.add_one_byN( i, Ns[ i ] );
    }
    return this;
  }

  /**
   * @param {number[]} aLowers
   *   Add all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   *
   * @param {number[]} aUppers
   *   Add all ( this.lowers[], this.uppers[] ) by ( aLowers[], aUppers[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.add_one_byLowerUpper( i, aLowers[ i ], aUppers[ i ] );
    }
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Add all ( this.lowers[], this.uppers[] ) by
   * ( aBoundsArray.lowers[], aBoundsArray.uppers[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  add_all_byBoundsArray( aBoundsArray ) {
    return this.add_all_byLowersUppers(
      aBoundsArray.lowers, aBoundsArray.uppers );
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} N
   *   Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( N, N ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_one_byN( thisIndex, N ) {
    // Because the different sign of lower and upper, it needs compute all
    // combination to determine the bounds of result.
    let lower_N = ( this.lowers[ thisIndex ] * N );
    let upper_N = ( this.uppers[ thisIndex ] * N );
    this.lowers[ thisIndex ] = Math.min( lower_N, upper_N );
    this.uppers[ thisIndex ] = Math.max( lower_N, upper_N );
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} aLower
   *   Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * aLower.
   *
   * @param {number} aUpper
   *   Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * aUpper.
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_one_byLowerUpper( thisIndex, aLower, aUpper ) {
    // Because the different sign of lower and upper, it needs compute all
    // combination to determine the bounds of result.
    let lower_lower = ( this.lowers[ thisIndex ] * aLower );
    let lower_upper = ( this.lowers[ thisIndex ] * aUpper );
    let upper_lower = ( this.uppers[ thisIndex ] * aLower );
    let upper_upper = ( this.uppers[ thisIndex ] * aUpper );

    this.lowers[ thisIndex ] = Math.min(
      lower_lower, lower_upper, upper_lower, upper_upper );

    this.uppers[ thisIndex ] = Math.max(
      lower_lower, lower_upper, upper_lower, upper_upper );
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {Bounds} aBounds
   *   Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_one_byBounds( thisIndex, aBounds ) {
    return this.multiply_one_byLowerUpper( thisIndex,
      aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number[]} Ns
   *   Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( Ns[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of Ns[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_one_byNs( thisIndex, Ns, aIndex ) {
    return this.multiply_one_byN( thisIndex, Ns[ aIndex ] );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number[]} aLowers
   *   Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   *
   * @param {number[]} aUppers
   *   Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aLowers[ aIndex ], aUppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aLowers[] and aUppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_one_byLowersUppers( thisIndex, aLowers, aUppers, aIndex ) {
    return this.multiply_one_byLowerUpper( thisIndex,
      aLowers[ aIndex ], aUppers[ aIndex ] );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {BoundsArray} aBoundsArray
   *   Multiply ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( aBoundsArray.lowers[ aIndex ], aBoundsArray.uppers[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aBoundsArray.lowers[] and aBoundsArray.uppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_one_byBoundsArray( thisIndex, aBoundsArray, aIndex ) {
    return this.multiply_one_byLowersUppers( thisIndex,
      aBoundsArray.lowers, aBoundsArray.uppers, aIndex );
  }

  /**
   * @param {number} N
   *   Multiply all ( this.lowers[], this.uppers[] ) by ( N, N ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_all_byN( N ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.multiply_one_byN( i, N );
    }
    return this;
  }

  /**
   * @param {number} aLower
   *   Multiply all ( this.lowers[], this.uppers[] ) by ( aLower, aUpper ).
   *
   * @param {number} aUpper
   *   Multiply all ( this.lowers[], this.uppers[] ) by ( aLower, aUpper ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_all_byLowerUpper( aLower, aUpper ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.multiply_one_byLowerUpper( i, aLower, aUpper );
    }
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Multiply all ( this.lowers[], this.uppers[] ) by
   * ( aBounds.lower, aBounds.upper ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_all_byBounds( aBounds ) {
    return this.multiply_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * @param {number[]} Ns
   *   Multiply all ( this.lowers[], this.uppers[] ) by ( Ns[], Ns[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_all_byNs( Ns ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.multiply_one_byN( i, Ns[ i ] );
    }
    return this;
  }

  /**
   * @param {number[]} aLowers
   *   Multiply all ( this.lowers[], this.uppers[] ) by
   * ( aLowers[], aUppers[] ).
   *
   * @param {number[]} aUppers
   *   Multiply all ( this.lowers[], this.uppers[] ) by
   * ( aLowers[], aUppers[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_all_byLowersUppers( aLowers, aUppers ) {
    for ( let i = 0; i < this.lowers.length; ++i ) {
      this.multiply_one_byLowerUpper( i, aLowers[ i ], aUppers[ i ] );
    }
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Multiply all ( this.lowers[], this.uppers[] ) by
   * ( aBoundsArray.lowers[], aBoundsArray.uppers[] ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_all_byBoundsArray( aBoundsArray ) {
    return this.multiply_all_byLowersUppers(
      aBoundsArray.lowers, aBoundsArray.uppers );
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   The first multiplier (a BoundsArray).
   *
   * @param {number[]} Ns
   *   The second multiplier (a number array).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  multiply_all_byBoundsArray_multiply_all_byNs( aBoundsArray, Ns ) {
    return ( this.multiply_all_byBoundsArray( aBoundsArray )
      .multiply_all_byNs( Ns ) );
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number} N
   *   Divide ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( N, N ).
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  divide_one_byN( thisIndex, N ) {
    // Because the different sign of lower and upper, it needs compute all
    // combination to determine the bounds of result.
    let lower_N = ( this.lowers[ thisIndex ] / N );
    let upper_N = ( this.uppers[ thisIndex ] / N );
    this.lowers[ thisIndex ] = Math.min( lower_N, upper_N );
    this.uppers[ thisIndex ] = Math.max( lower_N, upper_N );
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @param {number[]} Ns
   *   Divide ( this.lowers[ thisIndex ], this.uppers[ thisIndex ] ) by
   * ( Ns[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of Ns[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  divide_one_byNs( thisIndex, Ns, aIndex ) {
    return this.divide_one_byN( thisIndex, Ns[ aIndex ] );
  }


  /**
   * @param {ScaleTranslateArray} aScaleTranslateArray
   *   Multiply all this by aScaleTranslateArray.scales[], and then add all
   * this BoundsArray by aScaleTranslateArray.translates[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object.
   */
  scaleTranslate_all_byScaleTranslateArray( aScaleTranslateArray ) {
    return ( this.multiply_all_byNs( aScaleTranslateArray.scales )
      .add_all_byNs( aScaleTranslateArray.translates ) );
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object whose .lowers[ thisIndex ] and
   * .uppers[ thisIndex ] has been fround()ed.
   */
  fround_one( thisIndex ) {
    const lower = Math.fround( this.lowers[ thisIndex ] );
    const upper = Math.fround( this.uppers[ thisIndex ] );
    this.lowers[ thisIndex ] = lower;
    this.uppers[ thisIndex ] = upper;
    return this;
  }

  /**
   * @return {BoundsArray}
   *   Return this (modified) object whose .lowers[] and.uppers[] has been all
   * fround()ed.
   */
  fround_all() {
    let lower;
    let upper;
    for ( let i = 0; i < this.lowers.length; ++i ) {
      lower = Math.fround( this.lowers[ i ] );
      upper = Math.fround( this.uppers[ i ] );
      this.lowers[ i ] = lower;
      this.uppers[ i ] = upper;
    }
    return this;
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.lowers[] and this.uppers[].
   *
   * @return {BoundsArray}
   *   Return this (modified) object whose .lowers[ thisIndex ] and
   * .uppers[ thisIndex ] has been trunc()ed to integer.
   */
  trunc_one( thisIndex ) {
    const lower = Math.trunc( this.lowers[ thisIndex ] );
    const upper = Math.trunc( this.uppers[ thisIndex ] );
    this.lowers[ thisIndex ] = lower;
    this.uppers[ thisIndex ] = upper;
    return this;
  }

  /**
   * @return {BoundsArray}
   *   Return this (modified) object whose .lowers[] and.uppers[] has been all
   * trunc()ed to integer.
   */
  trunc_all() {
    let lower;
    let upper;
    for ( let i = 0; i < this.lowers.length; ++i ) {
      lower = Math.trunc( this.lowers[ i ] );
      upper = Math.trunc( this.uppers[ i ] );
      this.lowers[ i ] = lower;
      this.uppers[ i ] = upper;
    }
    return this;
  }


  /**
   * @param {number} thisIndex
   *   Use which Bounds of this BoundsArray to clamp the value.
   *
   * @param {number} value
   *   The value to be clamped. (will be converted to 32-bits floating-point
   * number.)
   *
   * @return {number}
   *   Return value clamped between bounds [ this.lowers[ thisIndex ],
   * this.uppers[ thisIndex ] ]. If value is NaN, it will become zero first
   * and then be clamped between bounds [ this.lowers[ thisIndex ],
   * this.uppers[ thisIndex ] ].
   */
  one_clamp_or_zeroIfNaN( thisIndex, value ) {
    if ( Number.isNaN( value ) )
      value = 0; // If NaN, view it as 0.
    return (
      Math.max(
        this.lowers[ thisIndex ],
        Math.min( value, this.uppers[ thisIndex ] ) ) );
  }

  /**
   * @param {BoundsArray} lowerHalfBoundsArray
   *   The BoundsArray of the 1st output. Its .length will be modified.
   *
   * @param {BoundsArray} higherHalfBoundsArray
   *   The BoundsArray of the 2nd output. Its .length will be modified.
   *
   * @return {BoundsArray}
   *   Return this (unmodified) object.
   */
  split_to_lowerHalf_higherHalf(
    lowerHalfBoundsArray, higherHalfBoundsArray ) {

    // If not divided by 2, let lower half have one more.
    let length_lowerHalf = Math.ceil( this.length / 2 );
    let length_higherHalf = this.length - length_lowerHalf;

    lowerHalfBoundsArray.length = length_lowerHalf;
    higherHalfBoundsArray.length = length_higherHalf;

    // Split value bounds array.
    let inChannel = 0;

    for ( let outChannel = 0;
      outChannel < length_lowerHalf; ++outChannel, ++inChannel ) {

      lowerHalfBoundsArray.set_one_byBoundsArray(
        outChannel, this, inChannel );
    }

    for ( let outChannel = 0;
      outChannel < length_higherHalf; ++outChannel, ++inChannel ) {

      higherHalfBoundsArray.set_one_byBoundsArray(
        outChannel, this, inChannel );
    }

    return this;
  }

  /** @override */
  toString() {
    let str = `lowers=[ ${this.lowers} ], uppers=[ ${this.uppers} ]`;
    return str;
  }

  /**
   * Return strings for all the headers displayed in one line (i.e. one row)
   * when logging this object as a table.
   *
   * @param {String[]} out_headerFields
   *   The output string array. All the returned values (i.e. every column
   * header of one row) should be pushed at its end (in order).
   *
   * @param {number} characterCountPerField
   *   Every returned string should be padded so that its length is just
   * so many characters.
   *
   * @param {string} headerPrefix
   *   The string should be concatenated before the returned headers.
   */
  TableLog_header_appendFields( out_headerFields,
    characterCountPerField,
    headerPrefix
  ) {
    const header0 = `${headerPrefix}.lowers[]`;
    const header1 = `${headerPrefix}.uppers[]`;
    out_headerFields.push(
      header0.padStart( characterCountPerField ),
      header1.padStart( characterCountPerField )
    );
  }

  /**
   * Return strings for all the values displayed in one line (i.e. one row)
   * when logging this object as a table.
   *
   * @param {String[]} out_bodyFields
   *   The output string array. All the returned values (i.e. every column of
   * one row) should be pushed at its end (in order).
   *
   * @param {number} characterCountPerField
   *   Every returned string should be padded so that its length is just
   * so many characters.
   *
   * @param {number} digitCountAfterDecimalPoint
   *   Every returned string (if its original value is a number) should be
   * formatted as so many digits after its decimal point.
   *
   * @param {number} rowIndex
   *   Which line of the log table should be returned. It is an integer index
   * into .lowers[] and .uppers[].
   */
  TableLog_body_appendFields( out_bodyFields,
    characterCountPerField,
    digitCountAfterDecimalPoint,
    rowIndex
   ) {
    out_bodyFields.push(
      this.lowers[ rowIndex ]
        .toFixed( digitCountAfterDecimalPoint )
        .padStart( characterCountPerField ),
      this.uppers[ rowIndex ]
        .toFixed( digitCountAfterDecimalPoint )
        .padStart( characterCountPerField )
    );
  }

}
