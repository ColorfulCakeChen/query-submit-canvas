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

/** When fetcher's timer triggered. */
function fetcherTimer_onTime_( e ) {
  let [ fetcherTimerMessage, fetcherResult ] = ranges_getByNames_(
    RANGE_NAME.FETCHER.TIMER.MESSAGE, RANGE_NAME.FETCHER.RESULT );

  let msg = `${e.year}/${e.month}/${e['day-of-month']} ${e.hour}:${e.minute}:${e.second}`;
  fetcherTimerMessage.setValue( msg );

//!!! ...unfinished... (2022/09/02) fetch data
}

/** When copier's timer triggered. */
function copierTimer_onTime_( e ) {
  let [ copierTimerMessage, copierSource, copierTarget ]
    = ranges_getByNames_( RANGE_NAME.COPIER.TIMER.MESSAGE,
      RANGE_NAME.COPIER.SOURCE, RANGE_NAME.COPIER.TARGET  );

  let msg = `${e.year}/${e.month}/${e['day-of-month']} ${e.hour}:${e.minute}:${e.second}`;
  copierTimerMessage.setValue( msg );

//!!! ...unfinished... (2022/09/02) copy data
}

/** Install all triggers of this script. */
function triggersAll_install_() {
  let [ fetcherTimerEveryDays, fetcherTimerAtHour, fetcherTimerNearMinute,
    fetcherTimerMessage, fetcherResult ] = ranges_getByNames_(
      RANGE_NAME.FETCHER.TIMER.EVERY_DAYS, RANGE_NAME.FETCHER.TIMER.AT_HOUR,
      RANGE_NAME.FETCHER.TIMER.NEAR_MINUTE, RANGE_NAME.FETCHER.TIMER.MESSAGE,
      RANGE_NAME.FETCHER.RESULT );

  let [ copierTimerEveryDays, copierTimerAtHour, copierTimerNearMinute,
    copierTimerMessage, copierSource, copierTarget ] = ranges_getByNames_(
      RANGE_NAME.COPIER.TIMER.EVERY_DAYS, RANGE_NAME.COPIER.TIMER.AT_HOUR,
      RANGE_NAME.COPIER.TIMER.NEAR_MINUTE, RANGE_NAME.COPIER.TIMER.MESSAGE,
      RANGE_NAME.COPIER.SOURCE, RANGE_NAME.COPIER.TARGET );

  triggersAll_uninstall_();

  ScriptApp.newTrigger( "fetcherTimer_onTime_" ).timeBased()
    .everyDays( fetcherTimerEveryDays.getValue() )
    .atHour( fetcherTimerAtHour.getValue() )
    .nearMinute( fetcherTimerNearMinute.getValue() )
    .create();

  ScriptApp.newTrigger( "copierTimer_onTime_" ).timeBased()
    .everyDays( copierTimerEveryDays.getValue() )
    .atHour( copierTimerAtHour.getValue() )
    .nearMinute( copierTimerNearMinute.getValue() )
    .create();
}

/** Uninstall all triggers of this script. */
function triggersAll_uninstall_() {
  let spreadsheet = SpreadsheetApp.getActive();
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
