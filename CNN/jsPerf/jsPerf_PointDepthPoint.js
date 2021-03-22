export { init, testCorrectness, testDifferentDisposeStrategy_All, disposeTensors };

import * as ValueMax from "../ValueMax.js";
//import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";
//import * as TensorTools from "../util/TensorTools.js";
import * as PointDepthPoint_Reference from "./PointDepthPoint_Reference.js";


/**
 * Test CNN PointDepthPoint.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/11973/109/colorfulcakechen-cnn-pointdepthpoint-b3e198b4ad26e0ff3e}
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

//!!! ...unfinished...

    // pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationId,
    // depthwise_AvgMax_Or_ChannelMultiplier, depthwiseFilterHeight, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationId,
    // pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationId,
    // bAddInputToOutput,
    //

    let testImageData = {
      height: 3, width: 5, depth: 4,
      dataArray: [
        111, 112, 113, 114,  121, 122, 123, 124,  131, 132, 133, 134,  141, 142, 143, 144,  151, 152, 153, 154,
        211, 212, 213, 214,  221, 222, 223, 224,  231, 232, 233, 234,  241, 242, 243, 244,  251, 252, 253, 254,
        311, 312, 313, 314,  321, 322, 323, 324,  331, 332, 333, 334,  341, 342, 343, 344,  351, 352, 353, 354,
      ]
    };

    this.testCases = [
      // Test Case 0: depthwise (channelMultiplier = max pooling, strides = 1, pad = valid)
      new PointDepthPoint_Reference.TestCase(
        [
          0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX + 0.6,  3.1, 3.1,   0.2, 0 + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   6.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,    3,   0, false, 0,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       false ], // paramsOutArray

        // pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray        
        [], [], [], [], [], [],

        testImageData   // imageIn
      ),

      // Test Case 1: depthwise (channelMultiplier = max pooling, strides = 1, pad = same)
      new PointDepthPoint_Reference.TestCase(
        [
          0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX + 0.6,  3.1, 4.1,   0.2, 0 + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   6.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,    3,   1, false, 0,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       false ], // paramsOutArray

        // pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray        
        [], [], [], [], [], [],

        testImageData   // imageIn
      ),

      // Test Case 2: depthwise (channelMultiplier = max pooling, strides = 2, pad = same)
      new PointDepthPoint_Reference.TestCase(
        [
          0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX + 0.6,  3.1, 4.1,   0.2, 0 + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   6.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
          PointDepthPoint.Params.depthwise_AvgMax_Or_ChannelMultiplier.valueDesc.Ids.MAX,    3,   2, false, 0,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       false ], // paramsOutArray

        // pointwise1FiltersArray, pointwise1BiasesArray, depthwiseFiltersArray, depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray        
        [], [], [], [], [], [],

        testImageData   // imageIn
      ),

      // Test Case 3 (pointwise1, depthwise (channelMultiplier = 2, strides = 1, pad = same), pointwise2)
      new PointDepthPoint_Reference.TestCase(
        [
          2.1,   0.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE + 0.1,
          0.1,   3.1, 4.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,   5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.NONE + 0.3,  6.4 ], // paramsInArray

        [   2, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,
            0,     3,   1, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,      false ], // paramsOutArray

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

        // pointwise2FiltersArray
        // (Some negative so that the result will not too large (out of float32 range). Otherwise, the result will strange.)
        [
//            1,  5,  9,  3,
//            2,  6,  0,  4,
//            3,  7,  1,  5,
//            4,  8,  2,  6,
        ],

        // pointwise2BiasesArray
        [
//           201, 202, 203, 204
        ],

        // imageIn
        testImageData
      ),

      // Test Case 4 (pointwise1, depthwise (channelMultiplier = 2, strides = 1, pad = same), pointwise2, AddInputToOutput)
      new PointDepthPoint_Reference.TestCase(
        [
          2.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE + 0.1,
          2.1,  3.1, 4.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          4.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.NONE + 0.3,  7.4 ], // paramsInArray

        [   2, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,
            2,    3,   1, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            4, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,       true ], // paramsOutArray

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

        // pointwise2FiltersArray
        // (Some negative so that the result will not too large (out of float32 range). Otherwise, the result will strange.)
        [
           1,  5,  9,  3,
           2,  6,  0,  4,
           3,  7,  1,  5,
           4,  8,  2,  6,
        ],

        // pointwise2BiasesArray
        [ 201, 202, 203, 204 ],

        // imageIn
        testImageData
      ),

      // Test Case 5: depthwise (channelMultiplier = 1, strides = 1, pad = valid)
      new PointDepthPoint_Reference.TestCase(
        [
          0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          1.1,  3.1, 3.1,   0.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   6.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            1,    3,   0, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       false ], // paramsOutArray

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

        [], [], [], // depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray

        testImageData   // imageIn
      ),

      // Test Case 6: depthwise (channelMultiplier = 1, strides = 1, pad = same)
      new PointDepthPoint_Reference.TestCase(
        [
          0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          1.1,  3.1, 4.1,   0.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   6.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            1,    3,   1, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       false ], // paramsOutArray

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

        [], [], [], // depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray

        testImageData   // imageIn
      ),

      // Test Case 7: depthwise (channelMultiplier = 1, strides = 1, pad = same, AddInputToOutput)
      new PointDepthPoint_Reference.TestCase(
        [
          0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          1.1,  3.1, 4.1,   0.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   5.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            1,    3,   1, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,        true ], // paramsOutArray

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

        [], [], [], // depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray

        testImageData   // imageIn
      ),

      // Test Case 8: depthwise (channelMultiplier = 2, strides = 2, pad = same)
      new PointDepthPoint_Reference.TestCase(
        [
          0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          2.1,  3.1, 5.1,   0.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   4.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            2,    3,   2, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       false ], // paramsOutArray

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

        [], [], [], // depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray

        testImageData   // imageIn
      ),

      // Test Case 9: pointwise1 (4-to-1 channel, no bias)
      new PointDepthPoint_Reference.TestCase(
        [
          1.1,   0.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE + 0.1,
          0.1,   3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
          0.2,   5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   6.4 ], // paramsInArray

        [   1, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,
            0,     3,  0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            0,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       false ], // paramsOutArray

        // pointwise1FiltersArray
        [
          1,
          0,
          0,
          0,
        ],

        [],             // pointwise1BiasesArray
        [], [], [], [], // depthwiseFiltersArray, depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray
        testImageData   // imageIn
      ),

      // Test Case 10: pointwise1 (4-to-2 channel, no bias)
      new PointDepthPoint_Reference.TestCase(
        [
          2.1,   0.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE + 0.1,
          0.1,   3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
          0.2,   5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   6.4 ], // paramsInArray

        [   2, false, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,
            0,     3,  0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            0,  true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       false ], // paramsOutArray

        // pointwise1FiltersArray
        [
          1, 0,
          0, 0,
          0, 1,
          0, 0
        ],

        [],             // pointwise1BiasesArray
        [], [], [], [], // depthwiseFiltersArray, depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray
        testImageData   // imageIn
      ),

      // Test Case 11: pointwise1 (4-to-2 channel, bias, activation)
      new PointDepthPoint_Reference.TestCase(
        [
          2.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          0.1,  3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,   6.4 ], // paramsInArray

        [   2, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            0,    3,  0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       false ], // paramsOutArray

        // pointwise1FiltersArray
        [
          11, 21,
          12, 22,
          13, 23,
          14, 24,
        ],

        // pointwise1BiasesArray
        [ 3, 4 ],

        [], [], [], [], // depthwiseFiltersArray, depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray
        testImageData   // imageIn
      ),

      // Test Case 12: (pointwise1, depthwise (channelMultiplier = 2, strides = 1, pad = valid), pointwise2)
      new PointDepthPoint_Reference.TestCase(
        [
          2.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.RELU + 0.1,
          2.1,  3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
            8,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.RELU + 0.3,   6.4 ], // paramsInArray

        [   2, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.RELU,
            2,    3,   0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            8, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.RELU,       false ], // paramsOutArray

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

        // pointwise2FiltersArray
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

        // pointwise2BiasesArray
        [ 201, 202, 203, 204, 205, 206, 207, 208 ],

        // imageIn
        testImageData
      ),
    ];

    this.dataTensor3d = tf.tidy( () => {
      let shape = [ testImageData.height, testImageData.width, testImageData.depth ];
      let dataTensor3d = tf.tensor3d( testImageData.dataArray, shape );
      return dataTensor3d;
    });

  }

  disposeTensors() {
    if ( this.dataTensor3d ) {
      this.dataTensor3d.dispose();
      this.dataTensor3d = null;
    }

    this.pointDepthPoint_PerformanceTest_release();
  }

  pointDepthPoint_PerformanceTest_init() {
    this.pointDepthPoint_PerformanceTest_release();

//!!! ...unfinished...

    // Different pointDepthPoint objects.
    //
    // ( bKeepInputTensor )
    this.pointDepthPoint_list = [

//!!! ...unfinished... (2021/03/17) Use different test case for performance testing.
      this.testCases[ 0 ].pointDepthPoint_create( false ),
      // The pointDepthPoint for performance testing should:
      //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
      this.pointDepthPoint_DConv =
      this.testCases[ 0 ].pointDepthPoint_create(  true ),
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

  /**
   * Check the PointDepthPoint's output according to input.
   *
   * @param {number} testCaseIndex
   *   The index of array this.testCases[].
   *
   * @param {PointDepthPoint.Base} pointDepthPoint
   *   The object which implemets PointDepthPoint logic.
   *
   * @param {tf.tensor3d} inputTensor3d
   *   The input of the PointDepthPoint's apply_and_destroy_or_keep().
   *
   * @param {tf.tensor3d} outputTensor3d
   *   The output of the PointDepthPoint's apply_and_destroy_or_keep().
   */
  check_Input_Output_WeightsTable( testCaseIndex, pointDepthPoint, inputTensor3d, outputTensor3d ) {
    tf.tidy( () => {

      let parametersDescription = pointDepthPoint.parametersDescription;
      let strNote = `( testCaseIndex=${testCaseIndex}, ${parametersDescription} )`;

      let testCase = this.testCases[ testCaseIndex ];
      let imageOutRef = testCase.calcResult();
      let outputArrayRef = imageOutRef.dataArray;

      let outputArray = outputTensor3d.dataSync();

      tf.util.assert( outputArray.length == outputArrayRef.length,
        `PointDepthPoint output length ( ${outputArray.length} ) should be ( ${outputArrayRef.length} ). ${strNote}`);

      tf.util.assert( outputArray.every( ( value, index ) => value === outputArrayRef[ index ] ),
        `PointDepthPoint output ( ${outputArray} ) should be ( ${outputArrayRef} ). ${strNote}`);
    });
  }

//!!! ...unfinished...
  // Test apply by depthwise convolution.
  test_DConv() {
    let outputTensor3d = this.pointDepthPoint_DConv.apply_and_destroy_or_keep( this.dataTensor3d );
    outputTensor3d.dispose();
  }

  // Testing whether the results of different implementation are the same.
  testCorrectness() {

    for ( let i = 0; i < this.testCases.length; ++i ) {
      let testCase = this.testCases[ i ];
      console.log( `PointDepthPoint testCaseIndex = ${i}` );

      for ( let nKeepInputTensor = 0; nKeepInputTensor < 2; ++nKeepInputTensor ) {
        let bKeepInputTensor = ( nKeepInputTensor != 0 );

        tf.tidy( () => {

          let inputTensor3d;
          let tensorNumDifference_apply_before_after;
//!!! (20210/03/19 Temp Remarked)
//           if ( bKeepInputTensor ) {
//             inputTensor3d = this.dataTensor3d;
//             tensorNumDifference_apply_before_after = 1;
//           } else {
//             inputTensor3d = this.dataTensor3d.clone(); // Otherwise, this.dataTensor3d will be destroyed. 
//             tensorNumDifference_apply_before_after = 0;
//           }

//!!! (2021/03/19 Test always clone.
          if ( bKeepInputTensor ) {
            inputTensor3d = this.dataTensor3d.clone();
            tensorNumDifference_apply_before_after = 1;
          } else {
            inputTensor3d = this.dataTensor3d.clone(); // Otherwise, this.dataTensor3d will be destroyed. 
            tensorNumDifference_apply_before_after = 0;
          }

          let memoryInfo_beforeCreate = tf.memory(); // Test memory leakage of pointDepthPoint create/dispose.
          let pointDepthPoint = testCase.pointDepthPoint_create( bKeepInputTensor );

          let memoryInfo_apply_before = tf.memory(); // Test memory leakage of pointDepthPoint apply.
          let outputTensor3d = pointDepthPoint.apply_and_destroy_or_keep( inputTensor3d );
          let memoryInfo_apply_after = tf.memory();

          tf.util.assert( memoryInfo_apply_after.numTensors == ( memoryInfo_apply_before.numTensors + tensorNumDifference_apply_before_after ),
            `PointDepthPoint.apply_and_destroy_or_keep() memory leak.`);

          // Test correctness of pointDepthPoint apply.
          this.check_Input_Output_WeightsTable( i, pointDepthPoint, this.dataTensor3d, outputTensor3d );

          pointDepthPoint.disposeTensors();
          let memoryInfo_afterDispose = tf.memory();

          tf.util.assert( memoryInfo_afterDispose.numTensors == ( memoryInfo_beforeCreate.numTensors + tensorNumDifference_apply_before_after ),
            `PointDepthPoint create/dispose memory leak.`);

          outputTensor3d.dispose();
        });
      }
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
  disposeTensors();

  let depth = 8;
  globalThis.testSet_110x120x8 = new HeightWidthDepth( 110, 120, depth ); // height, width, depth

  globalThis.testSet_110x120x8_All = [
    globalThis.testSet_110x120x8
  ];
}

function testCorrectness() {
  for ( let i = 0; i < globalThis.testSet_110x120x8_All.length; ++i ) {
    let testSet = globalThis.testSet_110x120x8_All[ i ];
    testSet.testCorrectness();
  }
}

function testDifferentDisposeStrategy_All() {
  for ( let i = 0; i < globalThis.testSet_110x120x8_All.length; ++i ) {
    let testSet = globalThis.testSet_110x120x8_All[ i ];
    testSet.testDifferentDisposeStrategy_All();
  }
}

function disposeTensors() {
  if ( globalThis.testSet_110x120x8_All ) {
    for ( let i = 0; i < globalThis.testSet_110x120x8_All.length; ++i ) {
      let testSet = globalThis.testSet_110x120x8_All[ i ];
      if ( testSet )
        testSet.disposeTensors();
    }

    globalThis.testSet_110x120x8_All = null;
  }

  globalThis.testSet_110x120x8
    = null;
}
