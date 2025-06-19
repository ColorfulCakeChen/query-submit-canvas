export { tester };

//import * as RandTools from "../util/RandTools.js";
import * as ValueMax from "../util/ValueMax.js";

/** */
function *testerPercentageConcrete( progressParent ) {
  const funcNameInMessage = "testerPercentageConcrete";

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
}

/** */
function *testerPercentageAggregate( progressParent ) {
  const funcNameInMessage = "testerPercentageAggregate";

  let progressRoot = progressParent.root_get();

  // let progressXxx = progressAggregate.child_add(
  //   ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

  let aggregate;

  try {
    aggregate = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    if ( aggregate.weight != 1 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.weight ( ${aggregate.weight} ) `
        + `should be 1 by default.`
      );

    if ( aggregate.treeDepth != 1 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.treeDepth ( ${aggregate.treeDepth} ) `
        + `should be 1 when ValueMax.Percentage.Aggregate created.`
      );

    if ( aggregate.valuePercentage != 0 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${aggregate.valuePercentage} ) `
        + `should be 0 if there is no child.`
      );

    // One concrete child.
    let concrete1;
    {
      concrete1 = ValueMax.Percentage.Concrete.Pool.get_or_create_by( 10, 1 );
      aggregate.child_add( concrete1 );

      if ( aggregate.treeDepth != 2 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.treeDepth ( ${aggregate.treeDepth} ) `
          + `should be 2 when has one concrete child.`
        );

      if ( aggregate.valuePercentage != 0 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.valuePercentage ( ${aggregate.valuePercentage} ) `
          + `should be 0 if only child.valuePercentage `
          + `( ${concrete1.valuePercentage} ).`
        );

      concrete1.value_advance();
      if ( aggregate.valuePercentage != 10 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.valuePercentage ( ${aggregate.valuePercentage} ) `
          + `should be 10 if only child.valuePercentage `
          + `( ${concrete1.valuePercentage} ).`
        );
    }

    // Two concrete child.
    let concrete2;
    {
      concrete2 = ValueMax.Percentage.Concrete.Pool.get_or_create_by( 10, 3 );
      aggregate.child_add( concrete2 );

      if ( aggregate.treeDepth != 2 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.treeDepth ( ${aggregate.treeDepth} ) `
          + `should be 2 when has two concrete children.`
        );

      if ( aggregate.valuePercentage != 2.5 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.valuePercentage ( ${aggregate.valuePercentage} ) `
          + `should be 2.5 if `
          + `concrete1.valuePercentage `
          + `( ${concrete1.valuePercentage} ) (1/4), `
          + `concrete2.valuePercentage `
          + `( ${concrete2.valuePercentage} ) (3/4).`
        );

      concrete2.value_advance();
      if ( aggregate.valuePercentage != 10 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.valuePercentage ( ${aggregate.valuePercentage} ) `
          + `should be 10 if `
          + `concrete1.valuePercentage `
          + `( ${concrete1.valuePercentage} ) (1/4), `
          + `concrete2.valuePercentage `
          + `( ${concrete2.valuePercentage} ) (3/4).`
        );
    }

    // The 3th child is aggregate.
    let aggregate3;
    {
      aggregate3 = ValueMax.Percentage.Aggregate.Pool.get_or_create_by( 6 );

      if ( aggregate3.weight != 6 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `aggregate3.weight ( ${aggregate3.weight} ) `
        + `should be 6.`
      );

      let concrete31 = ValueMax.Percentage.Concrete.Pool
        .get_or_create_by( 10 );
      aggregate3.child_add( concrete31 );

      let concrete32 = ValueMax.Percentage.Concrete.Pool
        .get_or_create_by( 10 );
      aggregate3.child_add( concrete32 );

      aggregate.child_add( aggregate3 );

      if ( aggregate.treeDepth != 3 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.treeDepth ( ${aggregate.treeDepth} ) `
          + `should be 3 when has aggregate child.`
        );

      if ( aggregate.valuePercentage != 4 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.valuePercentage ( ${aggregate.valuePercentage} ) `
          + `should be 4 if `
          + `concrete1.valuePercentage `
          + `( ${concrete1.valuePercentage} ) (1/10), `
          + `concrete2.valuePercentage `
          + `( ${concrete2.valuePercentage} ) (3/10), `
          + `aggregate3.valuePercentage `
          + `( ${aggregate3.valuePercentage} ) (6/10).`
        );

      concrete31.value_advance();
      concrete32.value_advance();

      if ( aggregate.valuePercentage != 10 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.valuePercentage ( ${aggregate.valuePercentage} ) `
          + `should be 10 if `
          + `concrete1.valuePercentage `
          + `( ${concrete1.valuePercentage} ) (1/10), `
          + `concrete2.valuePercentage `
          + `( ${concrete2.valuePercentage} ) (3/10), `
          + `aggregate3.valuePercentage `
          + `( ${aggregate3.valuePercentage} ) (6/10).`
        );

      aggregate3.child_dispose( concrete31 );
      concrete31 = null;

      if ( aggregate.valuePercentage != 10 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.valuePercentage ( ${aggregate.valuePercentage} ) `
          + `should be 10 if `
          + `concrete1.valuePercentage `
          + `( ${concrete1.valuePercentage} ) (1/10), `
          + `concrete2.valuePercentage `
          + `( ${concrete2.valuePercentage} ) (3/10), `
          + `aggregate3.valuePercentage `
          + `( ${aggregate3.valuePercentage} ) (6/10).`
        );

      aggregate3.child_detachAll();

      concrete32.disposeResources_and_recycleToPool();
      concrete32 = null;

      if ( aggregate.valuePercentage != 4 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.valuePercentage ( ${aggregate.valuePercentage} ) `
          + `should be 4 if `
          + `concrete1.valuePercentage `
          + `( ${concrete1.valuePercentage} ) (1/10), `
          + `concrete2.valuePercentage `
          + `( ${concrete2.valuePercentage} ) (3/10), `
          + `aggregate3.valuePercentage `
          + `( ${aggregate3.valuePercentage} ) (6/10).`
        );

      aggregate.child_detach( aggregate3 );

      aggregate3.disposeResources_and_recycleToPool();
      aggregate3 = null;

      if ( aggregate.valuePercentage != 10 )
      throw Error( `Percentage_tester.${funcNameInMessage}(): `
        + `.valuePercentage ( ${aggregate.valuePercentage} ) `
        + `should be 10 if `
        + `concrete1.valuePercentage `
        + `( ${concrete1.valuePercentage} ) (1/4), `
        + `concrete2.valuePercentage `
        + `( ${concrete2.valuePercentage} ) (3/4).`
      );
    }

    {
      aggregate.child_disposeAll();
      concrete1 = null;
      concrete2 = null;

      if ( aggregate.valuePercentage != 0 )
        throw Error( `Percentage_tester.${funcNameInMessage}(): `
          + `.valuePercentage ( ${aggregate.valuePercentage} ) `
          + `should be 0 if there is no child.`
        );
    }

    progressToAdvance.value_advance();
    yield progressRoot;

  } finally {
    if ( aggregate ) {
      aggregate.disposeResources_and_recycleToPool();
      aggregate = null;
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
