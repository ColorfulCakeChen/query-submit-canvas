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
   * Return a copy of input (as output). Used for ( bKeepInputTensor == true  ).
   *
   * @param {tf.tensor} inputTensor
   *   A tensor data. This inputTensor will be kept (i.e. not disposed).
   *
   * @return {tf.tensor}
   *   The copy of input. Return null, if input is null. Throw exception, if failed (e.g. out of GPU memory).
   */
  static keep_input_return_copy( inputTensor ) {
    if ( inputTensor )
      return inputTensor.clone();
    return null;
  }

}
