export { DEvolution_VersusSummary as VersusSummary };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as GSheets from "../../util/GSheets.js";
import * as HttpRequest from "../../util/HttpRequest.js";
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
 */
class DEvolution_VersusSummary extends Recyclable.Root {

  /**
   * Used as default DEvolution.rangeArray provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.rangeArray.Pool",
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
    this.urlComposer = GSheets.UrlComposer.Pool.get_or_create_by(
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

  /**
   * An async generator for loading all differential evolution versus weights
   * ranges.
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
   * @yield {Promise( boolean )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: true }, if succeeded.
   *   - Resolved to { done: true, value: false }, if failed.
   *
   * @throws {ProgressEvent}
   *   Yield a promise rejects to ProgressEvent.
   */
  async* rangeArray_load_asyncGenerator(
    progressParent, params_loading_retryWaiting ) {

    let progressRoot = progressParent.root_get();
    let progressFetcher = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

    // The summary is at the first column of the first (i.e. left most) sheet.
    this.urlComposer.range = DEvolution_VersusSummary.spreadsheetRange;

    let fetcher = this.urlComposer.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
      progressFetcher, params_loading_retryWaiting );

    let rangeArrayArray = yield *fetcher;
    if ( !rangeArrayArray ) {
      this.rangeArray = null;
      return false;
    }

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
   * @yield {Promise( DEvolution.Versus )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: DEvolution.Versus }, if succeeded.
   *   - Resolved to { done: true, value: null }, if failed.
   *
   * @throws {ProgressEvent}
   *   Yield a promise rejects to ProgressEvent.
   */
  async* versus_next_load_asyncGenerator(
    progressParent, params_loading_retryWaiting ) {

//!!! ...unfinished... (2023/03/06)
    // let progressRoot = progressParent.root_get();
    // let progressFetcher = progressParent.child_add(
    //   ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    // let progressToAdvance = progressParent.child_add(
    //   ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );

//!!! ...unfinished... (2023/03/06)
    let visitIndex = this.visitIndex_get();
    if ( visitIndex < 0 )
      return null;

    let spreadsheetRange = this.rangeArray[ visitIndex ];

    let versus = DEvolution_Versus.Pool.get_or_create_by();
    try {
      let bLoadOk = await versus.load_async(
        this.urlComposer, spreadsheetRange, this.textEncoder );

      if ( !bLoadOk )
        return null;

    } catch ( e ) {
      console.error( e );

      if ( versus ) {
        versus.disposeResources_and_recycleToPool();
        versus = null;
      }

      return null;
    }

    ++this.visitCount;

    return versus;
  }

  /**
   * Load this object by calling load_asyncGenerator() and advance the generator
   * by loop until done.
   *
     /**
   * An async generator for loading the next versus data of differential evolution
   * versus weights.
   *
   * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
   *   The parameters for loading timeout and retry waiting time. It will be kept
   * but not modified by this object.
   *
   * @return {Promise( DEvolution.Versus )}
   *   Return a promise:
   *   - Resolved to DEvolution.Versus, if succeeded.
   *   - Resolved to null, if failed.
   *
   * @throws {ProgressEvent}
   *   Yield a promise rejects to ProgressEvent.
   */
  async versus_next_load_async( params_loading_retryWaiting ) {
    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    try {
      let loader_async = this.versus_next_load_asyncGenerator( progress,
        params_loading_retryWaiting );

      let loaderNext;
      do {
        loaderNext = await loader_async.next();
      } while ( loaderNext.done == false );

      let versus = loaderNext.value;
      return versus;

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
      if ( progress ) {
        progress.disposeResources_and_recycleToPool();
        progress = null;
      }
    }
  }

}

/** The summary is at the first column of the first (i.e. left most) sheet. */
DEvolution_VersusSummary.spreadsheetRange = "A:A";
