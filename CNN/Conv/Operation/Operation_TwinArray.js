export { Operation_TwinArray };

import * as TensorPlaceholder from "../TensorPlaceholder.js";
//import * as BoundsArraySet from "../BoundsArraySet.js";
import { Base } from "./Operation_Base.js";

/**
 * An array of operations. Its output0 and output1 are pointer to the last operation's output0 and output1.
 * Every time appending operation, one or parallel twin operations could be appended.
 *
 *
 * @member {function} apply

//!!! ...unfinished... (2022/06/01)

 *
 */
class Operation_TwinArray extends Base() {

  /**
   *
   */
  constructor( inputTensorPlaceholder0, inputTensorPlaceholder1 ) {
    super( inputTensorPlaceholder0, inputTensorPlaceholder1, 0 );
    this.operationArray = new Array();
  }


  /**
   * @override
   */
  disposeTensors() {

//!!! ...unfinished... (2022/06/01)
// call disposeTensors( alwaysKeepSet ) for every operation.

    this.operationArray.length = 0;

    this.output0 = this.input0;
    this.output1 = this.input1;

    super.disposeTensors();
  }


  /**
   * @override
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {

//!!! ...unfinished... (2022/06/01)
// call setKeepInputTensor_IfNotLastOperation_Or_In( alwaysKeepSet ) for every operation?

  }


  /**
   *
   */
  clear() {
    
//!!! ...unfinished... (2022/06/01)

    this.disposeTensors();
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
   *
   *
   * @param {boolean} bParallelTwin
   *   Whether create and append two parallel operations.
   *
   *   - If false, only one operation object (operationObject0) will be created and appended into this.operationArray[].
   *
   *     - this.currentTensorPlaceholder0 will be pointered to operationObject0.output0
   *
   *     - this.currentTensorPlaceholder1:
   *
   *       - will not be modified, if operationObject0 has no output1.
   *           (i.e. could be viewed as passing through from previous operation output to this operation output).
   *
   *       - will be pointered to operationObject0.output1, if operationObject0 has output1.
   *
   *   - If true, two operation objects (operationObject0 and operationObject1) will be created (with the same operationClass,
   *       constructorArgs, initArgs) and appended into this.operationArray[].
   *
   *     - this.currentTensorPlaceholder0 will be pointered to operationObject0.output0
   *         (i.e. operationObject0.output1 will be ignored even if it exists)
   *
   *     - this.currentTensorPlaceholder1 will be pointered to operationObject1.output0
   *         (i.e. operationObject1.output1 will be ignored even if it exists)
   *
   * @param {Class} operationClass
   *   What kind of operation TO be created and appended into this.operationArray[].
   *
   * @param {Array} constructorArgs
   *   The arguments to be passed to the constructor of operationClass. If null, the constructor will be called without any argument.
   *
   * @param {Array} initArgs
   *   The arguments to be passed to the init() method of operation object.
   *   - If null, the operation object's init() will not be called. Usually, this means the operation object needs not extract any weights.
   *   - If the .init() is called and returns false, this operation_append() will failed and return false.
   *   - If the .init() is called and returns true, this operation_append() will update this.byteOffsetEnd.
   *
   * @return {boolean}
   *   Return true, if success.
   */
  operation_append( bParallelTwin, operationClass, constructorArgs, initArgs ) {

    // 1. Create and initialize.

    // 1.1 1st operation object.
    let operationObject0 = Base.operation_create__update_byteOffsetEnd_if_init.call( this, operationClass, constructorArgs, initArgs );
    if ( !operationObject0 )
      return false;  // e.g. input array does not have enough data.

    // 1.2 2nd operation object.
    let operationObject1;
    if ( bParallelTwin ) {    
      operationObject1 = Base.operation_create__update_byteOffsetEnd_if_init.call( this, operationClass, constructorArgs, initArgs );
      if ( !operationObject1 )
        return false;  // e.g. input array does not have enough data.
    }

    // 2. Put into queue.
    this.operationArray.push( operationObject0 );
    this.operationArray.push( operationObject1 );

    // 3. Traking the current tensor placeholders for next operation's input.

    // 3.1 Only one operation.
    if ( !bParallelTwin ) {    

      this.currentTensorPlaceholder0 = operationObject0.output0;
      
      // If the (first) only operation has two outputs, pointer to the second output of the (first) only operation.
      if ( operationObject0.output1 ) {
        this.currentTensorPlaceholder1 = operationObject0.output1;

      // Otherwise, keep this.currentTensorPlaceholder1 the same (i.e. bypass previous output to this output).
      }

    // 3.2 Two parallel operations.
    } else {
      
      // When there two parallel operations, they should not have output1 (i.e. should only have output0).
      tf.util.assert( ( operationObject0.output1 == undefined ) && ( operationObject1.output1 == undefined ),
        `Block.Base.operation_append(): `
          + `When ( bParallelTwin == true ), `
          + `operationObject0.output1 ( ${operationObject0.output1} ) and `
          + `operationObject1.output1 ( ${operationObject1.output1} ) `
          + `should all be undefined.`
      );

      this.currentTensorPlaceholder0 = operationObject0.output0;
      this.currentTensorPlaceholder1 = operationObject1.output0;
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
//!!! ...unfinished... (2022/06/01)
    return 0;
  }


  /** @return {number} Sum of operations' tensorWeightCountTotal. */
  get tensorWeightCountTotal() {
//!!! ...unfinished... (2022/06/01)
    return 0;
  }



}
