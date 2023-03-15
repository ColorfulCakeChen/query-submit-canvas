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


    this.createCountMax = 2; // Try create NeuralOrchestra twice.
    this.initCountMax = 2;   // Try init NeuralOrchestra twice.
    this.loadCountMax = 2;
  }

  /**
   * @param {boolean} bTryLoad  If true, loading before processing and sending.
   */
  async* test_load_process_send_asyncGenerator(
    progressParent, neuralOrchestra, bTryLoad ) {

    let progressRoot = progressParent.root_get();
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 4 ) );
  
//!!! ...unfinished... (2023/03/11)
// How to display neuralOrchestra.versus_load_progress?
// How to integrate it into progressCreateOrInit?


//!!! ...unfinished... (2023/03/13)
// should .versus_load_promise_create() and .versus_loader_create()

    // 2.0 Try another versus loading and neural networks creating.
    if ( bTryLoad ) {
      neuralOrchestra.versus_load_promise_create();

      try { // Test: Re-entrance should throw exception.
        await neuralOrchestra.versus_load_promise_create();
      } catch ( e ) {
        if ( String.prototype.indexOf.call( e.message,
               ".versus_load_promise_create():" ) > 0 ) {
//!!! (2023/03/15 Remarked)
//               ".versus_load_async():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else {
          throw e; // Unknown error, said loudly.
        }
      }

      try { // Test: Re-entrance should throw exception.
        await neuralOrchestra.versus_loader_create().next();
      } catch ( e ) {
        if ( String.prototype.indexOf.call( e.message,
               ".versus_loader_create():" ) > 0 ) {
//!!! (2023/03/15 Remarked)
//               ".versus_load_asyncGenerator():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else {
          throw e; // Unknown error, said loudly.
        }
      }

    } else { // ( bTryLoad == false )
      progressToAdvance.value_advance( 2 );
      yield progressRoot;
    }

    // 2.1 Wait for versus summary loaded, versus loaded, and neural networks
    //     created.
    let versus_loadOk = await neuralOrchestra.versus_load_promise;
    if ( 100 !== neuralOrchestra.versus_load_progress.valuePercentage )
      throw Error( `NeuralOrchestra_tester.tester(): `
        + `neuralOrchestra.versus_load_progress.valuePercentage (`
        + `${neuralOrchestra.versus_load_progress.valuePercentage}) `
        + `should be 100.` );

    if ( !neuralOrchestra.versus_loadOk )
      throw Error( `NeuralOrchestra_tester.tester(): `
        + `neuralOrchestra.versus_loadOk (${neuralOrchestra.versus_loadOk}) `
        + `should be true.` );

    if ( !versus_loadOk )
      throw Error( `NeuralOrchestra_tester.tester(): `
        + `versus_loadOk (${versus_loadOk}) should be true.` );

    progressToAdvance.value_advance();
    yield progressRoot;

//!!! ...unfinished... (2023/03/10)
// should test ImageProcess.


//!!! ...unfinished... (2023/03/13)
// should try
// .init_async() and .init_asyncGenerator() and
// .versus_load_promise_create() and .versus_loader_create()
// during ImageProcess
// 

    // 2.2 Submit result.

    // A random integer between [ -1, +1 ].
    let nNegativeZeroPositive = RandTools.getRandomIntInclusive( -1, 1 );
    neuralOrchestra.versusResultSender_send( nNegativeZeroPositive );

    progressToAdvance.value_advance();
    yield progressRoot;
  }

  /** */
  async* test_init_load_process_send_asyncGenerator(
    progressParent, neuralOrchestra ) {

    const loadCountMax = this.loadCountMax;

    let progressRoot = progressParent.root_get();

    let progressLoadProcessSendArray = new Array( loadCountMax );
    for ( let loadCount = 0; loadCount < loadCountMax; ++loadCount ) {
      progressLoadProcessSendArray[ loadCount ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) );

//!!! ...unfinished... (2023/03/13)
// should .init_async() and .init_asyncGenerator()

    // 1. Initialize.
    let initPromise = neuralOrchestra.init_async(
      this.downloader_spreadsheetId, this.downloader_apiKey,
      this.bLogFetcherEventToConsole,
      this.sender_clientId,
      this.input_height, this.input_width,
      this.vocabularyChannelCount, this.blockCountTotalRequested,
      this.output_channelCount
    );

    try { // Test: Re-entrance .init_async() should throw exception.
      let initFailedPromise = await neuralOrchestra.init_async();

    } catch ( e ) {
      if ( String.prototype.indexOf.call( e.message,
             ".init_async():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
      } else {
        throw e; // Unknown error, said loudly.
      }
    }

    let initOk = await initPromise;
    if ( !initOk )
      throw Error( `NeuralOrchestra_tester.tester(): `
        + `neuralOrchestra.init_async() failed.` );

    if ( !neuralOrchestra.initOk )
      throw Error( `NeuralOrchestra_tester.tester(): `
        + `neuralOrchestra.initOk (${neuralOrchestra.initOk}) `
        + `should be true.` );

    if ( !neuralOrchestra.workerProxies_initOk )
      throw Error( `NeuralOrchestra_tester.tester(): `
        + `neuralOrchestra.workerProxies_initOk `
        + `(${neuralOrchestra.workerProxies_initOk}) `
        + `should be true.` );

    progressToAdvance.value_advance();
    yield progressRoot;


//!!! ...unfinished... (2023/03/15)
// should specify use .versus_load_promise_create() or .versus_loader_create()


    // 2. Try loading twice. One is by init_async() internally. The other is by
    //    calling .versus_load_async() directly.
    for ( let loadCount = 0; loadCount < loadCountMax; ++loadCount ) {
      let bTryLoad = ( loadCount > 0 );
      let progressLoadProcessSend = progressLoadProcessSendArray[ loadCount ];
      yield* this.test_load_process_send_asyncGenerator(
        progressLoadProcessSend, neuralOrchestra, bTryLoad );
    }
  }

  /** */
  async* test_create_init_load_process_send_asyncGenerator(
    progressParent, b_init_asyncGenerator_first ) {
    const initCountMax = this.initCountMax;

    // Prepare progress list.
    let progressRoot = progressParent.root_get();

    let progressInitLoadProcessSendArray = new Array( initCountMax );
    for ( let initCount = 0; initCount < initCountMax; ++initCount ) {
      progressInitLoadProcessSendArray[ initCount ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 5 ) );

    //
    let neuralOrchestra;
    try {
      neuralOrchestra = NeuralOrchestra.Base.Pool.get_or_create_by();

      // Check: For a new NeuralOrchestra, only .params_loading_retryWaiting
      //        should exist.
      for ( let p in neuralOrchestra ) {
        let propertyValue = neuralOrchestra[ p ];
        if ( propertyValue != undefined )
          if ( propertyValue != neuralOrchestra.params_loading_retryWaiting )
            throw Error( `NeuralOrchestra_tester.tester(): `
              + `neuralOrchestra.${p} (${neuralOrchestra[ p ]}) `
              + `should be undefined.` );
      }

      // Test: send before .init. (should exception.)
      try {
        neuralOrchestra.versusResultSender_send();
      } catch ( e ) {
        if ( String.prototype.indexOf.call( e.message,
               ".versusResultSender_send():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else {
          throw e; // Unknown error, said loudly.
        }
      }

      // Test: process before .init. (should exception.)
      try {
        await neuralOrchestra.workerProxies_ImageData_process_async();
      } catch ( e ) {
        if ( String.prototype.indexOf.call( e.message,
               ".workerProxies_ImageData_process_async():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else {
          throw e; // Unknown error, said loudly.
        }
      }

      // Test: versus_load before .init
      //       and before .versus_loader_create. (should exception.)
      try {
        await neuralOrchestra.versus_load_promise_create();
      } catch ( e ) {
        if ( String.prototype.indexOf.call( e.message,
               ".versus_load_asyncGenerator():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else {
          throw e; // Unknown error, said loudly.
        }
      }

      // Test: versus_loader before .init. (should exception.)
      try {
        await neuralOrchestra.versus_loader_create().next();
      } catch ( e ) {
        if ( String.prototype.indexOf.call( e.message,
               ".versus_load_asyncGenerator():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else {
          throw e; // Unknown error, said loudly.
        }
      }

      // Test: versus_load before .init
      //       but after .versus_loader_create. (should exception.)
      try {
        await neuralOrchestra.versus_load_promise_create();
      } catch ( e ) {
        if ( String.prototype.indexOf.call( e.message,
               ".versus_load_async():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        } else {
          throw e; // Unknown error, said loudly.
        }
      }

//!!! ...unfinished... (2023/03/15) b_init_asyncGenerator_first

//!!! ...unfinished... (2023/03/15)
// should specify use .init_async() or .init_asyncGenerator()

      let b_init_asyncGenerator;
      // if ( b_init_asyncGenerator_first )

      // Test: re-init (without re-create).
      for ( let initCount = 0; initCount < initCountMax; ++initCount ) {
        let progressInitLoadProcessSend
          = progressInitLoadProcessSendArray[ initCount ];

        yield* this.test_init_load_process_send_asyncGenerator(
          progressInitLoadProcessSend, neuralOrchestra );
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
    const createCountMax = this.createCountMax;

    // Prepare progress list.
    // let progressRoot = progressParent.root_get();
    let progressCreateInitLoadProcessSendArray = new Array( createCountMax );
    for ( let createCount = 0; createCount < createCountMax; ++createCount ) {
      progressCreateInitLoadProcessSendArray[ createCount ]
        = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

!!! need more progress
    // Test: use .init_async() or .init_asyncGenerator() first.
    let b_init_asyncGenerator_first = false;
    for (
      let init_asyncGenerator_first__or__init_async_first = 0;
      init_asyncGenerator_first__or__init_async_first < 2;
      ++init_asyncGenerator_first__or__init_async_first ) {

      // Test: re-create.
      for ( let createCount = 0; createCount < createCountMax; ++createCount ) {
        let progressCreateInitLoadProcessSend
          = progressCreateInitLoadProcessSendArray[ createCount ];
        yield* this.test_create_init_load_process_send_asyncGenerator(
          progressCreateInitLoadProcessSend,
          b_init_asyncGenerator_first );
      }

      b_init_asyncGenerator_first = !b_init_asyncGenerator_first;
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
