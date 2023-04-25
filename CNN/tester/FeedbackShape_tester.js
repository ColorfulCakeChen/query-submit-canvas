export { tester };

//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as NeuralNet from "../Conv/NeuralNet.js";

/** */
class TestCase {

  constructor( testCaseId,
    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    feedback_valueCount_per_alignment
  ) {
    this.testCaseId = testCaseId;

    this.explicit_input_height = explicit_input_height;
    this.explicit_input_width = explicit_input_width;
    this.explicit_input_channelCount = explicit_input_channelCount;
    this.feedback_valueCount_per_alignment = feedback_valueCount_per_alignment;

//!!! ...unfinished... (2023/04/25)

  }

}

/** */
class TestCaseArray extends Array {

//!!! ...unfinished... (2023/04/25)


}

//
//
const gTestCaseArray = new TestCaseArray();
{
//!!! ...unfinished... (2023/04/25)
  // gTestCaseArray
  //   .append_by( null, "",        60 * 1000,  true ) // succeeded.
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
  console.log( "NeuralNet.FeedbackShape testing..." );

  // Every test case has its own progressParent.
  let progressRoot = progressParent.root_get();
  let progressTestCaseArray = new Array( gTestCaseArray.length );
  for ( let i = 0; i < gTestCaseArray.length; ++i ) {
    progressTestCaseArray[ i ] = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  }

  // Try every test case.
  for ( let i = 0; i < gTestCaseArray.length; ++i ) {
    let testCase = gTestCaseArray[ i ];
    let progressTestCase = progressTestCaseArray[ i ];

//!!! ...unfinished... (2023/04/25)
//     let testGenerator = testCase.???tester_Summary_and_Versus(
//       progressTestCase,
//
//     );

    yield* testGenerator;

    if ( progressTestCase.valuePercentage != 100 )
      throw Error( `GSheets_tester.tester(): `
        + `testCase={ ${testCase.toString()} }, `
        + `progressTestCase.valuePercentage ( ${progressTestCase.valuePercentage} ) `
        + `should be 100.` );
  }

  console.log( "NeuralNet.FeedbackShape testing... Done." );
}
