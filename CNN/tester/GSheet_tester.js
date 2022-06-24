export { tester };

import * as GSheet from "../util/GSheet.js";
import * as ValueMax from "../ValueMax.js";

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
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
 * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log("GSheet download testing...");

  let progress1 = progressParent.addChild( new ValueMax.Percentage.Aggregate() );
  let progress2 = progressParent.addChild( new ValueMax.Percentage.Aggregate() );

  let spreadsheetId = "18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M";
  let range = "A:A";
  let apiKey = "AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU";

  // Without API key.
  let tester1 = new GSheet.UrlComposer( spreadsheetId, range );
  let fetcher1 = tester1.fetcher_JSON_ColumnMajorArray( progress1 );
  let result1 = yield* fetcher1;

  // With API key.
  let tester2 = new GSheet.UrlComposer( spreadsheetId, range, apiKey );
  let fetcher2 = tester2.fetcher_JSON_ColumnMajorArray( progress2 );
  let result2 = yield* fetcher2;

  // Compare results: should the same.
  {
    if ( result1.toString() != result2.toString() )
      throw Error( ` ${result1} != ${result2}` );
  }

  console.log("GSheet download testing... Done.");
}
