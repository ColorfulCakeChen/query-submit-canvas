export { DEvolution_Versus as Versus };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NumberTools from "../../util/NumberTools.js";
import * as ValueMax from "../util/ValueMax.js";
import * as Base64ToUint8Array from "../Unpacker/Base64ToUint8Array.js";
import { VersusId } from "./DEvolution_VersusId.js";

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
   * Load the versus data from specified spreadsheet range.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
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
   * @param {TextEncoder} textEncoder
   *   For converting text string to Uint8Array.
   *
   * @yield {ValueMax.Percentage.Aggregate}
   *   Yield ( value = progressParent.root_get() ) when ( done = false ).
   *
   * @yield {boolean}
   *   Yield ( value = true ) when ( done = true ) successfully.
   *   Yield ( value = false ) when ( done = true ) failed.
   *
   * @return {Promise}
   *   Return a promise.
   *   - It will resolve to true, if succeed. The .versusId, .parentChromosome,
   *       .offspringChromosome and .winCount will be set.
   *   - It will resolve to false, if failed.
   */
  async * asyncLoader( progressParent,
    spreadsheetUrlComposer, spreadsheetRange, textEncoder ) {

    // 0.1
    this.parentChromosome = undefined;
    this.offspringChromosome = undefined;
    this.winCount = undefined;

    // 0.2 download from remote.
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

//!!! ...unfinished... (2022/09/08)
    const skipLineCount = 0;
    let progressParent = 
  suspendByteCount

    // 2. decode parent chromosome
    {
      let parentChromosomeArray = versusArrayArray[ COLUMN_ID_parentChromosome ];
      let decoder = Base64ToUint8Array.decoder_FromStringOrStringArray(
        parentChromosomeArray,
        textEncoder, skipLineCount,
        progressParent,
        suspendByteCount
      );

      let decoderNext;
      do {
        decoderNext = decoder.next();
      } 
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

  /**
   * Load this object by calling asyncLoader() and advance the generator by loop
   * until done.
   *
   * @return {Promise}
   *   Return a promise.
   *   - It will resolve to true, if succeed. The .versusId, .parentChromosome,
   *       .offspringChromosome and .winCount will be set. (and
   *       progressParent.valuePercentage will be equal to 100).
   *   - It will resolve to false, if failed. (and progressParent.valuePercentage
   *       will be less than 100).
   */
  async asyncLoad( progressParent,
    spreadsheetUrlComposer, spreadsheetRange, textEncoder ) {

    let loader = this.asyncLoader( progressParent,
      spreadsheetUrlComposer, spreadsheetRange, textEncoder);

    let loaderNext;
    do {
      loaderNext = loader.next();
    } while ( !loaderNext.done ); // When ( false == loaderNext.done ), the ( loaderNext.value ) will be progressParent.root_get().

    let bLoadOk??? = loaderNext.value; // When ( true == loaderNext.done ), the ( loaderNext.value ) will be a Promise.
    return bInitOk;

!!!

 }

}
