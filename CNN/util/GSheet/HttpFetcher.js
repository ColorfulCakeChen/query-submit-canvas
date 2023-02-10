export { HttpFetcher };


//!!! ...unfinished... (2023/02/10)
// A re-used XMLHttpRequest object (reset by abort() or open())?
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
