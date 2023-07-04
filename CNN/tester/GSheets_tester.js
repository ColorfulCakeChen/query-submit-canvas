export { tester };

import * as GSheets from "../util/GSheets.js";
import * as HttpRequest from "../util/HttpRequest.js";
import * as PartTime from "../util/PartTime.js";
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

//!!! ...unfinshed... (2023/04/01)
// What about abort() at not_yet_started, starting, started, stopping, stopped
// of loading and retry waiting?
//
// Problem: There is no yield at all these points.

/**
 * Whether and when to call .abort().
 *
 * @member {boolean} beforeFetching
 *   True means call .abort() before HttpRequest.Fetcher created.
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

  /**
   * @return {boolean}
   *   Return true, if .abort() is wanted to be called at some time.
   */
  get wantAbort() {
    if ( this.beforeFetching )
      return true;
    if ( this.afterHowManyNext >= 0 )
      return true;
    return false;
  }

  /**
   * @return {boolean}
   *   Return true, if .abort() is wanted to be called during loading phase.
   */
  get wantAbort_DuringLoading() {
    if ( this.beforeFetching )
      return false;
    if ( this.afterHowManyNext >= 0 )
      if ( !this.duringRetryWaiting )
        return true;
    return false;
  }

  /**
   * @return {boolean}
   *   Return true, if .abort() is wanted to be called during retry waiting
   * phase.
   */
  get wantAbort_DuringRetryWaiting() {
    if ( this.beforeFetching )
      return false;
    if ( this.afterHowManyNext >= 0 )
      if ( this.duringRetryWaiting )
        return true;
    return false;
  }

  /**
   * @param  {boolean} bShouldProgress100Default
   *   Whether the test case is expected to be succeeded by default.
   *
   * @return {boolean}
   *   Return whether the test case is expected to be succeeded according to
   * bShouldProgress100Default and this .abort() calling mode.
   */
  bShouldProgress100_by( bShouldProgress100Default ) {
    if ( !bShouldProgress100Default )
      return false; // Never succeeded, since it is expected failed.

    // Since expected succeeded, the test case should be succeeded if we do
    // not want to abort it.
    if ( !this.wantAbort )
      return true;

    // Since expected succeeded, the test case should be succeeded even if
    // we want to abort during loading phase after the 2nd .next().
    //
    // The reason is that the request may always have been succeeded before
    // .abort() is called.
    if ( this.wantAbort_DuringLoading ) // in loading phase.
      if ( this.afterHowManyNext >= 2 ) // too late to .abort()
        return true;

    // Since expected succeeded, the test case should be succeeded even if
    // we want to abort during retry waiting phase.
    //
    // The reason is that the test case never reaches retry waiting phase
    // because it will have been succeeded before retry waiting phase.
    if ( this.wantAbort_DuringRetryWaiting )
      return true;

    // Otherwise, the test case will be failed (by being aborted).
    return false;
  }

  /** */
  toString() {
    let str =
        `beforeFetching=${this.beforeFetching}, `
      + `duringRetryWaiting=${this.duringRetryWaiting}, `
      + `afterHowManyNext=${this.afterHowManyNext}, `
      + `wantAbort=${this.wantAbort}`
    return str;
  }

  /**
   * @param {number} number_N1_6
   *   - negative: never call .abort().
   *   - 0: call .abort() before HttpRequest.Fetcher created.
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
   * @param {string} spreadsheetUrlPrefix
   *   The spreadsheet url (for testing ProgressEvent error). If null, use
   * default (correct) url.
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
   *   True means the test should result in
   * ( progressParent.valuePercentage == 100 ).
   *
   * @param {boolean} bShouldProgress100Default
   *   True means the test is expected to result in
   * ( progressParent.valuePercentage == 100 ) if without .abort().
   */
  constructor(
    testCaseId,
    spreadsheetUrlPrefix, spreadsheetId_postfix,
    loadingMillisecondsMax,
    retryTimesMax,
    abortTestMode,
    bShouldProgress100,
    bShouldProgress100Default
  ) {
    this.testCaseId = testCaseId;
    this.spreadsheetUrlPrefix = spreadsheetUrlPrefix;
    this.spreadsheetId_postfix = spreadsheetId_postfix;
    this.loadingMillisecondsMax = loadingMillisecondsMax;
    this.retryTimesMax = retryTimesMax;
    this.abortTestMode = abortTestMode;
    this.bShouldProgress100 = bShouldProgress100;
    this.bShouldProgress100Default = bShouldProgress100Default;
  }

  /**
   * Check: For a new urlComposer, all properties (except .spreadsheetId,
   * .range, .apiKey, .headers) should be undefined.
   */
  urlComposer_properties_undefined( urlComposer, funcNameInMessage ) {
    for ( let p in urlComposer ) {
      let propertyValue = urlComposer[ p ];
      if ( propertyValue != undefined )
        if (   ( p != "spreadsheetId" )
            && ( p != "range" )
            && ( p != "apiKey" )
            && ( p != "headers" )
           )
        throw Error( `GSheets_tester.TestCase`
          + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
          + `urlComposer.${p} ( ${urlComposer[ p ]} ) `
          + `should be undefined.` );
    }
  }

  /** Test reenter. */
  urlComposer_reenter_test( urlComposer, funcNameInMessage ) {

    // Test: Reenter .fetch_asyncPromise_create()
    //       should throw exception.
    try {
      urlComposer.fetch_asyncPromise_create();
    } catch ( e ) {
      if ( e.message.indexOf( ".fetch_asyncPromise_create():" ) > 0 ) {
        // progressToAdvance.value_advance();
        // yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `GSheets_tester.TestCase.${funcNameInMessage}(): `
          + `testCaseId=${this.testCaseId}, ${e}`, { cause: e } );
      }
    }

    // Test: Reenter .fetch_asyncGenerator_create()
    //       should throw exception.
    try {
      urlComposer.fetch_asyncGenerator_create();
    } catch ( e ) {
      if ( e.message.indexOf( ".fetch_asyncGenerator_create():" ) > 0 ) {
        // progressToAdvance.value_advance();
        // yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `GSheets_tester.TestCase.${funcNameInMessage}(): `
          + `testCaseId=${this.testCaseId}, ${e}`, { cause: e } );
      }
    }

    // Test: Reenter .fetch_asyncGenerator_create_with_asyncPromise_progress()
    //       should throw exception.
    try {
      urlComposer.fetch_asyncGenerator_create_with_asyncPromise_progress();
    } catch ( e ) {
      if ( e.message.indexOf(
             ".fetch_asyncGenerator_create_with_asyncPromise_progress():" )
               > 0 ) {
        // progressToAdvance.value_advance();
        // yield progressRoot;
      } else { // Unknown error, said loudly.
        throw Error( `GSheets_tester.TestCase.${funcNameInMessage}(): `
          + `testCaseId=${this.testCaseId}, ${e}`, { cause: e } );
      }
    }
  }

  /** Check running flags should false. */
  urlComposer_throw_if_running( urlComposer, funcNameInMessage ) {

    if ( urlComposer.fetch_asyncPromise_running )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetch_asyncPromise_running `
        + `( ${urlComposer.fetch_asyncPromise_running} ) `
        + `should be false.` );

    if ( urlComposer.fetch_asyncGenerator_running )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetch_asyncGenerator_running `
        + `( ${urlComposer.fetch_asyncGenerator_running} ) `
        + `should be false.` );
  }

  /**
   * Test .fetch_asyncPromise_create() and reenter.
   *
   * @return {Array[]} Return the fetched column major array of array.
   */
  async urlComposer_test_fetch_asyncPromise_async(
    urlComposer, params_loading_retryWaiting, funcNameInMessage ) {

    // Ensure not retry forever.
    let params_loading_retryWaiting_clone;
    {
      params_loading_retryWaiting_clone
        = Object.assign( {}, params_loading_retryWaiting );

      params_loading_retryWaiting_clone.retryTimesMax = 0;
    }

    let delayPromise = PartTime.Promise_resolvable_rejectable_create();

    let fetch_asyncPromise = urlComposer.fetch_asyncPromise_create(
      params_loading_retryWaiting_clone, delayPromise );

    if ( !urlComposer.fetch_asyncPromise_running )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetch_asyncPromise_running=`
        + `${urlComposer.fetch_asyncPromise_running} `
        + `should be true.` );

    // Before fetching done, progress should not be 100%.
    if ( 100 == urlComposer.fetch_asyncPromise_progress.valuePercentage )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetch_asyncPromise_progress.valuePercentage `
        + `( ${urlComposer.fetch_asyncPromise_progress.valuePercentage} ) `
        + `should not be 100.` );

    this.urlComposer_reenter_test( urlComposer, funcNameInMessage );
    delayPromise.resolve(); // After reenter testing.

    let fetchResult = await fetch_asyncPromise;

    this.urlComposer_throw_if_running( urlComposer, funcNameInMessage );
    return fetchResult;
  }

  /** Test .fetch_asyncPromise and ensure it is failed. */
  async urlComposer_test_fetch_asyncPromise_failed_async(
    urlComposer, params_loading_retryWaiting, funcNameInMessage ) {

    let fetchResult = await this.urlComposer_test_fetch_asyncPromise_async(
        urlComposer, params_loading_retryWaiting, funcNameInMessage );

    // Failed fetching should get null.
    if ( fetchResult != null )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetch_asyncPromise_create() `
        + `result=${fetchResult} `
        + `should be null.` );

    // Failed fetching should not get 100%.
    if ( 100 == urlComposer.fetch_asyncPromise_progress.valuePercentage )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetch_asyncPromise_progress.valuePercentage `
        + `( ${urlComposer.fetch_asyncPromise_progress.valuePercentage} ) `
        + `should not be 100.` );

    // Failed fetching should get false.
    if ( urlComposer.fetchOk )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetchOk ( ${urlComposer.fetchOk} ) `
        + `should be falsy.` );

    return fetchResult;
  }

  /** Test .fetch_asyncPromise and ensure it is succeeded. */
  async urlComposer_test_fetch_asyncPromise_succeeded_async(
    urlComposer, params_loading_retryWaiting, funcNameInMessage ) {

    let fetchResult = await this.urlComposer_test_fetch_asyncPromise_async(
        urlComposer, params_loading_retryWaiting, funcNameInMessage );

    // Failed fetching should get null.
    if ( fetchResult == null )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetch_asyncPromise_create() `
        + `result=${fetchResult} `
        + `should not be null.` );

    // Succeeded fetching should get 100%.
    if ( 100 !== urlComposer.fetch_asyncPromise_progress.valuePercentage )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetch_asyncPromise_progress.valuePercentage `
        + `( ${urlComposer.fetch_asyncPromise_progress.valuePercentage} ) `
        + `should be 100.` );

    // Succeeded fetching should get true.
    if ( !urlComposer.fetchOk )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetchOk ( ${urlComposer.fetchOk} ) `
        + `should be truthy.` );

    return fetchResult;
  }

  /** */
  check_progressLoading_progressRetryWaiting(
    urlComposer, bRetryWaitingCurrent, funcNameInMessage ) {

    let httpRequestFetcher = urlComposer.httpRequestFetcher;

    // The fetching was done (including failed or aborted). No
    // .httpRequestFetcher could be checked.
    if ( !httpRequestFetcher )
      return;

    let progressLoading = httpRequestFetcher.progressLoading;
    let progressRetryWaiting = httpRequestFetcher.progressRetryWaiting;

    // 1. phase changes from loading to retry waiting.
    if ( bRetryWaitingCurrent ) {

      // 1.1
      if ( 0 !== progressLoading.valuePercentage )
        throw Error( `GSheets_tester.TestCase`
          + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
          + `When phase changes from loading to retry waiting, `
          + `.progressLoading.valuePercentage (`
          + `${progressLoading.valuePercentage} ) `
          + `should be 0.` );

      // 1.2
      if ( 0 !== progressRetryWaiting.valuePercentage )
        throw Error( `GSheets_tester.TestCase`
          + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
          + `When phase changes from loading to retry waiting, `
          + `.progressRetryWaiting.valuePercentage ( `
          + `${progressRetryWaiting.valuePercentage} ) `
          + `should be 0.` );

    // 2. phase changes from retry waiting to loading.
    } else {

      // 2.1
      if ( 0 !== progressLoading.valuePercentage )
        throw Error( `GSheets_tester.TestCase`
          + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
          + `When phase changes from retry waiting to loading, `
          + `.progressLoading.valuePercentage ( `
          + `${progressLoading.valuePercentage} ) `
          + `should be 0.` );

      // 2.2
      let retryTimes_isRunOut = httpRequestFetcher.retryTimes_isRunOut;
      if ( retryTimes_isRunOut ) { // 2.2.1

        // Note: In fact, at the end of retry waiting (i.e. not only here),
        // progressRetryWaiting have been disposed. However, there is no yield
        // at that point. So, check it at the beginning of loading.
        if ( progressRetryWaiting )
          throw Error( `GSheets_tester.TestCase`
            + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
            + `When phase changes from retry waiting to loading, `
            + `.progressRetryWaiting ( ${progressRetryWaiting} ) `
            + `should be null, if retryTimes_isRunOut `
            + `( ${retryTimes_isRunOut} ) is true.` );

      } else { // 2.2.2

        let retryTimesCur = httpRequestFetcher.retryTimesCur;
        if ( retryTimesCur == 0 ) { // Not yet begin any retry.

          if ( progressRetryWaiting )
            throw Error( `GSheets_tester.TestCase`
              + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
              + `When phase changes from retry waiting to loading, `
              + `if not yet begin any retry (i.e. retryTimesCur `
              + `( ${retryTimesCur} ) is 0), `
              + `.progressRetryWaiting ( ${progressRetryWaiting} ) `
              + `should be null, even if retryTimes_isRunOut `
              + `( ${retryTimes_isRunOut} ) is false.` );

        } else if ( retryTimesCur > 0 ) { // during retry loading.

          if ( 100 !== progressRetryWaiting.valuePercentage )
            throw Error( `GSheets_tester.TestCase`
              + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
              + `When phase changes from retry waiting to loading, `
              + `if has begun any retry (i.e. retryTimesCur `
              + `( ${retryTimesCur} ) is greater than 0), `
              + `.progressRetryWaiting.valuePercentage ( `
              + `${progressRetryWaiting.valuePercentage} ) `
              + `should be 100, if retryTimes_isRunOut `
              + `( ${retryTimes_isRunOut} ) is false.` );

        } else { // ( retryTimesCur < 0 )
          throw Error( `GSheets_tester.TestCase`
          + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
          + `When phase changes from retry waiting to loading, `
          + `.retryTimesCur ( ${retryTimesCur} ) should not be negative.` );
        }
      }

    }
  }

  /**
   * Try to load differential evolution summary and one of versus.
   *
   * @param {GSheets.UrlComposer} urlComposer
   *   The urlComposer.fetch_asyncGenerator() will be
   * called and advanced until done.
   *
   * @return {Array[]}
   *   - Return ( a two dimension (column-major) array ) when successfully.
   *   - Return null when failed.
   */
  async* urlComposer_fetcher( urlComposer, progressParent ) {
    const funcNameInMessage = "urlComposer_fetcher";

    let progressRoot = progressParent.root_get();

    let progressFetch = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let params_loading_retryWaiting
      = new HttpRequest.Params_loading_retryWaiting(
          this.loadingMillisecondsMax,
          this.loadingMillisecondsInterval,
          this.retryTimesMax,
          this.retryWaitingSecondsExponentMax,
          this.retryWaitingMillisecondsInterval
        );

    // For test case always is failed (even without aborting), it can test
    // .fetch_asyncPromise_create() (and reenter) before
    // .fetch_asyncGenerator_create() and should also be failed.
    if ( this.bShouldProgress100Default == false ) {
      await this.urlComposer_test_fetch_asyncPromise_failed_async(
        urlComposer, params_loading_retryWaiting, funcNameInMessage );
    }

    let delayPromise = PartTime.Promise_resolvable_rejectable_create();

    // Test .abort() before HttpRequest.Fetcher created.
    if ( this.abortTestMode.beforeFetching ) {
      urlComposer.abort();
    }

    let fetcher = urlComposer
      .fetch_asyncGenerator_create(
        progressFetch, params_loading_retryWaiting, delayPromise );

    if ( !urlComposer.fetch_asyncGenerator_running )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `urlComposer.fetch_asyncGenerator_running=`
        + `${urlComposer.fetch_asyncGenerator_running} `
        + `should be true.` );

    // Test reenter.
    this.urlComposer_reenter_test( urlComposer, funcNameInMessage );
    delayPromise.resolve(); // After reenter testing.

    //
    let nextResult;

    // Since just beginning, it should be in loading phase.
    //
    // Note: Can not call urlComposer.retryWaiting_during (which will get
    //       undefined) here because .httpRequestFetcher has not yet been
    //       created.
    let bRetryWaitingPrevious = false;
    let bRetryWaitingCurrent = bRetryWaitingPrevious;

    let nextTimes = 0, nextTimes_loading = 0, nextTimes_retryWaiting = 0;
    do {

      // Call .abort() if .next() has been called as specified times
      // in specified phase.
      if ( this.abortTestMode.afterHowManyNext >= 0 ) {
        if ( bRetryWaitingCurrent ) {
          if ( this.abortTestMode.duringRetryWaiting )
            if ( nextTimes_retryWaiting
                   === this.abortTestMode.afterHowManyNext )
              urlComposer.abort();
        } else {
          if ( !this.abortTestMode.duringRetryWaiting )
            if ( nextTimes_loading === this.abortTestMode.afterHowManyNext )
              urlComposer.abort();
        }
      }

      // Call .next()
      nextResult = await fetcher.next();
      ++nextTimes;

      // Check: progressLoading and progressRetryWaiting for 1st time loading.
      if ( 1 == nextTimes )
        this.check_progressLoading_progressRetryWaiting(
          urlComposer, bRetryWaitingCurrent, funcNameInMessage );

//!!! ...unfinished... (2023/04/01)
// Perhaps, compare nextTimes_Xxx and httpRequestFetcher.XxxYieldIdCurrent.

      // Accumulate how many times .next() is called.
      if ( bRetryWaitingCurrent )
        ++nextTimes_retryWaiting;
      else
        ++nextTimes_loading;

      // When phase changs between loading and retry waiting.
      bRetryWaitingCurrent = urlComposer.retryWaiting_during;
      if ( bRetryWaitingPrevious != bRetryWaitingCurrent ) {
        bRetryWaitingPrevious = bRetryWaitingCurrent;

        // Reset nextTimes_Xxx (according to CURRENT phase).
        if ( bRetryWaitingCurrent )
          nextTimes_retryWaiting = 0;
        else
          nextTimes_loading = 0;

        // Check: progressLoading and progressRetryWaiting.
        this.check_progressLoading_progressRetryWaiting(
          urlComposer, bRetryWaitingCurrent, funcNameInMessage );
      }

      if ( !nextResult.done ) {
        yield nextResult.value; // Report progress.
      }

    } while ( !nextResult.done );

    this.urlComposer_throw_if_running( urlComposer, funcNameInMessage );

    let fetch_asyncGenerator_result = nextResult.value;

    if ( 
           // If the request is expected to succeeded, testing
           // .fetch_asyncPromise_create() should also be succeeded.
           ( this.bShouldProgress100 )
     
           // If the request is expected to failed (even without aborting),
           // testing .fetch_asyncPromise_create() should also be failed.
        || ( this.bShouldProgress100Default == false ) ) {

      let fetch_asyncPromise_result;
      if ( this.bShouldProgress100 ) {
        fetch_asyncPromise_result
          = await this.urlComposer_test_fetch_asyncPromise_succeeded_async(
              urlComposer, params_loading_retryWaiting, funcNameInMessage );
      } else {
        fetch_asyncPromise_result
          = await this.urlComposer_test_fetch_asyncPromise_failed_async(
              urlComposer, params_loading_retryWaiting, funcNameInMessage );
      }
  
      if ( !array2d_compare_EQ(
             fetch_asyncGenerator_result, fetch_asyncPromise_result ) )
        throw Error( `GSheets_tester.TestCase`
          + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
          + `fetch_asyncGenerator_result ( ${fetch_asyncGenerator_result} ) `
          + `should be the same as `
          + `fetch_asyncPromise_result ( ${fetch_asyncPromise_result} )`
        );
    }

    return fetch_asyncGenerator_result;
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
    const funcNameInMessage = "tester_Summary_and_Versus";

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
    let urlComposer1 = GSheets.UrlComposer_Pool_get_or_create_by(
      spreadsheetId, range );

    this.urlComposer_properties_undefined( urlComposer1, funcNameInMessage );

    if ( this.spreadsheetUrlPrefix )
      urlComposer1.spreadsheetUrlPrefix = this.spreadsheetUrlPrefix;

    urlComposer1.bLogFetcherEventToConsole = bLogFetcherEventToConsole;
    let result1 = yield* this.urlComposer_fetcher( urlComposer1, progress1 );

    // With API key.
    let urlComposer2 = GSheets.UrlComposer_Pool_get_or_create_by(
      spreadsheetId, range, apiKey );

    this.urlComposer_properties_undefined( urlComposer2, funcNameInMessage );

    if ( this.spreadsheetUrlPrefix )
      urlComposer2.spreadsheetUrlPrefix = this.spreadsheetUrlPrefix;

    urlComposer2.bLogFetcherEventToConsole = bLogFetcherEventToConsole;
    let result2 = yield* this.urlComposer_fetcher( urlComposer2, progress2 );

    // Compare results: should the same.
    if ( !array2d_compare_EQ( result1, result2 ) )
      throw Error( `GSheets_tester.TestCase`
        + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
        + `result1 ( ${result1} ) `
        + `should be the same as `
        + `result2 ( ${result2} )`
      );

    // Test change range.
    if ( result1 ) {
      let newRange = result1[ 0 ][ 0 ];

      urlComposer1.range = newRange;
      let result11
        = yield* this.urlComposer_fetcher( urlComposer1, progress11 );

      urlComposer2.range = newRange;
      let result21
        = yield* this.urlComposer_fetcher( urlComposer2, progress21 );

      if ( this.bShouldProgress100 ) { // If the request is expected to succeeded,
        if ( result11 == null )        // it should have non-null result.
          throw Error( `GSheets_tester.TestCase`
            + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
            + `result11 ( ${result11} ) should not be null `
            + `when ( .bShouldProgress100 == true ).`
          );

        // Succeeded fetching should get true.
        if ( !urlComposer1.fetchOk || !urlComposer2.fetchOk )
          throw Error( `GSheets_tester.TestCase`
            + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
            + `urlComposer1.fetchOk ( ${urlComposer1.fetchOk} ) and `
            + `urlComposer2.fetchOk ( ${urlComposer2.fetchOk} ) `
            + `should be truthy.` );
      }

      // Note: If all cells are empty, GQViz got array with zero length.
      //       But APIv4 got undefined.
      if ( !array2d_compare_EQ( result11, result21 ) )
        throw Error( `GSheets_tester.TestCase`
          + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
          + `result11 ( ${result11} ) `
          + `should be the same as `
          + `result21 ( ${result21} )`
        );

    } else {
      // (e.g. the nework is offline.)

      // Failed fetching should get false.
      if ( urlComposer1.fetchOk || urlComposer2.fetchOk )
        throw Error( `GSheets_tester.TestCase`
          + `.${funcNameInMessage}(): testCaseId=${this.testCaseId}, `
          + `urlComposer1.fetchOk ( ${urlComposer1.fetchOk} ) and `
          + `urlComposer2.fetchOk ( ${urlComposer2.fetchOk} ) `
          + `should be falsy.` );
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
      + `spreadsheetUrlPrefix=${ this.spreadsheetUrlPrefix
          ? `\"${this.spreadsheetUrlPrefix}\"` : null }, `
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
   *   - True means the test case is expected to be succeeded if .abort() is
   *       not called.
   *   - False means the test case is expected to be failed even if .abort() is
   *       not called.
   *
   * @return {TestCaseArray} Return this for cascading appending.
   */
  append_by(
    spreadsheetUrlPrefix, spreadsheetId_postfix,
    loadingMillisecondsMax, bShouldProgress100Default ) {

    const retryTimesMax_begin = -1; // infinite retry.
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
        abortTestMode
          = AbortTestMode.create_by_number_N1_6( abortTestMode_number );

        bShouldProgress100
          = abortTestMode.bShouldProgress100_by( bShouldProgress100Default );

        if ( bShouldProgress100 ) {

          // If the test case will be succeeded even with .abort(), there
          // is not necessary to test it.
          //
          // It means the .abort() has no chance to be called before the test
          // case succeeded. So, it is just the same as testing without
          // .abort() which has already been tested by other test case.
          if ( abortTestMode.wantAbort )
            continue; // Otherwise, the test case will be test duplicately.

        } else { // The test case expected to be failed.
          if ( retryTimesMax < 0 ) { // Infinite retry.

            // If the test case expected to be failed, do not infinite retry
            // without .abort().
            if ( !abortTestMode.wantAbort )
              continue; // Otherwise, the test case will never end.

            // Even if with .abort(), if the test case expected to be failed,
            // do not infinite retry if .abort() is called in loading phase
            // after the 2nd .next().
            //
            // The reason is that the request may be always failed before
            // .abort() is called so that the retry will be forever.
            //
            if ( abortTestMode.wantAbort_DuringLoading ) // in loading phase.
              if ( abortTestMode.afterHowManyNext >= 2 ) // too late to .abort()
                continue; // Otherwise, the test case may never end.
          }
        }

        let testCase = new TestCase( testCaseId,
          spreadsheetUrlPrefix, spreadsheetId_postfix,
          loadingMillisecondsMax, retryTimesMax, abortTestMode,
          bShouldProgress100, bShouldProgress100Default );

        this.push( testCase );
      }
    }

    return this;
  }
}

//
// spreadsheetUrlPrefix, spreadsheetId_postfix,
// loadingMillisecondsMax, bShouldProgress100Default
//
const gTestCaseArray = new TestCaseArray();
{
  gTestCaseArray
    .append_by( null, "",        60 * 1000,  true ) // succeeded.
    .append_by( null, "",         0 * 1000,  true ) // succeeded. (no timeout)

//!!! (2023/02/25 Temp Remarked) For only test long pending of succeeded loading.
    .append_by( "https:/", "",   10 * 1000, false ) // error. (Invalid URL)
    .append_by( "https:/", "",    0 * 1000, false ) // error. (Invalid URL) (no timeout)
    .append_by( null, "_none",   10 * 1000, false ) // load (status != 200).
    .append_by( null, "_none",    0 * 1000, false ) // load (status != 200). (no timeout)
    .append_by( null, "",      0.01 * 1000, false ) // timeout.
    ;
}

/**
 *
 * @param {ValueMax.Percentage.Aggregate} progressParent
 *   Some new progressToAdvance will be created and added to progressParent.
 * The created progressToAdvance will be increased when every time advanced.
 * The progressParent.root_get() will be returned when every time yield.
 *
 */
async function* tester( progressParent ) {
  console.log( "GSheet download testing..." );

  let spreadsheetId = "1TbZWN4vGQ2SX4LsLCadYqxiJ0Zka8V0Y-ftDH5F5-R4";
  let range = "A:A";
  let apiKey = "AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU";

  // const bLogFetcherEventToConsole = false;
  const bLogFetcherEventToConsole = true; // For debug.

  // Note1: Use shorter loading timer interval to ensure it will be triggered.
  // Note2: Let xxxMax can not be divided by XxxInterval for testing XxxCur
  //        exceeding xxxMax.
  //const loadingMillisecondsInterval = 5 * 1000;
  const loadingMillisecondsInterval = 0.503 * 1000;

  const retryWaitingSecondsExponentMax = 6; // i.e. ( <= 64 seconds )

  // Note: Let xxxMax can not be divided by XxxInterval for testing XxxCur
  //       exceeding xxxMax.
  //const retryWaitingMillisecondsInterval = 1 * 1000;
  const retryWaitingMillisecondsInterval = 1.06 * 1000;

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
          + `progressTestCase.valuePercentage `
          + `( ${progressTestCase.valuePercentage} ) `
          + `should be 100.` );

    } else {

      if ( progressTestCase.valuePercentage == 100 )
        throw Error( `GSheets_tester.tester(): `
          + `testCase={ ${testCase.toString()} }, `
          + `progressTestCase.valuePercentage `
          + `( ${progressTestCase.valuePercentage} ) `
          + `should not be 100.` );

      // For failed network request (e.g. abort, error, load without tatus 200,
      // timeout), force its progress to 100% (by replacing all its children
      // progresses with a 100% progress) so that the total progress could
      // still 100%.
      //
      // Note: Another possible solution is dropping the (not 100%) progress
      //       from progressParent. However, When
      //       ( progressTestCase.valuePercentage > 0 ), reomving it from
      //       progressParent may make progressParent.valuePercentage backtrack
      //       (i.e. become smaller).
      {
        progressTestCase.child_disposeAll();
        progressTestCase.child_add(
          ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );
        progressTestCase.children[ 0 ].value_set_as_max();
      }

      // Because the above adjusting will also change
      // progressParent.valuePercentage, it is necessary to inform outside.
      //
      yield progressRoot;
    }
  }

//!!! ...unfinished... (2023/02/22)
// simulate network offline.

  console.log( "GSheet download testing... Done." );
}
