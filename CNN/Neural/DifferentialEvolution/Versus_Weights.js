import * as NetProgress from "../NetProgress.js";
import * as tdTextExtracter from "../../util/tdTextExtracter.js";
import * as gid_Versus from "./gid_Versus.js";
import * as VersusId_WinCount from "./VersusId_WinCount.js";

export { NetProgress, EnitiyParentOffspringChromosomes, Base };


/**
 * .
 *
 * @member {number} enitiyNo
 *   The id of the published entity.
 *
 * @member {number} entityChromosomeCount
 *   There are how many chromsomes in the parent (or offspring) of one entity.
 *
 * @member {string[]} parentChromosomes
 *   The chromosomes of the parent of the published entity.
 *
 * @member {string[]} offspringChromosomes
 *   The chromosomes of the offspring of the published entity.
 *
 */
class EnitiyChromosomes {

  /**
   *
   */
  constructor( enitiyNo, entityChromosomeCount ) {
    this.enitiyNo = enitiyNo;
    this.parentChromosomes = new Array( entityChromosomeCount );
    this.offspringChromosomes = new Array( entityChromosomeCount );
  }

  get entityChromosomeCount {
    return this.parentChromosomes.length;
  }
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
   * @param {number} entityChromosomeCount
   *   There are how many chromsomes in the parent (or offspring) of one entity.
   */
  constructor( entityChromosomeCount ) {
    this.entityChromosomeCount = entityChromosomeCount;
  }

  /**
   * Fetch and extract.
   *
   * @param {string} versusURL
   *   The published (should be html, not tsv, not csv) web page URL of the versus sheet of the differential evolution Google Sheets. For example:
   * "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzA4SXUR5VyPmJ1cLEkNMiJgfb28zzgp4HtwoBlumIIOTkL_y7mgPldqaGtsunIq5eTu5QndluyFcV/pubhtml?gid=474257400&single=true".
   * The "gid=474257400" inside the URL should be the same as the 1st line of the table of the web page.
   *
   * @param {ValueMax.Percentage} progressToAdvance
   *   This method will report progress to the progressToAdvance.
   */
  async fetchAndReport( versusURL, progressToAdvance ) {

    // Why using published html web page instead of tsv (or csv)? This is because Google Sheets' published html web page support cross-origin
    // resource sharing (CORS) while its published web page tsv (or csv) does not.
    this.versusURL = versusURL;

    let response = await fetch( versusURL );

    let lineMatches = tdTextExtracter.Base.createIterator( response.text() ); // Only capture group 1 will be used.
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
    for ( let i = 0; ( i < this.enitiyChromosomesArray.length ) && ( !lineMatch.done ); ++i, ( lineMatch = lineMatch.next() ) ) {
      let entityNo = this.gid_versus.VersusId_WinCount_Array[ i ].entityNo;
      let enitiyChromosomes = this.enitiyChromosomesArray[ i ] = new EnitiyChromosomes( entityNo, this.entityChromosomeCount );

      // The parent's chromosomes of the entity.
      for ( let k = 0; ( k < this.entityChromosomeCount ) && ( !lineMatch.done ); ++k, ( lineMatch = lineMatch.next() ) ) {
        enitiyChromosomes.parentChromosomes[ k ] = lineMatch.value[ 1 ];
      }
    }

    for ( let i = 0; ( i < this.enitiyChromosomesArray.length ) && ( !lineMatch.done ); ++i, ( lineMatch = lineMatch.next() ) ) {
      let enitiyChromosomes = this.enitiyChromosomesArray[ i ];

      // The offspring's chromosomes of the entity.
      for ( let k = 0; ( k < this.entityChromosomeCount ) && ( !lineMatch.done ); ++k, ( lineMatch = lineMatch.next() ) ) {
        enitiyChromosomes.offspringChromosomes[ k ] = lineMatch.value[ 1 ];
      }
    }

//!!! ...unfinished... report progress.
  }

}
