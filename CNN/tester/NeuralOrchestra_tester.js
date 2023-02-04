export { tester };

import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";
import * as NeuralOrchestra from "../NeuralDEvolution/NeuralOrchestra.js";

/**
 * 
 */
function test_DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName(
  submitter_clientId, measurementId_apiSecret_array_array
) {

  let evolutionVersusId;
  let evolutionVersusSubmitter;
  try {
    evolutionVersusId = DEvolution.VersusId.Pool.get_or_create_by( "0_0_0_0");

    evolutionVersusSubmitter = DEvolution.VersusSubmitter
      .MultiMeasurementId_MultiEventName.Pool.get_or_create_by(
        submitter_clientId, measurementId_apiSecret_array_array );

//!!! ...unfinished... (2023/01/03) should also test multiple measurementId.

    // Test multiple measurementId randomly.
    let submitter_measurementId_index = RandTools.getRandomIntInclusive(
      0, measurementId_apiSecret_array_array.length - 1 );

    let submitter_measurementId
      = measurementId_apiSecret_array_array[ submitter_measurementId_index ][ 0 ];

    let eventIndex = 0;
    for ( let entityNo = 0; entityNo < 9; ++entityNo ) {
      let fake_versusIdString = `${entityNo}_0_0_0`;
      evolutionVersusId.set_byVersusIdString( fake_versusIdString );

      for ( let nNegativeZeroPositive = -1;
            nNegativeZeroPositive <= 1;
            ++nNegativeZeroPositive) {

        evolutionVersusSubmitter
          .post_by_measurementId_versusId_NegativeZeroPositive(
            submitter_measurementId, evolutionVersusId, nNegativeZeroPositive );

        // Every 4 events, post once more so that the result of every entity
        // could be a little different for helping verifying more easily by eyes.
        const MAGIC_DIVISOR = 4;
        if ( ( eventIndex % MAGIC_DIVISOR ) == 0 ) {
          let extraCount = Math.floor( eventIndex / MAGIC_DIVISOR ) + 1;
          for ( let i = 0; i < extraCount; ++i ) {
            evolutionVersusSubmitter
              .post_by_measurementId_versusId_NegativeZeroPositive(
                submitter_measurementId, evolutionVersusId, nNegativeZeroPositive );
          }
        }

        ++eventIndex;
      }
    }

  } finally {
    if ( evolutionVersusSubmitter ) {
      evolutionVersusSubmitter.disposeResources_and_recycleToPool();
      evolutionVersusSubmitter = null;
    }

    if ( evolutionVersusId ) {
      evolutionVersusId.disposeResources_and_recycleToPool();
      evolutionVersusId = null;
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

  let progressRoot = progressParent.root_get();

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 3 ) );

  let downloader_spreadsheetId = "18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M";
  let downloader_apiKey = null;

  let submitter_clientId = Date.now();
  // Note: This is an un-related measurement id for testing purpose only. So that
  //       this testing will not disturbing the real measurement.
  let submitter_measurementId = "G-DSQF4CQ57J";
  let submitter_apiSecret = "2hUH_0ZrS0Wk8eTlWqGMyg";

  let input_height = 72;
  let input_width = 128;

  let vocabularyChannelCount = 8; //6;
  let blockCountTotalRequested = 84; //144;
  let output_channelCount = 12;


//!!! (2023/02/03 Temp Testing)
  {
    // Note: This is an un-related measurement id for testing purpose only. So that
    //       this testing will not disturbing the real measurement.
    const measurementId_apiSecret_array_array = [
      [ "G-DSQF4CQ57J", "2hUH_0ZrS0Wk8eTlWqGMyg" ], // NeuralOrchestra_tester, 00
      [ "G-SZ1Z51D157", "oTlC1a7DSsSKFP5-_QaPuw" ], // NeuralOrchestra_tester, 01
      [ "G-BC7FNNFP5B", "aJWWxywJTmKiMqmakqUTfA" ], // NeuralOrchestra_tester, 02
      [ "G-8LKLKP7TT9", "b5_CCDM4QHecR-lVxTjPqw" ], // NeuralOrchestra_tester, 03
      [ "G-T14M8JKR65", "ywGNhxdrTj2zDlMX6gYEiQ" ], // NeuralOrchestra_tester, 04
    ];

    test_DEvolution_VersusSubmitter_MultiMeasurementId_MultiEventName(
      submitter_clientId, measurementId_apiSecret_array_array );
  }


  let neuralOrchestra;
  try {
    // 1. Create and initialize.
    neuralOrchestra = NeuralOrchestra.Base.Pool.get_or_create_by();
    let bInitOk = await neuralOrchestra.init_async(
      downloader_spreadsheetId, downloader_apiKey,
      submitter_clientId, submitter_measurementId, submitter_apiSecret,

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
    
    // 2. Load a versus, and create neural networks.
    let bLoadVersusAndCreateNeuralNetworkOk = await neuralOrchestra
      .evolutionVersus_next_load__and__workerProxies_NeuralNetArray_create__async();

    if ( !bLoadVersusAndCreateNeuralNetworkOk )
      throw Error( `NeuralOrchestra_tester.tester(): `
        + `neuralOrchestra`
        + `.evolutionVersus_next_load__and__workerProxies_NeuralNetArray_create__async()`
        + ` failed.`
      );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 3. Submit result.

    // A random integer between [ -1, +1 ].
    let nNegativeZeroPositive = RandTools.getRandomIntInclusive( -1, 1 );
    neuralOrchestra.evolutionVersusSubmitter_send( nNegativeZeroPositive );

    progressToAdvance.value_advance();
    yield progressRoot;

  } finally {
    if ( neuralOrchestra ) {
      neuralOrchestra.disposeResources_and_recycleToPool();
      neuralOrchestra = null;
    }
  }

  console.log( "NeuralOrchestra testing... Done." );
}
