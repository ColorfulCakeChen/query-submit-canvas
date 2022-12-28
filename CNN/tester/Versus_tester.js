import * as DEvolution from "../NeuralDEvolution/DEvolution.js";


window.addEventListener( "load", window_onLoad );

let g_DownloadButton;
let g_SpreadsheetIdText;

let g_VersusSummary;

/** */
function window_onLoad( event ) {
  g_DownloadButton = document.querySelector( "#DownloadButton" );
  g_DownloadButton.addEventListener( "click", DownloadButton_onClick );

  g_SpreadsheetIdText = document.querySelector( "#SpreadsheetIdText" );
}

/** */
function DownloadButton_onClick( event ) {
  //alert( "Hi" );

  let theSpreadsheetId = g_SpreadsheetIdText.value;
  if ( !g_VersusSummary ) {
    g_VersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by( theSpreadsheetId );
  } else {
    g_VersusSummary.weightsSpreadsheetId = theSpreadsheetId;
  }

  g_VersusSummary.rangeArray_load_async().then( VersusSummary_onDownload );
}

/** */
function VersusSummary_onDownload( bDownloadSummaryOk ) {
  if ( !bDownloadSummaryOk ) {
    alert( `Faile to download VersusSummary from Google Sheets \"`
      + `${g_VersusSummary.weightsSpreadsheetId}\".` );
    return;
    // g_VersusSummary.disposeResources_and_recycleToPool();
    // g_VersusSummary = null;
  }

//!!! ...unfinished... (2022/12/28)

}
