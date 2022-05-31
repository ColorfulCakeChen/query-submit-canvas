export { Operation };

import { TensorPlaceholderSet } from "./Block_TensorPlaceholderSet.js";

/**
 *
 */
let Operation = ( Base = Object ) => class extends Base {

//!!! ...unfinished... (2022/05/31)
  /**
   *
   * @param {number} outputTensorCount
   *   If 1, only the this.output0 will be created. If 2, the this.output0 and this.output1 will be created.
   */
  TensorPlaceholderSet_set( input0, input1, outputTensorCount = 1 ) {
    this.tensorPlaceholderSet = new TensorPlaceholderSet( input0, input1, outputTensorCount );
  }

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

//!!! ...unfinished... (2022/05/31)
  /**
   *
   */
  apply() {
  }

}
