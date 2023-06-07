/** @OnlyCurrentDoc */

/** */
function onOpen() {
  let ui = SpreadsheetApp.getUi();
  ui.createAddonMenu()
    .addItem( "Fetch data", "GA4_run_report_" )
    .addItem( "Copy ranges", "NamedRange_copy_from_source_to_target_" )
    .addItem( "Timer start", "timer_start_" )
    .addItem( "Timer stop", "timer_stop_" )
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
      RANGE_NAME.FC.TIMER.COUNTER,
      RANGE_NAME.FC.TIMER.COUNTER_DIVISOR,
      RANGE_NAME.FC.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.FC.FETCHER.TIMER.AT_REMAINDER,
      RANGE_NAME.FC.COPIER.TIMER.AT_REMAINDER,
    );

  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.FC.TIMER.LAST_TIME );

  let fetcherCopierTimerCounterValue = range_value_inc_( fetcherCopierTimerCounter );
  let divisor = fetcherCopierTimerCounterDivisor.getValue();
  let counterRemainder = fetcherCopierTimerCounterValue % divisor;
  fetcherCopierTimerCounterRemainder.setValue( counterRemainder );

  if ( counterRemainder == fetcherTimerAtRemainder.getValue() )
    fetcherTimer_onTime_( e );

  if ( counterRemainder == copierTimerAtRemainder.getValue() )
    copierTimer_onTime_( e );
}

/** When fetcher's timer triggered. */
function fetcherTimer_onTime_( e ) {
  console.log( `fetcherTimer_onTime_()` );
  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.FC.FETCHER.TIMER.LAST_TIME );

  let [ fetcherTimerCounter ] = ranges_getByNames_(
    RANGE_NAME.FC.FETCHER.TIMER.COUNTER );

  range_value_inc_( fetcherTimerCounter );

  GA4_run_report_();
}

/** When copier's timer triggered. */
function copierTimer_onTime_( e ) {
  console.log( `copierTimer_onTime_()` );
  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.FC.COPIER.TIMER.LAST_TIME );

  let [ copierTimerCounter ] = ranges_getByNames_(
    RANGE_NAME.FC.COPIER.TIMER.COUNTER );

  range_value_inc_( copierTimerCounter );

  NamedRange_copy_from_source_to_target_();
}

/**
 * Run a GA4 report to fetch data. And activate re-calculation.
 */
function GA4_run_report_() {
  // 1.
  //GA4_run_core_report_();
  GA4_run_realtime_report_()

  // 2. Activate re-calculation after GA4 report got.

  let [ generationShouldCalculateRangeName ] = ranges_getByNames_(
    RANGE_NAME.FC.GENERATION.SHOULD.CALCULATE.RANGE_NAME );

  let generationShouldCalculateRangeNameString
    = generationShouldCalculateRangeName.getValue();

  let [ generationShouldCalculateRange ] = ranges_getByNames_(
    generationShouldCalculateRangeNameString );

  generationShouldCalculateRange.setValue( true );
}

/**
 * Deactivate re-calculation. And copy the values from source (NamedRange)
 * to target (NamedRange).
 *
 * @param {boolean} bCopyOnlyIfTargetBlank
 *   If true, copy a source to a target only if the target is totally blank. It is
 * mainly used by timer_start_().
 */
function NamedRange_copy_from_source_to_target( bCopyOnlyIfTargetBlank ) {

  // Note: It seems SpreadsheetApp.flush() will be called automatically
  //       whenever Range.getValue() or SpreadsheetApp.getRangeByName() is
  //       called. In order to reduce unnecessary re-calculation, getting
  //       these before activating re-calculation.
  //
  // (2023/06/07)

  let [ generationShouldCalculateRangeName,
    copierSourceRangeNames, copierTargetRangeNames ] = ranges_getByNames_(
    RANGE_NAME.FC.GENERATION.SHOULD.CALCULATE.RANGE_NAME,
    RANGE_NAME.FC.COPIER.SOURCE.RANGE_NAMES,
    RANGE_NAME.FC.COPIER.TARGET.RANGE_NAMES );

  // Flag for calculating or not.
  const generationShouldCalculateRangeNameString
    = generationShouldCalculateRangeName.getValue();

  const [ generationShouldCalculateRange ] = ranges_getByNames_(
    generationShouldCalculateRangeNameString );

  // 1. Collect all source and target range.
  let sourceRangeNamesString = copierSourceRangeNames.getValue();
  let sourceRangeNames = sourceRangeNamesString.split( "\," );

  let targetRangeNamesString = copierTargetRangeNames.getValue();
  let targetRangeNames = targetRangeNamesString.split( "\," );

  let sourceRangeArray = new Array( sourceRangeNames.length );
  let targetRangeArray = new Array( sourceRangeNames.length );
  for ( let i = 0; i < sourceRangeNames.length; ++i ) {
    let sourceRangeName = sourceRangeNames[ i ].trim();
    let targetRangeName = targetRangeNames[ i ].trim();
    let [ copierSource, copierTarget ] = ranges_getByNames_(
      sourceRangeName, targetRangeName );

    if ( bCopyOnlyIfTargetBlank )
      if ( !copierTarget.isBlank() )
        continue;

    sourceRangeArray[ i ] = copierSource;
    targetRangeArray[ i ] = copierTarget;
  }


//!!! ...unfinished... (2023/06/07 Temp Test)
  // 2. Activate calculating just before copying.
  generationShouldCalculateRange.setValue( true );

  // Because Range.copyTo() seems not trigger flush, flush explicitly
  // to complete the re-calculation.
  SpreadsheetApp.flush();


//!!! ...unfinished... (2023/06/07)
// Perhaps, should:
//   - copy from range to memory.
//   - generationShouldCalculateRange.setValue( false );
//   - SpreadsheetApp.flush();
//   - copy from memory to range.
//
// Otherwise, either too early (not yet copy) or too late (has recalculated)
// to trun off generationShouldCalculateRange.

//!!!
  //SpreadsheetApp.flush();

/*!!! ...unfinished... (2023/06/07 Temp Remarked)
  // 2. Copy from source to memory.
  let sourceValuesArray = new Array( sourceRangeArray.length );
  for ( let i = 0; i < sourceRangeArray.length; ++i ) {
    let sourceRange = sourceRangeArray[ i ];
    if ( !sourceRange )
      continue;

    let sourceColumnsRows = sourceRange.getValues();

//!!! ...unfinished... (2023/06/07 Temp Test) get twice whether different.
//    sourceColumnsRows = sourceRange.getValues();

//!!! ...unfinished... (2023/06/07)
    { // Check cell content length.
      for ( let rowId= 0; rowId < sourceColumnsRows.length; ++rowId ) {
        let sourceColumns = sourceColumnsRows[ rowId ];

        for ( let columnId = 0; columnId < sourceColumns.length; ++columnId ) {
          let cellValue = sourceColumns[ columnId ];
          if ( typeof( cellValue ) === "string" ) {
            let cellLength = cellValue.length;
            console.log( `(rowId, columnId)=( ${rowId}, ${columnId} ), `
              + `cellLength=${cellLength}.` );

            if ( cellLength > 50000 ) {
              debugger;
            }
          }

        }
      }
    }

    sourceValuesArray[ i ] = sourceColumnsRows;
  }
*/


//!!! (2023/06/07 Temp Test) Turn off before copy.
  // 3. Prevent re-calculation after ranges copied.
  //
  // Because both Range.setValue() and Range.copyTo() seems not trigger
  // flush, deactivate calculating before Range.copyTo(). Although this
  // looks strange, it may prevent from unnecessary calculation after
  // ranges copied.
  //
  generationShouldCalculateRange.setValue( false );
  //SpreadsheetApp.flush();

//!!! ...unfinished... (2023/06/07 Temp Test) Copy directly.
  // 4. Copy ranges directly.
  for ( let i = 0; i < sourceRangeArray.length; ++i ) {
    let sourceRange = sourceRangeArray[ i ];
    if ( !sourceRange )
      continue;
    let targetRange = targetRangeArray[ i ];
    if ( !targetRange )
      continue;
    sourceRange.copyTo(
      targetRange, SpreadsheetApp.CopyPasteType.PASTE_VALUES, false );
  }

/*!!!
  SpreadsheetApp.flush();

  // 3. Prevent re-calculation after ranges copied.
  generationShouldCalculateRange.setValue( false );

//!!!
  //SpreadsheetApp.flush();

//!!! ...unfinished... (2023/06/07 Temp Remarked)
  // 4. Copy from memory to source.
  for ( let i = 0; i < targetRangeArray.length; ++i ) {
    let sourceValues = sourceValuesArray[ i ];
    if ( !sourceValues )
      continue;
    let targetRange = targetRangeArray[ i ];
    if ( !targetRange )
      continue;
    targetRange.setValues( sourceValues );
  }
*/
}

/** Install all triggers of this script. */
function timer_start_() {
  let [ fetcherCopierEveryMinutes, fetcherCopierEveryHours,
    fetcherCopierTimerLastTime, fetcherCopierTimerCounter,
    fetcherCopierTimerCounterDivisor, fetcherCopierTimerCounterRemainder,
    fetcherTimerAtRemainder, fetcherTimerLastTime, fetcherTimerCounter,
    fetcherGA4PropertyId,
    fetcherGA4ItemNameInListFilterRangeName,
    fetcherGA4ReportHeadersRangeName, fetcherGA4ReportRowsRangeName,
    copierTimerAtRemainder, copierTimerLastTime, copierTimerCounter,
    copierSourceRangeNames, copierTargetRangeNames ]
    = ranges_getByNames_(
      RANGE_NAME.FC.TIMER.EVERY_MINUTES,
      RANGE_NAME.FC.TIMER.EVERY_HOURS,
      RANGE_NAME.FC.TIMER.LAST_TIME,
      RANGE_NAME.FC.TIMER.COUNTER,
      RANGE_NAME.FC.TIMER.COUNTER_DIVISOR,
      RANGE_NAME.FC.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.FC.FETCHER.TIMER.AT_REMAINDER,
      RANGE_NAME.FC.FETCHER.TIMER.LAST_TIME,
      RANGE_NAME.FC.FETCHER.TIMER.COUNTER,
      RANGE_NAME.FC.FETCHER.GA4.PROPERTY_ID,
      RANGE_NAME.FC.FETCHER.GA4.ITEM_NAME_IN_LIST_FILTER.RANGE_NAME,
      RANGE_NAME.FC.FETCHER.GA4.REPORT.HEADERS.RANGE_NAME,
      RANGE_NAME.FC.FETCHER.GA4.REPORT.ROWS.RANGE_NAME,
      RANGE_NAME.FC.COPIER.TIMER.AT_REMAINDER,
      RANGE_NAME.FC.COPIER.TIMER.LAST_TIME,
      RANGE_NAME.FC.COPIER.TIMER.COUNTER,
      RANGE_NAME.FC.COPIER.SOURCE.RANGE_NAMES, RANGE_NAME.FC.COPIER.TARGET.RANGE_NAMES );

  timer_stop_();

  fetcherCopierTimerLastTime.clearContent();

  // (2022/09/04 Remarked) Let user can specify its initial value.
  //fetcherCopierTimerCounter.clearContent();

  fetcherCopierTimerCounterRemainder.clearContent();
  fetcherTimerLastTime.clearContent();
  fetcherTimerCounter.clearContent();
  copierTimerLastTime.clearContent();
  copierTimerCounter.clearContent();

//!!! ...unfinished... (2023/06/07)
// It seems should Re-calculate and then copy.
// Otherswise, nothing can be copied.
  // If copier target isBlank, copy from source to target immediately.
  NamedRange_copy_from_source_to_target_( true );

  let timerBuilder = ScriptApp.newTrigger( "timer_onTime_" ).timeBased();
  if ( !fetcherCopierEveryMinutes.isBlank() )
    timerBuilder.everyMinutes( fetcherCopierEveryMinutes.getValue() )
      .create();
  else
    timerBuilder.everyHours( fetcherCopierEveryHours.getValue() )
      .create();
}

/** Uninstall all triggers of this script. */
function timer_stop_() {
  let triggers = ScriptApp.getUserTriggers( SpreadsheetApp.getActive() );
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
