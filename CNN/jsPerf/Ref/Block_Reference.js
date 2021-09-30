export { Base };

import * as TensorTools from "../../util/TensorTools.js";
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
    this.PointDepthPoint_Reference = new PointDepthPoint_Reference();
    this.asserter_Tensor_NumberArray = new TensorTools.Asserter_Tensor_NumberArray( 0.3 );

    // For reducing memory allocation.
    this.imageInArray = new Array( 2 ); // imageInArray[ 0 ] is input0, imageInArray[ 1 ] is input1.
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

    try {
      let sourceHeight = this.testParams.out.sourceHeight;
      let sourceWidth = this.testParams.out.sourceWidth;
      let sourceChannelCount = this.testParams.out.sourceChannelCount;
      let stepCountRequested = this.testParams.out.stepCountRequested;
      let pointwise1ChannelCountRate = this.testParams.out.pointwise1ChannelCountRate;
      let depthwiseFilterHeight = this.testParams.out.depthwiseFilterHeight;
      let nActivationId = this.testParams.out.nActivationId;
      let nActivationIdAtBlockEnd = this.testParams.out.nActivationIdAtBlockEnd;
      let nWhetherShuffleChannel = this.testParams.out.nWhetherShuffleChannel;
      let bKeepInputTensor = this.testParams.out.bKeepInputTensor;

      let referredParams = {};
      let outputHeight, outputWidth, outputChannelCount;
      {
        Block.Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth( referredParams, sourceHeight, sourceWidth );

        outputHeight = referredParams.outputHeight;
        outputWidth = referredParams.outputWidth;

        outputChannelCount = sourceChannelCount * 2; // In current Block's design, the output channel always is twice as input.
      }

      let strNote;
      strNote = `( this.testParams.id=${this.testParams.id} )`;

      let imageIn = imageSourceBag.getImage_by( sourceChannelCount );
      let imageOutReference = this.calcResult( imageIn );

      let inputTensor3d = imageSourceBag.getTensor3d_by( sourceChannelCount );

      let inputTensorDestroyCount; // How many input tensors will be destroyed by Block.apply().
      if ( bKeepInputTensor ) {
        inputTensorDestroyCount = 0; // Since keep-input, no input tensors will be destroyed.

      } else {
        inputTensor3d = inputTensor3d.clone(); // Clone for being destroyed. 
        inputTensorDestroyCount = 1; // Since no keep-input, the input tensor destroyed count will be the same as input tensor count.
      }

      let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of pointDepthPoint create/dispose.
      let block = Base.block_create( testParams );

      let parametersDescription = block.parametersDescription;
      strNote = `( this.testParams.id=${this.testParams.id}, ${parametersDescription} )`;

      Base.AssertTwoEqualValues( "outputHeight", block.outputHeight, outputHeight, strNote );
      Base.AssertTwoEqualValues( "outputWidth", block.outputWidth, outputWidth, strNote );
      Base.AssertTwoEqualValues( "outputChannelCount", block.outputChannelCount, outputChannelCount, strNote );

//!!! ...unfinished... (2021/09/30)
//       Base.AssertTwoEqualValues( "stepCount", block.stepCount, stepCount, strNote );

      // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
      // tensor count (i.e. inputTensorDestroyCount).
      let block_outputTensorCount = 1;
      let tensorNumDifference_apply_before_after = block_outputTensorCount - inputTensorDestroyCount;

      let memoryInfo_apply_before = tf.memory(); // Test memory leakage of Block.apply.
      let outputTensor3d = block.apply( inputTensor3d );
      let memoryInfo_apply_after = tf.memory();

      tf.util.assert( memoryInfo_apply_after.numTensors == ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ),
        `Block.apply() memory leak. `
          + `result tensor count (${memoryInfo_apply_after.numTensors}) `
          + `should be (${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${strNote}` );

      tf.util.assert( !inputTensor3d,
        `Block inputTensor3d ( ${inputTensor3d} ) should not be null. ${strNote}`);

      tf.util.assert( !outputTensor3d,
        `Block outputTensor3d ( ${outputTensor3d} ) should not be null. ${strNote}`);

      { // Test output channel count.
        const CHANNEL_AXIS_ID = 2; // Axis id 2 is depth (i.e. channel) dimension.
        let outputTensorChannelCount = 0;

        if ( outputTensor3d && ( outputTensor3d.shape.length > CHANNEL_AXIS_ID ) )
          outputTensorChannelCount = outputTensor3d.shape[ CHANNEL_AXIS_ID ];

        // The real channel count of the output tensor should be the same as predicted output channel count.
        Base.AssertTwoEqualValues( "outChannels", block.outputChannelCount, outputTensorChannelCount, strNote );
      }

      // Test correctness of Block.apply.
      {
        let outputArrayRef;

        if ( imageOutReference ) {
          outputArrayRef = imageOutReference.dataArray; // Get referenced result (as number array).
        } else {
          outputArrayRef = null;
        }

        this.asserter_Tensor_NumberArray.assert(
          outputTensor3d, outputArrayRef,
          "Block", `outputTensor`, `outputRef`, parametersDescription
        );
      }

      block.disposeTensors();
      let memoryInfo_afterDispose = tf.memory();

      tf.util.assert( memoryInfo_afterDispose.numTensors == ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ),
        `Block create/dispose memory leak. `
          + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
          + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${strNote}` );

      tf.dispose( outputTensor3d );

    } catch ( e ) {
      let backendName = tf.getBackend();
      console.log( `backendName=${backendName}, `
        + `Block this.testParams.id = ${this.testParams.id}` );
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

    return block;
  }

  /** */
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
   * @return {object} Return output image as object { height, widthm depth, dataArray }.
   */
  calcResult( imageIn ) {
    let testParams = this.testParams;
    
    {
      let referredParams = {};
      Block.Params.set_outputHeight_outputWidth_by_sourceHeight_sourceWidth( referredParams,
        testParams.out.sourceHeight, testParams.out.sourceWidth );

      // Create description for debug easily.
      this.paramsOutDescription =

          `sourceHeight=${testParams.out.sourceHeight}, sourceWidth=${testParams.out.sourceWidth}, `
        + `sourceChannelCount=${testParams.out.sourceChannelCount}, `
        + `stepCountRequested=${testParams.out.stepCountRequested}, `
        + `pointwise1ChannelCountRate=${testParams.out.pointwise1ChannelCountRate}, `
        + `depthwiseFilterHeight=${testParams.out.depthwiseFilterHeight}, `
        + `nActivationIdName=${testParams.out.nActivationIdName}(${testParams.out.nActivationId}), `
        + `nActivationIdAtBlockEndName=${testParams.out.nActivationIdAtBlockEndName}(${testParams.out.nActivationIdAtBlockEnd}), `
        + `nWhetherShuffleChannel=${testParams.out.nWhetherShuffleChannelName}(${testParams.out.nWhetherShuffleChannel}), `
        + `outputHeight=${referredParams.outputHeight}, outputWidth=${referredParams.outputWidth}, `
        + `bKeepInputTensor=${testParams.out.bKeepInputTensor}, `
      ;
    }

    let stepCountRequested = testParams.out.stepCountRequested;
    let nWhetherShuffleChannel = testParams.out.nWhetherShuffleChannel;

    let imageOut;
    if ( this.stepCountRequested <= 1 ) {  // 1. Not ShuffleNetV2, Not MobileNetV2.
      imageOut = this.calc_NotShuffleNet_NotMobileNet( imageIn );

    } else { // ( this.stepCountRequested >= 2 )
      swtich ( this.nWhetherShuffleChannel ) {
        case Value.WhetherShuffleChannel.Singleton.Ids.NONE: // (0) MobileNetV2 or MobileNetV1
          imageOut = this.calc_MobileNetV2( imageIn );
          break;

        case Value.WhetherShuffleChannel.Singleton.Ids.BY_CHANNEL_SHUFLLER: // (1) ShuffleNetV2
          imageOut = this.calc_ShuffleNetV2( imageIn );
          break;

        case Value.WhetherShuffleChannel.Singleton.Ids.BY_POINTWISE22: // (2) Slower ShuffleNetV2
          imageOut = this.calc_ShuffleNetV2_Slower( imageIn );
          break;

        default:
          tf.util.assert( false, `Block_Reference.calcResult(): `
            `unknown nWhetherShuffleChannel ( ${nWhetherShuffleChannel} ) value. ${this.paramsOutDescription}` );
          break;
      }
    }

    return imageOut;
  }

  /** Calculate imageOut by simulating Block as NotShuffleNet_NotMobileNet. */
  calc_NotShuffleNet_NotMobileNet( imageIn ) {
    let testParams = this.testParams;

    let stepParamsMaker = new Block.Params.to_PointDepthPointParams.NotShuffleNet_NotMobileNet( testParams.out );
    stepParamsMaker.determine_stepCount_depthwiseFilterHeight_Default_Last(); // Calculate the real step count.

//!!! ...unfinished... (2021/09/30)
//    Base.AssertTwoEqualValues( "stepCount", block.stepCount, stepParamsMaker.stepCount, this.paramsOutDescription );

    for ( let step = 0; step < stepParamsMaker.stepCount; ++step ) {

//!!! ...unfinished... (2021/09/30)

//       this.imageInArray[ 0 ] = ; // input0
//       this.imageInArray[ 1 ] = ; // input1

      let imageOutArray = this.PointDepthPoint_Reference.calcResult( this.imageInArray );

    }

    return imageOut;
  }

  /** Calculate imageOut by simulating Block as ShuffleNetV2_Slower. */
  calc_ShuffleNetV2_Slower( imageIn ) {

//!!! ...unfinished... (2021/09/30)
    return imageOut;
  }

  /** Calculate imageOut by simulating Block as ShuffleNetV2. */
  calc_ShuffleNetV2( imageIn ) {

//!!! ...unfinished... (2021/09/30)
    return imageOut;
  }

  /** Calculate imageOut by simulating Block as MobileNetV2. */
  calc_MobileNetV2( imageIn ) {

//!!! ...unfinished... (2021/09/30)
    return imageOut;
  }


//!!! ...unfinished... (2021/09/28)
// Test the generated params of every step of every Block.Base.create_Params_to_PointDepthPointParams_Xxx whether conform with expectation.


}
