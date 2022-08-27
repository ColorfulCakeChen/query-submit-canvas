export { DEvolution_VersusRangeArray as VersusRangeArray };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as GSheets from "../util/GSheets.js";

/**
 * Differential evolution information downloading range list.
 *
 * @member {string} weightsSpreadsheetId
 *   The Google Sheets spreadsheetId of neural network weights. Every worker will
 * load weights from the spreadsheet to initialize one neural network.
 *
 * @member {string} weightsAPIKey
 *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
 *   - If null, Google Visualization Table Query API will be used.
 *   - If not null, Google Sheets API v4 will be used.
 *
 * @member {string[]} evolutionVersusRangeArray
 *   A string array. Every element is the spreadsheet range description string for an
 * evolution versus (i.e. parent versus offspring).
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
    this.weightsSpreadsheetId = weightsSpreadsheetId;
    this.weightsAPIKey = weightsAPIKey;
  }

  /** @override */
  disposeResources() {
    this.weightsAPIKey = undefined;
    this.weightsSpreadsheetId = undefined;

//!!! ...unfinished... (2022/08/27)

    super.disposeResources();
  }


  /** Load all evolution versus weights ranges. */
  async loadAsync() {
    // The summary is at the first column of the first (i.e. left most) sheet.
    const range = "A:A";

    let urlComposer = GSheets.UrlComposer.Pool.get_or_create_by(
      this.weightsSpreadsheetId, range, this.weightsAPIKey );

    let evolutionVersusRangeArrayArray
      = urlComposer.fetchAsync_JSON_ColumnMajorArrayArray();

    // Only the first column (i.e. column[ 0 ]) has range description string.
    this.evolutionVersusRangeArray = evolutionVersusRangeArrayArray[ 0 ];

    urlComposer.disposeResources_and_recycleToPool();
    urlComposer = null;

//!!! ...unfinished... (2022/08/26) should shuffle the list.

  }

}
