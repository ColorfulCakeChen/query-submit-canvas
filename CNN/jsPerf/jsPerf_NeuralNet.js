export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
//import * as ActivationEscaping from "../Conv/ActivationEscaping.js";
import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
import * as NeuralNet_Reference from "./Ref/NeuralNet_Reference.js";
import * as NeuralNet_TestParams from "./Ref/NeuralNet_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 
import * as NumberImage from "./Ref/NumberImage.js"; 
import * as BatchIdCalculator from "./BatchIdCalculator.js";

/**
 * Test CNN NeuralNet.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/15055/276/colorfulcakechen-cnn-neuralNet-d6ccfe788187ea0914923e15e5bf}
 */

/**
 * 
 */
 class PerformanceTestCase {
  constructor( testCaseId, testCaseName, neuralNetTestParams, neuralNet, inputTensor3d ) {
    this.testCaseId = testCaseId;
    this.testCaseName = testCaseName;
    this.neuralNetTestParams = neuralNetTestParams;
    this.neuralNet = neuralNet;
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
    this.neuralNet_PerformanceTest_release();
  }

  /**
   * 
   */
  neuralNet_PerformanceTest_addCase( testCaseName, neuralNetTestParams ) {
    try {

      // Pre-create performance test case's input image.
      let inputImage = this.testPerformance_imageSourceBag.getImage_by(
        neuralNetTestParams.out.input_height,
        neuralNetTestParams.out.input_width,
        neuralNetTestParams.out.input_channelCount );

      // Pre-create performance test case's input tensor.
      let inputTensor3d = this.testPerformance_imageSourceBag.getTensor3d_by(
        neuralNetTestParams.out.input_height,
        neuralNetTestParams.out.input_width,
        neuralNetTestParams.out.input_channelCount );

      let neuralNet = NeuralNet_Reference.Base.NeuralNet_create( neuralNetTestParams );

      let aPerformanceTestCase = new PerformanceTestCase(
        neuralNetTestParams.id, testCaseName, neuralNetTestParams, neuralNet, inputTensor3d );

      this.testCaseMap.set( testCaseName, aPerformanceTestCase );

      console.log( `NeuralNet.${testCaseName}: tensorWeightCount = { `
        + `Extracted: ${neuralNet.tensorWeightCountExtracted}, `
        + `Total: ${neuralNet.tensorWeightCountTotal} }` );

    } catch ( e ) {
      debugger;
      throw e;
    }
  }

  neuralNet_PerformanceTest_init() {

    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeResources();

    // Larger input image for performance testing.
    this.testPerformance_imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by( "int32" );

    if ( this.testCaseMap )
      this.testCaseMap.clear();
    else
      this.testCaseMap = new Map();

    let vocabularyChannelCount = 8;
    let vocabularyCountPerInputChannel = 256;
    let stageCountRequested = 10;
    let blockCountRequested = 10;

    // input_height, input_width, input_channelCount,
    // vocabularyChannelCount, vocabularyCountPerInputChannel,
    // nConvStageTypeId,
    // stageCountRequested, blockCountRequested, bKeepInputTensor
    //
    // The neuralNet performance testing should:
    //   - ( bKeepInputTensor == true ). Otherwise, the this.dataTensor3d will be destroyed.
    //

    // Test Case 0: (MobileNetV1)
    this.neuralNet_PerformanceTest_addCase( "MobileNetV1",
      ( new NeuralNet_TestParams.Base( 0 ) ).set_byParamsScattered(
        this.height, this.width, this.depth,
        this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
        ValueDesc.ConvNeuralNetType.Singleton.Ids.MOBILE_NET_V1,
        this.stageCountRequested, this.blockCountRequested, true
      ) );

    // Test Case 1: (MobileNetV1_padValid)
    this.neuralNet_PerformanceTest_addCase( "MobileNetV1_padValid",
      ( new NeuralNet_TestParams.Base( 1 ) ).set_byParamsScattered(
        this.height, this.width, this.depth,
        this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
        ValueDesc.ConvNeuralNetType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID,
        this.stageCountRequested, this.blockCountRequested, true
      ) );

    // Test Case 2: (MobileNetV2_Thin)
    this.neuralNet_PerformanceTest_addCase( "MobileNetV2_Thin",
      ( new NeuralNet_TestParams.Base( 2 ) ).set_byParamsScattered(
        this.height, this.width, this.depth,
        this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
        ValueDesc.ConvNeuralNetType.Singleton.Ids.MOBILE_NET_V2_THIN,
        this.stageCountRequested, this.blockCountRequested, true
      ) );

    // Test Case 3: (MobileNetV2)
    this.neuralNet_PerformanceTest_addCase( "MobileNetV2",
      ( new NeuralNet_TestParams.Base( 3 ) ).set_byParamsScattered(
        this.height, this.width, this.depth,
        this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
        ValueDesc.ConvNeuralNetType.Singleton.Ids.MOBILE_NET_V2,
        this.stageCountRequested, this.blockCountRequested, true
      ) );

    // Test Case 4: (ShuffleNetV2))
    this.neuralNet_PerformanceTest_addCase( "ShuffleNetV2",
      ( new NeuralNet_TestParams.Base( 4 ) ).set_byParamsScattered(
        this.height, this.width, this.depth,
        this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
        ValueDesc.ConvNeuralNetType.Singleton.Ids.SHUFFLE_NET_V2,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      ) );

    // Test Case 5: (ShuffleNetV2_byPointwise21)
    this.neuralNet_PerformanceTest_addCase( "ShuffleNetV2_byPointwise21",
      ( new NeuralNet_TestParams.Base( 5 ) ).set_byParamsScattered(
        this.height, this.width, this.depth,
        this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
        ValueDesc.ConvNeuralNetType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      ) );

    // Test Case 6: (ShuffleNetV2_byMobileNetV1)
    this.neuralNet_PerformanceTest_addCase( "ShuffleNetV2_byMobileNetV1",
      ( new NeuralNet_TestParams.Base( 6 ) ).set_byParamsScattered(
        this.height, this.width, this.depth,
        this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
        ValueDesc.ConvNeuralNetType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      ) );

    // Test Case 7: (ShuffleNetV2_byMobileNetV1_padValid)
    this.neuralNet_PerformanceTest_addCase( "ShuffleNetV2_byMobileNetV1_padValid",
      ( new NeuralNet_TestParams.Base( 7 ) ).set_byParamsScattered(
        this.height, this.width, this.depth,
        this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
        ValueDesc.ConvNeuralNetType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID,
        stepCountRequested, true,
        3, 3, true, nSqueezeExcitationChannelCountDivisor, ValueDesc.ActivationFunction.Singleton.Ids.CLIP_BY_VALUE_N2_P2,
        true
      ) );
  }

  neuralNet_PerformanceTest_release() {
    if ( this.testCaseMap ) {
      for ( let name_testCase of this.testCaseMap.entries() ) {
        let name = name_testCase[ 0 ];
        let testCase = name_testCase[ 1 ];
        if ( testCase.neuralNet ) {
          testCase.neuralNet.disposeResources_and_recycleToPool();
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
  testNeuralNet_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );
    let neuralNet = testCase.neuralNet;
    let outputTensor3d = neuralNet.apply( testCase.inputTensor3d );
    tf.dispose( outputTensor3d );
  }

  /** Testing whether the results of different implementation are the same. */
  * testCorrectness() {

    {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      //Pool.Asserter.assert_Pool_issuedCount_same_after_as_before( "jsPerf_NeuralNet.HeightWidthDepth.testCorrectness()", () => {
      //}, this );

      yield;

      {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

        {
          // Note: imageSourceBag should not be created outside tidy() because tidy() will dispose tensors
          //       dynamically created in them.
          let imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by( "int32" );

          let testParams = NeuralNet_TestParams.Base.Pool.get_or_create_by();
          let testParamsGenerator = testParams.ParamsGenerator();
          let testReference = NeuralNet_Reference.Base.Pool.get_or_create_by();

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
            let msg = `jsPerf_NeuralNet.js: testCorrectness(): backendName=${backendName}, `
              + `NeuralNet, (yieldCount == ${testParams.yieldCount}), testParams.id == ${testParams.id}`;

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
      // After correctness testing done, create all NeuralNet for performance testing.
      this.neuralNet_PerformanceTest_init();
    } catch ( e ) {
      debugger;
      throw e;
    }
  }

}


function init() {
  //console.log("jsPerf_NeuralNet.js, init()");

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
