export {};

import * as ValueDesc from "../Unpacker/ValueDesc.js";

/**
 * Describe the input value lower and upper bounds of an activation function for keeping the output almost linear.
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
    this.lowerBound = lowerBound;
    this.upperBound = upperBound;
  }

}
