import * as VersusId_WinCount from "./VersusId_WinCount.js";

export { Base };

/**
 * @member {string} gidString
 *   The id of the published Google Sheet. The sheet contains entity weights of one to more versus.
 *
 * @member {VersusId_WinCount.Base[]} VersusId_WinCount_Array
 *   All the versus belong to the gid.
 *
 *
 */
class Base {

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
    let string_array = gid_Versus_string.split( Base.gid_Versus_SplittingRegExp );
    if ( string_array.length < 1 )
      return; // Nothing in the string.

    // 1. Got gid. (Element 0 is gid.)
    this.gidString = string_array[ 0 ];
    this.gid = Number.parseInt( this.gidString, 10 );

    // 2. Parse all other elements as versus.
    this.VersusId_WinCount_Array = new Array( string_array.length - 1 ); // All other elements are versus ids (with win counts).
    for ( let i = 1; i < string_array.length; ++i ) {
      this.VersusId_WinCount_Array[ i - 1 ] = VersusId_WinCount.Base.createByParse( string_array[ i ] );
    }
  }

  dispose() {
    this.gid = null;
    this.VersusId_WinCount_Array = null;
  }

}

// Regular expression for splitting gid and every versus.
Base.gid_Versus_SplittingRegExp = RegExp( "|", "g" );

