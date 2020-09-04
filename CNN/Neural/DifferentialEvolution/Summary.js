import * as NetProgress from "../NetProgress.js";
import * as tdTextExtracter from "../../util/tdTextExtracter.js";
import * as Versus from "./Versus.js";

export { NetProgress, VersusId_WinCount, gid_Versus, Base };

/**
 * @member {string} versusIdString               The versus id string (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo).
 * @member {string} entityNoString               The entity id string of the versus.
 * @member {number} entityNo                     The entity id number of the versus.
 * @member {string} parentGenerationNoString     The parent generation id string of the entity of the versus.
 * @member {number} parentGenerationNo           The parent generation id number of the entity of the versus.
 * @member {string} offspringGenerationNoString  The offspring generation id string of the entity of the versus.
 * @member {number} offspringGenerationNo        The offspring generation id number of the entity of the versus.
 * @member {string} winCountString               The win count string of parent generation of the entity of the versus.
 * @member {number} winCount                     The win count number of parent generation of the entity of the versus.
 */
class VersusId_WinCount {

  /**
   *
   */
  constructor( versusIdString, entityNoString, parentGenerationNoString, offspringGenerationNoString, winCountString ) {
    this.versusIdString = versusIdString;
    this.entityNoString = entityNoString;
    this.entityNo = Number.parseInt( entityNoString, 10 );
    this.parentGenerationNoString = parentGenerationNoString;
    this.parentGenerationNo = Number.parseInt( parentGenerationNoString, 10 );
    this.offspringGenerationNoString = offspringGenerationNoString;
    this.offspringGenerationNo = Number.parseInt( offspringGenerationNoString, 10 );
    this.winCountString = winCountString;
    this.winCount = Number.parseInt( winCountString, 10 );
  }

  /**
   * Create and return a VersusId_WinCount by parsing the specified string.
   *
   * @param {string} versusId_winCount_string
   *   The string contains versus id and win count (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount).
   */
  static createByParse( versusId_winCount_string ) {

    // Split the versus id and win count.
    //
    //   EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount
    //
    // They are separated by colon (:).
    let versus_parts = versusId_winCount_string.split( VersusId_WinCount.VersusId_WinCount_SplittingRegExp );

    // Split the versus id inside. Got id of entity, parentGeneration, offspringGeneration.
    //
    //   EntityNo_ParentGenerationNo_OffspringGenerationNo
    //
    // They are separated by underline (_).
    let versusId_parts = versus.versusId.split( VersusId_WinCount.EntityNo_ParentGenerationNo_OffspringGenerationNo_SplittingRegExp );

    return new VersusId_WinCount( versus_parts[ 0 ], versusId_parts[ 0 ], versusId_parts[ 1 ], versusId_parts[ 2 ] );
  }

}

// Regular expression for splitting versus id and win count.
VersusId_WinCount.VersusId_WinCount_SplittingRegExp = RegExp( ":", "g" );

// Regular expression for splitting ids of entity, parent generation, offspring generation.
VersusId_WinCount.EntityNo_ParentGenerationNo_OffspringGenerationNo_SplittingRegExp = RegExp( "_", "g" );


/**
 * @member {string} gidString
 *   The id of the published Google Sheet. The sheet contains entity weights of one to more versus.
 *
 * @member {VersusId_WinCount[]} VersusId_WinCount_Array
 *   All the versus belong to the gid.
 *
 *
 */
class gid_Versus {

//   /**
//    *
//    */
//   constructor( gidString, versusCount ) {
//     this.gidString = gidString;
//     this.versus = new Array( versusCount );
//   }

  /**
   * Create and return a gid_Versus by parsing the specified string.
   *
   * @param {string} gid_Versus_string
   *   The string contains gid, versus ids and win counts
   * (e.g. gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...).
   */
  setByParse( gid_Versus_string ) {

    this.dispose();

    // Split the text of a td tag.
    //
    //   gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...
    //
    // They are separated by vertical bar (|).
    let string_array = gid_Versus_string.split( gid_Versus.gid_Versus_SplittingRegExp );
    if ( string_array.length < 1 )
      return; // Nothing in the string.

    // 1. Got gid. (Element 0 is gid.)
    this.gidString = string_array[ 0 ];
    this.gid = Number.parseInt( this.gidString, 10 );

    // 2. Parse all other elements as versus.
    this.VersusId_WinCount_Array = new Array( string_array.length - 1 ); // All other elements are versus ids (with win counts).
    for ( let i = 1; i < string_array.length; ++i ) {
      this.VersusId_WinCount_Array[ i - 1 ] = VersusId_WinCount.createByParse( string_array[ i ] );
    }
  }

  dispose() {
    this.gid = null;
    this.VersusId_WinCount_Array = null;
  }

}

// Regular expression for splitting gid and every versus.
gid_Versus.gid_Versus_SplittingRegExp = RegExp( "|", "g" );


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
 */
class Base {

  /**
   *
   */
  constructor() {
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

    // 1.
    this.PopulationSize = Number.parseInt( lineMatch.value[ 1 ], 10 );

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    // 2.
    this.EntityChromosomeCount = Number.parseInt( lineMatch.value[ 1 ], 10 );

    if ( ( lineMatch = lineMatches.next() ).done )
      return;

    // 3.
    this.ChromosomeWeightCount = Number.parseInt( lineMatch.value[ 1 ], 10 );
    this.EntityWeightCount = this.EntityChromosomeCount * this.ChromosomeWeightCount; // There are how many weights in one entity.

    // 4. Parse every gid and their corresponding versus ids (with win counts).
    this.gid_versus_array = [];
    while ( !( lineMatch = lineMatch.next() ).done ) {
      let gid_versus = new gid_Versus();
      gid_versus.setByParse( lineMatch.value[ 1 ] ); // Split the text of a td tag.
      this.gid_versus_array.push( gid_versus );
    }

//!!! ...unfinished... report progress.
  }

  downloadEntity( progress ) {

//!!! ...unfinished... Which gid number should be used.
//    let gid = ???;
    let replaceContext = `$1${gid}`;
    let url = this.summaryURL.replace( Base.gidReplacingRegExp, replaceContext );
  
    // Parent and offspring.
  }

}

// Regular expression for replacing the "nnn" of "gid=nnn" inside the published web page URL.
Base.gidReplacingRegExp = RegExp( "(gid=)(\d+)", "g" );

