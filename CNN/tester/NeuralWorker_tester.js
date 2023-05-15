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
//import * as ImageSourceBag from "../jsPerf/Ref/ImageSourceBag.js";
import * as NumberImage from "../jsPerf/Ref/NumberImage.js";
import * as HTMLTable from "../Display/HTMLTable.js";

/** */
class UIControls {

  controls_all = {
//!!! ...unfinished... (2023/05/11)
//  largerFactor_Text: null,

    explicit_input_height_Number: null,
    explicit_input_width_Number: null,
    explicit_input_channelCount_Number: null,

    vocabularyChannelCount_Number: null,
    vocabularyCountPerInputChannel_Number: null,

    blockCountTotalRequested_Number: null,

    output_channelCount_Number: null,

    implicit_input_mode_Select: null,

    Info_TextArea: null,
    TestButton: null,

    TestProgressBar: null,

    NeuralWorker_Performance_Table: null,
  };

  numeric_controls = {}; // Numeric controls.
  numeric_controls_controlNameArray = [];  // Numeric controls' names.
  numeric_controls_propertyNameArray = [];  // Numeric properties' names.
  numeric_controls_valueArray = [];  // Numeric controls' values. (as array)
  numeric_controls_valueObject = {}; // Numeric controls' values. (as object)

  /** */
  constructor() {
    this.controls_setup();
  }

  /** */
  controls_setup() {
    const postfixNumber = "_Number";
    const postfixNumberLength = postfixNumber.length;

    const numeric_controls = this.numeric_controls;

    this.numeric_controls_controlNameArray.length = 0;
    this.numeric_controls_propertyNameArray.length = 0;

    for ( let controlName in this.controls_all ) {
      let htmlElement = document.getElementById( controlName );
      //this[ controlName ] = htmlElement;
      this.controls_all[ controlName ] = htmlElement;

      if ( controlName.endsWith( postfixNumber ) ) { // Numeric controls.
        numeric_controls[ controlName ] = htmlElement;

        const propertyName = controlName.substring( 0,
          controlName.length - postfixNumberLength );

        this.numeric_controls_controlNameArray.push( controlName );
        this.numeric_controls_propertyNameArray.push( propertyName );

        // If the numeric control represents a NeuralNet.Params, setup range.
        const paramDesc = NeuralNet.Params[ propertyName ];
        if ( paramDesc ) {
          htmlElement.min = paramDesc.valueDesc.range.min;
          htmlElement.max = paramDesc.valueDesc.range.max;
        }
      }
    }
  }

  /** */
  numeric_controls_collect_values() {
    const numeric_controls = this.numeric_controls;
    const numeric_controls_controlNameArray = this.numeric_controls_controlNameArray;
    const numeric_controls_propertyNameArray = this.numeric_controls_propertyNameArray;
    const numeric_controls_valueArray = this.numeric_controls_valueArray;
    const numeric_controls_valueObject = this.numeric_controls_valueObject;

    numeric_controls_valueArray.length = numeric_controls_controlNameArray.length;
    for ( let i = 0; i < numeric_controls_controlNameArray.length; ++i ) {
      const controlName = numeric_controls_controlNameArray[ i ];
      const propertyName = numeric_controls_propertyNameArray[ i ];

      const htmlElement = numeric_controls[ controlName ];
      const valueInt = Number.parseInt( htmlElement.value );

      let valueIntAdjusted;
      { // For NeuralNet.Params, restrict it by range.
        const paramDesc = NeuralNet.Params[ propertyName ];
        if ( paramDesc )
          valueIntAdjusted = paramDesc.valueDesc.range.adjust( valueInt );
        else
          valueIntAdjusted = valueInt;
      }

      htmlElement.value = valueIntAdjusted; // Adjust value in UI.

      numeric_controls_valueArray.push( valueIntAdjusted );
      numeric_controls_valueObject[ propertyName ] = valueIntAdjusted;
    }
  }

  /** */
  performanceTable_htmlTableOperator_create( htmlTableId, digitsCount ) {
    if ( this.performanceTable_htmlTableOperator ) {
      if (   ( this.performanceTable_htmlTableOperator.htmlTableId
                 != htmlTableId )
          || ( this.performanceTable_htmlTableOperator.digitsCount
                 != digitsCount )
         ) {
        this.performanceTable_htmlTableOperator_dispose();
      }
    }

    if ( !this.performanceTable_htmlTableOperator ) {
      this.performanceTable_htmlTableOperator
        = HTMLTable.Operator.Pool.get_or_create_by( htmlTableId, digitsCount );
    }

    // Clear output table.
    this.performanceTable_htmlTableOperator.Table_clear();
  }

  /** Release output table operator. */
  performanceTable_htmlTableOperator_dispose() {
    if ( this.performanceTable_htmlTableOperator ) {
      this.performanceTable_htmlTableOperator
        .disposeResources_and_recycleToPool();
      this.performanceTable_htmlTableOperator = null;
    }
  }

}

let g_Controls;

window.addEventListener( "load", event => {

  g_Controls = new UIControls();
  const controls_all = g_Controls.controls_all;

  // Note: NeuralWorker_Body will also load tensorflow.js by itself.
  ScriptLoader.createPromise( NeuralWorker.Common.tensorflowJsURL ).then( () => {
    controls_all.TestButton.disabled = false;
  });

  controls_all.TestButton.addEventListener( "click", TestButton_onClick );
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
    testCaseId, testCaseName, neuralNetParamsBase,
    nNeuralWorker_ModeId, nNeuralWorker_ImplicitInputModeId ) {

    super();
    PerformanceTestCase.setAsConstructor_self.call( this,
      testCaseId, testCaseName, neuralNetParamsBase,
      nNeuralWorker_ModeId, nNeuralWorker_ImplicitInputModeId
    );
  }

  /** @override */
  static setAsConstructor(
    testCaseId, testCaseName, neuralNetParamsBase,
    nNeuralWorker_ModeId, nNeuralWorker_ImplicitInputModeId ) {

    super.setAsConstructor();
    PerformanceTestCase.setAsConstructor_self.call( this,
      testCaseId, testCaseName, neuralNetParamsBase,
      nNeuralWorker_ModeId, nNeuralWorker_ImplicitInputModeId
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    testCaseId, testCaseName, neuralNetParamsBase,
    nNeuralWorker_ModeId, nNeuralWorker_ImplicitInputModeId ) {

    this.testCaseId = testCaseId;
    this.testCaseName = testCaseName;
    this.neuralNetParamsBase = neuralNetParamsBase;
    this.nNeuralWorker_ModeId = nNeuralWorker_ModeId;
    this.nNeuralWorker_ImplicitInputModeId = nNeuralWorker_ImplicitInputModeId;

    this.neuralNetCount
      = NeuralWorker.Mode.neuralNetCount_get( nNeuralWorker_ModeId );

    this.ImplicitInputModeInfo = NeuralWorker.ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralWorker_ImplicitInputModeId );
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
    const funcNameInMessage = "prepare_async";

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
        backendName,
        this.nNeuralWorker_ModeId,
        this.nNeuralWorker_ImplicitInputModeId );

      {
        if ( neuralWorkerProxies.alignmentMarkValueArray_nonEmpty )
          throw Error( `NeuralWorker_tester.PerformanceTestCase`
            + `.${funcNameInMessage}(): `
            + `.alignmentMarkValueArray_nonEmpty `
            + `( ${neuralWorkerProxies.alignmentMarkValueArray_nonEmpty} ) `
            + `should be false after .init_async() done. `
            + `${neuralWorkerProxies}` );

        if ( neuralWorkerProxies.previous_output_TypedArrayArray_nonEmpty )
          throw Error( `NeuralWorker_tester.PerformanceTestCase`
            + `.${funcNameInMessage}(): `
            + `.previous_output_TypedArrayArray_nonEmpty `
            + `( ${neuralWorkerProxies.previous_output_TypedArrayArray_nonEmpty} ) `
            + `should be false after .init_async() done. `
            + `${neuralWorkerProxies}` );
          }

      PerformanceTestCase.randomTestWeightArray_create();

      // Although neural network configuration will be copied (not transferred)
      // to workers, they still need be cloned because NeuralWorker.Proxy will
      // keep (i.e. owned and destroyed) them.
      let neuralNetParamsBaseArray;
      if ( this.neuralNetCount > 1 ) {
        let neuralNetParams0 = this.neuralNetParamsBase.clone();
        let neuralNetParams1 = this.neuralNetParamsBase.clone();
        neuralNetParamsBaseArray = [ neuralNetParams0, neuralNetParams1 ];
      } else {
        let neuralNetParams0 = this.neuralNetParamsBase.clone();
        neuralNetParamsBaseArray = [ neuralNetParams0 ];
      }

      let weightArrayBufferArray;
      if ( this.neuralNetCount > 1 ) {
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
        throw Error( `NeuralWorker_tester.PerformanceTestCase`
          + `.${funcNameInMessage}(): `
          + `Failed to initialize neuralWorkerProxies object. `
          + `${neuralWorkerProxies}` );

      // (2022//09/26 Remarked)
      //const bLogDryRunTime = true; // For observing dry-run performance.
      const bLogDryRunTime = false;
      let bCreateOkPromise = neuralWorkerProxies.NeuralNetArray_create_async(
        neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime );

      let bCreateOk = await bCreateOkPromise;
      if ( !bCreateOk )
        throw Error( `NeuralWorker_tester.PerformanceTestCase`
          + `.${funcNameInMessage}(): `
          + `Failed to create neural networks by neuralWorkerProxies. `
          + `${neuralWorkerProxies}` );

      {
        if ( neuralWorkerProxies.alignmentMarkValueArray_nonEmpty )
          throw Error( `NeuralWorker_tester.PerformanceTestCase`
            + `.${funcNameInMessage}(): `
            + `.alignmentMarkValueArray_nonEmpty `
            + `( ${neuralWorkerProxies.alignmentMarkValueArray_nonEmpty} ) `
            + `should be false after .NeuralNetArray_create_async() done. `
            + `${neuralWorkerProxies}` );

        if ( neuralWorkerProxies.previous_output_TypedArrayArray_nonEmpty )
          throw Error( `NeuralWorker_tester.PerformanceTestCase`
            + `.${funcNameInMessage}(): `
            + `.previous_output_TypedArrayArray_nonEmpty `
            + `( ${neuralWorkerProxies.previous_output_TypedArrayArray_nonEmpty} ) `
            + `should be false after .NeuralNetArray_create_async() done. `
            + `${neuralWorkerProxies}` );
      }

      if ( this.ImplicitInputModeInfo.implicit_input_bFillAlignmentMark ) {
        if ( this.neuralNetCount > 1 ) {
          this.alignmentMarkValueArrayArray // Test TypedArray.
            = [ Int32Array.from( [ 155, 155, 155, 255 ] ),
                Uint8ClampedArray.from( [ 255, 255, 255, 255 ] ) ];
        } else {
          this.alignmentMarkValueArrayArray // Test Array.
            = [ [ 55, 55, 55, 255 ] ];
        }

        let bSetOkPromise = neuralWorkerProxies
          .alignmentMarkValueArrayArray_set_async(
            this.alignmentMarkValueArrayArray );

        let bSetOk = await bSetOkPromise;
        if ( false == bSetOk )
          throw Error( `NeuralWorker_tester.PerformanceTestCase`
            + `.${funcNameInMessage}(): `
            + `Failed to set alignment mark by neuralWorkerProxies. `
            + `${neuralWorkerProxies}` );

        if ( !neuralWorkerProxies.alignmentMarkValueArrayArray_nonEmpty )
          throw Error( `NeuralWorker_tester.PerformanceTestCase`
            + `.${funcNameInMessage}(): `
            + `.alignmentMarkValueArrayArray_nonEmpty `
            + `( ${neuralWorkerProxies.alignmentMarkValueArrayArray_nonEmpty} ) `
            + `should be true after `
            + `.alignmentMarkValueArrayArray_set_async() done. `
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
    alignmentMarkValueArray, previous_output_TypedArray ) {

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

      const controls_all = g_Controls.controls_all;
      if ( controls_all.Info_TextArea.textContent
              .indexOf( strWeightCountInfo ) < 0 ) {
        if ( controls_all.Info_TextArea.textContent.length > 0 ) {
          controls_all.Info_TextArea.textContent += "\n";
        }
        controls_all.Info_TextArea.textContent
          += strWeightCountInfo_withConvType;
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
        let alignmentMarkValueArrayArray;
        let previous_output_TypedArrayArray;
        {
          if ( this.ImplicitInputModeInfo.implicit_input_bFillAlignmentMark )
            alignmentMarkValueArrayArray = [ alignmentMarkValueArray ];
          
          if ( this.ImplicitInputModeInfo.implicit_input_bFillPreviousOutput )
            previous_output_TypedArrayArray = [ previous_output_TypedArray ];
        }

        createTensor_asyncGenerator
          = this.ScaleFiller.createTensor_by_fill_asyncGenerator(
              imageData.data, imageData.height, imageData.width,
              bTwoTensors,
              neuralNet.feedbackShape,
              alignmentMarkValueArrayArray, previous_output_TypedArrayArray
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
      PerformanceTestCase.randomTestWeightArray
        = new Float32Array( weightArrayLength );

      //!!! (2023/05/12 Remarked) Use larger variation to generate negative result.
      //const weightsRandomOffset = TestParams.Base.weightsRandomOffset;
      const weightsRandomOffset = { min: -500, max: +5 };

      RandTools.fill_numberArray(
        PerformanceTestCase.randomTestWeightArray,
        1, 1, weightArrayLength, // height, width, channelCount,
        TestParams.Base.weightsValueBegin,
        TestParams.Base.weightsValueStep,
        weightsRandomOffset.min,
        weightsRandomOffset.max,
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
   * @param {number} nNeuralWorker_ImplicitInputModeId
   *   The numeric identifier of the neural network implicit input mode
   * (NeuralWorker.ImplicitInputMode.Singleton.Ids.Xxx).
   *
   * @param {number} explicit_input_height        explicit image height
   * @param {number} explicit_input_width         explicit image width
   * @param {number} explicit_input_channelCount  explicit image channel count
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
    nNeuralWorker_ImplicitInputModeId,

    explicit_input_height, explicit_input_width, explicit_input_channelCount,

    vocabularyChannelCount,
    vocabularyCountPerInputChannel,

    blockCountTotalRequested,

    output_channelCount,
  
    backendName, bAscent_or_Descent ) {

    this.disposeResources();

//!!! ...unfinished... (2023/05/11)
//    this.largerFactor = largerFactor;

    this.nNeuralWorker_ImplicitInputModeId = nNeuralWorker_ImplicitInputModeId;

    this.explicit_input_height = explicit_input_height;
    this.explicit_input_width = explicit_input_width;
    this.explicit_input_channelCount = explicit_input_channelCount;

    this.vocabularyChannelCount = vocabularyChannelCount;
    this.vocabularyCountPerInputChannel = vocabularyCountPerInputChannel;
    this.blockCountTotalRequested = blockCountTotalRequested;
    this.output_channelCount = output_channelCount;

    this.backendName = backendName;
    this.bAscent_or_Descent = bAscent_or_Descent;

    {
      this.ImplicitInputModeInfo = NeuralWorker.ImplicitInputMode.Singleton
        .getInfo_byId( nNeuralWorker_ImplicitInputModeId );

      this.has_implicit_input
        = this.ImplicitInputModeInfo.has_implicit_input;

      this.output_asInputValueRange
        = this.ImplicitInputModeInfo.output_asInputValueRange;

      if ( this.ImplicitInputModeInfo.has_implicit_input ) {
        this.feedbackShape = new NeuralNet.FeedbackShape();
        this.feedbackShape.init(
          explicit_input_height, explicit_input_width,
          explicit_input_channelCount,
          output_channelCount // feedback_valueCount
        );
      }
    }
  }

  disposeResources() {
    this.neuralWorker_PerformanceTest_release();
    this.testCanvas = null;
  }

  /** */
  inputData_prepare() {

    let inputHeight, inputWidth, inputChannelCount;
    if ( this.has_implicit_input ) {
      inputHeight = this.feedbackShape.input_height;
      inputWidth = this.feedbackShape.input_width;
      inputChannelCount = this.feedbackShape.input_channelCount; // Must be 4;
    } else {
      inputHeight = this.explicit_input_height;
      inputWidth = this.explicit_input_width;
      inputChannelCount = this.explicit_input_channelCount; // Must be 4;
    }

    // vocabularyCountPerInputChannel,

    if ( this.vocabularyCountPerInputChannel < ( 2 ** 8 ) ) { // 256
      if ( inputChannelCount == 4 ) {
        , use ImageData.

      } else {

        - Otherwise, use Uint8ClampedArray.
      }

    } if ( this.vocabularyCountPerInputChannel < ( 2 ** 16 ) ) { // 65536
      , use Uint16Array.

    } else { // ( vocabularyCountPerInputChannel < ( 2 ** 32 ) )
      , use Uint32Array.

    }


!!! ...unfinished... (2023/05/15)

    /*
     If ( vocabularyCountPerChannel < ( 2 ** 8 ) ) // 256
       - If ( input_channelCount == 4 ), use ImageData.
       - Otherwise, use Uint8ClampedArray.
    
     If ( vocabularyCountPerChannel < ( 2 ** 16 ) ), use Uint16Array.
    
     If ( vocabularyCountPerChannel < ( 2 ** 32 ) ), use Uint32Array.
    
    
     sourceDataDesc = {
       valueBegin: 1,
       valueStep: 10, //1,
       randomOffset: { min: -1, max: +1 },
       divisorForRemainder: this.vocabularyCountPerInputChannel, //256
     };
    
    image = NumberImage.Base.create_bySequenceRandom(
      originalHeight, originalWidth, channelCount,
      ImageSourceBag_Base.weightsValueBegin,
      ImageSourceBag_Base.weightsValueStep,
      ImageSourceBag_Base.weightsRandomOffset.min,
      ImageSourceBag_Base.weightsRandomOffset.max,
      ImageSourceBag_Base.weightsDivisorForRemainder
    );
    
        RandTools.fill_numberArray( imageNew.dataArray,
          height, width, channelCount,
          valueBegin, valueStep,
          randomOffsetMin, randomOffsetMax, divisorForRemainder );
    
    */
    
        {
    //!!! (2023/05/11 Remarked)
    //      let inputHeight = this.height * this.largerFactor;
    //      let inputWidth = this.width * this.largerFactor;
    
          this.testCanvas = document.createElement( "canvas" );
          this.testCanvas.height = inputHeight;
          this.testCanvas.width = inputWidth;
    
          let inputImage = this.testPerformance_imageSourceBag.getImage_by(
            inputHeight, inputWidth, inputChannelCount );
    
          let contextAttributes = { willReadFrequently: true };
          let ctx = this.testCanvas.getContext( "2d", contextAttributes );
          let imageData = ctx.createImageData( inputHeight, inputWidth );
    
    !!! ...unfinished... (2023/05/15)
    // should restrict .data value between [ 0, vocabularyCountPerChannel - 1 ]
    
          for ( let i = 0; i < imageData.data.length; ++i ) {
            imageData.data[ i ] = inputImage.dataArray[ i ];
          }
    
          ctx.putImageData( imageData, 0 , 0 );
        }
    
  }

  /**
   * 
   */
  neuralWorker_PerformanceTest_addCase(
    testCaseId, testCaseName, neuralNetParamsBase,
    nNeuralWorker_ModeId, nNeuralWorker_ImplicitInputModeId ) {

    let aPerformanceTestCase = PerformanceTestCase.Pool.get_or_create_by(
      testCaseId, testCaseName, neuralNetParamsBase,
      nNeuralWorker_ModeId, nNeuralWorker_ImplicitInputModeId );

    this.testCaseMap.set( testCaseName, aPerformanceTestCase );
  }

  /** */
  neuralWorker_PerformanceTest_init() {

    this.disposeResources();

    this.neuralWorkerProxies = NeuralWorker.Proxies.Pool.get_or_create_by();

//!!! (2023/05/15 Remarked)
//     // Larger input image for performance testing.
//     this.testPerformance_imageSourceBag
//       = ImageSourceBag.Base.Pool.get_or_create_by( "int32" );

!!! ...unfinished... (2023/05/15)
/*
 If ( vocabularyCountPerChannel < ( 2 ** 8 ) ) // 256
   - If ( input_channelCount == 4 ), use ImageData.
   - Otherwise, use Uint8ClampedArray.

 If ( vocabularyCountPerChannel < ( 2 ** 16 ) ), use Uint16Array.

 If ( vocabularyCountPerChannel < ( 2 ** 32 ) ), use Uint32Array.


 sourceDataDesc = {
   valueBegin: 1,
   valueStep: 10, //1,
   randomOffset: { min: -1, max: +1 },
   divisorForRemainder: 256
 };

image = NumberImage.Base.create_bySequenceRandom(
  originalHeight, originalWidth, channelCount,
  ImageSourceBag_Base.weightsValueBegin,
  ImageSourceBag_Base.weightsValueStep,
  ImageSourceBag_Base.weightsRandomOffset.min,
  ImageSourceBag_Base.weightsRandomOffset.max,
  ImageSourceBag_Base.weightsDivisorForRemainder
);

    RandTools.fill_numberArray( imageNew.dataArray,
      height, width, channelCount,
      valueBegin, valueStep,
      randomOffsetMin, randomOffsetMax, divisorForRemainder );

*/

    {
//!!! (2023/05/11 Remarked)
//      let inputHeight = this.height * this.largerFactor;
//      let inputWidth = this.width * this.largerFactor;

      let inputHeight, inputWidth, inputChannelCount;
      if ( this.has_implicit_input ) {
        inputHeight = this.feedbackShape.input_height;
        inputWidth = this.feedbackShape.input_width;
        inputChannelCount = this.feedbackShape.input_channelCount; // Must be 4;
      } else {
        inputHeight = this.explicit_input_height;
        inputWidth = this.explicit_input_width;
        inputChannelCount = this.explicit_input_channelCount; // Must be 4;
      }

      this.testCanvas = document.createElement( "canvas" );
      this.testCanvas.height = inputHeight;
      this.testCanvas.width = inputWidth;

      let inputImage = this.testPerformance_imageSourceBag.getImage_by(
        inputHeight, inputWidth, inputChannelCount );

      let contextAttributes = { willReadFrequently: true };
      let ctx = this.testCanvas.getContext( "2d", contextAttributes );
      let imageData = ctx.createImageData( inputHeight, inputWidth );

!!! ...unfinished... (2023/05/15)
// should restrict .data value between [ 0, vocabularyCountPerChannel - 1 ]

      for ( let i = 0; i < imageData.data.length; ++i ) {
        imageData.data[ i ] = inputImage.dataArray[ i ];
      }

      ctx.putImageData( imageData, 0 , 0 );
    }

//!!! (2023/05/15 Remarked)
//    this.testPerformance_imageSourceBag.clear(); // Reduce memory.


    if ( this.testCaseMap )
      this.testCaseMap.clear();
    else
      this.testCaseMap = new Map();

    //const vocabularyCountPerInputChannel = 256;

    // (2023/03/08 Remarked) Use SHUFFLE_NET_V2_BY_MOBILE_NET_V1 instead.
    // const nConvStageType
    //   = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID; // (6)

    // Use ( pad = same ) so that edge pixels will not be dropped.
    const nConvStageType
      = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1; // (5)

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

      const testCaseId = theModeInfo.id;
      const testCaseName
        = NeuralWorker.Mode.Singleton.getNameWithInt_byId( i );

      let neuralNetParamsBase = NeuralNet.ParamsBase.Pool.get_or_create_by(
        this.explicit_input_height, this.explicit_input_width,
        this.explicit_input_channelCount,
        this.has_implicit_input,
        this.vocabularyChannelCount, this.vocabularyCountPerInputChannel,
        nConvStageType,
        this.blockCountTotalRequested,
        this.output_channelCount, this.output_asInputValueRange,
        bKeepInputTensor
      );

      this.neuralWorker_PerformanceTest_addCase(
        testCaseId, testCaseName, neuralNetParamsBase,
        theModeInfo.id, this.nNeuralWorker_ImplicitInputModeId,
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

//!!! (2023/05/15 Remarked)
//     if ( this.testPerformance_imageSourceBag ) {
//       this.testPerformance_imageSourceBag.disposeResources_and_recycleToPool();
//       this.testPerformance_imageSourceBag = null;
//     }

    this.neuralWorkerProxies?.disposeResources_and_recycleToPool();
    this.neuralWorkerProxies = null;
  }

  /** Test .TypedArray_process_async by Xxx */
  async testNeuralWorker_ByName( testCaseName ) {
    const funcNameInMessage = "testNeuralWorker_ByName";

    const neuralWorkerProxies = this.neuralWorkerProxies;

    let testCase = this.testCaseMap.get( testCaseName );

    // First time test this case. Release all other test cases' neural networks
    // (so that there will be enough memory). Create the specified neural network.
    if ( !testCase.preparePromise ) {
      this.neuralWorker_PerformanceTest_release_preparePromise();
      testCase.preparePromise = testCase.prepare_async(
        neuralWorkerProxies );
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
      = neuralWorkerProxies.TypedArray_process_async(
          imageData.data, imageData.height, imageData.width );

    if ( imageData.data.length != 0 )
      throw Error( `NeuralWorker_tester.HeightWidthDepth`
        + `.${funcNameInMessage}(): `
        + `imageData.data.length ( ${imageData.data.length} ) should be 0 `
        + `after transferred to worker. `
        + `${neuralWorkerProxies}` );

    let resultFloat32ArrayArray = await resultFloat32ArrayArrayPromise;

    if ( !neuralWorkerProxies.previous_output_TypedArrayArray_nonEmpty )
      throw Error( `NeuralWorker_tester.HeightWidthDepth`
        + `.${funcNameInMessage}(): `
        + `.previous_output_TypedArrayArray_nonEmpty `
        + `( ${neuralWorkerProxies.previous_output_TypedArrayArray_nonEmpty} ) `
        + `should be true after .TypedArray_process_async() done. `
        + `${neuralWorkerProxies}` );

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
    const funcNameInMessage = "tester";

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

    const performanceTable_htmlTableOperator
      = g_Controls.performanceTable_htmlTableOperator;
    {
      if ( !performanceTable_htmlTableOperator.Header_hasChild() ) {
        performanceTable_htmlTableOperator.Header_addRow( [
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
          for ( let testCaseIndex = testCaseIndexBegin;
            testCaseIndex != testCaseIndexEnd;
            testCaseIndex += testCaseIndexStep ) {

            testCase = testCaseArray[ testCaseIndex ];

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
              for ( let timeTimesIndex = 0;
                timeTimesIndex < timeInfo.times;
                ++timeTimesIndex ) {

                if ( this.ImplicitInputModeInfo.implicit_input_bFillAlignmentMark ) {
                  if ( testCase.neuralNetCount == 2 ) {
                    let swapOk = await this.neuralWorkerProxies
                      .alignmentMarkValueArrayArray_swap_async();

                    if ( !swapOk )
                      throw Error( `NeuralWorker_tester.HeightWidthDepth`
                        + `.${funcNameInMessage}(): .neuralWorkerProxies`
                        + `.alignmentMarkValueArrayArray_swap_async() `
                        + `result ( ${swapOk} ) `
                        + `should be true. `
                        + `${this.neuralWorkerProxies}` );
                  }
                }

                timeInfo.begin = Date.now();
                let testByNamePromise
                  = this.testNeuralWorker_ByName( testCase.testCaseName );
                resultFloat32ArrayArray = await testByNamePromise;
                timeInfo.end = Date.now();
                timeInfo.elapsed = timeInfo.end - timeInfo.begin;
                timeInfo.elapsedTotal += timeInfo.elapsed;

                // Deep copy the last 2nd testing result (i.e. the last 1st
                // input) as previous time output for verification.
                if ( timeTimesIndex == ( timeInfo.times - 2 ) ) {
                  previous_output_TypedArrayArray_for_verification
                    = new Array( testCase.neuralNetCount );
                  for ( let j = 0; j < testCase.neuralNetCount; ++j ) {
                    previous_output_TypedArrayArray_for_verification[ j ]
                      = resultFloat32ArrayArray[ j ].slice();
                  }
                }

                progressToAdvance.value_advance(); // Every performance test complete.
                yield progressRoot;
              } // timeTimesIndex

              performanceTable_htmlTableOperator.Body_addRow( [
                backendName, timeInfo.name, timeInfo.countPerSecond
              ] );
              //console.log( timeInfo.toString() );
            }

            { // Verify neural network result.
              let prefixMsg = "NeuralNet";
              let postfixMsg = testCase.testCaseName;

              for ( let neuralNetIndex = 0;
                neuralNetIndex < testCase.neuralNetCount;
                ++neuralNetIndex ) {

                let alignmentMarkValueArray;
                let previous_output_TypedArray;
                {
                  if ( this.ImplicitInputModeInfo.implicit_input_bFillAlignmentMark )
                    alignmentMarkValueArray
                      = testCase.alignmentMarkValueArrayArray[ neuralNetIndex ];
                  
                  if ( this.ImplicitInputModeInfo.implicit_input_bFillPreviousOutput )
                    previous_output_TypedArray
                      = previous_output_TypedArrayArray_for_verification[ neuralNetIndex ];
                }
    
                // NeuralNet_try_result_async() should be called after
                // prepare_async() so that the nConvStageTypeId has been
                // adjusted.
                let resultFloat32Array = await testCase
                  .NeuralNet_try_result_async( this.testCanvas,
                    alignmentMarkValueArray, previous_output_TypedArray );

                let lhsNumberArray = resultFloat32ArrayArray[ neuralNetIndex ];
                let rhsNumberArray = resultFloat32Array;
                let lhsNumberArrayName = `output${neuralNetIndex}`;
                let rhsNumberArrayName = `outputRef${neuralNetIndex}`;
                let postfixMsg = testCase.testCaseName;

                asserter_Equal.assert_NumberArray_NumberArray(
                  lhsNumberArray, rhsNumberArray,
                  prefixMsg,
                  lhsNumberArrayName, rhsNumberArrayName,
                  postfixMsg );
              } // neuralNetIndex
            }

            progressToAdvance.value_advance(); // Every NeuralWorker.Mode complete
            yield progressRoot;
          } // testCaseIndex

          this.neuralWorker_PerformanceTest_release();

          asserter_Equal?.disposeResources_and_recycleToPool();
          asserter_Equal = null;
        }

        let memoryInfo_testCorrectness_after = tf.memory();

        if ( memoryInfo_testCorrectness_after.numTensors
               != memoryInfo_testCorrectness_before.numTensors )
          throw Error( `NeuralWorker_tester.HeightWidthDepth`
            + `.${funcNameInMessage}(): `
            + `memory leak. `
            + `result tensor count (${memoryInfo_testCorrectness_after.numTensors}) `
            + `should be (${memoryInfo_testCorrectness_before.numTensors} `
          );
      }

      Pool.Asserter.assert_Pool_issuedCount(
        `NeuralWorker_tester.HeightWidthDepth.${funcNameInMessage}()`,
        pool_all_issuedCount_before );

    } catch ( e ) {
      let backendName = tf.getBackend();
      let msg = `NeuralWorker_tester.HeightWidthDepth`
        + `.${funcNameInMessage}(): `
        + `backendName=${backendName}, `
        + `testCaseId=${testCase.testCaseId}, `
        + `testCaseName=${testCase.testCaseName}. `
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

  nNeuralWorker_ImplicitInputModeId,

  explicit_input_height,
  explicit_input_width,
  explicit_input_channelCount,

  vocabularyChannelCount,
  vocabularyCountPerInputChannel,

  blockCountTotalRequested,

  output_channelCount,

  backendName, bAscent_or_Descent,
) {

  let testSet;
  try {
    // Using mobile phone's resolution ( 1080 * 2160 ) will crash the computer.
    // Using ( 1 / 15 ) of computer screen ( 1080 * 1920 ) (i.e. ( 72 * 128 )).
    testSet = new HeightWidthDepth(
//!!! (2023/05/11 Remarked)
//      largerFactor,
      nNeuralWorker_ImplicitInputModeId,
      explicit_input_height, explicit_input_width, explicit_input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
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

  nNeuralWorker_ImplicitInputModeId,

  explicit_input_height = 72,
  explicit_input_width = 128,
  explicit_input_channelCount = 4,

  vocabularyChannelCount = 8, //6, //4,
  vocabularyCountPerInputChannel = 256,

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

      nNeuralWorker_ImplicitInputModeId,
      explicit_input_height, explicit_input_width,
      explicit_input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      blockCountTotalRequested,
      output_channelCount,
      "webgl", bAscent_or_Descent,
    );

    bAscent_or_Descent = true; // Ascent
    yield* testerBackend( progress_NeuralWorker_tester_cpu,

//!!! (2023/05/11 Remarked)
//      largerFactor,

      nNeuralWorker_ImplicitInputModeId,
      explicit_input_height, explicit_input_width,
      explicit_input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
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

  const controls_all = g_Controls.controls_all;
  const numeric_controls_valueObject = g_Controls.numeric_controls_valueObject;

  controls_all.TestButton.disabled = true; // Prevent multiple clicks.
  controls_all.Info_TextArea.textContent = "";

  // Extract parameters from UI.

//!!! (2023/05/14 Remarked)
// Use  g_Controls.numeric_controls_collect_values()
// except implicit_input_mode_Select  
//
// //!!! ...unfinished... (2023/05/11)
// //  let largerFactor = Number.parseInt( g_Controls.largerFactor_Text.value );
// //  g_Controls.largerFactor_Text.value = largerFactor;
//
//   let explicit_input_height
//     = NeuralNet.Params.explicit_input_height.valueDesc.range.adjust(
//         Number.parseInt( g_Controls.explicit_input_height_Number.value ) );
//   g_Controls.explicit_input_height_Number.value = explicit_input_height;
//
//   let explicit_input_width
//     = NeuralNet.Params.explicit_input_width.valueDesc.range.adjust(
//         Number.parseInt( g_Controls.explicit_input_width_Number.value ) );
//   g_Controls.explicit_input_width_Number.value = explicit_input_width;
//
// //!!! ...unfinished... (2023/05/12)
// // Restrict it?
//   let explicit_input_channelCount
//     = NeuralNet.Params.explicit_input_channelCount.valueDesc.range.adjust(
//         Number.parseInt( g_Controls.explicit_input_channelCount_Number.value ) );
//   g_Controls.explicit_input_channelCount_Number.value = explicit_input_channelCount;
//
//
//   let vocabularyChannelCount
//     = NeuralNet.Params.vocabularyChannelCount.valueDesc.range.adjust(
//         Number.parseInt( g_Controls.vocabularyChannelCount_Number.value ) );
//   g_Controls.vocabularyChannelCount_Number.value = vocabularyChannelCount;
//
// //!!! ...unfinished... (2023/05/12)
// // Restrict it?
//   let vocabularyCountPerInputChannel
//     = NeuralNet.Params.vocabularyCountPerInputChannel.valueDesc.range.adjust(
//         Number.parseInt( g_Controls.vocabularyCountPerInputChannel_Number.value ) );
//   g_Controls.vocabularyCountPerInputChannel_Number.value
//     = vocabularyCountPerInputChannel;
//
//   let blockCountTotalRequested
//     = NeuralNet.Params.blockCountTotalRequested.valueDesc.range.adjust(
//         Number.parseInt( g_Controls.blockCountTotalRequested_Number.value ) );
//   g_Controls.blockCountTotalRequested_Number.value = blockCountTotalRequested;
//
//
//   let output_channelCount
//     = NeuralNet.Params.output_channelCount.valueDesc.range.adjust(
//         Number.parseInt( g_Controls.output_channelCount_Number.value ) );
//   g_Controls.output_channelCount_Number.value
//     = output_channelCount;

//!!! ...unfinished... (2023/05/14)
  g_Controls.numeric_controls_collect_values();

  let nNeuralWorker_ImplicitInputModeId
    = Number.parseInt( controls_all.implicit_input_mode_Select.value );
  controls_all.implicit_input_mode_Select.value
    = nNeuralWorker_ImplicitInputModeId;

  // Prepare output table.
  const htmlTableId = "NeuralWorker_Performance_Table";
  const digitsCount = 4;
  g_Controls.performanceTable_htmlTableOperator_create(
    htmlTableId, digitsCount );

  // Aggregate all progress about util_tester.
  let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

  let progress_NeuralWorker_tester = progress.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let tester = testerBackendAll( progress_NeuralWorker_tester,

//!!! (2023/05/11 Remarked)
//    largerFactor,

    nNeuralWorker_ImplicitInputModeId,
    numeric_controls_valueObject.explicit_input_height,
    numeric_controls_valueObject.explicit_input_width,
    numeric_controls_valueObject.explicit_input_channelCount,
    numeric_controls_valueObject.vocabularyChannelCount,
    numeric_controls_valueObject.vocabularyCountPerInputChannel,
    numeric_controls_valueObject.blockCountTotalRequested,
    numeric_controls_valueObject.output_channelCount
  );

  let progressReceiver
    = new ValueMax.Receiver.HTMLProgress( controls_all.TestProgressBar );
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
    g_Controls.performanceTable_htmlTableOperator_dispose();

    controls_all.TestButton.disabled = false; // Re-enable UI.

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
