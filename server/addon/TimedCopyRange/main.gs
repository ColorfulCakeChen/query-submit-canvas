/**
 * @OnlyCurrentDoc
 */

const RANGE_NAME_SOURCE = "NamedRangeSource";
const RANGE_NAME_TARGET = "NamedRangeTarget";

/** Copy the values from source (NamedRange) to target (NamedRange).
 * @return {boolean} Return true, if sucess. Return false, if failed.
 */
function NamedRange_copy_from_source_to_target() {
  let sourceNamedRange = GlobalNamedRanges.Singleton.search_byName( RANGE_NAME_SOURCE );
  if ( !sourceNamedRange ) {
    console.log( `Source NamedRange "${RANGE_NAME_SOURCE}" not found.` );
    return false;
  }

  let targetNamedRange = GlobalNamedRanges.Singleton.search_byName( RANGE_NAME_TARGET );
  if ( !targetNamedRange ) {
    console.log( `Target NamedRange "${RANGE_NAME_TARGET}" not found.` );
    return false;
  }

  sourceNamedRange.getRange().copyTo( targetNamedRange.getRange(),
    SpreadsheetApp.CopyPasteType.PASTE_VALUES, false );
  return true;
}
