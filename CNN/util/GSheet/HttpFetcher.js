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
 *   - If zero, the progressLoading will be advanced by ProgressEvent(
 *       .type = "progress" ).
 *     - This is good if ( .lengthComputable == true ) and network smooth.
 *     - This is bad if ( .lengthComputable == false ) (i.e. progress can not
 *         be calculated by .loaded / .total) or network congested (i.e.
 *         there will be a long pending (no responded in UI)).
 *
 *   - If not zero, the progressLoading will be advanced by a timer.
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
 *   Retry request so many times at most when request failed (ProgressEvent
 * is error, or load without status 200, or timeout). Note1: Never retry if
 * ( ProgressEvent is abort ) or ( unknown error ). Note2: there will be some
 * waiting time before next re-try (i.e. truncated (binary) exponential backoff
 * algorithm).
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
 * @member {number} retryWaitingMillisecondsInterval
 *   The interval time (in milliseconds) for advancing the
 * retryWaitingMillisecondsCur. Although smaller interval may provide smoother
 * progress advancing, however, too small interval (relative to
 * retryWaitingMillisecondsMax) may not look good because
 * the progress bar may advance too little to be aware by eyes.
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
    this.allPromiseSet = new Set();
  }

  /**
   * An async generator for sending a http request and tracking its progress
   * (with retry).
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressLoading will be created and added to progressParent. The
   * created progressLoading will be increased when every time advanced. The
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
   * ( progressLoading.valuePercentage == 100 ) will still be reported for
   * representing the request already done (with failure, though).
   */
  async* asyncGenerator_by_progressParent_url_timeout_retry_responseType_method_body(
    progressParent,
    url,

    loadingMillisecondsMax = 0,
    loadingMillisecondsInterval = ( 20 * 1000 ),

    retryTimesMax = 0,
    retryWaitingMillisecondsExponentMax = 6,
    retryWaitingMillisecondsInterval = ( 1000 ),

    responseType = HttpFetcher.responseTypeDefault,
    method = HttpFetcher.methodDefault,
    body
  ) {

    // 0.

    // 0.1
    this.progressParent = progressParent;
    this.progressRoot = progressParent.root_get();

    // 0.2
    this.retryTimesMax = retryTimesMax;
    this.retryTimesCur = 0;
    this.retryWaitingMillisecondsExponentMax = retryWaitingMillisecondsExponentMax;
    this.retryWaitingMillisecondsInterval = retryWaitingMillisecondsInterval;

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

    let bRetry;
    let responseText;
    do {
      this.retryWaitingMilliseconds_init();

      // 1.
      try {
        responseText = yield* HttpFetcher
          .asyncGenerator_by_url_timeout_responseType_method_body.call(
            this,
            url,

            loadingMillisecondsMax,
            loadingMillisecondsInterval,

            responseType,
            method,
            body
          );

        // No need to retry, since request is succeeded (when executed to here).
        bRetry = false;

      // 2. Determine whether should retry.
      } catch( e ) {

        if ( e instanceof ProgressEvent ) {

          // 2.1 Never retry for user abort.
          if ( e.type === "abort" ) {
            bRetry = false;

          // 2.2 Retry only if recognized exception and still has retry times.
          } else if (   ( e.type === "error" )
                     || ( e.type === "load" ) // ( status != 200 ) (e.g. 404 or 500)
                     || ( e.type === "timeout" ) ) { 

            let bRetryTimesRunOut = this.retryTimes_isRunOut();
            if ( bRetryTimesRunOut ) {
              bRetry = false; // 2.2.1 Can not retry, because run out of retry times.

            } else {
              bRetry = true; // 2.2.2 Retry one more time.
              ++this.retryTimesCur;
            }

          } else { // 2.3 Unknown ProgressEvent. (Never retry for unknown error.)
            bRetry = false;
          }

        } else { // 2.4 Unknown error. (Never retry for unknown error.)
          bRetry = false;
        }

        // 3. Throw exception if not retry.
        if ( !bRetry ) {

//!!! ...unfinished... (2023/02/21)
// If loading is abort (not error, not loading failed), should:
//   - this.retryWaitingTimer_cancel();
//   - reject( ProgressEvent( .type == "abort" ) )
//

          // Since no retry, the retry waiting timer should be completed to 100%
          HttpFetcher.progressRetryWaiting_set_whenDone.call( this );

          console.error( e );
          throw e;
        }
      }

      // 4. Waiting before retry (for truncated exponential backoff algorithm).
      if ( bRetry ) {
        yield* HttpFetcher.asyncGenerator_by_retryWaiting.call( this );

//!!! ...unfinished... (2023/02/21)
// If user abort, should set bRetry to false.

      }

    } while ( bRetry );

    // 5. Return the successfully downloaded result.
    return responseText;
  }


  /** Abort the loading (or waiting). */
  abort() {

    {
      if ( this.xhr )
        this.xhr.abort();

      this.progressLoading.value_max_set( 0 );
      this.progressLoading.value_set( 0 );
    }

    {
      this.retryWaitingTimer_cancel();

      this.progressRetryWaiting.value_max_set( 0 );
      this.progressRetryWaiting.value_set( 0 );
    }
  
//!!! ...unfinished... (2023/02/21)
// If loading is abort (not error, not loading failed), should:
//   - bDone = true;
//   - this.retryWaitingTimer_cancel();
//   - reject( ProgressEvent( .type == "abort" ) )
//

    // {
    //   throw Error( `( ${this.url} ) HttpFetcher.abort(): `
    //     + `Unknown state when abort() is called.` );
    // }
  }


  /** @return {boolean} Return true, if not yet reach maximum retry times. */
  retryTimes_isRunOut() {
    if ( this.retryTimesMax < 0 )
      return false; // Never run out, since retry forever.
    if ( this.retryTimesCur < this.retryTimesMax )
      return false; // Still has retry times.
    return true; // Run out of retry times.
  }

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
   * advance progressLoading.
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
      this.loadingTimerPromise = null;
    }
  }

  /** Cancel current retryWaitingTimer (if exists). */
  retryWaitingTimer_cancel() {
    if ( this.retryWaitingTimerPromise ) {
      this.retryWaitingTimerPromise.cancelTimer(); // Stop timer.
      this.allPromiseSet.delete( this.retryWaitingTimerPromise ); // Stop listening.
      this.retryWaitingTimerPromise = null;
    }
  }


  /**
   * @return {number} Return what the progressLoading.value should be.
   */
  progressLoading_value_calculate() {

//!!! ...unfinished... (2023/02/21)
  }

  /**
   * @return {number} Return what the progressLoading.max should be.
   */
  progressLoading_max_calculate() {
//!!! ...unfinished... (2023/02/21)
    if ( this.loadingTimer_isUsed ) { // Use timeout time as progress target.
      progressLoading_max_default = loadingMillisecondsMax;
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
   * @param {HttpFetcher} this
   *   - this.retryWaitingMillisecondsMax
   *   - this.retryWaitingMillisecondsCur
   *   - this.progressRoot
   *
   * @param {ValueMax.Percentage.Concrete} this.progressLoading
   *   This .progressLoading will be increased when every time advanced. The
   * this.progressRoot will be returned when every time yield.
   *
   * @return {AsyncGenerator}
   *   Return an async generator for receving result from XMLHttpRequest.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: this.progressRoot }.
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
   * ( .progressLoading.valuePercentage == 100 ) will still be reported for
   * representing the request already done (with failure, though).
   */
  static async* asyncGenerator_by_url_timeout_responseType_method_body(
      url,

      loadingMillisecondsMax,
      loadingMillisecondsInterval,

      responseType,
      method,
      body
    ) {

    // 0.

    // 0.1
    this.url = url;

    this.loadingMillisecondsMax = loadingMillisecondsMax;
    this.loadingMillisecondsInterval = loadingMillisecondsInterval;
    this.loadingMillisecondsCur = undefined;

    this.responseType = responseType;
    this.method = method;
    this.body = body;

    // 0.2
    let progressLoading_max_default;

    if ( this.loadingTimer_isUsed ) { // Use timeout time as progress target.
      progressLoading_max_default = loadingMillisecondsMax;
      this.loadingMillisecondsCur = 0;
    } else { // Use total content length (perhaps unknown) as progress target.
      progressLoading_max_default = HttpFetcher.progressTotalFakeLarger;
    }
 
    this.progressLoading.value_max_set( progressLoading_max_default );

    // 0.3
    this.contentLoaded = undefined;
    this.contentTotal = undefined;

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

    // All promises to be listened.
    {
      this.allPromiseSet.clear();
      this.allPromiseSet.add( this.abortPromise );
      this.allPromiseSet.add( this.errorPromise );
      this.allPromiseSet.add( this.loadPromise );
      this.allPromiseSet.add( this.loadstartPromise );
      this.allPromiseSet.add( this.progressPromise );
      this.allPromiseSet.add( this.timeoutPromise );
      
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
          + `asyncGenerator_by_url_timeout_responseType_method_body(): `
          + `When done, `
          + `xhr.status ( ${xhr.status} ) should be 200.` );
      }

      // 4.2
      if ( 100 != this.progressLoading.valuePercentage ) {
        //debugger;
        throw Error( `( ${this.url} ) HttpFetcher.`
          + `asyncGenerator_by_url_timeout_responseType_method_body(): `
          + `When done, `
          + `progressLoading.valuePercentage `
          + `( ${this.progressLoading.valuePercentage} ) should be 100.` );
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
   * @param {HttpFetcher} this
   *   - this.retryWaitingMillisecondsMax
   *   - this.retryWaitingMillisecondsCur
   *   - this.progressRoot
   *
   * @param {ValueMax.Percentage.Concrete} this.progressRetryWaiting
   *   This .progressRetryWaiting will be increased when every time advanced. The
   * this.progressRoot will be returned when every time yield.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: this.progressRoot }.
   *
   * @yield {Promise( object )}
   *   Yield a promise resolves to { done: true, value: this.progressRoot }.
   */
  static async* asyncGenerator_by_retryWaiting() {

    // 0.
    this.progressRetryWaiting.value_max_set( this.retryWaitingMillisecondsMax );

    // 1.
    HttpFetcher.retryWaitingTimerPromise_create_and_set.call( this );

    // All promises to be listened.
    {
      this.allPromiseSet.clear();
      this.allPromiseSet.add( this.retryWaitingTimerPromise );
    }

    // 2. Until done.
    let notDone;
    do {
      let allPromise = Promise.race( this.allPromiseSet );

      // All succeeded promises resolve to progressRoot.
      let progressRoot = await allPromise;
      yield progressRoot;

      // Not done, if:
      //   - .retryWaitingTimerPromise still exists.
      //
      notDone = ( this.allPromiseSet.has( this.retryWaitingTimerPromise ) );

    } while ( notDone ); // Stop if retry waiting completely.

    return this.progressRoot; // 3. Return the total progress.
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
    const delayMilliseconds = this.retryWaitingMillisecondsInterval;
    const deltaValue = delayMilliseconds;

    this.retryWaitingTimerPromise = PartTime.Promise_create_by_setTimeout(
      delayMilliseconds, HttpFetcher.handle_retryWaitingTimer, this, deltaValue );
  }


  /**
   * @param {HttpFetcher} this
   */
  static handle_abort( resolve, reject, event ) {
    this.loadingTimer_cancel(); // Stop listen progress timer (since completed).

    // Advance progress to complete status (event if use timer).
    HttpFetcher.progressLoading_set_whenDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpFetcher: abort: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

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

    // Advance progress to complete status (event if use timer).
    HttpFetcher.progressLoading_set_whenDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpFetcher: error: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

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

    // Advance progress to complete status (event if use timer).
    HttpFetcher.progressLoading_set_whenDone.call( this, event );

    let xhr = this.xhr;

    let logMsg;
    if ( this.bLogEventToConsole )
      logMsg = `( ${this.url} ) HttpFetcher: load: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `status=${xhr.status}, statusText=\"${xhr.statusText}\", `
        + `progressLoading=${this.progressLoading.valuePercentage}%`;

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
      HttpFetcher.progressLoading_set_beforeDone.call( this, event );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: loadstart: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

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
      HttpFetcher.progressLoading_set_beforeDone.call( this, event );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: progress: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

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

    // Advance progress to complete status (event if use timer).
    HttpFetcher.progressLoading_set_whenDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpFetcher: timeout: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

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

    // 1.
    // Advance progress only if loadingTimer used.
    if ( this.loadingTimer_isUsed ) {
      this.progressLoading.value_set( this.loadingMillisecondsCur );
    }

    // 2.
    let bAbort;
    if ( this.allPromiseSet.has( this.loadingTimerPromise ) ) {
      bAbort = false;

    // User abort. (i.e. .loadingTimer_cancel() is called)
    } else {
      bAbort = true;
    }

    // 3.
    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: loadingTimer: `
        + `loadingMillisecondsCur=${this.loadingMillisecondsCur}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    resolve( this.progressRoot );

    // Re-listen on repeatable succeeded event.
    {
      this.allPromiseSet.delete( this.loadingTimerPromise );

      // If user abort, no need to re-generate promise.
      if ( bAbort ) {
        this.loadingTimerPromise = null;

      // Before loadingTimer done, its event could happen many times.
      } else {
        // Re-generate a new promise for listening on it.
        HttpFetcher.loadingTimerPromise_create_and_set.call( this );
        this.allPromiseSet.add( this.loadingTimerPromise );
      }
    }
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_retryWaitingTimer( resolve, reject, deltaValue ) {
    this.retryWaitingMillisecondsCur += deltaValue;

    // 1.
    let bAbort;
    let bDone;
    if ( this.allPromiseSet.has( this.retryWaitingTimerPromise ) ) {
      bAbort = false;

      // Since user not abort, checking time whether exceeds.
      if ( this.retryWaitingMillisecondsCur < this.retryWaitingMillisecondsMax ) {
        bDone = false;
      } else {
        bDone = true;
      }

    // User abort. (i.e. .retryWaitingTimer_cancel() is called)
    } else {
      bAbort = true;
      bDone = true; // abort is also a kind of done.
    }

    // 2.
    if ( bDone )
      HttpFetcher.progressRetryWaiting_set_whenDone.call( this );
    else
      HttpFetcher.progressRetryWaiting_set_beforeDone.call( this );

    // 3.
    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: retryWaitingTimer: `
        + `retryWaitingMillisecondsCur=${this.retryWaitingMillisecondsCur}, `
        + `progressRetryWaiting=${this.progressRetryWaiting.valuePercentage}%` );

    // 4.
    // Note: Even if aborted, still resolve the progress.
    resolve( this.progressRoot );

    // 5. Re-listen on repeatable succeeded event.
    {
      this.allPromiseSet.delete( this.retryWaitingTimerPromise );

      // If done (include user abort), no need to re-generate promise.
      if ( bDone ) {
        this.retryWaitingTimerPromise = null;

      // Before retryWaitingTimer done, its event could happen many times.
      } else {
        // Re-generate a new promise for listening on it.
        HttpFetcher.retryWaitingTimerPromise_create_and_set.call( this );
        this.allPromiseSet.add( this.retryWaitingTimerPromise );
      }
    }
  }


  /**
   * Called when loading progress not done (i.e. onloadstart(), onprogrss()).
   *
   * @param {HttpFetcher} this
   *
   * @param {ProgressEvent} progressEvent
   *   The ProgressEvent to be used to set .progressLoading.
   */
  static progressLoading_set_beforeDone( progressEvent ) {
    this.contentLoaded = progressEvent.loaded;
    this.contentTotal = progressEvent.total;

    if ( progressEvent.lengthComputable ) {

      // Because:
      //   - ValueMax.Percentage.Concrete will get ( .valuePercentage == 100 )
      //       when ( .max == 0 ).
      //
      // So, even if ( progressEvent.total == 0 ), this function still
      // could result in ( progressLoading.valuePercentage == 100 ) correctly.
      //
      this.progressLoading.value_max_set( progressEvent.total );
      this.progressLoading.value_set( progressEvent.loaded );

    } else { // Fake an incremental never-100% progress percentage.
      let fakeMax = progressEvent.loaded + HttpFetcher.progressTotalFakeLarger;
      this.progressLoading.value_max_set( fakeMax );
      this.progressLoading.value_set( progressEvent.loaded );
    }
  }

  /**
   * Called when loading progress done (i.e. onabort(), onerror(), onload(),
   * ontimeout()).
   *
   * @param {HttpFetcher} this
   *
   * @param {ProgressEvent} progressEvent
   *   The ProgressEvent to be used to set .progressLoading.
   */
  static progressLoading_set_whenDone( progressEvent ) {
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
    // could result in ( progressLoading.valuePercentage == 100 ):
    //   - ( progressEvent.total == 0 ) when ( .lengthComputable == true )
    //   - ( progressEvent.loaded == 0 ) when ( .lengthComputable == false )
    //

    if ( event.lengthComputable ) {
      this.progressLoading.value_max_set( event.total );
      this.progressLoading.value_set( event.loaded );

    } else { // Complete the fake progress to 100%.
      this.progressLoading.value_max_set( event.loaded );
      this.progressLoading.value_set( event.loaded );
    }
  }


  /**
   * Called when retry waiting progress not done.
   *
   * @param {HttpFetcher} this
   */
  static progressRetryWaiting_set_beforeDone() {
    this.progressRetryWaiting.value_max_set( this.retryWaitingMillisecondsMax );
    this.progressRetryWaiting.value_set( this.retryWaitingMillisecondsCur );
  }

  /**
   * Called when retry waiting progress done.
   *
   * @param {HttpFetcher} this
   */
  static progressRetryWaiting_set_whenDone() {
    this.progressRetryWaiting.value_max_set( this.retryWaitingMillisecondsMax );
    this.progressRetryWaiting.value_set( this.retryWaitingMillisecondsMax );
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
