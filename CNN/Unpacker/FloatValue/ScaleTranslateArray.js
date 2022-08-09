export { ScaleTranslateArray };

/**
 * Describe an array of scale (i.e. multiplier) values, and then an array of translate (i.e. offset; bias) values after the scale. Note
 * that the order is important: scale first, translate second.
 *
 * @member {number[]} scales
 *   The scale (i.e. multiplier) values.
 *
 * @member {number[]} translates
 *   The translate (i.e. offset) values.
 */
class ScaleTranslateArray {

  constructor( length ) {
    this.scales = new Array( length );
    this.translates = new Array( length );
  }

  clone() {
    let result = new ScaleTranslateArray( this.scales.length );
    result.set_all_byScaleTranslateArray( this );
    return result;
  }

  /** (Re)set all scale-translate values. Default are ( scale = 1, translate = 0 ) (i.e. no scale and no translate).
   *
   * @return {ScaleTranslateArray}
   *   Return this (modified) object whose values are (re)set as specified values.
   */
  set_all_by_scale_translate( scale = 1, translate = 0 ) {
    scale = Math.fround( scale );
    translate = Math.fround( translate );
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] = scale;
      this.translates[ i ] = translate;
    }
    return this;
  }

  /**
   * @param {ScaleTranslateArray} aScaleTranslateArray
   *   The scale-translate array to be copied.
   *
   * @return {ScaleTranslateArray}
   *   Return this (modified) object whose values are copied from aScaleTranslateArray.
   */
  set_all_byScaleTranslateArray( aScaleTranslateArray ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] = aScaleTranslateArray.scales[ i ];
      this.translates[ i ] = aScaleTranslateArray.translates[ i ];
    }
    return this;
  }

  /**
   * @param {ScaleTranslateArray} aScaleTranslateArray
   *   The scale-translate array to be undone.
   *
   * @return {ScaleTranslateArray}
   *   Return this (modified) object whose values could undo aScaleTranslateArray.
   */
  set_all_byUndo_ScaleTranslateArray( aScaleTranslateArray ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] = Math.fround( 1 / aScaleTranslateArray.scales[ i ] );  // Reciprocal will undo the scale. (Note: Not work for zero.)

      // Negative translate, and multiply by undo-scale because translate comes after scale.
      this.translates[ i ] = Math.fround( ( - aScaleTranslateArray.translates[ i ] ) * this.scales[ i ] );
    }
    return this;
  }

  /**
   * @param {BoundsArray} source
   *   The range of the source values.
   *
   * @param {BoundsArray} target
   *   The range of the target values.
   *
   * @return {ScaleTranslateArray}
   *   Return this (modified) object whose values are scale and translate for mapping values from source bounds to target bounds.
   */
  set_all_by_fromBoundsArray_ToBoundsArray( source, target ) {

    // Given:
    //   source.difference = source.upper - source.lower;
    //   target.difference = target.upper - target.lower;
    //
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
    for ( let i = 0; i < this.scales.length; ++i ) {
      // scale = ( target_difference / source_difference );
      this.scales[ i ] = Math.fround( ( target.uppers[ i ] - target.lowers[ i ] ) / ( source.uppers[ i ] - source.lowers[ i ] ) );
      this.translates[ i ] = Math.fround( target.lowers[ i ] - Math.fround( this.scales[ i ] * source.lowers[ i ] ) );
    }
    return this;
  }

  /**
   * Scale and translate all this object by specified scale-translate list.
   *   - this.scales[ i ] =     ( this.scales[ i ]     * aScaleTranslateArray.scales[ i ] ) + aScaleTranslateArray.translates[ i ]
   *   - this.translates[ i ] = ( this.translates[ i ] * aScaleTranslateArray.scales[ i ] ) + aScaleTranslateArray.translates[ i ]
   *
   * @param {ScaleTranslateArray} aScaleTranslateArray
   *   The another scale-translate array which will be applied on this object.
   *
   * @return {ScaleTranslateArray}
   *   Return this (modified) object whose values scaled and translated by the specified scale-translate.
   */
  scaleTranslate_all_byScaleTranslateArray( aScaleTranslateArray ) {
    for ( let i = 0; i < this.scales.length; ++i ) {
      this.scales[ i ] =     Math.fround( Math.fround( this.scales[ i ]     * aScaleTranslateArray.scales[ i ] ) + aScaleTranslateArray.translates[ i ] );
      this.translates[ i ] = Math.fround( Math.fround( this.translates[ i ] * aScaleTranslateArray.scales[ i ] ) + aScaleTranslateArray.translates[ i ] );
    }
    return this;
  }

}

