export { tester };

import * as HierarchicalNameable from "../util/HierarchicalNameable.js";
import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";

let A, B, C, D, E, F;

/**
 * 
 */
class TestCaseOne {

  constructor(
    testCaseId,

    parentNameable, nameJoinSeparator, name,

    parentNameString_shouldBe,
    parentNameString_recursively_shouldBe,
    nameJoinSeparatorString_shouldBe,
    nameString_shouldBe,
    nameString_recursively_shouldBe
  ) {

    this.testCaseId = testCaseId;

    this.parentNameable = parentNameable;
    this.nameJoinSeparator = nameJoinSeparator;
    this.name = name;

    this.parentNameString_shouldBe = parentNameString_shouldBe;
    this.parentNameString_recursively_shouldBe
      = parentNameString_recursively_shouldBe;

    this.nameJoinSeparatorString_shouldBe
      = nameJoinSeparatorString_shouldBe;

    this.nameString_shouldBe = nameString_shouldBe;
    this.nameString_recursively_shouldBe = nameString_recursively_shouldBe;
  }

  /** */
  test() {
    const funcNameInMessage = "test";

    let a = HierarchicalNameable.Pool.get_or_create_by(
      this.parentNameable, this.nameJoinSeparator, this.name );

    // 1. Original parameters.
    if ( a.parentNameable_get() != this.parentNameable )
      throw Error( `TestCaseOne.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.parentNameable ( ${a.parentNameable_get()} ) `
        + `should be ( ${this.parentNameable} ).` );

    if ( a.nameJoinSeparator_get() != this.nameJoinSeparator )
      throw Error( `TestCaseOne.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.nameJoinSeparator ( ${a.nameJoinSeparator_get()} )`
        + `should be ( ${this.nameJoinSeparator} ).` );

    if ( a.name_get() != this.name )
      throw Error( `TestCaseOne.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.name ( ${a.name_get()} )`
        + `should be ( ${this.name} ).` );

    // 2. String parameters.
    if ( a.parentNameString_get() != this.parentNameString_shouldBe )
      throw Error( `TestCaseOne.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.parentNameString ( ${a.parentNameString_get()} )`
        + `should be ( ${this.parentNameString_shouldBe} ).` );

    if ( a.parentNameString_recursively_get()
           != this.parentNameString_recursively_shouldBe )
      throw Error( `TestCaseOne.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.parentNameString_recursively ( ${a.parentNameString_recursively_get()} )`
        + `should be ( ${this.parentNameString_recursively_shouldBe} ).` );

    if ( a.nameJoinSeparatorString_get()
           != this.nameJoinSeparatorString_shouldBe )
      throw Error( `TestCaseOne.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.nameJoinSeparatorString ( ${a.nameJoinSeparatorString_get()} )`
        + `should be ( ${this.nameJoinSeparatorString_shouldBe} ).` );

    if ( a.nameString_get() != this.nameString_shouldBe )
      throw Error( `TestCaseOne.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.nameString ( ${a.nameString_get()} )`
        + `should be ( ${this.nameString_shouldBe} ).` );

    if ( a.nameString_recursively_get() != this.nameString_recursively_shouldBe )
      throw Error( `TestCaseOne.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.nameString_recursively ( ${a.nameString_recursively_get()} )`
        + `should be ( ${this.nameString_recursively_shouldBe} ).` );

    // 3. Test .nameJoinSeparator_join()
    {
      a.nameJoinSeparator_join( "QQ", "WW" );
//!!!
      HierarchicalNameable.Root.defaultParams.nameJoinSeparator;

      nameJoinSeparator_join_originalName,
      nameJoinSeparator_join_extraName,
      nameJoinSeparator_join_shouldBe,  
    }

    a.disposeResources_and_recycleToPool();
    a = null;
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

  // 0.1 Prepare test objects.

//!!! ...unfinished... (2025/06/11)

  const nameJoinSeparator = "/";
  A = HierarchicalNameable.Pool.get_or_create_by(
    null, nameJoinSeparator, "A" );

  B = HierarchicalNameable.Pool.get_or_create_by(
    null, nameJoinSeparator, "B" );

  C = HierarchicalNameable.Pool.get_or_create_by(
    null, nameJoinSeparator, "C" );

  D = HierarchicalNameable.Pool.get_or_create_by(
    null, nameJoinSeparator, "D" );

  E = HierarchicalNameable.Pool.get_or_create_by(
    null, nameJoinSeparator, "E" );

  F = HierarchicalNameable.Pool.get_or_create_by(
    null, nameJoinSeparator, "F" );

  let nameableArray = Recyclable.OwnerArray.Pool.get_or_create_by();
  nameableArray.push( A, B, C, D, E, F );


  // 1.
  yield *testerOne( progressOne );

  // 2.
  yield *testerTwo( progressTwo );

  // 3.
  yield *testerThree( progressThree );

  // 4.
  yield *testerSix( progressSix );


  // 5. Release test objects.
  nameableArray.disposeResources_and_recycleToPool();
  nameableArray = null;

  console.log( "HierarchicalNameable testing... Done." );
}
