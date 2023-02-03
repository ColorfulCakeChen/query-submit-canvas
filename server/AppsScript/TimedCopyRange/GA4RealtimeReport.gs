
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
 * The unit purchase count (i.e. -1, 0, +1) of an item.
 */
class Unit_ItemName_ItemPurchased {
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

  // Create the Map from event name to item name and item purchased.
  let eventName_to_Unit_ItemName_ItemPurchased_Map
    = EventName_to_Unit_ItemName_ItemPurchased_Map_create_(
        fetcherGA4ItemNameInListFilterRangeName );

  // Prepare the next measurement id index.
  {
    const measurementIdListItemIndexNext
      = ( measurementIdListItemIndexCur + 1 ) % measurementIdListItemCount;

    fetcherGA4MeasurementIdListItemIndexCur.setValue(
      measurementIdListItemIndexNext );

    console.log( `GA4_run_realtime_report_(): `
      + `Next measurement id index will be ${measurementIdListItemIndexNext}.` );
  }

  const request = {
    dimensions: [
      { name: "eventName" },
      // { name: "minutesAgo" },
      // { name: "streamId" }
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
  // Find out column index of event name and event count.
  let dimension_columnIndex_eventName;
  let metric_columnIndex_eventCount;
  {
    for ( let i = 0; i < report.dimensionHeaders.length; ++i ) {
      if ( "eventName" === report.dimensionHeaders[ i ].name ) {
        dimension_columnIndex_eventName = i;
        break;
      }
    }

    for ( let i = 0; i < report.metricHeaders.length; ++i ) {
      if ( "eventCount" === report.metricHeaders[ i ].name ) {
        metric_columnIndex_eventCount = i;
        break;
      }
    }

    // The headers are fixed as [ "itemName", "itemsPurchased" ] (i.e. not
    // directly from realtime report.
    let outputHeaders = [ [ "itemName", "itemsPurchased" ] ];
    reportHeadersRange.setValues( outputHeaders );
  }

  // Extract rows.
  if ( !report.rows ) {
    reportRowsRange.clear();
    console.log( "GA4_run_realtime_report_(): No rows returned." );

  } else {
    // Accumulate purchased count of every reported item name (from event name).
    let itemName_to_itemPurchased_Map = new Map();
    {
      let inputReportRowCount = report.rows.length;

      let rowIndex;
      for ( rowIndex = 0; rowIndex < inputReportRowCount; ++rowIndex ) {
        let reportRow = report.rows[ rowIndex ];

        let eventName
          = reportRow.dimensionValues[ dimension_columnIndex_eventName ].value;
        let eventCount
          = reportRow.metricValues[ metric_columnIndex_eventCount ].value;

        let unit_ItemName_ItemPurchased
          = eventName_to_Unit_ItemName_ItemPurchased_Map.get( eventName );
        if ( !unit_ItemName_ItemPurchased )
          continue; // e.g. No item name is represented by the event name.

        let itemName = unit_ItemName_ItemPurchased.itemName;
        let itemPurchased;
        {
          itemPurchased = itemName_to_itemPurchased_Map.get( itemName );
          if ( itemPurchased == undefined )
            itemPurchased = 0;

          itemPurchased += unit_ItemName_ItemPurchased.itemsPurchased * eventCount;
          itemName_to_itemPurchased_Map.set( itemName, itemPurchased );
        }
      }

      console.log( `GA4_run_realtime_report_(): ${inputReportRowCount} rows extracted.` );
    }

    let itemNameCount = itemName_to_itemPurchased_Map.size;

    let outputRows = new Array( maxRowCount );
    let fillRowCount = Math.min( maxRowCount, itemNameCount );

    let rowIndex = 0, columnIndex;
    for ( let itemName_itemPurchased of itemName_to_itemPurchased_Map ) {
      if ( rowIndex >= fillRowCount )
        break;

      let outputRow = outputRows[ rowIndex ] = new Array( maxColumnCount );

      columnIndex = 0;
      outputRow[ columnIndex++ ] = itemName_itemPurchased[ 0 ];
      outputRow[ columnIndex++ ] = itemName_itemPurchased[ 1 ];

      ++rowIndex;
    }

    const emptyColumns = new Array( maxColumnCount );
    for ( ; rowIndex < maxRowCount; ++rowIndex ) // Fill extra cells as empty.
      outputRows[ rowIndex ] = emptyColumns;

    reportRowsRange.setValues( outputRows );
    console.log( `GA4_run_realtime_report_(): ${itemNameCount} item names extracted.` );

    if ( itemNameCount > maxRowCount )
      console.error( `GA4_run_realtime_report_(): Fetcher.Result.Rows is too small. `
        + `Only ${maxRowCount} rows filled.` );
  }
}

/**
 * @param {Range} fetcherGA4ItemNameInListFilterRangeName
 *   A named range contains another range name. The indirect named range should
 * contain all legal item (i.e. versus entity) names (separated by vertical bar (|)).
 *
 * @return {Map}
 *   Map event name to Unit_ItemName_ItemPurchased. Every entity (in a versus)
 * uses 3 event names to represent: parent lose, draw, offspring win.
 */
function EventName_to_Unit_ItemName_ItemPurchased_Map_create_(
  fetcherGA4ItemNameInListFilterRangeName
) {
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
  let eventName_to_Unit_ItemName_ItemPurchased_Map = new Map();
  for ( let i = 0; i < itemNameArray.length; ++i ) {
    let itemName = itemNameArray[ i ];
    if ( !itemName )
      continue; // Skip empty item name. (should not happen)

    let eventNameIndex = i * 3;
    if ( ( eventNameIndex + 2 ) >= UsableEventNameArray.length )
      break; // No more event name could be used to represent the item.

    eventName_to_Unit_ItemName_ItemPurchased_Map.set(
      UsableEventNameArray[ eventNameIndex + 0 ],
      new Unit_ItemName_ItemPurchased( itemName, -1 ) ); // parent lose offspring

    eventName_to_Unit_ItemName_ItemPurchased_Map.set(
      UsableEventNameArray[ eventNameIndex + 1 ],
      new Unit_ItemName_ItemPurchased( itemName,  0 ) ); // parent draw offspring

    eventName_to_Unit_ItemName_ItemPurchased_Map.set(
      UsableEventNameArray[ eventNameIndex + 2 ],
      new Unit_ItemName_ItemPurchased( itemName, +1 ) ); // parent win offspring
  }

  return eventName_to_Unit_ItemName_ItemPurchased_Map;
}
