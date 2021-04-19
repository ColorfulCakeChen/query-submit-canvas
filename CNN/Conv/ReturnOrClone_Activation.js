export { Base };

import * as ReturnOrClone from "./ReturnOrClone.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";


/**
 * Shared common base class for Pointwise and Depthwise.
 *
 */
class Base extends ReturnOrClone.Base {

  /**
   * Convert activation function id to function object.
   *
   * @param {number} nActivationId
   *   It should be one of ValueDesc.ActivationFunction.Singleton.Ids.Xxx. (e.g. ValueDesc.ActivationFunction.Singleton.Ids.NONE,
   * ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.COS, ...)
   *
   * @return {function}
   *   It should be one of ValueDesc.ActivationFunction.Singleton.integerToObjectMap according to the nActivationId. (e.g. null,
   * tf.relu6, tf.cos, ...)
   */
  static getActivationFunctionById( nActivationId ) {
    let pfn = ValueDesc.ActivationFunction.Singleton.integerToObjectMap.get( nActivationId );
    return pfn;
  }

}
