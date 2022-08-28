export { tester };

import * as GSheets from "../util/GSheets.js";
import * as ValueMax from "../util/ValueMax.js";

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

/** */
function array2d_compare_EQ( lhs, rhs ) {
  if ( lhs.length != rhs.length )
    return false;

  for ( let i = 0; i < lhs.length; ++i ) {
    let array1d_lhs = lhs[ i ];
    let array1d_rhs = rhs[ i ];

    if ( array1d_lhs.length != array1d_rhs.length )
      return false;

    for ( let j = 0; j < array1d_lhs.length; ++j ) {
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
  console.log( "GSheet download testing..." );

  let progress1 = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress11 = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress2 = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let progress21 = progressParent.child_add(
    ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  let spreadsheetId = "18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M";
  let range = "A:A";
  let apiKey = "AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU";

  // Without API key.
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
