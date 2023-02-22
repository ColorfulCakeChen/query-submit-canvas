export { GVizTQ_UrlComposer as UrlComposer };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import * as ValueMax from "../ValueMax.js";
import { HttpFetcher } from "./HttpFetcher.js";

/**
 * Compose a URL for downloading cells data (as JSON or .CSV format) from a Google
 * Sheets by using Google Visualzation Table Query API. The target spreadsheet should
 * be shared by either "Public on the web" or "Anyone with the link".
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
 */
class GVizTQ_UrlComposer extends Recyclable.Root {

  /**
   * Used as default GSheet.GVizTQ.UrlComposer provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "GSheet.GVizTQ.UrlComposer.Pool",
    GVizTQ_UrlComposer, GVizTQ_UrlComposer.setAsConstructor );

  /**
   * If sheetId is null, sheetName is null, and no sheet name in the range's A1
   * notation, the first (most left) visible sheet inside the spreadsheet will be used.
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
   * @param {number} headers
   *   The component after the "headers=". It means how many header rows. It should be
   * zero or a positive integer.
   *
   * @param {string} responseHandler
   *   The function name of JSON content handler. Only meaningful when the content is
   * downloaded as JSONP format. This responseHandler name will be prepended in front
   * of the downloaded content.
   *
   * @param {number} sheetId
   *   The component after the "gid=". If the sheetName is used (or the sheet name in
   * the range's A1 notation is specified), keep this sheetId null (or undefined).
   *
   * @param {string} sheetName
   *   The component after the "sheet=". If the sheetId is used (or the sheet name in
   * the range's A1 notation is specified), keep this sheetName null (or undefined).
   *
   * @see {@link https://developers.google.com/sheets/api/guides/concepts}
   * @see {@link https://developers.google.com/chart/interactive/docs/dev/implementing_data_source}
   * @see {@link https://developers.google.com/chart/interactive/docs/spreadsheets}
   * @see {@link https://developers.google.com/chart/interactive/docs/querylanguage}
   */
  constructor(
    bLogFetcherEventToConsole,
    spreadsheetId,
    range,
    headers = 0, responseHandler = null, sheetId = null, sheetName = null
  ) {
    super();
    GVizTQ_UrlComposer.setAsConstructor_self.call( this,
      bLogFetcherEventToConsole,
      spreadsheetId,
      range,
      headers, responseHandler, sheetId, sheetName
    );
  }

  /** @override */
  static setAsConstructor(
    bLogFetcherEventToConsole,
    spreadsheetId,
    range,
    headers = 0, responseHandler = null, sheetId = null, sheetName = null
  ) {
    super.setAsConstructor();
    GVizTQ_UrlComposer.setAsConstructor_self.call( this,
      bLogFetcherEventToConsole,
      spreadsheetId,
      range,
      headers, responseHandler, sheetId, sheetName
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    bLogFetcherEventToConsole,
    spreadsheetId,
    range,
    headers, responseHandler, sheetId, sheetName
  ) {
    this.bLogFetcherEventToConsole = bLogFetcherEventToConsole;
    this.set_by_spreadsheetId_range_headers_responseHandler_sheetId_sheetName(
      spreadsheetId,
      range, headers, responseHandler, sheetId, sheetName
    );
  }

  /** @override */
  disposeResources() {
    this.sheetName = undefined;
    this.sheetId = undefined;
    this.responseHandler = undefined;
    this.headers = undefined;
    this.range = undefined;
    this.spreadsheetId = undefined;
    this.bLogFetcherEventToConsole = undefined;
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
   * @param {number} retryWaitingMillisecondsExponentMax
   *   The maximum exponent (for two's power; i.e. the B of ( 2 ** B ) ) of waiting
   * time for retry. It is only used if ( retryTimesMax > 0 ).
   *
   * @member {number} retryWaitingMillisecondsInterval
   *   The interval time (in milliseconds) for advancing retryWaitingMillisecondsCur.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { value: progressParent.root_get(), done: false }.
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
    retryWaitingMillisecondsExponentMax,
    retryWaitingMillisecondsInterval,
  ) {

    let progressRoot = progressParent.root_get();
    let progressFetcher = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) );

    try {
      // 1. Compose URL and download it as JSONP.
      let url = this.getUrl_forJSON();

      let responseText;
      {
        let httpFetcher = new HttpFetcher( this.bLogFetcherEventToConsole );
        let httpResulter = httpFetcher
          .asyncGenerator_by_progressParent_url_timeout_retry_responseType_method_body(
            progressFetcher, url,

            loadingMillisecondsMax,
            loadingMillisecondsInterval,
        
            retryTimesMax,
            retryWaitingMillisecondsExponentMax,
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

      // 2. Google Visualization Table Query returns JSONP (not JSON).
      //    Try to evaluate it as JSON.
      let json = GVizTQ_UrlComposer.evalJSONP( responseText );

      progressToAdvance.value_advance();
      yield progressRoot;

      if ( !json )
        return null;

      // 3. Collect into column-major array.
      let ColumnMajorArrayArray
        = GVizTQ_UrlComposer.dataTable_to_ColumnMajorArrayArray( json.table );

      progressToAdvance.value_advance();
      yield progressRoot;

      return ColumnMajorArrayArray;

    } catch ( e ) {
      return null;
    }
  }

// //!!! (2023/02/14 Remarked) Use XMLHttpRequest instead. (for progress)
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
//    *   Yield a promise resolves to { value: progressParent.root_get(), done: false }.
//    *
//    * @yield {Promise( Array[] )}
//    *   - Yield a promise resolves to { done: true,
//    *       value: ( a two dimension (column-major) array ) } when successfully.
//    *   - Yield a promise resolves to { done: true, value: null } when failed.
//    */
//   async* JSON_ColumnMajorArrayArray_fetch_asyncGenerator( progressParent ) {
//     let progressRoot = progressParent.root_get();
//     let progressToAdvance = progressParent.child_add(
//       ValueMax.Percentage.Concrete.Pool.get_or_create_by( 4 ) );
//
//     try {
//       // 1. Compose URL and download it as JSONP.
//       let url = this.getUrl_forJSON();
//       let response = await fetch( url );
//
//       progressToAdvance.value_advance(); // 25%
//       yield progressRoot;
//
//       if ( !response.ok )
//         return null;
//
//       // 2. Google Visualization Table Query returns JSONP (not JSON).
//       let text = await response.text();
//
//       progressToAdvance.value_advance(); // 25%
//       yield progressRoot;
//
//       if ( !text )
//         return null;
//
//       // 3. Try to evaluate it as JSON.
//       let json = GVizTQ_UrlComposer.evalJSONP( text );
//
//       progressToAdvance.value_advance(); // 25%
//       yield progressRoot;
//
//       if ( !json )
//         return null;
//
//       // 4. Collect into column-major array.
//       let ColumnMajorArrayArray
//         = GVizTQ_UrlComposer.dataTable_to_ColumnMajorArrayArray( json.table );
//
//       progressToAdvance.value_advance(); // 25%
//       yield progressRoot;
//
//       return ColumnMajorArrayArray;
//
//     } catch ( e ) {
//       return null;
//     }
//   }

  /**
   * @param {string} outputFormat
   *   Specify the data format when downloading the returned url. It should be null or
   * "json" or "csv" or "html". If null, there will be no format specified in the
   * generated url (means default format, usually same as "json").
   *
   * @return {string} The url for downloading the target as specified format.
   */
  getUrl_forFormat( outputFormat ) {
    // Because sheetId could be 0, it should be checked by comparing to null directly
    // (i.e. should not use ( !this.sheetId )).
    let url = `${GVizTQ_UrlComposer.spreadsheetUrlPrefix}/${
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
   * This method will find the position of the first "(" and the last ")". Extract
   * the string between these two positions. Parse it by JSON.parse().
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
   * Collects gvizDataTable.rows[ n ].c[ m ].v into a two dimension (column-major)
   * array. The outer array has m inner sub-arrays (corresponding to m columns).
   * Every inner sub-array has n elements (corresponding to n rows).
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
      let rowArray = columnArray[ columnNo ] = new Array( gvizDataTable.rows.length );
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
