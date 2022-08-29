export { DEvolution_Versus as Versus };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import { VersusId } from "../../util/DEvolution_VersusId.js";

/**
 * @member {string} spreadsheetRange
 *   The range description string for downloading this versus data.
 * (e.g. "Evolution!AH57:AK58")
 *
 * @member {DEvolution.VersusId} versusId
 *   The versus id (i.e. EntityNo_ParentGenerationNo_OffspringGenerationNo).
 *
 * @member {Uint8Array} parentChromosome
 *   The parent's chromosome of the entity of the versus.
 *
 * @member {Uint8Array} offspringChromosome
 *   The offspring's chromosome of the entity of the versus.
 *
 * @member {number} winCount
 *   The parent chromosome's winCount of the entity of the versus.
 */
class DEvolution_Versus extends Recyclable.Root {

  /**
   * Used as default DEvolution.Versus provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "DEvolution.Versus.Pool",
    DEvolution_Versus, DEvolution_Versus.setAsConstructor );

  /** */
  constructor() {
    super();
    DEvolution_Versus.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    DEvolution_VersusId.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {

    this.winCount = undefined;
    this.offspringChromosome = undefined;
    this.parentChromosome = undefined;

    if ( this.versusId ) {
      this.versusId.disposeResources_and_recycleToPool();
      this.versusId = null;
    }

    this.spreadsheetRange = undefined;
   
    super.disposeResources();
  }

  /**
   * Load the versus data from specified spreadsheet id.
   *
   * @param {GSheets.UrlComposer} spreadsheetUrlComposer
   *   The source spreadsheet id to be downloaded from. Its range will be set as
   * spreadsheetRange. It will not be released by this method.
   *
   * @param {string} spreadsheetRange
   *   The range description string for downloading this versus data.
   * (e.g. "Evolution!AH57:AK58")
   *
   */
  async loadAsync( spreadsheetUrlComposer, spreadsheetRange ) {
    spreadsheetUrlComposer.range_set( spreadsheetRange );

//!!! ...unfinished... (2022/08/28)
//     const range = ???;
//     this.urlComposer.range_set( range );
//
//     let ???rangeArrayArray
//       = this.urlComposer.fetchAsync_JSON_ColumnMajorArrayArray();

  }

}
