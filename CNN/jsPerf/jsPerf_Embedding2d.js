export { init, testResultSame, testDifferentDisposeStrategy_All, disposeTensors };

import * as ValueMax from "../ValueMax.js";
import * as Embedding2d from "../Conv/Embedding2d.js";
import * as TensorTools from "../util/TensorTools.js";

/**
 * Test CNN Embedding2d.
 *
 * @see {@link }
 */

/**
 * A test set.
 */
class HeightWidthDepth {

  /**
   * @param {number} height            image height
   * @param {number} width             image width
   * @param {number} depth             image channel count
   * @param {number} channelMultiplier Every input channel expands into how many channels.
   */
  constructor( height, width, depth, channelMultiplier ) {

    this.disposeTensors();

    this.height = height;
    this.width = width;
    this.depth = depth;
    this.channelMultiplier = channelMultiplier;

    this.valueCount = height * width * depth;

    this.concatenatedShape = [ height, width, depth ];

    this.dataTensor3d = tf.tidy( () => {
      let dataTensor1d = tf.linspace( 0, this.valueCount - 1, this.valueCount );

      let dataTensor3d = dataTensor1d.reshape( [ height, width, depth ] );
      return dataTensor3d;
    });

    this.weightsElementOffsetBegin = 3; // Skip the un-used. (in element count)
    this.weightsByteOffsetBegin = this.weightsElementOffsetBegin * Float32Array.BYTE_PER_ELEMENT; // Skip the un-used. (in byte count)
    this.vocabularyCountPerInputChannel = 256;
    this.bEmbedVocabularyId = true;
    this.bKeepInputTensor = false;

    let wieghtsArrayLength = 
      this.weightsElementOffsetBegin // Skip the un-used.
        + ( depth * this.vocabularyCountPerInputChannel )
      ;

    this.weightsFloat32Array = new Float32Array( wieghtsArrayLength );
    {
      for ( let i = 0; i < this.weightsElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
        this.weightsFloat32Array[ i ] = -i;
      }

      for ( let i = this.weightsElementOffsetBegin; i < wieghtsArrayLength; ++i ) { // Make-up the embedding weight values.
        //this.weightsFloat32Array[ i ] = ( i - this.weightsByteOffsetBegin );
        this.weightsFloat32Array[ i ] = Math.random() * 10;
      }
    }
  }

  disposeTensors() {
    if ( this.dataTensor3d ) {
      this.dataTensor3d.dispose();
      this.dataTensor3d = null;
    }

    this.embedding2d_release();
  }

  ebedding2d_init() {
    this.embedding2d_release();

    this.embedding2d = new Embedding2d.Base();
    {
      let progress = new ValueMax.Percentage.Aggregate();
      let initer = this.embedding2d.initer(
        this.progress, this.weightsFloat32Array, this.weightsByteOffsetBegin, this.depth, this.channelMultiplier,
        this.vocabularyCountPerInputChannel,
        this.bEmbedVocabularyId,
        this.bKeepInputTensor
      );

      let initerNext;
      while ( ! ( ( initerNext = initer.next() ).done ) ) {
        //initerNext.value; // progressRoot
      }
      //initerNext.value; // Initialize successfully or failed.
    }
  }

  embedding2d_release() {
    if ( this.embedding2d ) {
      this.embedding2d.disposeTensors();
      this.embedding2d = null;
    }
  }

  /** Check the Embedding2d's result.
   *
   * @param {tf.tensor3d} inputTensor3d
   *   The input of the Embedding2d's apply_and_destroy_or_keep(). Its dtype should be int32.
   *
   * @param {tf.tensor3d} outputTensor3d
   *   The output of the Embedding2d's apply_and_destroy_or_keep(). Its dtype should be float32.
   */
  check_Input_Output_WeightsTable( inputTensor3d, outputTensor3d ) {
    tf.tidy( () => {

      let inputRowArray = inputTensor3d.arraySync();
      let outputRowArray = outputTensor3d.arraySync();

      tf.util.assert( outputRowArray.length == inputRowArray.length,
          `Row count of embedding output and input should be the same. ( ${outputRowArray.length} != ${inputRowArray.length} )`);

      // The float32 count of an embedding vocabulary table of one input channel.
      let float32CountPerTable = this.channelMultiplier * this.vocabularyCountPerInputChannel;

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

          tf.util.assert( outputChannelArray.length == ( inputChannelArray.length * this.channelMultiplier ),
            `Channel count of embedding output and input should match. `
              + `( ${outputChannelArray.length} != ( ${inputChannelArray.length} * ${this.channelMultiplier} ) )`);

          // Input Channel
          for ( let inputChannelIndex = 0; inputChannelIndex < channelArray.length; ++inputChannelIndex ) {
            let inputChannelValue = inputChannelArray[ inputChannelIndex ]; // Int32

            // The embedding vocabulary table beginning of the input channel.
            let vocabularyTableElementOffsetBegin = ( inputChannelIndex * float32CountPerTable );
            let lookUpAtElementOffsetBase = ( this.weightsElementOffsetBegin + vocabularyTableElementOffsetBegin );

            // Output Channel
            for ( let outputChannelIndex = 0; outputChannelIndex < this.channelMultiplier; ++outputChannelIndex ) {
              let outputChannelValueFromOutput = inputChannelArray[ outputChannelIndex ]; // Float32

              let lookUpAtElementOffset = lookUpAtElementOffsetBase + outputChannelIndex;
              let outputChannelValueFromTable = this.weightsFloat32Array[ lookUpAtElementOffset ]; // Float32

              tf.util.assert( outputChannelValueFromOutput == outputChannelValueFromTable,
                `Channel value of output and table should match. `
                  + `( ${outputChannelValueFromOutput} != ${outputChannelValueFromTable} )`);
            }
          }
        }
      }
    });

  }

//!!! ...unfinished...
  // Test concat-reshape-transpose-reshape-split
  test_ConcatReshapeTransposeReshapeSplit() {
    let shuffledArray = this.shuffleInfo.concatReshapeTransposeReshapeSplit( this.dataTensor3dArray );
    tf.dispose( shuffledArray );
  }

  // Test concat-gather (Unsorted)
  test_ConcatGatherUnsorted() {
    let shuffledArray = this.concatGatherUnsorted.concatGather( this.dataTensor3dArray );
    tf.dispose( shuffledArray );
  }

  // Test split-concat (Sorted Shared)
  test_SplitConcatSortedShared() {
    let shuffledArray = this.splitConcatSortedShared.splitConcat( this.dataTensor3dArray );
    tf.dispose( shuffledArray );
  }

  // Test concat-pointwise-convolution
  test_ConcatPointwiseConv() {
    let shuffledArray = this.concatPointwiseConv.concatGather( this.dataTensor3dArray );
    tf.dispose( shuffledArray );
  }

  // Testing whether the results of different implementation are the same.
  testResultSame() {
    tf.tidy( () => { // Test memory leakage of embedding2d.
      let memoryInfoPre = tf.memory();
      this.ebedding2d_init();
      this.ebedding2d_release();
      let memoryInfo = tf.memory();
      tf.util.assert( memoryInfoPre.numTensors == memoryInfo.numTensors, `Channel shufflers memory leak.`);
    });

    this.ebedding2d_init();  // (Should outside tidy() for preventing from tensors being disposed.

    tf.tidy( () => {
      let memoryInfo0 = tf.memory();

      // Test memory leak of embedding apply.
      let outputTensor3d = this.embedding2d.apply_and_destroy_or_keep( this.dataTensor3d );
      let memoryInfo1 = tf.memory();
      tf.util.assert( memoryInfo1.numTensors == ( memoryInfo0.numTensors + 1 ), `Embedding2d.apply_and_destroy_or_keep() memory leak.`);

      // Test correctness of embedding apply.
      this.check_Input_Output_WeightsTable( this.dataTensor3d, outputTensor3d );

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
// }

function init() {
//!!! ...unfinished... test zero or negative channelMultiplier.

  globalThis.testSet_110x110x24_cm8 = new HeightWidthDepth( 110, 110, 24, 8 ); // height, width, depth, channelMultiplier
  globalThis.testSet_110x110x24_cm4 = new HeightWidthDepth( 110, 110, 24, 4 );
  globalThis.testSet_110x110x24_cm3 = new HeightWidthDepth( 110, 110, 24, 3 );
  globalThis.testSet_110x110x24_cm2 = new HeightWidthDepth( 110, 110, 24, 2 );
  globalThis.testSet_110x110x24_cm1 = new HeightWidthDepth( 110, 110, 24, 1 );

  globalThis.testSet_110x110x24_All = [
    globalThis.testSet_110x110x24_cm8,
    globalThis.testSet_110x110x24_cm4,
    globalThis.testSet_110x110x24_cm3,
    globalThis.testSet_110x110x24_cm2,
    globalThis.testSet_110x110x24_cm1,
  ];
}

function testResultSame() {
  for ( let i = 0; i < globalThis.testSet_110x110x24_All.length; ++i ) {
    let testSet = globalThis.testSet_110x110x24_All[ i ];
    testSet.testResultSame();
  }
}

function testDifferentDisposeStrategy_All() {
  for ( let i = 0; i < globalThis.testSet_110x110x24_All.length; ++i ) {
    let testSet = globalThis.testSet_110x110x24_All[ i ];
    testSet.testDifferentDisposeStrategy_All();
  }
}

function disposeTensors() {
  for ( let i = 0; i < globalThis.testSet_110x110x24_All.length; ++i ) {
    let testSet = globalThis.testSet_110x110x24_All[ i ];
    testSet.disposeTensors();
  }

  globalThis.testSet_110x110x24_g8
    = globalThis.testSet_110x110x24_g4
    = globalThis.testSet_110x110x24_g3
    = globalThis.testSet_110x110x24_g2
    = globalThis.testSet_110x110x24_g1
    = null;
}
