export { ConvBlockType };

import { Int } from "./ValueDesc_Base.js";

/** Describe id, range, name of ConvBlockType (Convolution Block Type).
 *
 * Convert number value into integer between [ 0, 6 ] representing operation:
 *   - 0: MOBILE_NET_V1                             (i.e. no-add-inut-to-output, pointwise1 is same size of pointwise21)
 *   - 1: MOBILE_NET_V1_PAD_VALID                   (i.e. no-add-inut-to-output, pointwise1 is same size of pointwise21, depthwise1 with ( pad = "valid" ))
 *   - 2: MOBILE_NET_V2                             (i.e. add-inut-to-output, pointwise1 is tiwce size of pointwise21)
 *   - 3: MOBILE_NET_V2_THIN                        (i.e. add-inut-to-output, pointwise1 is same size of pointwise21)
 *   - 4: SHUFFLE_NET_V2                            (i.e. by channel shuffler)
 *   - 5: SHUFFLE_NET_V2_BY_POINTWISE22             (i.e. by pointwise22)
 *   - 6: SHUFFLE_NET_V2_BY_MOBILE_NET_V1           (i.e. by integrated pointwise1, depthwise1, pointwise21)
 *   - 7: SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (i.e. by depthwise1 with ( pad = "valid" ) )
 */
class ConvBlockType extends Int {

  constructor() {
    super( 0, 7, [
      "MOBILE_NET_V1",                             // (0)
      "MOBILE_NET_V1_PAD_VALID",                   // (1)
      "MOBILE_NET_V2",                             // (2)
      "MOBILE_NET_V2_THIN",                        // (3)
      "SHUFFLE_NET_V2",                            // (4)
      "SHUFFLE_NET_V2_BY_POINTWISE22",             // (5)
      "SHUFFLE_NET_V2_BY_MOBILE_NET_V1",           // (6)
      "SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID", // (7)
    ] );
  }

  /**
   * @param {number} nConvBlockType  The numeric identifier of ConvBlockType. (ConvBlockType.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if it is MOBILE_NET_Xxx.
   */
  static isMobileNet( nConvBlockType ) {
    switch ( nConvBlockType ) {
      case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1: // (0)
      case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
      case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2: // (2)
      case ValueDesc.ConvBlockType.Ids.MOBILE_NET_V2_THIN: // (3)
        return true;
      default:
        return false;
    }
  }

  /**
   * @param {number} nConvBlockType  The numeric identifier of ConvBlockType. (ConvBlockType.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if it is SHUFFLE_NET_Xxx.
   */
  static isShuffleNet( nConvBlockType ) {
    switch ( nConvBlockType ) {
      case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2: // (4)
      case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_POINTWISE22: // (5)
      case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
      case ValueDesc.ConvBlockType.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
        return true;
      default:
        return false;
    }
  }

}

/** The only one ValueDesc.ConvBlockType instance. */
ConvBlockType.Singleton = new ConvBlockType;
