export { tester };

import * as HierarchicalNameable from "../util/HierarchicalNameable.js";
import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as ValueMax from "../util/ValueMax.js";

// Global HierarchicalNameable test objects.
const A =     HierarchicalNameable.Root.Pool.get_or_create_by( null, "$", "A" );
const A_B =   HierarchicalNameable.Root.Pool.get_or_create_by(    A, "_", "B" );
const A_BvC = HierarchicalNameable.Root.Pool.get_or_create_by(  A_B, "v", "C" );

//!!! ...unfinished... (2025/06/12)
// Test A_B_C and D_E_F
// Change parent of E_F to A_B so that A_B_E_F

/**
 * Describe Record what the string properties' values of HierarchicalNameable
 * should be.
 */
class StringValues {

  constructor(
    parentNameString,
    parentNameString_recursively,
    nameJoinSeparatorString,
    nameString,
    nameString_recursively ) {

    this.parentNameString = parentNameString;
    this.parentNameString_recursively = parentNameString_recursively;

    this.nameJoinSeparatorString = nameJoinSeparatorString;

    this.nameString = nameString;
    this.nameString_recursively = nameString_recursively;
  }

  /** */
  test( testCaseId, extraDescription, aHierarchicalNameable ) {
    const funcNameInMessage = "test";

//!!! ..unfinished... (2025/06/12 Remarked)
//     // 1. Original parameters.
//     const parentNameable = a.parentNameable_get();
//     if ( parentNameable !== this.parentNameable )
//       throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
//         + `testCaseId = ${testCaseId}, ${extraDescription}, `
//         + `.parentNameable ( ${parentNameable} ) `
//         + `should be ( ${this.parentNameable} ).` );
//
//     const nameJoinSeparator = a.nameJoinSeparator_get();
//     if ( nameJoinSeparator !== this.nameJoinSeparator )
//       throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
//         + `testCaseId = ${testCaseId}, ${extraDescription}, `
//         + `.nameJoinSeparator ( ${nameJoinSeparator} ) `
//         + `should be ( ${this.nameJoinSeparator} ).` );
//
//     const name = a.name_get();
//     if ( name !== this.name )
//       throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
//         + `testCaseId = ${testCaseId}, ${extraDescription}, `
//         + `.name ( ${name} ) `
//         + `should be ( ${this.name} ).` );

    const a = aHierarchicalNameable;

    // 2. String parameters.
    const parentNameString = a.parentNameString_get();
    if ( parentNameString !== this.parentNameString_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.parentNameString ( ${parentNameString} ) `
        + `should be ( ${this.parentNameString_shouldBe} ).` );

    const parentNameString_recursively
      = a.parentNameString_recursively_get();
    if ( parentNameString_recursively
          !== this.parentNameString_recursively_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.parentNameString_recursively ( ${parentNameString_recursively} ) `
        + `should be ( ${this.parentNameString_recursively_shouldBe} ).` );

    const nameJoinSeparatorString = a.nameJoinSeparatorString_get();
    if ( nameJoinSeparatorString
           !== this.nameJoinSeparatorString_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.nameJoinSeparatorString ( ${nameJoinSeparatorString} ) `
        + `should be ( ${this.nameJoinSeparatorString_shouldBe} ).` );

    const nameString = a.nameString_get();
    if ( nameString !== this.nameString_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.nameString ( ${nameString} ) `
        + `should be ( ${this.nameString_shouldBe} ).` );

    const nameString_recursively = a.nameString_recursively_get();
    if ( nameString_recursively !== this.nameString_recursively_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.nameString_recursively ( ${nameString_recursively} ) `
        + `should be ( ${this.nameString_recursively_shouldBe} ).` );
  }

}

/**
 * 
 */
class TestCaseOne {

  constructor(
    testCaseId,

    parentNameable, nameJoinSeparator, name,
    shouldBe_StringValues,

    parentNameable2,
    parentNameable2_shouldBe_StringValues,

    nameJoinSeparator2,
    nameJoinSeparator2_shouldBe_StringValues,

    name2,
    name2_shouldBe_StringValues
  ) {

    this.testCaseId = testCaseId;

    this.parentNameable = parentNameable;
    this.nameJoinSeparator = nameJoinSeparator;
    this.name = name;

    this.shouldBe_StringValues = shouldBe_StringValues;

    this.parentNameable2 = parentNameable2;
    this.parentNameable2_shouldBe_StringValues
      = parentNameable2_shouldBe_StringValues;

    this.nameJoinSeparator2 = nameJoinSeparator2;
    this.nameJoinSeparator2_shouldBe_StringValues
      = nameJoinSeparator2_shouldBe_StringValues;

    this.name2 = name2;
    this.name2_shouldBe_StringValues
      = name2_shouldBe_StringValues;
  }

  /** */
  testAll() {
    const funcNameInMessage = "testAll";

    let a = HierarchicalNameable.Root.Pool.get_or_create_by(
      this.parentNameable, this.nameJoinSeparator, this.name );

    // 1. After created.
    this.testOne( a, "afterCreated",
      this.parentNameable,
      this.nameJoinSeparator,
      this.name,
      this.shouldBe_StringValues
    );

    // 2.

//!!! ...unfinished... (2025/06/12)
// Try change parentNameable, nameJoinSeparator, name,
//    aShouldBe.test( this.testCaseId, "parentChanged", a );
//
// Try add/remove child

    // this.testOne( a, "afterCreated",
    //   this.parentNameable,
    //   this.nameJoinSeparator,
    //   this.name,
    //   this.shouldBe_StringValues
    // );

    //
    a.disposeResources_and_recycleToPool();
    a = null;
  }

  /** */
  testOne( aHierarchicalNameable, extraDescription,
    parentNameable_shouldBe,
    nameJoinSeparator_shouldBe,
    name_shouldBe,
    shouldBe_StringValues
  ) {
    const funcNameInMessage = "testOne";

    const testCaseId = this.testCaseId;
    const a = aHierarchicalNameable;

    // 1. Original parameters.
    const parentNameable = a.parentNameable_get();
    if ( parentNameable !== parentNameable_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.parentNameable ( ${parentNameable} ) `
        + `should be ( ${parentNameable_shouldBe} ).` );

    const nameJoinSeparator = a.nameJoinSeparator_get();
    if ( nameJoinSeparator !== nameJoinSeparator_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.nameJoinSeparator ( ${nameJoinSeparator} ) `
        + `should be ( ${nameJoinSeparator_shouldBe} ).` );

    const name = a.name_get();
    if ( name !== name_shouldBe )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.name ( ${name} ) `
        + `should be ( ${name_shouldBe} ).` );

    // 2. String parameters.
    shouldBe_StringValues.test( this.testCaseId, extraDescription, a );

    // 3. Test .nameJoinSeparator_join()
    this.nameJoinSeparator_join_testAll( a );
  }

  /** */
  nameJoinSeparator_join_testAll( aHierarchicalNameable, extraDescription ) {
    const a = aHierarchicalNameable;

    this.nameJoinSeparator_join_testOne( a, extraDescription, undefined, undefined );
    this.nameJoinSeparator_join_testOne( a, extraDescription, undefined,      null );

    this.nameJoinSeparator_join_testOne( a, extraDescription,      null, undefined );
    this.nameJoinSeparator_join_testOne( a, extraDescription,      null,      null );

    this.nameJoinSeparator_join_testOne( a, extraDescription,      "QQ", undefined );
    this.nameJoinSeparator_join_testOne( a, extraDescription,      "QQ",      null );

    this.nameJoinSeparator_join_testOne( a, extraDescription, undefined,      "WW" );
    this.nameJoinSeparator_join_testOne( a, extraDescription,      null,      "WW" );

    this.nameJoinSeparator_join_testOne( a, extraDescription,      "QQ",      "WW" );
    this.nameJoinSeparator_join_testOne( a, extraDescription,      "QQ",      "WW" );
  }

  /** */
  nameJoinSeparator_join_testOne( aHierarchicalNameable, extraDescription,
    originalName, extraName ) {

    const funcNameInMessage = "nameJoinSeparator_join_testOne";

    const testCaseId = this.testCaseId;

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
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `nameJoinSeparator = ${this.nameJoinSeparator}, `
        + `originalName = ${originalName}, `
        + `extraName = ${extraName}, `
        + `.nameJoinSeparator_join() result ( ${nameJoinSeparator_join_result} ) `
        + `should be ( ${modifiedName} ).` );
  }

}

/** */
const gTestCaseOne_Table = [
  // 0. Test null.
  new TestCaseOne( 0,
           null, // parentNameable
           null, // nameJoinSeparator
           null, // name
    new StringValues(
               "", // parentNameString_shouldBe
               "", // parentNameString_recursively_shouldBe
               "", // nameJoinSeparatorString_shouldBe
      "(No name)", // nameString_shouldBe
      "(No name)", // nameString_recursively_shouldBe
    ),
  ),

  // 1. Test undefined.
  new TestCaseOne( 1,
      undefined, // parentNameable
      undefined, // nameJoinSeparator
      undefined, // name
    new StringValues(
               "", // parentNameString_shouldBe
               "", // parentNameString_recursively_shouldBe
               "", // nameJoinSeparatorString_shouldBe
      "(No name)", // nameString_shouldBe
      "(No name)", // nameString_recursively_shouldBe
    ),
  ),

  // 2. Test one parent.
  new TestCaseOne( 2,
              A, // parentNameable
            ".", // nameJoinSeparator
            "2", // name
    new StringValues(
              "A", // parentNameString_shouldBe
              "A", // parentNameString_recursively_shouldBe
              ".", // nameJoinSeparatorString_shouldBe
              "2", // nameString_shouldBe
            "A.2", // nameString_recursively_shouldBe
    ),
  ),

  // 3. Test two parent.
  new TestCaseOne( 3,
            A_B, // parentNameable
            ".", // nameJoinSeparator
            "3", // name
    new StringValues(
              "B", // parentNameString_shouldBe
            "A_B", // parentNameString_recursively_shouldBe
              ".", // nameJoinSeparatorString_shouldBe
              "3", // nameString_shouldBe
          "A_B.3", // nameString_recursively_shouldBe
    ),
  ),

  // 4. Test three parent.
  new TestCaseOne( 4,
          A_BvC, // parentNameable
            ".", // nameJoinSeparator
            "4", // name
    new StringValues(
              "C", // parentNameString_shouldBe
          "A_BvC", // parentNameString_recursively_shouldBe
              ".", // nameJoinSeparatorString_shouldBe
              "4", // nameString_shouldBe
        "A_BvC.4", // nameString_recursively_shouldBe
    )
  ),

];


/** */
function *testerOne( progressParent ) {

  let testCaseCount = gTestCaseOne_Table.length;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  for ( let i = 0; i < gTestCaseOne_Table.length; ++i ) {
    let testCase = gTestCaseOne_Table[ i ];
    testCase.testAll();

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
