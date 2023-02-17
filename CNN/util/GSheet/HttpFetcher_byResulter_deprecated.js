export { HttpFetcher_byResulter };

import * as AsyncWorker from "../AsyncWorker.js";
import * as ValueMax from "../ValueMax.js";

//!!! ...unfinished... (2023/02/15) Deprecated. (HttpFetcher_byResulter)

//!!! ...unfinished... (2023/02/14)
// It is also possible to use Promise.race() to implement request timeout.

/**
 *
 *
 * @param {boolean} bLogEventToConsole
 *   If true, some debug message will be logged to console.
 *
 */
class HttpFetcher_byResulter {

  /**
   *
   */
  constructor( bLogEventToConsole ) {
    this.bLogEventToConsole = bLogEventToConsole;

    this.the_processingId_Resulter_Map = new AsyncWorker.processingId_Resulter_Map();
    this.processingId = 0; // Always use 0 since there is only one processing.
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
   * @return {AsyncWorker.Resulter}
   *   Return an async iterator for receving result from XMLHttpRequest. Its .next():
   *   - Return a promise resolves to { done: false, value: progressParent.root_get() }.
   *   - Return a promise resolves to { done: true, value: xhr.response }.
   *   - Return a promise rejects to ProgressEvent. The ProgressEvent.type may be:
   *       - "abort"
   *       - "error"
   *       - "load": when ( status != 200 ) (e.g. 404 or 500).
   *       - "timeout"
   */
  createResulter_by_url_body_timeout_method_responseType(
    progressParent,
    url, body,
    timeoutMilliseconds = 0,
    method = HttpFetcher_byResulter.methodDefault,
    responseType = HttpFetcher_byResulter.responseTypeDefault ) {

    // Note: Although .progressToAdvance is recorded in this, it is not owned by
    //       this HttpFetcher_byResulter object. It should be destroyed by outside caller
    //       (i.e. by progressParent).
    //
    this.progressParent = progressParent;
    this.progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by(
        HttpFetcher_byResulter.progressTotalFakeLarger ) );

    // Prepare the processing's result's receiving queue before sending it.
    let resulter = this.the_processingId_Resulter_Map
      .createResulter_by_processingId( this.processingId );

    this.url = url;

    const xhr = this.xhr = new XMLHttpRequest();
    xhr.open( method, url, true );
    xhr.timeout = timeoutMilliseconds;
    xhr.responseType = responseType;

//!!! ...unfinished... (2023/02/14)
// It is also possible to use Promise.race() to wrap all event callback (as promise)
// instead of using AsyncWorker.Resulter

    xhr.onabort = HttpFetcher_byResulter.handle_abort.bind( this );
    xhr.onerror = HttpFetcher_byResulter.handle_error.bind( this );
    xhr.onload = HttpFetcher_byResulter.handle_load.bind( this );
    xhr.onloadend = HttpFetcher_byResulter.handle_loadend.bind( this );
    xhr.onloadstart = HttpFetcher_byResulter.handle_loadstart.bind( this );
    xhr.onprogress = HttpFetcher_byResulter.handle_progress.bind( this );
    xhr.onreadystatechange = HttpFetcher_byResulter.handle_readystatechange.bind( this );
    xhr.ontimeout = HttpFetcher_byResulter.handle_timeout.bind( this );

    xhr.send( body );

    return resulter;
  }

  /**
   * @param {HttpFetcher_byResulter} this
   */
  static handle_abort( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher_byResulter: abort: `
        + `${HttpFetcher_byResulter.ProgressEvent_toString( event )} `
        + `( ${this.url} )` );

    HttpFetcher_byResulter.progressToAdvance_set_beforeDone.call( this, event );

    this.the_processingId_Resulter_Map.resolve_or_reject_by_processingId_done_value(
      this.processingId, undefined, event );
  }

  /**
   * @param {HttpFetcher_byResulter} this
   */
  static handle_error( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher_byResulter: error: `
        + `${HttpFetcher_byResulter.ProgressEvent_toString( event )} `
        + `( ${this.url} )` );

    HttpFetcher_byResulter.progressToAdvance_set_beforeDone.call( this, event );

    this.the_processingId_Resulter_Map.resolve_or_reject_by_processingId_done_value(
      this.processingId, undefined, event );
  }
  
  /**
   * @param {HttpFetcher_byResulter} this
   */
  static handle_load( event ) {
    let xhr = this.xhr;

    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher_byResulter: load: `
        + `${HttpFetcher_byResulter.ProgressEvent_toString( event )}, `
        + `status=${xhr.status}, statusText=\"${xhr.statusText}\" `
        + `( ${this.url} )` );

    HttpFetcher_byResulter.progressToAdvance_set_whenDone.call( this, event );

    if ( xhr.status === 200 ) {
      // Load completely and successfully.
      let progressRoot = this.progressParent.root_get();
      this.the_processingId_Resulter_Map.resolve_or_reject_by_processingId_done_value(
        this.processingId, true, xhr.response );

    } else {
      // Load completely but failed (e.g. ( status == 400 ) or ( status == 500 ) ).
      this.the_processingId_Resulter_Map.resolve_or_reject_by_processingId_done_value(
        this.processingId, undefined, event );
    }
  }

  /**
   * @param {HttpFetcher_byResulter} this
   */
  static handle_loadend( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher_byResulter: loadend: `
        + `${HttpFetcher_byResulter.ProgressEvent_toString( event )} `
        + `( ${this.url} )` );

    // Because this event happens after abort or error or load, it does not be
    // used by us.
  }

  /**
   * @param {HttpFetcher_byResulter} this
   */
  static handle_loadstart( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher_byResulter: loadstart: `
        + `${HttpFetcher_byResulter.ProgressEvent_toString( event )} `
        + `( ${this.url} )` );

    HttpFetcher_byResulter.progressToAdvance_set_beforeDone.call( this, event );

    let progressRoot = this.progressParent.root_get();
    this.the_processingId_Resulter_Map.resolve_or_reject_by_processingId_done_value(
      this.processingId, false, progressRoot );
  }

  /**
   * @param {HttpFetcher_byResulter} this
   */
  static handle_progress( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher_byResulter: progress: `
        + `${HttpFetcher_byResulter.ProgressEvent_toString( event )} `
        + `( ${this.url} )` );

    HttpFetcher_byResulter.progressToAdvance_set_beforeDone.call( this, event );

    let progressRoot = this.progressParent.root_get();
    this.the_processingId_Resulter_Map.resolve_or_reject_by_processingId_done_value(
      this.processingId, false, progressRoot );
  }

  /**
   * @param {HttpFetcher_byResulter} this
   */
  static handle_readystatechange() {
    let xhr = this.xhr;

    if ( xhr.readyState === XMLHttpRequest.UNSENT ) { // 0
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher_byResulter: readystatechange: UNSENT ( 0 ) `
          + `( ${this.url} )` );

    } else if ( xhr.readyState === XMLHttpRequest.OPENED ) { // 1
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher_byResulter: readystatechange: OPENED ( 1 ) `
          + `( ${this.url} )` );

    } else if ( xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED ) { // 2
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher_byResulter: readystatechange: HEADERS_RECEIVED ( 2 ) `
          + `( ${this.url} )` );

    } else if ( xhr.readyState === XMLHttpRequest.LOADING ) { // 3
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher_byResulter: readystatechange: LOADING ( 3 ) `
          + `( ${this.url} )` );

    } else if ( xhr.readyState === XMLHttpRequest.DONE ) { // 4
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher_byResulter: readystatechange: DONE ( 4 ), `
          + `status=${xhr.status}, statusText=\"${xhr.statusText}\" `
          + `( ${this.url} )` );

      if ( xhr.status === 200 ) {
        // Request finished. Do processing here.
      } else {
        // Load completely but failed (e.g. ( status == 400 ) or ( status == 500 ) ).
      }
    }
  }

  /**
   * @param {HttpFetcher_byResulter} this
   */
  static handle_timeout( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher_byResulter: timeout: `
        + `${HttpFetcher_byResulter.ProgressEvent_toString( event )} `
        + `( ${this.url} )` );

    HttpFetcher_byResulter.progressToAdvance_set_beforeDone.call( this, event );

    this.the_processingId_Resulter_Map.resolve_or_reject_by_processingId_done_value(
      this.processingId, undefined, event );

  }


  /**
   * Called when progress not done (i.e. onloadstart(), onprogrss()).
   *
   * @param {HttpFetcher_byResulter} this
   *
   * @param {ProgressEvent} progressEvent
   *   The ProgressEvent to be used to set .progressToAdvance.
   */
  static progressToAdvance_set_beforeDone( progressEvent ) {
    if ( progressEvent.lengthComputable ) {
      this.progressToAdvance.value_max_set( progressEvent.total );
      this.progressToAdvance.value_set( progressEvent.loaded );

    } else { // Fake an incremental never-100% progress percentage.
      let fakeMax = progressEvent.loaded + HttpFetcher_byResulter.progressTotalFakeLarger;
      this.progressToAdvance.value_max_set( fakeMax );
      this.progressToAdvance.value_set( progressEvent.loaded );
    }
  }

  /**
   * Called when progress not done (i.e. onload()).
   *
   * @param {HttpFetcher_byResulter} this
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

HttpFetcher_byResulter.methodDefault = "GET";
HttpFetcher_byResulter.responseTypeDefault = "text";

/**
 * If ( ProgressEvent.lengthComputable == false ), it will be assumed that
 * ProgressEvent.total = ProgressEvent.loaded + HttpFetcher_byResulter.progressTotalFakeLarger.
 *
 * The purpose is to let progress percentage look like still increasing step by
 * step gradually.
 */
HttpFetcher_byResulter.progressTotalFakeLarger = 10 * 1024;