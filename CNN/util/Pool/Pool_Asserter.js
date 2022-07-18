export { assert_Pool_issuedCount };
export { assert_Pool_issuedCount_same_after_as_before };
export { assert_Pool_issuedCount_zero };

import * as Pool from "./Pool.js";
import * as Recyclable from "./Recyclable.js";

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

  try {
    let issuedCount_before = Pool.All.issuedCount;

    returnedValue = pfn.apply( thisArg, restArgs );

    assert_Pool_issuedCount( prefixMsg, issuedCount_before );

  } catch ( e ) {
    throw e;

  } finally {
  }

  return returnedValue;
}

/**
 *
 */
function assert_Pool_issuedCount_zero( prefixMsg ) {
  assert_Pool_issuedCount( prefixMsg, 0 );
}
