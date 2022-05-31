export { TensorPlaceholder };

//!!! ...unfinished... (2022/05/30) Perhaps, add height, width, channelCount info.

/**
 * A placeholder for tensor.
 *   - In Block.init(), it is used for tracking a tensor's final operation which should be responsible for destroy the tensor.
 *   - In Block.apply(), it is used for transferring tensor to the next operation.
 *
 *
 * @member {Block.Operation.Base} lastOperation
 *   The operation uses this tensor at last. The last operation should be responsible for destroying this tensor. If null, this tensor is
 * not used by any operation.
 *
 * @member {tf.tensor} realTensor
 *   The real tensor represented by this placeholder. It is filled dynamically in an operation's apply() method.
 *
 */
class TensorPlaceholder {

  constructor() {
    this.lastOperation = null;
    this.realTensor = null;
  }

}
