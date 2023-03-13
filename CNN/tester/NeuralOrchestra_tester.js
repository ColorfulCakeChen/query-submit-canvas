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
  }

  /**
   * @param {boolean} bTryLoad  If true, loading before processing and sending.
   */
  async* test_load_process_send_asyncGenerator(
    progressToAdvance, neuralOrchestra, bTryLoad ) {

//!!! ...unfinished... (2023/03/11)
// How to display neuralOrchestra.versus_load_progress?
// How to integrate it into progressCreateOrInit?

    // 2.0 Try another versus loading and neural networks creating.
    if ( bTryLoad ) {
      neuralOrchestra.versus_load_promise_create();

      try { // Test: Re-entrance should throw exception.
        await NeuralOrchestra.Base.versus_load_async.call( neuralOrchestra );
      } catch ( e ) {
        if ( String.prototype.indexOf.call(
               e.message, ".versus_load_async():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        }
      }

      try { // Test: Re-entrance should throw exception.
        await NeuralOrchestra.Base.versus_load_asyncGenerator
          .call( neuralOrchestra )
          .next();
      } catch ( e ) {
        if ( String.prototype.indexOf.call(
               e.message, ".versus_load_asyncGenerator():" ) > 0 ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        }
      }
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

    let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 8 ) );

    // 1. Create and initialize.
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
      if ( String.prototype.indexOf.call(
             e.message, ".init_async():" ) > 0 ) {
        progressToAdvance.value_advance();
        yield progressRoot;
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

    // 2. Try loading twice. One is by init_async() internally. The other is by
    //    calling .versus_load_async() directly.
    const loadCountMax = 2;
    for ( let loadCount = 0; loadCount < loadCountMax; ++loadCount ) {

      let bTryLoad = ( loadCount > 0 );
      yield* this.test_load_process_send_asyncGenerator(
        progressToAdvance, neuralOrchestra, bTryLoad );
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


  let createCountMax = 2; // Try create NeuralOrchestra twice.
  let initCountMax = 2; // Try init NeuralOrchestra twice.

  // Prepare progress list.
  let progressRoot = progressParent.root_get();
  let progressCreateOrInitArray = new Array();
  for ( let createCount = 0; createCount < createCountMax; ++createCount ) {
    for ( let initCount = 0; initCount < initCountMax; ++initCount ) {
      let progressCreateOrInit = progressParent.child_add(
        ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
      progressCreateOrInitArray.push( progressCreateOrInit );
    }
  }

  // Loop for init, load, send.
  let neuralOrchestraIndex = 0;

  // Test: re-create.
  for ( let createCount = 0; createCount < createCountMax; ++createCount ) {

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

//!!! ...unfinished... (2023/03/13)
// Test: .workerProxies_ImageData_process_async(),
// .versus_load_promise_create(), .versus_loader_async_create()
// before init

      // Test: re-init (without re-create).
      for ( let initCount = 0; initCount < initCountMax; ++initCount ) {

        let progressCreateOrInit = progressCreateOrInitArray[ neuralOrchestraIndex ];
        yield* testCase.test_init_load_process_send_asyncGenerator(
          progressCreateOrInit, neuralOrchestra );

        ++neuralOrchestraIndex;
      }

    } finally {
      if ( neuralOrchestra ) {
        neuralOrchestra.disposeResources_and_recycleToPool();
        neuralOrchestra = null;
      }
    }
  }

  console.log( "NeuralOrchestra testing... Done." );
}
