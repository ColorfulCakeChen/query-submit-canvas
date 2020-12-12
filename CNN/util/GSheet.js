import * as GVizTQ from "./GSheet/GVizTQ.js";
import * as GSheetsAPIv4 from "./GSheet/GSheetsAPIv4.js";

export { Url };

/**
 * 
 */
class Url {

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
   * @param {string} APIKey
   *   The API key string for accessing the spreadsheet. If not null, Google Sheets API v4 will be used. If null, Google
   * Visualization Table Query API will be used.
   *
   * @see {@link https://developers.google.com/sheets/api/guides/concepts}
   */
  constructor( spreadsheetId, range, APIKey ) {
    if ( APIKey ) {
      this.urlComposer = new GSheetsAPIv4.UrlComposer( spreadsheetId, range, APIKey );
    } else {
      this.urlComposer = new GVizTQ.UrlComposer( spreadsheetId, range );
    }
  }

  /**
   * Compose the URL (according this object's data members), download it as JSON format, extract data as a two dimension (column-major) array.
   *
   * @return {array[]}
   *   Return a two dimension (column-major) array. Return null if failed.
   */
  async fetch_JSON_ColumnMajorArray() {
    return this.urlComposer.fetch_JSON_ColumnMajorArray();
  }

}
