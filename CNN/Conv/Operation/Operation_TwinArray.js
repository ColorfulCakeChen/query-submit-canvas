export { TwinArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";
import * as ActivationEscaping from "../ActivationEscaping.js";
import { Root } from "./Operation_Base.js";
import { Dummy } from "./Operation_Dummy.js";

/**
 * An array of operations. Every time appending operation, one or twin (i.e.
 * two operations in parallel) operation(s) could be appended.
 *
 * No matter how many sub operations (even no sub operation) are appended, this
 * TwinArray's .output0 and .output1 (tensor placeholder) are always
 * .endingDummyOperation.output0 and .endingDummyOperation.output1 in fact. The
 * .endingInput0 and endingInput1 are always .endingDummyOperation.input0 and
 * .endingDummyOperation.input1 in fact. This could simplify the decision of
 * what tensor placeholders should be used as the next (appended) operation's
 * input.
 *
 *
 * Note: The .outputTensorCount is determined when constructor is called. No
 *       matter what kind of operation is appended (even if the is no operation
 *       is appended), the outputTensorCount will not be changed.
 *
 *
 *
 * @member {TensorPlaceholder.Base} endingInput0
 *   The last sub operation's output0 (also .endingDummyOperation.input0). It
 * could be used as input of next appended sub operation.
 *
 * @member {TensorPlaceholder.Base} endingInput1
 *   The last sub operation's output1 (also .endingDummyOperation.input1). It
 * could be used as input of next appended sub operation.
 *
 * @member {number} tensorWeightCountExtracted
 *   The sum of all sub operations' tensorWeightCountExtracted.
 *
 * @member {number} tensorWeightCountTotal
 *   The sum of all sub operations' tensorWeightCountTotal.
 *
 * @member {function} apply
 *   This is a data member pointer to a function. It processes
 * this.input0.realTensor (and this.input1.realTensor) as inputTensors. It puts
 * to this.output0.realTensor (and this.output1.realTensor) as outputTensor. In
 * fact, its calls .apply of every sub operation and .endingDummyOperation.
 *
 * @see Operation.Root
 */
class TwinArray extends Root {

  /**
   * Used as default Operation.TwinArray provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "Operation.TwinArray.Pool",
    TwinArray, TwinArray.setAsConstructor );

  /**
   *
   */
  constructor(
    parentNameable, name, bTableLog,
    inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount,
    ...restArgs ) {

    // Note: The real output TensorPlacehoder will be created later as final
    //       operation outputs.
    super(
      parentNameable, name, bTableLog,
      inputTensorPlaceholder0, inputTensorPlaceholder1, 0, ...restArgs );

    this.#setAsConstructor_self(
      inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount );
  }

  /** @override */
  setAsConstructor(
    parentNameable, name, bTableLog,
    inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount,
    ...restArgs ) {

    super.setAsConstructor(
      parentNameable, name, bTableLog,
      inputTensorPlaceholder0, inputTensorPlaceholder1, 0,
      bTableLog, ...restArgs );

    this.#setAsConstructor_self(
      inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount );
  }

  /**  */
  #setAsConstructor_self(
    inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount
  ) {

    // In order to handle keep-input-flag correctly (even if no sub operation
    // at all), an ending dummy operation is used.
    {
      this.endingDummyOperation = Dummy.Pool.get_or_create_by(
        inputTensorPlaceholder0, inputTensorPlaceholder1, outputTensorCount );

      // The ending dummy operation's output will be the output of this
      // operation array.
      {
        if ( this.endingDummyOperation.output0 )
          this.output0 = this.endingDummyOperation.output0;
        if ( this.endingDummyOperation.output1 )
          this.output1 = this.endingDummyOperation.output1;
      }
    }

    this.operationArray = Recyclable.OwnerArray.Pool.get_or_create_by();

    TwinArray.setup_apply_loop.call( this );

    // For reducing memory re-allocation.
    //
    // When one or twin operations are appended, the newly appended operations'
    // output tensor placeholders will be collected here temporarily. And then
    // they will be assigned as endingDummyOperation's input tensor
    // placeholder.
    //
    this.tempLastOutputTensorPlaceholderArray
      = Recyclable.Array.Pool.get_or_create_by( 0 );
    return this;
  }

  /** @override */
  disposeResources() {

    if ( this.tempLastOutputTensorPlaceholderArray ) {
      this.tempLastOutputTensorPlaceholderArray
        .disposeResources_and_recycleToPool();
      this.tempLastOutputTensorPlaceholderArray = null;
    }

    // Because outputs are not created by this operation, they should not be
    // released by this operation.
    //
    // Note: The this.output0 and this.output1 are created by
    //       .endingDummyOperation (i.e. not by this), they should be released
    //       by .endingDummyOperation.
    //
    // Q: Why not just use read-only property to return
    //    .endingDummyOperation.outputX?
    // A: Because the parent class (i.e. Operation.Root) has read-write
    //    .output0 and .output1 property, they can not become read-only in
    //    here (i.e. in sub-class).
    {
      if ( this.output1 )
        this.output1 = null;

      if ( this.output0 )
        this.output0 = null;
    }

    // Because outputs are created by .endingDummyOperation, they should be
    // released by it.
    if ( this.endingDummyOperation ) {
      this.endingDummyOperation.disposeResources_and_recycleToPool();
      this.endingDummyOperation = null;
    }

    // Release every sub operation in reverse order.
    if ( this.operationArray ) {
      this.operationArray.disposeResources_and_recycleToPool();
      this.operationArray = null;
    }

    // Because inputs are not created by this operation, they should not be
    // released by this operation.
    {
      if ( this.input1 )
        this.input1 = null;

      if ( this.input0 )
        this.input0 = null;
    }

    super.disposeResources();
  }

  /**
   * Release all ScaleBoundsArray (inside tensor placeholder) except
   * this.input0, this.input1, this.output0, this.output1
   *
   * This could reduce memory footprint by releasing unused scale bounds
   * array.
   */
  dispose_intermediate_ScaleBoundsArray() {
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];

      if (   ( operation.input0 )
          && !( this.is_inputs_outputs_byTensorPlaceholder(
                  operation.input0 ) ) )
        operation.input0.ScaleBoundsArray_dispose();

      if (   ( operation.input1 )
          && !( this.is_inputs_outputs_byTensorPlaceholder(
                  operation.input1 ) ) )
        operation.input1.ScaleBoundsArray_dispose();

      if (   ( operation.output0 )
          && !( this.is_inputs_outputs_byTensorPlaceholder(
                  operation.output0 ) ) )
        operation.output0.ScaleBoundsArray_dispose();

      if (   ( operation.output1 )
          && !( this.is_inputs_outputs_byTensorPlaceholder(
                  operation.output1 ) ) )
        operation.output1.ScaleBoundsArray_dispose();
    }
  }

  /**
   * Call every sub operation's, and endingDummyOperation's
   * setKeepInputTensor_IfNotFinalOperation_Or_In() according to
   * bKeepInputTensor0 and bKeepInputTensor1.
   *
   * Note: After all .operation_append() are called and before .apply() is
   *       called, this .setKeepInputTensor() should be called to configure
   *       all sub operation's .apply correctly.
   *
   * @override
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {

    // Q: Why not recorded bKeepInputTensor0 and bKeepInputTensor1 as data
    //    members.
    // A: The operation appending is complex so that the keep-input state will
    //    be changed in complicated way. Recording them is not helpful.

    TwinArray.alwaysKeepSet_collect
      .call( this, bKeepInputTensor0, bKeepInputTensor1 );
    TwinArray
      .setKeepInputTensor_by_operationArray_endingDummyOperation_alwaysKeepSet
      .call( this );
  }

  /**
   * Call every sub operation's, and endingDummyOperation's
   * setKeepInputTensor_IfNotFinalOperation_Or_In() according to
   * this.alwaysKeepSet.
   */
  static setKeepInputTensor_by_operationArray_endingDummyOperation_alwaysKeepSet() {

    // 2. Every input tensors' final operation is responsible for releasing
    //    the tensor (except the input tensors which are requested to be kept
    //    (i.e. inside alwaysKeepSet)).
    //
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      operation.setKeepInputTensor_IfNotFinalOperation_Or_In(
        this.alwaysKeepSet );
    }

    // 3.
    this.endingDummyOperation.setKeepInputTensor_IfNotFinalOperation_Or_In(
      this.alwaysKeepSet );
  }

  /**
   * Append one or twin (i.e. two operations in parallel) operation(s) into
   * this.operationArray[].
   *
   * All of the newly appended operations' .outputX TensorPlaceholders will
   * be assigned as .endingDummyOperation.inputX (i.e. .endingInputX) with
   * some rules:
   *
   *   - If a .endingDummyOperation is no longer the final operation of
   *       .endingDummyOperation.inputX, the .endingDummyOperation.inputX will
   *       be viewed as empty solt which could be assigned by newly appended
   *       operations' .outputX.
   *
   *   - However, because there are only two slots (i.e.
   *       .endingDummyOperation.input0 and .endingDummyOperation.input1) at
   *       most, there are only two operationX.outputY could be assigned to
   *       them.
   *
   *   - If there too many operationX.outputY needs to be handled, it will be
   *       asserted as failed.
   *
   *
   * Note: After all .operation_append() are called, the .setKeepInputTensor()
   *       should be called to configure correctly before .apply() is called.
   *
   *
   * @param {Operation.Base} operation0
   *   The 1st operation object to be appended into this.operationArray[].
   *
   * @param {Operation.Base} operation1
   *   The 2nd operation object. If null, there will be no 2nd operation.
   */
  operation_append( operation0, operation1 ) {

    // 1. Put into queue.
    if ( operation0 ) {
      this.operationArray.push( operation0 );
    }

    if ( operation1 ) {
      this.operationArray.push( operation1 );
    }

    // 2. Determine whether give up or keep current .endingInputX
    //
    // No matter ( .endingInputX does not exist ) or ( .endingInputX exists
    // but .endingDummyOperation is no longer its final operation ),
    // .endingInputX will become an empty slot which could handle newly
    // generated output tensor placeholders from newly appended operations.
    //
    // Q: Why .endingDummyOperation should give it up when
    //    .endingDummyOperation is no longer its input tensor placeholder's
    //    final operation (i.e. the newly created and appended operation
    //    becomes its final operation)?
    // A: So that .endingDummyOperation will not use a disposed tensor.
    //
    let endingInput0_new, endingInput1_new;
    {
      if ( this.endingDummyOperation.input0?.finalOperation
             == this.endingDummyOperation )
        // Continue to handle it Since it still is its final operation.
        endingInput0_new = this.endingDummyOperation.input0;
      else
        endingInput0_new = null;

      if ( this.endingDummyOperation.input1?.finalOperation
             == this.endingDummyOperation )
        // Continue to handle it Since it still is its final operation.
        endingInput1_new = this.endingDummyOperation.input1;
      else
        endingInput1_new = null;
    }

    // 3. Adjust .endingInputX

    // 3.1 Collect output tensor placeholders in reverse order (so that they
    //     will be popped in forward order).
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

    // 3.2 Assign newly generated output tensor placeholders (from newly
    //     appended operations) to empty input slot of .endingDummyOperation.
    {
      if (   ( this.tempLastOutputTensorPlaceholderArray.length > 0 )
          && ( endingInput0_new == null ) )
        endingInput0_new = this.tempLastOutputTensorPlaceholderArray.pop();

      if (   ( this.tempLastOutputTensorPlaceholderArray.length > 0 )
          && ( endingInput1_new == null ) )
        endingInput1_new = this.tempLastOutputTensorPlaceholderArray.pop();

      // At most, two outputs could be handled.
      if ( this.tempLastOutputTensorPlaceholderArray.length != 0 )
        throw Error( `Operation.TwinArray.operation_append(): `
          + `The appended operations have too many output TensorPlaceholders. `
          + `There are not enough .endingInputX could be used.`
        );
    }

    // 3.3 Confirm the new endingInputX.
    TwinArray.set_endingInput0_endingInput1.call( this,
      endingInput0_new, endingInput1_new );
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


  /**
   * Re-collect TensorPlaceholders into this.alwaysKeepSet if some input
   * tensors are requested to be kept after .apply().
   */
  static alwaysKeepSet_collect( bKeepInputTensor0, bKeepInputTensor1 ) {
    let bShouldbKeepInputTensor0 = ( this.input0 && bKeepInputTensor0 );
    let bShouldbKeepInputTensor1 = ( this.input1 && bKeepInputTensor1 );
    let bShouldbKeepInputTensor
      = ( bShouldbKeepInputTensor0 || bShouldbKeepInputTensor1 );

    if ( bShouldbKeepInputTensor ) { // 1. Some inputs should be kept.

      // 1.1
      if ( this.alwaysKeepSet )
        this.alwaysKeepSet.clear();
      else
        // Create container only if it is indeed necessary.
        this.alwaysKeepSet = new Set();

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
   * @param {TensorPlaceholder.Base} endingInput0
   *   The tensor placeholder to become .endingDummyOperation.input0.
   *
   * @param {TensorPlaceholder.Base} endingInput1
   *   The tensor placeholder to become .endingDummyOperation.input1.
   */
  static set_endingInput0_endingInput1( endingInput0, endingInput1 ) {
    super.set_inputTensorPlaceholder0_inputTensorPlaceholder1.call(
      this.endingDummyOperation, endingInput0, endingInput1 );
  }


  /**
   * Adjust .apply data member according to calling
   * .apply_operationArray_endingDummyOperation().
   */
  static setup_apply_loop() {
    this.apply = TwinArray.apply_operationArray_endingDummyOperation;
  }

  /**
   * Calling every sub operations', and .endingDummyOperation's .apply()
   */
  static apply_operationArray_endingDummyOperation() {
    for ( let i = 0; i < this.operationArray.length; ++i ) {
      let operation = this.operationArray[ i ];
      operation.apply();
    }
    this.endingDummyOperation.apply();
  }

}
