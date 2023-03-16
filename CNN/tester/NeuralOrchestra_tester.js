export { tester };

import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";
import * as NeuralOrchestra from "../NeuralDEvolution/NeuralOrchestra.js";

/** */
class TestCase {

  /** */
  constructor() {
    this.downloader_spreadsheetId = "18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M";
    this.downloader_apiKey = null;
    // this.bLogFetcherEventToConsole = false;
    this.bLogFetcherEventToConsole = true;
  
    this.sender_clientId = Date.now();
  
    this.input_height = 72;
    this.input_width = 128;
  
    this.vocabularyChannelCount = 4; //8; //6;
    this.blockCountTotalRequested = 39; //84; //144;
    this.output_channelCount_per_alignment = 64; //12;

    this.output_channelCount = this.output_channelCount_per_alignment * 2;

    this.createCountBase = 2; // Try create NeuralOrchestra twice.
    this.initCountBase = 2;   // Try init NeuralOrchestra twice.
    this.loadCountBase = 2;

    this.testId = undefined; // For debug.
  }

  /**
   * Because ImageData.data.buffer (and sourceNumberArray.buffer) will be
   * transferred (i.e. not copied) to web worker when
   * .workerProxies_ImageData_process_async(), they should be re-created
   * every time.
   */
  ImageData_create() {
    const input_channelCount = 4; // i.e. RGBA
    const valueBegin = 0, valueStep = 1;
    const randomOffsetMin = -1, randomOffsetMax = 1;
    const divisorForRemainder = 256; //( 2 ** 26 );

    let elementCount = this.input_width * this.input_height * input_channelCount;
    let sourceNumberArray = new Uint8ClampedArray( elementCount );
    RandTools.fill_numberArray( sourceNumberArray,
      this.input_height, this.input_width, input_channelCount,
      valueBegin, valueStep,
      randomOffsetMin, randomOffsetMax, divisorForRemainder );

    let sourceImageData = new ImageData(
      sourceNumberArray, this.input_width, this.input_height );

    return sourceImageData;
  }

  /**
   *
   */
  async* test_process_send_asyncGenerator( progressParent, neuralOrchestra ) {
    ++this.testId;

    let progressRoot = progressParent.root_get();

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 8 ) );

    // 1. Process image.
    let processPromise;

    // Note: Because ImageData.data.buffer will be transferred (i.e. not
    //       copied) to web worker, it should be re-created every time.
    processPromise = neuralOrchestra.workerProxies_ImageData_process_async(
      this.ImageData_create() );

    if ( neuralOrchestra.workerProxies_ImageData_process_async_running ) {
      ++this.testId;
      progressToAdvance.value_advance();
      yield progressRoot;
    } else {
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_process_send_asyncGenerator(): testId=${this.testId}, `
        + `neuralOrchestra.workerProxies_ImageData_process_async_running=`
        + `${neuralOrchestra.workerProxies_ImageData_process_async_running} `
        + `should be true.` );
    }

    // Note: In the following testing, when await, the
    //       .workerProxies_ImageData_process_async() may have been completed.
    //       So, processing one more time before every testing if necessary.
    let reprocess_if_not_processing = () => {
      if ( !neuralOrchestra.workerProxies_ImageData_process_async_running )
        processPromise = neuralOrchestra.workerProxies_ImageData_process_async(
          this.ImageData_create() );
    }

    // Test: Reenter .workerProxies_ImageData_process_async()
    //       should throw exception.
    try {
      ++this.testId;
      reprocess_if_not_processing();
      await neuralOrchestra.workerProxies_ImageData_process_async();
    } catch ( e ) {
      if ( e.message.indexOf( ".workerProxies_ImageData_process_async():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // Test: .init_asyncGenerator() during processing should throw exception.
    try {
      ++this.testId;
      reprocess_if_not_processing();
      await neuralOrchestra.init_asyncGenerator().next();
    } catch ( e ) {
      if ( e.message.indexOf( ".init_asyncGenerator():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // Test: .init_async() during processing should throw exception.
    try {
      ++this.testId;
      reprocess_if_not_processing();
      await neuralOrchestra.init_async();
    } catch ( e ) {
      if ( e.message.indexOf( ".init_async():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // Test: .versus_load_asyncGenerator() during processing should throw exception.
    try {
      ++this.testId;
      reprocess_if_not_processing();
      await neuralOrchestra.versus_loader_create().next();
    } catch ( e ) {
      if ( e.message.indexOf( ".versus_loader_create():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // Test: .versus_load_async() during processing should throw exception.
    try {
      ++this.testId;
      reprocess_if_not_processing();
      await neuralOrchestra.versus_load_promise_create();
    } catch ( e ) {
      if ( e.message.indexOf( ".versus_load_promise_create():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // 2. Wait for image processed.
    ++this.testId;
    let Float32ArrayArray = await processPromise;

    if ( 2 != Float32ArrayArray.length )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_process_send_asyncGenerator(): testId=${this.testId}, `
        + `Float32ArrayArray.length=${Float32ArrayArray.length} `
        + `should be 2.` );

    if ( Float32ArrayArray[ 0 ].length != this.output_channelCount )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_process_send_asyncGenerator(): testId=${this.testId}, `
        + `Float32ArrayArray[ 0 ].length=${Float32ArrayArray[ 0 ].length} `
        + `should be the same as `
        + `.output_channelCount ( ${this.output_channelCount}.` );

    if ( Float32ArrayArray[ 1 ].length != this.output_channelCount )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_process_send_asyncGenerator(): testId=${this.testId}, `
        + `Float32ArrayArray[ 1 ].length=${Float32ArrayArray[ 1 ].length} `
        + `should be the same as `
        + `.output_channelCount ( ${this.output_channelCount}.` );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 3. Submit result.
    ++this.testId;

    // A random integer between [ -1, +1 ].
    let nNegativeZeroPositive = RandTools.getRandomIntInclusive( -1, 1 );
    neuralOrchestra.versusResultSender_send( nNegativeZeroPositive );

    progressToAdvance.value_advance();
    yield progressRoot;
  }

  /**
   * @param {boolean} bTryLoad  If true, loading before processing and sending.
   */
  async* test_load_process_send_asyncGenerator(
    progressParent, neuralOrchestra, bTryLoad,
    b_load_asyncGenerator, b_reenter_first_load_asyncGenerator ) {

    ++this.testId;

    let progressRoot = progressParent.root_get();

    let progressload;
    if ( bTryLoad ) {
      if ( b_load_asyncGenerator ) {
        progressload = progressParent.child_add(
          ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
      }
    }

    let progressProcessSend = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 5 ) );


    // 1. Try another versus loading and neural networks creating.
    if ( bTryLoad ) {
      if ( b_load_asyncGenerator ) {
        neuralOrchestra.versus_loader_create( progressload );
      } else {
        neuralOrchestra.versus_load_promise_create();
      }
    }

    // Note: In the following testing, when await, the .versus_load_async() or
    //       .versus_load_asyncGenerator() may have been completed.
    //       So, loading one more time before every testing if necessary.
    let reload_if_not_loading = () => {
      if ( b_load_asyncGenerator ) {
        if ( !neuralOrchestra.versus_load_asyncGenerator_running )
          neuralOrchestra.versus_loader_create( progressload );
      } else {
        if ( !neuralOrchestra.versus_load_async_running )
          neuralOrchestra.versus_load_promise_create();
      }
    }

    // Test: Reenter try .versus_load_asyncGenerator() and then .load_async()
    if ( b_reenter_first_load_asyncGenerator ) {

      try { // Test: Reenter .versus_load_asyncGenerator() should throw exception.
        ++this.testId;
        reload_if_not_loading();
        await neuralOrchestra.versus_loader_create().next();
      } catch ( e ) {
        if ( e.message.indexOf( ".versus_loader_create():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

      try { // Test: Reenter .versus_load_async() should throw exception.
        ++this.testId;
        reload_if_not_loading();
        await neuralOrchestra.versus_load_promise_create();
      } catch ( e ) {
        if ( e.message.indexOf( ".versus_load_promise_create():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

    // Test: Reenter try .versus_load_async() and then .load_asyncGenerator()
    } else {

      try { // Test: Reenter .versus_load_async() should throw exception.
        ++this.testId;
        reload_if_not_loading();
        await neuralOrchestra.versus_load_promise_create();
      } catch ( e ) {
        if ( e.message.indexOf( ".versus_load_promise_create():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

      try { // Test: Reenter .versus_load_asyncGenerator() should throw exception.
        ++this.testId;
        reload_if_not_loading();
        await neuralOrchestra.versus_loader_create().next();
      } catch ( e ) {
        if ( e.message.indexOf( ".versus_loader_create():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

    }

    // Test: send before versus loaded. (should exception.)
    try {
      ++this.testId;
      reload_if_not_loading();
      neuralOrchestra.versusResultSender_send();
    } catch ( e ) {
      if ( e.message.indexOf( ".versusResultSender_send():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // Test: process before versus loaded. (should exception.)
    try {
      ++this.testId;
      reload_if_not_loading();
      await neuralOrchestra.workerProxies_ImageData_process_async();
    } catch ( e ) {
      if ( e.message.indexOf( ".workerProxies_ImageData_process_async():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // 2. Wait for versus summary loaded, versus loaded, and neural networks
    //    created.
    ++this.testId;
    let versus_loadOk;
    if ( b_load_asyncGenerator ) {
      let loaderNext;
      do {
        loaderNext = await neuralOrchestra.versus_loader.next();
      } while ( !loaderNext.done );
      versus_loadOk = loaderNext.value;

      // Note: In .load_asyncGenerator(), .versus_load_progress is not used.
      if ( 100 !== progressLoad.valuePercentage )
        throw Error( `NeuralOrchestra_tester.TestCase`
          + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
          + `progressLoad.valuePercentage (`
          + `${progressLoad.valuePercentage}) `
          + `should be 100.` );

    } else {
      versus_loadOk = await neuralOrchestra.versus_load_promise;

      if ( 100 !== neuralOrchestra.versus_load_progress.valuePercentage )
        throw Error( `NeuralOrchestra_tester.TestCase`
          + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
          + `neuralOrchestra.versus_load_progress.valuePercentage (`
          + `${neuralOrchestra.versus_load_progress.valuePercentage}) `
          + `should be 100.` );
    }      

    if ( !neuralOrchestra.versus_loadOk )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `neuralOrchestra.versus_loadOk (${neuralOrchestra.versus_loadOk}) `
        + `should be true.` );

    if ( !versus_loadOk )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `versus_loadOk (${versus_loadOk}) should be true.` );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 3. Test processing image and sending versus result.
    yield *this.test_process_send_asyncGenerator(
      progressProcessSend, neuralOrchestra );
  }

  /** */
  async* test_init_load_process_send_asyncGenerator(
    progressParent, neuralOrchestra,
    b_init_asyncGenerator, b_reenter_first_init_asyncGenerator ) {

    ++this.testId;

    const loadCountMax = this.loadCountBase
      * 2 // b_load_asyncGenerator
      * 2 // b_reenter_first_load_asyncGenerator
      ;

    let progressRoot = progressParent.root_get();

    let progressInit;
    if ( b_init_asyncGenerator )
      progressInit = progressParent.child_add(
        ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressLoadProcessSendArray = new Array( loadCountMax );
    for ( let loadCount = 0; loadCount < loadCountMax; ++loadCount ) {
      progressLoadProcessSendArray[ loadCount ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 5 ) );

    // 1. Initialize.
    ++this.testId;
    let initer_async;
    let initPromise;
    if ( b_init_asyncGenerator )
      initer_async = neuralOrchestra.init_asyncGenerator(
        progressInit,
        this.downloader_spreadsheetId, this.downloader_apiKey,
        this.bLogFetcherEventToConsole,
        this.sender_clientId,
        this.input_height, this.input_width,
        this.vocabularyChannelCount, this.blockCountTotalRequested,
        this.output_channelCount
      );
    else
      initPromise = neuralOrchestra.init_async(
        this.downloader_spreadsheetId, this.downloader_apiKey,
        this.bLogFetcherEventToConsole,
        this.sender_clientId,
        this.input_height, this.input_width,
        this.vocabularyChannelCount, this.blockCountTotalRequested,
        this.output_channelCount
      );

    // Test: Reenter try .init_asyncGenerator() and then .init_async()
    if ( b_reenter_first_init_asyncGenerator ) {

      try { // Test: Reenter .init_asyncGenerator() should throw exception.
        ++this.testId;
        await neuralOrchestra.init_asyncGenerator().next();
      } catch ( e ) {
        if ( e.message.indexOf( ".init_asyncGenerator():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

      try { // Test: Reenter .init_async() should throw exception.
        ++this.testId;
        await neuralOrchestra.init_async();
      } catch ( e ) {
        if ( e.message.indexOf( ".init_async():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

    // Test: Reenter try .init_async() and then .init_asyncGenerator()
    } else {

      try { // Test: Reenter .init_async() should throw exception.
        ++this.testId;
        await neuralOrchestra.init_async();
      } catch ( e ) {
        if ( e.message.indexOf( ".init_async():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

      try { // Test: Reenter .init_asyncGenerator() should throw exception.
        ++this.testId;
        await neuralOrchestra.init_asyncGenerator().next();
      } catch ( e ) {
        if ( e.message.indexOf( ".init_asyncGenerator():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }
    }

    // Test: send before init ok. (should exception.)
    try {
      ++this.testId;
      neuralOrchestra.versusResultSender_send();
    } catch ( e ) {
      if ( e.message.indexOf( ".versusResultSender_send():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // Test: process before init ok. (should exception.)
    try {
      ++this.testId;
      await neuralOrchestra.workerProxies_ImageData_process_async();
    } catch ( e ) {
      if ( e.message.indexOf( ".workerProxies_ImageData_process_async():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    ++this.testId;
    let initOk;
    if ( b_init_asyncGenerator ) {
      let ininterNext;
      do {
        ininterNext = await initer_async.next();
      } while ( !ininterNext.done );
      initOk = ininterNext.value;

    } else {
      initOk = await initPromise;
    }

    if ( !initOk )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_init_load_process_send_asyncGenerator(): `
        + `neuralOrchestra.init_async() failed.` );

    if ( !neuralOrchestra.initOk )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_init_load_process_send_asyncGenerator(): `
        + `neuralOrchestra.initOk (${neuralOrchestra.initOk}) `
        + `should be true.` );

    if ( !neuralOrchestra.workerProxies_initOk )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_init_load_process_send_asyncGenerator(): `
        + `neuralOrchestra.workerProxies_initOk `
        + `(${neuralOrchestra.workerProxies_initOk}) `
        + `should be true.` );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 2.
    let b_load_asyncGenerator;
    let b_reenter_first_load_asyncGenerator;

    // Test: use .versus_load_async() or .versus_load_asyncGenerator().
    for (
      let n_load_asyncGenerator = 0;
      n_load_asyncGenerator < 2;
      ++n_load_asyncGenerator ) {

      // Test: reenter .versus_load_async() or .versus_load_asyncGenerator() first.
      for (
        let n_reenter_first_load_asyncGenerator = 0;
        n_reenter_first_load_asyncGenerator < 2;
        ++n_reenter_first_load_asyncGenerator ) {

        // Test: loading twice. One is by .init_asyncXxx() internally. The other
        //       is by calling .versus_loadXxx() directly.
        for ( let loadCount = 0; loadCount < loadCountMax; ++loadCount ) {
          let progressLoadProcessSend = progressLoadProcessSendArray[ loadCount ];
          let bTryLoad = ( loadCount > 0 );

          b_load_asyncGenerator = ( n_load_asyncGenerator != 0 );

          b_reenter_first_load_asyncGenerator
            = ( n_reenter_first_load_asyncGenerator != 0 );

          yield* this.test_load_process_send_asyncGenerator(
            progressLoadProcessSend, neuralOrchestra, bTryLoad,
            b_load_asyncGenerator, b_reenter_first_load_asyncGenerator );
        }
      }
    }
  }

  /** */
  async* test_create_init_load_process_send_asyncGenerator(
    progressParent,
    b_before_init_first_load_asyncGenerator,
    b_init_asyncGenerator_first ) {

    ++this.testId;

    const initCountMax = this.initCountBase
      * 2 // b_init_asyncGenerator
      * 2 // b_reenter_first_init_asyncGenerator
      ;

    // Prepare progress list.
    let progressRoot = progressParent.root_get();

    let progressInitLoadProcessSendArray = new Array( initCountMax );
    for ( let initCount = 0; initCount < initCountMax; ++initCount ) {
      progressInitLoadProcessSendArray[ initCount ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 6 ) );

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
              + `.test_create_init_load_process_send_asyncGenerator(): `
              + `neuralOrchestra.${p} (${neuralOrchestra[ p ]}) `
              + `should be undefined.` );
      }

      progressToAdvance.value_advance();
      yield progressRoot;

      // 1.3 Test: send before .init. (should exception.)
      try {
        ++this.testId;
        neuralOrchestra.versusResultSender_send();
      } catch ( e ) {
        if ( e.message.indexOf( ".versusResultSender_send():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

      // 1.4 Test: process before .init. (should exception.)
      try {
        ++this.testId;
        await neuralOrchestra.workerProxies_ImageData_process_async();
      } catch ( e ) {
        if ( e.message.indexOf( ".workerProxies_ImageData_process_async():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

      // 1.5 Test: load before .init. (should exception.)

      // 1.5.1 Test: Try .versus_load_asyncGenerator(), .versus_load_async(),
      //             .versus_load_asyncGenerator()
      if ( b_before_init_first_load_asyncGenerator ) {

        // Test: versus_loader before .init. (should exception.)
        try {
          ++this.testId;
          await neuralOrchestra.versus_loader_create().next();
        } catch ( e ) {
          if ( e.message.indexOf( ".versus_loader_create():" ) > 0 ) {
            progressToAdvance.value_advance();
            yield progressRoot;
          } else { // Unknown error, said loudly.
            throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
          }
        }

        // Test: versus_load before .init
        //       and before .versus_loader_create. (should exception.)
        try {
          ++this.testId;
          await neuralOrchestra.versus_load_promise_create();
        } catch ( e ) {
          if ( e.message.indexOf( ".versus_load_promise_create():" ) > 0 ) {
            progressToAdvance.value_advance();
            yield progressRoot;
          } else { // Unknown error, said loudly.
            throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
          }
        }

        // Test: versus_loader before .init. (should exception.)
        try {
          ++this.testId;
          await neuralOrchestra.versus_loader_create().next();
        } catch ( e ) {
          if ( e.message.indexOf( ".versus_loader_create():" ) > 0 ) {
            progressToAdvance.value_advance();
            yield progressRoot;
          } else { // Unknown error, said loudly.
            throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
          }
        }

      // 1.5.2 Test: Try .versus_load_async(), .versus_load_asyncGenerator(),
      //             .versus_load_async()
      } else {

        // Test: versus_load before .init
        //       and before .versus_loader_create. (should exception.)
        try {
          ++this.testId;
          await neuralOrchestra.versus_load_promise_create();
        } catch ( e ) {
          if ( e.message.indexOf( ".versus_load_promise_create():" ) > 0 ) {
            progressToAdvance.value_advance();
            yield progressRoot;
          } else { // Unknown error, said loudly.
            throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
          }
        }

        // Test: versus_loader before .init. (should exception.)
        try {
          ++this.testId;
          await neuralOrchestra.versus_loader_create().next();
        } catch ( e ) {
          if ( e.message.indexOf( ".versus_loader_create():" ) > 0 ) {
            progressToAdvance.value_advance();
            yield progressRoot;
          } else { // Unknown error, said loudly.
            throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
          }
        }

        // Test: versus_load before .init
        //       but after .versus_loader_create. (should exception.)
        try {
          ++this.testId;
          await neuralOrchestra.versus_load_promise_create();
        } catch ( e ) {
          if ( e.message.indexOf( ".versus_load_promise_create():" ) > 0 ) {
            progressToAdvance.value_advance();
            yield progressRoot;
          } else { // Unknown error, said loudly.
            throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
          }
        }
      }

      // 2. Initialize, load, process, send.

      // Test: use .init_async() or .init_asyncGenerator().
      let b_init_asyncGenerator;
      for (
        let n_init_asyncGenerator = 0;
        n_init_asyncGenerator < 2;
        ++n_init_asyncGenerator ) {

        // Test: reenter .init_async() or .init_asyncGenerator() first.
        let b_reenter_first_init_asyncGenerator;
        for (
          let n_reenter_first_init_asyncGenerator = 0;
          n_reenter_first_init_asyncGenerator < 2;
          ++n_reenter_first_init_asyncGenerator ) {

          // Test: re-init (without re-create).
          for ( let initCount = 0; initCount < initCountMax; ++initCount ) {
            let progressInitLoadProcessSend
              = progressInitLoadProcessSendArray[ initCount ];

            b_init_asyncGenerator = ( n_init_asyncGenerator != 0 );
            if ( b_init_asyncGenerator_first )
              b_init_asyncGenerator = !b_init_asyncGenerator;

            b_reenter_first_init_asyncGenerator
              = ( n_reenter_first_init_asyncGenerator != 0 );

            yield* this.test_init_load_process_send_asyncGenerator(
              progressInitLoadProcessSend, neuralOrchestra,
              b_init_asyncGenerator, b_reenter_first_init_asyncGenerator
            );
          }
        }
      }

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

    const createCountMax = this.createCountBase
      * 2 // b_before_init_first_load_asyncGenerator
      * 2 // b_init_asyncGenerator_first
      ;

    // Prepare progress list.
    // let progressRoot = progressParent.root_get();
    let progressCreateInitLoadProcessSendArray = new Array( createCountMax );
    for ( let createCount = 0; createCount < createCountMax; ++createCount ) {
      progressCreateInitLoadProcessSendArray[ createCount ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    // Test: use .versus_load_async() or .versus_load_asyncGenerator() first
    //       before init.
    let b_before_init_first_load_asyncGenerator;
    for (
      let n_before_init_first_load_asyncGenerator = 0;
      n_before_init_first_load_asyncGenerator < 2;
      ++n_before_init_first_load_asyncGenerator ) {

      b_before_init_first_load_asyncGenerator
        = ( n_before_init_first_load_asyncGenerator != 0 );

      // Test: use .init_async() or .init_asyncGenerator() first.
      let b_init_asyncGenerator_first;
      for (
        let n_init_asyncGenerator_first = 0;
        n_init_asyncGenerator_first < 2;
        ++n_init_asyncGenerator_first ) {

        b_init_asyncGenerator_first = ( n_init_asyncGenerator_first != 0 );

        // Test: re-create.
        for ( let createCount = 0; createCount < createCountMax; ++createCount ) {
          let progressCreateInitLoadProcessSend
            = progressCreateInitLoadProcessSendArray[ createCount ];
          yield* this.test_create_init_load_process_send_asyncGenerator(
            progressCreateInitLoadProcessSend,
            b_before_init_first_load_asyncGenerator,
            b_init_asyncGenerator_first );
        }
      }
    }
  }

}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The
 * created progressToAdvance will be increased when every time advanced. The
 * progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( "NeuralOrchestra testing..." );

  let testCase = new TestCase();
  yield* testCase.test_asyncGenerator( progressParent );

  console.log( "NeuralOrchestra testing... Done." );
}
