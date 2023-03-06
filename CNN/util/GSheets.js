export { GSheets_UrlComposer as UrlComposer };

import * as Pool from "./Pool.js";
import * as Recyclable from "./Recyclable.js";
import * as GVizTQ from "./GSheet/GVizTQ.js";
import * as GSheetsAPIv4 from "./GSheet/GSheetsAPIv4.js";
import * as HttpRequest from "./HttpRequest.js";
import * as ValueMax from "./ValueMax.js";

/**
 * Fetch data from Google Sheets.
 */
class GSheets_UrlComposer extends Recyclable.Root {

  /**
   * Used as default GSheets.UrlComposer provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "GSheets.UrlComposer.Pool",
    GSheets_UrlComposer, GSheets_UrlComposer.setAsConstructor );

  /**
   * If no sheet name in the range's A1 notation, the first (most left) visible sheet
   * inside the spreadsheet will be used.
   *
   * @param {boolean} bLogFetcherEventToConsole
   *   If true, some debug messages of HttpRequest.Fetcher will be logged to console.
   *
   * @param {string} spreadsheetId
   *   The identifier (the component after the "https://docs.google.com/spreadsheets/d/")
   * of the spreadsheet to be accessed.
   *
   * @param {string} range
   *   The cells' A1 notation. It describes the (name and) range of the sheet inside
   * the spreadsheet.
   *   - "A1" refers to one cell of the first (most left) visible sheet.
   *   - "B2:C5" refers to cells of a rectangle of the first (most left) visible sheet.
   *   - "Books!D8:D" refers to the column D of sheet named "Books" from rows 8 to the
   *       last rows.
   *   - "'Name has space'!7:10" refers to the rows 7 to 10 of sheet named "Name has
   *       space".
   *
   * @param {string} apiKey
   *   The API key string for accessing the spreadsheet.
   *   - If null, Google Visualization Table Query API will be used.
   *   - If not null, Google Sheets API v4 will be used.
   *
   * @see {@link https://developers.google.com/sheets/api/guides/concepts}
   */
  constructor( bLogFetcherEventToConsole, spreadsheetId, range, apiKey ) {
    super();
    GSheets_UrlComposer.setAsConstructor_self.call( this,
      bLogFetcherEventToConsole, spreadsheetId, range, apiKey
    );
  }

  /** @override */
  static setAsConstructor(
    bLogFetcherEventToConsole, spreadsheetId, range, apiKey ) {
    super.setAsConstructor();
    GSheets_UrlComposer.setAsConstructor_self.call( this,
      bLogFetcherEventToConsole, spreadsheetId, range, apiKey
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    bLogFetcherEventToConsole, spreadsheetId, range, apiKey ) {

    if ( apiKey != null ) {
      this.urlComposer = GSheetsAPIv4.UrlComposer.Pool.get_or_create_by(
        bLogFetcherEventToConsole, spreadsheetId, range, apiKey );
    } else {
      this.urlComposer = GVizTQ.UrlComposer.Pool.get_or_create_by(
        bLogFetcherEventToConsole, spreadsheetId, range );
    }
  }

  /** @override */
  disposeResources() {
    if ( this.urlComposer ) {
      this.urlComposer.disposeResources_and_recycleToPool();
      this.urlComposer = null;
    }
    super.disposeResources();
  }

  /** @param {string} spreadsheetId  The Google Sheets' id. */
  set spreadsheetId( spreadsheetId ) {
    this.urlComposer.spreadsheetId = spreadsheetId;
  }

  /** @return {string} The Google Sheets' id. */
  get spreadsheetId() {
    return this.urlComposer.spreadsheetId;
  }

  /** @param {string} range  The range inside the Google Sheets. */
  set range( range ) {
    this.urlComposer.range = range;
  }

  /** @return {string} The range inside the Google Sheets. */
  get range() {
    return this.urlComposer.range;
  }

  /**
   * An async generator for composing the URL (according this object's data
   * members), downloading it as JSON format, extracting data as a two dimension
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
   *   Yield a promise resolves to { value: progressParent.root_get(), done: false }.
   *
   * @yield {Promise( Array[] )}
   *   - Yield a promise resolves to { value: ( a two dimension (column-major) array ),
   *       done: true } when successfully.
   *   - Yield a promise resolves to { value: null, done: true } when failed.
   *
   * @throws {ProgressEvent}
   *   Yield a promise rejects to ProgressEvent.
   */
  async* JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
    progressParent, params_loading_retryWaiting ) {

    let fetcher = this.urlComposer.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
      progressParent, params_loading_retryWaiting );

    let ColumnMajorArrayArray = yield *fetcher;
    return ColumnMajorArrayArray;
  }

  /**
   * Composing the URL (according to this object's data members), download
   * it as JSON format, extract data as a two dimension (column-major) array.
   *
   * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
   *   The parameters for loading timeout and retry waiting time. It will be kept
   * but not modified by this object.
   *
   * @return {Promise( Array[] )}
   *   Return a promise.
   *   - It will resolve to ( a two dimension (column-major) array ) when successful.
   *   - It will resolve to ( null ) when failed.
   */
  async JSON_ColumnMajorArrayArray_fetch_async( params_loading_retryWaiting ) {
    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    let resultColumnMajorArrayArray;
    try {
      let fetcher = this.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
        progress, params_loading_retryWaiting );

      let fetcherNext;
      do {
        fetcherNext = await fetcher.next();
        if ( fetcherNext.done == false ) {
          //let progressRoot = fetcherNext.value;
        } else { // ( fetcherNext.done == true )
          resultColumnMajorArrayArray = fetcherNext.value;
        }
      } while ( fetcherNext.done == false );

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
      progress.disposeResources_and_recycleToPool();
      progress = null;
    }

    return resultColumnMajorArrayArray;
  }

  /**
   * @return {boolean}
   *    Return true, if .urlComposer.httpFetcher now is during retry waiting.
   */
  get retryWaitingTimer_isCounting() {
    if ( this.urlComposer )
      return this.urlComposer.retryWaitingTimer_isCounting;
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
    this.urlComposer?.abort();
  }

}
