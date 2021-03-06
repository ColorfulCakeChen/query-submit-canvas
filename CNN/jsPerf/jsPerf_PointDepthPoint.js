export { init, testCorrectness, testDifferentDisposeStrategy_All, disposeTensors };

import * as ValueMax from "../ValueMax.js";
import * as ValueRange from "../Unpacker/ValueRange.js";
//import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";
//import * as TensorTools from "../util/TensorTools.js";
import * as PointDepthPoint_Reference from "./PointDepthPoint_Reference.js";
import * as PointDepthPoint_TestParams from "./PointDepthPoint_TestParams.js"; 


/**
 * Test CNN PointDepthPoint.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/11973/178/colorfulcakechen-cnn-pointdepthpoint-355acbef1c0e9ea02c}
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

//!!! ...unfinished... (2021/06/08) seems not used.
    this.concatenatedShape = [ height, width, depth ];

    // Borrow the calcDepthwise() function to create an input image which is shrink by ( strides == 2 ).
    function StridesPad_producer( imageIn, depthwiseStridesPad ) {
      let imageOutShrinked = PointDepthPoint_Reference.Base.calcDepthwise(
        imageIn,
        PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX, 1, // Max Pooling, 1x1, achieving lesser computation.
        depthwiseStridesPad,
        null, false, null, ValueDesc.ActivationFunction.NONE, //depthwiseFiltersArray, bDepthwiseBias, depthwiseBiasesArray, depthwiseActivationId,
        "StridesPad_producer", "" );
      return imageOutShrinked;
    }

    // Return an array which has imageIn with StridesPad in [ 0, 2 ].
    function StridesPadArray_producer( imageIn ) {
      let min = PointDepthPoint.Params.depthwiseStridesPad.valueDesc.range.min;
      let max = PointDepthPoint.Params.depthwiseStridesPad.valueDesc.range.max;
      let kinds = PointDepthPoint.Params.depthwiseStridesPad.valueDesc.range.kinds;

      let resultArray = new Array( kinds );
      for ( let stridesPad = min; stridesPad <= max; ++stridesPad ) {
        resultArray[ stridesPad - min ] = StridesPad_producer( imageIn, stridesPad );
      }
      return resultArray;
    }

    let image_3_5_1 = { height: 3, width: 5, depth: 1,
      dataArray: [
        111,  121,  131,  141,  151,
        211,  221,  231,  241,  251,
        311,  321,  331,  341,  351, ]
    };

    let image_3_5_2 = { height: 3, width: 5, depth: 2,
      dataArray: [
        111, 112,  121, 122,  131, 132,  141, 142,  151, 152,
        211, 212,  221, 222,  231, 232,  241, 242,  251, 252,
        311, 312,  321, 322,  331, 332,  341, 342,  351, 352, ]
    };

    let image_3_5_3 = { height: 3, width: 5, depth: 3,
      dataArray: [
        111, 112, 113,  121, 122, 123,  131, 132, 133,  141, 142, 143,  151, 152, 153,
        211, 212, 213,  221, 222, 223,  231, 232, 233,  241, 242, 243,  251, 252, 253,
        311, 312, 313,  321, 322, 323,  331, 332, 333,  341, 342, 343,  351, 352, 353, ]
    };

    let image_3_5_4 = { height: 3, width: 5, depth: 4,
      dataArray: [
        111, 112, 113, 114,  121, 122, 123, 124,  131, 132, 133, 134,  141, 142, 143, 144,  151, 152, 153, 154,
        211, 212, 213, 214,  221, 222, 223, 224,  231, 232, 233, 234,  241, 242, 243, 244,  251, 252, 253, 254,
        311, 312, 313, 314,  321, 322, 323, 324,  331, 332, 333, 334,  341, 342, 343, 344,  351, 352, 353, 354, ]
    };

    let image_3_5_5 = { height: 3, width: 5, depth: 5,
      dataArray: [
        111, 112, 113, 114, 115,  121, 122, 123, 124, 125,  131, 132, 133, 134, 135,  141, 142, 143, 144, 145,  151, 152, 153, 154, 155,
        211, 212, 213, 214, 215,  221, 222, 223, 224, 225,  231, 232, 233, 234, 235,  241, 242, 243, 244, 245,  251, 252, 253, 254, 255,
        311, 312, 313, 314, 315,  321, 322, 323, 324, 325,  331, 332, 333, 334, 335,  341, 342, 343, 344, 345,  351, 352, 353, 354, 355, ]
    };

    this.testCorrectness_ImageDataArray = [
      [ image_3_5_4 ], // testCorrectness_ImageDataArray[ 0 ][ 0 ]: input0

//!!! ...unfinished... (2021/07/15) should also consider different depthwiseFilterHeight.
// Perhaps, useing a dynamic input1 creator which will save already created input1 to speed up future testing.
// getImage_by( channelCount, depthwiseFilterHeight, depthwiseStridesPad )
//

      // testCorrectness_ImageDataArray[ 1 ][ 0 - 2 ]: input1 with ( channelCount == 1 ) and StridesPad [ 0, 2 ]
      StridesPadArray_producer( image_3_5_1 ),

      // testCorrectness_ImageDataArray[ 2 ][ 0 - 2 ]: input1 with ( channelCount == 2 ) and StridesPad [ 0, 2 ]
      StridesPadArray_producer( image_3_5_2 ),

      // testCorrectness_ImageDataArray[ 3 ][ 0 - 2 ]: input1 with ( channelCount == 3 ) and StridesPad [ 0, 2 ]
      StridesPadArray_producer( image_3_5_3 ),

      // testCorrectness_ImageDataArray[ 4 ][ 0 - 2 ]: input1 with ( channelCount == 4 ) and StridesPad [ 0, 2 ]
      StridesPadArray_producer( image_3_5_4 ),

      // testCorrectness_ImageDataArray[ 5 ][ 0 - 2 ]: input1 with ( channelCount == 5 ) and StridesPad [ 0, 2 ]
      StridesPadArray_producer( image_3_5_5 ),
    ];

    // Small input image for correctness testing.
    this.dataTensor3dArray = tf.tidy( () => {

      let dataTensor3dArray = new Array( this.testCorrectness_ImageDataArray.length );
      for ( let i = 0; i < this.testCorrectness_ImageDataArray.length; ++i ) {
        dataTensor3dArray[ i ] = new Array( this.testCorrectness_ImageDataArray[ i ].length );
        for ( let j = 0; j <= this.testCorrectness_ImageDataArray[ i ].length; ++j ) {
          let testImageData = this.testCorrectness_ImageDataArray[ i ][ j ];
          if ( testImageData ) {
            let shape = [ testImageData.height, testImageData.width, testImageData.depth ];
            let dataTensor3d = tf.tensor3d( testImageData.dataArray, shape );
            dataTensor3dArray[ i ][ j ] = dataTensor3d;
          }
        }
      }
      return dataTensor3dArray;
    });

  }

  disposeTensors() {
    if ( this.dataTensor3dArray ) {
      tf.dispose( this.dataTensor3dArray );
      this.dataTensor3dArray = null;
    }

    this.pointDepthPoint_PerformanceTest_release();
  }

  pointDepthPoint_PerformanceTest_init() {

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
    this.testPerformance_ImageDataArray = new Array( inputTensorCount );
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

        this.testPerformance_ImageDataArray[ i ] = {
          height: this.height, width: this.width, depth: this.depth,
          dataArray: dataTensor3d.dataSync()
        };
      }

      return dataTensor3dArray;
    });

    // channelCount1_pointwise1Before,
    // pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    // depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    // pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    // pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId,
    //

//!!! ...unfinished... (2021/07/14) channelCount1_pointwise1Before

    // Test Case: (pointwise1 (bias, COS), depthwise (channelMultiplier = 1, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_8to8_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set_By_ParamsScattered(
      this.testPerformance_ImageDataArray[ 0 ].depth, this.testPerformance_ImageDataArray[ 1 ].depth,
          8,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          1,     3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
    ) );

    // Test Case: (pointwise1 (bias, COS), depthwise (avg pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_avg_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set_By_ParamsScattered(
      this.testPerformance_ImageDataArray[ 0 ].depth, this.testPerformance_ImageDataArray[ 1 ].depth,
          8,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
        PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG,
                 3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
    ) );

    // Test Case: (pointwise1 (bias, COS), depthwise (max pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_max_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set_By_ParamsScattered(
      this.testPerformance_ImageDataArray[ 0 ].depth, this.testPerformance_ImageDataArray[ 1 ].depth,
          8,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
        PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,
                 3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
    ) );

    // Test Case: (pointwise1 (bias, COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_8to16_strides_1_pad_same_bias_COS_pointwise2_16to4_bias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set_By_ParamsScattered(
      this.testPerformance_ImageDataArray[ 0 ].depth, this.testPerformance_ImageDataArray[ 1 ].depth,
          8,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          2,     3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
    ) );

    // Test Case: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS), AddInputToOutput)
    let testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set_By_ParamsScattered(
      this.testPerformance_ImageDataArray[ 0 ].depth, this.testPerformance_ImageDataArray[ 1 ].depth,
          8, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          2,     3,   1, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4, false, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0, false, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
    ) );

    // Test Case: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS))
    let testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set_By_ParamsScattered(
      this.testPerformance_ImageDataArray[ 0 ].depth, this.testPerformance_ImageDataArray[ 1 ].depth,
          8, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          2,     3,   1, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4, false, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0, false, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
    ) );

    // Test Case: (pointwise1 (none), depthwise (channelMultiplier = 32, strides = 1, pad = same, bias, COS), pointwise2 (bias))
    let testCase_pointwise1_none_depthwise_4to128_strides_1_pad_same_bias_COS_pointwise2_128to128_bias =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set_By_ParamsScattered(
      this.testPerformance_ImageDataArray[ 0 ].depth, this.testPerformance_ImageDataArray[ 1 ].depth,
            0,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
           32,     3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          128,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.NONE,
            0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.NONE,
    ) );

    // Test Case: (pointwise1 (bias, COS), depthwise (none), pointwise2 (bias))
    let testCase_pointwise1_4to128_bias_COS_depthwise_none_COS_pointwise2_128to128_bias =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set_By_ParamsScattered(
      this.testPerformance_ImageDataArray[ 0 ].depth, this.testPerformance_ImageDataArray[ 1 ].depth,
          128,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            0,     3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          128,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.NONE,
            0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.NONE,
    ) );


    // Different pointDepthPoint objects.
    //
    // ( bKeepInputTensor )
    this.pointDepthPoint_list = [

      // The pointDepthPoint for performance testing should:
      //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
      this.pointDepthPoint_DConv_1_bias_COS_AddInputToOutput
        = testCase_pointwise1_4to8_bias_COS_depthwise_8to8_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput
          .pointDepthPoint_create(  true ),

      this.pointDepthPoint_Avg_bias_COS_AddInputToOutput
        = testCase_pointwise1_4to8_bias_COS_depthwise_avg_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput
          .pointDepthPoint_create(  true ),

      this.pointDepthPoint_Max_bias_COS_AddInputToOutput
        = testCase_pointwise1_4to8_bias_COS_depthwise_max_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput
          .pointDepthPoint_create(  true ),

      this.pointDepthPoint_DConv_2_bias_COS_AddInputToOutput
        = testCase_pointwise1_4to8_bias_COS_depthwise_8to16_strides_1_pad_same_bias_COS_pointwise2_16to4_bias_COS_AddInputToOutput
          .pointDepthPoint_create(  true ),

      this.pointDepthPoint_DConv_2_COS_AddInputToOutput
        = testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS_AddInputToOutput
          .pointDepthPoint_create(  true ),

      this.pointDepthPoint_DConv_2_COS
        = testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS
          .pointDepthPoint_create(  true ),

      this.pointDepthPoint_DConv_32_bias_COS_P128_bias
        = testCase_pointwise1_none_depthwise_4to128_strides_1_pad_same_bias_COS_pointwise2_128to128_bias
          .pointDepthPoint_create(  true ),

      this.pointDepthPoint_P128_bias_COS_P128_bias
        = testCase_pointwise1_4to128_bias_COS_depthwise_none_COS_pointwise2_128to128_bias
          .pointDepthPoint_create(  true ),

    ];

  }

  pointDepthPoint_PerformanceTest_release() {
    if ( this.pointDepthPoint_list ) {
      for ( let i = 0; i < this.pointDepthPoint_list.length; ++i ) {
        let pointDepthPoint = this.pointDepthPoint_list[ i ];
        pointDepthPoint.disposeTensors();
      }
      this.pointDepthPoint_list = this.pointDepthPoint_DConv = null;
    }
  }

//!!! ...unfinished...
  // Test apply by depthwise convolution.
  test_DConv_1_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.pointDepthPoint_DConv_1_bias_COS_AddInputToOutput.apply_and_destroy_or_keep( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_Avg_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.pointDepthPoint_Avg_bias_COS_AddInputToOutput.apply_and_destroy_or_keep( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_Max_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.pointDepthPoint_Max_bias_COS_AddInputToOutput.apply_and_destroy_or_keep( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_2_bias_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.pointDepthPoint_DConv_2_bias_COS_AddInputToOutput.apply_and_destroy_or_keep( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_2_COS_AddInputToOutput() {
    let outputTensor3dArray = [];
    this.pointDepthPoint_DConv_2_COS_AddInputToOutput.apply_and_destroy_or_keep( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_2_COS() {
    let outputTensor3dArray = [];
    this.pointDepthPoint_DConv_2_COS.apply_and_destroy_or_keep( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_DConv_32_bias_COS_P128_bias() {
    let outputTensor3dArray = [];
    this.pointDepthPoint_DConv_32_bias_COS_P128_bias.apply_and_destroy_or_keep( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_P128_bias_COS_P128_bias() {
    let outputTensor3dArray = [];
    this.pointDepthPoint_P128_bias_COS_P128_bias.apply_and_destroy_or_keep( this.dataTensor3dArray, outputTensor3dArray );
    tf.dispose( outputTensor3dArray );
  }

  test_ValueRange_valueInputOutputGenerator() {

    // Test ValueRange.Bool().valueInputOutputGenerator().
    {
      let paramDesc = PointDepthPoint.Params.bPointwise1Bias;

      for ( let offsetMultiplier = -100; offsetMultiplier <= +100; ++offsetMultiplier ) {
        for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( offsetMultiplier ) ) {
          let adjustedInput = paramDesc.valueDesc.range.adjust( pair.valueInput )

          tf.util.assert( adjustedInput == pair.valueOutput,
            `ValueRange.Bool().valueInputOutputGenerator( ${offsetMultiplier} ): `
              + `this.adjust( ${pair.valueInput} ) return ( ${adjustedInput} ) should be ( ${pair.valueOutput} ).` );
        }
      }
    }

    // Test ValueRange.Int().valueInputOutputGenerator().
    {
      let paramDesc = PointDepthPoint.Params.pointwise21ChannelCount;

      for ( let offsetMultiplier = -10; offsetMultiplier <= +10; ++offsetMultiplier ) {
        for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( offsetMultiplier ) ) {
          let adjustedInput = paramDesc.valueDesc.range.adjust( pair.valueInput )

          tf.util.assert( adjustedInput == pair.valueOutput,
            `ValueRange.Int( ${paramDesc.min}, ${paramDesc.max} ).valueInputOutputGenerator( ${offsetMultiplier} ): `
              + `this.adjust( ${pair.valueInput} ) return ( ${adjustedInput} ) should be ( ${pair.valueOutput} ).` );
        }
      }
    }
  }

  // Testing whether the results of different implementation are the same.
  testCorrectness() {
    this.test_ValueRange_valueInputOutputGenerator();

    tf.tidy( () => {
      // Note: imageSourceBag should not be created outside tidy() because tidy() will dispose tensors dynamically created in imageSourceBag.
      let originalImageSize = { height: 3, width: 5, depth: 4 };
      let imageSourceBag = new PointDepthPoint_Reference.ImageSourceBag( originalImageSize.height, originalImageSize.width );

      let testParamsBase = new PointDepthPoint_TestParams.Base( originalImageSize.depth );
      let testParamsGenerator = testParamsBase.ParamsGenerator();

      let batchMessageInterval = 100 * 1000; // Every so many test cases, display a message.
      for ( let testParams of testParamsGenerator ) {
        if ( ( testParams.id % batchMessageInterval ) == 0 )
          console.log( `${tf.getBackend()}, testParams.id between [${testParams.id} - ${testParams.id + batchMessageInterval - 1}] ...` );

        let testCase = new PointDepthPoint_Reference.Base( testParams );
        testCase.testCorrectness( imageSourceBag );
      }

      imageSourceBag.disposeTensors();
    });

    // After correctness testing done, create all PointDepthPoint for performance testing.
    this.pointDepthPoint_PerformanceTest_init();
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
  //console.log("jsPerf_PointDepthPoint.js, init()");

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
