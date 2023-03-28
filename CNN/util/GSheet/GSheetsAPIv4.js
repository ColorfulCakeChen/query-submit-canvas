export { GSheetsAPIv4_UrlComposer as UrlComposer };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import * as HttpRequest from "../HttpRequest.js";
import * as ValueMax from "../ValueMax.js";

/**
 * Compose a URL for downloading cells data (as JSON) from a Google Sheets by using
 * Google Sheets API v4. The target spreadsheet should be shared by either "Public
 * on the web" or "Anyone with the link".
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
 *   The identifier (the component after the "https://docs.google.com/spreadsheets/d/")
 * of the spreadsheet to be accessed.
 *
 * @member {string} range
 *   The cells' A1 notation. It describes the (name and) range of the sheet inside
 * the spreadsheet.
 *   - "A1" refers to one cell of the first (most left) visible sheet.
 *   - "B2:C5" refers to cells of a rectangle of the first (most left) visible sheet.
 *   - "Books!D8:D" refers to the column D of sheet named "Books" from rows 8 to the
 *       last rows.
 *   - "'Name has space'!7:10" refers to the rows 7 to 10 of sheet named "Name has
 *       space".
 *
 * @member {string} spreadsheetUrlPrefix
 *   - If null, GVizTQ_UrlComposer.spreadsheetUrlPrefix will be used.
 *   - If not null, it will be used (usually for unit testing ProgressEvent error).
 *
 * @member {boolean} bLogFetcherEventToConsole
 *   If true, some debug messages of HttpRequest.Fetcher will be logged to console.
 *
 * @member {HttpRequest.Fetcher} httpRequestFetcher
 *   The current (or last) fetcher of the http request. It could be used to
 * call .abort().
 *
 * @member {boolean} retryWaitingTimer_isCounting
 *   If true, the .httpRequestFetcher now is during retry waiting.
 *
 * @member {boolean} bAbort
 *   If true, it means .abort() is called.
 */
class GSheetsAPIv4_UrlComposer extends Recyclable.Root {

  /**
   * Used as default GSheet.GSheetsAPIv4.UrlComposer provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "GSheet.GSheetsAPIv4.UrlComposer.Pool",
    GSheetsAPIv4_UrlComposer, GSheetsAPIv4_UrlComposer.setAsConstructor );

  /**
   * If no sheet name in the range's A1 notation, the first (most left) visible sheet
   * inside the spreadsheet will be used.
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
    GSheetsAPIv4_UrlComposer.setAsConstructor_self.call( this,
      spreadsheetId, range, apiKey
    );
  }

  /** @override */
  static setAsConstructor( spreadsheetId, range, apiKey ) {
    super.setAsConstructor();
    GSheetsAPIv4_UrlComposer.setAsConstructor_self.call( this,
      spreadsheetId, range, apiKey
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self( spreadsheetId, range, apiKey ) {
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
  spreadsheetId_apiKey_set( spreadsheetId, apiKey ) {
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
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
   *   The parameters for loading timeout and retry waiting time. It will be kept
   * but not modified by this object.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( Array[] )}
   *   - Yield a promise resolves to { done: true,
   *       value: ( a two dimension (column-major) array ) } when successfully.
   *   - Yield a promise resolves to { done: true, value: null } when failed.
   */
  async* JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
    progressParent, params_loading_retryWaiting ) {

//!!! ...unfinished... (2023/03/11) What if re-entrtance?

    let progressRoot = progressParent.root_get();
    let progressFetcher = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) );

    let httpRequestFetcher;
    try {
      // 1. Compose URL and download it as column-major JSON.
      let url = this.getUrl_forJSON( "COLUMNS" );

      let responseText;
      {
        // (Record in this so that its .abort() could be called by outside caller.)
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
        if ( !responseText )
          return null;

      // Note: It has no effect if .abort() is called after here.
      }

      // 2. Google Sheets API v4 returns JSON.
      let json = JSON.parse( responseText );

      progressToAdvance.value_advance();
      yield progressRoot;

      if ( !json )
        return null;

      // 3. Since already downloaded as column major. Uses it directly.
      let ColumnMajorArrayArray = json.values;

      progressToAdvance.value_advance();
      yield progressRoot;

      return ColumnMajorArrayArray;

    } catch ( e ) {
      if ( HttpRequest.Fetcher
             .Exception_is_ProgressEvent_abort_error_load_timeout( e ) ) {
         // XMLHttpRequest related exception is possible and acceptable.
        return null;

      } else { // Unknown error, should be said loundly.
        //console.error( e );
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

  get retryWaitingTimer_isCounting() {
    if ( this.httpRequestFetcher )
      return this.httpRequestFetcher.retryWaitingTimer_isCounting;
    return false;
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
   *   The major dimension of the arrangement for the downloaded json data. It could
   * be "ROWS" or "COLUMNS". If null, the same as "ROWS".
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
