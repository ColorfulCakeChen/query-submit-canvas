export { GSheetsAPIv4_UrlComposer as UrlComposer };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import * as ValueMax from "../ValueMax.js";
import { HttpFetcher } from "./HttpFetcher.js";

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
 * @member {HttpFetcher} httpFetcher
 *   The current (or last) fetcher of the http request. It could be used to
 * call .abort().
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
   * @param {boolean} bLogFetcherEventToConsole
   *   If true, some debug messages of HttpFetcher will be logged to console.
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
   *
   * @see {@link https://developers.google.com/sheets/api/guides/concepts}
   * @see {@link https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get}
   * @see {@link https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values}
   */
  constructor( bLogFetcherEventToConsole, spreadsheetId, range, apiKey ) {
    super();
    GSheetsAPIv4_UrlComposer.setAsConstructor_self.call( this,
      bLogFetcherEventToConsole, spreadsheetId, range, apiKey
    );
  }

  /** @override */
  static setAsConstructor(
    bLogFetcherEventToConsole, spreadsheetId, range, apiKey ) {
    super.setAsConstructor();
    GSheetsAPIv4_UrlComposer.setAsConstructor_self.call( this,
      bLogFetcherEventToConsole, spreadsheetId, range, apiKey
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    bLogFetcherEventToConsole, spreadsheetId, range, apiKey ) {
      this.bLogFetcherEventToConsole = bLogFetcherEventToConsole;
      this.set_by_spreadsheetId_range_apiKey( spreadsheetId, range, apiKey );
  }

  /** @override */
  disposeResources() {
    this.httpFetcher = undefined;
    this.apiKey = undefined;
    this.range = undefined;
    this.spreadsheetId = undefined;
    this.bLogFetcherEventToConsole = undefined;
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
   * Generator for composing the URL (according this object's data members), downloading
   * it as JSON format, extracting data as a two dimension (column-major) array.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @param {number} loadingMillisecondsMax
   *   The maximum time (in milliseconds) a request can take before automatically
   * being terminated. Default is 0, which means there is no timeout.
   *
   * @param {number} loadingMillisecondsInterval
   *   The interval time (in milliseconds) for advancing the loadingMillisecondsCur.
   *
   * @param {number} retryTimesMax
   *   Retry request so many times at most when request failed (ProgressEvent
   * is error, or load without status 200, or timeout).
   *
   * @param {number} retryWaitingSecondsExponentMax
   *   The maximum exponent (for two's power; i.e. the B of ( 2 ** B ) ) of retry
   * waiting time (in seconds, not in milliseconds). It is only used if
   * ( retryTimesMax > 0 ).
   *
   * @member {number} retryWaitingMillisecondsInterval
   *   The interval time (in milliseconds) for advancing retryWaitingMillisecondsCur.
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
    progressParent,

    loadingMillisecondsMax,
    loadingMillisecondsInterval,

    retryTimesMax,
    retryWaitingSecondsExponentMax,
    retryWaitingMillisecondsInterval,
  ) {

    let progressRoot = progressParent.root_get();
    let progressFetcher = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) );

    try {
      // 1. Compose URL and download it as column-major JSON.
      let url = this.getUrl_forJSON( "COLUMNS" );

      let responseText;
      {
        this.httpFetcher = new HttpFetcher( this.bLogFetcherEventToConsole );
        let httpResulter = this.httpFetcher
          .asyncGenerator_by_progressParent_url_timeout_retry_responseType_method_body(
            progressFetcher, url,

            loadingMillisecondsMax,
            loadingMillisecondsInterval,
        
            retryTimesMax,
            retryWaitingSecondsExponentMax,
            retryWaitingMillisecondsInterval
          );

        try {
          responseText = yield* httpResulter;
          if ( !responseText )
            return null; // should not happen.

        } catch( e ) {

//!!! ...unfinished... (2023/02/14) How to re-try download?
          if ( e instanceof ProgressEvent ) {
            if ( e.type === "abort" ) {
              throw e;

            } else if ( e.type === "error" ) {
              throw e;

            } else if ( e.type === "load" ) { // ( status != 200 ) (e.g. 404 or 500)
              throw e;

            } else if ( e.type === "timeout" ) {
              throw e;

            } else { // Unknown error.
              console.error( e );
              throw e;
            }

          } else { // Unknown error.
            console.error( e );
            throw e;
          }
        }
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
      return null;
    }
  }

//!!! (2023/02/14 Remarked) Use XMLHttpRequest instead. (for progress)
//   /**
//    * Generator for composing the URL (according this object's data members), downloading
//    * it as JSON format, extracting data as a two dimension (column-major) array.
//    *
//    * @param {ValueMax.Percentage.Aggregate} progressParent
//    *   Some new progressToAdvance will be created and added to progressParent. The
//    * created progressToAdvance will be increased when every time advanced. The
//    * progressParent.root_get() will be returned when every time yield.
//    *
//    * @yield {Promise( ValueMax.Percentage.Aggregate )}
//    *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
//    *
//    * @yield {Promise( Array[] )}
//    *   - Yield a promise resolves to { done: true,
//    *       value: ( a two dimension (column-major) array ) } when successfully.
//    *   - Yield a promise resolves to { done: true, value: null } when failed.
//    */
//   async* JSON_ColumnMajorArrayArray_fetch_asyncGenerator( progressParent ) {
//     let progressRoot = progressParent.root_get();
//     let progressToAdvance = progressParent.child_add(
//       ValueMax.Percentage.Concrete.Pool.get_or_create_by( 3 ) );
//
//     try {
//       // 1. Compose URL and download it as column-major JSON.
//       let url = this.getUrl_forJSON( "COLUMNS" );
//       let response = await fetch( url );
//
//       progressToAdvance.value_advance(); // 33%
//       yield progressRoot;
//
//       if ( !response.ok )
//         return null;
//
//       // 2. Google Sheets API v4 returns JSON.
//       let json = await response.json();
//
//       progressToAdvance.value_advance(); // 33%
//       yield progressRoot;
//
//       if ( !json )
//         return null;
//
//       // 3. Since already downloaded as column major. Uses it directly.
//       let ColumnMajorArrayArray = json.values;
//
//       progressToAdvance.value_advance(); // 33%
//       yield progressRoot;
//
//       return ColumnMajorArrayArray;
//
//     } catch ( e ) {
//       return null;
//     }
//   }

  /**
   * @param {string} majorDimension
   *   The major dimension of the arrangement for the downloaded json data. It could
   * be "ROWS" or "COLUMNS". If null, the same as "ROWS".
   *
   * @return {string} The url for downloading the target as json format.
   */
  getUrl_forJSON( majorDimension = null ) {
    let url = `${GSheetsAPIv4_UrlComposer.spreadsheetUrlPrefix}/${
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
