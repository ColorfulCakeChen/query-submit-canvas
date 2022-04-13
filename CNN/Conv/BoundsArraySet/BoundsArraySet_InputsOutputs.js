export { InputsOutputs };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ActivationEscaping from "../ActivationEscaping.js";

/**
 * Element value bounds (per channel) for inputs and outputs of an operation.
 *
 * The main purpose is to find out the activationEscaping_ScaleArraySet so that it can be used to let channel escape from
 * activation function's non-linear effect.
 *
 *
 *
 * @member {FloatValue.BoundsArray[]} inputs
 *   The element value bounds (per channel) of all inputs (i.e. the domain of the operation). This array (which is past into
 * constructor) will be kept (not cloned) directly. So caller should not modify them.
 *
 * @member {number} inputTensorCount
 *   How many input tensors (i.e. this.inputs.length).
 *
 * @member {FloatValue.BoundsArray} input0
 *   The element value bounds (per channel) of 1st input (i.e. this.inputs[ 0 ]).
 *
 * @member {FloatValue.BoundsArray} input1
 *   The element value bounds (per channel) of 2nd input (i.e. this.inputs[ 1 ]).
 *
 * @member {number} inputChannelCount0
 *   The channel count of 1st input (i.e. this.input0.length).
 *
 * @member {number} inputChannelCount1
 *   The channel count of 2nd input (i.e. this.input1.length).
 *
 * @member {FloatValue.BoundsArray[]} outputs
 *   The element value bounds (per channel) of all outputs (i.e. the range of the operation). The array is created by constructor
 * according to outputChannelCount0 and outputChannelCount1. 
 *
 * @member {number} outputTensorCount
 *   How many output tensors (i.e. this.outputs.length).
 *
 * @member {FloatValue.BoundsArray} output0
 *   The element value bounds (per channel) of 1st output (i.e. this.outputs[ 0 ]).
 *
 * @member {FloatValue.BoundsArray} output1
 *   The element value bounds (per channel) of 2nd output (i.e. this.outputs[ 1 ]).
 *
 * @member {number} outputChannelCount0
 *   The channel count of 1st output (i.e. this.output0.length).
 *
 * @member {number} outputChannelCount1
 *   The channel count of 2nd output (i.e. this.output1.length).
 *
 * @member {ActivationEscaping.ScaleArraySet} activationEscaping_ScaleArraySet
 *   The scales for moving this.afterBias bounds into the linear domain of the activation function. That is, for
 * letting this.afterBias escape from activation function's non-linear domain. And the .undo for undoing the scales.
 * Only output0 has this information.
 */
class InputsOutputs {

  /**
   */
  constructor( inputs, outputChannelCount0, outputChannelCount1 ) {
    this.inputs = inputs;

    // Determine outputs array.
    if ( outputChannelCount0 > 0 ) {
      if ( outputChannelCount1 > 0 ) { // Two outputs.
        this.outputs = [ new FloatValue.BoundsArray( outputChannelCount0 ), new FloatValue.BoundsArray( outputChannelCount1 ) ];

      } else { // ( outputChannelCount1 <= 0 ), One output.
        this.outputs = [ new FloatValue.BoundsArray( outputChannelCount0 ) ];
      }

    } else { // ( outputChannelCount0 <= 0 ), Illegal.

      tf.util.assert( ( ( outputChannelCount0 <= 0 ) && ( outputChannelCount1 <= 0 ) ),
        `BoundsArraySet.InputsOutputs.constructor(): `
          + `output0 must exist (i.e. outputChannelCount0 ( ${outputChannelCount0} ) must > 0 ).`
      );
    }

    this.activationEscaping_ScaleArraySet = new ActivationEscaping.ScaleArraySet( outputChannelCount0 );
  }

  /**
   * @return {InputsOutputs}
   *   Return a newly created InputsOutputs which is a copy of this InputsOutputs. The this.inputs will just past
   * to new InputsOutputs (i.e. NOT copied). But the this.outputs will be copied.
   */
  clone() {
    let result = new InputsOutputs( this.inputs, this.outputChannelCount0, this.outputChannelCount1 );
    result.set_outputs_all_byBoundsArraySet( this );
    return result;
  }

  /**
   * Set:
   *   - this.activationEscaping_ScaleArraySet to scale 1 (i.e. all are no scale).
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_activationEscaping_all_none() {
    this.activationEscaping_ScaleArraySet.set_all_byN( 1 );
    return this;
  }

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set all .outputs[] to the same as the specified aBounds. Set the this.activationEscaping_ScaleArraySet
   * to default ( 1 ). The .inputs[] are not modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBounds( aBounds ) {
    for ( let outTensorIndex = 0; outTensorIndex < this.outputs.length; ++outTensorIndex ) {
      this.outputs[ outTensorIndex ].set_all_byBounds( aBounds );
    }
    super.set_activationEscaping_all_none();
    return this;
  }

  /**
   * @param {BoundsArray} outputBoundsArray
   *   The BoundsArray to be copied to all .outputs[].
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBoundsArray( outputBoundsArray ) {
    for ( let outTensorIndex = 0; outTensorIndex < this.outputs.length; ++outTensorIndex ) {
      this.outputs[ outTensorIndex ].set_all_byBoundsArray( outputBoundsArray );
    }

//!!! ...unfinished... (2022/04/13)
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArraySet.activationEscaping_ScaleArraySet );

    return this;
  }

  /**
   * @param {BoundsArraySet.InputsOutputs} aBoundsArraySet
   *   The BoundsArraySet to be copied. Precondition: ( this.outputs.length == aBoundsArraySet.outputs.length ).
   *
   * @return {InputsOutputs}
   *   Return this (modified) object which is copied from aBoundsArraySet.
   */
  set_outputs_all_byBoundsArraySet( aBoundsArraySet ) {
    for ( let outTensorIndex = 0; outTensorIndex < this.outputs.length; ++outTensorIndex ) {
      this.outputs[ outTensorIndex ].set_outputs_all_byBoundsArray( aBoundsArraySet.outputs[ outTensorIndex ] );
    }

//!!! ...unfinished... (2022/04/13)
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArraySet.activationEscaping_ScaleArraySet );

    return this;
  }

  /**
   * Set .outputs[] by .input[ 0 ].
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBoundsArray_input0() {
    for ( let outTensorIndex = 0; outTensorIndex < this.outputs.length; ++outTensorIndex ) {
      this.outputs[ outTensorIndex ].set_all_byBoundsArray( this.input[ 0 ] );
    }

//!!! ...unfinished... (2022/04/13)
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArraySet.activationEscaping_ScaleArraySet );

    return this;
  }

  /**
   * Set .outputs[] by concatenating .input[ 0 ] and .input[ 1 ]. The length of .outputs[] will be modified.
   *
   * @return {InputsOutputs}
   *   Return this (modified) object.
   */
  set_outputs_all_byBoundsArray_concat_input0_input1() {
    let rLength = this.inputs[ 0 ].length + this.inputs[ 1 ].length;
    for ( let outTensorIndex = 0; outTensorIndex < this.outputs.length; ++outTensorIndex ) {
      this.outputs[ outTensorIndex ].length = rLength;
      this.outputs[ outTensorIndex ].set_all_byBoundsArray_concat_input0_input1( this.inputs[ 0 ], this.inputs[ 1 ] );
    }

//!!! ...unfinished... (2022/04/13)
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArraySet.activationEscaping_ScaleArraySet );

    return this;
  }

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

  get inputTensorCount() { return this.inputs.length; }

  get input0() { return this.inputs[ 0 ]; }
  get input1() { return this.inputs[ 1 ]; }

  get inputChannelCount0() { return this.input0.length; }
  get inputChannelCount1() { return this.input1.length; }


  get outputTensorCount() { return this.outputs.length; }

  get output0() { return this.outputs[ 0 ]; }
  get output1() { return this.outputs[ 1 ]; }

  get outputChannelCount0() { return this.output0.length; }
  get outputChannelCount1() { return this.output1.length; }

}

