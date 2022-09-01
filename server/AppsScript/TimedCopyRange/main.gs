/**
 * @OnlyCurrentDoc
 */

const RANGE_NAME_SOURCE = "NamedRangeSource";
const RANGE_NAME_TARGET = "NamedRangeTarget";

/** Copy the values from source (NamedRange) to target (NamedRange).
 * @return {boolean} Return true, if sucess. Return false, if failed.
 */
function NamedRange_copy_from_source_to_target() {

  //let spreadsheet = SpreadsheetApp.getActive();
  let sourceRange = range_getByName( RANGE_NAME_SOURCE );
  if ( !sourceRange ) {
    return false;
  }

  let targetRange = range_getByName( RANGE_NAME_TARGET );
  if ( !targetRange ) {
    return false;
  }

  sourceRange.copyTo( targetRange, SpreadsheetApp.CopyPasteType.PASTE_VALUES, false );

  return true;
}

/** */
function dummy() {

}

/** */
function onOpen() {
  let ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
    .addItem( "Copy range", "NamedRange_copy_from_source_to_target" )
    // .addSubMenu(
    //   ui.createMenu( "Sub menu" )
    //     .addItem( "Sub item1", "dummy" )
    // )
    .addToUi();
}

/**
 * @param {string} name
 *   The name of the NameRange to be found.
 *
 * @return {Range}
 *   If not found, return null (and log and display errror message).
 */
function range_getByName( name ) {
  let spreadsheet = SpreadsheetApp.getActive();
  let range = spreadsheet.getRangeByName( name );
  if ( !range ) {
    let msg = `NamedRange "${name}" not found.`;
    console.error( msg );
    SpreadsheetApp.getUi().alert( msg );
    return null;
  }
  return range;
}
