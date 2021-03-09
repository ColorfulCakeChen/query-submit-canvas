export { init, testCorrectness, testDifferentDisposeStrategy_All, disposeTensors };

import * as ValueMax from "../ValueMax.js";
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

    // pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
    // depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationName,
    // pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
    // bAddInputToOutput,
    //

    let testImageData = {
      height: 3, width: 3, depth: 4,
      dataArray: [
        111, 112, 113, 114,  121, 122, 123, 124,  131, 132, 133, 134,
        211, 212, 213, 214,  221, 222, 223, 224,  231, 232, 233, 234,
        311, 312, 313, 314,  321, 322, 323, 324,  331, 332, 333, 334,
//        411, 412, 413, 414,  421, 422, 423, 424,  431, 432, 433, 434,
      ]
    };
    this.testCases = [
      new PointDepthPoint_Reference.TestCase(
        [ 2.1,  1.1,   6.1, 3.1, 2.1, 3.1,  3.2,   6.2, 8,  5.3,   6.3,  7.4 ], // paramsInArray
        [   2, true, "cos",   3,   2,   0, true, "cos", 8, true, "cos", true ], // paramsOutArray

        // pointwise1FiltersArray
        // = [  450,  900,   490,  980,   530, 1060,
        //      850, 1610,   890, 1780,   930, 1860,
        //     1250, 2500,   ]
        [ 1, 1, 1, 1,  2, 2, 2, 2 ],

        // pointwise1BiasesArray
        [ 3, 4 ],

        // depthwiseFiltersArray
        [
          0000, 0001, 0010, 0011, 0020, 0021, 0030, 0031, 0040, 0041, 0050, 0051, 0060, 0061, 0070, 0071, 0080, 0081,
          0100, 0101, 0110, 0111, 0120, 0121, 0130, 0131, 0140, 0141, 0150, 0151, 0160, 0161, 0170, 0171, 0180, 0181,
          0200, 0201, 0210, 0211, 0220, 0221, 0230, 0231, 0240, 0241, 0250, 0251, 0260, 0261, 0270, 0271, 0280, 0281,

          1000, 1001, 1010, 1011, 1020, 1021, 1030, 1031, 1040, 1041, 1050, 1051, 1060, 1061, 1070, 1071, 1080, 1081,
          1100, 1101, 1110, 1111, 1120, 1121, 1130, 1131, 1140, 1141, 1150, 1151, 1160, 1161, 1170, 1171, 1180, 1181,
          1200, 1201, 1210, 1211, 1220, 1221, 1230, 1231, 1240, 1241, 1250, 1251, 1260, 1261, 1270, 1271, 1280, 1281,

          2000, 2001, 2010, 2011, 2020, 2021, 2030, 2031, 2040, 2041, 2050, 2051, 2060, 2061, 2070, 2071, 2080, 2081,
          2100, 2101, 2110, 2111, 2120, 2121, 2130, 2131, 2140, 2141, 2150, 2151, 2160, 2161, 2170, 2171, 2180, 2181,
          2200, 2201, 2210, 2211, 2220, 2221, 2230, 2231, 2240, 2241, 2250, 2251, 2260, 2261, 2270, 2271, 2280, 2281,
        ],

        // depthwiseBiasesArray
        [ 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115 ],

        // pointwise2FiltersArray
        [],
        // pointwise2BiasesArray
        [],
        // imageIn
        testImageData,
        // imageOutArray
        [ ],
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

    this.pointDepthPoint_release();
  }

  /**
   * @return {PointDepthPoint.Base} The created pointDepthPoint object.
   */
  pointDepthPoint_create(
    bKeepInputTensor
  ) {

    let testCase = this.testCases[ 0 ];
    let pointDepthPoint = testCase.pointDepthPoint_create( bKeepInputTensor );

    return pointDepthPoint;
  }

  pointDepthPoint_init() {
    this.pointDepthPoint_release();

//!!! ...unfinished...

    // Different pointDepthPoint objects.
    //
    // ( bKeepInputTensor )
    this.pointDepthPoint_list = [

      this.pointDepthPoint_create( false ),
      // The pointDepthPoint for performance testing should:
      //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
      this.pointDepthPoint_DConv =
      this.pointDepthPoint_create(  true ),
    ];

  }

  pointDepthPoint_release() {
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
   * @param {PointDepthPoint.Base} pointDepthPoint
   *   The object which implemets PointDepthPoint logic.
   *
   * @param {tf.tensor3d} inputTensor3d
   *   The input of the PointDepthPoint's apply_and_destroy_or_keep().
   *
   * @param {tf.tensor3d} outputTensor3d
   *   The output of the PointDepthPoint's apply_and_destroy_or_keep().
   */
  check_Input_Output_WeightsTable( pointDepthPoint, inputTensor3d, outputTensor3d ) {
    tf.tidy( () => {

      let testCase = this.testCases[ 0 ];
      let outputArrayRef = testCase.calcResult();

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
    tf.tidy( () => { // Test memory leakage of pointDepthPoint.
      let memoryInfoPre = tf.memory();
      this.pointDepthPoint_init();
      this.pointDepthPoint_release();
      let memoryInfo = tf.memory();
      tf.util.assert( memoryInfoPre.numTensors == memoryInfo.numTensors, `PointDepthPoint init/release memory leak.`);
    });

    this.pointDepthPoint_init();  // (Should outside tidy() for preventing from tensors being disposed.

    tf.tidy( () => {
      for ( let i = 0; i < this.pointDepthPoint_list.length; ++i ) {
        let pointDepthPoint = this.pointDepthPoint_list[ i ];

        let memoryInfo0 = tf.memory();

        let inputTensor3d;
        if ( pointDepthPoint.bKeepInputTensor ) {
          inputTensor3d = this.dataTensor3d;
        } else {
          inputTensor3d = this.dataTensor3d.clone(); // Otherwise, this.dataTensor3d will be destroyed. 
        }

        // Test memory leak of embedding apply.
        let outputTensor3d = pointDepthPoint.apply_and_destroy_or_keep( inputTensor3d );
        let memoryInfo1 = tf.memory();
        tf.util.assert( memoryInfo1.numTensors == ( memoryInfo0.numTensors + 1 ), `PointDepthPoint.apply_and_destroy_or_keep() memory leak.`);

        // Test correctness of pointDepthPoint apply.
        this.check_Input_Output_WeightsTable( pointDepthPoint, this.dataTensor3d, outputTensor3d );

        outputTensor3d.dispose();
      }
    });
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
