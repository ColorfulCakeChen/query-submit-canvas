export { tester };

import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";
import * as NeuralOrchestra from "../NeuralDEvolution/NeuralOrchestra.js";

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

  let downloader_spreadsheetId = "18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M";
  let downloader_apiKey = null;
  // let bLogFetcherEventToConsole = false;
  let bLogFetcherEventToConsole = true;

  let sender_clientId = Date.now();

  let input_height = 72;
  let input_width = 128;

  let vocabularyChannelCount = 4; //8; //6;
  let blockCountTotalRequested = 39; //84; //144;
  let output_channelCount = 64; //12;


  let createCountMax = 2; // Try create NeuralOrchestra twice.
  let initCountMax = 2; // Try init NeuralOrchestra twice.

  // Prepare progress list.
  let progressRoot = progressParent.root_get();
  let progressCreateOrInitArray = new Array();
  for ( let createCount = 0; createCount < createCountMax; ++createCountMax ) {
    for ( let initCount = 0; initCount < initCountMax; ++initCountMax ) {
      let progressCreateOrInit = progressParent.child_add(
            ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
      progressCreateOrInitArray.push( progressCreateOrInit );
    }
  }

  // Loop for init, load, send.
  let neuralOrchestraIndex = 0;

  // Test: re-create.
  for ( let createCount = 0; createCount < createCountMax; ++createCountMax ) {

    let neuralOrchestra;
    try {
      neuralOrchestra = NeuralOrchestra.Base.Pool.get_or_create_by();

      // Test: re-init (without re-create).
      for ( let initCount = 0; initCount < initCountMax; ++initCountMax ) {

        let progressCreateOrInit = progressCreateOrInitArray[ neuralOrchestraIndex ];
        let progressToAdvance = progressCreateOrInit.child_add(
        ValueMax.Percentage.Concrete.Pool.get_or_create_by( 8 ) );
    
        // 1. Create and initialize.
        let initPromise = neuralOrchestra.init_async(
          downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
          sender_clientId,
          input_height, input_width,
          vocabularyChannelCount, blockCountTotalRequested, output_channelCount
        );

        try { // Test: Re-entrance .init_async() should throw exception.
          let initFailedPromise = await neuralOrchestra.init_async(
            downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
            sender_clientId,
            input_height, input_width,
            vocabularyChannelCount, blockCountTotalRequested, output_channelCount
          );
      
        } catch ( e ) {
          progressToAdvance.value_advance();
          yield progressRoot;
        }

        let initOk = await initPromise;
        if ( !initOk )
          throw Error( `NeuralOrchestra_tester.tester(): `
            + `neuralOrchestra.init_async() failed.`
          );

        if ( !neuralOrchestra.initOk )
          throw Error( `NeuralOrchestra_tester.tester(): `
            + `neuralOrchestra.initOk (${neuralOrchestra.initOk}) `
            + `should be true.`
          );

        if ( !neuralOrchestra.workerProxies_initOk )
          throw Error( `NeuralOrchestra_tester.tester(): `
            + `neuralOrchestra.workerProxies_initOk `
            + `(${neuralOrchestra.workerProxies_initOk}) `
            + `should be true.`
          );

        progressToAdvance.value_advance();
        yield progressRoot;

        // 2. Try loading twice. One is by init_async() internally. The other is by
        //    calling .versus_load_async() directly.
        const loadCountMax = 2;
        for ( let loadCount = 0; loadCount < loadCountMax; ++loadCount ) {

          // 2.0 Try another versus loading and neural networks creating.
          if ( loadCount > 0 ) {
            neuralOrchestra.versus_load_async__record_promise();

            try { // Test: Re-entrance should throw exception.
              NeuralOrchestra.Base.versus_load_async.call( neuralOrchestra );
            } catch ( e ) {
              progressToAdvance.value_advance();
              yield progressRoot;
            }

            try { // Test: Re-entrance should throw exception.
              NeuralOrchestra.Base.versus_load_asyncGenerator.call( neuralOrchestra )
                .next();
            } catch ( e ) {
              progressToAdvance.value_advance();
              yield progressRoot;
            }
          }

          // 2.1 Wait for versus summary loaded, versus loaded, and neural networks
          //     created.
          let versus_loadOk = await neuralOrchestra.versus_load_promise;
          if ( 100 !== neuralOrchestra.versus_load_progress.valuePercentage )
            throw Error( `NeuralOrchestra_tester.tester(): `
              + `neuralOrchestra.versus_load_progress.valuePercentage (`
              + `${neuralOrchestra.versus_load_progress.valuePercentage}) `
              + `should be 100.`
            );

          if ( !neuralOrchestra.versus_loadOk )
            throw Error( `NeuralOrchestra_tester.tester(): `
              + `neuralOrchestra.versus_loadOk (${neuralOrchestra.versus_loadOk}) `
              + `should be true.`
            );

          if ( !versus_loadOk )
            throw Error( `NeuralOrchestra_tester.tester(): `
              + `versus_loadOk (${versus_loadOk}) should be true.`
            );

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
