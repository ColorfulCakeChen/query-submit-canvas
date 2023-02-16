export { HttpRetryableFetcher };

import * as RandTools from "../RandTools.js";
import * as ValueMax from "../ValueMax.js";
import { HttpFetcher } from "./HttpFetcher.js";


//!!! ...unfinished... (2023/02/16)
// Perhaps, re-try until specified time (in milliseconds) up (instead of
// specified re-try times (in count)).


/**
 * An async generator which could re-try HttpFetcher many times and reflect them
 * in progress percentage.
 *
 *
 * @param {boolean} bLogEventToConsole
 *   If true, some debug message will be logged to console.
 *
 */
class HttpRetryableFetcher {

//!!! ...unfinished... (2023/02/15)

  /**
   *
   */
  constructor( bLogEventToConsole ) {
    this.bLogEventToConsole = bLogEventToConsole;
  }

//!!! ...unfinished... (2023/02/15)
// should use truncated exponential backoff algorithm to re-try.
//
// RandTools.getRandomInt_TruncatedBinaryExponent()

}
