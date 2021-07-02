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
    this.inputArray = [ input0, input1 ];
    this.nextOperationArray = [];

    // Record this operation is one of the input's operations.
    for ( let i = 0; i < this.inputArray.length; ++i ) {
      let inputTensorOpCounter = this.inputArray[ i ];
      if ( inputTensorOpCounter )
        inputTensorOpCounter.nextOperationArray.push( this );
    }

    this.bKeepInputTensorArray = new Array( this.inputArray.length );
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
  operationObject_setKeepInputTensor_accordingTo( alwaysKeepSet ) {
    
    if ( !this.operationObject )
      return; // Since there is no operation, there is no need to set up its keep-input flags.

    for ( let i = 0; i < this.inputArray.length; ++i ) {
      let input = this.inputArray[ i ];
      this.bKeepInputTensorArray[ i ] = undefined;

      if ( !input )
        continue; // Since the input does not exist, there is no keep/dispose for it.

      if ( ( alwaysKeepSet ) && ( alwaysKeepSet.has( input ) ) ) {
        this.bKeepInputTensorArray[ i ] = true;
        continue; // The input in alwaysKeepSet should always be kept.
      }

      if ( input.nextOperationArray.length <= 0 )
        continue; // Since the input does not processed by this operation, there is no keep/dispose for it. (shoud not happen)

//!!! ...unfinished... (2021/07/02)
      if ( input.nextOperationArray[ input.nextOperationArray.length - 1 ] == this.operationObject ) {
        this.bKeepInputTensorArray[ i ] = false; // Since this operation is the last operation of the tensor, this operation should dispose it.
      } else {
        this.bKeepInputTensorArray[ i ] = true; // 
      }

//!!! ...unfinished... (2021/07/02) What if duplicated input? (i.e. multiple same input in the this.inputArray[])

        this.bKeepInputTensorArray[ i ] = false; // Since the input does not exist, there is no need to keep it.
        } else {
        }

      } else {
        this.bKeepInputTensorArray[ i ] = false; // Since the input does not exist, there is no need to keep it.
      }
    }

//!!! ...unfinished... (2021/07/02)
    this.operationObject.setKeepInputTensor( this.bKeepInputTensorArray[ 0 ], this.bKeepInputTensorArray[ 1 ] );
  }

//!!! ...unfinished... (2021/07/02)
  /**
   *
   * @param {Base} anotherTensorOpCounter
   */
  isLastOperation( anotherTensorOpCounter ) {
  }

  get nextOperationsCount() {
    return this.nextOperationArray.length;
  }

}
