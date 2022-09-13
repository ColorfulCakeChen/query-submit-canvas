/**
 * @file This file is the main (i.e. body) javascript file of web worker. It is not
 * an importable module.
 *
 * In module (non-classic) web worker, static import is available. But at the same
 * time, importScripts() will not be avbailable. For solving this problem, using
 * classic (non-module) web worker so that some global library (e.g. tensorflow.js)
 * can be loaded by importScripts(). And use dynamic import() to load ourselves
 * modules because import() can be used in classic (non-module) script.
 */

import { AsyncWorker_Body_tester } from "./AsyncWorker_Body_tester.js";

globalThis.onmessage = ( e ) => {
  console.log( "Hi4" );
  console.log( e );
};

//import( "./AsyncWorker_Body_tester.js" );

//!!! (2022/09/13 Remarked) use import() at global.
import( "./AsyncWorker_Body_tester.js" ).then( () => {
  globalThis.onmessage = ( e ) => {
    console.log( "Hi3" );
    console.log( e );
  };
});

//!!! (2022/09/13 Remarked) use import() at global.
// ( async () => {
//   await import( "./AsyncWorker_Body_tester.js" );
// } )();

//!!! (2022/09/13 Remarked) use .then().
// globalThis.onmessage = ( e ) => {
//   console.log( "Hi2" );
//   console.log( e );
// };
