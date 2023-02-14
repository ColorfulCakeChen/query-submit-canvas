export { HttpFetcher };

import * as AsyncWorker from "../AsyncWorker.js";
import * as ValueMax from "../ValueMax.js";

//!!! ...unfinished... (2023/02/10)
// A re-used XMLHttpRequest object (reset by abort() or open())?
//

//!!! ...unfinished... (2023/02/10)
// Perhaps, if ( .lengthComputable == false ),
// always set progressToAdvance.max = Math.max( ( 2 * ProgressEvent.loaded ), 1 )
// i.e. looks like 50% and (avoid 0)
//

/**
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
   * @param {string} method
   *   The HTTP request method to use, e.g. "GET", "POST".
   *
   * @param {string} url
   *   A string representing the URL to send the request to.
   *
   * @param {object} body
   *   A body of data to be sent in the XHR request. It could be null.
   *
   * @param {object} timeoutMilliseconds
   *   The time in milliseconds a request can take before automatically being
   * terminated. The default value is 0, which means there is no timeout.
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async generator for receving result from XMLHttpRequest.
   *   - Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *   - Yield a promise resolves to { done: true, value: xhr.responseText }.
   *   - Yield a promise rejects to ProgressEvent. The ProgressEvent.type may be
   *       "abort", "error", "timeout".

//!!! ...unfinished... (2023/02/14)
// What about "load" but ( status != 200 ) (e.g. 400 or 500)?

   */
  createResulter_by_method_url_body( progressParent, method, url, body,
    timeoutMilliseconds = 0 ) {

//!!! ...unfinished... (2023/02/11)
    // Note: Although .progressToAdvance is recorded in this, it is not owned by
    //       this HttpFetcher object. It should be destroyed by outside caller
    //       (i.e. by progressParent).
    //

//!!! ...unfinished... (2023/02/11)
    // let progressRoot = progressParent.root_get();

    // this.progressToAdvance = progressParent.child_add(
    //   ValueMax.Percentage.Concrete.Pool.get_or_create_by( ??? ) );

//!!! ...unfinished... (2023/02/11)
    // progressToAdvance.value_advance();
    // yield progressRoot;


    // Prepare the processing's result's receiving queue before sending it.
    let resulter = this.the_processingId_Resulter_Map
      .createResulter_by_processingId( this.processingId );

//!!! ...unfinished... (2023/02/11)
// set up event listener and react into resulter.

    const xhr = this.xhr = new XMLHttpRequest();
    xhr.open( method, url, true );
    xhr.timeout = timeoutMilliseconds;

    xhr.onabort = HttpFetcher.handle_abort.bind( this );
    xhr.onerror = HttpFetcher.handle_error.bind( this );
    xhr.onload = HttpFetcher.handle_load.bind( this );
    xhr.onloadend = HttpFetcher.handle_loadend.bind( this );
    xhr.onloadstart = HttpFetcher.handle_loadstart.bind( this );
    xhr.onprogress = HttpFetcher.handle_progress.bind( this );
    xhr.onreadystatechange = HttpFetcher.handle_readystatechange.bind( this );
    xhr.ontimeout = HttpFetcher.handle_timeout.bind( this );

    xhr.send( body );

    return resulter;
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_abort( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher: abort: ${ProgressEvent_toString( event )}` );
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_error( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher: error: ${ProgressEvent_toString( event )}` );
  }
  
  /**
   * @param {HttpFetcher} this
   */
  static handle_load( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher: load: ${ProgressEvent_toString( event )}, `
        + `status=${xhr.status}, statusText=${xhr.statusText}` );

    if ( xhr.status === 200 ) {
      // Request finished. Do processing here.

    } else {

    }
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_loadend( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher: loadend: ${ProgressEvent_toString( event )}` );
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_loadstart( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher: loadstart: ${ProgressEvent_toString( event )}` );
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_progress( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher: progress: ${ProgressEvent_toString( event )}` );
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_readystatechange() {
    let xhr = this.xhr;

    if ( xhr.readyState === XMLHttpRequest.UNSENT ) { // 0
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher: readystatechange: UNSENT ( 0 )` );

    } else if ( xhr.readyState === XMLHttpRequest.OPENED ) { // 1
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher: readystatechange: OPENED ( 1 )` );

    } else if ( xhr.readyState === XMLHttpRequest.HEADERS_RECEIVED ) { // 2
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher: readystatechange: HEADERS_RECEIVED ( 2 )` );

    } else if ( xhr.readyState === XMLHttpRequest.LOADING ) { // 3
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher: readystatechange: LOADING ( 3 )` );

    } else if ( xhr.readyState === XMLHttpRequest.DONE ) { // 4
      if ( this.bLogEventToConsole )
        console.log( `HttpFetcher: readystatechange: DONE ( 4 ), `
          + `status=${xhr.status}, statusText=${xhr.statusText}` );

      if ( xhr.status === 200 ) {
        // Request finished. Do processing here.
      } else {
      }
    }
  }

  /**
   * @param {HttpFetcher} this
   */
  static handle_timeout( event ) {
    if ( this.bLogEventToConsole )
      console.log( `HttpFetcher: timeout: ${ProgressEvent_toString( event )}` );
  }

  /**
   * @param {ProgressEvent} progressEvent
   * @return {string} A string description lengthComputable, loaded, total.
   */
  static ProgressEvent_toString( progressEvent ) {
    //let str = `${event.loaded} bytes transferred`;
    let str = `lengthComputable=${progressEvent.lengthComputable}, `
      + `loaded=${progressEvent.loaded}, total=${progressEvent.total}`;
    return str;
  }

}


//!!! (2023/02/11 Remarked) Already been defined in XMLHttpRequest.
// /**
//  * (Defining named constants for XMLHttpRequest.readyState)
//  */
// HttpFetcher.ReadyState = {
//   UNSENT: 0,
//   OPENED: 1,
//   HEADERS_RECEIVED: 2,
//   LOADING: 3,
//   DONE: 4,
// };
