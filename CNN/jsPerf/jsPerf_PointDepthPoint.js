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
          10000, 10001, 10010, 10011, 10020, 10021, 10030, 10031, 10040, 10041, 10050, 10051, 10060, 10061, 10070, 10071, 10080, 10081,
          10100, 10101, 10110, 10111, 10120, 10121, 10130, 10131, 10140, 10141, 10150, 10151, 10160, 10161, 10170, 10171, 10180, 10181,
          10200, 10201, 10210, 10211, 10220, 10221, 10230, 10231, 10240, 10241, 10250, 10251, 10260, 10261, 10270, 10271, 10280, 10281,

          11000, 11001, 11010, 11011, 11020, 11021, 11030, 11031, 11040, 11041, 11050, 11051, 11060, 11061, 11070, 11071, 11080, 11081,
          11100, 11101, 11110, 11111, 11120, 11121, 11130, 11131, 11140, 11141, 11150, 11151, 11160, 11161, 11170, 11171, 11180, 11181,
          11200, 11201, 11210, 11211, 11220, 11221, 11230, 11231, 11240, 11241, 11250, 11251, 11260, 11261, 11270, 11271, 11280, 11281,

          12000, 12001, 12010, 12011, 12020, 12021, 12030, 12031, 12040, 12041, 12050, 12051, 12060, 12061, 12070, 12071, 12080, 12081,
          12100, 12101, 12110, 12111, 12120, 12121, 12130, 12131, 12140, 12141, 12150, 12151, 12160, 12161, 12170, 12171, 12180, 12181,
          12200, 12201, 12210, 12211, 12220, 12221, 12230, 12231, 12240, 12241, 12250, 12251, 12260, 12261, 12270, 12271, 12280, 12281,
        ],

        // depthwiseBiasesArray
        [ 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115 ],

        // pointwise2FiltersArray
        [
          20000, 20100, 20200, 20300, 20400, 20500, 20600, 20700, 20800, 20900, 21000, 21100, 21200, 21300, 21400, 21500,
          20001, 20101, 20201, 20301, 20401, 20501, 20601, 20701, 20801, 20901, 21001, 21101, 21201, 21301, 21401, 21501,
          20002, 20102, 20202, 20302, 20402, 20502, 20602, 20702, 20802, 20902, 21002, 21102, 21202, 21302, 21402, 21502,
          20003, 20103, 20203, 20303, 20403, 20503, 20603, 20703, 20803, 20903, 21003, 21103, 21203, 21303, 21403, 21503,
          20004, 20104, 20204, 20304, 20404, 20504, 20604, 20704, 20804, 20904, 21004, 21104, 21204, 21304, 21404, 21504,
          20005, 20105, 20205, 20305, 20405, 20505, 20605, 20705, 20805, 20905, 21005, 21105, 21205, 21305, 21405, 21505,
          20006, 20106, 20206, 20306, 20406, 20506, 20606, 20706, 20806, 20906, 21006, 21106, 21206, 21306, 21406, 21506,
          20007, 20107, 20207, 20307, 20407, 20507, 20607, 20707, 20807, 20907, 21007, 21107, 21207, 21307, 21407, 21507,
        ],

        // pointwise2BiasesArray
        [ 200, 201, 202, 203, 204, 205, 206, 207 ],

        // imageIn
        testImageData,
//!!!
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
