export { init, testCorrectness, testDifferentDisposeStrategy_All, disposeTensors };

import * as ValueMax from "../ValueMax.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";
//import * as TensorTools from "../util/TensorTools.js";

/**
 * Test CNN PointDepthPoint.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/}
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

    this.testCases = [
      { in: {
          weightsArray:          [ 5.1,  1.1,   6.1, 3, 2, 3,  3.2,   6.2, 8,  5.3,   6.3,  7.4 ],
          weightsExtractedArray: [   5, true, "cos", 3, 2, 0, true, "cos", 8, true, "cos", true ],
          height: 2, width: 2, depth: 4,
          dataArray: [ ],
        },
        out: {
          resultArray: [ ],
        }
      },
    ];


    this.weightsElementOffsetBegin = 3; // Skip the un-used. (in element count)
    this.weightsByteOffsetBegin = this.weightsElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT; // Skip the un-used. (in byte count)
    this.vocabularyCountPerInputChannel = 256;

    this.dataTensor3d = tf.tidy( () => {
      // Make-up the input data. They should between [ 0, this.vocabularyCountPerInputChannel ).
      let inputData = new Array( this.valueCount );
      for ( let i = 0; i < inputData.length; ++i ) {
        inputData[ i ] = Math.floor( Math.random() * this.vocabularyCountPerInputChannel );
      }

      let dataTensor1dInt32 = tf.tensor1d( inputData, "int32" ); // Embedding accepts integer input only.

      let dataTensor3d = dataTensor1dInt32.reshape( [ height, width, depth ] );
      return dataTensor3d;
    });

    let channelMultiplierEstimated = channelMultiplier;
    if ( channelMultiplierEstimated < 1 )
      channelMultiplierEstimated = 1;

    let wieghtsArrayLength = 
      this.weightsElementOffsetBegin // Skip the un-used.
        + ( depth * ( this.vocabularyCountPerInputChannel * channelMultiplierEstimated ) ) 
      ;

    this.weightsFloat32Array = new Float32Array( wieghtsArrayLength );
    {
      for ( let i = 0; i < this.weightsElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
        this.weightsFloat32Array[ i ] = -i;
      }

      for ( let i = this.weightsElementOffsetBegin; i < wieghtsArrayLength; ++i ) { // Make-up the embedding weight values.
        this.weightsFloat32Array[ i ] = ( i - this.weightsElementOffsetBegin );  // For debugging more easily.
//        this.weightsFloat32Array[ i ] = Math.random() * 10;
      }
    }
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

    let pointDepthPoint = new PointDepthPoint.Base();

    let progress = new ValueMax.Percentage.Aggregate();

    // Initialize successfully or failed.
    let bInitOk = pointDepthPoint.init(
      progress, inputFloat32Array, byteOffsetBegin,

      pointwise1ChannelCount, bPointwise1Bias, pointwise1ActivationName,
      depthwiseFilterHeight, depthwise_AvgMax_Or_ChannelMultiplier, depthwiseStridesPad, bDepthwiseBias, depthwiseActivationName,
      pointwise2ChannelCount, bPointwise2Bias, pointwise2ActivationName,
      bAddInputToOutput,

      bKeepInputTensor
    );

    let parametersDescription = `( `
      + `pointwise1ChannelCount=${pointwise1ChannelCount}, bPointwise1Bias=${bPointwise1Bias}, pointwise1ActivationName=${pointwise1ActivationName} `
      + `depthwiseFilterHeight=${depthwiseFilterHeight}, `
      + `depthwise_AvgMax_Or_ChannelMultiplier=${depthwise_AvgMax_Or_ChannelMultiplier}, `
      + `depthwiseStridesPad=${depthwiseStridesPad}, `
      + `bDepthwiseBias=${bDepthwiseBias}, `
      + `depthwiseActivationName=${depthwiseActivationName}, `
      + `pointwise2ChannelCount=${pointwise2ChannelCount}, bPointwise2Bias=${bPointwise2Bias}, pointwise2ActivationName=${pointwise2ActivationName}, `
      + `bAddInputToOutput=${bAddInputToOutput}, `
      + `bKeepInputTensor=${bKeepInputTensor} `
      + `)`
    ;

    tf.util.assert( ( pointDepthPoint.isValid() == bInitOk ),
        `PointDepthPoint validation state (${pointDepthPoint.isValid()}) mismatches initer's result (${bInitOk}). ${parametersDescription}`);

    tf.util.assert( ( true == bInitOk ),
        `Failed to initialize pointDepthPoint object.  ${parametersDescription}`);

    tf.util.assert( ( 100 == progress.valuePercentage ),
        `Progress (${progress.valuePercentage}) should be 100 when initializing pointDepthPoint object successfully. ${parametersDescription}`);

    tf.util.assert( ( pointDepthPoint.byteOffsetBegin == ),

    tf.util.assert( ( pointDepthPoint.byteOffsetEnd

    tf.util.assert( ( pointDepthPoint.inChannels

    tf.util.assert( ( pointDepthPoint.pointwise1ChannelCount
    tf.util.assert( ( pointDepthPoint.bPointwise1Bias
    tf.util.assert( ( pointDepthPoint.pointwise1ActivationName

    tf.util.assert( ( pointDepthPoint.depthwiseFilterHeight
    tf.util.assert( ( pointDepthPoint.depthwise_AvgMax_Or_ChannelMultiplier
    tf.util.assert( ( pointDepthPoint.depthwiseStridesPad
    tf.util.assert( ( pointDepthPoint.bDepthwiseBias
    tf.util.assert( ( pointDepthPoint.depthwiseActivationName

    tf.util.assert( ( pointDepthPoint.pointwise2ChannelCount
    tf.util.assert( ( pointDepthPoint.bPointwise2Bias
    tf.util.assert( ( pointDepthPoint.pointwise2ActivationName

    tf.util.assert( ( pointDepthPoint.bAddInputToOutput

    tf.util.assert( ( pointDepthPoint.outChannels

    tf.util.assert( ( pointDepthPoint.bKeepInputTensor

    return pointDepthPoint;
  }

  pointDepthPoint_init() {
    this.pointDepthPoint_release();

//!!! ...unfinished...

    // Different pointDepthPoint objects.
    //
    // ( bEmbedVocabularyId, bKeepInputTensor, bSplitReshapeGatherConcat )
    this.pointDepthPoint_list = [
      this.pointDepthPoint_create( false, false, false ),
      this.embedding2d_create(  true, false, false ),

      // The embedding (vocabulary tabe tensor3d) for performance testing should:
      //   - ( bEmbedVocabularyId == false ). Otherwise, shortcut operation (i.e. return directly) will be used when ( channelMultiplier == 1 ).
      //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
//!!! (2021/01/05 Remarked) SplitGatherConcatReshape is slower than SplitReshapeGatherConcat.
//      this.embedding2d_SplitGatherConcatReshape =
      this.embedding2d_AddGatherReshape =
      this.embedding2d_create( false,  true, false ),
      this.embedding2d_create(  true,  true, false ),


      this.embedding2d_create( false, false,  true ),
      this.embedding2d_create(  true, false,  true ),

      // The embedding (vocabulary tabe tensor2d) for performance testing should:
      //   - ( bEmbedVocabularyId == false ). Otherwise, shortcut operation (i.e. return directly) will be used when ( channelMultiplier == 1 ).
      //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
      this.embedding2d_SplitReshapeGatherConcat =
      this.embedding2d_create( false,  true,  true ),
      this.embedding2d_create(  true,  true,  true ),

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
    tf.tidy( () => { // Test memory leakage of embedding2d.
      let memoryInfoPre = tf.memory();
      this.embedding2d_init();
      this.embedding2d_release();
      let memoryInfo = tf.memory();
      tf.util.assert( memoryInfoPre.numTensors == memoryInfo.numTensors, `Embedding2d init/release memory leak.`);
    });

    this.embedding2d_init();  // (Should outside tidy() for preventing from tensors being disposed.

    tf.tidy( () => {
      for ( let i = 0; i < this.embedding2d_list.length; ++i ) {
        let embedding2d = this.embedding2d_list[ i ];

        let memoryInfo0 = tf.memory();

        let inputTensor3d;
        if ( embedding2d.bKeepInputTensor ) {
          inputTensor3d = this.dataTensor3d;
        } else {
          inputTensor3d = this.dataTensor3d.clone(); // Otherwise, this.dataTensor3d will be destroyed. 
        }

        // Test memory leak of embedding apply.
        let outputTensor3d = embedding2d.apply_and_destroy_or_keep( inputTensor3d );
        let memoryInfo1 = tf.memory();
        tf.util.assert( memoryInfo1.numTensors == ( memoryInfo0.numTensors + 1 ), `Embedding2d.apply_and_destroy_or_keep() memory leak.`);

        // Test correctness of embedding apply.
        this.check_Input_Output_WeightsTable( embedding2d, this.dataTensor3d, outputTensor3d );

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

  // (cm = channel multiplier)

  let depth = 8; //24;
  globalThis.testSet_110x120x8_cm32 = new HeightWidthDepth( 110, 120, depth, 32 ); // height, width, depth, channelMultiplier
  globalThis.testSet_110x120x8_cm16 = new HeightWidthDepth( 110, 120, depth, 16 );
  globalThis.testSet_110x120x8_cm8 = new HeightWidthDepth( 110, 120, depth, 8 );
  globalThis.testSet_110x120x8_cm4 = new HeightWidthDepth( 110, 120, depth, 4 );
  globalThis.testSet_110x120x8_cm3 = new HeightWidthDepth( 110, 120, depth, 3 );
  globalThis.testSet_110x120x8_cm2 = new HeightWidthDepth( 110, 120, depth, 2 );
  globalThis.testSet_110x120x8_cm1 = new HeightWidthDepth( 110, 120, depth, 1 );
  globalThis.testSet_110x120x8_cm0 = new HeightWidthDepth( 110, 120, depth, 0 );
  globalThis.testSet_110x120x8_cmNegative = new HeightWidthDepth( 110, 120, depth, -1 );

  globalThis.testSet_110x120x8_All = [
    globalThis.testSet_110x120x8_cm32,
    globalThis.testSet_110x120x8_cm16,
    globalThis.testSet_110x120x8_cm8,
    globalThis.testSet_110x120x8_cm4,
    globalThis.testSet_110x120x8_cm3,
    globalThis.testSet_110x120x8_cm2,
    globalThis.testSet_110x120x8_cm1,
    globalThis.testSet_110x120x8_cm0,
    globalThis.testSet_110x120x8_cmNegative
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

  globalThis.testSet_110x120x8_cm32
    = globalThis.testSet_110x120x8_cm16
    = globalThis.testSet_110x120x8_cm8
    = globalThis.testSet_110x120x8_cm4
    = globalThis.testSet_110x120x8_cm3
    = globalThis.testSet_110x120x8_cm2
    = globalThis.testSet_110x120x8_cm1
    = globalThis.testSet_110x120x8_cm0
    = globalThis.testSet_110x120x8_cmNegative
    = null;
}
