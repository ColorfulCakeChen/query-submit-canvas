export { Base };

import * as TensorTools from "../../util/TensorTools.js";
import * as ObjectPropertyAsserter from "../../util/ObjectPropertyAsserter.js";
import * as ValueMax from "../../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as Weights from "../../Unpacker/Weights.js";
import * as ActivationEscaping from "../../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../../Conv/BoundsArraySet.js";
import * as ChannelCountCalculator from "../../Conv/ChannelCountCalculator.js";
import * as Pointwise from "../../Conv/Pointwise.js";
import * as Depthwise from "../../Conv/Depthwise.js";
import * as ChannelShuffler from "../../Conv/ChannelShuffler.js";
import * as ChannelShufflerPool from "../../Conv/ChannelShufflerPool.js";
import * as Block from "../../Conv/Block.js";
import * as Block_TestParams from "./Block_TestParams.js"; 
import * as NumberImage from "./NumberImage.js";
import * as ImageSourceBag from "./ImageSourceBag.js";
import * as BoundsArraySet_Asserter from "./BoundsArraySet_Asserter.js";


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
      input0_height, input0_width, input0_channelCount,
      nConvBlockTypeId,
      pointwise1ChannelCount,
      depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad,
      pointwise20ChannelCount,
      bKeepInputTensor,
      inferencedParams
    } = testParams.out;

    let imageInArraySelected = this.imageInArraySelected; // imageInArraySelected[ 0 ] is input0, imageInArraySelected[ 1 ] is input1.
    let inputTensor3dArray = this.inputTensor3dArray;
    let outputTensor3dArray = this.outputTensor3dArray;

    let strNote;

    let bTwoInputs, input1_channelCount;
    {
      bTwoInputs = ( inferencedParams.inputTensorCount == 2 );
      input1_channelCount = inferencedParams.input1_channelCount;
    }

    let channelShuffler_ConcatPointwiseConv, channelShuffler_concatenatedShape, channelShuffler_outputGroupCount;
    {
      strNote = `( testParams.id=${testParams.id} )`;

      imageInArraySelected.fill( undefined );
      imageInArraySelected[ 0 ] = imageSourceBag.getImage_by( input0_height, input0_width, input0_channelCount );

      // Although input1 is only needed when ( bTwoInputs == true ), it is always prepared for calculating the shape of channel shuffler.
      // 
      // The shape of input1 (not input0) determines the concatenatedShape of channel shuffler because the input0 might be shrinked
      // by depthwise convolution.
      //
      // Note: input1_channelCount may be zero.
      //
      let imageIn1 = imageSourceBag.getImage_by(
        input0_height, input0_width, input1_channelCount,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );

      if ( bTwoInputs ) { // Pass two input images according to parameters.
        imageInArraySelected[ 1 ] = imageIn1;

        tf.util.assert( (
             ( imageIn1.height == inferencedParams.input1_height )
          && ( imageIn1.width == inferencedParams.input1_width )
          && ( imageIn1.depth == inferencedParams.input1_channelCount ) ),
          `Block_Reference.TestCorrectnessInfo.prepareBy(): `
            + `input image1's ( height, width, depth ) = ( ${imageIn1.height}, ${imageIn1.width}, ${imageIn1.depth} ) should be `
            + `( ${inferencedParams.input1_height}, ${inferencedParams.input1_width}, ${inferencedParams.input1_channelCount} ). `
            + `${strNote}`
        );
      } else {
        tf.util.assert( (
             ( 0 == inferencedParams.input1_height )
          && ( 0 == inferencedParams.input1_width )
          && ( 0 == inferencedParams.input1_channelCount ) ),
          `Block_Reference.TestCorrectnessInfo.prepareBy(): `
            + `inferenced input1's ( height, width, depth ) = `
            + `( ${inferencedParams.input1_height}, ${inferencedParams.input1_width}, ${inferencedParams.input1_channelCount} ) `
            + `should be ( 0, 0, 0 ). ${strNote}`
        );
      }

      tf.util.assert( imageInArraySelected.length == 2,
        `Block_Reference.TestCorrectnessInfo.prepareBy(): `
          + `imageInArraySelected.length ( ${imageInArraySelected.length} ) should be 2. ${strNote}`);

      // Prepare channel shuffler.
      const outputGroupCount = 2; // Only use two convolution groups.
      let concatenatedDepth;
      switch ( nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD: // (2)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY: // (3)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL: // (4)
          concatenatedDepth = pointwise20ChannelCount * outputGroupCount;
          break;

//!!! (2022/06/16 Remarked) no needs channelShuffler_ConcatPointwiseConv
//         case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD: // (5)
//         case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_TAIL: // (6)

          // Because Block_TestParams.generate_Filters_Biases() will double pointwise20ChannelCount, it must be an even number
          // which could be splitted (into two groups).
          //
          // Note: pointwise20ChannelCount is always positive (never zero or negative).
          //
          concatenatedDepth = pointwise20ChannelCount;
          break;
      }

      if ( concatenatedDepth == undefined ) {
        channelShuffler_ConcatPointwiseConv = null;

      } else {
        channelShuffler_ConcatPointwiseConv = channelShufflerPool.getChannelShuffler_by(
          imageIn1.height, imageIn1.width, concatenatedDepth, outputGroupCount );

        tf.util.assert( (
             ( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 0 ] == imageIn1.height )
          && ( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 1 ] == imageIn1.width )
          && ( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 2 ] == concatenatedDepth ) ),
          `Block_Reference.TestCorrectnessInfo.prepareBy(): `
            + `ChannelShuffler concatenatedShape ( ${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 0 ]}, `
            + `${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 1 ]}, `
            + `${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 2 ]} ) `
            + `should be the same as input image1's ( height, width, concatenatedDepth ) = ( `
            + `${imageIn1.height}, ${imageIn1.width}, ${concatenatedDepth} ). `
            + `${strNote}` );

        tf.util.assert( channelShuffler_ConcatPointwiseConv.outputGroupCount == outputGroupCount,
          `Block_Reference.TestCorrectnessInfo.prepareBy(): `
            + `ChannelShuffler outputGroupCount ( ${channelShuffler_ConcatPointwiseConv.outputGroupCount} ) `
            + `should be the same as image outputGroupCount ( ${outputGroupCount} ). ${strNote}`);

        channelShuffler_concatenatedShape = channelShuffler_ConcatPointwiseConv.concatenatedShape;
        channelShuffler_outputGroupCount = channelShuffler_ConcatPointwiseConv.outputGroupCount;
      }

//!!! (2022/06/15 Remarked) input1_channelCount are inferenced now.
//         {
//
//           // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY (3))
//           // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL (4))
//           //
//           if ( input1_channelCount > 0 ) {
//             concatenatedDepth = ( input1_channelCount * outputGroupCount ); // Always twice as input1's channel count.
//
//           // ( input1_channelCount == 0 )
//           //
//           // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD (2))
//           // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5))
//           // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_TAIL (6))
//           //
//           } else {
//             //
//             // In these cases:
//             //   - The input1 does not exist.
//             //   - Fortunately, the concatenatedDepth of channel shuffler is not so important here.
//             //     - Only ( imageInHeight, imageInWidth, outputGroupCount ) of channel shuffler will be used.
//             //     - So a usable (non-zero) value is enough. 
//             //
//             concatenatedDepth = ( 1 * outputGroupCount );
//
// //!!! ...unfinished... (2021/11/26) What about SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) ?
//
//             // (i.e. pointwise1 of ShuffleNetV2_ByMobileNetV1's body/tail)
//             if ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_TAIL ) { // (6)
//
//               // Note: pointwise20ChannelCount is always positive (never zero or negative).
//
//               // Because Block_TestParams.generate_Filters_Biases() will double pointwise20ChannelCount, it must be an even number
//               // which could be splitted (into two groups).
//               concatenatedDepth = pointwise20ChannelCount;
//             }
//           }
//
//           channelShuffler_ConcatPointwiseConv = channelShufflerPool.getChannelShuffler_by(
//             imageIn1.height, imageIn1.width, concatenatedDepth, outputGroupCount );
//
//           tf.util.assert( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 0 ] == imageIn1.height,
//             `Block_Reference.TestCorrectnessInfo.prepareBy(): `
//               + `ChannelShuffler concatenatedShape[ 0 ] ( ${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 0 ]} ) `
//               + `should be the same as image height ( ${imageIn1.height} ). ${strNote}`);
//
//           tf.util.assert( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 1 ] == imageIn1.width,
//             `Block_Reference.TestCorrectnessInfo.prepareBy(): `
//               + `ChannelShuffler concatenatedShape[ 1 ] ( ${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 1 ]} ) `
//               + `should be the same as image width ( ${imageIn1.width} ). ${strNote}`);
//
//           tf.util.assert( channelShuffler_ConcatPointwiseConv.concatenatedShape[ 2 ] == concatenatedDepth,
//             `Block_Reference.TestCorrectnessInfo.prepareBy(): `
//               + `ChannelShuffler concatenatedShape[ 2 ] ( ${channelShuffler_ConcatPointwiseConv.concatenatedShape[ 2 ]} ) `
//               + `should be the same as image concatenatedDepth ( ${concatenatedDepth} ). ${strNote}`);
//
//           tf.util.assert( channelShuffler_ConcatPointwiseConv.outputGroupCount == outputGroupCount,
//             `Block_Reference.TestCorrectnessInfo.prepareBy(): `
//               + `ChannelShuffler outputGroupCount ( ${channelShuffler_ConcatPointwiseConv.outputGroupCount} ) `
//               + `should be the same as image outputGroupCount ( ${outputGroupCount} ). ${strNote}`);
//
//           channelShuffler_concatenatedShape = channelShuffler_ConcatPointwiseConv.concatenatedShape;
//           channelShuffler_outputGroupCount = channelShuffler_ConcatPointwiseConv.outputGroupCount;
//         }
//           break;
//       }

    }

    outputTensor3dArray.fill( undefined );
    inputTensor3dArray.fill( undefined );

    inputTensor3dArray[ 0 ] = imageSourceBag.getTensor3d_by( input0_height, input0_width, input0_channelCount );
    if ( bTwoInputs ) { // Pass two input tensors according to parameters.
      inputTensor3dArray[ 1 ] = imageSourceBag.getTensor3d_by(
        input0_height, input0_width, input1_channelCount,
        depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad );
    }

    let inputTensorDestroyCount; // How many input tensors will be destroyed by Block.apply().
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

    this.input1_channelCount = input1_channelCount;
    this.channelShuffler_ConcatPointwiseConv = channelShuffler_ConcatPointwiseConv;
    this.inputTensorDestroyCount = inputTensorDestroyCount;
    this.strNote = strNote;
  }

}


/**
 * Reference computation of class Block.Base.
 */
class Base {

  /**
   *
   */
  constructor() {
    this.channelShufflerPool = new ChannelShufflerPool.Base( ChannelShuffler.ShuffleInfo );

    // For reducing memory allocation.
    this.testCorrectnessInfo = new TestCorrectnessInfo();
    this.imageOutReferenceArray = new Array( 2 );
    this.imageInArray_Fake = new Array( 2 );
    this.asserter_Equal = new TensorTools.Asserter_Equal( 0.4, 0.001 );
    this.arrayTemp_forInterleave_asGrouptTwo = []; // Used by calcConcatShuffleSplit().
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
   * @param {ChannelShufflerPool.Base} channelShufflerPool
   *   The channelShufflers provider. It must be initialized with ChannelShuffler.ConcatPointwiseConv as parameter channelShufflerClass.
   *
   *     - It is only used when:
   *         - ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD (2) )
   *         - ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY (3) )
   *         - ( nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL (4) )
   *
   */
  testCorrectness( imageSourceBag, testParams, channelShufflerPool ) {
    this.testParams = testParams;

//!!! (2022/06/10 Remarked) Moved to outter jsPerf_Block to also catch testParamsGenerator's exception.
//    try {
    {
      this.testCorrectnessInfo.prepareBy( imageSourceBag, testParams, channelShufflerPool );

      let {
        imageInArraySelected, inputTensor3dArray, outputTensor3dArray,
        input1_channelCount, channelShuffler_ConcatPointwiseConv, inputTensorDestroyCount,
        strNote
      } = this.testCorrectnessInfo;

      let imageOutReferenceArray = this.imageOutReferenceArray;
      {
        this.calcResult( imageInArraySelected, imageOutReferenceArray ); // Output is an array with two elements.

        tf.util.assert( imageOutReferenceArray.length == 2,
          `Block_Reference.testCorrectness(): imageOutReferenceArray.length ( ${imageOutReferenceArray.length} ) should be 2. ${strNote}`);
      }

      let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of block create/dispose.

      let block = Base.block_create( testParams,
        imageInArraySelected[ 0 ].boundsArraySet.output0,
        imageInArraySelected[ 1 ]?.boundsArraySet.output0,
        channelShuffler_ConcatPointwiseConv, this.arrayTemp_forInterleave_asGrouptTwo );

      let parametersDescription = block.parametersDescription;
      strNote = `( testParams.id=${testParams.id}, ${parametersDescription} )`;

      // Test input channel count.
      Base.AssertTwoEqualValues( "inChannels1", block.inChannels1, input1_channelCount, strNote );

      // The difference tensor count will be the generated tensor count (i.e. outputTensorCount) minus destroyed input
      // tensor count (i.e. inputTensorDestroyCount).
      let tensorNumDifference_apply_before_after = block.outputTensorCount - inputTensorDestroyCount;

      let memoryInfo_apply_before = tf.memory(); // Test memory leakage of block apply.
      block.apply( inputTensor3dArray, outputTensor3dArray );
      let memoryInfo_apply_after = tf.memory();

      tf.util.assert( memoryInfo_apply_after.numTensors == ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ),
        `Block.apply() memory leak. `
          + `result tensor count ( ${memoryInfo_apply_after.numTensors} ) `
          + `should be ( ${ ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ) } ) `
          + `${strNote}` );

      tf.util.assert( inputTensor3dArray.length == 2,
        `Block inputTensor3dArray.length ( ${inputTensor3dArray.length} ) should be 2. ${strNote}`);

      tf.util.assert( outputTensor3dArray.length == 2,
        `Block outputTensor3dArray.length ( ${outputTensor3dArray.length} ) should be 2. ${strNote}`);

      { // Test output channel count.
        const CHANNEL_AXIS_ID = 2; // Axis id 2 is depth (i.e. channel) dimension.
        let outChannels0 = 0, outChannels1 = 0;

        if ( outputTensor3dArray[ 0 ] && ( outputTensor3dArray[ 0 ].shape.length > CHANNEL_AXIS_ID ) )
          outChannels0 = outputTensor3dArray[ 0 ].shape[ CHANNEL_AXIS_ID ];

        if ( outputTensor3dArray[ 1 ] && ( outputTensor3dArray[ 1 ].shape.length > CHANNEL_AXIS_ID ) )
          outChannels1 = outputTensor3dArray[ 1 ].shape[ CHANNEL_AXIS_ID ];

        let outChannelsAll = outChannels0 + outChannels1;

        Base.AssertTwoEqualValues( "outChannels0", block.outChannels0, outChannels0, strNote );
        Base.AssertTwoEqualValues( "outChannels1", block.outChannels1, outChannels1, strNote );
        Base.AssertTwoEqualValues( "outChannelsAll", block.outChannelsAll, outChannelsAll, strNote );
      }

      { // Test output tensor count.
        let outputTensorCount = 0;

        if ( outputTensor3dArray[ 0 ] )
          ++outputTensorCount;

        if ( outputTensor3dArray[ 1 ] )
          ++outputTensorCount;

        Base.AssertTwoEqualValues( "outputTensorCount", block.outputTensorCount, outputTensorCount, strNote );
      }

      // Test correctness of block BoundsArraySet.
      this.assert_imageOut_BoundsArraySet( block, imageOutReferenceArray, strNote );

      // Test correctness of block apply.
      this.assert_imageOut_Tensors_byNumberArrays( outputTensor3dArray, imageOutReferenceArray, strNote );

      block.disposeTensors();
      let memoryInfo_afterDispose = tf.memory();

      tf.util.assert( memoryInfo_afterDispose.numTensors == ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ),
        `Block create/dispose memory leak. `
          + `result tensor count (${memoryInfo_afterDispose.numTensors}) `
          + `should be (${ ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ) } `
          + `${strNote}` );

      tf.dispose( outputTensor3dArray );

//!!! (2022/06/10 Remarked) Moved to outter jsPerf_Block to also catch testParamsGenerator's exception.
//     } catch ( e ) {
//       let backendName = tf.getBackend();
//       let msg = `Block_Reference.js: testCorrectness(): backendName=${backendName}, `
//         + `Block, (yieldCount == ${testParams.yieldCount}), testParams.id == ${testParams.id}`;
//
//       console.log( msg );
//       alert( `${msg}\n${e}` );
//
//       throw e;
    }
  }

  /**
   * Check the Block's output's BoundsArraySet.
   *
   * @param {Block.Base} block                           The block to be checked.
   * @param {NumberImage.Base[]} imageOutReferenceArray  Refernece output Image data of the Block_Reference's calcResult().
   */
  assert_imageOut_BoundsArraySet( block, imageOutReferenceArray, parametersDescription ) {
    BoundsArraySet_Asserter.assert_ScaleBoundsArray_output0_output1( this.asserter_Equal,
      block.output0?.scaleBoundsArray, block.output1?.scaleBoundsArray, imageOutReferenceArray, `Block`, parametersDescription );
  }

  /**
   * Check the Block's output according to input (for correctness testing).
   *
   * @param {tf.tensor3d[]} outputTensors                The output array of the Block's apply_and_destroy_or_keep().
   * @param {NumberImage.Base[]} imageOutReferenceArray  Refernece output Image data of the Block_Reference's calcResult().
   */
  assert_imageOut_Tensors_byNumberArrays( outputTensors, imageOutReferenceArray, parametersDescription ) {
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
        "Block", `output${i}`, `outputRef${i}`, parametersDescription
      );
    }
  }

  /**
   * @param {Block_TestParams.Base} testParams
   *   The test parameters. It is the value of Block_TestParams.Base.ParamsGenerator()'s result.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray0
   *   The element value bounds (per channel) of input0. Usually, it is The .output0 of the previous Block value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {ActivationEscaping.ScaleBoundsArray} inputScaleBoundsArray1
   *   The element value bounds (per channel) of input1. Usually, it is The .output1 of the previous Block value bounds
   * set. It will be kept (not cloned) directly. So caller should not modify them.
   *
   * @param {Array} arrayTemp_forInterleave_asGrouptTwo
   *   A temporary array for placing the original elements temporarily. Provide this array could reduce memory re-allocation
   * and improve performance when doing Interleave_asGrouptTwo.
   *
   * @return {Block.Base} The created block object.
   */
  static block_create(
    testParams, inputScaleBoundsArray0, inputScaleBoundsArray1, channelShuffler_ConcatPointwiseConv,
    arrayTemp_forInterleave_asGrouptTwo ) {

    let block = new Block.Base();

    let progress = new ValueMax.Percentage.Aggregate();

    // Initialize successfully or failed.
    let extractedParams = new Block.Params( testParams.in.inputFloat32Array, testParams.in.byteOffsetBegin,
      testParams.in.input0_height, testParams.in.input0_width, testParams.in.input0_channelCount,
      testParams.in.nConvBlockTypeId,
      testParams.in.pointwise1ChannelCount,
      testParams.in.depthwise_AvgMax_Or_ChannelMultiplier, testParams.in.depthwiseFilterHeight, testParams.in.depthwiseFilterWidth,
      testParams.in.depthwiseStridesPad, testParams.in.bDepthwiseBias, testParams.in.depthwiseActivationId,
      testParams.in.nSqueezeExcitationChannelCountDivisor, testParams.in.bSqueezeExcitationPrefix,
      testParams.in.pointwise20ChannelCount, testParams.in.bPointwise20Bias, testParams.in.pointwise20ActivationId,
      testParams.in.bKeepInputTensor
    );

    let bInitOk = block.init( progress, extractedParams, inputScaleBoundsArray0, inputScaleBoundsArray1,
      channelShuffler_ConcatPointwiseConv, arrayTemp_forInterleave_asGrouptTwo );

    let inferencedParams = testParams.out.inferencedParams;

    if ( !bInitOk ) { //!!! For Debug.
      console.log( "testParams =", testParams );
      debugger;
    }

    let parametersDescription = `( ${block.parametersDescription} )`;

    tf.util.assert( ( block.bInitOk == bInitOk ),
      `Block validation state (${block.bInitOk}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    tf.util.assert( ( true == bInitOk ),
      `Failed to initialize block object. ${parametersDescription}`);

    tf.util.assert( ( 100 == progress.valuePercentage ),
      `Progress (${progress.valuePercentage}) should be 100 when initializing block object successfully. ${parametersDescription}`);


    if ( block.byteOffsetEnd != testParams.in.inputFloat32Array.byteLength ) { //!!! For Debug. (parsing ending position)
      debugger;
    }

    let asserter = new ObjectPropertyAsserter.Base( `Block`, block, parametersDescription );

    Base.AssertTwoEqualValues( "parsing beginning position",
      block.byteOffsetBegin, testParams.in.byteOffsetBegin, parametersDescription );

    Base.AssertTwoEqualValues( "parsing ending position",
      block.byteOffsetEnd, testParams.in.inputFloat32Array.byteLength, parametersDescription );

    // input tensor parameters.
    asserter.propertyValue( "input0_height", testParams.out.input0_height );
    asserter.propertyValue( "input0_width", testParams.out.input0_width );
    asserter.propertyValue( "inChannels0", testParams.out.input0_channelCount );
    asserter.propertyValue( "nConvBlockId", testParams.out.nConvBlockId );

//!!! ...unfinished... (2022/06/16) input1_height, input1_width, input1_channelCount

    asserter.propertyValue( "inputTensorCount", inferencedParams.inputTensorCount );
    asserter.propertyValue( "outputTensorCount", inferencedParams.outputTensorCount );
    asserter.propertyValue( "bDepthwiseRequestedAndNeeded", inferencedParams.bDepthwiseRequestedAndNeeded );
    asserter.propertyValue( "bDepthwise2Requested", inferencedParams.bDepthwise2Requested );
    asserter.propertyValue( "bConcat1Requested", inferencedParams.bConcat1Requested );
    asserter.propertyValue( "bAddInputToOutputRequested", inferencedParams.bAddInputToOutputRequested );
    asserter.propertyValue( "bConcat2ShuffleSplitRequested", inferencedParams.bConcat2ShuffleSplitRequested );
    asserter.propertyValue( "bHigherHalfDifferent", inferencedParams.bHigherHalfDifferent );
    asserter.propertyValue( "bHigherHalfDepthwise2", inferencedParams.bHigherHalfDepthwise2 );
    asserter.propertyValue( "channelShuffler_outputGroupCount", inferencedParams.channelShuffler_outputGroupCount );

    // The ( block.bConcat2ShuffleSplitRequested == true ) only if ShuffleNetV2.
    if ( block.bConcat2ShuffleSplitRequested ) {
      let bShuffleNetV2 =
           ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD ) // (2)
        || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY ) // (3)
        || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL ) // (4)
      ;
      asserter.propertyValue( "bConcat2ShuffleSplitRequested", bShuffleNetV2 );
    }

    // The channelShuffler must not null in these cases.
    if (   ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD ) // (2)
        || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY ) // (3)
        || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL ) // (4)
       ) {

      tf.util.assert( channelShuffler_ConcatPointwiseConv != null, `Block_Reference.Base.block_create(): `
        + `channelShuffler must NOT null when `
        + `nConvBlockTypeId=`
        + `${ValueDesc.ConvBlockType.Singleton.getStringOf( testParams.out.nConvBlockTypeId )}`
        + `(${testParams.out.nConvBlockTypeId})` );

      asserter.propertyValue( "channelShuffler_ConcatPointwiseConv", channelShuffler_ConcatPointwiseConv );

    } else {
      asserter.propertyValue( "channelShuffler_ConcatPointwiseConv", null );
    }

    // pointwise1 parameters.

    let bPointwise1Bias_shouldBe = testParams.out.inferencedParams.bPointwise1Bias;
    let pointwise1ActivationId_shouldBe = testParams.out.inferencedParams.pointwise1ActivationId;
    let pointwise1ActivationName_shouldBe = testParams.out.inferencedParams.pointwise1ActivationName;

    // (i.e. ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD (5) )
    //
    if ( ( block.bHigherHalfDifferent == true ) && ( block.bHigherHalfDepthwise2 == true ) ) {

      // In this case (i.e. bHigherHalfCopyLowerHalf), enlarge pointwise1 to ( pointwise1_channel_count + input_channel_count )
      // so that depthwise1 could include depthwise2.
      //
      if ( testParams.out.pointwise1ChannelCount > 0 ) {
        let pointwise1ChannelCount = ( testParams.out.pointwise1ChannelCount + testParams.out.input0_channelCount );
        asserter.propertyValue( "pointwise1ChannelCount", pointwise1ChannelCount );

      // However, if ( pointwise1ChannelCount == 0 ), Pointwise.Base can not handle ( pointwise1ChannelCount == 0 ) because
      // ( inputChannelCount < outputChannelCount == pointwise1ChannelCount == 0 ) is not possible. It will be wrongly recognized
      // as ( inputChannelCount >= outputChannelCount == pointwise1ChannelCount == 0 ).
      //
      // It should be adjusted forcibly so that ( inputChannelCount < outputChannelCount == pointwise1ChannelCount ) and always
      // no biases. Not only bHigherHalfCopyLowerHalf, but also bLowerHalfPassThrough. (i.e. bHigherHalfCopyLowerHalf_LowerHalfPassThrough)
      //
      } else { // ( 0 == testParams.out.pointwise1ChannelCount )
        let pointwise1ChannelCount = ( testParams.out.input0_channelCount * 2 ); // As doubled input channel count.
        asserter.propertyValue( "pointwise1ChannelCount", pointwise1ChannelCount );

        bPointwise1Bias_shouldBe = false;
        pointwise1ActivationId_shouldBe = ValueDesc.ActivationFunction.Singleton.Ids.NONE;
      }

    } else {
      asserter.propertyValue( "pointwise1ChannelCount", testParams.out.pointwise1ChannelCount );
    }

    asserter.propertyValue( "bPointwise1Bias", bPointwise1Bias_shouldBe );
    asserter.propertyValue( "pointwise1ActivationId", pointwise1ActivationId_shouldBe );
    asserter.propertyValue( "pointwise1ActivationName", pointwise1ActivationName_shouldBe );

    // depthwise parameters.
    asserter.propertyValue( "depthwise_AvgMax_Or_ChannelMultiplier", testParams.out.depthwise_AvgMax_Or_ChannelMultiplier );
    asserter.propertyValue( "depthwiseFilterHeight", testParams.out.depthwiseFilterHeight );
    asserter.propertyValue( "depthwiseFilterWidth", testParams.out.depthwiseFilterWidth );
    asserter.propertyValue( "depthwiseStridesPad", testParams.out.depthwiseStridesPad );
    asserter.propertyValue( "bDepthwiseBias", testParams.out.bDepthwiseBias );
    asserter.propertyValue( "depthwiseActivationId", testParams.out.depthwiseActivationId );

    let depthwiseActivationName = ValueDesc.ActivationFunction.Singleton.getStringOf( testParams.out.depthwiseActivationId );
    asserter.propertyValue( "depthwiseActivationName", depthwiseActivationName );

    // squeeze-and-excitation parameters.
    asserter.propertyValue( "nSqueezeExcitationChannelCountDivisor", testParams.out.nSqueezeExcitationChannelCountDivisor );
    asserter.propertyValue( "bSqueezeExcitationPrefix", testParams.out.bSqueezeExcitationPrefix );

    // pointwise20 parameters.
    asserter.propertyValue( "pointwise20ChannelCount", testParams.out.pointwise20ChannelCount );

    asserter.propertyValue( "bPointwise20Bias", testParams.out.bPointwise20Bias );
    asserter.propertyValue( "pointwise20ActivationId", testParams.out.pointwise20ActivationId );

    let pointwise20ActivationName = ValueDesc.ActivationFunction.Singleton.getStringOf( testParams.out.pointwise20ActivationId );
    asserter.propertyValue( "pointwise20ActivationName", pointwise20ActivationName );

    // pointwise21 parameters.

    { // Test pointwise21ChannelCount.

      if (   ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD ) // (2)
          || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE1 ) // (8)
          || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD ) // (9)
          || ( testParams.out.nConvBlockTypeId == ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY ) // (10)
         ) {
        asserter.propertyValue( "pointwise21ChannelCount", testParams.out.pointwise20ChannelCount ); // the same as pointwise20.

      } else { // Otherwise, should be 0.
        asserter.propertyValue( "pointwise21ChannelCount", 0 );
      }
    }

    asserter.propertyValue( "bPointwise21Bias", testParams.out.bPointwise20Bias ); // Always same as pointwise20.
    asserter.propertyValue( "pointwise21ActivationId", testParams.out.pointwise20ActivationId ); // Always same as pointwise20.
    asserter.propertyValue( "pointwise21ActivationName", pointwise20ActivationName ); // Always same as pointwise20.

    // If depthwise does not exist, the output ( height, width ) should be the same as input.

//!!! (2022/06/17 Remarked) Using bDepthwiseRequestedAndNeeded instead.
//    if ( testParams.out.depthwise_AvgMax_Or_ChannelMultiplier == ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.Ids.NONE ) { // (0)

    if ( !inferencedParams.bDepthwiseRequestedAndNeeded ) {
      asserter.propertyValue( "outputHeight", testParams.out.input0_height );
      asserter.propertyValue( "outputWidth", testParams.out.input0_width );

    // Otherwise, depthwise determines output ( height, width ).
    } else {
      let depthwisePadInfo = inferencedParams.depthwisePadInfo;
      asserter.propertyValue( "outputHeight", depthwisePadInfo.outputHeight );
      asserter.propertyValue( "outputWidth", depthwisePadInfo.outputWidth );
    }

    // Other parameters.
    asserter.propertyValue( "bKeepInputTensor", testParams.out.bKeepInputTensor );

    {
      let tensorWeightCountTotal = 0;  // Not include channel shuffler.
      let operationArray = block.operationArray.operationArray;
      for ( let i = 0; i < operationArray.length; ++i ) {
        let operation = operationArray[ i ];
        if ( operation.filtersTensor4d )
           tensorWeightCountTotal += operation.filtersTensor4d.size;
        if ( operation.biasesTensor3d )
           tensorWeightCountTotal += operation.biasesTensor3d.size;
      }
      asserter.propertyValue( "tensorWeightCountTotal", tensorWeightCountTotal );

      // Exclude parameters weights, all the others should be the extracted weight count.
      let tensorWeightCountExtracted
        = ( testParams.in.inputFloat32Array.byteLength - extractedParams.defaultByteOffsetEnd ) / Float32Array.BYTES_PER_ELEMENT;

      asserter.propertyValue( "tensorWeightCountExtracted", tensorWeightCountExtracted );
      asserter.propertyValueLE( "tensorWeightCountExtracted", tensorWeightCountTotal );
    }

    return block;
  }


  static AssertTwoEqualValues( valueName, value1, value2, parametersDescription ) {
    tf.util.assert( ( value1 == value2 ),
      `Block ${valueName} (${value1}) should be (${value2}). ${parametersDescription}`);
  }

  /** According to imageInArray and this.testParams.in.paramsNumberArrayObject, calculate imageOutArray.
   *
   * @param {NumberImage.Base[]} imageInArray
   *   The images to be tested.
   *     - imageInArray[ 0 ]: input0
   *     - imageInArray[ 1 ]: input1
   *
   * @param {NumberImage.Base[]} imageOutArray
   *   The images to be returned are placed here.
   *     - imageOutArray[ 0 ]: output0
   *     - imageOutArray[ 1 ]: output1
   *
   */ 
  calcResult( imageInArray, imageOutArray ) {

    let testParams = this.testParams;
    let inferencedParams = testParams.out.inferencedParams;
    let depthwisePadInfo = inferencedParams.depthwisePadInfo;

    // Create description for debug easily.
    this.paramsOutDescription = Base.TestParams_Out_createDescription( testParams );

//!!! (2022/06/15 Remrked) No longer needs channelShuffler.
//     // The channelShuffler must not null in these cases.
//     if (   ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
//         || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BODY() ) // (3)
//         || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_TAIL() ) // (4)
//         || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) // (5)
//         || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_TAIL() ) // (6)
//        ) {
//       tf.util.assert( channelShuffler != null, `Block_Reference.Base.calcResult(): `
//         + `channelShuffler must NOT null when `
//         + `nConvBlockTypeId=`
//         + `${ValueDesc.ConvBlockType.Singleton.getStringOf( testParams.out.nConvBlockTypeId )}`
//         + `(${testParams.out.nConvBlockTypeId}). `
//         + `${this.paramsOutDescription}` );
//     }


    // The following two (ValueDesc.ConvBlockType.Singleton.Ids.Xxx) use similar calculation logic:
    //    SHUFFLE_NET_V2_HEAD                    // (2) (ShuffleNetV2's head)
    //    SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD   // (5) (ShuffleNetV2_ByMobileNetV1's head)
    //
    // The following two (ValueDesc.ConvBlockType.Singleton.Ids.Xxx) use similar calculation logic:
    //    SHUFFLE_NET_V2_BODY                    // (3) (ShuffleNetV2's body)
    //    SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY   // (6) (ShuffleNetV2_ByMobileNetV1's body)
    //
    // The following two (ValueDesc.ConvBlockType.Singleton.Ids.Xxx) use similar calculation logic:
    //    SHUFFLE_NET_V2_TAIL                    // (4) (ShuffleNetV2's tail)
    //    SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL   // (7) (ShuffleNetV2_ByMobileNetV1's tail)


    let imageIn0, imageIn1;

    // 0.

    let pointwise1ChannelCount = testParams.out.pointwise1ChannelCount;
    let pointwise20ChannelCount;

    // Note: Block_TestParams.Base.generate_Filters_Biases() double pointwise20ChannelCount. So, halve them here.
    //
    if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
      pointwise20ChannelCount = Math.ceil( testParams.out.pointwise20ChannelCount / 2 );

      imageIn0 = imageInArray[ 0 ];
      imageIn1 = imageInArray[ 1 ];

    // The imageInArray[ 0 ] should be splitted into imageIn0 and imageIn1, because we:
    //   - use the logic of SHUFFLE_NET_V2_BODY (3) to handle SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY (6)
    //   - use the logic of SHUFFLE_NET_V2_TAIL (4) to handle SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL (7)
    //
    // Note: Block_TestParams.Base.generate_Filters_Biases() double input0_channelCount,
    //       pointwise20ChannelCount. So, halve them here.
    //
    } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)

      NumberImage.Base.calcSplitAlongAxisId2(
        imageInArray[ 0 ], this.imageInArray_Fake, "Split_imageIn_to_imageInArray_0_1", this.paramsOutDescription );

      imageIn0 = this.imageInArray_Fake[ 0 ];
      imageIn1 = this.imageInArray_Fake[ 1 ];

      if ( pointwise1ChannelCount <= 0 ) {
        // When no pointwise1, just keep it all-pass-through.

      } else { // Otherwise, only the lower half should be processed by pointwise1 convolution.
        let pointwise1_higherHalfPassThrough = new ChannelCountCalculator.HigherHalfPassThrough(
          testParams.out.input0_channelCount, testParams.out.pointwise1ChannelCount );

        pointwise1ChannelCount = pointwise1_higherHalfPassThrough.outputChannelCount_lowerHalf;
      }

      pointwise20ChannelCount = Math.ceil( testParams.out.pointwise20ChannelCount / 2 );

    } else {
      imageIn0 = imageInArray[ 0 ];
      imageIn1 = imageInArray[ 1 ];
      pointwise20ChannelCount = testParams.out.pointwise20ChannelCount;
    }

    // 1. Pointwise1
    let imageIn0_beforePointwise1 = imageIn0;
    let imageIn1_beforePointwise1 = imageIn1;
    let pointwise1Result;
    if ( pointwise1ChannelCount > 0 ) {
      pointwise1Result = testParams.use_pointwise1( imageIn0, pointwise1ChannelCount, "Pointwise1", this.paramsOutDescription );

      if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
        imageIn1 = testParams.use_pointwise1_PassThrough( imageIn0_beforePointwise1, // copy input0 (not input1).

//!!! (2022/06/17 Remarked)
//          pointwise1ChannelCount, // So that it could be processed by depthwise2 and pointwise21 (with same structure of depthwise1 and pointwise20).
          imageIn0_beforePointwise1.depth,

          "Pointwise1_imageIn1_HigherHalfCopyLowerHalf_imageIn0", this.paramsOutDescription );

      } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)
        imageIn1 = testParams.use_pointwise1_PassThrough( imageIn1_beforePointwise1, // pass-through input1 (not input0).
          imageIn1_beforePointwise1.depth, // No need same as pointwise1ChannelCount because depthwise2 and pointwise21 just pass-through it.
          "Pointwise1_imageIn1_HigherHalfPassThrough", this.paramsOutDescription );
      }

    } else {
      pointwise1Result = imageIn0;

      if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)

        tf.util.assert( imageIn1 == null, `Block_Reference.Base.calcResult(): `
          + `imageIn1 must be null when `
          + `nConvBlockTypeId=`
          + `${ValueDesc.ConvBlockType.Singleton.getStringOf( testParams.out.nConvBlockTypeId )}`
          + `(${testParams.out.nConvBlockTypeId}). `
          + `${this.paramsOutDescription}` );

        imageIn1 = imageIn0; // Not input1 but input0.
      }
    }

    // 2. Depthwise

    // 2.1 Depthwise1
    let imageIn1_beforeDepthwise1 = imageIn1;
    let depthwise1Result;

//!!! (2022/06/08 Remarked) Using .bDepthwiseRequestedAndNeeded instead.
//    if ( 0 != testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
    if ( testParams.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {
      depthwise1Result = testParams.use_depthwise1( pointwise1Result, "Depthwise1", this.paramsOutDescription );

      // imageIn1 should be shrinked by depthwise1. Otherwise, its size may be different from pointwise20Result
      // and can not be concatenated together.
      //
      if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)
        imageIn1 = testParams.use_depthwise1_PassThrough( imageIn1_beforeDepthwise1, // pass-through input1 (not input0).
          "Depthwise1_imageIn1_HigherHalfPassThrough", this.paramsOutDescription );
      }

    } else {
      depthwise1Result = pointwise1Result;
    }

    // 2.2 Depthwise2
    let depthwise2Result;

    if (   ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) // (9)
       ) {

//!!! (2022/06/08 Remarked) Using .bDepthwiseRequestedAndNeeded instead.
//      if ( 0 != testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
      if ( testParams.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {
        depthwise2Result = testParams.use_depthwise2( imageIn0, "Depthwise2_for_input0", this.paramsOutDescription ); // depthwise2 apply to input0 (not input1).
      } else {
        depthwise2Result = imageIn0; // Since depthwise2 is just no-op, its result is just the same as its input (i.e. input0 (not input1)).
      }

    } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)

//!!! (2022/06/08 Remarked) Using .bDepthwiseRequestedAndNeeded instead.
//      if ( 0 != testParams.out.depthwise_AvgMax_Or_ChannelMultiplier ) {
      if ( testParams.out.inferencedParams.bDepthwiseRequestedAndNeeded ) {

        // depthwise2 apply to input1 which higher-half-copy-lower-half from input0 (not original input0, not original input1).
        depthwise2Result = testParams.use_depthwise2( imageIn1, "Depthwise2_for_input1", this.paramsOutDescription );

      } else {
        depthwise2Result = imageIn0; // Since depthwise2 is just no-op, its result is just the same as its input (i.e. input0 (not input1)).
      }
    }

    // 3. Concat1 (along image depth)
    let concat1Result = depthwise1Result; // If no concat1, the same as depthwise1.

    if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) { // (9)

      // Concatenate depthwise1's result and depthwise2's result.
      concat1Result = NumberImage.Base.calcConcatAlongAxisId2(
        depthwise1Result, depthwise2Result,
        "Concat1_depthwise1_depthwise2 (SHUFFLE_NET_V2_BY_POINTWISE21_HEAD)", this.paramsOutDescription );

    } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_BODY_or_TAIL() ) { // (10 or 11)

      // Concatenate depthwise1's result and input1.
      concat1Result = NumberImage.Base.calcConcatAlongAxisId2( depthwise1Result, imageIn1,
        "Concat1_depthwise1_input1 (SHUFFLE_NET_V2_BY_POINTWISE21_BODY_or_TAIL)", this.paramsOutDescription );
    }

    // 4. Pointwise2

    // 4.0

    // 4.0.1 add-input-to-output is possible if same ( height, width ).
    let bAddInputToOutputRequested = false;
    if ( testParams.nConvBlockTypeId__is__MOBILE_NET_V2_BODY_TAIL() ) { // (1)
      if (   ( inferencedParams.bDepthwiseRequestedAndNeeded == false )  // Either no depthwise (so output is same ( height, width ).
          || ( depthwisePadInfo.output_height_width_is_same_as_input() ) // Or has depthwise and output is same ( height, width ).
         ) { 
        bAddInputToOutputRequested = true;
      }
    }

    // 4.0.2
    imageOutArray.length = 2;
    imageOutArray[ 0 ] = null;
    imageOutArray[ 1 ] = null;

    // 4.1 Pointwise20
    let imageIn1_beforePointwise20 = imageIn1;

    let pointwise20Result, pointwise202Result;
    {
      if ( pointwise20ChannelCount > 0 ) {
        pointwise20Result = imageOutArray[ 0 ]
          = testParams.use_pointwise20( concat1Result, pointwise20ChannelCount, "Pointwise20", this.paramsOutDescription );

        if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) { // (5)
          pointwise202Result = imageOutArray[ 1 ]
            = testParams.use_pointwise202( depthwise2Result, pointwise20ChannelCount, "Pointwise202", this.paramsOutDescription );

        } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) { // (6 or 7)
          imageIn1 = imageOutArray[ 1 ]
            = testParams.use_pointwise20_PassThrough( imageIn1_beforePointwise20, // pass-through input1 (which is past-through by depthwise1).
                pointwise20ChannelCount, // So that it could be concatenated with pointwise20Result.
                "Pointwise20_imageIn1_HigherHalfPassThrough", this.paramsOutDescription );
        }

      } else {
        pointwise20Result = imageOutArray[ 0 ] = concat1Result;
      }

      // Residual Connection.
      if ( bAddInputToOutputRequested )
        if ( pointwise20Result.depth == testParams.out.input0_channelCount ) // add-input-to-output is possible if same channel count.
          pointwise20Result = imageOutArray[ 0 ]
            = pointwise20Result.clone_byAdd( imageIn0, "Pointwise20_AddInputToOutput", this.paramsOutDescription );
    }

    // 4.2 Pointwise21

    let pointwise21Result;
    if (   ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE1() ) // (8)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_HEAD() ) // (9)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_POINTWISE21_BODY() )  // (10)
       ) {

      let pointwise21ChannelCount = pointwise20ChannelCount;

      let pointwise21_input;
      switch ( testParams.out.nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD: // (2)
          pointwise21_input = depthwise2Result; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD_NO_POINTWISE1: // (8)
          pointwise21_input = depthwise1Result; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_HEAD: // (9)
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21_BODY: // (10)
          pointwise21_input = concat1Result; break;
      }

      pointwise21Result = imageOutArray[ 1 ]
        = testParams.use_pointwise21( pointwise21_input, pointwise21ChannelCount, "Pointwise21", this.paramsOutDescription );

      // Residual Connection.
      //
      // Always using input0 (i.e. imageInArray[ 0 ]). In fact, only if ( inputTensorCount <= 1 ), the residual connection is possible.
      if ( bAddInputToOutputRequested )
        if ( pointwise21Result.depth == testParams.out.input0_channelCount ) // add-input-to-output is possible if same channel count.
          pointwise21Result = imageOutArray[ 1 ]
            = pointwise21Result.clone_byAdd( imageIn0, "Pointwise21_AddInputToOutput", this.paramsOutDescription );

    } else if ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BODY_or_TAIL() ) { // (3 or 4)
      imageOutArray[ 1 ] = imageIn1;
    }

    // 5. Concat2 (along image depth), shuffle, split.
    let concat2Name;

    if (   ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_HEAD() ) // (2)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BODY_or_TAIL() ) // (3 or 4)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD() ) // (5)
        || ( testParams.nConvBlockTypeId__is__SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY_or_TAIL() ) // (6 or 7)
       ) {  

      let bShuffle, bSplit;
      switch ( testParams.out.nConvBlockTypeId ) {
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_HEAD:                       // (2)
          concat2Name = "Concat2_pointwise20_pointwise21_ShuffleSplit";  bShuffle =  true; bSplit =  true; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BODY:                       // (3)
          concat2Name = "Concat2_pointwise20_input1_ShuffleSplit";       bShuffle =  true; bSplit =  true; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_TAIL:                       // (4)
          concat2Name = "Concat2_pointwise20_input1";                    bShuffle = false; bSplit = false; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_HEAD:      // (5)
          concat2Name = "Concat2_pointwise20_pointwise202_Shuffle";      bShuffle =  true; bSplit = false; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_BODY:      // (6)
          concat2Name = "Concat2_pointwise20_input0_HigherHalf_Shuffle"; bShuffle =  true; bSplit = false; break;
        case ValueDesc.ConvBlockType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_TAIL:      // (7)
          concat2Name = "Concat2_pointwise20_input0_HigherHalf";         bShuffle = false; bSplit = false; break;
        default:
          tf.util.assert( false, `Block_Reference.Base.calcResult(): `
            + `Concat2ShuffleSplit: Unsupported `
            + `nConvBlockTypeId=`
            + `${ValueDesc.ConvBlockType.Singleton.getStringOf( testParams.out.nConvBlockTypeId )}`
            + `(${testParams.out.nConvBlockTypeId}). `
            + `${this.paramsOutDescription}` );
          break;
      }

      tf.util.assert( ( imageOutArray[ 1 ] ), `Block_Reference.Base.calcResult(): `
        + `Concat2ShuffleSplit: imageOutArray[ 1 ] ( ${imageOutArray[ 1 ]} ) `
          + `should not be null. ${this.paramsOutDescription}`);

      NumberImage.Base.calcConcatShuffleSplit(
        imageOutArray, imageOutArray, bShuffle, bSplit,
        this.arrayTemp_forInterleave_asGrouptTwo, "${concat2Name}_", this.paramsOutDescription );
    }

    return imageOutArray;
  }

//!!! (2022/06/15 Remarked) Old Codes. Replace by modify_byInterleave_asGrouptTwo()
//   /**
//    *
//    * @param {number[]} concatenatedShape           The concatenatedShape of channel shuffler.
//    * @param {number}   outputGroupCount            The outputGroupCount of channel shuffler.
//    *
//    * @param {boolean} bSplit
//    *   If true, the result will be splitted into imageOutArray[ 0 ] and imageOutArray[ 1 ]. If false, the result will be placed in
//    * imageOutArray[ 0 ] and imageOutArray[ 1 ] will be null.
//    *
//    * @param {NumberImage.Base} imageInArray[ 0 ]   The first input image to be processed.
//    * @param {NumberImage.Base} imageInArray[ 1 ]   The second input image to be processed.
//    *
//    * @param {NumberImage.Base} imageOutArray[ 0 ]   The first output image.
//    * @param {NumberImage.Base} imageOutArray[ 1 ]   The second output image.
//    *
//    * @param {string}   concatShuffleSplitName       A string for debug message of this concatenation-shuffle-split.
//    * @param {string}   parametersDesc               A string for debug message of this point-depth-point.
//    */
//   calcConcatShuffleSplit(
//     concatenatedShape, outputGroupCount, bSplit,
//     imageInArray, imageOutArray, concatShuffleSplitName, parametersDesc ) {
//
//     tf.util.assert( ( imageInArray.length == 2 ),
//       `${concatShuffleSplitName}: `
//         + `The length of imageInArray[] ( ${imageInArray.length} ) must be 2. `
//         + `(${parametersDesc})`
//     );
//
//     // Note: Although different depth is wierd, it might still work. So, allow it.
//     tf.util.assert(
//       (   ( imageInArray[ 0 ].height == imageInArray[ 1 ].height )
//        && ( imageInArray[ 0 ].width ==  imageInArray[ 1 ].width )
//        //&& ( imageInArray[ 0 ].depth ==  imageInArray[ 1 ].depth )
//       ),
//
//       `${concatShuffleSplitName}: The first input image's shape ( height, width, depth ) = `
//         + `( ${imageInArray[ 0 ].height}, ${imageInArray[ 0 ].width}, ${imageInArray[ 0 ].depth} ) `
//         + `should be the same as the second input image's shape `
//         + `( ${imageInArray[ 1 ].height}, ${imageInArray[ 1 ].width}, ${imageInArray[ 1 ].depth} ). `
//         + `(${parametersDesc})`
//     );
//
// //!!! ...unfinished... (2022/05/23) Perhaps, re-implement by Interleave_asGrouptTwo.
//
//     let channelShuffler_ShuffleInfo;
//     {
//       channelShuffler_ShuffleInfo = this.channelShufflerPool.getChannelShuffler_by(
//         concatenatedShape[ 0 ], concatenatedShape[ 1 ], concatenatedShape[ 2 ], outputGroupCount );
//
//       for ( let i = 0; i < 2; ++i ) {
//         tf.util.assert(
//           channelShuffler_ShuffleInfo.concatenatedShape[ i ] == concatenatedShape[ i ],
//           `${concatShuffleSplitName}: `
//             + `channelShuffler_ShuffleInfo.concatenatedShape[ ${i} ] ( ${channelShuffler_ShuffleInfo.concatenatedShape[ i ]} ) `
//             + `should be the same as `
//             + `concatenatedShape[ ${i} ] ( ${concatenatedShape[ i ]} ) `
//             + `${parametersDesc}`);
//       }
//
//       tf.util.assert(
//         channelShuffler_ShuffleInfo.outputGroupCount == outputGroupCount,
//         `${concatShuffleSplitName}: `
//           + `channelShuffler_ShuffleInfo.outputGroupCount ( ${channelShuffler_ShuffleInfo.outputGroupCount} ) `
//           + `should be the same as `
//           + `outputGroupCount ( ${outputGroupCount} ) `
//           + `${parametersDesc}`);
//     }
//
//     let depthSum = imageInArray[ 0 ].depth + imageInArray[ 1 ].depth;
//     tf.util.assert( (
//           ( channelShuffler_ShuffleInfo.concatenatedShape[ 0 ] == imageInArray[ 0 ].height )
//        && ( channelShuffler_ShuffleInfo.concatenatedShape[ 1 ] == imageInArray[ 0 ].width )
//        && ( channelShuffler_ShuffleInfo.concatenatedShape[ 2 ] == depthSum ) ),
//       `${concatShuffleSplitName}: `
//         + `channelShuffler_ShuffleInfo.concatenatedShape ( ${channelShuffler_ShuffleInfo.concatenatedShape[ 0 ]}, `
//         + `${channelShuffler_ShuffleInfo.concatenatedShape[ 1 ]}, ${channelShuffler_ShuffleInfo.concatenatedShape[ 2 ]} ) `
//         + `should be `
//         + `( ${imageInArray[ 0 ].height}, ${imageInArray[ 0 ].width}, ${depthSum} ) `
//         + `${parametersDesc}`);
//
//     // Convert input images to tensors.
//     let tensorInArray = new Array( imageInArray.length );
//     for ( let i = 0; i < imageInArray.length; ++i ) {
//       let t = tf.tensor( imageInArray[ i ].dataArray, [ imageInArray[ i ].height, imageInArray[ i ].width, imageInArray[ i ].depth ] );
//       tensorInArray[ i ] = t;
//     }
//
//     let inputScaleBoundsArray0 = imageInArray[ 0 ].boundsArraySet.output0;
//     let inputScaleBoundsArray1 = imageInArray[ 1 ].boundsArraySet.output0;
//
//     if ( bSplit ) {
//       // Concat-shuffle-split.
//       // 
//       // Using different channel shuffler implementation for comparsion correctness.
//       let tensorOutArray = channelShuffler_ShuffleInfo.concatReshapeTransposeReshapeSplit( tensorInArray );
//
//       // Convert output tensors to images.
//       for ( let i = 0; i < imageOutArray.length; ++i ) {
//         let t = tensorOutArray[ i ];
//         let imageHeight = t.shape[ 0 ];
//         let imageWidth = t.shape[ 1 ];
//         let imageDepth = t.shape[ 2 ];
//
//         let rBoundsArraySet = new BoundsArraySet.InputsOutputs( inputScaleBoundsArray0, inputScaleBoundsArray1, imageDepth );
//         imageOutArray[ i ] = new NumberImage.Base( imageHeight, imageWidth, imageDepth, t.dataSync(), rBoundsArraySet );
//       }
//
//       let tScaleBoundsArray = new ActivationEscaping.ScaleBoundsArray( 0 );
//       {
//         tScaleBoundsArray.set_all_byScaleBoundsArray_concat_input0_input1( inputScaleBoundsArray0, inputScaleBoundsArray1 ); // Bounds Concat
//         tScaleBoundsArray.set_all_byInterleave_asGrouptTwo( this.arrayTemp_forInterleave_asGrouptTwo ); // Bounds Shuffle
//         tScaleBoundsArray.split_to_lowerHalf_higherHalf(
//           imageOutArray[ 0 ].boundsArraySet.output0, imageOutArray[ 1 ].boundsArraySet.output0 ); // Bounds Split
//       }
//
//     } else {
//
//       // Concat-shuffle. (no split)
//       // 
//       // Using different channel shuffler implementation for comparsion correctness.
//       let tensorOut = channelShuffler_ShuffleInfo.concatReshapeTransposeReshape( tensorInArray );
//
// //!!! ...unfinished... (2022/06/15)
//     }
//
//     // Release temporary tensors.
//     tf.dispose( tensorInArray );
//     tf.dispose( tensorOutArray );
//   }

  /**
   * @param {Block_TestParams.Base} testParams
   *   The test parameters for creating description.
   *
   * @return {string}
   *   The description of the testParams.out.
   */
  static TestParams_Out_createDescription( testParams ) {

    let inferencedParams = testParams.out.inferencedParams;

    let paramsOutDescription =
        `inputTensorCount=${inferencedParams.inputTensorCount}, `

      + `input0_height=${testParams.out.input0_height}, input0_width=${testParams.out.input0_width}, `
      + `inChannels0=${testParams.out.input0_channelCount}, `

      + `input1_height=${inferencedParams.input1_height}, input1_width=${inferencedParams.input1_width}, `
      + `inChannels1=${inferencedParams.input1_channelCount}, `

      + `nConvBlockTypeName=`
      + `${ValueDesc.ConvBlockType.Singleton.getStringOf( testParams.out.nConvBlockTypeId )}`
      + `(${testParams.out.nConvBlockTypeId}), `

      + `bHigherHalfDifferent=${inferencedParams.bHigherHalfDifferent}, `
      + `bHigherHalfDepthwise2=${inferencedParams.bHigherHalfDepthwise2}, `

      + `pointwise1ChannelCount=${testParams.out.inferencedParams.pointwise1ChannelCount}, `
      + `bPointwise1Bias=${testParams.out.inferencedParams.bPointwise1Bias}, `
      + `pointwise1ActivationName=`
        + `${ValueDesc.ActivationFunction.Singleton.getStringOf( testParams.out.inferencedParams.pointwise1ActivationId )}`
        + `(${testParams.out.inferencedParams.pointwise1ActivationId}), `

      + `bDepthwiseRequestedAndNeeded=${inferencedParams.bDepthwiseRequestedAndNeeded}, `
      + `bDepthwise2Requested=${inferencedParams.bDepthwise2Requested}, `

      + `depthwise_AvgMax_Or_ChannelMultiplier=`
        + `${ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton.getStringOf( testParams.out.depthwise_AvgMax_Or_ChannelMultiplier )}, `
      + `depthwiseFilterHeight=${testParams.out.depthwiseFilterHeight}, depthwiseFilterWidth=${testParams.out.depthwiseFilterWidth}, `
      + `depthwiseStridesPad=`
        + `${ValueDesc.StridesPad.Singleton.getStringOf( testParams.out.depthwiseStridesPad )}`
        + `(${testParams.out.depthwiseStridesPad}), `
      + `bDepthwiseBias=${testParams.out.bDepthwiseBias}, `
      + `depthwiseActivationName=`
        + `${Block.Params.depthwiseActivationId.getStringOfValue( testParams.out.depthwiseActivationId )}`
        + `(${testParams.out.depthwiseActivationId}), `

      + `bConcat1Requested=${inferencedParams.bConcat1Requested}, `

      + `nSqueezeExcitationChannelCountDivisorName=`
        + `${ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.getStringOf( testParams.out.nSqueezeExcitationChannelCountDivisor )}`
        + `(${testParams.out.nSqueezeExcitationChannelCountDivisor}), `

      + `pointwise20ChannelCount=${testParams.out.pointwise20ChannelCount}, bPointwise20Bias=${testParams.out.bPointwise20Bias}, `
      + `pointwise20ActivationName=`
        + `${Block.Params.pointwise20ActivationId.getStringOfValue( testParams.out.pointwise20ActivationId )}`
        + `(${testParams.out.pointwise20ActivationId}), `

      + `bAddInputToOutputRequested=${inferencedParams.bAddInputToOutputRequested}, `
      + `bConcat2ShuffleSplitRequested=${inferencedParams.bConcat2ShuffleSplitRequested}, `
      + `pointwise20_channelShuffler_outputGroupCount=${inferencedParams.pointwise20_channelShuffler_outputGroupCount}, `
      + `outputTensorCount=${inferencedParams.outputTensorCount}, `

      + `bKeepInputTensor=${testParams.out.bKeepInputTensor}`
    ;

    return paramsOutDescription;
  }

}
