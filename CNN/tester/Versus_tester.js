import * as HttpRequest from "../util/HttpRequest.js";
import * as HTMLTable from "../Display/HTMLTable.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";


window.addEventListener( "load", window_onLoad );

let g_Contorls = {
  SpreadsheetIdText: null,
  DownloadSummaryButton: null,
  DownloadSummaryAbortButton: null,
  DownloadSummaryProgressBar: null,

  bLogFetcherEventToConsoleCheckbox: null,
  loadingMillisecondsMaxNumber: null,
  loadingMillisecondsIntervalNumber: null,
  retryTimesMaxNumber: null,

  NextVisitIndexText: null,
  DownloadVersusButton: null,
  DownloadVersusAbortButton: null,
  DownloadVersusProgressBar: null,

  VersusId: null,
  ParentChromosomes: null,
  OffspringChromosomes: null,
};

let g_VersusSummary;
let g_params_loading_retryWaiting = params_loading_retryWaiting_create();

/** */
function params_loading_retryWaiting_create() {
  const loadingMillisecondsMax = ( 30 * 1000 ); //( 60 * 1000 );
  const loadingMillisecondsInterval = 1001; //( 5 * 1000 );

  const retryTimesMax = 3; // -1 means retry infinite times
  const retryWaitingSecondsExponentMax = 6; // i.e. ( 2 ** 6 ) = 64 seconds
  const retryWaitingMillisecondsInterval = 1002; //( 1000 );

  let params_loading_retryWaiting
    = new HttpRequest.Params_loading_retryWaiting(
        loadingMillisecondsMax, loadingMillisecondsInterval,
        retryTimesMax,
        retryWaitingSecondsExponentMax, retryWaitingMillisecondsInterval
      );
  return params_loading_retryWaiting;
}

/** */
function window_onLoad( event ) {

  // Binding UI control elements.
  for ( let propertyName in g_Contorls ) {
    g_Contorls[ propertyName ] = document.getElementById( propertyName );
  }

  {
    g_Contorls.DownloadSummaryButton.addEventListener(
      "click", DownloadSummaryButton_onClick );
    g_Contorls.DownloadSummaryButton.disabled = false;

    g_Contorls.DownloadSummaryAbortButton.addEventListener(
      "click", DownloadSummaryAbortButton_onClick );
  }

  {
    g_Contorls.DownloadVersusButton.addEventListener(
      "click", DownloadVersusButton_onClick );

    g_Contorls.DownloadVersusAbortButton.addEventListener(
      "click", DownloadVersusAbortButton_onClick );
  }
}

/** */
function DownloadSummaryButton_onClick( event ) {
  g_Contorls.DownloadSummaryButton.disabled = true; // Prevent from many clicking quickly.
  g_Contorls.DownloadSummaryAbortButton.disabled = false;

  let spreadsheetId = g_Contorls.SpreadsheetIdText.value;
  if ( !g_VersusSummary ) {
    g_VersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by( spreadsheetId );
  } else {
    g_VersusSummary.weightsSpreadsheetId = spreadsheetId;
  }

  g_VersusSummary.bLogFetcherEventToConsole
    = g_Contorls.bLogFetcherEventToConsoleCheckbox.checked;

  {
    { // Extract from UI.
      g_params_loading_retryWaiting.loadingMillisecondsMax
        = Number.parseInt( g_Contorls.loadingMillisecondsMaxNumber.value );

      g_params_loading_retryWaiting.loadingMillisecondsInterval
        = Number.parseInt( g_Contorls.loadingMillisecondsIntervalNumber.value );

      g_params_loading_retryWaiting.retryTimesMax
        = Number.parseInt( g_Contorls.retryTimesMaxNumber.value );
    }

    { // Reflect to UI.
      g_Contorls.loadingMillisecondsMaxNumber.value
        = g_params_loading_retryWaiting.loadingMillisecondsMax;

      g_Contorls.loadingMillisecondsIntervalNumber.value
        = g_params_loading_retryWaiting.loadingMillisecondsInterval;

      g_Contorls.retryTimesMaxNumber.value
        = g_params_loading_retryWaiting.retryTimesMax;
    }
  }

//!!! ...unfinshed... (2023/04/03)
// Use requestAnimation to update progress.
  g_VersusSummary
    .rangeArray_load_asyncPromise_create( g_params_loading_retryWaiting )
    .then( VersusSummary_onDownload );
}

/** */
function DownloadSummaryAbortButton_onClick( event ) {

//!!! ...unfinshed... (2023/04/05) should wait aborted.
  g_Contorls.DownloadSummaryButton.disabled = false;

  g_Contorls.DownloadSummaryAbortButton.disabled = true;

  g_VersusSummary.urlComposer.abort();

//!!! ...unfinshed... (2023/04/05)

}

/** */
function VersusSummary_onDownload( bDownloadSummaryOk ) {
  g_Contorls.DownloadSummaryButton.disabled = false;
  g_Contorls.DownloadSummaryAbortButton.disabled = true;

  if ( !bDownloadSummaryOk ) {
    g_Contorls.NextVisitIndexText.value = "";
    g_Contorls.DownloadVersusButton.disabled = true;

    let spreadsheetId = g_VersusSummary.weightsSpreadsheetId;
    alert( `Failed to download VersusSummary from Google Sheets `
      + `\"${spreadsheetId}\".` );
    return;
    // g_VersusSummary.disposeResources_and_recycleToPool();
    // g_VersusSummary = null;
  }

  g_Contorls.NextVisitIndexText.value = g_VersusSummary.visitIndex_get();
  g_Contorls.DownloadVersusButton.disabled = false;

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
  g_Contorls.DownloadVersusButton.disabled = true; // Prevent from many clicking quickly.

//!!! ...unfinshed... (2023/04/04)
// Add abort button.
// If ( retryTimesMax != 0 ), display retry time cur/max (or cur only if max < 0).

//!!! ...unfinshed... (2023/04/03)
// Use requestAnimation to update progress.
  g_VersusSummary
    .versus_next_load_asyncPromise_create( g_params_loading_retryWaiting )
    .then( Versus_onDownload );
}

/**
 * @param {DEvolution.versus} versus
 *   The downloaded versus. null means downloading is failed. 
 */
function Versus_onDownload( versus ) {
  g_Contorls.DownloadVersusButton.disabled = false;

  let visitIndex = g_VersusSummary.visitIndex_get();
  g_Contorls.NextVisitIndexText.value = visitIndex;

  if ( !versus ) {
    let range = g_VersusSummary.rangeArray[ visitIndex ];

    let spreadsheetId = g_VersusSummary.weightsSpreadsheetId;
    alert( `Failed to download rangeArray[ ${visitIndex} ] = \"${range}\" `
      + `from Google Sheets \"${spreadsheetId}\".`
    );

    g_Contorls.VersusId.textContent = "";
    g_Contorls.ParentChromosomes.value = "";
    g_Contorls.OffspringChromosomes.value = "";

    return;
  }

  g_Contorls.VersusId.textContent = versus.versusId.versusIdString;
  g_Contorls.ParentChromosomes.value = versus.parentChromosomeFloat32Array;
  g_Contorls.OffspringChromosomes.value = versus.offspringChromosomeFloat32Array;
 
//!!! ...unfinished... (2022/12/28)
}
