/**
 * @OnlyCurrentDoc
 */

const RANGE_NAME_SOURCE = "NamedRangeSource";
const RANGE_NAME_TARGET = "NamedRangeTarget";

/** Copy the values from source (NamedRange) to target (NamedRange).
 * @return {boolean} Return true, if sucess. Return false, if failed.
 */
function NamedRange_copy_from_source_to_target() {

//!!! (2022/09/01 Remarked) Use getRangeByName() instead.
//   let sourceNamedRange = GlobalNamedRanges.Singleton.search_byName( RANGE_NAME_SOURCE );
//   if ( !sourceNamedRange ) {
//     console.error( `Source NamedRange "${RANGE_NAME_SOURCE}" not found.` );
//     return false;
//   }
//
//   let targetNamedRange = GlobalNamedRanges.Singleton.search_byName( RANGE_NAME_TARGET );
//   if ( !targetNamedRange ) {
//     console.error( `Target NamedRange "${RANGE_NAME_TARGET}" not found.` );
//     return false;
//   }
//
//   sourceNamedRange.getRange().copyTo( targetNamedRange.getRange(),
//     SpreadsheetApp.CopyPasteType.PASTE_VALUES, false );


  let spreadsheet = SpreadsheetApp.getActive();
  let sourceRange = spreadsheet.getRangeByName( RANGE_NAME_SOURCE );
  if ( !sourceRange ) {
    console.error( `Source NamedRange "${RANGE_NAME_SOURCE}" not found.` );
    return false;
  }

  let targetRange = spreadsheet.getRangeByName( RANGE_NAME_TARGET );
  if ( !targetRange ) {
    console.error( `Target NamedRange "${RANGE_NAME_TARGET}" not found.` );
    return false;
  }

  sourceRange.copyTo( targetRange, SpreadsheetApp.CopyPasteType.PASTE_VALUES, false );

  return true;
}
