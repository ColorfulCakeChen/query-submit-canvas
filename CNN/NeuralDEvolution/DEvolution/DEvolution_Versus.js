export { DEvolution_Versus as Versus };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as Float12 from "../../Unpacker/Float12.js";
import * as HttpRequest from "../../util/HttpRequest.js";
import * as NumberTools from "../../util/NumberTools.js";
import * as ValueMax from "../../util/ValueMax.js";
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
   * An async generator for loading the differential evolution versus weights
   * from specified spreadsheet range.
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
   * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
   *   The parameters for loading timeout and retry waiting time. It will be kept
   * but not modified by this object.
   *
   * @param {TextEncoder} textEncoder
   *   For converting text string to Uint8Array.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( boolean )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: true }, if succeeded.
   *       The .versusId, .parentChromosome, and .offspringChromosome of
   *       this will be set.
   *   - Resolved to { done: true, value: false }, if failed.
   */
  async* load_asyncGenerator( progressParent,
    spreadsheetUrlComposer, spreadsheetRange,
    params_loading_retryWaiting,
    textEncoder ) {

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
      spreadsheetUrlComposer.range = spreadsheetRange;

      let fetcherVersus
        = spreadsheetUrlComposer.JSON_ColumnMajorArrayArray_fetch_asyncGenerator(
            progressForDownload, params_loading_retryWaiting );

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
      // 2.1.0 Clear old information.
      if ( this.versusId ) {
        this.versusId.measurementId = undefined;
        this.versusId.apiSecret = undefined;
      }

      // 2.1.1 The 1st row of the first column should be the versusId string.
      let versusIdString = versusArrayArray?.[ COLUMN_ID_versusId ]?.[ 0 ];
      if ( !versusIdString )
        return false; // versusIdString is empty.

      if ( this.versusId )
        this.versusId.set_byVersusIdString( versusIdString );
      else
        this.versusId = VersusId.Pool.get_or_create_by( versusIdString );

      if ( !this.versusId.isValid() )
        return false; // versusId is illegal.

      // 2.1.2 The 2nd row of the first column should be the GA4 measurement id.
      let measurementIdString = versusArrayArray?.[ COLUMN_ID_versusId ]?.[ 1 ];
      this.versusId.measurementId = measurementIdString; // may be undefined.

      // 2.1.3 The 3rd row of the first column should be the GA4 measurement api secret.
      let apiSecretString = versusArrayArray?.[ COLUMN_ID_versusId ]?.[ 2 ];
      this.versusId.apiSecret = apiSecretString; // may be undefined.

      progressToAdvance.value_advance();
      yield progressRoot;
    }

    // 2.2 parent chromosome
    {
      let parentChromosomeArray
        = versusArrayArray?.[ COLUMN_ID_parentChromosome ];
      if ( !parentChromosomeArray )
        return false; // parent chromosome array is undefined.

      let parentChromosomeDecoder = Float12.Decoder
        .generator_from_Base64Char_StringOrStringArray_to_Float32Array(
          progressForParentChromosome,
          parentChromosomeArray, textEncoder,
          Base64_skipLineCount, Base64_suspendByteCount
        );
      this.parentChromosomeFloat32Array = yield* parentChromosomeDecoder;
    }

    // 2.3 offspring chromosome
    {
      let offspringChromosomeArray
        = versusArrayArray?.[ COLUMN_ID_offspringChromosome ];
      if ( !offspringChromosomeArray )
        return false; // offspring chromosome array is undefined.

      let offspringChromosomeDecoder = Float12.Decoder
        .generator_from_Base64Char_StringOrStringArray_to_Float32Array(
          progressForOffspringChromosome,
          offspringChromosomeArray, textEncoder,
          Base64_skipLineCount, Base64_suspendByteCount
        );
      this.offspringChromosomeFloat32Array = yield* offspringChromosomeDecoder;
    }

    return true;
  }

  /**
   * Load this object by calling load_asyncGenerator() and advance the generator
   * by loop until done.
   *
   * @return {Promise( boolean )}
   *   Return a promise.
   *   - Resolved to true, if succeeded. The .versusId, .parentChromosome,
   *       and .offspringChromosome of this will be set.
   *   - Resolved to false, if failed.
   */
  async load_async(
    spreadsheetUrlComposer, spreadsheetRange,
    params_loading_retryWaiting,
    textEncoder ) {

    let progress = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();

    try {
      let loader_async = this.load_asyncGenerator( progress,
        spreadsheetUrlComposer, spreadsheetRange,
        params_loading_retryWaiting, textEncoder );

      let loaderNext;
      do {
        loaderNext = await loader_async.next();
      } while ( loaderNext.done == false );

      let bLoadOk = loaderNext.value;
      return bLoadOk;

    } catch ( e ) {
      //console.error( e );
      throw e; // Unknown error, should be said loundly.

    } finally {
      if ( progress ) {
        progress.disposeResources_and_recycleToPool();
        progress = null;
      }
    }
  }

}
