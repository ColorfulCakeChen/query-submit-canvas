export { ConvStageType };

import { Int } from "./ValueDesc_Base.js";

/** Describe id, range, name of ConvStageType (Convolution Stage Type).
 *
 * Convert number value into integer between [ 0, 7 ] representing operation:
 *   - 0: MOBILE_NET_V1                             (i.e. no-add-inut-to-output, pointwise1 is same size of pointwise20)
 *   - 1: MOBILE_NET_V1_PAD_VALID                   (i.e. no-add-inut-to-output, pointwise1 is same size of pointwise20, depthwise1 with ( pad = "valid" ))
 *   - 2: MOBILE_NET_V2_THIN                        (i.e. add-inut-to-output, pointwise1 is same size of pointwise20)
 *   - 3: MOBILE_NET_V2                             (i.e. add-inut-to-output, pointwise1 is tiwce size of pointwise20)
 *   - 4: SHUFFLE_NET_V2                            (i.e. by channel shuffler)
 *   - 5: SHUFFLE_NET_V2_BY_POINTWISE21             (i.e. by pointwise21)
 *   - 6: SHUFFLE_NET_V2_BY_MOBILE_NET_V1           (i.e. by integrated pointwise1, depthwise1, pointwise20)
 *   - 7: SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (i.e. by depthwise1 with ( pad = "valid" ) )
 */
class ConvStageType extends Int {

  constructor() {
    super( 0, 7, [
      "MOBILE_NET_V1",                             // (0)
      "MOBILE_NET_V1_PAD_VALID",                   // (1)
      "MOBILE_NET_V2_THIN",                        // (2)
      "MOBILE_NET_V2",                             // (3)
      "SHUFFLE_NET_V2",                            // (4)
      "SHUFFLE_NET_V2_BY_POINTWISE21",             // (5)
      "SHUFFLE_NET_V2_BY_MOBILE_NET_V1",           // (6)
      "SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID", // (7)
    ] );
  }

  /**
   * @param {number} nConvStageType  The numeric identifier of ConvStageType. (ConvStageType.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if it is MOBILE_NET_Xxx.
   */
  static isMobileNet( nConvStageType ) {
    switch ( nConvStageType ) {
      case ConvStageType.Singleton.Ids.MOBILE_NET_V1: // (0)
      case ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
      case ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
      case ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
        return true;
      default:
        return false;
    }
  }

  /**
   * @param {number} nConvStageType  The numeric identifier of ConvStageType. (ConvStageType.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if it is MOBILE_NET_V2_Xxx.
   */
  static isMobileNetV2( nConvStageType ) {
    switch ( nConvStageType ) {
      case ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN: // (2)
      case ConvStageType.Singleton.Ids.MOBILE_NET_V2: // (3)
        return true;
      default:
        return false;
    }
  }

  /**
   * @param {number} nConvStageType  The numeric identifier of ConvStageType. (ConvStageType.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if it is SHUFFLE_NET_Xxx.
   */
  static isShuffleNet( nConvStageType ) {
    switch ( nConvStageType ) {
      case ConvStageType.Singleton.Ids.SHUFFLE_NET_V2: // (4)
      case ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21: // (5)
      case ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1: // (6)
      case ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
        return true;
      default:
        return false;
    }
  }

  /**
   * @param {number} nConvStageType  The numeric identifier of ConvStageType. (ConvStageType.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if it is Xxx_PAD_VALID.
   */
  static isPadValid() {
    switch ( nConvStageType ) {
      case ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID: // (1)
      case ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID: // (7)
        return true;
      default:
        return false;
    }
  }

}

/** The only one ValueDesc.ConvStageType instance. */
ConvStageType.Singleton = new ConvStageType;
