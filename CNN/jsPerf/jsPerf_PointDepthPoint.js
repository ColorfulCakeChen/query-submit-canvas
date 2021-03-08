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
        [],
        // depthwiseBiasesArray
        [],
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
    inputFloat32Array, byteOffsetBegin,

    pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
    depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationName,
    pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
    bAddInputToOutput,

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
      this.pointDepthPoint =
      this.pointDepthPoint_create(  true ),
    ];

  }

  pointDepthPoint_release() {
    if ( this.pointDepthPoint_list ) {
      for ( let i = 0; i < this.pointDepthPoint_list.length; ++i ) {
        let pointDepthPoint = this.pointDepthPoint_list[ i ];
        pointDepthPoint.disposeTensors();
      }
      this.pointDepthPoint_list = this.pointDepthPoint = null;
    }
  }

//!!! ...unfinished...
  /**
   * Check the Embedding2d's output by look up weights according to input.
   *
   * @param {Embedding2d.Base} embedding2d
   *   The object which implemets embedding logic.
   *
   * @param {tf.tensor3d} inputTensor3d
   *   The input of the Embedding2d's apply_and_destroy_or_keep(). Its dtype should be int32.
   *
   * @param {tf.tensor3d} outputTensor3d
   *   The output of the Embedding2d's apply_and_destroy_or_keep(). Its dtype should be float32.
   */
  check_Input_Output_WeightsTable( embedding2d, inputTensor3d, outputTensor3d ) {
    tf.tidy( () => {

      let channelMultiplier_forExtract; // How many channels (of per input channel) are extracted from table raw data.
      if ( embedding2d.bEmbedVocabularyId )
        channelMultiplier_forExtract = embedding2d.channelMultiplier - 1; // less one because the channel will be auto-generated vocabulary id.
      else
        channelMultiplier_forExtract = embedding2d.channelMultiplier;

      let inputRowArray = inputTensor3d.arraySync();
      let outputRowArray = outputTensor3d.arraySync();

      tf.util.assert( outputRowArray.length == inputRowArray.length,
          `Row count of embedding output and input should be the same. ( ${outputRowArray.length} != ${inputRowArray.length} )`);

      // The float32 count of an embedding vocabulary table of one input channel.
      let float32CountPerTable = channelMultiplier_forExtract * this.vocabularyCountPerInputChannel;

      // Height
      for ( let y = 0; y < inputRowArray.length; ++y ) {
        let inputColumnArray = inputRowArray[ y ];
        let outputColumnArray = outputRowArray[ y ];

        tf.util.assert( outputColumnArray.length == inputColumnArray.length,
          `Column count of embedding output and input should be the same. ( ${outputColumnArray.length} != ${inputColumnArray.length} )`);

        // Width
        for ( let x = 0; x < inputColumnArray.length; ++x ) {
          let inputChannelArray = inputColumnArray[ x ];
          let outputChannelArray = outputColumnArray[ x ];

          tf.util.assert( outputChannelArray.length == ( inputChannelArray.length * embedding2d.channelMultiplier ),
            `Channel count of embedding output and input should match. `
              + `( ${outputChannelArray.length} != ( ${inputChannelArray.length} * ${embedding2d.channelMultiplier} ) )`);

          // Input Channel
          for ( let inputChannelIndex = 0; inputChannelIndex < inputChannelArray.length; ++inputChannelIndex ) {
            let inputChannelValue = inputChannelArray[ inputChannelIndex ]; // Int32

            // The embedding vocabulary table beginning of the input channel.
            let vocabularyTableOffset = ( inputChannelIndex * float32CountPerTable );

            // The embedding vocabulary element beginning of the vocabulary table.
            let vocabularyTableElementOffset = ( inputChannelValue * channelMultiplier_forExtract );

            // The embedding vocabulary element channel beginning of the vocabulary element.
            let vocabularyTableElementChannelOffsetBase = ( this.weightsElementOffsetBegin + vocabularyTableOffset + vocabularyTableElementOffset );

            // Output Channel
            for ( let outputChannelIndexOffset = 0; outputChannelIndexOffset < embedding2d.channelMultiplier; ++outputChannelIndexOffset ) {
              let outputChannelIndexBase = ( inputChannelIndex * embedding2d.channelMultiplier );
              let outputChannelIndex = outputChannelIndexBase + outputChannelIndexOffset;
              let outputChannelValueFromOutput = outputChannelArray[ outputChannelIndex ]; // Float32

              if ( ( embedding2d.bEmbedVocabularyId ) && ( outputChannelIndexOffset == 0 ) ) {
                // When ( bEmbedVocabularyId == true ), every embedding2d.channelMultiplier output channel should be auto-generated
                // vocabulary id (i.e. should be the same as the input channel value).
                tf.util.assert( outputChannelValueFromOutput == inputChannelValue,
                  `Channel value of output should be vocabulary id. `
                    + `( ${outputChannelValueFromOutput} != ${inputChannelValue} )`);

              } else {
                let lookUpAtElementOffset = vocabularyTableElementChannelOffsetBase + outputChannelIndexOffset;

                // When ( bEmbedVocabularyId == true ), every embedding2d.channelMultiplier output channel is auto-generated vocabulary
                // id. So the table offset should count start from 1 (not 0) (i.e. ignore ( outputChannelIndexOffset == 0 ) ).
                if ( embedding2d.bEmbedVocabularyId ) {
                  lookUpAtElementOffset -= 1;
                }

                let outputChannelValueFromTable = this.weightsFloat32Array[ lookUpAtElementOffset ]; // Float32

                tf.util.assert( outputChannelValueFromOutput == outputChannelValueFromTable,
                  `Channel value of output and table should match. `
                    + `( ${outputChannelValueFromOutput} != ${outputChannelValueFromTable} ) `
                    + `at ( y, x, inputChannelIndex, outputChannelIndexOffset ) = (${y}, ${x}, ${inputChannelIndex}, ${outputChannelIndexOffset}) `
                    + `( channelMultiplier = ${embedding2d.channelMultiplier} )`
                );
              }

            }
          }
        }
      }
    });

  }

  // Test apply by add-gather-reshape (i.e. vocabulary table is one merged longer tensor2d).
  test_AddGatherReshape() {
    let outputTensor3d = this.embedding2d_AddGatherReshape.apply_and_destroy_or_keep( this.dataTensor3d );
    outputTensor3d.dispose();
  }

  // Test apply by split-reshape-gather-concat (i.e. vocabulary table is tensor2d).
  test_SplitReshapeGatherConcat() {
//!!! (2021/01/06 Temp) for testing performance without Add.
//    let outputTensor3d = this.embedding2d_AddGatherReshape.temp_apply_and_destroy_or_keep_GatherReshape( this.dataTensor3d );
    let outputTensor3d = this.embedding2d_SplitReshapeGatherConcat.apply_and_destroy_or_keep( this.dataTensor3d );
    outputTensor3d.dispose();
  }

//!!! (2021/01/05 Remarked) SplitGatherConcatReshape is slower than SplitReshapeGatherConcat.
//   // Test apply by split-gather-concat-reshape (i.e. vocabulary table is tensor3d).
//   test_SplitGatherConcatReshape() {
//     let outputTensor3d = this.embedding2d_SplitGatherConcatReshape.apply_and_destroy_or_keep( this.dataTensor3d );
//     outputTensor3d.dispose();
//   }

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

        // Test correctness of embedding apply.
        this.check_Input_Output_WeightsTable( pointDepthPoint, this.dataTensor3d, outputTensor3d );

        outputTensor3d.dispose();
      }

//!!!
//       tf.util.assert(
//         TensorTools.Comparator.isTensorArrayEqual( t1Array, t2Array ),
//         `ConcatReshapeTransposeReshapeSplit() != ConcatGatherUnsorted()`);
    });
  }

//   testDifferentDisposeStrategy_ConcatReshapeTransposeReshapeSplit() {
//     let functionTable = [
//     ];
//     this.testDifferentDisposeStrategy( functionTable, this.shuffleInfo );
//   }

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
