/**
 * Incrementally build search tree when every time search a named
 * range from currrent active spreadsheet.
 *
 * @member {NamedRange[]} namedRangeArray
 *   The whole named ranges in a flat array.
 *
 * @member {number} namedRangeArrayIndexNext
 *   The next array index into .namedRangeArray[] for searching (and building
 * fast search map searincrementally).
 *
 * @member {Map} namedRangeMap
 *   A fast search table for visited named ranged.
 */
class GlobalNamedRanges {

  /** */
  constructor() {
    let spreadsheet = SpreadsheetApp.getActive();
    this.namedRangeArray = spreadsheet.getNamedRanges();
    this.namedRangeArrayIndexNext = 0;

    this.namedRangeMap = new Map();
  }

  /**
   * @param {string} name  The name of NameRange to be searched.
   * @return {NamedRange} Return NameRange, if found. Return null, if not found
   */
  NamedRange_search_byName( name ) {
    let namedRange = this.namedRangeMap.get( name ); // 1. Find fast.
    if ( namedRange )
      return namedRange;

    //
    for ( let i = 0; i < namedRangeArray.length; ++i ) {
      namedRange = namedRangeArray[ i ];
      if ( namedRange.getName() == name ) {
        return namedRange;
      }
    }
    return null;
  }

}
