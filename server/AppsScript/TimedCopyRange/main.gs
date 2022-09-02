/** @OnlyCurrentDoc */

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

/** When timer triggered. */
function timer_onTime_( e ) {
  let [ fetcherCopierCounter,
    fetcherCopierCounterDivisor, fetcherCopierCounterRemainder,
    fetcherCounterRemainder, copierCounterRemainder ]
    = ranges_getByNames_(
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER_DIVISOR,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.FETCHER.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.COPIER.TIMER.COUNTER_REMAINDER,
    );

  let timerExecutionCount = property_timerExecutionCount_inc_();
  fetcherCopierCounter.setValue( timerExecutionCount );

  let counterRemainder = timerExecutionCount % fetcherCopierCounterDivisor.getValue();
  fetcherCopierCounterRemainder.setValue( counterRemainder );

  if ( fetcherCounterRemainder.getValue() == counterRemainder )
    fetcherTimer_onTime_( e );

  if ( copierCounterRemainder.getValue() == counterRemainder )
    copierTimer_onTime_( e );
}

/** When fetcher's timer triggered. */
function fetcherTimer_onTime_( e ) {
  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.FETCHER.TIMER.LAST_TIME );

  let [ fetcherGA4PropertyId, fetcherResult ]
    = ranges_getByNames_( RANGE_NAME.FETCHER.GA4_PROPERTY_ID, RANGE_NAME.FETCHER.RESULT );

//!!! ...unfinished... (2022/09/02) fetch data
}

/** When copier's timer triggered. */
function copierTimer_onTime_( e ) {
  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.COPIER.TIMER.LAST_TIME );
  NamedRange_copy_from_source_to_target_();
}

/** Install all triggers of this script. */
function triggersAll_install_() {
  let [ fetcherCopierEveryMinutes, fetcherCopierEveryHours,
    fetcherCopierCounter, fetcherCopierCounterDivisor, fetcherCopierCounterRemainder,
    fetcherCounterRemainder, fetcherTimerLastTime, fetcherGA4PropertyId, fetcherResult,
    copierCounterRemainder, copierTimerLastTime, copierSourceName, copierTargetName ]
    = ranges_getByNames_(
      RANGE_NAME.FETCHER_COPIER.TIMER.EVERY_MINUTES,
      RANGE_NAME.FETCHER_COPIER.TIMER.EVERY_HOURS,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER_DIVISOR,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.FETCHER.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.FETCHER.TIMER.LAST_TIME,
      RANGE_NAME.FETCHER.GA4_PROPERTY_ID, RANGE_NAME.FETCHER.RESULT,
      RANGE_NAME.COPIER.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.COPIER.TIMER.LAST_TIME,
      RANGE_NAME.COPIER.SOURCE_NAME, RANGE_NAME.COPIER.TARGET_NAME );

  triggersAll_uninstall_();
  property_deleteAll_();

  let timerBuilder = ScriptApp.newTrigger( "timer_onTime_" ).timeBased();
  if ( !fetcherCopierEveryMinutes.isBlank() )
    timerBuilder.everyMinutes( fetcherCopierEveryMinutes.getValue() )
      .create();
  else
    timerBuilder.everyMinutes( fetcherCopierEveryHours.getValue() )
      .create();
}

/** Uninstall all triggers of this script. */
function triggersAll_uninstall_() {
  let spreadsheet = SpreadsheetApp.getActive();
  let triggers = ScriptApp.getUserTriggers( spreadsheet );
  for ( let i = 0; i < triggers.length; ++i )
    ScriptApp.deleteTrigger( triggers[ i ] );
}

/** Clear all DocumentProperties.  */
function property_deleteAll_() {
  PropertiesService.getDocumentProperties().deleteAllProperties();
}

/**
 * @return {number} Increase counter by one, and return the incresed count.
 */
function property_timerExecutionCount_inc_() {
  let documentProperties = PropertiesService.getDocumentProperties();
  let timerExecutionCount = documentProperties.getProperty( PROPERTY_NAME_TIMER_EXECUTION_COUNT );
  if ( timerExecutionCount == undefined )
    timerExecutionCount = 0;

  ++timerExecutionCount;
  documentProperties.setProperty( PROPERTY_NAME_TIMER_EXECUTION_COUNT, timerExecutionCount );
  return timerExecutionCount;
}

/** Copy the values from source (NamedRange) to target (NamedRange). */
function NamedRange_copy_from_source_to_target_() {
  let [ copierSourceName, copierTargetName ] = ranges_getByNames_(
    RANGE_NAME.COPIER.SOURCE_NAME, RANGE_NAME.COPIER.TARGET_NAME );

  let [ copierSource, copierTarget ] = ranges_getByNames_(
    copierSourceName.getValue(), copierTargetName.getValue() );

  copierSource.copyTo( copierTarget, SpreadsheetApp.CopyPasteType.PASTE_VALUES, false );
}

/**
 * @param {Object} e          Time-driven event object.
 * @param {string} rangeName  The target cell to record the time.
 */
function EventObject_Timer_recordTo_byRangeName_( e, rangeName ) {
  let [ range ] = ranges_getByNames_( rangeName );
  let msg = EventObject_Timer_toString_( e );
  range.setValue( msg );
}

/**
 * @param {Object} e  Time-driven event object.
 * @return {string} Return the time string.
 */
function EventObject_Timer_toString_( e ) {
  let str = `${e.year}/${e.month}/${e['day-of-month']} ${e.hour}:${e.minute}:${e.second}`;
  return str;
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
