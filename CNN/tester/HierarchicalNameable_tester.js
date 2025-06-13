export { tester };

import * as HierarchicalNameable from "../util/HierarchicalNameable.js";
import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as ValueMax from "../util/ValueMax.js";

// Global HierarchicalNameable test objects.
const A =     HierarchicalNameable.Root.Pool.get_or_create_by( null, "a", "A" );
const AbB =   HierarchicalNameable.Root.Pool.get_or_create_by(    A, "b", "B" );
const AbBcC = HierarchicalNameable.Root.Pool.get_or_create_by(  AbB, "c", "C" );

const D =     HierarchicalNameable.Root.Pool.get_or_create_by( null, "d", "D" );

const E =     HierarchicalNameable.Root.Pool.get_or_create_by( null, "e", "E" );
const EfF =   HierarchicalNameable.Root.Pool.get_or_create_by(    E, "f", "F" );

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

    const a = aHierarchicalNameable;

    const parentNameString = a.parentNameString_get();
    if ( parentNameString !== this.parentNameString )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.parentNameString ( ${parentNameString} ) `
        + `should be ( ${this.parentNameString} ).` );

    const parentNameString_recursively
      = a.parentNameString_recursively_get();
    if ( parentNameString_recursively
          !== this.parentNameString_recursively )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.parentNameString_recursively ( ${parentNameString_recursively} ) `
        + `should be ( ${this.parentNameString_recursively} ).` );

    const nameJoinSeparatorString = a.nameJoinSeparatorString_get();
    if ( nameJoinSeparatorString
           !== this.nameJoinSeparatorString )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.nameJoinSeparatorString ( ${nameJoinSeparatorString} ) `
        + `should be ( ${this.nameJoinSeparatorString} ).` );

    const nameString = a.nameString_get();
    if ( nameString !== this.nameString )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.nameString ( ${nameString} ) `
        + `should be ( ${this.nameString} ).` );

    const nameString_recursively = a.nameString_recursively_get();
    if ( nameString_recursively !== this.nameString_recursively )
      throw Error( `${this.constructor.name}.${funcNameInMessage}(): `
        + `testCaseId = ${testCaseId}, ${extraDescription}, `
        + `.nameString_recursively ( ${nameString_recursively} ) `
        + `should be ( ${this.nameString_recursively} ).` );
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
    name2_shouldBe_StringValues,

    // Note: leafNameable's root will become the direct child of the test
    //       nameable object.
    leafNameable,
    leafNameable_shouldBe_StringValues,

    parentNameable3,
    leafNameable_shouldBe_StringValues_after_parentNameable3,

    nameJoinSeparator3,
    leafNameable_shouldBe_StringValues_after_nameJoinSeparator3,

    name3,
    leafNameable_shouldBe_StringValues_after_name3,

  ) {
    this.testCaseId = testCaseId;

    this.parentNameable = parentNameable;
    this.nameJoinSeparator = nameJoinSeparator;
    this.name = name;

    this.shouldBe_StringValues = shouldBe_StringValues;

    this.parentNameable2 = parentNameable2;
    this.parentNameable2_shouldBe_StringValues = parentNameable2_shouldBe_StringValues;

    this.nameJoinSeparator2 = nameJoinSeparator2;
    this.nameJoinSeparator2_shouldBe_StringValues = nameJoinSeparator2_shouldBe_StringValues;

    this.name2 = name2;
    this.name2_shouldBe_StringValues = name2_shouldBe_StringValues;

    this.leafNameable = leafNameable;
    this.leafNameable_shouldBe_StringValues = leafNameable_shouldBe_StringValues;

    this.parentNameable3 = parentNameable3;
    this.leafNameable_shouldBe_StringValues_after_parentNameable3
      = leafNameable_shouldBe_StringValues_after_parentNameable3;

    this.nameJoinSeparator3 = nameJoinSeparator3;
    this.leafNameable_shouldBe_StringValues_after_nameJoinSeparator3
      = leafNameable_shouldBe_StringValues_after_nameJoinSeparator3;

    this.name3 = name3;
    this.leafNameable_shouldBe_StringValues_after_name3
      = leafNameable_shouldBe_StringValues_after_name3;
  }

  /** */
  testAll() {
    const funcNameInMessage = "testAll";

    let a = HierarchicalNameable.Root.Pool.get_or_create_by(
      this.parentNameable, this.nameJoinSeparator, this.name );

    // 1. After created.
    this.testOne( a, "just_created",
      this.parentNameable, this.nameJoinSeparator, this.name,
      this.shouldBe_StringValues
    );

    // 2.

    // 2.1 Change to parentNameable2
    a.parentNameable_set( this.parentNameable2 );
    this.testOne( a, "parentNameable2",
      this.parentNameable2, this.nameJoinSeparator, this.name,
      this.parentNameable2_shouldBe_StringValues
    );

    // 2.2 Change to nameJoinSeparator2
    a.nameJoinSeparator_set( this.nameJoinSeparator2 );
    this.testOne( a, "nameJoinSeparator2",
      this.parentNameable2, this.nameJoinSeparator2, this.name,
      this.nameJoinSeparator2_shouldBe_StringValues
    );

    // 2.3 Change to name2
    a.name_set( this.name2 );
    this.testOne( a, "name2",
      this.parentNameable2, this.nameJoinSeparator2, this.name2,
      this.name2_shouldBe_StringValues
    );

    // 3. Let leaf's root as direct child.
    const leafNameable = this.leafNameable;
    const leaf_parentOld = leafNameable.parentNameable_get();
    const leaf_nameJoinSeparator = leafNameable.nameJoinSeparator_get();
    const leaf_name = leafNameable.name_get();

    const leaf_rootOld = leafNameable.rootNameable_get();
    leaf_rootOld.parentNameable_set( a );

    let leaf_parentNew;

    // If the leaf nameable is itself's root, its parent should become the
    // tested nameable object.
    if ( leafNameable === leaf_rootOld )
      leaf_parentNew = a;
    else // Otherwise, its parent should be the same as original.
      leaf_parentNew = leaf_parentOld;

    this.testOne( a, "let leaf's root as direct child",
      leaf_parentNew, leaf_nameJoinSeparator, leaf_name,
      this.leafNameable_shouldBe_StringValues
    );

    // 4.

    // 4.1 Change to parentNameable3
    a.parentNameable_set( this.parentNameable3 );
    this.testOne( leafNameable, "parentNameable3",
      leaf_parentNew, leaf_nameJoinSeparator, leaf_name,
      this.leafNameable_shouldBe_StringValues_after_parentNameable3
    );

    // 4.2 Change to nameJoinSeparator3
    a.nameJoinSeparator_set( this.nameJoinSeparator3 );
    this.testOne( a, "nameJoinSeparator3",
      leaf_parentNew, leaf_nameJoinSeparator, leaf_name,
      this.leafNameable_shouldBe_StringValues_after_nameJoinSeparator3
    );

    // 4.3 Change to name3
    a.name_set( this.name3 );
    this.testOne( a, "name3",
      leaf_parentNew, leaf_nameJoinSeparator, leaf_name,
      this.leafNameable_shouldBe_StringValues_after_name3
    );

    // 5.
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
               AbBcC, // parentNameable2
    new StringValues(
                 "C", // parentNameString_shouldBe
             "AbBcC", // parentNameString_recursively_shouldBe
                  "", // nameJoinSeparatorString_shouldBe
         "(No name)", // nameString_shouldBe
    "AbBcC(No name)", // nameString_recursively_shouldBe
    ),
                 "~", // nameJoinSeparator2
    new StringValues(
                 "C", // parentNameString_shouldBe
             "AbBcC", // parentNameString_recursively_shouldBe
                 "~", // nameJoinSeparatorString_shouldBe
         "(No name)", // nameString_shouldBe
   "AbBcC~(No name)", // nameString_recursively_shouldBe
    ),
                 "0", // name2
    new StringValues(
                 "C", // parentNameString_shouldBe
             "AbBcC", // parentNameString_recursively_shouldBe
                 "~", // nameJoinSeparatorString_shouldBe
                 "0", // nameString_shouldBe
           "AbBcC~0", // nameString_recursively_shouldBe
    ),
                   D, // leafNameable
    new StringValues(
                 "0", // leaf's parentNameString_shouldBe
           "AbBcC~0", // leaf's parentNameString_recursively_shouldBe
                 "d", // leaf's nameJoinSeparatorString_shouldBe
                 "D", // leaf's nameString_shouldBe
         "AbBcC~0dD", // leaf's nameString_recursively_shouldBe
    ),
                 AbB, // parentNameable3,
    new StringValues(
                 "0", // leaf's parentNameString_shouldBe
             "AbB~0", // leaf's parentNameString_recursively_shouldBe
                 "d", // leaf's nameJoinSeparatorString_shouldBe
                 "D", // leaf's nameString_shouldBe
           "AbB~0dD", // leaf's nameString_recursively_shouldBe
    ),
                "~~", // nameJoinSeparator3,
    new StringValues(
                 "0", // leaf's parentNameString_shouldBe
            "AbB~~0", // leaf's parentNameString_recursively_shouldBe
                 "d", // leaf's nameJoinSeparatorString_shouldBe
                 "D", // leaf's nameString_shouldBe
          "AbB~~0dD", // leaf's nameString_recursively_shouldBe
    ),
                "00", // name3,
    new StringValues(
                "00", // leaf's parentNameString_shouldBe
           "AbB~~00", // leaf's parentNameString_recursively_shouldBe
                 "d", // leaf's nameJoinSeparatorString_shouldBe
                 "D", // leaf's nameString_shouldBe
         "AbB~~00dD", // leaf's nameString_recursively_shouldBe
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
                   D, // parentNameable2
    new StringValues(
                 "D", // parentNameString_shouldBe
                 "D", // parentNameString_recursively_shouldBe
                  "", // nameJoinSeparatorString_shouldBe
         "(No name)", // nameString_shouldBe
        "D(No name)", // nameString_recursively_shouldBe
    ),
                 "!", // nameJoinSeparator2
    new StringValues(
                 "D", // parentNameString_shouldBe
                 "D", // parentNameString_recursively_shouldBe
                 "!", // nameJoinSeparatorString_shouldBe
         "(No name)", // nameString_shouldBe
       "D!(No name)", // nameString_recursively_shouldBe
    ),
                 "1", // name2
    new StringValues(
                 "D", // parentNameString_shouldBe
                 "D", // parentNameString_recursively_shouldBe
                 "!", // nameJoinSeparatorString_shouldBe
                 "1", // nameString_shouldBe
               "D!1", // nameString_recursively_shouldBe
    ),
                 EfF, // leafNameable,
    new StringValues(
                 "E", // leaf's parentNameString_shouldBe
             "D!1eE", // leaf's parentNameString_recursively_shouldBe
                 "f", // leaf's nameJoinSeparatorString_shouldBe
                 "F", // leaf's nameString_shouldBe
           "D!1eEfF", // leaf's nameString_recursively_shouldBe
    ),
                 AbB, // parentNameable3,
    new StringValues(
                 "E", // leaf's parentNameString_shouldBe
           "AbB!1eE", // leaf's parentNameString_recursively_shouldBe
                 "f", // leaf's nameJoinSeparatorString_shouldBe
                 "F", // leaf's nameString_shouldBe
         "AbB!1eEfF", // leaf's nameString_recursively_shouldBe
    ),
                "!!", // nameJoinSeparator3,
    new StringValues(
                 "E", // leaf's parentNameString_shouldBe
          "AbB!!1eE", // leaf's parentNameString_recursively_shouldBe
                 "f", // leaf's nameJoinSeparatorString_shouldBe
                 "F", // leaf's nameString_shouldBe
        "AbB!!1eEfF", // leaf's nameString_recursively_shouldBe
    ),
                "11", // name3,
    new StringValues(
                 "E", // leaf's parentNameString_shouldBe
         "AbB!!11eE", // leaf's parentNameString_recursively_shouldBe
                 "f", // leaf's nameJoinSeparatorString_shouldBe
                 "F", // leaf's nameString_shouldBe
       "AbB!!11eEfF", // leaf's nameString_recursively_shouldBe
    ),
  ),

  // 2. Test one parent.
  new TestCaseOne( 2,
                   A, // parentNameable
                 "@", // nameJoinSeparator
                 "2", // name
    new StringValues(
                 "A", // parentNameString_shouldBe
                 "A", // parentNameString_recursively_shouldBe
                 "@", // nameJoinSeparatorString_shouldBe
                 "2", // nameString_shouldBe
               "A@2", // nameString_recursively_shouldBe
    ),
                 EfF, // parentNameable2,
    new StringValues(
                 "F", // parentNameString_shouldBe
               "EfF", // parentNameString_recursively_shouldBe
                 "@", // nameJoinSeparatorString_shouldBe
                 "2", // nameString_shouldBe
             "EfF@2", // nameString_recursively_shouldBe
    ),
                "@@", // nameJoinSeparator2,
    new StringValues(
                 "F", // parentNameString_shouldBe
               "EfF", // parentNameString_recursively_shouldBe
                "@@", // nameJoinSeparatorString_shouldBe
                 "2", // nameString_shouldBe
            "EfF@@2", // nameString_recursively_shouldBe
    ),
                "22", // name2,
    new StringValues(
                 "F", // parentNameString_shouldBe
               "EfF", // parentNameString_recursively_shouldBe
                "@@", // nameJoinSeparatorString_shouldBe
                "22", // nameString_shouldBe
           "EfF@@22", // nameString_recursively_shouldBe
    ),
                   A, // leafNameable,
    new StringValues(
                 "A", // leaf's parentNameString_shouldBe
           "EfF@@22", // leaf's parentNameString_recursively_shouldBe
                 "a", // leaf's nameJoinSeparatorString_shouldBe
                 "A", // leaf's nameString_shouldBe
         "EfF@@22aA", // leaf's nameString_recursively_shouldBe
    ),
                   D, // parentNameable3,
    new StringValues(
                 "A", // leaf's parentNameString_shouldBe
             "D@@22", // leaf's parentNameString_recursively_shouldBe
                 "a", // leaf's nameJoinSeparatorString_shouldBe
                 "A", // leaf's nameString_shouldBe
           "D@@22aA", // leaf's nameString_recursively_shouldBe
    ),
               "@@@", // nameJoinSeparator3,
    new StringValues(
                 "A", // leaf's parentNameString_shouldBe
            "D@@@22", // leaf's parentNameString_recursively_shouldBe
                 "a", // leaf's nameJoinSeparatorString_shouldBe
                 "A", // leaf's nameString_shouldBe
          "D@@@22aA", // leaf's nameString_recursively_shouldBe
    ),
               "222", // name3,
    new StringValues(
                 "A", // leaf's parentNameString_shouldBe
           "D@@@222", // leaf's parentNameString_recursively_shouldBe
                 "a", // leaf's nameJoinSeparatorString_shouldBe
                 "A", // leaf's nameString_shouldBe
         "D@@@222aA", // leaf's nameString_recursively_shouldBe
    ),
  ),

  // 3. Test two parent.
  new TestCaseOne( 3,
                 AbB, // parentNameable
                 "#", // nameJoinSeparator
                 "3", // name
    new StringValues(
                 "B", // parentNameString_shouldBe
               "AbB", // parentNameString_recursively_shouldBe
                 "#", // nameJoinSeparatorString_shouldBe
                 "3", // nameString_shouldBe
             "AbB#3", // nameString_recursively_shouldBe
    ),
                null, // parentNameable2,
    new StringValues(
                  "", // parentNameString_shouldBe
                  "", // parentNameString_recursively_shouldBe
                 "#", // nameJoinSeparatorString_shouldBe
                 "3", // nameString_shouldBe
                 "3", // nameString_recursively_shouldBe
    ),
                "##", // nameJoinSeparator2,
    new StringValues(
                  "", // parentNameString_shouldBe
                  "", // parentNameString_recursively_shouldBe
                "##", // nameJoinSeparatorString_shouldBe
                 "3", // nameString_shouldBe
                 "3", // nameString_recursively_shouldBe
    ),
                "33", // name2,
    new StringValues(
                  "", // parentNameString_shouldBe
                  "", // parentNameString_recursively_shouldBe
                "##", // nameJoinSeparatorString_shouldBe
                "33", // nameString_shouldBe
                "33", // nameString_recursively_shouldBe
    ),
                 AbB, // leafNameable,
    new StringValues(
                 "A", // leaf's parentNameString_shouldBe
              "33aA", // leaf's parentNameString_recursively_shouldBe
                 "b", // leaf's nameJoinSeparatorString_shouldBe
                 "B", // leaf's nameString_shouldBe
            "33aAbB", // leaf's nameString_recursively_shouldBe
    ),
                 EfF, // parentNameable3,
    new StringValues(
                 "A", // leaf's parentNameString_shouldBe
         "EfF##33aA", // leaf's parentNameString_recursively_shouldBe
                 "b", // leaf's nameJoinSeparatorString_shouldBe
                 "B", // leaf's nameString_shouldBe
       "EfF##33aAbB", // leaf's nameString_recursively_shouldBe
    ),
               "###", // nameJoinSeparator3,
    new StringValues(
                 "A", // leaf's parentNameString_shouldBe
        "EfF###33aA", // leaf's parentNameString_recursively_shouldBe
                 "b", // leaf's nameJoinSeparatorString_shouldBe
                 "B", // leaf's nameString_shouldBe
      "EfF###33aAbB", // leaf's nameString_recursively_shouldBe
    ),
               "333", // name3,
    new StringValues(
                 "A", // leaf's parentNameString_shouldBe
       "EfF###333aA", // leaf's parentNameString_recursively_shouldBe
                 "b", // leaf's nameJoinSeparatorString_shouldBe
                 "B", // leaf's nameString_shouldBe
     "EfF###333aAbB", // leaf's nameString_recursively_shouldBe
    ),
  ),

  // 4. Test three parent.
  new TestCaseOne( 4,
               AbBcC, // parentNameable
                 "$", // nameJoinSeparator
                 "4", // name
    new StringValues(
                 "C", // parentNameString_shouldBe
             "AbBcC", // parentNameString_recursively_shouldBe
                 "$", // nameJoinSeparatorString_shouldBe
                 "4", // nameString_shouldBe
           "AbBcC$4", // nameString_recursively_shouldBe
    ),
                 AbB, // parentNameable2,
    new StringValues(
                 "B", // parentNameString_shouldBe
               "AbB", // parentNameString_recursively_shouldBe
                 "$", // nameJoinSeparatorString_shouldBe
                 "4", // nameString_shouldBe
             "AbB$4", // nameString_recursively_shouldBe
    ),
                "$$", // nameJoinSeparator2,
    new StringValues(
                 "B", // parentNameString_shouldBe
               "AbB", // parentNameString_recursively_shouldBe
                "$$", // nameJoinSeparatorString_shouldBe
                 "4", // nameString_shouldBe
            "AbB$$4", // nameString_recursively_shouldBe
    ),
                "44", // name2,
    new StringValues(
                 "B", // parentNameString_shouldBe
               "AbB", // parentNameString_recursively_shouldBe
                "$$", // nameJoinSeparatorString_shouldBe
                "44", // nameString_shouldBe
           "AbB$$44", // nameString_recursively_shouldBe
    ),
                 EfF, // leafNameable,
    new StringValues(
                 "E", // leaf's parentNameString_shouldBe
         "AbB$$44eE", // leaf's parentNameString_recursively_shouldBe
                 "f", // leaf's nameJoinSeparatorString_shouldBe
                 "F", // leaf's nameString_shouldBe
       "AbB$$44eEfF", // leaf's nameString_recursively_shouldBe
    ),
           undefined, // parentNameable3,
    new StringValues(
                 "E", // leaf's parentNameString_shouldBe
              "44eE", // leaf's parentNameString_recursively_shouldBe
                 "f", // leaf's nameJoinSeparatorString_shouldBe
                 "F", // leaf's nameString_shouldBe
            "44eEfF", // leaf's nameString_recursively_shouldBe
    ),
               "###", // nameJoinSeparator3,
    new StringValues(
                 "E", // leaf's parentNameString_shouldBe
              "44eE", // leaf's parentNameString_recursively_shouldBe
                 "f", // leaf's nameJoinSeparatorString_shouldBe
                 "F", // leaf's nameString_shouldBe
            "44eEfF", // leaf's nameString_recursively_shouldBe
    ),
               "444", // name3,
    new StringValues(
                 "E", // leaf's parentNameString_shouldBe
             "444eE", // leaf's parentNameString_recursively_shouldBe
                 "f", // leaf's nameJoinSeparatorString_shouldBe
                 "F", // leaf's nameString_shouldBe
           "444eEfF", // leaf's nameString_recursively_shouldBe
    ),
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
function *testerCircularly( progressParent ) {

  let testCaseCount = 3;

  let progressRoot = progressParent.root_get();
  let progressToAdvance = progressParent.child_add(
    ValueMax.Percentage.Concrete.Pool.get_or_create_by( testCaseCount ) );

  const parentNull = null;
  const nameJoinSeparator = "/";

  // 1. Test: circularly reference self: a and a.
  {
    let a = HierarchicalNameable.Root.Pool.get_or_create_by(
      parentNull, nameJoinSeparator, "a" );

    a.parentNameable_set( a );

    a.disposeResources_and_recycleToPool();
    a = null;
  }

  progressToAdvance.value_advance();
  yield progressRoot;

  // 2. Test: circularly reference: a and b.
  {
    let a = HierarchicalNameable.Root.Pool.get_or_create_by(
      parentNull, nameJoinSeparator, "a" );

    let b = HierarchicalNameable.Root.Pool.get_or_create_by(
      a, nameJoinSeparator, "b" );

    a.parentNameable_set( b );

    a.disposeResources_and_recycleToPool();
    a = null;

    b.disposeResources_and_recycleToPool();
    b = null;
  }

  progressToAdvance.value_advance();
  yield progressRoot;

  // 3. Test: circularly reference: a and b (not in constructor).
  {
    let a = HierarchicalNameable.Root.Pool.get_or_create_by(
      parentNull, nameJoinSeparator, "a" );

    let b = HierarchicalNameable.Root.Pool.get_or_create_by(
      parentNull, nameJoinSeparator, "b" );

    a.parentNameable_set( b );
    b.parentNameable_set( a );

    a.disposeResources_and_recycleToPool();
    a = null;

    b.disposeResources_and_recycleToPool();
    b = null;
  }

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

  let progressCircularly = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressThree = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressSix = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  // 0.1 Prepare test objects.

  // 1.
  yield *testerOne( progressOne );

  // 2.
  yield *testerCircularly( progressCircularly );

//!!! ...unfinished... (2025/06/11)

  // 3.
  yield *testerThree( progressThree );

  // 4.
  yield *testerSix( progressSix );

  console.log( "HierarchicalNameable testing... Done." );
}
