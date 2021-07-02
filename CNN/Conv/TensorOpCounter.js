export { Base };

/**
 * Count there are how many operations using this operation's output tensor.
 *
 * @member {any} tensorId
 *   This tensor's identifier.
 *
 * @member {object} operationObject
 *   The object which implements the operation. It should have the following method:
 *   - setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 )
 *   - pfnOperation( inputTensor0, inputTensor1 )
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
 * @member {number} nextOperationsCount
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

  /**
   * Call the this.operationObject.setKeepInputTensor() according to：
   *   - whether the operation is the last operation of the this.input0 / this.input1.
   *   - whether the this.input0 / this.input1 is in alwaysKeepSet.
   *
   * @param {Set<Base>} alwaysKeepSet
   *   A set object. Its every element is TensorOpCounter.Base object. They represent tensors never be disposed. The this.input0
   * and this.input1 will be compared with them.
   */
  operationObject_setKeepInputTensor_accordingTo_( alwaysKeepSet ) {
    
    if ( !this.operationObject )
      return; // Since there is no operation, there is no need to set up its keep-input flags.

    let bKeepInputTensor0, bKeepInputTensor1;

    if ( this.input0 ) {
    } else {
    }

//!!! ...unfinished... (2021/07/02)
  }

  get nextOperationsCount() {
    return this.nextOperationArray.length;
  }

}
