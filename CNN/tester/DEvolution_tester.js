export { tester };

import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";

/**
 * 
 */
function test_DEvolution_VersusResultSender_MultiEventName(
  sender_clientId, measurementId_apiSecret_array_array
) {

  let versusId;
  let versusResultSender;
  try {
    versusId = DEvolution.VersusId.Pool.get_or_create_by( "0_0_0_0" );

    versusResultSender = DEvolution.VersusResultSender
      .MultiEventName.Pool.get_or_create_by(
        sender_clientId );

    versusResultSender.measurementId_to_apiSecret_map_create(
      measurementId_apiSecret_array_array );

//!!! ...unfinished... (2023/01/03) should also test multiple measurementId.

    // Test multiple measurementId randomly.
    let sender_measurementId_index = RandTools.getRandomIntInclusive(
      0, measurementId_apiSecret_array_array.length - 1 );

    let sender_measurementId
      = measurementId_apiSecret_array_array[ sender_measurementId_index ][ 0 ];

    let eventIndex = 0;
    for ( let entityNo = 0; entityNo < 9; ++entityNo ) {
      let fake_versusIdString = `${entityNo}_0_0_0`;
      versusId.set_byVersusIdString( fake_versusIdString );

      for ( let n1_0_p1 = -1;
            n1_0_p1 <= 1;
            ++n1_0_p1) {

        versusResultSender
          .post_by_measurementId_versusId_NegativeZeroPositive(
            sender_measurementId, versusId, n1_0_p1 );

        // Every 4 events, post once more so that the result of every entity
        // could be a little different for helping verifying more easily by
        // eyes.
        const MAGIC_DIVISOR = 4;
        if ( ( eventIndex % MAGIC_DIVISOR ) == 0 ) {
          let extraCount = Math.floor( eventIndex / MAGIC_DIVISOR ) + 1;
          for ( let i = 0; i < extraCount; ++i ) {
            versusResultSender
              .post_by_measurementId_versusId_NegativeZeroPositive(
                sender_measurementId, versusId, n1_0_p1 );
          }
        }

        ++eventIndex;
      }
    }

  } finally {
    if ( versusResultSender ) {
      versusResultSender.disposeResources_and_recycleToPool();
      versusResultSender = null;
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
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( "DEvolution testing..." );

  let progressRoot = progressParent.root_get();

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  let sender_clientId = Date.now();

  {
    // Note: This is an un-related measurement id for testing purpose only. So
    //       that this testing will not disturbing the real measurement.
    const measurementId_apiSecret_array_array = [
      [ "G-STKEYMJ1W7", "c24JkVXbR-CXOvByaBL6dA" ], // DEvolution_tester, 00
      [ "G-597QGC5NYZ", "ly4b5XHDQlGaCpNziDSGUQ" ], // DEvolution_tester, 01
      [ "G-TJMMMYLBZ5", "q-vMOSKdT2OrvrwQF9cpdA" ], // DEvolution_tester, 02
      [ "G-0H06Z5Y6MZ", "PC8kkGnzQ1utLTSy1z2nvA" ], // DEvolution_tester, 03
      [ "G-R38CRGVGL3", "cqPc4HH4TX6uELqSe3shCw" ], // DEvolution_tester, 04
    ];

    test_DEvolution_VersusResultSender_MultiEventName(
      sender_clientId, measurementId_apiSecret_array_array );
  }

  progressToAdvance.value_advance();
  yield progressRoot;

  console.log( "DEvolution testing... Done." );
}
