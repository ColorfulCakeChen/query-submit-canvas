
/**
 * 
 * Every entity (in a versus) uses 3 event names to represent: parent lose,
 * draw, offspring win.
 */
const UsableEventNameArray = [

  // Entity 0
  "add_payment_info",       // parent lose offspring
  "add_shipping_info",      // parent draw offspring
  "add_to_cart",            // parent win offspring

  // Entity 1
  "add_to_wishlist",        // parent lose offspring
  "begin_checkout",         // parent draw offspring
  "earn_virtual_currency",  // parent win offspring

  // Entity 2
  "generate_lead",          // parent lose offspring
  "join_group",             // parent draw offspring
  "level_up",               // parent win offspring

  // Entity 3
  "login",                  // parent lose offspring
  "post_score",             // parent draw offspring
  "purchase",               // parent win offspring

  // Entity 4
  "refund",                 // parent lose offspring
  "remove_from_cart",       // parent draw offspring
  "search",                 // parent win offspring

  // Entity 5
  "select_content",         // parent lose offspring
  "select_item",            // parent draw offspring
  "select_promotion",       // parent win offspring

  // Entity 6
  "share",                  // parent lose offspring
  "sign_up",                // parent draw offspring
  "spend_virtual_currency", // parent win offspring

  // Entity 7
  "tutorial_begin",         // parent lose offspring
  "tutorial_complete",      // parent draw offspring
  "unlock_achievement",     // parent win offspring

  // Entity 8
  "view_cart",              // parent lose offspring
  "view_item",              // parent draw offspring
  "view_item_list",         // parent win offspring

  // Entity 9
  // "view_promotion",
  // "view_search_results",
];

/**
 * 
 */
class Fake_ItemName_ItemPurchased {
  constructor( itemName, itemsPurchased ) {
    this.itemName = itemName;
    this.itemsPurchased = itemsPurchased;
  }
}

/** Run a GA4 realtime report to fetch data. */
function GA4_run_realtime_report_() {
  let [ fetcherGA4PropertyId,
    fetcherGA4ItemNameInListFilterRangeName,
    fetcherGA4MeasurementIdListItemIndexCur,
    fetcherGA4MeasurementIdListItemCount,
    fetcherGA4StreamIdListString,
    fetcherGA4ReportHeadersRangeName, fetcherGA4ReportRowsRangeName ]
    = ranges_getByNames_(
      RANGE_NAME.FC.FETCHER.GA4.PROPERTY_ID,
      RANGE_NAME.FC.FETCHER.GA4.ITEM_NAME_IN_LIST_FILTER.RANGE_NAME,
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

  // Map event name to item name and item purchased 
  let EventName_to_ItemName_ItemPurchased_Map;
  {
    // Get all legal item names.
    let itemNameArray; 
    if ( !fetcherGA4ItemNameInListFilterRangeName.isBlank() ) {
      let [ itemNameInListFilter ] = ranges_getByNames_(
        fetcherGA4ItemNameInListFilterRangeName.getValue() );
      let itemNameInListFilterString = itemNameInListFilter.getValue();
      itemNameArray = itemNameInListFilterString.split( "|" );
    } else {
      itemNameArray = []; // No item names. (should not happen)
    }

    // Every entity (in a versus) uses 3 event names to represent: parent lose,
    // draw, offspring win.
    EventName_to_ItemName_ItemPurchased_Map = new Map();
    for ( let i = 0; i < itemNameArray.length; ++i ) {
      let itemName = itemNameArray[ i ];
      let eventNameIndex = i * 3;

      EventName_to_ItemName_ItemPurchased_Map.set(
        UsableEventNameArray[ eventNameIndex + 0 ],
        new Fake_ItemName_ItemPurchased( itemName, -1 ) ); // parent lose offspring

      EventName_to_ItemName_ItemPurchased_Map.set(
        UsableEventNameArray[ eventNameIndex + 1 ],
        new Fake_ItemName_ItemPurchased( itemName,  0 ) ); // parent draw offspring

      EventName_to_ItemName_ItemPurchased_Map.set(
        UsableEventNameArray[ eventNameIndex + 2 ],
        new Fake_ItemName_ItemPurchased( itemName, +1 ) ); // parent win offspring
    }
  }

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
      { name: "eventName" },
      { name: "minutesAgo" },
      { name: "streamId" }
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

  // Extract headers.
  //
  // The headers are fixed as [ "itemName", "itemsPurchased" ] (i.e. not
  // directly from realtime report.
  {
//!!! (2023/02/03 Remarked)
    // let outputHeaders = [ [] ];
    // for ( let i = 0; i < report.dimensionHeaders.length; ++i ) {
    //   outputHeaders[ 0 ].push( report.dimensionHeaders[ i ].name )
    // }
    // for ( let i = 0; i < report.metricHeaders.length; ++i ) {
    //   outputHeaders[ 0 ].push( report.metricHeaders[ i ].name )
    // }

    let outputHeaders = [ [ "itemName", "itemsPurchased" ] ];
    reportHeadersRange.setValues( outputHeaders );
  }

//!!! ...unfinished... (2023/02/03)
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
