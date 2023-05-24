//export { tester };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as PartTime from "../util/PartTime.js";
import * as RandTools from "../util/RandTools.js";
import * as ScriptLoader from "../util/ScriptLoader.js";
import * as TensorTools from "../util/TensorTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ValueRange from "../Unpacker/ValueRange.js";
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
    largerFactor_Number: null,

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
  numeric_controls_valueRangeArray = [];  // Numeric properties' value range.
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
    this.numeric_controls_valueRangeArray.length = 0;

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

        let valueRange;

        // If the numeric control represents a NeuralNet.Params, setup range.
        const paramDesc = NeuralNet.Params[ propertyName ];
        if ( paramDesc ) {
          valueRange = paramDesc.valueDesc.range;
          htmlElement.min = valueRange.min;
          htmlElement.max = valueRange.max;

        } else { // Otherwise, use range in the HTML element.
          valueRange = new ValueRange.Int( htmlElement.min, htmlElement.max );
        }

        this.numeric_controls_valueRangeArray.push( valueRange );
      }
    }
  }

  /** */
  numeric_controls_collect_values() {
    const numeric_controls = this.numeric_controls;
    const numeric_controls_controlNameArray = this.numeric_controls_controlNameArray;
    const numeric_controls_propertyNameArray = this.numeric_controls_propertyNameArray;
    const numeric_controls_valueRangeArray = this.numeric_controls_valueRangeArray;
    const numeric_controls_valueArray = this.numeric_controls_valueArray;
    const numeric_controls_valueObject = this.numeric_controls_valueObject;

    numeric_controls_valueArray.length = numeric_controls_controlNameArray.length;
    for ( let i = 0; i < numeric_controls_controlNameArray.length; ++i ) {
      const controlName = numeric_controls_controlNameArray[ i ];
      const propertyName = numeric_controls_propertyNameArray[ i ];
      const valueRange = numeric_controls_valueRangeArray[ i ];

      const htmlElement = numeric_controls[ controlName ];
      const valueInt = Number.parseInt( htmlElement.value );

      let valueIntAdjusted;
      { // Restrict it by range.
        if ( valueRange )
          valueIntAdjusted = valueRange.adjust( valueInt );
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

    const input_channelCount
      = this.neuralNetParamsBase.explicit_input_channelCount;

    const vocabularyCountPerInputChannel
      = this.neuralNetParamsBase.vocabularyCountPerInputChannel;

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

      // Prepare .alignmentMarkValueArrayArray
      if ( this.ImplicitInputModeInfo.implicit_input_bFillAlignmentMark ) {

        if ( this.neuralNetCount > 1 )
          this.alignmentMarkValueArrayArray // Test TypedArray.
            = [ new Int32Array( input_channelCount ),
                new Uint8ClampedArray( input_channelCount ) ];
        else
          this.alignmentMarkValueArrayArray // Test Array.
            = [ new Array( input_channelCount ) ];

        // between [ 0, ( vocabularyCountPerInputChannel - 1 ) ]
        const markValueBegin = 10;
        const markValueStep = 1;
        const markRandomOffset = { min: -10, max: +1 };
        const markDivisorForRemainder = vocabularyCountPerInputChannel;

        for ( let neuralNetIndex = 0;
          neuralNetIndex < this.neuralNetCount; ++neuralNetIndex ) {

          RandTools.fill_numberArray(
            this.alignmentMarkValueArrayArray[ neuralNetIndex ],
            1, 1, input_channelCount,
            markValueBegin, markValueStep,
            markRandomOffset.min, markRandomOffset.max,
            markDivisorForRemainder
          );
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
  async NeuralNet_try_result_async(
    input_TypedArray, input_height, input_width,
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
//!!! ...unfinished... (2023/05/24 Remarked)
//          = this.ScaleFiller.createTensor_by_fill_asyncGenerator(
          = this.ScaleFiller.createTensor_by_scale_fill_asyncGenerator(
              input_TypedArray, input_height, input_width,
              bTwoTensors,
              neuralNet.feedbackShape,
              alignmentMarkValueArrayArray, previous_output_TypedArrayArray
            );
      }

      let { done, value: [ sourceTensor, sourceTypedArrayAsyncFunction ] }
        = await createTensor_asyncGenerator.next();

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

      const pseudo_height = 1024;
      const pseudo_width = 1024;
      //!!! (2022/09/25 Remarked) too large for mobile phone.
      //const pseudo_channelCount = 100;
      const pseudo_channelCount = 10;

      const weightArrayLength
        = pseudo_height * pseudo_width * pseudo_channelCount;

      PerformanceTestCase.randomTestWeightArray
        = new Float32Array( weightArrayLength );

      const weightsValueBegin = 0;
      const weightsValueStep = 10;

      // Use larger variation to generate negative result.
      const weightsRandomOffset = {
        min: - ( 10 * weightArrayLength ),
        max: +5 };

      //!!! (2023/05/15 Remarked) For reduce neural network result value.
      //const weightsDivisorForRemainder = 1024;
      const weightsDivisorForRemainder = 128;

      RandTools.fill_numberArray(
        PerformanceTestCase.randomTestWeightArray,
        pseudo_height, pseudo_width, pseudo_channelCount,
        weightsValueBegin, weightsValueStep,
        weightsRandomOffset.min,
        weightsRandomOffset.max,
        weightsDivisorForRemainder
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
    largerFactor,

    nNeuralWorker_ImplicitInputModeId,

    explicit_input_height, explicit_input_width, explicit_input_channelCount,

    vocabularyChannelCount,
    vocabularyCountPerInputChannel,

    blockCountTotalRequested,

    output_channelCount,
  
    backendName, bAscent_or_Descent ) {

    this.disposeResources();

    this.largerFactor = largerFactor;

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
    this.input_TypedArray = undefined;
    this.input_Canvas = undefined;
  }

  get input_height() {
    if ( this.has_implicit_input )
      return this.feedbackShape.input_height;
    else
      return this.explicit_input_height;
  }

  get input_width() {
    if ( this.has_implicit_input )
      return this.feedbackShape.input_width;
    else
      return this.explicit_input_width;
  }

  get input_channelCount() {
    if ( this.has_implicit_input )
      return this.feedbackShape.input_channelCount;
    else
      return this.explicit_input_channelCount;
  }

  get input_pixelCount() {
    return this.input_height * this.input_width ;
  }

  get input_valueCount() {
    return this.input_pixelCount * this.input_channelCount;
  }

  /** Create .input_TypedArray or .input_Canvas */
  input_TypedArray_prepare() {
    const funcNameInMessage = "input_TypedArray_prepare";

    const largerFactor = this.largerFactor;

    const input_height = this.input_height;
    const input_width = this.input_width; 
    const input_channelCount = this.input_channelCount;
    //const input_pixelCount = this.input_pixelCount;
    const input_valueCount = this.input_valueCount;

    const input_height_scaled
      = this.input_height_scaled = input_height * largerFactor;

    const input_width_scaled
      = this.input_width_scaled = input_width * largerFactor; 

    const input_valueCount_scaled
      = this.input_valueCount_scaled
      // scaled along both height and width.
      = input_valueCount * largerFactor * largerFactor;

    const input_valueCount_scaled_max = ( 16 * 1024 * 1024 );
    if ( input_valueCount_scaled > input_valueCount_scaled_max )
      throw Error( `NeuralWorker_tester.HeightWidthDepth`
        + `.${funcNameInMessage}(): `
        + `.input_valueCount_scaled `
        + `= ( ( input_height * largerFactor ) * ( input_width * largerFactor ) * input_channelCount ) `
        + `= ( ( ${input_height} * ${largerFactor} ) * ( ${input_width} * ${largerFactor} ) * ${input_channelCount} ) `
        + `= ( ${input_height_scaled} * ${input_width_scaled} * ${input_channelCount} ) `
        + `= ( ${input_valueCount_scaled} ) `
        + `should not exceed `
        + `.input_valueCount_scaled_max `
        + `( ${input_valueCount_scaled_max} ).`
      );

    const vocabularyCountPerInputChannel = this.vocabularyCountPerInputChannel;

    // Create input data array.
    //
    // Note: It seems that tf.tensor( dtype="int32" ) can only accept
    //       Uint8ClampedArray, Uint8Array and Int32Array. Others (e.g.
    //       Int8Array, Uint16Aray, Int16Array, Uint32Array) can not be
    //       accepted.
    //
    if ( vocabularyCountPerInputChannel <= ( 2 ** 8 ) ) // 256
      this.input_TypedArray = new Uint8ClampedArray( input_valueCount_scaled );
    else // ( vocabularyCountPerInputChannel > 256 )
      this.input_TypedArray = new Int32Array( input_valueCount_scaled );

    // Fill input data.
    {
      // Restrict data value between [ 0, ( vocabularyCountPerChannel - 1 ) ].
      const input_valueBegin = 10;
      const input_valueStep = 10; //1;
      const input_randomOffset = { min: -10, max: +10 };
      const input_divisorForRemainder = vocabularyCountPerInputChannel;

      RandTools.fill_numberArray(
        this.input_TypedArray,
        input_height_scaled, input_width_scaled, input_channelCount,
        input_valueBegin, input_valueStep,
        input_randomOffset.min, input_randomOffset.max,
        input_divisorForRemainder );
    }

    // If ( vocabulary count <= 256 ) and ( channel count == 4 ), use canvas.
    if (   ( vocabularyCountPerInputChannel <= ( 2 ** 8 ) ) // 256
        && ( input_channelCount == 4 ) ) { // Use ImageData.
    
      let imageData = new ImageData(
        this.input_TypedArray, input_width_scaled, input_height_scaled );

      this.input_TypedArray = null; // It has been kept by ImageData directly.

      this.input_Canvas = document.createElement( "canvas" );
      this.input_Canvas.height = input_height_scaled;
      this.input_Canvas.width = input_width_scaled;

      let contextAttributes = { willReadFrequently: true };
      let ctx = this.input_Canvas.getContext( "2d", contextAttributes );
      ctx.putImageData( imageData, 0 , 0 );

    } else {
      this.input_Canvas = null; // No canvas in this case.
    }
  }

  /**
   * @return {TypedArray}
   *   Return a TypedArray which is cloned from the input data.
   */
  input_TypedArray_clone() {
    let input_TypedArray_clone;
    if ( this.input_Canvas ) {
      let ctx = this.input_Canvas.getContext( "2d" );
      let imageData = ctx.getImageData(
        0, 0, this.input_Canvas.width, this.input_Canvas.height );
      input_TypedArray_clone = imageData.data; // ImageData is cloned already.
    } else {
      input_TypedArray_clone = this.input_TypedArray.slice();
    }
    return input_TypedArray_clone;
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

    this.input_TypedArray_prepare();
    this.neuralWorkerProxies = NeuralWorker.Proxies.Pool.get_or_create_by();

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

    const input_height_scaled = this.input_height_scaled;
    const input_width_scaled = this.input_width_scaled;
    const input_TypedArray = this.input_TypedArray_clone();

    let resultFloat32ArrayArrayPromise
      = neuralWorkerProxies.TypedArray_process_async(
          input_TypedArray, input_height_scaled, input_width_scaled );

    if ( input_TypedArray.length != 0 )
      throw Error( `NeuralWorker_tester.HeightWidthDepth`
        + `.${funcNameInMessage}(): `
        + `input_TypedArray.length ( ${input_TypedArray.length} ) should be 0 `
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
              const input_height_scaled = this.input_height_scaled;
              const input_width_scaled = this.input_width_scaled;

              const prefixMsg = "NeuralNet";
              const postfixMsg = testCase.testCaseName;

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

                const input_TypedArray = this.input_TypedArray_clone();

                // NeuralNet_try_result_async() should be called after
                // prepare_async() so that the nConvStageTypeId has been
                // adjusted.
                let resultFloat32Array = await testCase
                  .NeuralNet_try_result_async(
                    input_TypedArray, input_height_scaled, input_width_scaled,
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
        + `testCaseId=${testCase?.testCaseId}, `
        + `testCaseName=${testCase?.testCaseName}. `
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
  largerFactor,

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
      largerFactor,
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

  largerFactor = 15,

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
      largerFactor,
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
      largerFactor,
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
    numeric_controls_valueObject.largerFactor,
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
