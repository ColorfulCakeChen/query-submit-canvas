export { ScaleArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { ArrayInterleaver } from "./ArrayInterleaver.js";

/**
 * Describe an array of scale (i.e. multiplier) 32-bits floating-point values.
 *
 * @member {number[]} scales
 *   The scale (i.e. multiplier) values.
 *
 * @member {number} length
 *   The length of this scale array. Setting it will change the length.
 */
class ScaleArray extends Recyclable.Root {

  /**
   * Used as default FloatValue.ScaleArray provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "FloatValue.ScaleArray.Pool",
    ScaleArray, ScaleArray.setAsConstructor );

  /**
   */
  constructor( length ) {
    super();
    ScaleArray.setAsConstructor_self.call( this, length );
  }

  /** @override */
  static setAsConstructor( length = 0 ) {
    super.setAsConstructor();
    ScaleArray.setAsConstructor_self.call( this, length );
    return this;
  }

  /** @override */
  static setAsConstructor_self( length ) {
    if ( this.scales )
      this.scales.length = length;
    else
      this.scales = new Array( length );
  }

  /** @override */
  disposeResources() {
    this.scales.length = 0;
    super.disposeResources();
  }

  get length() {
    return this.scales.length;
  }

  set length( newLength ) {
    this.scales.length = newLength;
  }

  /**
   * @return {ScaleArray}
   *   Return a newly created ScaleArray which is a copy of this ScaleArray.
   */
  clone() {
    let result = ScaleArray.Pool.get_or_create_by( this.scales.length );
    result.set_all_byScaleArray( this );
    return result;
  }


  /**
   * @param {number} N
   *   The value to be compared.
   *
   * @return {boolean}
   *   Return true, if all .scales[] equal to N.
   */
  is_all_EQ_byN( N = 1 ) {
    N = Math.fround( N );
    for ( let i = 0; i < this.scales.length; ++i) {
      if ( this.scales[ i ] != N )
        return false;
    }
    return true;
  }


  /**
   * @param {number} thisIndex
   *   The array index of this.scales[].
   *
   * @param {number} N
   *   Set ( this.scales[ thisIndex ] ) by ( N ). Default are ( N = 1 ) (i.e.
   * no scale).
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_one_byN( thisIndex, N = 1 ) {
    this.scales[ thisIndex ] = Math.fround( N );
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.scales[].
   *
   * @param {number[]} Ns
   *   Set ( this.scales[ thisIndex ] ) by ( Ns[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of Ns[].
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_one_byNs( thisIndex, Ns, aIndex ) {
    return this.set_one_byN( thisIndex, Ns[ aIndex ] );
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.scales[].
   *
   * @param {ScaleArray} aScaleArray
   *   Set ( this.scales[ thisIndex ] ) by ( aScaleArray.scales[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aScaleArray.scales[].
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_one_byScaleArray( thisIndex, aScaleArray, aIndex ) {
    return this.set_one_byN( thisIndex, aScaleArray.scales[ aIndex ] );
  }

  /**
   * Set this.scales[ thisIndex ] to a scale value which could let source
   * bounds [ fromLower, fromUpper ] completely insides destination bounds
   * [ toLower, toUpper ].
   *
   * Note: this.scales[ thisIndex ] may become Number.NaN, if it is impossible
   *       to let source bounds completely insides destination bounds.
   *
   * @param {number} thisIndex  The array index of this.scales[].
   * @param {number} fromLower  The source bounds [ fromLower, fromUpper ]
   * @param {number} fromUpper  The source bounds [ fromLower, fromUpper ]
   * @param {number} toLower    The destination bounds [ toLower, toUpper ]
   * @param {number} toUpper    The destination bounds [ toLower, toUpper ]
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_one_by_fromLowerUpper_toLowerUpper(
    thisIndex, fromLower, fromUpper, toLower, toUpper ) {

    let aScale = ScaleArray.calc_scale_by_fromLowerUpper_toLowerUpper(
      fromLower, fromUpper, toLower, toUpper );

    this.scales[ thisIndex ] = aScale;
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.scales[].
   *
   * @param {number} N
   *   Set ( this.scales[ thisIndex ] ) by ( 1 / N ).
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_one_byUndo_N( thisIndex, N ) {
    // Reciprocal will undo the scale. (Note: Not work for zero.)
    this.scales[ thisIndex ] = Math.fround( 1 / Math.fround( N ) );
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.scales[].
   *
   * @param {number[]} Ns
   *   Set ( this.scales[ thisIndex ] ) by ( 1 / Ns[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of Ns[].
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_one_byUndo_Ns( thisIndex, Ns, aIndex ) {
    // Reciprocal will undo the scale. (Note: Not work for zero.)
    this.scales[ thisIndex ] = Math.fround( 1 / Math.fround( Ns[ aIndex ] ) );
    return this;
  }

  /**
   * @param {number} thisIndex
   *   The array index of this.scales[].
   *
   * @param {ScaleArray} aScaleArray
   *   Set ( this.scales[ thisIndex ] ) by ( 1 / aScaleArray.scales[ aIndex ] ).
   *
   * @param {number} aIndex
   *   The array index of aScaleArray.scales[].
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_one_byUndo_ScaleArray( thisIndex, aScaleArray, aIndex ) {
    return this.set_one_byUndo_Ns( thisIndex, aScaleArray.scales, aIndex );
  }


  /**
   * @param {number} N
   *   Set all ( this.scales[] ) by ( N ). Default are ( N = 1 ) (i.e. no
   * scale).
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_all_byN( N = 1 ) {
    this.scales.fill( Math.fround( N ) );
    return this;
  }

  /**
   * @param {number[]} Ns
   *   Set all ( this.scales[] ) by ( Ns[] ).
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_all_byNs( Ns ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] = Math.fround( Ns[ i ] );
    }
    return this;
  }

  /**
   * @param {ScaleArray} aScaleArray
   *   Set all ( this.scales[] ) by ( aScaleArray.scales[] ).
   *
   * @return {ScaleArray}
   *   Return this (modified) object whose values are copied from aScaleArray.
   */
  set_all_byScaleArray( aScaleArray ) {
    return this.set_all_byNs( aScaleArray.scales );
  }

  /**
   * @param {number[]} Ns
   *   Set all ( this.scales[] ) by ( 1 / Ns[] ).
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_all_byUndo_Ns( Ns ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      // Reciprocal will undo the scale. (Note: Not work for zero.)
      this.scales[ i ] = Math.fround( 1 / Math.fround( Ns[ i ] ) );
    }
    return this;
  }

  /**
   * @param {ScaleArray} aScaleArray
   *   Set all ( this.scales[] ) by ( 1 / aScaleArray.scales[] ).
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_all_byUndo_ScaleArray( aScaleArray ) {
    return this.set_all_byUndo_Ns( aScaleArray.scales );
  }


  /**
   * The this.length will be modified.
   *
   * @param {ScaleArray} inputScaleArray0  The ScaleArray of the 1st input.
   * @param {ScaleArray} inputScaleArray1  The BoundsArray of the 2nd input.
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_all_byScaleArray_concat_input0_input1(
    inputScaleArray0, inputScaleArray1 ) {

    let totalLength
      = ( inputScaleArray0?.length ?? 0 ) + ( inputScaleArray1?.length ?? 0 );

    this.length = totalLength;

    // Concat value scale array.
    let inChannel = 0;

    if ( inputScaleArray0 ) {
      for ( let inChannel0 = 0;
        inChannel0 < inputScaleArray0.length; ++inChannel0, ++inChannel ) {
        this.set_one_byScaleArray( inChannel, inputScaleArray0, inChannel0 );
      }
    }

    if ( inputScaleArray1 ) {
      for ( let inChannel1 = 0;
        inChannel1 < inputScaleArray1.length; ++inChannel1, ++inChannel ) {
        this.set_one_byScaleArray( inChannel, inputScaleArray1, inChannel1 );
      }
    }

    return this;
  }


  /**
   * Rearrange scales by interleaving as ( groupCount == 2 ). This element
   * count must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements temporarily.
   * Providing this array could reduce memory re-allocation and improve
   * performance.
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo_inPlace( arrayTemp ) {
    ArrayInterleaver.interleave_asGrouptTwo_alongWidth_inPlace(
      this.scales, 1, this.scales.length, arrayTemp );
    return this;
  }

  /**
   * Rearrange bounds by interleaving as ( groupCount == 2 ).
   *
   * @param {ScaleArray} aScaleArray
   *   The source ScaleArray to be copied from. Its element count must be even
   * (i.e. divisible by 2).
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo_byScaleArray( aScaleArray ) {
    let elementCount = aScaleArray.length;

    if ( ( elementCount % 2 ) != 0 )
      throw Error( `FloatValue.ScaleArray`
        + `.set_all_byInterleave_asGrouptTwo_byScaleArray(): `
        + `elementCount ( ${elementCount} ) `
        + `must be even (i.e. divisible by 2).`
      );

    this.length = elementCount;
    let elementCountHalf = ( elementCount / 2 );
    ArrayInterleaver.interleave_asGrouptTwo_from_to(
      aScaleArray.scales, 0, this.scales, 0, elementCountHalf );
    return this;
  }

  /**
   * Rearrange bounds by undoing interleaving as ( groupCount == 2 ).
   *
   * @param {ScaleArray} aScaleArray
   *   The source ScaleArray to be copied from. Its element count must be even
   * (i.e. divisible by 2).
   *
   * @return {ScaleArray}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo_undo_byScaleArray( aScaleArray ) {
    let elementCount = aScaleArray.length;

    if ( ( elementCount % 2 ) != 0 )
      throw Error( `FloatValue.ScaleArray`
        + `.set_all_byInterleave_asGrouptTwo_undo_byScaleArray(): `
        + `elementCount ( ${elementCount} ) `
        + `must be even (i.e. divisible by 2).`
      );

    this.length = elementCount;
    let elementCountHalf = ( elementCount / 2 );
    ArrayInterleaver.interleave_asGrouptTwo_from_to_undo(
      aScaleArray.scales, 0, this.scales, 0, elementCountHalf );
    return this;
  }


  /**
   * @param {ScaleArray} lowerHalfScaleArray
   *   The ScaleArray of the 1st output. Its .length will be modified.
   *
   * @param {ScaleArray} higherHalfScaleArray
   *   The ScaleArray of the 2nd output. Its .length will be modified.
   *
   * @return {ScaleArray}
   *   Return this (unmodified) object.
   */
  split_to_lowerHalf_higherHalf( lowerHalfScaleArray, higherHalfScaleArray ) {

    // If not divided by 2, let lower half have one more.
    let length_lowerHalf = Math.ceil( this.length / 2 );
    let length_higherHalf = this.length - length_lowerHalf;

    lowerHalfScaleArray.length = length_lowerHalf;
    higherHalfScaleArray.length = length_higherHalf;

    // Split value bounds array.
    let inChannel = 0;

    for ( let outChannel = 0;
      outChannel < length_lowerHalf; ++outChannel, ++inChannel ) {
      lowerHalfScaleArray.set_one_byScaleArray( outChannel, this, inChannel );
    }

    for ( let outChannel = 0;
      outChannel < length_higherHalf; ++outChannel, ++inChannel ) {
      higherHalfScaleArray.set_one_byScaleArray( outChannel, this, inChannel );
    }

    return this;
  }


  /**
   * @param {number} N
   *   Set all ( this.scales[] ) by ( N ). Default are ( N = 1 ) (i.e. no
   * scale).
   *
   * @return {ScaleArray}
   *   Return this (modified) object whose values are ( this.scales[] * N ).
   */
  multiply_all_byN( N = 1 ) {
    N = Math.fround( N );
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] = Math.fround( this.scales[ i ] * N );
    }
    return this;
  }

  /**
   * @param {number[]} Ns
   *   Set all ( this.scales[] ) by ( this.scales[] * Ns[] ).
   *
   * @return {ScaleArray}
   *   Return this (modified) object whose values are ( this.scales[] * Ns[] ).
   */
  multiply_all_byNs( Ns ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] = Math.fround( this.scales[ i ] * Math.fround( Ns[ i ] ) );
    }
    return this;
  }

  /**
   * @param {ScaleArray} aScaleArray
   *   Set all ( this.scales[] ) by ( this.scales[] * aScaleArray.scales[] ).
   *
   * @return {ScaleArray}
   *   Return this (modified) object whose values are
   * ( this.scales[] * aScaleArray.scales[] ).
   */
  multiply_all_byScaleArray( aScaleArray ) {
    return this.multiply_all_byNs( aScaleArray.scales );
  }


//!!! ...untested... (2025/05/28)
  /**
   * Return strings for all the values displayed in one line (i.e. one row)
   * when logging this object as a table.
   *
   * @param {String[]} out_stringArray
   *   The output string array. All the returned values (i.e. every column of
   * one row) should be pushed at its end (in order).
   *
   * @param {number} nIndex
   *   An integer index into .lowers[] and .uppers[]. If negative, the title
   * string (i.e. [ ".lowers[]", ".uppers[]" ]) should be returned.
   *
   * @param {number} characterCountPerField
   *   Every returned string should be padded so that its length is just
   * so many characters.
   *
   * @param {number} digitCountAfterDecimalPoint
   *   Every returned string (if its original value is a number) should be
   * formatted as so many digits after its decimal point.
   */
  TableLog_append_oneRow_byIndex( out_stringArray,
    nIndex,
    characterCountPerField,
    digitCountAfterDecimalPoint ) {


//!!! ...unfinished... (2025/05/28)
// should has moore title prefix.
// Perhaps, placed at ( nIndex == -3 ), ( nIndex == -2 ), ( nIndex == -1 )


    if ( nIndex < 0 ) {
      const title = ".scales[]";
      out_stringArray.push(
        title.padStart( characterCountPerField )
      );
      return;
    }
 
    out_stringArray.push(
      this.scales[ nIndex ]
        .toFixed( digitCountAfterDecimalPoint )
        .padStart( characterCountPerField )
    );
  }


  /**
   *
   * @param {number} fromLower  The source bounds [ fromLower, fromUpper ]
   * @param {number} fromUpper  The source bounds [ fromLower, fromUpper ]
   * @param {number} toLower    The destination bounds [ toLower, toUpper ]
   * @param {number} toUpper    The destination bounds [ toLower, toUpper ]
   *
   * @return {number}
   *   Return a scale value which could let source bounds
   * [ fromLower, fromUpper ] completely insides destination bounds
   * [ toLower, toUpper ]. Return Number.NaN, if it is impossible to do that.
   */
  static calc_scale_by_fromLowerUpper_toLowerUpper(
    fromLower, fromUpper, toLower, toUpper ) {

    // Confirm ( lower <= upper ).
    let srcLower, srcUpper;
    if ( fromLower < fromUpper ) {
      srcLower = Math.fround( fromLower );
      srcUpper = Math.fround( fromUpper );
    } else {
      srcLower = Math.fround( fromUpper );
      srcUpper = Math.fround( fromLower );
    }

    let dstLower, dstUpper;
    if ( toLower < toUpper ) {
      dstLower = Math.fround( toLower );
      dstUpper = Math.fround( toUpper );
    } else {
      dstLower = Math.fround( toUpper );
      dstUpper = Math.fround( toLower );
    }

    // Note:
    //
    // When a legal (positive) scale is found. A value of powers of two which
    // is equal to or less than it will be returned instead.
    //
    //   scale = 2 ** Math.floor( Math.log2( scale ) )
    //
    // So the returned scale (if exists) is always powers of two (e.g. 2^(-1),
    // 2^(-2), 2^(-3), ... ) (i.e. 0.5, 0.25, 0.125, ... ). Although using a
    // smaller scale may increase floating-point truncation error, it may
    // reduce floating-point accumulated error. Because they can be represented
    // as a finite floating-point number (v.s. if scale is 0.3, it can not be
    // represented as a finite floating-point number), this reduces
    // floating-point accumulated error when ShuffleNetV2_byMobileNetV2
    // pass-through do-scale and undo-scale repeatedly.
    //
    let scale;

    // 1. Try lower bound.
    //
    // Note:
    //  ( x / +Infinity ) == +0
    //  ( x / -Infinity ) == -0
    //  (  0 / x ) = 0
    //  ( -1 / 0 ) = -Infinity
    //  ( +1 / 0 ) = +Infinity
    //  (  0 / 0 ) = NaN
    //  ( +-Infinity / +-Infinity ) == NaN
    //
    scale = Math.fround( dstLower / srcLower );
    if ( scale > 1 )
      // i.e. no need to scale because srcLower is already in bounds
      // [ dstLower, dstUpper ].
      scale = 1;

    // 1.2 Verification.
    //   - If scale is negative or zero or -Infinity or +Infinity or NaN, it is
    //       always failed.
    //   - If scaled source upper bound is out of destination range, it is also
    //       failed.
    let adjustedUpper = Math.fround( srcUpper * scale );

    if (   ( scale <= 0 )
        || ( !Number.isFinite( scale ) )
        || ( adjustedUpper < dstLower )
        || ( adjustedUpper > dstUpper ) ) {

      // 2. Try upperer bound, since it is failed to fit [ srcLower, srcUpper ]
      //    into [ dstLower, dstUpper ] by scale according to lower bound.
      scale = Math.fround( dstUpper / srcUpper );
      if ( scale > 1 )
        // i.e. no need to scale because srcUpper is already in bounds
        //      [ dstLower, dstUpper ].
        scale = 1;

      // 2.2 Verification. If scale is zero, it is always failed. Otherwise,
      //       check it by lower side.
      //   - If scale is negative or zero or -Infinity or +Infinity or NaN, it
      //       is always failed.
      //   - If scaled source lower bound is out of destination range, it is
      //       also failed.
      let adjustedLower = Math.fround( srcLower * scale );

      if (   ( scale <= 0 )
          || ( !Number.isFinite( scale ) )
          || ( adjustedLower < dstLower )
          || ( adjustedLower > dstUpper ) ) {
        // 3. It is impossible to fit [ srcLower, srcUpper ] into
        //    [ dstLower, dstUpper ] only by scale because all cases are tried
        //    and failed.
        scale = Number.NaN;

      // 2.3 A legal (positive) scale is found. Make it is a value of powers of
      //     two value which is equal to or less than it.
      } else {
        scale = Math.fround( 2 ** Math.floor( Math.log2( scale ) ) );
      }

    // 1.3 A legal (positive) scale is found. Make it is a value of powers of
    //     two value which is equal to or less than it.
    } else {
      scale = Math.fround( 2 ** Math.floor( Math.log2( scale ) ) );
    }

    return scale;
  }

}
