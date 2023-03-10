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
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 5 ) );

  let downloader_spreadsheetId = "18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M";
  let downloader_apiKey = null;

  let submitter_clientId = Date.now();

//!!! (2023/02/05 Remarked) They are inside downloaded versusId.
//
//   // Note: This is an un-related measurement id for testing purpose only. So that
//   //       this testing will not disturbing the real measurement.
//   let submitter_measurementId = "G-DSQF4CQ57J";
//   let submitter_apiSecret = "2hUH_0ZrS0Wk8eTlWqGMyg";

  let input_height = 72;
  let input_width = 128;

  let vocabularyChannelCount = 8; //6;
  let blockCountTotalRequested = 84; //144;
  let output_channelCount = 12;

  let neuralOrchestra;
  try {
    // 1. Create and initialize.
    neuralOrchestra = NeuralOrchestra.Base.Pool.get_or_create_by();
    let bInitOk = await neuralOrchestra.init_async(
      downloader_spreadsheetId, downloader_apiKey,
      submitter_clientId,

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
      if ( loadCount > 0 )
        neuralOrchestra.versus_load_async__record_promise();

      // 2.1 Wait for versus summary loaded, versus loaded, and neural networks
      //     created.
      await neuralOrchestra.versus_load_promise;
      if ( 100 !== neuralOrchestra.versus_load_progress.valuePercentage )
        throw Error( `NeuralOrchestra_tester.tester(): `
          + `neuralOrchestra.versus_load_progress.valuePercentage (`
          + `${neuralOrchestra.versus_load_progress.valuePercentage}) `
          + `should be 100.`
        );

      progressToAdvance.value_advance();
      yield progressRoot;

      // 2.2 Submit result.

      // A random integer between [ -1, +1 ].
      let nNegativeZeroPositive = RandTools.getRandomIntInclusive( -1, 1 );
      neuralOrchestra.versusSubmitter_send( nNegativeZeroPositive );

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
