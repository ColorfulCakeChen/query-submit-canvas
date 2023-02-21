export { HttpFetcher };

import * as PartTime from "../PartTime.js";
import * as RandTools from "../RandTools.js";
import * as ValueMax from "../ValueMax.js";

/**
 * Wrap XMLHttpRequest as an async generator.
 *
 *
 * @member {boolean} bLogEventToConsole
 *   If true, some debug messages will be logged to console.
 *
 * @member {string} url
 *   A string representing the URL to send the request to.
 *
 * @member {number} loadingMillisecondsMax
 *   The maximum time (in milliseconds) a request can take before automatically
 * being terminated. Default is 0, which means there is no timeout.
 *
 *   - If zero, the progressToAdvance will be advanced by ProgressEvent(
 *       .type = "progress" ).
 *     - This is good if ( .lengthComputable == true ) and network smooth.
 *     - This is bad if ( .lengthComputable == false ) (i.e. progress can not
 *         be calculated by .loaded / .total) or network congested (i.e.
 *         there will be a long pending (no responded in UI)).
 *
 *   - If not zero, the progressToAdvance will be advanced by a timer.
 *       Although this is a kind of fake progress, it provides better user
 *       experience because progress bar is still advancing even if network
 *       congested or server busy.
 *
 * @member {number} loadingMillisecondsInterval
 *   The interval time (in milliseconds) for advancing the loadingMillisecondsCur.
 * Although smaller interval may provide smoother progress advancing, however, too
 * small interval (relative to loadingMillisecondsMax) may not look good because
 * the progress bar may advance too little to be aware by eyes.
 *
 * @member {number} loadingMillisecondsCur
 *   The current time (in milliseconds) of loading. It is only used if
 * ( loadingMillisecondsMax > 0 ).
 *
 * @member {number} retryTimesMax
 *   Retry request so many times at most when request failed (no matter what
 * reason). Noe that there will be some waiting time before next re-try (i.e.
 * truncated binary exponential backoff algorithm).
 *
 *   - Negative value means retry infinite times (i.e. retry forever until
 *       success).
 *
 *   - Zero means never retry (i.e. failed immediately once not success).
 *
 *   - Positive value means retry so many times at most.
 *
 * @member {number} retryTimesCur
 *   How many times has been retried.
 *
 * @member {number} retryWaitingMillisecondsExponentMax
 *   The maximum exponent (for two's power; i.e. the B of ( 2 ** B ) ) of waiting
 * time for retry. It is only used if ( retryTimesMax > 0 ).
 *
 * @member {number} retryWaitingMillisecondsMax
 *   The maximum time (in milliseconds) of waiting for retry. It is only used
 * if ( retryTimesMax > 0 ). It is calculated from
 * retryWaitingMillisecondsExponentMax.
 *
 * @member {number} retryWaitingMillisecondsCur
 *   The current time (in milliseconds) of waiting for retry. It is only used
 * if ( retryTimesMax > 0 ).
 *
 * @member {string} responseType
 *   A string specifying what type of data the response contains. It could be
 * "", "arraybuffer", "blob", "document", "json", "text". Default is "text".
 *
 * @member {string} method
 *   The HTTP request method to use, e.g. "GET", "POST". Default is "GET".
 *
 * @member {object} body
 *   The data to be sent in the XHR request. It could be null. Usually, it is
 * not null only if method is not "GET".
 *
 * @member {number} contentLoaded
 *   The loaded length of content (i.e. ProgressEvent.loaded).
 *
 * @member {number} contentTotal
 *   The total length of content (i.e. ProgressEvent.total). If
 * ( ProgressEvent.lengthComputable == false ), it will be zero.
 * 
 */
class HttpFetcher {

  /**
   *
   */
  constructor( bLogEventToConsole ) {
    this.bLogEventToConsole = bLogEventToConsole;
  }

  /**
   * An async generator for sending a http request and tracking its progress
   * (with retry).
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @return {AsyncGenerator}
   *   Return an async generator for receving result from XMLHttpRequest.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( object )}
   *   Yield a promise resolves to { done: true, value: xhr.response }.
   *
   * @throws {ProgressEvent}
   *   Yield a promise rejects to ProgressEvent. The ProgressEvent.type may be:
   *     - "abort"
   *     - "error"
   *     - "load": when ( status != 200 ) (e.g. 404 or 500).
   *     - "timeout"
   * Note: Although they all represent the request is failed, however, the
   * ( progressToAdvance.valuePercentage == 100 ) will still be reported for
   * representing the request already done (with failure, though).
   */
  async* asyncGenerator_by_progressParent_url_timeout_retry_responseType_method_body(
    progressParent,
    url,

    loadingMillisecondsMax = 0,
    loadingMillisecondsInterval = ( 20 * 1000 ),

    retryTimesMax = 0,
    retryWaitingMillisecondsExponentMax = 6,

    responseType = HttpFetcher.responseTypeDefault,
    method = HttpFetcher.methodDefault,
    body
  ) {

    // 0.

    // 0.1
    this.progressParent = progressParent;
    //this.progressRoot = progressParent.root_get();

    // 0.2
    this.retryTimesMax = retryTimesMax;
    this.retryTimesCur = 0;
    this.retryWaitingMillisecondsExponentMax = retryWaitingMillisecondsExponentMax;

    // 0.3
    //
    // Note1: Although .progressLoading and progressRetryWaiting is recorded in
    //        this, they are not owned by this HttpFetcher object. They should
    //        be destroyed by outside caller (i.e. by progressParent).
    //
    // Note2: Their .max are set arbitrarily here. Their value will be changed
    //        dynamically.
    //
    const arbitraryNonZero = 1;
    this.progressLoading = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( arbitraryNonZero ) );
    this.progressRetryWaiting = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( arbitraryNonZero ) );

    // 1.
    let bRetry;
    let responseText;
    do {

      // 1.1
      try {
        responseText = yield* HttpFetcher
          .asyncGenerator_by_progressToAdvnace_url_timeout_responseType_method_body
          .call(
            this.progressLoading,
            url,

            loadingMillisecondsMax,
            loadingMillisecondsInterval,

            responseType,
            method,
            body
          );

        // No need to retry, since request is succeeded (when executed to here).
        bRetry = false;

      // 1.2 Determine whether should retry.
      } catch( e ) {

        // 1.2.1 Retry only if recognized exception and still has retry times.
        if (   ( e instanceof ProgressEvent )
            && (   ( e.type === "abort" )
                || ( e.type === "error" )
                || ( e.type === "load" ) // ( status != 200 ) (e.g. 404 or 500)
                || ( e.type === "timeout" ) )
           ) { 
          let bRetryTimesRunOut = this.retryTimes_isRunOut();
          if ( bRetryTimesRunOut ) {
            bRetry = false; // 3.1.1 Can not retry, because run out of retry times.

//!!! ...unfinished... (2023/02/21)
// should complete the retry waiting timer to 100%

            console.error( e );
            throw e;

          } else {
            bRetry = true; // 3.1.2 Retry one more time.
            ++this.retryTimesCur;
          }

        } else { // 1.2.2 Unknown error. (Never retry for unknown error.)
          bRetry = false;

//!!! ...unfinished... (2023/02/21)
// should complete the retry waiting timer to 100%

          console.error( e );
          throw e;
        }
      }

      // 1.3 Waiting before retry (for truncated exponential backoff algorithm).
      if ( bRetry ) {
        yield* HttpFetcher
          .asyncGenerator_by_progressToAdvnace_retryWaiting
          .call(
            this.progressRetryWaiting,
          );
      }

    } while ( bRetry );

    // 2. Return the successfully downloaded result.
    return responseText;
  }

  /** @return {boolean} Return true, if not yet reach maximum retry times. */
  retryTimes_isRunOut() {
    if ( this.retryTimesMax < 0 )
      return false; // Never run out, since retry forever.
    if ( this.retryTimesCur < this.retryTimesMax )
      return false; // Still has retry times.
    return true; // Run out of retry times.
  }

//!!! ...unfinished... (2023/02/21)
  /** */
  retryWaitingMilliseconds_init() {
    // Either (< 0) forever retry, or (> 0) limited-times retry.
    if ( this.retryTimesMax != 0 ) {
      this.retryWaitingMillisecondsMax
        = 1000 * RandTools.getRandomInt_TruncatedBinaryExponent(
            this.retryTimesCur, this.retryWaitingMillisecondsExponentMax );

      this.retryWaitingMillisecondsCur = 0;

    } else { // ( this.retryTimesMax == 0 ), never retry.
      this.retryWaitingMillisecondsMax = 0;
      this.retryWaitingMillisecondsCur = undefined;
    }
  }

//!!! ...unfinished... (2023/02/21)
// What about retry waiting timer?

  /**
   * @return {boolean}
   *   Return true, if ( loadingMillisecondsMax > 0 ), which means using timer to
   * advance progressToAdvance.
   */
  get loadingTimer_isUsed() {
    if ( loadingMillisecondsMax > 0 )
      return true;
    return false;
  }

  /** Cancel current loadingTimer (if exists). */
  loadingTimer_cancel() {
    if ( this.loadingTimerPromise ) {
      this.loadingTimerPromise.cancelTimer(); // Stop timer.
      this.allPromiseSet.delete( this.loadingTimerPromise ); // Stop listening.
    }
  }

  /** Cancel current retryWaitingTimer (if exists). */
  retryWaitingTimer_cancel() {
    if ( this.retryWaitingTimerPromise ) {
      this.retryWaitingTimerPromise.cancelTimer(); // Stop timer.
      this.allPromiseSet.delete( this.retryWaitingTimerPromise ); // Stop listening.
    }
  }


  /**
   * @return {number} Return what the progressToAdvance.value should be.
   */
  progressToAdvance_value_calculate() {

//!!! ...unfinished... (2023/02/21)
  }

  /**
   * @return {number} Return what the progressToAdvance.max should be.
   */
  progressToAdvance_max_calculate() {
//!!! ...unfinished... (2023/02/21)
    if ( this.loadingTimer_isUsed ) { // Use timeout time as progress target.
      progressToAdvance_max_default = loadingMillisecondsMax;
    }
  }

  /**
   * An async generator for sending a http request and tracking its progress
   * (without retry).
   *
   * (This method is called by
   * asyncGenerator_by_progressParent_url_timeout_retry_responseType_method_body())
   *
   *
   * @param {ValueMax.Percentage.Concrete} progressToAdvance
   *   This progressToAdvance will be increased when every time advanced. The
   * progressToAdvance.root_get() will be returned when every time yield.
   *
   * @return {AsyncGenerator}
   *   Return an async generator for receving result from XMLHttpRequest.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false,
   * value: progressToAdvance.root_get() }.
   *
   * @yield {Promise( object )}
   *   Yield a promise resolves to { done: true, value: xhr.response }.
   *
   * @throws {ProgressEvent}
   *   Yield a promise rejects to ProgressEvent. The ProgressEvent.type may be:
   *     - "abort"
   *     - "error"
   *     - "load": when ( status != 200 ) (e.g. 404 or 500).
   *     - "timeout"
   * Note: Although they all represent the request is failed, however, the
   * ( progressToAdvance.valuePercentage == 100 ) will still be reported for
   * representing the request already done (with failure, though).
   */
  static async*
    asyncGenerator_by_progressToAdvnace_url_timeout_responseType_method_body(
      progressToAdvnace,
      url,

      loadingMillisecondsMax,
      loadingMillisecondsInterval,

      responseType,
      method,
      body
    ) {

    // 0.

    // 0.1
    this.progressRoot = progressToAdvnace.root_get();

    this.url = url;

    this.loadingMillisecondsMax = loadingMillisecondsMax;
    this.loadingMillisecondsInterval = loadingMillisecondsInterval;
    this.loadingMillisecondsCur = undefined;

    this.responseType = responseType;
    this.method = method;
    this.body = body;

//!!! ...unfinished... (2023/02/21)
// What about retry waiting timer?

    // 0.2
    let progressToAdvance_max_default;

    if ( this.loadingTimer_isUsed ) { // Use timeout time as progress target.
      progressToAdvance_max_default = loadingMillisecondsMax;
      this.loadingMillisecondsCur = 0;
    } else { // Use total content length (perhaps unknown) as progress target.
      progressToAdvance_max_default = HttpFetcher.progressTotalFakeLarger;
    }
 
    this.progressToAdvance.value_max_set( progressToAdvance_max_default );

    // 0.3
    this.contentLoaded = undefined;
    this.contentTotal = undefined;


//!!! ...unfinished... (2023/02/21)
    // 2.

    // 2.1
    const xhr = this.xhr = new XMLHttpRequest();
    xhr.open( method, url, true );
    xhr.timeout = loadingMillisecondsMax;
    xhr.responseType = responseType;

    // 2.2 Prepare promises before sending it.
    this.abortPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "abort", HttpFetcher.handle_abort, this );

    this.errorPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "error", HttpFetcher.handle_error, this );

    this.loadPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "load", HttpFetcher.handle_load, this );

    this.loadstartPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "loadstart", HttpFetcher.handle_loadstart, this );

    this.progressPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "progress", HttpFetcher.handle_progress, this );

    this.timeoutPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "timeout", HttpFetcher.handle_timeout, this );

    if ( this.loadingTimer_isUsed ) {
      HttpFetcher.loadingTimerPromise_create_and_set.call( this );
    }

//!!! ...unfinished... (2023/02/21) retryWaitingTimePromise?

    // All promises to be listened.
    {
      this.allPromiseSet = new Set( [
        this.abortPromise, this.errorPromise, this.loadPromise,
        this.loadstartPromise,
        this.progressPromise,
        this.timeoutPromise
      ] );

      if ( this.loadingTimerPromise )
        this.allPromiseSet.add( this.loadingTimerPromise );
    }

    // 2.3
    xhr.send( body );

    // 2.4 Until done or failed.
    let notDone;
    do {
      let allPromise = Promise.race( this.allPromiseSet );

      // All succeeded promises resolve to progressRoot.
      // All failed promises reject to (i.e. throw exception of) ProgressEvent.
      let progressRoot = await allPromise;
      yield progressRoot;

      // Not done, if:
      //   - ( status is not 200 ), or
      //   - ( .loadPromise still pending (i.e. still in waiting promises) ).
      //
      // Note: Checking ( xhr.status !== 200 ) is not enough. The loading may
      //       still not be complete when status becomes 200.
      notDone =    ( xhr.status !== 200 )
                || ( this.allPromiseSet.has( this.loadPromise ) );

    // Stop if loading completely and successfully.
    //
    // Note: The other ways to leave this loop are throwing exceptions (e.g.
    //       the pending promises rejected).
    } while ( notDone );

    // 4. 
    // (2023/02/15) For debug.
    // (When execution to here, the request should been finished successfully.)
    {
      // 4.1
      if ( 200 !== xhr.status ) {
        //debugger;
        throw Error( `( ${this.url} ) HttpFetcher.`
          + `asyncGenerator_by_progressToAdvnace_url_timeout_responseType_method_body(): `
          + `When done, `
          + `xhr.status ( ${xhr.status} ) should be 200.` );
      }

      // 4.2
      if ( 100 != this.progressToAdvance.valuePercentage ) {
        //debugger;
        throw Error( `( ${this.url} ) HttpFetcher.`
          + `asyncGenerator_by_progressToAdvnace_url_timeout_responseType_method_body(): `
          + `When done, `
          + `progressToAdvance.valuePercentage `
          + `( ${this.progressToAdvance.valuePercentage} ) should be 100.` );
      }
    }

    // 5. Return the successfully downloaded result.
    return xhr.response;
  }


  /**
   * An async generator for tracking retry waiting timer progress.
   *
   * (This method is called by
   * asyncGenerator_by_progressParent_url_timeout_retry_responseType_method_body())
   *
   *
   * @param {ValueMax.Percentage.Concrete} progressToAdvance
   *   This progressToAdvance will be increased when every time advanced. The
   * progressToAdvance.root_get() will be returned when every time yield.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false,
   * value: progressToAdvance.root_get() }.
   *
   * @yield {Promise( object )}
   *   Yield a promise resolves to { done: true,
   * value: progressToAdvance.root_get() }.
   */
  static async*
    asyncGenerator_by_progressToAdvnace_retryWaiting(
      progressToAdvnace,
    ) {

    // 0.

    // 0.1
    this.progressRoot = progressToAdvnace.root_get();

    this.retryWaitingMilliseconds_init();

//!!! ...unfinished... (2023/02/21)
// What about retry waiting timer?
!!!
    // 0.2
    let progressToAdvance_max_default;

    if ( this.loadingTimer_isUsed ) { // Use timeout time as progress target.
      progressToAdvance_max_default = loadingMillisecondsMax;
      this.loadingMillisecondsCur = 0;
    } else { // Use total content length (perhaps unknown) as progress target.
      progressToAdvance_max_default = HttpFetcher.progressTotalFakeLarger;
    }
 
    this.progressToAdvance.value_max_set( progressToAdvance_max_default );

    // 0.3
    this.contentLoaded = undefined;
    this.contentTotal = undefined;


//!!! ...unfinished... (2023/02/21)
    // 2.

    // 2.1
    const xhr = this.xhr = new XMLHttpRequest();
    xhr.open( method, url, true );
    xhr.timeout = loadingMillisecondsMax;
    xhr.responseType = responseType;

    // 2.2 Prepare promises before sending it.
    this.abortPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "abort", HttpFetcher.handle_abort, this );

    this.errorPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "error", HttpFetcher.handle_error, this );

    this.loadPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "load", HttpFetcher.handle_load, this );

    this.loadstartPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "loadstart", HttpFetcher.handle_loadstart, this );

    this.progressPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "progress", HttpFetcher.handle_progress, this );

    this.timeoutPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "timeout", HttpFetcher.handle_timeout, this );

    if ( this.loadingTimer_isUsed ) {
      HttpFetcher.loadingTimerPromise_create_and_set.call( this );
    }

//!!! ...unfinished... (2023/02/21) retryWaitingTimePromise?

    // All promises to be listened.
    {
      this.allPromiseSet = new Set( [
        this.abortPromise, this.errorPromise, this.loadPromise,
        this.loadstartPromise,
        this.progressPromise,
        this.timeoutPromise
      ] );

      if ( this.loadingTimerPromise )
        this.allPromiseSet.add( this.loadingTimerPromise );
    }

    // 2.3
    xhr.send( body );

    // 2.4 Until done or failed.
    let notDone;
    do {
      let allPromise = Promise.race( this.allPromiseSet );

      // All succeeded promises resolve to progressRoot.
      // All failed promises reject to (i.e. throw exception of) ProgressEvent.
      let progressRoot = await allPromise;
      yield progressRoot;

      // Not done, if:
      //   - ( status is not 200 ), or
      //   - ( .loadPromise still pending (i.e. still in waiting promises) ).
      //
      // Note: Checking ( xhr.status !== 200 ) is not enough. The loading may
      //       still not be complete when status becomes 200.
      notDone =    ( xhr.status !== 200 )
                || ( this.allPromiseSet.has( this.loadPromise ) );

    // Stop if loading completely and successfully.
    //
    // Note: The other ways to leave this loop are throwing exceptions (e.g.
    //       the pending promises rejected).
    } while ( notDone );

    // 4. 
    // (2023/02/15) For debug.
    // (When execution to here, the request should been finished successfully.)
    {
      // 4.1
      if ( 200 !== xhr.status ) {
        //debugger;
        throw Error( `( ${this.url} ) HttpFetcher.`
          + `asyncGenerator_by_progressToAdvnace_url_timeout_responseType_method_body(): `
          + `When done, `
          + `xhr.status ( ${xhr.status} ) should be 200.` );
      }

      // 4.2
      if ( 100 != this.progressToAdvance.valuePercentage ) {
        //debugger;
        throw Error( `( ${this.url} ) HttpFetcher.`
          + `asyncGenerator_by_progressToAdvnace_url_timeout_responseType_method_body(): `
          + `When done, `
          + `progressToAdvance.valuePercentage `
          + `( ${this.progressToAdvance.valuePercentage} ) should be 100.` );
      }
    }

    // 5. Return the successfully downloaded result.
    return xhr.response;
  }


  /**
   * @param {HttpFetcher} this
   */
  static loadingTimerPromise_create_and_set() {
    const delayMilliseconds = this.loadingMillisecondsInterval;
    const deltaValue = delayMilliseconds;

    this.loadingTimerPromise = PartTime.Promise_create_by_setTimeout(
      delayMilliseconds, HttpFetcher.handle_loadingTimer, this, deltaValue );
  }

  /**
   * @param {HttpFetcher} this
   */
  static retryWaitingTimerPromise_create_and_set() {
    const delayMilliseconds = this.retryWaitingMillisecondsMax;
    const deltaValue = delayMilliseconds;

    this.retryWaitingTimerPromise = PartTime.Promise_create_by_setTimeout(
      delayMilliseconds, HttpFetcher.handle_retryWaitingTimer, this, deltaValue );
  }


  /**
   * @param {HttpFetcher} this
   */
  static handle_abort( resolve, reject, event ) {
    this.loadingTimer_cancel(); // Stop listen progress timer (since completed).

//!!! ...unfinished... (2023/02/21)
//    this.retryWaitingTimer_cancel();

    // Advance progress to complete status (event if use timer).
    HttpFetcher.progressToAdvance_set_whenDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpFetcher: abort: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    reject( event );

    // Note: The non-repeatable failure event should still be listened on
    //       (i.e. should not removed from this.allPromiseSet), so that the
    //       rejected promise could trigger exception.
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_error( resolve, reject, event ) {
    this.loadingTimer_cancel(); // Stop listen progress timer (since completed).

//!!! ...unfinished... (2023/02/21)
//    this.retryWaitingTimer_cancel();


    // Advance progress to complete status (event if use timer).
    HttpFetcher.progressToAdvance_set_whenDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpFetcher: error: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    reject( event );

    // Note: The non-repeatable failure event should still be listened on
    //       (i.e. should not removed from this.allPromiseSet), so that the
    //       rejected promise could trigger exception.
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_load( resolve, reject, event ) {
    this.loadingTimer_cancel(); // Stop listen progress timer (since completed).

//!!! ...unfinished... (2023/02/21)
//    this.retryWaitingTimer_cancel();


    // Advance progress to complete status (event if use timer).
    HttpFetcher.progressToAdvance_set_whenDone.call( this, event );

    let xhr = this.xhr;

    let logMsg;
    if ( this.bLogEventToConsole )
      logMsg = `( ${this.url} ) HttpFetcher: load: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `status=${xhr.status}, statusText=\"${xhr.statusText}\", `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%`;

    if ( xhr.status === 200 ) {
      // Load completely and successfully.
      if ( this.bLogEventToConsole )
        console.log( logMsg );

      resolve( this.progressRoot );

      // No longer listen on non-repeatable succeeded event.
      this.allPromiseSet.delete( this.loadPromise );

    } else {
      // Load completely but failed (e.g. ( status == 400 ) or ( status == 500 ) ).
      if ( this.bLogEventToConsole )
        console.warn( logMsg );

      reject( event );

      // Note: The non-repeatable failure event should still be listened on
      //       (i.e. should not removed from this.allPromiseSet), so that the
      //       rejected promise could trigger exception.
    }
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_loadstart( resolve, reject, event ) {

    // Advance progress only if loadingTimer NOT used.
    if ( !this.loadingTimer_isUsed ) {
      HttpFetcher.progressToAdvance_set_beforeDone.call( this, event );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: loadstart: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    resolve( this.progressRoot );

    // No longer listen on non-repeatable succeeded event.
    this.allPromiseSet.delete( this.loadstartPromise );
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_progress( resolve, reject, event ) {

    // Advance progress only if loadingTimer NOT used.
    if ( !this.loadingTimer_isUsed ) {
      HttpFetcher.progressToAdvance_set_beforeDone.call( this, event );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: progress: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    resolve( this.progressRoot );

    // Re-listen on repeatable succeeded event.
    {
      this.allPromiseSet.delete( this.progressPromise );

      // Because progress event could happen many times, re-generate
      // a new promise for listening on it.
      this.progressPromise = PartTime.Promise_create_by_addEventListener_once(
        this.xhr, "progress", HttpFetcher.handle_progress, this );

      this.allPromiseSet.add( this.progressPromise );
    }
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_timeout( resolve, reject, event ) {
    this.loadingTimer_cancel(); // Stop listen progress timer (since completed).

//!!! ...unfinished... (2023/02/21)
//    this.retryWaitingTimer_cancel();


    // Advance progress to complete status (event if use timer).
    HttpFetcher.progressToAdvance_set_whenDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpFetcher: timeout: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    reject( event );

    // Note: The non-repeatable failure event should still be listened on
    //       (i.e. should not removed from this.allPromiseSet), so that the
    //       rejected promise could trigger exception.
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_loadingTimer( resolve, reject, deltaValue ) {
    this.loadingMillisecondsCur += deltaValue;

    // Advance progress only if loadingTimer used.
    if ( this.loadingTimer_isUsed ) {
      // this.progressToAdvance.value_advance( deltaValue );
      this.progressToAdvance.value_set( this.loadingMillisecondsCur );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: loadingTimer: `
        + `loadingMillisecondsCur=${this.loadingMillisecondsCur}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    resolve( this.progressRoot );

    // Re-listen on repeatable succeeded event.
    //
    // Because loadingTimer event could happen many times, re-generate
    // a new promise for listening on it.
    {
      this.allPromiseSet.delete( this.loadingTimerPromise );
      HttpFetcher.loadingTimerPromise_create_and_set.call( this );
      this.allPromiseSet.add( this.loadingTimerPromise );
    }
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_retryWaitingTimer( resolve, reject, deltaValue ) {
    this.retryWaitingMillisecondsCur += deltaValue;

//!!! ...unfinished... (2023/02/21)
!!!
    // Advance progress only if loadingTimer used.
    if ( this.loadingTimer_isUsed ) {
      // this.progressToAdvance.value_advance( deltaValue );
      this.progressToAdvance.value_set( this.loadingMillisecondsCur );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: retryWaitingTimer: `
        + `retryWaitingMillisecondsCur=${this.retryWaitingMillisecondsCur}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    resolve( this.progressRoot );

    // Re-listen on repeatable succeeded event.
    //
    // Because retryWaitingTimer event could happen many times, re-generate
    // a new promise for listening on it.
    {
      this.allPromiseSet.delete( this.retryWaitingTimerPromise );
      HttpFetcher.retryWaitingTimerPromise_create_and_set.call( this );
      this.allPromiseSet.add( this.retryWaitingTimerPromise );
    }
  }


  /**
   * Called when progress not done (i.e. onloadstart(), onprogrss()).
   *
   * @param {HttpFetcher} this
   *
   * @param {ProgressEvent} progressEvent
   *   The ProgressEvent to be used to set .progressToAdvance.
   */
  static progressToAdvance_set_beforeDone( progressEvent ) {
    this.contentLoaded = progressEvent.loaded;
    this.contentTotal = progressEvent.total;

    if ( progressEvent.lengthComputable ) {

      // Because:
      //   - ValueMax.Percentage.Concrete will get ( .valuePercentage == 100 )
      //       when ( .max == 0 ).
      //
      // So, even if ( progressEvent.total == 0 ), this function still
      // could result in ( progressToAdvance.valuePercentage == 100 ) correctly.
      //
      this.progressToAdvance.value_max_set( progressEvent.total );
      this.progressToAdvance.value_set( progressEvent.loaded );

    } else { // Fake an incremental never-100% progress percentage.
      let fakeMax = progressEvent.loaded + HttpFetcher.progressTotalFakeLarger;
      this.progressToAdvance.value_max_set( fakeMax );
      this.progressToAdvance.value_set( progressEvent.loaded );
    }
  }

  /**
   * Called when progress done (i.e. onabort(), onerror(), onload(), ontimeout()).
   *
   * @param {HttpFetcher} this
   *
   * @param {ProgressEvent} progressEvent
   *   The ProgressEvent to be used to set .progressToAdvance.
   */
  static progressToAdvance_set_whenDone( progressEvent ) {
    this.contentLoaded = progressEvent.loaded;
    this.contentTotal = progressEvent.total;

    // Because:
    //   - ValueMax.Percentage.Concrete will get ( .valuePercentage == 100 )
    //       when ( .max == 0 ).
    //
    //   - According to experiment, the progressEvent.loaded may become 0
    //       no matter how many it is before onabort() or onerror() or
    //       ontimeout().
    //
    // So, no matter in which one of following cases, this function always
    // could result in ( progressToAdvance.valuePercentage == 100 ):
    //   - ( progressEvent.total == 0 ) when ( .lengthComputable == true )
    //   - ( progressEvent.loaded == 0 ) when ( .lengthComputable == false )
    //

    if ( event.lengthComputable ) {
      this.progressToAdvance.value_max_set( event.total );
      this.progressToAdvance.value_set( event.loaded );

    } else { // Complete the fake progress to 100%.
      this.progressToAdvance.value_max_set( event.loaded );
      this.progressToAdvance.value_set( event.loaded );
    }
  }


  /**
   * @param {ProgressEvent} progressEvent
   *   The ProgressEvent to be displayed.
   *
   * @return {string} A string description lengthComputable, loaded, total.
   */
  static ProgressEvent_toString( progressEvent ) {
    //let str = `${event.loaded} bytes transferred`;
    let str = `lengthComputable=${progressEvent.lengthComputable}, `
      + `loaded=${progressEvent.loaded}, total=${progressEvent.total}`;
    return str;
  }

}

HttpFetcher.methodDefault = "GET";
HttpFetcher.responseTypeDefault = "text";

/**
 * If ( ProgressEvent.lengthComputable == false ), it will be assumed that
 * ProgressEvent.total = ProgressEvent.loaded + HttpFetcher.progressTotalFakeLarger.
 *
 * The purpose is to let progress percentage look like still increasing step by
 * step gradually.
 */
HttpFetcher.progressTotalFakeLarger = 1024 * 1024;
