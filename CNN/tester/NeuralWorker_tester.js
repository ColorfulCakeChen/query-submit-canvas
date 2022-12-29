export { init, disposeResources };
export { tester };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as ValueMax from "../util/ValueMax.js";
import * as RandTools from "../util/RandTools.js";
import * as TensorTools from "../util/TensorTools.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
import * as NeuralWorker from "../NeuralDEvolution/NeuralWorker.js";
import * as TestParams from "../jsPerf/Ref/TestParams.js";
import * as ImageSourceBag from "../jsPerf/Ref/ImageSourceBag.js";
import * as NumberImage from "../jsPerf/Ref/NumberImage.js";
import * as HTMLTable from "../Display/HTMLTable.js";

/**
 * Test CNN NeuralWorker.
 *
 * @see {@link https://www.measurethat.net/Benchmarks/Show/21143/23/colorfulcakechen-cnn-neuralworker-ce01f74239d7eff2b9e53}
 */

/**
 * 
 */
class ExecutionTimeInfo {

  constructor( times = 1 ) {
    this.name = "(unknown)";
    this.times = times;
    this.begin = 0;
    this.end = 0;
    this.elapsed = 0;
    this.elapsedTotal = 0;
  }

  get elapsedAverage() { return ( this.elapsedTotal / this.times ); }
  get countPerSecond() { return 1 / ( this.elapsedAverage / 1000 ); }

  toString() {
    let str = `${this.name}: ${this.countPerSecond} ops/sec `
      +  `(${this.times} runs sampled)`;
    return str;
  }
}

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
  constructor( testCaseId, testCaseName, neuralNetParamsBase, nNeuralWorker_ModeId ) {
    super();
    PerformanceTestCase.setAsConstructor_self.call( this,
      testCaseId, testCaseName, neuralNetParamsBase, nNeuralWorker_ModeId
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
  }

  /** @override */
  disposeResources() {
    this.preparePromise = undefined;

    this.neuralNetParamsBase?.disposeResources_and_recycleToPool();
    this.neuralNetParamsBase = null;

    this.testCaseName = undefined;
    this.testCaseId = undefined;

    super.disposeResources();
  }

  get NeuralWorker_Mode_bFill() {
    return NeuralWorker.Mode.bFill_get( this.nNeuralWorker_ModeId );
  }

  /**
   * Create .neuralWorkerProxies
   *
   * @param {NeuralWorker.Proxies} neuralWorkerProxies
   *   The shared neural worker proxies.
   */
  async prepare_async( neuralWorkerProxies ) {
    try {
      await tf.ready(); // Ensure tf.getBackend() workable.
      let backendName = tf.getBackend();

      let bInitOkPromise = neuralWorkerProxies.init_async(
        backendName, this.nNeuralWorker_ModeId );

      PerformanceTestCase.randomTestWeightArray_create();

      // Although neural network configuration will be copied (not transferred)
      // to workers, they still need be cloned because NeuralWorker.Proxy will
      // keep (i.e. owned and destroyed) them.
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

      let bInitOk = await bInitOkPromise;
      if ( !bInitOk )
        throw Error( `Failed to initialize neuralWorkerProxies object. `
          + `${neuralWorkerProxies}` );

      // (2022//09/26 Remarked)
      //const bLogDryRunTime = true; // For observing dry-run performance.
      const bLogDryRunTime = false;
      let bCreateOkPromise = neuralWorkerProxies.NeuralNetArray_create_async(
        neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime );

      let bCreateOk = await bCreateOkPromise;
      if ( !bCreateOk )
        throw Error( `Failed to create neural networks by neuralWorkerProxies. `
          + `${neuralWorkerProxies}` );

      let bFill = this.NeuralWorker_Mode_bFill;
      if ( bFill ) {
        let markValueArray = [ 0, 255 ];

        let bSetOkPromise
          = neuralWorkerProxies.alignmentMarkArray_setValue_async( markValueArray );

        let bSetOk = await bSetOkPromise;
        if ( false == bSetOk )
          throw Error( `Failed to set alignment mark by neuralWorkerProxies. `
            + `${neuralWorkerProxies}` );
      }

    } catch ( e ) {
      console.error( e );
      debugger;
      throw e;
    }
  }

  /** Try to compute neural network result in this worker. */
  NeuralNet_try_result( theCanvas ) {
    let resultFloat32Array;

    tf.tidy( () => {
      let progress, neuralNet;
      let outputTensor3d;
      try {
        let neuralNetParams = NeuralNet.Params.get_or_create_by_NeuralNetParamsBase(
          this.neuralNetParamsBase );

        progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
        neuralNet = this.neuralNet = NeuralNet.Base.Pool.get_or_create_by();

        let bInitOk = neuralNet.init( progress,
          PerformanceTestCase.randomTestWeightArray, 0, neuralNetParams );

        let strWeightCountInfo = neuralNet.toString_WeightCount();
        console.log( `NeuralNet.${this.testCaseName}: ${strWeightCountInfo}.` );

        if ( false == bInitOk )
          throw Error( `Failed to initialize neuralNet object. ${neuralNet}` );

        if ( 100 != progress.valuePercentage )
          throw Error(
            `Progress (${progress.valuePercentage}) should be 100 when initializing `
            + `NeuralNet object successfully. ${neuralNet}`);

        let inputTensor3d = neuralNet.create_ScaledSourceTensor_from_PixelData( theCanvas );
        outputTensor3d = neuralNet.apply( inputTensor3d );
        resultFloat32Array = outputTensor3d.dataSync();

      } finally {
        if ( neuralNet ) {
          neuralNet.disposeResources_and_recycleToPool();
          neuralNet = null;
        }

        if ( progress ) {
          progress.disposeResources_and_recycleToPool();
          progress = null;
        }

        if ( outputTensor3d ) {
          tf.dispose( outputTensor3d );
          outputTensor3d = null;
        }
      }
    } );

    return resultFloat32Array;
  }

  /** */
  static randomTestWeightArray_create() {
    if ( !PerformanceTestCase.randomTestWeightArray ) {
      //!!! (2022/09/25 Remarked) too large for mobile phone.
      //const weightArrayLength = ( 100 * 1024 * 1024 );
      const weightArrayLength = ( 10 * 1024 * 1024 );
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

    this.neuralWorkerProxies = NeuralWorker.Proxies.Pool.get_or_create_by();

    // Larger input image for performance testing.
    this.testPerformance_imageSourceBag
      = ImageSourceBag.Base.Pool.get_or_create_by( "int32" );

    {
      const largerFactor = 15; //20; //10;
      let largerHeight = this.height * largerFactor;
      let largerWidth = this.width * largerFactor;
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

    let vocabularyChannelCount = 8; //6; //4;
    let vocabularyCountPerInputChannel = 256;
    let nConvStageType
      = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID;

    let blockCountTotalRequested = 84; //144; //128; //100;
    let output_channelCount = 6; //12; //64; //8; //4; //400; //300; //64;
    //let output_channelCount_twice = output_channelCount * 2; // For NO_FILL

    // ShuffleNetV2 uses twice block count to compensate reduced channel count.
    //let blockCountTotalRequested_ShuffleNet = blockCountTotalRequested * 2;
    let blockCountTotalRequested_ShuffleNet = blockCountTotalRequested;

    // The neuralNet performance testing should not keep-input-tensor because the
    // input image is created from canvas in real time.
    let bKeepInputTensor = false;

    // input_height, input_width, input_channelCount,
    // vocabularyChannelCount, vocabularyCountPerInputChannel,
    // nConvStageTypeId,
    // blockCountTotalRequested, output_channelCount, bKeepInputTensor
    //

    // Create TestCases for every NeuralWorker.Mode
    for ( let i = 0; i < NeuralWorker.Mode.Singleton.integerToInfoMap.size; ++i ) {
      let theModeInfo = NeuralWorker.Mode.Singleton.integerToInfoMap.get( i );

      // Must be in the same order.
      if ( i != theModeInfo.id )
        throw Error( `NeuralWorker_tester.neuralWorker_PerformanceTest_init(): `
          + `theModeInfo.id ( ${theModeInfo.id} ) should be ( ${i} ).`
        );

      // Ensure NO_FILL has twice output channel count.
      let output_channelCount_real;
      if ( theModeInfo.bFill )
        output_channelCount_real = output_channelCount; // For FILL
      else
        output_channelCount_real = output_channelCount * 2; // For NO_FILL

      this.neuralWorker_PerformanceTest_addCase(
        theModeInfo.id, theModeInfo.nameForMessage,
        NeuralNet.ParamsBase.Pool.get_or_create_by(
          this.height, this.width, this.depth,
          vocabularyChannelCount, vocabularyCountPerInputChannel,
          nConvStageType,
          blockCountTotalRequested_ShuffleNet, output_channelCount_real, bKeepInputTensor
        ),
        theModeInfo.id
      );
    }

  }

  /** Release testCase.preparePromise, but keep testCase. */
  neuralWorker_PerformanceTest_release_preparePromise() {
    if ( this.testCaseMap ) {
      for ( let testCase of this.testCaseMap.values() ) {
        testCase.preparePromise = null;
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

    this.neuralWorkerProxies?.disposeResources_and_recycleToPool();
    this.neuralWorkerProxies = null;
  }

  /** Test .ImageData_process_async by Xxx */
  async testNeuralWorker_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );

    // First time test this case. Release all other test cases' neural networks
    // (so that there will be enough memory). Create the specified neural network.
    if ( !testCase.preparePromise ) {
      this.neuralWorker_PerformanceTest_release_preparePromise();
      testCase.preparePromise = testCase.prepare_async( this.neuralWorkerProxies );
    }

    // Note: Even if non-first time test this case, it is still necessary to wait for
    //       its initialization completely (which is doing/done by this case's first
    //       time testing).
    await testCase.preparePromise;

    let imageData;
    {
      let contextAttributes = { willReadFrequently: true };
      let ctx = this.testCanvas.getContext( "2d", contextAttributes );
      imageData = ctx.getImageData( 0, 0, this.testCanvas.width, this.testCanvas.height );
    }

    let resultFloat32ArrayArrayPromise
      = this.neuralWorkerProxies.ImageData_process_async( imageData );

    if ( imageData.data.length != 0 )
      throw Error( `jsPerf_NeuralWorker.testNeuralWorker_ByName(): `
        + `imageData.data.length ( ${imageData.data.length} ) should be 0 `
        + `after transferred to worker.`
      );

    let resultFloat32ArrayArray = await resultFloat32ArrayArrayPromise;
    return resultFloat32ArrayArray;
  }

  /**
   * (Called by util_tester.js)
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @param {boolean} bAscent_or_Descent
   *   - If true, test from largest NeuralWorker.Mode.Singleton.Ids.
   *   - If false, test from smallest NeuralWorker.Mode.Singleton.Ids.
   */
  async* tester( progressParent, bAscent_or_Descent ) {
    let backendName = tf.getBackend();
    console.log( `NeuralWorker ( ${backendName} ) testing...` );

    const ExecutionTimeInfoTimes = 10;

    let htmlTableOperator;
    {
      const htmlTableId = "NeuralWorker_Performance_Table";
      const digitsCount = 4;
      htmlTableOperator
        = HTMLTable.Operator.Pool.get_or_create_by( htmlTableId, digitsCount );
  
      if ( !htmlTableOperator.Header_hasChild() ) {
        htmlTableOperator.Header_addRow( [
          "Backend",
          "NeuralWorker.Mode",
          `ops/sec (${ExecutionTimeInfoTimes} runs sampled)`
        ] );
      }
    }

    let progressRoot = progressParent.root_get();

    let progressMax = 10000; // Temporary progress max (because it is unkown here).
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( progressMax ) );

    let testCase;
    try {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      {
        let memoryInfo_testCorrectness_before = tf.memory(); // Test memory leakage of imageSourceBag.

        {
          let asserter_Equal
            = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.01, 0.005 );

          this.neuralWorker_PerformanceTest_init();

          progressMax = this.testCaseMap.size * (
              1                      // for prepare_async() complete.
            + ExecutionTimeInfoTimes // for performance test complete.
            + 1                      // for NeuralWorker.Mode complete
          );
          progressToAdvance.value_max_set( progressMax );

          // Control test ModeId direction.
          let testCaseArray = [ ...this.testCaseMap.values() ];
          let testCaseIndexBegin, testCaseIndexEnd, testCaseIndexStep;
          if ( bAscent_or_Descent ) {
            testCaseIndexBegin = 0;
            testCaseIndexEnd = testCaseArray.length; // (Exclusive)
            testCaseIndexStep = +1;
          } else {
            testCaseIndexBegin = testCaseArray.length - 1;
            testCaseIndexEnd = -1; // (Exclusive)
            testCaseIndexStep = -1;
          }

          const timeInfo = new ExecutionTimeInfo( ExecutionTimeInfoTimes );
          for ( let i = testCaseIndexBegin;
                i != testCaseIndexEnd; i += testCaseIndexStep ) {

            testCase = testCaseArray[ i ];

            // First time test the case. Release all other test cases' neural networks
            // (so that there will be enough memory). Create the specified neural network.
            if ( !testCase.preparePromise ) {
              this.neuralWorker_PerformanceTest_release_preparePromise();
              testCase.preparePromise = testCase.prepare_async( this.neuralWorkerProxies );
              await testCase.preparePromise;
            }

            progressToAdvance.value_advance(); // Every prepare_async() complete.
            yield progressRoot;

            let resultFloat32ArrayArray;

            // Execution time testing.
            {
              timeInfo.name = testCase.testCaseName;
              timeInfo.elapsedTotal = 0;
              for ( let i = 0; i < timeInfo.times; ++i ) {
                timeInfo.begin = Date.now();
                let testByNamePromise = this.testNeuralWorker_ByName( testCase.testCaseName );
                resultFloat32ArrayArray = await testByNamePromise;
                timeInfo.end = Date.now();
                timeInfo.elapsed = timeInfo.end - timeInfo.begin;
                timeInfo.elapsedTotal += timeInfo.elapsed;

                progressToAdvance.value_advance(); // Every performance test complete.
                yield progressRoot;
              }
              htmlTableOperator.Body_addRow( [
                backendName, timeInfo.name, timeInfo.countPerSecond
              ] );
              //console.log( timeInfo.toString() );
            }

            let resultFloat32Array;

            // For NO_FILL mode, the result should be the same as local simulation.
            // So they can be checked.
            let bFill = testCase.NeuralWorker_Mode_bFill;
            if ( !bFill ) {
              resultFloat32Array = testCase.NeuralNet_try_result( this.testCanvas );
            }

            if ( !bFill ) {
              let lhsNumberArray = resultFloat32ArrayArray[ 0 ];
              let rhsNumberArray = resultFloat32Array;
              let prefixMsg = "NeuralNet";
              let lhsNumberArrayName = "output0";
              let rhsNumberArrayName = "outputRef";
              let postfixMsg = testCase.testCaseName;

              asserter_Equal.assert_NumberArray_NumberArray(
                lhsNumberArray, rhsNumberArray,
                prefixMsg, lhsNumberArrayName, rhsNumberArrayName, postfixMsg );

              lhsNumberArray = resultFloat32ArrayArray[ 1 ];
              lhsNumberArrayName = "output1";
              asserter_Equal.assert_NumberArray_NumberArray(
                lhsNumberArray, rhsNumberArray,
                prefixMsg, lhsNumberArrayName, rhsNumberArrayName, postfixMsg );
            }

            progressToAdvance.value_advance(); // Every NeuralWorker.Mode complete
            yield progressRoot;
          }

          this.neuralWorker_PerformanceTest_release();

          asserter_Equal?.disposeResources_and_recycleToPool();
          asserter_Equal = null;
        }

        let memoryInfo_testCorrectness_after = tf.memory();

        if ( memoryInfo_testCorrectness_after.numTensors != memoryInfo_testCorrectness_before.numTensors )
          throw Error( `jsPerf_NeuralWorker.tester() memory leak. `
            + `result tensor count (${memoryInfo_testCorrectness_after.numTensors}) `
            + `should be (${memoryInfo_testCorrectness_before.numTensors} `
          );
      }

      Pool.Asserter.assert_Pool_issuedCount(
        "jsPerf_NeuralWorker.tester()", pool_all_issuedCount_before );

    } catch ( e ) {
      let backendName = tf.getBackend();
      let msg = `jsPerf_NeuralWorker.tester(): `
        + `backendName=${backendName}, `
        + `testCaseId=${testCase.testCaseId}, testCaseName=${testCase.testCaseName}. `
        + `${e}`;

      console.log( msg );
      alert( `${msg}` );

      //debugger;
      throw e;

    } finally {
      if ( htmlTableOperator ) {
        htmlTableOperator.disposeResources_and_recycleToPool();
        htmlTableOperator = null;
      }
    }
  
    console.log( `NeuralWorker ( ${backendName} ) testing... Done.` );
  }

}

/** */
function init() {
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

/** */
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

/**
 * (Called by util_tester.js)
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The
 * created progressToAdvance will be increased when every time advanced. The
 * progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent, backendName, bAscent_or_Descent ) {

  // Ensure backend of tensorflow.js
  {
    await tf.ready(); // Ensure tf.getBackend() workable.

    let currentBackendName = tf.getBackend();
    if ( currentBackendName != backendName ) {
      let setBackendOkPromise = tf.setBackend( backendName );
      let setBackendOk = await setBackendOkPromise;
    }
  }

  init();

  let progressArray_for_testSet = new Array( globalThis.testSet_All.length );
  for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
    progressArray_for_testSet[ i ] = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  }

  for ( let i = 0; i < globalThis.testSet_All.length; ++i ) {
    let testSet = globalThis.testSet_All[ i ];
    yield* testSet.tester( progressArray_for_testSet[ i ], bAscent_or_Descent );
  }

  disposeResources();
}
