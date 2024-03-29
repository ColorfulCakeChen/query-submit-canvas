export { ReturnOrClone_Base as Base, ReturnOrClone_Root as Root };

import * as ValueDesc from "../Unpacker/ValueDesc.js";

/**
 * Provide return_input_directly() and keep_input_return_copy.
 *
 */
let ReturnOrClone_Base = ( ParentClass = Object ) => class ReturnOrClone_Base
  extends ParentClass {

  /**
   *
   */
  constructor( ...restArgs ) {
    super( ...restArgs );
  }

  /**
   * Return the input (as output) directly. Used for
   * ( bKeepInputTensor == false ).
   *
   * @param {tf.tensor} inputTensor
   *   A tensor data. It should be viewed as already disposed by this method.
   * However, in fact, it is returned as output directly.
   *
   * @return {tf.tensor} The same as input.
   */
  static return_input_directly( inputTensor ) {
    return inputTensor;
  }

  /**
   * Return the input (as output) directly. Used for
   * ( bKeepInputTensor == false ).
   *
   * @param {tf.tensor[]} inputTensorsArray
   *   An array of tensor data. They should be viewed as already disposed by
   * this method. However, in fact, they are put into outputTensorsArray
   * directly. It can not be null. But it can contain null element.
   *
   * @param {tf.tensor[]} outputTensorsArray
   *   An array used to put all the input tensors. It can not be null. But it
   * may contain null element.
   */
  static return_input_directly_array( inputTensorsArray, outputTensorsArray ) {
    outputTensorsArray.length = inputTensorsArray.length;
    for ( let i = 0; i < inputTensorsArray.length; ++i ) {
      outputTensorsArray[ i ] = inputTensorsArray[ i ];
    }
  }


  /**
   * Return a copy of input (as output). Used for ( bKeepInputTensor == true ).
   *
   * @param {tf.tensor} inputTensor
   *   A tensor data. This inputTensor will be kept (i.e. not disposed).
   *
   * @return {tf.tensor}
   *   Return the copy of input. Throw exception if failed (e.g. input is null,
   * or out of GPU memory).
   */
  static keep_input_return_copy( inputTensor ) {
    return inputTensor.clone();
  }

  /**
   * Return a copy of input (as output). Used for ( bKeepInputTensor == true ).
   * Throw exception if failed (e.g. inputTensorsArray is null, or out of GPU
   * memory).
   *
   * @param {tf.tensor[]} inputTensorsArray
   *   An array of tensor data. The tensors of this inputTensorsArray will be
   * kept (i.e. not disposed). It can not be null. But it can contain null
   * element.
   *
   * @param {tf.tensor[]} outputTensorsArray
   *   An array used to put the copy of all input tensors. It can not be null.
   * But it may contain null element.
   */
  static keep_input_return_copy_array(
    inputTensorsArray, outputTensorsArray ) {

    outputTensorsArray.length = inputTensorsArray.length;
    for ( let i = 0; i < inputTensorsArray.length; ++i ) {
      let inputTensor = inputTensorsArray[ i ];
      if ( inputTensor )
        outputTensorsArray[ i ] = inputTensor.clone();
      else
        outputTensorsArray[ i ] = null;
    }
  }


  /**
   * Convert activation function id to information object.
   *
   * @param {number} nActivationId
   *   It should be one of ValueDesc.ActivationFunction.Singleton.Ids.Xxx.
   * (e.g. ValueDesc.ActivationFunction.Singleton.Ids.NONE,
   * ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
   * ValueDesc.ActivationFunction.Singleton.Ids.COS, ...)
   *
   * @return {ValueDesc.ActivationFunction.Info}
   *   It should be one of
   * ValueDesc.ActivationFunction.Singleton.integerToInfoMap according to the
   * nActivationId.
   */
  static ActivationFunction_getInfo_byId( nActivationId ) {
    let info = ValueDesc.ActivationFunction.Singleton.getInfo_byId(
      nActivationId );
    return info;
  }

  /**
   * Convert activation function id to function object.
   *
   * @param {number} nActivationId
   *   It should be one of ValueDesc.ActivationFunction.Singleton.Ids.Xxx.
   * (e.g. ValueDesc.ActivationFunction.Singleton.Ids.NONE,
   * ValueDesc.ActivationFunction.Singleton.Ids.RELU6,
   * ValueDesc.ActivationFunction.Singleton.Ids.COS, ...)
   *
   * @return {function}
   *   It should be pfn of
   * ValueDesc.ActivationFunction.Singleton.integerToInfoMap according to the
   * nActivationId. (e.g. null, tf.relu6, tf.cos, ...)
   */
  static ActivationFunction_get_byId( nActivationId ) {
    let info = ReturnOrClone_Base.ActivationFunction_getInfo_byId(
      nActivationId );
    let pfn = info?.pfn;
    return pfn;
  }

}


/**
 * Almost the same as ReturnOrClone.Base class except its parent class is fixed
 * to Object. In other words, caller can not specify the parent class of
 * ReturnOrClone.Root (so it is named "Root" which can not have parent class).
 */
class ReturnOrClone_Root extends ReturnOrClone_Base() {
}
