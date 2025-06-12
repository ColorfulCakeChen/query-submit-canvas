export { tester };

import * as HierarchicalNameable from "../util/HierarchicalNameable.js";
import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";

// Global HierarchicalNameable test objects.
const A =     HierarchicalNameable.Pool.get_or_create_by( null, "$", "A" );
const A_B =   HierarchicalNameable.Pool.get_or_create_by(    A, "_", "B" );
const A_BvC = HierarchicalNameable.Pool.get_or_create_by(  A_B, "v", "C" );

//
const gTestCaseOne_Table = [
  // 0. Test null.
  new TestCaseOne( 0,
           null, // parentNameable
           null, // nameJoinSeparator
           null, // name
             "", // parentNameString_shouldBe
             "", // parentNameString_recursively_shouldBe
             "", // nameJoinSeparatorString_shouldBe
    "(No name)", // nameString_shouldBe
    "(No name)", // nameString_recursively_shouldBe
  ),

  // 1. Test undefined.
  new TestCaseOne( 1,
      undefined, // parentNameable
      undefined, // nameJoinSeparator
      undefined, // name
             "", // parentNameString_shouldBe
             "", // parentNameString_recursively_shouldBe
             "", // nameJoinSeparatorString_shouldBe
    "(No name)", // nameString_shouldBe
    "(No name)", // nameString_recursively_shouldBe
  ),

  // 2. Test one parent.
  new TestCaseOne( 2,
              A, // parentNameable
            ".", // nameJoinSeparator
            "x", // name
            "A", // parentNameString_shouldBe
            "A", // parentNameString_recursively_shouldBe
            ".", // nameJoinSeparatorString_shouldBe
            "x", // nameString_shouldBe
          "A.x", // nameString_recursively_shouldBe
  ),

  // 3. Test two parent.
  new TestCaseOne( 3,
            A_B, // parentNameable
            ".", // nameJoinSeparator
            "x", // name
            "B", // parentNameString_shouldBe
          "A_B", // parentNameString_recursively_shouldBe
            ".", // nameJoinSeparatorString_shouldBe
            "x", // nameString_shouldBe
        "A_B.x", // nameString_recursively_shouldBe
  ),

  // 4. Test three parent.
  new TestCaseOne( 4,
          A_BvC, // parentNameable
            ".", // nameJoinSeparator
            "x", // name
            "C", // parentNameString_shouldBe
        "A_BvC", // parentNameString_recursively_shouldBe
            ".", // nameJoinSeparatorString_shouldBe
            "x", // nameString_shouldBe
      "A_BvC.x", // nameString_recursively_shouldBe
  ),

];

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
    const parentNameable = a.parentNameable_get();
    if ( parentNameable !== this.parentNameable )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.parentNameable ( ${parentNameable} ) `
        + `should be ( ${this.parentNameable} ).` );

    const nameJoinSeparator = a.nameJoinSeparator_get();
    if ( nameJoinSeparator !== this.nameJoinSeparator )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.nameJoinSeparator ( ${nameJoinSeparator} )`
        + `should be ( ${this.nameJoinSeparator} ).` );

    const name = a.name_get();
    if ( name !== this.name )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.name ( ${name} )`
        + `should be ( ${this.name} ).` );

    // 2. String parameters.
    const parentNameString = a.parentNameString_get();
    if ( parentNameString !== this.parentNameString_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.parentNameString ( ${parentNameString} )`
        + `should be ( ${this.parentNameString_shouldBe} ).` );

    const parentNameString_recursively
      = a.parentNameString_recursively_get();
    if ( parentNameString_recursively
          !== this.parentNameString_recursively_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.parentNameString_recursively ( ${parentNameString_recursively} )`
        + `should be ( ${this.parentNameString_recursively_shouldBe} ).` );

    const nameJoinSeparatorString = a.nameJoinSeparatorString_get();
    if ( nameJoinSeparatorString
           !== this.nameJoinSeparatorString_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.nameJoinSeparatorString ( ${nameJoinSeparatorString} )`
        + `should be ( ${this.nameJoinSeparatorString_shouldBe} ).` );

    const nameString = a.nameString_get();
    if ( nameString !== this.nameString_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.nameString ( ${nameString} )`
        + `should be ( ${this.nameString_shouldBe} ).` );

    const nameString_recursively = a.nameString_recursively_get();
    if ( nameString_recursively !== this.nameString_recursively_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `.nameString_recursively ( ${nameString_recursively} )`
        + `should be ( ${this.nameString_recursively_shouldBe} ).` );

    // 3. Test .nameJoinSeparator_join()
    {
      this.nameJoinSeparator_join_test( a, undefined, undefined );
      this.nameJoinSeparator_join_test( a, undefined,      null );

      this.nameJoinSeparator_join_test( a,      null, undefined );
      this.nameJoinSeparator_join_test( a,      null,      null );

      this.nameJoinSeparator_join_test( a,      "QQ", undefined );
      this.nameJoinSeparator_join_test( a,      "QQ",      null );

      this.nameJoinSeparator_join_test( a,      null,      "WW" );
      this.nameJoinSeparator_join_test( a,      null,      "WW" );

      this.nameJoinSeparator_join_test( a,      "QQ",      "WW" );
      this.nameJoinSeparator_join_test( a,      "QQ",      "WW" );
    }

    a.disposeResources_and_recycleToPool();
    a = null;
  }

  nameJoinSeparator_join_test( aHierarchicalNameable,
    originalName, extraName ) {

    const funcNameInMessage = "nameJoinSeparator_join_test";

    let nameJoinSeparator = this.nameJoinSeparator;
    if (  ( nameJoinSeparator === undefined )
       || ( nameJoinSeparator === null ) )
      nameJoinSeparator
        = HierarchicalNameable.Root.defaultParams.nameJoinSeparator;

    let modifiedName;
    if (  ( extraName === undefined )
       || ( extraName === null ) )
      modifiedName = originalName;
    else
      modifiedName = `${originalName}${nameJoinSeparator}${extraName}`;

    const nameJoinSeparator_join_result
      = aHierarchicalNameable.nameJoinSeparator_join(
          originalName, extraName );

    if ( nameJoinSeparator_join_result !== modifiedName  )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${this.testCaseId}, `
        + `nameJoinSeparator = ${this.nameJoinSeparator}, `
        + `originalName = ${originalName}, `
        + `extraName = ${extraName}, `
        + `.nameJoinSeparator_join() result ( ${nameJoinSeparator_join_result} )`
        + `should be ( ${modifiedName} ).` );
    }

}


/** */
function *testerOne( progressParent ) {

  let testCaseCount = gTestCaseOne_Table.length;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  for ( let i = 0; i < gTestCaseOne_Table.length; ++i ) {
    let testCase = gTestCaseOne_Table[ i ];
    testCase.test();

    progressToAdvance.value_advance();
    yield progressRoot;
  }
}

/** */
function *testerTwo( progressParent ) {

//!!! ...unfinished... (2025/06/11)
  let testCaseCount = 1;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );


  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerThree( progressParent ) {

//!!! ...unfinished... (2025/06/11)

  const testCaseCount = 1;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  progressToAdvance.value_advance();
  yield progressRoot;
}

/** */
function *testerSix( progressParent ) {

//!!! ...unfinished... (2025/06/11)

  const testCaseCount = 1;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  progressToAdvance.value_advance();
  yield progressRoot;
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

//!!! (2025/06/12 Remarked) Create them in global.
//   const nameJoinSeparator = ".";
//   A = HierarchicalNameable.Pool.get_or_create_by(
//     null, nameJoinSeparator, "A" );
//
//   B = HierarchicalNameable.Pool.get_or_create_by(
//     null, nameJoinSeparator, "B" );
//
//   C = HierarchicalNameable.Pool.get_or_create_by(
//     null, nameJoinSeparator, "C" );
//
//   D = HierarchicalNameable.Pool.get_or_create_by(
//     null, nameJoinSeparator, "D" );
//
//   E = HierarchicalNameable.Pool.get_or_create_by(
//     null, nameJoinSeparator, "E" );
//
//   F = HierarchicalNameable.Pool.get_or_create_by(
//     null, nameJoinSeparator, "F" );
//
//   let nameableArray = Recyclable.OwnerArray.Pool.get_or_create_by();
//   nameableArray.push( A, B, C, D, E, F );


  // 1.
  yield *testerOne( progressOne );

  // 2.
  yield *testerTwo( progressTwo );

  // 3.
  yield *testerThree( progressThree );

  // 4.
  yield *testerSix( progressSix );


//!!! (2025/06/12 Remarked) Create them in global.
//   // 5. Release test objects.
//   A = null; B = null; C = null;
//   D = null; E = null; F = null;
//   nameableArray.disposeResources_and_recycleToPool();
//   nameableArray = null;

  console.log( "HierarchicalNameable testing... Done." );
}
