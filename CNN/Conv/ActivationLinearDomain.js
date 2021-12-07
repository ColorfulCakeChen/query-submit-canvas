export { MinMax, ScaleTranslate, Base };

import * as ValueDesc from "../Unpacker/ValueDesc.js";


/**
 *
 * @member {number} min
 *   The lower bound of the range.
 *
 * @member {number} max
 *   The upper bound of the range.
 */
class MinMax {

  constructor( min, max ) {
    this.min = Math.min( min, max ); // Confirm ( min <= max ).
    this.max = Math.max( min, max );
    this.difference = this.max - this.min;
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
   * Set this.scale and this.translate for mapping values from sourceMinMax to targetMinMax.
   *
   * @param {MinMax} source
   *   The range of the source value.
   *
   * @param {MinMax} target
   *   The range of the target value.
   */
  setBy_FromTo( source, target ) {

//!!! ...unfinished... (2021/12/07)
    // Suppose x is a value inside the source range. y is the corresponding value inside the target range.
    //
    // y = target.min + ( target.difference * ( x - source.min ) / source.difference )
    //

    let scale = this.distanceLowerUpper / distanceMinMax;

    let translate = this.lowerBound - min;

//!!! ...unfinished... (2021/12/07) translate then scale? scale then translate?

  }

}


/**
 * Describe the input value lower and upper bounds of an activation function for keeping the output almost linear.
 *
 *
 *
 *
 * @member {number} nActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx).
 *
 * @member {MinMax} linearDomain
 *   The domain (i.e. input value of the activation function) could keep the output almost linear.
 */
class Base {

  /**
   * @member {number} lowerBound
   *   The lower bound of domain (i.e. input value of the activation function) for keeping the output almost linear.
   *
   * @member {number} upperBound
   *   The upper bound of domain (i.e. input value of the activation function) for keeping the output almost linear.
   */
  constructor( nActivationId, lowerBound, upperBound ) {
    this.nActivationId = nActivationId;
    this.linearDomain = new MinMax( lowerBound, upperBound );
  }

}


/**
 * Predefined linear domain for every activation function.
 *
 *
 * For example,
 *   - RELU6 is linear between[ 0, 6 ].
 *   - SIGMOID is alomost linear between[ -0.125, +0.125 ].
 *   - TANH is almost linear between[ -0.125, +0.125 ].
 *   - COS is almost linear between[ -( ( PI / 2 ) + 0.025 ), -( ( PI / 2 ) - 0.025 ) ].
 *   - SIN is almost linear between[ -0.025, +0.025 ].
 *   - RELU is linear between[ 0, 6 ].
 *
 */
Base.PredefinedById = new Map( [
  [ ValueDesc.ActivationFunction.Singleton.Ids.RELU6,   new Base(                            0,                            6 ) ],
  [ ValueDesc.ActivationFunction.Singleton.Ids.SIGMOID, new Base(                       -0.125,                       +0.125 ) ],
  [ ValueDesc.ActivationFunction.Singleton.Ids.TANH,    new Base(                       -0.125,                       +0.125 ) ],
  [ ValueDesc.ActivationFunction.Singleton.Ids.COS,     new Base( -( ( Math.PI / 2 ) + 0.025 ), -( ( Math.PI / 2 ) - 0.025 ) ) ],
  [ ValueDesc.ActivationFunction.Singleton.Ids.SIN,     new Base(                       -0.025,                       +0.025 ) ],
  [ ValueDesc.ActivationFunction.Singleton.Ids.RELU,    new Base(                            0,                            6 ) ],
] );
