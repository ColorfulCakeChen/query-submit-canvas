export { HttpRequest_Fetcher as Fetcher };

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
 * @member {number} loadingCurrentFinalState
 *   The start-stop state of loading.
 * ValueDesc.CurrentFinalState.Singleton.Ids.Xxx according to
 * .loadingYieldIdCurrent and .loadingYieldIdFinal.
 *
 *
 * @member {number} retryWaitingYieldIdCurrent
 *   An integer which will be increased by one before every time
 * .retryWait_asyncGenerator() yield. It is either undefined or 0 or positive.
 *
 * @member {number} retryWaitingingYieldIdFinal
 *   An integer recording the final yield id of .retryWaiting_asyncGenerator().
 * It is either undefined or 0 or positive.
 *
 * @member {number} retryWaitingingCurrentFinalState
 *   The start-stop state of retry waiting.
 * ValueDesc.CurrentFinalState.Singleton.Ids.Xxx according to
 * .retryWaitingingYieldIdCurrent and .retryWaitingingYieldIdFinal.
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
    NonReentrant_asyncGenerator.setAsConstructor_self.call( this,
      bLogEventToConsole );
  }

  /** @override */
  static setAsConstructor( bLogEventToConsole , ...restArgs ) {
    super.setAsConstructor.apply( this, restArgs );
    NonReentrant_asyncGenerator.setAsConstructor_self.call( this,
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


  get loadingCurrentFinalState() {
    let nCurrentFinalState
      = ValueDesc.CurrentFinalState.Singleton.determine_byCurrentFinal(
          this.loadingYieldIdCurrent, this.loadingYieldIdFinal );
    return nCurrentFinalState;
  }

  get loadingCurrentFinalState_NameWithInt() {
    let strCurrentFinalState
      = ValueDesc.CurrentFinalState.Singleton.getNameWithInt_byId(
          this.loadingCurrentFinalState );
    return strCurrentFinalState;
  }

  get retryWaitingCurrentFinalState() {
    let nCurrentFinalState
      = ValueDesc.CurrentFinalState.Singleton.determine_byCurrentFinal(
          this.retryWaitingYieldIdCurrent, this.retryWaitingYieldIdFinal );
    return nCurrentFinalState;
  }

  get retryWaitingCurrentFinalState_NameWithInt() {
    let strCurrentFinalState
      = ValueDesc.CurrentFinalState.Singleton.getNameWithInt_byId(
          this.retryWaitingCurrentFinalState );
    return strCurrentFinalState;
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

//!!! (2023/04/01 Remarked) Use .loadingCurrentFinalState instead.
//   /**
//    * @return {boolean}
//    *   Return true, if ( .loadingTimer_isUsed == true ) and ( now is during
//    * loading ).
//    */
//   get loadingTimer_isCounting() {
//     if ( this.loadingTimerPromise )
//       return true;
//     return false;
//   }

//!!! (2023/04/01 Remarked) Use .retryWaitingCurrentFinalState instead.
//   /**
//    * @return {boolean} Return true, if now is during retry waiting.
//    */
//   get retryWaitingTimer_isCounting() {
//     if ( this.retryWaitingTimerPromise )
//       return true;
//     return false;
//   }


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
        this.progressLoading.value_max_set( 0 );
        this.progressLoading.value_set( 0 );
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
  static async* fetch_asyncGenerator(
    progressParent,
    url,

    params_loading_retryWaiting
      = HttpRequest_Fetcher.params_loading_retryWaiting_default,

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

          // No need to retry, since request is succeeded (when executed to here).
          bRetry = false;

          fetchResult = responseText;
          this.fetchOk = true;

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

//!!! (2023/03/31 Remarked) Moved into .retryWaiting_asyncGenerator()
//                ++this.retryTimesCur;
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
            fetchResult = null;
            this.fetchOk = false;
            throw e;
          }
        }

        // 4.
        if ( bRetry ) {
          // If retry, waiting before it (i.e. truncated exponential backoff algorithm).
          yield* HttpRequest_Fetcher.retryWait_asyncGenerator.call( this );
        } else {
          // If no retry, the retry waiting timer should be completed to 100%
          HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );
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

    this.progressLoading.value_max_set( progressLoading_max_default );
    this.progressLoading.value_set( 0 );

    // 0.3 Reset retry waiting progress.
    HttpRequest_Fetcher.retryWaitingMilliseconds_init.call( this );
    HttpRequest_Fetcher.progressRetryWaiting_set_beforeDone.call( this );

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
      //   - Except .loadingTimerPromise resolved to .handle_loadingTimer
      //
      // All failed promises reject to (i.e. throw exception of) ProgressEvent.
      let progressRoot__or__handle_loadingTimer = await allPromise;

      // .loadingTimerPromise resolved.
      if ( progressRoot__or__handle_loadingTimer
             === HttpRequest_Fetcher.handle_loadingTimer ) {
        HttpRequest_Fetcher.handle_loadingTimer.call( this );
      }

      // Not done, if:
      //   - ( .loadPromise still pending (i.e. still in waiting promises) ).
      //
      // Note: If .abort() is called, xhr.status will be changed (from 200)
      //       to 0 even if loading is succeeded. So,
      //         - Do not check ( xhr.status !== 200 ).
      //         - Just check .allPromiseSet.has( .loadPromise ) purely.
      //
      notDone = ( this.allPromiseSet.has( this.loadPromise ) );

      ++this.loadingYieldIdCurrent; // started.
      if ( !notDone )
        this.loadingYieldIdFinal = this.loadingYieldIdCurrent; // stopping.

      yield this.progressRoot;

    // Stop if loading completely and successfully.
    //
    // Note: The other ways to leave this loop are throwing exceptions (e.g.
    //       the pending promises rejected).
    } while ( notDone );

    ++this.loadingYieldIdCurrent; // stopped.

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
      //     + `.load_asyncGenerator(): `
      //     + `When done, `
      //     + `xhr.status ( ${xhr.status} ) should be 200.` );
      // }

      // 2.2
      if ( 100 != this.progressLoading.valuePercentage ) {
        //debugger;
        throw Error( `( ${this.url} ) HttpRequest_Fetcher`
          + `.load_asyncGenerator(): `
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
   * (This method is called by .fetch_asyncGenerator())
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
  static async* retryWait_asyncGenerator() {

    // 1.

    // Before logging message, increase .retryTimesCur (so that log messages
    // have correct .retryTimesCur).
    ++this.retryTimesCur;

    // Note: Log must be after .retryTimesCur being increased, because it is
    //       used in the log message.
    HttpRequest_Fetcher.retryWaiting_log.call( this, "start" );

    // 2. Inform outside caller progress when begin retry waiting.
    //
    // Note1: .progressRetryWaiting should have been setup at begnning of
    //        .loading_asyncGenerator()
    //

//!!! ...unfinished... (2023/03/31)
    // Note2: .retryTimesCur must have not yet be increased (so that
    //        .retryTimes_isRunOut still false).
    
    // Before yield progress, current and final index must be setup.
    // So that outside caller can detect start-stop state of retry waiting.
    this.retryWaitingYieldIdCurrent = 0; // starting.
    this.retryWaitingYieldIdFinal = undefined;
    yield this.progressRoot;

    // 3.
    HttpRequest_Fetcher.retryWaitingTimerPromise_create_and_set.call( this );

    // 4. Abort immediately if caller requests.
    //
    // Although, it seems no chance to execute to here if aborted.
    //
    if ( this.bAbort ) {
      HttpRequest_Fetcher.retryWaiting_log.call( this, "abort at start" );
      HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );

      // Inform outside caller progress when stopping retry waiting.
      ++this.retryWaitingYieldIdCurrent; // started.
      this.retryWaitingYieldIdFinal = this.retryWaitingYieldIdCurrent; // stopping.
      yield this.progressRoot;

      return;
    }

    // 2. Until done.
    let notDone;
    do {
      // All succeeded promises resolve to progressRoot.
      let progressRoot = await this.retryWaitingTimerPromise;

      HttpRequest_Fetcher.handle_retryWaitingTimer.call( this );

      // Not done, if:
      //   - HttpRequest_Fetcher.abort() is not called.
      //   - .retryWaitingTimerPromise still exists.
      //
      notDone =    ( !this.bAbort )
                && ( this.retryWaitingTimerPromise );


      ++this.retryWaitingYieldIdCurrent; // started.
      if ( !notDone )
        this.retryWaitingYieldIdFinal = this.retryWaitingYieldIdCurrent; // stopping.

      yield progressRoot;

    } while ( notDone ); // Stop if retry waiting completely.

    ++this.retryWaitingYieldIdCurrent; // stopped.

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
    this.loadingMillisecondsCur += this.loadingMillisecondsInterval;

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
        + `loadingMillisecondsMax=${this.loadingMillisecondsMax}, `
        + `progressLoading=${this.progressLoading.valuePercentage}%` );

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
  static handle_retryWaitingTimer() {
    this.retryWaitingMillisecondsCur += this.retryWaitingMillisecondsInterval;

    // 1.
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

    // 2.
    if ( bDone )
      HttpRequest_Fetcher.progressRetryWaiting_set_whenDone.call( this );
    else
      HttpRequest_Fetcher.progressRetryWaiting_set_beforeDone.call( this );

    // 3.
    const phaseString = bAbort ? "abort" : ( bDone ? "done" : "progress" );
    HttpRequest_Fetcher.retryWaiting_log.call( this, phaseString );

    // 4. Re-listen on repeatable succeeded event.
    {
      // If done (include user abort), no need to re-generate promise.
      if ( bDone ) {
        this.retryWaitingTimerPromise = null;

      // Before retryWaitingTimer done, its event could happen many times.
      } else {
        // Re-generate a new promise for listening on it.
        HttpRequest_Fetcher.retryWaitingTimerPromise_create_and_set.call( this );
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
      this.progressLoading.value_max_set( progressEvent.total );
      this.progressLoading.value_set( progressEvent.loaded );

    } else { // Complete the fake progress to 100%.
      this.progressLoading.value_max_set( progressEvent.loaded );
      this.progressLoading.value_set( progressEvent.loaded );
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
   * It will ensure .progressRetryWaiting become 100%.
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
   *
   * @param {HttpRequest_Fetcher} this
   */
  static retryWaiting_log( phaseString ) {
    if ( !this.bLogEventToConsole )
      return;

    console.log( `( ${this.url} ) HttpRequest_Fetcher: `
      + `retryWaitingTimer: ${phaseString}: `
      + `retryTimesCur=${this.retryTimesCur}, `
      + `retryWaitingMillisecondsCur=${this.retryWaitingMillisecondsCur}, `
      + `retryWaitingMillisecondsMax=${this.retryWaitingMillisecondsMax}, `
      + `progressRetryWaiting=${this.progressRetryWaiting.valuePercentage}%` );
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
