/**
 * @file This is a module (i.e. not classic) javascript file. It will be loaded
 * by QuerySubmitCanvas_domSide_script.js by dynamic import().
 *
 * This provides a namespace to load other scripts and modules.
 */

import * as ScriptLoader from "./util/ScriptLoader.js"

//!!! ...unfinished... (2022/08/25)
// Google Visualization API, Google Tag Manager should be load here
// (before window_onload) by append HTMLScriptElement to document head.
// (ScriptLoader.createPromise)
//
// Ourselves neural network library should be loaded here by dynamic import() function.
//


//!!! ...unfinished... (2022/08/25)
// should wait for Google Visualization API, Google Tag Manager and our modules.
// Perhaps, not wait for window loaded.

window.addEventListener( "load", function ( e ) {
  console.log( "QuerySubmitCanvas_module_script.js: window_onload..." );

//!!! ...unfinished... (2022/08/25)

} );

