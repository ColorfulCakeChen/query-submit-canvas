export { DEvolution_Versus as Versus };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NumberTools from "../../util/NumberTools.js";
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
   *   The source spreadsheet id to be downloaded from. Its spreadsheetId (and apiKey if
   * necessary) should have been setup correctly. Its range will be set as
   * spreadsheetRange. It will not be released by this method.
   *
   * @param {string} spreadsheetRange
   *   The range description string for downloading this versus data.
   * (e.g. "Evolution!AH57:AK58")
   *
   * @return {Promise}
   *   Return a promise. It will resolve to true, if succeed. It will resolve to false,
   * if failed.
   */
  async loadAsync( spreadsheetUrlComposer, spreadsheetRange ) {

    // 0. download from remote.
    let versusArrayArray;
    {
      this.spreadsheetRange = spreadsheetRange;
      spreadsheetUrlComposer.range_set( spreadsheetRange );

      versusArrayArray = this.urlComposer.fetchAsync_JSON_ColumnMajorArrayArray();
      if ( !versusArrayArray )
        return false; // Download failure.
    }

    const COLUMN_ID_versusId = 0;
    const COLUMN_ID_parentChromosome = 1;
    const COLUMN_ID_offspringChromosome = 2;
    const COLUMN_ID_winCount = 3;

    // 1. versusId
    {
      // The first row of the first column should be the versusId string.
      let versusIdString = versusArrayArray[ COLUMN_ID_versusId ][ 0 ];
      if ( this.versusId )
        this.versusId.set_byVersusIdString( versusIdString );
      else
        this.versusId = VersusId.Pool.get_or_create_by( versusIdString );

      if ( !this.versusId.isValid() )
        return false; // versusId is illegal.
    }

//!!! ...unfinished... (2022/08/29)
    // 2. decode parent chromosome
    {
      this.parentChromosome
    }

    // 3. decode offspring chromosome
    offspringChromosome

    // 4. decode parent chromosome's winCount
    {
      // Every row of the column should have the same winCount string. Just take first one.
      let winCountString = versusArrayArray[ COLUMN_ID_winCount ][ 0 ];
      this.winCount = Number.parseInt( this.winCountString, 10 );
      if ( !NumberTools.isInteger( this.winCount ) )
        return false;

      
    }


    return true;
  }

}
