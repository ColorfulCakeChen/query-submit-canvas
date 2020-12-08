export { UrlComposer };

/**
 * Compose a URL for downloading cells data (as .CSV format) from a Google Sheets by using Google Visualzation Table Query API.
 * The target spreadsheet should be shared by either "Public on the web" or "Anyone with the link".
 *
 * (GVizTQ = Google Visualzation Table Query)
 *
 * The follwoings are some composed examples:
 *
 * @example
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?range=AH59:AJ98&tqx=out:csv
 *
 * @example
 * https://docs.google.com/spreadsheets/d/18YyEoy-OfSkODfw8wqBRApSrRnBTZpjRpRiwIKy8a0M/gviz/tq?gid=816353147&range=AH59:AK98&headers=0&tqx=out:csv
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
class UrlComposer {

  /**
   * If sheetId is null, sheetName is null, and no sheet name in the range's A1 notation, the first (most left) visible sheet
   * inside the spreadsheet will be used.
   *
   * @param {string} spreadsheetId
   *   The component after the "https://docs.google.com/spreadsheets/d/".
   *
   * @param {string} range
   *   The cells' A1 notation of the cells. It describes the (name and) range of the sheet inside the spreadsheet.
   *   - "A1" refers to one cell of the first (most left) visible sheet.
   *   - "B2:C5" refers to cells of a rectangle of the first (most left) visible sheet.
   *   - "Books!D8:D" refers to the column D of sheet named "Books" from rows 8 to the last rows.
   *   - "'Name has space'!7:10" refers to the rows 7 to 10 of sheet named "Name has space".
   *
   * @param {number} headers
   *   The component after the "headers=". It means how many header rows. It should be an zero or positive integer.
   *
   * @param {number} sheetId
   *   The component after the "gid=". If the sheetName is used (or the sheet name in the range's A1 notation is specified),
   * keep this sheetId null (or undefined).
   *
   * @param {string} sheetName
   *   The component after the "sheet=". If the sheetId is used (or the sheet name in in the range's A1 notation is specified),
   * keep this sheetName null (or undefined).
   *
   * @see {@link https://developers.google.com/sheets/api/guides/concepts}
   * @see {@link https://developers.google.com/chart/interactive/docs/dev/implementing_data_source}
   * @see {@link https://developers.google.com/chart/interactive/docs/spreadsheets}
   * @see {@link https://developers.google.com/chart/interactive/docs/querylanguage}
   */
  constructor( spreadsheetId, range, headers = 0, sheetId = null, sheetName = null ) {
    this.spreadsheetId = spreadsheetId;
    this.range = range;
    this.headers = headers;
    this.sheetId = sheetId;
    this.sheetName = sheetName;
  }

  getCsvUrl() {
    // Because sheetId could be 0, it should be checked by comparing to null directly (i.e. should no use ( !this.sheetId )).
    let url = `${URLComposer.spreadsheetUrlPrefix}/${this.spreadsheetId}/${URLComposer.GoogleVisualizationTableQueryUrlPostfix}?&tqx=out:csv${
      ( this.sheetId != null ) ? `&gid=${this.sheetId}` : `${
      ( this.sheetName != null ) ? `&sheet=${this.sheetName}` : "" }` }${
      ( this.range != null ) ? `&range=${this.range}` : "" }&headers=${this.headers}`;

    return url;
  }
}

/** The url prefix of Google Sheets. */
URLComposer.spreadsheetUrlPrefix = "https://docs.google.com/spreadsheets/d";

/** The url postfix of Google Visualization Table Query. */
URLComposer.GoogleVisualizationTableQueryUrlPostfix = "gviz/tq";
