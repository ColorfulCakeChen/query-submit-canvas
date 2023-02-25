export { HttpRequest_Fetcher as Fetcher };

import * as PartTime from "../PartTime.js";
import * as RandTools from "../RandTools.js";
import * as ValueMax from "../ValueMax.js";
import { Params_loading_retryWaiting }
  from "./HttpRequest_Params_loading_retryWaiting.js";

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
 * @member {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
 *   The parameters for loading timeout and retry waiting time. It will be kept
 * but not modified by this object.
 *
 * @member {number} loadingMillisecondsCur
 *   The current time (in milliseconds) of loading. It is only used if
 * ( .loadingMillisecondsMax > 0 ).
 *
 * @member {number} retryTimesCur
 *   How many times has been retried.
 *
 * @member {number} retryWaitingMillisecondsMax
 *   The maximum time (in milliseconds) of waiting for retry. It is only used
 * if ( .retryTimesMax > 0 ). It is calculated from .retryWaitingSecondsExponentMax.
 *
 * @member {number} retryWaitingMillisecondsCur
 *   The current time (in milliseconds) of waiting for retry. It is only used
 * if ( .retryTimesMax > 0 ).
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
 * @member {boolean} bAbort
 *   If true, it means .abort() is called.
 */
class HttpRequest_Fetcher {

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
    params_loading_retryWaiting,
    responseType = HttpRequest_Fetcher.responseTypeDefault,
    method = HttpRequest_Fetcher.methodDefault,
    body
  ) {

    // 0.

    // 0.1
    this.progressParent = progressParent;
    this.progressRoot = progressParent.root_get();

    // 0.2
    this.url = url;
    this.params_loading_retryWaiting = params_loading_retryWaiting;
    this.responseType = responseType;
    this.method = method;
    this.body = body;

    // 0.3
    this.retryTimesCur = 0;

    // 0.4
    //
    // Note1: Although .progressLoading and progressRetryWaiting is recorded in
    //        this, they are not owned by this HttpRequest_Fetcher object. They
    //        should be destroyed by outside caller (i.e. by progressParent).
    //
    // Note2: Their .max are set arbitrarily here. Their value will be changed
    //        dynamically.
    //
    {
      const arbitraryNonZero = 1;
      this.progressLoading = progressParent.child_add(
        ValueMax.Percentage.Concrete.Pool.get_or_create_by( arbitraryNonZero ) );

      {
        // If retry times is run out at begining, it means no retry at all.
        if ( this.retryTimes_isRunOut )
          this.progressRetryWaiting = undefined;
        else
          this.progressRetryWaiting = progressParent.child_add(
            ValueMax.Percentage.Concrete.Pool.get_or_create_by( arbitraryNonZero ) );
      }
    }

    // load-wait-retry
    let responseText;
    try {
      let bRetry;
      do {
        HttpRequest_Fetcher.retryWaitingMilliseconds_init.call( this );

        // 1. Try to load.
        try {
          responseText
            = yield* HttpRequest_Fetcher.asyncGenerator_loading.call( this );

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

              let bRetryTimesRunOut = this.retryTimes_isRunOut;
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
            // Since no retry, the retry waiting timer should be completed to 100%
            HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );
            throw e;
          }
        }

        // 4.
        if ( bRetry ) {
          // If retry, waiting before it (i.e. truncated exponential backoff algorithm).
          yield* HttpRequest_Fetcher.asyncGenerator_retryWaiting.call( this );
        } else {
          // If no retry, the retry waiting timer should be completed to 100%
          HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );
        }

      } while ( bRetry && ( !this.bAbort ) );

    } finally {
      // Ensure this async generator will not be aborted by default when it is
      // called in the next time.
      this.bAbort = false;
    }

    // 5. Return the successfully downloaded result.
    return responseText;
  }

  get loadingMillisecondsMax() {
    return this.params_loading_retryWaiting.loadingMillisecondsMax;
  }

  get loadingMillisecondsInterval() {
    return this.params_loading_retryWaiting.loadingMillisecondsInterval;
  }

  get retryTimesMax() {
    return this.params_loading_retryWaiting.retryTimesMax;
  }

  get retryWaitingSecondsExponentMax() {
    return this.params_loading_retryWaiting.retryWaitingSecondsExponentMax;
  }

  get retryWaitingMillisecondsInterval() {
    return this.params_loading_retryWaiting.retryWaitingMillisecondsInterval;
  }

  /**
   * Abort the loading (or waiting).
   *
   * Note: Calling .abort() will not cause retry. While other failure (e.g.
   * error, load without status 200, timeout) will cause retry (if
   * .retryTimesMax != 0).
   */
  abort() {
    this.bAbort = true;

    {
      if ( this.xhr )
        this.xhr.abort();

      if ( this.progressLoading ) {
        this.progressLoading.value_max_set( 0 );
        this.progressLoading.value_set( 0 );
      }
    }

    HttpRequest_Fetcher.retryWaitingTimer_cancel.call( this );
  }

  /**
   * @return {boolean}
   *   Return true, if ( .loadingMillisecondsMax > 0 ), which means using timer
   * to advance progressLoading.
   */
  get loadingTimer_isUsed() {
    if ( this.loadingMillisecondsMax > 0 )
      return true;
    return false;
  }

  /**
   * @return {boolean}
   *   Return true, if ( .loadingTimer_isUsed == true ) and ( now is during
   * loading ).
   */
  get loadingTimer_isCounting() {
    if ( this.loadingTimerPromise )
      return true;
    return false;
  }

  /**
   * Cancel current loadingTimer (if exists).
   *
   * @param {HttpRequest_Fetcher} this
   */
  static loadingTimer_cancel() {
    if ( !this.loadingTimerPromise )
      return;

    this.loadingTimerPromise.cancelTimer(); // Stop timer.
    this.allPromiseSet.delete( this.loadingTimerPromise ); // Stop listening.
    this.loadingTimerPromise = null;
  }

  /** @return {boolean} Return true, if not yet reach maximum retry times. */
  get retryTimes_isRunOut() {
    if ( this.retryTimesMax < 0 )
      return false; // Never run out, since retry forever.
    if ( this.retryTimesCur < this.retryTimesMax )
      return false; // Still has retry times.
    return true; // Run out of retry times. (Include never retry.)
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static retryWaitingMilliseconds_init() {

    // No need (or can not) retry.
    if ( this.retryTimes_isRunOut ) {
      // So that always ( .progressRetryWaiting.valuePercentage == 100% )
      this.retryWaitingMillisecondsMax = 0;
      this.retryWaitingMillisecondsCur = undefined;

    // Still could retry.
    } else {
      this.retryWaitingMillisecondsMax
        = 1000 * RandTools.getRandomInt_TruncatedBinaryExponent(
            this.retryTimesCur, this.retryWaitingSecondsExponentMax );

      this.retryWaitingMillisecondsCur = 0;
    }
  }

  /**
   * @return {boolean} Return true, if now is during retry waiting.
   */
  get retryWaitingTimer_isCounting() {
    if ( this.retryWaitingTimerPromise )
      return true;
    return false;
  }

  /** Cancel current retryWaitingTimer (if exists).
   *
   * @param {HttpRequest_Fetcher} this
   */
 static retryWaitingTimer_cancel() {
    if ( !this.retryWaitingTimerPromise )
      return;

    this.retryWaitingTimerPromise.cancelTimer(); // Stop timer.
    this.allPromiseSet.delete( this.retryWaitingTimerPromise ); // Stop listening.

    // Canceling retry timer may result in:
    //   - .handle_retryWaitingTimer() never be called.
    //       So, let the retry waiting progress done (100%) here.
    //
    //   - .asyncGenerator_retryWaiting() be blocked forever.
    //       So, resolve the retry waiting promise here.
    //
    {
      HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );

      if ( this.bLogEventToConsole )
        console.log( `( ${this.url} ) HttpRequest_Fetcher: `
          + `retryWaitingTimer: cancel: `
          + `retryTimesCur=${this.retryTimesCur}, `
          + `retryWaitingMillisecondsCur=${this.retryWaitingMillisecondsCur}, `
          + `retryWaitingMillisecondsMax=${this.retryWaitingMillisecondsMax}, `
          + `progressRetryWaiting=${this.progressRetryWaiting.valuePercentage}%` );

      this.retryWaitingTimerPromise.resolve( this.progressRoot );
    }

    this.retryWaitingTimerPromise = null;
  }

  /**
   * An async generator for sending a http request and tracking its progress
   * (without retry).
   *
   * (This method is called by
   * asyncGenerator_by_progressParent_url_timeout_retry_responseType_method_body())
   *
   *
   * @param {HttpRequest_Fetcher} this
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
  static async* asyncGenerator_loading() {

    // 0.

    // 0.1
    let progressLoading_max_default;

    if ( this.loadingTimer_isUsed ) { // Use timeout time as progress target.
      progressLoading_max_default = this.loadingMillisecondsMax;
      this.loadingMillisecondsCur = 0;
    } else { // Use total content length (perhaps unknown) as progress target.
      progressLoading_max_default = HttpRequest_Fetcher.progressTotalFakeLarger;
      this.loadingMillisecondsCur = undefined;
    }
 
    this.progressLoading.value_max_set( progressLoading_max_default );

    // 0.2
    this.contentLoaded = undefined;
    this.contentTotal = undefined;

    // 1.

    // 1.1
    const xhr = this.xhr = new XMLHttpRequest();
    xhr.open( this.method, this.url, true );
    xhr.timeout = this.loadingMillisecondsMax;
    xhr.responseType = this.responseType;

    // 1.2 Prepare promises before sending it.
    this.abortPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "abort", HttpRequest_Fetcher.handle_abort, this );

    this.errorPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "error", HttpRequest_Fetcher.handle_error, this );

    this.loadPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "load", HttpRequest_Fetcher.handle_load, this );

    this.loadstartPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "loadstart", HttpRequest_Fetcher.handle_loadstart, this );

    this.progressPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "progress", HttpRequest_Fetcher.handle_progress, this );

    this.timeoutPromise = PartTime.Promise_create_by_addEventListener_once(
      xhr, "timeout", HttpRequest_Fetcher.handle_timeout, this );

    if ( this.loadingTimer_isUsed ) {
      HttpRequest_Fetcher.loadingTimerPromise_create_and_set.call( this );
    }

    // All promises to be listened.
    {
      this.allPromiseSet.clear();

//!!! ...unfinished... (2023/02/25)
// Try let .loadingTimerPromise before .progressPromise
// so that progress by timer could be advanced smoother.
      if ( this.loadingTimerPromise )
        this.allPromiseSet.add( this.loadingTimerPromise );

      this.allPromiseSet.add( this.abortPromise );
      this.allPromiseSet.add( this.errorPromise );
      this.allPromiseSet.add( this.loadPromise );
      this.allPromiseSet.add( this.loadstartPromise );
      this.allPromiseSet.add( this.progressPromise );
      this.allPromiseSet.add( this.timeoutPromise );

//!!! (2023/02/25 Temp Remarked)
// Try let .loadingTimerPromise before .progressPromise
// so that progress by timer could be advanced smoother.
//
//       if ( this.loadingTimerPromise )
//         this.allPromiseSet.add( this.loadingTimerPromise );
    }

    // 1.3
    xhr.send( this.body );

    // Abort immediately if caller requests. (For example,
    // HttpRequest_Fetcher.abort() may be called during retry waiting.)
    //
    // Note: Calling xhr.abort() only has effect after xhr.send(). Calling
    //       xhr.abort() before xhr.send() has no effect.
    //
    if ( this.bAbort ) {
      xhr.abort();
    }

    // 1.4 Until done or failed.
    let notDone;
    do {
      let allPromise = Promise.race( this.allPromiseSet );

      // All succeeded promises resolve to progressRoot.
      // All failed promises reject to (i.e. throw exception of) ProgressEvent.
      let progressRoot = await allPromise;
      yield progressRoot;

//!!! (2023/02/24 Remarked)
// If .abort() is called, xhr.status will be changed (from 200) to 0 even
// if loading is succeeded. So, do not check xhr.status whether 200.
// Just check .allPromiseSet.has( .loadPromise ) purely.
//
//       // Not done, if:
//       //   - ( status is not 200 ), or
//       //   - ( .loadPromise still pending (i.e. still in waiting promises) ).
//       //
//       // Note: Checking ( xhr.status !== 200 ) is not enough. The loading may
//       //       still not yet complete when status becomes 200.
//       notDone =    ( xhr.status !== 200 )
//                 || ( this.allPromiseSet.has( this.loadPromise ) );

      // Not done, if:
      //   - ( .loadPromise still pending (i.e. still in waiting promises) ).
      //
      // Note: If .abort() is called, xhr.status will be changed (from 200)
      //       to 0 even if loading is succeeded. So,
      //         - Do not check ( xhr.status !== 200 ).
      //         - Just check .allPromiseSet.has( .loadPromise ) purely.
      //
      notDone = ( this.allPromiseSet.has( this.loadPromise ) );

    // Stop if loading completely and successfully.
    //
    // Note: The other ways to leave this loop are throwing exceptions (e.g.
    //       the pending promises rejected).
    } while ( notDone );

    // 2. 
    // (2023/02/15) For debug.
    // (When execution to here, the request should have finished successfully.)
    {
      // (2023/02/24 Remarked)
      // If .abort() is called, xhr.status will be changed (from 200) to 0 even
      // if loading is succeeded. So, do not check xhr.status whether 200.
      //
      // // 2.1
      // if ( 200 !== xhr.status ) {
      //   //debugger;
      //   throw Error( `( ${this.url} ) HttpRequest_Fetcher`
      //     + `.asyncGenerator_loading(): `
      //     + `When done, `
      //     + `xhr.status ( ${xhr.status} ) should be 200.` );
      // }

      // 2.2
      if ( 100 != this.progressLoading.valuePercentage ) {
        //debugger;
        throw Error( `( ${this.url} ) HttpRequest_Fetcher`
          + `.asyncGenerator_loading(): `
          + `When done, `
          + `progressLoading.valuePercentage `
          + `( ${this.progressLoading.valuePercentage} ) should be 100.` );
      }
    }

    // 3. Return the successfully downloaded result.
    return xhr.response;
  }

  /**
   * An async generator for tracking retry waiting timer progress.
   *
   * (This method is called by
   * asyncGenerator_by_progressParent_url_timeout_retry_responseType_method_body())
   *
   *
   * @param {HttpRequest_Fetcher} this
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
  static async* asyncGenerator_retryWaiting() {

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpRequest_Fetcher: `
        + `retryWaitingTimer: start: `
        + `retryTimesCur=${this.retryTimesCur}, `
        + `retryWaitingMillisecondsCur=${this.retryWaitingMillisecondsCur}, `
        + `retryWaitingMillisecondsMax=${this.retryWaitingMillisecondsMax}, `
        + `progressRetryWaiting=${this.progressRetryWaiting.valuePercentage}%` );

    // 0. Abort immediately if caller requests.
    //
    // Although, it seems no chance to execute to here if aborted.
    //
    if ( this.bAbort ) {
      return this.progressRoot;
    }

    // 1.
    this.progressRetryWaiting.value_max_set( this.retryWaitingMillisecondsMax );

    // 2.
    HttpRequest_Fetcher.retryWaitingTimerPromise_create_and_set.call( this );

    // All promises to be listened.
    {
      this.allPromiseSet.clear();
      this.allPromiseSet.add( this.retryWaitingTimerPromise );
    }

    // 3. Until done.
    let notDone;
    do {
      let allPromise = Promise.race( this.allPromiseSet );

      // All succeeded promises resolve to progressRoot.
      let progressRoot = await allPromise;
      yield progressRoot;

      // Not done, if:
      //   - HttpRequest_Fetcher.abort() is not called.
      //   - .retryWaitingTimerPromise still exists.
      //
      notDone =    ( !this.bAbort )
                && ( this.allPromiseSet.has( this.retryWaitingTimerPromise ) );

    } while ( notDone ); // Stop if retry waiting completely.

    return this.progressRoot; // 4. Return the total progress.
  }


  /**
   * @param {HttpRequest_Fetcher} this
   */
  static loadingTimerPromise_create_and_set() {
    const delayMilliseconds = this.loadingMillisecondsInterval;
    const deltaValue = delayMilliseconds;
    this.loadingTimerPromise = PartTime.Promise_create_by_setTimeout(
      delayMilliseconds, HttpRequest_Fetcher.handle_loadingTimer,
      this, deltaValue );
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static retryWaitingTimerPromise_create_and_set() {
    const delayMilliseconds = this.retryWaitingMillisecondsInterval;
    const deltaValue = delayMilliseconds;
    this.retryWaitingTimerPromise = PartTime.Promise_create_by_setTimeout(
      delayMilliseconds, HttpRequest_Fetcher.handle_retryWaitingTimer,
      this, deltaValue );
  }


  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_abort( resolve, reject, event ) {
    // Stop listen progress timer (since completed).
    HttpRequest_Fetcher.loadingTimer_cancel.call( this );

    // Advance progress to complete status (event if use timer).
    HttpRequest_Fetcher.progressLoading_set_whenDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpRequest_Fetcher: abort: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    reject( event );

    // Note: The non-repeatable failure event should still be listened on
    //       (i.e. should not removed from this.allPromiseSet), so that the
    //       rejected promise could trigger exception.
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_error( resolve, reject, event ) {
    // Stop listen progress timer (since completed).
    HttpRequest_Fetcher.loadingTimer_cancel.call( this );

    // Advance progress to complete status (event if use timer).
    HttpRequest_Fetcher.progressLoading_set_whenDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpRequest_Fetcher: error: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    reject( event );

    // Note: The non-repeatable failure event should still be listened on
    //       (i.e. should not removed from this.allPromiseSet), so that the
    //       rejected promise could trigger exception.
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_load( resolve, reject, event ) {
    // Stop listen progress timer (since completed).
    HttpRequest_Fetcher.loadingTimer_cancel.call( this );

    // Advance progress to complete status (event if use timer).
    HttpRequest_Fetcher.progressLoading_set_whenDone.call( this, event );

    let xhr = this.xhr;

    let logMsg;
    if ( this.bLogEventToConsole )
      logMsg = `( ${this.url} ) HttpRequest_Fetcher: load: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( event )}, `
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
   * @param {HttpRequest_Fetcher} this
   */
  static handle_loadstart( resolve, reject, event ) {

    // Advance progress only if loadingTimer NOT used.
    if ( !this.loadingTimer_isUsed ) {
      HttpRequest_Fetcher.progressLoading_set_beforeDone.call( this, event );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpRequest_Fetcher: loadstart: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    resolve( this.progressRoot );

    // No longer listen on non-repeatable succeeded event.
    this.allPromiseSet.delete( this.loadstartPromise );
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_progress( resolve, reject, event ) {

    // Advance progress only if loadingTimer NOT used.
    if ( !this.loadingTimer_isUsed ) {
      HttpRequest_Fetcher.progressLoading_set_beforeDone.call( this, event );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpRequest_Fetcher: progress: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    resolve( this.progressRoot );

    // Re-listen on repeatable succeeded event.
    {
      this.allPromiseSet.delete( this.progressPromise );

      // Because progress event could happen many times, re-generate
      // a new promise for listening on it.
      this.progressPromise = PartTime.Promise_create_by_addEventListener_once(
        this.xhr, "progress", HttpRequest_Fetcher.handle_progress, this );

      this.allPromiseSet.add( this.progressPromise );
    }
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_timeout( resolve, reject, event ) {
    // Stop listen progress timer (since completed).
    HttpRequest_Fetcher.loadingTimer_cancel.call( this );

    // Advance progress to complete status (event if use timer).
    HttpRequest_Fetcher.progressLoading_set_whenDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpRequest_Fetcher: timeout: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( event )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    reject( event );

    // Note: The non-repeatable failure event should still be listened on
    //       (i.e. should not removed from this.allPromiseSet), so that the
    //       rejected promise could trigger exception.
  }

  /**
   * @param {HttpRequest_Fetcher} this
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
    if (   ( !this.bAbort )
        && ( this.allPromiseSet.has( this.loadingTimerPromise ) ) ) {
      bAbort = false;

    // User abort. (i.e. .abort() or .loadingTimer_cancel() is called)
    } else {
      bAbort = true;
    }

    // 3.
    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpRequest_Fetcher: loadingTimer: `
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
        HttpRequest_Fetcher.loadingTimerPromise_create_and_set.call( this );
        this.allPromiseSet.add( this.loadingTimerPromise );
      }
    }
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_retryWaitingTimer( resolve, reject, deltaValue ) {
    this.retryWaitingMillisecondsCur += deltaValue;

    // 1.
    let bAbort;
    let bDone;
    if (   ( !this.bAbort )
        && ( this.allPromiseSet.has( this.retryWaitingTimerPromise ) ) ) {
      bAbort = false;

      // Since user not abort, checking time whether exceeds.
      if ( this.retryWaitingMillisecondsCur < this.retryWaitingMillisecondsMax ) {
        bDone = false;
      } else {
        bDone = true;
      }

    // User abort. (i.e. .abort() or .retryWaitingTimer_cancel() is called)
    } else {
      bAbort = true;
      bDone = true; // abort is also a kind of done.
    }

    // 2.
    if ( bDone )
      HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );
    else
      HttpRequest_Fetcher.progressRetryWaiting_set_beforeDone.call( this );

    // 3.
    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpRequest_Fetcher: `
        + `retryWaitingTimer: `
        + `${ bDone ? "done" : "progress" }: `
        + `retryTimesCur=${this.retryTimesCur}, `
        + `retryWaitingMillisecondsCur=${this.retryWaitingMillisecondsCur}, `
        + `retryWaitingMillisecondsMax=${this.retryWaitingMillisecondsMax}, `
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
        HttpRequest_Fetcher.retryWaitingTimerPromise_create_and_set.call( this );
        this.allPromiseSet.add( this.retryWaitingTimerPromise );
      }
    }
  }


  /**
   * Called when loading progress not done (i.e. onloadstart(), onprogrss()).
   *
   * @param {HttpRequest_Fetcher} this
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
      let fakeMax = progressEvent.loaded + HttpRequest_Fetcher.progressTotalFakeLarger;
      this.progressLoading.value_max_set( fakeMax );
      this.progressLoading.value_set( progressEvent.loaded );
    }
  }

  /**
   * Called when loading progress done (i.e. onabort(), onerror(), onload(),
   * ontimeout()).
   *
   * @param {HttpRequest_Fetcher} this
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
   * @param {HttpRequest_Fetcher} this
   */
  static progressRetryWaiting_set_beforeDone() {
    if ( this.progressRetryWaiting ) {
      this.progressRetryWaiting.value_max_set( this.retryWaitingMillisecondsMax );
      this.progressRetryWaiting.value_set( this.retryWaitingMillisecondsCur );
    }
  }

  /**
   * Called when retry waiting progress done.
   *
   * @param {HttpRequest_Fetcher} this
   */
  static progressRetryWaiting_set_whenDone() {
    if ( this.progressRetryWaiting ) {
      this.progressRetryWaiting.value_max_set( this.retryWaitingMillisecondsMax );
      this.progressRetryWaiting.value_set( this.retryWaitingMillisecondsMax );
    }
  }


  /**
   * @param {object} e
   *   An exception object to be checked.
   *
   * @return {boolean}
   *   Return true, if e is XMLHttpRequest related exception. */
  static Exception_is_ProgressEvent_abort_error_load_timeout( e ) {
    if (   ( e instanceof ProgressEvent )
        && (   ( e.type === "abort" )
            || ( e.type === "error" )
            || ( e.type === "load" )
            || ( e.type === "timeout" )
           )
       ) {
      return true;
    }
    return false;  
  }

  /**
   * @param {ProgressEvent} progressEvent  The ProgressEvent to be displayed.
   * @return {string} A string description lengthComputable, loaded, total.
   */
  static ProgressEvent_toString( progressEvent ) {
    let str = `lengthComputable=${progressEvent.lengthComputable}, `
      + `loaded=${progressEvent.loaded}, total=${progressEvent.total}`;
    return str;
  }

}

HttpRequest_Fetcher.methodDefault = "GET";
HttpRequest_Fetcher.responseTypeDefault = "text";

/**
 * If ( ProgressEvent.lengthComputable == false ), it will be assumed that
 * ProgressEvent.total
 *   = ProgressEvent.loaded + HttpRequest_Fetcher.progressTotalFakeLarger.
 *
 * The purpose is to let progress percentage look like still increasing step by
 * step gradually.
 */
HttpRequest_Fetcher.progressTotalFakeLarger = 1024 * 1024;
