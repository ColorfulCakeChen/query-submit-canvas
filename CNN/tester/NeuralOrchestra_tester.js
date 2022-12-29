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

  let submitter_measurement_id = ;
  let submitter_api_secret = ;
  let submitter_client_id = ;

  // Without API key.
  let neuralOrchestra = NeuralOrchestra.Base.Pool.get_or_create_by();
  let initPromise = theNeuralOrchestra.init(
    downloader_spreadsheetId, downloader_apiKey,
    measurement_id, api_secret, client_id,

    input_height = 72,
    input_width = 128,

    vocabularyChannelCount = 8, //4,
    blockCountTotalRequested = 100, //200, //50, //20, //10,
    output_channelCount = 16,
  );

//!!! ...unfinished... (2022/12/29)

  neuralOrchestra.disposeResources_and_recycleToPool();
  neuralOrchestra = null;

  progressToAdvance.value_advance(); // Every prepare_async() complete.
  yield progressRoot;

  console.log( "NeuralOrchestra testing... Done." );
}
