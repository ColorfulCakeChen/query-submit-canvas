import * as HttpRequest from "../util/HttpRequest.js";
import * as PartTime from "../util/PartTime.js";
import * as ValueMax from "../util/ValueMax.js";
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
 * Await load_asyncGenerator and display progress simultaneously.
 *
 * It loops the async generator slower. But its progress displaying is better
 * (than by setTimeout()).
 *
 * The reasons are:
 *
 *   - It will wait repaint time for updating UI (so that displaying is
 *       smoother).
 *
 *   - Only after UI updated, it waits async generator .next(). (So, it is
 *       slower.)
 *
 *
 * @param {AsyncGenerator} load_asyncGenerator
 *   The async generator to be awaited (ticked until done).
 *
 * @return { GSheetsAPIv4.UrlComposer | GVizTQ.UrlComposer } urlComposer
 *   The UrlComposer where load_asyncGenerator comes from. It could provide
 * current retry times.
 *
 * @param {ValueMax.Percentage.Base} progressPercentage
 *   The progress of the load_asyncGenerator.
 *
 * @param {HTMLSpanElement} retryTimesSpanHTMLElement
 *   The DOM (Document Object Model) Node of HTML span elemnt for displaying
 * current loading retry times.
 *
 * @param {HTMLProgressElement} progressHTMLElement
 *   The DOM (Document Object Model) Node of HTML progress elemnt for
 * displaying current loading progress.
 *
 * @return {any}
 *   Return the resolved value when load_asyncGenerator done.
 */
async function load_asyncGenerator_looper(
  load_asyncGenerator,
  urlComposer, progressPercentage,
  retryTimesSpanHTMLElement, progressHTMLElement
) {

  progressHTMLElement.max = progressPercentage.maxPercentage;

  let loaderNext;
  let promiseResolvedValue;
  do {
    loaderNext = await load_asyncGenerator.next();
    if ( !loaderNext.done ) {
      // Update UI right before the next repaint.
      //
      // Note1: This awaiting makes UI smoother but also slows down loaderNext.
      //        Although slower, however, this makes every loaderNext could be
      //        seen by user (even if the loaderNext is too fast to be seen).
      //
      // Note2: Because HttpRequest.Fetcher uses XHR's event to download data,
      //        it will continue to download and is not blocked (i.e. will not
      //        timeout) by this repaint time waiting. However, other rasks
      //        (e.g. decoding the downloaded data) will be blocked by this
      //        repaint time waiting.
      await PartTime.nextAnimationFrameValue();
      retryTimesSpanHTMLElement.textContent
        = urlComposer.retryTimes_CurMax_string;
      progressHTMLElement.value = progressPercentage.valuePercentage;
    }
  } while ( !loaderNext.done );

  retryTimesSpanHTMLElement.textContent = "";

  promiseResolvedValue = loaderNext.value;
  return promiseResolvedValue;
}

/**
 * Almost the same as load_asyncGenerator_looper() but uses
 * AsyncGeneratorTicker internally.
 *
 * It is even slower than load_asyncGenerator_looper(). But its
 * displaying is also smoother than it. The reason may be that it calls
 * requestAnimationFrame() more times even if there is no progress at all.
 */
async function load_asyncGenerator_ticker(
  load_asyncGenerator,
  urlComposer, progressPercentage,
  retryTimesSpanHTMLElement, progressHTMLElement
) {

  progressHTMLElement.max = progressPercentage.maxPercentage;

  let asyncGeneratorTicker
    = new PartTime.AsyncGeneratorTicker( load_asyncGenerator );

  do {
    await PartTime.nextAnimationFrameValue();

    retryTimesSpanHTMLElement.textContent
      = urlComposer.retryTimes_CurMax_string;

    progressHTMLElement.value = progressPercentage.valuePercentage;

  } while ( !asyncGeneratorTicker.done() );

  retryTimesSpanHTMLElement.textContent = "";

  let promiseResolvedValue = asyncGeneratorTicker.lastNext.value;
  return promiseResolvedValue;
}


/** */
async function DownloadSummaryButton_onClick( event ) {
  try {
    // Prevent from many clicking quickly.
    g_Contorls.DownloadSummaryButton.disabled = true;
    g_Contorls.DownloadSummaryAbortButton.disabled = false;
    g_Contorls.DownloadVersusButton.disabled = true;
    g_Contorls.DownloadVersusAbortButton.disabled = true;

    let spreadsheetId = g_Contorls.SpreadsheetIdText.value;
    if ( !g_VersusSummary ) {
      g_VersusSummary
        = DEvolution.VersusSummary.Pool.get_or_create_by( spreadsheetId );
    } else {
      g_VersusSummary.weightsSpreadsheetId = spreadsheetId;
    }

    params_loading_retryWaiting_extractFromUI();

    let rangeArray_load_asyncGenerator = g_VersusSummary
      .rangeArray_load_asyncGenerator_create_with_asyncPromise_progress(
        g_params_loading_retryWaiting );

    // (2023/04/10 Remarked) Test load_asyncGenerator_ticker().
    //let bDownloadSummaryOk = await load_asyncGenerator_looper(
    let bDownloadSummaryOk = await load_asyncGenerator_ticker(
      rangeArray_load_asyncGenerator,
      g_VersusSummary.urlComposer,
      g_VersusSummary.rangeArray_load_asyncPromise_progress,
      g_Contorls.DownloadSummaryRetryTimesSpan,
      g_Contorls.DownloadSummaryProgressBar
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
      htmlTableOperator = HTMLTable.Operator.Pool.get_or_create_by(
        htmlTableId, digitsCount );
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
    // Prevent from many clicking quickly.
    g_Contorls.DownloadVersusButton.disabled = true;
    g_Contorls.DownloadVersusAbortButton.disabled = false;

    params_loading_retryWaiting_extractFromUI();

    let versus_next_load_asyncGenerator = g_VersusSummary
      .versus_next_load_asyncGenerator_create_with_asyncPromise_progress(
        g_params_loading_retryWaiting );

    // (2023/04/10 Remarked) Test load_asyncGenerator_ticker().
    //let versus = await load_asyncGenerator_looper(
    let versus = await load_asyncGenerator_ticker(
      versus_next_load_asyncGenerator,
      g_VersusSummary.urlComposer,
      g_VersusSummary.versus_next_load_asyncPromise_progress,
      g_Contorls.DownloadVersusRetryTimesSpan,
      g_Contorls.DownloadVersusProgressBar
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

    g_Contorls.VersusId.textContent
      = versus.versusId.versusIdString;

    g_Contorls.ParentChromosomes.value
      = versus.parentChromosomeFloat32Array;

    g_Contorls.OffspringChromosomes.value
      = versus.offspringChromosomeFloat32Array;

  } catch( e ) {
    alert( e );
    console.error( e );
    //debugger;
  }
}
