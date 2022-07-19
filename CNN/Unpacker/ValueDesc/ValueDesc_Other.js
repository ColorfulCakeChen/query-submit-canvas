export { Pointwise_HigherHalfDifferent };
export { Depthwise_HigherHalfDifferent };
export { AvgMax_Or_ChannelMultiplier };

import { Int } from "./ValueDesc_Base.js";

/** Describe id, range, name of the processing mode of pointwise convolution's higher half channels.
 *
 * Convert number value into integer between [ 0, 4 ] representing:
 *   - 0: NONE                                                 (normal poitwise convolution. no higher half different.)
 *   - 1: HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH (pointwise1 of ShuffleNetV2_ByMobileNetV1's head) ( pointwise1ChannelCount == 0 )
 *   - 2: HIGHER_HALF_COPY_LOWER_HALF                          (pointwise1 of ShuffleNetV2_ByMobileNetV1's head) ( pointwise1ChannelCount > 0 )
 *   - 3: HIGHER_HALF_ANOTHER_POINTWISE                        (pointwise2 of ShuffleNetV2_ByMobileNetV1's head)
 *   - 4: HIGHER_HALF_PASS_THROUGH                             (pointwise1/pointwise2 of ShuffleNetV2_ByMobileNetV1's body/tail)
 */
class Pointwise_HigherHalfDifferent extends Int {

  constructor() {
    super( 0, 4, {
      NONE:                                                 0,
      HIGHER_HALF_COPY_LOWER_HALF__LOWER_HALF_PASS_THROUGH: 1,
      HIGHER_HALF_COPY_LOWER_HALF:                          2,
      HIGHER_HALF_ANOTHER_POINTWISE:                        3,
      HIGHER_HALF_PASS_THROUGH:                             4,
    } );
  }

}

/** The only one ValueDesc.Pointwise_HigherHalfDifferent instance. */
Pointwise_HigherHalfDifferent.Singleton = new Pointwise_HigherHalfDifferent;


/** Describe id, range, name of the processing mode of depthwise convolution's higher half channels.
 *
 * Convert number value into integer between [ 0, 2 ] representing:
 *   - 0: NONE                                    (normal depthwise convolution. no higher half different.)
 *   - 1: HIGHER_HALF_DEPTHWISE2                  (depthwise1 of ShuffleNetV2_ByMobileNetV1's head)
 *   - 2: HIGHER_HALF_PASS_THROUGH                (depthwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)

//!!! (2022/07/13 Remarked) Does not work.
// *   - 3: HIGHER_HALF_COPY_LOWER_HALF_DEPTHWISE2  (depthwise1 of ShuffleNetV2_ByMobileNetV1's head when ( pointwiseChannelCount == 0 )

 *                                                   and ( depthwise_AvgMax_Or_ChannelMultiplier == 2 ) )
 */
class Depthwise_HigherHalfDifferent extends Int {

  constructor() {
    super( 0, 2, {
      NONE:                     0,
      HIGHER_HALF_DEPTHWISE2:   1,
      HIGHER_HALF_PASS_THROUGH: 2,

//!!! (2022/07/13 Remarked) Does not work.
//      "HIGHER_HALF_COPY_LOWER_HALF_DEPTHWISE2: 3)
    } );
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
    super( -2, 32, { AVG: -2, MAX: -1, NONE: 0 } );
  }

}

/** The only one ValueDesc.AvgMax_Or_ChannelMultiplier instance. */
AvgMax_Or_ChannelMultiplier.Singleton = new AvgMax_Or_ChannelMultiplier;

