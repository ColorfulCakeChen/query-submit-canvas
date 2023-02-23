export { tester };

import * as GSheets from "../util/GSheets.js";
import * as ValueMax from "../util/ValueMax.js";

/**
 * (Note: Their length could be different, but content should be the same.
 * (i.e. the extra elements should be all undefined))
 */
function array2d_compare_EQ( lhs, rhs ) {

  // If both are null (e.g. the network is offline), it is viewed as the same.
  if ( ( lhs == null ) && ( rhs == null ) )
    return true;

  const emptyArray = [];

  // Note: lhs or rhs may be undefined when all Google Sheets cells are empty.
  lhs = ( lhs != undefined ) ? lhs : emptyArray;
  rhs = ( rhs != undefined ) ? rhs : emptyArray;

  let max_i = Math.max( lhs.length, rhs.length );
  for ( let i = 0; i < max_i; ++i ) {
    let array1d_lhs = lhs[ i ];
    let array1d_rhs = rhs[ i ];

    array1d_lhs = ( array1d_lhs != undefined ) ? array1d_lhs : emptyArray;
    array1d_rhs = ( array1d_rhs != undefined ) ? array1d_rhs : emptyArray;

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
 */
class TestCase {

  /**
   * 
   * @param {string} spreadsheetId_postfix
   *   The extra string appended to the end of spreadsheetId.
   *
   * @param {number} loadingMillisecondsMax
   *   - zero: no timeout.
   *   - positive: has timeout.
   *
   * @param {number} retryTimesMax 
   *   - negative: infinite retry.
   *   - zero: no retry.
   *   - positive: has retry.
   *
   * @param {number} abortAfterWhichYield
   *   - negative: never call .abort().
   *   - zero or positive: call .abort() after which times yield.
   *
   * @param {boolean} bShouldProgress100
   *   True means the test should result in ( progressParent.valuePercentage == 100 ).
   */
  constructor(
    testCaseId,
    spreadsheetId_postfix,
    loadingMillisecondsMax,
    retryTimesMax,
    abortAfterWhichYield,
    bShouldProgress100
  ) {
    this.testCaseId = testCaseId;
    this.spreadsheetId_postfix = spreadsheetId_postfix;
    this.loadingMillisecondsMax = loadingMillisecondsMax;
    this.retryTimesMax = retryTimesMax;
    this.abortAfterWhichYield = abortAfterWhichYield;
    this.bShouldProgress100 = bShouldProgress100;
  }

  /**
   * Try to load differential evolution summary and one of versus.
   *
   * @param {GSheets.UrlComposer} urlComposer
   *   The urlComposer.JSON_ColumnMajorArrayArray_fetch_asyncGenerator() will be
   * called and advanced until done.
   *
   * @return {Array[]}
   *   - Return ( a two dimension (column-major) array ) when successfully.
   *   - Return null when failed.
   */
  async* urlComposer_fetcher( urlComposer, progressParent ) {


//!!! ...unfinished... (2023/02/23)
// Should test .abort() at this time.


    let fetcher = urlComposer.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
      progressParent,

      this.loadingMillisecondsMax,
      this.loadingMillisecondsInterval,
    
      this.retryTimesMax,
      this.retryWaitingSecondsExponentMax,
      this.retryWaitingMillisecondsInterval
    );

    let nextResult;
    let yieldTimes = 0;
    do {

//!!! ...unfinished... (2023/02/23)
// Should test .abort() at this time.

      nextResult = await fetcher.next();

//!!! ...unfinished... (2023/02/23)
// Should test .abort() at this time.

      if ( !nextResult.done ) {
        if ( yieldTimes === this.abortAfterWhichYield ) {
          urlComposer.abort();
        }

        yield nextResult.value;
        ++yieldTimes;
      }    

    } while ( !nextResult.done );

//!!! ...unfinished... (2023/02/23)
// Should test .abort() at this time.


    return nextResult.value;
  }

  /**
   * Try to load differential evolution summary and one of versus.
   *
   * @param {number} abortAfterWhichYield
   *   - negative: never call .abort().
   *   - zero or positive: call .abort() after which times yield.
   */
  async* tester_Summary_and_Versus(
    progressParent,

    spreadsheetId,
    range,
    apiKey,

    bLogFetcherEventToConsole,

    loadingMillisecondsInterval,

    retryWaitingSecondsExponentMax,
    retryWaitingMillisecondsInterval,
  ) {

    this.loadingMillisecondsInterval = loadingMillisecondsInterval;

    this.retryWaitingSecondsExponentMax = retryWaitingSecondsExponentMax;
    this.retryWaitingMillisecondsInterval = retryWaitingMillisecondsInterval;

    // Prepare progress.
    let progress1 = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progress11 = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progress2 = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progress21 = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

  //!!! ...unfinished... (2023/02/21)
  // How to test .abort() in loading and in retry waiting?

    // Without API key.
    let urlComposer1 = GSheets.UrlComposer.Pool.get_or_create_by(
      bLogFetcherEventToConsole, spreadsheetId, range );

    let result1 = yield* this.urlComposer_fetcher( urlComposer1, progress1 );

    // With API key.
    let urlComposer2 = GSheets.UrlComposer.Pool.get_or_create_by(
      bLogFetcherEventToConsole, spreadsheetId, range, apiKey );

    let result2 = yield* this.urlComposer_fetcher( urlComposer2, progress2 );

    // Compare results: should the same.
    if ( !array2d_compare_EQ( result1, result2 ) )
      throw Error( `${result1} != ${result2}` );

    // Test change range.
    if ( result1 ) {
      let newRange = result1[ 0 ][ 0 ];

      urlComposer1.range = newRange;
      let result11 = yield* this.urlComposer_fetcher( urlComposer1, progress11 );

      urlComposer2.range = newRange;
      let result21 = yield* this.urlComposer_fetcher( urlComposer2, progress21 );

      //!!! (2023/02/22 Remarked) It is possible null (e.g. test .abort()).
      // if ( result11 == null )
      //   throw Error( `result11( ${result11} ) should not be null.` );

      // Note: If all cells are empty, GQViz got array with zero length.
      //       But APIv4 got undefined.
      if ( !array2d_compare_EQ( result11, result21 ) )
        throw Error( `${result11} != ${result21}` );

    } else {
      // (e.g. the nework is offline.)
    }

    urlComposer2.disposeResources_and_recycleToPool();
    urlComposer2 = null;

    urlComposer1.disposeResources_and_recycleToPool();
    urlComposer1 = null;
  }

  /** */
  toString() {
    let str =
        `testCaseId=${this.testCaseId}, `
      + `spreadsheetId_postfix=\"${this.spreadsheetId_postfix}\", `
      + `loadingMillisecondsMax=${this.loadingMillisecondsMax}, `
      + `retryTimesMax=${this.retryTimesMax}, `
      + `abortAfterWhichYield=${this.abortAfterWhichYield}, `
      + `bShouldProgress100=${this.bShouldProgress100}`
    return str;
  }
}

//
// spreadsheetId_postfix,
// loadingMillisecondsMax, retryTimesMax, abortAfterWhichYield, bShouldProgress100
//
const gTestCaseArray = [

//!!! ...unfinished... (2023/02/21)
// should also ( loadingMillisecondsMax == 0 )

  // Test ProgressEvent load without status 200.

//!!! (2023/02/22 Temp Remarked) For test retry waiting.
//   // (no retry)
//   new TestCase(  0, "_not_exist", 10 * 1000, 0, -1, false ),
//   new TestCase(  1, "_not_exist", 10 * 1000, 0,  0, false ),
//   new TestCase(  2, "_not_exist", 10 * 1000, 0,  1, false ),
//   new TestCase(  3, "_not_exist", 10 * 1000, 0,  2, false ),

  // (one retry)
  new TestCase(  4, "_not_exist", 10 * 1000, 1, -1, false ),
  new TestCase(  5, "_not_exist", 10 * 1000, 1,  0, false ),
  new TestCase(  6, "_not_exist", 10 * 1000, 1,  1, false ),
  new TestCase(  7, "_not_exist", 10 * 1000, 1,  2, false ),

  // (two retry)
  new TestCase(  8, "_not_exist", 10 * 1000, 2, -1, false ),
  new TestCase(  9, "_not_exist", 10 * 1000, 2,  0, false ),
  new TestCase( 10, "_not_exist", 10 * 1000, 2,  1, false ),
  new TestCase( 11, "_not_exist", 10 * 1000, 2,  2, false ),

  // Test ProgressEvent timeout.

//!!! (2023/02/22 Temp Remarked) For test retry waiting.
//   // (no retry)
//   new TestCase( 12, "",  0.01 * 1000, 0, -1, false ),
//   new TestCase( 13, "",  0.01 * 1000, 0,  0, false ),
//   new TestCase( 14, "",  0.01 * 1000, 0,  1, false ),
//   new TestCase( 15, "",  0.01 * 1000, 0,  2, false ),

  // (one retry)
  new TestCase( 16, "",  0.01 * 1000, 1, -1, false ),
  new TestCase( 17, "",  0.01 * 1000, 1,  0, false ),
  new TestCase( 18, "",  0.01 * 1000, 1,  1, false ),
  new TestCase( 19, "",  0.01 * 1000, 1,  2, false ),

  // (two retry)
  new TestCase( 20, "",  0.01 * 1000, 2, -1, false ),
  new TestCase( 21, "",  0.01 * 1000, 2,  0, false ),
  new TestCase( 22, "",  0.01 * 1000, 2,  1, false ),
  new TestCase( 23, "",  0.01 * 1000, 2,  2, false ),

  // Test abort or succeeded.
  // (one retry)
  new TestCase( 24, "", 30 * 1000, 1, -1,  true ),
  new TestCase( 25, "", 30 * 1000, 1,  0, false ),
  new TestCase( 26, "", 30 * 1000, 1,  1, false ),
  new TestCase( 27, "", 30 * 1000, 1,  2, false ),

//!!! ...unfinished... (2023/02/22)
// should test infinite retry.
];

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

  let spreadsheetId = "18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M";
  let range = "A:A";
  let apiKey = "AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU";

  // const bLogFetcherEventToConsole = false;
  const bLogFetcherEventToConsole = true; // For debug.

  const loadingMillisecondsInterval = 10 * 1000;

  const retryWaitingSecondsExponentMax = 6; // i.e. ( <= 64 seconds )
  const retryWaitingMillisecondsInterval = 10 * 1000;

  // Every test case has its own progressParent.
  let progressRoot = progressParent.root_get();
  let progressTestCaseArray = new Array( gTestCaseArray.length );
  for ( let i = 0; i < gTestCaseArray.length; ++i ) {
    progressTestCaseArray[ i ] = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  }

  // Try every test case.
  for ( let i = 0; i < gTestCaseArray.length; ++i ) {
    let testCase = gTestCaseArray[ i ];
    let progressTestCase = progressTestCaseArray[ i ];

    if ( bLogFetcherEventToConsole ) {
      console.log(`testCase={ ${testCase.toString()} }` );
    }

    let spreadsheetId_test = spreadsheetId + testCase.spreadsheetId_postfix;
    let testGenerator = testCase.tester_Summary_and_Versus(
      progressTestCase,

      spreadsheetId_test, range, apiKey,

      bLogFetcherEventToConsole,

      loadingMillisecondsInterval,

      retryWaitingSecondsExponentMax,
      retryWaitingMillisecondsInterval,
    );

    yield* testGenerator;

    if ( testCase.bShouldProgress100 ) {

      if ( progressTestCase.valuePercentage != 100 )
        throw Error( `GSheets_tester.tester(): `
          + `testCase={ ${testCase.toString()} }, `
          + `progressTestCase.valuePercentage (${progressTestCase.valuePercentage} ) `
          + `should be 100.` );

    } else {

      if ( progressTestCase.valuePercentage == 100 )
        throw Error( `GSheets_tester.tester(): `
          + `testCase={ ${testCase.toString()} }, `
          + `progressTestCase.valuePercentage (${progressTestCase.valuePercentage} ) `
          + `should not be 100.` );

      // For failed network request (e.g. abort, error, load without tatus 200,
      // timeout), drop its (not 100%) progress so that the total progress could
      // still 100% (suppose that there at least one TestCase (e.g. the last
      // TestCase) is succeeded).
      //
      progressParent.child_dispose( progressTestCase );

      // Because the above dropping will also change progressParent.valuePercentage
      // (may increase or decrease), it is necessary to inform outside.
      //
      yield progressRoot;
    }
  }

//!!! ...unfinished... (2023/02/22)
// How to ensure calling .abort() during retry waiting?

//!!! ...unfinished... (2023/02/22)
// Calling .abort() wil not cause retry...

//!!! ...unfinished... (2023/02/22)
// How to test error and re-try?

//!!! ...unfinished... (2023/02/21)
// How to test .abort() in loading and in retry waiting?

//!!! ...unfinished... (2023/02/22)
// simulate network offline.




//!!! (2023/02/23 Remarked) Old Codes.
//
// //!!! ...unfinished... (2023/02/14) timeout and re-try?
//   //const loadingMillisecondsMax = 2 * 1000; // 2 seconds.
//   //const loadingMillisecondsMax = 10 * 1000; // 10 seconds.
//   //const loadingMillisecondsMax = 2 * 60 * 1000; // 2 minutes.
//   //const loadingMillisecondsMax = 3 * 60 * 1000; // 3 minutes.
//   //const loadingMillisecondsMax = 10 * 60 * 1000; // 10 minutes.
//   const loadingMillisecondsMax = 30 * 60 * 1000; // 30 minutes.
//   //const loadingMillisecondsMax = 0; // no timeout.
//
//   let progressNotExist1 = progressParent.child_add(
//     ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progressNotExist2 = progressParent.child_add(
//     ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progress1 = progressParent.child_add(
//     ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progress11 = progressParent.child_add(
//     ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progress2 = progressParent.child_add(
//     ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   let progress21 = progressParent.child_add(
//     ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
//
//   // Without API key, and error.
//   let testerNotExist1 = GSheets.UrlComposer.Pool.get_or_create_by(
//     bLogFetcherEventToConsole, spreadsheetId + "_not_exist", range );
//
//   let fetcherNotExist1 = testerNotExist1
//     .JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
//       progressNotExist1, timeoutMilliseconds );
//   let resultNotExist1 = yield* fetcherNotExist1;
//
//   // With API key, and error.
//   let testerNotExist2 = GSheets.UrlComposer.Pool.get_or_create_by(
//     bLogFetcherEventToConsole, spreadsheetId + "_not_exist", range, apiKey );
//
//   let fetcherNotExist2 = testerNotExist2
//     .JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
//       progressNotExist2, timeoutMilliseconds );
//   let resultNotExist2 = yield* fetcherNotExist2;
//
//   testerNotExist2?.disposeResources_and_recycleToPool();
//   testerNotExist2 = null;
//
//   testerNotExist1?.disposeResources_and_recycleToPool();
//   testerNotExist1 = null;
//
//
//   // Without API key.
//   let tester1 = GSheets.UrlComposer.Pool.get_or_create_by(
//     bLogFetcherEventToConsole, spreadsheetId, range );
//   let fetcher1 = tester1.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
//     progress1, timeoutMilliseconds );
//   let result1 = yield* fetcher1;
//
//   // With API key.
//   let tester2 = GSheets.UrlComposer.Pool.get_or_create_by(
//     bLogFetcherEventToConsole, spreadsheetId, range, apiKey );
//   let fetcher2 = tester2.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
//     progress2, timeoutMilliseconds );
//   let result2 = yield* fetcher2;
//
//   // Compare results: should the same.
//   if ( !array2d_compare_EQ( result1, result2 ) )
//     throw Error( `${result1} != ${result2}` );
//
//   // Test change range.
//   if ( result1 ) {
//     let newRange = result1[ 0 ][ 0 ];
//     tester1.range = newRange;
//     let fetcher11 = tester1.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
//       progress11, timeoutMilliseconds );
//     let result11 = yield* fetcher11;
//
//     tester2.range = newRange;
//     let fetcher21 = tester2.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
//       progress21, timeoutMilliseconds );
//     let result21 = yield* fetcher21;
//
//     if ( result11 == null )
//       throw Error( `result11( ${result11} ) should not be null.` );
//
//     // Note: If all cells are empty, GQViz got array with zero length.
//     //       But APIv4 got undefined.
//
//     if ( !array2d_compare_EQ( result11, result21 ) )
//       throw Error( `${result11} != ${result21}` );
//
//   } else {
//     // (e.g. the nework is offline.)
//   }
//
//   tester2.disposeResources_and_recycleToPool();
//   tester2 = null;
//
//   tester1.disposeResources_and_recycleToPool();
//   tester1 = null;


  console.log( "GSheet download testing... Done." );
}
