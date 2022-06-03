export { Base };

/**
 * A placeholder for tensor.
 *
 *   - In Operation.TwinArray.operation_append_Xxx(), it is used for tracking a tensor's final operation which should be responsible
 *       for destroying the tensor.
 *
 *   - In operation's .apply(), it is used for transferring tensor to the next sub operation.
 *
 *
 * @member {Operation.Base} finalOperation
 *   The operation uses this tensor at final. It should be responsible for destroying this tensor. If null, this tensor is
 * not used by any operation.
 *
 * @member {Operation.Base} finalOperationOld
 *   The previous finalOperation. When new finalOperation is set, the finalOperationOld.setKeepInputTensor_IfNotLastOperation_Or_In()
 * usually should be called to adjust tensor destroying behavior (since it is no longer the final operation of the tensor).
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
    this.finalOperation = null;
    this.finalOperationOld = null;
    this.realTensor = null;
  }

  /**
   *
   * @param {ActivationEscaping.ScaleBoundsArray} scaleBoundsArray  The tensor placeholder's ScaleBoundsArray.
   */
  set_height_width_channelCount_scaleBoundsArray(
    height, width, channelCount, channelCount_lowerHalf, channelCount_higherHalf, scaleBoundsArray ) {
    this.height = height;
    this.width = width;
    this.channelCount = channelCount;
    this.channelCount_lowerHalf = channelCount_lowerHalf;
    this.channelCount_higherHalf = channelCount_higherHalf;
    this.scaleBoundsArray = scaleBoundsArray;
  }

  /**
   *
   * @param {TensorPlaceholder} aTensorPlaceholder
   *   The tensor placeholder's height, width, channelCount, scaleBoundsArray will be used directly (i.e. not cloned) by this
   * tensor placeholder. Note: The .finalOperation, finalOperationOld and .realTensor are not used.
   */
  set_height_width_channelCount_scaleBoundsArray_byTensorPlaceholder( aTensorPlaceholder ) {
    this.set_height_width_channelCount_scaleBoundsArray(
      aTensorPlaceholder.height, aTensorPlaceholder.width,
      aTensorPlaceholder.channelCount, aTensorPlaceholder.channelCount_lowerHalf, aTensorPlaceholder.channelCount_higherHalf,
      aTensorPlaceholder.scaleBoundsArray );
  }

}
