const RANGE_NAME_SOURCE = "NamedRangeSource";
const RANGE_NAME_TARGET = "NamedRangeTarget";

/**
 * @param {string} name  The name of NameRange to be searched.
 * @return {NamedRange} Return NameRange, if found. Return null, if not found
 */
function NamedRange_search_byName( name ) {
  let spreadsheet = SpreadsheetApp.getActive();
  let namedRangeArray = spreadsheet.getNamedRanges();

  let namedRange;
  for ( let i = 0; i < namedRangeArray.length; ++i ) {
    namedRange = namedRangeArray[ i ];
    if ( namedRange.getName() == name ) {
      return namedRange;
    }
  }
  return null;
}

/** Copy the values from source (NamedRange) to target (NamedRange).
 * @return {boolean} Return true, if sucess. Return false, if failed.
 */
function NamedRange_copy_from_source_to_target() {
  let sourceNamedRange = NamedRange_search_byName( RANGE_NAME_SOURCE );
  if ( !sourceNamedRange ) {
    console.log( `Source NamedRange "${RANGE_NAME_SOURCE}" not found.` );
    return false;
  }

  let targetNamedRange = NamedRange_search_byName( RANGE_NAME_TARGET );
  if ( !targetNamedRange ) {
    console.log( `Target NamedRange "${RANGE_NAME_TARGET}" not found.` );
    return false;
  }

  sourceNamedRange.getRange().copyTo( targetNamedRange.getRange(),
    SpreadsheetApp.CopyPasteType.PASTE_VALUES, false );
  return true;
}
