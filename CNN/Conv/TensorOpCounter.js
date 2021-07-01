export { Base, Bases };

/**
 * Count how many operations use a tensor behind this counter.
 *
 * @member {number} tensorId
 *   This tensor's identifier.
 *
 * @member {Base} input0
 *   The first TensorOpCounter which is just before this TensorOpCounter.
 *
 * @member {Base} input1
 *   The second TensorOpCounter which is just before this TensorOpCounter.
 *
 * @member {number} behindOperationCount
 *   This tensor is used by how many operations which is behind this operation. If zero, the tensor is not used by other operation.
 *
 *
 *
 */
class Base {

  constructor( tensorId, input0, input1 ) {
    this.tensorId = tensorId;
    this.input0 = input0;
    this.input1 = input1;
    this.behindOperationCount = 0;
  }

}
