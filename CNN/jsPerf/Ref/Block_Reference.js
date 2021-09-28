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

    Base.AssertTwoEqualValues( "parsing beginning position",
      block.byteOffsetBegin, testParams.in.byteOffsetBegin, parametersDescription );

    Base.AssertTwoEqualValues( "parsing ending position",
      block.byteOffsetEnd, testParams.in.inputFloat32Array.byteLength, parametersDescription );

    // parameters.
    Base.AssertTwoEqualValues( "sourceHeight", block.sourceHeight, testParams.out.sourceHeight, parametersDescription );
    Base.AssertTwoEqualValues( "sourceWidth", block.sourceWidth, testParams.out.sourceWidth, parametersDescription );
    Base.AssertTwoEqualValues( "sourceChannelCount", block.sourceChannelCount, testParams.out.sourceChannelCount, parametersDescription );
    Base.AssertTwoEqualValues( "stepCountRequested", block.stepCountRequested, testParams.out.stepCountRequested, parametersDescription );

    Base.AssertTwoEqualValues( "pointwise1ChannelCountRate",
      block.pointwise1ChannelCountRate, testParams.out.pointwise1ChannelCountRate, parametersDescription );

    Base.AssertTwoEqualValues( "depthwiseFilterHeight", block.depthwiseFilterHeight, testParams.out.depthwiseFilterHeight, parametersDescription );

    Base.AssertTwoEqualValues( "nActivationId", block.nActivationId, testParams.out.nActivationId, parametersDescription );

    Base.AssertTwoEqualValues( "nActivationIdAtBlockEnd",
      block.nActivationIdAtBlockEnd, testParams.out.nActivationIdAtBlockEnd, parametersDescription );

    Base.AssertTwoEqualValues( "nWhetherShuffleChannel",
      block.nWhetherShuffleChannel, testParams.out.nWhetherShuffleChannel, parametersDescription );

    Base.AssertTwoEqualValues( "outputHeight", block.outputHeight, flags.outputHeight, parametersDescription );
    Base.AssertTwoEqualValues( "outputWidth", block.outputWidth, flags.outputWidth, parametersDescription );

    // Other parameters.
    Base.AssertTwoEqualValues( "bKeepInputTensor", block.bKeepInputTensor, testParams.out.bKeepInputTensor, parametersDescription );

//!!! ...unfinished... (2021/09/28)

    return block;
  }

//!!! ...unfinished... (2021/09/28)
// Test the generated params of every step of every Block.Base.create_Params_to_PointDepthPointParams_Xxx whether conform with expectation.


  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    tf.util.assert( ( value1 == value2 ),
      `Block ${valueName} (${value1}) should be (${value2}). ${parametersDescription}`);
  }

}
