export { tester };

import * as ValueMax from "../util/ValueMax.js";
import * as AsyncWorker_Proxy_tester from "./AsyncWorker_Proxy_tester.js";

/*
class TestCase {
  constructor( spreadsheetId, range, apiKey ) {
    this.source = source;
    this.skipLineCount = skipLineCount;
    this.result = result;
    this.suspendByteCount = suspendByteCount;
    this.note = note;
  }
}

let testCases = [
  new TestCase( tEncoder.encode(base64EncodedStrings_extra[ 0]), 1, emptyUint8Array, undefined, "Empty. Not enough lines." ),
*/

/**
 * (Note: Their length could be different, but content should be the same.
 * (i.e. the extra elements should all bew undefined))
 */
function array2d_compare_EQ( lhs, rhs ) {

  let max_i = Math.max( lhs.length, rhs.length );
  for ( let i = 0; i < max_i; ++i ) {
    let array1d_lhs = lhs[ i ];
    let array1d_rhs = rhs[ i ];

    let max_j = Math.max( array1d_lhs.length, array1d_rhs.length );
    for ( let j = 0; j < max_j; ++j ) {
      if ( array1d_lhs[ j ] != array1d_rhs[ j ] )
        return false;
    }
  }

  return true;
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The
 * created progressToAdvance will be increased when every time advanced. The
 * progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( "AsyncWorker testing..." );

  let progressBoostAll = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressNonBoostAll = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progressBoostNonBoostInterleave = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let workerProxy = AsyncWorker_Proxy_tester.Pool.get_or_create_by();

  // All boost.
  {
    const intervalMilliseconds = 100;
    const valueBegin = 0;
    const valueCountTotal = 100;
    const valueCountPerBoost = valueCountTotal;

    let ??? = workerProxy.initWorker( 1 );
    let numberResulter = workerProxy.number_sequence(
      intervalMilliseconds,
      valueBegin, valueCountTotal, valueCountPerBoost );

    let numberResulterNext;
    do {
      numberResulterNext = await numberResulter.next();
      let { done, value } = numberResulterNext;
    } while ( !done );

  }

  let tester1 = GSheets.UrlComposer.Pool.get_or_create_by( spreadsheetId, range );
  let fetcher1 = tester1.fetcher_JSON_ColumnMajorArrayArray( progress1 );
  let result1 = yield* fetcher1;

  // With API key.
  let tester2 = GSheets.UrlComposer.Pool.get_or_create_by( spreadsheetId, range, apiKey );
  let fetcher2 = tester2.fetcher_JSON_ColumnMajorArrayArray( progress2 );
  let result2 = yield* fetcher2;

  // Compare results: should the same.
  if ( !array2d_compare_EQ( result1, result2 ) )
    throw Error( `${result1} != ${result2}` );

  // Test change range.
  {
    let newRange = result1[ 0 ][ 0 ];
    tester1.range_set( newRange );
    let fetcher11 = tester1.fetcher_JSON_ColumnMajorArrayArray( progress11 );
    let result11 = yield* fetcher11;

    tester2.range_set( newRange );
    let fetcher21 = tester2.fetcher_JSON_ColumnMajorArrayArray( progress21 );
    let result21 = yield* fetcher21;

    if ( !array2d_compare_EQ( result11, result21 ) )
      throw Error( `${result11} != ${result21}` );
  }

  tester2.disposeResources_and_recycleToPool();
  tester2 = null;

  tester1.disposeResources_and_recycleToPool();
  tester1 = null;

  console.log( "GSheet download testing... Done." );
}
