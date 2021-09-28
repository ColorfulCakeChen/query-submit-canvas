export { Base };

import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Block from "../../Conv/Block.js";
import * as Block_TestParams from "./Block_TestParams.js"; 
import * as ImageSourceBag from "./ImageSourceBag.js"; 

/**
 * Reference computation of class Block.Base.
 */
class Base {

  constructor() {

//!!! ...unfinished... (2021/09/28)

  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {Block_TestParams.Base} testParams
   *   The test parameters. It is the value of Block_TestParams.Base.ParamsGenerator()'s result.
   *
   */
  testCorrectness( imageSourceBag, testParams ) {
    this.testParams = testParams;


//!!! ...unfinished... (2021/09/28)

  }

  /**
   * @param {Block_TestParams.Base} testParams
   *   The test parameters. It is the value of Block_TestParams.Base.ParamsGenerator()'s result.
   *
   * @return {Block.Base} The created Block object.
   */
  static Block_create( testParams ) {

    let block = new Block.Base();

    let progress = new ValueMax.Percentage.Aggregate();

    // Initialize successfully or failed.
    let extractedParams = new Block.Params( testParams.in.inputFloat32Array, testParams.in.byteOffsetBegin,
      testParams.in.sourceHeight, testParams.in.sourceWidth, testParams.in.sourceChannelCount,
      testParams.in.stepCountRequested,
      testParams.in.pointwise1ChannelCountRate,
      testParams.in.depthwiseFilterHeight, testParams.in.nActivationId, testParams.in.nActivationIdAtBlockEnd,
      testParams.in.nWhetherShuffleChannel,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = Block.init( progress, extractedParams );

    let flags = {};
    PointDepthPoint.Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth.call( flags,
      testParams.out.sourceHeight, testParams.out.sourceWidth );

    let parametersDescription = `( ${block.parametersDescription} )`;

    tf.util.assert( ( block.bInitOk == bInitOk ),
      `Block validation state (${block.bInitOk}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    tf.util.assert( ( true == bInitOk ),
      `Failed to initialize block object. ${parametersDescription}`);

    tf.util.assert( ( 100 == progress.valuePercentage ),
      `Progress (${progress.valuePercentage}) should be 100 when initializing pointDepthPoint object successfully. ${parametersDescription}`);

    if ( block.byteOffsetEnd != testParams.in.inputFloat32Array.byteLength ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

//!!! ...unfinished... (2021/09/28)

    Base.AssertTwoEqualValues( "parsing beginning position",
      pointDepthPoint.byteOffsetBegin, testParams.in.byteOffsetBegin, parametersDescription );

    Base.AssertTwoEqualValues( "parsing ending position",
      pointDepthPoint.byteOffsetEnd, testParams.in.inputFloat32Array.byteLength, parametersDescription );

    // input tensor parameters.
    Base.AssertTwoEqualValues( "inChannels0", pointDepthPoint.inChannels0, testParams.out.channelCount0_pointwise1Before, parametersDescription );

    Base.AssertTwoEqualValues( "channelCount1_pointwise1Before",
      pointDepthPoint.channelCount1_pointwise1Before, testParams.out.channelCount1_pointwise1Before, parametersDescription );

    Base.AssertTwoEqualValues( "inputTensorCount", pointDepthPoint.inputTensorCount, flags.inputTensorCount, parametersDescription );
    Base.AssertTwoEqualValues( "bDepthwise2Requested", pointDepthPoint.bDepthwise2Requested, flags.bDepthwise2Requested, parametersDescription );
    Base.AssertTwoEqualValues( "bConcat1Requested", pointDepthPoint.bConcat1Requested, flags.bConcat1Requested, parametersDescription );

    Base.AssertTwoEqualValues( "bAddInputToOutputRequested",
      pointDepthPoint.bAddInputToOutputRequested, flags.bAddInputToOutputRequested, parametersDescription );

    Base.AssertTwoEqualValues( "bConcat2ShuffleSplitRequested",
      pointDepthPoint.bConcat2ShuffleSplitRequested, flags.bConcat2ShuffleSplitRequested, parametersDescription );

    // Only if channel shuffler is used, it is recorded.
    if ( pointDepthPoint.bConcat2ShuffleSplitRequested ) {
      Base.AssertTwoEqualValues( "channelShuffler_ConcatPointwiseConv",
        pointDepthPoint.channelShuffler_ConcatPointwiseConv, channelShuffler_ConcatPointwiseConv, parametersDescription );
    } else {
      Base.AssertTwoEqualValues( "channelShuffler_ConcatPointwiseConv",
        pointDepthPoint.channelShuffler_ConcatPointwiseConv, null, parametersDescription );
    }

    // pointwise1 parameters.
    Base.AssertTwoEqualValues( "pointwise1ChannelCount",
      pointDepthPoint.pointwise1ChannelCount, testParams.out.pointwise1ChannelCount, parametersDescription );

    Base.AssertTwoEqualValues( "bPointwise1Bias",
      pointDepthPoint.bPointwise1Bias, testParams.out.bPointwise1Bias, parametersDescription );

    Base.AssertTwoEqualValues( "pointwise1ActivationId",
      pointDepthPoint.pointwise1ActivationId, testParams.out.pointwise1ActivationId, parametersDescription );

    let pointwise1ActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.pointwise1ActivationId );
    Base.AssertTwoEqualValues( "pointwise1ActivationName",
      pointDepthPoint.pointwise1ActivationName, pointwise1ActivationName, parametersDescription );

    // depthwise parameters.
    Base.AssertTwoEqualValues( "depthwise_AvgMax_Or_ChannelMultiplier",
      pointDepthPoint.depthwise_AvgMax_Or_ChannelMultiplier, testParams.out.depthwise_AvgMax_Or_ChannelMultiplier, parametersDescription );

    Base.AssertTwoEqualValues( "depthwiseFilterHeight",
      pointDepthPoint.depthwiseFilterHeight, testParams.out.depthwiseFilterHeight, parametersDescription );

    Base.AssertTwoEqualValues( "depthwiseStridesPad",
      pointDepthPoint.depthwiseStridesPad, testParams.out.depthwiseStridesPad, parametersDescription );

    Base.AssertTwoEqualValues( "bDepthwiseBias",
      pointDepthPoint.bDepthwiseBias, testParams.out.bDepthwiseBias, parametersDescription );

    Base.AssertTwoEqualValues( "depthwiseActivationId",
      pointDepthPoint.depthwiseActivationId, testParams.out.depthwiseActivationId, parametersDescription );

    let depthwiseActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.depthwiseActivationId );
    Base.AssertTwoEqualValues( "depthwiseActivationName",
      pointDepthPoint.depthwiseActivationName, depthwiseActivationName, parametersDescription );

    // pointwise21 parameters.
    Base.AssertTwoEqualValues( "pointwise21ChannelCount",
      pointDepthPoint.pointwise21ChannelCount, testParams.out.pointwise21ChannelCount, parametersDescription );

    Base.AssertTwoEqualValues( "bPointwise21Bias",
      pointDepthPoint.bPointwise21Bias, testParams.out.bPointwise21Bias, parametersDescription );

    Base.AssertTwoEqualValues( "pointwise21ActivationId",
      pointDepthPoint.pointwise21ActivationId, testParams.out.pointwise21ActivationId, parametersDescription );

    let pointwise21ActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.pointwise21ActivationId );
    Base.AssertTwoEqualValues( "pointwise21ActivationName",
      pointDepthPoint.pointwise21ActivationName, pointwise21ActivationName, parametersDescription );

    // pointwise22 parameters.
    Base.AssertTwoEqualValues( "bOutput1Requested",
      pointDepthPoint.bOutput1Requested, testParams.out.bOutput1Requested, parametersDescription );
    
    { // Test pointwise22ChannelCount.

      // In ShuffleNetV2's body/tail, there is always no pointwise22.
      if ( testParams.out.channelCount1_pointwise1Before
             == PointDepthPoint.Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) { // (-3)

        Base.AssertTwoEqualValues( "pointwise22ChannelCount", pointDepthPoint.pointwise22ChannelCount, 0, parametersDescription );

      // Otherwise, pointwise22 is output1 directly. It is determined by both bOutput1Requested and pointwise21ChannelCount.
      } else {
        if ( testParams.out.bOutput1Requested ) {
          Base.AssertTwoEqualValues( "pointwise22ChannelCount", // Either same as pointwise21 (if requested). (Still may be 0.)
            pointDepthPoint.pointwise22ChannelCount, testParams.out.pointwise21ChannelCount, parametersDescription );
        } else {
          Base.AssertTwoEqualValues( "pointwise22ChannelCount", // or 0 (if not requested).
            pointDepthPoint.pointwise22ChannelCount, 0, parametersDescription );
        }
      }
    }

    Base.AssertTwoEqualValues( "bPointwise22Bias",
      pointDepthPoint.bPointwise22Bias, testParams.out.bPointwise21Bias, parametersDescription ); // Always same as pointwise21.

    Base.AssertTwoEqualValues( "pointwise22ActivationId",
      pointDepthPoint.pointwise22ActivationId, testParams.out.pointwise21ActivationId, parametersDescription ); // Always same as pointwise21.

    Base.AssertTwoEqualValues( "pointwise22ActivationName",
      pointDepthPoint.pointwise22ActivationName, pointwise21ActivationName, parametersDescription ); // Always same as pointwise21.

    // Other parameters.
    Base.AssertTwoEqualValues( "bKeepInputTensor", pointDepthPoint.bKeepInputTensor, testParams.out.bKeepInputTensor, parametersDescription );

    return pointDepthPoint;
  }

//!!! ...unfinished... (2021/09/28)
// Test the generated params of every step of every Block.Base.create_Params_to_PointDepthPointParams_Xxx whether conform with expectation.


  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    tf.util.assert( ( value1 == value2 ),
      `Block ${valueName} (${value1}) should be (${value2}). ${parametersDescription}`);
  }

}
