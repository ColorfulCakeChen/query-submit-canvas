export { ConvBiasActivation };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { InputsOutputs } from "./BoundsArraySet_InputsOutputs.js";

/**
 * Element value bounds (per channel) for every operation's result of a convolution-bias-activation. The main purpose is to find out the
 * activationEscaping_ScaleArraySet so that it can be used to let channel escape from activation function's non-linear effect.
 *
 *   - Only input0 is used. The input1 always is undefined.
 *   - Only outputChannelCount0 is used. The outputChannelCount1 always is undefined.
 *
 * @member {FloatValue.BoundsArray} afterUndoPreviousActivationEscaping
 *   The element value bounds (per channel) after applying the input0.scaleArraySet.undo to this.input0. (i.e. beforeFilter)
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
 * the this.output0.boundsArray (without this.output0.scaleArraySet).
 *
 * @member {boolean[]} bPassThrough
 *   If true for a output channel, the output channel should be arranged to pass-through from input to output.
 *
 * @see InputsOutputs
 */
class ConvBiasActivation extends InputsOutputs {

  /**
   *   - The .input0 will be set as input0.
   *   - The .afterUndoPreviousActivationEscaping will be set according to  input0 and input0.scaleArraySet.undo.scales.
   *
   * Difference from (parent class) InputsOutputs:
   *   - Only input0 (always no input1), because convolution (no matter pointwise or depthwise) could handle one input tensor.
   *   - Only output0 (always no output1), because convolution (no matter pointwise or depthwise) always generate one output tensor.
   *
   */
  constructor( input0, outputChannelCount0 ) {
    super( input0, undefined, outputChannelCount0, undefined ); // .input0 and .output0

    this.afterUndoPreviousActivationEscaping = new FloatValue.BoundsArray( input0.length ); // channel count same as input0.

    this.afterFilter = new FloatValue.BoundsArray( outputChannelCount0 );
    this.afterBias = new FloatValue.BoundsArray( outputChannelCount0 );
    this.afterActivationEscaping = new FloatValue.BoundsArray( outputChannelCount0 );

    this.bPassThrough = new Array( outputChannelCount0 );

    this.set_afterUndoPreviousActivationEscaping_by_input0_undoScales();
  }

  /**
   * Set .afterUndoPreviousActivationEscaping as .input0 multiplying .input0.scaleArraySet.undo.scales.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_afterUndoPreviousActivationEscaping_by_input0_undoScales() {
    this.afterUndoPreviousActivationEscaping
      .set_all_byBoundsArray( this.input0.boundsArray )
      .multiply_all_byNs( this.input0.scaleArraySet.undo.scales );
    return this;
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
   *   Set all outputs related BoundsArray (.afterFilter, .afterBias, .afterActivationEscaping, .output0.boundsArray
   * (i.e. .afterActivation), .bPassThrough) to the same as the specified aBounds. Set the this.output0.scaleArraySet
   * to default ( 1 ). The .input0 are not modified.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_outputs_all_byBounds( aBounds ) {
    this.afterFilter.set_all_byBounds( aBounds );
    this.afterBias.set_all_byBounds( aBounds );
    this.afterActivationEscaping.set_all_byBounds( aBounds );
    super.set_outputs_all_byBounds( aBounds ); // i.e. .output0.boundsArray (i.e. .afterActivation), .output0.scaleArraySet
    this.set_bPassThrough_all_none();
    return this;
  }

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

    // .output0.boundsArray (i.e. .afterActivation), .output0.scaleArraySet, .output1.boundsArray, .output1.scaleArraySet
    super.set_outputs_all_byBoundsArraySet( aBoundsArraySet );

    for ( let i = 0; i < this.bPassThrough.length; ++i ) {
      this.bPassThrough[ i ] = aBoundsArraySet.bPassThrough[ i ];
    }

    return this;
  }

  /**
   * Determine .afterActivationEscaping, .output0.boundsArray (i.e. .afterActivation) and .output0.scaleArraySet,
   * by .afterBias and .bPassThrough and nActivationId.
   *
   * The following properties will be used:
   *   - this.afterBias
   *   - this.bPassThrough
   *
   * The following properties will be modified:
   *   - this.afterActivationEscaping
   *   - this.output0.boundsArray (i.e. this.afterActivation)
   *   - this.output0.scaleArraySet
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of this convolution.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_afterActivationEscaping_output0_by_afterBias_bPassThrough_nActivationId( nActivationId ) {
    const theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );

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
              `BoundsArraySet.ConvBiasActivation.`
                + `set_afterActivationEscaping_output0_by_afterBias_bPassThrough_nActivationId( `
                  + ` ${ValueDesc.ActivationFunction.Singleton.getStringOf( nActivationId )}(${nActivationId}) ): `
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
        this.output0.scaleArraySet.undo.set_one_byUndo_ScaleArray( outChannel, this.output0.scaleArraySet.do, outChannel );
      }

      // 2. Determine .afterActivationEscaping
      this.afterActivationEscaping
        .set_one_byBoundsArray( outChannel, this.afterBias, outChannel )
        .multiply_one_byNs( outChannel, this.output0.scaleArraySet.do.scales, outChannel );

//!!! ...unfinished... (2022/04/25)
// Since .afterActivationEscaping has already multiplied the .output0.scaleArraySet.do.scales,
// it has already been the clamped value (i.e. already inside the theActivationFunctionInfo.outputRangeLinear.
//
// That is, .afterActivation (i.e. .output0.boundsArray) should be the same as .afterActivationEscaping.
// So, the .afterActivationEscaping should be deprecated.
//

//!!! ...unfinished... (2022/04/25)
// The above description is WRONG!
//
// The .afterActivation (i.e. .output0.boundsArray) should be generated by applying theActivationFunctionInfo.pfn()
// to .afterActivationEscaping no matter whether is .bPassThrough[].
//
//

//!!! (2022/04/25 Remarked)
//
// The .afterActivation (i.e. .output0.boundsArray) should be generated by applying theActivationFunctionInfo.pfn()
// to .afterActivationEscaping no matter whether is .bPassThrough[].
//
//       // 3. Determine .afterActivation (i.e. .output0.boundsArray)
//       {
//         this.output0.boundsArray.set_one_byBoundsArray( outChannel, this.afterActivationEscaping, outChannel );
//
//         // If there is activation function, the activation function dominates the output range.
//         //
//         // Note: Consider the implementation of ScaleArray.set_one_by_fromLowerUpper_toLowerUpper(), they are all not so good no
//         //       matter using set_one_byXxx() or clamp_one_byXxx() of this.afterActivation. However, when using clamp_one_byXxx(),
//         //       even if the activation function output range has Infinity (e.g. RELU is [ 0, +Infinity ]), the result's bounds
//         //       is more feasible (at least, will not become another bounds with Infinity).
//         if ( nActivationId != ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
//
//           if ( this.bPassThrough[ outChannel ] ) { // For pass-through half channels, it is clamped by the output range for linearDomainLinear.
//             //this.output0.boundsArray.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRangeLinear );
//             this.output0.boundsArray.clamp_one_byBounds( outChannel, theActivationFunctionInfo.outputRangeLinear );
//
//           } else { // Non pass-through half channels, it is clamped by the output range for the whole input domain.
//             //this.output0.boundsArray.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
//             this.output0.boundsArray.clamp_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
//           }
//
//         // Otherwise, no activation function, the output range is determined by .afterActivationEscaping.
//         }
//       }

    }

    // 3. Determine .afterActivation (i.e. .output0.boundsArray)
    this.output0.boundsArray.set_all_byBoundsArray_activation( this.afterActivationEscaping, nActivationId );

    return this;
  }

  /**
   * Rearrange output related channel information (.afterFilter, .afterBias, .afterActivationEscaping, .afterActivation
   * (i.e. .output0.boundsArray), output0.scaleArraySet (i.e. activationEscaping), .bPassThrough) by interleaving as
   * ( groupCount == 2 ). The channel count must be even (i.e. divisible by 2).
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
    return this.output0.boundsArray;
  }

}

