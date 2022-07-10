export { ConvBiasActivation };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
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
 * @member {FloatValue.BoundsArray} afterActivation
 *   The element value bounds (per channel) after applying activation function to this.afterBias. It is just
 * the this.output0.boundsArray (without this.output0.scaleArraySet).
 *
 * @member {boolean[]} bPassThrough
 *   If true for a output channel, the output channel should be arranged to pass-through from input to output.
 *
 * @see InputsOutputs
 */
class ConvBiasActivation extends InputsOutputs {

  /**
   * Used as default BoundsArraySet.ConvBiasActivation provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "BoundsArraySet.ConvBiasActivation.Pool", ConvBiasActivation, ConvBiasActivation.setAsConstructor );

  /**
   *   - The .input0 will be set as input0.
   *   - The .afterUndoPreviousActivationEscaping will be set according to  input0 and input0.scaleArraySet.undo.scales.
   *
   * Difference from (parent class) InputsOutputs:
   *   - Only input0 (always no input1), because convolution (no matter pointwise or depthwise) could handle one input tensor.
   *   - Only output0 (always no output1), because convolution (no matter pointwise or depthwise) always generate one output tensor.
   *
   * @param {number} channelShuffler_inputGroupCount
   *   The input group count of the channel shuffler. Usually, it is used for undo previous operation's channel shuffling. If 0, the
   * inputScaleBoundsArray will be used. If positive (only 2 is supported currently), the inputScaleBoundsArray.beforeChannelShuffled
   * will be used.
   *
   */
  constructor( input0, outputChannelCount0, channelShuffler_inputGroupCount ) {
    super( input0, undefined, outputChannelCount0, undefined ); // .input0 and .output0
    ConvBiasActivation.setAsConstructor_self.call( this, input0, outputChannelCount0, channelShuffler_inputGroupCount );
  }

  /** @override */
  static setAsConstructor( input0, outputChannelCount0, channelShuffler_inputGroupCount ) {
    super.setAsConstructor( input0, undefined, outputChannelCount0, undefined );
    ConvBiasActivation.setAsConstructor_self.call( this, input0, outputChannelCount0, channelShuffler_inputGroupCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( input0, outputChannelCount0, channelShuffler_inputGroupCount ) {
    this.afterUndoPreviousActivationEscaping = FloatValue.BoundsArray.Pool.get_or_create_by( input0.length ); // channel count same as input0.
    this.afterFilter = FloatValue.BoundsArray.Pool.get_or_create_by( outputChannelCount0 );
    this.afterBias = FloatValue.BoundsArray.Pool.get_or_create_by( outputChannelCount0 );
    this.bPassThrough = Recyclable.Array.Pool.get_or_create_by( outputChannelCount0 );
    this.set_afterUndoPreviousActivationEscaping_by_input0_undoScales( channelShuffler_inputGroupCount );
  }

  /**
   * Set .afterUndoPreviousActivationEscaping as .input0 multiplying .input0.scaleArraySet.undo.scales.
   *
   * @param {number} channelShuffler_inputGroupCount
   *   The input group count of the channel shuffler. Usually, it is used for undo previous operation's channel shuffling. If 0, the
   * inputScaleBoundsArray will be used. If positive (only 2 is supported currently), the inputScaleBoundsArray.beforeChannelShuffled
   * will be used.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_afterUndoPreviousActivationEscaping_by_input0_undoScales( channelShuffler_inputGroupCount ) {
    if ( channelShuffler_inputGroupCount > 0 ) {
      
!!! ...unfinished... (2022/07/10)
// should become use interleave_asGroupTwo_alongWidth_undo()

      this.afterUndoPreviousActivationEscaping
        .set_all_byBoundsArray( this.input0.beforeChannelShuffled.boundsArray )
        .multiply_all_byNs( this.input0.beforeChannelShuffled.scaleArraySet.undo.scales );

    } else {
      this.afterUndoPreviousActivationEscaping
        .set_all_byBoundsArray( this.input0.boundsArray )
        .multiply_all_byNs( this.input0.scaleArraySet.undo.scales );
    }
    return this;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   *
   * @override
   */
  disposeResources() {

//!!! (2022/07/09 Remarked) Now uses pool.
//    // For reducing memory re-allocation when this BoundsArraySet is recycled and re-issued, the .afterUndoPreviousActivationEscaping,
//    // .afterFilter, .afterBias, .bPassThrough are not disposed by here.

    if ( this.bPassThrough ) {
      this.bPassThrough.disposeResources_and_recycleToPool();
      this.bPassThrough = null;
    }

    if ( this.afterBias ) {
      this.afterBias.disposeResources_and_recycleToPool();
      this.afterBias = null;
    }

    if ( this.afterFilter ) {
      this.afterFilter.disposeResources_and_recycleToPool();
      this.afterFilter = null;
    }

    if ( this.afterUndoPreviousActivationEscaping ) {
      this.afterUndoPreviousActivationEscaping.disposeResources_and_recycleToPool();
      this.afterUndoPreviousActivationEscaping = null;
    }

    super.disposeResources();
  }

  /**
   * @return {ConvBiasActivation}
   *   Return a newly created ConvBiasActivation which is a copy of this ConvBiasActivation. The this.inputs will just past
   * to new ConvBiasActivation (i.e. NOT copied). But the other data members will be copied.
   */
  clone() {
    let result = ConvBiasActivation.Pool.get_or_create_by( this.input0, this.outputChannelCount0 );
    result.set_all_byBoundsArraySet( this );
    return result;
  }

  /**
   * @param {boolean} bPassThrough
   * Set this.bPassThrough[] all to bPassThrough.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_bPassThrough_all( bPassThrough ) {
    this.bPassThrough.fill( bPassThrough );
    return this;
  }

  /**
   * Set:
   *   - this.bPassThrough[] to false (i.e. all are not pass-through).
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_bPassThrough_all_none() {
    return this.set_bPassThrough_all( false );
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
   *   Set all outputs related BoundsArray (.afterFilter, .afterBias, .output0.boundsArray (i.e. .afterActivation),
   * .bPassThrough) to the same as the specified aBounds. Set the this.output0.scaleArraySet to default ( 1 ).
   * The .input0 are not modified.
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_outputs_all_byBounds( aBounds ) {
    this.afterFilter.set_all_byBounds( aBounds );
    this.afterBias.set_all_byBounds( aBounds );
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

      if ( aBoundsArraySet.input1 ) {
        this.input1 = aBoundsArraySet.input1;
      } else {
        if ( this.input1 )
          this.input1 = undefined;
      }
    }

    this.afterUndoPreviousActivationEscaping.set_all_byBoundsArray( aBoundsArraySet.afterUndoPreviousActivationEscaping );
    this.afterFilter                        .set_all_byBoundsArray( aBoundsArraySet.afterFilter );
    this.afterBias                          .set_all_byBoundsArray( aBoundsArraySet.afterBias );

    // .output0.boundsArray (i.e. .afterActivation), .output0.scaleArraySet, .output1.boundsArray, .output1.scaleArraySet
    super.set_outputs_all_byBoundsArraySet( aBoundsArraySet );

    for ( let i = 0; i < this.bPassThrough.length; ++i ) {
      this.bPassThrough[ i ] = aBoundsArraySet.bPassThrough[ i ];
    }

    return this;
  }

  /**
   * Determine .output0.boundsArray (i.e. .afterActivation) and .output0.scaleArraySet by .afterBias and .bPassThrough and nActivationId.
   * Also adjust .afterFilter and .afterBias by .output0.scaleArraySet.
   *
   * The following properties will be used:
   *   - this.afterBias
   *   - this.bPassThrough
   *
   * The following properties will be modified:
   *   - this.afterFilter
   *   - this.afterBias
   *   - this.output0.boundsArray (i.e. this.afterActivation)
   *   - this.output0.scaleArraySet
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) of this convolution.
   *
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThrough_nActivationId( nActivationId ) {

    const theActivationFunctionInfo = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );

    let doEscapingScale;
    for ( let outChannel = 0; outChannel < this.afterBias.length; ++outChannel ) {

      let bPassThrough = this.bPassThrough[ outChannel ]; // For pass-through half channels.

      // 1. Determine (activationEscaping) .scaleArraySet (of .output0)
      {
        // 1.1 Determine .do

        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {

          // Since no activation function, no need to escape. (i.e. scale = 1 for no scale)
          this.output0.scaleArraySet.do.set_one_byN( outChannel, 1 );
          doEscapingScale = 1;

        } else {

          if ( bPassThrough ) { // For channels will be activation-escaping.

            // If value bounds is [ 0, 0 ], adjust it to a range which includes zero.
            //
            // This could happen when filters are all zero for outChannel. This adjustment is necessary because the following
            // .set_one_by_fromLowerUpper_toLowerUpper() can not work for bounds [ 0, 0 ].
            //
            if ( ( this.afterBias.lowers[ outChannel ] == 0 ) && ( this.afterBias.uppers[ outChannel ] == 0 ) ) {
              this.afterBias.lowers[ outChannel ] = -1;
              this.afterBias.uppers[ outChannel ] = +1;
            }

            // Calculate the scale for escaping bias result from activation function's non-linear domain into linear domain.
            //
            // Note: This does not work for avg/max pooling.
            this.output0.scaleArraySet.do.set_one_by_fromLowerUpper_toLowerUpper( outChannel,
              this.afterBias.lowers[ outChannel ], this.afterBias.uppers[ outChannel ],
              theActivationFunctionInfo.inputDomainLinear.lower, theActivationFunctionInfo.inputDomainLinear.upper
            );

            doEscapingScale = this.output0.scaleArraySet.do.scales[ outChannel ];
            if ( Number.isNaN( doEscapingScale ) == true )
              throw Error( `BoundsArraySet.ConvBiasActivation.`
                + `adjust_afterFilter_afterBias_set_output0_by_afterBias_bPassThrough_nActivationId_nPassThroughStyleId( `
                  + ` ${ValueDesc.ActivationFunction.Singleton.getStringOf( nActivationId )}(${nActivationId}) ): `
                + `this.output0.scaleArraySet.do.scales[ ${outChannel} ] ( ${doEscapingScale} ) `
                + `should not be NaN. `
                + `Please use activation function (e.g. clipByValue(), tanh()) which has both negative and positive parts near origin point.`
              );

          } else { // For channels will not be activation-escaping.
            this.output0.scaleArraySet.do.set_one_byN( outChannel, 1 ); // No need to escape. (i.e. scale = 1 for no scale)
            doEscapingScale = 1;
          }
        }

        // 1.2 Determine .undo (Prepared for the next convolution-bias-activation. Not for this.)
        this.output0.scaleArraySet.undo.set_one_byUndo_N( outChannel, doEscapingScale );
      }

      // 2. Adjust .afterFilter and .afterBias
      this.afterFilter.multiply_one_byN( outChannel, doEscapingScale );
      this.afterBias.multiply_one_byN( outChannel, doEscapingScale );

      // 3. Determine .afterActivation (i.e. .output0.boundsArray)
      {
        // If no activation function, the output range is determined by adjusted .afterBias.
        if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
          this.output0.boundsArray.set_one_byBoundsArray( outChannel, this.afterBias, outChannel );

//!!! (2022/07/07 Remarked) Use activated escaping-scaled afterBias value instead.
// It seems necessary to use clamp_one_byXxx() instead of set_one_byBounds().
// Otherwise, squeeze-and-excitation when pass-through (constant 1 when pass through) will generate +-3 instead 1.
//
//         // Otherwise, the activation function dominates the output range.
//         //
//         // Note1: clamp_one_byXxx() is not feasible here because output range usually is different from input domain. set_one_byXxx()
//         //        is more feasible.
//         //
//         // Note2: However, set_one_byXxx() is not so friendly for activation function whose output range has Infinity (e.g. RELU is
//         //        [ 0, +Infinity ]). The reason is that the result's bounds becomes a bounds with Infinity which is difficult to be
//         //        handled for the follow-up processing.
//         } else {
//
//           if ( bPassThrough ) { // For activation-escaping, it will be the output range for inputDomainLinear.
//             this.output0.boundsArray.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRangeLinear );
//
//           } else { // For non-activation-escaping, it will be the output range for the whole input domain.
//             this.output0.boundsArray.set_one_byBounds( outChannel, theActivationFunctionInfo.outputRange );
//           }
//
//         }

        } else { // Use activated escaping-scaled afterBias value as output.
          let lower_activated = theActivationFunctionInfo.pfnReference( this.afterBias.lowers[ outChannel ] );
          let upper_activated = theActivationFunctionInfo.pfnReference( this.afterBias.uppers[ outChannel ] );
          this.output0.boundsArray.set_one_byLowerUpper( outChannel, lower_activated, upper_activated );
        }
      }

    }

    return this;
  }

  /**
   * Rearrange output related channel information (.afterFilter, .afterBias, .output0.boundsArray (i.e. .afterActivation),
   * output0.scaleArraySet (i.e. activationEscaping), .bPassThrough) by interleaving as ( groupCount == 2 ). The channel
   * count must be even (i.e. divisible by 2).
   *
   * @return {ConvBiasActivation}
   *   Return this (modified) object.
   */
  set_outputs_all_byInterleave_asGrouptTwo() {
    {
      let afterFilterShuffled = FloatValue.BoundsArray.Pool.get_or_create_by( this.afterFilter.length );
      this.afterFilter.set_all_byInterleave_asGrouptTwo_byBoundsArray( this.afterFilter );
      this.afterFilter.disposeResources_and_recycleToPool();
      this.afterFilter = afterFilterShuffled;
    }

    {
      let afterBiasShuffled = FloatValue.BoundsArray.Pool.get_or_create_by( this.afterBias.length );
      this.afterBias.set_all_byInterleave_asGrouptTwo_byBoundsArray( this.afterBias );
      this.afterBias.disposeResources_and_recycleToPool();
      this.afterBias = afterBiasShuffled;
    }

    super.set_outputs_all_byInterleave_asGrouptTwo(); // i.e. this.afterActivation

    {
      let bPassThroughShuffled = Recyclable.Array.Pool.get_or_create_by( this.bPassThrough.length );

      FloatValue.ArrayInterleaver.interleave_asGrouptTwo_alongWidth_from_to(
        this.bPassThrough, bPassThroughShuffled, 1, this.bPassThrough.length );

      this.bPassThrough.disposeResources_and_recycleToPool();
      this.bPassThrough = bPassThroughShuffled;
    }

    return this;
  }

  get afterActivation() {
    return this.output0.boundsArray;
  }

}

