export { Base };

import * as TensorTools from "../../util/TensorTools.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ConvBiasActivation from "../../Conv/ConvBiasActivation.js";
import * as ChannelCountCalculator from "../../Conv/ChannelCountCalculator.js";
import * as Pointwise from "../../Conv/Pointwise.js";
import * as Depthwise from "../../Conv/Depthwise.js";
import * as ChannelShuffler from "../../Conv/ChannelShuffler.js";
import * as ChannelShufflerPool from "../../Conv/ChannelShufflerPool.js";
import * as PointDepthPoint from "../../Conv/PointDepthPoint.js";
import * as PointDepthPoint_TestParams from "./PointDepthPoint_TestParams.js"; 
import * as NumberImage from "./NumberImage.js";
import * as ImageSourceBag from "./ImageSourceBag.js";


/**
 * Information used by Base.testCorrectness().
 */
class TestCorrectnessInfo {

  constructor() {
    // For reducing memory allocation.
    this.imageInArraySelected = new Array( 2 ); // imageInArraySelected[ 0 ] is input0, imageInArraySelected[ 1 ] is input1.
    this.inputTensor3dArray = new Array( 2 );
    this.outputTensor3dArray = new Array( 2 );
  }

  prepareBy( imageSourceBag, testParams, channelShufflerPool ) {

    let {
      inputHeight0, inputWidth0, channelCount0_pointwise1Before, channelCount1_pointwise1Before,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      pointwise21ChannelCount,
      bKeepInputTensor
    } = testParams.out;

    let imageInArraySelected = this.imageInArraySelected; // imageInArraySelected[ 0 ] is input0, imageInArraySelected[ 1 ] is input1.
    let inputTensor3dArray = this.inputTensor3dArray;
    let outputTensor3dArray = this.outputTensor3dArray;

    let strNote;

    let referredParams = {};
    let bTwoInputs, input1ChannelCount;
    {
      // The input tensor count is determined by channelCount1_pointwise1Before totally.
      PointDepthPoint.Params.set_inputTensorCount_by.call( referredParams, channelCount1_pointwise1Before );

      PointDepthPoint.Params.set_input1ChannelCount_by.call( referredParams,
        channelCount0_pointwise1Before, channelCount1_pointwise1Before,
        pointwise1ChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, pointwise21ChannelCount );

      bTwoInputs = ( referredParams.inputTensorCount == 2 );
      input1ChannelCount = referredParams.input1ChannelCount;
    }

    let channelShuffler_ConcatPointwiseConv, channelShuffler_concatenatedShape, channelShuffler_outputGroupCount;
    {
      strNote = `( testParams.id=${testParams.id} )`;

      imageInArraySelected.fill( undefined );
      imageInArraySelected[ 0 ] = imageSourceBag.getImage_by( inputHeight0, inputWidth0, channelCount0_pointwise1Before );

//!!! ...unfinished... (2021/10/28) input1ChannelCount may zero.

      // Although input1 is only needed when ( bTwoInputs == true ), it is always prepared for calculating the shape of channel shuffler.
      // 
      // The shape of input1 (not input0) determines the concatenatedShape of channel shuffler because the input0 might be shrinked
      // by depthwise convolution.
      let imageIn1 = imageSourceBag.getImage_by(
        inputHeight0, inputWidth0, input1ChannelCount,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );

      if ( bTwoInputs ) { // Pass two input images according to parameters.
        imageInArraySelected[ 1 ] = imageIn1;
      }

      tf.util.assert( imageInArraySelected.length == 2,
        `PointDepthPoint imageInArraySelected.length ( ${imageInArraySelected.length} ) should be 2. ${strNote}`);

      // Prepare channel shuffler.
      switch ( channelCount1_pointwise1Before ) {
        case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1: // (-3)
        case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1: // (-4)
        case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH: // (-5)
        {
          let outputGroupCount = 2; // Only use two convolution groups.

          let concatenatedDepth;
          if ( input1ChannelCount > 0 ) { // TWO_INPUTS_CONCAT_POINTWISE21_INPUT1: // (-3)
            concatenatedDepth = ( input1ChannelCount * outputGroupCount ); // Always twice as input1's channel count.

          } else { // ( input1ChannelCount == 0 )
            // ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1: // (-4)
            // ONE_INPUT_HALF_THROUGH: // (-5)
            //
            // In these two cases:
            //   - The input1 does not exist.
            //   - Fortunately, the concatenatedDepth of channel shuffler is not so important here.
            //     - Only ( imageInHeight, imageInWidth, outputGroupCount ) of channel shuffler will be used.
            //     - So a usable (non-zero) value is enough. 
            //
            concatenatedDepth = ( 1 * outputGroupCount );

//!!! ...unfinished... (2021/11/26) What about ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4) ?

            // (i.e. pointwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)
            if ( ( channelCount1_pointwise1Before
                     == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) // (-5)
               ) {

//!!! (2021/11/26 Remarked) Now, pointwise21ChannelCount is always positive.
//                 // Because:
//                 //   - PointDepthPoint_TestParams.generate_Filters_Biases() will double channelCount0_pointwise1Before and pointwise1ChannelCount.
//                 //   - PointDepthPoint.initer() and PointDepthPoint_Reference.calResutl() will halve them.
//                 //
//                 // For simulating the same procedure, halve them here, too.
//                 let channelCount0_pointwise1Before_lowerHalf = Math.ceil( testParams.out.channelCount0_pointwise1Before / 2 );
//                 let pointwise1ChannelCount_lowerHalf = Math.ceil( testParams.out.pointwise1ChannelCount / 2 );
//
//                 // Note: The channel count of pointwise21's result may not the same as pointwise21ChannelCount (which may be zero).
//                 let pointwise21ResultChannelCount = PointDepthPoint.Params.calc_pointwise21ResultChannelCount(
//                   channelCount0_pointwise1Before_lowerHalf,
//                   pointwise1ChannelCount_lowerHalf, depthwise_AvgMax_Or_ChannelMultiplier, pointwise21ChannelCount );
//
//                 let channelCount0_pointwise1Before_higherHalf = channelCount0_pointwise1Before - channelCount0_pointwise1Before_lowerHalf;
//                 concatenatedDepth = 
//                   pointwise21ResultChannelCount
//                     + channelCount0_pointwise1Before_higherHalf; // Just like the past-through input1.

              // Because PointDepthPoint_TestParams.generate_Filters_Biases() will double pointwise21ChannelCount, it must be an even number
              // which could be splitted (into two groups).
              concatenatedDepth = pointwise21ChannelCount;
            }
          }

          channelShuffler_ConcatPointwiseConv = channelShufflerPool.getChannelShuffler_by(
            imageIn1.height, imageIn1.width, concatenatedDepth, outputGroupCount );

          tf.util.assert( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 0 ] == imageIn1.height,
            `ChannelShuffler concatenatedShape[ 0 ] ( ${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 0 ]} ) `
              + `should be the same as image height ( ${imageIn1.height} ). ${strNote}`);

          tf.util.assert( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 1 ] == imageIn1.width,
            `ChannelShuffler concatenatedShape[ 1 ] ( ${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 1 ]} ) `
              + `should be the same as image width ( ${imageIn1.width} ). ${strNote}`);

          tf.util.assert( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 2 ] == concatenatedDepth,
            `ChannelShuffler concatenatedShape[ 2 ] ( ${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 2 ]} ) `
              + `should be the same as image concatenatedDepth ( ${concatenatedDepth} ). ${strNote}`);

          tf.util.assert( channelShuffler_ConcatPointwiseConv.outputGroupCount == outputGroupCount,
            `ChannelShuffler outputGroupCount ( ${channelShuffler_ConcatPointwiseConv.outputGroupCount} ) `
              + `should be the same as image outputGroupCount ( ${outputGroupCount} ). ${strNote}`);

          channelShuffler_concatenatedShape = channelShuffler_ConcatPointwiseConv.concatenatedShape;
          channelShuffler_outputGroupCount = channelShuffler_ConcatPointwiseConv.outputGroupCount;
        }
          break;
      }

    }

    outputTensor3dArray.fill( undefined );
    inputTensor3dArray.fill( undefined );

    inputTensor3dArray[ 0 ] = imageSourceBag.getTensor3d_by( inputHeight0, inputWidth0, channelCount0_pointwise1Before );
    if ( bTwoInputs ) { // Pass two input tensors according to parameters.
      inputTensor3dArray[ 1 ] = imageSourceBag.getTensor3d_by(
        inputHeight0, inputWidth0, input1ChannelCount,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
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

    this.input1ChannelCount = input1ChannelCount;
    this.channelShuffler_ConcatPointwiseConv = channelShuffler_ConcatPointwiseConv;
    this.inputTensorDestroyCount = inputTensorDestroyCount;
    this.strNote = strNote;
  }

}


/**
 * Reference computation of class PointDepthPoint.Base.
 */
class Base {

  /**
   *
   */
  constructor() {
    this.channelShufflerPool = new ChannelShufflerPool.Base( ChannelShuffler.ShuffleInfo );

    // For reducing memory allocation.
    this.testCorrectnessInfo = new TestCorrectnessInfo();
    this.asserter_Equal = new TensorTools.Asserter_Equal( 0.4 );
  }

  /**
   * Testing whether the results of different implementation are the same.
   *
   * @param {ImageSourceBag.Base} imageSourceBag
   *   The provider of image and tensor of variable specification for testing.
   *
   * @param {PointDepthPoint_TestParams.Base} testParams
   *   The test parameters. It is the value of PointDepthPoint_TestParams.Base.ParamsGenerator()'s result.
   *
   * @param {ChannelShufflerPool.Base} channelShufflerPool
   *   The channelShufflers provider. It must be initialized with ChannelShuffler.ConcatPointwiseConv as parameter channelShufflerClass.
   *
   *     - It is only used when
   *         - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
   *           (-3) (i.e. channel shuffle the concatenated pointwise21 and input1).
   *
   *         - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 )
   *           (-4) (ShuffleNetV2_ByMobileNetV1's head)
   *
   *         - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH )
   *           (-5) (i.e. ShuffleNetV2_ByMobileNetV1's body/tail).
   */
  testCorrectness( imageSourceBag, testParams, channelShufflerPool ) {
    this.testParams = testParams;

    try {
      this.testCorrectnessInfo.prepareBy( imageSourceBag, testParams, channelShufflerPool );

      let {
        imageInArraySelected, inputTensor3dArray, outputTensor3dArray,
        input1ChannelCount, channelShuffler_ConcatPointwiseConv, inputTensorDestroyCount,
        strNote
      } = this.testCorrectnessInfo;

      let imageOutReferenceArray;
      {
        // Output is an array with two elements.
        imageOutReferenceArray = this.calcResult( imageInArraySelected, channelShuffler_ConcatPointwiseConv );

        tf.util.assert( imageOutReferenceArray.length == 2,
          `PointDepthPoint imageOutReferenceArray.length ( ${imageOutReferenceArray.length} ) should be 2. ${strNote}`);
      }

      let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of pointDepthPoint create/dispose.

      let pointDepthPoint = Base.pointDepthPoint_create( testParams,
        imageInArraySelected[ 0 ].boundsArraySet, // Problem: What about imageInArraySelected[ 1 ].boundsArraySet?
        channelShuffler_ConcatPointwiseConv );

      let parametersDescription = pointDepthPoint.parametersDescription;
      strNote = `( testParams.id=${testParams.id}, ${parametersDescription} )`;

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

//!!! ...unfinished... (2021/12/16) assert comparing BoundsArraySet?
//       {
//         imageOutReferenceArray;
//       }

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
      console.log( `PointDepthPoint_Reference.js: testCorrectness(): backendName=${backendName}, `
//        + `input image ( height, width ) = ( ${imageSourceBag.originalHeight}, ${imageSourceBag.originalWidth} ), `
        + `PointDepthPoint, (yieldCount == ${testParams.yieldCount}), testParams.id == ${testParams.id}` );
      throw e;
    }
  }

  /**
   * Check the PointDepthPoint's output according to input (for correctness testing).
   *
   * @param {number[]} imageOutReferenceArray[ i ]
   *   Refernece output Image data.
   *
   * @param {tf.tensor3d[]} outputTensors
   *   The output array of the PointDepthPoint's apply_and_destroy_or_keep().
   */
  check_Input_Output_WeightsTable( imageOutReferenceArray, outputTensors, parametersDescription ) {

    let outputArrayRef;
    for ( let i = 0; i < imageOutReferenceArray.length; ++i ) {

      let imageOutReference = imageOutReferenceArray[ i ];
      if ( imageOutReference ) {
        outputArrayRef = imageOutReference.dataArray; // Get referenced result (as number array).
      } else {
        outputArrayRef = null;
      }

      let outputTensor = outputTensors[ i ];          // Get real (tested target) result (as typed-array).

      this.asserter_Equal.assert_Tensor_NumberArray(
        outputTensor, outputArrayRef,
        "PointDepthPoint", `output${i}`, `outputRef${i}`, parametersDescription
      );
    }
  }

  /**
   * @param {PointDepthPoint_TestParams.Base} testParams
   *   The test parameters. It is the value of PointDepthPoint_TestParams.Base.ParamsGenerator()'s result.
   *
   * @param {ConvBiasActivation.BoundsArraySet} previousBoundsArraySet
   *   The previous PointDepthPoint's output convolution-bias-activation value bounds set.
   *   
   * @return {PointDepthPoint.Base} The created pointDepthPoint object.
   */
  static pointDepthPoint_create( testParams, previousBoundsArraySet, channelShuffler_ConcatPointwiseConv ) {

    let pointDepthPoint = new PointDepthPoint.Base();

    let progress = new ValueMax.Percentage.Aggregate();

    // Initialize successfully or failed.
    let extractedParams = new PointDepthPoint.Params( testParams.in.inputFloat32Array, testParams.in.byteOffsetBegin,
      testParams.in.inputHeight0, testParams.in.inputWidth0,
      testParams.in.channelCount0_pointwise1Before, testParams.in.channelCount1_pointwise1Before,
      testParams.in.pointwise1ChannelCount, testParams.in.bPointwise1Bias, testParams.in.pointwise1ActivationId,
      testParams.in.depthwise_AvgMax_Or_ChannelMultiplier, testParams.in.depthwiseFilterHeight, testParams.in.depthwiseFilterWidth,
      testParams.in.depthwiseStridesPad, testParams.in.bDepthwiseBias, testParams.in.depthwiseActivationId,
      testParams.in.pointwise21ChannelCount, testParams.in.bPointwise21Bias, testParams.in.pointwise21ActivationId,
      testParams.in.bOutput1Requested,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = pointDepthPoint.init( progress, extractedParams, previousBoundsArraySet, channelShuffler_ConcatPointwiseConv );

    let flags = {};
    PointDepthPoint.Params.setFlags_by.call( flags,
      testParams.out.channelCount0_pointwise1Before, testParams.out.channelCount1_pointwise1Before,
      testParams.out.pointwise1ChannelCount,
      testParams.out.depthwise_AvgMax_Or_ChannelMultiplier,
      testParams.out.pointwise21ChannelCount,
      testParams.out.bOutput1Requested );

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    let parametersDescription = `( ${pointDepthPoint.parametersDescription} )`;

    tf.util.assert( ( pointDepthPoint.bInitOk == bInitOk ),
      `PointDepthPoint validation state (${pointDepthPoint.bInitOk}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    tf.util.assert( ( true == bInitOk ),
      `Failed to initialize pointDepthPoint object. ${parametersDescription}`);

    tf.util.assert( ( 100 == progress.valuePercentage ),
      `Progress (${progress.valuePercentage}) should be 100 when initializing pointDepthPoint object successfully. ${parametersDescription}`);


    if ( pointDepthPoint.byteOffsetEnd != testParams.in.inputFloat32Array.byteLength ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

    let asserter = new ObjectPropertyAsserter.Base( `PointDepthPoint`, pointDepthPoint, parametersDescription );

    Base.AssertTwoEqualValues( "parsing beginning position",
      pointDepthPoint.byteOffsetBegin, testParams.in.byteOffsetBegin, parametersDescription );

    Base.AssertTwoEqualValues( "parsing ending position",
      pointDepthPoint.byteOffsetEnd, testParams.in.inputFloat32Array.byteLength, parametersDescription );

    // input tensor parameters.
    asserter.propertyValue( "inputHeight0", testParams.out.inputHeight0 );
    asserter.propertyValue( "inputWidth0", testParams.out.inputWidth0 );

    asserter.propertyValue( "inChannels0", testParams.out.channelCount0_pointwise1Before );
    asserter.propertyValue( "channelCount1_pointwise1Before", testParams.out.channelCount1_pointwise1Before );

    asserter.propertyValue( "inputTensorCount", flags.inputTensorCount );
    asserter.propertyValue( "bHigherHalfDifferent", flags.bHigherHalfDifferent );
    asserter.propertyValue( "bHigherHalfDepthwise2", flags.bHigherHalfDepthwise2 );
    asserter.propertyValue( "bDepthwise2Requested", flags.bDepthwise2Requested );
    asserter.propertyValue( "bConcat1Requested", flags.bConcat1Requested );
    asserter.propertyValue( "bAddInputToOutputRequested", flags.bAddInputToOutputRequested );
    asserter.propertyValue( "bConcat2ShuffleSplitRequested", flags.bConcat2ShuffleSplitRequested );

    // The ( pointDepthPoint.bConcat2ShuffleSplitRequested == true ) only if:
    //   - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) (-3)
    //
    if ( pointDepthPoint.bConcat2ShuffleSplitRequested ) {
      Base.AssertTwoEqualValues( "bConcat2ShuffleSplitRequested",
        testParams.out.channelCount1_pointwise1Before,
        ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1, parametersDescription );
    }

    // The channelShuffler must not null when:
    //   - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) (-3)
    //   - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 ) (-4)
    //   - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) (-5)
    //
    if (   ( testParams.out.channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) // (-3)
        || ( testParams.out.channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 ) // (-4)
        || ( testParams.out.channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) // (-5)
       ) {

      tf.util.assert( channelShuffler_ConcatPointwiseConv != null, `PointDepthPoint_Reference.Base.pointDepthPoint_create(): `
        + `channelShuffler must NOT null when `
        + `channelCount1_pointwise1Before=`
        + `${ValueDesc.channelCount1_pointwise1Before.Singleton.getStringOf( testParams.out.channelCount1_pointwise1Before )}`
        + `(${testParams.out.channelCount1_pointwise1Before})` );

      asserter.propertyValue( "channelShuffler_ConcatPointwiseConv", channelShuffler_ConcatPointwiseConv );

    } else {
      asserter.propertyValue( "channelShuffler_ConcatPointwiseConv", null );
    }

    // pointwise1 parameters.
//!!! (2021/11/15 Remarked)
//    asserter.propertyValue( "pointwise1ChannelCount", testParams.out.pointwise1ChannelCount );
    
    // (i.e. ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4) )
    // (i.e. (ShuffleNetV2_ByMobileNetV1's head) )
    //
    if ( ( pointDepthPoint.bHigherHalfDifferent == true ) && ( pointDepthPoint.bHigherHalfDepthwise2 == true ) ) {

      // In this case (i.e. bHigherHalfCopyLowerHalf), enlarge pointwise1 to ( pointwise1_channel_count + input_channel_count )
      // so that depthwise1 could include depthwise2.
      //
      if ( testParams.out.pointwise1ChannelCount > 0 ) {
        let pointwise1ChannelCount = ( testParams.out.pointwise1ChannelCount + testParams.out.channelCount0_pointwise1Before );
        asserter.propertyValue( "pointwise1ChannelCount", pointwise1ChannelCount );

      // However, if ( pointwise1ChannelCount == 0 ), Pointwise.Base can not handle ( pointwise1ChannelCount == 0 ) because
      // ( inputChannelCount < outputChannelCount == pointwise1ChannelCount == 0 ) is not possible. It will be wrongly recognized
      // as ( inputChannelCount >= outputChannelCount == pointwise1ChannelCount == 0 ).
      //
      // It should be adjusted forcibly so that ( inputChannelCount < outputChannelCount == pointwise1ChannelCount ) and always
      // no biases. Not only bHigherHalfCopyLowerHalf, but also bLowerHalfPassThrough. (i.e. bHigherHalfCopyLowerHalf_LowerHalfPassThrough)
      //
      } else { // ( 0 == testParams.out.pointwise1ChannelCount )
        let pointwise1ChannelCount = ( testParams.out.channelCount0_pointwise1Before * 2 ); // Aa doubled input channel count.
        asserter.propertyValue( "pointwise1ChannelCount", pointwise1ChannelCount );
      }

    } else {
      asserter.propertyValue( "pointwise1ChannelCount", testParams.out.pointwise1ChannelCount );
    }

    asserter.propertyValue( "bPointwise1Bias", testParams.out.bPointwise1Bias );
    asserter.propertyValue( "pointwise1ActivationId", testParams.out.pointwise1ActivationId );

    let pointwise1ActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.pointwise1ActivationId );
    asserter.propertyValue( "pointwise1ActivationName", pointwise1ActivationName );

    // depthwise parameters.
    asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", testParams.out.depthwise_AvgMax_Or_ChannelMultiplier );
    asserter.propertyValue( "depthwiseFilterHeight", testParams.out.depthwiseFilterHeight );
    asserter.propertyValue( "depthwiseFilterWidth", testParams.out.depthwiseFilterWidth );
    asserter.propertyValue( "depthwiseStridesPad", testParams.out.depthwiseStridesPad );
    asserter.propertyValue( "bDepthwiseBias", testParams.out.bDepthwiseBias );
    asserter.propertyValue( "depthwiseActivationId", testParams.out.depthwiseActivationId );

    let depthwiseActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.depthwiseActivationId );
    asserter.propertyValue( "depthwiseActivationName", depthwiseActivationName );

    // pointwise21 parameters.
    asserter.propertyValue( "pointwise21ChannelCount", testParams.out.pointwise21ChannelCount );

    asserter.propertyValue( "bPointwise21Bias", testParams.out.bPointwise21Bias );
    asserter.propertyValue( "pointwise21ActivationId", testParams.out.pointwise21ActivationId );

    let pointwise21ActivationName = ValueDesc.ActivationFunction.Singleton.integerToNameMap.get( testParams.out.pointwise21ActivationId );
    asserter.propertyValue( "pointwise21ActivationName", pointwise21ActivationName );

    // pointwise22 parameters.
    asserter.propertyValue( "bOutput1Requested", testParams.out.bOutput1Requested );

    { // Test pointwise22ChannelCount.

      // In ShuffleNetV2's body/tail, there is always no pointwise22.
      if ( testParams.out.channelCount1_pointwise1Before
             == PointDepthPoint.Params.channelCount1_pointwise1Before.valueDesc.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) { // (-3)

        asserter.propertyValue( "pointwise22ChannelCount", 0 );

      // Otherwise, pointwise22 is output1 directly. It is determined by both bOutput1Requested and pointwise21ChannelCount.
      } else {
        if ( testParams.out.bOutput1Requested ) {
          // Either same as pointwise21 (if requested). (Still may be 0.)
          asserter.propertyValue( "pointwise22ChannelCount", testParams.out.pointwise21ChannelCount );
        } else {
          asserter.propertyValue( "pointwise22ChannelCount", 0 ); // or 0 (if not requested).
        }
      }
    }

    asserter.propertyValue( "bPointwise22Bias", testParams.out.bPointwise21Bias ); // Always same as pointwise21.
    asserter.propertyValue( "pointwise22ActivationId", testParams.out.pointwise21ActivationId ); // Always same as pointwise21.
    asserter.propertyValue( "pointwise22ActivationName", pointwise21ActivationName ); // Always same as pointwise21.

    {
      asserter.propertyValue( "outputHeight", testParams.out.depthwisePadInfo.outputHeight );
      asserter.propertyValue( "outputWidth", testParams.out.depthwisePadInfo.outputWidth );
    }

    // Other parameters.
    asserter.propertyValue( "bKeepInputTensor", testParams.out.bKeepInputTensor );

    return pointDepthPoint;
  }


  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    tf.util.assert( ( value1 == value2 ),
      `PointDepthPoint ${valueName} (${value1}) should be (${value2}). ${parametersDescription}`);
  }

  /** According to imageInArray and this.testParams.in.paramsNumberArrayObject, calculate imageOutArray.
   *
   * @param {NumberImage.Base[]} imageInArray
   *   The images to be tested.
   *     - imageInArray[ 0 ]: input0
   *     - imageInArray[ 1 ]: input1
   *
   * @param {ChannelShuffler.Xxx} channelShuffler
   *   The channel shuffler. Used when concat-shuffle-split.
   *
   * @return {NumberImage.Base[]}
   *   Return output image objects array.
   */ 
  calcResult( imageInArray, channelShuffler ) {

    let testParams = this.testParams;

    // The channelShuffler must not null when:
    //   - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 ) (-3)
    //   - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 ) (-4)
    //   - ( channelCount1_pointwise1Before == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) (-5)
    //
    if (   ( testParams.channelCount1_pointwise1Before__is__TWO_INPUTS_CONCAT_POINTWISE21_INPUT1() ) // (-3)
        || ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        || ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
       ) {

      tf.util.assert( channelShuffler != null, `PointDepthPoint_Reference.Base.calcResult(): `
        + `channelShuffler must NOT null when `
        + `channelCount1_pointwise1Before=`
        + `${ValueDesc.channelCount1_pointwise1Before.Singleton.getStringOf( testParams.out.channelCount1_pointwise1Before )}`
        + `(${testParams.out.channelCount1_pointwise1Before})` );
    }

    // Create description for debug easily.
    this.paramsOutDescription = Base.TestParams_Out_createDescription( testParams );

    // The following two (ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.Xxx) use same calculation logic:
    //    ONE_INPUT_HALF_THROUGH                   // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
    //    TWO_INPUTS_CONCAT_POINTWISE21_INPUT1     // (-3) (ShuffleNetV2's body/tail)
    //
    // The following two (ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.Xxx) use same calculation logic:
    //    ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 // (-4) (ShuffleNetV2_ByMobileNetV1's head)
    //    ONE_INPUT_TWO_DEPTHWISE                  // (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))


    let imageIn0, imageIn1;

    // 0.

    let pointwise1ChannelCount = testParams.out.pointwise1ChannelCount;;
    let pointwise21ChannelCount;

    // (-4) (ShuffleNetV2_ByMobileNetV1's head)
    //
    // Note: PointDepthPoint_TestParams.Base.generate_Filters_Biases() double pointwise21ChannelCount. So, halve them here.
    //
    if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) {
      pointwise21ChannelCount = Math.ceil( testParams.out.pointwise21ChannelCount / 2 );

      imageIn0 = imageInArray[ 0 ];
      imageIn1 = imageInArray[ 1 ];

    // The imageInArray[ 0 ] should be splitted into imageIn0 and imageIn1, because we use the logic of
    // TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3) to handle ONE_INPUT_HALF_THROUGH (-5).
    //
    // Note: PointDepthPoint_TestParams.Base.generate_Filters_Biases() double channelCount0_pointwise1Before,
    // pointwise21ChannelCount. So, halve them here.
    //
    } else if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) { // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)

      let imageInArray_Fake = NumberImage.Base.calcSplitAlongAxisId2(
        imageInArray[ 0 ], "Split_imageIn_to_imageInArray_0_1", this.paramsOutDescription );

      imageIn0 = imageInArray_Fake[ 0 ];
      imageIn1 = imageInArray_Fake[ 1 ];

      if ( pointwise1ChannelCount <= 0 ) {
        // When no pointwise1, just keep it all-pass-through.

      } else { // Otherwise, only the lower half should be processed by pointwise1 convolution.
        let pointwise1_higherHalfPassThrough = new ChannelCountCalculator.HigherHalfPassThrough(
          testParams.out.channelCount0_pointwise1Before, testParams.out.pointwise1ChannelCount );

        pointwise1ChannelCount = pointwise1_higherHalfPassThrough.outputChannelCount_lowerHalf;
      }

      pointwise21ChannelCount = Math.ceil( testParams.out.pointwise21ChannelCount / 2 );

    } else {
      imageIn0 = imageInArray[ 0 ];
      imageIn1 = imageInArray[ 1 ];
      pointwise21ChannelCount = testParams.out.pointwise21ChannelCount;
    }

    // 1. Pointwise1
    let imageIn0_beforePointwise1 = imageIn0;
    let imageIn1_beforePointwise1 = imageIn1;
    let pointwise1Result;
    if ( pointwise1ChannelCount > 0 ) {
      pointwise1Result = testParams.use_pointwise1( imageIn0, pointwise1ChannelCount, "Pointwise1", this.paramsOutDescription );

      if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        imageIn1 = testParams.use_pointwise1_PassThrough( imageIn0_beforePointwise1, // copy input0 (not input1).
          pointwise1ChannelCount, // So that it could be processed by depthwise2 and pointwise22 (with same structure of depthwise1 and pointwise21).
          "Pointwise1_imageIn1_HigherHalfCopyLowerHalf_imageIn0", this.paramsOutDescription );

      } else if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) { // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
        imageIn1 = testParams.use_pointwise1_PassThrough( imageIn1_beforePointwise1, // pass-through input1 (not input0).
          pointwise1ChannelCount, // So that it could be processed by depthwise2 and pointwise22 (with same structure of depthwise1 and pointwise21).
          "Pointwise1_imageIn1_HigherHalfPassThrough", this.paramsOutDescription );
      }

    } else {
      pointwise1Result = imageIn0;
      
      if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) { // (-4) (ShuffleNetV2_ByMobileNetV1's head)

        tf.util.assert( imageIn1 == null, `PointDepthPoint_Reference.Base.calcResult(): `
          + `imageIn1 must be null when `
          + `channelCount1_pointwise1Before=`
          + `${ValueDesc.channelCount1_pointwise1Before.Singleton.getStringOf( testParams.out.channelCount1_pointwise1Before )}`
          + `(${testParams.out.channelCount1_pointwise1Before}). `
          + `${this.paramsOutDescription}` );

        imageIn1 = imageIn0; // Not input1 but input0.
      }
    }

    // 2. Depthwise

    // 2.1 Depthwise1
    let imageIn1_beforeDepthwise1 = imageIn1;
    let depthwise1Result;
    if ( 0 != testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
      depthwise1Result = testParams.use_depthwise1( pointwise1Result, "Depthwise1", this.paramsOutDescription );

      // When ONE_INPUT_HALF_THROUGH (-5), imageIn1 should be shrinked by depthwise1. Otherwise, its size may
      // be different from pointwise21Result and can not be concatenated together.
      if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) { // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
        imageIn1 = testParams.use_depthwise1_PassThrough( imageIn1_beforeDepthwise1, // pass-through input1 (not input0).
          "Depthwise1_imageIn1_HigherHalfPassThrough", this.paramsOutDescription );
      }

    } else {
      depthwise1Result = pointwise1Result;
    }

    // 2.2 Depthwise2
    let depthwise2Result;

    // (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))
    if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_TWO_DEPTHWISE() ) {

      if ( 0 != testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
        depthwise2Result = testParams.use_depthwise2( imageIn0, "Depthwise2_for_input0", this.paramsOutDescription ); // depthwise2 apply to input0 (not input1).
      } else {
        depthwise2Result = imageIn0; // Since depthwise2 is just no-op, its result is just the same as its input (i.e. input0 (not input1)).
      }

    // (-4) (ShuffleNetV2_ByMobileNetV1's head)
    } else if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) {

      if ( 0 != testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {

        // depthwise2 apply to input1 which higher-half-copy-lower-half from input0 (not original input0, not original input1).
        depthwise2Result = testParams.use_depthwise2( imageIn1, "Depthwise2_for_input1", this.paramsOutDescription );

      } else {
        depthwise2Result = imageIn0; // Since depthwise2 is just no-op, its result is just the same as its input (i.e. input0 (not input1)).
      }
    }

    // 3. Concat1 (along image depth)
    let concat1Result = depthwise1Result; // If no concat1, the same as depthwise1.

    // TWO_INPUTS (> 0) (ShuffleNetV2's (and ShuffleNetV2_ByPointwise22's) body/tail)
    if ( testParams.channelCount1_pointwise1Before__is__TWO_INPUTS() ) {

      // Concatenate depthwise1's result and input1. (i.e. concat1)
      concat1Result = NumberImage.Base.calcConcatAlongAxisId2( depthwise1Result, imageIn1,
        "Concat1_depthwise1_input1 (TWO_INPUTS)", this.paramsOutDescription );

    // ONE_INPUT_TWO_DEPTHWISE                  (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))
    // ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4) (ShuffleNetV2_ByMobileNetV1's head)
    } else if (   ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_TWO_DEPTHWISE() ) // (-2)
               || ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) // (-4)
              ) {

      // Concatenate depthwise1's result and depthwise2's result.
      concat1Result = NumberImage.Base.calcConcatAlongAxisId2(
        depthwise1Result, depthwise2Result,
        "Concat1_depthwise1_depthwise2 (ONE_INPUT_TWO_DEPTHWISE or ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1)",
        this.paramsOutDescription );
    }

    // 4. Pointwise2
    let bAddInputToOutputRequested = false;
    if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_ADD_TO_OUTPUT() ) { // (-1) MobileNetV2
      if ( testParams.out.depthwisePadInfo.is_Output_Same_HeightWidth_As_Input() ) { // add-input-to-output is possible if same ( height, width ).
        bAddInputToOutputRequested = true;
      }
    }

    // 4.1 Pointwise21
    let imageIn1_beforePointwise21 = imageIn1;
    let pointwise21Result, pointwise21Result_beforeConcatWith_pointwise212;
    {
      if ( pointwise21ChannelCount > 0 ) {
        pointwise21Result = testParams.use_pointwise21( concat1Result, pointwise21ChannelCount, "Pointwise21", this.paramsOutDescription );

        // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) {
          let pointwise212Result = testParams.use_pointwise212( concat1Result, pointwise21ChannelCount, "Pointwise212", this.paramsOutDescription );

          pointwise21Result_beforeConcatWith_pointwise212 = pointwise21Result;
          pointwise21Result = NumberImage.Base.calcConcatAlongAxisId2( pointwise21Result, pointwise212Result,
            "Concat_pointwise21_pointwise212 (ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4))", this.paramsOutDescription );

        } else if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) { // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
          imageIn1 = testParams.use_pointwise21_PassThrough( imageIn1_beforePointwise21, // pass-through input1 (which is past-through by depthwise1).
            pointwise21ChannelCount, // So that it could be concatenated with pointwise21Result.
            "Pointwise21_imageIn1_HigherHalfPassThrough", this.paramsOutDescription );
        }

      } else {
        pointwise21Result = concat1Result;
      }

      // Residual Connection.
      if ( bAddInputToOutputRequested )
        if ( pointwise21Result.depth == testParams.out.channelCount0_pointwise1Before ) // add-input-to-output is possible if same channel count.
          pointwise21Result = pointwise21Result.cloneBy_add( imageIn0, "Pointwise21_AddInputToOutput", this.paramsOutDescription );
    }

    let imageOutArray = [ pointwise21Result, null ]; // Assume no pointwise22.

    // 4.2 Pointwise22
    //
    // ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4) or ONE_INPUT_TWO_DEPTHWISE (-2) or
    // ONE_INPUT_ADD_TO_OUTPUT (-1) or ONE_INPUT (0) or TWO_INPUTS (> 0).
    //
    // (i.e. Not (-3) ShuffleNetV2's body/tail, Not (-5) ShuffleNetV2_ByMobileNetV1's body/tail)
    if (   ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        || ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_TWO_DEPTHWISE() ) // (-2) (ShuffleNetV2's head (simplified))
        || ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_ADD_TO_OUTPUT() ) // (-1) (MobileNetV2)
        || ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT() )  // (  0) (MobileNetV1 (General Pointwise1-Depthwise1-Pointwise2))
        || ( testParams.channelCount1_pointwise1Before__is__TWO_INPUTS() ) // (> 0) (ShuffleNetV2's (and ShuffleNetV2_ByPointwise22's) body/tail)
       ) {

      // If output1 is requested, it comes from pointwise22 directly. The pointwise22 will have the same output channel count as pointwise21.
      let pointwise22ChannelCount;

      if ( testParams.out.bOutput1Requested ) {    
        pointwise22ChannelCount = pointwise21ChannelCount;
      } else {
        pointwise22ChannelCount = 0;
      }

      let bPointwise22Bias = testParams.out.bPointwise21Bias; // pointwise22's bias flag is the same as pointwise21.
      let pointwise22ActivationId = testParams.out.pointwise21ActivationId; // pointwise22's activation function is the same as pointwise21.

      let pointwise22Result, pointwise22Result_beforeConcatWith_pointwise222;
      if ( pointwise22ChannelCount > 0 ) {
        pointwise22Result = testParams.use_pointwise22( concat1Result, pointwise22ChannelCount, "Pointwise22", this.paramsOutDescription );

        // (-4) (ShuffleNetV2_ByMobileNetV1's head)
        if ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) {
          let pointwise222Result = testParams.use_pointwise222( concat1Result, pointwise22ChannelCount, "Pointwise222", this.paramsOutDescription );

          pointwise22Result_beforeConcatWith_pointwise222 = pointwise22Result;
          pointwise22Result = NumberImage.Base.calcConcatAlongAxisId2( pointwise22Result, pointwise222Result,
            "Concat_pointwise22_pointwise222 (ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4))", this.paramsOutDescription );
        }

        // Residual Connection.
        //
        // Always using input0 (i.e. imageInArray[ 0 ]). In fact, only if ( inputTensorCount <= 1 ), the residual connection is possible.
        if ( bAddInputToOutputRequested )
          if ( pointwise22Result.depth == testParams.out.channelCount0_pointwise1Before ) // add-input-to-output is possible if same channel count.
            pointwise22Result = pointwise22Result.cloneBy_add( imageIn0, "Pointwise22_AddInputToOutput", this.paramsOutDescription );
      }

      // Integrate pointwise21 and pointwise22 into pointwise2.
      imageOutArray[ 1 ] = pointwise22Result;

    // 5. Concat2 (along image depth), shuffle, split.
    //
    // TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3) (ShuffleNetV2's body/tail)
    // ONE_INPUT_HALF_THROUGH               (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
    } else if (    ( testParams.channelCount1_pointwise1Before__is__TWO_INPUTS_CONCAT_POINTWISE21_INPUT1() ) // (-3)
                || ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) ) { // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)

      tf.util.assert( ( !imageOutArray[ 1 ] ),
        `PointDepthPoint imageOutArray[ 1 ] ( ${imageOutArray[ 1 ]} ) `
          + `should be null, since there is no pointwise22. ${this.paramsOutDescription}`);

      let imageConcat2InArray = Array.from( imageOutArray );
      
      // Note: When ONE_INPUT_HALF_THROUGH (-5) (ShuffleNetV2_ByMobileNetV1's body/tail), input1 has already been past-through by pointwise1,
      //       depthwise1 and pointwise21.
      //
      imageConcat2InArray[ 1 ] = imageIn1; // i.e. input1.

      // 5.1 Concat2, shuffle, split.

      if (   ( testParams.out.bOutput1Requested == true ) // (ShuffleNetV2's body)

          // Note: When ONE_INPUT_HALF_THROUGH (-5), although ( bOutput1Requested == false ), it still needs shuffle.
          || ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
         ) {

        let channelShuffler_concatenatedShape = channelShuffler.concatenatedShape;
        let channelShuffler_outputGroupCount = channelShuffler.outputGroupCount;
        this.calcConcatShuffleSplit( channelShuffler_concatenatedShape, channelShuffler_outputGroupCount,
          imageConcat2InArray, imageOutArray, "Concat2_pointwise21_input1_ShuffleSplit", this.paramsOutDescription );

      // 5.2 Concat2 only.
      } else { // ( bOutput1Requested == false ), (ShuffleNetV2's tail)
        imageOutArray[ 0 ] = NumberImage.Base.calcConcatAlongAxisId2(
          imageConcat2InArray[ 0 ], imageConcat2InArray[ 1 ], "Concat2_pointwise21_input1", this.paramsOutDescription );
      }

    } else {
      tf.util.assert( false,
        `PointDepthPoint testParams.out.channelCount1_pointwise1Before ( ${testParams.out.channelCount1_pointwise1Before} ) `
          + `is unknown value. ${this.paramsOutDescription}`);
    }

    // 6.

    // The imageOutArray[ 0 ] and imageOutArray[ 1 ] should be concatenated into imageOutArray[ 0 ], because we use the logic of
    // TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3) and ONE_INPUT_TWO_DEPTHWISE (-2) to handle ONE_INPUT_HALF_THROUGH (-5) and
    // ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4).
    if (   ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH() ) // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
        || ( testParams.channelCount1_pointwise1Before__is__ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1() ) // (-4) (ShuffleNetV2_ByMobileNetV1's head)
       ) {

      let concatResult = NumberImage.Base.calcConcatAlongAxisId2(
        imageOutArray[ 0 ], imageOutArray[ 1 ],
        "Concat_imageOutArray_0_1_to_imageOutArray_0 (ONE_INPUT_HALF_THROUGH or ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1)",
        this.paramsOutDescription );

      imageOutArray[ 0 ] = concatResult;
      imageOutArray[ 1 ] = null;
    }

    return imageOutArray;
  }

  /**
   *
   * @param {number[]} concatenatedShape           The concatenatedShape of channel shuffler.
   * @param {number}   outputGroupCount            The outputGroupCount of channel shuffler.
   *
   * @param {NumberImage.Base} imageInArray[ 0 ]   The first input image to be processed.
   * @param {NumberImage.Base} imageInArray[ 1 ]   The second input image to be processed.
   *
   * @param {NumberImage.Base} imageOutArray[ 0 ]   The first output image.
   * @param {NumberImage.Base} imageOutArray[ 1 ]   The second output image.
   *
   * @param {string}   concatShuffleSplitName       A string for debug message of this concatenation-shuffle-split.
   * @param {string}   parametersDesc               A string for debug message of this point-depth-point.
   */
  calcConcatShuffleSplit(
    concatenatedShape, outputGroupCount, imageInArray, imageOutArray, concatShuffleSplitName, parametersDesc ) {

//!!! (2021/11/26 Remarked)
//     tf.util.assert(
//       (   ( imageInArray[ 0 ].height == imageInArray[ 1 ].height )
//        && ( imageInArray[ 0 ].width ==  imageInArray[ 1 ].width )
//        && ( imageInArray[ 0 ].depth ==  imageInArray[ 1 ].depth ) ),
//
//       `${concatShuffleSplitName}: The first input image's shape ( height, width, depth ) = `
//         + `( ${imageInArray[ 0 ].height}, ${imageInArray[ 0 ].width}, ${imageInArray[ 0 ].depth} ) `
//         + `should be the same as the second input image's shape `
//         + `( ${imageInArray[ 1 ].height}, ${imageInArray[ 1 ].width}, ${imageInArray[ 1 ].depth} ). `
//         + `(${parametersDesc})`
//     );

//!!! (2021/11/23 Remarked) It seems not work.
    // Note: Although different depth is wierd, it might still work. So, allow it.
    tf.util.assert(
      (   ( imageInArray[ 0 ].height == imageInArray[ 1 ].height )
       && ( imageInArray[ 0 ].width ==  imageInArray[ 1 ].width )
       //&& ( imageInArray[ 0 ].depth ==  imageInArray[ 1 ].depth )
      ),

      `${concatShuffleSplitName}: The first input image's shape ( height, width, depth ) = `
        + `( ${imageInArray[ 0 ].height}, ${imageInArray[ 0 ].width}, ${imageInArray[ 0 ].depth} ) `
        + `should be the same as the second input image's shape `
        + `( ${imageInArray[ 1 ].height}, ${imageInArray[ 1 ].width}, ${imageInArray[ 1 ].depth} ). `
        + `(${parametersDesc})`
    );

    let channelShuffler_ShuffleInfo;
    {
      channelShuffler_ShuffleInfo = this.channelShufflerPool.getChannelShuffler_by(
        concatenatedShape[ 0 ],
        concatenatedShape[ 1 ],
        concatenatedShape[ 2 ],
        outputGroupCount
      );

      for ( let i = 0; i < 2; ++i ) {
        tf.util.assert(
          channelShuffler_ShuffleInfo.concatenatedShape[ i ] == concatenatedShape[ i ],
          `${concatShuffleSplitName}: `
            + `channelShuffler_ShuffleInfo.concatenatedShape[ ${i} ] ( ${channelShuffler_ShuffleInfo.concatenatedShape[ i ]} ) `
            + `should be the same as `
            + `concatenatedShape[ ${i} ] ( ${concatenatedShape[ i ]} ) `
            + `${parametersDesc}`);
      }

      tf.util.assert(
        channelShuffler_ShuffleInfo.outputGroupCount == outputGroupCount,
        `${concatShuffleSplitName}: `
          + `channelShuffler_ShuffleInfo.outputGroupCount ( ${channelShuffler_ShuffleInfo.outputGroupCount} ) `
          + `should be the same as `
          + `outputGroupCount ( ${outputGroupCount} ) `
          + `${parametersDesc}`);
    }

    // Convert input images to tensors.
    let tensorInArray = new Array( imageInArray.length );
    for ( let i = 0; i < imageInArray.length; ++i ) {
      let t = tf.tensor( imageInArray[ i ].dataArray, [ imageInArray[ i ].height, imageInArray[ i ].width, imageInArray[ i ].depth ] );
      tensorInArray[ i ] = t;
    }

    // Concat-shuffle-split.
    // 
    // Using different channel shuffler implementation for comparsion correctness.
    let tensorOutArray = channelShuffler_ShuffleInfo.concatReshapeTransposeReshapeSplit( tensorInArray );

    // Converty output tensors to images.
    for ( let i = 0; i < imageOutArray.length; ++i ) {
      let t = tensorOutArray[ i ];
      let imageHeight = t.shape[ 0 ];
      let imageWidth = t.shape[ 1 ];
      let imageDepth = t.shape[ 2 ];

      imageOutArray[ i ] = new NumberImage.Base( imageHeight, imageWidth, imageDepth, t.dataSync(),
        new ConvBiasActivation.BoundsArraySet( imageDepth, imageDepth )
      );

      //!!! ...unfinished... (2022/02/23) 
      // Because do not know how to shuffle the channel value bounds array, set to a default value instead.
      imageOutArray[ i ].boundsArraySet.set_all_byBounds( Weights.Base.ValueBounds );
    }
         
    // Release temporary tensors.
    tf.dispose( tensorInArray );
    tf.dispose( tensorOutArray );

//!!! (2021/09/03 Remarked) The indexes is no so simple.
//     let imageCount = 2; // No matter input or input, both are two images.
//     let imageHeight = imageInArray[ 0 ].height;
//     let imageWidth = imageInArray[ 0 ].width;
//     let imageDepth = imageInArray[ 0 ].depth;
//
//     // Output images have the same shape as input images.
//     for ( let i = 0; i < imageCount; ++i ) {
//       imageOutArray[ i ] = {
//         height:    imageInArray[ i ].height,
//         width:     imageInArray[ i ].width,
//         depth:     imageInArray[ i ].depth,
//         dataArray: new Float32Array( imageInArray[ i ].dataArray.length ),
//       };
//     }
//
//     // Swap two images interleavely.
//     let concatenatedChannelCount = ( imageDepth * imageCount );
//     for ( let y = 0; y < imageHeight; ++y ) {
//       let indexBaseX = ( y * imageWidth );
//
//       for ( let x = 0; x < imageWidth; ++x ) {
//         let indexBaseC = ( ( indexBaseX + x ) * imageDepth );
//
//         for ( let c = 0; c < concatenatedChannelCount; ++c ) {
//           let inImageIndex = Math.floor( c / imageDepth );  // from which input image.
//           let inChannel = c % imageDepth;                   // from which channel (of the input image).
//
//           let outImageIndex = c % imageCount;               // to which output image.
//           let outChannel = Math.floor( c / imageCount );    // to which channel (of the output image).
//
//           let inIndex = indexBaseC + inChannel;
//           let outIndex = indexBaseC + outChannel;
//           imageOutArray[ outImageIndex ].dataArray[ outIndex ] = imageInArray[ inImageIndex ].dataArray[ inIndex ];
//         }
//       }
//     }
  }

  /**
   * @param {PointDepthPoint_TestParams.Base} testParams
   *   The test parameters for creating description.
   *
   * @return {string}
   *   The description of the testParams.out.
   */
  static TestParams_Out_createDescription( testParams ) {

    let flags = {};
    PointDepthPoint.Params.setFlags_by.call( flags,
      testParams.out.channelCount0_pointwise1Before, testParams.out.channelCount1_pointwise1Before,
      testParams.out.pointwise1ChannelCount,
      testParams.out.depthwise_AvgMax_Or_ChannelMultiplier,
      testParams.out.pointwise21ChannelCount,
      testParams.out.bOutput1Requested );

    let paramsOutDescription =
        `inputTensorCount=${flags.inputTensorCount}, `

      + `inputHeight0=${testParams.out.inputHeight0}, inputWidth0=${testParams.out.inputWidth0}, `
      + `inChannels0=${testParams.out.channelCount0_pointwise1Before}, inChannels1=${flags.input1ChannelCount}, `

      + `channelCount1_pointwise1Before_Name=`
      + `${PointDepthPoint.Params.channelCount1_pointwise1Before.getStringOfValue( testParams.out.channelCount1_pointwise1Before )}`
      + `(${testParams.out.channelCount1_pointwise1Before}), `

      + `bHigherHalfDifferent=${flags.bHigherHalfDifferent}, `
      + `bHigherHalfDepthwise2=${flags.bHigherHalfDepthwise2}, `

      + `pointwise1ChannelCount=${testParams.out.pointwise1ChannelCount}, bPointwise1Bias=${testParams.out.bPointwise1Bias}, `
      + `pointwise1ActivationName=`
      + `${PointDepthPoint.Params.pointwise1ActivationId.getStringOfValue( testParams.out.pointwise1ActivationId )}`
      + `(${testParams.out.pointwise1ActivationId}), `

      + `bDepthwise2Requested=${flags.bDepthwise2Requested}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=${testParams.out.depthwise_AvgMax_Or_ChannelMultiplier}, `
      + `depthwiseFilterHeight=${testParams.out.depthwiseFilterHeight}, depthwiseFilterWidth=${testParams.out.depthwiseFilterWidth}, `
      + `depthwiseStridesPad=${testParams.out.depthwiseStridesPad}, `
      + `bDepthwiseBias=${testParams.out.bDepthwiseBias}, `
      + `depthwiseActivationName=`
      + `${PointDepthPoint.Params.depthwiseActivationId.getStringOfValue( testParams.out.depthwiseActivationId )}`
      + `(${testParams.out.depthwiseActivationId}), `

      + `bConcat1Requested=${flags.bConcat1Requested}, `

      + `pointwise21ChannelCount=${testParams.out.pointwise21ChannelCount}, bPointwise21Bias=${testParams.out.bPointwise21Bias}, `
      + `pointwise21ActivationName=`
      + `${PointDepthPoint.Params.pointwise21ActivationId.getStringOfValue( testParams.out.pointwise21ActivationId )}`
      + `(${testParams.out.pointwise21ActivationId}), `

      + `bOutput1Requested=${testParams.out.bOutput1Requested}, `

      + `bAddInputToOutputRequested=${flags.bAddInputToOutputRequested}, `
      + `bConcat2ShuffleSplitRequested=${flags.bConcat2ShuffleSplitRequested}, `
      + `outputTensorCount=${flags.outputTensorCount}, `

      + `bKeepInputTensor=${testParams.out.bKeepInputTensor}`
    ;

    return paramsOutDescription;
  }

}
