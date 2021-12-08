export { Bounds, ScaleTranslate };


/**
 * Describe the [ lower, upper ] bounds of a floating-point value
 *
 * @member {number} lower
 *   The lower bound of the range.
 *
 * @member {number} upper
 *   The upper bound of the range.
 */
class Bounds {

  constructor( lower, upper ) {
    this.lower = Math.min( lower, upper ); // Confirm ( lower <= upper ).
    this.upper = Math.max( lower, upper );
    this.difference = this.upper - this.lower;
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

