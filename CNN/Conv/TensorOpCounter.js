export { Base };

/**
 * Count how many operations use a tensor behind this counter.
 *
 * @member {any} tensorId
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
 * @member {Base[]} nextOperationArray
 *   The operations behind this operation.
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
    this.nextOperationArray = [];

    if ( input0 )
      input0.nextOperationArray.push( this );

    if ( input1 )
      input1.nextOperationArray.push( this );
  }

}
