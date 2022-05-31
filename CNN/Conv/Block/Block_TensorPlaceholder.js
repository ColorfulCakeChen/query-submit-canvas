export { TensorPlaceholder };

//!!! ...unfinished... (2022/05/30) Perhaps, add height, width, channelCount info.

/**
 * A placeholder for tensor.
 *   - In Block.init(), it is used for tracking a tensor's final operation which should be responsible for destroy the tensor.
 *   - In Block.apply(), it is used for transferring tensor to the next operation.
 *
 *
 * @member {Block.TensorPlaceholderSet} finalUser
 *   The final user of this tensor. If null, this tensor is not used by other operation.
 *
 * @member {tf.tensor} realTensor
 *   The real tensor represented by this placeholder. It is filled dynamically in operation's apply() method.
 *
 */
class TensorPlaceholder {

  constructor() {
    this.finalUser = null;
    this.realTensor = null;
  }

//!!! ...unfinished... (2022/05/31)

  /**
   * Call the this.operationObject.setKeepInputTensor() according to：
   *   - whether the operation is the last operation of the this.input0 / this.input1.
   *   - whether the this.input0 / this.input1 is in alwaysKeepSet.
   *
   * @param {Set<Base>} alwaysKeepSet
   *   A set object. Its every element is TensorOpCounter.Base object. They represent tensors never be disposed. The this.input0
   * and this.input1 will be compared with them.
   */
  setKeepInputTensor_IfNotLastOperation_Or_In( alwaysKeepSet ) {
  
    if ( !this.operationObject )
      return; // Since there is no operation, there is no need to set up its keep-input flags.

    // Every input which needs to be disposed by this operation will have an entry in this Map.
    //
    // The key is the input TensorOpCounter.Base object.
    // The value is its array index in this.inputArray[] (also in this.bKeepInputTensorArray[]).
    let input_dispose_Map = new Map;

    for ( let i = 0; i < this.inputArray.length; ++i ) {
      let input = this.inputArray[ i ];

      if ( !input )
        continue; // Since the input does not exist, there is no need to dispose it.

      if ( ( alwaysKeepSet ) && ( alwaysKeepSet.has( input ) ) )
        continue; // The input in alwaysKeepSet should always be kept (always not to be disposed).

      if ( input.nextOperationArray.length <= 0 )
        continue; // Since the input does not processed by this operation, there is no need to dispose it. (shoud not happen)

      // If this operation is the last operation of the input tensor, this operation is responsible for disposing it.
      //
      // Note: If an input appears multiple times in this.inputArray[] (i.e. multiple inputs of this operation are the same one input),
      // the map will only record the last one. So that the input will only be disposed once (rather than multiple times).
      if ( input.nextOperationArray[ input.nextOperationArray.length - 1 ] == this )
        input_dispose_Map.set( input, i );

      // Otherwise, This operation uses the input tensor. There are, however, other operations still need use the same input tensor.
      // So the input tensor should not be disposed (i.e. should be kept) by this operation.
    }

    // Find out and mark all the input tensors should be disposed (i.e. will not be kept) by this operation.
    this.bKeepInputTensorArray.fill( true ); // Default is keep every input.
    for ( let [ input, arrayIndex ] of input_dispose_Map ) {
      this.bKeepInputTensorArray[ arrayIndex ] = false;
    }

    // Configure the operation to keep or dispose its inputs.
    this.operationObject.setKeepInputTensor( this.bKeepInputTensorArray[ 0 ], this.bKeepInputTensorArray[ 1 ] );
  }

}
