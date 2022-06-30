export { assert_Pool_issuedCount };
export { assert_Pool_issuedCount_same_after_as_before };
export { assert_Pool_issuedCount_zero };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 */
function assert_Pool_issuedCount( prefixMsg, issuedCount_shouldBe ) {
  if ( Pool.All.issuedCount != issuedCount_shouldBe )
    throw Error( `${prefixMsg}: memory leak: `
      + `Pool.All.issuedCount ( ${Pool.All.issuedCount} ) should be ( ${issuedCount_shouldBe} ).` );
}

/**
 * Assert all pool's .issuedCount before and after calling pfn() are the same.
 *
 * @param {Function} pfn
 *   The function to be called.
 *
 * @param {Object} thisArg
 *   The "this" value when function pfn is called.
 *
 * @param {Object[]} restArgs
 *   All arguments when function pfn is called.
 *
 * @return {any}
 *   Return the returned value of function pfn().
 */
function assert_Pool_issuedCount_same_after_as_before( prefixMsg, pfn, thisArg, ...restArgs ) {
  let returnedValue;

//!!! (2022/06/30 Remarked) Now, no issuedCount for individual pool
//  let issuedCount_array_before;
  try {

//!!! (2022/06/30 Remarked) Now, no issuedCount for individual pool
//     issuedCount_array_before = Recyclable.Array.Pool.get_or_create_by( Pool.All.registeredPoolArray.length );
//     for ( let i = 0; i < Pool.All.registeredPoolArray.length; ++i ) {
//       let pool = Pool.All.registeredPoolArray[ i ];
//       issuedCount_array_before[ i ] = pool.issuedCount;
//     }

    let issuedCount_before = Pool.All.issuedCount;

    returnedValue = pfn.apply( thisArg, restArgs );

//!!! (2022/06/30 Remarked) Now, no issuedCount for individual pool
//     for ( let i = 0; i < Pool.All.registeredPoolArray.length; ++i ) {
//       let pool = Pool.All.registeredPoolArray[ i ];
//       assert_Pool_issuedCount( prefixMsg, pool, issuedCount_array_before[ i ] );
//     }

    assert_Pool_issuedCount( prefixMsg, issuedCount_before );

  } catch ( e ) {
    throw e;

  } finally {
//!!! (2022/06/30 Remarked) Now, no issuedCount for individual pool
//     if ( issuedCount_array_before ) {
//       issuedCount_array_before.disposeResources_and_recycleToPool();
//       issuedCount_array_before = null;
//     }
  }

  return returnedValue;
}

/**
 *
 */
function assert_Pool_issuedCount_zero( prefixMsg ) {
  assert_Pool_issuedCount( prefixMsg, 0 );
}
