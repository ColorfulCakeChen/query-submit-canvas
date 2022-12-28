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
  let spreadsheetId = g_Contorls.SpreadsheetIdText.value;
  if ( !g_VersusSummary ) {
    g_VersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by( spreadsheetId );
  } else {
    g_VersusSummary.weightsSpreadsheetId = spreadsheetId;
  }

  g_VersusSummary.rangeArray_load_async().then( VersusSummary_onDownload );
}

/** */
function VersusSummary_onDownload( bDownloadSummaryOk ) {
  if ( !bDownloadSummaryOk ) {
    g_Contorls.NextVisitIndexText.value = "";
    g_Contorls.DownloadVersusButton.disable = true;

    let spreadsheetId = g_VersusSummary.weightsSpreadsheetId;
    alert( `Failed to download VersusSummary from Google Sheets `
      + `\"${spreadsheetId}\".` );
    return;
    // g_VersusSummary.disposeResources_and_recycleToPool();
    // g_VersusSummary = null;
  }

  g_Contorls.NextVisitIndexText.value = g_VersusSummary.visitIndex_get();
  g_Contorls.DownloadVersusButton.disable = false;

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
      htmlTableOperator.Body_addRow( [ i, g_VersusSummary.rangeArray[ i ] ] );
    }

  } finally {
    if ( htmlTableOperator ) {
      htmlTableOperator.disposeResources_and_recycleToPool();
      htmlTableOperator = null;
    }
  }
}

/** */
function DownloadVersusButton_onClick( event ) {
  g_VersusSummary.versus_next_load_async().then( Versus_onDownload );
}

/** */
function Versus_onDownload( bDownloadVersusOk ) {
  let visitIndex = g_VersusSummary.visitIndex_get();
  g_Contorls.NextVisitIndexText.value = visitIndex;

  if ( !bDownloadVersusOk ) {
    let range = g_VersusSummary.rangeArray[ visitIndex ];

    let spreadsheetId = g_VersusSummary.weightsSpreadsheetId;
    alert( `Failed to download rangeArray[ ${visitIndex} ] = \"${range}\" `
      + `from Google Sheets \"${spreadsheetId}\".`
    );
    return;
  }

//!!! ...unfinished... (2022/12/28)

}
