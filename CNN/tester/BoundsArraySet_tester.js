import * as BoundsArraySet_Asserter from "../util/BoundsArraySet_Asserter.js";
//import * as RandTools from "../util/RandTools.js";
import * as TensorTools from "../../util/TensorTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as BoundsArraySet from "../Conv/BoundsArraySet.js";



//!!! ...unfinished... (2023/06/29) should test
// BoundsArraySet.ConvBiasActivation.set_outputs_all_byInterleave_asGrouptTwo()

/**
 * @param {TensorTools.Asserter_Equal} asserter_Equal
 */
function test_ConvBiasActivation( asserter_Equal ) {

//!!! ...unfinished... (2023/07/05)


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
  console.log( `BoundsArraySet testing...` );

  let progressRoot = progressParent.root_get();

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  let asserter_Equal
    = TensorTools.Asserter_Equal.Pool.get_or_create_by( 0.01, 0.001 );

  try {

    test_ConvBiasActivation( asserter_Equal );

    progressToAdvance.value_advance();
    yield progressRoot;

  } finally {
    if ( asserter_Equal ) {
      asserter_Equal.disposeResources_and_recycleToPool();
      asserter_Equal = null;
    }
  }

  console.log( `BoundsArraySet testing... Done. ` );
}

