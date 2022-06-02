export { TwinArray };

import * as TensorPlaceholder from "../TensorPlaceholder.js";
//import * as BoundsArraySet from "../BoundsArraySet.js";
import { Base } from "./Operation_Base.js";

/**
 * An array of operations. Every time appending operation, one or parallel twin operations could be appended.
 *

//!!! ...unfinished... (2022/06/02) endingDummyOperation


 * No matter how many sub operations (even no sub operation) are appended, this TwinArray's .output0 and .output1 (tensor
 * placeholder) are always .endingDummyOperation.output0 and .endingDummyOperation.output1 in fact. The .lastSubOperationOutput0
 * and lastSubOperationOutput1 are always .endingDummyOperation.input0 and .endingDummyOperation.input1 in fact. This could
 * simplify the decision of what tensor placeholders should be used as the next (appended) operation's input.
 *
 *
 *
 *
 * @member {TensorPlaceholder.Base} lastSubOperationOutput0
 *   The last sub operation's output0 (also .endingDummyOperation.input0). It could be used as input of next appended sub operation.
 *
 * @member {TensorPlaceholder.Base} lastSubOperationOutput1
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

//!!! ...unfinished... (2022/06/02)

   * Note: The outputTensorCount is determined when constructor is called. No matter what kind of operation is appended,
   * the outputTensorCount will not be changed.
   *
   */
  constructor( inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount ) {

//!!! ...unfinished... (2022/06/02)
//    super( inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount );
    
    // The real output TensorPlacehoder will be created later as final operation outputs.
    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 0 );

    this.operationArray = new Array();


//!!! ...unfinished... (2022/06/02) endingDummyOperation
// What if has sub operation, but only input0 is used by the sub operation (i.e. the input1 not handled by any sub ooeration)? Perhaps, always push a dummy operation at the end if operationArray[].
    {
      this.endingDummyOperation = new Base( inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount );

      this.output0 = this.endingDummyOperation.output0;
      if ( this.endingDummyOperation.output1 )
        this.output1 = this.endingDummyOperation.output1;

//!!! ...unfinished... (2022/06/02) endingDummyOperation
//      TwinArray.set_lastSubOperationOutput0_lastSubOperationOutput0.call( this );
    }

    this.bKeepInputTensor0 = false;
    this.bKeepInputTensor1 = false;

    this.reconfigure_for_operationArray_bKeepInputTensor0_bKeepInputTensor1_changed(); // Adjust .apply and sub operations.
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

//!!! ...unfinished... (2022/06/02) endingDummyOperation

    this.reconfigure_for_operationArray_bKeepInputTensor0_bKeepInputTensor1_changed(); // Adjust .apply and sub operations.

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
    this.reconfigure_for_operationArray_bKeepInputTensor0_bKeepInputTensor1_changed(); // Adjust .apply and sub operations.
  }

  /**
   * Reconfigure .apply data member, and calling every sub operation's setKeepInputTensor().
   *
   * Every time .operationArray or .bKeepInputTensor0 or .bKeepInputTensor1 is changed, this method should be called.
   *
   */
  reconfigure_for_operationArray_bKeepInputTensor0_bKeepInputTensor1_changed() {

    // Every time .operationArray or .bKeepInputTensor0 or .bKeepInputTensor1 is changed, the .apply data member should be adjusted.
    TwinArray.setup_apply_dummy_or_loop.call( this );

    // 1. If there is no sub operation, the behavior should be the same as an no-op operation.
    if ( !this.operationArray || ( this.operationArray.length <= 0 ) ) {
      super.setKeepInputTensor( this.bKeepInputTensor0, this.bKeepInputTensor1 );
      
    } else { // 2.

      // 2.1 TensorPlaceholders requested to keep their tensors.
      let alwaysKeepSet;
      {
        if ( this.bKeepInputTensor0 || this.bKeepInputTensor1 ) {
          alwaysKeepSet = new Set();

          if ( this.bKeepInputTensor0 )
            alwaysKeepSet.add( this.input0 );

          if ( this.bKeepInputTensor1 )
            alwaysKeepSet.add( this.input1 );
        }
      }

      // 2.2 Every input tensors' last operation is responsible for releasing the tensor (except the input tensors which are requested
      //     to be kept (i.e. inside alwaysKeepSet)).
      //
      for ( let i = 0; i < this.operationArray.length; ++i ) {
        let operation = this.operationArray[ i ];
        operation.setKeepInputTensor_IfNotLastOperation_Or_In( alwaysKeepSet );
      }
    }

//!!! ...unfinished... (2022/06/02) endingDummyOperation

  }


//!!! ...unfinished... (2022/06/02) Perhaps, called when this.setKeepInputTensor() called.
//   /**
//    * This method will also update this.endingDummyOperation's input0 and input1.
//    *
//    *
//    * @param {TensorPlaceholder.Base} aTensorPlaceholder0  The this.lastSubOperationOutput0 will be set as aTensorPlaceholder0.
//    * @param {TensorPlaceholder.Base} aTensorPlaceholder1  The this.lastSubOperationOutput1 will be set as aTensorPlaceholder1.
//    */
//   static set_lastSubOperationOutput0_lastSubOperationOutput0( aTensorPlaceholder0, aTensorPlaceholder1 ) {
//
//     this.lastSubOperationOutput0 = aTensorPlaceholder0;
//     this.lastSubOperationOutput1 = aTensorPlaceholder1;
//
//     this.endingDummyOperation.input0 = aTensorPlaceholder0;
//     this.endingDummyOperation.input1 = aTensorPlaceholder1;
//
// //!!! ...unfinished... (2022/06/02) Perhaps, called when this.setKeepInputTensor() called.
// //    Base.setup_apply_dummy.call( this.endingDummyOperation, ???, ??? );
//     this.endingDummyOperation.setKeepInputTensor( ???, ??? );
//
//   }


//!!! ...unfinished... (2022/06/02)
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

    // Construct.
    if ( constructorArgs != undefined ) {
      operationObject = new operationClass( ...constructorArgs );
    } else {
      operationObject = new operationClass();
    }

    // Intialize.
    if ( initArgs ) {
      if ( !operationObject.init( ...initArgs ) )
        return null;  // e.g. input array does not have enough data.

      this.byteOffsetEnd = operationObject.byteOffsetEnd;

    // Otherwise (i.e. no initArgs), do not call operationObject.init() and do not update this.byteOffsetEnd
    }

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

    // 3. Tracking the current output tensor placeholders for next operation's input.
    {    
      this.endingDummyOperation.input0 = operationObject0.output0;
      
      // If the (first) only operation has two outputs, pointer to the second output of the (first) only operation.
      if ( operationObject0.output1 ) {
        this.endingDummyOperation.input1 = operationObject0.output1;

      // Otherwise, keep this.output1 the same (i.e. bypass from previous output to this output).
      }
    }

    // Note: The endingDummyOperation does not configured properly until its Base.setup_apply_dummy.call() or setKeepInputTensor()
    //       is called. So it is important to call .reconfigure_for_operationArray_bKeepInputTensor0_bKeepInputTensor1_changed()
    //       after all sub operations are appended (and before calling .apply()).

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

      this.endingDummyOperation.input0 = operationObject0.output0;
      this.endingDummyOperation.input1 = operationObject1.output0;
    }

    // Note: The endingDummyOperation does not configured properly until its Base.setup_apply_dummy.call() or setKeepInputTensor()
    //       is called. So it is important to call .reconfigure_for_operationArray_bKeepInputTensor0_bKeepInputTensor1_changed()
    //       after all sub operations are appended (and before calling .apply()).

    return true;
  }


  get lastSubOperationOutput0() {
    return this.endingDummyOperation.input0;
  }

  get lastSubOperationOutput1() {
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


  /**
   * Adjust .apply data member according to .operationArray, .bKeepInputTensor0, .bKeepInputTensor1
   */
  static setup_apply_dummy_or_loop() {

    // 0. If there is no sub operation, the behavior should be the same as an no-op operation.
    if ( !this.operationArray || ( this.operationArray.length <= 0 ) ) {
      TwinArray.setup_apply_dummy.call( this, this.bKeepInputTensor0, this.bKeepInputTensor1 );
      return;
    }

    // 1. Otherwise, handle sub operations by loop.
    this.apply = TwinArray.operationArray_apply;

//!!! ...unfinished... (2022/06/02) endingDummyOperation

  }


  /**
   * Calling every sub operations' .apply()
   */
  static operationArray_apply() {
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      operation.apply();
    }

//!!! ...unfinished... (2022/06/02) endingDummyOperation

  }

}
