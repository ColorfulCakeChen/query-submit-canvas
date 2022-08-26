export { VersusId_WinCount };

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
class Base {

//   /**
//    *
//    */
//   constructor( versusIdString, entityNoString, parentGenerationNoString, offspringGenerationNoString, winCountString ) {
//     this.set( versusIdString, entityNoString, parentGenerationNoString, offspringGenerationNoString, winCountString );
//   }

  /**
   * @param {string} versusIdString               The versus id string (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo).
   * @param {string} entityNoString               The entity id string of the versus.
   * @param {string} parentGenerationNoString     The parent generation id string of the entity of the versus.
   * @param {string} offspringGenerationNoString  The offspring generation id string of the entity of the versus.
   * @param {string} winCountString               The win count string of parent generation of the entity of the versus.
   */
  set( versusIdString, entityNoString, parentGenerationNoString, offspringGenerationNoString, winCountString ) {
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
   *
   * @param {string} versusIdString               The versus id string (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo).
   * @param {string} winCountString               The win count string of parent generation of the entity of the versus.
   */
  set_By_VersusIdString_WinCountString( versusIdString, winCountString ) {

    // Split the versus id inside. Got id of entity, parentGeneration, offspringGeneration.
    //
    //   EntityNo_ParentGenerationNo_OffspringGenerationNo
    //
    // They are separated by underline (_).
    let versusId_parts = versusIdString.versusId.split( Base.EntityNo_ParentGenerationNo_OffspringGenerationNo_SplittingRegExp );

    this.set( versusIdString, versusId_parts[ 0 ], versusId_parts[ 1 ], versusId_parts[ 2 ], winCountString );
  }

  /**
   * @param {string} versusId_winCount_string
   *   The string contains versus id and win count (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount).
   */
  set_By_VersusId_WinCount_String( versusId_winCount_string ) {

    // Split the versus id and win count.
    //
    //   EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount
    //
    // They are separated by colon (:).
    let versusId_winCount_string_array = versusId_winCount_string.split( Base.VersusId_WinCount_SplittingRegExp );

    this.set_By_VersusIdString_WinCountString( versusId_winCount_string_array[ 0 ], versusId_winCount_string_array[ 1 ] );
  }

  /**
   * Create and return a VersusId_WinCount by parsing the specified string.
   *
   * @param {string} versusId_winCount_string
   *   The string contains versus id and win count (e.g. EntityNo_ParentGenerationNo_OffspringGenerationNo:WinCount).
   */
  static create_By_VersusId_WinCount_String( versusId_winCount_string ) {
    return ( new VersusId_WinCount() ).set_By_VersusId_WinCount_String( versusId_winCount_string );
  }
}

/** Regular expression for splitting versus id and win count. */
Base.VersusId_WinCount_SplittingRegExp = RegExp( ":", "g" );

/** Regular expression for splitting ids of entity, parent generation, offspring generation. */
Base.EntityNo_ParentGenerationNo_OffspringGenerationNo_SplittingRegExp = RegExp( "_", "g" );
