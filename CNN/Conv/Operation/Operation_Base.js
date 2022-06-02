export { Base };

import * as TensorPlaceholder from "../TensorPlaceholder.js";



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
 *
 * @member {TensorPlaceholder.Base} input0
 *   The TensorPlaceholder object which represents this operation's first input. It (from constructor) will be kept (not cloned)
 * directly. So caller should not modify them.
 *
 * @member {TensorPlaceholder.Base} input1
 *   The TensorPlaceholder object which represents this operation's second input. It could be null which means this operation
 * does not have second input tensor. It (from constructor) will be kept (not cloned) directly. So caller should not modify them.
 *
 * @member {TensorPlaceholder.Base} output0
 *   The TensorPlaceholder object which represents this operation's first output. It will be created by constructor if
 * outputTensorCount (of constructor) is >= 1.
 *
 * @member {TensorPlaceholder.Base} output1
 *   The TensorOpCounter object which represents this operation's second output. It is only created by constructor if
 * outputTensorCount (of constructor) is >= 2.
 *

//!!! ...unfinished... (2022/06/02)

 * @member {function} apply
 *   This is a method. It processes this.input0.realTensor and this.input1.realTensor as inputTensors. It puts to this.output0.realTensor
 * as outputTensor. Both inputTensors are tf.tensor3d and represents an images ( height x width x channel ) which will be added. They
 * should have the same channel count. Their ( height x width ) should be either the same or one is ( 1 x 1 ). The outputTensor
 * (tf.tensor3d) represents the result of adding the two inputs. The inputTensors may or may not be disposed. In fact, this method
 * calls one of Add_and_keep0_keep1(), Add_and_keep0_destroy1(), Add_and_destroy0_keep1(), Add_and_destroy0_destroy1() according to
 * the parameters.
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
   * Release all tensors.
   */
  disposeTensors() {
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
      `Operation.Base.setKeepInputTensor_IfNotLastOperation_Or_In(): `
        + `input0 ( ${this.input0} ) should be different from `
        + `input1 ( ${this.input1} ).`
    );

    // If this operation is the last operation of the input tensor, this operation is responsible for disposing it.

    let input0_bNeedDispose;
    if (   ( this.input0 )
        && ( !alwaysKeepSet?.has( this.input0 ) ) // input in alwaysKeepSet should always be kept (always not to be disposed).
        && ( this.input0.lastOperation == this )
       ) {
      input0_bNeedDispose = true;

    } else {
      input0_bNeedDispose = false;
    }

    let input1_bNeedDispose;
    if (   ( this.input1 )
        && ( !alwaysKeepSet?.has( this.input1 ) ) // input in alwaysKeepSet should always be kept (always not to be disposed).
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


  /**
   * Sub-class should override this property.
   *
   * @return {number}
   *   The wieght count extracted from inputFloat32Array and used in tensors. Not including Params, because they are not used in
   * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputFloat32Array.
   */
  get tensorWeightCountExtracted() {
    return 0;
  }

  /**
   * Sub-class should override this property.
   *
   * @return {number}
   *   The total wieght count used in tensors. Not including Params, because they are not used in tensors. Including inferenced
   * weights, if they are used in tensors.
   */
  get tensorWeightCountTotal() {
    return 0;
  }


  /**
   * @return {number} inputTensorCount
   *   How many input tensor placeholders.
   */
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

  /**
   * @return {number}
   *   How many output tensor placeholders. It's value is between [ 0, 2 ].
   */
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



//!!! ...unfinished... (2022/06/02)
  /** Determine this.apply data members according to whether .inputX and .outputX exist.
   *
   * @param {Base} this  The Base object to be determined and modified.
   */
  static setup_apply() {

    if ( this.input0 ) {
      if ( this.input1 ) {

        if ( this.output0 ) {
          if ( this.output1 ) { // ( .input0, .input1 ) => ( .output0, .output1 )
          } else {              // ( .input0, .input1 ) => ( .output0 )
          }
        } else {
          if ( this.output1 ) { // ( .input0, .input1 ) => ( , .output1 )
          } else {              // ( .input0, .input1 ) => (  )
          }
        }

      } else {

        if ( this.output0 ) {
          if ( this.output1 ) { // ( .input0 ) => ( .output0, .output1 )
          } else {              // ( .input0 ) => ( .output0 )
          }
        } else {
          if ( this.output1 ) { // ( .input0 ) => ( , .output1 )
          } else {              // ( .input0 ) => (  )
          }
        }

      }

    } else {

      if ( this.input1 ) {

        if ( this.output0 ) {
          if ( this.output1 ) { // ( , .input1 ) => ( .output0, .output1 )
          } else {              // ( , .input1 ) => ( .output0 )
          }
        } else {
          if ( this.output1 ) { // ( , .input1 ) => ( , .output1 )
          } else {              // ( , .input1 ) => (  )
          }
        }

      } else { // no input0, no input1. Not supported.

        tf.util.assert( ( this.input0 != this.input1 ),
          `Operation.Base.setup_apply(): `
            + `input0 ( ${this.input0} ) and input1 ( ${this.input1} ) should at least one is non-null.`
        );

      }

//!!! ...unfinished... (2022/06/02)
    }
  }


  /**
   * Pass the input0 as output0 directly. Used for ( bKeepInputTensor == false ).
   *
   * @param {Base} this
   *   The this.input0.realTensor should be viewed as already disposed by this method. However, in fact, it is returned as
   * this.output0.realTensor directly.
   */
  static output0_return_input0_directly() {
    this.output0.realTensor = this.input0.realTensor;
  }

  /**
   * Pass the cloned input0 as output0. Used for ( bKeepInputTensor == true ).
   *
   * @param {Base} this
   *   The this.input0.realTensor should be viewed as kept (i.e. not disposed) by this method. However, in fact, it is cloned
   * and returned as this.output0.realTensor.
   */
  static output0_return_input0_cloned() {
    this.output0.realTensor = this.input0.realTensor.clone();
  }


//!!! ...unfinished... (2022/06/02)


}
