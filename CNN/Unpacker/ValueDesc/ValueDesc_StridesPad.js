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
    super( 0, 3,
      {
        STRIDES_1_PAD_VALID: new StridesPad.Info(
          0, "STRIDES_1_PAD_VALID", 1, StridesPad.Info.PAD_VALID ),

        STRIDES_1_PAD_SAME:  new StridesPad.Info(
          1, "STRIDES_1_PAD_SAME",  1, StridesPad.Info.PAD_SAME  ),

        STRIDES_2_PAD_SAME:  new StridesPad.Info(
          2, "STRIDES_2_PAD_SAME",  2, StridesPad.Info.PAD_SAME  ),

        STRIDES_2_PAD_VALID: new StridesPad.Info(
          3, "STRIDES_2_PAD_VALID", 2, StridesPad.Info.PAD_VALID ),
      },
    );
  }

  /**
   * @param {number} nStridesPadId
   *   The numeric identifier of StridesPad. (StridesPad.Singleton.Ids.Xxx)
   *
   * @return {number}
   *   Return the strides (1 or 2) of the StridesPad.Singleton.Ids.Xxx.
   */
  static strides_get( nStridesPadId ) {
    let info = StridesPad.Singleton.getInfo_byId( nStridesPadId );
    if ( info )
      return info.strides;
    return NaN;
  }

  /**
   * @param {number} nStridesPadId
   *   The numeric identifier of StridesPad. (StridesPad.Singleton.Ids.Xxx)
   *
   * @return {boolean}
   *   Return true, if the pad of the StridesPad.Singleton.Ids.Xxx is "valid".
   */
  static pad_isValid( nStridesPadId ) {
    let info = StridesPad.Singleton.getInfo_byId( nStridesPadId );
    if ( info )
      return info.pad_isValid();
    return false;
  }

  /**
   * @param {number} nStridesPadIds
   *   The numeric identifier of StridesPad. (StridesPad.Singleton.Ids.Xxx)
   *
   * @return {boolean}
   *   Return true, if the pad of the StridesPad.Singleton.Ids.Xxx is "same".
   */
  static pad_isSame( nStridesPadId ) {
    let info = StridesPad.Singleton.getInfo_byId( nStridesPadId );
    if ( info )
      return info.pad_isSame();
    return false;
  }

}


/**
 *
 * @member {number} nStridesPadId
 *   The strides-pad id (ValueDesc.StridesPad.Singleton.Ids.Xxx).
 *
 * @member {number} strides
 *   The strides for strides-pad. Either 1 or 2.
 *
 * @member {string} pad
 *   The type of padding algorithm for the strides-pad. Either "valid" or
 * "same".
 *
 */
StridesPad.Info = class StridesPad_Info extends Int.Info {

  constructor( nStridesPadId, nameForMessage, strides, pad ) {
    super ( nStridesPadId, nameForMessage );
    this.strides = strides;
    this.pad = pad;
  }

  /**
   * @return {boolean} Return true, if the pad is "valid".
   */
  pad_isValid() {
    if ( this.pad === StridesPad.Info.PAD_VALID )
      return true;
    return false;
  }

  /**
   * @return {boolean} Return true, if the pad is "same".
   */
  pad_isSame() {
    if ( this.pad === StridesPad.Info.PAD_SAME )
      return true;
    return false;
  }

}

// Defined for faster comparison in pad_isValid() and pad_isSame().
StridesPad.Info.PAD_VALID = "valid";
StridesPad.Info.PAD_SAME = "same";


/** The only one ValueDesc.StridesPad instance. */
StridesPad.Singleton = new StridesPad;
