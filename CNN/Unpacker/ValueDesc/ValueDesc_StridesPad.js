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
      [
        "STRIDES_1_PAD_VALID", // (0) (strides = 1, pad = "valid")
        "STRIDES_1_PAD_SAME",  // (1) (strides = 1, pad = "same")
        "STRIDES_2_PAD_SAME",  // (2) (strides = 2, pad = "same")
        "STRIDES_2_PAD_VALID", // (3) (strides = 2, pad = "valid")
      ],

      [
        new StridesPad.Info( 0, 1, StridesPad.Info.PAD_VALID ),
        new StridesPad.Info( 1, 1, StridesPad.Info.PAD_SAME  ),
        new StridesPad.Info( 2, 2, StridesPad.Info.PAD_SAME  ),
        new StridesPad.Info( 3, 2, StridesPad.Info.PAD_VALID ),
      ],
    );
  }

  /**
   * @param {number} nStridesPadId  The numeric identifier of StridesPad. (StridesPad.Singleton.Ids.Xxx)
   * @return {number} Return the strides (1 or 2) of the StridesPad.Singleton.Ids.Xxx.
   */
  static strides_get( nStridesPadId ) {
    let info = StridesPad.Singleton.getInfoById( nStridesPadId );
    if ( info )
      return info.strides;
    return NaN;
  }

  /**
   * @param {number} nStridesPadId  The numeric identifier of StridesPad. (StridesPad.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if the pad of the StridesPad.Singleton.Ids.Xxx is "valid".
   */
  static pad_isValid( nStridesPadId ) {
    let info = StridesPad.Singleton.getInfoById( nStridesPadId );
    if ( info )
      return info.pad_isValid();
    return false;
  }

  /**
   * @param {number} nStridesPadIds  The numeric identifier of StridesPad. (StridesPad.Singleton.Ids.Xxx)
   * @return {boolean} Return true, if the pad of the StridesPad.Singleton.Ids.Xxx is "same".
   */
  static pad_isSame( nStridesPadId ) {
    let info = StridesPad.Singleton.getInfoById( nStridesPadId );
    if ( info )
      return info.pad_isSame();
    return false;
  }

  /**
   * Convert strides-pad style id to information object.
   *
   * @param {number} nStridesPadId
   *   It should be one of ValueDesc.StridesPad.Singleton.Ids.Xxx.
   *
   * @return {StridesPad.Info}
   *   It should be one of ValueDesc.StridesPad.Singleton.integerToObjectMap according to the nStridesPadId.
   */
  getInfoById( nStridesPadId ) {
    let info = this.integerToObjectMap.get( nStridesPadId );
    return info;
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
 *   The type of padding algorithm for the strides-pad. Either "valid" or "same".
 *
 */
StridesPad.Info = class {

  constructor( nStridesPadId, strides, pad ) {
    this.nStridesPadId = nStridesPadId;
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

