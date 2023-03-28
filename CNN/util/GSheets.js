export { GSheets_UrlComposer as UrlComposer };

import * as NonReentrant from "./NonReentrant.js";
import * as GVizTQ from "./GSheet/GVizTQ.js";
import * as GSheetsAPIv4 from "./GSheet/GSheetsAPIv4.js";
import * as HttpRequest from "./HttpRequest.js";
import * as Pool from "./Pool.js";
import * as Recyclable from "./Recyclable.js";
import * as ValueMax from "./ValueMax.js";


//!!! ...unfinished... (2023/03/28)
// Replace this class by a creator function.
// GSheets.UrlComposer_Pool_get_or_create_by()

// It create either GSheetsAPIv4 or GVizTQ.

/**
 * Fetch data from Google Sheets.
 *
 * @member {boolean} bLogFetcherEventToConsole
 *   If true, some debug messages of HttpRequest.Fetcher will be logged to
 * console.
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
 * @member {Array[]} fetchResult
 *   The result of fetch_asyncGenerator or fetch_asyncPromise.
 *   - A ( two dimension (column-major) array ) if succeeded.
 *   - null if failed.
 *
 *
 * @member {boolean} retryWaitingTimer_isCounting
 *   If true, the .urlComposer.httpFetcher now is during retry waiting.
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
 */
class GSheets_UrlComposer
  extends NonReentrant.asyncPromise_by_asyncGenerator(
    "fetch", "Result", relay_JSON_ColumnMajorArrayArray_fetch_asyncGenerator,
    Recyclable.Root ) {

  /**
   * Used as default GSheets.UrlComposer provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "GSheets.UrlComposer.Pool",
    GSheets_UrlComposer, GSheets_UrlComposer.setAsConstructor );

  /**
   * If no sheet name in the range's A1 notation, the first (most left) visible
   * sheet inside the spreadsheet will be used.
   *
   * @param {string} spreadsheetId
   *   The identifier (the component after the
   * "https://docs.google.com/spreadsheets/d/") of the spreadsheet to be
   * accessed.
   *
   * @param {string} range
   *   The cells' A1 notation. It describes the (name and) range of the sheet
   * inside the spreadsheet.
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
  constructor( spreadsheetId, range, apiKey ) {
    super();
    GSheets_UrlComposer.setAsConstructor_self.call( this,
      spreadsheetId, range, apiKey
    );
  }

  /** @override */
  static setAsConstructor( spreadsheetId, range, apiKey ) {
    super.setAsConstructor();
    GSheets_UrlComposer.setAsConstructor_self.call( this,
      spreadsheetId, range, apiKey
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self( spreadsheetId, range, apiKey ) {
    if ( apiKey != null ) {
      this.urlComposer = GSheetsAPIv4.UrlComposer.Pool.get_or_create_by(
        spreadsheetId, range, apiKey );
    } else {
      this.urlComposer = GVizTQ.UrlComposer.Pool.get_or_create_by(
        spreadsheetId, range );
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


  set bLogFetcherEventToConsole( bLogFetcherEventToConsole ) {
    if ( this.urlComposer )
      this.urlComposer.bLogFetcherEventToConsole = bLogFetcherEventToConsole;
  }

  get bLogFetcherEventToConsole() {
    if ( this.urlComposer )
      return this.urlComposer.bLogFetcherEventToConsole;
    return false;
  }


  get retryWaitingTimer_isCounting() {
    if ( this.urlComposer )
      return this.urlComposer.retryWaitingTimer_isCounting;
    return false;
  }


  /**
   * An async generator for composing the URL (according this object's data
   * members), downloading it as JSON format, extracting data as a two dimension
   * (column-major) array.
   *
   * @param {GSheets_UrlComposer} this
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent.
   * The created progressToAdvance will be increased when every time advanced.
   * The progressParent.root_get() will be returned when every time yield.
   *
   * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
   *   The parameters for loading timeout and retry waiting time. It will be kept
   * but not modified by this object.
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, this async generator will
   * await it before complete. If null or undefined, no extra delay awaiting.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { value: progressParent.root_get(), done: false }.
   *
   * @yield {Promise( Array[] )}
   *   Yield a promise
   *   - Resolved to { done: true,
   *       value: ( a two dimension (column-major) array ) } when successfully.
   *   - Resolved to { done: true, value: null } when failed.
   */
  static async* JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
    progressParent, params_loading_retryWaiting, delayPromise ) {

    try {
      // 1.
      let fetcher_underlie = this.urlComposer
        .JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
          progressParent, params_loading_retryWaiting );

      let fetchResult = yield *fetcher_underlie;

      // 2.
      if ( delayPromise )
        await delayPromise;

      return fetchResult; // ColumnMajorArrayArray

    } catch ( e ) {
      //debugger;
      throw e;

    } finally {
    }
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


/**
 *
 * @param {GSheets_UrlComposer} this
 *
 * @return {AsyncGenerator}
 *   Return the newly created instance of GSheets_UrlComposer
 * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
 */
function relay_JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
  ...restArgs ) {

  return GSheets_UrlComposer.JSON_ColumnMajorArrayArray_fetch_asyncGenerator
    .apply( this, restArgs )
}
