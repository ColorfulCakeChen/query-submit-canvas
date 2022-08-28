export { DEvolution_VersusRangeArray as VersusRangeArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as GSheets from "../util/GSheets.js";
import * as RandTools from "../util/RandTools.js";

/**
 * Differential evolution information downloading range list.
 *
 * @member {string} weightsSpreadsheetId
 *   The Google Sheets spreadsheetId of neural network weights. Every worker will
 * load weights from the spreadsheet to initialize one neural network.
 *
 * @member {string} weightsAPIKey
 *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
 * (Note: api key can not be changed after this object created.)
 *   - If null, Google Visualization Table Query API will be used.
 *   - If not null, Google Sheets API v4 will be used.
 *
 * @member {string[]} evolutionVersusRangeArray
 *   A string array. Every element is the spreadsheet range description string for an
 * evolution versus (i.e. parent versus offspring).
 *
 * @member {number[]} shuffledIndexArray
 *   A number array. Every element is the index into .evolutionVersusRangeArray[]. It
 * is used for visiting .evolutionVersusRangeArray[] randomly.
 */
class DEvolution_VersusRangeArray extends Recyclable.Root {

  /**
   * Used as default DEvolution.VersusRangeArray provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.VersusRangeArray.Pool",
    DEvolution_VersusRangeArray, DEvolution_VersusRangeArray.setAsConstructor );

  /**
   */
  constructor( weightsSpreadsheetId, weightsAPIKey ) {
    super();
    DEvolution_VersusRangeArray.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey
    );
  }

  /** @override */
  static setAsConstructor( weightsSpreadsheetId, weightsAPIKey ) {
    super.setAsConstructor();
    DEvolution_VersusRangeArray.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self( weightsSpreadsheetId, weightsAPIKey ) {
    this.urlComposer = GSheets.UrlComposer.Pool.get_or_create_by(
      weightsSpreadsheetId, undefined, weightsAPIKey ); // range is undefined.
  }

  /** @override */
  disposeResources() {

    if ( this.shuffledIndexArray ) {
      this.shuffledIndexArray.disposeResources_and_recycleToPool();
      this.shuffledIndexArray = null;
    }

    this.evolutionVersusRangeArray = null; // (normal array, just nullifiy it.)

    if ( this.urlComposer ) {
      this.urlComposer.disposeResources_and_recycleToPool();
      this.urlComposer = null;
    }

//!!! ...unfinished... (2022/08/27)

    super.disposeResources();
  }

  set weightsSpreadsheetId( spreadsheetId ) {
    this.urlComposer.spreadsheetId_set( spreadsheetId );
  }

  get weightsSpreadsheetId() {
    return this.urlComposer.spreadsheetId;
  }

  get weightsAPIKey( ) {
    return this.urlComposer.apiKey;
  }

  /** Load all evolution versus weights ranges. */
  async loadAsync() {
    // The summary is at the first column of the first (i.e. left most) sheet.
    const range = "A:A";
    this.urlComposer.range_set( range );

    let evolutionVersusRangeArrayArray
      = this.urlComposer.fetchAsync_JSON_ColumnMajorArrayArray();

    // Only the first column (i.e. column[ 0 ]) has range description string.
    this.evolutionVersusRangeArray = evolutionVersusRangeArrayArray[ 0 ];

//!!! ...unfinished... (2022/08/26) should shuffle the list.
    this.shuffledIndexArray_create();
  }

  /** (according to .evolutionVersusRangeArray[]'s length) */
  shuffledIndexArray_create() {
    if ( !this.shuffledIndexArray )
      this.shuffledIndexArray = Recyclable.Array.Pool.get_or_create_by();

    // Ordered indexes
    for ( let i = 0; i < this.shuffledIndexArray.length; ++i ) {
      this.shuffledIndexArray[ i ] = i;
    }

    // Shuffled indexes
    RandTools.shuffle_Array( this.shuffledIndexArray );
  }

}
