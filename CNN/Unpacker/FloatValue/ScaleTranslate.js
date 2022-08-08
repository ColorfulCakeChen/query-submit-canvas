export { ScaleTranslate };

/**
 * Describe a scale (i.e. multiplier) 32-bits floating-point value, and then a translate
 * (i.e. offset; bias) 32-bits floating-point value after the scale. Note that the order
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

  clone() {
    return new ScaleTranslate( this.scale, this.translate );
  }

  /** (Re)set all scale-translate values. Default is ( scale = 1, translate = 0 ) (i.e. no scale and no translate). */
  set_by_scale_translate( scale = 1, translate = 0 ) {
    this.scale = Math.fround( scale );
    this.translate = Math.fround( translate );
  }

  /**
   * @param {ScaleTranslate} another
   *   The scale-translate to be copied.
   */
  set_byScaleTranslate( another ) {
    this.scale = another.scale;
    this.translate = another.translate;
  }


  /**
   * Set this.scale and this.translate so that they could undo the specified previous scale-translate.
   *
   * @param {ScaleTranslate} aScaleTranslate
   *   The scale-translate to be undone.
   */
  set_byUndo_ScaleTranslate( aScaleTranslate ) {
    this.scale = Math.fround( 1 / aScaleTranslate.scale );  // Reciprocal will undo the scale. (Note: Not work for zero.)

    // Negative translate, and multiply by undo-scale because translate comes after scale.
    this.translate = Math.fround( ( - aScaleTranslate.translate ) * this.scale );
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
  set_by_fromBounds_ToBounds( source, target ) {
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
    this.scale = Math.fround( target.difference / source.difference );
    this.translate = Math.fround( target.lower - ( this.scale * source.lower ) );
  }

  /**
   * Scale and translate this object by specified scale-translate.
   *   - this.scale =     ( this.scale     * another.scale ) + another.translate
   *   - this.translate = ( this.translate * another.scale ) + another.translate
   *
   * @param {ScaleTranslate} aScaleTranslate
   *   The another scale-translate which will be applied on this object.
   */
  scaleTranslate_byScaleTranslate( aScaleTranslate ) {
   this.scale =     Math.fround( Math.fround( this.scale     * aScaleTranslate.scale ) + aScaleTranslate.translate );
   this.translate = Math.fround( Math.fround( this.translate * aScaleTranslate.scale ) + aScaleTranslate.translate );
  }

}

