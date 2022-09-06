/** @OnlyCurrentDoc */

/** */
function onOpen() {
  let ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
    .addItem( "Fetch data", "GA4_run_report_" )
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

  let fetcherCopierTimerCounterValue = range_value_inc_( fetcherCopierTimerCounter );
  let counterRemainder = fetcherCopierTimerCounterValue % fetcherCopierTimerCounterDivisor.getValue();
  fetcherCopierTimerCounterRemainder.setValue( counterRemainder );

  if ( counterRemainder == fetcherTimerAtRemainder.getValue() )
    fetcherTimer_onTime_( e );

  if ( counterRemainder == copierTimerAtRemainder.getValue() )
    copierTimer_onTime_( e );
}

/** When fetcher's timer triggered. */
function fetcherTimer_onTime_( e ) {
  console.log( `fetcherTimer_onTime_()` );
  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.FETCHER.TIMER.LAST_TIME );

  let [ fetcherTimerCounter ] = ranges_getByNames_( RANGE_NAME.FETCHER.TIMER.COUNTER );
  range_value_inc_( fetcherTimerCounter );

  GA4_run_report_();
}

/** When copier's timer triggered. */
function copierTimer_onTime_( e ) {
  console.log( `copierTimer_onTime_()` );
  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.COPIER.TIMER.LAST_TIME );

  let [ copierTimerCounter ] = ranges_getByNames_( RANGE_NAME.COPIER.TIMER.COUNTER );

  range_value_inc_( copierTimerCounter );

  NamedRange_copy_from_source_to_target_();
}

/** Run a GA4 report to fetch data. */
function GA4_run_report_() {
  let [ fetcherGA4PropertyId, fetcherResultHeaders, fetcherResultRows ]
    = ranges_getByNames_(
      RANGE_NAME.FETCHER.GA4_PROPERTY_ID,
      RANGE_NAME.FETCHER.RESULT.HEADERS, RANGE_NAME.FETCHER.RESULT.ROWS,
    );

  fetcherResultHeaders.clearContent();
  fetcherResultRows.clearContent();

  const propertyId = fetcherGA4PropertyId.getValue();

  const dimension = AnalyticsData.newDimension();
  dimension.name = 'itemName';

  const metric = AnalyticsData.newMetric();
  metric.name = "itemsPurchased"; //"itemRevenue"

  const dateRange = AnalyticsData.newDateRange();
  dateRange.startDate = "30daysAgo"; //"yesterday";
  dateRange.endDate = "yesterday";

  const request = AnalyticsData.newRunReportRequest();
  request.dimensions = [ dimension ];
  request.metrics = [ metric ];
  request.dateRanges = dateRange;

  const report = AnalyticsData.Properties.runReport( request,
    `properties/${propertyId}` );

  if ( !report.rows ) {
    console.log( "GA4_run_report_(): No rows returned." );
    return;
  }

  // Extract headers.
  {
    let resultHeaders = [ [] ];
    for ( let i = 0; i < report.dimensionHeaders.length; ++i ) {
      resultHeaders[ 0 ].push( report.dimensionHeaders[ i ].name )
    }
    for ( let i = 0; i < report.metricHeaders.length; ++i ) {
      resultHeaders[ 0 ].push( report.metricHeaders[ i ].name )
    }
    fetcherResultHeaders.setValues( resultHeaders );
  }

  // Extract rows.
  let resultRowCount = report.rows.length;
  {
    let resultRows = new Array( resultRowCount );
    for ( let rowIndex = 0; rowIndex < resultRowCount; ++rowIndex ) {
      let resultRow = resultRows[ rowIndex ];
      for ( let i = 0; i < resultRow.dimensionValues.length; ++i ) {
        resultRow.push( report.rows[ rowIndex ].dimensionValues[ i ].value );
      }
      for ( let i = 0; i < resultRow.metricValues.length; ++i ) {
        resultRow.push( report.rows[ rowIndex ].metricValues[ i ].value );
      }
      fetcherResultRows.setValues( resultRows );
    }
  }

  console.log( 'GA4_run_report_(): ${resultRowCount} rows extracted.' );
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
    fetcherGA4PropertyId, fetcherResultHeaders, fetcherResultRows,
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
      RANGE_NAME.FETCHER.GA4_PROPERTY_ID,
      RANGE_NAME.FETCHER.RESULT.HEADERS, RANGE_NAME.FETCHER.RESULT.ROWS,
      RANGE_NAME.COPIER.TIMER.AT_REMAINDER,
      RANGE_NAME.COPIER.TIMER.LAST_TIME,
      RANGE_NAME.COPIER.TIMER.COUNTER,
      RANGE_NAME.COPIER.SOURCE_NAME, RANGE_NAME.COPIER.TARGET_NAME );

  triggersAll_uninstall_();

  fetcherCopierTimerLastTime.clearContent();

  // (2022/09/04 Remarked) Let user can specify its initial value.
  //fetcherCopierTimerCounter.clearContent();

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
 * @param {Range} range  The range's value will be increased.
 * @return {number} Increase range's value by one, and return the increased value.
 */
function range_value_inc_( range ) {
  if ( range.isBlank() )
    value = 0;
  else
    value = range.getValue();

  ++value;
  range.setValue( value );
  return value;
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
