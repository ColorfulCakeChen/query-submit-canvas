/** @OnlyCurrentDoc */

/** */
function forDebug() {
  //NamedRange_copy_from_source_to_target_( true );
  //NamedRange_copy_from_source_to_target_( false );
}

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
  ] = ranges_getByNames_(
      RANGE_NAME.FC.TIMER.COUNTER,
      RANGE_NAME.FC.TIMER.COUNTER_DIVISOR,
      RANGE_NAME.FC.TIMER.COUNTER_REMAINDER,
      RANGE_NAME.FC.FETCHER.TIMER.AT_REMAINDER,
    );

  EventObject_Timer_recordTo_byRangeName_( e, RANGE_NAME.FC.TIMER.LAST_TIME );

  let fetcherCopierTimerCounterValue = range_value_inc_( fetcherCopierTimerCounter );
  let divisor = fetcherCopierTimerCounterDivisor.getValue();
  let counterRemainder = fetcherCopierTimerCounterValue % divisor;
  fetcherCopierTimerCounterRemainder.setValue( counterRemainder );

  if ( counterRemainder == fetcherTimerAtRemainder.getValue() )
    fetcherTimer_onTime_( e );
}

/** When fetcher's timer triggered. */
function fetcherTimer_onTime_( e ) {
  const funcNameInMessage = fetcherTimer_onTime_.name;
  console.log( `${funcNameInMessage}()` );

//!!! (2023/07/26 Remarked)
// This check may result in fetcher never works if copier failed to delete itself.
//
//   // 0. If copierTimer still exists, do not run this fetcherTimer (which
//   //    will generate another copierTimer) again.
//   {
//     const trigger = UserTriggers_get_first_by_HandlerFunctionName_(
//       copierTimer_onTime_.name );
//     if ( trigger ) {
//       console.log( `Do nothing because trigger `
//         + `"${copierTimer_onTime_.name}" not yet executed.` );
//       return;
//     }
//   }

  // 0. Remove all pending copier.
  //
  // Q: Why delete copier here?
  // A: Sometimes, copier may fail to remove itself. So, here try to delete
  //    them by function name. Another possible case is that the copier is
  //    too to be executed. In this case, here also deletes (i.e. gives up)
  //    the copier because a new fetcher begins.
  {
    const triggerHandlerFunctionName = copierTimer_onTime_.name;
    let bRemoved = UserTriggers_delete_all_by_HandlerFunctionName_(
      triggerHandlerFunctionName );
    if ( bRemoved )
      console.log( `Remove trigger "${triggerHandlerFunctionName}".` );
  }

  // 1. Record when executed.
  EventObject_Timer_recordTo_byRangeName_(
    e, RANGE_NAME.FC.FETCHER.TIMER.LAST_TIME );

  const [ fetcherTimerCounter,
    copierTimerAfterSeconds ] = ranges_getByNames_(
    RANGE_NAME.FC.FETCHER.TIMER.COUNTER,
    RANGE_NAME.FC.COPIER.TIMER.AFTER_SECONDS );

  // 2. Record how many times executed.
  range_value_inc_( fetcherTimerCounter );

  // 3. Create timer for copying ranges.
  //
  // Note: Assume the heavy calculation (triggered by the report
  //       generating in the later (i.e. after this copying timer created))
  //       will complete after the copierTimerAfterSeconds.
  {
    const triggerHandlerFunctionName = copierTimer_onTime_.name;
    const afterSeconds = copierTimerAfterSeconds.getValue();
    const afterMilliseconds = afterSeconds * 1000;
    let timerBuilder = ScriptApp.newTrigger( triggerHandlerFunctionName )
      .timeBased();
    timerBuilder.after( afterMilliseconds ).create();
    console.log( `Schedule "${triggerHandlerFunctionName}" after `
      + `${afterMilliseconds} milliseconds.` );
  }

  // 4. Generate report.
  //
  // Q: Why generating report after copier timer scheduled?
  // A: So that this Apps Script needs not wait the heavy calculation
  //    (which is triggered by set generationShouldCalculateRange to
  //    true at the end of the report generating) to finish.
  GA4_run_report_();
}

/** When copier's timer triggered. */
function copierTimer_onTime_( e ) {
  const funcNameInMessage = copierTimer_onTime_.name;
  console.log( `${funcNameInMessage}()` );

  try {
    // 1. Copy ranges.
    //
    // Copying (and disable recalculation) before any other writing. Otherwise,
    // the writing will trigger another heavy recalculation.
    NamedRange_copy_from_source_to_target_();

    // 2. Record when executed.
    EventObject_Timer_recordTo_byRangeName_(
      e, RANGE_NAME.FC.COPIER.TIMER.LAST_TIME );

    let [ copierTimerCounter ] = ranges_getByNames_(
      RANGE_NAME.FC.COPIER.TIMER.COUNTER );

    // 3. Record how many times executed.
    range_value_inc_( copierTimerCounter );

  } finally {

    // 4. Remove this timer to avoid this one-time timer left in list.
    //
    // Even if some exception happends in the above operations, the removing
    // should still be done. Otherwise, fetcherTimer_onTime_() will always
    // be blocked.
    //
    // Note: Unfortunately, this removing operation may also be failed by
    //       itself.
    const triggerUid = e?.triggerUid;
    UserTriggers_delete_first_by_triggerUid_( triggerUid );
    console.log( `Remove trigger with triggerUid ( ${triggerUid} ).` );
  }
}

/**
 * - Run a GA4 report to fetch data.
 * - Activate recalculation.
 * - Schedule timer for copying ranges.
 */
function GA4_run_report_() {
  const [ generationShouldCalculateRangeName ] = ranges_getByNames_(
    RANGE_NAME.FC.GENERATION.SHOULD.CALCULATE.RANGE_NAME );

  const generationShouldCalculateRangeNameString
    = generationShouldCalculateRangeName.getValue();

  const [ generationShouldCalculateRange ] = ranges_getByNames_(
    generationShouldCalculateRangeNameString );

  // 1.
  //GA4_run_core_report_();
  GA4_run_realtime_report_()

  // 2. Activate recalculation after GA4 report got.
  generationShouldCalculateRange.setValue( true );
  console.log( `Calculation activated.` );
}

/**
 * Deactivate recalculation. And copy the values from source (NamedRange)
 * to target (NamedRange).
 *
 * @param {boolean} bCopyOnlyIfTargetBlank
 *   If true (mainly used by timer_start_()):
 *     - Activate calculation before copying.
 *     - Copy source to target only if the target is totally blank.
 */
function NamedRange_copy_from_source_to_target_( bCopyOnlyIfTargetBlank ) {

  // 0.
  //
  // Note: It seems SpreadsheetApp.flush() will be called automatically
  //       whenever SpreadsheetApp.getRangeByName() or Range.getValue() (but
  //       not Range.copyTo()) or Range.isBlank() is called. In order to
  //       reduce unnecessary recalculation, getting these before activating
  //       recalculation.

  // 0.1
  let [ generationShouldCalculateRangeName,
    copierSourceRangeNames, copierTargetRangeNames ] = ranges_getByNames_(
    RANGE_NAME.FC.GENERATION.SHOULD.CALCULATE.RANGE_NAME,
    RANGE_NAME.FC.COPIER.SOURCE.RANGE_NAMES,
    RANGE_NAME.FC.COPIER.TARGET.RANGE_NAMES );

  // 0.2 Flag for calculating or not.
  const generationShouldCalculateRangeNameString
    = generationShouldCalculateRangeName.getValue();

  const [ generationShouldCalculateRange ] = ranges_getByNames_(
    generationShouldCalculateRangeNameString );

  // 0.3 Range names of source and target.
  let sourceRangeNamesString = copierSourceRangeNames.getValue();
  let sourceRangeNames = sourceRangeNamesString.split( "\," );

  let targetRangeNamesString = copierTargetRangeNames.getValue();
  let targetRangeNames = targetRangeNamesString.split( "\," );

  // 0.4 Collect all source and target ranges.
  let sourceRangeArray = new Array( sourceRangeNames.length );
  let targetRangeArray = new Array( sourceRangeNames.length );
  for ( let i = 0; i < sourceRangeNames.length; ++i ) {
    let sourceRangeName = sourceRangeNames[ i ]
      = sourceRangeNames[ i ].trim();
    let targetRangeName = targetRangeNames[ i ]
      = targetRangeNames[ i ].trim();
    let [ sourceRange, targetRange ] = ranges_getByNames_(
      sourceRangeName, targetRangeName );
    sourceRangeArray[ i ] = sourceRange;
    targetRangeArray[ i ] = targetRange;
  }

  // 1. If requested, activate calculating just before copying.
  if ( bCopyOnlyIfTargetBlank ) {
    generationShouldCalculateRange.setValue( true );
    console.log( `Calculation activated.` );

    // Note: Here needs not call SpreadsheetApp.flush() because the
    //       following Range.isBlank() will flush automatically.
  }

  // 2. Collect all source and target ranges.
  //
  // This should be after the (above) recalculation activated because
  // the recalculation affects whether source range is blank.
  for ( let i = 0; i < sourceRangeArray.length; ++i ) {
    const sourceRange = sourceRangeArray[ i ];
    const targetRange = targetRangeArray[ i ];

    if ( sourceRange.isBlank() )
      sourceRangeArray[ i ] = null; // Do not copy blank source.

    if ( bCopyOnlyIfTargetBlank )
      if ( !targetRange.isBlank() )
        targetRangeArray[ i ] = null; // Do not overwrite non-blank target.
  }

  // 3. Prevent from recalculation after ranges copied.
  //
  // Because both Range.setValue() and Range.copyTo() seem not trigger
  // flush, deactivate calculating before Range.copyTo(). Although this
  // looks strange, it may prevent from unnecessary calculation after
  // ranges copied.
  //
  generationShouldCalculateRange.setValue( false );
  console.log( `Calculation deactivated.` );

  // Note: Do not call SpreadsheetApp.flush() or Range.getValue() or
  //       Range.isBlank() or SpreadsheetApp.getRangeByName() here.
  //       Otherwise, there will be nothing can be copied because they
  //       all accomplish the above Range.setValue().

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

    const sourceRangeName = sourceRangeNames[ i ];
    const targetRangeName = targetRangeNames[ i ];
    console.log( `Copy from "${sourceRangeName}" to `
      + `"${targetRangeName}".` );
  }
}

/** Install all triggers of this script. */
function timer_start_() {
  // Note: Although not all range names will be used here, getting them
  //       could confirm whether they are defined.
  let [ fetcherCopierEveryMinutes, fetcherCopierEveryHours,
    fetcherCopierTimerLastTime, fetcherCopierTimerCounter,
    fetcherCopierTimerCounterDivisor, fetcherCopierTimerCounterRemainder,
    fetcherTimerAtRemainder,
    fetcherTimerLastTime, fetcherTimerCounter,
    fetcherGA4PropertyId,
    fetcherGA4ItemNameInListFilterRangeName,
    fetcherGA4ReportHeadersRangeName, fetcherGA4ReportRowsRangeName,
    copierTimerAfterSeconds, copierTimerLastTime, copierTimerCounter,
    copierSourceRangeNames, copierTargetRangeNames,
    generationShouldCalculateRangeName ] = ranges_getByNames_(
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
      RANGE_NAME.FC.COPIER.TIMER.AFTER_SECONDS,
      RANGE_NAME.FC.COPIER.TIMER.LAST_TIME,
      RANGE_NAME.FC.COPIER.TIMER.COUNTER,
      RANGE_NAME.FC.COPIER.SOURCE.RANGE_NAMES,
      RANGE_NAME.FC.COPIER.TARGET.RANGE_NAMES,
      RANGE_NAME.FC.GENERATION.SHOULD.CALCULATE.RANGE_NAME );

  timer_stop_();

  fetcherCopierTimerLastTime.clearContent();

  // (2022/09/04 Remarked) Let user can specify its initial value.
  //fetcherCopierTimerCounter.clearContent();

  fetcherCopierTimerCounterRemainder.clearContent();

  fetcherTimerLastTime.clearContent();
  fetcherTimerCounter.clearContent();
  copierTimerLastTime.clearContent();
  copierTimerCounter.clearContent();

  // If copier target isBlank, activate calculation and copy from source
  // to target immediately.
  NamedRange_copy_from_source_to_target_( true );

  // Install trigger timer_onTime_().
  UserTriggers_create_by_everyMinutes_or_everyHours_(
    timer_onTime_.name );
}

/** Uninstall all triggers of this script of this user. */
function timer_stop_() {
  UserTriggers_delete_all_();
  console.log( `Timer stopped.` );
}

/**
 * @param {Object} e          Time-driven event object.
 * @param {string} rangeName  The target cell to record the time.
 */
function EventObject_Timer_recordTo_byRangeName_( e, rangeName ) {
  if ( !e )
    return; // No (time-driven) event to be recorded.
  let [ range ] = ranges_getByNames_( rangeName );
  let msg = EventObject_Timer_toString_( e );
  range.setValue( msg );
}

/**
 * @param {Object} e  Time-driven event object.
 * @return {string} Return the time string.
 */
function EventObject_Timer_toString_( e ) {
  let str = `${e.year}/${e.month}/${e['day-of-month']} `
    + `${e.hour}:${e.minute}:${e.second}`;
  return str;
}

/**
 * @param {Range} range  The range's value will be increased.
 * @return {number}
 *   Increase range's value by one, and return the increased value.
 */
function range_value_inc_( range ) {
  let value;
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
 * @return {Range[]}
 *   If all names found, return an array of Range object.
 */
function ranges_getByNames_( ...names ) {
  let spreadsheet = SpreadsheetApp.getActive();
  let ranges = new Array( names.length );
  for ( let i = 0; i < names.length; ++i )
    if ( !( ranges[ i ] = spreadsheet.getRangeByName( names[ i ] ) ) )
      throw Error( `NamedRange "${names[ i ]}" not found.` );
  return ranges;
}
