export { HttpFetcher };


//!!! ...unfinished... (2023/02/10)
// A re-used XMLHttpRequest object (reset by abort() or open())?
//

//!!! ...unfinished... (2023/02/10)
// Perhaps, if ( .lengthComputable == false ),
// always set progressToAdvance.max = Math.max( ( 2 * ProgressEvent.loaded ), 1 )
// i.e. 50% and (avoid 0)
//

/**
 *
 */
class HttpFetcher {

}


/**
 * (Defining named constants for XMLHttpRequest.readyState)
 */
HttpFetcher.ReadyState = {
  UNSENT: 0,
  OPENED: 1,
  HEADERS_RECEIVED: 2,
  LOADING: 3,
  DONE: 4,
};
