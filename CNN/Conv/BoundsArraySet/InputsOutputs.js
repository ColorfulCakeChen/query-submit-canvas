export { InputsOutputs };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as Weights from "../../Unpacker/Weights.js";

/**
 * Element value bounds (per channel) for inputs and outputs of an operation.
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
  }

  /**
   * @return {BoundsArraySet.InputsOutputs}
   *   Return a newly created BoundsArraySet.InputsOutputs which is a copy of this BoundsArraySet.InputsOutputs. The this.inputs
   * will just past to new InputsOutputs (i.e. NOT copied). The this.outputs will be copied.
   */
  clone() {
    let result = new InputsOutputs( this.inputs, this.outputChannelCount0, this.outputChannelCount1 );

//!!! ...unfinished... (2022/04/11)
    result.set_byBoundsArraySet( this );
    return result;
  }

//!!! ...unfinished... (2022/04/11)

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set all BoundsArray to the same as the specified aBounds. Set the this.activationEscaping_ScaleArraySet to default ( 1 );
   *
   * @return {BoundsArraySet}
   *   Return this (modified) object.
   */
  set_all_byBounds( aBounds ) {
    this.input.set_all_byBounds( aBounds );
    this.afterUndoPreviousActivationEscaping.set_all_byBounds( aBounds );
    this.afterFilter.set_all_byBounds( aBounds );
    this.afterBias.set_all_byBounds( aBounds );
    this.afterActivationEscaping.set_all_byBounds( aBounds );
    this.afterActivation.set_all_byBounds( aBounds );
    this.set_all_activationEscaping_bPassThrough_none();
    return this;
  }

  /**
   * @param {BoundsArray} inputBoundsArray
   *   The BoundsArray to be copied to .input and .afterUndoPreviousActivationEscaping.
   *
   * @param {BoundsArray} outputBoundsArray
   *   The BoundsArray to be copied to .afterFilter, .afterBias, .afterActivationEscaping, .afterActivation.
   *
   * @return {BoundsArraySet}
   *   Return this (modified) object.
   */
  set_all_byBoundsArray_input_output( inputBoundsArray, outputBoundsArray ) {
    this.input                              .set_all_byBoundsArray( inputBoundsArray );
    this.output                    .set_all_byBoundsArray( outputBoundsArray );
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   The BoundsArray to be copied. It will be copied to all BoundsArray in this object.
   *
   * @return {BoundsArraySet}
   *   Return this (modified) object.
   */
  set_all_byBoundsArray( aBoundsArray ) {
    return this.set_all_byBoundsArray_input_output( aBoundsArray, aBoundsArray );
  }

  /**
   * @param {BoundsArray} inputBoundsArray0
   *   The BoundsArray of the 1st input.
   *
   * @param {BoundsArray} inputBoundsArray1
   *   The BoundsArray of the 2nd input.
   *
   * @return {BoundsArraySet}
   *   Return a newly created object.
   */
  static create_byBoundsArray_concat_input0_input1( inputBoundsArray0, inputBoundsArray1 ) {
    let rLength = inputBoundsArray0.length + inputBoundsArray1.length;
    let rBoundsArraySet = new InputsOutputs( rLength, rLength );

    // Concat value bounds array.
    rBoundsArraySet.input.set_all_byBoundsArray_concat_input0_input1( inputBoundsArray0, inputBoundsArray1 );

    // Spread to all value bounds array.
    return rBoundsArraySet.set_all_byBoundsArray_input_output( rBoundsArraySet.input, rBoundsArraySet.input );
  }

  /**
   * @param {BoundsArraySet.InputsOutputs} aBoundsArraySet
   *   The BoundsArraySet to be copied.
   *
   * @return {BoundsArraySet}
   *   Return this (modified) object which is copied from aBoundsArraySet.
   */
  set_all_byBoundsArraySet( aBoundsArraySet ) {
    this.input                              .set_all_byBoundsArray( aBoundsArraySet.input );
    this.afterUndoPreviousActivationEscaping.set_all_byBoundsArray( aBoundsArraySet.afterUndoPreviousActivationEscaping );
    this.afterFilter                        .set_all_byBoundsArray( aBoundsArraySet.afterFilter );
    this.afterBias                          .set_all_byBoundsArray( aBoundsArraySet.afterBias );
    this.afterActivationEscaping            .set_all_byBoundsArray( aBoundsArraySet.afterActivationEscaping );
    this.afterActivation                    .set_all_byBoundsArray( aBoundsArraySet.afterActivation );
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArraySet.activationEscaping_ScaleArraySet );

    for ( let i = 0; i < this.bPassThrough.length; ++i ) {
      this.bPassThrough[ i ] = aBoundsArraySet.bPassThrough[ i ];
    }

    return this;
  }

  /**
   * Determine .activationEscaping_ScaleArraySet and .afterActivationEscaping and .afterActivation, by .afterBias and .bPassThrough and nActivationId.
   *
   * The following properties will be used:
   *   - this.afterBias
   *   - this.bPassThrough
   *
   * The following properties will be modified:
   *   - this.activationEscaping_ScaleArraySet
   *   - this.afterActivationEscaping
   *   - this.afterActivation
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of this depthwise convolution.
   *
   * @return {BoundsArraySet}
   *   Return this (modified) object.
   */
  set_activationEscaping_afterActivationEscaping_afterActivation_by_afterBias_bPassThrough_nActivationId( nActivationId ) {
    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );

    for ( let outChannel = 0; outChannel < this.afterBias.length; ++outChannel ) {

      // 1. Determine .activationEscaping_ScaleArraySet
      {
        // 1.1 Determine .do

        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {

          // Since no activation function, no need to escape. (i.e. scale = 1 for no scale)
          this.activationEscaping_ScaleArraySet.do.set_one_byN( outChannel, 1 );

        } else {

          if ( this.bPassThrough[ outChannel ] ) { // For pass-through half channels.

            // Calculate the scale for escaping bias result from activation function's non-linear domain into linear domain.
            //
            // Note: This does not work for avg/max pooling.
            this.activationEscaping_ScaleArraySet.do.set_one_by_fromLowerUpper_toLowerUpper( outChannel,
              this.afterBias.lowers[ outChannel ], this.afterBias.uppers[ outChannel ],
              theActivationFunctionInfo.inputDomainLinear.lower, theActivationFunctionInfo.inputDomainLinear.upper
            );

            let doEscapingScale = this.activationEscaping_ScaleArraySet.do.scales[ outChannel ];
            tf.util.assert( ( Number.isNaN( doEscapingScale ) == false ),
              `ConvBiasActivation.BoundsArraySet.`
                + `set_activationEscaping_afterActivationEscaping_afterActivation_by_afterBias_bPassThrough_nActivationId(): `
                + `this.activationEscaping_ScaleArraySet.do.scales[ ${outChannel} ] ( ${doEscapingScale} ) `
                + `should not be NaN. `
                + `Please use activation function (e.g. tanh()) which has both negative and positive parts near origin point.`
            );

          } else { // Non pass-through half channels.
            // Since non-pass-through, no need to escape. (i.e. scale = 1 for no scale)
            this.activationEscaping_ScaleArraySet.do.set_one_byN( outChannel, 1 );
          }
        }

        // 1.2 Determine .undo (Prepared for the next convolution-bias-activation. Not for this.)
        this.activationEscaping_ScaleArraySet.undo.set_one_byUndo_ScaleArray(
          outChannel, this.activationEscaping_ScaleArraySet.do, outChannel );
      }

      // 2. Determine .afterActivationEscaping
      this.afterActivationEscaping
        .set_one_byBoundsArray( outChannel, this.afterBias, outChannel )
        .multiply_one_byNs( outChannel, this.activationEscaping_ScaleArraySet.do.scales, outChannel );

      // 3. Determine .afterActivation
      {
        // If no activation function, the output range is determined by .afterActivationEscaping.
        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
          this.afterActivation.set_one_byBoundsArray( outChannel, this.afterActivationEscaping, outChannel )

        // Otherwise, the activation function dominates the output range.
        //
        // Note: Consider the implementation of ScaleArray.set_one_by_fromLowerUpper_toLowerUpper(), they are all not so good no
        //       matter using set_one_byXxx() or clamp_one_byXxx() of this.afterActivation. However, when using clamp_one_byXxx(),
        //       even if the activation function output range has Infinity (e.g. RELU is [ 0, +Infinity ]), the result bounds
        //       is more feasible (at least, will not become another bounds with Infinity).
        } else {
          if ( this.bPassThrough[ outChannel ] ) { // For pass-through half channels, it is clamped by the output range for linearDomainLinear.
            //this.afterActivation.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRangeLinear );
            this.afterActivation.clamp_one_byBounds( outChannel, theActivationFunctionInfo.outputRangeLinear );

          } else { // Non pass-through half channels, it is clamped by the output range for the whole input domain.
            //this.afterActivation.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
            this.afterActivation.clamp_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
          }
        }
      }
    }

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

