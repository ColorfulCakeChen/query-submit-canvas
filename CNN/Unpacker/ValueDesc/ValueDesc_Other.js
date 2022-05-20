export { channelCount1_pointwise1Before };
export { Pointwise_HigherHalfDifferent };
export { Depthwise_HigherHalfDifferent };
export { AvgMax_Or_ChannelMultiplier };
export { SqueezeExcitationChannelCountDivisor };

import { Int } from "./ValueDesc_Base.js";


/** Describe id, range, name of channelCount1_pointwise1Before.
 *
 * Convert number value into integer between [ -5, ( 10 * 1024 ) ] representing operation:
 *   - -5: ONE_INPUT_HALF_THROUGH                   (ShuffleNetV2_ByMobileNetV1's body/tail)
 *   - -4: ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (ShuffleNetV2_ByMobileNetV1's head)
 *   - -3: TWO_INPUTS_CONCAT_POINTWISE21_INPUT1     (ShuffleNetV2's body/tail)
 *   - -2: ONE_INPUT_TWO_DEPTHWISE                  (ShuffleNetV2's head (and ShuffleNetV2_ByPointwise22's head) (simplified))
 *   - -1: ONE_INPUT_ADD_TO_OUTPUT                  (MobileNetV2)
 *   -  0: ONE_INPUT                                (MobileNetV1 (General Pointwise1-Depthwise1-Pointwise2)
 *   - [ 1, ( 10 * 1024 ) ]: TWO_INPUTS with the second input channel count between 1 and 10240 (inclusive). (without names defined.)
 */
class channelCount1_pointwise1Before extends Int {

  constructor() {
    super( -5, ( 10 * 1024 ), [
      "ONE_INPUT_HALF_THROUGH",                   // (-5)
      "ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1", // (-4)
      "TWO_INPUTS_CONCAT_POINTWISE21_INPUT1",     // (-3)
      "ONE_INPUT_TWO_DEPTHWISE",                  // (-2)
      "ONE_INPUT_ADD_TO_OUTPUT",                  // (-1)
      "ONE_INPUT",                                // ( 0)

      // "TWO_INPUTS_1", "TWO_INPUTS_2", ..., "TWO_INPUTS_10240".
      //
      // ShuffleNetV2's (and ShuffleNetV2_ByPointwise22's) body/tail
      //
      // (2021/07/13 Remarked) Do not define these names because they will occupy too many memory.
      //
      //... [ ... new Array( 10 * 1024 ).keys() ].map( x => "TWO_INPUTS_" + ( x + 1 ) )
    ] );
  }

}

/** The only one ValueDesc.channelCount1_pointwise1Before instance. */
channelCount1_pointwise1Before.Singleton = new channelCount1_pointwise1Before;


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


/** Describe squeeze-and-excitation channel count divisor's id, range, name.
 *
 * Convert number value into integer between [ -2, 64 ] representing depthwise operation:
 *   - -2: NONE                                  (no squeeze, no excitation, no multiply)
 *   - -1: EXCITATION_1                          (no squeeze, no intermediate excitation)
 *   -  0: SQUEEZE_EXCITATION_1                  (has squeeze, no intermediate excitation)
 *   - [ 1, 64 ]: SQUEEZE_EXCITATION_2_DIVISOR_N (has squeeze, has intermediate excitation ( input_channel_count / this_divisor ) )
 */
class SqueezeExcitationChannelCountDivisor extends Int {

  constructor() {
    super( -2, 64, [
      "NONE",                 // (-2)
      "EXCITATION_1",         // (-1)
      "SQUEEZE_EXCITATION_1", // ( 0)

      // "SQUEEZE_EXCITATION_2_DIVISOR_1", "SQUEEZE_EXCITATION_2_DIVISOR_2", ..., "SQUEEZE_EXCITATION_2_DIVISOR_64".
      //
      // (2022/05/19 Remarked) Do not define these names because they will occupy too many memory.
      //
      //... [ ... new Array( 64 ).keys() ].map( x => "SQUEEZE_EXCITATION_2_DIVISOR_" + ( x + 1 ) )
    ] );
  }

}

/** The only one ValueDesc.SqueezeExcitationChannelCountDivisor instance. */
SqueezeExcitationChannelCountDivisor.Singleton = new SqueezeExcitationChannelCountDivisor;

