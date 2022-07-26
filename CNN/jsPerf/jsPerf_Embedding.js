export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
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
 * @see {@link https://www.measurethat.net/Benchmarks/Show/15055/249/colorfulcakechen-cnn-embedding-af287a20950912b74dc087705bab}
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

    this.disposeResources();

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.valueCount = height * width * depth;
  }

  disposeResources() {
    if ( this.dataTensor3dArray ) {
      tf.dispose( this.dataTensor3dArray );
      this.dataTensor3dArray = null;
    }

    this.embedding_PerformanceTest_release();
  }

  embedding_PerformanceTest_init() {

    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeResources();

    // Larger input image for performance testing.
    let inputTensorCount = 1;
    this.testPerformance_NumberImageArray = Recyclable.OwnerArray.Pool.get_or_create_by( inputTensorCount );
    this.dataTensor3dArray = tf.tidy( () => {
      let inputScaleBoundsArray = ActivationEscaping.ScaleBoundsArray.Pool.get_or_create_by( this.depth );

      let dataTensor3dArray = new Array( inputTensorCount );

      let shape = [ this.height, this.width, this.depth ];
      let elementCount = tf.util.sizeFromShape( shape );

      for ( let i = 0; i < dataTensor3dArray.length; ++i ) {
        let numberBegin = ( i * elementCount );
        let numberEnd = numberBegin + elementCount;

        let image = this.testPerformance_NumberImageArray[ i ] = NumberImage.Base.Pool.get_or_create_by(
          this.height, this.width, this.depth, undefined,
          inputScaleBoundsArray, null, BoundsArraySet.InputsOutputs, Weights.Base.ValueBounds );

        for ( let j = 0; j < elementCount; ++j ) {
          image.dataArray[ j ] = numberBegin + j;
        }

        dataTensor3dArray[ i ] = tf.tensor( image.dataArray, shape );
      }

      inputScaleBoundsArray.disposeResources_and_recycleToPool();
      inputScaleBoundsArray = null;

      return dataTensor3dArray;
    });


//!!! ...unfinished... (2022/07/26)
// Test different channel multiplier and AddGatherReshape or SplitGatherConcat
// and whether bCastToInt32

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


//!!! ...unfinished... (2022/07/26)
//      Embedding.AddGatherReshape, Embedding.SplitGatherConcat,
      
    // Test Case 1: (AddGatherReshape, ( channelMultiplier == 1 ))
    this.testCaseMap.set( "AddGatherReshape_channelMultiplier_1", { testParams: 
      ( new Embedding_TestParams.Base() ).set_byParamsScattered(
        this.height, this.width, this.depth, 1,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) } );

    // Test Case 2: (SplitGatherConcat, ( channelMultiplier == 1 ))
    this.testCaseMap.set( "SplitGatherConcat_channelMultiplier_1", { testParams: 
      ( new Embedding_TestParams.Base() ).set_byParamsScattered(
        this.height, this.width, this.depth, 1,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) } );

    // Test Case 3: (AddGatherReshape, ( channelMultiplier == 2 ))
    this.testCaseMap.set( "AddGatherReshape_channelMultiplier_2", { testParams: 
      ( new Embedding_TestParams.Base() ).set_byParamsScattered(
        this.height, this.width, this.depth, 2,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) } );

    // Test Case 4: (SplitGatherConcat, ( channelMultiplier == 2 ))
    this.testCaseMap.set( "SplitGatherConcat_channelMultiplier_2", { testParams: 
      ( new Embedding_TestParams.Base() ).set_byParamsScattered(
        this.height, this.width, this.depth, 2,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) } );

    // Test Case 5: (AddGatherReshape, ( channelMultiplier == 3 ))
    this.testCaseMap.set( "AddGatherReshape_channelMultiplier_3", { testParams: 
      ( new Embedding_TestParams.Base() ).set_byParamsScattered(
        this.height, this.width, this.depth, 3,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) } );

    // Test Case 6: (SplitGatherConcat, ( channelMultiplier == 3 ))
    this.testCaseMap.set( "SplitGatherConcat_channelMultiplier_3", { testParams: 
      ( new Embedding_TestParams.Base() ).set_byParamsScattered(
        this.height, this.width, this.depth, 3,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) } );

    // Test Case 7: (AddGatherReshape, ( channelMultiplier == 4 ))
    this.testCaseMap.set( "AddGatherReshape_channelMultiplier_4", { testParams: 
      ( new Embedding_TestParams.Base() ).set_byParamsScattered(
        this.height, this.width, this.depth, 4,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) } );

    // Test Case 8: (SplitGatherConcat, ( channelMultiplier == 4 ))
    this.testCaseMap.set( "SplitGatherConcat_channelMultiplier_4", { testParams: 
      ( new Embedding_TestParams.Base() ).set_byParamsScattered(
        this.height, this.width, this.depth, 4,
        vocabularyCountPerInputChannel, bEmbedVocabularyId,
        true
      ) } );


    // Create the different Embedding objects for performance testing.
    {
      let i = 0;
      for ( let name_testCase of this.testCaseMap.entries() ) {
        let name = name_testCase[ 0 ];
        let testCase = name_testCase[ 1 ];
        try {
          if ( !testCase.embedding ) {
            let EmbeddingClass;
            {
              if ( ( i % 2 ) == 0 )
                EmbeddingClass = Embedding.AddGatherReshape;
              else
                EmbeddingClass = Embedding.SplitGatherConcat;
            }

            testCase.embedding = Embedding_Reference.Base.Embedding_create(
              EmbeddingClass, testCase.testParams,
              this.testPerformance_NumberImageArray[ 0 ].boundsArraySet.output0 );
          }
        } catch ( e ) {
          debugger;
          throw e;
        }

        console.log( `Embedding.${name}: tensorWeightCount = { Extracted: ${testCase.embedding.tensorWeightCountExtracted}, `
          + `Total: ${testCase.embedding.tensorWeightCountTotal} }` );

        ++i;
      }
    }
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

    if ( this.testPerformance_NumberImageArray ) {
      this.testPerformance_NumberImageArray.disposeResources_and_recycleToPool();
      this.testPerformance_NumberImageArray = null;
    }
  }

  /** Test apply by Xxx */
  testEmbedding_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );
    let embedding = testCase.embedding;
    let outputTensor3d = embedding.apply( this.dataTensor3dArray[ 0 ] );
    tf.dispose( outputTensor3d );
  }

  /** Testing whether the results of different implementation are the same. */
  * testCorrectness() {

    {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      yield;

      {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

        {
          // Note: imageSourceBag should not be created outside tidy() because tidy() will dispose tensors
          //       dynamically created in them.
          let imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by();

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
            + `` );
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
