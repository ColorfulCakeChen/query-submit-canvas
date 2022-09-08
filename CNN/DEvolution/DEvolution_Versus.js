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
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { value: progressParent.root_get(), done: false }.
   *
   * @yield {Promise( boolean )}
   *   - Yield a promise resolves to { value: true, done: true } when successfully.
   *       The .versusId, .parentChromosome, .offspringChromosome and .winCount will
   *       be set.
   *   - Yield a promise resolves to { value: false, done: true } when failed.
   */
  async* asyncLoader( progressParent,
    spreadsheetUrlComposer, spreadsheetRange, textEncoder ) {

    // 0.1
    this.parentChromosome = undefined;
    this.offspringChromosome = undefined;
    this.winCount = undefined;

    // 0.2 Prepare progress.
    let progressRoot = progressParent.root_get();

    let progressForDownload = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) ); // versusId and winCount
  
    let progressForParentChromosome = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressForOffspringChromosome = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
  
    // 1. download from remote.
    let versusArrayArray;
    {
      this.spreadsheetRange = spreadsheetRange;
      spreadsheetUrlComposer.range_set( spreadsheetRange );

      let fetcherVersus
        = this.urlComposer.fetcher_JSON_ColumnMajorArrayArray( progressForDownload );
      versusArrayArray = yield* fetcherVersus;
      if ( !versusArrayArray )
        return false; // Download failure.
    }

    // 2. decode.
    const COLUMN_ID_versusId = 0;
    const COLUMN_ID_parentChromosome = 1;
    const COLUMN_ID_offspringChromosome = 2;
    const COLUMN_ID_winCount = 3;

    const Base64_skipLineCount = 0;
    const Base64_suspendByteCount = 1024 * 1024;

    // 2.1 versusId
    {
      // The first row of the first column should be the versusId string.
      let versusIdString = versusArrayArray[ COLUMN_ID_versusId ][ 0 ];
      if ( this.versusId )
        this.versusId.set_byVersusIdString( versusIdString );
      else
        this.versusId = VersusId.Pool.get_or_create_by( versusIdString );

      if ( !this.versusId.isValid() )
        return false; // versusId is illegal.

      progressToAdvance.value_advance();
      yield progressRoot;
    }

//!!! ...unfinished... (2022/09/08)
    // 2.2 parent chromosome
    {
      let parentChromosomeArray = versusArrayArray[ COLUMN_ID_parentChromosome ];
      let parentChromosomeDecoder = Base64ToUint8Array.decoder_fromStringOrStringArray(
        progressForParentChromosome,
        parentChromosomeArray, textEncoder,
        Base64_skipLineCount, Base64_suspendByteCount
      );

      let decoderNext;
      do {
        decoderNext = decoder.next();
      } 
      this.parentChromosome
    }

    // 2.3 offspring chromosome
    offspringChromosome

    // 2.4 parent chromosome's winCount
    {
      // Every row of the column should have the same winCount string. Just take first one.
      let winCountString = versusArrayArray[ COLUMN_ID_winCount ][ 0 ];
      this.winCount = Number.parseInt( this.winCountString, 10 );
      if ( !NumberTools.isInteger( this.winCount ) )
        return false;

      progressToAdvance.value_advance();
      yield progressRoot;
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
