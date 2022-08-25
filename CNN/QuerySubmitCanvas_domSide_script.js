/**
 * @file This is a classic javascript file. It should be loaded in a HTML web page
 * by a HTML script tag.
 *
 * This is mainly used in Construt.net (c3addon) IPluginInfo or IBehaviorInfo.
 * Please use their .AddRemoteScriptDependency() method to load this script as
 * type "external-dom-script"
 *
 * In module (non-classic) script, static import is available. But at the same
 * time, importScripts() will not be avbailable. For solving this problem, using
 * classic (non-module) script so that Google Visualization API, Google Tag Manager,
 * tensorflow.js can be loaded by importScripts(). At the same time, using dynamic
 * import() to load ourselves module because import() can be used in classic
 * (non-module) script.
 */


//!!! ...unfinished... (2022/08/25)
// Google Visualization API, Google Tag Manager should be load here
// (before window_onload).


window.addEventListener( "load", function ( e ) {
  console.log( "QuerySubmitCanvas_domSide_script.js: window_onload..." );

//!!! ...unfinished... (2022/08/25)
  importScripts();

} );
