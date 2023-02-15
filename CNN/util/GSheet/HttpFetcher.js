export { HttpFetcher };

import * as ValueMax from "../ValueMax.js";

/**
 * Wrap XMLHttpRequest as an async generator.
 *
 *
 * @param {boolean} bLogEventToConsole
 *   If true, some debug message will be logged to console.
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
   * An async generator for sending a http request and tracking progress.
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @param {string} url
   *   A string representing the URL to send the request to.
   *
   * @param {object} body
   *   A body of data to be sent in the XHR request. It could be null.
   *
   * @param {number} timeoutMilliseconds
   *   The time (in milliseconds) a request can take before automatically being
   * terminated. Default is 0, which means there is no timeout.
   *
   * @param {string} method
   *   The HTTP request method to use, e.g. "GET", "POST". Default is "GET".
   *
   * @param {string} responseType
   *   A string specifying what type of data the response contains. It could be
   * "", "arraybuffer", "blob", "document", "json", "text". Default is "text".
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
   */
  async* asyncGenerator_by_url_body_timeout_method_responseType(
    progressParent,
    url, body,
    timeoutMilliseconds = 0,
    method = HttpFetcher.methodDefault,
    responseType = HttpFetcher.responseTypeDefault ) {

    // 0.

    // Note: Although .progressToAdvance is recorded in this, it is not owned by
    //       this HttpFetcher object. It should be destroyed by outside caller
    //       (i.e. by progressParent).
    //
    this.progressRoot = progressParent.root_get();
    this.progressParent = progressParent;
    this.progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by(
        HttpFetcher.progressTotalFakeLarger ) );

    this.url = url;

    // 1.
    const xhr = this.xhr = new XMLHttpRequest();
    xhr.open( method, url, true );
    xhr.timeout = timeoutMilliseconds;
    xhr.responseType = responseType;

    // 2. Prepare promises before sending it.
    this.abortPromise = HttpFetcher.Promise_create_by_eventName_eventCallback
      .call( this, "abort", HttpFetcher.handle_abort );

    this.errorPromise = HttpFetcher.Promise_create_by_eventName_eventCallback
      .call( this, "error", HttpFetcher.handle_error );

    this.loadPromise = HttpFetcher.Promise_create_by_eventName_eventCallback
      .call( this, "load", HttpFetcher.handle_load );

    this.loadstartPromise = HttpFetcher.Promise_create_by_eventName_eventCallback
      .call( this, "loadstart", HttpFetcher.handle_loadstart );

    this.progressPromise = HttpFetcher.Promise_create_by_eventName_eventCallback
      .call( this, "progress", HttpFetcher.handle_progress );

    this.timeoutPromise = HttpFetcher.Promise_create_by_eventName_eventCallback
      .call( this, "timeout", HttpFetcher.handle_timeout );

    // All promises to be listened.
    this.allPromiseSet = new Set( [
      this.abortPromise, this.errorPromise, this.loadPromise,
      this.loadstartPromise,
      this.progressPromise,
      this.timeoutPromise
    ] );

    // 3.
    xhr.send( body );

    // 4. Until done or failed.
    let notDone;
    do {
      let allPromise = Promise.race( this.allPromiseSet );

      // All succeeded promises resolve to progressRoot.
      // All failed promises reject to (i.e. throw exception of) ProgressEvent.
      let progressRoot = await allPromise;
      yield progressRoot;

      // Not done, if .loadPromise still pending (i.e. still in waiting promises).
      //
      // Note: Checking ( xhr.status !== 200 ) is not enough. The loading may
      //       still not be complete when status becomes 200.
      notDone = this.allPromiseSet.has( this.loadPromise );

    // Stop if loading completely and successfully.
    //
    // Note: The other ways to leave this loop are throwing exceptions (e.g.
    //       the pending promises rejected).
    } while ( notDone );

    // (2023/02/15) For debug. (Not yet finished, while return.)
    {
      if ( 200 !== xhr.status ) {
        throw Error( `( ${this.url} ) `
          + `HttpFetcher.asyncGenerator_by_url_body_timeout_method_responseType(): `
          + `When done, `
          + `xhr.status ( ${xhr.status} ) should be 200.` );
      }

      if ( 100 != this.progressToAdvance.valuePercentage ) {
        throw Error( `( ${this.url} ) `
          + `HttpFetcher.asyncGenerator_by_url_body_timeout_method_responseType(): `
          + `When done, `
          + `progressToAdvance.valuePercentage `
          + `( ${this.progressToAdvance.valuePercentage} ) should be 100.` );
      }
    }

    // 5.
    return xhr.response;
  }

  /**
   * @param {HttpFetcher} this
   *
   * @param {string} eventName
   *    The event name of eventCallback. e.g. "loadstart", "progress", "timeout".
   *
   * @param {function} eventCallback
   *    The event handler function for the event name. It should accept parameters
   * ( resolve, reject, event ).
   */
  static Promise_create_by_eventName_eventCallback( eventName, eventCallback ) {
    return new Promise(
      HttpFetcher.Promise_constructor_func.bind( this, eventName, eventCallback ) );
  }

  /**
   * This function should be used as Promise constructor's parameter.
   *
   * @param {HttpFetcher} this
   *
   * @param {string} eventName
   *    The event name of eventCallback. e.g. "loadstart", "progress", "timeout".
   *
   * @param {function} eventCallback
   *    The event handler function for the event name. It should accept parameters
   * ( resolve, reject, event ).
   */
  static Promise_constructor_func( eventName, eventCallback, resolve, reject ) {
    this.xhr.addEventListener(
      eventName, eventCallback.bind( this, resolve, reject ),

      // So that same event could be re-registered many times after event triggered.
      HttpFetcher.addEventListener_options_once
    );
  }


  /**
   * @param {HttpFetcher} this
   */
  static handle_abort( resolve, reject, event ) {

    // Adjust progressToAdvance only if there is enough information.
    //
    // Note: According to experiment, the .loaded may become 0 no matter
    //       how many it is before this event.
    if ( event.loaded > 0 )
      HttpFetcher.progressToAdvance_set_beforeDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: abort: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    reject( event );

    // No longer listen on non-repeatable event.
    this.allPromiseSet.delete( this.abortPromise );
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_error( resolve, reject, event ) {

    // Adjust progressToAdvance only if there is enough information.
    //
    // Note: According to experiment, the .loaded may become 0 no matter
    //       how many it is before this event.
    if ( event.loaded > 0 )
      HttpFetcher.progressToAdvance_set_beforeDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: error: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    reject( event );

    // No longer listen on non-repeatable event.
    this.allPromiseSet.delete( this.errorPromise );
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_load( resolve, reject, event ) {
    HttpFetcher.progressToAdvance_set_whenDone.call( this, event );

    let xhr = this.xhr;

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: load: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `status=${xhr.status}, statusText=\"${xhr.statusText}\", `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    if ( xhr.status === 200 ) {
      // Load completely and successfully.
      resolve( this.progressRoot );
    } else {
      // Load completely but failed (e.g. ( status == 400 ) or ( status == 500 ) ).
      reject( event );
    }

    // No longer listen on non-repeatable event.
    this.allPromiseSet.delete( this.loadPromise );
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_loadstart( resolve, reject, event ) {
    HttpFetcher.progressToAdvance_set_beforeDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: loadstart: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    resolve( this.progressRoot );

    // No longer listen on non-repeatable event.
    this.allPromiseSet.delete( this.loadstartPromise );
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_progress( resolve, reject, event ) {
    HttpFetcher.progressToAdvance_set_beforeDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: progress: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    resolve( this.progressRoot );

    // Re-listen on repeatable event.
    {
      this.allPromiseSet.delete( this.progressPromise );

      // Because progress event could happen many times, re-generate a new promise
      // for listening on it.
      this.progressPromise = HttpFetcher.Promise_create_by_eventName_eventCallback
        .call( this, "progress", HttpFetcher.handle_progress );

      this.allPromiseSet.add( this.progressPromise );
    }
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_timeout( resolve, reject, event ) {

    // Adjust progressToAdvance only if there is enough information.
    //
    // Note: According to experiment, the .loaded may become 0 no matter
    //       how many it is before this event.
    if ( event.loaded > 0 )
      HttpFetcher.progressToAdvance_set_beforeDone.call( this, event );

    if ( this.bLogEventToConsole )
      console.log( `( ${this.url} ) HttpFetcher: timeout: `
        + `${HttpFetcher.ProgressEvent_toString( event )}, `
        + `progressToAdvance=${this.progressToAdvance.valuePercentage}%` );

    reject( event );

    // No longer listen on non-repeatable event.
    this.allPromiseSet.delete( this.timeoutPromise );
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
    if ( progressEvent.lengthComputable ) {
      this.progressToAdvance.value_max_set( progressEvent.total );
      this.progressToAdvance.value_set( progressEvent.loaded );

    } else { // Fake an incremental never-100% progress percentage.
      let fakeMax = progressEvent.loaded + HttpFetcher.progressTotalFakeLarger;
      this.progressToAdvance.value_max_set( fakeMax );
      this.progressToAdvance.value_set( progressEvent.loaded );
    }
  }

  /**
   * Called when progress not done (i.e. onload()).
   *
   * @param {HttpFetcher} this
   *
   * @param {ProgressEvent} progressEvent
   *   The ProgressEvent to be used to set .progressToAdvance.
   */
  static progressToAdvance_set_whenDone( progressEvent ) {
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

/** Used for .addEventListener() */
HttpFetcher.addEventListener_options_once = {
  once : true
};
