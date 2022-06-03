export { TwinArray };

import * as TensorPlaceholder from "../TensorPlaceholder.js";
import { Base } from "./Operation_Base.js";

/**
 * An array of operations. Every time appending operation, one or parallel twin operations could be appended.
 *

//!!! ...unfinished... (2022/06/02) endingDummyOperation


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

//!!! ...unfinished... (2022/06/02)

 *
 *
 * @see Operation.Base
 */
let TwinArray = ( ParentClass = Object ) => class extends Base( ParentClass ) {

  /**
   *
   */
  constructor( inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount ) {

    // Note: The real output TensorPlacehoder will be created later as final operation outputs.
    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 0 );

    // In order to handle keep-input-flag correctly (even if no sub operation at all), a ending dummy operation is used.
    {
      this.endingDummyOperation = new Base( inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount );

      // Its output will be the output of this operation array.
      {
        this.output0 = this.endingDummyOperation.output0;
        if ( this.endingDummyOperation.output1 )
          this.output1 = this.endingDummyOperation.output1;
      }
    }

    this.operationArray = new Array();

    this.bKeepInputTensor0 = false; // Default is destroy0 and destroy1;
    this.bKeepInputTensor1 = false;
    TwinArray.alwaysKeepSet_collect.call( this ); // Re-collect TensorPlaceholders which are requested to keep their tensors.
    TwinArray.setKeepInputTensor_by_this_operationArray_alwaysKeepSet.call( this );

    TwinArray.setup_apply_loop.call( this );
  }


  /**
   * @override
   */
  disposeTensors() {

    if ( this.operationArray ) {
      for ( let i = 0; i < this.operationArray.length; ++i ) {
        let operation = this.operationArray[ i ];
        operation.disposeTensors();
      }
      this.operationArray.length = 0;
    }

    this.endingDummyOperation.input0 = this.input0; // Since there is no sub operation, short-circuit to the original inputs.
    this.endingDummyOperation.input1 = this.input1;

    TwinArray.setKeepInputTensor_by_this_operationArray_alwaysKeepSet.call( this );

    super.disposeTensors();
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
    TwinArray.setKeepInputTensor_by_this_operationArray_alwaysKeepSet.call( this );
  }


//!!! ...unfinished... (2022/06/02)
// Is it possible to reconfigure faster (i.e. without traverse all sub operations)?
// So that it can be reconfigured every time operation_append_xxx() is called.
//
// Or, let operation_append_xxx() could append in batch.
//

  /**
   * Call every sub operation's and endingDummyOperation's setKeepInputTensor_IfNotFinalOperation_Or_In() with this.alwaysKeepSet.
   *
   * Every time this.operationArray or this.alwaysKeepSet is changed, this method should be called.
   *

//!!! (2022/06/03 Remarked)
//    * Every time this.operationArray or this.bKeepInputTensor0 or this.bKeepInputTensor1 or this.alwaysKeepSet is changed, this method
//    * should be called.

   *
   */
  static setKeepInputTensor_by_this_operationArray_alwaysKeepSet() {

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


  /**
   * @param {Base} this
   *   The Block.Base object whose .byteOffsetEnd might be updated.
   *
   * @param {Class} operationClass
   *   What kind of operation TO be created.
   *
   * @param {Array} constructorArgs
   *   The arguments to be passed to the constructor of operationClass. If null, the constructor will be called without any argument.
   *
   * @param {Array} initArgs
   *   The arguments to be passed to the init() method of operation object.
   *   - If null, the operation object's init() will not be called. Usually, this means the operation object needs not extract any weights.
   *   - If the .init() is called and returns false, this method will failed and return null.
   *   - If the .init() is called and returns true, this method will update this.byteOffsetEnd.
   *
   * @return {object} If success, return the created operation object. If failed, return null.
   */
  static operation_create__update_byteOffsetEnd_if_init( operationClass, constructorArgs, initArgs ) {
    let operationObject;

    // 1. Construct.
    if ( constructorArgs != undefined ) {
      operationObject = new operationClass( ...constructorArgs );
    } else {
      operationObject = new operationClass();
    }

    // 2. Intialize.
    if ( initArgs ) {
      if ( !operationObject.init( ...initArgs ) )
        return null;  // e.g. input array does not have enough data.

      this.byteOffsetEnd = operationObject.byteOffsetEnd;

    // Otherwise (i.e. no initArgs), do not call operationObject.init() and do not update this.byteOffsetEnd
    }

    // 3. Adjust keep-input-tensor flags.
    //
    // The previous final operation (of input tensor placeholders) is no longer its final operation.
    // The newly created operation becomes the final operation of its input.
    //
    operationObject.inputs_old_new_finalOperation__setKeepInputTensor_IfNotFinalOperation_Or_In( this.alwaysKeepSet );

    return operationObject;
  }

  /**
   * Only one operation object (operationObject0) will be created and appended into this.operationArray[].
   *
   *   - this.output0 will be pointered to operationObject0.output0
   *
   *   - this.output1:
   *
   *     - will not be modified, if operationObject0 has no output1.
   *         (i.e. could be viewed as passing through from previous operation output to this operation output).
   *
   *     - will be pointered to operationObject0.output1, if operationObject0 has output1.
   *
   *   
   * Note: After all operations are appended, .reconfigure_for_operationArray_bKeepInputTensor0_bKeepInputTensor1_changed()
   *       should called to reconfigure .apply data member.
   *
   *
   * @param {Class} operationClass
   *   What kind of operation to be created and appended into this.operationArray[].
   *
   * @param {Array} constructorArgs
   *   The arguments to be passed to the constructor of operationClass. If null, the constructor will be called without any argument.
   *
   * @param {Array} initArgs
   *   The arguments to be passed to the .init() method of operation object.
   *   - If null, the operation object's init() will not be called. Usually, this means the operation object needs not extract any weights.
   *   - If the .init() is called and returns false, this method will failed and return false.
   *   - If the .init() is called and returns true, this method will update this.byteOffsetEnd.
   *
   * @return {boolean}
   *   Return true, if success.
   */
  operation_append_one( operationClass, constructorArgs, initArgs ) {

    // 1. Create and initialize.
    let operationObject0 = TwinArray.operation_create__update_byteOffsetEnd_if_init.call( this, operationClass, constructorArgs, initArgs );
    if ( !operationObject0 )
      return false;  // e.g. input array does not have enough data.

    // 2. Put into queue.
    this.operationArray.push( operationObject0 );


//!!! ...unfinished... (2022/06/03)
// after append one operation, should use output0 or output1? Perhaps, only if .outputX not null, it will be used.
// However, considering concat or concat-split operation, it seems that caller should specify which output should be used as
// endingDummyOperation input.
//
// Or, uses specific operation appending method (e.g. appendConcatOp())?
//


    // 3. Tracking the current output tensor placeholders for next operation's input.
    {

//!!! ...unfinished... (2022/06/03)
// - needs call appended operation's input tensor placeholder's .finalOperationOld's .setKeepInputTensor_IfNotFinalOperation_Or_In().
// - needs call appended operation's (input tensor placeholder's .finalOperation's) .setKeepInputTensor_IfNotFinalOperation_Or_In().

// - needs be registered as finalOperation of the tensor placeholder.
// - needs endingDummyOperation's .setKeepInputTensor_IfNotFinalOperation_Or_In().


//!!! ...unfinished... (2022/06/03)
//       // Set and register as the input TensorPlaceholder's final user.
//       Base.set_inputTensorPlaceholder0_inputTensorPlaceholder1.call( this.endingDummyOperation, ??? input0, ??? input1 );


      this.endingDummyOperation.input0 = operationObject0.output0;
      
      // If the (first) only operation has two outputs, pointer to the second output of the (first) only operation.
      if ( operationObject0.output1 ) {
        this.endingDummyOperation.input1 = operationObject0.output1;

      // Otherwise, keep this.output1 the same (i.e. bypass from previous output to this output).
      }
    }

//!!! (2022/06/02 Remarked) Call it right now.
//
//    // Note: The endingDummyOperation is not configured properly until .reconfigure_by_bKeepInputTensor0_bKeepInputTensor1_alwaysKeepSet()
//    //       is called. So do not forget to call it after all sub operations are appended (and before calling .apply()).

//!!! ...unfinished... (2022/06/02) This may be time consuming.
    TwinArray.setKeepInputTensor_by_this_operationArray_alwaysKeepSet.call( this );

    return true;
  }

  /**
   * Two operation objects (operationObject0 and operationObject1) will be created (with the same operationClass,
   *       constructorArgs, initArgs) and appended into this.operationArray[].
   *
   *   - this.output0 will be pointered to operationObject0.output0
   *       (i.e. operationObject0.output1 will be ignored even if it exists)
   *
   *   - this.output1 will be pointered to operationObject1.output0
   *       (i.e. operationObject1.output1 will be ignored even if it exists)
   *
   *
   * Note: After all operations are appended, .reconfigure_for_operationArray_bKeepInputTensor0_bKeepInputTensor1_changed()
   *       should called to reconfigure .apply data member.
   *
   *
   * @param {Class} operationClass0   The 1st operation class.
   * @param {Array} constructorArgs0  The 1st operation constructor's arguments.
   * @param {Array} initArgs0         The 1st operation .init()'s arguments.
   *
   * @param {Class} operationClass1   The 2nd operation class.
   * @param {Array} constructorArgs1  The 2nd operation constructor's arguments.
   * @param {Array} initArgs1         The 2nd operation .init()'s arguments.
   *
   * @return {boolean}
   *   Return true, if success.
   *
   * @see operation_append_one()
   */
  operation_append_twin(
    operationClass0, constructorArgs0, initArgs0,
    operationClass1, constructorArgs1, initArgs1 ) {

    // 1. Create and initialize.

    // 1.1 1st operation object.
    let operationObject0 = TwinArray.operation_create__update_byteOffsetEnd_if_init.call( this, operationClass0, constructorArgs0, initArgs0 );
    if ( !operationObject0 )
      return false;  // e.g. input array does not have enough data.

    // 1.2 2nd operation object.
    let operationObject1 = TwinArray.operation_create__update_byteOffsetEnd_if_init.call( this, operationClass1, constructorArgs1, initArgs1 );
    if ( !operationObject1 )
      return false;  // e.g. input array does not have enough data.

    // 2. Put into queue.
    this.operationArray.push( operationObject0 );
    this.operationArray.push( operationObject1 );


//!!! ...unfinished... (2022/06/03)
// after append one operation, should use output0 or output1? Perhaps, only if .outputX not null, it will be used.
// However, considering concat or concat-split operation, it seems that caller should specify which output should be used as
// endingDummyOperation input.
//
// Or, uses specific operation appending method (e.g. appendConcatOp())?
//


    // 3. Tracking the current output tensor placeholders for next operation's input.
    {
      // When there two parallel operations, they should not have output1 (i.e. should only have output0).
      tf.util.assert( ( operationObject0.output1 == undefined ) && ( operationObject1.output1 == undefined ),
        `Operation.TwinArray.operation_append_twin(): `
          + `Both `
          + `operationObject0.output1 ( ${operationObject0.output1} ) and `
          + `operationObject1.output1 ( ${operationObject1.output1} ) `
          + `should all be undefined.`
      );

//!!! ...unfinished... (2022/06/03)
// - needs be registered as finalOperation of the tennsor placeholder.
// - needs call appended operation's input tensor placeholder's .finalOperationOld's .setKeepInputTensor_IfNotFinalOperation_Or_In().
// - needs call appended operation's (input tensor placeholder's .finalOperation's) .setKeepInputTensor_IfNotFinalOperation_Or_In().
// - needs endingDummyOperation's .setKeepInputTensor_IfNotFinalOperation_Or_In().


//!!! ...unfinished... (2022/06/03)
//       // Set and register as the input TensorPlaceholder's final user.
//       Base.set_inputTensorPlaceholder0_inputTensorPlaceholder1.call( this.endingDummyOperation, ??? input0, ??? input1 );


      this.endingDummyOperation.input0 = operationObject0.output0;
      this.endingDummyOperation.input1 = operationObject1.output0;
    }

//!!! (2022/06/02 Remarked) Call it right now.
//
//    // Note: The endingDummyOperation is not configured properly until .reconfigure_by_bKeepInputTensor0_bKeepInputTensor1_alwaysKeepSet()
//    //       is called. So do not forget to call it after all sub operations are appended (and before calling .apply()).

//!!! ...unfinished... (2022/06/02) This may be time consuming.
    TwinArray.setKeepInputTensor_by_this_operationArray_alwaysKeepSet.call( this );

    return true;
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


    {
      if ( operationObject.input0 )
        operationObject.input0.finalOperationOld.setKeepInputTensor_IfNotFinalOperation_Or_In( this.alwaysKeepSet );

      if ( operationObject.input1 )
        operationObject.input1.finalOperationOld.setKeepInputTensor_IfNotFinalOperation_Or_In( this.alwaysKeepSet );

      operationObject.setKeepInputTensor_IfNotFinalOperation_Or_In( this.alwaysKeepSet );
    }

//!!! ...unfinished... (2022/06/03)
//       // Set and register as the input TensorPlaceholder's final user.

    Base.set_inputTensorPlaceholder0_inputTensorPlaceholder1.call( this.endingDummyOperation, endingInput0, endingInput1 );

//!!! ...unfinished... (2022/06/03) What if the input tensor placeholder does not changed? should not always adjust.

    // 2. Adjust keep-input-tensor flags.
    //
    // The previous final operation (of input tensor placeholders) is no longer its final operation.
    // The newly created operation becomes the final operation of its input.
    this.endingDummyOperation.inputs_old_new_finalOperation__setKeepInputTensor_IfNotFinalOperation_Or_In( this.alwaysKeepSet );

  }


  /**
   * Adjust .apply data member according to calling .operationArray_apply().
   */
  static setup_apply_loop() {
    this.apply = TwinArray.operationArray_apply;
  }

  /**
   * Calling every sub operations' and .endingDummyOperation's .apply()
   */
  static operationArray_apply() {
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      operation.apply();
    }
    this.endingDummyOperation.apply();
  }

}
