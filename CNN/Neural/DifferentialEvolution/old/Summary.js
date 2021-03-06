import * as NetProgress from "../NetProgress.js";
import * as tdTextExtracter from "../../util/tdTextExtracter.js";
import * as VersusId_WinCount from "./VersusId_WinCount.js";
import * as gid_Versus from "./gid_Versus.js";
import * as Versus_Weights from "./Versus_Weights.js";

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
 *   - The PopulationSize represents how many entities in the differential evolution.
 *   - The EntityChromosomeCount represents how many chromsomes in one entity.
 *   - The ChromosomeWeightCount represents how many weights in one chromsome.
 *   - The 4th (and after) line contains Google Sheet gid and the versus list which the gid has. 
 *     - The gid is the Google Sheet's id which will be used to compose the url when download every individual weights (entity versus entity).
 *     - Every gid contains one or more versus which are separated by vertical bar (|).
 *     - A versus contains versus id (EntityNo_ParentGenerationNo_OffspringGenerationNo) and its WinCount which are separated by colon (:).
 *     - A versus id contains EntityNo, ParentGenerationNo, OffspringGenerationNo which are separated by underline (_).
 *
 * @member {TextEncoder} textEncoder
 *   This TextEncoder will convert string to Uint8Array so that the Base64 decoder can work.
 *
 * @member {number} populationSize
 *   There are how many entities in the differential evolution.
 *
 * @member {number} entityChromosomeCount
 *   There are how many chromsomes in one entity.
 *
 * @member {number} chromosomeWeightCount
 *   There are how many weights in one chromsome.
 *
 * @member {number} entityWeightCount
 *   There are how many weights in one entity. It equals to ( this.EntityChromosomeCount * this.ChromosomeWeightCount ).
 *
 * @member {number} gid_versus_array
 *   There are how many weights in one entity. It equals to ( this.EntityChromosomeCount * this.ChromosomeWeightCount ).
 */
class Base {

  /**
   *
   */
  constructor() {
    this.textEncoder = new TextEncoder(); // For converting string to Uint8Array. For Base64 decoder.
  }

//!!! ...unfinished... change to async generator.

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

    let response = await fetch( summaryURL );
    let responseText = await response.text();

    let lineMatches = tdTextExtracter.Base.createIterator( responseText ); // Only capture group 1 will be used.
    let lineMatch;

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    // 1.
    this.populationSize = Number.parseInt( lineMatch.value[ 1 ], 10 );

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    // 2.
    this.entityChromosomeCount = Number.parseInt( lineMatch.value[ 1 ], 10 );

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    // 3.
    this.chromosomeWeightCount = Number.parseInt( lineMatch.value[ 1 ], 10 );
    this.entityWeightCount = this.entityChromosomeCount * this.chromosomeWeightCount; // There are how many weights in one entity.

    // 4. Parse every gid and their corresponding versus ids (with win counts).
    this.gid_versus_array = [];
    while ( !( lineMatch = lineMatch.next() ).done ) {
      let gid_versus = new gid_Versus.Base();
      gid_versus.set_ByString( lineMatch.value[ 1 ], null ); // Split the text of a td tag. The 2nd parameter is null so that the prefix is viewed as gid.
      this.gid_versus_array.push( gid_versus );
    }

//!!! ...unfinished... report progress.
  }

  /**
   *
   */
  downloadVersusWeights( progress ) {

//!!! ...unfinished... Which gid number should be used.
//    let gid = ???;
    let replaceContext = `$1${gid}`;
    let versusURL = this.summaryURL.replace( Base.gidReplacingRegExp, replaceContext );
  
    // Parent and offspring.
    let Versus_Weights = new Versus_Weights.Base( this.entityChromosomeCount, this.textEncoder );
    Versus_Weights.fetchAndReport( versusURL, progress );

    
//!!! ...unfinished... report progress.
  }

}

// Regular expression for replacing the "nnn" of "gid=nnn" inside the published web page URL.
Base.gidReplacingRegExp = RegExp( "(gid=)(\d+)", "g" );

