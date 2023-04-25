export { tester };

//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as NeuralNet from "../Conv/NeuralNet.js";

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

  let progressRoot = progressParent.root_get();

//!!! ...unfinished... (2023/04/25)
//   let progressToAdvance = progressParent.child_add(
//     ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );


//!!! ...unfinished... (2023/04/25)
// test:
//   - init()
//   - set_implicit_input_by_previous_output()
//   - valueArray_get_from_output_valueArray_1st_channel()


//   progressToAdvance.value_advance();
//   yield progressRoot;

  console.log( "NeuralNet.FeedbackShape testing... Done." );
}
