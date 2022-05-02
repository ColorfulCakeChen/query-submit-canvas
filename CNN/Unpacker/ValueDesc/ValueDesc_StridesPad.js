export { StridesPad };

import { Int } from "./ValueDesc_Base.js";

/** Describe id, range, name of (convolution's) strides and pad.
 *
 * Convert number value into integer between [ 0, 3 ] representing strides and pad:
 *   -  0: STRIDES_1_PAD_VALID (strides = 1, pad = "valid")
 *   -  1: STRIDES_1_PAD_SAME  (strides = 1, pad = "same")
 *   -  2: STRIDES_2_PAD_SAME  (strides = 2, pad = "same")
 *   -  3: STRIDES_2_PAD_VALID (strides = 2, pad = "valid")
 */
class StridesPad extends Int {

  constructor() {
    super( 0, 3, [
      "STRIDES_1_PAD_VALID", // (0) (strides = 1, pad = "valid")
      "STRIDES_1_PAD_SAME",  // (1) (strides = 1, pad = "same")
      "STRIDES_2_PAD_SAME",  // (2) (strides = 2, pad = "same")
      "STRIDES_2_PAD_VALID", // (3) (strides = 2, pad = "valid")
    ] );
  }

  /**
   * @param {number} nStridesPadIds  The numeric identifier of StridesPad. (StridesPad.Singleton.Ids.Xxx)
   * @return {number} Return the strides (1 or 2) of the StridesPad.Singleton.Ids.Xxx.
   */
  static strides_get( nStridesPadIds ) {
    switch ( nStridesPadIds ) {
      case StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID: return 1; // (0)
      case StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME:  return 1; // (1)
      case StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME:  return 2; // (2)
      case StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID: return 2; // (3)
      default:
        return NaN;
    }
  }

  /**
   * @param {number} nStridesPadIds  The numeric identifier of StridesPad. (StridesPad.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if the pad of the StridesPad.Singleton.Ids.Xxx is "valid".
   */
  static pad_isValid( nStridesPadIds ) {
    switch ( nStridesPadIds ) {
      case StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID: // (0)
      case StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID: // (3)
        return true;
      default:
        return false;
    }
  }

  /**
   * @param {number} nStridesPadIds  The numeric identifier of StridesPad. (StridesPad.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if the pad of the StridesPad.Singleton.Ids.Xxx is "same".
   */
  static pad_isSame( nStridesPadIds ) {
    switch ( nStridesPadIds ) {
      case StridesPad.Singleton.Ids.STRIDES_1_PAD_SAME:  // (1)
      case StridesPad.Singleton.Ids.STRIDES_2_PAD_SAME:  // (2)
        return true;
      default:
        return false;
    }
  }

}

/** The only one ValueDesc.StridesPad instance. */
StridesPad.Singleton = new StridesPad;

