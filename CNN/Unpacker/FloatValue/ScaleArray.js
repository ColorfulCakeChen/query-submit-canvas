export { ScaleArray };

import { ArrayInterleaver } from "./ArrayInterleaver.js";

/**
 * Describe an array of scale (i.e. multiplier) values.
 *
 * @member {number[]} scales
 *   The scale (i.e. multiplier) values.
 *
 * @member {number} length
 *   The length of this scale array. Setting it will change the length.
 */
class ScaleArray {

  constructor( length ) {
    this.scales = new Array( length );
  }

  get length() {
    return this.scales.length;
  }

  set length( newLength ) {
    this.scales.length = newLength;
  }

  /**
   * @return {ScaleArray} Return a newly created ScaleArray which is a copy of this ScaleArray.
   */
  clone() {
    let result = new ScaleArray( this.scales.length );
    result.set_all_byScaleArray( this );
    return result;
  }

  /**
   * @param {number} thisIndex  The array index of this.scales[].
   * @param {number} N          Set ( this.scales[ thisIndex ] ) by ( N ). Default are ( N = 1 ) (i.e. no scale).
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_one_byN( thisIndex, N = 1 ) {
    this.scales[ thisIndex ] = N;
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.scales[].
   * @param {number[]} Ns       Set ( this.scales[ thisIndex ] ) by ( Ns[ aIndex ] ).
   * @param {number} aIndex     The array index of Ns[].
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_one_byNs( thisIndex, Ns, aIndex ) {
    return this.set_one_byN( thisIndex, Ns[ aIndex ] );
  }

  /**
   * @param {number} thisIndex        The array index of this.scales[].
   * @param {ScaleArray} aScaleArray  Set ( this.scales[ thisIndex ] ) by ( aScaleArray.scales[ aIndex ] ).
   * @param {number} aIndex           The array index of aScaleArray.scales[].
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_one_byScaleArray( thisIndex, aScaleArray, aIndex ) {
    return this.set_one_byN( thisIndex, aScaleArray.scales[ aIndex ] );
  }

  /**
   * Set this.scales[ thisIndex ] to a scale value which could let source bounds [ fromLower, fromUpper ] completely insides destination
   * bounds [ toLower, toUpper ].
   *
   * Note: this.scales[ thisIndex ] may become Number.NaN, if it is impossible to let source bounds completely insides destination
   * bounds.
   *
   * @param {number} thisIndex  The array index of this.scales[].
   * @param {number} fromLower  The source bounds [ fromLower, fromUpper ]
   * @param {number} fromUpper  The source bounds [ fromLower, fromUpper ]
   * @param {number} toLower    The destination bounds [ toLower, toUpper ]
   * @param {number} toUpper    The destination bounds [ toLower, toUpper ]
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_one_by_fromLowerUpper_toLowerUpper( thisIndex, fromLower, fromUpper, toLower, toUpper ) {
    let aScale = ScaleArray.calc_scale_by_fromLowerUpper_toLowerUpper( fromLower, fromUpper, toLower, toUpper );
    this.scales[ thisIndex ] = aScale;
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.scales[].
   * @param {number} N          Set ( this.scales[ thisIndex ] ) by ( 1 / N ).
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_one_byUndo_N( thisIndex, N ) {
    this.scales[ thisIndex ] = ( 1 / N );  // Reciprocal will undo the scale. (Note: Not work for zero.)
    return this;
  }

  /**
   * @param {number} thisIndex  The array index of this.scales[].
   * @param {number[]} Ns       Set ( this.scales[ thisIndex ] ) by ( 1 / Ns[ aIndex ] ).
   * @param {number} aIndex     The array index of Ns[].
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_one_byUndo_Ns( thisIndex, Ns, aIndex ) {
    this.scales[ thisIndex ] = ( 1 / Ns[ aIndex ] );  // Reciprocal will undo the scale. (Note: Not work for zero.)
    return this;
  }

  /**
   * @param {number} thisIndex        The array index of this.scales[].
   * @param {ScaleArray} aScaleArray  Set ( this.scales[ thisIndex ] ) by ( 1 / aScaleArray.scales[ aIndex ] ).
   * @param {number} aIndex           The array index of aScaleArray.scales[].
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_one_byUndo_ScaleArray( thisIndex, aScaleArray, aIndex ) {
    return this.set_one_byUndo_Ns( thisIndex, aScaleArray.scales, aIndex );
  }


  /**
   * @param {number} N  Set all ( this.scales[] ) by ( N ). Default are ( N = 1 ) (i.e. no scale).
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_all_byN( N = 1 ) {
    this.scales.fill( N );
    return this;
  }

  /**
   * @param {number[]} Ns  Set all ( this.scales[] ) by ( Ns[] ).
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_all_byNs( Ns ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] = Ns[ i ];
    }
    return this;
  }

  /**
   * @param {ScaleArray} aScaleArray  Set all ( this.scales[] ) by ( aScaleArray.scales[] ).
   *
   * @return {ScaleArray} Return this (modified) object whose values are copied from aScaleArray.
   */
  set_all_byScaleArray( aScaleArray ) {
    return this.set_all_byNs( aScaleArray.scales );
  }

  /**
   * @param {number[]} Ns  Set all ( this.scales[] ) by ( 1 / Ns[] ).
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_all_byUndo_Ns( Ns ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] = ( 1 / Ns[ i ] );  // Reciprocal will undo the scale. (Note: Not work for zero.)
    }
    return this;
  }

  /**
   * @param {ScaleArray} aScaleArray  Set all ( this.scales[] ) by ( 1 / aScaleArray.scales[] ).
   *
   * @return {ScaleArray} Return this (modified) object.
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
  set_all_byScaleArray_concat_input0_input1( inputScaleArray0, inputScaleArray1 ) {

    let totalLength = ( inputScaleArray0?.length ?? 0 ) + ( inputScaleArray1?.length ?? 0 );
    this.length = totalLength;

    // Concat value scale array.
    let inChannel = 0;

    if ( inputScaleArray0 ) {
      for ( let inChannel0 = 0; inChannel0 < inputScaleArray0.length; ++inChannel0, ++inChannel ) {
        this.set_one_byScaleArray( inChannel, inputScaleArray0, inChannel0 );
      }
    }

    if ( inputScaleArray1 ) {
      for ( let inChannel1 = 0; inChannel1 < inputScaleArray1.length; ++inChannel1, ++inChannel ) {
        this.set_one_byScaleArray( inChannel, inputScaleArray1, inChannel1 );
      }
    }

    return this;
  }


  /**
   * Rearrange scales by interleaving as ( groupCount == 2 ). This element count must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements temporarily. Providing this array could reduce memory re-allocation
   * and improve performance.
   *
   * @return {ScaleArray} Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo( arrayTemp ) {
    ArrayInterleaver.interleave_asGrouptTwo( this.scales, 0, this.scales.length, arrayTemp );
    return this;
  }


  /**
   * @param {ScaleArray} lowerHalfScaleArray   The ScaleArray of the 1st output. Its .length will be modified.
   * @param {ScaleArray} higherHalfScaleArray  The ScaleArray of the 2nd output. Its .length will be modified.
   *
   * @return {ScaleArray} Return this (unmodified) object.
   */
  split_to_lowerHalf_higherHalf( lowerHalfScaleArray, higherHalfScaleArray ) {

    // If not divided by 2, let lower half have one more.
    let length_lowerHalf = Math.ceil( this.length / 2 );
    let length_higherHalf = this.length - length_lowerHalf;

    lowerHalfScaleArray.length = length_lowerHalf;
    higherHalfScaleArray.length = length_higherHalf;

    // Split value bounds array.
    let inChannel = 0;

    for ( let outChannel = 0; outChannel < length_lowerHalf; ++outChannel, ++inChannel ) {
      lowerHalfScaleArray.set_one_byScaleArray( outChannel, this, inChannel );
    }

    for ( let outChannel = 0; outChannel < length_higherHalf; ++outChannel, ++inChannel ) {
      higherHalfScaleArray.set_one_byScaleArray( outChannel, this, inChannel );
    }

    return this;
  }


  /**
   * @param {number} N  Set all ( this.scales[] ) by ( N ). Default are ( N = 1 ) (i.e. no scale).
   *
   * @return {ScaleArray} Return this (modified) object whose values are ( this.scales[] * N ).
   */
  multiply_all_byN( N = 1 ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] *= N;
    }
    return this;
  }

  /**
   * @param {number[]} Ns  Set all ( this.scales[] ) by ( this.scales[] * Ns[] ).
   *
   * @return {ScaleArray} Return this (modified) object whose values are ( this.scales[] * Ns[] ).
   */
  multiply_all_byNs( Ns ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] *= Ns[ i ];
    }
    return this;
  }

  /**
   * @param {ScaleArray} aScaleArray  Set all ( this.scales[] ) by ( this.scales[] * aScaleArray.scales[] ).
   *
   * @return {ScaleArray} Return this (modified) object whose values are ( this.scales[] * aScaleArray.scales[] ).
   */
  multiply_all_byScaleArray( aScaleArray ) {
    return this.multiply_all_byNs( aScaleArray.scales );
  }
  

  /**
   *
   * @param {number} fromLower  The source bounds [ fromLower, fromUpper ]
   * @param {number} fromUpper  The source bounds [ fromLower, fromUpper ]
   * @param {number} toLower    The destination bounds [ toLower, toUpper ]
   * @param {number} toUpper    The destination bounds [ toLower, toUpper ]
   *
   * @return {number}
   *   Return a scale value which could let source bounds [ fromLower, fromUpper ] completely insides destination bounds [ toLower, toUpper ].
   * Return Number.NaN, if it is impossible to do that.
   */
  static calc_scale_by_fromLowerUpper_toLowerUpper( fromLower, fromUpper, toLower, toUpper ) {
    let srcLower = Math.min( fromLower, fromUpper ); // Confirm ( lower <= upper ).
    let srcUpper = Math.max( fromLower, fromUpper );
    let dstLower = Math.min( toLower, toUpper );
    let dstUpper = Math.max( toLower, toUpper );

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
    scale = dstLower / srcLower;
    if ( scale > 1 )
      scale = 1; // i.e. no need to scale because srcLower is already in bounds [ dstLower, dstUpper ].

    // 1.2 Verification.
    //   - If scale is zero or -Infinity or +Infinity or NaN, it is always failed.
    //   - If scaled source upper bound is out of destination range, it is also failed.
    let adjustedUpper = srcUpper * scale;
    if ( ( scale == 0 ) || ( !Number.isFinite( scale ) ) || ( adjustedUpper < dstLower ) || ( adjustedUpper > dstUpper ) ) {

      // 2. Try upperer bound, since it is failed to fit [ srcLower, srcUpper ] into [ dstLower, dstUpper ] by scale according to lower bound.
      scale = dstUpper / srcUpper;
      if ( scale > 1 )
        scale = 1; // i.e. no need to scale because srcUpper is already in bounds [ dstLower, dstUpper ].

      // 2.2 Verification. If scale is zero, it is always failed. Otherwise, check it by lower side.
      //   - If scale is zero or -Infinity or +Infinity or NaN, it is always failed.
      //   - If scaled source lower bound is out of destination range, it is also failed.
      let adjustedLower = srcLower * scale;
      if ( ( scale == 0 ) || ( !Number.isFinite( scale ) ) || ( adjustedLower < dstLower ) || ( adjustedLower > dstUpper ) ) {
        // 3. It is impossible to fit [ srcLower, srcUpper ] into [ dstLower, dstUpper ] only by scale because all cases are tried and failed.
        scale = Number.NaN;
      }
    }

    return scale;
  }

}

