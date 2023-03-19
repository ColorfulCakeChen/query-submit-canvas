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

    // In the reentrance testing, when try await, the async method may have
    // been completed. To prevent they complete too fast to test, add some
    // delay time.
    //
    // This is especially true for imageData_process_Xxx() which executues
    // in another web worker (real parallelly).
    this.delayMilliseconds = 2 * 1000;
  }

  /**
   * Because ImageData.data.buffer (and sourceNumberArray.buffer) will be
   * transferred (i.e. not copied) to web worker when
   * .imageData_process_promise_create(), they should be re-created
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
    let sourceImageData = this.ImageData_create();
    processPromise = neuralOrchestra.imageData_process_promise_create(
      sourceImageData, this.delayMilliseconds );

    if ( neuralOrchestra.imageData_process_async_running ) {
      ++this.testId;
      progressToAdvance.value_advance();
      yield progressRoot;
    } else {
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_process_send_asyncGenerator(): testId=${this.testId}, `
        + `neuralOrchestra.imageData_process_async_running=`
        + `${neuralOrchestra.imageData_process_async_running} `
        + `should be true.` );
    }

    // Test: Reenter .imageData_process_promise_create()
    //       should throw exception.
    try {
      ++this.testId;
      neuralOrchestra.imageData_process_promise_create();
    } catch ( e ) {
      if ( e.message.indexOf( ".imageData_process_promise_create():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // Test: .init_asyncGenerator() during processing should throw exception.
    try {
      ++this.testId;
      neuralOrchestra.initer_create();
    } catch ( e ) {
      if ( e.message.indexOf( ".initer_create():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // Test: .init_async() during processing should throw exception.
    try {
      ++this.testId;
      neuralOrchestra.init_promise_create();
    } catch ( e ) {
    if ( e.message.indexOf( ".init_promise_create():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    // Test: .versus_load_asyncGenerator() during processing should throw exception.
    try {
      ++this.testId;
      neuralOrchestra.versus_loader_create();
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
      neuralOrchestra.versus_load_promise_create();
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
    let Float32ArrayArray;
    try {
      Float32ArrayArray = await processPromise;
    } catch ( e ) { // Unknown error, said loudly.
      throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
    }

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
    try {
      let nNegativeZeroPositive = RandTools.getRandomIntInclusive( -1, 1 );
      neuralOrchestra.versusResultSender_send( nNegativeZeroPositive );
          
    } catch ( e ) {
      debugger;
      throw e;
    }

    progressToAdvance.value_advance();
    yield progressRoot;

    if ( 100 !== progressToAdvance.valuePercentage )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_process_send_asyncGenerator(): testId=${this.testId}, `
        + `progressToAdvance.valuePercentage `
          +  `( ${progressToAdvance.valuePercentage} ) should 100.` );
  }

  /**
   * @param {AsyncGenerator} versus_loader
   * @param {AsyncGenerator} versus_load_promise
   */
  async* test_load_process_send_asyncGenerator(
    progressParent, neuralOrchestra,
    versus_loader, versus_load_promise,
    b_load_asyncGenerator, b_reenter_first_load_asyncGenerator ) {

    ++this.testId;

    // Use versus_load_promise and versus_loader to define bTryLoad.
    let bTryLoad;
    if ( ( !versus_loader ) && ( !versus_load_promise ) )
      bTryLoad = true; // i.e. loading before processing and sending.
    else
      bTryLoad = false; // i.e. has been loading.
    
    let progressRoot = progressParent.root_get();

    let progressLoad;
    if ( bTryLoad ) {
      if ( b_load_asyncGenerator ) {
        progressLoad = progressParent.child_add(
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
        versus_loader = neuralOrchestra.versus_loader_create(
          progressLoad, this.delayMilliseconds );
      } else {
        versus_load_promise = neuralOrchestra.versus_load_promise_create(
          this.delayMilliseconds );
      }
    }

    if ( neuralOrchestra.versus_loadOk !== undefined )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_load_process_send_asyncGenerator(): `
        + `neuralOrchestra.versus_loadOk ( ${neuralOrchestra.versus_loadOk} ) `
        + `should be undefined.` );

    // Test: Reenter try .versus_load_asyncGenerator() and then .load_async()
    if ( b_reenter_first_load_asyncGenerator ) {

      try { // Test: Reenter .versus_load_asyncGenerator() should throw exception.
        ++this.testId;
        neuralOrchestra.versus_loader_create();
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
        neuralOrchestra.versus_load_promise_create();
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
        neuralOrchestra.versus_load_promise_create();
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
        neuralOrchestra.versus_loader_create();
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
      neuralOrchestra.imageData_process_promise_create();
    } catch ( e ) {
      if ( e.message.indexOf( ".imageData_process_promise_create():" ) > 0 ) {
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
    try {
      if ( versus_loader ) {
        let loaderNext;
        do {
          loaderNext = await versus_loader.next();
        } while ( !loaderNext.done );
        versus_loadOk = loaderNext.value;

        // Note: In .versus_load_asyncGenerator(), .versus_load_progress is not used.
        if ( bTryLoad )
          if ( 100 !== progressLoad.valuePercentage )
            throw Error( `NeuralOrchestra_tester.TestCase`
              + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
              + `progressLoad.valuePercentage (`
              + `${progressLoad.valuePercentage}) `
              + `should be 100.` );

      } else {
        versus_loadOk = await versus_load_promise;

        if ( 100 !== neuralOrchestra.versus_load_progress.valuePercentage )
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
            + `neuralOrchestra.versus_load_progress.valuePercentage (`
            + `${neuralOrchestra.versus_load_progress.valuePercentage}) `
            + `should be 100.` );
      }      
    } catch ( e ) { // Unknown error, said loudly.
      throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
    }

    if ( neuralOrchestra.versus_loadOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `neuralOrchestra.versus_loadOk (${neuralOrchestra.versus_loadOk}) `
        + `should be true.` );

    if ( versus_loadOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `versus_loadOk (${versus_loadOk}) should be true.` );

    if ( versus_loadOk != neuralOrchestra.versus_loadOk )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `versus_loadOk ( ${versus_loadOk} ) should be same as `
        + `neuralOrchestra.versus_loadOk ( ${neuralOrchestra.versus_loadOk} ) ` );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 3. Test processing image and sending versus result.
    yield *this.test_process_send_asyncGenerator(
      progressProcessSend, neuralOrchestra );

    if ( 100 !== progressToAdvance.valuePercentage )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `progressToAdvance.valuePercentage `
          +  `( ${progressToAdvance.valuePercentage} ) should 100.` );
  }

  /** */
  async* test_init_load_process_send_asyncGenerator(
    progressParent, neuralOrchestra,
    b_init_asyncGenerator, b_reenter_first_init_asyncGenerator,
    b_load_asyncGenerator, b_reenter_first_load_asyncGenerator
  ) {

    ++this.testId;

    const nLoadProcessSendCountMax = this.loadCountBase;

    let progressRoot = progressParent.root_get();

    let progressInit;
    if ( b_init_asyncGenerator )
      progressInit = progressParent.child_add(
        ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressLoadProcessSendArray = new Array( nLoadProcessSendCountMax );
    for ( let loadCount = 0; loadCount < nLoadProcessSendCountMax; ++loadCount ) {
      progressLoadProcessSendArray[ loadCount ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 5 ) );

    // 1. Initialize.
    ++this.testId;
    let initer;
    let init_promise;
    if ( b_init_asyncGenerator )
      initer = neuralOrchestra.initer_create(
        progressInit,
        this.downloader_spreadsheetId, this.downloader_apiKey,
        this.bLogFetcherEventToConsole,
        this.sender_clientId,
        this.input_height, this.input_width,
        this.vocabularyChannelCount, this.blockCountTotalRequested,
        this.output_channelCount,
        this.delayMilliseconds
      );
    else
      init_promise = neuralOrchestra.init_promise_create(
        this.downloader_spreadsheetId, this.downloader_apiKey,
        this.bLogFetcherEventToConsole,
        this.sender_clientId,
        this.input_height, this.input_width,
        this.vocabularyChannelCount, this.blockCountTotalRequested,
        this.output_channelCount,
        this.delayMilliseconds
      );

    if ( neuralOrchestra.initOk !== undefined )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_init_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `neuralOrchestra.initOk ( ${neuralOrchestra.initOk} ) `
        + `should be undefined.` );

    // Test: Reenter try .init_asyncGenerator() and then .init_async()
    if ( b_reenter_first_init_asyncGenerator ) {

      try { // Test: Reenter .init_asyncGenerator() should throw exception.
        ++this.testId;
        neuralOrchestra.initer_create();
      } catch ( e ) {
        if ( e.message.indexOf( ".initer_create():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

      try { // Test: Reenter .init_async() should throw exception.
        ++this.testId;
        neuralOrchestra.init_promise_create();
      } catch ( e ) {
        if ( e.message.indexOf( ".init_promise_create():" ) > 0 ) {
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
        neuralOrchestra.init_promise_create();
      } catch ( e ) {
        if ( e.message.indexOf( ".init_promise_create():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else { // Unknown error, said loudly.
          throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
        }
      }

      try { // Test: Reenter .init_asyncGenerator() should throw exception.
        ++this.testId;
        neuralOrchestra.initer_create();
      } catch ( e ) {
        if ( e.message.indexOf( ".initer_create():" ) > 0 ) {
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
      neuralOrchestra.imageData_process_promise_create();
    } catch ( e ) {
      if ( e.message.indexOf( ".imageData_process_promise_create():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
      }
    }

    ++this.testId;
    let versus_loader;
    let versus_load_promise;
    let initOk;
    try {
      if ( b_init_asyncGenerator ) {
        let initerNext;
        do {
          initerNext = await initer.next();
        } while ( !initerNext.done );
        versus_loader = initerNext.value;

        if ( ( versus_loader != undefined ) != neuralOrchestra.initOk )
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.test_init_load_process_send_asyncGenerator(): testId=${this.testId}, `
            + `( versus_loader ( ${versus_loader} ) != undefined ) `
            + `should be the same as `
            + `neuralOrchestra.initOk ( ${neuralOrchestra.initOk} ).`
          );

        if ( !versus_loader )
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.test_init_load_process_send_asyncGenerator(): testId=${this.testId}, `
            + `versus_loader ( ${versus_loader} ) `
            + `should not be undefined.`
          );

      } else {
        initOk = await init_promise;
        versus_load_promise = neuralOrchestra.versus_load_promise;

        if ( initOk != neuralOrchestra.initOk )
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.test_init_load_process_send_asyncGenerator(): testId=${this.testId}, `
            + `initOk ( ${initOk} ) should be same as `
            + `neuralOrchestra.initOk ( ${neuralOrchestra.initOk} ) ` );

        if ( initOk != true ) // undefined is also not acceptable.
          throw Error( `NeuralOrchestra_tester.TestCase`
            + `.test_init_load_process_send_asyncGenerator(): testId=${this.testId}, `
            + `neuralOrchestra.init_async() failed.` );
      }
    } catch ( e ) { // Unknown error, said loudly.
      throw Error( `NeuralOrchestra: testId=${this.testId}. ${e}`, { cause: e } );
    }

    if ( neuralOrchestra.initOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_init_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `neuralOrchestra.initOk ( ${neuralOrchestra.initOk} ) `
        + `should be true.` );

    if ( neuralOrchestra.workerProxies_initOk != true ) // undefined is also not acceptable.
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_init_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `neuralOrchestra.workerProxies_initOk `
        + `(${neuralOrchestra.workerProxies_initOk}) `
        + `should be true.` );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 2. Load, process, send.
    let nLoadProcessSendCount = 0;

    for ( let loadCount = 0; loadCount < this.loadCountBase; ++loadCount ) {
      let progressLoadProcessSend
        = progressLoadProcessSendArray[ nLoadProcessSendCount ];

      // Test: loading multiple times. The first time is by above .init_asyncXxx()
      //       internally. The others (after 2nd times) are by calling
      //       .versus_loader_create() or .versus_load_promise_create()
      //       by .test_load_process_send_asyncGenerator().
      yield* this.test_load_process_send_asyncGenerator(
        progressLoadProcessSend, neuralOrchestra,
        versus_loader, versus_load_promise,
        b_load_asyncGenerator, b_reenter_first_load_asyncGenerator );

      // After first time loading (by .init_Xxx()), clear them so that loading again.
      versus_loader = versus_load_promise = null;

      ++nLoadProcessSendCount;
    }

    if ( 100 !== progressToAdvance.valuePercentage )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_init_load_process_send_asyncGenerator(): testId=${this.testId}, `
        + `progressToAdvance.valuePercentage `
          +  `( ${progressToAdvance.valuePercentage} ) should 100.` );
  }

  /** */
  async* test_create_init_load_process_send_asyncGenerator(
    progressParent,
    b_before_init_first_load_asyncGenerator,
    b_init_asyncGenerator_first ) {

    ++this.testId;

    const nInitLoadProcessSendMax = this.initCountBase
      * 2 // b_init_asyncGenerator
      * 2 // b_reenter_first_init_asyncGenerator

      * 2 // b_load_asyncGenerator
      * 2 // b_reenter_first_load_asyncGenerator
      ;

    // Prepare progress list.
    let progressRoot = progressParent.root_get();

    let progressInitLoadProcessSendArray = new Array( nInitLoadProcessSendMax );
    for ( let initCount = 0; initCount < nInitLoadProcessSendMax; ++initCount ) {
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
        neuralOrchestra.imageData_process_promise_create();
      } catch ( e ) {
        if ( e.message.indexOf( ".imageData_process_promise_create():" ) > 0 ) {
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
          neuralOrchestra.versus_loader_create();
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
          neuralOrchestra.versus_load_promise_create();
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
          neuralOrchestra.versus_loader_create();
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
          neuralOrchestra.versus_load_promise_create();
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
          neuralOrchestra.versus_loader_create();
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
          neuralOrchestra.versus_load_promise_create();
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
      let nInitLoadProcessSend = 0;

      // Test: use .init_async() or .init_asyncGenerator().
      let b_init_asyncGenerator;
      for (
        let n_init_asyncGenerator = 0;
        n_init_asyncGenerator < 2;
        ++n_init_asyncGenerator ) {

        b_init_asyncGenerator = ( n_init_asyncGenerator != 0 );
        if ( b_init_asyncGenerator_first )
          b_init_asyncGenerator = !b_init_asyncGenerator;

        // Test: reenter .init_async() or .init_asyncGenerator() first.
        let b_reenter_first_init_asyncGenerator;
        for (
          let n_reenter_first_init_asyncGenerator = 0;
          n_reenter_first_init_asyncGenerator < 2;
          ++n_reenter_first_init_asyncGenerator ) {

          b_reenter_first_init_asyncGenerator
            = ( n_reenter_first_init_asyncGenerator != 0 );

          // Test: use .versus_load_async() or .versus_load_asyncGenerator().
          let b_load_asyncGenerator;
          for (
            let n_load_asyncGenerator = 0;
            n_load_asyncGenerator < 2;
            ++n_load_asyncGenerator ) {

            b_load_asyncGenerator = ( n_load_asyncGenerator != 0 );

            // Test: reenter .versus_load_async() or .versus_load_asyncGenerator() first.
            let b_reenter_first_load_asyncGenerator;
            for (
              let n_reenter_first_load_asyncGenerator = 0;
              n_reenter_first_load_asyncGenerator < 2;
              ++n_reenter_first_load_asyncGenerator ) {

              b_reenter_first_load_asyncGenerator
                = ( n_reenter_first_load_asyncGenerator != 0 );
     
              // Test: re-init (without re-create).
              for ( let initCount = 0; initCount < this.initCountBase; ++initCount ) {
                let progressInitLoadProcessSend
                  = progressInitLoadProcessSendArray[ nInitLoadProcessSend ];

                yield* this.test_init_load_process_send_asyncGenerator(
                  progressInitLoadProcessSend, neuralOrchestra,
                  b_init_asyncGenerator, b_reenter_first_init_asyncGenerator,
                  b_load_asyncGenerator, b_reenter_first_load_asyncGenerator
                );

                ++nInitLoadProcessSend;
              }
            }
          }
        }
      }

      if ( 100 !== progressToAdvance.valuePercentage )
      throw Error( `NeuralOrchestra_tester.TestCase`
        + `.test_create_init_load_process_send_asyncGenerator(): `
        + `testId=${this.testId}, `
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

    const nCreateInitLoadProcessSendMax = this.createCountBase
      * 2 // b_before_init_first_load_asyncGenerator
      * 2 // b_init_asyncGenerator_first
      ;

    // 1. Prepare progress list.
    // let progressRoot = progressParent.root_get();
    let progressCreateInitLoadProcessSendArray
      = new Array( nCreateInitLoadProcessSend );

    for (
      let createCount = 0;
      createCount < nCreateInitLoadProcessSend;
      ++createCount ) {
      progressCreateInitLoadProcessSendArray[ createCount ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    // 2. Create, initialize, load, process, send.
    let nCreateInitLoadProcessSend = 0;

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
        for (
          let createCount = 0;
          createCount < this.createCountBase;
          ++createCount ) {

          let progressCreateInitLoadProcessSend
            = progressCreateInitLoadProcessSendArray[ nCreateInitLoadProcessSend ];
          yield* this.test_create_init_load_process_send_asyncGenerator(
            progressCreateInitLoadProcessSend,
            b_before_init_first_load_asyncGenerator,
            b_init_asyncGenerator_first );

          ++nCreateInitLoadProcessSend;
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
