export { HttpRequest_Fetcher as Fetcher };

import * as ClassHierarchyTools from "../ClassHierarchyTools.js";
import * as NonReentrant from "../NonReentrant.js";
import * as PartTime from "../PartTime.js";
import * as RandTools from "../RandTools.js";
import * as ValueMax from "../ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import { Params_loading_retryWaiting as HttpRequest_Params_loading_retryWaiting }
  from "./HttpRequest_Params_loading_retryWaiting.js";


//!!! ...unfinished... (2023/03/23)
// Perhaps, test this Fetcher by fetching tensorflow.js.

/**
 * Wrap XMLHttpRequest as an async generator.
 *
 * Note: When retry, the progressParent.valuePercentage will backward to 0%
 *       to restart.
 *
 * @member {boolean} bLogEventToConsole
 *   If true, some debug messages will be logged to console.
 *
 * @member {string} url
 *   A string representing the URL to send the request to.
 *
 * @member {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
 *   The parameters for loading timeout and retry waiting time. It will be
 * kept but not modified by this object.
 *
 * @member {number} loadingMillisecondsCur
 *   The current time (in milliseconds) of loading. It is only used if
 * ( .loadingMillisecondsMax > 0 ).
 *
 * @member {number} retryTimesCur
 *   Now is which times retry.
 *
 * @member {number} retryWaitingMillisecondsMax
 *   The maximum time (in milliseconds) of waiting for retry. It is only used
 * if ( .retryTimesMax > 0 ). It is calculated from
 * .retryWaitingSecondsExponentMax.
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
 *
 *
 * @member {number} loadingYieldIdCurrent
 *   An integer which will be increased by one before every time
 * .load_asyncGenerator() yield. It is either undefined or 0 or positive.
 *
 * @member {number} loadingYieldIdFinal
 *   An integer recording the final yield id of .load_asyncGenerator().
 * It is either undefined or 0 or positive.
 *
 * @member {number} loadingStartStopState
 *   The start-stop state of loading.
 * ValueDesc.StartStopState.Singleton.Ids.Xxx according to
 * .loadingYieldIdCurrent and .loadingYieldIdFinal.
 *
 * @member {string} loadingStartStopState_NameWithIn
 *   The message string for .loadingStartStopState.
 *
 *
 * @member {number} retryWaitingYieldIdCurrent
 *   An integer which will be increased by one before every time
 * .retryWait_asyncGenerator() yield. It is either undefined or 0 or positive.
 *
 * @member {number} retryWaitingYieldIdFinal
 *   An integer recording the final yield id of .retryWaiting_asyncGenerator().
 * It is either undefined or 0 or positive.
 *
 * @member {number} retryWaitingStartStopState
 *   The start-stop state of retry waiting.
 * ValueDesc.StartStopState.Singleton.Ids.Xxx according to
 * .retryWaitingYieldIdCurrent and .retryWaitingYieldIdFinal.
 *
 * @member {string} retryWaitingStartStopState_NameWithIn
 *   The message string for .retryWaitingStartStopState.
 *
 * @member {boolean} retryWaiting_during
 *   Whether now is during retry waiting (i.e. not NOT_YET_STARTED, no matter
 * starting, started, stopping, stopped).
 *
 *
 * @member {boolean} fetch_asyncGenerator_running
 *   If true, a fetch_asyncGenerator is still executing. Please wait it
 * becoming false if wanting to call .fetch_asyncGenerator_create() again.
 *
 * @member {boolean} fetchOk
 *   Whether fetch_asyncGenerator is succeeded.
 *
 * @member {Function} fetch_asyncGenerator_create
 *   A method for creating .fetch_asyncGenerator().
 *     - It accepts the same parameters as .fetch_asyncGenerator().
 *     - It returns an async generator.
 */
class HttpRequest_Fetcher
  extends NonReentrant.asyncGenerator(
    "fetch", relay_fetch_asyncGenerator ) {

  /**
   *
   */
  constructor( bLogEventToConsole , ...restArgs ) {
    super( ...restArgs );
    HttpRequest_Fetcher.setAsConstructor_self.call( this,
      bLogEventToConsole );
  }

  /** @override */
  static setAsConstructor( bLogEventToConsole , ...restArgs ) {
    super.setAsConstructor.apply( this, restArgs );
    HttpRequest_Fetcher.setAsConstructor_self.call( this,
      bLogEventToConsole );
    return this;
  }

  /** @override */
  static setAsConstructor_self( bLogEventToConsole ) {
    this.bLogEventToConsole = bLogEventToConsole;
    this.allPromiseSet = new Set();
  }

  /** @override */
  disposeResources() {

    this.retryWaitingYieldIdFinal = undefined;
    this.retryWaitingYieldIdCurrent = undefined;

    this.loadingYieldIdFinal = undefined;
    this.loadingYieldIdCurrent = undefined;

    this.retryWaitingTimerPromise = undefined;
    this.retryWaitingMillisecondsCur = undefined;
    this.retryWaitingMillisecondsMax = undefined;

    this.loadingTimerPromise = undefined;
    this.loadingMillisecondsCur = undefined;

    this.timeoutPromise = undefined;
    this.progressPromise = undefined;
    this.loadstartPromise = undefined;
    this.loadPromise = undefined;
    this.errorPromise = undefined;
    this.abortPromise = undefined;

    this.xhr = undefined;

    this.contentLoaded = undefined;
    this.contentTotal = undefined;

    this.bAbort = undefined;

    // Note: .progressLoading and progressRetryWaiting are not owned by this
    //       HttpRequest_Fetcher object. They should be destroyed by outside
    //       caller (i.e. by progressParent). Here just nullify them.
    this.progressRetryWaiting = undefined;
    this.progressLoading = undefined;

    this.retryTimesCur = undefined;

    this.body = undefined;
    this.method = undefined;
    this.responseType = undefined;
    this.params_loading_retryWaiting = undefined;
    this.url = undefined;
    this.progressParent = undefined;
    this.progressRoot = undefined;

    this.allPromiseSet = undefined;
    this.bLogEventToConsole = undefined;

    // If parent class has the same method, call it.    
    if ( super.disposeResources instanceof Function )
      super.disposeResources();
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


  get loadingStartStopState() {
    let nStartStopState
      = ValueDesc.StartStopState.determine_byCurrentFinal(
          this.loadingYieldIdCurrent, this.loadingYieldIdFinal );
    return nStartStopState;
  }

  get loadingStartStopState_NameWithInt() {
    let strStartStopState
      = ValueDesc.StartStopState.Singleton.getNameWithInt_byId(
          this.loadingStartStopState );
    return strStartStopState;
  }

  get retryWaitingStartStopState() {
    let nStartStopState
      = ValueDesc.StartStopState.determine_byCurrentFinal(
          this.retryWaitingYieldIdCurrent, this.retryWaitingYieldIdFinal );
    return nStartStopState;
  }

  get retryWaitingStartStopState_NameWithInt() {
    let strStartStopState
      = ValueDesc.StartStopState.Singleton.getNameWithInt_byId(
          this.retryWaitingStartStopState );
    return strStartStopState;
  }

  get retryWaiting_during() {
    let retryWaitingStartStopState = this.retryWaitingStartStopState;
    if ( retryWaitingStartStopState
           != ValueDesc.StartStopState.Singleton.Ids.NOT_YET_STARTED )
      return true; // No matter starting, started, stopping, stopped.
    return false;
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
   * @return {string}
   *   Return a string describing .retryTimesCur and .retryTimesMax.
   *   - If ( .retryTimesCur == 0 ), empty string.
   *   - If ( .retryTimesCur > 0 ):
   *     - If ( .retryTimesMax < 0 ), `${retryTimesCur}`
   *     - If ( .retryTimesMax > 0 ), `${retryTimesCur}/${retryTimesMax}`
   */
  get retryTimes_CurMax_string() {
    if ( this.retryTimesCur <= 0 )
      return ""; // Not during retry.
    if ( this.retryTimesMax < 0 )
      return `${this.retryTimesCur}`; // Infinite retry times.
    // Finite retry times.
    return `${this.retryTimesCur}/${this.retryTimesMax}`;
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
        this.progressLoading.value_max_set( 0, 0 );
      }
    }

    HttpRequest_Fetcher.retryWaitingTimer_cancel.call( this );
  }


  /**
   * An async generator for sending a http request and tracking its progress
   * (with retry).
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent.
   * The created progressToAdvance will be increased when every time advanced.
   * The progressParent.root_get() will be returned when every time yield.
   *
   * @return {AsyncGenerator}
   *   Return an async generator for receving result from XMLHttpRequest.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to
   * { done: false, value: progressParent.root_get() }.
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
  static async* fetch_asyncGenerator(
    progressParent,
    url,

    params_loading_retryWaiting
      = HttpRequest_Fetcher.params_loading_retryWaiting_default,

    responseType = HttpRequest_Fetcher.responseTypeDefault,
    method = HttpRequest_Fetcher.methodDefault,

//!!! ...unfinished... (2023/04/14)
// Perhaps, add fetch API's Headers objects.

    body
  ) {

    const funcNameInMessage = "fetch_asyncGenerator";

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
    }

    // load-wait-retry
    let fetchResult;
    try {
      let bRetry;
      do {
        // 1. Try to load.
        try {
          // Before yield, initialize current and final yield id.
          {
            this.loadingYieldIdCurrent = undefined;
            this.loadingYieldIdFinal = undefined;

            this.retryWaitingYieldIdCurrent = undefined;
            this.retryWaitingYieldIdFinal = undefined;
          }

          let responseText
            = yield* HttpRequest_Fetcher.load_asyncGenerator.call( this );

          // No need to retry, since request is succeeded (when executed to
          // here).
          bRetry = false;

          fetchResult = responseText;
          this.fetchOk = true;

        // 2. Determine whether should retry.
        } catch( e ) {

          if ( e instanceof ProgressEvent ) {

            // 2.1 Never retry for user abort.
            if ( e.type === "abort" ) {
              bRetry = false;

            // 2.2 Retry only if recognized exception and still has retry
            //     times.
            } else if (   ( e.type === "error" )
                          // ( status != 200 ) (e.g. 404 or 500)
                       || ( e.type === "load" )
                       || ( e.type === "timeout" ) ) { 

              let bRetryTimesRunOut = this.retryTimes_isRunOut;
              if ( bRetryTimesRunOut ) {
                // 2.2.1 Can not retry, because run out of retry times.
                bRetry = false;

              } else {
                bRetry = true; // 2.2.2 Retry one more time.
              }

            // 2.3 Unknown ProgressEvent. (Never retry for unknown error.)
            } else {
              bRetry = false;
            }

          } else { // 2.4 Unknown error. (Never retry for unknown error.)
            bRetry = false;
          }

          // 3. Throw exception if not retry.
          if ( !bRetry ) {
            fetchResult = null;
            this.fetchOk = false;
            throw e;
          }
        }

        // 4.
        if ( bRetry ) {
          // If retry, waiting before it (i.e. truncated exponential backoff
          // algorithm).
          yield* HttpRequest_Fetcher.retryWait_asyncGenerator.call( this );
        } else {
        }

      } while ( bRetry && ( !this.bAbort ) );

      // When executed to here, fetchResult should be:
      //   - an object, if succeeded.
      //   - null, if failed and can not continue to retry.
      //   - undefined, if aborted during retry waiting.
      //     - In this case, force it to null. (Otherwise,
      //         NonReentrant_asyncGenerator will alert it.)
      //
      // Note: fetchResult can not be undefined. Otherwise, NonReentrant will
      //       thow exception.
      if ( fetchResult === undefined ) {
        if ( this.bAbort ) {
          fetchResult = null;
          this.fetchOk = false;
        }
      }

    } finally {
      // Ensure this async generator will not be aborted by default when it is
      // called in the next time.
      this.bAbort = false;

      // Check post-condition.
      {
        // No matter how terminated, loading state should always be STOPPED.
        HttpRequest_Fetcher.throw_if_loadingStartStopState_not_STOPPED
          .call( this, funcNameInMessage );

        // retry waiting state may be NOT_YET_STARTED (in normal) or STOPPED
        // (if aborted during retry waiting).
        HttpRequest_Fetcher
          .throw_if_retryWaitingStartStopState_not_NOT_YET_STARTED_or_not_STOPPED
          .call( this, funcNameInMessage );

        // No matter how terminated, progressLoading and progressRetryWaiting
        // (if exists) should always be 100.
        HttpRequest_Fetcher.throw_if_progress_not_100
          .call( this, funcNameInMessage );
      }
    }

    // 5. Return the successfully downloaded result.
    return fetchResult;
  }

  /**
   * An async generator for sending a http request and tracking its progress
   * (without retry).
   *
   * (This method is called by .fetch_asyncGenerator())
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
  static async* load_asyncGenerator() {

    // 0.

    // 0.1
    this.contentLoaded = undefined;
    this.contentTotal = undefined;

    // 0.2 Reset loading progress.
    let progressLoading_max_default;
    {
      if ( this.loadingTimer_isUsed ) { // Use timeout time as progress target.
        progressLoading_max_default = this.loadingMillisecondsMax;
        this.loadingMillisecondsCur = 0;
      } else { // Use total content length (perhaps unknown) as progress target.
        progressLoading_max_default = HttpRequest_Fetcher.progressTotalFakeLarger;
        this.loadingMillisecondsCur = undefined;
      }
    }

    this.progressLoading.value_max_set( 0, progressLoading_max_default );

    // 0.4 Inform outside caller progress when begin loading.
    //
    // Before yield progress, current and final index must be setup.
    // So that outside caller can detect start-stop state of retry waiting.
    this.loadingYieldIdCurrent = 0; // starting.
    this.loadingYieldIdFinal = undefined;
    yield this.progressRoot;

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
    let allPromiseRace;
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

      // Note: The .allPromiseSet should be used before xhr.send(). Otherwise,
      //       some events may be resolved (and change .allPromiseSet).
      allPromiseRace = Promise.race( this.allPromiseSet );
    }

    try {
      // 2.
      //
      // Note: .send() seems possible throw exception. Place it inside
      //       try-catch.
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

      // 3. Until done or failed.
      let notDone;
      do {

        // 3.1 Wait event happened and adjust .allPromiseSet by itself.
        //
        // All succeeded promises resolve to progressRoot.
        //   - Except .loadingTimerPromise resolved to .handle_loadingTimer
        //
        // All failed promises reject to (i.e. throw exception of)
        // ProgressEvent.
        let progressRoot__or__handle_loadingTimer = await allPromiseRace;

        // 3.2 Determine whether is done according to .allPromiseSet.
        //
        // Not done, if:
        //   - ( .loadPromise still pending (i.e. still in waiting promises) ).
        //
        // Note: If .abort() is called, xhr.status will be changed (from 200)
        //       to 0 even if loading is succeeded. So,
        //         - Do not check ( xhr.status !== 200 ).
        //         - Just check .allPromiseSet.has( .loadPromise ) purely.
        //
        notDone = ( this.allPromiseSet.has( this.loadPromise ) );

        // 3.3
        if ( notDone ) {

          // 3.3.1 If not done, handle loading timer.
          //
          // Note: If done, do not handle loading timer. Otherwise, the
          //       progressLoading 100 (e.g. by load event) may be destroyed by
          //       loading timer.
          if ( progressRoot__or__handle_loadingTimer
                === HttpRequest_Fetcher.handle_loadingTimer ) {
            // loadingTimerPromise resolved.
            HttpRequest_Fetcher.handle_loadingTimer.call( this );
          }

          // 3.3.2 If not done, continue to listen them.
          //
          // Note: The .allPromiseSet should be used before yield. Otherwise,
          //       some events may be resolved (and change .allPromiseSet)
          //       during yield.
          allPromiseRace = Promise.race( this.allPromiseSet );
        }

        // 3.4 Report progress.
        {
          ++this.loadingYieldIdCurrent; // started.
          if ( !notDone )
            this.loadingYieldIdFinal = this.loadingYieldIdCurrent; // stopping.

          yield this.progressRoot;
        }

      // Stop if loading completely and successfully.
      //
      // Note: The other ways to leave this loop are throwing exceptions (e.g.
      //       the pending promises rejected).
      } while ( notDone );

    } catch ( e ) {
      // 3.5 (e.g. abort, error, timeout, ...)
      this.loadingYieldIdFinal = this.loadingYieldIdCurrent; // stopping.
      throw e;

    } finally {
      // 3.6 Ensure stopped even if exception.
      ++this.loadingYieldIdCurrent; // stopped.
    }

    // 4. Check post-condition.
    //
    // (When execution to here, the request should have finished successfully.)
    {
      // (2023/02/24 Remarked)
      // If .abort() is called, xhr.status will be changed (from 200) to 0 even
      // if loading is succeeded. So, do not check xhr.status whether 200.
      //
      // // 4.1
      // if ( 200 !== xhr.status ) {
      //   //debugger;
      //   throw Error( `HttpRequest_Fetcher.load_asyncGenerator(): `
      //     + `When done, xhr.status ( ${xhr.status} ) should be 200.` );
      // }

      // 4.2
      //   - Either both .value and .max are 0 (error, timeout, abort).
      //   - Or both .value and .max are non-zero (load, but status 404 File
      //       Not Found).
      if ( 100 != this.progressLoading.valuePercentage ) {
        //debugger;
        throw Error( `HttpRequest_Fetcher.load_asyncGenerator(): `
          + `When done, progressLoading.valuePercentage `
          + `( ${this.progressLoading.valuePercentage} ) should be 100.` );
      }
    }

    // 5. Return the successfully downloaded result.
    return xhr.response;
  }

  /**
   * An async generator for tracking retry waiting timer progress.
   *
   * (This method is called by .fetch_asyncGenerator())
   *
   *
   * @param {HttpRequest_Fetcher} this
   *
   * @param {ValueMax.Percentage.Concrete} this.progressRetryWaiting
   *   This .progressRetryWaiting will be increased when every time advanced.
   * The this.progressRoot will be returned when every time yield.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: this.progressRoot }.
   *
   * @yield {Promise( object )}
   *   Yield a promise resolves to { done: true, value: this.progressRoot }.
   */
  static async* retryWait_asyncGenerator() {

    // 0.

    // 0.1 .progressLoading should become 0%, since now is going to retry.
    {
      const arbitraryNonZero = 1;
      this.progressLoading.value_max_set( 0, arbitraryNonZero );
    }

    // 0.2 .progressRetryWaiting is only created when first times retry
    //     waiting.
    //
    // Note: Although .progressLoading and progressRetryWaiting is recorded in
    //       this, they are not owned by this HttpRequest_Fetcher object. They
    //       should be destroyed by outside caller (i.e. by progressParent).
    //
    if ( !this.progressRetryWaiting ) {
      this.progressRetryWaiting = this.progressParent.child_add(
        ValueMax.Percentage.Concrete.Pool.get_or_create_by() );
    }

    // 1.
    {
      // 1.1 Because .retryTimesCur affects .retryTimes_isRunOut which affects
      //     .retryWaitingMillisecondsMax and .retryWaitingMillisecondsCur,
      //     determine them before .retryTimesCur being increased.
      HttpRequest_Fetcher.retryWaitingMilliseconds_init.call( this );
      HttpRequest_Fetcher.progressRetryWaiting_set_beforeDone.call( this );
  
      // 1.2 Before yield, start retry waiting timer. So that it can be
      //     canceled if .abort() is called during the yield.
      HttpRequest_Fetcher.retryWaitingTimerPromise_create_and_set.call( this );

      // 1.3 Before log message and yield progress, current and final
      //     yield id must be setup. So that log message and outside caller
      //     have consistent start-stop state of retry waiting.
      this.retryWaitingYieldIdCurrent = 0; // starting.
      this.retryWaitingYieldIdFinal = undefined;

      // 1.4 Before log message, increase .retryTimesCur (so that log messages
      //     have correct .retryTimesCur).
      ++this.retryTimesCur;

      // 1.5 Before yield, log message. So that outside caller and debugger
      //     have consistent feeling.
      //
      // Note: Log must be after .retryTimesCur being increased, because it is
      //       used in the log message.
      HttpRequest_Fetcher.retryWaiting_log.call( this, "start" );

      // 1.6 Inform outside caller progress when begin retry waiting.
      yield this.progressRoot;
    }

    try {
      // 2. Abort immediately if caller requests.
      if ( this.bAbort ) {

        // Before log message and yield progress, increase current yield id.
        // So that log message and outside caller have consistent start-stop
        // state of retry waiting.
        ++this.retryWaitingYieldIdCurrent; // started.

        HttpRequest_Fetcher.retryWaiting_log.call( this, "abort at start" );
        HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );

        // Inform outside caller progress when stopping retry waiting.
        {
          // stopping.
          this.retryWaitingYieldIdFinal = this.retryWaitingYieldIdCurrent;
          yield this.progressRoot;
        }

        return;
      }

      // 3. Until done.
      let notDone;
      do {
        // 3.1 Before handle retry waiting and yield progress, increase
        //     current yield id. So that log message inside the retry waiting
        //     handler and outside caller have consistent start-stop state of
        //     retry waiting.
        ++this.retryWaitingYieldIdCurrent; // started.

        // 3.2
        //
        // During the yield (before the end of this do-while loop), the
        // this.retryWaitingTimerPromise may become null (e.g.
        // retryWaitingTimer_cancel() is called).
        //
        // So, check it before await on it. Otherwise, null will be got.
        if ( this.retryWaitingTimerPromise ) {
          await this.retryWaitingTimerPromise;
          HttpRequest_Fetcher.handle_retryWaitingTimer.call( this );
        }

        // 3.3 Determine whether retry waiting is done.
        //
        // Not done, if:
        //   - HttpRequest_Fetcher.abort() is not called.
        //   - .retryWaitingTimerPromise still exists.
        //
        notDone =    ( !this.bAbort )
                  && ( this.retryWaitingTimerPromise );

        // 3.4 Inform outside caller progress when step retry waiting.
        {
          if ( !notDone ) // stopping.
            this.retryWaitingYieldIdFinal = this.retryWaitingYieldIdCurrent;
  
          // Although .retryWaitingTimerPromise will resolve to progressRoot,
          // null will be got if it has become null (i.e. await on null). So,
          // do not rely on it. Use this.progressRoot directly instead.
          yield this.progressRoot;
        }

      } while ( notDone ); // Stop if retry waiting completely.

    } catch ( e ) {
      // 3.5 stopping.
      this.retryWaitingYieldIdFinal = this.retryWaitingYieldIdCurrent;
      throw e;

    } finally {
      // 3.6 Ensure stopped even if exception.
      ++this.retryWaitingYieldIdCurrent; // stopped.

      // 4. If there is no more retry times, remove the progressRetryWaiting
      //    so that only progressLoading occupies the whole progressParent.
      if ( this.retryTimes_isRunOut ) {
        this.progressParent.child_dispose( this.progressRetryWaiting );
        this.progressRetryWaiting = undefined;
      }

      // 5. Since there is no chance to retry loading, force .progressLoading
      //    100% directly.
      if ( this.bAbort )
        this.progressLoading.value_set_as_max();
    }

    return;
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


  /**
   * @param {HttpRequest_Fetcher} this
   */
  static retryWaitingMilliseconds_init() {

    // No need (or can not) retry.
    if ( this.retryTimes_isRunOut ) {
      // So that always ( .progressRetryWaiting.valuePercentage == 100% )
      this.retryWaitingMillisecondsMax = 0;
      this.retryWaitingMillisecondsCur = undefined;

      // (should not execute to here.)
      throw Error( `HttpRequest_Fetcher.retryWaitingMilliseconds_init(): `
        + `should not be called when `
        + `.retryTimes_isRunOut ( ${this.retryTimes_isRunOut} ) is true.`
      );

    // Still could retry.
    } else {
      this.retryWaitingMillisecondsMax
        = 1000 * RandTools.getRandomInt_TruncatedBinaryExponent(
            this.retryTimesCur, this.retryWaitingSecondsExponentMax );

      this.retryWaitingMillisecondsCur = 0;
    }
  }

  /** Cancel current retryWaitingTimer (if exists).
   *
   * @param {HttpRequest_Fetcher} this
   */
  static retryWaitingTimer_cancel() {
    if ( !this.retryWaitingTimerPromise )
      return;

    this.retryWaitingTimerPromise.cancelTimer(); // Stop timer.

    // Canceling retry timer may result in:
    //   - .handle_retryWaitingTimer() never be called.
    //       So, let the retry waiting progress done (100%) here.
    //
    //   - .retryWait_asyncGenerator() be blocked forever.
    //       So, resolve the retry waiting promise here.
    //
    {
      HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );
      HttpRequest_Fetcher.retryWaiting_log.call( this, "cancel" );

      this.retryWaitingTimerPromise.resolve( this.progressRoot );
    }

    this.retryWaitingTimerPromise = null;
  }


  /**
   * @param {HttpRequest_Fetcher} this
   */
  static loadingTimerPromise_create_and_set() {
    const delayMilliseconds = this.loadingMillisecondsInterval;
    //const deltaValue = delayMilliseconds;
    this.loadingTimerPromise = PartTime.delayedValue(
      delayMilliseconds, HttpRequest_Fetcher.handle_loadingTimer );

    // Q: Why use PartTime.delayedValue rather than
    //      PartTime.Promise_create_by_setTimeout()?
    // A: For using loop instead of recursive (which may result in stack
    //      overflow if too many times trigger).
    //
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static retryWaitingTimerPromise_create_and_set() {
    const delayMilliseconds = this.retryWaitingMillisecondsInterval;
    //const deltaValue = delayMilliseconds;
    this.retryWaitingTimerPromise = PartTime.delayedValue(
      delayMilliseconds, this.progressRoot );
  }


  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_abort( resolve, reject, progressEvent ) {
    // Stop listen progress timer (since completed).
    HttpRequest_Fetcher.loadingTimer_cancel.call( this );

    // Advance progress to complete status (even if use timer).
    HttpRequest_Fetcher.progressLoading_set_whenDone.call( this,
      progressEvent );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpRequest_Fetcher: abort: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( progressEvent )}, `
        + `${HttpRequest_Fetcher.loadingYieldId_toString.call( this )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    reject( progressEvent );

    // Note: The non-repeatable failure event should still be listened on
    //       (i.e. should not removed from this.allPromiseSet), so that the
    //       rejected promise could trigger exception.
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_error( resolve, reject, progressEvent ) {
    // Stop listen progress timer (since completed).
    HttpRequest_Fetcher.loadingTimer_cancel.call( this );

    // Advance progress to complete status (even if use timer).
    HttpRequest_Fetcher.progressLoading_set_whenDone.call( this,
      progressEvent );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpRequest_Fetcher: error: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( progressEvent )}, `
        + `${HttpRequest_Fetcher.loadingYieldId_toString.call( this )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    reject( progressEvent );

    // Note: The non-repeatable failure event should still be listened on
    //       (i.e. should not removed from this.allPromiseSet), so that the
    //       rejected promise could trigger exception.
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_load( resolve, reject, progressEvent ) {
    // Stop listen progress timer (since completed).
    HttpRequest_Fetcher.loadingTimer_cancel.call( this );

    // Advance progress to complete status (even if use timer).
    HttpRequest_Fetcher.progressLoading_set_whenDone.call( this,
      progressEvent );

    let xhr = this.xhr;

    let logMsg;
    if ( this.bLogEventToConsole )
      logMsg = `( ${this.url} ) HttpRequest_Fetcher: load: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( progressEvent )}, `
        + `status=${xhr.status}, statusText=\"${xhr.statusText}\", `
        + `${HttpRequest_Fetcher.loadingYieldId_toString.call( this )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%`;

    if ( xhr.status === 200 ) {
      // Load completely and successfully.
      if ( this.bLogEventToConsole )
        console.log( logMsg );

      resolve( this.progressRoot );

      // No longer listen on non-repeatable succeeded event.
      this.allPromiseSet.delete( this.loadPromise );

    } else {
      // Load completely but failed (e.g. ( status == 400 ) or
      // ( status == 500 ) ).
      if ( this.bLogEventToConsole )
        console.warn( logMsg );

      reject( progressEvent );

      // Note: The non-repeatable failure event should still be listened on
      //       (i.e. should not removed from this.allPromiseSet), so that the
      //       rejected promise could trigger exception.
    }
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_loadstart( resolve, reject, progressEvent ) {

    // Advance progress only if loadingTimer NOT used.
    if ( !this.loadingTimer_isUsed ) {
      HttpRequest_Fetcher.progressLoading_set_beforeDone.call( this,
        progressEvent );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpRequest_Fetcher: loadstart: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( progressEvent )}, `
        + `${HttpRequest_Fetcher.loadingYieldId_toString.call( this )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    resolve( this.progressRoot );

    // No longer listen on non-repeatable succeeded event.
    this.allPromiseSet.delete( this.loadstartPromise );
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_progress( resolve, reject, progressEvent ) {

    // Advance progress only if loadingTimer NOT used.
    if ( !this.loadingTimer_isUsed ) {
      HttpRequest_Fetcher.progressLoading_set_beforeDone.call( this,
        progressEvent );
    }

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpRequest_Fetcher: progress: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( progressEvent )}, `
        + `${HttpRequest_Fetcher.loadingYieldId_toString.call( this )}, `
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
  static handle_timeout( resolve, reject, progressEvent ) {
    // Stop listen progress timer (since completed).
    HttpRequest_Fetcher.loadingTimer_cancel.call( this );

    // Advance progress to complete status (even if use timer).
    HttpRequest_Fetcher.progressLoading_set_whenDone.call( this,
      progressEvent );

    if ( this.bLogEventToConsole )
      console.warn( `( ${this.url} ) HttpRequest_Fetcher: timeout: `
        + `${HttpRequest_Fetcher.ProgressEvent_toString( progressEvent )}, `
        + `${HttpRequest_Fetcher.loadingYieldId_toString.call( this )}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    reject( progressEvent );

    // Note: The non-repeatable failure event should still be listened on
    //       (i.e. should not removed from this.allPromiseSet), so that the
    //       rejected promise could trigger exception.
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static handle_loadingTimer() {

    // 1.
    this.loadingMillisecondsCur += this.loadingMillisecondsInterval;
    if ( this.loadingMillisecondsCur > this.loadingMillisecondsMax )
      this.loadingMillisecondsCur = this.loadingMillisecondsMax;

    // 2.
    let bDoneByOthers;
    if (   ( !this.bAbort )
        && ( this.allPromiseSet.has( this.loadingTimerPromise ) ) ) {
      bDoneByOthers = false;

    // User abort. (i.e. .abort() or .loadingTimer_cancel() is called
    // (because other event (e.g. load event) finished).
    } else {
      bDoneByOthers = true;
    }

    // 3. Advance progress only if loadingTimer used, and not finished by
    //    others. (Otherwise, the progress (e.g. 100%) may be destroyed.)
    if (   ( this.loadingTimer_isUsed )
        && ( !bDoneByOthers ) ) {
      this.progressLoading.value = this.loadingMillisecondsCur;
    }

    // 4.
    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpRequest_Fetcher: loadingTimer: `
        + `${HttpRequest_Fetcher.loadingYieldId_toString.call( this )}, `
        + `loadingMillisecondsCur=${this.loadingMillisecondsCur}, `
        + `loadingMillisecondsMax=${this.loadingMillisecondsMax}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

    // 5. Re-listen on repeatable succeeded event.
    {
      this.allPromiseSet.delete( this.loadingTimerPromise );

      // If user abort or done, no need to re-generate promise.
      if ( bDoneByOthers ) {
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
  static handle_retryWaitingTimer() {

    // 1.
    this.retryWaitingMillisecondsCur += this.retryWaitingMillisecondsInterval;
    if ( this.retryWaitingMillisecondsCur > this.retryWaitingMillisecondsMax )
      this.retryWaitingMillisecondsCur = this.retryWaitingMillisecondsMax;

    // 2.
    let bAbort;
    let bDone;
    if (   ( !this.bAbort )
        && ( this.retryWaitingTimerPromise ) ) {
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

    // 3.
    if ( bDone )
      HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );
    else
      HttpRequest_Fetcher.progressRetryWaiting_set_beforeDone.call( this );

    // 4.
    const phaseString = bAbort ? "abort" : ( bDone ? "done" : "progress" );
    HttpRequest_Fetcher.retryWaiting_log.call( this, phaseString );

    // 5. Re-listen on repeatable succeeded event.
    {
      // If done (include user abort), no need to re-generate promise.
      if ( bDone ) {
        this.retryWaitingTimerPromise = null;

      // Before retryWaitingTimer done, its event could happen many times.
      } else {
        // Re-generate a new promise for listening on it.
        HttpRequest_Fetcher.retryWaitingTimerPromise_create_and_set
          .call( this );
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
      this.progressLoading.value_max_set(
        progressEvent.loaded, progressEvent.total );

    } else { // Fake an incremental never-100% progress percentage.
      let fakeMax
        = progressEvent.loaded + HttpRequest_Fetcher.progressTotalFakeLarger;
      this.progressLoading.value_max_set( progressEvent.loaded, fakeMax );
    }
  }

  /**
   * Called when loading progress done (i.e. onabort(), onerror(), onload(),
   * ontimeout()).
   *
   * It will ensure .progressLoading become 100%.
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

    if ( progressEvent.lengthComputable ) {
      this.progressLoading.value_max_set(
        progressEvent.loaded, progressEvent.total );

    } else { // Complete the fake progress to 100%.
      this.progressLoading.value_max_set(
        progressEvent.loaded, progressEvent.loaded );
    }
  }


  /**
   * Called when retry waiting progress not done.
   *
   * @param {HttpRequest_Fetcher} this
   */
  static progressRetryWaiting_set_beforeDone() {
    if ( this.progressRetryWaiting ) {
      this.progressRetryWaiting.value_max_set(
        this.retryWaitingMillisecondsCur, this.retryWaitingMillisecondsMax );
    }
  }

  /**
   * Called when retry waiting progress done.
   *
   * It will ensure .progressRetryWaiting become 100%.
   *
   * @param {HttpRequest_Fetcher} this
   */
  static progressRetryWaiting_set_whenDone() {
    if ( this.progressRetryWaiting ) {
      this.progressRetryWaiting.value_max_set(
        this.retryWaitingMillisecondsMax, this.retryWaitingMillisecondsMax );
    }
  }


  /**
   * @param {HttpRequest_Fetcher} this
   */
  static retryWaiting_log( phaseString ) {
    if ( !this.bLogEventToConsole )
      return;

    console.log( `( ${this.url} ) HttpRequest_Fetcher: `
      + `retryWaitingTimer: ${phaseString}: `
      + `retryTimesCur=${this.retryTimesCur}, `
      + `${HttpRequest_Fetcher.retryWaitingYieldId_toString.call( this )}, `
      + `retryWaitingMillisecondsCur=${this.retryWaitingMillisecondsCur}, `
      + `retryWaitingMillisecondsMax=${this.retryWaitingMillisecondsMax}, `
      + `progressRetryWaiting=${this.progressRetryWaiting.valuePercentage}%`
    );
  }


  /**
   * @param {HttpRequest_Fetcher} this
   */
  static loadingYieldId_toString() {
    let str =
        `loadingYieldIdCurrent=${this.loadingYieldIdCurrent}, `
      + `loadingYieldIdFinal=${this.loadingYieldIdFinal}, `
      + `loadingStartStopState=${this.loadingStartStopState_NameWithInt}`
      ;
    return str;
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static retryWaitingYieldId_toString() {
    let str =
        `retryWaitingYieldIdCurrent=${this.retryWaitingYieldIdCurrent}, `
      + `retryWaitingYieldIdFinal=${this.retryWaitingYieldIdFinal}, `
      + `retryWaitingStartStopState=${this.retryWaitingStartStopState_NameWithInt}`
      ;
    return str;
  }


  /**
   * @param {HttpRequest_Fetcher} this
   *
   * @param {string} propertyName
   *   this[ propertyName ] will be compared with nStartStopState.
   *
   * @param {number[]} comparedStartStopStateArray
   *   The start-stop states (i.e. ValueDesc.StartStopState.Singleton.Ids.Xxx)
   * to be compared with. If this[ propertyName ] is not one of it, throw
   * exception.
   */
  static throw_if_StartStopState_not_one_of(
    funcNameInMessage, propertyName, comparedStartStopStateArray ) {

    const propertyStartStopState = this[ propertyName ];
    for ( let i = 0; i < comparedStartStopStateArray.length; ++i ) {
      const comparedStartStopState = comparedStartStopStateArray[ i ];
      if ( propertyStartStopState == comparedStartStopState )
        return; // Found.
    }

    const mostDerivedClassName
      = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

    const propertyStartStopStateName = ValueDesc.StartStopState.Singleton
      .getNameWithInt_byId( propertyStartStopState );

    let comparedStartStopStateNamesString; // Collect names of compared state.
    {
      let comparedStartStopStateNameArray
        = new Array( comparedStartStopStateArray.length );

      for ( let i = 0; i < comparedStartStopStateArray.length; ++i ) {
        const comparedStartStopState = comparedStartStopStateArray[ i ];
        const comparedStartStopStateName = ValueDesc.StartStopState.Singleton
          .getNameWithInt_byId( comparedStartStopState );
        comparedStartStopStateNameArray[ i ] = comparedStartStopStateName;
      }

      comparedStartStopStateNamesString
        = comparedStartStopStateNameArray.join( ", " );
    }

    throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
      + `.${propertyName} ( ${propertyStartStopStateName} ) `
      + `should be one of [ ${comparedStartStopStateNamesString} ].` );
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static throw_if_loadingStartStopState_not_one_of(
    funcNameInMessage, comparedStartStopStateArray ) {
    HttpRequest_Fetcher.throw_if_StartStopState_not_one_of.call( this,
      funcNameInMessage, "loadingStartStopState",
      comparedStartStopStateArray );
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static throw_if_retryWaitingStartStopState_not_one_of(
    funcNameInMessage, comparedStartStopStateArray ) {
    HttpRequest_Fetcher.throw_if_StartStopState_not_one_of.call( this,
      funcNameInMessage, "retryWaitingStartStopState",
      comparedStartStopStateArray );
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static throw_if_loadingStartStopState_not_STOPPED( funcNameInMessage ) {
    HttpRequest_Fetcher.throw_if_loadingStartStopState_not_one_of
      .call( this,
        funcNameInMessage, HttpRequest_Fetcher.StartStopStateArray__STOPPED );
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static throw_if_retryWaitingStartStopState_not_NOT_YET_STARTED_or_not_STOPPED(
    funcNameInMessage ) {
    HttpRequest_Fetcher.throw_if_retryWaitingStartStopState_not_one_of
      .call( this,
        funcNameInMessage,
        HttpRequest_Fetcher.StartStopStateArray__NOT_YET_STARTED__STOPPED );
  }

  /**
   * @param {HttpRequest_Fetcher} this
   */
  static throw_if_progress_not_100( funcNameInMessage ) {
    // Note: Because .progressParent may contain other progress besides
    //       .progressLoading and .progressRetryWaiting, do not check it
    //       directly.

    if ( 100 != this.progressLoading.valuePercentage ) {
      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
      + `.progressLoading.valuePercentage ( `
      + `${this.progressLoading.valuePercentage} ) `
      + `should be 100.` );
    }

    if ( !this.progressRetryWaiting )
      return; // retry times is run out. (It's ok.)

    if ( 100 != this.progressRetryWaiting.valuePercentage ) {
      const mostDerivedClassName
        = ClassHierarchyTools.MostDerived_ClassName_of_Instance( this );

      throw Error( `${mostDerivedClassName}.${funcNameInMessage}(): `
        + `.progressRetryWaiting.valuePercentage ( `
        + `${this.progressRetryWaiting.valuePercentage} ) `
        + `should be 100.` );
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

HttpRequest_Fetcher.params_loading_retryWaiting_default
  = new HttpRequest_Params_loading_retryWaiting();

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


HttpRequest_Fetcher.StartStopStateArray__STOPPED = [
  ValueDesc.StartStopState.Singleton.Ids.STOPPED ];

HttpRequest_Fetcher.StartStopStateArray__NOT_YET_STARTED__STOPPED = [
  ValueDesc.StartStopState.Singleton.Ids.NOT_YET_STARTED,
  ValueDesc.StartStopState.Singleton.Ids.STOPPED
];


/**
 *
 * @param {HttpRequest_Fetcher} this
 *
 * @return {AsyncGenerator}
 *   Return the newly created instance of
 * HttpRequest_Fetcher.fetch_asyncGenerator().
 */
function relay_fetch_asyncGenerator( ...restArgs ) {
  return HttpRequest_Fetcher.fetch_asyncGenerator.apply( this, restArgs );
}
