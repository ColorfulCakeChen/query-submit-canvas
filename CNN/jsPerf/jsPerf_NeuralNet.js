export { init, testCorrectness, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
//import * as ActivationEscaping from "../Conv/ActivationEscaping.js";
//import * as BoundsArraySet from "../Conv/BoundsArraySet.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
import * as NeuralNet_Reference from "./Ref/NeuralNet_Reference.js";
import * as NeuralNet_TestParams from "./Ref/NeuralNet_TestParams.js"; 
import * as ImageSourceBag from "./Ref/ImageSourceBag.js"; 
import * as NumberImage from "./Ref/NumberImage.js"; 
import * as BatchIdCalculator from "./BatchIdCalculator.js";

/**
 * Test CNN NeuralNet.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/20203/74/colorfulcakechen-cnn-neuralnet-4ae5459fd402f30f14dfd544}
 */

/**
 * 
 */
class PerformanceTestCase extends Recyclable.Root {

  /**
   * Used as default NeuralNet.ParamsBase provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "PerformanceTestCase.Pool",
    PerformanceTestCase, PerformanceTestCase.setAsConstructor );

  /**
   */
  constructor( testCaseId, testCaseName, neuralNetParamsBase ) {
    super();
    PerformanceTestCase.setAsConstructor_self.call( this,
      testCaseId, testCaseName, neuralNetParamsBase
    );
  }

  /** @override */
  static setAsConstructor( testCaseId, testCaseName, neuralNetParamsBase ) {
    super.setAsConstructor();
    PerformanceTestCase.setAsConstructor_self.call( this,
      testCaseId, testCaseName, neuralNetParamsBase
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self( testCaseId, testCaseName, neuralNetParamsBase ) {
    this.testCaseId = testCaseId;
    this.testCaseName = testCaseName;
    this.neuralNetParamsBase = neuralNetParamsBase;
    this.neuralNet = undefined;
    //this.inputTensor3d = undefined;
  }

  /** @override */
  disposeResources() {
    this.neuralNet?.disposeResources_and_recycleToPool();
    this.neuralNet = null;

    this.neuralNetParamsBase?.disposeResources_and_recycleToPool();
    this.neuralNetParamsBase = null;

    this.testCaseName = undefined;
    this.testCaseId = undefined;

    super.disposeResources();
  }

  /**
   * Create .neuralNet
   */
  prepare() {
    try {
      let neuralNetTestParams
        = NeuralNet_TestParams.Base.Pool.get_or_create_by( this.testCaseId );

      neuralNetTestParams.set_byParamsBase( this.neuralNetParamsBase );

//!!! (2022/08/16 Remarked) Use canvas instead.
//       // Pre-create performance test case's input image.
//       let inputImage = this.testPerformance_imageSourceBag.getImage_by(
//         neuralNetTestParams.out.input_height,
//         neuralNetTestParams.out.input_width,
//         neuralNetTestParams.out.input_channelCount );
//
//       // Pre-create performance test case's input tensor.
//       let inputTensor3d = this.testPerformance_imageSourceBag.getTensor3d_by(
//         neuralNetTestParams.out.input_height,
//         neuralNetTestParams.out.input_width,
//         neuralNetTestParams.out.input_channelCount );

      this.neuralNet = NeuralNet_Reference.Base.NeuralNet_create( neuralNetTestParams );

      neuralNetTestParams.disposeResources_and_recycleToPool();
      neuralNetTestParams = null;

      console.log( `NeuralNet.${this.testCaseName}: tensorWeightCount = { `
        + `Extracted: ${this.neuralNet.tensorWeightCountExtracted}, `
        + `Total: ${this.neuralNet.tensorWeightCountTotal} }` );

    } catch ( e ) {
      debugger;
      throw e;
    }
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
    this.testCanvas = null;
  }

  /**
   * 
   */
  neuralNet_PerformanceTest_addCase( testCaseId, testCaseName, neuralNetParamsBase ) {
    let aPerformanceTestCase = PerformanceTestCase.Pool.get_or_create_by(
      testCaseId, testCaseName, neuralNetParamsBase );

    this.testCaseMap.set( testCaseName, aPerformanceTestCase );
  }

  neuralNet_PerformanceTest_init() {

    // Release dataTensor3d too. Because perofrmance testing uses larger different input image from correctness testing.
    this.disposeResources();

    // Larger input image for performance testing.
    this.testPerformance_imageSourceBag = ImageSourceBag.Base.Pool.get_or_create_by( "int32" );

    {
      let largerHeight = this.height * 20;
      let largerWidth = this.width * 20;
      let inputChannelCount = this.depth; // Must be 4;

      this.testCanvas = document.createElement( "canvas" );
      this.testCanvas.height = largerHeight;
      this.testCanvas.width = largerWidth;

      let inputImage = this.testPerformance_imageSourceBag.getImage_by(
        largerHeight, largerWidth, inputChannelCount );

      let ctx = this.testCanvas.getContext( "2d" );
      let imageData = ctx.createImageData( largerHeight, largerWidth );
      for ( let i = 0; i < imageData.data.length; ++i ) {
        imageData.data[ i ] = inputImage.dataArray[ i ];
      }

      ctx.putImageData( imageData, 0 , 0 );
    }

    this.testPerformance_imageSourceBag.clear(); // Reduce memory.


    if ( this.testCaseMap )
      this.testCaseMap.clear();
    else
      this.testCaseMap = new Map();

    let vocabularyChannelCount = 2; //4;
    let vocabularyCountPerInputChannel = 256;
    let stageCountRequested = 7; //5;
    let blockCountRequested = 5; //5;

    // The neuralNet performance testing should not keep-input-tensor. The reason input
    // image is created from canvas in real time.
    let bKeepInputTensor = false;

    // input_height, input_width, input_channelCount,
    // vocabularyChannelCount, vocabularyCountPerInputChannel,
    // nConvStageTypeId,
    // stageCountRequested, blockCountRequested, bKeepInputTensor
    //

    // Test Case 0: (MobileNetV1)
    this.neuralNet_PerformanceTest_addCase( 0, "MobileNetV1",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1,
        stageCountRequested, blockCountRequested, bKeepInputTensor
      ) );

    // Test Case 1: (MobileNetV1_padValid)
    this.neuralNet_PerformanceTest_addCase( 1, "MobileNetV1_padValid",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V1_PAD_VALID,
        stageCountRequested, blockCountRequested, bKeepInputTensor
      ) );

    // Test Case 2: (MobileNetV2_Thin)
    this.neuralNet_PerformanceTest_addCase( 2, "MobileNetV2_Thin",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2_THIN,
        stageCountRequested, blockCountRequested, bKeepInputTensor
      ) );

    // Test Case 3: (MobileNetV2)
    this.neuralNet_PerformanceTest_addCase( 3, "MobileNetV2",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        ValueDesc.ConvStageType.Singleton.Ids.MOBILE_NET_V2,
        stageCountRequested, blockCountRequested, bKeepInputTensor
      ) );

    // Test Case 4: (ShuffleNetV2))
    this.neuralNet_PerformanceTest_addCase( 4, "ShuffleNetV2",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2,
        stageCountRequested, blockCountRequested, bKeepInputTensor
      ) );

    // Test Case 5: (ShuffleNetV2_byPointwise21)
    this.neuralNet_PerformanceTest_addCase( 5, "ShuffleNetV2_byPointwise21",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_POINTWISE21,
        stageCountRequested, blockCountRequested, bKeepInputTensor
      ) );

    // Test Case 6: (ShuffleNetV2_byMobileNetV1)
    this.neuralNet_PerformanceTest_addCase( 6, "ShuffleNetV2_byMobileNetV1",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1,
        stageCountRequested, blockCountRequested, bKeepInputTensor
      ) );

    // Test Case 7: (ShuffleNetV2_byMobileNetV1_padValid)
    this.neuralNet_PerformanceTest_addCase( 7, "ShuffleNetV2_byMobileNetV1_padValid",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID,
        stageCountRequested, blockCountRequested, bKeepInputTensor
      ) );
  }

  /** Release testCase.neuralNet, but keep testCase. */
  neuralNet_PerformanceTest_release_neuralNet() {
    if ( this.testCaseMap ) {
      for ( let testCase of this.testCaseMap.values() ) {
        if ( testCase.neuralNet ) {
          testCase.neuralNet.disposeResources_and_recycleToPool();
          testCase.neuralNet = null;
        }
      }
    }
  }

  neuralNet_PerformanceTest_release() {
    if ( this.testCaseMap ) {
      for ( let testCase of this.testCaseMap.values() ) {
        testCase.disposeResources_and_recycleToPool();
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

    // First time test this case. Release all other neural network (so that there will
    // be enough memory). Create the specified neural network.
    if ( !testCase.neuralNet ) {
      this.neuralNet_PerformanceTest_release_neuralNet();
      testCase.prepare();
    }

    let neuralNet = testCase.neuralNet;

    let inputTensor3d = neuralNet.create_ScaledSourceTensor_from_PixelData(
      this.testCanvas );

    let outputTensor3d = neuralNet.apply( inputTensor3d );
    tf.dispose( outputTensor3d );
  }

  /** Testing whether the results of different implementation are the same. */
  * testCorrectness() {

    //!!! (2022/08/16 Temp Skipped) For speed up into performance testing.
    //if ( 0 )
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
  // Using ( 1 / 15 ) of computer screen ( 1080 * 1920 ) (i.e. ( 72 * 128 )).
  globalThis.testSet_72x128x4 = new HeightWidthDepth( 72, 128, depth ); // height, width, depth
 
  globalThis.testSet_All = [
    globalThis.testSet_72x128x4
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

  globalThis.testSet_72x128x4
    = null;
}
