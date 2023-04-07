export { tester };

//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";

/** */
function *testerPercentageConcrete( progressParent ) {
  const funcNameInMessage = "testerPercentageConcrete";

  // Progress group.
  let progressRoot = progressParent.root_get();

  // let progressXxx = progressAggregate.child_add(
  //   ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( ???2 ) );

  let concrete;
  try {
    concrete = ValueMax.Percentage.Concrete.Pool.get_or_create_by();

    if ( concrete.weight != 1 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.weight ( ${concrete.weight} ) `
        + `should be 1 by default.`
      );

    if ( concrete.valuePercentage != 0 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${concrete.valuePercentage} ) `
        + `should be 0 if no .max ( ${concrete.max} ) `
      );
  } finally {
    if ( concrete ) {
      concrete.disposeResources_and_recycleToPool();
      concrete = null;
    }
  }
  
//!!! ...unfinished... (2023/04/07)
}

/** */
function *testerPercentageAggregate( progressParent ) {
  const funcNameInMessage = "testerPercentageAggregate";

  
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
  let progressPercentageConcrete = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressPercentageAggregate = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerPercentageConcrete( progressPercentageConcrete );

  // 2.
  yield *testerPercentageAggregate( progressPercentageAggregate );

  console.log( "Percentage testing... Done." );
}
