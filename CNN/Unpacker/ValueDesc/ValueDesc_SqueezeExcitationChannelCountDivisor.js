export { SqueezeExcitationChannelCountDivisor };

import { Int } from "./ValueDesc_Base.js";
import * as MultiLayerMap from "../../util/MultiLayerMap.js";

/**
 * Describe squeeze-and-excitation channel count divisor's id, range, name.
 *
 * Convert number value into integer between [ -2, 64 ] representing depthwise operation:
 *   - -2: NONE                                             (no squeeze, no excitation, no multiply)
 *   - -1: EXCITATION                                       (no squeeze, no intermediate excitation)
 *   -  0: SQUEEZE_EXCITATION                               (has squeeze, no intermediate excitation)
 *   - [ 1, 64 ]: SQUEEZE_INTERMEDIATE_DIVISOR_N_EXCITATION (has squeeze, has intermediate excitation ( input_channel_count / this_divisor ) )
 *
 *
 * Note:
 *   - Convolution neural network with squeeze-and-excitation (e.g.
 *       MobileNetV3) has so-called attention ability.
 *
 *   - In fact, from the point of view of the formula, it looks like a power
 *       series (note: Taylor series is a kinds of power series). So, it gains
 *       more ability to approximate any function.
 *
 *   - Think: Whether does the following situation provide more approximation
 *       ability (because power can express both multiplication and division)? 
 *     - Add a power (i.e. x ** y) operation before excitation's multiplication, or
 *     - Replace the excitation's multiplication with power (i.e. x ** y).
 *
 */
class SqueezeExcitationChannelCountDivisor extends Int {

  constructor() {
    super( -2, 64, {
      NONE:               new Int.Info( -2, "NONE" ),
      EXCITATION:         new Int.Info( -1, "EXCITATION" ),
      SQUEEZE_EXCITATION: new Int.Info(  0, "SQUEEZE_EXCITATION" ),

      // "SQUEEZE_INTERMEDIATE_DIVISOR_1_EXCITATION",
      // "SQUEEZE_INTERMEDIATE_DIVISOR_2_EXCITATION",
      // ..., "SQUEEZE_INTERMEDIATE_DIVISOR_64_EXCITATION".
      //
      // (2022/05/26 Remarked) Do not define these names because they will
      // occupy too many memory.
      //
      // ... [ ... new Array( 64 ).keys() ].map(
      //   x => `SQUEEZE_INTERMEDIATE_DIVISOR_${( x + 1 )}_EXCITATION` )
    } );

    // A look-up table for reducing name string composing (generating).
    this.nameBag = new SE_Name_Bag;
  }

  /**
   * @param {number} nSqueezeExcitationChannelCountDivisorId
   *   One of ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.Xxx.
   *
   * @return {boolen} Return true, if it has excitation step.
   */
  static hasExcitation( nSqueezeExcitationChannelCountDivisorId ) {
    if ( nSqueezeExcitationChannelCountDivisorId
           > SqueezeExcitationChannelCountDivisor.Singleton.Ids.NONE ) // (-2)
      return true;
    return false;
  }

  /**
   * @param {number} nSqueezeExcitationChannelCountDivisorId
   *   One of ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.Xxx.
   *
   * @return {boolen} Return true, if it has squeeze step.
   */
  static hasSqueeze( nSqueezeExcitationChannelCountDivisorId ) {
    if ( nSqueezeExcitationChannelCountDivisorId
           >= SqueezeExcitationChannelCountDivisor.Singleton.Ids.SQUEEZE_EXCITATION ) // (0)
      return true;
    return false;
  }

  /**
   * @param {number} nSqueezeExcitationChannelCountDivisorId
   *   One of ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.Xxx.
   *
   * @return {boolen} Return true, if it has intermediate step.
   */
  static hasIntermediate( nSqueezeExcitationChannelCountDivisorId ) {
    if ( nSqueezeExcitationChannelCountDivisorId >= 1 )
      return true;
    return false;
  }

}


/**
 * A pool for Squeeze-and-Excitation name.
 * 
 * It could reduce re-creating them again and again so that memory heap
 * fragmentation could be reduced (and then performance be improved).
 */
class SE_Name_Bag extends MultiLayerMap.Base {

  /**
   */
  constructor() {
    super();
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
  }

  /**
   * @see SE_Name_Bag.create_by()
   */
  get_by(
    channelGroupIndex, prefix_or_postfix, operationName,
    nSqueezeExcitationChannelCountDivisor ) {

    // Note: Although it is time consuming when using string parameters
    //       (i.e. prefix_or_postfix and operationName) as comparison key, it
    //       is still worth because MultiLayerMap reduces generating same
    //       string again and again.
    return this.get_or_create_by_arguments1_etc(
      SE_Name_Bag.create_by, this,
      channelGroupIndex, prefix_or_postfix, operationName,
      nSqueezeExcitationChannelCountDivisor );
  }

  /**
   * @param {number} channelGroupIndex
   *   An integer (either 0 or 1).
   *
   * @param {string} prefix_or_postfix
   *   A string (either "prefix" or "postfix").
   *
   * @param {string} operationName
   *   A string (either "squeezeDepthwise" or "intermediatePointwise" or
   * "excitationPointwise" or "multiply"). If null or undefined, it means
   * unknown operation.
   *
   * @param {number} nSqueezeExcitationChannelCountDivisor
   *   A positive integer between [ 1, 64 ]. If null or undefined, it means no
   * intermediate pointwise convolution. Usuallly, only if
   * operationName is "intermediatePointwise", this parameter value should be
   * provided.
   *
   * @return {string}
   *   Return a string similar to "SE0_postfix_intermediatePointwis_divisor_Xx"
   * according to the divisor integer value.
   */
  static create_by(
    channelGroupIndex, prefix_or_postfix, operationName,
    nSqueezeExcitationChannelCountDivisor ) {

    let str = `SE${channelGroupIndex}_${prefix_or_postfix}`;

    if (   ( operationName !== undefined )
        && ( operationName !== null ) )
      str += `_${operationName}`;

    if (   ( nSqueezeExcitationChannelCountDivisor !== undefined )
        && ( nSqueezeExcitationChannelCountDivisor !== null ) )
      str += `_divisor_${nSqueezeExcitationChannelCountDivisor}`;

    return str;
  }

}


/** The only one ValueDesc.SqueezeExcitationChannelCountDivisor instance. */
SqueezeExcitationChannelCountDivisor.Singleton
  = new SqueezeExcitationChannelCountDivisor;
