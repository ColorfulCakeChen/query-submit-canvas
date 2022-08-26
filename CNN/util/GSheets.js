export { GSheets_UrlComposer as UrlComposer };

import * as Pool from "./Pool.js";
import * as Recyclable from "./Recyclable.js";
import * as GVizTQ from "./GSheet/GVizTQ.js";
import * as GSheetsAPIv4 from "./GSheet/GSheetsAPIv4.js";
import * as ValueMax from "./ValueMax.js";

/**
 * Fetch data from Google Sheets.
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
      this.urlComposer = SheetsAPIv4.UrlComposer.Pool.get_or_create_by(
        spreadsheetId, range, apiKey );
    } else {
      this.urlComposer = GVizTQ.UrlComposer.Pool.get_or_create_by(
        spreadsheetId, range );
    }
  }

  /** @override */
  disposeResources() {
    if ( this.urlComposer ) {
      this.urlComposer.disposeResources_and_recycleToPool();
      this.urlComposer = null;
    }
    super.disposeResources();
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
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.root_get() ) when ( done = false ).
   *
   * @yield {Array[]}
   *   - Yield ( value = a two dimension (column-major) array ) when ( done = true )
   *       successfully.
   *   - Yield ( value = null ) when ( done = true ) failed.
   */
  async* fetcher_JSON_ColumnMajorArrayArray( progressParent ) {
    let fetcher = this.urlComposer.fetcher_JSON_ColumnMajorArrayArray( progressParent );
    let ColumnMajorArrayArray = yield *fetcher;
    return ColumnMajorArrayArray;
  }

  /**
   * Composing the URL (according this object's data members), download
   * it as JSON format, extract data as a two dimension (column-major) array.
   *
   * @return {Array[]}
   *   - Return ( a two dimension (column-major) array ) when successful.
   *   - Return ( null ) when failed.
   */
  async fetchAsync_JSON_ColumnMajorArrayArray() {
    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    let resultColumnMajorArrayArray;

    let fetcher = this.fetcher_JSON_ColumnMajorArrayArray( progress );
    let fetcherNext;
    do {
      fetcherNext = fetcher.next();
      if ( fetcherNext.done == false ) {
        //let progressRoot = await fetcherNext.value;
      } else { // ( fetcherNext.done == true )
        resultColumnMajorArrayArray = await fetcherNext.value;
      }
    } while ( fetcherNext.done == false );

    progress.disposeResources_and_recycleToPool();
    progress = null;

    return resultColumnMajorArrayArray;
  }

}
