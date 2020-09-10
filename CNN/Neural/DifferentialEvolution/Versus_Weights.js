import * as NetProgress from "../NetProgress.js";
import * as tdTextExtracter from "../../util/tdTextExtracter.js";
import * as gid_Versus from "./gid_Versus.js";
import * as VersusId_WinCount from "./VersusId_WinCount.js";

export { NetProgress, Base };


/**
 * .
 *
 */
class {
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
 * @member {gid_Versus.Base} gid_Versus
 *   The gid and related versus id (with win count).
 *
 * @member {number} ExportSheetNo
 *   The array index of the published Google Sheet.
 *
!!! 
 * @member {number} ChromosomeWeightCount
 *   There are how many weights in one chromsome.
 *
 * @member {number} EntityWeightCount
 *   There are how many weights in one entity. It equals to ( this.EntityChromosomeCount * this.ChromosomeWeightCount ).
 *
 * @member {number} gid_versus_array
 *   There are how many weights in one entity. It equals to ( this.EntityChromosomeCount * this.ChromosomeWeightCount ).
 *
 */
class Base {

//  constructor() {
//  }

  /**
   *
   * @param versusURL
   *   The published (should be html, not tsv, not csv) web page URL of the versus sheet of the differential evolution Google Sheets. For example:
   * "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzA4SXUR5VyPmJ1cLEkNMiJgfb28zzgp4HtwoBlumIIOTkL_y7mgPldqaGtsunIq5eTu5QndluyFcV/pubhtml?gid=0&single=true".
   * The "gid=0" inside the URL will be replaced with different number when downloading other published sheet.
   */
  init( versusURL ) {

    this.versusURL = versusURL;

  }

  async downloadEntity( progress ) {

//!!! ...unfinished... Which gid number should be used.
//    let gid = ???;
    let replaceContext = `$1${gid}`;
    let url = this.summaryURL.replace( this.gidReplacingRegExp, replaceContext );

    let response = await fetch( url );

    let matches = tdTextExtracter.Base.createIterator( response.text() );
    let match = matches.next();    // Only capture group 1 will be used.
    if ( match.done )
      return;

//!!! ...unfinished...

    // Parent and offspring.
  }

}
