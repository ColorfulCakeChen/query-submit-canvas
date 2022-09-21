export { init, testCorrectness_asyncGenerator, disposeResources };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as ValueMax from "../util/ValueMax.js";
import * as RandTools from "../util/RandTools.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
// import * as NeuralNet_Reference from "./Ref/NeuralNet_Reference.js";
// import * as NeuralNet_TestParams from "./Ref/NeuralNet_TestParams.js";
import * as NeuralWorker from "../NeuralDEvolution/NeuralWorker.js";
import * as TestParams from "./Ref/TestParams.js";
import * as ImageSourceBag from "./Ref/ImageSourceBag.js";
import * as NumberImage from "./Ref/NumberImage.js";
import * as BatchIdCalculator from "./BatchIdCalculator.js";

/**
 * Test CNN NeuralWorker.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/21143/5/colorfulcakechen-cnn-neuralworker-edaf1fa0c096fb41e860b}
 */

/**
 * 
 */
class PerformanceTestCase extends Recyclable.Root {

  /**
   * Used as default PerformanceTestCase provider for conforming to Recyclable interface.
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
  static setAsConstructor(
    testCaseId, testCaseName, neuralNetParamsBase, nNeuralWorker_ModeId ) {

    super.setAsConstructor();
    PerformanceTestCase.setAsConstructor_self.call( this,
      testCaseId, testCaseName, neuralNetParamsBase, nNeuralWorker_ModeId
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    testCaseId, testCaseName, neuralNetParamsBase, nNeuralWorker_ModeId ) {

    this.testCaseId = testCaseId;
    this.testCaseName = testCaseName;
    this.neuralNetParamsBase = neuralNetParamsBase;
    this.nNeuralWorker_ModeId = nNeuralWorker_ModeId;
    this.neuralWorkerProxies = undefined;
    //this.inputTensor3d = undefined;
  }

  /** @override */
  disposeResources() {
    this.neuralWorkerProxies?.disposeResources_and_recycleToPool();
    this.neuralWorkerProxies = null;

    this.neuralNetParamsBase?.disposeResources_and_recycleToPool();
    this.neuralNetParamsBase = null;

    this.testCaseName = undefined;
    this.testCaseId = undefined;

    super.disposeResources();
  }

  /**
   * Create .neuralWorkerProxies
   */
  async prepare_async() {
    try {

      let neuralWorkerProxies = this.neuralWorkerProxies
        = NeuralWorker.Proxies.Pool.get_or_create_by();

      let bInitOkPromise = neuralWorkerProxies.init_async( this.nNeuralWorker_ModeId );

      if ( !PerformanceTestCase.randomTestWeightArray ) {
        const weightArrayLength = ( 100 * 1024 * 1024 );
        PerformanceTestCase.randomTestWeightArray = new Float32Array( weightArrayLength );

        RandTools.fill_numberArray(
          PerformanceTestCase.randomTestWeightArray,
          1, 1, weightArrayLength, // height, width, channelCount,
          TestParams.Base.weightsValueBegin,
          TestParams.Base.weightsValueStep,
          TestParams.Base.weightsRandomOffset.min,
          TestParams.Base.weightsRandomOffset.max,
          TestParams.Base.weightsDivisorForRemainder
        );
      }

      let neuralNetParamsBaseArray;
      {
        let neuralNetParams0 = this.neuralNetParamsBase.clone();
        let neuralNetParams1 = this.neuralNetParamsBase.clone();
        neuralNetParamsBaseArray = [ neuralNetParams0, neuralNetParams1 ];
      }

      let weightArrayBufferArray;
      {
        let weightArray0 = new Float32Array( PerformanceTestCase.randomTestWeightArray );
        let weightArray1 = new Float32Array( PerformanceTestCase.randomTestWeightArray );
        weightArrayBufferArray = [ weightArray0.buffer, weightArray1.buffer ];
      }
  
      let markValueArray = [ 0, 255 ];

      let bInitOk = await bInitOkPromise;
      if ( false == bInitOk )
        throw Error( `Failed to initialize neuralWorkerProxies object. `
          + `${neuralWorkerProxies}` );

      let bCreateOkPromise = neuralWorkerProxies.NeuralNetArray_create_async(
        neuralNetParamsBaseArray, weightArrayBufferArray );

      let bCreateOk = await bCreateOkPromise;
      if ( false == bCreateOk )
        throw Error( `Failed to create neural networks by neuralWorkerProxies. `
          + `${neuralWorkerProxies}` );

      let bSetOkPromise
        = neuralWorkerProxies.alignmentMarkArray_setValue_async( markValueArray );

      let bSetOk = await bSetOkPromise;
      if ( false == bSetOk )
        throw Error( `Failed to set alignment mark by neuralWorkerProxies. `
          + `${neuralWorkerProxies}` );

    } catch ( e ) {
      debugger;
      console.log( e );
      throw e;
    }
  }

  /** A simple longer weights Float32Array instead of NeuralNet_TestParams.
   *
   * Because NeuralNet_TestParams and normal Array needs lots of memory when
   * neural network is large.
   */
  static randomTestWeightArray;

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
    this.neuralWorker_PerformanceTest_release();
    this.testCanvas = null;
  }

  /**
   * 
   */
  neuralWorker_PerformanceTest_addCase(
    testCaseId, testCaseName, neuralNetParamsBase, nNeuralWorker_ModeId ) {

    let aPerformanceTestCase = PerformanceTestCase.Pool.get_or_create_by(
      testCaseId, testCaseName, neuralNetParamsBase, nNeuralWorker_ModeId );

    this.testCaseMap.set( testCaseName, aPerformanceTestCase );
  }

  /** */
  neuralWorker_PerformanceTest_init() {

    this.disposeResources();

    // Larger input image for performance testing.
    this.testPerformance_imageSourceBag
      = ImageSourceBag.Base.Pool.get_or_create_by( "int32" );

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

    let vocabularyChannelCount = 8; //4;
    let vocabularyCountPerInputChannel = 256;
    let nConvStageType
      = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID;

    let blockCountTotalRequested = 100; //50; //20; //10;
    let output_channelCount = 4; //400; //300; //64;

    // ShuffleNetV2 uses twice block count to compensate reduced channel count.
    //let blockCountTotalRequested_ShuffleNet = blockCountTotalRequested * 2;
    let blockCountTotalRequested_ShuffleNet = blockCountTotalRequested;

    // The neuralNet performance testing should not keep-input-tensor becuse the
    // input image is created from canvas in real time.
    let bKeepInputTensor = false;

    // input_height, input_width, input_channelCount,
    // vocabularyChannelCount, vocabularyCountPerInputChannel,
    // nConvStageTypeId,
    // blockCountTotalRequested, output_channelCount, bKeepInputTensor
    //

    // Test Case 0: (ONE_WORKER__ONE_SCALE__FILL)
    this.neuralWorker_PerformanceTest_addCase( 0, "ONE_WORKER__ONE_SCALE__FILL",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        nConvStageType,
        blockCountTotalRequested_ShuffleNet, output_channelCount, bKeepInputTensor
      ),
      NeuralWorker.Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__FILL
    );

    // Test Case 1: (ONE_WORKER__ONE_SCALE__NO_FILL)
    this.neuralWorker_PerformanceTest_addCase( 1, "ONE_WORKER__ONE_SCALE__NO_FILL",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        nConvStageType,
        blockCountTotalRequested_ShuffleNet, output_channelCount, bKeepInputTensor
      ),
      NeuralWorker.Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__NO_FILL
    );

    // Test Case 2: (TWO_WORKER__ONE_SCALE__FILL)
    this.neuralWorker_PerformanceTest_addCase( 2, "TWO_WORKER__ONE_SCALE__FILL",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        nConvStageType,
        blockCountTotalRequested_ShuffleNet, output_channelCount, bKeepInputTensor
      ),
      NeuralWorker.Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__FILL
    );

    // Test Case 3: (TWO_WORKER__ONE_SCALE__NO_FILL)
    this.neuralWorker_PerformanceTest_addCase( 3, "TWO_WORKER__ONE_SCALE__NO_FILL",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        nConvStageType,
        blockCountTotalRequested_ShuffleNet, output_channelCount, bKeepInputTensor
      ),
      NeuralWorker.Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL
    );

    // Test Case 4: (TWO_WORKER__TWO_SCALE__NO_FILL)
    this.neuralWorker_PerformanceTest_addCase( 4, "TWO_WORKER__TWO_SCALE__NO_FILL",
      NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.height, this.width, this.depth,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        nConvStageType,
        blockCountTotalRequested_ShuffleNet, output_channelCount, bKeepInputTensor
      ),
      NeuralWorker.Mode.Singleton.Ids.TWO_WORKER__TWO_SCALE__NO_FILL
    );
  }

  /** Release testCase.neuralWorkerProxies, but keep testCase. */
  neuralWorker_PerformanceTest_release_neuralWorkerProxies() {
    if ( this.testCaseMap ) {
      for ( let testCase of this.testCaseMap.values() ) {
        if ( testCase.neuralWorkerProxies ) {
          testCase.neuralWorkerProxies.disposeResources_and_recycleToPool();
          testCase.neuralWorkerProxies = null;
        }
      }
    }
  }

  neuralWorker_PerformanceTest_release() {
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

  /** Test .ImageData_process_async by Xxx */
  async testNeuralWorker_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );

    // First time test this case. Release all other test cases' neural networks
    // (so that there will be enough memory). Create the specified neural network.
    if ( !testCase.neuralWorkerProxies ) {
      this.neuralWorker_PerformanceTest_release_neuralWorkerProxies();
      await testCase.prepare_async();
    }

    let imageData;
    {
      let ctx = this.testCanvas.getContext( "2d" );
      imageData = ctx.getImageData( 0, 0, this.testCanvas.width, this.testCanvas.height );
    }

    let neuralWorkerProxies = testCase.neuralWorkerProxies;

    let resultArrayArayPromise
      = neuralWorkerProxies.ImageData_process_async( imageData );

    let resultArrayAray = await resultArrayArayPromise;
  }

  /** Testing whether the results of different implementation are the same. */
  async* testCorrectness_asyncGenerator() {

    //!!! (2022/09/21 Temp Skipped) For speed up into performance testing.
    //if ( 0 )
    {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      //Pool.Asserter.assert_Pool_issuedCount_same_after_as_before( "jsPerf_NeuralNet.HeightWidthDepth.testCorrectness()", () => {
      //}, this );

      yield;

      {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

        {
          this.neuralWorker_PerformanceTest_init();

          yield await this.testNeuralWorker_ByName( "ONE_WORKER__ONE_SCALE__FILL" );
          yield await this.testNeuralWorker_ByName( "ONE_WORKER__ONE_SCALE__NO_FILL" );
          yield await this.testNeuralWorker_ByName( "TWO_WORKER__ONE_SCALE__FILL" );
          yield await this.testNeuralWorker_ByName( "TWO_WORKER__ONE_SCALE__NO_FILL" );
          yield await this.testNeuralWorker_ByName( "TWO_WORKER__TWO_SCALE__NO_FILL" );

// //!!! (2022/09/21 Remarked)
//           let batchIdCalculator = new BatchIdCalculator.Base( 100 * 1000 );
//
//           try {
//             for ( testParams of testParamsGenerator ) {
//               let bDisplayed = batchIdCalculator.checkAndDisplay( testParams.id );
//               if ( bDisplayed )
//                 yield; // Since just entering a new batch section, take a break so that memory garbage collector could be activated to work.
//
//               testReference.testCorrectness( imageSourceBag, testParams );
//             }
//
//           } catch ( e ) {
//             let backendName = tf.getBackend();
//             let msg = `jsPerf_NeuralWorker.js: testCorrectness(): `
//               + `backendName=${backendName}, `
//               + `NeuralNet, (yieldCount == ${testParams.yieldCount}), `
//               + `testParams.id == ${testParams.id}`;
//
//             console.log( msg );
//             alert( `${msg}\n${e}` );
//
//             //debugger;
//             throw e;
//           }
//
//           batchIdCalculator.checkAndDisplay( testParams.id );

          this.neuralWorker_PerformanceTest_release();
        }

        let memoryInfo_testCorrectness_after = tf.memory();

        if ( memoryInfo_testCorrectness_after.numTensors != memoryInfo_testCorrectness_before.numTensors )
          throw Error( `testCorrectness() memory leak. `
            + `result tensor count (${memoryInfo_testCorrectness_after.numTensors}) `
            + `should be (${memoryInfo_testCorrectness_before.numTensors} `
          );
      }

      Pool.Asserter.assert_Pool_issuedCount(
        "jsPerf_NeuralWorker.HeightWidthDepth.testCorrectness_asyncGenerator()",
        pool_all_issuedCount_before );

      yield;
    }

    try {
      // After correctness testing done, create all NeuralNet for performance testing.
      this.neuralWorker_PerformanceTest_init();
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
  //globalThis.testSet_72x128x4 = new HeightWidthDepth( 72 * 3, 128 * 3, depth ); // height, width, depth
 
  globalThis.testSet_All = [
    globalThis.testSet_72x128x4
  ];
}

async function* testCorrectness_asyncGenerator() {
  for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
    let testSet = globalThis.testSet_All[ i ];
    yield* testSet.testCorrectness_asyncGenerator();
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
