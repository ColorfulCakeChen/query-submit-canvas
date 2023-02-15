export { HttpRetryableFetcher };

import * as ValueMax from "../ValueMax.js";
import { HttpFetcher } from "./HttpFetcher.js";

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

}
