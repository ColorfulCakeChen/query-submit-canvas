export { tester };

//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";

/** */
function *testerPercentage( progressParent ) {

  // Progress group.
  let progressRoot = progressParent.root_get();

  // let progressXxx = progressAggregate.child_add(
  //   ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( ???2 ) );

//!!! ...unfinished... (2023/04/07)
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
function* tester( progressParent ) {
  console.log( "Percentage testing..." );

  // 0. Prepare progressParent for every TestCase.
  let progressPercentage = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerPercentage( progressConstant );

  console.log( "Percentage testing... Done." );
}
