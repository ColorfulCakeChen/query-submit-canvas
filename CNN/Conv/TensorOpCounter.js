export { Base };

/**
 * Count there are how many operations using this operation's output tensor.
 *
 * @member {any} tensorId
 *   This tensor's identifier.
 *
 * @member {object} operationObject
 *   The object which implements the operation. It should have a pfnOperation() method.
 *
 * @member {Base} input0
 *   The first TensorOpCounter which represents this operation's first input.
 *
 * @member {Base} input1
 *   The second TensorOpCounter which represents this operation's second input. It could be null, if this operation does not have
 * second input tensor.
 *
 * @member {Base[]} nextOperationArray
 *   The operations behind this operation.
 *
 * @member {number} nextOperationCount
 *   This operration's output tensor is used by how many operations which is behind this operation. This is the same as
 * this.nextOperationArray.length. If zero, the tensor is not used by other operation.
 *
 *
 *
 */
class Base {

  constructor( tensorId, operationObject, input0, input1 ) {
    this.tensorId = tensorId;
    this.operationObject = operationObject;
    this.input0 = input0;
    this.input1 = input1;
    this.nextOperationArray = [];

    if ( input0 )
      input0.nextOperationArray.push( this );

    if ( input1 )
      input1.nextOperationArray.push( this );
  }

  get nextOperationCount() {
    return this.nextOperationArray.length;
  }

}
