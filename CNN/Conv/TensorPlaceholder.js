export { Base };

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
class Base {

  /**
   *
   */
  constructor() {
    this.lastOperation = null;
    this.realTensor = null;
  }

  /**
   *
   * @param {TensorPlaceholder} aTensorPlaceholder
   *   The tensor placeholder's height, width, channelCount, scaleBoundsArray will be used directly (i.e. not cloned) by this
   * tensor placeholder. Note: The .lastOperation and .realTensor are not used.
   */
  set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( aTensorPlaceholder ) {
    this.height = aTensorPlaceholder.height;
    this.width = aTensorPlaceholder.width;
    this.channelCount = aTensorPlaceholder.channelCount;
    this.channelCount_lowerHalf = aTensorPlaceholder.channelCount_lowerHalf;
    this.channelCount_higherHalf = aTensorPlaceholder.channelCount_higherHalf;
    this.scaleBoundsArray = aTensorPlaceholder.scaleBoundsArray; // ActivationEscaping.ScaleBoundsArray
  }

}
