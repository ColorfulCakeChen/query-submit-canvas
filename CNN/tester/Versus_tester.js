import * as HTMLTable from "../Display/HTMLTable.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";


window.addEventListener( "load", window_onLoad );

let g_Contorls = {
  SpreadsheetIdText: null,
  DownloadSummaryButton: null,

  NextVisitIndexText: null,
  DownloadVersusButton: null,
};

let g_VersusSummary;

/** */
function window_onLoad( event ) {
  g_Contorls.SpreadsheetIdText = document.querySelector( "#SpreadsheetIdText" );

  g_Contorls.DownloadSummaryButton = document.querySelector( "#DownloadSummaryButton" );
  g_Contorls.DownloadSummaryButton.addEventListener(
    "click", DownloadSummaryButton_onClick );

  g_Contorls.NextVisitIndexText = document.querySelector( "#NextVisitIndexText" );

  g_Contorls.DownloadVersusButton = document.querySelector( "#DownloadVersusButton" );
  g_Contorls.DownloadVersusButton.addEventListener(
    "click", DownloadVersusButton_onClick );
}

/** */
function DownloadSummaryButton_onClick( event ) {
  //alert( "Hi" );

  let theSpreadsheetId = g_Contorls.SpreadsheetIdText.value;
  if ( !g_VersusSummary ) {
    g_VersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by( theSpreadsheetId );
  } else {
    g_VersusSummary.weightsSpreadsheetId = theSpreadsheetId;
  }

  g_VersusSummary.rangeArray_load_async().then( VersusSummary_onDownload );
}

/** */
function DownloadVersusButton_onClick( event ) {
  //alert( "Hi" );

//!!! ...unfinished... (2022/12/28)
//g_VersusSummary.visitCount
  g_Contorls.NextVisitIndexText.value = g_VersusSummary.visitIndex_get();
}

/** */
function VersusSummary_onDownload( bDownloadSummaryOk ) {
  if ( !bDownloadSummaryOk ) {
    g_Contorls.NextVisitIndexText.value = "";

    let theSpreadsheetId = g_VersusSummary.weightsSpreadsheetId;
    alert( `Failed to download VersusSummary from Google Sheets `
      + `\"${theSpreadsheetId}\".` );
    return;
    // g_VersusSummary.disposeResources_and_recycleToPool();
    // g_VersusSummary = null;
  }

  g_Contorls.NextVisitIndexText.value = g_VersusSummary.visitIndex_get();

  let htmlTableOperator;
  {
    const htmlTableId = "VersusSummaryTable";
    const digitsCount = 0; // i.e. integer
    htmlTableOperator
      = HTMLTable.Operator.Pool.get_or_create_by( htmlTableId, digitsCount );
  }

  try {
    htmlTableOperator.Table_clear();

    if ( !htmlTableOperator.Header_hasChild() ) {
      htmlTableOperator.Header_addRow( [ "VersusIndex", "Range" ] );
    }

    for ( let i = 0; i < g_VersusSummary.rangeArray.length; ++i ) {
      htmlTableOperator.Body_addRow( [
        i, g_VersusSummary.rangeArray[ i ]
      ] );
    }

  } finally {
    if ( htmlTableOperator ) {
      htmlTableOperator.disposeResources_and_recycleToPool();
      htmlTableOperator = null;
    }
  }

}
