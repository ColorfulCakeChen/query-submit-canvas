export { channelCount1_pointwise1Before };
export { Pointwise_HigherHalfDifferent };
export { Depthwise_HigherHalfDifferent };
export { AvgMax_Or_ChannelMultiplier };

import { Int } from "./ValueDesc_Base.js";

//!!! (2022/06/14 Remarked) Replaced by ConvBlockType.
//
// //!!! ...unfinished... (2022/06/12)
// // Perhaps, integrated bOutput1Requested into this enumeration.
//
// /** Describe id, range, name of channelCount1_pointwise1Before.
//  *
//  * Convert number value into integer between [ -6, ( 10 * 1024 ) ] representing operation:
//  *   - -6: SHUFFLE_NET_V2_HEAD                      (ShuffleNetV2's head)
//  *   - -5: ONE_INPUT_HALF_THROUGH                   (ShuffleNetV2_ByMobileNetV1's body/tail)
//  *   - -4: ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (ShuffleNetV2_ByMobileNetV1's head)
//  *   - -3: TWO_INPUTS_CONCAT_POINTWISE20_INPUT1     (ShuffleNetV2's body/tail)
//  *   - -2: SHUFFLE_NET_V2_BY_POINTWISE21_HEAD       (ShuffleNetV2_ByPointwise21's head with ( pointwise1ChannelCount >= 1 ))
//
// //!!! (2022/06/14 Remarked)
// // *   - -2: ONE_INPUT_TWO_DEPTHWISE                  (ShuffleNetV2's head simplified with ( pointwise1ChannelCount >= 1 ) or
// // *                                                   ShuffleNetV2_ByPointwise21's head with ( pointwise1ChannelCount >= 1 ))
//
//  *
//  *   - -1: ONE_INPUT_ADD_TO_OUTPUT                  (MobileNetV2)
//  *   -  0: ONE_INPUT                                (General Pointwise1-Depthwise1-Pointwise2)
//  *                                                  (MobileNetV1 or
//  *                                                   MobileNetV2's head or
//
// //!!! (2022/06/14 Remarked)
// // *                                                   ShuffleNetV2's head simplified with ( pointwise1ChannelCount == 0 ) or
//
//  *                                                   ShuffleNetV2_ByPointwise21's head with ( pointwise1ChannelCount == 0 ))
//  *
//  *   - [ 1, ( 10 * 1024 ) ]: TWO_INPUTS with the second input channel count between 1 and 10240 (inclusive). (without names defined.)
//  *                                                  (ShuffleNetV2_ByPointwise21's body/tail)
//  */
// class channelCount1_pointwise1Before extends Int {
//
//   constructor() {
//     super( -6, ( 10 * 1024 ), [
//       "SHUFFLE_NET_V2_HEAD",                      // (-6)
//       "ONE_INPUT_HALF_THROUGH",                   // (-5)
//       "ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1", // (-4)
//       "TWO_INPUTS_CONCAT_POINTWISE20_INPUT1",     // (-3)
//       "SHUFFLE_NET_V2_BY_POINTWISE21_HEAD",       // (-2)
//       "ONE_INPUT_ADD_TO_OUTPUT",                  // (-1)
//       "ONE_INPUT",                                // ( 0)
//
//       // "TWO_INPUTS_1", "TWO_INPUTS_2", ..., "TWO_INPUTS_10240".
//       //
//       // ShuffleNetV2's (and ShuffleNetV2_ByPointwise21's) body/tail
//       //
//       // (2021/07/13 Remarked) Do not define these names because they will occupy too many memory.
//       //
//       //... [ ... new Array( 10 * 1024 ).keys() ].map( x => "TWO_INPUTS_" + ( x + 1 ) )
//     ] );
//   }
//
// }
//
// /** The only one ValueDesc.channelCount1_pointwise1Before instance. */
// channelCount1_pointwise1Before.Singleton = new channelCount1_pointwise1Before;


/** Describe id, range, name of the processing mode of pointwise convolution's higher half channels.
 *
 * Convert number value into integer between [ 0, 4 ] representing:
 *   - 0: NONE                                                 (normal poitwise convolution. no higher half different.)
 *   - 1: HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH (pointwise1 of ShuffleNetV2_ByMopbileNetV1's head) ( pointwise1ChannelCount == 0 )
 *   - 2: HIGHER_HALF_COPY_LOWER_HALF                          (pointwise1 of ShuffleNetV2_ByMopbileNetV1's head) ( pointwise1ChannelCount > 0 )
 *   - 3: HIGHER_HALF_ANOTHER_POINTWISE                        (pointwise2 of ShuffleNetV2_ByMopbileNetV1's head)
 *   - 4: HIGHER_HALF_PASS_THROUGH                             (pointwise1/pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 */
class Pointwise_HigherHalfDifferent extends Int {

  constructor() {
    super( 0, 4, [
      "NONE",                                                 // (0)
      "HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH", // (1)
      "HIGHER_HALF_COPY_LOWER_HALF",                          // (2)
      "HIGHER_HALF_ANOTHER_POINTWISE",                        // (3)
      "HIGHER_HALF_PASS_THROUGH",                             // (4)
    ] );
  }

}

/** The only one ValueDesc.Pointwise_HigherHalfDifferent instance. */
Pointwise_HigherHalfDifferent.Singleton = new Pointwise_HigherHalfDifferent;


/** Describe id, range, name of the processing mode of depthwise convolution's higher half channels.
 *
 * Convert number value into integer between [ 0, 2 ] representing:
 *   - 0: NONE                     (normal depthwise convolution. no higher half different.)
 *   - 1: HIGHER_HALF_DEPTHWISE2   (depthwise1 of ShuffleNetV2_ByMopbileNetV1's head)
 *   - 2: HIGHER_HALF_PASS_THROUGH (depthwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail)
 */
class Depthwise_HigherHalfDifferent extends Int {

  constructor() {
    super( 0, 2, [
      "NONE",                     // (0)
      "HIGHER_HALF_DEPTHWISE2",   // (1)
      "HIGHER_HALF_PASS_THROUGH", // (2)
    ] );
  }

}

/** The only one ValueDesc.Depthwise_HigherHalfDifferent instance. */
Depthwise_HigherHalfDifferent.Singleton = new Depthwise_HigherHalfDifferent;


/** Describe depthwise operation's id, range, name.
 *
 * Convert number value into integer between [ -2, 32 ] representing depthwise operation:
 *   - -2: average pooling. (AVG)
 *   - -1: maximum pooling. (MAX)
 *   -  0: no depthwise operation. (NONE)
 *   - [ 1, 32 ]: depthwise convolution with channel multiplier between 1 and 32 (inclusive).
 */
class AvgMax_Or_ChannelMultiplier extends Int {

  constructor() {
    super( -2, 32, [ "AVG", "MAX", "NONE" ] );
  }

}

/** The only one ValueDesc.AvgMax_Or_ChannelMultiplier instance. */
AvgMax_Or_ChannelMultiplier.Singleton = new AvgMax_Or_ChannelMultiplier;

