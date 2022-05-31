export { TensorPlaceholderSet };

import { TensorPlaceholder } from "./Block_TensorPlaceholder.js";
//import { Operation } from "./Block_Operation.js";


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
//
// //!!! ...unfinished... (2022/05/30) should create objects representing this operation's output(s).
// class Operation {
//
//   constructor() {
//     this.tensorPlaceholderSet = new TensorPlaceholderSet();
//   }
//
// }


/**
 * A set of TensorPlaceholder.
 *
 * In Block.init(), it is used for tracking the current tensor placeholders. It could simply the decision of what tensor placeholders
 * should be used as the next operation's input.
 *
 * In operation (e.g. Pointwise.Base), it is used for tracking the tensor placeholders of the operation. It is used to get input tensor(s)
 * and output tensor(s) in Operation.apply().
 *
 *
 *
 * @member {Block.TensorPlaceholder} input0
 *   The TensorPlaceholder object which represents this operation's first input. It (from constructor) will be kept (not cloned)
 * directly. So caller should not modify them.
 *
 * @member {Block.TensorPlaceholder} input1
 *   The TensorOpCounter.Base object which represents this operation's second input. It could be null which means this operation
 * does not have second input tensor. It (from constructor) will be kept (not cloned) directly. So caller should not modify them.
 *
 * @param {number} inputTensorCount
 *   How many input tensor placeholders.
 * 
 * @member {Block.TensorPlaceholder} output0
 *   The TensorPlaceholder object which represents this operation's first output. It is always be created by constructor.
 *
 * @member {Block.TensorPlaceholder} output1
 *   The TensorOpCounter.Base object which represents this operation's second output. It is only be created by constructor if
 * outputTensorCount (of constructor) is 2.
 *
 * @param {number} outputTensorCount
 *   How many output tensor placeholders.
 * 
 */
class TensorPlaceholderSet {

  /**
   * @param {number} outputTensorCount
   *   If 1, only the this.output0 will be created. If 2, the this.output0 and this.output1 will be created.
   */
  constructor( input0, input1, outputTensorCount = 1 ) {
    this.input0 = input0;
    this.input1 = input1;

//!!! ...unfinished... (2022/05/30) Register as the input TensorPlaceholder's final user.

    this.output0 = new TensorPlaceholder();
    if ( outputTensorCount >= 2 ) {
      this.output1 = new TensorPlaceholder();
    }
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
        return 0; // (should not happen)
  }

}
