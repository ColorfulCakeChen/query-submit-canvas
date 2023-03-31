export { DEvolution_VersusSummary as VersusSummary };

import * as GSheets from "../../util/GSheets.js";
import * as HttpRequest from "../../util/HttpRequest.js";
import * as NonReentrant from "../../util/NonReentrant.js";
import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as RandTools from "../../util/RandTools.js";
import * as ValueMax from "../../util/ValueMax.js";
import { Versus as DEvolution_Versus } from "./DEvolution_Versus.js";

/**
 * Differential evolution summary information by downloading range list.
 *
 * @member {string} weightsSpreadsheetId
 *   The Google Sheets spreadsheetId of neural network weights.
 *
 * @member {string} weightsAPIKey
 *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
 * (Note: api key can not be changed after this object created.)
 *   - If null, Google Visualization Table Query API will be used.
 *   - If not null, Google Sheets API v4 will be used.
 *
 * @member {boolean} bLogFetcherEventToConsole
 *   If true, some debug messages of HttpRequest.Fetcher will be logged to console.
 *
 * @member {string[]} rangeArray
 *   A string array. Every element is the spreadsheet range description string for an
 * evolution versus (i.e. parent versus offspring).
 *
 * @member {number[]} visitIndexArray
 *   A number array. Every element is the index into .rangeArray[]. It is used
 * for visiting .rangeArray[] randomly.
 *
 * @member {number} visitCount
 *   So many versus data has been visited. It is the next index into
 * .visitIndexArray[].
 *

!!! ...unfinished... (2023/03/31)

 * @member {boolean} loadOk
 *   If true, the .rangeArray[] has been ready.
 *

!!! ...unfinished... (2023/03/31)

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
 *
 */
class DEvolution_VersusSummary extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusSummary provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusSummary.Pool",
    DEvolution_VersusSummary, DEvolution_VersusSummary.setAsConstructor );

  /**
   */
  constructor( weightsSpreadsheetId, weightsAPIKey ) {
    super();
    DEvolution_VersusSummary.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey
    );
  }

  /** @override */
  static setAsConstructor( weightsSpreadsheetId, weightsAPIKey ) {
    super.setAsConstructor();
    DEvolution_VersusSummary.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self( weightsSpreadsheetId, weightsAPIKey ) {
    this.urlComposer = GSheets.UrlComposer_Pool_get_or_create_by(
      weightsSpreadsheetId, undefined, weightsAPIKey ); // range is undefined.

    this.textEncoder = new TextEncoder();
  }

  /** @override */
  disposeResources() {

    this.textEncoder = undefined;

    this.visitCount = undefined;

    if ( this.visitIndexArray ) {
      this.visitIndexArray.disposeResources_and_recycleToPool();
      this.visitIndexArray = undefined;
    }

    this.rangeArray = undefined; // (normal array, just nullifiy it.)

    if ( this.urlComposer ) {
      this.urlComposer.disposeResources_and_recycleToPool();
      this.urlComposer = undefined;
    }

    super.disposeResources();
  }


  set weightsSpreadsheetId( spreadsheetId ) {
    this.urlComposer.spreadsheetId = spreadsheetId;
  }

  get weightsSpreadsheetId() {
    return this.urlComposer.spreadsheetId;
  }


  get weightsAPIKey() {
    return this.urlComposer.apiKey;
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


//!!! ...unfinished... (2023/03/31)
  get loadOk() {
    if ( this.rangeArray )
      return true;
    return false;
  }

  /**
   * An async generator for loading all differential evolution versus weights
   * ranges.
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
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( boolean )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: true }, if succeeded.
   *   - Resolved to { done: true, value: false }, if failed.
   */
  static async* rangeArray_load_asyncGenerator(
    progressParent, params_loading_retryWaiting ) {

//!!! ...unfinished... (2023/03/11) What if re-entrtance?

    let progressRoot = progressParent.root_get();
    let progressFetcher = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

    // The summary is at the first column of the first (i.e. left most) sheet.
    this.urlComposer.range = DEvolution_VersusSummary.spreadsheetRange;

    let fetcher = this.urlComposer.fetch_asyncGenerator_create(
      progressFetcher, params_loading_retryWaiting );

    let rangeArrayArray = yield *fetcher;
    if ( !rangeArrayArray ) {
      this.rangeArray = null;
      return false;
    }

//!!! ...unfinished... (2023/03/29) fetchOk instead of fetchResult
//    this.urlComposer.fetchResult = undefined; // Reduce memory footprint.

    // Only the first column (i.e. column[ 0 ]) has range description string.
    this.rangeArray = rangeArrayArray[ 0 ];

    this.visitIndexArray_prepare();

    progressToAdvance.value_advance();
    yield progressRoot;

    return true;
  }

  /**
   * Prepare a random visiting list (according to .rangeArray[]'s length).
   * The .visitCount will be reset to zero.
   */
  visitIndexArray_prepare() {
    if ( !this.visitIndexArray )
      this.visitIndexArray = Recyclable.Array.Pool.get_or_create_by();

    if ( this.rangeArray ) {

      // Ordered indexes
      {
        this.visitIndexArray.length = this.rangeArray.length;
        for ( let i = 0; i < this.visitIndexArray.length; ++i ) {
          this.visitIndexArray[ i ] = i;
        }
      }

      // Shuffled indexes
      RandTools.shuffle_Array( this.visitIndexArray );
      this.visitCount = 0; // Reset to zero after (re-)shuffled.

    } else {
      this.visitIndexArray.length = 0;
      this.visitCount = undefined;
    }
  }

  /**
   * @return {number}
   *   Return the current visit index (i.e. array index into .visitIndexArray[])
   * according to .visitCount. It will also prepare .visitIndexArray[] if necessary.
   * Return negative value if .visitCount is not legal or .rangeArray[] is not ready.
   */
  visitIndex_get() {

    // If all versus data are visited (or .visitCount is undefiend), re-prepare a
    // new random visiting list.
    if (   ( !this.visitIndexArray )
        || ( !( this.visitCount < this.visitIndexArray.length ) )
       ) {
      this.visitIndexArray_prepare();
    }

    if (   ( !( this.visitCount >= 0 ) )
        || ( !( this.visitCount < this.visitIndexArray.length ) ) )
      return -1; // Illegal visitCount (e.g. undefined or too large).

    if ( !this.rangeArray )
      return -1; // No range could be visited.

    let visitIndex = this.visitIndexArray[ this.visitCount ];
    return visitIndex;
  }

  /**
   * An async generator for loading the next versus data of differential evolution
   * versus weights.
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
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( DEvolution.Versus )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: DEvolution.Versus }, if succeeded.
   *   - Resolved to { done: true, value: null }, if failed.
   */
  static async* versus_next_load_asyncGenerator(
    progressParent, params_loading_retryWaiting ) {

//!!! ...unfinished... (2023/03/11) What if re-entrtance?

    let visitIndex = this.visitIndex_get();
    if ( visitIndex < 0 )
      return null;

    let versus_loadOk;
    let versus;
    try {
      let spreadsheetRange = this.rangeArray[ visitIndex ];

      versus = DEvolution_Versus.Pool.get_or_create_by();
      let versusLoader = versus.load_asyncGenerator( progressParent,
        this.urlComposer, spreadsheetRange,
        params_loading_retryWaiting,
        this.textEncoder );

      versus_loadOk = yield* versusLoader;

      if ( versus_loadOk ) // Increase visit count, only if loaded sucessfully.
        ++this.visitCount;

    } catch ( e ) {
      //console.error( e );
      throw e; // Unknown error, should be said loundly.

    } finally {
      if ( !versus_loadOk ) { // Release, if failed to load.
        if ( versus ) {
          versus.disposeResources_and_recycleToPool();
          versus = null;
        }
      }
    }

    return versus;
  }

//!!! (2023/03/31 Remarked) Use NonReentrant.asyncPromise_by_asyncGenerator instead.
//   /**
//    * Load this object by calling .versus_next_load_asyncGenerator() and advance
//    * the generator by looping until done.
//    *
//    * An async generator for loading the next versus data of differential evolution
//    * versus weights.
//    *
//    * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
//    *   The parameters for loading timeout and retry waiting time. It will be kept
//    * but not modified by this object.
//    *
//    * @return {Promise( DEvolution.Versus )}
//    *   Return a promise:
//    *   - Resolved to DEvolution.Versus, if succeeded.
//    *   - Resolved to null, if failed.
//    */
//   async versus_next_load_async( params_loading_retryWaiting ) {
//
// //!!! ...unfinished... (2023/03/11) What if re-entrtance?
//
//     let progress;
//     try {
//       progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
//       let loader_async = this.versus_next_load_asyncGenerator( progress,
//         params_loading_retryWaiting );
//
//       let loaderNext;
//       do {
//         loaderNext = await loader_async.next();
//       } while ( loaderNext.done == false );
//
//       let versus = loaderNext.value;
//       return versus;
//
//     } catch ( e ) {
//       //console.error( e );
//       throw e; // Unknown error, should be said loundly.
//
//     } finally {
//       if ( progress ) {
//         progress.disposeResources_and_recycleToPool();
//         progress = null;
//       }
//     }
//   }

}

/** The summary is at the first column of the first (i.e. left most) sheet. */
DEvolution_VersusSummary.spreadsheetRange = "A:A";
