export { Operation };

/**
 *
 */
let Operation = ( Base = Object ) => class extends Base {

  /**
   * Adjust this.apply so that this.apply() will or will not dispose its inputTensors.
   * Sub-class should override this method.
   *
   * @param {boolean} bKeepInputTensor0
   *   Whether the 1st input tensor should be destroyed by this operation.
   *
   * @param {boolean} bKeepInputTensor1
   *   Whether the 2nd input tensor should be destroyed by this operation. It could be null (or undefined) if this operation have only
   * input tensor (i.e. does not have 2nd input tensor).
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
  }

}
