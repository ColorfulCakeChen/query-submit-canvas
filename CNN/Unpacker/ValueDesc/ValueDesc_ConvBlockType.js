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
    super( 0, 9,
      [
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
      ],

      [
         new ConvBlockType.Info( 0, 1, 1, false, , , , false, false,  ),
         new ConvBlockType.Info( 1, 1, 1, false, , , , false, false,  ),
         new ConvBlockType.Info( 2, 1, 2,  true, , , , false, false,  ),
         new ConvBlockType.Info( 3, 2, 2, false, , , , false, false,  ),
         new ConvBlockType.Info( 4, 2, 1, false, , , , false, false,  ),
         new ConvBlockType.Info( 5, 1, 2,  true, , , , false, false,  ),
         new ConvBlockType.Info( 6, 2, 2, false, , , , false, false,  ),
         new ConvBlockType.Info( 7, 2, 1, false, , , , false, false,  ),
         new ConvBlockType.Info( 8, 1, 1, false, , , ,  true,  true,  ),
         new ConvBlockType.Info( 9, 1, 1, false,  true, false,  ),
      ]
    );
  }


  /**
   * @param {number} nConvBlockTypeId  The numeric identifier of ConvBlockType. (ConvBlockType.Singleton.Ids.Xxx)
   * @return {number} Return the input tensor count (1 or 2) of the ConvBlockType.Singleton.Ids.Xxx.
   */
  static inputTensorCount_get( nConvBlockTypeId ) {
    let info = ConvBlockType.Singleton.getInfoById( nConvBlockTypeId );
    if ( info )
      return info.inputTensorCount;
    return NaN;
  }

  /**
   * @param {number} nConvBlockTypeId  The numeric identifier of ConvBlockType. (ConvBlockType.Singleton.Ids.Xxx)
   * @return {number} Return the output tensor count (1 or 2) of the ConvBlockType.Singleton.Ids.Xxx.
   */
  static outputTensorCount_get( nConvBlockTypeId ) {
    let info = ConvBlockType.Singleton.getInfoById( nConvBlockTypeId );
    if ( info )
      return info.outputTensorCount;
    return NaN;
  }

  /**
   * Convert convolution block type id to information object.
   *
   * @param {umber} nConvBlockTypeId
   *   It should be one of ValueDesc.ConvBlockType.Singleton.Ids.Xxx.
   *
   * @return {ConvBlockType.Info}
   *   It should be one of ValueDesc.ConvBlockType.Singleton.integerToObjectMap according to the nStridesPadId.
   */
  getInfoById( nConvBlockTypeId ) {
    let info = this.integerToObjectMap.get( nConvBlockTypeId );
    return info;
  }

}


/**
 *
 * @member {number} nConvBlockTypeId
 *   The convolution block type id (ValueDesc.ConvBlockType.Singleton.Ids.Xxx).
 *
 * @member {number} inputTensorCount
 *   The input tensor count for The convolution block type. Either 1 or 2.
 *
 * @member {number} outputTensorCount
 *   The output tensor count for The convolution block type. Either 1 or 2.
 *
 */
ConvBlockType.Info = class {

  /**
   *
   * @param {boolean} bHigherHalfDifferent
   *   Whether the higher half channels will be handled different. Usually true only if SHUFFLE_NET_V2_BY_MOBILE_NET_V1_XXX.
   *
   * @param {boolean} bHigherHalfDepthwise2
   *   Whether the higher half channels will be processed by depthwise2. Usually true only if SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD.
   *
   *
   */
  constructor( nConvBlockTypeId, inputTensorCount, outputTensorCount,
    bDepthwise2Requested, bConcat1Requested, bAddInputToOutputRequested, bConcat2ShuffleSplitRequested,
    bHigherHalfDifferent, bHigherHalfDepthwise2
  ) {
    this.nConvBlockTypeId = nConvBlockTypeId;
    this.inputTensorCount = inputTensorCount;
    this.outputTensorCount = outputTensorCount;

    this.bDepthwise2Requested = bDepthwise2Requested;
    this.bConcat1Requested = bConcat1Requested;
    this.bAddInputToOutputRequested = bAddInputToOutputRequested;
    this.bConcat2ShuffleSplitRequested = bConcat2ShuffleSplitRequested;

    this.bHigherHalfDifferent = bHigherHalfDifferent;
    this.bHigherHalfDepthwise2 = bHigherHalfDepthwise2;
  }

}


/** The only one ValueDesc.ConvBlockType instance. */
ConvBlockType.Singleton = new ConvBlockType;

