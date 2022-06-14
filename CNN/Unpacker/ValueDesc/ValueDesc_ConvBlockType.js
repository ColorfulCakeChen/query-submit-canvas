export { ConvBlockType };

import { Int } from "./ValueDesc_Base.js";

/** Describe id, range, name of ConvBlockType.
 *
 * Convert number value into integer between [ -6, ( 10 * 1024 ) ] representing operation:
 *   - 0: MOBILE_NET_V1_HEAD_BODY_TAIL               (General Pointwise1-Depthwise1-Pointwise2)
 *                                                   (MobileNetV1 or
 *                                                    MobileNetV2's head or
 *                                                    ShuffleNetV2_ByPointwise21's head with ( pointwise1ChannelCount == 0 ))
 *
 *   - 1: MOBILE_NET_V2_BODY_TAIL
 *   - 2: SHUFFLE_NET_V2_HEAD
 *   - 3: SHUFFLE_NET_V2_BODY
 *   - 4: SHUFFLE_NET_V2_TAIL
 *   - 5: SHUFFLE_NET_V2_BY_POINTWISE21_HEAD         (ShuffleNetV2_ByPointwise21's head with ( pointwise1ChannelCount >= 1 ))
 *   - 6: SHUFFLE_NET_V2_BY_POINTWISE21_BODY
 *   - 7: SHUFFLE_NET_V2_BY_POINTWISE21_TAIL
 *   - 8: SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD
 *   - 9: SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_TAIL
 */
class ConvBlockType extends Int {

  constructor() {
    super( 0, 9, [
      "MOBILE_NET_V1_HEAD_BODY_TAIL",               // ( 0)
      "MOBILE_NET_V2_BODY_TAIL",                    // ( 1)
      "SHUFFLE_NET_V2_HEAD",                        // ( 2)
      "SHUFFLE_NET_V2_BODY",                        // ( 3)
      "SHUFFLE_NET_V2_TAIL",                        // ( 4)
      "SHUFFLE_NET_V2_BY_POINTWISE21_HEAD",         // ( 5)
      "SHUFFLE_NET_V2_BY_POINTWISE21_BODY",         // ( 6)
      "SHUFFLE_NET_V2_BY_POINTWISE21_TAIL",         // ( 7)
      "SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD",       // ( 8)
      "SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_TAIL",  // ( 9)
    ] );
  }

}

/** The only one ValueDesc.ConvBlockType instance. */
ConvBlockType.Singleton = new ConvBlockType;

