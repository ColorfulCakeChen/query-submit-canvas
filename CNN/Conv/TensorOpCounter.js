export { Base };

/**
 * Count how many operations use a tensor behind this counter.
 *
 * @member {number} tensorId
 *   This tensor's identifier.
 *
 * @member {Base} previousInputOpCounter0
 *   The first TensorOpCounter which is just before this TensorOpCounter.
 *
 * @member {Base} previousInputOpCounter1
 *   The second TensorOpCounter which is just before this TensorOpCounter.
 *
 * @member {number} behindOperationCount
 *   This tensor is used by how many operations which is behind this operation. If zero, the tensor is not used by other operation.
 *
 *
 *
 */
class Base {

  constructor( tensorId, previousTensorOpCounter0, previousTensorOpCounter1 ) {
    this.tensorId = tensorId;
    this.previousTensorOpCounter0 = previousTensorOpCounter0;
    this.previousTensorOpCounter1 = previousTensorOpCounter1;
    this.behindOperationCount = 0;
  }

}
