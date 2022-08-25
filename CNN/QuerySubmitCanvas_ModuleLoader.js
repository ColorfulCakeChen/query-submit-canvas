/**
 * @file This is a module (i.e. not classic) javascript file. It will be loaded
 * by QuerySubmitCanvas_domSide_script.js by dynamic import().
 *
 * This provides a namespace to load other scripts and modules.
 */

export { ModuleLoader };

import * as ScriptLoader from "./util/ScriptLoader.js"

//!!! ...unfinished... (2022/08/25)
// Google Visualization API, Google Tag Manager should be load here
// (before window_onload) by append HTMLScriptElement to document head.
// (ScriptLoader.createPromise)
//
// Ourselves neural network library should be loaded here by dynamic import() function.
//

const debugPrefix = "QuerySubmitCanvas_ModuleLoader.js";

/**
 * Load the following modules:
 *   - Google Visualization API

//!!! ...unfinished... (2022/08/25)

 *   - Google Tag Manager
 *   - NeuralNet
 *
 */
class ModuleLoader {

  /** */
  async initAsync() {
    return Promise.all( [
      this.googleCharts_initAsync(),

  //!!! ...unfinished... (2022/08/25)
  // should wait for Google Tag Manager and our modules.

    ] );
  }

  /** */
  async googleCharts_initAsync() {

    const googleChartsLoaderUrl = "https://www.gstatic.com/charts/loader.js";
    const googleChartsLoaderHTMLElementId = "googleChartsLoaderJs";

    let googleChartsLoader = ScriptLoader.createPromise(
      googleChartsLoaderUrl, false, googleChartsLoaderHTMLElementId );

    await googleChartsLoader;
    // console.log( `${debugPrefix}: googleChartsLoader done...` );

    let googleChartsSafeLoad = google.charts.safeLoad( "current", {
      // packages: [ "corechart" ],
    } );

    await googleChartsSafeLoad;
    // console.log( `${debugPrefix}: google.charts.load() done...` );

    return true;
  }

}

ModuleLoader.Singleton = new ModuleLoader();
