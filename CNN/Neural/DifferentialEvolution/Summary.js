import * as NetProgress from "../NetProgress.js";
import tdTextExtracter from "../../util/tdTextExtracter.js";

export { NetProgress, Base };

/**
 * Download differential evolution summary and individual entity from network (a publish html of Google Sheets).
 *
 *
 *
 */
class Base {

//  constructor() {
//  }

  /**
   *
   * @param summaryURL
   *   The published (should be html, not tsv, not csv) web page URL of the summary sheet of the differential evolution Google Sheets. For example:
   * "https://docs.google.com/spreadsheets/d/e/2PACX-1vSzA4SXUR5VyPmJ1cLEkNMiJgfb28zzgp4HtwoBlumIIOTkL_y7mgPldqaGtsunIq5eTu5QndluyFcV/pubhtml?gid=0&single=true".
   * The "gid=0" inside the URL will be replaced with different number when downloading other published sheet.
   */
  init( summaryURL ) {

    // Why using published html web page instead of tsv (or csv)? This is because Google Sheets' published html web page support cross-origin
    // resource sharing (CORS) while its published web page tsv (or csv) does not.
    this.summaryURL = summaryURL;

    // The regular expression string for Replacing the "nnn" of "gid=nnn" inside the published web page URL.
    this.gidReplacingRegExpString = "(gid=)(\d+)";
    this.gidReplacingRegExp = RegExp( this.gidReplacingRegExpString );
  }

  async downloadSummary( progress ) {
    let response = await fetch( this.summaryURL );

    let matches = tdTextExtracter.createIterator( response.text() );
    let match = matches.next();    // Only capture group 1 will be used.
    if ( match.done )
      return;

    // The format of differential evolution summary page is the following:
    //
    //   PopulationSize
    //   EntityWeightCount
    //   EntityChromosomeCount
    //   gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...
    //   gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...
    //   gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...
    //     :
    //     :
    //

    this.PopulationSize = Number.parseInt( match.value[ 1 ], 10 ); // How many entities in the differential evolution?
    if ( ( match = matches.next() ).done )
      return;

    this.EntityWeightCount = Number.parseInt( match.value[ 1 ], 10 ); // How many weights in one entity?
    if ( ( match = matches.next() ).done )
      return;

    this.EntityChromosomeCount = Number.parseInt( match.value[ 1 ], 10 ); // How many weights in one chromsome?
    if ( ( match = matches.next() ).done )
      return;

    this.
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
