export { HttpFetcher };

import * as AsyncWorker from "../AsyncWorker.js";

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
 */
class HttpFetcher {

  /**
   *
   */
  constructor() {
    this.the_processingId_Resulter_Map = new AsyncWorker.processingId_Resulter_Map();
    this.processingId = 0; // Always use 0 since there is only one processing.
  }

  /**
   * Send command and args (perhaps, with transferable object array) to WorkerBody
   * and expect result.
   *
   * @param {string} method
   *   The HTTP request method to use, such as "GET", "POST".
   *
   * @param {string} url
   *   A string representing the URL to send the request to.
   *
   * @param {object} body
   *   A body of data to be sent in the XHR request. It could be null.
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async generator for receving result from XMLHttpRequest.
   */
  createResulter_by_method_url_body( method, url, body ) {

    // Prepare the processing's result's receiving queue before sending it.
    let resulter = this.the_processingId_Resulter_Map
      .createResulter_by_processingId( this.processingId );

//!!! ...unfinished... (2023/02/11)
// set up event listener and react into resulter.

    const xhr = this.xhr = new XMLHttpRequest();
    xhr.open( method, url, true );

    xhr.onreadystatechange = () => { // Call a function when the state changes.
      if ( xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200 ) {
        // Request finished. Do processing here.
      }
    }
    xhr.send( body );

    return resulter;
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
