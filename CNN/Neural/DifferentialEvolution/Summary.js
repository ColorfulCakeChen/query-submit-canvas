import * as NetProgress from "../NetProgress.js";
import * as tdTextExtracter from "../../util/tdTextExtracter.js";
import * as Versus from "./Versus.js";

export { NetProgress, Base };

/**
 * Download differential evolution summary and individual versus (entity vs entity) from network (a publish html of Google Sheets).
 *
 * The format of differential evolution summary page is the following:
 *
 * <code>
 *   PopulationSize
 *   EntityWeightCount
 *   EntityChromosomeCount
 *   gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...
 *   gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...
 *   gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...
 *     :
 *     :
 * </code>
 *
 * The PopulationSize represents how many entities in the differential evolution.
 * The EntityChromosomeCount represents How many chromsomes in one entity.
 * The ChromosomeWeightCount represents how many weights in one chromsome.
 *
 * The gid is the Google Sheet's id which will be used to form the url when download every individual versus.
 * Every gid contains one or more versus which are separated by vertical bar (|).
 * A versus contains versus id (EntityNo_ParentGenerationNo_OffspringGenerationNo) and its WinCount which are separated by colon (:).
 * A versus id contains EntityNo, ParentGenerationNo, OffspringGenerationNo which are separated by underline (_).
 *
 *
 */
class Base {

  /**
   *
   */
  constructor() {

    // Regular expression for replacing the "nnn" of "gid=nnn" inside the published web page URL.
    this.gidReplacingRegExp = RegExp( "(gid=)(\d+)", "g" );

    // Regular expression for splitting gid and every versus.
    this.gid_Versus_SplitRegExp = RegExp( "|", "g" );

    // Regular expression for splitting versus id and win count
    this.VersusId_WinCount_SplittingRegExp = RegExp( ":", "g" );

    // Regular expression for splitting ids of entity, parent generation, offspring generation.
    this.EntityNo_ParentGenerationNo_OffspringGenerationNo_SplittingRegExp = RegExp( "_", "g" );
  }

  /**
   * Fetch and extract.
   *
   * @param summaryURL
   *   The published (should be html, not tsv, not csv) web page URL of the summary sheet of the differential evolution Google Sheets. For example:
   * "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzA4SXUR5VyPmJ1cLEkNMiJgfb28zzgp4HtwoBlumIIOTkL_y7mgPldqaGtsunIq5eTu5QndluyFcV/pubhtml?gid=0&single=true".
   * The "gid=0" inside the URL will be replaced with different number when downloading other published sheet.
   */
  async downloadSummary( summaryURL, progress ) {

    // Why using published html web page instead of tsv (or csv)? This is because Google Sheets' published html web page support cross-origin
    // resource sharing (CORS) while its published web page tsv (or csv) does not.
    this.summaryURL = summaryURL;

    let response = await fetch( this.summaryURL );

    let matches = tdTextExtracter.Base.createIterator( response.text() );
    let match = matches.next();    // Only capture group 1 will be used.
    if ( match.done )
      return;

    this.PopulationSize = Number.parseInt( match.value[ 1 ], 10 );

    if ( ( match = matches.next() ).done )
      return;

    this.EntityChromosomeCount = Number.parseInt( match.value[ 1 ], 10 );

    if ( ( match = matches.next() ).done )
      return;

    this.ChromosomeWeightCount = Number.parseInt( match.value[ 1 ], 10 );
    this.EntityWeightCount = this.EntityChromosomeCount * this.ChromosomeWeightCount; // So many weights in one entity.

    if ( ( match = matches.next() ).done )
      return;

//!!! ...unfinished... gid and versus ids.
    if ( ( match = matches.next() ).done )
      return;

//!!! ...unfinished... gid and versus ids.

    // versus id
    //   EntityNo_ParentGenerationNo_OffspringGenerationNo

//    for ( let match of matches ) {


//!!! ...unfinished... report progress.
  }

  downloadEntity( progress ) {

//!!! ...unfinished... Which gid number should be used.
//    let gid = ???;
    let replaceContext = `$1${gid}`;
    let url = this.summaryURL.replace( this.gidReplacingRegExp, replaceContext );
  
    // Parent and offspring.
  }

}
