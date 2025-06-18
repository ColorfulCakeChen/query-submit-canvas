export { GVizTQ_UrlComposer as UrlComposer };

import * as HttpRequest from "../HttpRequest.js";
import * as NonReentrant from "../NonReentrant.js";
import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import * as ValueMax from "../ValueMax.js";

/**
 * Compose a URL for downloading cells data (as JSON or .CSV format) from a
 * Google Sheets by using Google Visualzation Table Query API. The target
 * spreadsheet should be shared by either "Public on the web" or "Anyone with
 * the link".
 *
 * (GVizTQ = Google Visualzation Table Query)
 *
 * The follwoings are some composed examples:
 *
 * @example
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?range=A:A&tqx=version:0.6
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?range=A:A&tqx=version:0.6;responseHandler:SetData
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?range=A:A&tqx=out:json;responseHandler:SetData
 *
 * @example
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?range=A:A&tqx=out:csv
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?range=A:A&tqx=out:html
 *
 * @example
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?gid=816353147&range=AH55:AK94&headers=0&tqx=out:csv
 *
 * @example
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?gid=1504323928&range=B17&headers=0&tqx=out:csv
 *
 * @example
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?sheet=Evolution.Param&range=B17&headers=0&tqx=out:csv
 *
 * @example
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?range=Evolution.Param!B17&headers=0&tqx=out:csv
 *
 * @example
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?range='Evolution.Param'!B17&headers=0&tqx=out:csv
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
class GVizTQ_UrlComposer
  extends NonReentrant.asyncPromise_by_asyncGenerator(
    "fetch", relay_JSON_ColumnMajorArrayArray_fetch_asyncGenerator, null,
    Recyclable.Root ) {

  /**
   * Used as default GSheet.GVizTQ.UrlComposer provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "GSheet.GVizTQ.UrlComposer.Pool",
    GVizTQ_UrlComposer );

  /**
   * If sheetId is null, sheetName is null, and no sheet name in the range's A1
   * notation, the first (most left) visible sheet inside the spreadsheet will
   * be used.
   *
   * @param {number} headers
   *   The component after the "headers=". It means how many header rows. It
   * should be zero or a positive integer.
   *
   * @param {string} responseHandler
   *   The function name of JSON content handler. Only meaningful when the
   * content is downloaded as JSONP format. This responseHandler name will be
   * prepended in front of the downloaded content.
   *
   * @param {number} sheetId
   *   The component after the "gid=". If the sheetName is used (or the sheet
   * name in the range's A1 notation is specified), keep this sheetId null (or
   * undefined).
   *
   * @param {string} sheetName
   *   The component after the "sheet=". If the sheetId is used (or the sheet
   * name in the range's A1 notation is specified), keep this sheetName null
   * (or undefined).
   *
   * @see {@link https://developers.google.com/sheets/api/guides/concepts}
   * @see {@link https://developers.google.com/chart/interactive/docs/dev/implementing_data_source}
   * @see {@link https://developers.google.com/chart/interactive/docs/spreadsheets}
   * @see {@link https://developers.google.com/chart/interactive/docs/querylanguage}
   */
  constructor(
    spreadsheetId, range,
    headers = 0, responseHandler = null, sheetId = null, sheetName = null
  ) {
    super();
    this.#setAsConstructor_self(
      spreadsheetId, range,
      headers, responseHandler, sheetId, sheetName
    );
  }

  /** @override */
  setAsConstructor(
    spreadsheetId, range,
    headers = 0, responseHandler = null, sheetId = null, sheetName = null
  ) {
    super.setAsConstructor();
    this.#setAsConstructor_self(
      spreadsheetId, range,
      headers, responseHandler, sheetId, sheetName
    );
  }

  /**  */
  #setAsConstructor_self(
    spreadsheetId, range,
    headers, responseHandler, sheetId, sheetName
  ) {
    this.set_by_spreadsheetId_range_headers_responseHandler_sheetId_sheetName(
      spreadsheetId,
      range, headers, responseHandler, sheetId, sheetName
    );
  }

  /** @override */
  disposeResources() {
    this.bAbort = undefined;
    this.httpRequestFetcher = undefined;
    this.sheetName = undefined;
    this.sheetId = undefined;
    this.responseHandler = undefined;
    this.headers = undefined;
    this.range = undefined;
    this.spreadsheetId = undefined;
    this.bLogFetcherEventToConsole = undefined;
    this.spreadsheetUrlPrefix = undefined;
    super.disposeResources();
  }

  /**  */
  set_by_spreadsheetId_range_headers_responseHandler_sheetId_sheetName(
    spreadsheetId,
    range, headers, responseHandler, sheetId, sheetName
  ) {
    this.spreadsheetId = spreadsheetId;
    this.range = range;
    this.headers = headers;
    this.responseHandler = responseHandler;
    this.sheetId = sheetId;
    this.sheetName = sheetName;
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
   * { value: progressParent.root_get(), done: false }.
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
      // 1. Compose URL and download it as JSONP.
      let url = this.getUrl_forJSON();

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

      // 2. Google Visualization Table Query returns JSONP (not JSON).
      //    Try to evaluate it as JSON.
      let json = GVizTQ_UrlComposer.evalJSONP( responseText );

      progressToAdvance.value_advance();
      yield progressRoot;

      if ( !json ) {
        this.fetchOk = false;
        return null;
      }

      // 3. Collect into column-major array.
      let ColumnMajorArrayArray
        = GVizTQ_UrlComposer.dataTable_to_ColumnMajorArrayArray( json.table );

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
   * @param {string} outputFormat
   *   Specify the data format when downloading the returned url. It should be
   * null or "json" or "csv" or "html". If null, there will be no format
   * specified in the generated url (means default format, usually same as
   * "json").
   *
   * @return {string} The url for downloading the target as specified format.
   */
  getUrl_forFormat( outputFormat ) {

    // 1. Determine url prefix.
    let spreadsheetUrlPrefix;
    if ( this.spreadsheetUrlPrefix )
      spreadsheetUrlPrefix = this.spreadsheetUrlPrefix;
    else
      spreadsheetUrlPrefix = GVizTQ_UrlComposer.spreadsheetUrlPrefix;

    // 2. Composite url.

    // Because sheetId could be 0, it should be checked by comparing to null
    // directly (i.e. should not use ( !this.sheetId )).
    let url = `${spreadsheetUrlPrefix}/${
      encodeURIComponent(this.spreadsheetId)}/${

      GVizTQ_UrlComposer.GoogleVisualizationTableQueryUrlPostfix}?tqx=version:${
      GVizTQ_UrlComposer.GoogleVisualizationTableQueryAPIVersion}${
      ( outputFormat != null ) ? `;out:${encodeURIComponent(outputFormat)}` : "" }${
      ( this.responseHandler != null ) ? `;responseHandler=${
        encodeURIComponent(this.responseHandler)}` : "" }${

      ( this.sheetId != null ) ? `&gid=${encodeURIComponent(this.sheetId)}` : `${
      ( this.sheetName != null ) ? `&sheet=${encodeURIComponent(this.sheetName)}` : "" }` }${
      ( this.range != null ) ? `&range=${encodeURIComponent(this.range)}` : "" }&headers=${
        encodeURIComponent(this.headers)}`
      ;

    return url;
  }

  /**
   * @return {string} The url for downloading the target as JSONP format.
   */
  getUrl_forJSON() {
    return this.getUrl_forFormat( null ); // Because default format is "json".
  }

  /**
   * @return {string} The url for downloading the target as CSV format.
   */
  getUrl_forCSV() {
    return this.getUrl_forFormat( "csv" );
  }

  /**
   * @return {string} The url for downloading the target as HTML format.
   */
  getUrl_forHTML() {
    return this.getUrl_forFormat( "html" );
  }

  /**
   * Evaluate JSONP string by JSON.parse().
   *
   * A JSONP string looks like:
   * @example
   *   Handler( ... );
   *
   * This method will find the position of the first "(" and the last ")".
   * Extract the string between these two positions. Parse it by JSON.parse().
   *
   * @param {string} strJSONP
   *   The JSONP string to be parsed.
   *
   * @return {Object|value}
   *   Return the JSON parsed result. Return null, if left parenthesis or right
   * parenthesis is not found.
   */
  static evalJSONP( strJSONP ) {
    let beginIndex = strJSONP.indexOf( "(" );
    if ( beginIndex < 0 )
      return null;  // left parenthesis is not found.

    let endIndex = strJSONP.lastIndexOf( ")" );
    if ( endIndex < 0 )
      return null;  // right parenthesis is not found.

    // Note: "+ 1" for the next position of the left parenthesis.
    let strJSON = strJSONP.slice( beginIndex + 1, endIndex );
    let result = JSON.parse( strJSON );
    return result;
  }

  /**
   * Collects gvizDataTable.rows[ n ].c[ m ].v into a two dimension
   * (column-major) array. The outer array has m inner sub-arrays
   * (corresponding to m columns). Every inner sub-array has n elements
   * (corresponding to n rows).
   *
   * @param {DataTable} gvizDataTable
   *   The DataTable object of Google Visualization API.
   *
   * @return {Array[]}
   *   Return a two dimension (column-major) array. Return null if failed.
   */
  static dataTable_to_ColumnMajorArrayArray( gvizDataTable ) {
    if ( !gvizDataTable )
      return null;

    let columnArray = new Array( gvizDataTable.cols.length );
    for ( let columnNo = 0; columnNo < columnArray.length; ++columnNo ) {
      let rowArray = columnArray[ columnNo ]
        = new Array( gvizDataTable.rows.length );

      for ( let rowNo = 0; rowNo < rowArray.length; ++rowNo ) {
        // Always value (.v), ignore formatted value string (.f).
        rowArray[ rowNo ] = gvizDataTable.rows[ rowNo ]?.c[ columnNo ]?.v;
      }
    }

    return columnArray;
  }

}

/** The url prefix of Google Sheets. */
GVizTQ_UrlComposer.spreadsheetUrlPrefix = "https://docs.google.com/spreadsheets/d";

/** The url postfix of Google Visualization Table Query. */
GVizTQ_UrlComposer.GoogleVisualizationTableQueryUrlPostfix = "gviz/tq";

/** The version of Google Visualization Table Query API. */
GVizTQ_UrlComposer.GoogleVisualizationTableQueryAPIVersion = "0.7";


/**
 *
 * @param {GVizTQ_UrlComposer} this
 *
 * @return {AsyncGenerator}
 *   Return the newly created instance of GVizTQ_UrlComposer
 * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
 */
function relay_JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
  ...restArgs ) {

  return GVizTQ_UrlComposer
    .JSON_ColumnMajorArrayArray_fetch_asyncGenerator
    .apply( this, restArgs )
}
