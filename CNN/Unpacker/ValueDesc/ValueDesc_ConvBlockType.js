export { ConvBlockType };

import { Int } from "./ValueDesc_Base.js";

/** Describe id, range, name of ConvBlockType.
 *
 * Convert number value into integer between [ 0, 11 ] representing operation:
 *   -  0: MOBILE_NET_V1_HEAD_BODY_TAIL                      (General Pointwise1-Depthwise1-Pointwise2)
 *                                                           (MobileNetV1 or
 *                                                            MobileNetV2's head)
 *
 *   -  1: MOBILE_NET_V2_BODY_TAIL
 *   -  2: SHUFFLE_NET_V2_HEAD
 *   -  3: SHUFFLE_NET_V2_BODY
 *   -  4: SHUFFLE_NET_V2_TAIL
 *   -  5: SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD
 *   -  6: SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY
 *   -  7: SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL
 *   -  8: SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2  (ShuffleNetV2_ByPointwise21's head when ( pointwise1ChannelCount == 0 ))
 *   -  9: SHUFFLE_NET_V2_BY_POINTWISE21_HEAD                (ShuffleNetV2_ByPointwise21's head when ( pointwise1ChannelCount >= 1 ))
 *   - 10: SHUFFLE_NET_V2_BY_POINTWISE21_BODY
 *   - 11: SHUFFLE_NET_V2_BY_POINTWISE21_TAIL
 */
class ConvBlockType extends Int {

  constructor() {
    super( 0, 11,
      {
         MOBILE_NET_V1_HEAD_BODY_TAIL:                     new ConvBlockType.Info(
            0, "MOBILE_NET_V1_HEAD_BODY_TAIL",
            1, 1, false, false, false, false, false, false, 0, false ),

         MOBILE_NET_V2_BODY_TAIL:                          new ConvBlockType.Info(
            1, "MOBILE_NET_V2_BODY_TAIL",
            1, 1, false, false,  true, false, false, false, 0, false ),

         SHUFFLE_NET_V2_HEAD:                              new ConvBlockType.Info(
            2, "SHUFFLE_NET_V2_HEAD",
            1, 2,  true, false, false,  true, false, false, 0,  true ),

         SHUFFLE_NET_V2_BODY:                              new ConvBlockType.Info(
            3, "SHUFFLE_NET_V2_BODY",
            2, 2, false, false, false,  true, false, false, 0, false ),

         SHUFFLE_NET_V2_TAIL:                              new ConvBlockType.Info(
            4, "SHUFFLE_NET_V2_TAIL",
            2, 1, false, false, false,  true, false, false, 0, false ),

         SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD:             new ConvBlockType.Info( 
            5, "SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD",
            1, 1, false, false, false, false,  true,  true, 2, false ),

         SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY:             new ConvBlockType.Info(
            6, "SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY",
            1, 1, false, false, false, false,  true, false, 2, false ),

         SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL:             new ConvBlockType.Info(
            7, "SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL",
            1, 1, false, false, false, false,  true, false, 0, false ),

         SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2: new ConvBlockType.Info(
            8, "SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_DEPTHWISE2",
            1, 2, false, false, false, false, false, false, 0,  true ),

         SHUFFLE_NET_V2_BY_POINTWISE21_HEAD:               new ConvBlockType.Info(
            9, "SHUFFLE_NET_V2_BY_POINTWISE21_HEAD",
            1, 2,  true,  true, false, false, false, false, 0,  true ),

         SHUFFLE_NET_V2_BY_POINTWISE21_BODY:               new ConvBlockType.Info(
           10, "SHUFFLE_NET_V2_BY_POINTWISE21_BODY",
            2, 2, false,  true, false, false, false, false, 0,  true ),

         SHUFFLE_NET_V2_BY_POINTWISE21_TAIL:               new ConvBlockType.Info(
           11, "SHUFFLE_NET_V2_BY_POINTWISE21_TAIL",
            2, 1, false,  true, false, false, false, false, 0, false ),
      }
    );
  }


  /**
   * @param {number} nConvBlockTypeId
   *   The numeric identifier of ConvBlockType. (ConvBlockType.Singleton.Ids.Xxx)
   *
   * @return {number}
   *   Return the input tensor count (1 or 2) of the ConvBlockType.Singleton.Ids.Xxx.
   */
  static inputTensorCount_get( nConvBlockTypeId ) {
    let info = ConvBlockType.Singleton.getInfo_byId( nConvBlockTypeId );
    if ( info )
      return info.inputTensorCount;
    return NaN;
  }

  /**
   * @param {number} nConvBlockTypeId
   *   The numeric identifier of ConvBlockType. (ConvBlockType.Singleton.Ids.Xxx)
   *
   * @return {number}
   *   Return the output tensor count (1 or 2) of the ConvBlockType.Singleton.Ids.Xxx.
   */
  static outputTensorCount_get( nConvBlockTypeId ) {
    let info = ConvBlockType.Singleton.getInfo_byId( nConvBlockTypeId );
    if ( info )
      return info.outputTensorCount;
    return NaN;
  }

}


/**
 *
 * @member {number} inputTensorCount
 *   The input tensor count for the convolution block type. Either 1 or 2.
 *
 * @member {number} outputTensorCount
 *   The output tensor count for the convolution block type. Either 1 or 2.
 *
 * @member {boolean} bDepthwise2Requested
 *   Whether needs depthwise2. Usually true only if SHUFFLE_NET_V2_BY_HEAD and
 * SHUFFLE_NET_V2_BY_POINTWISE21_HEAD (except
 * SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE).
 *
 * @member {boolean} bConcat1Requested
 *   Whether needs concat1 (i.e. concat after depthwise). Usually true only if
 * SHUFFLE_NET_V2_BY_POINTWISE21_Xxx (except
 * SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE).
 *
 * @member {boolean} bAddInputToOutputRequested
 *   Whether needs add-input-to-output. Usually true only if
 * MOBILE_NET_V2_BODY_TAIL.
 *
 * @member {boolean} bConcat2ShuffleSplitRequested
 *   Whether needs add-input-to-output. Usually true only if
 * SHUFFLE_NET_V2_HEAD, SHUFFLE_NET_V2_BODY, SHUFFLE_NET_V2_TAIL.
 *
 * @member {boolean} bHigherHalfDifferent
 *   Whether the higher half channels will be handled different. Usually true
 * only if SHUFFLE_NET_V2_BY_MOBILE_NET_V1_Xxx.
 *
 * @member {boolean} bHigherHalfDepthwise2
 *   Whether the higher half channels will be processed by depthwise2. Usually
 * true only if SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD.
 *
 * @member {number} pointwise20_channelShuffler_outputGroupCount
 *   The output group count of the pointwise20's channel shuffler when
 * ( nHigherHalfDifferent ==
 * ValueDesc.Pointwise_HigherHalfDifferent.Singleton.Ids.HIGHER_HALF_PASS_THROUGH ).
 * Either 0 or 2. Usually 2 only if
 * SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD or SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY.
 *
 * @member {boolean} bPointwise21
 *   Whether the 2nd pointwise2 existed. Usually true only if
 * SHUFFLE_NET_V2_HEAD, SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE,
 * SHUFFLE_NET_V2_BY_POINTWISE21_HEAD, SHUFFLE_NET_V2_BY_POINTWISE21_BODY.
 * Note: Even if ( outputTensorCount == 2 ), it does not mean pointwise21
 * existed.
 *
 */
ConvBlockType.Info = class ConvBlockType_Info extends Int.Info {

  /**
   * @param {number} nConvBlockTypeId
   *   The convolution block type id (ValueDesc.ConvBlockType.Singleton.Ids.Xxx).
   *
   *
   */
  constructor( nConvBlockTypeId, nameForMessage,
    inputTensorCount, outputTensorCount,
    bDepthwise2Requested, bConcat1Requested, bAddInputToOutputRequested,
    bConcat2ShuffleSplitRequested,
    bHigherHalfDifferent, bHigherHalfDepthwise2,
    pointwise20_channelShuffler_outputGroupCount,
    bPointwise21
  ) {
    super( nConvBlockTypeId, nameForMessage );

    this.inputTensorCount = inputTensorCount;
    this.outputTensorCount = outputTensorCount;

    this.bDepthwise2Requested = bDepthwise2Requested;
    this.bConcat1Requested = bConcat1Requested;
    this.bAddInputToOutputRequested = bAddInputToOutputRequested;
    this.bConcat2ShuffleSplitRequested = bConcat2ShuffleSplitRequested;

    this.bHigherHalfDifferent = bHigherHalfDifferent;
    this.bHigherHalfDepthwise2 = bHigherHalfDepthwise2;
    this.pointwise20_channelShuffler_outputGroupCount
      = pointwise20_channelShuffler_outputGroupCount;

    this.bPointwise21 = bPointwise21;
  }

}


/** The only one ValueDesc.ConvBlockType instance. */
ConvBlockType.Singleton = new ConvBlockType;
