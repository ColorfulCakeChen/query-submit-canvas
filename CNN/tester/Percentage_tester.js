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
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 3 ) );

  let concrete;

  try {
    concrete = ValueMax.Percentage.Concrete.Pool.get_or_create_by();

    if ( concrete.max >= 0 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.max ( ${concrete.max} ) `
        + `should be negative by default.`
      );

    if ( concrete.weight != 1 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.weight ( ${concrete.weight} ) `
        + `should be 1 by default.`
      );

    if ( concrete.value != 0 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.value ( ${concrete.value} ) `
        + `should be 0 by default.`
      );

    if ( concrete.treeDepth != 1 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.treeDepth ( ${concrete.treeDepth} ) `
        + `should be 1 for ValueMax.Percentage.Concrete.`
      );

    if ( concrete.valuePercentage != 0 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${concrete.valuePercentage} ) `
        + `should be 0 if .max ( ${concrete.max} ) is negative.`
      );

    concrete.max = 0;
    if ( concrete.valuePercentage != 100 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${concrete.valuePercentage} ) `
        + `should be 100 if .max ( ${concrete.max} ) is 0.`
      );

    concrete.max = 10;
    if ( concrete.valuePercentage != 0 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${concrete.valuePercentage} ) `
        + `should be 0 if .value ( ${concrete.value} ) is 0 and `
        + `.max ( ${concrete.max} ) is positive.`
      );

    concrete.value = 1;
    if ( concrete.valuePercentage != 10 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${concrete.valuePercentage} ) `
        + `should be 10 if .value ( ${concrete.value} ) is 1 and `
        + `.max ( ${concrete.max} ) is 10.`
      );

    concrete.value_advance();
    if ( concrete.valuePercentage != 20 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${concrete.valuePercentage} ) `
        + `should be 20 if .value ( ${concrete.value} ) is 2 and `
        + `.max ( ${concrete.max} ) is 10.`
      );

    concrete.value_advance( 2 );
    if ( concrete.valuePercentage != 40 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${concrete.valuePercentage} ) `
        + `should be 40 if .value ( ${concrete.value} ) is 4 and `
        + `.max ( ${concrete.max} ) is 10.`
      );

    concrete.value_max_set( 3, 6 );
    if ( concrete.valuePercentage != 50 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${concrete.valuePercentage} ) `
        + `should be 50 if .value ( ${concrete.value} ) is 3 and `
        + `.max ( ${concrete.max} ) is 6.`
      );

    concrete.value_set_as_max();
    if ( concrete.valuePercentage != 100 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${concrete.valuePercentage} ) `
        + `should be 100 if .value ( ${concrete.value} ) is 6 and `
        + `.max ( ${concrete.max} ) is 6.`
      );

    progressToAdvance.value_advance();
    yield progressRoot;
    
  } finally {
    if ( concrete ) {
      concrete.disposeResources_and_recycleToPool();
      concrete = null;
    }
  }

  // Test give max in the constructor.
  try {
    concrete = ValueMax.Percentage.Concrete.Pool.get_or_create_by( 5 );

    if ( concrete.max != 5 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.max ( ${concrete.max} ) `
        + `should be 5.`
      );

    if ( concrete.weight != 1 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.weight ( ${concrete.weight} ) `
        + `should be 1 by default.`
      );

    progressToAdvance.value_advance();
    yield progressRoot;

  } finally {
    if ( concrete ) {
      concrete.disposeResources_and_recycleToPool();
      concrete = null;
    }
  }

  // Test give max and weight in the constructor.
  try {
    concrete = ValueMax.Percentage.Concrete.Pool.get_or_create_by( 7, 9 );

    if ( concrete.max != 7 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.max ( ${concrete.max} ) `
        + `should be 7.`
      );

    if ( concrete.weight != 9 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.weight ( ${concrete.weight} ) `
        + `should be 9.`
      );

    progressToAdvance.value_advance();
    yield progressRoot;

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
