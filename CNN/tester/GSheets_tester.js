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
 * @member {boolean} beforeFetching
 *   True means call .abort() before HttpFetcher created.
 *
 * @member {boolean} duringRetryWaiting
 *   True means call .abort() during retry waiting. False means call .abort()
 * during loading.
 *
 * @member {number} afterHowManyNext
 *   - negative: never call .abort() during loading or retry waiting.
 *   - zero or positive: call .abort() after how many .next() is called during
 *       loading or retry waiting (according to duringRetryWaiting).
 */
class AbortTestMode {
  /** */
  constructor( beforeFetching, duringRetryWaiting, afterHowManyNext ) {
    this.beforeFetching = beforeFetching;
    this.duringRetryWaiting = duringRetryWaiting;
    this.afterHowManyNext = afterHowManyNext;
  }

  /** @return {boolean} Return true, if .abort() will be called at some time. */
  get willAbort() {
    if ( this.beforeFetching )
      return true;
    if ( this.afterHowManyNext >= 0 )
      return true;
    return false;
  }

  /** */
  toString() {
    let str =
        `beforeFetching=${this.beforeFetching}, `
      + `duringRetryWaiting=${this.duringRetryWaiting}, `
      + `afterHowManyNext=${this.afterHowManyNext}, `
      + `willAbort=${this.willAbort}`
    return str;
  }

  /**
   * @param {number} number_N1_6
   *   - negative: never call .abort().
   *   - 0: call .abort() before HttpFetcher created.
   *   - 1: call .abort() during loading when .next() is called 0 times.
   *   - 2: call .abort() during loading when .next() is called 1 times.
   *   - 3: call .abort() during loading when .next() is called 2 times.
   *   - 4: call .abort() during retry waiting when .next() is called 0 times.
   *   - 5: call .abort() during retry waiting when .next() is called 1 times.
   *   - 6: call .abort() during retry waiting when .next() is called 2 times.
   */
  static create_by_number_N1_6( number_N1_6 ) {
    if ( number_N1_6 < 0 ) {
      return new AbortTestMode( false, false, -1 );
    } else if ( number_N1_6 == 0 ) {
      return new AbortTestMode( true, false, -1 );
    } else {
      const number_0_5 = ( number_N1_6 - 1 );
      const afterHowManyNextKinds = 3;
      let afterHowManyNext = number_0_5 % afterHowManyNextKinds;

      const number_0_or_3 = ( number_0_5 - afterHowManyNext );
      const number_0_or_1 = ( number_0_or_3 / afterHowManyNextKinds );
      let duringRetryWaiting = ( number_0_or_1 == 1 );

      return new AbortTestMode( false, duringRetryWaiting, afterHowManyNext );
    }
  }
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
   * @param {AbortTestMode} abortTestMode
   *   The mode for testing .abort().
   *
   * @param {boolean} bShouldProgress100
   *   True means the test should result in ( progressParent.valuePercentage == 100 ).
   */
  constructor(
    testCaseId,
    spreadsheetId_postfix,
    loadingMillisecondsMax,
    retryTimesMax,
    abortTestMode,
    bShouldProgress100
  ) {
    this.testCaseId = testCaseId;
    this.spreadsheetId_postfix = spreadsheetId_postfix;
    this.loadingMillisecondsMax = loadingMillisecondsMax;
    this.retryTimesMax = retryTimesMax;
    this.abortTestMode = abortTestMode;
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

    // Test .abort() before HttpFetcher created.
    if ( this.abortTestMode.beforeFetching ) {
      urlComposer.abort();
    }

    let fetcher = urlComposer.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
      progressParent,

      this.loadingMillisecondsMax,
      this.loadingMillisecondsInterval,
    
      this.retryTimesMax,
      this.retryWaitingSecondsExponentMax,
      this.retryWaitingMillisecondsInterval
    );

    let nextResult;
    let bRetryWaitingPrevious = urlComposer.retryWaitingTimer_isCounting();
    let bRetryWaitingCurrent = bRetryWaitingPrevious;
    let nextTimes_loading = 0, nextTimes_retryWaiting = 0;
    do {

      // Call .abort() if .next() has been called as specified times
      // in specified phase.
      if ( this.abortTestMode.afterHowManyNext >= 0 ) {
        if ( bRetryWaitingCurrent ) {
          if ( this.abortTestMode.duringRetryWaiting )
            if ( nextTimes_retryWaiting === this.abortTestMode.afterHowManyNext )
              urlComposer.abort();
        } else {
          if ( !this.abortTestMode.duringRetryWaiting )
            if ( nextTimes_loading === this.abortTestMode.afterHowManyNext )
              urlComposer.abort();
        }
      }

      // Call .next()
      nextResult = await fetcher.next();
      bRetryWaitingCurrent = urlComposer.retryWaitingTimer_isCounting();

      // Accumulate how many times .next() is called (according to PREVIOUS phase).
      if ( bRetryWaitingPrevious )
        ++nextTimes_retryWaiting;
      else
        ++nextTimes_loading;

      // When changing between loading and retry waiting.
      if ( bRetryWaitingPrevious != bRetryWaitingCurrent ) {
        bRetryWaitingPrevious = bRetryWaitingCurrent;

        // Reset nextTimes_Xxx (according to CURRENT phase).
        if ( bRetryWaitingCurrent )
          nextTimes_retryWaiting = 0;
        else
          nextTimes_loading = 0;
      }

      if ( !nextResult.done ) {
        yield nextResult.value;
      }

    } while ( !nextResult.done );

    return nextResult.value;
  }

  /**
   * Try to load differential evolution summary and one of versus.
   *
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

      if ( this.bShouldProgress100 ) // If the request is expected to succeeded,
        if ( result11 == null )      // it should have non-null result.
          throw Error( `result11( ${result11} ) should not be null `
            + `when ( .bShouldProgress100 == true ).`
          );

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
      + `abortTestMode={ ${this.abortTestMode} }, `
      + `bShouldProgress100=${this.bShouldProgress100}`
    return str;
  }
}

/** */
class TestCaseArray extends Array {
  /**
   * @param {boolean} bShouldProgress100Default
   *   - True means the test case is expected to be succeeded if .abort() is not
   *       called.
   *   - False means the test case is expected to be failed even if .abort() is
   *       not called.
   *
   * @return {TestCaseArray} Return this for cascading appending.
   */
  append_by(
    spreadsheetId_postfix, loadingMillisecondsMax, bShouldProgress100Default ) {

    const retryTimesMax_begin = -1; // infinite retry.
//!!! (2023/02/22 Temp Remarked) For test retry waiting.
    // const retryTimesMax_begin = 0; // no retry.
    // const retryTimesMax_begin = 1; // one retry.
    const retryTimesMax_end_inclusive = 2; // two retry.

    // All kinds of AbortTestMode.
    const abortTestMode_number_begin = -1; // never .abort()
    const abortTestMode_number_end_inclusive = 6;

    let testCaseId;
    let abortTestMode;
    let bShouldProgress100;

    for (
        let retryTimesMax = retryTimesMax_begin;
        retryTimesMax <= retryTimesMax_end_inclusive;
        ++retryTimesMax ) {

      for (
        let abortTestMode_number = abortTestMode_number_begin;
        abortTestMode_number <= abortTestMode_number_end_inclusive;
        ++abortTestMode_number ) {

        testCaseId = this.length;
        abortTestMode = AbortTestMode.create_by_number_N1_6( abortTestMode_number );

        // If the test case includes .abort(), it should never be succeeded.
        if ( abortTestMode.willAbort ) {
          bShouldProgress100 = false;

        } else {
          bShouldProgress100 = bShouldProgress100Default;

          // If the test case expected to be failed, do not infinite retry without
          // .abort().
          if ( !bShouldProgress100 )
            if ( retryTimesMax < 0 ) // infinite retry
              continue; // Otherwise, the test case will never end.
        }

        let testCase = new TestCase( testCaseId, spreadsheetId_postfix,
          loadingMillisecondsMax, retryTimesMax, abortTestMode, bShouldProgress100 );

        this.push( testCase );
      }
    }

    return this;
  }
}

//
// spreadsheetId_postfix, loadingMillisecondsMax, bShouldProgress100Default
//
const gTestCaseArray = new TestCaseArray();
{

//!!! ...unfinished... (2023/02/24)
// should test ProgressEvent error. (how?)

  gTestCaseArray
    .append_by( "&",            10 * 1000, false ) // error. (Invalid URL)
    // .append_by( "%",            10 * 1000, false ) // error. (Invalid URL)
    .append_by( "%",             0 * 1000, false ) // error. (Invalid URL) (no timeout)
    // .append_by( "?",            10 * 1000, false ) // error. (Invalid URL)
    .append_by( "_not_exist",   10 * 1000, false ) // load (status != 200).
    .append_by( "_not_exist",    0 * 1000, false ) // load (status != 200). (no timeout)
    .append_by( "",           0.01 * 1000, false ) // timeout.
    .append_by( "",             30 * 1000,  true ) // succeeded.
    .append_by( "",              0 * 1000,  true ) // succeeded. (no timeout)
    ;
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
      console.log(`\ntestCase={ ${testCase.toString()} }` );
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
