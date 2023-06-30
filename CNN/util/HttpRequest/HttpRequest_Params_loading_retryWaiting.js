export { HttpRequest_Params_loading_retryWaiting as Params_loading_retryWaiting };

/**
 * The parameters for HttpRequest.Fetcher's loading timeout and retry waiting
 * time.
 *
 *
 * @member {number} loadingMillisecondsMax
 *   The maximum time (in milliseconds) a request can take before automatically
 * being terminated. Default is 0, which means there is no timeout.
 *
 *   - If zero, the progressLoading will be advanced by ProgressEvent(
 *       .type = "progress" ).
 *     - This is good if ( .lengthComputable == true ) and network smooth.
 *     - This is bad if ( .lengthComputable == false ) (i.e. progress can not
 *         be calculated by .loaded / .total) or network congested (i.e.
 *         there will be a long pending (no responded in UI)).
 *
 *   - If not zero, the progressLoading will be advanced by a timer.
 *       Although this is a kind of fake progress, it provides better user
 *       experience because progress bar is still advancing even if network
 *       congested or server busy.
 *
 * @member {number} loadingMillisecondsInterval
 *   The interval time (in milliseconds) for advancing the
 * loadingMillisecondsCur. Although smaller interval may provide smoother
 * progress advancing, however, too small interval (relative to
 * loadingMillisecondsMax) may not look good because the progress bar may
 * advance too little to be aware by eyes.
 *
 * @member {number} retryTimesMax
 *   Retry request so many times at most when request failed (ProgressEvent
 * is error, or load without status 200, or timeout). Note1: Never retry if
 * ( ProgressEvent is abort ) or ( unknown error ). Note2: There will be some
 * waiting time before next re-try (i.e. truncated (binary) exponential backoff
 * algorithm).
 *
 *   - Negative value means retry infinite times (i.e. retry forever until
 *       success).
 *
 *   - Zero means never retry (i.e. failed immediately once not success).
 *
 *   - Positive value means retry so many times at most.
 *
 * @member {number} retryWaitingSecondsExponentMax
 *   The maximum exponent (for two's power; i.e. the B of ( 2 ** B ) ) of retry
 * waiting time (in seconds, not in milliseconds). It is only used if
 * ( retryTimesMax > 0 ). For example,
 *   - 0 means ( 2 ** 0 ) = 1 second.
 *   - 1 means ( 2 ** 1 ) = 2 seconds
 *   - 2 means ( 2 ** 2 ) = 4 seconds
 *   - ...
 *   - 6 means ( 2 ** 6 ) = 64 seconds.
 *
 * @member {number} retryWaitingMillisecondsInterval
 *   The interval time (in milliseconds) for advancing
 * retryWaitingMillisecondsCur. Although smaller interval may provide smoother
 * progress advancing, however, too small interval (relative to
 * retryWaitingMillisecondsMax) may not look good because the progress bar may
 * advance too little to be aware by eyes.
 */
class HttpRequest_Params_loading_retryWaiting {

  /** */
  constructor(
    loadingMillisecondsMax = ( 60 * 1000 ),
    loadingMillisecondsInterval = ( 1 * 1000 ), //( 5 * 1000 ),

    retryTimesMax = 0,
    retryWaitingSecondsExponentMax = 6,
    retryWaitingMillisecondsInterval = ( 1000 ),
  ) {
    this.loadingMillisecondsMax = loadingMillisecondsMax;
    this.loadingMillisecondsInterval = loadingMillisecondsInterval;

    this.retryTimesMax = retryTimesMax;
    this.retryWaitingSecondsExponentMax = retryWaitingSecondsExponentMax;
    this.retryWaitingMillisecondsInterval = retryWaitingMillisecondsInterval;
  }

}
