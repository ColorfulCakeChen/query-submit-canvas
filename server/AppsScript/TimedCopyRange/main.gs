/** @OnlyCurrentDoc */

const RANGE_NAME_SOURCE = "NamedRangeSource";
const RANGE_NAME_TARGET = "NamedRangeTarget";

/** */
function onOpen() {
  let ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
    .addItem( "Copy range", "NamedRange_copy_from_source_to_target_" )
    .addItem( "Triggers install", "triggersAll_install_" )
    .addItem( "Triggers uninstall", "triggersAll_uninstall_" )
    // .addSubMenu(
    //   ui.createMenu( "Sub menu" )
    //     .addItem( "Sub item1", "dummy" )
    // )
    .addToUi();
}

/** Install all triggers of this script. */
function triggersAll_install_() {
  let spreadsheet = SpreadsheetApp.getActive()
  // ScriptApp.newTrigger().timeBased().

//!!! ...unfinished... (2022/09/02)
}

/** Uninstall all triggers of this script. */
function triggersAll_uninstall_() {
  let spreadsheet = SpreadsheetApp.getActive()
  let triggers = ScriptApp.getUserTriggers( spreadsheet );
  for ( let i = 0; i < triggers.length; ++i )
    ScriptApp.deleteTrigger( triggers[ i ] );
}

/** Copy the values from source (NamedRange) to target (NamedRange).
 * @return {boolean} Return true, if sucess. Return false, if failed.
 */
function NamedRange_copy_from_source_to_target_() {

  //let spreadsheet = SpreadsheetApp.getActive();
  let [ sourceRange, targetRange ]
    = ranges_getByNames_( RANGE_NAME_SOURCE, RANGE_NAME_TARGET );
  sourceRange.copyTo( targetRange, SpreadsheetApp.CopyPasteType.PASTE_VALUES, false );

  return true;
}

/**
 * @param {string[]} names  The names of the NameRange to be found.
 * @throw {Error}           If one of names not found, throw exception.
 * @return {Range[]}        If all names found, return an array of Range object.
 */
function ranges_getByNames_( ...names ) {
  let spreadsheet = SpreadsheetApp.getActive();
  let ranges = new Array( names.length );
  for ( let i = 0; i < names.length; ++i )
    if ( !( ranges[ i ] = spreadsheet.getRangeByName( names[ i ] ) ) )
      throw Error( `NamedRange "${names[ i ]}" not found.` );
  return ranges;
}
