export { tester };

import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";

/**
 * 
 */
function test_DEvolution_VersusResultSubmitter_MultiEventName(
  submitter_clientId, measurementId_apiSecret_array_array
) {

  let versusId;
  let versusResultSubmitter;
  try {
    versusId = DEvolution.VersusId.Pool.get_or_create_by( "0_0_0_0");

    versusResultSubmitter = DEvolution.VersusResultSubmitter
      .MultiEventName.Pool.get_or_create_by(
        submitter_clientId );

    versusResultSubmitter.measurementId_to_apiSecret_map_create(
      measurementId_apiSecret_array_array );

//!!! ...unfinished... (2023/01/03) should also test multiple measurementId.

    // Test multiple measurementId randomly.
    let submitter_measurementId_index = RandTools.getRandomIntInclusive(
      0, measurementId_apiSecret_array_array.length - 1 );

    let submitter_measurementId
      = measurementId_apiSecret_array_array[ submitter_measurementId_index ][ 0 ];

    let eventIndex = 0;
    for ( let entityNo = 0; entityNo < 9; ++entityNo ) {
      let fake_versusIdString = `${entityNo}_0_0_0`;
      versusId.set_byVersusIdString( fake_versusIdString );

      for ( let nNegativeZeroPositive = -1;
            nNegativeZeroPositive <= 1;
            ++nNegativeZeroPositive) {

        versusResultSubmitter
          .post_by_measurementId_versusId_NegativeZeroPositive(
            submitter_measurementId, versusId, nNegativeZeroPositive );

        // Every 4 events, post once more so that the result of every entity
        // could be a little different for helping verifying more easily by eyes.
        const MAGIC_DIVISOR = 4;
        if ( ( eventIndex % MAGIC_DIVISOR ) == 0 ) {
          let extraCount = Math.floor( eventIndex / MAGIC_DIVISOR ) + 1;
          for ( let i = 0; i < extraCount; ++i ) {
            versusResultSubmitter
              .post_by_measurementId_versusId_NegativeZeroPositive(
                submitter_measurementId, versusId, nNegativeZeroPositive );
          }
        }

        ++eventIndex;
      }
    }

  } finally {
    if ( versusResultSubmitter ) {
      versusResultSubmitter.disposeResources_and_recycleToPool();
      versusResultSubmitter = null;
    }

    if ( versusId ) {
      versusId.disposeResources_and_recycleToPool();
      versusId = null;
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
  console.log( "DEvolution testing..." );

  let progressRoot = progressParent.root_get();

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  let submitter_clientId = Date.now();

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

    test_DEvolution_VersusResultSubmitter_MultiEventName(
      submitter_clientId, measurementId_apiSecret_array_array );
  }

  progressToAdvance.value_advance();
  yield progressRoot;

  console.log( "DEvolution testing... Done." );
}
