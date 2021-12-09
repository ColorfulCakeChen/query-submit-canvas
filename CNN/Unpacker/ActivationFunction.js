export { Info };

// import * as ValueDesc from "../ValueDesc.js";
// import * as FloatValue from "../FloatValue.js";
// import * as Weights from "../Weights.js";


/**
 *
 * @member {number} nActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx).
 *
 * @member {Function} pfn
 *   The activation function. (e.g. tf.relu6, tf.sigmoid, tf.tanh, tf.cos, tf.sin, tf.relu)
 *
 * @member {FloatValue.Bounds} inputDomainLinear
 *   The input value lower and upper bounds of the activation function for keeping the mapping from input to output almost linear. In
 * general speaking, an activation function is non-linear in the whole domain. However, inside this special part of the domain, it looks
 * almost like a linear function.
 *
 * @member {FloatValue.Bounds} outputRange
 *   The the activation function output value's bounds.
 */
class Info {

  /**
   */
  constructor( nActivationId, pfn, inputDomainLinear, outputRange ) {
    this.nActivationId = nActivationId;
    this.pfn = pfn;
    this.inputDomainLinear = inputDomainLinear;
    this.outputRange = outputRange;
  }

}

//!!! (2021/12/09 Remarked)
// /**
//  * Predefined linear domain for every activation function.
//  *
//  *
//  * For example,
//  *   - RELU6 is linear between[ 0, 6 ].
//  *   - SIGMOID is alomost linear between[ -0.125, +0.125 ].
//  *   - TANH is almost linear between[ -0.125, +0.125 ].
//  *   - COS is almost linear between[ -( ( PI / 2 ) + 0.025 ), -( ( PI / 2 ) - 0.025 ) ].
//  *   - SIN is almost linear between[ -0.025, +0.025 ].
//  *   - RELU is linear between[ 0, 6 ].
//  *
//  */
// Base.PredefinedById = new Map( [
//   [ ValueDesc.ActivationFunction.Singleton.Ids.RELU6,   new FloatValue.Bounds(                            0,                            6 ) ],
//   [ ValueDesc.ActivationFunction.Singleton.Ids.SIGMOID, new FloatValue.Bounds(                       -0.125,                       +0.125 ) ],
//   [ ValueDesc.ActivationFunction.Singleton.Ids.TANH,    new FloatValue.Bounds(                       -0.125,                       +0.125 ) ],
//   [ ValueDesc.ActivationFunction.Singleton.Ids.COS,     new FloatValue.Bounds( -( ( Math.PI / 2 ) + 0.025 ), -( ( Math.PI / 2 ) - 0.025 ) ) ],
//   [ ValueDesc.ActivationFunction.Singleton.Ids.SIN,     new FloatValue.Bounds(                       -0.025,                       +0.025 ) ],
//   [ ValueDesc.ActivationFunction.Singleton.Ids.RELU,    new Base(                            0,                            6 ) ],
// ] );
