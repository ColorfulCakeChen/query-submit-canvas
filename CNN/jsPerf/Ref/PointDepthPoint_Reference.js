export { Base };

import * as TensorTools from "../../util/TensorTools.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as ChannelCountCalculator from "../../Conv/ChannelCountCalculator.js";
import * as Depthwise from "../../Conv/Depthwise.js";
import * as ChannelShuffler from "../../Conv/ChannelShuffler.js";
import * as ChannelShufflerPool from "../../Conv/ChannelShufflerPool.js";
import * as PointDepthPoint from "../../Conv/PointDepthPoint.js";
import * as PointDepthPoint_TestParams from "./PointDepthPoint_TestParams.js"; 
import * as ImageSourceBag from "./ImageSourceBag.js";

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
    this.imageInArraySelected = new Array( 2 ); // imageInArraySelected[ 0 ] is input0, imageInArraySelected[ 1 ] is input1.
    this.outputTensor3dArray = new Array( 2 );
    this.inputTensor3dArray = new Array( 2 );
    this.asserter_Tensor_NumberArray = new TensorTools.Asserter_Tensor_NumberArray( 0.4 );
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

    // For ONE_INPUT_HALF_THROUGH (-5), the input channel count must be even (i.e. divisable by 2).
    //
    // The reason is that the calcResult() will splitted it into two input images. If it is not even, the splitting may still work but
    // the concat-shuffle-split can not work.
    //
    // Note: PointDepthPoint_TestParams.Base.generate_Filters_Biases() should already double them in this case. 
    if ( testParams.out.channelCount1_pointwise1Before
           == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) { // (-5)

      if ( ( testParams.out.channelCount0_pointwise1Before % 2 ) != 0 )
        return;

      if ( ( testParams.out.pointwise1ChannelCount % 2 ) != 0 )
        return;
    }

    // The depthwise filter of AVG pooling and MAX pooling can not be manipulated.
    switch ( testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG:
      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX:

        switch ( testParams.out.channelCount1_pointwise1Before ) { // bHigherHalfDifferent
          case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1: // (-4)
          case ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH: // (-5)
            return;
            break;
        }
    }

    try {
      let channelCount0_pointwise1Before = this.testParams.out.channelCount0_pointwise1Before;
      let channelCount1_pointwise1Before = this.testParams.out.channelCount1_pointwise1Before;
      let pointwise1ChannelCount = this.testParams.out.pointwise1ChannelCount;
      let depthwise_AvgMax_Or_ChannelMultiplier = this.testParams.out.depthwise_AvgMax_Or_ChannelMultiplier;
      let depthwiseFilterHeight = this.testParams.out.depthwiseFilterHeight;
      let depthwiseStridesPad = this.testParams.out.depthwiseStridesPad;
      let pointwise21ChannelCount = this.testParams.out.pointwise21ChannelCount;
      let bKeepInputTensor = this.testParams.out.bKeepInputTensor;

      let imageInArraySelected = this.imageInArraySelected; // imageInArraySelected[ 0 ] is input0, imageInArraySelected[ 1 ] is input1.
      let outputTensor3dArray = this.outputTensor3dArray;
      let inputTensor3dArray = this.inputTensor3dArray;

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
      let imageOutReferenceArray;
      {
        strNote = `( this.testParams.id=${this.testParams.id} )`;

        imageInArraySelected.fill( undefined );
        imageInArraySelected[ 0 ] = imageSourceBag.getImage_by( channelCount0_pointwise1Before );

//!!! ...unfinished... (2021/10/28) input1ChannelCount may zero.

        // Although input1 is only needed when ( bTwoInputs == true ), it is always prepared for calculating the shape of channel shuffler.
        // 
        // The shape of input1 (not input0) determines the concatenatedShape of channel shuffler because the input0 might be shrinked
        // by depthwise convolution.
        let imageIn1 = imageSourceBag.getImage_by(
          input1ChannelCount, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad );

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
//                 let channelCount0_pointwise1Before_lowerHalf = Math.ceil( this.testParams.out.channelCount0_pointwise1Before / 2 );
//                 let pointwise1ChannelCount_lowerHalf = Math.ceil( this.testParams.out.pointwise1ChannelCount / 2 );
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

        // Output is an array with two elements.
        imageOutReferenceArray = this.calcResult( imageInArraySelected,
//!!! (2021/10/28 Remarked) need channel shuffler.                                                 
//          channelShuffler_concatenatedShape, channelShuffler_outputGroupCount );
          channelShuffler_ConcatPointwiseConv );

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
      console.log( `PointDepthPoint_Reference.js: testCorrectness(): backendName=${backendName}, `
//        + `input image ( height, width ) = ( ${imageSourceBag.originalHeight}, ${imageSourceBag.originalWidth} ), `
        + `PointDepthPoint this.testParams.id == ${this.testParams.id}` );
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

      this.asserter_Tensor_NumberArray.assert(
        outputTensor, outputArrayRef,
        "PointDepthPoint", `output${i}`, `outputRef${i}`, parametersDescription
      );
    }
  }

  /**
   * @param {PointDepthPoint_TestParams.Base} testParams
   *   The test parameters. It is the value of PointDepthPoint_TestParams.Base.ParamsGenerator()'s result.
   *
   * @return {PointDepthPoint.Base} The created pointDepthPoint object.
   */
  static pointDepthPoint_create( testParams, channelShuffler_ConcatPointwiseConv ) {

    let pointDepthPoint = new PointDepthPoint.Base();

    let progress = new ValueMax.Percentage.Aggregate();

    // Initialize successfully or failed.
    let extractedParams = new PointDepthPoint.Params( testParams.in.inputFloat32Array, testParams.in.byteOffsetBegin,
      testParams.in.channelCount0_pointwise1Before, testParams.in.channelCount1_pointwise1Before,
      testParams.in.pointwise1ChannelCount, testParams.in.bPointwise1Bias, testParams.in.pointwise1ActivationId,
      testParams.in.depthwise_AvgMax_Or_ChannelMultiplier, testParams.in.depthwiseFilterHeight,
      testParams.in.depthwiseStridesPad, testParams.in.bDepthwiseBias, testParams.in.depthwiseActivationId,
      testParams.in.pointwise21ChannelCount, testParams.in.bPointwise21Bias, testParams.in.pointwise21ActivationId,
      testParams.in.bOutput1Requested,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = pointDepthPoint.init( progress, extractedParams, channelShuffler_ConcatPointwiseConv );

    let flags = {};
    PointDepthPoint.Params.setFlags_by.call( flags,
      testParams.out.channelCount0_pointwise1Before, testParams.out.channelCount1_pointwise1Before,
      testParams.out.pointwise1ChannelCount,
      testParams.out.depthwise_AvgMax_Or_ChannelMultiplier,
      testParams.out.pointwise21ChannelCount,
      testParams.out.bOutput1Requested );

    let parametersDescription = `( ${pointDepthPoint.parametersDescription} )`;

    tf.util.assert( ( pointDepthPoint.bInitOk == bInitOk ),
      `PointDepthPoint validation state (${pointDepthPoint.bInitOk}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

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
   * @param {object[]} imageInArray
   *   The image to be tested.
   *     - imageInArray[ 0 ]: input0
   *     - imageInArray[ 1 ]: input1
   *
   * @param {number}   imageInArray[ i ].height    Image height
   * @param {number}   imageInArray[ i ].width     Image width
   * @param {number}   imageInArray[ i ].depth     Image channel count
   * @param {number[]} imageInArray[ i ].dataArray Image data
   *
   * @param {ChannelShuffler.Xxx} channelShuffler
   *   The channel shuffler. Used when concat-shuffle-split.
   *
   * @return {object[]} Return output images array.
   */ 
  calcResult( imageInArray, channelShuffler ) {

    let testParams = this.testParams;

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

      tf.util.assert( channelShuffler != null, `PointDepthPoint_Reference.Base.pointDepthPoint_create(): `
        + `channelShuffler must NOT null when `
        + `channelCount1_pointwise1Before=`
        + `${ValueDesc.channelCount1_pointwise1Before.Singleton.getStringOf( testParams.out.channelCount1_pointwise1Before )}`
        + `(${testParams.out.channelCount1_pointwise1Before})` );
    }

    {
      let flags = {};
      PointDepthPoint.Params.setFlags_by.call( flags,
        testParams.out.channelCount0_pointwise1Before, testParams.out.channelCount1_pointwise1Before,
        testParams.out.pointwise1ChannelCount,
        testParams.out.depthwise_AvgMax_Or_ChannelMultiplier,
        testParams.out.pointwise21ChannelCount,
        testParams.out.bOutput1Requested );

      // Create description for debug easily.
      this.paramsOutDescription =
          `inputTensorCount=${flags.inputTensorCount}, `

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
        + `depthwiseFilterHeight=${testParams.out.depthwiseFilterHeight}, `
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
    }

    // The following two (ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.Xxx) use same calculation logic:
    //    ONE_INPUT_HALF_THROUGH                   // (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
    //    TWO_INPUTS_CONCAT_POINTWISE21_INPUT1     // (-3) (ShuffleNetV2's body/tail)
    //
    // The following two (ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.Xxx) use same calculation logic:
    //    ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 // (-4) (ShuffleNetV2_ByMobileNetV1's head)
    //    ONE_INPUT_TWO_DEPTHWISE                  // (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))


    let imageIn0, imageIn1;

    // 0.

    let pointwise1ChannelCount, pointwise21ChannelCount;

    // The imageInArray[ 0 ] should be splitted into imageIn0 and imageIn1, because we use the logic of
    // TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3) to handle ONE_INPUT_HALF_THROUGH (-5).
    //
    // Note: PointDepthPoint_TestParams.Base.generate_Filters_Biases() double channelCount0_pointwise1Before, pointwise1ChannelCount,
    // pointwise21ChannelCount. So, halve them here.
    //
    if ( testParams.out.channelCount1_pointwise1Before
           == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) { // (-5)

      let imageInArray_Fake = Base.calcSplitAlongAxisId2( imageInArray[ 0 ], "Split_imageIn_to_imageInArray_0_1", this.paramsOutDescription );
      imageIn0 = imageInArray_Fake[ 0 ];
      imageIn1 = imageInArray_Fake[ 1 ];

      pointwise1ChannelCount = testParams.out.pointwise1ChannelCount;
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
      pointwise1ChannelCount = testParams.out.pointwise1ChannelCount;
      pointwise21ChannelCount = testParams.out.pointwise21ChannelCount;
    }

    // 1. Pointwise1
    let pointwise1Result;
    if ( pointwise1ChannelCount > 0 ) {
      pointwise1Result = Base.calcPointwise(
        imageIn0,
        pointwise1ChannelCount,
        testParams.in.paramsNumberArrayObject.pointwise1Filters, testParams.out.bPointwise1Bias,
        testParams.in.paramsNumberArrayObject.pointwise1Biases, testParams.out.pointwise1ActivationId,
        "Pointwise1", this.paramsOutDescription );
    } else {
      pointwise1Result = imageIn0;
    }

    // 2. Depthwise

    // 2.1 Depthwise1
    let depthwise1Result;
    if ( 0 != testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
      depthwise1Result = Base.calcDepthwise(
        pointwise1Result,
        testParams.out.depthwise_AvgMax_Or_ChannelMultiplier, testParams.out.depthwiseFilterHeight, testParams.out.depthwiseStridesPad,
        testParams.in.paramsNumberArrayObject.depthwise1Filters, testParams.out.bDepthwiseBias,
        testParams.in.paramsNumberArrayObject.depthwise1Biases, testParams.out.depthwiseActivationId,
        "Depthwise1", this.paramsOutDescription );
      

//!!! ...unfinished... (2021/12/03) When ONE_INPUT_HALF_THROUGH (-5), imageIn1 should be pre-processed by depthwise.
// Otherwise, its size may be different from pointwise21Result and can not be concatenated together.

//!!! ...unfinished... (2021/12/03) It seems that when:
//    ( testParams.out.channelCount1_pointwise1Before
//            == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) // (-5)
//
// should also depthwise2. Otherwise, they can not be concatenated because size is different.
//


    } else {
      depthwise1Result = pointwise1Result;
    }

    // 2.2 Depthwise2
    let depthwise2Result;
    if (   ( testParams.out.channelCount1_pointwise1Before // (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE )

        || ( testParams.out.channelCount1_pointwise1Before // (-4) (ShuffleNetV2_ByMobileNetV1's head)
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 ) ) {

      if ( 0 != testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
        depthwise2Result = Base.calcDepthwise(
          imageIn0, // depthwise2 apply to input0 (not input1)
          testParams.out.depthwise_AvgMax_Or_ChannelMultiplier, testParams.out.depthwiseFilterHeight, testParams.out.depthwiseStridesPad,
          testParams.in.paramsNumberArrayObject.depthwise2Filters, testParams.out.bDepthwiseBias,
          testParams.in.paramsNumberArrayObject.depthwise2Biases, testParams.out.depthwiseActivationId,
          "Depthwise2", this.paramsOutDescription );
      } else {
        depthwise2Result = imageIn0; // Since depthwise2 is just no-op, its result is just the same as its input (i.e. input0 (not input1)).
      }
    }

    // 3. Concat1 (along image depth)
    let concat1Result = depthwise1Result; // If no concat1, the same as depthwise1.

    // TWO_INPUTS (> 0)
    if ( testParams.out.channelCount1_pointwise1Before > 0 ) { // slower ShuffleNetV2's body and tail.

      // Concatenate depthwise1's result and input1. (i.e. concat1)
      concat1Result = Base.calcConcatAlongAxisId2( depthwise1Result, imageIn1,
        "Concat1_depthwise1_input1 (TWO_INPUTS)", this.paramsOutDescription );

    // ONE_INPUT_TWO_DEPTHWISE                  (-2) (ShuffleNetV2's head (or ShuffleNetV2_ByPointwise22's head) (simplified))
    // ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4) (ShuffleNetV2_ByMobileNetV1's head)
    } else if (   ( testParams.out.channelCount1_pointwise1Before
                      == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE )
               || ( testParams.out.channelCount1_pointwise1Before
                      == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 ) ) {

      // Concatenate depthwise1's result and depthwise2's result.
      concat1Result = Base.calcConcatAlongAxisId2(
        depthwise1Result, depthwise2Result,
        "Concat1_depthwise1_depthwise2 (ONE_INPUT_TWO_DEPTHWISE or ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1)",
        this.paramsOutDescription );
    }

    // 4. Pointwise2
    let bAddInputToOutputRequested;
    if ( testParams.out.channelCount1_pointwise1Before
           == PointDepthPoint.Params.channelCount1_pointwise1Before.valueDesc.Ids.ONE_INPUT_ADD_TO_OUTPUT ) { // (-1)
      bAddInputToOutputRequested = true;
    } else {
      bAddInputToOutputRequested = false;
    }

    // 4.1 Pointwise21
    let pointwise21Result;
    {
      if ( pointwise21ChannelCount > 0 ) {
        pointwise21Result = Base.calcPointwise(
          concat1Result,
          pointwise21ChannelCount,
          testParams.in.paramsNumberArrayObject.pointwise21Filters, testParams.out.bPointwise21Bias,
          testParams.in.paramsNumberArrayObject.pointwise21Biases, testParams.out.pointwise21ActivationId,
          "Pointwise21", this.paramsOutDescription );
      } else {
        pointwise21Result = concat1Result;
      }

      // Residual Connection.
      pointwise21Result = Base.modifyByInput(
        pointwise21Result, bAddInputToOutputRequested, imageIn0, "Pointwise21_AddInputToOutput", this.paramsOutDescription );
    }

    let imageOutArray = [ pointwise21Result, null ]; // Assume no pointwise22.

    // 4.2 Pointwise22
    //
    // ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 (-4) or ONE_INPUT_TWO_DEPTHWISE (-2) or
    // ONE_INPUT_ADD_TO_OUTPUT (-1) or ONE_INPUT (0) or TWO_INPUTS (> 0). (i.e. Not ShuffleNetV2's body/tail)
    if (   ( testParams.out.channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 ) // (-4)
        || ( testParams.out.channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_TWO_DEPTHWISE ) // (-2)
        || ( testParams.out.channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT ) // (-1)
        || ( testParams.out.channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT ) // (0)
        || ( testParams.out.channelCount1_pointwise1Before > 0 )
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

      let pointwise22Result;
      if ( pointwise22ChannelCount > 0 ) {
        pointwise22Result = Base.calcPointwise(
          concat1Result,
          pointwise22ChannelCount,
          testParams.in.paramsNumberArrayObject.pointwise22Filters, bPointwise22Bias,
          testParams.in.paramsNumberArrayObject.pointwise22Biases, pointwise22ActivationId,
          "Pointwise22", this.paramsOutDescription );

        // Residual Connection.
        //
        // Always using input0 (i.e. imageInArray[ 0 ]). In fact, only if ( inputTensorCount <= 1 ), the residual connection is possible.
        pointwise22Result = Base.modifyByInput(
          pointwise22Result, bAddInputToOutputRequested, imageIn0, "Pointwise22_AddInputToOutput", this.paramsOutDescription );
      }

      // Integrate pointwise21 and pointwise22 into pointwise2.
      imageOutArray[ 1 ] = pointwise22Result;

    // 5. Concat2 (along image depth), shuffle, split.
    //
    // TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 (-3) (ShuffleNetV2's body/tail)
    // ONE_INPUT_HALF_THROUGH               (-5) (ShuffleNetV2_ByMobileNetV1's body/tail)
    } else if (    ( testParams.out.channelCount1_pointwise1Before
                       == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.TWO_INPUTS_CONCAT_POINTWISE21_INPUT1 )
                || ( testParams.out.channelCount1_pointwise1Before
                       == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) ) {

      tf.util.assert( ( !imageOutArray[ 1 ] ),
        `PointDepthPoint imageOutArray[ 1 ] ( ${imageOutArray[ 1 ]} ) `
          + `should be null, since there is no pointwise22. ${this.paramsOutDescription}`);

      let imageConcat2InArray = Array.from( imageOutArray );
      
//!!! ...unfinished... (2021/12/03) When ONE_INPUT_HALF_THROUGH (-5), imageIn1 should be pre-processed by depthwise.
// Otherwise, its size may be different from pointwise21Result and can not be concatenated together.

      imageConcat2InArray[ 1 ] = imageIn1; // i.e. input1.

      // 5.1 Concat2, shuffle, split.

      if (   ( testParams.out.bOutput1Requested == true )

          // Note: When ONE_INPUT_HALF_THROUGH (-5), although ( bOutput1Requested == false ), it still needs shuffle.
          || ( testParams.out.channelCount1_pointwise1Before
                 == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) // (-5)
         ) {

        let channelShuffler_concatenatedShape = channelShuffler.concatenatedShape;
        let channelShuffler_outputGroupCount = channelShuffler.outputGroupCount;
        this.calcConcatShuffleSplit( channelShuffler_concatenatedShape, channelShuffler_outputGroupCount,
          imageConcat2InArray, imageOutArray, "Concat2_pointwise21_input1_ShuffleSplit", this.paramsOutDescription );

      // 5.2 Concat2 only.
      } else { // ( bOutput1Requested == false )
        imageOutArray[ 0 ] = Base.calcConcatAlongAxisId2(
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
    if (   ( testParams.out.channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH ) // (-5)
        || ( testParams.out.channelCount1_pointwise1Before
               == ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1 ) // (-4)
       ) {

      let concatResult = Base.calcConcatAlongAxisId2(
        imageOutArray[ 0 ], imageOutArray[ 1 ],
        "Concat_imageOutArray_0_1_to_imageOutArray_0 (ONE_INPUT_HALF_THROUGH or ONE_INPUT_HALF_THROUGH_EXCEPT_DEPTHWISE1)",
        this.paramsOutDescription );

      imageOutArray[ 0 ] = concatResult;
      imageOutArray[ 1 ] = null;
    }

    return imageOutArray;
  }

  /**
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   * @param {boolean}  bBias             Whether add bias.
   * @param {string}   pointwiseName     A string for debug message of this convolution.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {Float32Array}
   *   The result of the pointwise convolution, bias and activation.
   */
  static calcPointwise(
    imageIn,
    pointwiseChannelCount, pointwiseFiltersArray, bPointwiseBias, pointwiseBiasesArray, pointwiseActivationId,
    pointwiseName, parametersDesc ) {

    tf.util.assert( ( ( pointwiseFiltersArray.length / pointwiseChannelCount ) == imageIn.depth ),
      `${pointwiseName} filters shape ( ${pointwiseFiltersArray.length} / ${pointwiseChannelCount} ) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

    let imageOutLength = ( imageIn.height * imageIn.width * pointwiseChannelCount );
    let imageOut = { height: imageIn.height, width: imageIn.width, depth: pointwiseChannelCount, dataArray: new Float32Array( imageOutLength ) };

    // Pointwise Convolution
    for ( let y = 0; y < imageIn.height; ++y ) {
      let indexBaseX = ( y * imageIn.width );

      for ( let x = 0; x < imageIn.width; ++x ) {
        let indexBaseC = ( indexBaseX + x );
        let inIndexBaseC  = ( indexBaseC * imageIn.depth );
        let outIndexBaseC = ( indexBaseC * pointwiseChannelCount );

        for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;

          for ( let outChannel = 0; outChannel < pointwiseChannelCount; ++outChannel ) {
            let outIndex = outIndexBaseC + outChannel;
            let filterIndexBase = ( inChannel * pointwiseChannelCount );
            let filterIndex = filterIndexBase + outChannel;

            imageOut.dataArray[ outIndex ] += imageIn.dataArray[ inIndex ] * pointwiseFiltersArray[ filterIndex ];
          }
        }
      }
    }

    // Bias
    Base.modifyByBias( imageOut, bPointwiseBias, pointwiseBiasesArray, pointwiseName + " bias", parametersDesc );

    // Activation
    Base.modifyByActivation( imageOut, pointwiseActivationId, parametersDesc );

    return imageOut;
  }

  /**
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   * @param {boolean}  bBias             Whether add bias.
   * @param {string}   depthwiseName     A string for debug message of this convolution.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {Float32Array}
   *   The result of the depthwise convolution, bias and activation.
   */
  static calcDepthwise(
    imageIn,
    depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad,
    depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationId,
    depthwiseName, parametersDesc ) {

    if ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE === depthwise_AvgMax_Or_ChannelMultiplier )
      return imageIn; // No depthwise operation.

//!!! ...unfinished... (2021/03/17) What about ( depthwiseFilterHeight <= 0 )?

    let padInfo = new Depthwise.PadInfoCalculator( imageIn.height, imageIn.width, imageIn.depth, 
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad );

    let { channelMultiplier, dilationHeight, dilationWidth,
          stridesHeight, stridesWidth, padHeightTop, padWidthLeft,
          imageOutHeight, imageOutWidth, imageOutDepth, imageOutLength } = padInfo;

    let depthwiseFilterWidth = padInfo.filterWidth;

    // For ( pad == "valid" ), negative ( inX, inY ) will never happen.
    // For ( pad == "same"  ), negative ( inX, inY ) may happen, but those pixels will be viewed as zero value.
    let imageInBeginY = - padHeightTop;
    let imageInBeginX = - padWidthLeft;

    // If not AVG, MAX, NONE, the filters shape should match input image channel count.
    if ( depthwise_AvgMax_Or_ChannelMultiplier > 0 ) {
      tf.util.assert( ( ( depthwiseFiltersArray.length / ( depthwiseFilterHeight * depthwiseFilterWidth * channelMultiplier ) ) == imageIn.depth ),
        `${depthwiseName} filters shape `
          + `( ${depthwiseFiltersArray.length} / ( ${depthwiseFilterHeight} * ${depthwiseFilterWidth} * ${channelMultiplier} ) ) `
          + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);
    }

    let imageOut = { height: imageOutHeight, width: imageOutWidth, depth: imageOutDepth, dataArray: new Float32Array( imageOutLength ) };

    // Max pooling
    if ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX === depthwise_AvgMax_Or_ChannelMultiplier ) {
        imageOut.dataArray.fill( Number.NEGATIVE_INFINITY ); // So that any value is greater than initialized value.
    }

    // Depthwise Convolution
    for ( let outY = 0; outY < imageOutHeight; ++outY ) {
      let outIndexBaseX = ( outY * imageOutWidth );
      let inYBase = imageInBeginY + ( outY * stridesHeight );

      for ( let outX = 0; outX < imageOutWidth; ++outX ) {
        let outIndexBaseC = ( ( outIndexBaseX + outX ) * imageOutDepth );
        let inXBase = imageInBeginX + ( outX * stridesWidth );

        for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
          let outIndexBaseSubC = outIndexBaseC + ( inChannel * channelMultiplier );

          for ( let outChannelSub = 0; outChannelSub < channelMultiplier; ++outChannelSub ) {
            let outIndex = outIndexBaseSubC + outChannelSub;

            // For Avg pooling, the divisor is effect filter size which includes dilation but excludes input image outside.
            let avgDivisor = 0;

            FilterYLoop:
            for ( let filterY = 0, inY = inYBase; filterY < depthwiseFilterHeight; ++filterY ) {
              for ( let dilationFilterY = 0; dilationFilterY < dilationHeight; ++dilationFilterY, ++inY ) {
                if ( inY < 0 )
                  continue;          // Never access outside of input image. Continue to find out non-negative input image y position.
                else if ( inY >= imageIn.height )
                  break FilterYLoop; // Never access outside of input image. Break because it is impossible to find inside of input image.

                let inIndexBaseX = ( inY * imageIn.width );
                let filterIndexBaseX = ( filterY * depthwiseFilterWidth );

                FilterXLoop:
                for ( let filterX = 0, inX = inXBase; filterX < depthwiseFilterWidth; ++filterX ) {
                  for ( let dilationFilterX = 0; dilationFilterX < dilationWidth; ++dilationFilterX, ++inX ) {
                    if ( inX < 0 )
                      continue;          // Never access outside of input image. Continue to find out non-negative input image x position.
                    else if ( inX >= imageIn.width )
                      break FilterXLoop; // Never access outside of input image. Break because it is impossible to find inside of input image.

                    // For Avg pooling, the divisor should include filter dilation but exclude input image outside.
                    //
                    // This accumulation should be done after confirm ( inY, inX ) is inside the input image.
                    ++avgDivisor;

                    // No need to compute the filter's dilation part (because it is always zero).
                    //
                    // This shortcut check should be done after avgDivisor has been increased, so that the filter dilation will
                    // be included by avgDivisor.
                    if ( ( 0 != dilationFilterY ) || ( 0 != dilationFilterX ) )
                      continue;

                    let inIndexBaseC = ( ( inIndexBaseX + inX ) * imageIn.depth );
                    let inIndex = inIndexBaseC + inChannel;
                    let filterIndexBaseC = ( ( filterIndexBaseX + filterX ) * imageOutDepth );
                    let filterIndexBaseSubC = filterIndexBaseC + ( inChannel * channelMultiplier );

                    let filterIndex = filterIndexBaseSubC + outChannelSub;

                    switch ( depthwise_AvgMax_Or_ChannelMultiplier ) {
                      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG: // Avg pooling
                        imageOut.dataArray[ outIndex ] += imageIn.dataArray[ inIndex ];
                        break;

                      case ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.MAX: // Max pooling
                        imageOut.dataArray[ outIndex ] = Math.max( imageOut.dataArray[ outIndex ], imageIn.dataArray[ inIndex ] );
                        break;

                      default: // Convolution
                        imageOut.dataArray[ outIndex ] += imageIn.dataArray[ inIndex ] * depthwiseFiltersArray[ filterIndex ];
                        break;
                    }
                  }
                }
              }
            }

            // Avg pooling
            if ( ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.AVG === depthwise_AvgMax_Or_ChannelMultiplier ) {
              imageOut.dataArray[ outIndex ] /= avgDivisor; // So that every sum is averaged.
            }
          }
        }
      }
    }

    // Bias
    Base.modifyByBias( imageOut, bDepthwiseBias, depthwiseBiasesArray, depthwiseName + " bias", parametersDesc );

    // Activation
    Base.modifyByActivation( imageOut, depthwiseActivationId, parametersDesc );

    return imageOut;
  }

  /**
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   * @param {string}   splitName         A string for debug message of this splitting.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {object[]}
   *   Return splitted images [ imageOut1, imageOut2 ] along the axis id 2. If imageIn is null, return [ null, null ].
   */
  static calcSplitAlongAxisId2( imageIn, splitName, parametersDesc ) {

    if ( null == imageIn )
      return [ null, null ];

//!!! (2021/11/23 Remarked) If not divided by 2, let lower half have one more.
//     tf.util.assert( ( ( imageIn.depth % 2 ) == 0 ),
//       `${splitName} shape imageIn.depth (${imageIn.depth}) `
//         + `should be dividable by 2 ( ( ${imageIn.depth} % 2 ) should be zero ). (${parametersDesc})`);

//!!! (2021/11/23 Remarked) If not divided by 2, let lower half have one more.
//     let imageOutDepth = imageIn.depth / 2;
//     let imageOutLength = ( imageIn.height * imageIn.width * imageOutDepth );
//     let imageOutArray = [
//       { height: imageIn.height, width: imageIn.width, depth: imageOutDepth, dataArray: new Float32Array( imageOutLength ) },
//       { height: imageIn.height, width: imageIn.width, depth: imageOutDepth, dataArray: new Float32Array( imageOutLength ) }
//     ];

    // If not divided by 2, let lower half have one more.
    let imageOutDepth_lowerHalf = Math.ceil( imageIn.depth / 2 );
    let imageOutDepth_higherHalf = imageIn.depth - imageOutDepth_lowerHalf;

    let imageOutLength_lowerHalf = ( imageIn.height * imageIn.width * imageOutDepth_lowerHalf );
    let imageOutLength_higherHalf = ( imageIn.height * imageIn.width * imageOutDepth_higherHalf );

    let imageOutArray = [
      { height: imageIn.height, width: imageIn.width, depth: imageOutDepth_lowerHalf, dataArray: new Float32Array( imageOutLength_lowerHalf ) },
      { height: imageIn.height, width: imageIn.width, depth: imageOutDepth_higherHalf, dataArray: new Float32Array( imageOutLength_higherHalf ) }
    ];

    let imageOut0 = imageOutArray[ 0 ];
    let imageOut1 = imageOutArray[ 1 ];

    // Split along the image depth.
    for ( let y = 0; y < imageIn.height; ++y ) {
      let indexBaseX = ( y * imageIn.width );

      for ( let x = 0; x < imageIn.width; ++x ) {
        let indexBaseC = ( indexBaseX + x );

        let inIndexBaseC  = ( indexBaseC * imageIn.depth );

        let inChannel = 0;

//!!! (2021/11/23 Remarked) If not divided by 2, let lower half have one more.
//         let outIndexBaseC = ( indexBaseC * imageOutDepth );
//
//         for ( let imageOutIndex = 0; imageOutIndex < imageOutArray.length; ++imageOutIndex ) {
//           let imageOut = imageOutArray[ imageOutIndex ];
//
//           for ( let outChannel = 0; outChannel < imageOutDepth; ++outChannel, ++inChannel ) {
//             let inIndex = inIndexBaseC + inChannel;
//             let outIndex = outIndexBaseC + outChannel;
//             imageOut.dataArray[ outIndex ] = imageIn.dataArray[ inIndex ];
//           }
//         }

        let outIndexBaseC_lowerHalf = ( indexBaseC * imageOutDepth_lowerHalf );
        let outIndexBaseC_higherHalf = ( indexBaseC * imageOutDepth_higherHalf );

        for ( let outChannel = 0; outChannel < imageOutDepth_lowerHalf; ++outChannel, ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;
          let outIndex_lowerHalf = outIndexBaseC_lowerHalf + outChannel;
          imageOut0.dataArray[ outIndex_lowerHalf ] = imageIn.dataArray[ inIndex ];
        }

        for ( let outChannel = 0; outChannel < imageOutDepth_higherHalf; ++outChannel, ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;
          let outIndex_higherHalf = outIndexBaseC_higherHalf + outChannel;
          imageOut1.dataArray[ outIndex_higherHalf ] = imageIn.dataArray[ inIndex ];
        }

      }
    }

    return imageOutArray;
  }


  /**
   * @param {number}   imageIn1.height    Image1 height
   * @param {number}   imageIn1.width     Image1 width
   * @param {number}   imageIn1.depth     Image1 channel count
   * @param {number[]} imageIn1.dataArray Image1 data
   * @param {number}   imageIn2.height    Image2 height
   * @param {number}   imageIn2.width     Image2 width
   * @param {number}   imageIn2.depth     Image2 channel count
   * @param {number[]} imageIn2.dataArray Image2 data
   * @param {string}   concatName        A string for debug message of this concatenation.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {object}
   *   Return concatenated image along the axis id 2. If imageIn1 is null, return imageIn2. If imageIn2 is null, return imageIn1.
   * If both imageIn1 and imageIn2 is null, return null.
   */
  static calcConcatAlongAxisId2( imageIn1, imageIn2, concatName, parametersDesc ) {

    if ( null == imageIn1 ) {
      if ( null == imageIn2 )
        return null; // Both input is null. Return null.
      else
        return imageIn2; // Only input1 is null. Return input2.
    } else {
      if ( null == imageIn2 )
        return imageIn1; // Only input2 is null. Return input1.
      else
        ; // Both input is not null. Do concatenate them in the following.
    }

    tf.util.assert( ( imageIn1.height == imageIn2.height ),
      `${concatName} shape imageIn1.height (${imageIn1.height}) `
        + `should match imageIn2.height (${imageIn2.height}). (${parametersDesc})`);

    tf.util.assert( ( imageIn1.width == imageIn2.width ),
      `${concatName} shape imageIn1.width (${imageIn1.width}) `
        + `should match imageIn2.width (${imageIn2.width}). (${parametersDesc})`);

    let imageOutLength = ( imageIn1.height * imageIn1.width * imageIn1.depth ) + ( imageIn2.height * imageIn2.width * imageIn2.depth );
    let imageOut = {
      height: imageIn1.height, width: imageIn1.width, depth: ( imageIn1.depth + imageIn2.depth ), dataArray: new Float32Array( imageOutLength ) };

    // Concatenate along the image depth.
    for ( let y = 0; y < imageIn1.height; ++y ) {
      let indexBaseX = ( y * imageIn1.width );

      for ( let x = 0; x < imageIn1.width; ++x ) {
        let indexBaseC = ( indexBaseX + x );
        let outIndexBaseC = ( indexBaseC * imageOut.depth );

        let outChannel = 0;

        let in1IndexBaseC  = ( indexBaseC * imageIn1.depth );
        for ( let in1Channel = 0; in1Channel < imageIn1.depth; ++in1Channel, ++outChannel ) {
          let in1Index = in1IndexBaseC + in1Channel;
          let outIndex = outIndexBaseC + outChannel;
          imageOut.dataArray[ outIndex ] = imageIn1.dataArray[ in1Index ];
        }

        let in2IndexBaseC  = ( indexBaseC * imageIn2.depth );
        for ( let in2Channel = 0; in2Channel < imageIn2.depth; ++in2Channel, ++outChannel ) {
          let in2Index = in2IndexBaseC + in2Channel;
          let outIndex = outIndexBaseC + outChannel;
          imageOut.dataArray[ outIndex ] = imageIn2.dataArray[ in2Index ];
        }

      }
    }

    return imageOut;
  }

  /**
   * @param {number}   imageOut.height      Output image height
   * @param {number}   imageOut.width       Output image width
   * @param {number}   imageOut.depth       Output image channel count
   * @param {number[]} imageOut.dataArray   Output image data
   * @param {boolean}  bAddInputToOutput    Whether add input to output.
   * @param {number}   imageIn.height       Input image height
   * @param {number}   imageIn.width        Input image width
   * @param {number}   imageIn.depth        Input image channel count
   * @param {number[]} imageIn.dataArray    Input image data
   * @param {string}   addInputToOutputName A string for debug message of this bias.
   * @param {string}   parametersDesc       A string for debug message of this point-depth-point.
   *
   * @return {object}
   *   If no additive, it will be the original imageOut. If additive, the a new imageOut will be created and returned. The new created
   * imageOutNew will have the same ( height, width, depty ) as imageOut but imageOutNew.dataArray will be replaced with
   * new data. Return null, if ( imageOut == null ).
   */
  static modifyByInput( imageOut, bAddInputToOutput, imageIn, addInputToOutputName, parametersDesc ) {

    if ( !imageOut )
      return null;

    if ( !bAddInputToOutput )
      return imageOut;

    // If the output dimensions ( height, width, depth ) is not the same as input, it is impossible to add-input-to-output.
    if ( ( imageIn.height != imageOut.height ) || ( imageIn.width != imageOut.width ) || ( imageIn.depth != imageOut.depth ) )
      return imageOut;

    tf.util.assert( ( imageIn.height == imageOut.height ),
      `${addInputToOutputName} When ( bAddInputToOutput == true ), imageIn.height ( ${imageIn.height} ) `
        + `should match imageOut.height ( ${imageOut.height} ). (${parametersDesc})`);

    tf.util.assert( ( imageIn.width == imageOut.width ),
      `${addInputToOutputName} When ( bAddInputToOutput == true ), imageIn.width ( ${imageIn.width} ) `
        + `should match imageOut.width ( ${imageOut.width} ). (${parametersDesc})`);

    tf.util.assert( ( imageIn.depth == imageOut.depth ),
      `${addInputToOutputName} When ( bAddInputToOutput == true ), imageIn.depth ( ${imageIn.depth} ) `
        + `should match imageOut.depth ( ${imageOut.depth} ). (${parametersDesc})`);

    let resultArray = imageIn.dataArray.map( ( value, i ) => ( imageOut.dataArray[ i ] + value ) );

    // Q: Why not just modify imageOut directly?
    // A: The imageOut might be the original input array which should not be modified at all. (because they might be used in another test.)
    let imageOutNew = {
      height:    imageOut.height,
      width:     imageOut.width,
      depth:     imageOut.depth,
      dataArray: resultArray
    };

    return imageOutNew;
  }

  /**
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   * @param {boolean}  bBias             Whether add bias.
   * @param {number[]} biasesArray       The bias values.
   * @param {string}   biasName          A string for debug message of this bias.
   * @param {string}   parametersDesc    A string for debug message of this point-depth-point.
   *
   * @return {object}
   *   Return imageIn which may or may not be added bias (according to bBias).
   */
  static modifyByBias( imageIn, bBias, biasesArray, biasName, parametersDesc ) {

    if ( !bBias )
      return imageIn;

    tf.util.assert( ( biasesArray != null ),
      `${biasName} biasesArray (${biasesArray}) `
        + `should not be null. (${parametersDesc})`);

    tf.util.assert( ( biasesArray.length == imageIn.depth ),
      `${biasName} shape (${biasesArray.length}) `
        + `should match input image channel count (${imageIn.depth}). (${parametersDesc})`);

    for ( let y = 0; y < imageIn.height; ++y ) {
      let indexBaseX = ( y * imageIn.width );

      for ( let x = 0; x < imageIn.width; ++x ) {
        let inIndexBaseC  = ( ( indexBaseX + x ) * imageIn.depth );

        for ( let inChannel = 0; inChannel < imageIn.depth; ++inChannel ) {
          let inIndex = inIndexBaseC + inChannel;
          imageIn.dataArray[ inIndex ] += biasesArray[ inChannel ];
        }
      }
    }

    return imageIn;
  }

  /**
   * @param {number}   imageIn.height    Image height
   * @param {number}   imageIn.width     Image width
   * @param {number}   imageIn.depth     Image channel count
   * @param {number[]} imageIn.dataArray Image data
   * @param {string}   nActivationId     The name string of this activation function.
   * @param {string}   parametersDesc A string for debug message of this point-depth-point.
   *
   * @return {Float32Array}
   *   The result of the activation function. Its .dataArray may be just the imageIn.dataArray directly (when no activation function).
   * Or, its .dataArray may be a new Float32Array (when has activation function).
   */
  static modifyByActivation( imageIn, nActivationId, parametersDesc ) {

    let pfnActivation = ValueDesc.ActivationFunction.Singleton.integerToObjectMap.get( nActivationId );
    if ( !pfnActivation )
      return imageIn;

    // Because pfnActivation is function of tensorflow.js, it process tf.tensor (i.e. not a single value).
    // Let it process the whole input (as an Array) directly.
    let tensorOut = pfnActivation( imageIn.dataArray )
    imageIn.dataArray = tensorOut.dataSync();
    tensorOut.dispose();

    return imageIn;
  }

  /**
   *
   * @param {number[]} concatenatedShape           The concatenatedShape of channel shuffler.
   * @param {number}   outputGroupCount            The outputGroupCount of channel shuffler.
   *
   * @param {number}   imageInArray[ 0 ].height    height of the first input image.
   * @param {number}   imageInArray[ 0 ].width     width of the first input image.
   * @param {number}   imageInArray[ 0 ].depth     channel count of the first input image.
   * @param {number[]} imageInArray[ 0 ].dataArray Image data of the first input image.
   *
   * @param {number}   imageInArray[ 1 ].height    height of the second input image.
   * @param {number}   imageInArray[ 1 ].width     width of the second input image.
   * @param {number}   imageInArray[ 1 ].depth     channel count of the second input image.
   * @param {number[]} imageInArray[ 1 ].dataArray Image data of the second input image.
   *
   * @param {number}   imageOutArray[ 0 ].height    height of the first output image.
   * @param {number}   imageOutArray[ 0 ].width     width of the first output image.
   * @param {number}   imageOutArray[ 0 ].depth     channel count of the first output image.
   * @param {number[]} imageOutArray[ 0 ].dataArray Image data of the first output image.
   *
   * @param {number}   imageOutArray[ 1 ].height    height of the second output image.
   * @param {number}   imageOutArray[ 1 ].width     width of the second output image.
   * @param {number}   imageOutArray[ 1 ].depth     channel count of the second output image.
   * @param {number[]} imageOutArray[ 1 ].dataArray Image data of the second output image.
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
      
      imageOutArray[ i ] = {
        height:    t.shape[ 0 ],
        width:     t.shape[ 1 ],
        depth:     t.shape[ 2 ],
        dataArray: t.dataSync(),
      };
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
  
}
