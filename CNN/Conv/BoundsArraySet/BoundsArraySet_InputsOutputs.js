export { InputsOutputs };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ActivationEscaping from "../ActivationEscaping.js";

/**
 * Element value bounds (per channel) for inputs and outputs of an operation.
 *
 * The main purpose is to find out the activationEscaping_ScaleArraySet so that it can be used to let channel escape from
 * activation function's non-linear effect.
 *
 *
 * @member {number} inputTensorCount
 *   How many input tensors. It is 1, if only input0 exists. It is 2, if both input0 and input1 exist. 
 *
 * @member {ActivationEscaping.ScaleBoundsArray} input0
 *   The element value bounds (per channel) of 1st input (can NOT null). It is the domain of the operation. It (from constructor)
 * will be kept (not cloned) directly. So caller should not modify them.
 *
 * @member {ActivationEscaping.ScaleBoundsArray} input1
 *   The element value bounds (per channel) of 2nd input (can null or undefined). It is the domain of the operation. It (from
 * constructor) will be kept (not cloned) directly. So caller should not modify them.
 *
 * @member {number} inputChannelCount0
 *   The channel count of 1st input (i.e. this.input0.channelCount).
 *
 * @member {number} inputChannelCount1
 *   The channel count of 2nd input (i.e. this.input1.channelCount).
 *
 * @member {number} outputTensorCount
 *   How many output tensors. It is 1, if only output0 exists. It is 2, if both output0 and output1 exist. 
 *
 * @member {ActivationEscaping.ScaleBoundsArray} output0
 *   The element value bounds (per channel) of 1st output. It is the range of the operation). It is created by constructor
 * according to outputChannelCount0 (must be positive).
 *
 * @member {ActivationEscaping.ScaleBoundsArray} output1
 *   The element value bounds (per channel) of 2nd output. It is the range of the operation). It is created by constructor
 * according to outputChannelCount1 (if positive).
 *
 * @member {number} outputChannelCount0
 *   The channel count of 1st output (i.e. this.output0.channelCount).
 *
 * @member {number} outputChannelCount1
 *   The channel count of 2nd output (i.e. this.output1.channelCount).
 */
class InputsOutputs extends Recyclable.Root {

  /**
   * Used as default BoundsArraySet.InputsOutputs provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "BoundsArraySet.InputsOutputs.Pool", InputsOutputs, InputsOutputs.setAsConstructor );

  /**
   *
   * @param {number} outputChannelCount0
   *   The channel count of 1st output. (MUST positive)
   *
   * @param {number} outputChannelCount1
   *   The channel count of 2nd output. (If undefined or null or zero or negative, there will be no output1.)
   */
  constructor( input0, input1, outputChannelCount0, outputChannelCount1 ) {
    super();
    InputsOutputs.setAsConstructor_self.call( this, input0, input1, outputChannelCount0, outputChannelCount1 );
  }

  /** @override */
  static setAsConstructor( input0, input1, outputChannelCount0, outputChannelCount1 ) {
    super.setAsConstructor();
    InputsOutputs.setAsConstructor_self.call( this, input0, input1, outputChannelCount0, outputChannelCount1 );
    return this;
  }

  /** @override */
  static setAsConstructor_self( input0, input1, outputChannelCount0, outputChannelCount1 ) {

    if ( !( input0 instanceof ActivationEscaping.ScaleBoundsArray ) )
      throw Error( `BoundsArraySet.InputsOutputs.setAsConstructor(): `
        + `input0 ( ${input0} ) must exist and be an instance of class ActivationEscaping.ScaleBoundsArray.`
      );

    this.input0 = input0;

    if ( input1 ) {

      if ( !( input1 instanceof ActivationEscaping.ScaleBoundsArray ) )
        throw Error( `BoundsArraySet.InputsOutputs.setAsConstructor(): `
          + `input1 ( ${input1} ) must exist and be an instance of class ActivationEscaping.ScaleBoundsArray.`
        );

      this.input1 = input1;

    } else {
      if ( this.input1 )
        this.input1 = undefined;
    }

    // Determine outputs.
    //
    // Note: The .output0 will always be created, even if it is zero channel count.
    //
    if ( outputChannelCount0 >= 0 ) {
      if ( this.output0 )
        this.output0.length = outputChannelCount0;
      else
        this.output0 = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by( outputChannelCount0 );

      if ( outputChannelCount1 > 0 ) { // Two outputs.

        if ( this.output1 )
          this.output1.length = outputChannelCount1;
        else
          this.output1 = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by( outputChannelCount1 );

      // ( outputChannelCount1 <= 0 ), One output.
      } else {
        if ( this.output1 ) {
          this.output1.disposeResources_and_recycleToPool();
          this.output1 = null;
        }
      }

    } else { // ( outputChannelCount0 < 0 ), Illegal.

      throw Error( `BoundsArraySet.InputsOutputs.constructor(): `
        + `outputChannelCount0 ( ${outputChannelCount0} ) can not be negative (i.e. must >= 0).`
      );
    }
  }

  /**
   * The .input0 and .input1 will be set to null. The .output0 and .output1 will be recycled and then set to null.
   *
   * Sub-class should override this method (and call super.disposeResources() before return).
   *
   * @override
   */
  disposeResources() {

    // Because outputs are created by this BoundsArraySet, they should be released by this BoundsArraySet.
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

    // Because inputs are not created by this BoundsArraySet, they should not be released by this BoundsArraySet.
    {
      if ( this.input1 )
        this.input1 = null;

      if ( this.input0 )
        this.input0 = null;
    }

    super.disposeResources();
  }

  /**
   * @return {InputsOutputs}
   *   Return a newly created InputsOutputs which is a copy of this InputsOutputs. The .input0 (, .input1) will just past
   * to the newly created InputsOutputs (i.e. NOT copied). But the .output0 (, .output1) will be copied.
   */
  clone() {
    let result = InputsOutputs.Pool.get_or_create_by( this.input0, this.input1, this.outputChannelCount0, this.outputChannelCount1 );
    result.set_outputs_all_byBoundsArraySet( this );
    return result;
  }

  /**
   * Set all outputs (activationEscaping) .scaleArraySet to scale 1 (i.e. all are no scale).
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_activationEscaping_all_none() {
    this.output0.set_activationEscaping_all_none();
    this.output1?.set_activationEscaping_all_none();
    return this;
  }

  /**
   * Set all .output0 (and output1) to the same as the specified [ aLower, aUpper ]. Set their (activationEscaping)
   * this.scaleArraySet to default ( 1 ). The .input0 (and .input1) are not modified.
   *
   * @param {number} aLower  The new lower bound.
   * @param {number} aUpper  The new upper bound.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byLowerUpper( aLower, aUpper ) {
    this.output0.set_all_byLowerUpper( aLower, aUpper );
    this.output1?.set_all_byLowerUpper( aLower, aUpper );
    return this;
  }

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set all .output0 (and output1) to the same as the specified aBounds. Set their (activationEscaping) this.scaleArraySet
   * to default ( 1 ). The .input0 (and .input1) are not modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBounds( aBounds ) {
    this.output0.set_all_byBounds( aBounds );
    this.output1?.set_all_byBounds( aBounds );
    return this;
  }

  /**
   * @param {BoundsArray} outputBoundsArray
   *   The BoundsArray to be copied to .output0 (and .output1). Set their (activationEscaping) this.scaleArraySet
   * to default ( 1 ). The .input0 (and .input1) are not modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBoundsArray( outputBoundsArray ) {
    this.output0.set_all_byBoundsArray( outputBoundsArray );
    this.output1?.set_all_byBoundsArray( outputBoundsArray );
    return this;
  }

  /**
   * @param {ActivationEscaping.ScaleBoundsArray} aScaleBoundsArray
   *   The ScaleBoundsArray to be copied to .output0 (and .output1). The (activationEscaping) .scaleArraySet are also
   * copied. The .input0 (and .input1) are not modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byScaleBoundsArray( aScaleBoundsArray ) {
    this.output0.set_all_byScaleBoundsArray( aScaleBoundsArray );
    this.output1?.set_all_byScaleBoundsArray( aScaleBoundsArray );
    return this;
  }

  /**
   * Precondition:
   *   - ( this.output0.channelCount == aBoundsArraySet.output0.channelCount ) &&
   *   - ( this.output1.channelCount == aBoundsArraySet.output1.channelCount )
   *
   * This .input0 (and .input1) are not modified. But this .output0 (, .output1) will copy from aBoundsArraySet
   * (including (activationEscaping) .scaleArraySet).
   *
   *
   * @param {BoundsArraySet.InputsOutputs} aBoundsArraySet
   *   The BoundsArraySet to be copied.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBoundsArraySet_Outputs( aBoundsArraySet ) {
    this.output0.set_all_byScaleBoundsArray( aBoundsArraySet.output0 );
    this.output1?.set_all_byScaleBoundsArray( aBoundsArraySet.output1 );
    return this;
  }

  /**
   * Set .output0 (and .output1) by .input0 (including .activationEscaping_ScaleArraySet).
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_by_input0() {
    this.output0.set_all_byScaleBoundsArray( this.input0 );
    this.output1?.set_all_byScaleBoundsArray( this.input0 ); // Note: also use this.input0 (not this.input1).
    return this;
  }

  /**
   * Set .output0 (and .output1) by concatenating .input0 and .input1. The length of .output0 (and .output1 if exists) will be modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_by_concat_input0_input1() {
    this.output0.set_all_byScaleBoundsArray_concat_input0_input1( this.input0, this.input1 );
    this.output1?.set_all_byScaleBoundsArray( this.output0 ); // Note: the same as .output0.
    return this;
  }

  /**
   * Rearrange this.outputs[] channel information by interleaving as ( groupCount == 2 ). This channel count must be even
   * (i.e. divisible by 2).
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byInterleave_asGrouptTwo() {
    this.output0.set_all_byInterleave_asGrouptTwo();
    this.output1?.set_all_byInterleave_asGrouptTwo();
    return this;
  }

  /**
   * Set .output0 and .output1 by splitting .input0. If .output1 does not exist, it will be created. The length
   * of both .output0 and .output1 will be modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBoundsArray_split_input0() {

    if ( !this.output1 )
      this.output1 = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by(
        0 ); // Use ( channelCount == 0 ) temporarily. It will be adjusted later.

    this.input0.split_to_lowerHalf_higherHalf( this.output0, this.output1 );
    return this;
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
        return 0;
  }

  get inputChannelCount0() { return this.input0.length; }
  get inputChannelCount1() { return this.input1?.length ?? 0; }


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

  get outputChannelCount0() { return this.output0.length; }
  get outputChannelCount1() { return this.output1?.length ?? 0; }

}

