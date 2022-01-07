export { BoundsArraySet };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as Weights from "../Unpacker/Weights.js";
import * as ActivationEscaping from "./ActivationEscaping.js";

/**
 * Several element value bounds for convolution-bias-activation operations.
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

    //this.input.set_all_byBounds( Weights.Base.ValueBounds );

    this.activationEscaping_ScaleArraySet = new ActivationEscaping.ScaleArraySet();
  }

  /**
   * @return {BoundsArraySet} Return a newly created BoundsArraySet which is a copy of this BoundsArraySet.
   */
  clone() {
    let result = new BoundsArraySet();
    result.set_byBoundsArraySet( this );
    return result;
  }

  /**
   * @param {BoundsArraySet} aBoundsArraySet
   *   The BoundsArraySet to be copied.
   *
   * @return {BoundsArraySet}
   *   Return this (modified) object which is copied from aBoundsArraySet.
   */
  set_byBoundsArraySet( aBoundsArraySet ) {
    this.input                              .set_all_byBoundsArray( aBoundsArraySet.input );
    this.afterUndoPreviousActivationEscaping.set_all_byBoundsArray( aBoundsArraySet.afterUndoPreviousActivationEscaping );
    this.afterFilter                        .set_all_byBoundsArray( aBoundsArraySet.afterFilter );
    this.afterBias                          .set_all_byBoundsArray( aBoundsArraySet.afterBias );
    this.afterActivationEscaping            .set_all_byBoundsArray( aBoundsArraySet.afterActivationEscaping );
    this.afterActivation                    .set_all_byBoundsArray( aBoundsArraySet.afterActivation );
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArraySet.activationEscaping_ScaleArraySet );
    return this;
  }

//!!! ...unfinished... (2022/01/07)

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set this.input, this.beforeActivation, this.output all the same as the specified aBounds. Set the
   * this.activationEscaping_ScaleTranslateArraySet to default ( 1, 0 );
   *
   * @return {BoundsArraySet}
   *   Return this (modified) object which is copied from aBoundsArraySet.
   */
  reset_byBounds( aBounds ) {
    this.input.set_all_byBounds( aBounds );
    this.beforeActivation.set_all_byBounds( aBounds );
    this.output.set_all_byBounds( aBounds );

//!!! ...unfinished... (2021/12/27) should become BoundsArray_byChannelIndex.
    this.activationEscaping_ScaleTranslateArraySet.reset_by_scale_translate( 1, 0 ); // scale 1 and translate 0. (i.e. no scale and no translate.)
    return this;
  }

  /**
   * Determine output value bounds. Set this.output according to this.beforeActivation and the specified nActivationId.
   *
   * @param {number} nActivationId
   *   The activation function id (ValueDesc.ActivationFunction.Singleton.Ids.Xxx) after the bias operation.
   *     - If ( nActivationId == ValueDesc.ActivationFunction.Singletion.Ids.NONE ), this.output will be the same as this.beforeActivation.
   *     - Otherwise, this.output will be the same as the output range of the activation function.
   */
  set_output_by_beforeActivation_ActivationId( nActivationId ) {

    // If there is no activation function, the output range is determined by input domain, filters, biases.
    if ( nActivationId == ValueDesc.ActivationFunction.Singleton.Ids.NONE ) {
      this.output.set_all_byBoundsArray( this.beforeActivation );

    // Otherwise, the activation function dominates the output range.
    } else {
      let info = ValueDesc.ActivationFunction.Singleton.getInfoById( nActivationId );
      this.output.set_all_byBounds( info.outputRange );
    }

  }

  get output() {
    return this.afterActivation;
  }

}

