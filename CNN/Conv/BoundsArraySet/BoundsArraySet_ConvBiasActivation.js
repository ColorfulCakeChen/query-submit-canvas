export { ConvBiasActivation };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as Weights from "../../Unpacker/Weights.js";
import { InputsOutputs } from "./BoundsArraySet_InputsOutputs.js";

/**
 * Element value bounds (per channel) for every operation's result of a convolution-bias-activation. The main purpose is to find out the
 * activationEscaping_ScaleArraySet so that it can be used to let channel escape from activation function's non-linear effect.
 *
 *
 * @member {FloatValue.BoundsArray} afterUndoPreviousActivationEscaping
 *   The element value bounds (per channel) after applying the previousConvBiasActivation.BoundsArraySet.ActivationEscaping.undo
 * to this.input0. (i.e. beforeFilter)
 *
 * @member {FloatValue.BoundsArray} afterFilter
 *   The element value bounds (per channel) after applying the convolution filters to this.afterUndoPreviousActivationEscaping.
 * (i.e. beforeBias)
 *
 * @member {FloatValue.BoundsArray} afterBias
 *   The element value bounds (per channel) after applying the convolution biases to this.afterFilter. (i.e. beforeActivationEscaping)
 *
 * @member {FloatValue.BoundsArray} afterActivationEscaping
 *   The element value bounds (per channel) after applying this.activationEscaping_ScaleArraySet.do to this.afterBias. (i.e. beforeActivation)
 *
 * @member {FloatValue.BoundsArray} afterActivation
 *   The element value bounds (per channel) after applying activation function to this.afterActivationEscaping. It is just
 * the this.output0.
 *
 * @member {boolean[]} bPassThrough
 *   If true for a output channel, the output channel should be arranged to pass-through from input to output.
 *
 * @see InputsOutputs
 */
class ConvBiasActivation extends InputsOutputs {

  /**
   * Difference from (parent class) InputsOutputs:
   *   - Only input0 (always no input1), because convolution (no matter pointwise or depthwise) could handle one input tensor.
   *   - Only output0 (always no output1), because convolution (no matter pointwise or depthwise) always generate one output tensor.
   *
   */
  constructor( input0, outputChannelCount0 ) {
    super( input0, undefined, outputChannelCount0, undefined ); // input0 and .output0 (i.e. .afterActivation)

    this.afterUndoPreviousActivationEscaping = new FloatValue.BoundsArray( input0.length ); // channel count same as input0.

    this.afterFilter = new FloatValue.BoundsArray( outputChannelCount0 );
    this.afterBias = new FloatValue.BoundsArray( outputChannelCount0 );
    this.afterActivationEscaping = new FloatValue.BoundsArray( outputChannelCount0 );

    this.bPassThrough = new Array( outputChannelCount );

    //this.set_outputs_all_byBounds( Weights.Base.ValueBounds );
  }

  /**
   * @return {ConvBiasActivation}
   *   Return a newly created ConvBiasActivation which is a copy of this ConvBiasActivation. The this.inputs will just past
   * to new ConvBiasActivation (i.e. NOT copied). But the other data members will be copied.
   */
  clone() {
    let result = new ConvBiasActivation( this.input0, this.outputChannelCount0 );
    result.set_all_byBoundsArraySet( this );
    return result;
  }

  /**
   * Set:
   *   - this.bPassThrough[] to false (i.e. all are not pass-through).
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_bPassThrough_all_none() {
    this.bPassThrough.fill( false );
    return this;
  }

  /**
   * Set:
   *   - this.activationEscaping_ScaleArraySet to scale 1 (i.e. all are no scale).
   *   - this.bPassThrough[] to false (i.e. all are not pass-through).
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_activationEscaping_bPassThrough_all_none() {
    super.set_activationEscaping_all_none();
    this.set_bPassThrough_all_none();
    return this;
  }

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set all outputs related BoundsArray (.afterFilter, .afterBias, .afterActivationEscaping, .output (i.e. .afterActivation),
   * .bPassThrough) to the same as the specified aBounds. Set the this.activationEscaping_ScaleArraySet
   * to default ( 1 ). The .input0 are not modified.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_outputs_all_byBounds( aBounds ) {
    this.afterFilter.set_all_byBounds( aBounds );
    this.afterBias.set_all_byBounds( aBounds );
    this.afterActivationEscaping.set_all_byBounds( aBounds );
    super.set_outputs_all_byBounds( aBounds ); // i.e. this.afterActivation, this.activationEscaping_ScaleArraySet
    this.set_bPassThrough_all_none();
    return this;
  }

//!!! ...unfinished... (2022/04/11)
//!!! (2022/04/11 Remarked)
//   /**
//    * @param {BoundsArray} inputBoundsArray
//    *   The BoundsArray to be copied to .input and .afterUndoPreviousActivationEscaping.
//    *
//    * @param {BoundsArray} outputBoundsArray
//    *   The BoundsArray to be copied to .afterFilter, .afterBias, .afterActivationEscaping, .afterActivation.
//    *
//    * @return {BoundsArraySet}
//    *   Return this (modified) object.
//    */
//   set_all_byBoundsArray_input_output( inputBoundsArray, outputBoundsArray ) {
//     this.input                              .set_all_byBoundsArray( inputBoundsArray );
//     this.afterUndoPreviousActivationEscaping.set_all_byBoundsArray( inputBoundsArray );
//     this.afterFilter                        .set_all_byBoundsArray( outputBoundsArray );
//     this.afterBias                          .set_all_byBoundsArray( outputBoundsArray );
//     this.afterActivationEscaping            .set_all_byBoundsArray( outputBoundsArray );
//     //this.afterActivation                    .set_all_byBoundsArray( outputBoundsArray );
//     ??this.set_activationEscaping_bPassThrough_all_none();
//     return this;
//   }

//!!! ...unfinished... (2022/04/11)
//!!! (2022/04/11 Remarked)
//   /**
//    * @param {BoundsArray} aBoundsArray
//    *   The BoundsArray to be copied. It will be copied to all BoundsArray in this object.
//    *
//    * @return {BoundsArraySet}
//    *   Return this (modified) object.
//    */
//   set_all_byBoundsArray( aBoundsArray ) {
//     return this.set_all_byBoundsArray_input_output( aBoundsArray, aBoundsArray );
//   }

//!!! ...unfinished... (2022/04/11)
//!!! (2022/04/11 Remarked)
//   /**
//    * @param {BoundsArray} inputBoundsArray0
//    *   The BoundsArray of the 1st input.
//    *
//    * @param {BoundsArray} inputBoundsArray1
//    *   The BoundsArray of the 2nd input.
//    *
//    * @return {BoundsArraySet}
//    *   Return a newly created object.
//    */
//   static create_byBoundsArray_concat_input0_input1( inputBoundsArray0, inputBoundsArray1 ) {
//     let rLength = inputBoundsArray0.length + inputBoundsArray1.length;
//     let rBoundsArraySet = new BoundsArraySet( rLength, rLength );
//
//     // Concat value bounds array.
//     rBoundsArraySet.input.set_all_byBoundsArray_concat_input0_input1( inputBoundsArray0, inputBoundsArray1 );
//
//     // Spread to all value bounds array.
//     return rBoundsArraySet.set_all_byBoundsArray_input_output( rBoundsArraySet.input, rBoundsArraySet.input );
//   }

  /**
   * @param {BoundsArraySet.ConvBiasActivation} aBoundsArraySet
   *   The BoundsArraySet to be copied. The .inputs will just be referenced (NOT copied). But the other data members will be copied.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object which is copied from aBoundsArraySet.
   */
  set_all_byBoundsArraySet( aBoundsArraySet ) {

    // inputs. Non-copy. Just reference to the same inputs.
    {
      this.input0 = aBoundsArraySet.input0;

      if ( aBoundsArraySet.input1 )
        this.input1 = aBoundsArraySet.input1;
      else
        delete this.input1;
    }

    this.afterUndoPreviousActivationEscaping.set_all_byBoundsArray( aBoundsArraySet.afterUndoPreviousActivationEscaping );
    this.afterFilter                        .set_all_byBoundsArray( aBoundsArraySet.afterFilter );
    this.afterBias                          .set_all_byBoundsArray( aBoundsArraySet.afterBias );
    this.afterActivationEscaping            .set_all_byBoundsArray( aBoundsArraySet.afterActivationEscaping );

    super.set_outputs_all_byBoundsArraySet( aBoundsArraySet ); // .afterActivation (i.e. .output0 (and .output1))
   
    for ( let i = 0; i < this.bPassThrough.length; ++i ) {
      this.bPassThrough[ i ] = aBoundsArraySet.bPassThrough[ i ];
    }

    return this;
  }

  /**
   * Determine .afterActivationEscaping and .afterActivation (including (activationEscaping) .scaleArraySet), by .afterBias and
   * .bPassThrough and nActivationId.
   *
   * The following properties will be used:
   *   - this.afterBias
   *   - this.bPassThrough
   *
   * The following properties will be modified:
   *   - this.afterActivationEscaping
   *   - this.afterActivation (i.e. output0, including (activationEscaping) .scaleArraySet)
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of this depthwise convolution.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_afterActivationEscaping_afterActivation_by_afterBias_bPassThrough_nActivationId( nActivationId ) {
    let theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );

    for ( let outChannel = 0; outChannel < this.afterBias.length; ++outChannel ) {

      // 1. Determine (activationEscaping) .scaleArraySet (of .output0)
      {
        // 1.1 Determine .do

        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {

          // Since no activation function, no need to escape. (i.e. scale = 1 for no scale)
          this.output0.scaleArraySet.do.set_one_byN( outChannel, 1 );

        } else {

          if ( this.bPassThrough[ outChannel ] ) { // For pass-through half channels.

            // Calculate the scale for escaping bias result from activation function's non-linear domain into linear domain.
            //
            // Note: This does not work for avg/max pooling.
            this.output0.scaleArraySet.do.set_one_by_fromLowerUpper_toLowerUpper( outChannel,
              this.afterBias.lowers[ outChannel ], this.afterBias.uppers[ outChannel ],
              theActivationFunctionInfo.inputDomainLinear.lower, theActivationFunctionInfo.inputDomainLinear.upper
            );

            let doEscapingScale = this.output0.scaleArraySet.do.scales[ outChannel ];
            tf.util.assert( ( Number.isNaN( doEscapingScale ) == false ),
              `ConvBiasActivation.BoundsArraySet.`
                + `set_afterActivationEscaping_afterActivation_by_afterBias_bPassThrough_nActivationId(): `
                + `this.output0.scaleArraySet.do.scales[ ${outChannel} ] ( ${doEscapingScale} ) `
                + `should not be NaN. `
                + `Please use activation function (e.g. tanh()) which has both negative and positive parts near origin point.`
            );

          } else { // Non pass-through half channels.
            // Since non-pass-through, no need to escape. (i.e. scale = 1 for no scale)
            this.output0.scaleArraySet.do.set_one_byN( outChannel, 1 );
          }
        }

        // 1.2 Determine .undo (Prepared for the next convolution-bias-activation. Not for this.)
        this.output0.scaleArraySet.undo.set_one_byUndo_ScaleArray(
          outChannel, this.output0.scaleArraySet.do, outChannel );
      }

      // 2. Determine .afterActivationEscaping
      this.afterActivationEscaping
        .set_one_byBoundsArray( outChannel, this.afterBias, outChannel )
        .multiply_one_byNs( outChannel, this.output0.scaleArraySet.do.scales, outChannel );

      // 3. Determine .afterActivation (i.e. .output0)
      {
        // If no activation function, the output range is determined by .afterActivationEscaping.
        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
          this.output0.set_one_byBoundsArray( outChannel, this.afterActivationEscaping, outChannel )

        // Otherwise, the activation function dominates the output range.
        //
        // Note: Consider the implementation of ScaleArray.set_one_by_fromLowerUpper_toLowerUpper(), they are all not so good no
        //       matter using set_one_byXxx() or clamp_one_byXxx() of this.afterActivation. However, when using clamp_one_byXxx(),
        //       even if the activation function output range has Infinity (e.g. RELU is [ 0, +Infinity ]), the result bounds
        //       is more feasible (at least, will not become another bounds with Infinity).
        } else {
          if ( this.bPassThrough[ outChannel ] ) { // For pass-through half channels, it is clamped by the output range for linearDomainLinear.
            //this.output0.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRangeLinear );
            this.output0.clamp_one_byBounds( outChannel, theActivationFunctionInfo.outputRangeLinear );

          } else { // Non pass-through half channels, it is clamped by the output range for the whole input domain.
            //this.output0.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
            this.output0.clamp_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
          }
        }
      }
    }

    return this;
  }

  /**
   * Rearrange output related channel information (.afterFilter, .afterBias, .afterActivationEscaping, .afterActivation
   * (i.e. output0, including (activationEscaping) .scaleArraySet), .bPassThrough) by interleaving as ( groupCount == 2 ).
   * The channel count must be even (i.e. divisible by 2).
   *
   * @param {Array} arrayTemp
   *   A temporary array for placing the original elements temporarily. Provide this array could reduce memory re-allocation
   * and improve performance.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_outputs_all_byInterleave_asGrouptTwo( arrayTemp ) {
    this.afterFilter.set_all_byInterleave_asGrouptTwo( arrayTemp );
    this.afterBias.set_all_byInterleave_asGrouptTwo( arrayTemp );
    this.afterActivationEscaping.set_all_byInterleave_asGrouptTwo( arrayTemp );
    super.set_outputs_all_byInterleave_asGrouptTwo( arrayTemp ); // i.e. this.afterActivation
    FloatValue.ArrayInterleaver.interleave_asGrouptTwo( this.bPassThrough, 0, this.bPassThrough.length, arrayTemp );
    return this;
  }

  get afterActivation() {
    return this.output0;
  }

}

