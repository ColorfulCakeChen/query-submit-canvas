export { Operation_Base as Base, Root };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as TensorPlaceholder from "../TensorPlaceholder.js";

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
 *   The TensorPlaceholder object which represents this operation's second output. It is only created by constructor if
 * outputTensorCount (of constructor) is >= 2.
 *
 * @member {function} apply
 *   This is a data member which is a pointer to a function. The function processes .input0.realTensor (and .input1.realTensor) as
 * inputTensor(s). It puts to .output0.realTensor as outputTensor. The inputTensors may or may not be disposed according to
 * setKeepInputTensor(). Default is setKeepInputTensor( false, false ) which will destroy all inputs. Usually, sub-class should
 * override this data member.
 *
 */
let Operation_Base = ( ParentClass = Object ) => class Operation_Base extends Recyclable.Base( ParentClass ) {

  /**
   * Used as default Operation.Root provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Operation.Base.Pool", Operation_Base, Operation_Base.setAsConstructor );

  /**
   * This constructor will register this operation as the input TensorPlaceholder's final operation. So the construction order is
   * important because the final constructed Operation object will become the real final operation of the inputs.
   *
   *
   * @param {number} outputTensorCount
   *   If 0, no this.outputX will be created. If 1, only the this.output0 will be created. If 2, both the this.output0 and this.output1
   * will be created.
   */
  constructor( input0, input1, outputTensorCount, ...restArgs ) {
    super( ...restArgs ); // All other arguments passed to parent class's constructor.
    Operation_Base.setAsConstructor_self.call( this, input0, input1, outputTensorCount, ...restArgs );
  }

  /** @override */
  static setAsConstructor( input0, input1, outputTensorCount, ...restArgs ) {
    super.setAsConstructor.apply( this, restArgs );
    Operation_Base.setAsConstructor_self.call( this, input0, input1, outputTensorCount, ...restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( input0, input1, outputTensorCount, ...restArgs ) {

    // 1. Set and register as the input TensorPlaceholder's final user.
    Operation_Base.set_inputTensorPlaceholder0_inputTensorPlaceholder1.call( this, input0, input1 );

    // 2. Prepare output TensorPlaceholder.
    {
      // 2.1 .output0
      if ( outputTensorCount >= 1 ) {
        if ( this.output0 ) {
          // Do nothing. Continue to use the existed .output0 TensorPlaceholder.
        } else {
          this.output0 = TensorPlaceholder.Base.Pool.get_or_create_by();
        }
      } else {
        if ( this.output0 ) { // Dispose it since not necessary.
          this.output0.disposeResources_and_recycleToPool();
          this.output0 = null;
        }
      }

      // 2.2 .output1
      if ( outputTensorCount >= 2 ) {
        if ( this.output1 ) {
          // Do nothing. Continue to use the existed .output1 TensorPlaceholder.
        } else {
          this.output1 = TensorPlaceholder.Base.Pool.get_or_create_by();
        }
      } else { // Dispose it since not necessary.
        if ( this.output1 ) {
          this.output1.disposeResources_and_recycleToPool();
          this.output1 = null;
        }
      }
    }

    // 3. this.apply
    //
    // Note: In this Operation.Base object, there is no this.apply definition. Sub-class should define it.
    this.apply = Operation_Base.apply_base_just_throw_error;
  }

  /**
   * The .input0 and .input1 will be set to null. The .output0 and .output1 will be recycled and then set to null.
   *
   * Sub-class should override this method (and call super.disposeResources() before return).
   *
   * @override
   */
  disposeResources() {
    this.apply = null;

    // Because outputs are created by this operation, they should be released by this operation.
    {
      if ( this.output1 ) {
        this.output1.disposeResources_and_recycleToPool();
        this.output1 = null;
      }

      if ( this.output0 ) {
        this.output0.disposeResources_and_recycleToPool();
        this.output0 = null;
      }
    }

    // Because inputs are not created by this operation, they should not be released by this operation.
    {
      if ( this.input1 )
        this.input1 = null;

      if ( this.input0 )
        this.input0 = null;
    }

    super.disposeResources();
  }

  /**
   * Adjust according to specified keep-input-tensor flag(s). So that calling .apply() will generate correct result without memory leakage.
   *
   * The this.setKeepInputTensor_IfNotFinalOperation_Or_In() will call this method. This method should adjust
   * this.apply so that this.apply() will or will not dispose its inputTensors.
   *
   * Sub-class should override this method.
   *
   * @param {boolean} bKeepInputTensor0
   *   Whether the .input0's tensor should be destroyed by this operation. It is ignored if .input0 does not exist.
   *
   * @param {boolean} bKeepInputTensor1
   *   Whether the .input1's tensor should be destroyed by this operation. It is ignored if .input1 does not exist.
   */
  setKeepInputTensor( bKeepInputTensor0, bKeepInputTensor1 ) {
    // Do nothing. (for Operation.Base)
    throw Error( `Operation.Base.setKeepInputTensor(): `
      + `Sub-class should override Operation.Base.setKeepInputTensor().`
    );
  }

  /**
   * This method will call this.setKeepInputTensor() according to：
   *   - whether the operation is the final operation of the this.input0 / this.input1.
   *   - whether the this.input0 / this.input1 is in alwaysKeepSet.
   *
   * @param {Set<TensorPlaceholder.Base>} alwaysKeepSet
   *   A set object. Its every element is TensorPlaceholder.Base object. They represent tensors never be disposed. The this.input0
   * and this.input1 will be compared with them.
   */
  setKeepInputTensor_IfNotFinalOperation_Or_In( alwaysKeepSet ) {

    let input0_bKeep = Operation_Base.TensorPlaceholder_shouldKeepInputTensor_IfNotFinalOperation_Or_In.call( this, this.input0, alwaysKeepSet );
    let input1_bKeep = Operation_Base.TensorPlaceholder_shouldKeepInputTensor_IfNotFinalOperation_Or_In.call( this, this.input1, alwaysKeepSet );

    // If two inputs are not null and they are the same one tensor placeholder (i.e. it appears multiple times, i.e.
    // ( this.input0 == this.input1 ) ), the conatined tensor will be disposed multiple times. In order to alleviate this
    // problem, here will do some adjust to let .input0 do not dispose it.
    // 
    // Note: If ( this.input0 != this.input1 ) but ( this.input0.realTensor == this.input1.realTensor ), that will be also a
    //       problem. But it can not be detected here because .realTensor is only known when .apply() is called (i.e. not here).
    //
    if (   ( this.input0 == this.input1 )         // If both inputs are the same tensor placeholder (so the same tensor).
        && ( this.input0 ) && ( this.input1 )     // And they both existed (so has tensor).
        && ( !input0_bKeep ) && ( !input1_bKeep ) // And they both should be disposed (i.e. not be kept).
       ) {

      // Let one of them do not dispose the tensor to avoid dispose the (same one) tensor before the operation.apply() done the
      // computation.
      //
      // We assume the .input0 might be used before .input1, so choose .input0 to be kept.
      //
      // Note: This assumption is not always correct. If the .input1 is used (and will be disposed) before .input0, then a
      //       disposed might be used by this operation.
      // 
      input0_bKeep = true;
    }

    this.setKeepInputTensor( input0_bKeep, input1_bKeep ); // Configure the operation to keep or dispose its inputs.
  }

  /**
   *
   * @param {Base} this
   *   The operation owns the aTensorPlaceholder as its input tensor placeholder.
   *
   * @param {TensorPlaceholder.Base} aTensorPlaceholder
   *   The tensor placeholder to be determined whether its contained tensor should be kept (i.e. not be disposed) by this operation.
   * If this operation is the final operation of aTensorPlaceholder, this operation is responsible for disposing its contained tensor.
   *
   * @param {Set<TensorPlaceholder.Base>} alwaysKeepSet
   *   A set object. Its every element is TensorPlaceholder.Base object. They represent tensors never be disposed. The
   * aTensorPlaceholder will be compared with them. If ( alwaysKeepSet == null ), it is viewed as empty set.
   *
   * @retuen {boolean}
   *   If this operation is the tensor's final operation and the tensor is not in alwaysKeepSet, return false (i.e. do not keep it and
   * should dispose it).
   */
  static TensorPlaceholder_shouldKeepInputTensor_IfNotFinalOperation_Or_In( aTensorPlaceholder, alwaysKeepSet ) {
    if ( !aTensorPlaceholder )
      return false; // No need to keep non-existed tensor.

    if ( aTensorPlaceholder.finalOperation != this )
      return true; // Not final operation, the tensor always be kept.

    // Only if final operation, the input might be destroyed.

    if ( alwaysKeepSet?.has( aTensorPlaceholder ) )
      return true; // tensor placeholder in alwaysKeepSet should always be kept (always not to be disposed).

    return false;
  }

  /**
   *
   * @param {TensorPlaceholder.Base} aTensorPlaceholder
   *   The tensor placeholder to be compared to .inputX and .outputX. If null, always return false.
   *
   * @return {boolean}
   *   If the aTensorPlaceholder is .input0 or .input1 or .output0 or .output1, return true. If a .inputX and .outputX is undefined,
   * it will be skipped (i.e. not be compared).
   */
  is_inputs_outputs_byTensorPlaceholder( aTensorPlaceholder ) {
    if ( !aTensorPlaceholder )
      return false;
    if ( ( this.input0 ) && ( aTensorPlaceholder == this.input0 ) )
      return true;
    if ( ( this.input1 ) && ( aTensorPlaceholder == this.input1 ) )
      return true;
    if ( ( this.output0 ) && ( aTensorPlaceholder == this.output0 ) )
      return true;
    if ( ( this.output1 ) && ( aTensorPlaceholder == this.output1 ) )
      return true;
    return false;
  }

  /**
   * Sub-class should override this property.
   *
   * @return {number}
   *   The wieght count extracted from inputWeightArray and used in tensors. Not including Params, because they are not used in
   * tensors. Not including inferenced weights (even if they are used in tensors), because they are not extracted from inputWeightArray.
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

  /**
   * Modify oldTensorPlaceholder and newTensorPlaceholder, and get a TensorPlaceholder (may be undefined or oldTensorPlaceholder
   * or newTensorPlaceholder) which should be used as oldTensorPlaceholder's new value.
   *
   * No matter what is returned (even if undefined is returned), the oldTensorPlaceholder and newTensorPlaceholder always may be
   * modifed by this method.
   *
   * The mehod is used for setting oldTensorPlaceholder (which must be one of this operation object's input tensor placeholder property,
   * e.g. this.input0) as newTensorPlaceholder. It will register this operation as the new input TensorPlaceholder's final operation.
   *
   * If the new input tensor placeholder is undefined (or null), the returned value (will be undefined too) could be used to cleared to
   * no input tensor placeholder. The original input tensor placeholder's final operation will be updated (if it is this operation).
   *
   *
   * Note: Because changing input tensor placeholder may cause complex effect, this method should be used carefully.
   *
   *
   * @param {Operation.Base} this The operation to be modified.
   *
   * @param {TensorPlaceholder.Base} oldTensorPlaceholder  The TensorPlaceholder object which want to be set as newTensorPlaceholder.
   * @param {TensorPlaceholder.Base} newTensorPlaceholder  The TensorPlaceholder object which want to replace oldTensorPlaceholder.
   *
   * @return {aTensorPlaceholder} Return undefined or oldTensorPlaceholder or newTensorPlaceholder.
   */
  static TensorPlaceholder_get_modified_for_set_input_from_old_to_new( oldTensorPlaceholder, newTensorPlaceholder ) {

    let result;
    if ( oldTensorPlaceholder == undefined ) { // 1. Original does not have input.

      if ( newTensorPlaceholder == undefined ) {
        result = undefined; // 1.1 Keep no input.

      } else { // 1.2 Change no input to new input.
        newTensorPlaceholder.finalOperation = this;
        result = newTensorPlaceholder;
      }

    } else { // 2. Original has input.

      if ( oldTensorPlaceholder == newTensorPlaceholder ) {
        result = oldTensorPlaceholder; // 2.1 Already the same input.

      } else { // 2.2 Different input.

        // 2.2.0 If this operation is the old tensor placeholder's final operation, it has no final operation now.
        if ( oldTensorPlaceholder.finalOperation == this ) {
          oldTensorPlaceholder.finalOperation = null;
        }

        if ( newTensorPlaceholder == undefined ) {
          result = undefined; // 2.2.1 Clear original input to no input.

        } else { // 2.2.2 Change original input to new input.
          newTensorPlaceholder.finalOperation = this;
          result = newTensorPlaceholder;
        }
      }
    }

    return result;
  }

  /**
   * Change this operation's input tensor placeholder. Also, register as the new input TensorPlaceholder's final user.
   * If the new input tensor placeholder is undefined (or null), the corresponding this.input will be cleared to no input
   * tensor placeholder.
   *
   * Note: Because changing input tensor placeholder may cause complex effect, this method should be used carefully.
   *
   *
   * @param {Operation.Base} this            The operation to be modified.
   * @param {TensorPlaceholder.Base} input0  The TensorPlaceholder object which will become this operation's 1st input.
   * @param {TensorPlaceholder.Base} input1  The TensorPlaceholder object which will become this operation's 2nd input.
   */
  static set_inputTensorPlaceholder0_inputTensorPlaceholder1( input0, input1 ) {

    let newInput0 = Operation_Base.TensorPlaceholder_get_modified_for_set_input_from_old_to_new.call( this, this.input0, input0 );
    if ( this.input0 != newInput0 ) // So that it could keep not existed if original does not existed.
      this.input0 = newInput0;

    let newInput1 = Operation_Base.TensorPlaceholder_get_modified_for_set_input_from_old_to_new.call( this, this.input1, input1 );
    if ( this.input1 != newInput1 ) // So that it could keep not existed if original does not existed.
      this.input1 = newInput1;
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

  static apply_base_just_throw_error() {
    throw Error( `Operation.Base.apply(): `
      + `Sub-class should define itself this.apply data property to function.`
    );
  }

}


/**
 * Almost the same as Operation.Base class except its parent class is fixed to Object. In other words, caller can not specify the
 * parent class of Operation.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Operation_Base() {
}

