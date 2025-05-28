export { ScaleBoundsArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import { ScaleArraySet } from "./ActivationEscaping_ScaleArraySet.js";

/**
 * Element value bounds (per channel) with (ActivationEscaping) ScaleArraySet
 * information.
 *
 * The main purpose is to find out the scaleArraySet so that it can be used to
 * let channel escape from activation function's non-linear effect.
 *
 *
 * @member {FloatValue.BoundsArray} boundsArray
 *   The element value bounds (per channel).
 *
 * @member {ScaleArraySet} scaleArraySet
 *   The scales for activation escaping. Its .do will move this.afterBias
 * bounds into the linear domain of the activation function. That is, for
 * letting BoundsArraySet.ConvBiasActivation.afterBias escape from activation
 * function's non-linear domain. And its .undo could undo the scales.
 *
 * @member {number} length
 *   The channel count of the boundsArray (i.e. this.boundsArray.length).
 *
 * @member {number} channelCount
 *   The same as .length.
 */
class ScaleBoundsArray extends Recyclable.Root {

  /**
   * Used as default ActivationEscaping.ScaleBoundsArray provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ActivationEscaping.ScaleBoundsArray.Pool",
    ScaleBoundsArray, ScaleBoundsArray.setAsConstructor );

  /**
   */
  constructor( channelCount ) {
    super();
    ScaleBoundsArray.setAsConstructor_self.call( this, channelCount );
  }

  /** @override */
  static setAsConstructor( channelCount ) {
    super.setAsConstructor();
    ScaleBoundsArray.setAsConstructor_self.call( this, channelCount );
    return this;
  }

  /** @override */
  static setAsConstructor_self( channelCount ) {
    this.boundsArray
      = FloatValue.BoundsArray.Pool.get_or_create_by( channelCount );
    this.scaleArraySet
      = ScaleArraySet.Pool.get_or_create_by( channelCount );
  }

  /** @override */
  disposeResources() {
    if ( this.scaleArraySet ) {
      this.scaleArraySet.disposeResources_and_recycleToPool();
      this.scaleArraySet = null;
    }
    if ( this.boundsArray ) {
      this.boundsArray.disposeResources_and_recycleToPool();
      this.boundsArray = null;
    }
    super.disposeResources();
  }

  get length() {
    return this.boundsArray.length;
  }

  get channelCount() {
    return this.length;
  }

  set length( newLength ) {
    this.boundsArray.length = newLength;
    this.scaleArraySet.length = newLength;
  }

  set channelCount( newChannelCount ) {
    this.length = newChannelCount;
  }

  /**
   * @return {ScaleBoundsArray}
   *   Return a newly created ScaleBoundsArray which is a copy of this
   * ScaleBoundsArray.
   */
  clone() {
    let result = ScaleBoundsArray.Pool.get_or_create_by( this.channelCount );
    result.set_all_byScaleBoundsArray( this );
    return result;
  }

  /**
   * Set:
   *   - this.scaleArraySet to scale 1 (i.e. all are no scale).
   *
   * @return {ScaleBoundsArray}
   *   Return this (modified) object.
   */
  set_activationEscaping_all_none() {
    this.scaleArraySet.set_all_byN( 1 );
    return this;
  }

  /**
   * Set all ( this.lowers[], this.uppers[] ) to ( +Infinity, -Infinity ). This
   * can not be achieved by set_byLowerUpper() because ( lower > upper ).
   * Usually, this method is used mainly before calling .enlarge_one_byN() to
   * find out bounds.
   *
   * @return {Bounds} Return this (modified) object which is [ +Infinity, -Infinity ].
   */
   set_all_by_PositiveInfinity_NegativeInfinity() {
    this.boundsArray.set_all_by_PositiveInfinity_NegativeInfinity();
    this.set_activationEscaping_all_none();
    return this;
  }

  /**
   * The .scaleArraySet will be set to 1 (i.e. no scale).
   *
   * @param {number} aLower  Set all this.boundsArray.lowers[] by aLower.
   * @param {number} aUpper  Set all this.boundsArray.uppers[] by aUpper.
   *
   * @return {ScaleBoundsArray} Return this (modified) object.
   */
  set_all_byLowerUpper( aLower, aUpper ) {
    this.boundsArray.set_all_byLowerUpper( aLower, aUpper );
    this.set_activationEscaping_all_none();
    return this;
  }

  /**
   * The .scaleArraySet will be set to 1 (i.e. no scale).
   *
   * @param {FloatValue.Bounds} aBounds
   *   Set .boundsArray to the same as the specified aBounds. Set the
   * .scaleArraySet to default ( 1 ).
   *
   * @return {ScaleBoundsArray}
   *   Return this (modified) object.
   */
  set_all_byBounds( aBounds ) {
    return this.set_all_byLowerUpper( aBounds.lower, aBounds.upper );
  }

  /**
   * The .scaleArraySet will be set to 1 (i.e. no scale).
   *
   * @param {BoundsArray} aBoundsArray
   *   Set .boundsArray as the copy of the specified aBoundsArray. Set the
   * .scaleArraySet to default ( 1 ).
   *
   * @return {ScaleBoundsArray}
   *   Return this (modified) object.
   */
  set_all_byBoundsArray( aBoundsArray ) {
    this.boundsArray.set_all_byBoundsArray( aBoundsArray );
    this.set_activationEscaping_all_none();
    return this;
  }

  /**
   * Precondition: ( this.length == aBoundsArray.outputs.length )
   * and  ( this.length == aScaleArraySet.length ).
   *
   * @param {FloatValue.BoundsArray} aBoundsArray      The BoundsArray to be copied.
   * @param {FloatValue.ScaleArraySet} aScaleArraySet  The ScaleArraySet to be copied.
   *
   * @return {ScaleBoundsArray}  Return this (modified) object.
   */
  set_all_byBoundsArray_ScaleArraySet( aBoundsArray, aScaleArraySet ) {
    this.boundsArray.set_all_byBoundsArray( aBoundsArray );
    this.scaleArraySet.set_all_byScaleArraySet( aScaleArraySet );
    return this;
  }

  /**
   * Precondition: ( this.length == aScaleBoundsArray.outputs.length ).
   *
   * @param {ScaleBoundsArray} aScaleBoundsArray
   *   The ScaleBoundsArray to be copied (including .boundsArray and
   * (activationEscaping) .scaleArraySet).
   *
   * @return {ScaleBoundsArray}
   *   Return this (modified) object which is copied from aScaleBoundsArray.
   */
  set_all_byScaleBoundsArray( aScaleBoundsArray ) {
    return this.set_all_byBoundsArray_ScaleArraySet(
      aScaleBoundsArray.boundsArray, aScaleBoundsArray.scaleArraySet );
  }

  /**
   * The this.length will be modified.
   *
   * @param {ScaleBoundsArray} inputScaleBoundsArray0
   *   The ScaleBoundsArray of the 1st input.
   *
   * @param {ScaleBoundsArray} inputScaleBoundsArray1
   *   The ScaleBoundsArray of the 2nd input.
   *
   * @return {ScaleBoundsArray} Return this (modified) object.
   */
  set_all_byScaleBoundsArray_concat_input0_input1(
    inputScaleBoundsArray0, inputScaleBoundsArray1 ) {

    this.boundsArray.set_all_byBoundsArray_concat_input0_input1(
      inputScaleBoundsArray0.boundsArray, inputScaleBoundsArray1.boundsArray );
    this.scaleArraySet.set_all_byScaleArraySet_concat_input0_input1(
      inputScaleBoundsArray0.scaleArraySet, inputScaleBoundsArray1.scaleArraySet );
    return this;
  }

  /**
   * Rearrange channels information by interleaving as ( groupCount == 2 ).
   * This channel count must be even (i.e. divisible by 2). The original "this"
   * (i.e. not channel shuffled) ScaleBoundsArray will be swapped and kept in
   * the .beforeChannelShuffled data member.
   *
   *
   * @return {ScaleBoundsArray}
   *   Return this (modified) object.
   */
  set_all_byInterleave_asGrouptTwo() {
    {
      let boundsArrayShuffled = FloatValue.BoundsArray.Pool.get_or_create_by(
        this.boundsArray.length );

      boundsArrayShuffled.set_all_byInterleave_asGrouptTwo_byBoundsArray(
        this.boundsArray );

      this.boundsArray.disposeResources_and_recycleToPool();
      this.boundsArray = boundsArrayShuffled;
    }
    {
      let scaleArraySetShuffled = ScaleArraySet.Pool.get_or_create_by(
        this.scaleArraySet.length );

      scaleArraySetShuffled.set_all_byInterleave_asGrouptTwo_byScaleArraySet(
        this.scaleArraySet );

      this.scaleArraySet.disposeResources_and_recycleToPool();
      this.scaleArraySet = scaleArraySetShuffled;
    }
    return this;
  }


  /**
   * The this.scaleArraySet and aScaleBoundsArray.scaleArraySet must have the
   * same length and values.
   *
   * @param {ScaleBoundsArray} aScaleBoundsArray  The ScaleBoundsArray to add.
   *
   * @return {ScaleBoundsArray} Return this (modified) object.
   */
  add_all_byScaleBoundsArray_all( aScaleBoundsArray ) {

    // The two added source should have the same activation escaping scales.
    // Otherwise, they can not be added together.
    this.scaleArraySet.assert_all_byScaleArraySet_all_equal(
      aScaleBoundsArray.scaleArraySet );

    this.boundsArray.add_all_byBoundsArray( aScaleBoundsArray.boundsArray );
    return this;
  }

  /**
   * The this.scaleArraySet all must have the same value as
   * aScaleBoundsArray.scaleArraySet.do.scales[ aIndex ] and
   * aScaleBoundsArray.scaleArraySet.undo.scales[ aIndex ].
   *
   * @param {ScaleBoundsArray} aScaleBoundsArray
   *   The aScaleBoundsArray.boundsArray.lowers[ aIndex ] and
   * aScaleBoundsArray.boundsArray.uppers[ aIndex ] will be used to add.
   *
   * @param {number} aIndex
   *   The array index of aScaleBoundsArray.
   *
   * @return {ScaleBoundsArray} Return this (modified) object.
   */
  add_all_byScaleBoundsArray_one( aScaleBoundsArray, aIndex ) {

    // The two added source should have the same activation escaping scales.
    // Otherwise, they can not be added together.
    this.scaleArraySet.assert_all_byScaleArraySet_one_equal(
      aScaleBoundsArray.scaleArraySet, aIndex );

    this.boundsArray.add_all_byLowerUpper(
      aScaleBoundsArray.boundsArray.lowers[ aIndex ],
      aScaleBoundsArray.boundsArray.uppers[ aIndex ]  );
    return this;
  }


  /**
   * @param {ScaleBoundsArray} aScaleBoundsArray  The ScaleBoundsArray to multiply.
   *
   * @return {ScaleBoundsArray} Return this (modified) object.
   */
  multiply_all_byScaleBoundsArray_all( aScaleBoundsArray ) {

    // Multiply both activation escaping scales.
    //
    // Note: This is diffferent from .add_all_byScaleBoundsArray_all() which
    //       can not handle different source scales.
    //
    this.scaleArraySet.multiply_all_byScaleArraySet_all(
      aScaleBoundsArray.scaleArraySet );
    this.boundsArray.multiply_all_byBoundsArray(
      aScaleBoundsArray.boundsArray );
    return this;
  }

  /**
   * @param {ScaleBoundsArray} aScaleBoundsArray
   *   The aScaleBoundsArray[ aIndex ] will be used to multiply.
   *
   * @param {number} aIndex
   *   The array index of aScaleBoundsArray.
   *
   * @return {ScaleBoundsArray} Return this (modified) object.
   */
  multiply_all_byScaleBoundsArray_one( aScaleBoundsArray, aIndex ) {

    // Multiply both activation escaping scales.
    //
    // Note: This is diffferent from .add_all_byScaleBoundsArray_one() which
    //       can not handle different source scales.
    //
    this.scaleArraySet.multiply_all_byScaleArraySet_one(
      aScaleBoundsArray.scaleArraySet, aIndex );
    this.boundsArray.multiply_all_byLowerUpper(
      aScaleBoundsArray.boundsArray.lowers[ aIndex ],
      aScaleBoundsArray.boundsArray.uppers[ aIndex ] );
    return this;
  }


  /**
   * @param {ScaleBoundsArray} lowerHalfScaleBoundsArray
   *   The ScaleBoundsArray of the 1st output. Its .length will be modified.
   *
   * @param {ScaleBoundsArray} higherHalfScaleBoundsArray
   *   The ScaleBoundsArray of the 2nd output. Its .length will be modified.
   *
   * @return {ScaleArraySet} Return this (unmodified) object.
   */
  split_to_lowerHalf_higherHalf(
    lowerHalfScaleBoundsArray, higherHalfScaleBoundsArray ) {

    this.boundsArray.split_to_lowerHalf_higherHalf(
      lowerHalfScaleBoundsArray.boundsArray,
      higherHalfScaleBoundsArray.boundsArray );
    this.scaleArraySet.split_to_lowerHalf_higherHalf(
      lowerHalfScaleBoundsArray.scaleArraySet,
      higherHalfScaleBoundsArray.scaleArraySet );
    return this;
  }


//!!! ...unfinished... (2025/05/28)
//!!! ...untested... (2025/05/28)
  /**
   * Return strings for all the values displayed in one line (i.e. one row)
   * when logging this object as a table.
   *
   * @param {String[]} out_stringArray
   *   The output string array. All the returned values (i.e. every column of
   * one row) should be pushed at its end (in order).
   *
   * @param {number} nIndex
   *   An integer index into .lowers[] and .uppers[]. If negative, the title
   * string (i.e. [ ".lowers[]", ".uppers[]" ]) should be returned.
   *
   * @param {number} characterCountPerField
   *   Every returned string should be padded so that its length is just
   * so many characters.
   *
   * @param {number} digitCountAfterDecimalPoint
   *   Every returned string (if its original value is a number) should be
   * formatted as so many digits after its decimal point.
   */
  TableLog_append_oneRow_byIndex( out_stringArray,
    nIndex,
    characterCountPerField,
    digitCountAfterDecimalPoint ) {

//!!! ...unfinished... (2025/05/28)
// should display title ".boundsArray" and ".scaleArraySet".

//!!! ...unfinished... (2025/05/28)
// should have prefix and postfix string (left and right square bracket)

    this.boundsArray.TableLog_append_oneRow_byIndex( out_stringArray,
      nIndex,
      characterCountPerField,
      digitCountAfterDecimalPoint );

    this.scaleArraySet.TableLog_append_oneRow_byIndex( out_stringArray,
      nIndex,
      characterCountPerField,
      digitCountAfterDecimalPoint );
  }

}
