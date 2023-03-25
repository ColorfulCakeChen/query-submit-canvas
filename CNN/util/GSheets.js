export { GSheets_UrlComposer as UrlComposer };

import * as AsyncGuarder from "./AsyncGuarder.js";
import * as GVizTQ from "./GSheet/GVizTQ.js";
import * as GSheetsAPIv4 from "./GSheet/GSheetsAPIv4.js";
import * as HttpRequest from "./HttpRequest.js";
import * as Pool from "./Pool.js";
import * as Recyclable from "./Recyclable.js";
import * as ValueMax from "./ValueMax.js";

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

//!!! (2023/03/24 Remarked) Use AsyncGuarder instead.
//class GSheets_UrlComposer extends Recyclable.Root {
class GSheets_UrlComposer
  extends AsyncGuarder.RecyclableBase(
    "fetch", JSON_ColumnMajorArrayArray_fetch_asyncGenerator_relay ) {

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

//!!! (2023/03/24 Remarked) Use AsyncGuarder instead.
//     GSheets_UrlComposer.fetch_progress_dispose.call( this );
//     this.fetch_asyncGenerator_running = undefined;
//     this.fetch_async_running = undefined;

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


//!!! (2023/03/24 Remarked) Use AsyncGuarder instead.
//   /**
//    * Note: The this.fetch_progress will record progress of this method.
//    *
//    *
//    * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
//    *   The parameters for loading timeout and retry waiting time. It will be kept
//    * but not modified by this object.
//    *
//    * @param {Promise} delayPromise
//    *   Mainly used when unit testing. If not null, the async method will
//    * await it before complete. If null or undefined, no extra delay awaiting.
//    *
//    * @return {Promise( Array[] )}
//    *   Return the newly created JSON_ColumnMajorArrayArray_fetch_promise which
//    * is an instance of .JSON_ColumnMajorArrayArray_fetch_async().
//    */
//   JSON_ColumnMajorArrayArray_fetch_promise_create(
//     params_loading_retryWaiting, delayPromise ) {
//
//     { // Checking pre-condition.
//       const funcNameInMessage = "JSON_ColumnMajorArrayArray_fetch_promise_create";
//
//       GSheets_UrlComposer.throw_if_an_old_still_running.call( this,
//         this.fetch_async_running, funcNameInMessage );
//
//       GSheets_UrlComposer.throw_if_fetching.call( this, funcNameInMessage );
//     }
//
//     // 1.
//     let fetcher;
//     {
//       // Use internal independent progress.
//       GSheets_UrlComposer.fetch_progress_create.call( this );
//
//       // Prepare fetcher
//       fetcher = GSheets_UrlComposer
//         .JSON_ColumnMajorArrayArray_fetcher_create_without_checking_precondition
//         .call( this,
//           this.fetch_progress, params_loading_retryWaiting, delayPromise );
//     }
//
//     // 2.
//     return GSheets_UrlComposer
//       .JSON_ColumnMajorArrayArray_fetch_promise_create_without_checking_precondition
//       .call( this, fetcher );
//   }
//
//   /**
//    *
//    * @param {GSheets_UrlComposer} this
//    *
//    * @param {AsyncGenerator} fetcher
//    *   The async generator (an instance of
//    * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator()) to be wrapped by the
//    * created promise.
//    *
//    * @return {Promise( Array[] )}
//    *   Return the newly created JSON_ColumnMajorArrayArray_fetch_promise which
//    * is an instance of .JSON_ColumnMajorArrayArray_fetch_async().
//    */
//   static JSON_ColumnMajorArrayArray_fetch_promise_create_without_checking_precondition(
//     fetcher ) {
//
//     this.fetch_async_running = true;
//     let fetch_promise = GSheets_UrlComposer
//       .JSON_ColumnMajorArrayArray_fetch_async.call( this, fetcher );
//     return JSON_ColumnMajorArrayArray_fetch_promise;
//   }
//
//   /**
//    * Composing the URL (according to this object's data members), download
//    * it as JSON format, extract data as a two dimension (column-major) array.
//    *
//    * @param {AsyncGenerator} fetcher
//    *   The async generator (an instance of
//    * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator()) to be wrapped by the
//    * created promise.
//    *
//    * @return {Promise( Array[] )}
//    *   Return a promise.
//    *   - Resolved to ( a two dimension (column-major) array ) when successful.
//    *   - Resolved to ( null ) when failed.
//    */
//   static async JSON_ColumnMajorArrayArray_fetch_async( fetcher ) {
//
//     { // Checking pre-condition.
//       const funcNameInMessage = "JSON_ColumnMajorArrayArray_fetch_async";
//
//       GSheets_UrlComposer.throw_call_another_if_false.call( this,
//         this.fetch_async_running, funcNameInMessage,
//         "JSON_ColumnMajorArrayArray_fetch_promise_create" );
//     }
//
//     try {
//       // 1.
//       if ( !fetcher )
//         throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
//           + `fetcher should have already existed.` );
//
//       let fetcherNext;
//       do {
//         fetcherNext = await fetcher.next();
//       } while ( !fetcherNext.done );
//
//       let resultColumnMajorArrayArray = fetcherNext.value;
//       return resultColumnMajorArrayArray;
//
//     } catch ( e ) {
//       //console.error( e );
//       //debugger;
//       throw e; // Unknown error, should be said loundly.
//
//     } finally {
//       // 2. So that this async method could be executed again.
//       this.fetch_async_running = false;
//     }
//   }
//
//
//   /**
//    * Create JSON_ColumnMajorArrayArray_fetcher (an instance of
//    * .JSON_ColumnMajorArrayArray_fetch_asyncGenerator()).
//    *
//    *
//    * @param {ValueMax.Percentage.Aggregate} progressParent
//    *   Some new progressToAdvance will be created and added to progressParent. The
//    * created progressToAdvance will be increased when every time advanced. The
//    * progressParent.root_get() will be returned when every time yield.
//    *
//    * @param {Promise} delayPromise
//    *   Mainly used when unit testing. If not null, the async generator will
//    * await it before complete. If null or undefined, no extra delay awaiting.
//    *
//    * @return {AsyncGenerator}
//    *   Return the newly created JSON_ColumnMajorArrayArray_fetcher which is an
//    * instance of .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
//    */
//   JSON_ColumnMajorArrayArray_fetcher_create(
//     progressParent, params_loading_retryWaiting, delayPromise ) {
//
//     { // Checking pre-condition.
//       const funcNameInMessage = "JSON_ColumnMajorArrayArray_fetcher_create";
//
//       GSheets_UrlComposer.throw_if_an_old_still_running.call( this,
//         this.fetch_asyncGenerator_running, funcNameInMessage );
//
//       GSheets_UrlComposer.throw_if_fetching.call( this, funcNameInMessage );
//     }
//
//     let fetcher = GSheets_UrlComposer
//       .JSON_ColumnMajorArrayArray_fetcher_create_without_checking_precondition
//       .call( this, progressParent, params_loading_retryWaiting, delayPromise );
//     return fetcher;
//   }
//
//   /**
//    * Create an instance of .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
//    *
//    *
//    * @param {GSheets_UrlComposer} this
//    *
//    * @return {AsyncGenerator}
//    *   Return the newly created JSON_ColumnMajorArrayArray_fetcher which is an
//    * instance of .JSON_ColumnMajorArrayArray_fetch_asyncGenerator().
//    */
//   static JSON_ColumnMajorArrayArray_fetcher_create_without_checking_precondition(
//     progressParent, params_loading_retryWaiting, delayPromise ) {
//
//     this.fetch_asyncGenerator_running = true;
//
//     let fetcher = GSheets_UrlComposer
//       .JSON_ColumnMajorArrayArray_fetch_asyncGenerator.call( this,
//         progressParent, params_loading_retryWaiting, delayPromise );
//     return fetcher;
//   }


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

//!!! (2023/03/24 Remarked) Use AsyncGuarder instead.
//     { // Checking pre-condition.
//       const funcNameInMessage = "JSON_ColumnMajorArrayArray_fetch_asyncGenerator";
//
//       GSheets_UrlComposer.throw_call_another_if_false.call( this,
//         this.fetch_asyncGenerator_running, funcNameInMessage,
//         "JSON_ColumnMajorArrayArray_fetcher_create" );
//     }

    try {
      // 1.
      let fetcher_underlie = this.urlComposer
        .JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
          progressParent, params_loading_retryWaiting );

      let ColumnMajorArrayArray = yield *fetcher_underlie;

      // 2.
      if ( delayPromise )
        await delayPromise;

      return ColumnMajorArrayArray;

    } catch ( e ) {
      //debugger;
      throw e;

    } finally {

//!!! (2023/03/24 Remarked) Use AsyncGuarder instead.
//       // 3. So that this async generator could be executed again.
//       this.fetch_asyncGenerator_running = false;

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


//!!! (2023/03/24 Remarked) Use AsyncGuarder instead.
//   /**
//    * @param {GSheets_UrlComposer} this
//    */
//   static fetch_progress_create() {
//     GSheets_UrlComposer.fetch_progress_dispose.call( this );
//     this.fetch_progress
//       = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
//   }

//   /**
//    * @param {GSheets_UrlComposer} this
//    */
//   static fetch_progress_dispose() {
//     if ( this.fetch_progress ) {
//       this.fetch_progress.disposeResources_and_recycleToPool();
//       this.fetch_progress = null;
//     }
//   }


//   /**
//    * @param {GSheets_UrlComposer} this
//    * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
//    */
//   static throw_if_fetching( funcNameInMessage ) {
//     if (   ( this.fetch_async_running )
//         || ( this.fetch_asyncGenerator_running ) )
//       throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
//         + `should not be executed while still fetching.` );
//   }

//   /**
//    * @param {GSheets_UrlComposer} this
//    * @param {boolean} b_still_running    If true, throw exception.
//    * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
//    */
//   static throw_if_an_old_still_running( b_still_running, funcNameInMessage ) {
//     if ( b_still_running )
//       throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
//         + `An old .${funcNameInMessage}() is still running.` );
//   }

//   /**
//    * @param {GSheets_UrlComposer} this
//    * @param {boolean} b                  If false, throw exception.
//    * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
//    * @param {string} funcNameShouldBeCalledInMessage
//    *   The function name which should be called instead. (e.g. init_promise_create)
//    */
//   static throw_call_another_if_false(
//     b, funcNameInMessage, funcNameShouldBeCalledInMessage ) {

//     if ( !b )
//       throw Error( `GSheets.UrlComposer.${funcNameInMessage}(): `
//         + `Please call .${funcNameShouldBeCalledInMessage}() instead.` );
//   }

}


/**
 *
 * @param {GSheets_UrlComposer} this
 */
function JSON_ColumnMajorArrayArray_fetch_asyncGenerator_relay(
  ...restArgs ) {

  GSheets_UrlComposer.JSON_ColumnMajorArrayArray_fetch_asyncGenerator
    .apply( this, restArgs )
}
