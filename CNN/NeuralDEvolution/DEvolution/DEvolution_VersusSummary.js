export { DEvolution_VersusSummary as VersusSummary };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as GSheets from "../../util/GSheets.js";
import * as RandTools from "../../util/RandTools.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import * as NeuralWorker from "../NeuralWorker.js";

/**
 * Differential evolution summary information by downloading range list.
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

//    this.neuralWorker = NeuralWorker.Pool.get_or_create_by(
  }

  /** @override */
  disposeResources() {

    this.visitCount = undefined;

    if ( this.visitIndexArray ) {
      this.visitIndexArray.disposeResources_and_recycleToPool();
      this.visitIndexArray = null;
    }

    this.rangeArray = null; // (normal array, just nullifiy it.)

    if ( this.urlComposer ) {
      this.urlComposer.disposeResources_and_recycleToPool();
      this.urlComposer = null;
    }

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
  async rangeArray_load_async() {
    // The summary is at the first column of the first (i.e. left most) sheet.
    const range = "A:A";
    this.urlComposer.range_set( range );

    let rangeArrayArray = await this.urlComposer.JSON_ColumnMajorArrayArray_fetch_async();

    // Only the first column (i.e. column[ 0 ]) has range description string.
    this.rangeArray = rangeArrayArray[ 0 ];

    this.visitIndexArray_prepare();
  }

  /**
   * Prepare a random visiting list (according to .rangeArray[]'s length).
   * The .visitCount will be reset to zero.
   */
  visitIndexArray_prepare() {
    if ( !this.visitIndexArray )
      this.visitIndexArray = Recyclable.Array.Pool.get_or_create_by();

    // Ordered indexes
    if ( this.visitIndexArray.length != this.rangeArray.length ) {
      this.visitIndexArray.length = this.rangeArray.length;
      for ( let i = 0; i < this.visitIndexArray.length; ++i ) {
        this.visitIndexArray[ i ] = i;
      }
    }

    // Shuffled indexes
    RandTools.shuffle_Array( this.visitIndexArray );
    this.visitCount = 0; // Reset to zero after (re-)shuffled.
  }

  /**
   * Load the next versus data.
   */
  async versus_next_load_async() {

    // If all versus data are visited, re-prepare a new random visiting list.
    if ( this.visitCount >= this.visitIndexArray.length ) {
      this.visitIndexArray_prepare();
    }

//!!! ...unfinished... (2022/08/28)
//     const range = ???;
//     this.urlComposer.range_set( range );
//
//     let ???rangeArrayArray
//       = this.urlComposer.JSON_ColumnMajorArrayArray_fetch_async();
  }

}
