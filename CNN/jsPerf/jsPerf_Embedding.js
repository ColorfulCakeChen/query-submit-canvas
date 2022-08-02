export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
//import * as RandTools from "../util/RandTools.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as ActivationEscaping from "../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
import * as Embedding from "../Conv/Embedding.js";
import * as Embedding_Reference from "./Ref/Embedding_Reference.js";
import * as Embedding_TestParams from "./Ref/Embedding_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 
import * as NumberImage from "./Ref/NumberImage.js"; 
import * as BatchIdCalculator from "./BatchIdCalculator.js";

/**
 * Test CNN Embedding.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/11003/167/colorfulcakechen-cnn-embedding-dad4fcc3e48e96d2533b2c67}
 */

/**
 * 
 */
 class PerformanceTestCase {
  constructor( testCaseId, testCaseName, embeddingTestParams, embedding, inputTensor3d ) {
    this.testCaseId = testCaseId;
    this.testCaseName = testCaseName;
    this.embeddingTestParams = embeddingTestParams;
    this.embedding = embedding;
    this.inputTensor3d = inputTensor3d;
  }
}

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

    this.disposeResources();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;
  }

  disposeResources() {
    this.embedding_PerformanceTest_release();
  }
  /**
   * 
   */
   embedding_PerformanceTest_addCase( testCaseName, embeddingTestParams ) {
    try {

      // Pre-create performance test case's input image.
      let inputImage = this.testPerformance_imageSourceBag.getImage_by(
        embeddingTestParams.out.input_height,
        embeddingTestParams.out.input_width,
        embeddingTestParams.out.input_channelCount );

      // Pre-create performance test case's input tensor.
      let inputTensor3d = this.testPerformance_imageSourceBag.getTensor3d_by(
        embeddingTestParams.out.input_height,
        embeddingTestParams.out.input_width,
        embeddingTestParams.out.input_channelCount );

      let EmbeddingClass;
      {
        if ( ( embeddingTestParams.id % 2 ) == 0 )
          EmbeddingClass = Embedding.AddGatherReshape;
        else
          EmbeddingClass = Embedding.SplitReshapeGatherConcat;
      }

      let embedding = Embedding_Reference.Base.Embedding_create(
        EmbeddingClass, embeddingTestParams, inputImage.boundsArraySet.output0 );

      let aPerformanceTestCase = new PerformanceTestCase(
        embeddingTestParams.id, testCaseName, embeddingTestParams, embedding, inputTensor3d );

      this.testCaseMap.set( testCaseName, aPerformanceTestCase );

      console.log( `Embedding.${testCaseName}: tensorWeightCount = { `
        + `Extracted: ${embedding.tensorWeightCountExtracted}, `
        + `Total: ${embedding.tensorWeightCountTotal} }` );

    } catch ( e ) {
      debugger;
      throw e;
    }
  }

  embedding_PerformanceTest_init() {

    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeResources();

    // Larger input image for performance testing.
    this.testPerformance_imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by( "int32 ");

    let vocabularyCountPerInputChannel = 256;
    let bEmbedVocabularyId = true;

    // input_height, input_width, input_channelCount,
    // channelMultiplier, vocabularyCountPerInputChannel, bEmbedVocabularyId,
    // bKeepInputTensor
    //
    // The embedding performance testing should:
    //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
    //

    if ( this.testCaseMap )
      this.testCaseMap.clear();
    else
      this.testCaseMap = new Map();

    // Test Case 0: (AddGatherReshape, ( channelMultiplier == 1 ))
    this.embedding_PerformanceTest_addCase( "AddGatherReshape_channelMultiplier_1",
      ( new Embedding_TestParams.Base( 0 ) ).set_byParamsScattered(
        this.height, this.width, this.depth, 1,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) );

    // Test Case 1: (SplitReshapeGatherConcat, ( channelMultiplier == 1 ))
    this.embedding_PerformanceTest_addCase( "SplitReshapeGatherConcat_channelMultiplier_1",
      ( new Embedding_TestParams.Base( 1 ) ).set_byParamsScattered(
        this.height, this.width, this.depth, 1,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) );

    // Test Case 2: (AddGatherReshape, ( channelMultiplier == 2 ))
    this.embedding_PerformanceTest_addCase( "AddGatherReshape_channelMultiplier_2",
      ( new Embedding_TestParams.Base( 2 ) ).set_byParamsScattered(
        this.height, this.width, this.depth, 2,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) );

    // Test Case 3: (SplitReshapeGatherConcat, ( channelMultiplier == 2 ))
    this.embedding_PerformanceTest_addCase( "SplitReshapeGatherConcat_channelMultiplier_2",
      ( new Embedding_TestParams.Base( 3 ) ).set_byParamsScattered(
        this.height, this.width, this.depth, 2,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) );

    // Test Case 4: (AddGatherReshape, ( channelMultiplier == 4 ))
    this.embedding_PerformanceTest_addCase( "AddGatherReshape_channelMultiplier_4",
      ( new Embedding_TestParams.Base( 4 ) ).set_byParamsScattered(
        this.height, this.width, this.depth, 4,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) );

    // Test Case 5: (SplitReshapeGatherConcat, ( channelMultiplier == 4 ))
    this.embedding_PerformanceTest_addCase( "SplitReshapeGatherConcat_channelMultiplier_4",
      ( new Embedding_TestParams.Base( 5 ) ).set_byParamsScattered(
        this.height, this.width, this.depth, 4,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) );

    // Test Case 6: (AddGatherReshape, ( channelMultiplier == 8 ))
    this.embedding_PerformanceTest_addCase( "AddGatherReshape_channelMultiplier_8",
      ( new Embedding_TestParams.Base( 6 ) ).set_byParamsScattered(
        this.height, this.width, this.depth, 8,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) );

    // Test Case 7: (SplitReshapeGatherConcat, ( channelMultiplier == 8 ))
    this.embedding_PerformanceTest_addCase( "SplitReshapeGatherConcat_channelMultiplier_8",
      ( new Embedding_TestParams.Base( 7 ) ).set_byParamsScattered(
        this.height, this.width, this.depth, 8,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) );
  }

  embedding_PerformanceTest_release() {
    if ( this.testCaseMap ) {
      for ( let name_testCase of this.testCaseMap.entries() ) {
        let name = name_testCase[ 0 ];
        let testCase = name_testCase[ 1 ];
        if ( testCase.embedding ) {
          testCase.embedding.disposeResources_and_recycleToPool();
        }
      }
      this.testCaseMap.clear();
    }

    if ( this.testPerformance_imageSourceBag ) {
      this.testPerformance_imageSourceBag.disposeResources_and_recycleToPool();
      this.testPerformance_imageSourceBag = null;
    }
  }

  /** Test apply by Xxx */
  testEmbedding_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );
    let embedding = testCase.embedding;
    let outputTensor3d = embedding.apply( testCase.inputTensor3d );
    tf.dispose( outputTensor3d );
  }

  /** Testing whether the results of different implementation are the same. */
  * testCorrectness() {

//!!! (2022/08/02 Temp Remarked) For speed-up PerformanceTest.
    if ( 0 ) {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      yield;

      {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

        {
          // Note: imageSourceBag should not be created outside tidy() because tidy() will dispose tensors
          //       dynamically created in them.
          let imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by( "int32" );

          let testParams = Embedding_TestParams.Base.Pool.get_or_create_by();
          let testParamsGenerator = testParams.ParamsGenerator();
          let testReference = Embedding_Reference.Base.Pool.get_or_create_by();

          let batchIdCalculator = new BatchIdCalculator.Base( 100 * 1000 );

          try {
            for ( testParams of testParamsGenerator ) {
              let bDisplayed = batchIdCalculator.checkAndDisplay( testParams.id );
              if ( bDisplayed )
                yield; // Since just entering a new batch section, take a break so that memory garbage collector could be activated to work.

              testReference.testCorrectness( imageSourceBag, testParams );
            }

          } catch ( e ) {
            let backendName = tf.getBackend();
            let msg = `jsPerf_Embedding.js: testCorrectness(): backendName=${backendName}, `
              + `Embedding, (yieldCount == ${testParams.yieldCount}), testParams.id == ${testParams.id}`;

            console.log( msg );
            alert( `${msg}\n${e}` );

            //debugger;
            throw e;
          }

          batchIdCalculator.checkAndDisplay( testParams.id );

          testReference.disposeResources_and_recycleToPool(); testReference = null;
          testParams.disposeResources_and_recycleToPool(); testParams = null;
          imageSourceBag.disposeResources_and_recycleToPool(); imageSourceBag = null;
        }

        let memoryInfo_testCorrectness_after = tf.memory();

        if ( memoryInfo_testCorrectness_after.numTensors != memoryInfo_testCorrectness_before.numTensors )
          throw Error( `testCorrectness() memory leak. `
            + `result tensor count (${memoryInfo_testCorrectness_after.numTensors}) `
            + `should be (${memoryInfo_testCorrectness_before.numTensors} `
          );
      }

      Pool.Asserter.assert_Pool_issuedCount( "jsPerf_Block.HeightWidthDepth.testCorrectness()", pool_all_issuedCount_before );
      yield;
    }

    try {
      // After correctness testing done, create all Embedding for performance testing.
      this.embedding_PerformanceTest_init();
    } catch ( e ) {
      debugger;
      throw e;
    }
  }

}


function init() {
  //console.log("jsPerf_Embedding.js, init()");

  disposeResources();

  let depth = 4;

  // Using mobile phone's resolution ( 1080 * 2160 ) will crash the computer.
  // Using ( 1 / 10 ) of computer screen ( 1080 * 1920 ).
  globalThis.testSet_108x192x4 = new HeightWidthDepth( 108, 192, depth ); // height, width, depth

  globalThis.testSet_All = [
    globalThis.testSet_108x192x4
  ];
}

function* testCorrectness() {
  for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
    let testSet = globalThis.testSet_All[ i ];
    yield* testSet.testCorrectness();
  }
}

function disposeResources() {
  if ( globalThis.testSet_All ) {
    for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
      let testSet = globalThis.testSet_All[ i ];
      if ( testSet )
        testSet.disposeResources();
    }

    globalThis.testSet_All = null;
  }

  globalThis.testSet_108x192x4
    = null;
}
