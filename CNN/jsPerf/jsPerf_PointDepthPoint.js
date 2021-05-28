export { init, testCorrectness, testDifferentDisposeStrategy_All, disposeTensors };

import * as ValueMax from "../ValueMax.js";
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

    this.concatenatedShape = [ height, width, depth ];

    // pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    // depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    // pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    // pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId,
    // inputTensorCount,
    //

    this.testCorrectness_ImageDataArray = [
      // testCorrectness_ImageDataArray[ 0 ]
      {
        height: 3, width: 5, depth: 4,
        dataArray: [
          111, 112, 113, 114,  121, 122, 123, 124,  131, 132, 133, 134,  141, 142, 143, 144,  151, 152, 153, 154,
          211, 212, 213, 214,  221, 222, 223, 224,  231, 232, 233, 234,  241, 242, 243, 244,  251, 252, 253, 254,
          311, 312, 313, 314,  321, 322, 323, 324,  331, 332, 333, 334,  341, 342, 343, 344,  351, 352, 353, 354,
        ]
      },

      // testCorrectness_ImageDataArray[ 1 ]
      {
        height: 3, width: 5, depth: 5,
        dataArray: [
          111, 112, 113, 114, 115,  121, 122, 123, 124, 125,  131, 132, 133, 134, 135,  141, 142, 143, 144, 145,  151, 152, 153, 154, 155,
          211, 212, 213, 214, 215,  221, 222, 223, 224, 225,  231, 232, 233, 234, 235,  241, 242, 243, 244, 245,  251, 252, 253, 254, 255,
          311, 312, 313, 314, 315,  321, 322, 323, 324, 325,  331, 332, 333, 334, 335,  341, 342, 343, 344, 345,  351, 352, 353, 354, 355,
        ]
      },
    ];

//!!! ...unfinished... (2021/05/27) Old Codes. should be remarked.
/*
    let testCase_depthwise_avg_strides_1_pad_valid, testCase_depthwise_avg_strides_1_pad_same, testCase_depthwise_avg_strides_2_pad_same;
    let testCase_depthwise_max_strides_1_pad_valid, testCase_depthwise_max_strides_1_pad_same, testCase_depthwise_max_strides_2_pad_same;
    let testCase_pointwise1_depthwise_2_strides_1_pad_same_pointwise2_AddInputToOutput;
    let testCase_depthwise_1_strides_1_pad_valid;
    let testCase_depthwise_1_strides_1_pad_same;
    let testCase_depthwise_1_strides_1_pad_same_AddInputToOutput;
    let testCase_depthwise_2_strides_2_pad_same;
    let testCase_pointwise1_4_to_1_noBias;
    let testCase_pointwise1_4_to_2_noBias;
    let testCase_pointwise1_4_to_2_bias_activation;
    let testCase_pointwise1_depthwise_2_strides_1_pad_valid_pointwise2;

    this.testCases = [
      // Test Case 0: depthwise (channelMultiplier = avg pooling, strides = 1, pad = valid)
      testCase_depthwise_avg_strides_1_pad_valid =
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG - 0.6,  3.1, 3.1,   0.2, 0 + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.1 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG,    3,   0, false, 0,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        // pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray,
        // pointwise21FiltersArray, pointwise21BiasesArray, pointwise22FiltersArray, pointwise22BiasesArray
        [], [], [], [], [], [], [], [],

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 1: depthwise (channelMultiplier = avg pooling, strides = 1, pad = same)
      testCase_depthwise_avg_strides_1_pad_same =
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG - 0.6,  3.1, 4.1,   0.2, 0 + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          7.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG,    3,   1, false, 0,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        // pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray,
        // pointwise21FiltersArray, pointwise21BiasesArray, pointwise22FiltersArray, pointwise22BiasesArray
        [], [], [], [], [], [], [], [],

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 2: depthwise (channelMultiplier = avg pooling, strides = 2, pad = same)
      testCase_depthwise_avg_strides_2_pad_same =
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG - 0.6,  3.1, 5.1,   0.2, 0 + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG,    3,   2, false, 0,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        // pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray,
        // pointwise21FiltersArray, pointwise21BiasesArray, pointwise22FiltersArray, pointwise22BiasesArray
        [], [], [], [], [], [], [], [],

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 3: depthwise (channelMultiplier = max pooling, strides = 1, pad = valid)
      testCase_depthwise_max_strides_1_pad_valid =
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX - 0.6,  3.1, 3.1,   0.2, 0 + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,    3,   0, false, 0,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        // pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray,
        // pointwise21FiltersArray, pointwise21BiasesArray, pointwise22FiltersArray, pointwise22BiasesArray
        [], [], [], [], [], [], [], [],

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 4: depthwise (channelMultiplier = max pooling, strides = 1, pad = same)
      testCase_depthwise_max_strides_1_pad_same =
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX - 0.6,  3.1, 4.1,   0.2, 0 + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,    3,   1, false, 0,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        // pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray,
        // pointwise21FiltersArray, pointwise21BiasesArray, pointwise22FiltersArray, pointwise22BiasesArray
        [], [], [], [], [], [], [], [],

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 5: depthwise (channelMultiplier = max pooling, strides = 2, pad = same)
      testCase_depthwise_max_strides_2_pad_same =
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX - 0.6,  3.1, 5.1,   0.2, 0 + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,    3,   2, false, 0,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        // pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray,
        // pointwise21FiltersArray, pointwise21BiasesArray, pointwise22FiltersArray, pointwise22BiasesArray
        [], [], [], [], [], [], [], [],

        this.testCorrectness_ImageDataArray   // imageIn
      ),

//!!! ...unfinished...
//!!! (2021/04/08) Temp for testing Tensorflow.js bug (When in "webgl" backend and image width is odd, the second run of tf.conv2d() may be wrong.)
      // Test Case 6 (pointwise1, depthwise (channelMultiplier = 2, strides = 1, pad = same), pointwise2)
      new PointDepthPoint_Reference.TestCase(
        [ 2.1,   0.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE + 0.1,
          0.1,   3.1, 4.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,   5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.NONE + 0.3,
          0.2,   5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.NONE + 0.3,
          4.4 ], // paramsInArray

        [   2, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,
            0,     3,   1, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.NONE,
            0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.NONE,
            1 ], // paramsOutArray

        // pointwise1FiltersArray
        [
          -1,  3,
           2,  1,
           3,  4,
           4, -2,
        ],

        // pointwise1BiasesArray
        [
//           3, -4
        ],

        // depthwiseFiltersArray
        // (If value too large (out of float32 range), the result will strange. So, use smaller and negative value.)
        [
//            1, -9, -5,  7,
//            2,  8,  4,  1,
//           -3,  7, -6,  9,
//
//            4, -6,  8, -2,
//            5,  5, -7, -3,
//            6,  4,  9,  5,
//
//            7,  3, -3,  4,
//           -8,  2,  1, -8,
//           -9,  1, -2,  6,
        ],

        // depthwiseBiasesArray
        [], //[ 101, 102, 103, 104 ],

        // pointwise21FiltersArray
        // (Some negative so that the result will not too large (out of float32 range). Otherwise, the result will strange.)
        [
//            1,  5,  9,  3,
//            2,  6,  0,  4,
//            3,  7,  1,  5,
//            4,  8,  2,  6,
        ],

        // pointwise22BiasesArray
        [
//           201, 202, 203, 204
        ],

        // pointwise22FiltersArray, pointwise22BiasesArray
        [], [],

        // imageIn
        this.testCorrectness_ImageDataArray
      ),

      // Test Case 7 (pointwise1, depthwise (channelMultiplier = 2, strides = 1, pad = same), pointwise2, AddInputToOutput)
      testCase_pointwise1_depthwise_2_strides_1_pad_same_pointwise2_AddInputToOutput =
      new PointDepthPoint_Reference.TestCase(
        [ 2.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE + 0.1,
          2.1,  3.1, 4.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          4.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.NONE + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.NONE + 0.3,
          0.4 ], // paramsInArray

        [   2, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,
            2,    3,   1, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            4, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.NONE,
            0 ], // paramsOutArray

        // pointwise1FiltersArray
        [
          -1,  3,
           2,  1,
           3,  4,
           4, -2,
        ],

        // pointwise1BiasesArray
        [ 3, -4 ],

        // depthwiseFiltersArray
        // (If value too large (out of float32 range), the result will strange. So, use smaller and negative value.)
        [
           1, -9, -5,  7,
           2,  8,  4,  1,
          -3,  7, -6,  9,

           4, -6,  8, -2,
           5,  5, -7, -3,
           6,  4,  9,  5,

           7,  3, -3,  4,
          -8,  2,  1, -8,
          -9,  1, -2,  6,
        ],

        // depthwiseBiasesArray
        [ 101, 102, 103, 104 ],

        // pointwise21FiltersArray
        // (Some negative so that the result will not too large (out of float32 range). Otherwise, the result will strange.)
        [
           1,  5,  9,  3,
           2,  6,  0,  4,
           3,  7,  1,  5,
           4,  8,  2,  6,
        ],

        // pointwise21BiasesArray
        [ 201, 202, 203, 204 ],

        // pointwise22FiltersArray, pointwise22BiasesArray
        [], [],

        // imageIn
        this.testCorrectness_ImageDataArray
      ),

      // Test Case 8: depthwise (channelMultiplier = 1, strides = 1, pad = valid)
      testCase_depthwise_1_strides_1_pad_valid =
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          1.1,  3.1, 3.1,   0.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            1,    3,   0, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        [], [], // pointwise1FiltersArray, pointwise1BiasesArray

        // depthwiseFiltersArray
        [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 0, 0,

          0, 0, 1, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,

          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 1,
        ],

        [], [], [], // depthwiseBiasesArray, pointwise21FiltersArray, pointwise21BiasesArray
        [], [],     // pointwise22FiltersArray, pointwise22BiasesArray

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 9: depthwise (channelMultiplier = 1, strides = 1, pad = same)
      testCase_depthwise_1_strides_1_pad_same =
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          1.1,  3.1, 4.1,   0.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            1,    3,   1, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        [], [], // pointwise1FiltersArray, pointwise1BiasesArray

        // depthwiseFiltersArray
        [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 0, 0,

          0, 0, 1, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,

          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 1,
        ],

        [], [], [], // depthwiseBiasesArray, pointwise21FiltersArray, pointwise21BiasesArray
        [], [],     // pointwise22FiltersArray, pointwise22BiasesArray

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 10: depthwise (channelMultiplier = 1, strides = 1, pad = same, AddInputToOutput)
      testCase_depthwise_1_strides_1_pad_same_AddInputToOutput = 
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          1.1,  3.1, 4.1,   0.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          3.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            1,    3,   1, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            0 ], // paramsOutArray

        [], [], // pointwise1FiltersArray, pointwise1BiasesArray

        // depthwiseFiltersArray
        [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 0, 0,

          0, 0, 1, 0,
          0, 0, 0, 0,
          0, 0, 0, 0,

          0, 0, 0, 0,
          0, 0, 0, 0,
          0, 0, 0, 1,
        ],

        [], [], [], // depthwiseBiasesArray, pointwise21FiltersArray, pointwise21BiasesArray
        [], [],     // pointwise22FiltersArray, pointwise22BiasesArray

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 11: depthwise (channelMultiplier = 2, strides = 2, pad = same)
      testCase_depthwise_2_strides_2_pad_same =
      new PointDepthPoint_Reference.TestCase(
        [ 0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          2.1,  3.1, 5.1,   0.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            2,    3,   2, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        [], [], // pointwise1FiltersArray, pointwise1BiasesArray

        // depthwiseFiltersArray
        [
          1, 0, 0, 0, 0, 0, 0, 0, 
          0, 1, 0, 0, 0, 0, 0, 0, 
          0, 0, 0, 0, 0, 0, 0, 0, 

          0, 0, 1, 0, 0, 0, 0, 0, 
          0, 0, 0, 0, 1, 0, 0, 0, 
          0, 0, 0, 0, 0, 1, 0, 0, 

          0, 0, 0, 0, 0, 0, 1, 0, 
          0, 0, 0, 0, 0, 0, 0, 0, 
          0, 0, 0, 1, 0, 0, 0, 0, 
        ],

        [], [], [], // depthwiseBiasesArray, pointwise21FiltersArray, pointwise21BiasesArray
        [], [],     // pointwise22FiltersArray, pointwise22BiasesArray

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 12: pointwise1 (4-to-1 channel, no bias)
      testCase_pointwise1_4_to_1_noBias =
      new PointDepthPoint_Reference.TestCase(
        [ 1.1,   0.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE + 0.1,
          0.1,   3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
          0.2,   5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,   5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   1, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,
            0,     3,  0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            0,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        // pointwise1FiltersArray
        [
          1,
          0,
          0,
          0,
        ],

        [],             // pointwise1BiasesArray
        [], [], [], [], // depthwiseFiltersArray, depthwiseBiasesArray, pointwise21FiltersArray, pointwise21BiasesArray
        [], [],         // pointwise22FiltersArray, pointwise22BiasesArray

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 13: pointwise1 (4-to-2 channel, no bias)
      testCase_pointwise1_4_to_2_noBias =
      new PointDepthPoint_Reference.TestCase(
        [ 2.1,   0.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE + 0.1,
          0.1,   3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
          0.2,   5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,   5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   2, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,
            0,     3,  0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            0,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        // pointwise1FiltersArray
        [
          1, 0,
          0, 0,
          0, 1,
          0, 0
        ],

        [],             // pointwise1BiasesArray
        [], [], [], [], // depthwiseFiltersArray, depthwiseBiasesArray, pointwise21FiltersArray, pointwise21BiasesArray
        [], [],         // pointwise22FiltersArray, pointwise22BiasesArray

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 14: pointwise1 (4-to-2 channel, bias, activation)
      testCase_pointwise1_4_to_2_bias_activation =
      new PointDepthPoint_Reference.TestCase(
        [ 2.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          0.1,  3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN + 0.3,
          0.2,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN + 0.3,
          4.4 ], // paramsInArray

        [   2, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            0,    3,  0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            0, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.SIN,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.SIN,
            1 ], // paramsOutArray

        // pointwise1FiltersArray
        [
          11, 21,
          12, 22,
          13, 23,
          14, 24,
        ],

        // pointwise1BiasesArray
        [ 3, 4 ],

        [], [], [], [], // depthwiseFiltersArray, depthwiseBiasesArray, pointwise21FiltersArray, pointwise21BiasesArray
        [], [],         // pointwise22FiltersArray, pointwise22BiasesArray

        this.testCorrectness_ImageDataArray   // imageIn
      ),

      // Test Case 15: (pointwise1, depthwise (channelMultiplier = 2, strides = 1, pad = valid), pointwise2)
      testCase_pointwise1_depthwise_2_strides_1_pad_valid_pointwise2 =
      new PointDepthPoint_Reference.TestCase(
        [ 2.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.RELU + 0.1,
          2.1,  3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
            8,  5.3, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.RELU + 0.3,
          0.3,  5.3, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.RELU + 0.3,
          4.4 ], // paramsInArray

        [   2, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.RELU,
            2,    3,   0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            8, true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.RELU,
            0, true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.RELU,
            1 ], // paramsOutArray

        // pointwise1FiltersArray
        [
           1,  4,
           2,  3,
          -3, -2,
           4,  1,
        ],

        // pointwise1BiasesArray
        [ 3, 4 ],

        // depthwiseFiltersArray
        // (If value too large (out of float32 range), the result will strange. So, use smaller and negative value.)
        [
           1, -9, -5,  7,
           2,  8,  4,  1,
          -3,  7, -6,  9,

           4, -6,  8, -2,
           5,  5, -7, -3,
           6,  4,  9,  5,

           7,  3, -3,  4,
          -8,  2,  1, -8,
          -9,  1, -2,  6,
        ],

        // depthwiseBiasesArray
        [ 101, 102, 103, 104 ],

        // pointwise21FiltersArray
        [
          11, 21, 31, 41,
          12, 22, 32, 42,
          13, 23, 33, 43,
          14, 24, 34, 44,
          15, 25, 35, 45,
          16, 26, 36, 46,
          17, 27, 37, 47,
          18, 28, 38, 48,
        ],

        // pointwise21BiasesArray
        [ 201, 202, 203, 204, 205, 206, 207, 208 ],

        [], [],         // pointwise22FiltersArray, pointwise22BiasesArray

        // imageIn
        this.testCorrectness_ImageDataArray
      ),
    ];
*/
    // Small input image for correctness testing.
    this.dataTensor3dArray = tf.tidy( () => {
      let dataTensor3dArray = new Array( this.testCorrectness_ImageDataArray.length );
      for ( let i = 0; i < this.testCorrectness_ImageDataArray.length; ++i ) {
        let testImageData = this.testCorrectness_ImageDataArray[ i ];
        let shape = [ testImageData.height, testImageData.width, testImageData.depth ];
        let dataTensor3d = tf.tensor3d( testImageData.dataArray, shape );
        dataTensor3dArray[ i ] = dataTensor3d;
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

    // pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    // depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    // pointwise21ChannelCount, bPointwise21Bias, pointwise21ActivationId,
    // pointwise22ChannelCount, bPointwise22Bias, pointwise22ActivationId,
    // inputTensorCount,
    //

//!!! ...unfinished... (2021/05/27)

    // Test Case: (pointwise1 (bias, COS), depthwise (channelMultiplier = 1, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_8to8_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set( this.depth,
          8,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          1,     3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
          0,

//!!! (2021/05/27 Remarked)
//       pointwise_4to8_FiltersArray, pointwise_4to8_BiasesArray,
//       depthwise_8to8_FiltersArray, depthwise_8to8_BiasesArray,
//       pointwise_8to4_FiltersArray, pointwise_Xto4_BiasesArray,
//       [], [],     // pointwise22FiltersArray, pointwise22BiasesArray
//       this.testPerformance_ImageDataArray
    ) );

    // Test Case: (pointwise1 (bias, COS), depthwise (avg pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_avg_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set( this.depth,
          8,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
        PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.AVG,
                 3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
          0,

//!!! (2021/05/27 Remarked)
//       pointwise_4to8_FiltersArray, pointwise_4to8_BiasesArray,
//       [] /* depthwise_8to8_FiltersArray */, depthwise_8to8_BiasesArray,
//       pointwise_8to4_FiltersArray, pointwise_Xto4_BiasesArray,
//       [], [],     // pointwise22FiltersArray, pointwise22BiasesArray
//       this.testPerformance_ImageDataArray
    ) );

    // Test Case: (pointwise1 (bias, COS), depthwise (max pooling, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_max_strides_1_pad_same_bias_COS_pointwise2_8to4_bias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set( this.depth,
          8,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
        PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,
                 3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
          0,

//!!! (2021/05/27 Remarked)
//       pointwise_4to8_FiltersArray, pointwise_4to8_BiasesArray,
//       [] /* depthwise_8to8_FiltersArray */, depthwise_8to8_BiasesArray,
//       pointwise_8to4_FiltersArray, pointwise_Xto4_BiasesArray,
//       [], [],     // pointwise22FiltersArray, pointwise22BiasesArray
//       this.testPerformance_ImageDataArray
    ) );

    // Test Case: (pointwise1 (bias, COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, bias, COS), pointwise2 (bias, COS), AddInputToOutput)
    let testCase_pointwise1_4to8_bias_COS_depthwise_8to16_strides_1_pad_same_bias_COS_pointwise2_16to4_bias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set( this.depth,
          8,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          2,     3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
          0,

//!!! (2021/05/27 Remarked)
//       pointwise_4to8_FiltersArray, pointwise_4to8_BiasesArray,
//       depthwise_8to16_FiltersArray, depthwise_8to16_BiasesArray,
//       pointwise_16to4_FiltersArray, pointwise_Xto4_BiasesArray,
//       [], [],     // pointwise22FiltersArray, pointwise22BiasesArray
//       this.testPerformance_ImageDataArray
    ) );

    // Test Case: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS), AddInputToOutput)
    let testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS_AddInputToOutput =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set( this.depth,
          8, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          2,     3,   1, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4, false, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0, false, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
          0,

//!!! (2021/05/27 Remarked)
//       pointwise_4to8_FiltersArray,  [], //pointwise_4to8_BiasesArray,
//       depthwise_8to16_FiltersArray, [], //depthwise_8to16_BiasesArray,
//       pointwise_16to4_FiltersArray, [], //pointwise_Xto4_BiasesArray,
//       [], [],     // pointwise22FiltersArray, pointwise22BiasesArray
//       this.testPerformance_ImageDataArray
    ) );

    // Test Case: (pointwise1 (COS), depthwise (channelMultiplier = 2, strides = 1, pad = same, COS), pointwise2 (COS))
    let testCase_pointwise1_4to8_noBias_COS_depthwise_8to16_strides_1_pad_same_noBias_COS_pointwise2_16to4_noBias_COS =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set( this.depth,
          8, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          2,     3,   1, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          4, false, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.COS,
          0, false, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.COS,
          1,

//!!! (2021/05/27 Remarked)
//       pointwise_4to8_FiltersArray,  [], //pointwise_4to8_BiasesArray,
//       depthwise_8to16_FiltersArray, [], //depthwise_8to16_BiasesArray,
//       pointwise_16to4_FiltersArray, [], //pointwise_Xto4_BiasesArray,
//       [], [],     // pointwise22FiltersArray, pointwise22BiasesArray
//       this.testPerformance_ImageDataArray
    ) );

    // Test Case: (pointwise1 (none), depthwise (channelMultiplier = 32, strides = 1, pad = same, bias, COS), pointwise2 (bias))
    let testCase_pointwise1_none_depthwise_4to128_strides_1_pad_same_bias_COS_pointwise2_128to128_bias =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set( this.depth,
            0,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
           32,     3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          128,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.NONE,
            0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.NONE,
            1,

//!!! (2021/05/27 Remarked)
//       [], [], //pointwise_4to8_FiltersArray, pointwise_4to8_BiasesArray,
//       depthwise_4to128_FiltersArray, depthwise_Xto128_BiasesArray,
//       pointwise_128to128_FiltersArray, pointwise_Xto128_BiasesArray,
//       [], [],     // pointwise22FiltersArray, pointwise22BiasesArray
//       this.testPerformance_ImageDataArray
    ) );

    // Test Case: (pointwise1 (bias, COS), depthwise (none), pointwise2 (bias))
    let testCase_pointwise1_4to128_bias_COS_depthwise_none_COS_pointwise2_128to128_bias =
    new PointDepthPoint_Reference.Base( new PointDepthPoint_TestParams.TestParams().set( this.depth,
          128,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            0,     3,   1,  true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.COS,
          128,  true, PointDepthPoint.Params.pointwise21ActivationId.valueDesc.Ids.NONE,
            0,  true, PointDepthPoint.Params.pointwise22ActivationId.valueDesc.Ids.NONE,
            1,

//!!! (2021/05/27 Remarked)
//       pointwise_4to128_FiltersArray, pointwise_Xto128_BiasesArray,
//       [], [], //depthwise_4to128_FiltersArray, depthwise_Xto128_BiasesArray,
//       pointwise_128to128_FiltersArray, pointwise_Xto128_BiasesArray,
//       [], [],     // pointwise22FiltersArray, pointwise22BiasesArray
//       this.testPerformance_ImageDataArray
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

  // Testing whether the results of different implementation are the same.
  testCorrectness() {

    let testParamsBase = new PointDepthPoint_TestParams.Base( this.depth );
    let testParamsGenerator = testParamsBase.ParamsGenerator();

//!!! ...unfinished... (2021/05/27)
    for ( let testParams of testParamsGenerator ) {
      let testCase = new PointDepthPoint_Reference.Base( testParams );
      testCase.testCorrectness( this.testCorrectness_ImageDataArray, this.dataTensor3dArray );
    }

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
