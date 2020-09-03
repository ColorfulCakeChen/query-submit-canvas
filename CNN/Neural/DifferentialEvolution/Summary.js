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

    // Regular expression for splitting gid and every versus.
    this.gid_Versus_SplitRegExp = RegExp( "|", "g" );

    // Regular expression for splitting versus id and win count
    this.VersusId_WinCount_SplittingRegExp = RegExp( ":", "g" );

    // Regular expression for splitting ids of entity, parent generation, offspring generation.
    this.EntityNo_ParentGenerationNo_OffspringGenerationNo_SplittingRegExp = RegExp( "_", "g" );

    // Regular expression for replacing the "nnn" of "gid=nnn" inside the published web page URL.
    this.gidReplacingRegExp = RegExp( "(gid=)(\d+)", "g" );
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

    let lineMatches = tdTextExtracter.Base.createIterator( response.text() ); // Only capture group 1 will be used.
    let lineMatch;

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    this.PopulationSize = Number.parseInt( lineMatch.value[ 1 ], 10 );

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    this.EntityChromosomeCount = Number.parseInt( lineMatch.value[ 1 ], 10 );

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    this.ChromosomeWeightCount = Number.parseInt( lineMatch.value[ 1 ], 10 );
    this.EntityWeightCount = this.EntityChromosomeCount * this.ChromosomeWeightCount; // So many weights in one entity.

    this.gid_versus_array = [];
    while ( !( lineMatch = lineMatch.next() ).done ) {

      let versus_string_array = lineMatch.value[ 1 ].split( this.gid_Versus_SplitRegExp ); // Split the text of a td tag.
      if ( versus_string_array.length <= 1 )
        continue; // At least, should be 2. The first one is gid, the second (and after) are versus ids (with win counts)

      // Got gid.
      let gid_versus = {
        gid: versus_string_array[ 0 ], // In fact, element 0 is gid.
        versus: new Array( versus_string_array.length - 1 ) // All other elements are versus ids (with win counts).
      };

      this.gid_versus_array.push( gid_versus );

      // Parse every versus (i.e. EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount)
      for ( let i = 1; i < versus_string_array.length; ++i ) {
        let versus_parts = versus_string_array[ i ].split( this.VersusId_WinCount_SplittingRegExp );

        // Got winCount.
        let versus = { winCount: Number.parseInt( versus_parts[ 1 ], 10 ) };
        gid_versus.versus[ i - 1 ] = versus;

        let versusId = versus_parts[ 0 ];
        let versusId_parts = versusId.split( this.EntityNo_ParentGenerationNo_OffspringGenerationNo_SplittingRegExp );

        // Got id of entity, parentGeneration, offspringGeneration.
        versus.entityNo = versusId_parts[ 0 ];
        versus.parentGenerationNo = versusId_parts[ 1 ];
        versus.offspringGenerationNo = versusId_parts[ 2 ];
      }
    }

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
