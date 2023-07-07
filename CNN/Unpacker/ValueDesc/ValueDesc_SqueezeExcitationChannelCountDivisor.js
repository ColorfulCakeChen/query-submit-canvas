export { SqueezeExcitationChannelCountDivisor };

import { Int } from "./ValueDesc_Base.js";

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

/** The only one ValueDesc.SqueezeExcitationChannelCountDivisor instance. */
SqueezeExcitationChannelCountDivisor.Singleton
  = new SqueezeExcitationChannelCountDivisor;
