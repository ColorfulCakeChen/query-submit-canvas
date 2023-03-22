export { GSheets_UrlComposer as UrlComposer };

import * as Pool from "./Pool.js";
import * as Recyclable from "./Recyclable.js";
import * as GVizTQ from "./GSheet/GVizTQ.js";
import * as GSheetsAPIv4 from "./GSheet/GSheetsAPIv4.js";
import * as HttpRequest from "./HttpRequest.js";
import * as ValueMax from "./ValueMax.js";

/**
 * Fetch data from Google Sheets.
 *
 * @member {boolean} bLogFetcherEventToConsole
 *   If true, some debug messages of HttpRequest.Fetcher will be logged to
 * console.
 *
 * @member {boolean} fetch_async_running
 *   If true, a .JSON_ColumnMajorArrayArray_fetch_async() is still executing.
 * Please wait it becoming false if wanting to call
 * .JSON_ColumnMajorArrayArray_fetch_async() again.
 *
 * @member {boolean} fetch_asyncGenerator_running
 *   If true, a .JSON_ColumnMajorArrayArray_fetch_asyncGenerator() is still
 * executing. Please wait it becoming false if wanting to call
 * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator() again.
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
    this.fetch_asyncGenerator_running = undefined;
    this.fetch_async_running = undefined;

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
   * Composing the URL (according to this object's data members), download
   * it as JSON format, extract data as a two dimension (column-major) array.
   *
   * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
   *   The parameters for loading timeout and retry waiting time. It will be kept
   * but not modified by this object.
   *
   * @return {Promise( Array[] )}
   *   Return a promise.
   *   - Resolved to ( a two dimension (column-major) array ) when successful.
   *   - Resolved to ( null ) when failed.
   */
  async JSON_ColumnMajorArrayArray_fetch_async( params_loading_retryWaiting ) {

    const funcNameInMessage = "JSON_ColumnMajorArrayArray_fetch_async";
    { // Checking pre-condition.
      GSheets_UrlComposer.throw_call_another_if_false.call( this,
        this.fetch_async_running, funcNameInMessage,
        "JSON_ColumnMajorArrayArray_fetch_promise_create" );
    }

//!!! ...unfinished... (2023/03/11) What if re-entrtance?
//    this.fetch_async_running = ???;

    let progress;
    let resultColumnMajorArrayArray;
    try {
      let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

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
      //console.error( e );
      //debugger;
      throw e; // Unknown error, should be said loundly.

    } finally {
      if ( progress ) {
        progress.disposeResources_and_recycleToPool();
        progress = null;
      }

      // So that this async method could be executed again.
      this.fetch_async_running = false;
    }

    return resultColumnMajorArrayArray;
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
   *   Yield a promise
   *   - Resolved to { done: true,
   *       value: ( a two dimension (column-major) array ) } when successfully.
   *   - Resolved to { done: true, value: null } when failed.
   */
  async* JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
    progressParent, params_loading_retryWaiting ) {

//!!! ...unfinished... (2023/03/11) What if re-entrtance?
//this.fetch_asyncGenerator_running = ???;


    let fetcher = this.urlComposer
      .JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
        progressParent, params_loading_retryWaiting );

    let ColumnMajorArrayArray = yield *fetcher;
    return ColumnMajorArrayArray;
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



  /**
   * @param {GSheets_UrlComposer} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_fetching( funcNameInMessage ) {
    if (   ( this.fetch_async_running )
        || ( this.fetch_asyncGenerator_running ) )
      throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
        + `should not be executed while still fetching.` );
  }

  /**
   * @param {GSheets_UrlComposer} this
   * @param {boolean} b_still_running    If true, throw exception.
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_an_old_still_running( b_still_running, funcNameInMessage ) {
    if ( b_still_running )
      throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
        + `An old .${funcNameInMessage}() is still running.` );
  }

  /**
   * @param {GSheets_UrlComposer} this
   * @param {boolean} b                  If false, throw exception.
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   * @param {string} funcNameShouldBeCalledInMessage
   *   The function name which should be called instead. (e.g. init_promise_create)
   */
  static throw_call_another_if_false(
    b, funcNameInMessage, funcNameShouldBeCalledInMessage ) {

    if ( !b )
      throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
        + `Please call .${funcNameShouldBeCalledInMessage}() instead.` );
  }

}
