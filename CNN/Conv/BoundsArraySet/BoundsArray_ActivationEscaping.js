export { BoundsArray_ActivationEscaping };

import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as ActivationEscaping from "../ActivationEscaping.js";

/**
 * Element value bounds (per channel) with ActivationEscaping information.
 *
 * The main purpose is to find out the activationEscaping_ScaleArraySet so that it can be used to let channel escape from
 * activation function's non-linear effect.
 *
 *
 *
 * @member {FloatValue.BoundsArray} boundsArray
 *   The element value bounds (per channel).
 *
 * @member {number} channelCount
 *   The channel count of the boundsArray (i.e. this.boundsArray.length).
 *
 * @member {ActivationEscaping.ScaleArraySet} activationEscaping_ScaleArraySet
 *   The scales for moving this.afterBias bounds into the linear domain of the activation function. That is, for
 * letting this.afterBias escape from activation function's non-linear domain. And the .undo for undoing the scales.
 */
class BoundsArray_ActivationEscaping {

  /**
   */
  constructor( channelCount ) {
    this.boundsArray = new FloatValue.BoundsArray( channelCount );
    this.activationEscaping_ScaleArraySet = new ActivationEscaping.ScaleArraySet( channelCount );
  }

  get channelCount() {
    return this.boundsArray.length;
  }

  set channelCount( newChannelCount ) {
    this.boundsArray.length = newChannelCount;
    this.activationEscaping_ScaleArraySet.length = newChannelCount;
  }

  /**
   * @return {InputsOutputs}
   *   Return a newly created InputsOutputs which is a copy of this InputsOutputs. The this.inputs will just past
   * to new InputsOutputs (i.e. NOT copied). But the this.outputs will be copied.
   */
  clone() {
    let result = new BoundsArray_ActivationEscaping( this.channelCount );
    result.set_all_byBoundsArray_ActivationEscaping( this );
    return result;
  }

  /**
   * Set:
   *   - this.activationEscaping_ScaleArraySet to scale 1 (i.e. all are no scale).
   *
   * @return {BoundsArray_ActivationEscaping}
   *   Return this (modified) object.
   */
  set_activationEscaping_all_none() {
    this.activationEscaping_ScaleArraySet.set_all_byN( 1 );
    return this;
  }

  /**
   * @param {FloatValue.Bounds} aBounds
   *   Set .boundsArray to the same as the specified aBounds. Set the .activationEscaping_ScaleArraySet to default ( 1 ).
   *
   * @return {BoundsArray_ActivationEscaping}
   *   Return this (modified) object.
   */
  set_all_byBounds( aBounds ) {
    this.boundsArray.set_all_byBounds( aBounds );
    super.set_activationEscaping_all_none();
    return this;
  }

  /**
   * @param {BoundsArray} aBoundsArray
   *   Set .boundsArray as the copy of the specified aBoundsArray. Set the .activationEscaping_ScaleArraySet to default ( 1 ).
   *
   * @return {BoundsArray_ActivationEscaping}
   *   Return this (modified) object.
   */
  set_all_byBoundsArray( aBoundsArray ) {
    this.boundsArray.set_all_byBoundsArray( aBoundsArray );
    super.set_activationEscaping_all_none();
    return this;
  }

  /**
   * @param {BoundsArray_ActivationEscaping} aBoundsArray_ActivationEscaping
   *   The BoundsArray_ActivationEscaping to be copied. Precondition: ( this.outputs.length == aBoundsArraySet.outputs.length ).
   *
   * @return {BoundsArray_ActivationEscaping}
   *   Return this (modified) object which is copied from aBoundsArray_ActivationEscaping.
   */
  set_all_byBoundsArray_ActivationEscaping( aBoundsArray_ActivationEscaping ) {
    this.boundsArray.set_all_byBoundsArray( aBoundsArray_ActivationEscaping.boundsArray );
    this.activationEscaping_ScaleArraySet.set_byScaleArraySet( aBoundsArray_ActivationEscaping.activationEscaping_ScaleArraySet );
    return this;
  }

  /**
   * The this.length will be modified.
   *
   * @param {BoundsArray_ActivationEscaping} inputBoundsArray_ActivationEscaping0  The BoundsArray_ActivationEscaping of the 1st input.
   * @param {BoundsArray_ActivationEscaping} inputBoundsArray_ActivationEscaping1  The BoundsArray_ActivationEscaping of the 2nd input.
   *
   * @return {BoundsArray_ActivationEscaping} Return this (modified) object.
   */
  set_all_byBoundsArray_ActivationEscaping_concat_input0_input1( inputBoundsArray_ActivationEscaping0, inputBoundsArray_ActivationEscaping1 ) {
    this.do.set_all_byScaleArray_concat_input0_input1( inputBoundsArray_ActivationEscaping0.do, inputBoundsArray_ActivationEscaping1.do );
    this.undo.set_all_byScaleArray_concat_input0_input1( inputBoundsArray_ActivationEscaping0.undo, inputBoundsArray_ActivationEscaping1.undo );
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
  set_all_byInterleave_asGrouptTwo( arrayTemp ) {
    this.boundsArray.interleave_asGrouptTwo( arrayTemp );
    this.activationEscaping_ScaleArraySet.interleave_asGrouptTwo( arrayTemp );
    return this;
  }

  /**
   * @param {BoundsArray_ActivationEscaping} lowerHalfBoundsArray_ActivationEscaping
   *   The BoundsArray_ActivationEscaping of the 1st output. Its .length will be modified.
   *
   * @param {BoundsArray_ActivationEscaping} higherHalfBoundsArray_ActivationEscaping
   *   The BoundsArray_ActivationEscaping of the 2nd output. Its .length will be modified.
   *
   * @return {ScaleArraySet} Return this (unmodified) object.
   */
  split_to_lowerHalf_higherHalf( lowerHalfBoundsArray_ActivationEscaping, higherHalfBoundsArray_ActivationEscaping ) {
    this.do.split_to_lowerHalf_higherHalf( lowerHalfBoundsArray_ActivationEscaping.do, higherHalfBoundsArray_ActivationEscaping.do );
    this.undo.split_to_lowerHalf_higherHalf( lowerHalfBoundsArray_ActivationEscaping.undo, higherHalfBoundsArray_ActivationEscaping.undo );
    return this;
  }

}

