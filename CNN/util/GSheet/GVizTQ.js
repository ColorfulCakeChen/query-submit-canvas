export { GVizTQ_UrlComposer as UrlComposer };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import * as HttpRequest from "../HttpRequest.js";
import * as ValueMax from "../ValueMax.js";

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
 *
 * @member {string} spreadsheetUrlPrefix
 *   Usually, it is GVizTQ_UrlComposer.spreadsheetUrlPrefix. But it may be
 * modified (e.g. for testing ProgressEvent error).
 *
 * @member {boolean} bLogFetcherEventToConsole
 *   If true, some debug messages of HttpRequest.Fetcher will be logged to console.
 *
 * @member {HttpRequest.Fetcher} httpRequestFetcher
 *   The current (or last) fetcher of the http request. It could be used to
 * call .abort().
 *
 * @member {boolean} bAbort
 *   If true, it means .abort() is called.
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
    spreadsheetId, range,
    headers = 0, responseHandler = null, sheetId = null, sheetName = null
  ) {
    super();
    GVizTQ_UrlComposer.setAsConstructor_self.call( this,
      spreadsheetId, range,
      headers, responseHandler, sheetId, sheetName
    );
  }

  /** @override */
  static setAsConstructor(
    spreadsheetId, range,
    headers = 0, responseHandler = null, sheetId = null, sheetName = null
  ) {
    super.setAsConstructor();
    GVizTQ_UrlComposer.setAsConstructor_self.call( this,
      spreadsheetId, range,
      headers, responseHandler, sheetId, sheetName
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    spreadsheetId, range,
    headers, responseHandler, sheetId, sheetName
  ) {
    this.spreadsheetUrlPrefix = GVizTQ_UrlComposer.spreadsheetUrlPrefix;
    this.bLogFetcherEventToConsole = false;
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
      // 1. Compose URL and download it as JSONP.
      let url = this.getUrl_forJSON();

      let responseText;
      {
        // (Record in this so that its .abort() could be called by outside caller.)
        httpRequestFetcher = this.httpRequestFetcher
          = new HttpRequest.Fetcher( this.bLogFetcherEventToConsole );

        let httpResulter = httpRequestFetcher
          .url_fetch_asyncGenerator(
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

  /**
   * @return {boolean} Return true, if .httpRequestFetcher now is during retry waiting.
   */
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
    let url = `${this.spreadsheetUrlPrefix}/${
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
