export { Base };

import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as PointDepthPoint_Reference from "./PointDepthPoint_Reference.js"; 
import * as Block from "../../Conv/Block.js";
import * as Block_TestParams from "./Block_TestParams.js"; 
import * as ImageSourceBag from "./ImageSourceBag.js"; 

/**
 * Reference computation of class Block.Base.
 */
class Base {

  constructor() {

//!!! ...unfinished... (2021/09/28)
    this.PointDepthPoint_Reference = new PointDepthPoint_Reference();

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

!!!??? ...unfinished... (2021/09/30)

   * @param {ChannelShufflerPool.Base} channelShufflerPool
   *   The channelShufflers provider. It must be initialized with ChannelShuffler.ConcatPointwiseConv as parameter channelShufflerClass.
   *
   *     - It is only used when
   *         ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
   *         (-3) (i.e. channel shuffle the concatenated pointwise21 and input1).
   *
   */
//  testCorrectness( imageSourceBag, testParams, channelShufflerPool ) {
  testCorrectness( imageSourceBag, testParams ) {
    this.testParams = testParams;

//!!! ...unfinished... (2021/09/30)

    try {
      let channelCount0_pointwise1Before = this.testParams.out.channelCount0_pointwise1Before;
      let channelCount1_pointwise1Before = this.testParams.out.channelCount1_pointwise1Before;
      let depthwise_AvgMax_Or_ChannelMultiplier = this.testParams.out.depthwise_AvgMax_Or_ChannelMultiplier;
      let depthwiseFilterHeight = this.testParams.out.depthwiseFilterHeight;
      let depthwiseStridesPad = this.testParams.out.depthwiseStridesPad;
      let bKeepInputTensor = this.testParams.out.bKeepInputTensor;

      let strNote;

!!!
      let imageOutReference = this.calcResult( imageIn,
        channelShuffler_concatenatedShape, channelShuffler_outputGroupCount );

        tf.util.assert( imageOutReferenceArray.length == 2,
          `PointDepthPoint imageOutReferenceArray.length ( ${imageOutReferenceArray.length} ) should be 2. ${strNote}`);
      }

      outputTensor3dArray.fill( undefined );
      inputTensor3dArray.fill( undefined );

      inputTensor3dArray[ 0 ] = imageSourceBag.getTensor3d_by( channelCount0_pointwise1Before );
      if ( bTwoInputs ) { // Pass two input tensors according to parameters.
        inputTensor3dArray[ 1 ] = imageSourceBag.getTensor3d_by(
          input1ChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad );
      }

      let inputTensorDestroyCount; // How many input tensors will be destroyed by PointDepthPoint.apply().
      if ( bKeepInputTensor ) {
        inputTensorDestroyCount = 0; // Since keep-input, no input tensors will be destroyed.

      } else {
        inputTensor3dArray[ 0 ] = inputTensor3dArray[ 0 ].clone(); // Clone for being destroyed. 
        inputTensorDestroyCount = 1; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.

        if ( bTwoInputs ) { // Pass two input tensors according to parameters.
          inputTensor3dArray[ 1 ] = inputTensor3dArray[ 1 ].clone();
          inputTensorDestroyCount = 2; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.
        }
      }

      let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of pointDepthPoint create/dispose.
      let pointDepthPoint = Base.pointDepthPoint_create( testParams, channelShuffler_ConcatPointwiseConv );

      let parametersDescription = pointDepthPoint.parametersDescription;
      strNote = `( this.testParams.id=${this.testParams.id}, ${parametersDescription} )`;

      // Test input channel count.
      Base.AssertTwoEqualValues( "inChannels1", pointDepthPoint.inChannels1, input1ChannelCount, strNote );

      // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
      // tensor count (i.e. inputTensorDestroyCount).
      let tensorNumDifference_apply_before_after = pointDepthPoint.outputTensorCount - inputTensorDestroyCount;

      let memoryInfo_apply_before = tf.memory(); // Test memory leakage of pointDepthPoint apply.
      pointDepthPoint.apply( inputTensor3dArray, outputTensor3dArray );
      let memoryInfo_apply_after = tf.memory();

      tf.util.assert( memoryInfo_apply_after.numTensors == ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ),
        `PointDepthPoint.apply() memory leak. `
          + `result tensor count (${memoryInfo_apply_after.numTensors}) `
          + `should be (${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${strNote}` );

      tf.util.assert( inputTensor3dArray.length == 2,
        `PointDepthPoint inputTensor3dArray.length ( ${inputTensor3dArray.length} ) should be 2. ${strNote}`);

      tf.util.assert( outputTensor3dArray.length == 2,
        `PointDepthPoint outputTensor3dArray.length ( ${outputTensor3dArray.length} ) should be 2. ${strNote}`);

      { // Test output channel count.
        const CHANNEL_AXIS_ID = 2; // Axis id 2 is depth (i.e. channel) dimension.
        let outChannels0 = 0, outChannels1 = 0;

        if ( outputTensor3dArray[ 0 ] && ( outputTensor3dArray[ 0 ].shape.length > CHANNEL_AXIS_ID ) )
          outChannels0 = outputTensor3dArray[ 0 ].shape[ CHANNEL_AXIS_ID ];

        if ( outputTensor3dArray[ 1 ] && ( outputTensor3dArray[ 1 ].shape.length > CHANNEL_AXIS_ID ) )
          outChannels1 = outputTensor3dArray[ 1 ].shape[ CHANNEL_AXIS_ID ];

        let outChannelsAll = outChannels0 + outChannels1;

        Base.AssertTwoEqualValues( "outChannels0", pointDepthPoint.outChannels0, outChannels0, strNote );
        Base.AssertTwoEqualValues( "outChannels1", pointDepthPoint.outChannels1, outChannels1, strNote );
        Base.AssertTwoEqualValues( "outChannelsAll", pointDepthPoint.outChannelsAll, outChannelsAll, strNote );
      }

      { // Test output tensor count.
        let outputTensorCount = 0;

        if ( outputTensor3dArray[ 0 ] )
          ++outputTensorCount;

        if ( outputTensor3dArray[ 1 ] )
          ++outputTensorCount;

        Base.AssertTwoEqualValues( "outputTensorCount", pointDepthPoint.outputTensorCount, outputTensorCount, strNote );
      }

      // Test correctness of pointDepthPoint apply.
      this.check_Input_Output_WeightsTable( imageOutReferenceArray, outputTensor3dArray, strNote );

      pointDepthPoint.disposeTensors();
      let memoryInfo_afterDispose = tf.memory();

      tf.util.assert( memoryInfo_afterDispose.numTensors == ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ),
        `PointDepthPoint create/dispose memory leak. `
          + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
          + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${strNote}` );

      tf.dispose( outputTensor3dArray );

    } catch ( e ) {
      let backendName = tf.getBackend();
      console.log( `backendName=${backendName}, `
//        + `input image ( height, width ) = ( ${imageSourceBag.originalHeight}, ${imageSourceBag.originalWidth} ), `
        + `PointDepthPoint this.testParams.id = ${this.testParams.id}` );
      throw e;
    }

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

  /** According to imageIn and this.testParams.in.paramsNumberArrayObject, calculate imageOut.
   *
   * @param {object} imageIn
   *   The image to be tested.
   *
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   *
   * @return {object} Return output image.
   */
  calcResult( imageIn ) {

//!!! ...unfinished... (2021/09/30)
    return imageOut;
  }

  /** Calculate imageOut by simulating Block as NotShuffleNet_NotMobileNet.
   */
  calc_NotShuffleNet_NotMobileNet( imageIn ) {

//!!! ...unfinished... (2021/09/30)
    return imageOut;
  }

  /** Calculate imageOut by simulating Block as ShuffleNetV2_Slower.
   */
  calc_ShuffleNetV2_Slower( imageIn ) {

//!!! ...unfinished... (2021/09/30)
    return imageOut;
  }

  /** Calculate imageOut by simulating Block as ShuffleNetV2.
   */
  calc_ShuffleNetV2( imageIn ) {

//!!! ...unfinished... (2021/09/30)
    return imageOut;
  }

  /** Calculate imageOut by simulating Block as MobileNetV2.
   */
  calc_MobileNetV2( imageIn ) {

//!!! ...unfinished... (2021/09/30)
    return imageOut;
  }


}
