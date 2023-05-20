export { tester };

import * as PartTime from "../util/PartTime.js";
import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
import * as NeuralOrchestra from "../NeuralDEvolution/NeuralOrchestra.js";

//!!! (2023/04/08 Remarked) Not used now.
// // number to boolean loop order.
//
// // from false to true.
// const n_to_b_false_true = { begin: 0, end: 2, step: +1 };
//
// // from true to false.
// const n_to_b_true_false = { begin: 1, end: -1, step: -1 };
//
// /** current uses which kind of number to boolean loop. */
// const n_to_b = n_to_b_true_false;


/** async type. */
const asyncType_0_asyncGenerator = 0;
const asyncType_1_asyncGenerator_with_asyncPromise_progress = 1;
const asyncType_2_asyncPromise = 2;

/** async type order. */
const asyncTypeOrder_0_ascent =  { begin: 0, end:  3, step: +1, count: 3 }; // 0 to 2
const asyncTypeOrder_1_descent = { begin: 2, end: -1, step: -1, count: 3 }; // 2 to 0

const asyncTypeOrderArray = [
  asyncTypeOrder_0_ascent,
  asyncTypeOrder_1_descent
];

//const asyncTypeOrder = asyncTypeOrder_1_descent;


/** */
class TestCase {

  /** */
  constructor() {
    this.init_parameters = {
      downloader_spreadsheetId: "18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M",
      downloader_apiKey: null,

      // bLogFetcherEventToConsole: false,
      bLogFetcherEventToConsole: true,

      sender_clientId: Date.now(),

      explicit_input_height: 72,
      explicit_input_width: 128,
      explicit_input_channelCount: 4, // RGBA Image.

      nNeuralWorker_ImplicitInputModeId:
        NeuralWorker_ImplicitInputMode.Singleton.Ids
          .IMPLICIT_INPUT__FILL_ALIGNMENT_MARK__FILL_PREVIOUS_OUTPUT, // (5)

      vocabularyChannelCount: 4, //8, //6,
      vocabularyCountPerInputChannel: 256, // ( 2 ** 8 ) for RGBA channel.

      blockCountTotalRequested: 39, //84, //144,
      output_channelCount: 64, //128,
    };

    {
      const init_parameters = this.init_parameters;
      let feedbackShape = init_parameters.feedbackShape
        = new NeuralNet.FeedbackShape();

      feedbackShape.init(
        init_parameters.explicit_input_height,
        init_parameters.explicit_input_width,
        init_parameters.explicit_input_channelCount,
        init_parameters.output_channelCount
      );
    }

    {
      const output_channelCount = this.init_parameters.output_channelCount;

      const alignmentMarkValueArray0
        = [ ... ( new Array( output_channelCount ) ).keys() ]
            .map( x => x + 1 );

      const alignmentMarkValueArray1
        = [ ... ( new Array( output_channelCount ) ).keys() ]
            .map( x => x + output_channelCount + 1 );

      this.init_parameters.alignmentMarkValueArrayArray
        = [ alignmentMarkValueArray0, alignmentMarkValueArray1 ];
    }

    this.loadCountBase = 2; // One is by init, another is by versus_load

    this.testId = undefined; // For debug.

    // Note:
    //
    // In the reentrance testing, when try await, the async method may have
    // been completed. This is especially true for TypedArray_process_Xxx()
    // which executues in another web worker (real parallelly).
    //
    // To prevent they complete too fast to test, add some delay by
    // PartTime.Promise_resolvable_rejectable_create().
  }

  /**
   * Because ImageData.data.buffer (and sourceNumberArray.buffer) will be
   * transferred (i.e. not copied) to web worker when
   * .TypedArray_process_asyncPromise_create(), they should be re-created
   * every time.
   */
  ImageData_create() {
    const init_parameters = this.init_parameters;
    const feedbackShape = init_parameters.feedbackShape

    const input_height = feedbackShape.input_height;
    const input_width = feedbackShape.input_width;

    // should be 4 for RGBA image.
    const input_channelCount = feedbackShape.input_channelCount;

    const valueBegin = 0, valueStep = 1;
    const randomOffsetMin = -1, randomOffsetMax = 1;
    const divisorForRemainder = 256; //( 2 ** 26 );

//!!! (2023/05/17 Remarked)
//    let elementCount = input_height * input_width * input_channelCount;
    let elementCount = feedbackShape.input_valueCount;

    let sourceNumberArray = new Uint8ClampedArray( elementCount );
    RandTools.fill_numberArray( sourceNumberArray,
      input_height, input_width, input_channelCount,
      valueBegin, valueStep,
      randomOffsetMin, randomOffsetMax, divisorForRemainder );

    let sourceImageData = new ImageData( sourceNumberArray,
      input_width, input_height );

    return sourceImageData;
  }

  /**
   * @param {NeuralOrchestra.Base} neuralOrchestra
   *   The object which has method with the specified name.
   *
   * @param {string} methodName
   *   neuralOrchestra[ methodName ]() will be called. If it does not throw
   * exception (whose message should has the `${methodName}():`), throw exception.
   */
  neuralOrchestra_should_throw_exception( neuralOrchestra, methodName ) {
    try {
      ++this.testId;
      neuralOrchestra[ methodName ]();
      throw Error( `NeuralOrchestra: testId=${this.testId}. `
        + `NeuralOrchestra.Base.${methodName}() should throw exception.`
      );

    } catch ( e ) {
      let decoratedMethodName = `${methodName}():`;
      if ( e.message.indexOf( decoratedMethodName ) < 0 ) {
        // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`,
          { cause: e } );
      }
    }
  }


//!!! ...unfinished... (2023/05/20)
//  alignmentMarkValueArrayArray_set_asyncPromise
//  alignmentMarkValueArrayArray_swap_asyncPromise

  /**
   *
   */
  async* test_alignmentMarkValueArrayArray_set_asyncGenerator(
    neuralOrchestra ) {

    const funcNameInMessage
      = "test_alignmentMarkValueArrayArray_set_asyncGenerator";

    ++this.testId;

    const alignmentMarkValueArrayArray
      = this.init_parameters.alignmentMarkValueArrayArray;

    // 1. Set alignment mark value array array.
    let delayPromise = PartTime.Promise_resolvable_rejectable_create();

    let setPromise = neuralOrchestra
      .alignmentMarkValueArrayArray_set_asyncPromise_create(
        alignmentMarkValueArrayArray, delayPromise );

    if ( !neuralOrchestra.alignmentMarkValueArrayArray_set_asyncPromise_running )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.alignmentMarkValueArrayArray_set_asyncPromise_running=`
        + `${neuralOrchestra.alignmentMarkValueArrayArray_set_asyncPromise_running} `
        + `should be true.` );

    if ( neuralOrchestra.alignmentMarkValueArrayArray_setOk !== undefined )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.alignmentMarkValueArrayArray_setOk `
          + `( ${neuralOrchestra.alignmentMarkValueArrayArray_setOk} ) `
        + `should be undefined.` );

//!!! ...unfinished... (2023/05/20)
    // Test: Calling these methods during processing should throw exception.
    {
      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "TypedArray_process_asyncPromise_create" );


      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "init_asyncGenerator_create" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "init_asyncGenerator_create_with_asyncPromise_progress" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "init_asyncPromise_create" );

    
      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versus_load_asyncPromise_create" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versus_load_asyncGenerator_create_with_asyncPromise_progress" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versus_load_asyncGenerator_create" );
    }

    // 2. Wait for image processed.
    ++this.testId;
    let Float32ArrayArray;
    try {
      delayPromise.resolve();
      Float32ArrayArray = await processPromise;
    } catch ( e ) { // Unknown error, said loudly.
      throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
    }

    if ( neuralOrchestra.TypedArray_processOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.TypedArray_processOk `
          + `(${neuralOrchestra.TypedArray_processOk}) `
        + `should be true.` );

    if ( 2 != Float32ArrayArray.length )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `Float32ArrayArray.length=${Float32ArrayArray.length} `
        + `should be 2.` );

    const output_channelCount = this.init_parameters.output_channelCount;
    if ( Float32ArrayArray[ 0 ].length != output_channelCount )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `Float32ArrayArray[ 0 ].length=${Float32ArrayArray[ 0 ].length} `
        + `should be the same as `
        + `.output_channelCount ( ${output_channelCount}.` );

    if ( Float32ArrayArray[ 1 ].length != output_channelCount )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `Float32ArrayArray[ 1 ].length=${Float32ArrayArray[ 1 ].length} `
        + `should be the same as `
        + `.output_channelCount ( ${output_channelCount}.` );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 3. Submit result.
    ++this.testId;

    // A random integer between [ -1, +1 ].
    try {
      let nNegativeZeroPositive = RandTools.getRandomIntInclusive( -1, 1 );
      let bWillTrySend;

      // Test: versus expired.
      {
        let backupLoadTimestampMilliseconds
          = neuralOrchestra.versus.loadTimestampMilliseconds;

        { // Fake an older timestamp.
          neuralOrchestra.versus.loadTimestampMilliseconds
            = Date.now() - DEvolution.Versus.expireIntervalMilliseconds - 1;

          bWillTrySend = neuralOrchestra.versusResultSender_send(
            nNegativeZeroPositive );

          if ( bWillTrySend )
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.${funcNameInMessage}(): testId=${this.testId}, `
              + `.versusResultSender_send() should not try to send the result `
              + `of an expired versus.` );

          progressToAdvance.value_advance();
          yield progressRoot;
        }

        { // Fake an undefined timestamp.
          neuralOrchestra.versus.loadTimestampMilliseconds = undefined;

          bWillTrySend = neuralOrchestra.versusResultSender_send(
            nNegativeZeroPositive );

          if ( bWillTrySend )
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.${funcNameInMessage}(): testId=${this.testId}, `
              + `.versusResultSender_send() should not try to send the result `
              + `of a versus with undefined timestamp.` );

          progressToAdvance.value_advance();
          yield progressRoot;
        }

        { // Normal timestamp.
          neuralOrchestra.versus.loadTimestampMilliseconds
            = backupLoadTimestampMilliseconds;

          bWillTrySend = neuralOrchestra.versusResultSender_send(
            nNegativeZeroPositive );

          if ( !bWillTrySend )
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.${funcNameInMessage}(): testId=${this.testId}, `
              + `.versusResultSender_send() should try to send the result `
              + `of an non-expired versus.` );

          progressToAdvance.value_advance();
          yield progressRoot;
        }
      }

    } catch ( e ) {
      debugger;
      throw e;
    }

    if ( 100 !== progressToAdvance.valuePercentage )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `progressToAdvance.valuePercentage `
          +  `( ${progressToAdvance.valuePercentage} ) should 100.` );
  }


//!!!
  /**
   *
   */
  async* test_process_send_asyncGenerator( progressParent, neuralOrchestra ) {
    const funcNameInMessage = "test_process_send_asyncGenerator";

    ++this.testId;

    let progressRoot = progressParent.root_get();

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 5 ) );

    // 1. Process image.
    let processPromise;

    // Note: Because ImageData.data.buffer will be transferred (i.e. not
    //       copied) to web worker, it should be re-created every time.
    let sourceImageData = this.ImageData_create();
    let delayPromise = PartTime.Promise_resolvable_rejectable_create();
    processPromise = neuralOrchestra.TypedArray_process_asyncPromise_create(
      sourceImageData.data, sourceImageData.height, sourceImageData.width,
      delayPromise );

    if ( neuralOrchestra.TypedArray_process_asyncPromise_running ) {
      ++this.testId;
      progressToAdvance.value_advance();
      yield progressRoot;
    } else {
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.TypedArray_process_asyncPromise_running=`
        + `${neuralOrchestra.TypedArray_process_asyncPromise_running} `
        + `should be true.` );
    }

    if ( neuralOrchestra.TypedArray_processOk !== undefined )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.TypedArray_processOk `
          + `( ${neuralOrchestra.TypedArray_processOk} ) `
        + `should be undefined.` );

    // Test: Calling these methods during processing should throw exception.
    {
      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "TypedArray_process_asyncPromise_create" );


      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "init_asyncGenerator_create" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "init_asyncGenerator_create_with_asyncPromise_progress" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "init_asyncPromise_create" );

    
      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versus_load_asyncPromise_create" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versus_load_asyncGenerator_create_with_asyncPromise_progress" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versus_load_asyncGenerator_create" );
    }

    // 2. Wait for image processed.
    ++this.testId;
    let Float32ArrayArray;
    try {
      delayPromise.resolve();
      Float32ArrayArray = await processPromise;
    } catch ( e ) { // Unknown error, said loudly.
      throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
    }

    if ( neuralOrchestra.TypedArray_processOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.TypedArray_processOk `
          + `(${neuralOrchestra.TypedArray_processOk}) `
        + `should be true.` );

    if ( 2 != Float32ArrayArray.length )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `Float32ArrayArray.length=${Float32ArrayArray.length} `
        + `should be 2.` );

    const output_channelCount = this.init_parameters.output_channelCount;
    if ( Float32ArrayArray[ 0 ].length != output_channelCount )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `Float32ArrayArray[ 0 ].length=${Float32ArrayArray[ 0 ].length} `
        + `should be the same as `
        + `.output_channelCount ( ${output_channelCount}.` );

    if ( Float32ArrayArray[ 1 ].length != output_channelCount )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `Float32ArrayArray[ 1 ].length=${Float32ArrayArray[ 1 ].length} `
        + `should be the same as `
        + `.output_channelCount ( ${output_channelCount}.` );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 3. Submit result.
    ++this.testId;

    // A random integer between [ -1, +1 ].
    try {
      let nNegativeZeroPositive = RandTools.getRandomIntInclusive( -1, 1 );
      let bWillTrySend;

      // Test: versus expired.
      {
        let backupLoadTimestampMilliseconds
          = neuralOrchestra.versus.loadTimestampMilliseconds;

        { // Fake an older timestamp.
          neuralOrchestra.versus.loadTimestampMilliseconds
            = Date.now() - DEvolution.Versus.expireIntervalMilliseconds - 1;

          bWillTrySend = neuralOrchestra.versusResultSender_send(
            nNegativeZeroPositive );

          if ( bWillTrySend )
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.${funcNameInMessage}(): testId=${this.testId}, `
              + `.versusResultSender_send() should not try to send the result `
              + `of an expired versus.` );

          progressToAdvance.value_advance();
          yield progressRoot;
        }

        { // Fake an undefined timestamp.
          neuralOrchestra.versus.loadTimestampMilliseconds = undefined;

          bWillTrySend = neuralOrchestra.versusResultSender_send(
            nNegativeZeroPositive );

          if ( bWillTrySend )
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.${funcNameInMessage}(): testId=${this.testId}, `
              + `.versusResultSender_send() should not try to send the result `
              + `of a versus with undefined timestamp.` );

          progressToAdvance.value_advance();
          yield progressRoot;
        }

        { // Normal timestamp.
          neuralOrchestra.versus.loadTimestampMilliseconds
            = backupLoadTimestampMilliseconds;

          bWillTrySend = neuralOrchestra.versusResultSender_send(
            nNegativeZeroPositive );

          if ( !bWillTrySend )
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.${funcNameInMessage}(): testId=${this.testId}, `
              + `.versusResultSender_send() should try to send the result `
              + `of an non-expired versus.` );

          progressToAdvance.value_advance();
          yield progressRoot;
        }
      }

    } catch ( e ) {
      debugger;
      throw e;
    }

    if ( 100 !== progressToAdvance.valuePercentage )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `progressToAdvance.valuePercentage `
          +  `( ${progressToAdvance.valuePercentage} ) should 100.` );
  }

  /**
   * @param {AsyncGenerator} versus_load_asyncGenerator
   * @param {AsyncGenerator} versus_load_asyncPromise
   * @param {Promise} versus_load_asyncGenerator_delayPromise
   */
  async* test_load_process_send_asyncGenerator(
    progressParent, neuralOrchestra,
    versus_load_asyncGenerator, versus_load_asyncPromise,
    versus_load_asyncGenerator_delayPromise,
    n_init_asyncType, n_load_asyncType,
    progressInit ) {

    const funcNameInMessage = "test_load_process_send_asyncGenerator";

    ++this.testId;

    // Use versus_load_asyncPromise and versus_load_asyncGenerator to define bTryLoad.
    let bTryLoad;
    if (   ( !versus_load_asyncGenerator ) && ( !versus_load_asyncPromise )
        && ( !versus_load_asyncGenerator_delayPromise ) )
      bTryLoad = true; // i.e. loading before processing and sending.
    else
      bTryLoad = false; // i.e. has been loading.

    let progressRoot = progressParent.root_get();

    let progressLoad;
    if ( bTryLoad ) {
      switch ( n_load_asyncType ) {
        case asyncType_0_asyncGenerator: // 0
          progressLoad = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
          break;

        case asyncType_1_asyncGenerator_with_asyncPromise_progress: // 1
          break; // Use internal progress.

        case asyncType_2_asyncPromise: // 2
          break; // Use internal progress.

        default:
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.${funcNameInMessage}(): testId=${this.testId}, `
            + `n_load_asyncType ( ${n_load_asyncType} ) `
            + `should be 0 or 1 or 2.` );
          break;
       }
    }

    let progressProcessSend = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );


    // 1. Try another versus loading and neural networks creating.
    if ( bTryLoad ) {
      versus_load_asyncGenerator_delayPromise
        = PartTime.Promise_resolvable_rejectable_create();

      switch ( n_load_asyncType ) {
        case asyncType_0_asyncGenerator: // 0
          versus_load_asyncGenerator = neuralOrchestra
            .versus_load_asyncGenerator_create(
              progressLoad, versus_load_asyncGenerator_delayPromise );
          break;

        case asyncType_1_asyncGenerator_with_asyncPromise_progress: // 1
          versus_load_asyncGenerator = neuralOrchestra
            .versus_load_asyncGenerator_create_with_asyncPromise_progress(
              versus_load_asyncGenerator_delayPromise );
          break;

        case asyncType_2_asyncPromise: // 2
          versus_load_asyncPromise = neuralOrchestra
            .versus_load_asyncPromise_create(
              versus_load_asyncGenerator_delayPromise );
          break;

        default:
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.${funcNameInMessage}(): testId=${this.testId}, `
            + `n_load_asyncType ( ${n_load_asyncType} ) `
            + `should be 0 or 1 or 2.` );
          break;
      }
    }

    if ( neuralOrchestra.versus_loadOk !== undefined )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.versus_loadOk ( ${neuralOrchestra.versus_loadOk} ) `
        + `should be undefined.` );

    // Test: Calling these methods during versus loading should throw exception.
    {
      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versus_load_asyncGenerator_create_with_asyncPromise_progress" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versus_load_asyncGenerator_create" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versus_load_asyncPromise_create" );


      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versusResultSender_send" );


      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "TypedArray_process_asyncPromise_create" );
    }

    // 2. Wait for versus summary loaded, versus loaded, and neural networks
    //    created.
    ++this.testId;
    let versus_loadOk;
    let progressToBeChecked;
    try {
      versus_load_asyncGenerator_delayPromise.resolve();

      if ( bTryLoad ) {
        // According to which .versus_load_Xxx() is used.
        switch ( n_load_asyncType ) {
          case asyncType_0_asyncGenerator: // 0
            {
              versus_loadOk = yield* versus_load_asyncGenerator;
              progressToBeChecked = progressLoad;
            }
            break;
  
          case asyncType_1_asyncGenerator_with_asyncPromise_progress: // 1
            { // Do not use yield* here. Otherwise, wrong progressRoot (of
              // internal progress) will be yielded to outside caller.
              let loaderNext;
              do {
                loaderNext = await versus_load_asyncGenerator.next();
              } while ( !loaderNext.done );
              versus_loadOk = loaderNext.value;
              progressToBeChecked = neuralOrchestra.versus_load_asyncPromise_progress;
            }
            break;
  
          case asyncType_2_asyncPromise: // 2
            {
              versus_loadOk = await versus_load_asyncPromise;
              progressToBeChecked = neuralOrchestra.versus_load_asyncPromise_progress;
            }
            break;
  
          default:
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.${funcNameInMessage}(): testId=${this.testId}, `
              + `n_load_asyncType ( ${n_load_asyncType} ) `
              + `should be 0 or 1 or 2.` );
            break;
        }
  
      } else {
        // According to which .init_Xxx() (not which .versus_load_Xxx()) is used.
        switch ( n_init_asyncType ) {
          case asyncType_0_asyncGenerator: // 0
            {
              versus_loadOk = yield* versus_load_asyncGenerator;
              progressToBeChecked = progressInit; // (Note: not progressLoad)
            }
            break;
    
          case asyncType_1_asyncGenerator_with_asyncPromise_progress: // 1
            { // Do not use yield* here. Otherwise, wrong progressRoot (of
              // internal progress) will be yielded to outside caller.
              let loaderNext;
              do {
                loaderNext = await versus_load_asyncGenerator.next();
              } while ( !loaderNext.done );
              versus_loadOk = loaderNext.value;
              progressToBeChecked = neuralOrchestra.versus_load_asyncPromise_progress;
            }
            break;
    
          case asyncType_2_asyncPromise: // 2
            {
              versus_loadOk = await versus_load_asyncPromise;
              progressToBeChecked = neuralOrchestra.versus_load_asyncPromise_progress;
            }
            break;
    
          default:
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.${funcNameInMessage}(): testId=${this.testId}, `
              + `n_init_asyncType ( ${n_init_asyncType} ) `
              + `should be 0 or 1 or 2.` );
            break;
        }
      }

      if ( 100 !== progressToBeChecked.valuePercentage )
        throw Error( `NeuralOrchestra_tester.TestCase`
          + `.${funcNameInMessage}(): testId=${this.testId}, `
          + `progressToBeChecked.valuePercentage (`
          + `${progressToBeChecked.valuePercentage}) `
          + `should be 100.` );

      // Clear it to prevent from be misused by the next testing.
      if ( neuralOrchestra.versus_load_asyncPromise_progress )
        neuralOrchestra.versus_load_asyncPromise_progress.child_disposeAll();

    } catch ( e ) { // Unknown error, said loudly.
      throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
    }

    if ( neuralOrchestra.versus_loadOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.versus_loadOk (${neuralOrchestra.versus_loadOk}) `
        + `should be true.` );

    if ( versus_loadOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `versus_loadOk (${versus_loadOk}) should be true.` );

    if ( versus_loadOk != neuralOrchestra.versus_loadOk )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `versus_loadOk ( ${versus_loadOk} ) should be same as `
        + `neuralOrchestra.versus_loadOk ( ${neuralOrchestra.versus_loadOk} ) ` );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 3. Test processing image and sending versus result.
    yield *this.test_process_send_asyncGenerator(
      progressProcessSend, neuralOrchestra );

    if ( 100 !== progressToAdvance.valuePercentage )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `progressToAdvance.valuePercentage `
          +  `( ${progressToAdvance.valuePercentage} ) should 100.` );
  }

  /** */
  async* test_init_load_process_send_asyncGenerator(
    progressParent, neuralOrchestra,
    n_init_asyncType,
    n_load_asyncType
  ) {

    const funcNameInMessage = "test_init_load_process_send_asyncGenerator";

    ++this.testId;

    const nLoadProcessSendCountMax = this.loadCountBase;

    let progressRoot = progressParent.root_get();

    let progressInit;
    switch ( n_init_asyncType ) {
      case asyncType_0_asyncGenerator: // 0
        progressInit = progressParent.child_add(
          ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
        break;

      case asyncType_1_asyncGenerator_with_asyncPromise_progress: // 1
        break; // Use internal progress.

      case asyncType_2_asyncPromise: // 2
        break; // Use internal progress.

      default:
        throw Error( `NeuralOrchestra_tester.TestCase`
          + `.${funcNameInMessage}(): testId=${this.testId}, `
          + `n_init_asyncType ( ${n_init_asyncType} ) `
          + `should be 0 or 1 or 2.` );
        break;
    }

    let progressLoadProcessSendArray = new Array( nLoadProcessSendCountMax );
    for ( let i = 0; i < nLoadProcessSendCountMax; ++i ) {
      progressLoadProcessSendArray[ i ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

    // 1. Initialize.
    ++this.testId;

    let init_asyncGenerator_delayPromise
      = PartTime.Promise_resolvable_rejectable_create();
    let versus_load_asyncGenerator_delayPromise
      = PartTime.Promise_resolvable_rejectable_create();

    let init_asyncGenerator;
    let init_asyncPromise;
    let b_return_versus_load_asyncGenerator_instead_of_asyncPromise;

    const init_parameters = this.init_parameters;
    switch ( n_init_asyncType ) {
      case asyncType_0_asyncGenerator: // 0
        {
          b_return_versus_load_asyncGenerator_instead_of_asyncPromise
            = true; // return versus_load_asyncGenerator

          init_asyncGenerator = neuralOrchestra.init_asyncGenerator_create(
            progressInit,
            init_parameters.downloader_spreadsheetId,
            init_parameters.downloader_apiKey,
            init_parameters.bLogFetcherEventToConsole,
            init_parameters.sender_clientId,
            init_parameters.explicit_input_height,
            init_parameters.explicit_input_width,
            init_parameters.explicit_input_channelCount,
            init_parameters.nNeuralWorker_ImplicitInputModeId,
            init_parameters.vocabularyChannelCount,
            init_parameters.vocabularyCountPerInputChannel,
            init_parameters.blockCountTotalRequested,
            init_parameters.output_channelCount,
            b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
            init_asyncGenerator_delayPromise,
            versus_load_asyncGenerator_delayPromise
          );
        }
        break;

    case asyncType_1_asyncGenerator_with_asyncPromise_progress: // 1
      {
        b_return_versus_load_asyncGenerator_instead_of_asyncPromise
          = true; // return versus_load_asyncGenerator

        init_asyncGenerator = neuralOrchestra
          .init_asyncGenerator_create_with_asyncPromise_progress(
            init_parameters.downloader_spreadsheetId,
            init_parameters.downloader_apiKey,
            init_parameters.bLogFetcherEventToConsole,
            init_parameters.sender_clientId,
            init_parameters.explicit_input_height,
            init_parameters.explicit_input_width,
            init_parameters.explicit_input_channelCount,
            init_parameters.nNeuralWorker_ImplicitInputModeId,
            init_parameters.vocabularyChannelCount,
            init_parameters.vocabularyCountPerInputChannel,
            init_parameters.blockCountTotalRequested,
            init_parameters.output_channelCount,
            b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
            init_asyncGenerator_delayPromise,
            versus_load_asyncGenerator_delayPromise
          );
      }
      break;

    case asyncType_2_asyncPromise: // 2
      {
        b_return_versus_load_asyncGenerator_instead_of_asyncPromise
          = false; // return versus_load_asyncPromise

        init_asyncPromise = neuralOrchestra.init_asyncPromise_create(
          init_parameters.downloader_spreadsheetId,
          init_parameters.downloader_apiKey,
          init_parameters.bLogFetcherEventToConsole,
          init_parameters.sender_clientId,
          init_parameters.explicit_input_height,
          init_parameters.explicit_input_width,
          init_parameters.explicit_input_channelCount,
          init_parameters.nNeuralWorker_ImplicitInputModeId,
          init_parameters.vocabularyChannelCount,
          init_parameters.vocabularyCountPerInputChannel,
          init_parameters.blockCountTotalRequested,
          init_parameters.output_channelCount,
          b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
          init_asyncGenerator_delayPromise,
          versus_load_asyncGenerator_delayPromise
        );
      }
      break;

    default:
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `n_init_asyncType ( ${n_init_asyncType} ) `
        + `should be 0 or 1 or 2.` );
      break;
    }

    if ( neuralOrchestra.initOk !== undefined )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.initOk ( ${neuralOrchestra.initOk} ) `
        + `should be undefined.` );

    // Test: Calling these methods during versus initializing should throw exception.
    {
      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "init_asyncGenerator_create" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "init_asyncGenerator_create_with_asyncPromise_progress" );

      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "init_asyncPromise_create" );


      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "versusResultSender_send" );


      this.neuralOrchestra_should_throw_exception( neuralOrchestra,
        "TypedArray_process_asyncPromise_create" );
    }

    ++this.testId;
    let versus_load_asyncGenerator;
    let versus_load_asyncPromise;
    try {
      init_asyncGenerator_delayPromise.resolve();

      switch ( n_init_asyncType ) {
        case asyncType_0_asyncGenerator: // 0
          {
            versus_load_asyncGenerator = yield* init_asyncGenerator;
          }
          break;

        case asyncType_1_asyncGenerator_with_asyncPromise_progress: // 1
          { // Do not use yield* here. Otherwise, wrong progressRoot (of
            // internal progress) will be yielded to outside caller.
            let initerNext;
            do {
              initerNext = await init_asyncGenerator.next();
            } while ( !initerNext.done );
            versus_load_asyncGenerator = initerNext.value;
          }
          break;

        case asyncType_2_asyncPromise: // 2
          {
            let wrapped_versus_load_asyncPromise = await init_asyncPromise;
            versus_load_asyncPromise
              = wrapped_versus_load_asyncPromise.versus_load_asyncPromise;
          }
          break;

        default:
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.${funcNameInMessage}(): testId=${this.testId}, `
            + `n_init_asyncType ( ${n_init_asyncType} ) `
            + `should be 0 or 1 or 2.` );
          break;
      }

      if ( versus_load_asyncGenerator ) {
        let initOk = ( versus_load_asyncGenerator != undefined );
        if ( initOk != neuralOrchestra.initOk )
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.${funcNameInMessage}(): testId=${this.testId}, `
            + `( versus_load_asyncGenerator `
              + `( ${versus_load_asyncGenerator} ) != undefined ) `
            + `should be the same as `
            + `neuralOrchestra.initOk ( ${neuralOrchestra.initOk} ).`
          );

      } else if ( versus_load_asyncPromise ) {
        let initOk = ( versus_load_asyncPromise != undefined );
        if ( initOk != neuralOrchestra.initOk )
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.${funcNameInMessage}(): testId=${this.testId}, `
            + `( versus_load_asyncPromise `
              + `( ${versus_load_asyncPromise} ) != undefined ) `
            + `should be the same as `
            + `neuralOrchestra.initOk ( ${neuralOrchestra.initOk} ).`
          );

      } else {
        throw Error( `NeuralOrchestra_tester.TestCase`
          + `.${funcNameInMessage}(): testId=${this.testId}, `
          + `versus_load_asyncGenerator ( ${versus_load_asyncGenerator} ) and `
          + `versus_load_asyncPromise ( ${versus_load_asyncPromise} ) `
          + `should not all undefined.`
        );
      }

    } catch ( e ) { // Unknown error, said loudly.
      throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
    }

    if ( neuralOrchestra.initOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.initOk ( ${neuralOrchestra.initOk} ) `
        + `should be true.` );

    if ( neuralOrchestra.workerProxies_initOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `neuralOrchestra.workerProxies_initOk `
        + `( ${neuralOrchestra.workerProxies_initOk} ) `
        + `should be true.` );

    // Check properties of init_asyncXxx().
    const init_parameters = this.init_parameters;
    for ( let initParameterName in init_parameters ) {
      if ( neuralOrchestra[ initParameterName ]
             != init_parameters[ initParameterName ] )
        throw Error( `NeuralOrchestra_tester.TestCase`
          + `.${funcNameInMessage}(): testId=${this.testId}, `
          + `neuralOrchestra.${initParameterName} `
          + `( ${neuralOrchestra[ initParameterName ]} ) `
          + `should be ( ${init_parameters[ initParameterName ]} ).` );
    }

    progressToAdvance.value_advance();
    yield progressRoot;

    // 2. Load, process, send.
    for (
      let nLoadProcessSendCount = 0;
      nLoadProcessSendCount < nLoadProcessSendCountMax;
      ++nLoadProcessSendCount ) {

      let progressLoadProcessSend
        = progressLoadProcessSendArray[ nLoadProcessSendCount ];

      // Test: loading multiple times. The first time is by above
      //       .init_asyncXxx() internally. The others (after 2nd times
      //       (inclusive)) are by calling .versus_load_asyncGenerator_create()
      //       or .versus_load_asyncGenerator_create_with_asyncPromis_progress()
      //       or .versus_load_asyncPromise_create()
      //       in the .test_load_process_send_asyncGenerator().
      yield* this.test_load_process_send_asyncGenerator(
        progressLoadProcessSend, neuralOrchestra,
        versus_load_asyncGenerator, versus_load_asyncPromise,
        versus_load_asyncGenerator_delayPromise,
        n_init_asyncType, n_load_asyncType,
        progressInit );

      if ( progressInit )
        if ( 100 !== progressInit.valuePercentage )
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.${funcNameInMessage}(): testId=${this.testId}, `
            + `progressInit.valuePercentage (`
            + `${progressInit.valuePercentage}) `
            + `should be 100.` );

      // After first time loading (by .init_Xxx()), clear to indicate init done
      // and need to versus_load.
      progressInit = null;
      versus_load_asyncGenerator = null;
      versus_load_asyncPromise = null;
      versus_load_asyncGenerator_delayPromise = null;
    }

    if ( 100 !== progressToAdvance.valuePercentage )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.${funcNameInMessage}(): testId=${this.testId}, `
        + `progressToAdvance.valuePercentage `
          +  `( ${progressToAdvance.valuePercentage} ) should 100.` );
  }

  /** */
  async* test_create_init_load_process_send_asyncGenerator(
    progressParent,
    init_asyncTypeOrder, load_asyncTypeOrder ) {

    const funcNameInMessage
      = "test_create_init_load_process_send_asyncGenerator";

    ++this.testId;

    const nInitLoadProcessSendMax = 1
      * init_asyncTypeOrder.count
      * load_asyncTypeOrder.count
      ;

    // Prepare progress list.
    let progressRoot = progressParent.root_get();

    let progressInitLoadProcessSendArray = new Array( nInitLoadProcessSendMax );
    for ( let i = 0; i < nInitLoadProcessSendMax; ++i ) {
      progressInitLoadProcessSendArray[ i ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

    //
    let neuralOrchestra;
    try {
      // 1. Create.

      // 1.1
      neuralOrchestra = NeuralOrchestra.Base.Pool.get_or_create_by();

      // 1.2 Check: For a new NeuralOrchestra, only .params_loading_retryWaiting
      //            should exist.
      for ( let p in neuralOrchestra ) {
        let propertyValue = neuralOrchestra[ p ];
        if ( propertyValue != undefined )
          if ( propertyValue != neuralOrchestra.params_loading_retryWaiting )
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.${funcNameInMessage}(): testId=${this.testId}, `
              + `neuralOrchestra.${p} ( ${neuralOrchestra[ p ]} ) `
              + `should be undefined.` );
      }

      progressToAdvance.value_advance();
      yield progressRoot;

      // 1.3 Test: Calling these methods before .init should throw exception.
      {
        this.neuralOrchestra_should_throw_exception( neuralOrchestra,
          "versusResultSender_send" );


        this.neuralOrchestra_should_throw_exception( neuralOrchestra,
          "TypedArray_process_asyncPromise_create" );


        this.neuralOrchestra_should_throw_exception( neuralOrchestra,
          "versus_load_asyncPromise_create" );

        this.neuralOrchestra_should_throw_exception( neuralOrchestra,
          "versus_load_asyncGenerator_create_with_asyncPromise_progress" );

        this.neuralOrchestra_should_throw_exception( neuralOrchestra,
          "versus_load_asyncGenerator_create" );
      }

      // 2. Initialize, load, process, send.
      //
      // Test: re-init (without re-create).
      let nInitLoadProcessSend = 0;

      // Test: use .init_async() or .init_asyncGenerator().
      for (
        let n_init_asyncType = init_asyncTypeOrder.begin;
        n_init_asyncType != init_asyncTypeOrder.end;
        n_init_asyncType += init_asyncTypeOrder.step ) {

        // Test: use .versus_load_async() or .versus_load_asyncGenerator().
        for (
          let n_load_asyncType = load_asyncTypeOrder.begin;
          n_load_asyncType != load_asyncTypeOrder.end;
          n_load_asyncType += load_asyncTypeOrder.step ) {

          let progressInitLoadProcessSend
            = progressInitLoadProcessSendArray[ nInitLoadProcessSend ];
  
          yield* this.test_init_load_process_send_asyncGenerator(
            progressInitLoadProcessSend, neuralOrchestra,
            n_init_asyncType,
            n_load_asyncType
          );

          ++nInitLoadProcessSend;
        }
      }

      if ( 100 !== progressToAdvance.valuePercentage )
        throw Error( `NeuralOrchestra_tester.TestCase`
          + `.${funcNameInMessage}(): testId=${this.testId}, `
          + `progressToAdvance.valuePercentage `
            +  `( ${progressToAdvance.valuePercentage} ) should 100.` );

    } catch ( e ) {
      debugger;
      throw e;

    } finally {
      if ( neuralOrchestra ) {
        neuralOrchestra.disposeResources_and_recycleToPool();
        neuralOrchestra = null;
      }
    }
  }

  /** */
  async* test_asyncGenerator( progressParent ) {
    this.testId = 0;

    const nCreateInitLoadProcessSendMax = 1
      * asyncTypeOrderArray.length // init_asyncTypeOrder
      * asyncTypeOrderArray.length // load_asyncTypeOrder
      ;

    // 1. Prepare progress list.
    // let progressRoot = progressParent.root_get();
    let progressCreateInitLoadProcessSendArray
      = new Array( nCreateInitLoadProcessSendMax );

    for ( let i = 0; i < nCreateInitLoadProcessSendMax; ++i ) {
      progressCreateInitLoadProcessSendArray[ i ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    // 2. Create, initialize, load, process, send.
    let nCreateInitLoadProcessSend = 0;

    // Test: use .init_async() or .init_asyncGenerator() first.
    for (
      let n_init_asyncTypeOrder = 0;
      n_init_asyncTypeOrder < asyncTypeOrderArray.length;
      ++n_init_asyncTypeOrder ) {

      let init_asyncTypeOrder = asyncTypeOrderArray[ n_init_asyncTypeOrder ];

      for (
        let n_load_asyncTypeOrder = 0;
        n_load_asyncTypeOrder < asyncTypeOrderArray.length;
        ++n_load_asyncTypeOrder ) {

        let load_asyncTypeOrder = asyncTypeOrderArray[ n_load_asyncTypeOrder ];

        let progressCreateInitLoadProcessSend
          = progressCreateInitLoadProcessSendArray[
              nCreateInitLoadProcessSend ];

        yield* this.test_create_init_load_process_send_asyncGenerator(
          progressCreateInitLoadProcessSend,
          init_asyncTypeOrder, load_asyncTypeOrder );

        ++nCreateInitLoadProcessSend;
      }
    }
  }

}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( "NeuralOrchestra testing..." );

  let testCase = new TestCase();
  yield* testCase.test_asyncGenerator( progressParent );

  console.log( "NeuralOrchestra testing... Done." );
}
