export { BoundsArraySet };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as Weights from "../../Unpacker/Weights.js";
import * as ActivationEscaping from "../ActivationEscaping.js";

/**
 * Element value bounds for every operation's result of a convolution-bias-activation. The main purpose is to find out the
 * activationEscaping_ScaleArraySet so that it can be used to let channel escape from activation function's non-linear effect.
 *
 *
 * @member {FloatValue.BoundsArray} input
 *   The (per channel) bounds of the input element value. Or say, the domain of the convolution-bias-activation.
 *
 * @member {FloatValue.BoundsArray} afterUndoPreviousActivationEscaping
 *   The (per channel) bounds of the element value after applying the previousConvBiasActivation.BoundsArraySet.ActivationEscaping.undo
 * to this.input. (i.e. beforeFilter)
 *
 * @member {FloatValue.BoundsArray} afterFilter
 *   The (per channel) bounds of the element value after applying the convolution filters to this.afterUndoPreviousActivationEscaping.
 * (i.e. beforeBias)
 *
 * @member {FloatValue.BoundsArray} afterBias
 *   The (per channel) bounds of the element value after applying the convolution biases to this.afterFilter. (i.e. beforeActivationEscaping)
 *
 * @member {FloatValue.BoundsArray} afterActivationEscaping
 *   The (per channel) bounds of the element value after applying this.activationEscaping_ScaleArraySet.do to this.afterBias. (i.e. beforeActivation)
 *
 * @member {FloatValue.BoundsArray} afterActivation
 *   The (per channel) bounds of the element value after applying activation function to this.afterActivationEscaping.
 *
 * @member {FloatValue.BoundsArray} output
 *   The (per channel) bounds of the output element value. Or say, the range of the convolution-bias-activation. It is just
 * the this.afterActivation.
 *
 * @member {ActivationEscaping.ScaleArraySet} activationEscaping_ScaleArraySet
 *   The scales for moving this.afterBias bounds into the linear domain of the activation function. That is, for
 * letting this.afterBias escape from activation function's non-linear domain. And the .undo for undoing the scales.
 *
 * @member {boolean[]} bPassThrough
 *   If true for a output channel, the output channel should be arranged to pass-through from input to output.
 */
class BoundsArraySet {

  /**
   */
  constructor( inputChannelCount, outputChannelCount ) {
    this.input = new FloatValue.BoundsArray( inputChannelCount );
    this.afterUndoPreviousActivationEscaping = new FloatValue.BoundsArray( inputChannelCount );
    this.afterFilter = new FloatValue.BoundsArray( outputChannelCount );
    this.afterBias = new FloatValue.BoundsArray( outputChannelCount );
    this.afterActivationEscaping = new FloatValue.BoundsArray( outputChannelCount );
    this.afterActivation = new FloatValue.BoundsArray( outputChannelCount ); // i.e. .output

    this.activationEscaping_ScaleArraySet = new ActivationEscaping.ScaleArraySet( outputChannelCount );
    this.bPassThrough = new Array( outputChannelCount );

    //this.set_all_byBounds.set_all_byBounds( Weights.Base.ValueBounds );
  }

  /**
   * @return {BoundsArraySet} Return a newly created BoundsArraySet which is a copy of this BoundsArraySet.
   */
  clone() {
    let result = new BoundsArraySet( this.input.lowers.length, this.output.lowers.length );
    result.set_byBoundsArraySet( this );
    return result;
  }

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
    this.activationEscaping_ScaleArraySet.set_all_byN( 1 ); // scale 1 and translate 0. (i.e. no scale and no translate.)
    this.bPassThrough.fill( false ); // Assume all are not pass-through.
    return this;
  }

  /**
   * @param {BoundsArraySet} aBoundsArraySet
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

    for ( let outChannel = 0; outChannel < this.afterBias.lowers.length; ++outChannel ) {

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
    }

    // 3. Determine .afterActivation
    {
      // If no activation function, the output range is determined by .afterActivationEscaping.
      if ( this.nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
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

    return this;
  }

  /**
   * Swap output related channel information (.afterFilter, .afterBias, .afterActivationEscaping, .afterActivation, .activationEscaping_ScaleArraySet,
   * .bPassThrough).
   *
   * @param {number} outChannel1  The 1st output channel index whose information will be swapped.
   * @param {number} outChannel2  The 2nd output channel index whose information will be swapped.
   */
  swap_two_output( outChannel1, outChannel2 ) {
    this.afterFilter.swap_two( outChannel1, outChannel2 );
    this.afterBias.swap_two( outChannel1, outChannel2 );
    this.afterActivationEscaping.swap_two( outChannel1, outChannel2 );
    this.afterActivation.swap_two( outChannel1, outChannel2 );

    this.activationEscaping_ScaleArraySet.swap_two( outChannel1, outChannel2 );

    {
      let bPassThrough1 = this.bPassThrough[ outChannel1 ];
      this.bPassThrough[ outChannel1 ] = this.bPassThrough[ outChannel2 ];
      this.bPassThrough[ outChannel2 ] = bPassThrough1;
    }
  }

  get output() {
    return this.afterActivation;
  }

}

