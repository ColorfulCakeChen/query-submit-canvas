
/** Run a GA4 realtime report to fetch data. */
function GA4_run_realtime_report_() {
  let [ fetcherGA4PropertyId,

    fetcherGA4MeasurementIdListItemIndexCur,
    fetcherGA4MeasurementIdListItemCount,
    fetcherGA4StreamIdListString,

    fetcherGA4ReportHeadersRangeName, fetcherGA4ReportRowsRangeName ]
    = ranges_getByNames_(
      RANGE_NAME.FC.FETCHER.GA4.PROPERTY_ID,

      RANGE_NAME.GA4.MEASUREMENT_ID.LIST.ITEM.INDEX.CUR,
      RANGE_NAME.GA4.MEASUREMENT_ID.LIST.ITEM.COUNT,
      RANGE_NAME.GA4.STREAM_ID.LIST.STRING,

      RANGE_NAME.FC.FETCHER.GA4.REPORT.HEADERS.RANGE_NAME,
      RANGE_NAME.FC.FETCHER.GA4.REPORT.ROWS.RANGE_NAME,
    );

  let [ reportHeadersRange, reportRowsRange ] = ranges_getByNames_(
    fetcherGA4ReportHeadersRangeName.getValue(),
    fetcherGA4ReportRowsRangeName.getValue() );

  reportHeadersRange.clearContent();
  reportRowsRange.clearContent();

  const propertyId = fetcherGA4PropertyId.getValue();

  const measurementIdListItemIndexCur
    = fetcherGA4MeasurementIdListItemIndexCur.getValue();
  const measurementIdListItemCount
    = fetcherGA4MeasurementIdListItemCount.getValue();
  const streamIdListString = fetcherGA4StreamIdListString.getValue();

  const maxRowCount = reportRowsRange.getNumRows();
  const maxColumnCount = reportRowsRange.getNumColumns();

  // Prepare the next measurement id index.
  {
    const measurementIdListItemIndexNext
      = ( measurementIdListItemIndexCur + 1 ) % measurementIdListItemCount;

    fetcherGA4MeasurementIdListItemIndexCur.setValue(
      measurementIdListItemIndexNext );

    console.log( `GA4_run_realtime_report_(): `
      + `Next measurement id index ${measurementIdListItemIndexNext}.` );
  }

  const request = {
    dimensions: [
      { name: "eventName" }, { name: "minutesAgo" }, { name: "streamId" }
    ],
    metrics: [ { name: "eventCount" } ],

    // Use default date range (i.e. the last 30 minutes) is enough.
    // minuteRanges: [
    //   {
    //     "name": "0-29 minutes ago",
    //     "startMinutesAgo": 29,
    //     "endMinutesAgo": 0,
    //   }
    // ],

    //limit: maxRowCount,
  };

  // Add in-list-filter for stream id.
  {
    let streamIdArray = streamIdListString.split( "|" );
    let streamId = streamIdArray[ measurementIdListItemIndexCur ];

    request.dimensionFilter = {
      filter: {
        fieldName: "streamId",
        inListFilter: {
          values: streamId,
          caseSensitive: true,
        },
      }
    };
  }

  const report = AnalyticsData.Properties.runRealtimeReport( request,
    `properties/${propertyId}` );

//!!! ...unfinished... (2023/02/03)
  // Extract headers.
  {
    let outputHeaders = [ [] ];
    for ( let i = 0; i < report.dimensionHeaders.length; ++i ) {
      outputHeaders[ 0 ].push( report.dimensionHeaders[ i ].name )
    }
    for ( let i = 0; i < report.metricHeaders.length; ++i ) {
      outputHeaders[ 0 ].push( report.metricHeaders[ i ].name )
    }
    reportHeadersRange.setValues( outputHeaders );
  }

  // Extract rows.
  if ( !report.rows ) {
    console.log( "GA4_run_realtime_report_(): No rows returned." );

  } else {
    let reportRowCount = report.rows.length;

    let outputRows = new Array( maxRowCount );
    let fillRowCount = Math.min( maxRowCount, reportRowCount );

    let rowIndex, columnIndex;
    for ( rowIndex = 0; rowIndex < fillRowCount; ++rowIndex ) {
      let reportRow = report.rows[ rowIndex ];
      let outputRow = outputRows[ rowIndex ] = new Array( maxColumnCount );
      columnIndex = 0;
      for ( let i = 0; i < reportRow.dimensionValues.length; ++i, ++columnIndex )
        outputRow[ columnIndex ] = reportRow.dimensionValues[ i ].value;
      for ( let i = 0; i < reportRow.metricValues.length; ++i, ++columnIndex )
        outputRow[ columnIndex ] = reportRow.metricValues[ i ].value;
    }

    const emptyColumns = new Array( maxColumnCount );
    for ( ; rowIndex < maxRowCount; ++rowIndex ) // Fill extra cells as empty.
      outputRows[ rowIndex ] = emptyColumns;

    reportRowsRange.setValues( outputRows );
    console.log( `GA4_run_realtime_report_(): ${reportRowCount} rows extracted.` );

    if ( reportRowCount > maxRowCount )
      console.error( `GA4_run_realtime_report_(): Fetcher.Result.Rows is too small. `
        + `Only ${maxRowCount} rows filled.` );
  }
}
