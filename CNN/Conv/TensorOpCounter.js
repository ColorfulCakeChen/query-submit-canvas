export { Base };

/**
 * Count how many operations use a tensor behind this counter.
 *
 * @member {number} tensorId
 *   This tensor's identifier.
 *
 * @member {Base} previousInputOpCounter
 *   The TensorOpCounter which is just before this TensorOpCounter.
 *
 * @member {number} behindOperationCount
 *   This tensor is used by how many operations which is behind this operation. If zero, the tensor is not used by other operation.
 *
 *
 *
 */
class Base {

  constructor( tensorId, previousTensorOpCounter ) {
    this.tensorId = tensorId;
    this.previousTensorOpCounter = previousTensorOpCounter;
    this.behindOperationCount = 0;
  }

}
