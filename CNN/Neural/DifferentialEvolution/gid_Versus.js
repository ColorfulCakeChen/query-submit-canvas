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
   * Set this object by string array.
   *
   * @param {string[]} string_array
   *   The array string contains gid and versus.
   * (e.g. [ "gid", "EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount", "EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount", ...] ).
   *
   * @param {string} gidString
   *   If null, string_array[ 0 ] will be viewed as gid and string_array[ 1 ] (and after) will be viewed as versus. Otherwise, gidString is gid
   * and all elements of string_array[] will be viewed as versus.
   */
  set_ByStringArray( string_array, gidString ) {

    this.dispose();

    if ( string_array.length < 1 )
      return; // Nothing in the string.

    let firstVersusIndex; // Which array element is the first versus.

    // 1. Got gid.
    if ( gidString ) {
      this.gidString = gidString;         // Specific gid. (i.e. Element 0 is not gid.)
      firstVersusIndex = 0;               // Element 0 (and after) is versus.
    } else {
      this.gidString = string_array[ 0 ]; // Element 0 is gid.
      firstVersusIndex = 1;               // Element 1 (and after) is versus.
    }

    this.gid = Number.parseInt( this.gidString, 10 );
    this.VersusId_WinCount_Array = new Array( string_array.length - firstVersusIndex );

    // 2. Parse all other elements as versus.
    for ( let i = firstVersusIndex; i < string_array.length; ++i ) {
      this.VersusId_WinCount_Array[ i - firstVersusIndex ] = VersusId_WinCount.Base.create_By_VersusId_WinCount_String( string_array[ i ] );
    }
  }

  /**
   * Set this object by parsing the specified string.
   *
   * @param {string} gid_Versus_string
   *   The string contains gid, versus ids and win counts.
   * (e.g. gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...).
   * The string can only contain versus ids and win counts (without gid in prefix).
   * (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...).
   *
   * @param {string} gidString
   *   If null, the first part of gid_Versus_string will be viewed as gid. Otherwise, all gid_Versus_string will be viewed as versus.
   */
  set_ByString( gid_Versus_string, gidString ) {

    // Split the text (if gidString is null):
    //
    //   gid|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...
    //
    // Or (if gidString is not null),
    //
    //   EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount|...
    //
    // They are separated by vertical bar (|).
    let string_array = gid_Versus_string.split( Base.gid_Versus_SplittingRegExp );
    this.set_ByStringArray( string_array, gidString );
  }

  dispose() {
    this.gid = null;
    this.VersusId_WinCount_Array = null;
  }

}

// Regular expression for splitting gid and every versus.
Base.gid_Versus_SplittingRegExp = RegExp( "|", "g" );

