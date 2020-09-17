import * as NetProgress from "../NetProgress.js";
import * as tdTextExtracter from "../../util/tdTextExtracter.js";
import * as gid_Versus from "./gid_Versus.js";
import * as VersusId_WinCount from "./VersusId_WinCount.js";
import * as Base64ToUint8Array from "../../Base64ToUint8Array.js";
import * as PartTime from "../../PartTime.js";

export { NetProgress, EnitiyChromosomes, Base };


/**
 * .
 *
 * @member {number} enitiyNo
 *   The id of the published entity.
 *
 * @member {Uint8Array} parentChromosome
 *   The Base64 decoded chromosome of the parent of the published entity.
 *
 * @member {Uint8Array} offspringChromosome
 *   The Base64 decoded chromosome of the offspring of the published entity.
 *
 */
class EnitiyChromosomes {

  /**
   *
   */
//  constructor( enitiyNo, entityChromosomeCount ) {
  constructor( enitiyNo ) {
    this.enitiyNo = enitiyNo;
//     this.parentChromosomes = new Array( entityChromosomeCount );
//     this.offspringChromosomes = new Array( entityChromosomeCount );
  }

  /**
   * Join the string array, convert to Uint8Array, decode as Base64, result in another Uint8Array.
   *
   * @param {string[]} base64EncodedStringArray
   *   Every element of base64EncodedStringArray is a string whose content is base64 encoded text.
   *
   * @param {TextEncoder} textEncoder
   *   This TextEncoder will convert string to Uint8Array so that the Base64 decoder can work.
   *
   * @param {ValueMax.Percentage.Aggregate} progressToYield
   *   Return this when every time yield. Usually, this is the root container of the progressToAdvance.
   *
   * @param {ValueMax.Percentage.Concrete} progressToAdvance
   *   Increase this when every time progress advanced. It will be initialized to zero when decoder starting.
   *
   * @yield {ValueMax.Percentage.Aggregate or Uint8Array}
   *   Yield ( value = progressToYield ) when ( done = false ).
   *   Yield ( value = decoded data as Uint8Array ) when ( done = true ).
   */
  static *decoder_Base64_StringArray_To_Uint8Array( base64EncodedStringArray, textEncoder, progressToYield, progressToAdvance ) {

    progressToAdvance.total = ???;
    progressToAdvance.accumulation = ???0;

//     let base64EncodedStringLong = base64EncodedStringArray.join( "" );
//     let base64EncodedUint8Array = textEncoder.encode( base64EncodedStringLong );

    let skipLineCount = 0;
//???
    let suspendByteCount = 1024;

    let base64Decoder = Base64ToUint8Array.decoder_FromStringArray(
      base64EncodedStringArray, skipLineCount, progressToYield, progressToAdvance, suspendByteCount );

    let base64DecodedUint8Array = yield *base64Decoder;
    return base64DecodedUint8Array;


    let delayMilliseconds = 0;

//!!! ...unfinished... But always asynchronous (even if it could be synchronous) seems hurts performance.
//     for await ( let progress of base64Decoder ) {
//       let { progress, done } = base64Decoder.next();
//       await PartTime.sleep( delayMilliseconds );
//     }

    let chromosomeUint8Array_Base64Decoded = await PartTime.forOf(
      base64Decoder,
      ( valueMax ) => {
        yield 
//!!!
        progressReceiver.setValueMax(valueMax); // Report progress to outer progress.
      },
      delayMilliseconds
    );

//!!!
//     let progressReceiver = ???;
//     let delayMilliseconds = 0;
//
// //???
//     let testPromise = PartTime.forOf(
//       decoder,
//       (valueMax) => { progressReceiver.setValueMax(valueMax); /* Report progress to UI. */ },
//       delayMilliseconds
//     ).then(r => {
//       progressReceiver.informDone(r); /* Inform UI progress done. */
//     });

  }

//   get entityChromosomeCount {
//     return this.parentChromosomes.length;
//   }
}


/**
 * Download differential evolution individual weights (entity vs entity) from network (a publish html of Google Sheets).
 *
 * The format of differential evolution individual weights page is the following:
 *
 * <code>
 *   gid
 *   ExportSheetNo
 *   EntityNo1_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo2_ParentGenerationNo_OffspringGenerationNo:WinCount|...
 *   EntityNo1_Parent_Chromosome1
 *   EntityNo1_Parent_Chromosome2
 *     :
 *   EntityNo1_Parent_ChromosomeN
 *   EntityNo2_Parent_Chromosome1
 *   EntityNo2_Parent_Chromosome2
 *     :
 *   EntityNo2_Parent_ChromosomeN
 *     :
 *   EntityNoM_Parent_Chromosome1
 *   EntityNoM_Parent_Chromosome2
 *     :
 *   EntityNoM_Parent_ChromosomeN
 *   EntityNo1_Offspring_Chromosome1
 *   EntityNo1_Offspring_Chromosome2
 *     :
 *   EntityNo1_Offspring_ChromosomeN
 *   EntityNo2_Offspring_Chromosome1
 *   EntityNo2_Offspring_Chromosome2
 *     :
 *   EntityNo2_Offspring_ChromosomeN
 *     :
 *   EntityNoM_Offspring_Chromosome1
 *   EntityNoM_Offspring_Chromosome2
 *     :
 *   EntityNoM_Offspring_ChromosomeN
 * </code>
 *
 *   - The gid is the id (which is used in the URL) of the Google Sheet.
 *   - The ExportSheetNo is the array index of the Google Sheet. This is mainly used by server. Client (downloader) can ignore this value.
 *   - The 3rd line list all versus published in this web page.
 *     - A versus contains versus id (EntityNo_ParentGenerationNo_OffspringGenerationNo) and its WinCount which are separated by colon (:).
 *     - A versus id contains EntityNo, ParentGenerationNo, OffspringGenerationNo which are separated by underline (_).
 *   - List all chromosomes of the parent of every entity.
 *   - List all chromosomes of the offspring of every entity.
 *
 * @member {number} entityChromosomeCount
 *   There are how many chromsomes in the parent (or offspring) of one entity.
 *
 * @member {TextEncoder} textEncoder
 *   This TextEncoder will convert string to Uint8Array so that the Base64 decoder can work.
 *
 * @member {gid_Versus.Base} gid_Versus
 *   The gid and related versus id (with win count).
 *
 * @member {number} exportSheetNo
 *   The array index of the published Google Sheet.
 *
 * @member {EnitiyChromosomes[]} enitiyChromosomesArray
 *   All entities' parent and offspring chromsomes.
 *
 */
class Base {

  /**
   */
  constructor( entityChromosomeCount, textEncoder ) {
    this.entityChromosomeCount = entityChromosomeCount;
    this.textEncoder = textEncoder;
  }

//!!! ...unfinished... change to async generator.

  /**
   * Fetch and extract.
   *
   * @param {string} versusURL
   *   The published (should be html, not tsv, not csv) web page URL of the versus sheet of the differential evolution Google Sheets. For example:
   * "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzA4SXUR5VyPmJ1cLEkNMiJgfb28zzgp4HtwoBlumIIOTkL_y7mgPldqaGtsunIq5eTu5QndluyFcV/pubhtml?gid=474257400&single=true".
   * The "gid=474257400" inside the URL should be the same as the 1st line of the table of the web page.
   *
   * @param {ValueMax.Percentage.Aggregate} progressToYield
   *   Return this when every time yield. Usually, this is the root container of the progressToAdvance.
   *
   * @param {ValueMax.Percentage.Concrete} progressToAdvance
   *   Increase this when every time progress advanced. It will be initialized to zero when decoder starting.
   *
   * @return {async generator}
   *   Return am asynchronous 
   */
  async *fetcher( versusURL, progressToYield, progressToAdvance ) {

    // Why using published html web page instead of tsv (or csv)? This is because Google Sheets' published html web page support cross-origin
    // resource sharing (CORS) while its published web page tsv (or csv) does not.
    this.versusURL = versusURL;

    let response = await fetch( versusURL );
    let responseText = await response.text();

    let lineMatches = tdTextExtracter.Base.createIterator( responseText ); // Only capture group 1 will be used.
    let lineMatch;

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    // 1. Parse gid.
    let gidString = lineMatch.value[ 1 ];

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    // 2.
    this.exportSheetNo = Number.parseInt( lineMatch.value[ 1 ], 10 );

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    // 3. Parse corresponding versus ids (with win counts).
    this.gid_Versus = new gid_Versus.Base();
    this.gid_versus.set_ByString( lineMatch.value[ 1 ], gidString ); // Split the text of a td tag.

    // 4. Parse every gid and their corresponding weights (of chromosomes of parent and offspring).
    this.enitiyChromosomesArray = new Array( this.gid_versus.VersusId_WinCount_Array.length );
    
    let chromosomeArray = new Array( this.entityChromosomeCount );  // All chromosomes of one entity's parent (or offspring).

    // All parent's chromosomes of all entities.
    for ( let i = 0; ( i < this.enitiyChromosomesArray.length ) && ( !lineMatch.done ); ++i, ( lineMatch = lineMatch.next() ) ) {
      let entityNo = this.gid_versus.VersusId_WinCount_Array[ i ].entityNo;
      let enitiyChromosomes = this.enitiyChromosomesArray[ i ] = new EnitiyChromosomes( entityNo, this.entityChromosomeCount );

      // The parent's chromosomes of the entity.
      {
        let k;
        for ( k = 0; ( k < this.entityChromosomeCount ) && ( !lineMatch.done ); ++k, ( lineMatch = lineMatch.next() ) ) {
          chromosomeArray[ k ] = lineMatch.value[ 1 ];
        }
        chromosomeArray.fill( null, k ); // For not enough chromosome, keep them null.
        enitiyChromosomes.parentChromosome = EnitiyChromosomes.decode_Base64_StringArray_To_Uint8Array( chromosomeArray, this.textEncoder );
      }
    }

    // All offspring's chromosomes of all entities.
    for ( let i = 0; ( i < this.enitiyChromosomesArray.length ) && ( !lineMatch.done ); ++i, ( lineMatch = lineMatch.next() ) ) {
      let enitiyChromosomes = this.enitiyChromosomesArray[ i ];

      // The offspring's chromosomes of the entity.
      {
        let k;
        for ( k = 0; ( k < this.entityChromosomeCount ) && ( !lineMatch.done ); ++k, ( lineMatch = lineMatch.next() ) ) {
          chromosomeArray[ k ] = lineMatch.value[ 1 ];
        }
        chromosomeArray.fill( null, k ); // For not enough chromosome, keep them null.
        enitiyChromosomes.offspringChromosome = EnitiyChromosomes.decode_Base64_StringArray_To_Uint8Array( chromosomeArray, this.textEncoder );
      }
    }

    // 
//!!! ...unfinished... to neural network.

//!!! ...unfinished... report progress.
  }

}
