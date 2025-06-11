export { tester };

import * as HierarchicalNameable from "../util/HierarchicalNameable.js";
import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";


/**
 * 
 */
class TestCase {

  constructor( parent, separator, name,
    parentNameString_shouldBe,
    parentNameString_recursively_shouldBe,
    nameJoinSeparatorString_shouldBe,
    nameString_shouldBe,
    nameString_recursively_shouldBe,

  ) {

  }

  /** */
  test() {

    nameJoinSeparator_join_originalName,
    nameJoinSeparator_join_extraName,
    nameJoinSeparator_join_shouldBe,  
  }

}


/** */
function *testerOne( progressParent ) {

  let testCaseCount = ?;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

//!!! ...unfinished... (2025/06/11)
  {
    let noName = HierarchicalNameable.Base.Pool.get_or_create_by(
      null, // No parent
      null, // No separator
      null  // No name.
    );

    let noName.nameJoinSeparator_join( "Q", "W" );


//    "A"


  // 1.
  for ( let i = 0; i < Float12_Constant_Coder_Table.length; ++i ) {
    let testCase = Float12_Constant_Coder_Table[ i ];

//!!! (2022/12/22 Remarked)
    //let delta = Math.abs( Float12.Constant[ testCase.name ] - testCase.value )
    //if ( delta <= Number.EPSILON ) {
    if ( Float12.Constant.Coder[ testCase.name ] == testCase.value ) {
      continue;
    }

    throw Error( `testerFloat12Constant(): `
      + `Float12.Constant.Coder.${testCase.name} `
      + `( ${Float12.Constant.Coder[ testCase.name ]} ) `
      + `should be ( ${testCase.value} ).`
    );
  }

  progressToAdvance.value_advance();
  yield progressRoot;

  // 2.
  for ( let i = 0; i < Float12_Constant_Table.length; ++i ) {
    let testCase = Float12_Constant_Table[ i ];

//!!! (2022/12/22 Remarked)
    //let delta
    //  = Math.abs( Float12.Constant[ testCase.name ] - testCase.value )
    //if ( delta <= Number.EPSILON ) {
    if ( Float12.Constant[ testCase.name ] == testCase.value ) {
      continue;
    }

    throw Error( `testerFloat12Constant(): `
      + `Float12.Constant.${testCase.name} `
      + `( ${Float12.Constant[ testCase.name ]} ) `
      + `should be ( ${testCase.value} ).`
    );
  }

  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerTwo( progressParent ) {

//!!! ...unfinished... (2025/06/11)


  let testCaseCount = ?;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );


  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerThree( progressParent ) {

//!!! ...unfinished... (2025/06/11)


  const testCaseCount = ?;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerSix( progressParent ) {

//!!! ...unfinished... (2025/06/11)



  //yield progressRoot;
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
  console.log( "HierarchicalNameable testing..." );

  // 0. Prepare progressParent for every TestCase.

  let progressOne = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressTwo = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressThree = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressSix = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 1.
  yield *testerOne( progressOne );

  // 2.
  yield *testerTwo( progressTwo );

  // 3.
  yield *testerThree( progressThree );

  // 4.
  yield *testerSix( progressSix );

  console.log( "HierarchicalNameable testing... Done." );
}
