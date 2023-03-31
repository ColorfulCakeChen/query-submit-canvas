import * as HttpRequest from "../util/HttpRequest.js";
import * as HTMLTable from "../Display/HTMLTable.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";


window.addEventListener( "load", window_onLoad );

let g_Contorls = {
  SpreadsheetIdText: null,
  DownloadSummaryButton: null,

  NextVisitIndexText: null,
  DownloadVersusButton: null,

  VersusId: null,
  ParentChromosomes: null,
  OffspringChromosomes: null,
};

let g_VersusSummary;
let g_params_loading_retryWaiting = params_loading_retryWaiting_create();

/** */
function params_loading_retryWaiting_create() {
  const loadingMillisecondsMax = ( 60 * 1000 );
  const loadingMillisecondsInterval = ( 5 * 1000 );

  const retryTimesMax = -1; // retry infinite times
  const retryWaitingSecondsExponentMax = 6; // i.e. ( 2 ** 6 ) = 64 seconds
  const retryWaitingMillisecondsInterval = ( 1000 );

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
  g_Contorls.SpreadsheetIdText = document.getElementById( "SpreadsheetIdText" );

  g_Contorls.bLogFetcherEventToConsoleCheckbox
    = document.getElementById( "bLogFetcherEventToConsoleCheckbox" );

  g_Contorls.DownloadSummaryButton = document.getElementById( "DownloadSummaryButton" );
  g_Contorls.DownloadSummaryButton.addEventListener(
    "click", DownloadSummaryButton_onClick );
  g_Contorls.DownloadSummaryButton.disabled = false;

  g_Contorls.NextVisitIndexText = document.getElementById( "NextVisitIndexText" );

  g_Contorls.DownloadVersusButton = document.getElementById( "DownloadVersusButton" );
  g_Contorls.DownloadVersusButton.addEventListener(
    "click", DownloadVersusButton_onClick );

  g_Contorls.VersusId = document.getElementById( "VersusId" );
  g_Contorls.ParentChromosomes = document.getElementById( "ParentChromosomes" );
  g_Contorls.OffspringChromosomes = document.getElementById( "OffspringChromosomes" );
}

/** */
function DownloadSummaryButton_onClick( event ) {
  g_Contorls.DownloadSummaryButton.disabled = true; // Prevent from many clicking quickly.

  let spreadsheetId = g_Contorls.SpreadsheetIdText.value;
  if ( !g_VersusSummary ) {
    g_VersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by( spreadsheetId );
  } else {
    g_VersusSummary.weightsSpreadsheetId = spreadsheetId;
  }

  g_VersusSummary.bLogFetcherEventToConsole
    = g_Contorls.bLogFetcherEventToConsoleCheckbox.checked;

  g_VersusSummary
    .rangeArray_load_asyncPromise_create( g_params_loading_retryWaiting )
    .then( VersusSummary_onDownload );
}

/** */
function VersusSummary_onDownload( bDownloadSummaryOk ) {
  g_Contorls.DownloadSummaryButton.disabled = false;

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
