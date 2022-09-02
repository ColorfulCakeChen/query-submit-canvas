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
  let [
    fetcherCopierTimerCounter,
    fetcherCopierTimerCounterDivisor, fetcherCopierTimerCounterRemainder,
    fetcherTimerAtRemainder,
    copierTimerAtRemainder,
  ] = ranges_getByNames_(
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER_DIVISOR,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.FETCHER.TIMER.AT_REMAINDER,
      RANGE_NAME.COPIER.TIMER.AT_REMAINDER,
    );

  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.FETCHER_COPIER.TIMER.LAST_TIME );

  let timerExecutionCount = property_inc_byName_( PROPERTY_NAME.TIMER_EXECUTION_COUNT );
  fetcherCopierTimerCounter.setValue( timerExecutionCount );

  let counterRemainder = timerExecutionCount % fetcherCopierTimerCounterDivisor.getValue();
  fetcherCopierTimerCounterRemainder.setValue( counterRemainder );

  if ( counterRemainder == fetcherTimerAtRemainder.getValue() )
    fetcherTimer_onTime_( e );

  if ( counterRemainder == copierTimerAtRemainder.getValue() )
    copierTimer_onTime_( e );
}

/** When fetcher's timer triggered. */
function fetcherTimer_onTime_( e ) {
  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.FETCHER.TIMER.LAST_TIME );

  let [ fetcherTimerCounter, fetcherGA4PropertyId, fetcherResult ]
    = ranges_getByNames_(
      RANGE_NAME.FETCHER.TIMER.COUNTER,
      RANGE_NAME.FETCHER.GA4_PROPERTY_ID, RANGE_NAME.FETCHER.RESULT
    );

  let counter = property_inc_byName_( RANGE_NAME.FETCHER.TIMER.COUNTER );
  fetcherTimerCounter.setValue( counter );

//!!! ...unfinished... (2022/09/02) fetch data
}

/** When copier's timer triggered. */
function copierTimer_onTime_( e ) {
  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.COPIER.TIMER.LAST_TIME );

  let [ copierTimerCounter ] = ranges_getByNames_( RANGE_NAME.COPIER.TIMER.COUNTER );

  let counter = property_inc_byName_( RANGE_NAME.COPIER.TIMER.COUNTER );
  copierTimerCounter.setValue( counter );

  NamedRange_copy_from_source_to_target_();
}

/** Copy the values from source (NamedRange) to target (NamedRange). */
function NamedRange_copy_from_source_to_target_() {
  let [ copierSourceName, copierTargetName ] = ranges_getByNames_(
    RANGE_NAME.COPIER.SOURCE_NAME, RANGE_NAME.COPIER.TARGET_NAME );

  let [ copierSource, copierTarget ] = ranges_getByNames_(
    copierSourceName.getValue(), copierTargetName.getValue() );

  copierSource.copyTo( copierTarget, SpreadsheetApp.CopyPasteType.PASTE_VALUES, false );
}

/** Install all triggers of this script. */
function triggersAll_install_() {
  let [ fetcherCopierEveryMinutes, fetcherCopierEveryHours,
    fetcherCopierTimerLastTime, fetcherCopierTimerCounter,
    fetcherCopierTimerCounterDivisor, fetcherCopierTimerCounterRemainder,
    fetcherTimerAtRemainder, fetcherTimerLastTime, fetcherTimerCounter,
    fetcherGA4PropertyId, fetcherResult,
    copierTimerAtRemainder, copierTimerLastTime, copierTimerCounter,
    copierSourceName, copierTargetName ]
    = ranges_getByNames_(
      RANGE_NAME.FETCHER_COPIER.TIMER.EVERY_MINUTES,
      RANGE_NAME.FETCHER_COPIER.TIMER.EVERY_HOURS,
      RANGE_NAME.FETCHER_COPIER.TIMER.LAST_TIME,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER_DIVISOR,
      RANGE_NAME.FETCHER_COPIER.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.FETCHER.TIMER.AT_REMAINDER,
      RANGE_NAME.FETCHER.TIMER.LAST_TIME,
      RANGE_NAME.FETCHER.TIMER.COUNTER,
      RANGE_NAME.FETCHER.GA4_PROPERTY_ID, RANGE_NAME.FETCHER.RESULT,
      RANGE_NAME.COPIER.TIMER.AT_REMAINDER,
      RANGE_NAME.COPIER.TIMER.LAST_TIME,
      RANGE_NAME.COPIER.TIMER.COUNTER,
      RANGE_NAME.COPIER.SOURCE_NAME, RANGE_NAME.COPIER.TARGET_NAME );

  triggersAll_uninstall_();
  property_deleteAll_();

  fetcherCopierTimerLastTime.clearContent();
  fetcherCopierTimerCounter.clearContent();
  fetcherCopierTimerCounterRemainder.clearContent();
  fetcherTimerLastTime.clearContent();
  fetcherTimerCounter.clearContent();
  copierTimerLastTime.clearContent();
  copierTimerCounter.clearContent();

  let timerBuilder = ScriptApp.newTrigger( "timer_onTime_" ).timeBased();
  if ( !fetcherCopierEveryMinutes.isBlank() )
    timerBuilder.everyMinutes( fetcherCopierEveryMinutes.getValue() )
      .create();
  else
    timerBuilder.everyHours( fetcherCopierEveryHours.getValue() )
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
 * @param {string} propertyName  The name of property to be increased.
 * @return {number} Increase counter by one, and return the increased count.
 */
function property_inc_byName_( propertyName ) {
  let documentProperties = PropertiesService.getDocumentProperties();
  let value = documentProperties.getProperty( propertyName );
  if ( value == undefined )
    value = 0;
  ++value;
  documentProperties.setProperty( propertyName, value );
  return value;
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
