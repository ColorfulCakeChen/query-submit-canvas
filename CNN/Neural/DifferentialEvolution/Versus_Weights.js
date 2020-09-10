import * as NetProgress from "../NetProgress.js";
import * as tdTextExtracter from "../../util/tdTextExtracter.js";
import * as gid_Versus from "./gid_Versus.js";
import * as VersusId_WinCount from "./VersusId_WinCount.js";

export { NetProgress, Base };

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
 * The PopulationSize represents how many entities in the differential evolution.
 * The EntityChromosomeCount represents how many chromsomes in one entity.
 * The ChromosomeWeightCount represents how many weights in one chromsome.
 *
 * The gid is the Google Sheet's id which will be used to form the url when download every individual versus.
 * Every gid contains one or more versus which are separated by vertical bar (|).
 * A versus contains versus id (EntityNo_ParentGenerationNo_OffspringGenerationNo) and its WinCount which are separated by colon (:).
 * A versus id contains EntityNo, ParentGenerationNo, OffspringGenerationNo which are separated by underline (_).
 *
 * @member {number} PopulationSize
 *   There are how many entities in the differential evolution.
 *
 * @member {number} EntityChromosomeCount
 *   There are how many chromsomes in one entity.
 *
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
