export { InputsOutputs };

//import * as FloatValue from "../../Unpacker/FloatValue.js";
//import * as ActivationEscaping from "../ActivationEscaping.js";
import { BoundsArray_ActivationEscaping } from "./BoundsArray_ActivationEscaping.js";

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
 * @member {BoundsArray_ActivationEscaping} input0
 *   The element value bounds (per channel) of 1st input (can NOT null). It is the domain of the operation. It (from constructor)
 * will be kept (not cloned) directly. So caller should not modify them.
 *
 * @member {BoundsArray_ActivationEscaping} input1
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
 * @member {BoundsArray_ActivationEscaping} output0
 *   The element value bounds (per channel) of 1st output. It is the range of the operation). It is created by constructor
 * according to outputChannelCount0 (must be positive).
 *
 * @member {BoundsArray_ActivationEscaping} output1
 *   The element value bounds (per channel) of 2nd output. It is the range of the operation). It is created by constructor
 * according to outputChannelCount1 (if positive).
 *
 * @member {number} outputChannelCount0
 *   The channel count of 1st output (i.e. this.output0.channelCount).
 *
 * @member {number} inputChannelCount1
 *   The channel count of 2nd output (i.e. this.output1.channelCount).
 *
 * @member {ActivationEscaping.ScaleArraySet} activationEscaping_ScaleArraySet
 *   The scales for moving this.afterBias bounds into the linear domain of the activation function. That is, for
 * letting this.afterBias escape from activation function's non-linear domain. And the .undo for undoing the scales.
 * Only output0 has this information.
 */
class InputsOutputs {

  /**
   *
   * @param {number} outputChannelCount0
   *   The channel count of 1st output. (MUST positive)
   *
   * @param {number} outputChannelCount1
   *   The channel count of 2nd output. (If undefined or null or zero or negative, there will be no output1.)
   */
  constructor( input0, input1, outputChannelCount0, outputChannelCount1 ) {

    tf.util.assert( ( input0 instanceof BoundsArray_ActivationEscaping ),
      `BoundsArraySet.InputsOutputs.constructor(): `
        + `input0 ( ${input0} ) must exist and be an instance of class BoundsArray_ActivationEscaping.`
    );

    this.input0 = input0;

    if ( input1 )
      this.input1 = input1;

    // Determine outputs.
    if ( outputChannelCount0 > 0 ) {
      this.output0 = new BoundsArray_ActivationEscaping( outputChannelCount0 );

      if ( outputChannelCount1 > 0 ) { // Two outputs.
        this.output1 = new BoundsArray_ActivationEscaping( outputChannelCount1 );

      // ( outputChannelCount1 <= 0 ), One output.
      }

    } else { // ( outputChannelCount0 <= 0 ), Illegal.

      tf.util.assert( ( ( outputChannelCount0 <= 0 ) && ( outputChannelCount1 <= 0 ) ),
        `BoundsArraySet.InputsOutputs.constructor(): `
          + `output0 must exist (i.e. outputChannelCount0 ( ${outputChannelCount0} ) must > 0 ).`
      );
    }
  }

  /**
   * @return {InputsOutputs}
   *   Return a newly created InputsOutputs which is a copy of this InputsOutputs. The .input0 (, .input1) will just past
   * to new InputsOutputs (i.e. NOT copied). But the .output0 (, .output1) will be copied.
   */
  clone() {
    let result = new InputsOutputs( this.input0, this.input1, this.outputChannelCount0, this.outputChannelCount1 );
    result.set_outputs_all_byBoundsArraySet( this );
    return result;
  }

  /**
   * Set all outputs .activationEscaping_ScaleArraySet to scale 1 (i.e. all are no scale).
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
   * @param {FloatValue.Bounds} aBounds
   *   Set all .output0 (and output1) to the same as the specified aBounds. Set their this.activationEscaping_ScaleArraySet
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
   *   The BoundsArray to be copied to .output0 (and .output1). Set their this.activationEscaping_ScaleArraySet
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
   * @param {BoundsArray_ActivationEscaping} outputBoundsArray_ActivationEscaping
   *   The BoundsArray_ActivationEscaping to be copied to .output0 (and .output1). The .activationEscaping_ScaleArraySet are also
   * copied. The .input0 (and .input1) are not modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBoundsArray_ActivationEscaping( outputBoundsArray_ActivationEscaping ) {
    this.output0.set_all_byBoundsArray_ActivationEscaping( outputBoundsArray_ActivationEscaping );
    this.output1?.set_all_byBoundsArray_ActivationEscaping( outputBoundsArray_ActivationEscaping );
    return this;
  }

  /**
   * @param {BoundsArraySet.InputsOutputs} aBoundsArraySet
   *   The BoundsArraySet to be copied. Precondition: ( this.output0.channelCount == aBoundsArraySet.output0.channelCount )
   * && ( this.output1.channelCount == aBoundsArraySet.output1.channelCount ).
   *
   * @return {InputsOutputs}
   *   Return this (modified) object which is copied from aBoundsArraySet. The .input0 (, .input1) will just past
   * to new InputsOutputs (i.e. NOT copied). But the .output0 (, .output1) will be copied (including ActivationEscaping).
   */
  set_outputs_all_byBoundsArraySet( aBoundsArraySet ) {
    this.output0.set_all_byBoundsArray_ActivationEscaping( aBoundsArraySet.output0 );
    this.output1?.set_all_byBoundsArray_ActivationEscaping( aBoundsArraySet.output1 );
    return this;
  }

  /**
   * Set .output0 (and .output1) by .input0. But their this.activationEscaping_ScaleArraySet are set to default ( 1 ) (i.e. NOT copied
   * from .input0).
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_by_input0() {
    this.output0.set_all_byBoundsArray( this.input0.boundsArray );
    this.output1?.set_all_byBoundsArray( this.input0.boundsArray ); // Note: also use this.input0 (not this.input1).
    return this;
  }

  /**
   * Set .outputs[] by concatenating .input[ 0 ] and .input[ 1 ]. The length of .outputs[] will be modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_by_concat_input0_input1() {

//!!! ...unfinished... (2022/04/13)

    let totalChannelCount = this.inputChannelCount0 + this.inputChannelCount1;
    this.output0.channelCount = totalChannelCount;
    this.output0.set_all_byBoundsArray_concat_input0_input1( this.inputs[ 0 ], this.inputs[ 1 ] );
    }

//!!! ...unfinished... (2022/04/13)
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArraySet.activationEscaping_ScaleArraySet );

    return this;
  }

//!!! ...unfinished... (2022/04/13)

  /**
   * Set .outputs[ 0 ] and .outputs[ 1 ] by splitting .input[ 0 ]. If .outputs[ 1 ] does not exist, it will be created. The length
   * of both .outputs[ 0 ] and .outputs[ 1 ] will be modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBoundsArray_split_input0() {

    if ( !this.outputs[ 1 ] )
      this.outputs[ 1 ] = new FloatValue.BoundsArray( 0 );

    this.inputs[ 0 ].split_to_lowerHalf_higherHalf( this.outputs[ 0 ], this.outputs[ 1 ] );

//!!! ...unfinished... (2022/04/13)
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArraySet.activationEscaping_ScaleArraySet );

    return this;
  }

  /**
   * Rearrange this.outputs[] channel information by interleaving as ( groupCount == 2 ). This channel count must be even
   * (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements temporarily. Provide this array could reduce memory re-allocation
   * and improve performance.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byInterleave_asGrouptTwo( arrayTemp ) {
    for ( let outTensorIndex = 0; outTensorIndex < this.outputs.length; ++outTensorIndex ) {
      this.outputs[ outTensorIndex ].interleave_asGrouptTwo( arrayTemp );
    }

//!!! ...unfinished... (2022/04/13)
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArraySet.activationEscaping_ScaleArraySet );

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

