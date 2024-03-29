/**
 * @file This is a classic javascript file. It should be loaded in a HTML web page
 * by a HTML script tag.
 *
 * This is mainly used in Construt.net (c3addon) IPluginInfo or IBehaviorInfo.
 * Please use their .AddRemoteScriptDependency() method to load this script as
 * type "external-dom-script"
 *
 */

// Asynchronously Load other modules in a namespace.
import( "./QuerySubmitCanvas_ModuleLoader.js" ).then( ( module ) => {
  module.ModuleLoader.Singleton.initAsync().then( ( data ) => {
    // console.log( `QuerySubmitCanvas_domSide_script.js: module loaded...`
    //   + `( ${data} )`
    // );
  } );
} )


