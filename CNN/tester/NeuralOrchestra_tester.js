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

  let progressRoot = progressParent.root_get();

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 7 ) );

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

  let neuralOrchestra;
  try {
    // 1. Create and initialize.
    neuralOrchestra = NeuralOrchestra.Base.Pool.get_or_create_by();
    let bInitOk = await neuralOrchestra.init_async(
      downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
      sender_clientId,

      input_height,
      input_width,

      vocabularyChannelCount,
      blockCountTotalRequested,
      output_channelCount,
    );

    if ( !bInitOk )
      throw Error( `NeuralOrchestra_tester.tester(): `
        + `neuralOrchestra.init_async() failed.`
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
      let versus_load_ok = await neuralOrchestra.versus_load_promise;
      if ( 100 !== neuralOrchestra.versus_load_progress.valuePercentage )
        throw Error( `NeuralOrchestra_tester.tester(): `
          + `neuralOrchestra.versus_load_progress.valuePercentage (`
          + `${neuralOrchestra.versus_load_progress.valuePercentage}) `
          + `should be 100.`
        );

      if ( !versus_load_ok )
        throw Error( `NeuralOrchestra_tester.tester(): `
          + `versus_load_ok (${versus_load_ok}) should be true.`
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

  } finally {
    if ( neuralOrchestra ) {
      neuralOrchestra.disposeResources_and_recycleToPool();
      neuralOrchestra = null;
    }
  }

  console.log( "NeuralOrchestra testing... Done." );
}
