export { assert_Pool_issuedCount };
export { assert_Pool_issuedCount_same_after_as_before };
export { assert_Pool_issuedCount_zero };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

/**
 *
 *
 * @param {Pool.Base} pool
 *   The pool object to be asserted.
 *
 */
function assert_Pool_issuedCount( prefixMsg, pool, issuedCount_shouldBe ) {
  if ( pool.issuedCount != issuedCount_shouldBe )
    throw Error( `${prefixMsg}: memory leak: `
      + `pool ( ${pool.poolName} )'s issuedCount ( ${pool.issuedCount} ) should be ( ${issuedCount_shouldBe} ).` );
}

/**
 * Assert all pool's .issuedCount before and after calling pfn() are the same.
 *
 * @param (Function} pfn
 *   The function to be called.
 */
function assert_Pool_issuedCount_same_after_as_before( prefixMsg, pfn ) {

  let issuedCount_array_before;
  try {
    issuedCount_array_before = Recyclable.Array.Pool.get_or_create_by( Pool.All.registeredPoolArray.length );
    for ( let i = 0; i < Pool.All.registeredPoolArray.length; ++i ) {
      let pool = Pool.All.registeredPoolArray[ i ];
      issuedCount_array_before[ i ] = pool.issuedCount;
    }

    pfn.call();

    for ( let i = 0; i < Pool.All.registeredPoolArray.length; ++i ) {
      let pool = Pool.All.registeredPoolArray[ i ];
      assert_Pool_issuedCount( prefixMsg, pool, issuedCount_array_before[ i ] );
    }

  } catch ( e ) {
    throw e;

  } finally {
    if ( issuedCount_array_before )
      issuedCount_array_before.disposeResources_and_recycleToPool();
    issuedCount_array_before = null;
  }
}

/**
 *
 */
function assert_Pool_issuedCount_zero( prefixMsg ) {
  for ( let i = 0; i < Pool.All.registeredPoolArray.length; ++i ) {
    let pool = Pool.All.registeredPoolArray[ i ];
    assert_Pool_issuedCount( prefixMsg, pool, 0 );
  }
}
