export { UrlComposer };

import * as ValueMax from "../../ValueMax.js";

/**
 * Compose a URL for downloading cells data (as JSON) from a Google Sheets by using Google Sheets API v4.
 * The target spreadsheet should be shared by either "Public on the web" or "Anyone with the link".
 *
 *
 * The follwoings are some composed examples:
 *
 * @example
 * https://sheets.googleapis.com/v4/spreadsheets/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/values/A:A?key=AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU
 * https://sheets.googleapis.com/v4/spreadsheets/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/values/A:A?majorDimension=COLUMNS&key=AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU
 * https://sheets.googleapis.com/v4/spreadsheets/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/values/Evolution.Param!A:B?key=AIzaSyDQpdX3Z7297fkZ7M_jWdq7zjv_IIxpArU
 *
 */
class UrlComposer {

  /**
   * If no sheet name in the range's A1 notation, the first (most left) visible sheet inside the spreadsheet will be used.
   *
   * @param {string} spreadsheetId
   *   The identifier (the component after the "https://docs.google.com/spreadsheets/d/") of the spreadsheet to be accessed.
   *
   * @param {string} range
   *   The cells' A1 notation of the cells. It describes the (name and) range of the sheet inside the spreadsheet.
   *   - "A1" refers to one cell of the first (most left) visible sheet.
   *   - "B2:C5" refers to cells of a rectangle of the first (most left) visible sheet.
   *   - "Books!D8:D" refers to the column D of sheet named "Books" from rows 8 to the last rows.
   *   - "'Name has space'!7:10" refers to the rows 7 to 10 of sheet named "Name has space".
   *
   * @param {string} apiKey
   *   The API key string for accessing the spreadsheet.
   *
   * @see {@link https://developers.google.com/sheets/api/guides/concepts}
   * @see {@link https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get}
   * @see {@link https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values}
   */
  constructor( spreadsheetId, range, apiKey ) {
    this.spreadsheetId = spreadsheetId;
    this.range = range;
    this.apiKey = apiKey;
  }

  /**
   * Generator for composing the URL (according this object's data members), downloading it as JSON format, extracting
   * data as a two dimension (column-major) array.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The created progressToAdvance will be
   * increased when every time advanced. The progressParent.getRoot() will be returned when every time yield.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.getRoot() ) when ( done = false ).
   *
   * @yield {array[]}
   *   Yield ( value = a two dimension (column-major) array ) when ( done = true ) successfully.
   *   Yield ( value = null ) when ( done = true ) failed.
   */
  async* fetcher_JSON_ColumnMajorArray( progressParent ) {
    let progressRoot = progressParent.getRoot();
    let progressToAdvance = progressParent.addChild(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 3 ) );

    try {
      // 1. Compose URL and download it as column-major JSON.
      let url = this.getUrl_forJSON( "COLUMNS" );
      let response = await fetch( url );

      progressToAdvance.value_advance(); // 33%
      yield progressRoot;

      if ( !response.ok )
        return null;

      // 2. Google Sheets API v4 returns JSON.
      let json = await response.json();

      progressToAdvance.value_advance(); // 33%
      yield progressRoot;

      if ( !json )
        return null;

      // 3. Since already downloaded as column major. Uses it directly.
      let columnMajorArray = json.values;

      progressToAdvance.value_advance(); // 33%
      yield progressRoot;

      return columnMajorArray;

    } catch ( e ) {
      return null;
    }
  }

  /**
   * @param {string} majorDimension
   *   The major dimension of the arrangement for the downloaded json data. It could be "ROWS" or "COLUMNS". If null, the same as "ROWS".
   *
   * @return {string} The url for downloading the target as json format.
   */
  getUrl_forJSON( majorDimension = null ) {
    let url = `${UrlComposer.spreadsheetUrlPrefix}/${encodeURIComponent(this.spreadsheetId)}/values/${
      encodeURIComponent(this.range)}?${
      ( majorDimension != null ) ? `majorDimension=${encodeURIComponent(majorDimension)}&` : "" }key=${encodeURIComponent(this.apiKey)}`
      ;

    return url;
  }

}

/** The url prefix of Google Sheets API v4. */
UrlComposer.spreadsheetUrlPrefix = "https://sheets.googleapis.com/v4/spreadsheets";
