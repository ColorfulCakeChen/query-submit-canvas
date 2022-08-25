/**
 * @file This is a classic javascript file. It should be loaded in a HTML web page
 * by a HTML script tag.
 *
 * 

//!!! ...unfinished... (2022/08/25)

 * In module (non-classic) web worker, static import is available. But at the same
 * time, importScripts() will not be avbailable. For solving this problem, using
 * classic (non-module) web worker so that tensorflow.js can be loaded by
 * importScripts(). At the same time, using dynamic import() to load ourselves module
 * because import() can be used in classic (non-module) script.
 */

window.addEventListener( "load", function ( e ) {
  console.log( "QuerySubmitCanvas_domSide_script.js: window_onload..." );

} );
