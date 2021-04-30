export { Base };

/**
 * Shared common base class for Embedding2d and PointDepthPoint.
 *
 */
class Base {

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
   * Return a copy of input (as output). Used for ( bKeepInputTensor == true ).
   *
   * @param {tf.tensor[]} inputTensorsArray
   *   An array of tensor data. The tensors of this inputTensorsArray will be kept (i.e. not disposed).
   *
   * @return {tf.tensor[]}
   *   Return a new array contains copy of all input tensors (could be null). Throw exception if failed (e.g. inputTensorsArray is null,
   * or out of GPU memory).
   */
  static keep_input_return_copy_array( inputTensorsArray ) {
    let outputTensorsArray = new Array( inputTensorsArray.length );
    for ( let i = 0; i < inputTensorsArray.length; ++i ) {
      let inputTensor = inputTensorsArray[ i ];
      if ( inputTensor )
        outputTensorsArray[ i ] = inputTensor.clone();
    }
    return outputTensorsArray;
  }

}
