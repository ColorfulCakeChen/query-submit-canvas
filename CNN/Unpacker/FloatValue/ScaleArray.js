export { ScaleArray };

/**
 * Describe an array of scale (i.e. multiplier) values.
 *
 * @member {number[]} scales
 *   The scale (i.e. multiplier) values.
 */
class ScaleArray {

  constructor( length ) {
    this.scales = new Array( length );
  }

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

  
//!!! ...unfinished... (2022/01/07)
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

//!!! (2022/01/06 Remarked)
//     if ( ( srcLower == 0 ) || ( dstLower == 0 ) ) {
//       scale = 0; // Avoid -Infinity, +Infinity, NaN.
//     } else {
//       scale = dstLower / srcLower;
//     }

    // 1.2 Verification.
    //   - If scale is zero or -Infinity or +Infinity or NaN, it is always failed.
    //   - If scaled source upper bound is out of destination range, it is also failed.
    let adjustedUpper = srcUpper * scale;
    if ( ( scale == 0 ) || ( !Number.isFinite( scale ) ) || ( adjustedUpper < dstLower ) || ( adjustedUpper > dstUpper ) ) {

      // 2. Try upperer bound, since it is failed to fit [ srcLower, srcUpper ] into [ dstLower, dstUpper ] by scale according to lower bound.
      scale = dstUpper / srcUpper;

//!!! (2022/01/06 Remarked)
//       if ( ( srcUpper == 0 ) || ( dstUpper == 0 ) ) {
//         scale = 0; // Avoid -Infinity, +Infinity, NaN.
//       } else {
//         scale = dstUpper / srcUpper;
//       }

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

