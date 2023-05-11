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

//!!! ...unfinished... (2023/05/11)
//  largerFactor_Text: null,

  explicit_input_height_Text: null,
  explicit_input_width_Text: null,

  has_implicit_input_Checkbox: null,

  vocabularyChannelCount_Text: null,
  blockCountTotalRequested_Text: null,
  output_channelCount_Text: null,

  Info_TextArea: null,
  TestButton: null,

  TestProgressBar: null,

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
   * Used as default PerformanceTestCase provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "PerformanceTestCase.Pool",
    PerformanceTestCase, PerformanceTestCase.setAsConstructor );

  /**
   */
  constructor(
    testCaseId, testCaseName, neuralNetParamsBase, nNeuralWorker_ModeId ) {

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

      if ( backendName === "webgl" )
        this.neuralNetParamsBase
          .nConvStageTypeId_adjust_for_backend_webgl_if_ShuffleNetV2();
      else if ( backendName === "cpu" )
        this.neuralNetParamsBase
          .nConvStageTypeId_adjust_for_backend_cpu_if_ShuffleNetV2();

      let bInitOkPromise = neuralWorkerProxies.init_async(
        backendName, this.nNeuralWorker_ModeId );

      PerformanceTestCase.randomTestWeightArray_create();

      let neuralNetCount
        = NeuralWorker.Mode.neuralNetCount_get( this.nNeuralWorker_ModeId );

      // Although neural network configuration will be copied (not transferred)
      // to workers, they still need be cloned because NeuralWorker.Proxy will
      // keep (i.e. owned and destroyed) them.
      let neuralNetParamsBaseArray;
      if ( neuralNetCount > 1 ) {
        let neuralNetParams0 = this.neuralNetParamsBase.clone();
        let neuralNetParams1 = this.neuralNetParamsBase.clone();
        neuralNetParamsBaseArray = [ neuralNetParams0, neuralNetParams1 ];
      } else {
        let neuralNetParams0 = this.neuralNetParamsBase.clone();
        neuralNetParamsBaseArray = [ neuralNetParams0 ];
      }

      let weightArrayBufferArray;
      if ( neuralNetCount > 1 ) {
        let weightArray0
          = new Float32Array( PerformanceTestCase.randomTestWeightArray );
        let weightArray1
          = new Float32Array( PerformanceTestCase.randomTestWeightArray );
        weightArrayBufferArray = [ weightArray0.buffer, weightArray1.buffer ];
      } else {
        let weightArray0
          = new Float32Array( PerformanceTestCase.randomTestWeightArray );
        weightArrayBufferArray = [ weightArray0.buffer ];
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

      {
        if ( neuralNetCount > 1 ) {
          this.alignmentMarkValueArray = [ 155, 255 ];
        } else {
          this.alignmentMarkValueArray = [ 55 ];
        }

        let bSetOkPromise = neuralWorkerProxies
          .alignmentMarkValueArray_set_async( this.alignmentMarkValueArray );

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
  async NeuralNet_try_result_async( theCanvas,
    alignmentMarkValueArray, previous_output_TypedArrayArray ) {

    let resultFloat32Array;

    let progress, neuralNet;
    let createTensor_asyncGenerator;
    let outputTensor3d;
    try {
      PerformanceTestCase.randomTestWeightArray_create();

      let neuralNetParams = NeuralNet.Params
        .get_or_create_by_NeuralNetParamsBase( this.neuralNetParamsBase );

      progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
      neuralNet = this.neuralNet = NeuralNet.Base.Pool.get_or_create_by();

      let bInitOk = neuralNet.init( progress,
        PerformanceTestCase.randomTestWeightArray, 0, neuralNetParams );

      let strWeightCountInfo = neuralNet.toString_WeightCount();
      let strWeightCountInfo_withConvType = `${strWeightCountInfo}, `
        + `nConvStageTypeName=`
        + `${this.neuralNetParamsBase.nConvStageTypeName_with_Id}.`
        ;

      let strWeightCountInfoLong = `NeuralNet.${this.testCaseName}: `
        + `${strWeightCountInfo_withConvType}`;

      console.log( strWeightCountInfoLong );

      if ( g_Controls.Info_TextArea.textContent
              .indexOf( strWeightCountInfo ) < 0 ) {
        if ( g_Controls.Info_TextArea.textContent.length > 0 )
          g_Controls.Info_TextArea.textContent += "\n";
        g_Controls.Info_TextArea.textContent += strWeightCountInfo_withConvType;
      }

      if ( false == bInitOk )
        throw Error( `Failed to initialize neuralNet object. `
          + `neuralNetParams ( ${neuralNetParams} ), `
          + `neuralNet ( ${neuralNet} ).`
        );

      if ( 100 != progress.valuePercentage )
        throw Error( `Progress (${progress.valuePercentage}) should be 100 `
          + `when initializing `
          + `NeuralNet object successfully. ${neuralNet}`);

      {
        this.ScaleFiller = new NeuralNet.ScaleFiller(
          this.neuralNet.input_height,
          this.neuralNet.input_width,
          this.neuralNet.input_channelCount
        );

        let imageData;
        {
          let ctx = theCanvas.getContext( "2d" );
          imageData = ctx.getImageData(
            0, 0, theCanvas.width, theCanvas.height );
        }

        const bTwoTensors = false;
        createTensor_asyncGenerator
          = this.ScaleFiller.createTensor_by_fill_asyncGenerator(
              imageData.data, imageData.height, imageData.width,
              bTwoTensors,
              neuralNet.feedbackShape,
              alignmentMarkValueArray, previous_output_TypedArrayArray
            );
      }

      let { done, value: [ sourceTensor, sourceTypedArrayAsyncFunction ] }
        = await createTensor_asyncGenerator.next();

//!!! (2023/05/11 Remarked) Use NeuralNet_ScaleFiller instead?
//        let inputTensor3d = neuralNet.create_ScaledSourceTensor_from_PixelData( theCanvas );

      outputTensor3d = neuralNet.apply( sourceTensor );
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

      // Ensure all intermediate tensors are released.
      if ( createTensor_asyncGenerator ) {
        createTensor_asyncGenerator.return();
        createTensor_asyncGenerator = null;
      }

      if ( outputTensor3d ) {
        tf.dispose( outputTensor3d );
        outputTensor3d = null;
      }
    }

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

///!!! ...unfinished... (2023/05/11)
//    * @param {number} largerFactor
//    *   Simulate the real input size
//    * as ( largerFactor * height ) * ( largerFactor * width ).

   *
   * @param {number} explicit_input_height        explicit image height
   * @param {number} explicit_input_width         explicit image width
   * @param {number} explicit_input_channelCount  explicit image channel count
   *
   * @param {boolean} has_implicit_input
   *   Whether has implicit input.
   *
   * @param {number} output_channelCount
   *   The output channel count of the neural network.
   *
   * @param {number} backendName
   *   Run this test set under which backend of tensorflow.js
   *
   * @param {boolean} bAscent_or_Descent
   *   - If true, test from largest NeuralWorker.Mode.Singleton.Ids.
   *   - If false, test from smallest NeuralWorker.Mode.Singleton.Ids.
   */
  constructor(
//!!! ...unfinished... (2023/05/11)
//    largerFactor,

    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    has_implicit_input,

    vocabularyChannelCount,
    blockCountTotalRequested,
    output_channelCount,
  
    backendName, bAscent_or_Descent ) {

    this.disposeResources();

//!!! ...unfinished... (2023/05/11)
//    this.largerFactor = largerFactor;

    this.explicit_input_height = explicit_input_height;
    this.explicit_input_width = explicit_input_width;
    this.explicit_input_channelCount = explicit_input_channelCount;

    this.has_implicit_input = has_implicit_input;

    this.vocabularyChannelCount = vocabularyChannelCount;
    this.blockCountTotalRequested = blockCountTotalRequested;
    this.output_channelCount = output_channelCount;

    this.backendName = backendName;
    this.bAscent_or_Descent = bAscent_or_Descent;

//!!! (2023/05/11 Remarked)
//    this.alignmentMarkValueArray = [ 155, 255 ];

    this.feedbackShape = new NeuralNet.FeedbackShape();
    this.feedbackShape.init(
      explicit_input_height, explicit_input_width, explicit_input_channelCount,
      output_channelCount // feedback_valueCount
    );
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
//!!! (2023/05/11 Remarked)
//      let inputHeight = this.height * this.largerFactor;
//      let inputWidth = this.width * this.largerFactor;

      let inputHeight = this.feedbackShape.input_height;
      let inputWidth = this.feedbackShape.input_width;
      let inputChannelCount = this.feedbackShape.input_channelCount; // Must be 4;

      this.testCanvas = document.createElement( "canvas" );
      this.testCanvas.height = inputHeight;
      this.testCanvas.width = inputWidth;

      let inputImage = this.testPerformance_imageSourceBag.getImage_by(
        inputHeight, inputWidth, inputChannelCount );

      let contextAttributes = { willReadFrequently: true };
      let ctx = this.testCanvas.getContext( "2d", contextAttributes );
      let imageData = ctx.createImageData( inputHeight, inputWidth );
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

    // (2023/03/08 Remarked) Use SHUFFLE_NET_V2_BY_MOBILE_NET_V1 instead.
    // const nConvStageType
    //   = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID; // (6)

    // Use ( pad = same ) so that edge pixels will not be dropped.
    const nConvStageType
      = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1; // (5)

    // ShuffleNetV2 uses twice block count to compensate reduced channel count.
    //let blockCountTotalRequested_ShuffleNet = this.blockCountTotalRequested * 2;
    const blockCountTotalRequested_ShuffleNet = this.blockCountTotalRequested;

    const output_asInputValueRange = true;

    // The neuralNet performance testing should not keep-input-tensor because the
    // input image is created from canvas in real time.
    let bKeepInputTensor = false;

    // explicit_input_height, explicit_input_width, explicit_input_channelCount,
    // has_implicit_input,
    // vocabularyChannelCount, vocabularyCountPerInputChannel,
    // nConvStageTypeId,
    // blockCountTotalRequested,
    // output_channelCount, output_asInputValueRange,
    // bKeepInputTensor
    //
   
    // Create TestCases for every NeuralWorker.Mode
    for ( let i = 0; i < NeuralWorker.Mode.Singleton.integerToInfoMap.size; ++i ) {
      let theModeInfo = NeuralWorker.Mode.Singleton.integerToInfoMap.get( i );

      // Must be in the same order.
      if ( i != theModeInfo.id )
        throw Error( `NeuralWorker_tester.neuralWorker_PerformanceTest_init(): `
          + `theModeInfo.id ( ${theModeInfo.id} ) should be ( ${i} ).`
        );

      this.neuralWorker_PerformanceTest_addCase(
        theModeInfo.id, theModeInfo.nameForMessage,
        NeuralNet.ParamsBase.Pool.get_or_create_by(
          this.explicit_input_height, this.explicit_input_width,
          this.explicit_input_channelCount,
          this.has_implicit_input,
          this.vocabularyChannelCount, vocabularyCountPerInputChannel,
          nConvStageType,
          blockCountTotalRequested_ShuffleNet,
          this.output_channelCount, output_asInputValueRange,
          bKeepInputTensor
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

  /** Test .TypedArray_process_async by Xxx */
  async testNeuralWorker_ByName( testCaseName ) {
    let testCase = this.testCaseMap.get( testCaseName );

    // First time test this case. Release all other test cases' neural networks
    // (so that there will be enough memory). Create the specified neural network.
    if ( !testCase.preparePromise ) {
      this.neuralWorker_PerformanceTest_release_preparePromise();
      testCase.preparePromise = testCase.prepare_async(
        this.neuralWorkerProxies );
    }

    // Note: Even if non-first time test this case, it is still necessary to
    //       wait for its initialization completely (which is doing/done by
    //       this case's first time testing).
    await testCase.preparePromise;

    let imageData;
    {
      let ctx = this.testCanvas.getContext( "2d" );
      imageData = ctx.getImageData(
        0, 0, this.testCanvas.width, this.testCanvas.height );
    }

    let resultFloat32ArrayArrayPromise
      = this.neuralWorkerProxies.TypedArray_process_async(
          imageData.data, imageData.height, imageData.width );

    if ( imageData.data.length != 0 )
      throw Error( `NeuralWorker_tester.testNeuralWorker_ByName(): `
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

    let asserter_Equal;
    let testCase;
    try {
      let pool_all_issuedCount_before = Pool.All.issuedCount;

      {
        // Test memory leakage of imageSourceBag.
        let memoryInfo_testCorrectness_before = tf.memory();

        {
          asserter_Equal
            = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.01, 0.005 );

          this.neuralWorker_PerformanceTest_init();

          progressMax = this.testCaseMap.size * (
              1                      // for prepare_async() complete.
            + ExecutionTimeInfoTimes // for performance test complete.
            + 1                      // for NeuralWorker.Mode complete
          );
          progressToAdvance.max = progressMax;

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

            // First time test the case. Release all other test cases' neural
            // networks (so that there will be enough memory). Create the
            // specified neural network.
            if ( !testCase.preparePromise ) {
              this.neuralWorker_PerformanceTest_release_preparePromise();
              testCase.preparePromise
                = testCase.prepare_async( this.neuralWorkerProxies );
              await testCase.preparePromise;
            }

            progressToAdvance.value_advance(); // Every prepare_async() complete.
            yield progressRoot;

            let resultFloat32ArrayArray;
            let previous_output_TypedArrayArray_for_verification;

            // Execution time testing.
            {
              timeInfo.name = testCase.testCaseName;
              timeInfo.elapsedTotal = 0;
              for ( let i = 0; i < timeInfo.times; ++i ) {
                timeInfo.begin = Date.now();
                let testByNamePromise
                  = this.testNeuralWorker_ByName( testCase.testCaseName );
                resultFloat32ArrayArray = await testByNamePromise;
                timeInfo.end = Date.now();
                timeInfo.elapsed = timeInfo.end - timeInfo.begin;
                timeInfo.elapsedTotal += timeInfo.elapsed;

                // Copy the last 2nd testing result (i.e. the last 1st input)
                // as previous time output for verification.
                if ( i == ( timeInfo.times - 2 ) )
                  previous_output_TypedArrayArray_for_verification
                    = resultFloat32ArrayArray.slice();

                progressToAdvance.value_advance(); // Every performance test complete.
                yield progressRoot;
              }
              g_Controls.performanceTable_htmlTableOperator.Body_addRow( [
                backendName, timeInfo.name, timeInfo.countPerSecond
              ] );
              //console.log( timeInfo.toString() );
            }

            {
              // NeuralNet_try_result_async() should be called after prepare_async()
              // so that the nConvStageTypeId has been adjusted.
              let resultFloat32Array
                = await testCase.NeuralNet_try_result_async( this.testCanvas,
                  testCase.alignmentMarkValueArray,
                    previous_output_TypedArrayArray_for_verification );

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

        if ( memoryInfo_testCorrectness_after.numTensors
               != memoryInfo_testCorrectness_before.numTensors )
          throw Error( `NeuralWorker_tester.tester() memory leak. `
            + `result tensor count (${memoryInfo_testCorrectness_after.numTensors}) `
            + `should be (${memoryInfo_testCorrectness_before.numTensors} `
          );
      }

      Pool.Asserter.assert_Pool_issuedCount(
        "NeuralWorker_tester.tester()", pool_all_issuedCount_before );

    } catch ( e ) {
      let backendName = tf.getBackend();
      let msg = `NeuralWorker_tester.tester(): `
        + `backendName=${backendName}, `
        + `testCaseId=${testCase.testCaseId}, testCaseName=${testCase.testCaseName}. `
        + `${e}`;

      console.log( msg );
      alert( `${msg}` );

      //debugger;
      throw e;

    } finally {
      if ( asserter_Equal ) {
        asserter_Equal.disposeResources_and_recycleToPool();
        asserter_Equal = null;
      }

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
//!!! (2023/05/11 Remarked)
//  largerFactor,

  explicit_input_height,
  explicit_input_width,
  has_implicit_input,

  vocabularyChannelCount,
  blockCountTotalRequested,
  output_channelCount,

  backendName, bAscent_or_Descent,
) {

  let testSet;
  try {
    const explicit_channelCount = 4;

    // Using mobile phone's resolution ( 1080 * 2160 ) will crash the computer.
    // Using ( 1 / 15 ) of computer screen ( 1080 * 1920 ) (i.e. ( 72 * 128 )).
    testSet = new HeightWidthDepth(
//!!! (2023/05/11 Remarked)
//      largerFactor,
      explicit_input_height, explicit_input_width, explicit_channelCount,
      has_implicit_input,
      vocabularyChannelCount,
      blockCountTotalRequested,
      output_channelCount,
      backendName, bAscent_or_Descent,
    );

    let progress_for_testSet = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    yield* testSet.tester( progress_for_testSet );

  } finally {
    if ( testSet ) {
      testSet.disposeResources();
      testSet = null;
    }
  }
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

//!!! (2023/05/11 Remarked)
//  largerFactor = 15,

  explicit_input_height = 72,
  explicit_input_width = 128,
  has_implicit_input = true,

  vocabularyChannelCount = 8, //6, //4,
  blockCountTotalRequested = 84, //100, //200, //50, //20, //10,
  output_channelCount = 6,
) {

  let progress_NeuralWorker_tester_cpu = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress_NeuralWorker_tester_webgl = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  {
    let bAscent_or_Descent;
    bAscent_or_Descent = false; // Descent
    yield* testerBackend( progress_NeuralWorker_tester_webgl,

//!!! (2023/05/11 Remarked)
//      largerFactor,

      explicit_input_height, explicit_input_width,
      has_implicit_input,
      vocabularyChannelCount,
      blockCountTotalRequested,
      output_channelCount,
      "webgl", bAscent_or_Descent,
    );

    bAscent_or_Descent = true; // Ascent
    yield* testerBackend( progress_NeuralWorker_tester_cpu,

//!!! (2023/05/11 Remarked)
//      largerFactor,

      explicit_input_height, explicit_input_width,
      has_implicit_input,
      vocabularyChannelCount,
      blockCountTotalRequested,
      output_channelCount,
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
  g_Controls.Info_TextArea.textContent = "";

  // Extract parameters from UI.

//!!! ...unfinished... (2023/05/11)
//  let largerFactor = Number.parseInt( g_Controls.largerFactor_Text.value );
//  g_Controls.largerFactor_Text.value = largerFactor;
  
  let explicit_input_height
    = Number.parseInt( g_Controls.explicit_input_height_Text.value );
  g_Controls.explicit_input_height_Text.value = explicit_input_height;

  let explicit_input_width
    = Number.parseInt( g_Controls.explicit_input_width_Text.value );
  g_Controls.explicit_input_width_Text.value = explicit_input_width;

  let has_implicit_input
    = Number.parseInt( g_Controls.has_implicit_input_Checkbox.value );
  g_Controls.has_implicit_input_Checkbox.value = has_implicit_input;

  let vocabularyChannelCount
    = Number.parseInt( g_Controls.vocabularyChannelCount_Text.value );
  g_Controls.vocabularyChannelCount_Text.value = vocabularyChannelCount;

  let blockCountTotalRequested
    = Number.parseInt( g_Controls.blockCountTotalRequested_Text.value );
  g_Controls.blockCountTotalRequested_Text.value = blockCountTotalRequested;

  let output_channelCount
    = Number.parseInt( g_Controls.output_channelCount_Text.value );
  g_Controls.output_channelCount_Text.value
    = output_channelCount;

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

  let tester = testerBackendAll( progress_NeuralWorker_tester,

//!!! (2023/05/11 Remarked)
//    largerFactor,

    explicit_input_height,
    explicit_input_width,
    has_implicit_input,
    vocabularyChannelCount,
    blockCountTotalRequested,
    output_channelCount,
  );

  let progressReceiver
    = new ValueMax.Receiver.HTMLProgress( g_Controls.TestProgressBar );
  progressReceiver.setValue( 0 );

  let testPromise = PartTime.forOf( tester,

    // callback when ( done == false )
    ( progressRoot ) => {
      progressReceiver.setValueMax( // Report progress to UI.
        progressRoot.valuePercentage, progressRoot.maxPercentage );
    },

    // callback when ( done == true )
    () => {
      if ( 100 != progress.valuePercentage )
        throw Error( `NeuralWorker_tester.tester_byUI(): `
          + `Progress (${progress.valuePercentage}) should be 100 `
          + `after testing done.`);
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

  }).finally( () => { // Release resource.
   
    if ( progress ) {
      progress.disposeResources_and_recycleToPool();
      progress = null;
    }

    // Release output table operator.
    if ( g_Controls.performanceTable_htmlTableOperator ) {
      g_Controls.performanceTable_htmlTableOperator
        .disposeResources_and_recycleToPool();

      g_Controls.performanceTable_htmlTableOperator = null;
    }

    g_Controls.TestButton.disabled = false; // Re-enable UI.

    try {
      Pool.Asserter.assert_Pool_issuedCount(
        "NeuralWorker_tester.TestButton_onClick()",
        pool_all_issuedCount_before );

    } catch ( e ) {
      let msg = `NeuralWorker_tester.TestButton_onClick(): `
        + `${e}`;

      console.log( msg );
      alert( `${msg}` );
      //debugger;
      throw e;
    }
  });

}
