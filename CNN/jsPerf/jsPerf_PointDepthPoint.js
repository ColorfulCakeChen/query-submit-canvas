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
 * @see {@link https://www.measurethat.net/Benchmarks/Show/11973/1/colorfulcakechen-cnn-pointdepthpoint-27b06ac30b20e36832}
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
//        411, 412, 413, 414,  421, 422, 423, 424,  431, 432, 433, 434,
      ]
    };
    this.testCases = [
      // Test Case 0: pointwise1 (bias)
      new PointDepthPoint_Reference.TestCase(
        [
          2.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE + 0.1,
          0.1,  3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,  7.4 ], // paramsInArray

        [   2, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.NONE,
            0,    3,  0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       true ], // paramsOutArray

        // pointwise1FiltersArray
        [
          11, 12, 13, 14,
          21, 22, 23, 24,
        ],

        // pointwise1BiasesArray
        [ 3, 4 ],

        [], [], [], [], // depthwiseFiltersArray, depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray
        testImageData   // imageIn
      ),

      // Test Case 1: pointwise1 (bias, activation)
      new PointDepthPoint_Reference.TestCase(
        [
          2.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          0.1,  3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,  7.4 ], // paramsInArray

        [   2, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            0,    3,  0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       true ], // paramsOutArray

        // pointwise1FiltersArray
        [
          11, 12, 13, 14,
          21, 22, 23, 24,
        ],

        // pointwise1BiasesArray
        [ 3, 4 ],

        [], [], [], [], // depthwiseFiltersArray, depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray
        testImageData   // imageIn
      ),

      // Test Case 2: depthwise (channelMultiplier = 1)
      new PointDepthPoint_Reference.TestCase(
        [
          0.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          1.1,  3.1, 3.1,   0.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE + 0.2,
          0.2,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,  7.4 ], // paramsInArray

        [   0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            1,    3,   0, false, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.NONE,
            0, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       true ], // paramsOutArray

        [], [], // pointwise1FiltersArray, pointwise1BiasesArray

        // depthwiseFiltersArray
        [
          1111, 1112, 1121, 1122, //1131, 1132, 1141, 1142, //1151, 1152, 1161, 1162, 1171, 1172, 1181, 1182, 1191, 1192,
          1211, 1212, 1221, 1222, //1231, 1232, 1241, 1242, //1251, 1252, 1261, 1262, 1271, 1272, 1281, 1282, 1291, 1292,
          1311, 1312, 1321, 1322, //1331, 1332, 1341, 1342, //1351, 1352, 1361, 1362, 1371, 1372, 1381, 1382, 1391, 1392,

          2111, 2112, 2121, 2122, //2131, 2132, 2141, 2142, //2151, 2152, 2161, 2162, 2171, 2172, 2181, 2182, 2191, 2192,
          2211, 2212, 2221, 2222, //2231, 2232, 2241, 2242, //2251, 2252, 2261, 2262, 2271, 2272, 2281, 2282, 2291, 2292,
          2311, 2312, 2321, 2322, //2331, 2332, 2341, 2342, //2351, 2352, 2361, 2362, 2371, 2372, 2381, 2382, 2391, 2392,

          3111, 3112, 3121, 3122, //3131, 3132, 3141, 3142, //3151, 3152, 3161, 3162, 3171, 3172, 3181, 3182, 3191, 3192,
          3211, 3212, 3221, 3222, //3231, 3232, 3241, 3242, //3251, 3252, 3261, 3262, 3271, 3272, 3281, 3282, 3291, 3292,
          3311, 3312, 3321, 3322, //3331, 3332, 3341, 3342, //3351, 3352, 3361, 3362, 3371, 3372, 3381, 3382, 3391, 3392,
        ],

        [], [], [], // depthwiseBiasesArray, pointwise2FiltersArray, pointwise2BiasesArray

        testImageData   // imageIn
      ),

      // Test Case 3
      new PointDepthPoint_Reference.TestCase(
        [
          2.1,  1.1, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS + 0.1,
          2.1,  3.1, 3.1,  3.2, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU + 0.2,
            8,  5.3, PointDepthPoint.Params.pointwise2ActivationId.valueDesc.Ids.SIN + 0.3,  7.4 ], // paramsInArray

        [   2, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.COS,
            2,    3,  0, true, PointDepthPoint.Params.depthwiseActivationId.valueDesc.Ids.RELU,
            8, true, PointDepthPoint.Params.pointwise1ActivationId.valueDesc.Ids.SIN,       true ], // paramsOutArray

        // pointwise1FiltersArray
        [
          11, 12, 13, 14,
          21, 22, 23, 24,
        ],

        // pointwise1BiasesArray
        [ 3, 4 ],

        // depthwiseFiltersArray
        [
          1111, 1112, 1121, 1122, //1131, 1132, 1141, 1142, //1151, 1152, 1161, 1162, 1171, 1172, 1181, 1182, 1191, 1192,
          1211, 1212, 1221, 1222, //1231, 1232, 1241, 1242, //1251, 1252, 1261, 1262, 1271, 1272, 1281, 1282, 1291, 1292,
          1311, 1312, 1321, 1322, //1331, 1332, 1341, 1342, //1351, 1352, 1361, 1362, 1371, 1372, 1381, 1382, 1391, 1392,

          2111, 2112, 2121, 2122, //2131, 2132, 2141, 2142, //2151, 2152, 2161, 2162, 2171, 2172, 2181, 2182, 2191, 2192,
          2211, 2212, 2221, 2222, //2231, 2232, 2241, 2242, //2251, 2252, 2261, 2262, 2271, 2272, 2281, 2282, 2291, 2292,
          2311, 2312, 2321, 2322, //2331, 2332, 2341, 2342, //2351, 2352, 2361, 2362, 2371, 2372, 2381, 2382, 2391, 2392,

          3111, 3112, 3121, 3122, //3131, 3132, 3141, 3142, //3151, 3152, 3161, 3162, 3171, 3172, 3181, 3182, 3191, 3192,
          3211, 3212, 3221, 3222, //3231, 3232, 3241, 3242, //3251, 3252, 3261, 3262, 3271, 3272, 3281, 3282, 3291, 3292,
          3311, 3312, 3321, 3322, //3331, 3332, 3341, 3342, //3351, 3352, 3361, 3362, 3371, 3372, 3381, 3382, 3391, 3392,
        ],

        // depthwiseBiasesArray
        [ 101, 102, 103, 104, //105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115
        ],

        // pointwise2FiltersArray
        [
          11, 12, 13, 14, 15, 16, 17, 18,
          21, 22, 23, 24, 25, 26, 27, 28,
          31, 32, 33, 34, 35, 36, 37, 38,
          41, 42, 43, 44, 45, 46, 47, 48,
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

      let testCase = this.testCases[ testCaseIndex ];
      let imageOutRef = testCase.calcResult();
      let outputArrayRef = imageOutRef.dataArray;

      let outputArray = outputTensor3d.dataSync();

      tf.util.assert( outputArray.length == outputArrayRef.length,
        `PointDepthPoint output length ( ${outputArray.length} ) should be ( ${outputArrayRef.length} )`);

      tf.util.assert( outputArray.every( ( value, index ) => value === outputArrayRef[ index ] ),
        `PointDepthPoint output ( ${outputArray} ) should be ( ${outputArrayRef} )`);
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

    tf.tidy( () => {
      for ( let i = 0; i < this.testCases.length; ++i ) {
        let testCase = this.testCases[ i ];
        
        for ( let nKeepInputTensor = 0; nKeepInputTensor < 2; ++nKeepInputTensor ) {
          let bKeepInputTensor = ( nKeepInputTensor != 0 );

          tf.tidy( () => { // Test memory leakage of pointDepthPoint create/dispose.
            let memoryInfo_beforeCreate = tf.memory();
            let pointDepthPoint = testCase.pointDepthPoint_create( bKeepInputTensor );
            pointDepthPoint.dispose();
            let memoryInfo_afterDispose = tf.memory();
            tf.util.assert( memoryInfo_beforeCreate.numTensors == memoryInfo_afterDispose.numTensors, `PointDepthPoint create/dispose memory leak.`);
          });

          tf.tidy( () => {
            let pointDepthPoint = testCase.pointDepthPoint_create( bKeepInputTensor );

            let memoryInfo_apply_before = tf.memory(); // Test memory leakage of pointDepthPoint apply.

            let inputTensor3d;
            if ( pointDepthPoint.bKeepInputTensor ) {
              inputTensor3d = this.dataTensor3d;
            } else {
              inputTensor3d = this.dataTensor3d.clone(); // Otherwise, this.dataTensor3d will be destroyed. 
            }

            let outputTensor3d = pointDepthPoint.apply_and_destroy_or_keep( inputTensor3d );
            let memoryInfo_apply_after = tf.memory();

            tf.util.assert( memoryInfo_apply_after.numTensors == ( memoryInfo_apply_before.numTensors + 1 ),
              `PointDepthPoint.apply_and_destroy_or_keep() memory leak.`);

            // Test correctness of pointDepthPoint apply.
            this.check_Input_Output_WeightsTable( i, pointDepthPoint, this.dataTensor3d, outputTensor3d );

            outputTensor3d.dispose();
            pointDepthPoint.dispose();
          });
        }
      }
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
//         let func = functionTable[ i ];
//
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
