import * as HttpRequest from "../util/HttpRequest.js";
import * as PartTime from "../util/PartTime.js";
import * as HTMLTable from "../Display/HTMLTable.js";
import * as DEvolution from "../NeuralDEvolution/DEvolution.js";


window.addEventListener( "load", window_onLoad );

let g_Contorls = {
  SpreadsheetIdText: null,
  DownloadSummaryButton: null,
  DownloadSummaryAbortButton: null,
  DownloadSummaryRetryTimesSpan: null,
  DownloadSummaryProgressBar: null,

  bLogFetcherEventToConsoleCheckbox: null,
  loadingMillisecondsMaxNumber: null,
  loadingMillisecondsIntervalNumber: null,
  retryTimesMaxNumber: null,

  NextVisitIndexText: null,
  DownloadVersusButton: null,
  DownloadVersusAbortButton: null,
  DownloadVersusRetryTimesSpan: null,
  DownloadVersusProgressBar: null,

  VersusId: null,
  ParentChromosomes: null,
  OffspringChromosomes: null,
};

let g_VersusSummary;
let g_params_loading_retryWaiting = params_loading_retryWaiting_create();

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
function params_loading_retryWaiting_create() {
  const loadingMillisecondsMax = ( 60 * 1000 );
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
function params_loading_retryWaiting_extractFromUI() {

  { // Extract from UI.
    g_VersusSummary.bLogFetcherEventToConsole
      = g_Contorls.bLogFetcherEventToConsoleCheckbox.checked;

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

/**
 * Await load_asyncPromise and display progress simultaneously.
 *
 * @param {HTMLSpanElement} retryTimesSpanHTMLElement
 *   The DOM (Document Object Model) Node of HTML span elemnt for displaying
 * current loading retry times.
 *
 * @param {HTMLProgressElement} progressHTMLElement
 *   The DOM (Document Object Model) Node of HTML progress elemnt for
 * displaying current loading progress.
 *
 * @return { GSheetsAPIv4.UrlComposer | GVizTQ.UrlComposer } urlComposer
 *   The UrlComposer which provides load_asyncPromise.
 *
 * @param {Promise} load_asyncPromise
 *   The promise to be awaited.
 *
 * @param {ValueMax.Percentage.Base} progressPercentage
 *   The progress of the load_asyncPromise.
 *
 * @return {any}
 *   Return the resolved value of load_asyncPromise.
 */
async function retryTimes_progress_load_by_asyncPromise(
  retryTimesSpanHTMLElement, progressHTMLElement,
  urlComposer, load_asyncPromise, progressPercentage
) {
  const timeMilliseconds = 0; //10; //100; //500;

  progressHTMLElement.max = progressPercentage.maxPercentage;

  let bDone;
  let promiseResolvedValue;
  do {
    let timePromise = PartTime.delayedValue( timeMilliseconds,
      retryTimes_progress_load_by_asyncPromise );
    let allPromiseRace = Promise.race( [ load_asyncPromise, timePromise ] );

    promiseResolvedValue = await allPromiseRace;
    if ( promiseResolvedValue === retryTimes_progress_load_by_asyncPromise )
      bDone = false; // timePromise
    else
      bDone = true; // load_asyncPromise

    retryTimesSpanHTMLElement.textContent
      = urlComposer.retryTimes_CurMax_string;
    progressHTMLElement.value = progressPercentage.valuePercentage;
  } while ( !bDone );

  retryTimesSpanHTMLElement.textContent = "";
  return promiseResolvedValue;
}

/**
 * Await load_asyncGenerator and display progress simultaneously.
 *
 * (Its progress displaying may be better than
 * retryTimes_progress_load_by_asyncPromise().)
 *
 * @param {HTMLSpanElement} retryTimesSpanHTMLElement
 *   The DOM (Document Object Model) Node of HTML span elemnt for displaying
 * current loading retry times.
 *
 * @param {HTMLProgressElement} progressHTMLElement
 *   The DOM (Document Object Model) Node of HTML progress elemnt for
 * displaying current loading progress.
 *
 * @return { GSheetsAPIv4.UrlComposer | GVizTQ.UrlComposer } urlComposer
 *   The UrlComposer which provides load_asyncPromise.
 *
 * @param {AsyncGenerator} load_asyncGenerator
 *   The async generator to be awaited.
 *
 * @param {ValueMax.Percentage.Base} progressPercentage
 *   The progress of the load_asyncPromise.
 *
 * @return {any}
 *   Return the resolved value of load_asyncPromise.
 */
async function retryTimes_progress_load_by_asyncGenerator(
  retryTimesSpanHTMLElement, progressHTMLElement,
  urlComposer, load_asyncGenerator, progressPercentage
) {

  progressHTMLElement.max = progressPercentage.maxPercentage;

  let bDone;
  let loaderNext;
  let promiseResolvedValue;
  do {
    loaderNext = await load_asyncGenerator.next();
    if ( loaderNext.done ) {
      bDone = true;
      // progressHTMLElement.value = 100; // ???progressRoot
      promiseResolvedValue = loaderNext.value;
      
    } else {
      bDone = false;
      // progressHTMLElement.value = loaderNext.value; // progressRoot
    }

    retryTimesSpanHTMLElement.textContent
      = urlComposer.retryTimes_CurMax_string;
    progressHTMLElement.value = progressPercentage.valuePercentage;
  } while ( !bDone );

  retryTimesSpanHTMLElement.textContent = "";
  return promiseResolvedValue;
}

/** */
async function DownloadSummaryButton_onClick( event ) {
  try {
    g_Contorls.DownloadSummaryButton.disabled = true; // Prevent from many clicking quickly.
    g_Contorls.DownloadSummaryAbortButton.disabled = false;
    g_Contorls.DownloadVersusButton.disabled = true;
    g_Contorls.DownloadVersusAbortButton.disabled = true;

    let spreadsheetId = g_Contorls.SpreadsheetIdText.value;
    if ( !g_VersusSummary ) {
      g_VersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by( spreadsheetId );
    } else {
      g_VersusSummary.weightsSpreadsheetId = spreadsheetId;
    }

    params_loading_retryWaiting_extractFromUI();

    let rangeArray_load_asyncPromise = g_VersusSummary
      .rangeArray_load_asyncPromise_create( g_params_loading_retryWaiting );

    let bDownloadSummaryOk = await retryTimes_progress_load_by_asyncPromise(
      g_Contorls.DownloadSummaryRetryTimesSpan,
      g_Contorls.DownloadSummaryProgressBar,
      g_VersusSummary.urlComposer,
      rangeArray_load_asyncPromise,
      g_VersusSummary.rangeArray_load_asyncPromise_progress
    );

    VersusSummary_onDownload( bDownloadSummaryOk );

  } catch( e ) {
    alert( e );
    console.error( e );
    //debugger;
  }
}

/** */
function DownloadSummaryAbortButton_onClick( event ) {
  try {
    g_VersusSummary.urlComposer.abort();
  } catch( e ) {
    alert( e );
    console.error( e );
    //debugger;
  }
}

/** */
function VersusSummary_onDownload( bDownloadSummaryOk ) {
  let htmlTableOperator;
  try {
    g_Contorls.DownloadSummaryButton.disabled = false;
    g_Contorls.DownloadSummaryAbortButton.disabled = true;
    g_Contorls.DownloadVersusButton.disabled = false;
    g_Contorls.DownloadVersusAbortButton.disabled = true;

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

    {
      const htmlTableId = "VersusSummaryTable";
      const digitsCount = 0; // i.e. integer
      htmlTableOperator
        = HTMLTable.Operator.Pool.get_or_create_by( htmlTableId, digitsCount );
    }

    htmlTableOperator.Table_clear();

    if ( !htmlTableOperator.Header_hasChild() ) {
      htmlTableOperator.Header_addRow( [ "VersusIndex", "Range" ] );
    }

    for ( let i = 0; i < g_VersusSummary.rangeArray.length; ++i ) {
      htmlTableOperator.Body_addRow( [ i, g_VersusSummary.rangeArray[ i ] ] );
    }


  } catch( e ) {
    alert( e );
    console.error( e );
    //debugger;

  } finally {
    if ( htmlTableOperator ) {
      htmlTableOperator.disposeResources_and_recycleToPool();
      htmlTableOperator = null;
    }
  }
}

/** */
async function DownloadVersusButton_onClick( event ) {
  try {
    g_Contorls.DownloadSummaryButton.disabled = true;
    g_Contorls.DownloadSummaryAbortButton.disabled = true;
    g_Contorls.DownloadVersusButton.disabled = true; // Prevent from many clicking quickly.
    g_Contorls.DownloadVersusAbortButton.disabled = false;

    params_loading_retryWaiting_extractFromUI();

    let versus_next_load_asyncPromise = g_VersusSummary
      .versus_next_load_asyncPromise_create( g_params_loading_retryWaiting );

    let versus = await retryTimes_progress_load_by_asyncPromise(
      g_Contorls.DownloadVersusRetryTimesSpan,
      g_Contorls.DownloadVersusProgressBar,
      g_VersusSummary.urlComposer,
      versus_next_load_asyncPromise,
      g_VersusSummary.versus_next_load_asyncPromise_progress
    );

    Versus_onDownload( versus );

  } catch( e ) {
    alert( e );
    console.error( e );
    //debugger;
  }
}

/** */
function DownloadVersusAbortButton_onClick( event ) {
  try {
    g_VersusSummary.urlComposer.abort();
  } catch( e ) {
    alert( e );
    console.error( e );
    //debugger;
  }
}

/**
 * @param {DEvolution.versus} versus
 *   The downloaded versus. null means downloading is failed. 
 */
function Versus_onDownload( versus ) {
  try {
    g_Contorls.DownloadSummaryButton.disabled = false;
    g_Contorls.DownloadSummaryAbortButton.disabled = true;
    g_Contorls.DownloadVersusButton.disabled = false;
    g_Contorls.DownloadVersusAbortButton.disabled = true;

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

  } catch( e ) {
    alert( e );
    console.error( e );
    //debugger;
  }
}
