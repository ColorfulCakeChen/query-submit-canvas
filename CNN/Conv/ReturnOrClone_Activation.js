export { Base };

import * as ReturnOrClone from "./ReturnOrClone.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";

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

  /**
   * Extract tf.tensor from inputFloat32Array (at this.byteOffsetEnd). The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted

//!!! (2021/12/03 Remarked) tensorWeightCountTotal become get property.
//   *   - this.tensorWeightCountTotal

   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   * @param {number[]} tensorShape            The shape of the tensor to be extracted.
   *
   * @return {tf.tensor}                      The extracted tensor. Return null, if failed.
   */
  static extractTensor( inputFloat32Array, tensorShape ) {
    let tensorWeights = new Weights.Base( inputFloat32Array, this.byteOffsetEnd, tensorShape );
    if ( !tensorWeights.extract() )
      return null;  // e.g. input array does not have enough data.
    this.byteOffsetEnd = tensorWeights.defaultByteOffsetEnd;

    try {
      let t = tf.tensor( tensorWeights.weights, tensorShape );
      let elementCount = tf.util.sizeFromShape( t.shape );
      this.tensorWeightCountExtracted += elementCount;

//!!! (2021/12/03 Remarked) tensorWeightCountTotal become get property.
//      this.tensorWeightCountTotal += elementCount;

      return t;

    // If failed (e.g. memory not enough), return null.      
    } catch ( e ) {
      return null;
    }
  }

  /**
   * Extract biases from inputFloat32Array (at this.byteOffsetEnd). The following data members will be modified:
   *   - this.byteOffsetEnd
   *   - this.tensorWeightCountExtracted

//!!! (2021/12/03 Remarked) tensorWeightCountTotal become get property.
//   *   - this.tensorWeightCountTotal

   *
   * @param {Base} this                       The Base object to be modified.
   * @param {Float32Array} inputFloat32Array  A Float32Array whose values will be interpreted as weights.
   * @param {number} channelCount             The (input and output) channel count of the biases.
   *
   * @return {tf.tensor3d}                    The extracted biases. Return null, if failed.
   */
  static extractBiases( inputFloat32Array, channelCount ) {
    let biasesShape = [ 1, 1, channelCount ];
    return Base.extractTensor.call( this, inputFloat32Array, biasesShape );
  }

}
