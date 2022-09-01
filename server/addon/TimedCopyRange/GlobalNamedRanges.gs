/**
 * Incrementally build search tree when every time search a named range from
 * currrent active spreadsheet.
 *
 * @member {NamedRange[]} namedRangeArray
 *   The whole named ranges in a flat array.
 *
 * @member {number} namedRangeArrayIndexNext
 *   The next array index into .namedRangeArray[] for searching (and building
 * fast search map searincrementally).
 *
 * @member {Map} namedRangeMap
 *   A fast search table for visited named ranges.
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
   * @param {string} name
   *   The name of NameRange to be searched.
   *
   * @return {NamedRange}
   *   Return NameRange, if found. Return null, if not found
   */
  search_byName( name ) {
    let namedRangeMap = this.namedRangeMap;
    let namedRange = namedRangeMap.get( name ); // 1. Search fast.
    if ( namedRange )
      return namedRange;

    // 2. Search slowly (and build fast search map incrementally).
    let namedRangeArray = this.namedRangeArray;
    let namedRangeArrayIndexNext = this.namedRangeArrayIndexNext;
    let namedRangeName;
    while ( namedRangeArrayIndexNext < namedRangeArray.length ) {
      namedRange = namedRangeArray[ namedRangeArrayIndexNext ];
      namedRangeName = namedRange.getName();
      namedRangeMap.set( namedRangeName, namedRange ); // build fast search map.

      ++namedRangeArrayIndexNext;
      this.namedRangeArrayIndexNext = namedRangeArrayIndexNext;

      if ( namedRangeName == name ) {
        return namedRange;
      }
    }
    return null;
  }

}

/** The only instance of the GlobalNamedRanges. */
GlobalNamedRanges.Singleton = new GlobalNamedRanges();
