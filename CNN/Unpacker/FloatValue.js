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
   * @return {Bounds}
   *   Return newly created object which is a copy of this Bounds.
   */
  clone() {
    return new Bounds( this.lower, this.upper );
  }

  /**
   * @param {Bounds} aBounds
   *   Set this Bounds by aBounds.
   *
   * @return {Bounds}
   *   Return this (modified) object which copies aBounds.
   */
  set_Bounds( aBounds ) {
    this.lower = aBounds.lower;
    this.upper = aBounds.upper;
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
  set_LowerUpper( aLower, aUpper ) {
    this.lower = aLower;
    this.upper = aUpper;
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Add this Bounds by aBounds.
   *
   * @return {Bounds}
   *   Return this (modified) object which is added by aBounds.
   */
  add_Bounds( aBounds ) {
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
   *   Return this (modified) object which is added by Bounds [ aLower, aUpper ].
   */
  add_LowerUpper( aLower, aUpper ) {
    this.lower += aLower;
    this.upper += aUpper;
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   Multiply this Bounds by aBounds.
   *
   * @return {Bounds}
   *   Return this (modified) object which is multiplied by aBounds.
   */
  multiply_Bounds( aBounds ) {
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
   *   Return this (modified) object which is multiplied by Bounds [ aLower, aUpper ].
   */
  multiply_LowerUpper( aLower, aUpper ) {
    this.lower *= aLower;
    this.upper *= aUpper;
    return this;
  }

  /**
   * @param {number} N
   *   The multiplier of this.lower and this.upper.
   *
   * @return {Bounds}
   *   Return this (modified) object which is the same as this.multiply_LowerUpper( N, N ) or repeating N times this.add_Bounds( this ).
   */
  multiply_N( N ) {
    this.lower *= N;
    this.upper *= N;
    return this;
  }

  /**
   * @param {Bounds} aBounds
   *   The first multiplier (a Bounds).
   *
   * @param {number} N
   *   The second multiplier (a number).
   *
   * @return {Bounds}
   *   Return this (modified) object which is the sumed Bounds of repeating N times of multiplying this by aBounds.
   */
  multiply_Bounds_multiply_N( aBounds, N ) {
    this.lower = ( this.lower * aBounds.lower ) * N;
    this.upper = ( this.upper * aBounds.upper ) * N;
    return this;

    // The same as:
    //return this.multiply_Bounds( aBounds ).multiply_N( N );
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

}


/**
 * Describe a scale (i.e. multiplier) value, and then a translate (i.e. offset; bias) value after the scale. Note that the order
 * is important: scale first, translate second.
 *
 * @member {number} scale
 *   The scale (i.e. multiplier) value.
 *
 * @member {number} translate
 *   The translate (i.e. offset) value.
 */
class ScaleTranslate {

  constructor( scale = 1, translate = 0 ) {
    this.scale = scale;
    this.translate = translate;
  }

  /** (Re)set all scale-translate values. Default is ( scale = 1, translate = 0 ) (i.e. no scale and no translate). */
  set_scale_translate( scale = 1, translate = 0 ) {
    this.scale = scale;
    this.translate = translate;
  }

  /**
   * @param {ScaleTranslate} aScaleTranslate
   *   The scale-translate to be copied.
   */
  setBy_ScaleTranslate( aScaleTranslate ) {
    this.scale = aScaleTranslate.scale;
    this.translate = aScaleTranslate.translate;
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
  setBy_fromBounds_ToBounds( source, target ) {
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

//!!! (2021/12/12 Remarked) Use non-create mainly.
//   /**
//    * @param {Bounds} source
//    *   The range of the source value.
//    *
//    * @param {Bounds} target
//    *   The range of the target value.
//    *
//    * @return {ScaleTranslate}
//    *   Create and return a new ScaleTranslate for mapping values from source bounds to target bounds.
//    */
//   static createBy_FromTo( source, target ) {
//     // (Please see ScaleTranslate.setBy_FromTo().)
//     let scale = ( target.difference / source.difference );
//     let translate = ( target.lower - ( scale * source.lower ) );
//     let result = new ScaleTranslate( scale, translate );
//     return result;
//   }

  /**
   * Set this.scale and this.translate so that they could undo the specified previous scale-translate.
   *
   * @param {ScaleTranslate} aScaleTranslate
   *   The scale-translate to be undone.
   */
  setBy_undoScaleTranslate( aScaleTranslate ) {
    this.scale = ( 1 / aScaleTranslate.scale );  // Reciprocal will undo the scale.

    // Negative translate, and multiply by undo-scale because translate comes after scale.
    this.translate = ( - aScaleTranslate.translate ) * this.scale;
  }

//!!! (2021/12/12 Remarked) Use non-create mainly.
//   /**
//    * @return {ScaleTranslate}
//    *   Create and return a new ScaleTranslate for undoing the this scale-translate.
//    */
//   createBy_undoThis() {
//     let scale = ( 1 / this.scale );               // Reciprocal will undo the scale.
//     let translate = ( - this.translate ) * scale; // Negative translate, and multiply by undo-scale because translate comes after scale.
//     let result = new ScaleTranslate( scale, translate );
//     return result;
//   }

  /**
   * Scale and translate this object by specified scale-translate.
   *   - this.scale =     ( this.scale     * another.scale ) + another.translate
   *   - this.translate = ( this.translate * another.scale ) + another.translate
   *
   * @param {ScaleTranslate} another
   *   The another scale-translate which will be applied on this object.
   */
  scaleTranslateBy( another ) {
   this.scale =     ( this.scale     * another.scale ) + another.translate;
   this.translate = ( this.translate * another.scale ) + another.translate;
  }

}

