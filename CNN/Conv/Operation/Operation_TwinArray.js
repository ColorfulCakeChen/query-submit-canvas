export { TwinArray };

import * as TensorPlaceholder from "../TensorPlaceholder.js";
//import * as BoundsArraySet from "../BoundsArraySet.js";
import { Base } from "./Operation_Base.js";

/**
 * An array of operations. Every time appending operation, one or parallel twin operations could be appended.
 *

//!!! ...unfinished... (2022/06/02)

 * Its .output0 and .output1 (tensor placeholder) are pointer to the last operation's output0 and output1. This could simply the
 * decision of what tensor placeholders should be used as the next operation's input.
 *
 *
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
    super( inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount );
    this.operationArray = new Array();

//!!! ...unfinished... (2022/06/02) ???
//    this.disposeTensors();
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

//!!! ...unfinished... (2022/06/02) ??? should adjust by setKeepInputTensor( ???, ??? )
//     this.output0 = this.input0;
//     this.output1 = this.input1;

    super.disposeTensors();
  }


  /**
   * @override
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {

    // 0. If there is no sub operation, the behavior should be the same as an no-op operation.
    if ( !this.operationArray || ( this.operationArray.length <= 0 ) ) {
      super.setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 );
      return;
    }

    // 1. TensorPlaceholders requested to keep their tensors.
    let alwaysKeepSet;
    {
      if ( bKeepInputTensor0 || bKeepInputTensor1 ) {
        alwaysKeepSet = new Set();

        if ( bKeepInputTensor0 )
          alwaysKeepSet.add( this.input0 );

        if ( bKeepInputTensor1 )
          alwaysKeepSet.add( this.input1 );
      }
    }

    // 2. Every input tensors' last operation is responsible for releasing the tensor (except the input tensors which are requested
    //    to be kept (i.e. inside alwaysKeepSet)).
    //
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      operation.setKeepInputTensor_IfNotLastOperation_Or_In( alwaysKeepSet );
    }


//!!! ...unfinished... (2022/06/02) What if .operationArray[] is empty ?
  
  }


//!!! ...unfinished... (2022/06/01)
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
    let operationObject0 = Base.operation_create__update_byteOffsetEnd_if_init.call( this, operationClass, constructorArgs, initArgs );
    if ( !operationObject0 )
      return false;  // e.g. input array does not have enough data.

    // 2. Put into queue.
    this.operationArray.push( operationObject0 );

    // 3. Tracking the current output tensor placeholders for next operation's input.
    {    
      this.output0 = operationObject0.output0;
      
      // If the (first) only operation has two outputs, pointer to the second output of the (first) only operation.
      if ( operationObject0.output1 ) {
        this.currentTensorPlaceholder1 = operationObject0.output1;

      // Otherwise, keep this.output1 the same (i.e. bypass from previous output to this output).
      }
    }

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
    let operationObject0 = Base.operation_create__update_byteOffsetEnd_if_init.call( this, operationClass0, constructorArgs0, initArgs0 );
    if ( !operationObject0 )
      return false;  // e.g. input array does not have enough data.

    // 1.2 2nd operation object.
    let operationObject1 = Base.operation_create__update_byteOffsetEnd_if_init.call( this, operationClass1, constructorArgs1, initArgs1 );
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

      this.output0 = operationObject0.output0;
      this.output1 = operationObject1.output0;
    }

    return true;
  }


  /**
   * @override
   */
  apply() {

//!!! ...unfinished... (2022/06/01)
// What if not operation at all when needs or needs not keep-input?

  }



  /** @return {number} Sum of operations' tensorWeightCountExtracted. */
  get tensorWeightCountExtracted() {
    let sum = 0;
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      sum += operation.tensorWeightCountExtracted;
    }
    return sum;
  }

  /** @return {number} Sum of operations' tensorWeightCountTotal. */
  get tensorWeightCountTotal() {
    let sum = 0;
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      sum += operation.tensorWeightCountTotal;
    }
    return sum;
  }

}
