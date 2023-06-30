/**
 * @file This is a classic javascript file for loading real (specified) worker
 * body module javascript file.
 *
 * In module (non-classic) web worker, static import is available. But the
 * function importScripts() will not be avbailable. For solving this problem,
 * using classic (non-module) web worker so that some global library (e.g.
 * tensorflow.js) can be loaded by importScripts(). And use dynamic import() to
 * load ourselves modules because import() can be used in classic (non-module)
 * script.
 */

// Import the module URL specified in the query parameter.
{
  let theURLSearchParams = new URLSearchParams( location.search );
  let workerModuleURL = theURLSearchParams.get( "workerModuleURL" );
  import( workerModuleURL );
}

AsyncWorker_Body_temporaryMessageQueue = []; // Create a temporary message queue.

// Collect all messages before AsyncWorker_Body.onmessage_from_AsyncWorker_Proxy()
// be registered as message handler.
onmessage = ( e ) => {
  AsyncWorker_Body_temporaryMessageQueue.push( e );
}
