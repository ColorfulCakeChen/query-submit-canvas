export { channelCount1_pointwise1Before };
export { Pointwise_HigherHalfDifferent };
export { Depthwise_HigherHalfDifferent };
export { AvgMax_Or_ChannelMultiplier };
export { ConvBlock };

import { Int } from "./ValueDesc_Base.js";


/** Describe id, range, name of channelCount1_pointwise1Before.
 *
 * Convert number value into integer between [ -5, ( 10 * 1024 ) ] representing operation:
 *   - -5: ONE_INPUT_HALF_THROUGH
 *   - -4: ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1
 *   - -3: TWO_INPUTS_CONCAT_POINTWISE21_INPUT1
 *   - -2: ONE_INPUT_TWO_DEPTHWISE
 *   - -1: ONE_INPUT_ADD_TO_OUTPUT
 *   -  0: ONE_INPUT
 *   - [ 1, ( 10 * 1024 ) ]: TWO_INPUTS with the second input channel count between 1 and 10240 (inclusive). (without names defined.)
 */
class channelCount1_pointwise1Before extends Int {

  constructor() {
    super( -5, ( 10 * 1024 ), [
      "ONE_INPUT_HALF_THROUGH",                   // (-5) ShuffleNetV2_ByMobileNetV1's body/tail
      "ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1", // (-4) ShuffleNetV2_ByMobileNetV1's head
      "TWO_INPUTS_CONCAT_POINTWISE21_INPUT1",     // (-3) ShuffleNetV2's body/tail
      "ONE_INPUT_TWO_DEPTHWISE",                  // (-2) ShuffleNetV2's head (and ShuffleNetV2_ByPointwise22's head) (simplified)
      "ONE_INPUT_ADD_TO_OUTPUT",                  // (-1) MobileNetV2
      "ONE_INPUT",                                // ( 0) MobileNetV1 (General Pointwise1-Depthwise1-Pointwise2)

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
 *   - 0: NONE
 *   - 1: HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH
 *   - 2: HIGHER_HALF_COPY_LOWER_HALF
 *   - 3: HIGHER_HALF_ANOTHER_POINTWISE
 *   - 4: HIGHER_HALF_PASS_THROUGH
 */
class Pointwise_HigherHalfDifferent extends Int {

  constructor() {
    super( 0, 4, [
      "NONE",                                                 // (0) (for normal poitwise convolution. no higher half different.)
      "HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH", // (1) (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head)
      "HIGHER_HALF_COPY_LOWER_HALF",                          // (2) (for pointwise1 of ShuffleNetV2_ByMopbileNetV1's head)
      "HIGHER_HALF_ANOTHER_POINTWISE",                        // (3) (for pointwise2 of ShuffleNetV2_ByMopbileNetV1's head)
      "HIGHER_HALF_PASS_THROUGH",                             // (4) (for pointwise1/pointwise2 of ShuffleNetV2_ByMopbileNetV1's body/tail)
    ] );
  }

}

/** The only one ValueDesc.Pointwise_HigherHalfDifferent instance. */
Pointwise_HigherHalfDifferent.Singleton = new Pointwise_HigherHalfDifferent;


/** Describe id, range, name of the processing mode of depthwise convolution's higher half channels.
 *
 * Convert number value into integer between [ 0, 2 ] representing:
 *   - 0: NONE
 *   - 1: HIGHER_HALF_DEPTHWISE2
 *   - 2: HIGHER_HALF_PASS_THROUGH
 */
class Depthwise_HigherHalfDifferent extends Int {

  constructor() {
    super( 0, 2, [
      "NONE",                     // (0) (for normal depthwise convolution. no higher half different.)
      "HIGHER_HALF_DEPTHWISE2",   // (1) (for depthwise1 of ShuffleNetV2_ByMopbileNetV1's head)
      "HIGHER_HALF_PASS_THROUGH", // (2) (for depthwise1 of ShuffleNetV2_ByMopbileNetV1's body/tail)
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


/** Describe id, range, name of ConvBlock (Convolution Block).
 *
 * Convert number value into integer between [ 0, 6 ] representing operation:
 *   - 0: MOBILE_NET_V1                             (i.e. no-add-inut-to-output)
 *   - 1: MOBILE_NET_V2_DOUBLE_POINTWISE1           (i.e. pointwise1 double, add-inut-to-output)
 *   - 2: MOBILE_NET_V2_QUADRUPLE_POINTWISE1        (i.e. pointwise1 quadruple, add-inut-to-output)
 *   - 3: SHUFFLE_NET_V2                            (i.e. by channel shuffler)
 *   - 4: SHUFFLE_NET_V2_BY_POINTWISE22             (i.e. by pointwise22)
 *   - 5: SHUFFLE_NET_V2_BY_MOBILE_NET_V1           (i.e. by integrated pointwise1, depthwise1, pointwise21)
 *   - 6: SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (i.e. by depthwise1 with ( pad = "valid" )
 */
class ConvBlock extends Int {

  constructor() {
    super( 0, 6, [
      "MOBILE_NET_V1",                             // (0)
      "MOBILE_NET_V2_DOUBLE_POINTWISE1",           // (1)
      "MOBILE_NET_V2_QUADRUPLE_POINTWISE1",        // (2)
      "SHUFFLE_NET_V2",                            // (3)
      "SHUFFLE_NET_V2_BY_POINTWISE22",             // (4)
      "SHUFFLE_NET_V2_BY_MOBILE_NET_V1",           // (5)
      "SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID", // (6)
    ] );
  }

}

/** The only one ValueDesc.WhetherShuffleChannel instance. */
WhetherShuffleChannel.Singleton = new WhetherShuffleChannel;

