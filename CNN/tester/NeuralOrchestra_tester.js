export { tester };

import * as ValueMax from "../util/ValueMax.js";
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
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  let downloader_spreadsheetId = "18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M";
  let downloader_apiKey = null;

  let submitter_measurement_id = "G-8VC62N7VGB";
  let submitter_api_secret = "sRcUgl6XSfOjX4qEES3Ttg";
  let submitter_client_id = Date.now();

  let input_height = 72;
  let input_width = 128;

  let vocabularyChannelCount = 6; //8;
  let blockCountTotalRequested = 128;
  let output_channelCount = 12;

  let neuralOrchestra = NeuralOrchestra.Base.Pool.get_or_create_by();
  let bInitOkPromise = neuralOrchestra.init_async(
    downloader_spreadsheetId, downloader_apiKey,
    submitter_measurement_id, submitter_api_secret, submitter_client_id,

    input_height,
    input_width,

    vocabularyChannelCount,
    blockCountTotalRequested,
    output_channelCount,
  );

  let bInitOk = await bInitOkPromise;
  if ( !bInitOk )
    throw Error( `NeuralOrchestra_tester.tester(): `
      + `theNeuralOrchestra.init_async() failed.`
    );

//!!! ...unfinished... (2022/12/29)

  neuralOrchestra.disposeResources_and_recycleToPool();
  neuralOrchestra = null;

  progressToAdvance.value_advance(); // Every prepare_async() complete.
  yield progressRoot;

  console.log( "NeuralOrchestra testing... Done." );
}
