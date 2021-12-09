export { Bounds, ScaleTranslate };


/**
 * Describe the [ lower, upper ] bounds of a floating-point value
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

  constructor( lower, upper ) {
    this.lower = Math.min( lower, upper ); // Confirm ( lower <= upper ).
    this.upper = Math.max( lower, upper );
  }

  get difference() {
    let difference = this.upper - this.lower;
    return difference;
  }

  /**
   * Confirm:
   *   - Every element is not NaN. (If it is, become 0.)
   *   - Every element is between [ lower, upper ].
   *
   * @param {Float32Array} source
   *   The source Float32Array.
   *
   * @return {Float32Array}
   *   Return a copy of source. Every element (float32):
   *     - If ( Number.isNaN( element ) == true ), let it become 0.
   *     - Otherwise, Math.max( lower, Math.min( element, upper ) ).
   */
  Float32Array_RestrictedClone( sourceArray ) {
    let resultArray = new Float32Array( sourceArray.length );
    for ( let i = 0; i < sourceArray.length; ++i ) {
      let element = sourceArray[ i ];
      if ( !Number.isNaN( element ) ) {
        resultArray[ i ] = Math.max( this.lower, Math.min( element, this.upper ) );
      } // If NaN, let it become 0. (Just do nothing, because Float32Array is initialized to zero by default.)
    }
    return resultArray;
  }

  /**
   * @param {Bounds} aBounds
   *   Multiply this Bounds by aBounds.
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  set_multiply_Bounds( aBounds ) {
    this.lower *= aBounds.lower;
    this.upper *= aBounds.upper;
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
   *   Return this (modified) object.
   */
  set_multiply_LowerUpper( aLower, aUpper ) {
    this.lower *= aLower;
    this.upper *= aUpper;
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Add this Bounds by aBounds.
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  set_add_Bounds( aBounds ) {
    this.lower += aBounds.lower;
    this.upper += aBounds.upper;
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
   *   Return this (modified) object.
   */
  set_add_LowerUpper( aLower, aUpper ) {
    this.lower += aLower;
    this.upper += aUpper;
    return this;
  }

//!!! ...unfinished... (2021/12/09)
  /**
   * @param {Bounds} aBounds
   *   Multiply this Bounds by aBounds.
   *
   * @param {number} N
   *   Add this Bounds.upper by aUpper.
   *
   * @return {Bounds}
   *   Return this (modified) object.
   */
  static new_multiply_sum_Bounds( aBounds, bBounds, N ) {
    ( aBounds.lower * bBounds.lower ) * N;
    ( aBounds.upper * bBounds.upper ) * N;
    return this;
  }

}


/**
 * Describe a scale (i.e. multiplier) value, and then a translate (i.e. offset; bias) value after the scale.
 *
 */
class ScaleTranslate {

  constructor( scale, translate ) {
    this.scale = scale;
    this.translate = translate;
  }

  /**
   * Set this.scale and this.translate for mapping values from source bounds to target bounds.
   *
   * @param {Bounds} source
   *   The range of the source value.
   *
   * @param {Bounds} target
   *   The range of the target value.
   */
  setBy_FromTo( source, target ) {
    // Suppose x is a value inside the source range. y is the corresponding value inside the target range.
    //
    //   y = target.lower + ( target.difference * ( x - source.lower ) / source.difference )
    //     = target.lower + ( ( ( target.difference * x ) - ( target.difference * source.lower ) ) / source.difference )
    //     = target.lower + ( ( ( target.difference * x ) / source.difference ) - ( ( target.difference * source.lower ) / source.difference ) )
    //     = target.lower + ( ( ( target.difference / source.difference ) * x ) - ( ( target.difference * source.lower ) / source.difference ) )
    //     = target.lower + ( ( target.difference / source.difference ) * x ) - ( ( target.difference * source.lower ) / source.difference )
    //     = ( ( target.difference / source.difference ) * x ) + ( target.lower - ( ( target.difference * source.lower ) / source.difference ) )
    //     = ( scale * x ) + translate
    //
    // Got:
    //   scale = ( target.difference / source.difference )
    //   translate = ( target.lower - ( ( target.difference * source.lower ) / source.difference ) )
    //             = ( target.lower - ( ( target.difference / source.difference ) * source.lower ) )
    //             = ( target.lower - ( scale * source.lower ) )
    //
    // For example:
    //   - from [ 2, 12 ] to [ -3, -1 ]
    //   - scale  = 0.2
    //   - translate = -3.4
    //
    this.scale = ( target.difference / source.difference );
    this.translate = ( target.lower - ( this.scale * source.lower ) );
  }

  /**
   * @param {Bounds} source
   *   The range of the source value.
   *
   * @param {Bounds} target
   *   The range of the target value.
   *
   * @return {ScaleTranslate}
   *   Create and return { scale, translate } for mapping values from sourceMinMax to targetMinMax.
   */
  static createBy_FromTo( source, target ) {
    // (Please see ScaleTranslate.setBy_FromTo().)
    let scale = ( target.difference / source.difference );
    let translate = ( target.lower - ( scale * source.lower ) );
    let result = new ScaleTranslate( scale, translate );
    return result;
  }

}

