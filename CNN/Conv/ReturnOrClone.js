export { Base };

/**
 * Provide return_input_directly() and keep_input_return_copy.
 *
 */
let Base = ( ParentClass = Object ) => class extends ParentClass {

  /**
   * Return the input (as output) directly. Used for ( bKeepInputTensor == false ).
   *
   * @param {tf.tensor} inputTensor
   *   A tensor data. It should be viewed as already disposed by this method. However, in fact, it is returned as output
   * directly.
   *
   * @return {tf.tensor} The same as input.
   */
  static return_input_directly( inputTensor ) {
    return inputTensor;
  }

  /**
   * Return the input (as output) directly. Used for ( bKeepInputTensor == false ).
   *
   * @param {tf.tensor[]} inputTensorsArray
   *   An array of tensor data. They should be viewed as already disposed by this method. However, in fact, they are put into
   * outputTensorsArray directly. It can not be null. But it can contain null element.
   *
   * @param {tf.tensor[]} outputTensorsArray
   *   An array used to put all the input tensors. It can not be null. But it may contain null element.
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
   *   Return the copy of input. Throw exception if failed (e.g. input is null, or out of GPU memory).
   */
  static keep_input_return_copy( inputTensor ) {
    return inputTensor.clone();
  }

  /**
   * Return a copy of input (as output). Used for ( bKeepInputTensor == true ). Throw exception if failed (e.g. inputTensorsArray is null,
   * or out of GPU memory).
   *
   * @param {tf.tensor[]} inputTensorsArray
   *   An array of tensor data. The tensors of this inputTensorsArray will be kept (i.e. not disposed). It can not be null. But it can
   * contain null element.
   *
   * @param {tf.tensor[]} outputTensorsArray
   *   An array used to put the copy of all input tensors. It can not be null. But it may contain null element.
   */
  static keep_input_return_copy_array( inputTensorsArray, outputTensorsArray ) {
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
   *   It should be one of ValueDesc.ActivationFunction.Singleton.Ids.Xxx. (e.g. ValueDesc.ActivationFunction.Singleton.Ids.NONE,
   * ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.COS, ...)
   *
   * @return {ValueDesc.ActivationFunction.Info}
   *   It should be one of ValueDesc.ActivationFunction.Singleton.integerToObjectMap according to the nActivationId.
   */
  static ActivationFunction_getInfoById( nActivationId ) {
    let info = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );
    return info;
  }

  /**
   * Convert activation function id to function object.
   *
   * @param {number} nActivationId
   *   It should be one of ValueDesc.ActivationFunction.Singleton.Ids.Xxx. (e.g. ValueDesc.ActivationFunction.Singleton.Ids.NONE,
   * ValueDesc.ActivationFunction.Singleton.Ids.RELU6, ValueDesc.ActivationFunction.Singleton.Ids.COS, ...)
   *
   * @return {function}
   *   It should be pfn of ValueDesc.ActivationFunction.Singleton.integerToObjectMap according to the nActivationId. (e.g. null,
   * tf.relu6, tf.cos, ...)
   */
  static ActivationFunction_getById( nActivationId ) {
    let info = Base.ActivationFunction_getInfoById( nActivationId );
    let pfn = info.pfn;
    return pfn;
  }

}
