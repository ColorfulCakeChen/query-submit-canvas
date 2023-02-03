
/** Run a GA4 core report to fetch data. */
function GA4_run_core_report_() {
  let [ fetcherGA4PropertyId,
    fetcherGA4ItemNameInListFilterRangeName,
    fetcherGA4ReportHeadersRangeName, fetcherGA4ReportRowsRangeName ]
    = ranges_getByNames_(
      RANGE_NAME.FC.FETCHER.GA4.PROPERTY_ID,
      RANGE_NAME.FC.FETCHER.GA4.ITEM_NAME_IN_LIST_FILTER.RANGE_NAME,
      RANGE_NAME.FC.FETCHER.GA4.REPORT.HEADERS.RANGE_NAME,
      RANGE_NAME.FC.FETCHER.GA4.REPORT.ROWS.RANGE_NAME,
    );

  let [ reportHeadersRange, reportRowsRange ] = ranges_getByNames_(
    fetcherGA4ReportHeadersRangeName.getValue(),
    fetcherGA4ReportRowsRangeName.getValue() );

  reportHeadersRange.clearContent();
  reportRowsRange.clearContent();

  const propertyId = fetcherGA4PropertyId.getValue();
  const maxRowCount = reportRowsRange.getNumRows();
  const maxColumnCount = reportRowsRange.getNumColumns();

  const request = {
    dimensions: [ { name: "itemName" } ],
    metrics: [ { name: "itemsPurchased" } ],
    dateRanges: {
      startDate: "yesterday",
      //startDate: "30daysAgo",
      endDate: "yesterday"
    },
    //limit: maxRowCount,
    keepEmptyRows: true, // For fetching ( itemsPurchased == 0 ) items.
  };

  // Add in-list-filter for itemName.
  if ( !fetcherGA4ItemNameInListFilterRangeName.isBlank() ) {
    let [ itemNameInListFilter ] = ranges_getByNames_(
      fetcherGA4ItemNameInListFilterRangeName.getValue() );
    let itemNameInListFilterString = itemNameInListFilter.getValue();
    let itemNameArray = itemNameInListFilterString.split( "|" );
    request.dimensionFilter = {
      filter: {
        fieldName: "itemName",
        inListFilter: {
          values: itemNameArray,
          caseSensitive: true,
        },
      }
    };
  }

  const report = AnalyticsData.Properties.runReport( request,
    `properties/${propertyId}` );

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
    console.log( "GA4_run_core_report_(): No rows returned." );

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
    console.log( `GA4_run_core_report_(): ${reportRowCount} rows extracted.` );

    if ( reportRowCount > maxRowCount )
      console.error( `GA4_run_core_report_(): Fetcher.Result.Rows is too small. `
        + `Only ${maxRowCount} rows filled.` );
  }
}
