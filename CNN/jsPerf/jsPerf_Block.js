export { init, testCorrectness, testDifferentDisposeStrategy_All, disposeTensors };

//import * as ValueMax from "../ValueMax.js";
import * as FloatValue from "../Unpacker/FloatValue.js";
import * as ValueRange from "../Unpacker/ValueRange.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
//import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as Weights from "../Unpacker/Weights.js";
//import * as TensorTools from "../util/TensorTools.js";
import * as BatchIdCalculator from "./BatchIdCalculator.js";
import * as Block from "../Conv/Block.js";
import * as ChannelShuffler from "../Conv/ChannelShuffler.js";
import * as ChannelShufflerPool from "../Conv/ChannelShufflerPool.js";
import * as Block_Reference from "./Ref/Block_Reference.js";
import * as Block_TestParams from "./Ref/Block_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 
import * as NumberImage from "./Ref/NumberImage.js"; 
import * as jsPerf_FloatValue_ScaleTranslate from "./jsPerf_FloatValue_ScaleTranslate.js";
import * as jsPerf_FloatValue_Bounds from "./jsPerf_FloatValue_Bounds.js";
import * as jsPerf_Operation from "./jsPerf_Operation.js";

/**
 * Test CNN Block.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/11973/878/colorfulcakechen-cnn-pointdepthpoint-1549b400f3b4130569}
 */

/**
 * A test set.
 */
class HeightWidthDepth {

  /**
   * @param {number} height            image height
   * @param {number} width             image width
   * @param {number} depth             image channel count
   */
  constructor( height, width, depth ) {

    this.disposeTensors();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;
    this.concatenatedShape = [ height, width, depth ];
    this.outputGroupCount = 2; // Only support two convolution groups.
  }

  disposeTensors() {
    if ( this.dataTensor3dArray ) {
      tf.dispose( this.dataTensor3dArray );
      this.dataTensor3dArray = null;
    }

    this.block_PerformanceTest_release();
  }

  block_PerformanceTest_init() {

    let pointwise_4to8_FiltersArray =
    [
       1,  4,  2,  3, -3, -2,  4,  1,
       2,  3, -3, -2,  4,  1,  1,  4,
      -3, -2,  4,  1,  1,  4,  2,  3,
       4,  1,  1,  4,  2,  3, -3, -2,
    ];

    let pointwise_4to8_BiasesArray =
    [ 3, 4, 5, 6, 7, 8, 9, 10, ];

    // (If value too large (out of float32 range), the result will strange. So, use smaller and negative value.)
    let depthwise_8to16_FiltersArray =
    [
       1, -9, -5,  7,  2,  8,  4,  1, -3,  7, -6,  9,  4, -6,  8, -2,
       2,  8,  4,  1, -3,  7, -6,  9,  4, -6,  8, -2,  5,  5, -7, -3,
      -3,  7, -6,  9,  4, -6,  8, -2,  5,  5, -7, -3,  6,  4,  9,  5,

       4, -6,  8, -2,  5,  5, -7, -3,  6,  4,  9,  5,  7,  3, -3,  4,
       5,  5, -7, -3,  6,  4,  9,  5,  7,  3, -3,  4, -8,  2,  1, -8,
       6,  4,  9,  5,  7,  3, -3,  4, -8,  2,  1, -8, -9,  1, -2,  6,

       7,  3, -3,  4, -8,  2,  1, -8, -9,  1, -2,  6,  1, -9, -5,  7,
      -8,  2,  1, -8, -9,  1, -2,  6,  1, -9, -5,  7,  2,  8,  4,  1,
      -9,  1, -2,  6,  1, -9, -5,  7,  2,  8,  4,  1, -3,  7, -6,  9,
    ];

    let depthwise_8to16_BiasesArray =
    [ 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, ];

    let depthwise_4to128_FiltersArray = [ ... new Array( 3 * 3 * 4 * 32 ).keys() ]; // filterHeight * filterWidth * inChannel * channelMultiplier
    let depthwise_Xto128_BiasesArray =  [ ... new Array(         4 * 32 ).keys() ]; // inChannel * channelMultiplier

    let depthwise_8to8_FiltersArray =
    [
       1, -9, -5,  7,  2,  8,  4,  1,
       2,  8,  4,  1, -3,  7, -6,  9,
      -3,  7, -6,  9,  4, -6,  8, -2,

       4, -6,  8, -2,  5,  5, -7, -3,
       5,  5, -7, -3,  6,  4,  9,  5,
       6,  4,  9,  5,  7,  3, -3,  4,

       7,  3, -3,  4, -8,  2,  1, -8,
      -8,  2,  1, -8, -9,  1, -2,  6,
      -9,  1, -2,  6,  1, -9, -5,  7,
    ];

    let depthwise_8to8_BiasesArray =
    [ 101, 102, 103, 104, 105, 106, 107, 108, ];

    let pointwise_16to4_FiltersArray =
    [
      11, 21, 31, 41,
      12, 22, 32, 42,
      13, 23, 33, 43,
      14, 24, 34, 44,
      15, 25, 35, 45,
      16, 26, 36, 46,
      17, 27, 37, 47,
      18, 28, 38, 48,
      19, 29, 39, 49,
      20, 30, 40, 50,
      21, 31, 41, 51,
      22, 32, 42, 52,
      23, 33, 43, 53,
      24, 34, 44, 54,
      25, 35, 45, 55,
      26, 36, 46, 56,
    ];

    let pointwise_8to4_FiltersArray =
    [
      11, 21, 31, 41,
      12, 22, 32, 42,
      13, 23, 33, 43,
      14, 24, 34, 44,
      15, 25, 35, 45,
      16, 26, 36, 46,
      17, 27, 37, 47,
      18, 28, 38, 48,
    ];

    let pointwise_4to128_FiltersArray =   [ ... new Array(   4 * 128 ).keys() ]; // inChannel * outChannel
    let pointwise_128to128_FiltersArray = [ ... new Array( 128 * 128 ).keys() ]; // inChannel * outChannel

    let pointwise_Xto4_BiasesArray =
    [ 201, 202, 203, 204, ];

    let pointwise_Xto128_BiasesArray =    [ ... new Array( 128 ).keys() ];       // outChannel

    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeTensors();

    // Larger input image for performance testing.
    let inputTensorCount = 2;
    this.testPerformance_NumberImageArray = new Array( inputTensorCount );
    this.dataTensor3dArray = tf.tidy( () => {
      let dataTensor3dArray = new Array( inputTensorCount );

      let shape = [ this.height, this.width, this.depth ];
      let length = tf.util.sizeFromShape( shape );

      for ( let i = 0; i < dataTensor3dArray.length; ++i ) {
        let numberBegin = ( i * length );
        let numberEnd = numberBegin + length;

        let t = tf.range( numberBegin, numberEnd, 1 );
        let dataTensor3d = tf.reshape( t, shape );
        dataTensor3dArray[ i ] = dataTensor3d;

        this.testPerformance_NumberImageArray[ i ] = new NumberImage.Base(
          this.height, this.width, this.depth, dataTensor3d.dataSync() );
      }

      return dataTensor3dArray;
    });


    // Create shared ChannelShuffler.
    let concatenatedShape = [ this.height, this.width, this.depth * this.outputGroupCount ]; 
    let channelShuffler_ConcatPointwiseConv = this.channelShuffler_ConcatPointwiseConv
          = new ChannelShuffler.ConcatPointwiseConv( concatenatedShape, this.outputGroupCount );

    // inputHeight0, inputWidth0,
    // channelCount0_pointwise1Before, channelCount1_pointwise1Before,
    // pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    // depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseFilterWidth, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    // pointwise20ChannelCount, bPointwise20Bias, pointwise20ActivationId,
    // bPointwise21,
    // bKeepInputTensor
    //

    // The block for performance testing should:
    //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
    //


//!!! ...unfinished... (2022/05/19) nSqueezeExcitationChannelCountDivisor, ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.Xxx


    // Test Case: (pointwise1 (bias, COS), depthwise (channelMultiplier = 1, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_8to8_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput =
    new Block_TestParams.Base().set_byParamsScattered(
      this.testPerformance_NumberImageArray[ 0 ].height, this.testPerformance_NumberImageArray[ 0 ].width,
      this.testPerformance_NumberImageArray[ 0 ].depth, 0, //this.testPerformance_NumberImageArray[ 1 ].depth,
      ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
          8,  true, Block.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          1,     3, 3, 1,  true, Block.Params.depthwiseActivationId.valueDesc.Ids.COS,
      ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
          4,  true, Block.Params.pointwise20ActivationId.valueDesc.Ids.COS,
      false,
       true
    );

    // Test Case: (pointwise1 (bias, COS), depthwise (avg pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_avg_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput =
    new Block_TestParams.Base().set_byParamsScattered(
      this.testPerformance_NumberImageArray[ 0 ].height, this.testPerformance_NumberImageArray[ 0 ].width,
      this.testPerformance_NumberImageArray[ 0 ].depth, 0, //this.testPerformance_NumberImageArray[ 1 ].depth,
      ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
          8,  true, Block.Params.pointwise1ActivationId.valueDesc.Ids.COS,
        Block.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG,
                 3, 3, 1,  true, Block.Params.depthwiseActivationId.valueDesc.Ids.COS,
      ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
          4,  true, Block.Params.pointwise20ActivationId.valueDesc.Ids.COS,
      false,
       true
    );

    // Test Case: (pointwise1 (bias, COS), depthwise (max pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_max_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput =
    new Block_TestParams.Base().set_byParamsScattered(
      this.testPerformance_NumberImageArray[ 0 ].height, this.testPerformance_NumberImageArray[ 0 ].width,
      this.testPerformance_NumberImageArray[ 0 ].depth, 0, //this.testPerformance_NumberImageArray[ 1 ].depth,
      ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
          8,  true, Block.Params.pointwise1ActivationId.valueDesc.Ids.COS,
        Block.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,
                 3, 3, 1,  true, Block.Params.depthwiseActivationId.valueDesc.Ids.COS,
      ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
          4,  true, Block.Params.pointwise20ActivationId.valueDesc.Ids.COS,
      false,
       true
    );

    // Test Case: (pointwise1 (bias, COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_8to16_strides_1_pad_same_bias_COS_pointwise2_16to4_bias_COS_AddInputToOutput =
    new Block_TestParams.Base().set_byParamsScattered(
      this.testPerformance_NumberImageArray[ 0 ].height, this.testPerformance_NumberImageArray[ 0 ].width,
      this.testPerformance_NumberImageArray[ 0 ].depth, 0, //this.testPerformance_NumberImageArray[ 1 ].depth,
      ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
          8,  true, Block.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          2,     3, 3, 1,  true, Block.Params.depthwiseActivationId.valueDesc.Ids.COS,
      ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
          4,  true, Block.Params.pointwise20ActivationId.valueDesc.Ids.COS,
      false,
       true
    );

    // Test Case: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS), AddInputToOutput)
    let testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS_AddInputToOutput =
    new Block_TestParams.Base().set_byParamsScattered(
      this.testPerformance_NumberImageArray[ 0 ].height, this.testPerformance_NumberImageArray[ 0 ].width,
      this.testPerformance_NumberImageArray[ 0 ].depth, 0, //this.testPerformance_NumberImageArray[ 1 ].depth,
      ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V2_BODY_TAIL,
          8, false, Block.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          2,     3, 3, 1, false, Block.Params.depthwiseActivationId.valueDesc.Ids.COS,
      ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
          4, false, Block.Params.pointwise20ActivationId.valueDesc.Ids.COS,
      false,
       true
    );

    // Test Case: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS))
    let testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS =
    new Block_TestParams.Base().set_byParamsScattered(
      this.testPerformance_NumberImageArray[ 0 ].height, this.testPerformance_NumberImageArray[ 0 ].width,
      this.testPerformance_NumberImageArray[ 0 ].depth, 0, //this.testPerformance_NumberImageArray[ 1 ].depth,
      ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
          8, false, Block.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          2,     3, 3, 1, false, Block.Params.depthwiseActivationId.valueDesc.Ids.COS,
      ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
          4, false, Block.Params.pointwise20ActivationId.valueDesc.Ids.COS,
      false,
       true
    );

    // Test Case: (pointwise1 (none), depthwise (channelMultiplier = 32, strides = 1, pad = same, bias, COS), pointwise2 (bias))
    let testCase_pointwise1_none_depthwise_4to128_strides_1_pad_same_bias_COS_pointwise2_128to128_bias =
    new Block_TestParams.Base().set_byParamsScattered(
      this.testPerformance_NumberImageArray[ 0 ].height, this.testPerformance_NumberImageArray[ 0 ].width,
      this.testPerformance_NumberImageArray[ 0 ].depth, 0, //this.testPerformance_NumberImageArray[ 1 ].depth,
      ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
          0,  true, Block.Params.pointwise1ActivationId.valueDesc.Ids.COS,
         32,     3, 3, 1,  true, Block.Params.depthwiseActivationId.valueDesc.Ids.COS,
      ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        128,  true, Block.Params.pointwise20ActivationId.valueDesc.Ids.NONE,
      false,
       true
    );

    // Test Case: (pointwise1 (bias, COS), depthwise (none), pointwise2 (bias))
    let testCase_pointwise1_4to128_bias_COS_depthwise_none_COS_pointwise2_128to128_bias =
    new Block_TestParams.Base().set_byParamsScattered(
      this.testPerformance_NumberImageArray[ 0 ].height, this.testPerformance_NumberImageArray[ 0 ].width,
      this.testPerformance_NumberImageArray[ 0 ].depth, 0, //this.testPerformance_NumberImageArray[ 1 ].depth,
      ValueDesc.ConvBlockType.Singleton.Ids.MOBILE_NET_V1_HEAD_BODY_TAIL,
        128,  true, Block.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          0,     3, 3, 1,  true, Block.Params.depthwiseActivationId.valueDesc.Ids.COS,
      ValueDesc.SqueezeExcitationChannelCountDivisor.Singleton.Ids.EXCITATION, false,
        128,  true, Block.Params.pointwise20ActivationId.valueDesc.Ids.NONE,
      false,
       true
    );

    let inputScaleBoundsArray0 = this.testPerformance_NumberImageArray[ 0 ].boundsArraySet.output0;
    let inputScaleBoundsArray1 = this.testPerformance_NumberImageArray[ 1 ].boundsArraySet.output0;
    let arrayTemp_forInterleave_asGrouptTwo = [];

    // Different block objects.
    //
    // ( bKeepInputTensor )
    this.block_list = [

      // The block for performance testing.
      this.block_DConv_1_bias_COS_AddInputToOutput
        = Block_Reference.Base.block_create(
            testCase_pointwise1_4to8_bias_COS_depthwise_8to8_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput,
            inputScaleBoundsArray0, inputScaleBoundsArray1,
            null, //channelShuffler_ConcatPointwiseConv,
            arrayTemp_forInterleave_asGrouptTwo ),

      this.block_Avg_bias_COS_AddInputToOutput
        = Block_Reference.Base.block_create(
            testCase_pointwise1_4to8_bias_COS_depthwise_avg_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput,
            inputScaleBoundsArray0, inputScaleBoundsArray1,
            null, //channelShuffler_ConcatPointwiseConv,
            arrayTemp_forInterleave_asGrouptTwo ),

      this.block_Max_bias_COS_AddInputToOutput
        = Block_Reference.Base.block_create(
            testCase_pointwise1_4to8_bias_COS_depthwise_max_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput,
            inputScaleBoundsArray0, inputScaleBoundsArray1,
            null, //channelShuffler_ConcatPointwiseConv,
            arrayTemp_forInterleave_asGrouptTwo ),

      this.block_DConv_2_bias_COS_AddInputToOutput
        = Block_Reference.Base.block_create(
            testCase_pointwise1_4to8_bias_COS_depthwise_8to16_strides_1_pad_same_bias_COS_pointwise2_16to4_bias_COS_AddInputToOutput,
            inputScaleBoundsArray0, inputScaleBoundsArray1,
            null, //channelShuffler_ConcatPointwiseConv,
            arrayTemp_forInterleave_asGrouptTwo ),

      this.block_DConv_2_COS_AddInputToOutput
        = Block_Reference.Base.block_create(
            testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS_AddInputToOutput,
            inputScaleBoundsArray0, inputScaleBoundsArray1,
            null, //channelShuffler_ConcatPointwiseConv,
            arrayTemp_forInterleave_asGrouptTwo ),

      this.block_DConv_2_COS
        = Block_Reference.Base.block_create(
            testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS,
            inputScaleBoundsArray0, inputScaleBoundsArray1,
            null, //channelShuffler_ConcatPointwiseConv,
            arrayTemp_forInterleave_asGrouptTwo ),

      this.block_DConv_32_bias_COS_P128_bias
        = Block_Reference.Base.block_create(
            testCase_pointwise1_none_depthwise_4to128_strides_1_pad_same_bias_COS_pointwise2_128to128_bias,
            inputScaleBoundsArray0, inputScaleBoundsArray1,
            null, //channelShuffler_ConcatPointwiseConv,
            arrayTemp_forInterleave_asGrouptTwo ),

      this.block_P128_bias_COS_P128_bias
        = Block_Reference.Base.block_create(
            testCase_pointwise1_4to128_bias_COS_depthwise_none_COS_pointwise2_128to128_bias,
            inputScaleBoundsArray0, inputScaleBoundsArray1,
            null, //channelShuffler_ConcatPointwiseConv,
            arrayTemp_forInterleave_asGrouptTwo ),

    ];

  }

  block_PerformanceTest_release() {
    if ( this.block_list ) {
      for ( let i = 0; i < this.block_list.length; ++i ) {
        let block = this.block_list[ i ];
        block.disposeTensors();
      }
      this.block_list = null;
    }

    if ( this.channelShuffler_ConcatPointwiseConv ) { // Release shared ChannelShuffler.
      this.channelShuffler_ConcatPointwiseConv.disposeTensors();
      this.channelShuffler_ConcatPointwiseConv = null;
    }
  }

//!!! ...unfinished...
  // Test apply by depthwise convolution.
  test_DConv_1_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.block_DConv_1_bias_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_Avg_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.block_Avg_bias_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_Max_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.block_Max_bias_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_2_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.block_DConv_2_bias_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_2_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.block_DConv_2_COS_AddInputToOutput.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_2_COS() {
    let outputTensor3dArray = [];
    this.block_DConv_2_COS.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_32_bias_COS_P128_bias() {
    let outputTensor3dArray = [];
    this.block_DConv_32_bias_COS_P128_bias.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_P128_bias_COS_P128_bias() {
    let outputTensor3dArray = [];
    this.block_P128_bias_COS_P128_bias.apply( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_FloatValue() {
    jsPerf_FloatValue_ScaleTranslate.testCorrectness();
    jsPerf_FloatValue_Bounds.testCorrectness();
  }

  test_Weights_Float32Array_RestrictedClone() {

    let inputArray = new Float32Array( [
      undefined, null, "", "A", "2", Number.NaN,
      Number.NEGATIVE_INFINITY,
           -Math.pow( 2, +25 ), -Math.pow( 2, +24 ), -Math.pow( 2, +23 ),
           -Math.pow( 2, -23 ), -Math.pow( 2, -24 ), -Math.pow( 2, -25 ),
                             0,
           +Math.pow( 2, -25 ), +Math.pow( 2, -24 ), +Math.pow( 2, -23 ),
           +Math.pow( 2, +23 ), +Math.pow( 2, +24 ), +Math.pow( 2, +25 ),
      Number.POSITIVE_INFINITY,
    ] );

    const POSITIVE_MAX = Weights.Base.ValueBounds.upper;
    const NEGATIVE_MIN = Weights.Base.ValueBounds.lower;

    let verifyArray = new Float32Array( [
      0, 0, 0, 0, 2, 0,
       NEGATIVE_MIN,
       NEGATIVE_MIN,  NEGATIVE_MIN, -( 2 ** +23 ),
      -( 2 ** -23 ), -( 2 ** -24 ), -( 2 ** -25 ),
                  0,
      +( 2 ** -25 ), +( 2 ** -24 ), +( 2 ** -23 ),
      +( 2 ** +23 ),  POSITIVE_MAX,  POSITIVE_MAX,
       POSITIVE_MAX,
    ] );

    let outputArray = Weights.Base.ValueBounds.Float32Array_RestrictedClone( inputArray );

    tf.util.assert( inputArray.length == outputArray.length,
      `test_Weights_Float32Array_RestrictedClone(): `
        + `inputArray.length ( ${inputArray.length} ) `
        + `should be the same as outputArray.length ( ${outputArray.length} ).`
    );

    for ( let i = 0; i < inputArray.length; ++i ) {
      let inputElement = inputArray[ i ];
      let verifyElement = verifyArray[ i ];
      let outputElement = outputArray[ i ];

      tf.util.assert( outputElement === verifyElement,
        `test_Weights_Float32Array_RestrictedClone(): `
          + `Weights.Base.ValueBounds.Float32Array_RestrictedClone( inputArray[ ${i} ] = ${inputElement} ) `
          + `should be ( ${verifyElement} ) but got ( ${outputElement} ).`
      );

      let outputElementSingle = Weights.Base.ValueBounds.clamp_or_zeroIfNaN( inputElement );

      tf.util.assert( outputElementSingle === verifyElement,
        `test_Weights_Float32Array_RestrictedClone(): `
          + `Weights.Base.ValueBounds.clamp_or_zeroIfNaN( inputArray[ ${i} ] = ${inputElement} ) `
          + `should be ( ${verifyElement} ) but got ( ${outputElementSingle} ).`
      );
    }
  }

  test_ValueRange_valueInputOutputGenerator() {
    let valuePair = {};

    // Test ValueRange.Bool().valueInputOutputGenerator().
    {
      let paramDesc = Block.Params.bPointwise1Bias;

      for ( let offsetMultiplier = -100; offsetMultiplier <= +100; ++offsetMultiplier ) {
        for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( valuePair, offsetMultiplier ) ) {
          let adjustedInput = paramDesc.valueDesc.range.adjust( pair.valueInput )

          tf.util.assert( adjustedInput == pair.valueOutput,
            `ValueRange.Bool().valueInputOutputGenerator( ${offsetMultiplier} ): `
              + `this.adjust( ${pair.valueInput} ) return ( ${adjustedInput} ) should be ( ${pair.valueOutput} ).` );
        }
      }
    }

    // Test ValueRange.Int().valueInputOutputGenerator().
    {
      let paramDesc = Block.Params.pointwise20ChannelCount;

      for ( let offsetMultiplier = -10; offsetMultiplier <= +10; ++offsetMultiplier ) {
        for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( valuePair, offsetMultiplier ) ) {
          let adjustedInput = paramDesc.valueDesc.range.adjust( pair.valueInput )

          tf.util.assert( adjustedInput == pair.valueOutput,
            `ValueRange.Int( ${paramDesc.min}, ${paramDesc.max} ).valueInputOutputGenerator( ${offsetMultiplier} ): `
              + `this.adjust( ${pair.valueInput} ) return ( ${adjustedInput} ) should be ( ${pair.valueOutput} ).` );
        }
      }
    }
  }

  test_Operation() {
    jsPerf_Operation.testCorrectness();
  }

  // Testing whether the results of different implementation are the same.
  testCorrectness() {
    this.test_FloatValue();
    this.test_Weights_Float32Array_RestrictedClone();
    this.test_ValueRange_valueInputOutputGenerator();
    this.test_Operation();

    tf.tidy( () => {

      let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag and channelShufflerPool.

      {
        // Note: imageSourceBag and channelShufflerPool should not be created outside tidy() because tidy() will dispose tensors
        //       dynamically created in them.
        let imageSourceBag = new ImageSourceBag.Base();
        let channelShufflerPool = new ChannelShufflerPool.Base( ChannelShuffler.ConcatPointwiseConv );

        let testParams = new Block_TestParams.Base();
        let testParamsGenerator = testParams.ParamsGenerator();
        let testReference = new Block_Reference.Base();

        let batchIdCalculator = new BatchIdCalculator.Base( 100 * 1000 );

        try {
          for ( let testParams of testParamsGenerator ) {
            batchIdCalculator.checkAndDisplay( testParams.id );
            testReference.testCorrectness( imageSourceBag, testParams, channelShufflerPool );
          }

        // Q: Why not catch exception inside Block_Reference.testCorrectness()?
        // A: To catch testParamsGenerator's exception.
        } catch ( e ) {
          let backendName = tf.getBackend();
          let msg = `jsPerf_Block.js: testCorrectness(): backendName=${backendName}, `
            + `Block, (yieldCount == ${testParams.yieldCount}), testParams.id == ${testParams.id}`;

          console.log( msg );
          alert( `${msg}\n${e}` );

          //debugger;
          throw e;
        }

        batchIdCalculator.checkAndDisplay( testParams.id );

        channelShufflerPool.disposeTensors();
        imageSourceBag.disposeTensors();
      }

      let memoryInfo_testCorrectness_after = tf.memory();

      tf.util.assert( ( memoryInfo_testCorrectness_after.numTensors == memoryInfo_testCorrectness_before.numTensors ),
        `testCorrectness() memory leak. `
          + `result tensor count ( ${memoryInfo_testCorrectness_after.numTensors} ) `
          + `should be ( ${memoryInfo_testCorrectness_before.numTensors} ) `
          + `` );
    });

    try {
      // After correctness testing done, create all Block for performance testing.
      this.block_PerformanceTest_init();
    } catch ( e ) {
      debugger;
      throw e;
    }
  }

   testDifferentDisposeStrategy_All() {
//     this.testDifferentDisposeStrategy_ConcatReshapeTransposeReshapeSplit();
   }

//   testDifferentDisposeStrategy( functionTable, thisArg ) {
//     tf.tidy( () => {
//       let funcPrev;
//       let tArrayPrev;
//
//       for ( let i = 0; i < functionTable.length; ++i ) {
//         let func = functionTable[ i ];//
//         let memoryInfoPrev = tf.memory();
//         let tArray = func.call( thisArg, this.dataTensor3dArray );
//         let memoryInfo = tf.memory();
//
//         tf.util.assert( memoryInfo.numTensors == ( memoryInfoPrev.numTensors + tArray.length ), `${func.name}() memory leak`);
//
//         if ( tArrayPrev ) {
//           tf.util.assert(
//             TensorTools.Comparator.isTensorArrayEqual( tArrayPrev, tArray ),
//             `${funcPrev.name}() != ${func.name}()`);
//         }
//
//         tf.dispose( tArrayPrev );
//
//         funcPrev = func;
//         tArrayPrev = tArray;
//       }
//     });
//   }

}

function init() {
  //console.log("jsPerf_Block.js, init()");

  disposeTensors();

  let depth = 4;
//  globalThis.testSet_110x120x4 = new HeightWidthDepth( 110, 120, depth ); // height, width, depth

  // Using mobile phone's resolution ( 2160 * 1080 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1920 * 1080 ).
  globalThis.testSet_110x120x4 = new HeightWidthDepth( 108, 192, depth ); // height, width, depth

  globalThis.testSet_110x120x4_All = [
    globalThis.testSet_110x120x4
  ];
}

function testCorrectness() {
  for ( let i = 0; i < globalThis.testSet_110x120x4_All.length; ++i ) {
    let testSet = globalThis.testSet_110x120x4_All[ i ];
    testSet.testCorrectness();
  }
}

function testDifferentDisposeStrategy_All() {
  for ( let i = 0; i < globalThis.testSet_110x120x4_All.length; ++i ) {
    let testSet = globalThis.testSet_110x120x4_All[ i ];
    testSet.testDifferentDisposeStrategy_All();
  }
}

function disposeTensors() {
  if ( globalThis.testSet_110x120x4_All ) {
    for ( let i = 0; i < globalThis.testSet_110x120x4_All.length; ++i ) {
      let testSet = globalThis.testSet_110x120x4_All[ i ];
      if ( testSet )
        testSet.disposeTensors();
    }

    globalThis.testSet_110x120x4_All = null;
  }

  globalThis.testSet_110x120x4
    = null;
}
