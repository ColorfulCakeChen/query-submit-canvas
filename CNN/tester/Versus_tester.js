import * as HTMLTable from "../Display/HTMLTable.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";


window.addEventListener( "load", window_onLoad );

let g_Contorls = {
  SpreadsheetIdText: null,
  DownloadSummaryButton: null,

  NextVersusIdText: null,
  DownloadVersusButton: null,
};

let g_VersusSummary;

/** */
function window_onLoad( event ) {
  g_Contorls.SpreadsheetIdText = document.querySelector( "#SpreadsheetIdText" );

  g_Contorls.DownloadSummaryButton = document.querySelector( "#DownloadSummaryButton" );
  g_Contorls.DownloadSummaryButton.addEventListener(
    "click", DownloadSummaryButton_onClick );

  g_Contorls.NextVersusIdText = document.querySelector( "#NextVersusIdText" );

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
 id="NextVersusIdText" type="text" maxlength="150" size="50" readonly>
 id="DownloadVersusButton" type="button">Download Next Versus</button>

}

/** */
function VersusSummary_onDownload( bDownloadSummaryOk ) {
  if ( !bDownloadSummaryOk ) {
    g_Contorls.NextVersusIdText.value = "";

    let theSpreadsheetId = g_VersusSummary.weightsSpreadsheetId;
    alert( `Failed to download VersusSummary from Google Sheets `
      + `\"${theSpreadsheetId}\".` );
    return;
    // g_VersusSummary.disposeResources_and_recycleToPool();
    // g_VersusSummary = null;
  }

  g_Contorls.NextVersusIdText.value = g_VersusSummary."";

//!!! ...unfinished... (2022/12/28)
<input id="NextVersusIdText" type="text" maxlength="150" size="50" readonly>
<button id="DownloadVersusButton" type="button">Download Next Versus</button>

}
