export { DEvolution_Versus as Versus };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NumberTools from "../../util/NumberTools.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as Float12 from "../../Unpacker/Float12.js";
import { VersusId } from "./DEvolution_VersusId.js";

/**
 * @member {string} spreadsheetRange
 *   The range description string for downloading this versus data.
 * (e.g. "Evolution!AH57:AK58")
 *
 * @member {DEvolution.VersusId} versusId
 *   The versus id (i.e. EntityNo_ParentGenerationNo_OffspringGenerationNo).
 *
 * @member {Float32Array} parentChromosomeFloat32Array
 *   The parent's chromosome of the entity of the versus.
 *
 * @member {Float32Array} offspringChromosomeFloat32Array
 *   The offspring's chromosome of the entity of the versus.
 *
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

    this.offspringChromosomeFloat32Array = undefined;
    this.parentChromosomeFloat32Array = undefined;

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
   *       The .versusId, .parentChromosome, and .offspringChromosome of
   *       this will be set.
   *   - Yield a promise resolves to { value: false, done: true } when failed.
   */
  async* loader_async( progressParent,
    spreadsheetUrlComposer, spreadsheetRange, textEncoder ) {

    // 0.1
    this.parentChromosome = undefined;
    this.offspringChromosome = undefined;

    // 0.2 Prepare progress.
    let progressRoot = progressParent.root_get();

    let progressForDownload = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) ); // versusId
  
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
        = spreadsheetUrlComposer.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
            progressForDownload );

      versusArrayArray = yield* fetcherVersus;
      if ( !versusArrayArray )
        return false; // Download failure.
    }

    // 2. decode.
    const COLUMN_ID_versusId = 0;
    const COLUMN_ID_parentChromosome = 1;
    const COLUMN_ID_offspringChromosome = 2;

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

    // 2.2 parent chromosome
    {
      let parentChromosomeArray = versusArrayArray[ COLUMN_ID_parentChromosome ];
      let parentChromosomeDecoder
        = Float12.generator_from_Base64Char_StringOrStringArray_to_Float32Array(
            progressForParentChromosome,
            parentChromosomeArray, textEncoder,
            Base64_skipLineCount, Base64_suspendByteCount
           );
      this.parentChromosomeFloat32Array = yield* parentChromosomeDecoder;
    }

    // 2.3 offspring chromosome
    {
      let offspringChromosomeArray = versusArrayArray[ COLUMN_ID_offspringChromosome ];
      let offspringChromosomeDecoder
        = Float12.generator_from_Base64Char_StringOrStringArray_to_Float32Array(
            progressForOffspringChromosome,
            offspringChromosomeArray, textEncoder,
            Base64_skipLineCount, Base64_suspendByteCount
          );
      this.offspringChromosomeFloat32Array = yield* offspringChromosomeDecoder;
    }

    return true;
  }

  /**
   * Load this object by calling loader() and advance the generator by loop
   * until done.
   *
   * @return {Promise( boolean )}
   *   Return a promise.
   *   - It will resolve to true, if succeed. The .versusId, .parentChromosome,
   *       and .offspringChromosome of this will be set.
   *   - It will resolve to false, if failed.
   */
  async load_async(
    spreadsheetUrlComposer, spreadsheetRange, textEncoder ) {

    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    try {
      let loader_async = this.loader_async( progress,
        spreadsheetUrlComposer, spreadsheetRange, textEncoder);

      let bLoadOk;
      let loaderNext;
      do {
        loaderNext = await loader_async.next();
        if ( loaderNext.done == false ) {
          //let progressRoot = loaderNext.value;
        } else { // ( loaderNext.done == true )
          bLoadOk = loaderNext.value;
        }
      } while ( loaderNext.done == false );

    } catch ( e ) {
      console.error( e );
      return false;

    } finally {
      if ( progress ) {
        progress.disposeResources_and_recycleToPool();
        progress = null;
      }
    }

    return bLoadOk;
 }

}
