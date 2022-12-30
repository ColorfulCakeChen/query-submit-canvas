//export { tester };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as PartTime from "../util/PartTime.js";
import * as RandTools from "../util/RandTools.js";
import * as ScriptLoader from "../util/ScriptLoader.js";
import * as TensorTools from "../util/TensorTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as Weights from "../Unpacker/Weights.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
import * as NeuralWorker from "../NeuralDEvolution/NeuralWorker.js";
import * as TestParams from "../jsPerf/Ref/TestParams.js";
import * as ImageSourceBag from "../jsPerf/Ref/ImageSourceBag.js";
import * as NumberImage from "../jsPerf/Ref/NumberImage.js";
import * as HTMLTable from "../Display/HTMLTable.js";

let g_Controls = {
  largerFactor_Text: null,
  input_height_Text: null,
  input_width_Text: null,
  vocabularyChannelCount_Text: null,
  blockCountTotalRequested_Text: null,
  output_channelCount_per_alignment_Text: null,

  Info_TextArea: null,
  TestButton: null,

  NeuralWorker_Performance_Table: null,
};

window.addEventListener( "load", event => {

  // Note: NeuralWorker_Body will also load tensorflow.js by itself.
  ScriptLoader.createPromise( NeuralWorker.Common.tensorflowJsURL ).then( () => {
    g_Controls.TestButton.disabled = false;
  });

  for ( let p in g_Controls ) {
    g_Controls[ p ] = document.getElementById( p );
  }

  g_Controls.TestButton.addEventListener( "click", TestButton_onClick );
});

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
        PerformanceTestCase.randomTestWeightArray_create();

        let neuralNetParams = NeuralNet.Params.get_or_create_by_NeuralNetParamsBase(
          this.neuralNetParamsBase );

        progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
        neuralNet = this.neuralNet = NeuralNet.Base.Pool.get_or_create_by();

        let bInitOk = neuralNet.init( progress,
          PerformanceTestCase.randomTestWeightArray, 0, neuralNetParams );

        let strWeightCountInfo = neuralNet.toString_WeightCount();
        let strWeightCountInfoLong
          = `NeuralNet.${this.testCaseName}: ${strWeightCountInfo}.`;
        console.log( strWeightCountInfoLong );
        g_Controls.Info_TextArea.textContent = strWeightCountInfo;

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
   * @param {number} largerFactor
   *   Simulate the real input size
   * as ( largerFactor * height ) * ( largerFactor * width ).
   *
   * @param {number} height            image height
   * @param {number} width             image width
   * @param {number} depth             image channel count
   *
   * @param {number} output_channelCount_per_alignment
   *   The output channel count of one alignment.
   *
   * @param {number} backendName
   *   Run this test set under which backend of tensorflow.js
   *
   * @param {boolean} bAscent_or_Descent
   *   - If true, test from largest NeuralWorker.Mode.Singleton.Ids.
   *   - If false, test from smallest NeuralWorker.Mode.Singleton.Ids.
   */
  constructor(
    largerFactor,

    height, width, depth,

    vocabularyChannelCount,
    blockCountTotalRequested,
    output_channelCount_per_alignment,
  
    backendName, bAscent_or_Descent ) {

    this.disposeResources();

    this.largerFactor = largerFactor;

    this.height = height;
    this.width = width;
    this.depth = depth;

    this.vocabularyChannelCount = vocabularyChannelCount;
    this.blockCountTotalRequested = blockCountTotalRequested;
    this.output_channelCount_per_alignment = output_channelCount_per_alignment;

    this.backendName = backendName;
    this.bAscent_or_Descent = bAscent_or_Descent;
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
      let largerHeight = this.height * this.largerFactor;
      let largerWidth = this.width * this.largerFactor;
      let inputChannelCount = this.depth; // Must be 4;

      this.testCanvas = document.createElement( "canvas" );
      this.testCanvas.height = largerHeight;
      this.testCanvas.width = largerWidth;

      let inputImage = this.testPerformance_imageSourceBag.getImage_by(
        largerHeight, largerWidth, inputChannelCount );

      let contextAttributes = { willReadFrequently: true };
      let ctx = this.testCanvas.getContext( "2d", contextAttributes );
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

    const vocabularyCountPerInputChannel = 256;
    const nConvStageType
      = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID;

    // ShuffleNetV2 uses twice block count to compensate reduced channel count.
    //let blockCountTotalRequested_ShuffleNet = this.blockCountTotalRequested * 2;
    const blockCountTotalRequested_ShuffleNet = this.blockCountTotalRequested;

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
      if ( theModeInfo.bFill ) // For FILL
        output_channelCount_real = this.output_channelCount_per_alignment;
      else // For NO_FILL
        output_channelCount_real = this.output_channelCount_per_alignment * 2;

      this.neuralWorker_PerformanceTest_addCase(
        theModeInfo.id, theModeInfo.nameForMessage,
        NeuralNet.ParamsBase.Pool.get_or_create_by(
          this.height, this.width, this.depth,
          this.vocabularyChannelCount, vocabularyCountPerInputChannel,
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
      let ctx = this.testCanvas.getContext( "2d" );
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
   */
  async* tester( progressParent ) {

    // Ensure backend of tensorflow.js
    {
      await tf.ready(); // Ensure tf.getBackend() workable.
  
      let currentBackendName = tf.getBackend();
      if ( currentBackendName != this.backendName ) {
        let setBackendOkPromise = tf.setBackend( this.backendName );
        let setBackendOk = await setBackendOkPromise;
      }
    }

    let backendName = tf.getBackend();
    console.log( `NeuralWorker ( ${backendName} ) testing...` );

    const ExecutionTimeInfoTimes = 10;

    {
      if ( !g_Controls.performanceTable_htmlTableOperator.Header_hasChild() ) {
        g_Controls.performanceTable_htmlTableOperator.Header_addRow( [
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
          if ( this.bAscent_or_Descent ) {
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

            let resultFloat32Array;

            // For NO_FILL mode, the result should be the same as local simulation.
            // So they can be checked.
            let bFill = testCase.NeuralWorker_Mode_bFill;
            if ( !bFill ) {
              resultFloat32Array = testCase.NeuralNet_try_result( this.testCanvas );
            }

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
              g_Controls.performanceTable_htmlTableOperatorhtmlTableOperator
                .Body_addRow( [
                  backendName, timeInfo.name, timeInfo.countPerSecond
                ] );
              //console.log( timeInfo.toString() );
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
    }
  
    console.log( `NeuralWorker ( ${backendName} ) testing... Done.` );
  }

}

/**
 * (Called by tester())
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The
 * created progressToAdvance will be increased when every time advanced. The
 * progressParent.root_get() will be returned when every time yield.
 *
 */
async function* testerBackend( progressParent,
  largerFactor,

  input_height,
  input_width,

  vocabularyChannelCount,
  blockCountTotalRequested,
  output_channelCount_per_alignment,

  backendName, bAscent_or_Descent,
) {
  const depth = 4;

  // Using mobile phone's resolution ( 1080 * 2160 ) will crash the computer.
  // Using ( 1 / 15 ) of computer screen ( 1080 * 1920 ) (i.e. ( 72 * 128 )).
  let testSet = new HeightWidthDepth(
    largerFactor,
    input_height, input_width, depth,
    vocabularyChannelCount,
    blockCountTotalRequested,
    output_channelCount_per_alignment,
    backendName, bAscent_or_Descent,
  );

  let progress_for_testSet = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  yield* testSet.tester( progress_for_testSet );

  testSet.disposeResources();
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
async function* testerBackendAll( progressParent,
  largerFactor = 15,

  input_height = 72,
  input_width = 128,

  vocabularyChannelCount = 8, //6, //4,
  blockCountTotalRequested = 84, //100, //200, //50, //20, //10,
  output_channelCount_per_alignment = 6,
) {

  let progress_NeuralWorker_tester_cpu = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_NeuralWorker_tester_webgl = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  {
    let bAscent_or_Descent;
    bAscent_or_Descent = false; // Descent
    yield* testerBackend( progress_NeuralWorker_tester_webgl,
      largerFactor,
      input_height,
      input_width,
      vocabularyChannelCount,
      blockCountTotalRequested,
      output_channelCount_per_alignment,
      "webgl", bAscent_or_Descent,
    );

    bAscent_or_Descent = true; // Ascent
    yield* testerBackend( progress_NeuralWorker_tester_cpu,
      largerFactor,
      input_height,
      input_width,
      vocabularyChannelCount,
      blockCountTotalRequested,
      output_channelCount_per_alignment,
      "cpu", bAscent_or_Descent,
    );
  }

}

/** */
function TestButton_onClick( event ) {
  console.log("NeuralWorker testing...");
  const delayMilliseconds = 100;

  let pool_all_issuedCount_before = Pool.All.issuedCount;


  g_Controls.TestButton.disabled = true; // Prevent multiple clicks.

  // Extract parameters from UI.
  let largerFactor = Number.parseInt( g_Controls.largerFactor_Text.value );
  g_Controls.largerFactor_Text.value = largerFactor;
  
  let input_height = Number.parseInt( g_Controls.input_height_Text.value );
  g_Controls.input_height_Text.value = input_height;

  let input_width = Number.parseInt( g_Controls.input_width_Text.value );
  g_Controls.input_width_Text.value = input_width;

  let vocabularyChannelCount
    = Number.parseInt( g_Controls.vocabularyChannelCount_Text.value );
  g_Controls.vocabularyChannelCount_Text.value = vocabularyChannelCount;

  let blockCountTotalRequested
    = Number.parseInt( g_Controls.blockCountTotalRequested_Text.value );
  g_Controls.blockCountTotalRequested_Text.value = blockCountTotalRequested;

  let output_channelCount_per_alignment
    = Number.parseInt( g_Controls.output_channelCount_per_alignment_Text.value );
  g_Controls.output_channelCount_per_alignment_Text.value
    = output_channelCount_per_alignment;

  // Prepare output table.
  {
    if ( !g_Controls.performanceTable_htmlTableOperator ) {
      const htmlTableId = "NeuralWorker_Performance_Table";
      const digitsCount = 4;
      g_Controls.performanceTable_htmlTableOperator
        = HTMLTable.Operator.Pool.get_or_create_by( htmlTableId, digitsCount );
    }

    // Clear output table.
    g_Controls.performanceTable_htmlTableOperator.Table_clear();
  }  

  // Aggregate all progress about util_tester.
  let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

  let progress_NeuralWorker_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressReceiver
    = new ValueMax.Receiver.HTMLProgress.createByTitle_or_getDummy( "TestProgressBar" );

  let tester = testerBackendAll( progress_NeuralWorker_tester,
    largerFactor,
    input_height,
    input_width,
    vocabularyChannelCount,
    blockCountTotalRequested,
    output_channelCount_per_alignment,
  );

  let testPromise = PartTime.forOf(
    tester,
    ( progressRoot ) => {
      progressReceiver.setValueMax( // Report progress to UI.
        progressRoot.valuePercentage, progressRoot.maxPercentage );
    },
    () => { // Release resource.

      g_Controls.TestButton.disabled = false;

      try {
        if ( 100 != progress.valuePercentage )
          throw Error( `NeuralWorker_tester.tester_byUI(): `
            + `Progress (${progress.valuePercentage}) should be 100 `
            + `after testing done.`);

      } finally {
        progress.disposeResources_and_recycleToPool();
        progress = null;

        // Release output table operator.
        if ( g_Controls.performanceTable_htmlTableOperator ) {
          g_Controls.performanceTable_htmlTableOperator
            .disposeResources_and_recycleToPool();

          g_Controls.performanceTable_htmlTableOperator = null;
        }
      }

      Pool.Asserter.assert_Pool_issuedCount( "NeuralWorker_tester.tester_byUI()",
        pool_all_issuedCount_before );
    
    },
    delayMilliseconds
  );

  testPromise.then( value => {
    console.log( "NeuralWorker testing... Done." );
    //progressReceiver.informDone(r); // Inform UI progress done.

  }).catch( reason => {
    alert( reason );
    console.error( reason );
    //debugger;
  });

}
