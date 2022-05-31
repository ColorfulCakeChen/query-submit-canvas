export { Base };

import * as TensorPlaceholder from "./TensorPlaceholder.js";



//!!! ...unfinished... (2022/05/30) Used by Operation.apply()
// class OperationApplyArgs {
//
// //   constructor() {
// //     this.blockInput0 =
// //     this.blockInput1 =
// //
// //     this.operationInput0 =
// //     this.operationInput1 =
// //     this.operationOutput0 =
// //     this.operationOutput1 =;
//   }
//
// }
//



/**
 * An object operates several TensorPlaceholder.Base.
 *
 * In Block.init(), it is used for tracking the current tensor placeholders. It could simply the decision of what tensor placeholders
 * should be used as the next operation's input.
 *
 * In operation (e.g. Pointwise.Base), it is used for tracking the tensor placeholders of the operation. It is used to get input tensor(s)
 * and output tensor(s) in Operation.apply().
 *
 *
 * @member {TensorPlaceholder.Base} input0
 *   The TensorPlaceholder object which represents this operation's first input. It (from constructor) will be kept (not cloned)
 * directly. So caller should not modify them.
 *
 * @member {TensorPlaceholder.Base} input1
 *   The TensorPlaceholder object which represents this operation's second input. It could be null which means this operation
 * does not have second input tensor. It (from constructor) will be kept (not cloned) directly. So caller should not modify them.
 *
 * @param {number} inputTensorCount
 *   How many input tensor placeholders.
 * 
 * @member {TensorPlaceholder.Base} output0
 *   The TensorPlaceholder object which represents this operation's first output. It will be created by constructor if
 * outputTensorCount (of constructor) is >= 1.
 *
 * @member {TensorPlaceholder.Base} output1
 *   The TensorOpCounter object which represents this operation's second output. It is only created by constructor if
 * outputTensorCount (of constructor) is >= 2.
 *
 * @param {number} outputTensorCount
 *   How many output tensor placeholders. It's value is between [ 0, 2 ].
 *
 */
let Base = ( ParentClass = Object ) => class extends ParentClass {

  /**
   * This constructor will register this operation as the input TensorHolder's last operation. So the construction order is important
   * because the last constructed Operation object will become the real last operation of the inputs.
   *
   *
   * @param {number} outputTensorCount
   *   If 0, no this.outputX will be created. If 1, only the this.output0 will be created. If 2, both the this.output0 and this.output1
   * will be created.
   */
  constructor( input0, input1, outputTensorCount ) {
    this.input0 = input0;
    this.input1 = input1;

    // Register as the input TensorPlaceholder's final user.
    {
      if ( this.input0 )
        this.input0.lastOperation = this;

      if ( this.input1 )
        this.input1.lastOperation = this;
    }

    // Create outpiut TensorPlaceholder.
    {
      if ( outputTensorCount >= 1 ) {
        this.output0 = new TensorPlaceholder.Base();

        if ( outputTensorCount >= 2 ) {
          this.output1 = new TensorPlaceholder.Base();
        }
      }
    }
  }


  /**
   * Sub-class should override this method.
   *
   * The this.setKeepInputTensor_IfNotLastOperation_Or_In() will call this method. This method should adjust
   * this.apply so that this.apply() will or will not dispose its inputTensors.
   *
   * @param {boolean} bKeepInputTensor0
   *   Whether the 1st input tensor should be destroyed by this operation.
   *
   * @param {boolean} bKeepInputTensor1
   *   Whether the 2nd input tensor should be destroyed by this operation. It could be null (or undefined) if this operation have only
   * input tensor (i.e. does not have 2nd input tensor).
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
  }


  /**
   * This method will call this.setKeepInputTensor() according to：
   *   - whether the operation is the last operation of the this.input0 / this.input1.
   *   - whether the this.input0 / this.input1 is in alwaysKeepSet.
   *
   * @param {Set<TensorPlaceholder.Base>} alwaysKeepSet
   *   A set object. Its every element is TensorPlaceholder.Base object. They represent tensors never be disposed. The this.input0
   * and this.input1 will be compared with them.
   */
  setKeepInputTensor_IfNotLastOperation_Or_In( alwaysKeepSet ) {
  
    // Note: If an input appears multiple times (i.e. ( this.input0 == this.input1 ); multiple inputs of this operation are the same),
    //       the input will be disposed multiple times.
    //
    tf.util.assert( ( this.input0 != this.input1 ),
      `Block.Operation.Base.setKeepInputTensor_IfNotLastOperation_Or_In(): `
        + `input0 ( ${this.input0} ) should be different from `
        + `input1 ( ${this.input1} ).`
    );

    // If this operation is the last operation of the input tensor, this operation is responsible for disposing it.

    let input0_bNeedDispose;
    if (   ( this.input0 )
        && ( !alwaysKeepSet?.has( this.input0 ) ) // The input in alwaysKeepSet should always be kept (always not to be disposed).
        && ( this.input0.lastOperation == this )
       ) {
      input0_bNeedDispose = true;

    } else {
      input0_bNeedDispose = false;
    }

    let input1_bNeedDispose;
    if (   ( this.input1 )
        && ( !alwaysKeepSet?.has( this.input1 ) ) // The input in alwaysKeepSet should always be kept (always not to be disposed).
        && ( this.input1.lastOperation == this )
       ) {
      input1_bNeedDispose = true;

    } else {
      input1_bNeedDispose = false;
    }

    // Configure the operation to keep or dispose its inputs.
    this.setKeepInputTensor( input0_bNeedDispose, input1_bNeedDispose );
  }


  /**
   * Sub-class should override this method.
   *
   * This method should:
   *   - Use this.input0.realTensor (and this.input1.realTensor) to compute.
   *   - Place the result in this.output0.realTensor (and this.output1.realTensor)
   *
   */
  apply() {
  }


  get inputTensorCount() {
    if ( this.input0 )
      if ( this.input1 )
        return 2;
      else
        return 1;
    else
      if ( this.input1 )
        return 1;
      else
        return 0; // (should not happen)
  }

  get outputTensorCount() {
    if ( this.output0 )
      if ( this.output1 )
        return 2;
      else
        return 1;
    else
      if ( this.output1 )
        return 1;
      else
        return 0;
  }

}
