export { GSheetsAPIv4_UrlComposer as UrlComposer };

import * as HttpRequest from "../HttpRequest.js";
import * as NonReentrant from "../NonReentrant.js";
import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import * as ValueMax from "../ValueMax.js";

/**
 * Compose a URL for downloading cells data (as JSON) from a Google Sheets by
 * using Google Sheets API v4. The target spreadsheet should be shared by
 * either "Public on the web" or "Anyone with the link".
 *
 *
 * The follwoings are some composed examples:
 *
 * @example
 * https://sheets.googleapis.com/v4/spreadsheets/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/values/A:A?key=AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU
 * https://sheets.googleapis.com/v4/spreadsheets/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/values/A:A?majorDimension=COLUMNS&key=AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU
 * https://sheets.googleapis.com/v4/spreadsheets/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/values/Evolution.Param!A:B?key=AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU
 *
 *
 * @member {string} spreadsheetId
 *   The identifier (the component after the
 * "https://docs.google.com/spreadsheets/d/") of the spreadsheet to be
 * accessed.
 *
 * @member {string} range
 *   The cells' A1 notation. It describes the (name and) range of the sheet
 * inside the spreadsheet.
 *   - "A1" refers to one cell of the first (most left) visible sheet.
 *   - "B2:C5" refers to cells of a rectangle of the first (most left) visible
 *       sheet.
 *   - "Books!D8:D" refers to the column D of sheet named "Books" from rows 8
 *       to the last rows.
 *   - "'Name has space'!7:10" refers to the rows 7 to 10 of sheet named
 *       "Name has space".
 *
 *
 * @member {number} retryTimesMax
 *   Retry request so many times at most when request failed (except abort).
 * Please see also HttpRequest.Params_loading_retryWaiting.
 *
 * @member {number} retryTimesCur
 *   Now is which times retry.
 *
 *
 * @member {Function} fetch_asyncPromise_create
 *   A method for creating .JSON_ColumnMajorArrayArray_fetch_asyncGenerator()
 * and looping until done.
 *   - It accepts almost the same parameters as .fetch_asyncGenerator_create()
 *       except without the 1st parameter progressParent (which is replaced by
 *       .fetch_asyncPromise_progress).
 *   - It returns a promise resolved to .value of { done: true, value } of
 *       awaited .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().next().
 *
 * @member {Function} fetch_asyncGenerator_create
 *   A method for creating .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
 *     - It accepts the same parameters as
 *         .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
 *     - It returns an async generator.
 *
 * @member {boolean} fetch_asyncPromise_running
 *   If true, a fetch_asyncPromise is still executing. Please wait it becoming
 * false if wanting to call .fetch_asyncPromise_create() again.
 *
 * @member {boolean} fetch_asyncGenerator_running
 *   If true, a fetch_asyncGenerator is still executing. Please wait it
 * becoming false if wanting to call .fetch_asyncGenerator_create() again.
 *
 * @member {ValueMax.Percentage.Aggregate} fetch_asyncPromise_progress
 *   The progress of fetch_asyncPromise. If
 * ( .fetch_asyncPromise_progress.valuePercentage == 100 ), the fetching has
 * done.
 *   - It is used only if .fetch_asyncPromise_create() is called.
 *   - It is not used if .fetch_asyncGenerator_create() is called. In this
 *       case, its progressParent parameter will be used instead.
 *
 * @member {boolean} fetchOk
 *   Whether fetch_asyncGenerator or fetch_asyncPromise is succeeded.
 *
 *
 * @member {string} spreadsheetUrlPrefix
 *   - If null, GVizTQ_UrlComposer.spreadsheetUrlPrefix will be used.
 *   - If not null, it will be used (usually for unit testing ProgressEvent
 *       error).
 *
 * @member {boolean} bLogFetcherEventToConsole
 *   If true, some debug messages of HttpRequest.Fetcher will be logged to
 * console.
 *
 * @member {HttpRequest.Fetcher} httpRequestFetcher
 *   The current (or last) fetcher of the http request. It could be used to
 * call .abort().
 *
 * @member {number} loadingStartStopState
 *   The start-stop state of retry waiting.
 * ValueDesc.StartStopState.Singleton.Ids.Xxx according to
 * .httpRequestFetcher.loadingYieldIdCurrent and
 * .httpRequestFetcher.loadingYieldIdFinal.
 *
 * @member {number} retryWaitingStartStopState
 *   The start-stop state of retry waiting.
 * ValueDesc.StartStopState.Singleton.Ids.Xxx according to
 * .httpRequestFetcher.retryWaitingYieldIdCurrent and
 * .httpRequestFetcher.retryWaitingYieldIdFinal.
 *
 * @member {boolean} retryWaiting_during
 *   Whether now is during retry waiting (i.e. not NOT_YET_STARTED, no matter
 * starting, started, stopping, stopped).
 *
 * @member {boolean} bAbort
 *   If true, it means .abort() is called.
 */
class GSheetsAPIv4_UrlComposer
  extends NonReentrant.asyncPromise_by_asyncGenerator(
    "fetch", relay_JSON_ColumnMajorArrayArray_fetch_asyncGenerator, null,
    Recyclable.Root ) {

  /**
   * Used as default GSheet.GSheetsAPIv4.UrlComposer provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "GSheet.GSheetsAPIv4.UrlComposer.Pool",
    GSheetsAPIv4_UrlComposer );

  /**
   * If no sheet name in the range's A1 notation, the first (most left) visible
   * sheet inside the spreadsheet will be used.
   *
   * @param {string} apiKey
   *   The API key string for accessing the spreadsheet.
   *
   * @see {@link https://developers.google.com/sheets/api/guides/concepts}
   * @see {@link https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get}
   * @see {@link https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values}
   */
  constructor( spreadsheetId, range, apiKey ) {
    super();
    this.#setAsConstructor_self( spreadsheetId, range, apiKey );
  }

  /** @override */
  setAsConstructor( spreadsheetId, range, apiKey ) {
    super.setAsConstructor();
    this.#setAsConstructor_self( spreadsheetId, range, apiKey );
  }

  /**  */
  #setAsConstructor_self( spreadsheetId, range, apiKey ) {
    this.set_by_spreadsheetId_range_apiKey( spreadsheetId, range, apiKey );
  }

  /** @override */
  disposeResources() {
    this.bAbort = undefined;
    this.httpRequestFetcher = undefined;
    this.apiKey = undefined;
    this.range = undefined;
    this.spreadsheetId = undefined;
    this.bLogFetcherEventToConsole = undefined;
    this.spreadsheetUrlPrefix = undefined;
    super.disposeResources();
  }

  /**  */
  set_by_spreadsheetId_range_apiKey( spreadsheetId, range, apiKey ) {
    this.spreadsheetId = spreadsheetId;
    this.range = range;
    this.apiKey = apiKey;
    return this;
  }

  /**  */
  set_by_spreadsheetId_apiKey( spreadsheetId, apiKey ) {
    this.spreadsheetId = spreadsheetId;
    this.apiKey = apiKey;
    return this;
  }

  /**
   * Generator for composing the URL (according this object's data members),
   * downloading it as JSON format, extracting data as a two dimension
   * (column-major) array.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent.
   * The created progressToAdvance will be increased when every time advanced.
   * The progressParent.root_get() will be returned when every time yield.
   *
   * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
   *   The parameters for loading timeout and retry waiting time. It will be
   * kept but not modified by this object.
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, this async generator will
   * await it before complete. If null or undefined, no extra delay awaiting.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to
   * { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( Array[] )}
   *   - Yield a promise resolves to { done: true,
   *       value: ( a two dimension (column-major) array ) } when successfully.
   *   - Yield a promise resolves to { done: true, value: null } when failed.
   */
  static async* JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
    progressParent, params_loading_retryWaiting, delayPromise ) {

    //const funcNameInMessage = "JSON_ColumnMajorArrayArray_fetch_asyncGenerator";

    let progressRoot = progressParent.root_get();

    let progressFetcher = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by( 4 ) );

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2, 1 ) );

    let httpRequestFetcher;
    try {
      // 1. Compose URL and download it as column-major JSON.
      let url = this.getUrl_forJSON( "COLUMNS" );

      let responseText;
      {
        // (Record in this so that its .abort() could be called by outside
        // caller.)
        httpRequestFetcher = this.httpRequestFetcher
          = new HttpRequest.Fetcher( this.bLogFetcherEventToConsole );

        let httpResulter = httpRequestFetcher
          .fetch_asyncGenerator_create(
            progressFetcher, url, params_loading_retryWaiting );

        // Abort immediately if caller requests to abort before
        // HttpRequest.Fetcher created.
        if ( this.bAbort )
          httpRequestFetcher.abort();

        responseText = yield* httpResulter;
        if ( !responseText ) {
          this.fetchOk = false;
          return null;
        }

      // Note: It has no effect if .abort() is called after here.
      }

      // 2. Google Sheets API v4 returns JSON.
      let json = JSON.parse( responseText );

      progressToAdvance.value_advance();
      yield progressRoot;

      if ( !json ) {
        this.fetchOk = false;
        return null;
      }

      // 3. Since already downloaded as column major. Uses it directly.
      let ColumnMajorArrayArray = json.values;

      // 4.
      if ( delayPromise )
        await delayPromise;

      progressToAdvance.value_advance();
      yield progressRoot;

      this.fetchOk = true;
      return ColumnMajorArrayArray;

    } catch ( e ) {
      if ( HttpRequest.Fetcher
             .Exception_is_ProgressEvent_abort_error_load_timeout( e ) ) {
         // XMLHttpRequest related exception is possible and acceptable.
         this.fetchOk = false;
         return null;

      } else { // Unknown error, should be said loundly.
        //console.error( e );
        this.fetchOk = false;
        throw e;
      }

    } finally {
      // Release the fetcher which is used by this async generator.
      if ( this.httpRequestFetcher === httpRequestFetcher )
        this.httpRequestFetcher = undefined;

      // Ensure this async generator will not be aborted by default when it is
      // called in the next time.
      this.bAbort = false;
    }
  }


  get loadingStartStopState() {
    return this.httpRequestFetcher?.loadingStartStopState;
  }


  get retryWaitingStartStopState() {
    return this.httpRequestFetcher?.retryWaitingStartStopState;
  }

  get retryWaiting_during() {
    return this.httpRequestFetcher?.retryWaiting_during;
  }

  get retryTimesMax() {
    return this.httpRequestFetcher?.retryTimesMax;
  }

  get retryTimesCur() {
    return this.httpRequestFetcher?.retryTimesCur;
  }

  get retryTimes_CurMax_string() {
    return this.httpRequestFetcher?.retryTimes_CurMax_string;
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
    this.httpRequestFetcher?.abort();
  }

  /**
   * @param {string} majorDimension
   *   The major dimension of the arrangement for the downloaded json data. It
   * could be "ROWS" or "COLUMNS". If null, the same as "ROWS".
   *
   * @return {string} The url for downloading the target as json format.
   */
  getUrl_forJSON( majorDimension = null ) {

    // 1. Determine url prefix.
    let spreadsheetUrlPrefix;
    if ( this.spreadsheetUrlPrefix )
      spreadsheetUrlPrefix = this.spreadsheetUrlPrefix;
    else
      spreadsheetUrlPrefix = GSheetsAPIv4_UrlComposer.spreadsheetUrlPrefix;

    // 2. Composite url.
    let url = `${spreadsheetUrlPrefix}/${
      encodeURIComponent(this.spreadsheetId)}/values/${
      encodeURIComponent(this.range)}?${
      ( majorDimension != null ) ? `majorDimension=${
      encodeURIComponent(majorDimension)}&` : "" }key=${
      encodeURIComponent(this.apiKey)}`
      ;

    return url;
  }

}

/** The url prefix of Google Sheets API v4. */
GSheetsAPIv4_UrlComposer.spreadsheetUrlPrefix
  = "https://sheets.googleapis.com/v4/spreadsheets";


/**
 *
 * @param {GSheetsAPIv4_UrlComposer} this
 *
 * @return {AsyncGenerator}
 *   Return the newly created instance of GSheetsAPIv4_UrlComposer
 * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
 */
function relay_JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
  ...restArgs ) {

  return GSheetsAPIv4_UrlComposer
    .JSON_ColumnMajorArrayArray_fetch_asyncGenerator
    .apply( this, restArgs )
}
