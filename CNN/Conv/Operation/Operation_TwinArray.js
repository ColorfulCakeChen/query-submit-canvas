export { TwinArray };

import * as TensorPlaceholder from "../TensorPlaceholder.js";
import { Base } from "./Operation_Base.js";

/**
 * An array of operations. Every time appending operation, one or parallel twin operations could be appended.
 *
 * No matter how many sub operations (even no sub operation) are appended, this TwinArray's .output0 and .output1 (tensor
 * placeholder) are always .endingDummyOperation.output0 and .endingDummyOperation.output1 in fact. The .endingInput0
 * and endingInput1 are always .endingDummyOperation.input0 and .endingDummyOperation.input1 in fact. This could
 * simplify the decision of what tensor placeholders should be used as the next (appended) operation's input.
 *
 *
 * Note: The .outputTensorCount is determined when constructor is called. No matter what kind of operation is appended
 * (even if the is no operation is appended), the outputTensorCount will not be changed.
 *
 *
 *
 * @member {TensorPlaceholder.Base} endingInput0
 *   The last sub operation's output0 (also .endingDummyOperation.input0). It could be used as input of next appended sub operation.
 *
 * @member {TensorPlaceholder.Base} endingInput1
 *   The last sub operation's output1 (also .endingDummyOperation.input1). It could be used as input of next appended sub operation.
 *
 * @member {number} tensorWeightCountExtracted
 *   The sum of all sub operations' tensorWeightCountExtracted.
 *
 * @member {number} tensorWeightCountTotal
 *   The sum of all sub operations' tensorWeightCountTotal.
 *
 * @member {function} apply
 *   This is a data member pointer to a function. It processes this.input0.realTensor (and this.input1.realTensor) as inputTensors. It
 * puts to this.output0.realTensor (and this.output1.realTensor) as outputTensor. In fact, its calls .apply of every sub operation
 * and .endingDummyOperation.
 *
 * @see Operation.Base
 */
class TwinArray extends Base() {

  /**
   *
   */
  constructor( inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount, ...restArgs ) {

    // Note: The real output TensorPlacehoder will be created later as final operation outputs.
    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 0, ...restArgs );

    // In order to handle keep-input-flag correctly (even if no sub operation at all), an ending dummy operation is used.
    {
      this.endingDummyOperation = new ( Base() )( inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount );

      // The ending dummy operation's output will be the output of this operation array.
      {
        if ( this.endingDummyOperation.output0 )
          this.output0 = this.endingDummyOperation.output0;
        if ( this.endingDummyOperation.output1 )
          this.output1 = this.endingDummyOperation.output1;
      }
    }

    this.operationArray = new Array();

    this.bKeepInputTensor0 = false; // Default is destroy0 and destroy1;
    this.bKeepInputTensor1 = false;
    TwinArray.alwaysKeepSet_collect.call( this ); // Re-collect TensorPlaceholders which are requested to keep their tensors.
    TwinArray.setKeepInputTensor_by_this_operationArray_endingDummyOperation_alwaysKeepSet.call( this );

    TwinArray.setup_apply_loop.call( this );
    
    // For reducing memory re-allocation.
    //
    // When one or twin operations are appended, the newly appende operations' output tensor placeholders will be collected here
    // temporarily. And then they will be assigned as endingDummyOperation's input tensor placeholder.
    //
    this.tempLastOutputTensorPlaceholderArray = new Array();
  }


  /**
   * @override
   */
  disposeTensors() {

    {
      for ( let i = 0; i < this.operationArray.length; ++i ) {
        let operation = this.operationArray[ i ];
        operation.disposeTensors();
      }
      this.operationArray.length = 0;
    }

    // Since there is no sub operation, short-circuit to the original inputs.
    TwinArray.set_endingInput0_endingInput1.call( this, this.input0, this.input1 );

    super.disposeTensors();
  }


  /**
   * Release all ScaleBoundsArray (inside tensor placeholder) except this.inputX and this.outputX
   *
   * This could reduce memory footprint by releasing unused scale bounds array.
   */
  dispose_intermediate_ScaleBoundsArray() {
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      if ( !this.is_inputs_outputs_byTensorPlaceholder( operation.input0 ) )
        operation.input0.scaleBoundsArray = null;
      if ( !this.is_inputs_outputs_byTensorPlaceholder( operation.input1 ) )
        operation.input1.scaleBoundsArray = null;
      if ( !this.is_inputs_outputs_byTensorPlaceholder( operation.output0 ) )
        operation.output0.scaleBoundsArray = null;
      if ( !this.is_inputs_outputs_byTensorPlaceholder( operation.output1 ) )
        operation.output1.scaleBoundsArray = null;
    }
  }


  /**
   * @override
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {

    if ( ( this.bKeepInputTensor0 == bKeepInputTensor0 ) && ( this.bKeepInputTensor1 == bKeepInputTensor1 ) )
      return; // Do nothing because no changed.

    this.bKeepInputTensor0 = bKeepInputTensor0;
    this.bKeepInputTensor1 = bKeepInputTensor1;
    TwinArray.alwaysKeepSet_collect.call( this );
    TwinArray.setKeepInputTensor_by_this_operationArray_endingDummyOperation_alwaysKeepSet.call( this );
  }


  /**
   * Call every sub operation's and endingDummyOperation's setKeepInputTensor_IfNotFinalOperation_Or_In() with this.alwaysKeepSet.
   */
  static setKeepInputTensor_by_this_operationArray_endingDummyOperation_alwaysKeepSet() {

    // 1. Every input tensors' final operation is responsible for releasing the tensor (except the input tensors which are requested
    //    to be kept (i.e. inside alwaysKeepSet)).
    //
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      operation.setKeepInputTensor_IfNotFinalOperation_Or_In( this.alwaysKeepSet );
    }

    // 2.
    this.endingDummyOperation.setKeepInputTensor_IfNotFinalOperation_Or_In( this.alwaysKeepSet );
  }


//!!! (2022/06/06 Remarked) .init() should be done by caller (not by TwinArray).
//   /**
//    * @param {Base} this
//    *   The Block.Base object whose .byteOffsetEnd might be updated.
//    *
//    * @param {Operation.Base} operationObject
//    *   The operation object to be initialized.
//    *
//    * @param {Array} initArgs
//    *   The arguments to be passed to the init() method of operation object.
//    *   - If null, the operation object's init() will not be called. Usually, this means the operation object needs not extract any weights.
//    *   - If the .init() is called and returns false, this method will failed and return null.
//    *   - If the .init() is called and returns true, this method will update this.byteOffsetEnd.
//    *
//    * @return {boolean} If success, return true. If failed, return false.
//    */
//   static operation__update_byteOffsetEnd_if_init_ok( operationObject, initArgs ) {
//
//     // 1. Intialize.
//     if ( initArgs ) {
//       if ( !operationObject.init.apply( operationObject, initArgs ) )
//         return false;  // e.g. input array does not have enough data.
//
//       this.byteOffsetEnd = operationObject.byteOffsetEnd;
//
//     // Otherwise (i.e. no initArgs), do not call operationObject.init() and do not update this.byteOffsetEnd
//     }
//
//     // 2. Adjust keep-input-tensor flags.
//     //
//     // The previous final operation (of input tensor placeholders) is no longer its final operation.
//     // The newly created operation becomes the final operation of its input.
//     //
//     operationObject.setKeepInputTensor__input0_finalOperationOld__input1_finalOperationOld__this__IfNotFinalOperation_Or_In( this.alwaysKeepSet );
//     return true;
//   }

  /**
   * Append one or twin (i.e. two operation in parallel) operation(s) into this.operationArray[].
   *
   * All of the newly appended operations' .outputX TensorPlaceholders will be assigned as .endingDummyOperation.inputX (i.e.
   * .endingInputX) with some rules:
   *
   *   - If a .endingDummyOperation is no longer the final operation of .endingDummyOperation.inputX, the .endingDummyOperation.inputX
   *       will be viewed as empty solt which could be assigned by newly appended operations' .outputX.
   *
   *   - However, because there are only two slots (i.e. .endingDummyOperation.input0 and .endingDummyOperation.input1) at most,
   *       there are only two operationX.outputY could be assigned to them.
   *
   *   - If there too many operationX.outputY needs to be handled, it will be asserted failed.
   *
   *
   * @param {Operation.Base} operation0  The 1st operation object to be appended into this.operationArray[].
   * @param {Operation.Base} operation1  The 2nd operation object. If null, there will be no 2nd operation.
   */
  operation_append( operation0, operation1 ) {

    // 1. Adjust keep-input-tensor flags, and put into queue.
    //
    // The previous final operation (of input tensor placeholders) is no longer its final operation.
    // The newly created operation becomes the final operation of its input.
    //
    if ( operation0 ) {
      operation0.setKeepInputTensor__input0_finalOperationOld__input1_finalOperationOld__this__IfNotFinalOperation_Or_In( this.alwaysKeepSet );
      this.operationArray.push( operation0 );
    }

    if ( operation1 ) {
      operation1.setKeepInputTensor__input0_finalOperationOld__input1_finalOperationOld__this__IfNotFinalOperation_Or_In( this.alwaysKeepSet );
      this.operationArray.push( operation1 );
    }

    // 2. Determine whether give up or keep current .endingInputX
    //
    // No matter ( .endingInputX does not exist ) or ( .endingInputX exists but .endingDummyOperation is no longer its final
    // operation ), .endingInputX will become an empty slot which could handle newly generated output tensor placeholders from
    // newly appended operations.
    //
    // Q: Why .endingDummyOperation should give it up when .endingDummyOperation is no longer its input tensor placeholder's
    //    final operation (i.e. the newly created and appended operation becomes its final operation)?
    // A: So that .endingDummyOperation will not use a disposed tensor.
    //
    let endingInput0_new, endingInput1_new;
    {
      if ( this.endingDummyOperation.input0?.finalOperation == this.endingDummyOperation )
        endingInput0_new = this.endingDummyOperation.input0; // Continue to handle it Since it still is its final operation.
      else
        endingInput0_new = null;

      if ( this.endingDummyOperation.input1?.finalOperation == this.endingDummyOperation )
        endingInput1_new = this.endingDummyOperation.input1; // Continue to handle it Since it still is its final operation.
      else
        endingInput1_new = null;
    }

    // 3. Adjust .endingInputX

    // 3.1 Collect output tensor placeholders in reverse order (so that they will be popped in forward order).
    {
      this.tempLastOutputTensorPlaceholderArray.length = 0;

      if ( operation1 ) {
        if ( operation1.output1 )
          this.tempLastOutputTensorPlaceholderArray.push( operation1.output1 );
        if ( operation1.output0 )
          this.tempLastOutputTensorPlaceholderArray.push( operation1.output0 );
      }

      if ( operation0 ) {
        if ( operation0.output1 )
          this.tempLastOutputTensorPlaceholderArray.push( operation0.output1 );
        if ( operation0.output0 )
          this.tempLastOutputTensorPlaceholderArray.push( operation0.output0 );
      }
    }

    // 3.2 Assign newly generated output tensor placeholders (from newly appended operations) to empty input slot of .endingDummyOperation.
    {
      if ( ( this.tempLastOutputTensorPlaceholderArray.length > 0 ) && ( endingInput0_new == null ) )
        endingInput0_new = this.tempLastOutputTensorPlaceholderArray.pop();

      if ( ( this.tempLastOutputTensorPlaceholderArray.length > 0 ) && ( endingInput1_new == null ) )
        endingInput1_new = this.tempLastOutputTensorPlaceholderArray.pop();

      // At most, two outputs could be handled.
      tf.util.assert( ( this.tempLastOutputTensorPlaceholderArray.length == 0 ),
        `Operation.TwinArray.operation_append(): `
          + `The appended operations have too many output TensorPlaceholders. There are not enough .endingInputX could be used.`
      );
    }

    // 3.3 Confirm the new endingInputX.
    TwinArray.set_endingInput0_endingInput1.call( this, endingInput0_new, endingInput1_new );
  }


  get endingInput0() {
    return this.endingDummyOperation.input0;
  }

  get endingInput1() {
    return this.endingDummyOperation.input1;
  }


  get tensorWeightCountExtracted() {
    let sum = 0;
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      sum += operation.tensorWeightCountExtracted;
    }
    return sum;
  }

  get tensorWeightCountTotal() {
    let sum = 0;
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      sum += operation.tensorWeightCountTotal;
    }
    return sum;
  }


  /** Re-collect TensorPlaceholders into this.alwaysKeepSet if some input tensors are requested to be kept after .apply().
   */
  static alwaysKeepSet_collect() {
    let bShouldbKeepInputTensor0 = ( this.input0 && this.bKeepInputTensor0 );
    let bShouldbKeepInputTensor1 = ( this.input1 && this.bKeepInputTensor1 );
    let bShouldbKeepInputTensor = ( bShouldbKeepInputTensor0 || bShouldbKeepInputTensor1 );

    if ( bShouldbKeepInputTensor ) { // 1. Some inputs should be kept.

      // 1.1
      if ( this.alwaysKeepSet )
        this.alwaysKeepSet.clear();
      else
        this.alwaysKeepSet = new Set(); // Create container only if it is indeed necessary.

      if ( bShouldbKeepInputTensor0 ) // 1.2
        this.alwaysKeepSet.add( this.input0 );

      if ( bShouldbKeepInputTensor1 ) // 1.3
        this.alwaysKeepSet.add( this.input1 );

    } else { // 2. No inputs should be kept.

      // 2.1 Empty the container if the container exists.
      if ( this.alwaysKeepSet )
        this.alwaysKeepSet.clear();

      // 2.2 If the container does not exist, do nothing instead.
    }
  }


  /**
   *
   * @param {TensorPlaceholder.Base} endingInput0  The tensor placeholder to become .endingDummyOperation.input0.
   * @param {TensorPlaceholder.Base} endingInput1  The tensor placeholder to become .endingDummyOperation.input1.
   */
  static set_endingInput0_endingInput1( endingInput0, endingInput1 ) {
    TwinArray.set_inputTensorPlaceholder0_inputTensorPlaceholder1.call( this.endingDummyOperation, endingInput0, endingInput1 );
    this.endingDummyOperation.setKeepInputTensor__input0_finalOperationOld__input1_finalOperationOld__this__IfNotFinalOperation_Or_In( this.alwaysKeepSet );
  }


  /**
   * Adjust .apply data member according to calling .apply_operationArray_endingDummyOperation().
   */
  static setup_apply_loop() {
    this.apply = TwinArray.apply_operationArray_endingDummyOperation;
  }

  /**
   * Calling every sub operations' and .endingDummyOperation's .apply()
   */
  static apply_operationArray_endingDummyOperation() {
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      operation.apply();
    }
    this.endingDummyOperation.apply();
  }

}
