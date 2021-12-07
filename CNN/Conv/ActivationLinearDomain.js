export {};

import * as ValueDesc from "../Unpacker/ValueDesc.js";

/**
 * Describe the input value lower and upper bounds of an activation function for keeping the output almost linear.
 *
 *
 *
 *
 * @member {number} nActivationId
 *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx).
 *
 * @member {number} lowerBound
 *   The lower bound of domain (i.e. input value of the activation function) for keeping the output almost linear.
 *
 * @member {number} upperBound
 *   The upper bound of domain (i.e. input value of the activation function) for keeping the output almost linear.
 *
 *
 */
class Base {
  
  constructor( nActivationId, lowerBound, upperBound ) {
    this.nActivationId = nActivationId;
    this.lowerBound = Math.min( lowerBound, upperBound ); // Confirm ( lowerBound <= upperBound ).
    this.upperBound = Math.max( lowerBound, upperBound );
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
