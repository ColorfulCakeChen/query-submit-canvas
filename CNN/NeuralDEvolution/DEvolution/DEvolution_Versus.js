export { DEvolution_Versus as Versus };

import * as HttpRequest from "../../util/HttpRequest.js";
import * as NonReentrant from "../../util/NonReentrant.js";
import * as NumberTools from "../../util/NumberTools.js";
import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
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
 * @member {number} loadTimestampMilliseconds
 *   The time (Date.now()) when this versus is loaded completely.
 *
 *
 * @member {Function} load_asyncPromise_create
 *   A method for creating .load_asyncGenerator() and looping until done.
 *   - It accepts almost the same parameters as .load_asyncGenerator_create()
 *       except without the 1st parameter progressParent (which is replaced by
 *       .load_asyncPromise_progress).
 *   - It returns a promise resolved to .value of { done: true, value } of
 *       awaited .load_asyncGenerator().next().
 *
 * @member {Function} load_asyncGenerator_create
 *   A method for creating .load_asyncGenerator().
 *     - It accepts the same parameters as .load_asyncGenerator().
 *     - It returns an async generator.
 *
 * @member {boolean} load_asyncPromise_running
 *   If true, a load_asyncPromise is still executing. Please wait it becoming
 * false if wanting to call .load_asyncPromise_create() again.
 *
 * @member {boolean} load_asyncGenerator_running
 *   If true, a load_asyncGenerator is still executing. Please wait it becoming
 * false if wanting to call .load_asyncGenerator_create() again.
 *
 * @member {ValueMax.Percentage.Aggregate} load_asyncPromise_progress
 *   The progress of load_asyncPromise. If
 * ( .load_asyncPromise_progress.valuePercentage == 100 ), the loading has
 * done.
 *   - It is used only if .load_asyncPromise_create() is called.
 *   - It is not used if .load_asyncGenerator_create() is called. In
 *       this case, its progressParent parameter will be used instead.
 *
 * @member {boolean} loadOk
 *   Whether load_asyncGenerator or load_asyncPromise is succeeded.
 */
class DEvolution_Versus extends
  NonReentrant.asyncPromise_by_asyncGenerator(
    "load", relay_load_asyncGenerator,
    null, // Use default load_asyncGenerator_progress object.

  Recyclable.Root ) {

  /**
   * Used as default DEvolution.Versus provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "DEvolution.Versus.Pool",
    DEvolution_Versus, DEvolution_Versus.setAsConstructor );

  /** */
  constructor() {
    super();
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor() {
    super.setAsConstructor();
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {

    this.loadTimestampMilliseconds = undefined;
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
   * Check current time and this versus downloaded time. If the interval is
   * too long, it is considered as expired.
   *
   * @param {number} nowTimeMilliseconds
   *   The current time (in milliseconds). Usually, it is Date.now().
   *
   * @return {boolean}
   *   Return true, if this versus should be considered as expired.
   */
  isExpired_byNowTime( nowTimeMilliseconds ) {

    let deltaTimeMilliseconds
      = nowTimeMilliseconds - this.loadTimestampMilliseconds;

    let bExpired = DEvolution_Versus.isExpired_byDeltaTime.call( this,
      deltaTimeMilliseconds );

    return bExpired;
  }

  /**
   * @param {number} deltaTimeMilliseconds
   *   How long (in milliseconds) has been gone after this versus is loaded.
   *
   * @return {boolean}
   *   Return true, if this versus should be considered as expired.
   */
  static isExpired_byDeltaTime( deltaTimeMilliseconds ) {
    if ( deltaTimeMilliseconds < DEvolution_Versus.expireIntervalMilliseconds )
      return false;
    return true;
  }

  /**
   * An async generator for loading the differential evolution versus weights
   * from specified spreadsheet range.
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent.
   * The created progressToAdvance will be increased when every time advanced.
   * The progressParent.root_get() will be returned when every time yield.
   *
   * @param {GSheets.UrlComposer} spreadsheetUrlComposer
   *   The source spreadsheet id to be downloaded from. Its spreadsheetId (and
   * apiKey if necessary) should have been setup correctly. Its range will be
   * set as spreadsheetRange. It will not be released by this method.
   *
   * @param {string} spreadsheetRange
   *   The range description string for downloading this versus data.
   * (e.g. "Evolution!AH57:AK58")
   *
   * @param {HttpRequest.Params_loading_retryWaiting} params_loading_retryWaiting
   *   The parameters for loading timeout and retry waiting time. It will be
   * kept but not modified by this object.
   *
   * @param {TextEncoder} textEncoder
   *   For converting text string to Uint8Array.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to
   * { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( boolean )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: true }, if succeeded.
   *       The .versusId, .parentChromosomeFloat32Array, and
   *       .offspringChromosomeFloat32Array of this will be set.
   *   - Resolved to { done: true, value: false }, if failed.
   */
  static async* load_asyncGenerator( progressParent,
    spreadsheetUrlComposer, spreadsheetRange,
    params_loading_retryWaiting,
    textEncoder ) {

    // 0.1
    this.parentChromosomeFloat32Array = undefined;
    this.offspringChromosomeFloat32Array = undefined;
    this.loadTimestampMilliseconds = undefined;

    // 0.2 Prepare progress.
    let progressRoot = progressParent.root_get();

    let progressForDownloading = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by( 4 ) );

    // For preventing decoding (which is faster than network downloading)
    // from occupying too large portion of progress, let they all under a
    // single progressDecoding directly.
    //
    // Note: progressForParentChromosome and progressForOffspringChromosome
    //       can not use progressForDecoding directly. They should be children
    //       of progressForDecoding. Otheriwse, progressParent will backtrack.
    let progressForDecoding = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by( 1 ) );

    let progressToAdvance = progressForDecoding.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1, 1 ) ); // versusId

    let progressForParentChromosome = progressForDecoding.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by( 2 ) );

    let progressForOffspringChromosome = progressForDecoding.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by( 2 ) );

    // 1. download from remote.
    let versusArrayArray;
    {
      this.spreadsheetRange = spreadsheetRange;
      spreadsheetUrlComposer.range = spreadsheetRange;

      let fetcherVersus
        = spreadsheetUrlComposer.fetch_asyncGenerator_create(
            progressForDownloading, params_loading_retryWaiting );

      versusArrayArray = yield* fetcherVersus;

      if ( !versusArrayArray ) {
        this.loadOk = false;
        return false; // Download failure.
      }
    }

    // 2. decode.
    const COLUMN_ID_versusId = 0;
    const COLUMN_ID_parentChromosome = 1;
    const COLUMN_ID_offspringChromosome = 2;

    const Base64_skipLineCount = 0;
    const Base64_suspendByteCount = 100 * 1024; //1024 * 1024;

    // 2.1 versusId
    {
      // 2.1.0 Clear old information.
      if ( this.versusId ) {
        this.versusId.measurementId = undefined;
        this.versusId.apiSecret = undefined;
      }

      // 2.1.1 The 1st row of the first column should be the versusId string.
      let versusIdString = versusArrayArray?.[ COLUMN_ID_versusId ]?.[ 0 ];
      if ( !versusIdString ) {
        this.loadOk = false;
        return false; // versusIdString is empty.
      }

      if ( this.versusId )
        this.versusId.set_byVersusIdString( versusIdString );
      else
        this.versusId = VersusId.Pool.get_or_create_by( versusIdString );

      if ( !this.versusId.isValid() ) {
        this.loadOk = false;
        return false; // versusId is illegal.
      }

      // 2.1.2 The 2nd row of the first column should be the GA4 measurement
      //       id.
      let measurementIdString
        = versusArrayArray?.[ COLUMN_ID_versusId ]?.[ 1 ];
      this.versusId.measurementId = measurementIdString; // may be undefined.

      // 2.1.3 The 3rd row of the first column should be the GA4 measurement
      //       api secret.
      let apiSecretString = versusArrayArray?.[ COLUMN_ID_versusId ]?.[ 2 ];
      this.versusId.apiSecret = apiSecretString; // may be undefined.

      progressToAdvance.value_advance();
      yield progressRoot;
    }

    // 2.2 parent chromosome
    {
      let parentChromosomeArray
        = versusArrayArray?.[ COLUMN_ID_parentChromosome ];
      if ( !parentChromosomeArray ) {
        this.loadOk = false;
        return false; // parent chromosome array is undefined.
      }

      let parentChromosomeDecoder = Float12.Decoder
        .Base64Char_StringOrStringArray_to_Float32Array_generator(
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
      if ( !offspringChromosomeArray ) {
        this.loadOk = false;
        return false; // offspring chromosome array is undefined.
      }

      let offspringChromosomeDecoder = Float12.Decoder
        .Base64Char_StringOrStringArray_to_Float32Array_generator(
          progressForOffspringChromosome,
          offspringChromosomeArray, textEncoder,
          Base64_skipLineCount, Base64_suspendByteCount
        );
      this.offspringChromosomeFloat32Array = yield* offspringChromosomeDecoder;
    }

    //3.
    this.loadTimestampMilliseconds = Date.now();
    this.loadOk = true;
    return true;
  }

}

/**
 * Define how long (in milliseconds) a versus (after it is downloaded) should
 * be considered as expired.
 *
 * Because Google Analytics Realtime Report can only collect the last
 * half an hour (30 minutes) or one hour (60 minutes; premium version) events,
 * a versus downloaded one half hours (90 minutes) ago could be considered
 * as expired definitely.
 *
 * Sending result of expired versus to server may confuse server.
 */
DEvolution_Versus.expireIntervalMilliseconds = 90 * 60 * 1000;


/**
 *
 * @param {DEvolution_Versus} this
 *
 * @return {AsyncGenerator}
 *   Return the newly created instance of
 * DEvolution_Versus.load_asyncGenerator().
 */
function relay_load_asyncGenerator() {
  return DEvolution_Versus.load_asyncGenerator.apply(
    this, arguments );
}
