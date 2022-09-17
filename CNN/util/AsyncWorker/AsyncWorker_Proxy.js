export { AsyncWorker_Proxy as Proxy };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import { PromiseResolveReject } from "./AsyncWorker_PromiseResolveReject.js";
import { processingId_Resulter_Map } from "./AsyncWorker_processingId_Resulter_Map.js";
import { Resulter } from "./AsyncWorker_Resulter.js";

/**
 * Hold the worker and its related promise map. It is a wrapper of a neural network
 * web worker for handling and communicating easily.
 *
 * @member {string} workerModuleURL
 *   The (absolute) javascript module URL which will be loaded (asynchronously) by
 * worker body (stub).
 *
 * @member {Worker} worker
 *   The worker.
 *
 * @member {number} processingId_next
 *   The next processing id. Zero means no command has been sent. Every
 * postCommand_and_expectResult() call will use a new id.
 *
 * @member {processingId_Resulter_Map} the_processingId_Resulter_Map
 *   Every worker has a result pending promise map. The key of the map is processing
 * id. The value of the map is a AsyncWorker.Resulter.
 *
 */
class AsyncWorker_Proxy extends Recyclable.Root {

  /**
   * Used as default AsyncWorker.Proxy provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "AsyncWorker.Proxy.Pool",
    AsyncWorker_Proxy, AsyncWorker_Proxy.setAsConstructor );

  /** */
  constructor( workerModuleURL ) {
    super();
    AsyncWorker_Proxy.setAsConstructor_self.call( this, workerModuleURL );
  }

  /** @override */
  static setAsConstructor( workerModuleURL ) {
    super.setAsConstructor();
    AsyncWorker_Proxy.setAsConstructor_self.call( this, workerModuleURL );
    return this;
  }

  /** @override */
  static setAsConstructor_self( workerModuleURL ) {

    // Q: What if processingId become too large (e.g. infinity)?
    // A: Because Number.MAX_SAFE_INTEGER is pretty large (at least, 2 ** 52 ),
    //    it is not so easy to become out of bounds.
    //
    this.processingId_next = 0;

    if ( this.the_processingId_Resulter_Map )
      this.the_processingId_Resulter_Map.clear();
    else
      this.the_processingId_Resulter_Map = new processingId_Resulter_Map();

    AsyncWorker_Proxy.createWorker_byModuleURL.call( this, workerModuleURL );
  }

  /** @override */
  disposeResources() {

    if ( this.worker ) {
      // Note: No processingId, because this command needs not return value.
      this.postCommandArgs( [ "disposeResources" ] );
      this.worker = null;
    }

    this.workerOptions = undefined;
    this.workerURL = undefined;
    this.workerModuleURL = undefined;

    this.the_processingId_Resulter_Map.clear();

    this.processingId_next = undefined;

    super.disposeResources();
  }

  /**
   * @param {AsyncWorker_Proxy} this
   *   The worker proxy.
   */
  static createWorker_byModuleURL( workerModuleURL ) {
    this.workerModuleURL = workerModuleURL;

//!!! (2022/09/16 Remarked) Not Worked.
    this.workerURL = AsyncWorker_Proxy.create_WorkerBodyStub_URL( workerModuleURL );

//!!! (2022/09/17 Remarked) Use create_WorkerBodyStub_URL() instead.
    // let workerDataURI
    //   = AsyncWorker_Proxy.create_WorkerBodyStub_Codes_DataURI( workerModuleURL );
    //
    // this.workerURL = workerDataURI;

    // Q: Why not use "module" type worker?
    // A: A "module" type worker can not use importScripts() to load global library.
    //    (e.g. tensorflow.js)
    //
    // On the other hand, a "classic" type worker can use both importScripts() and
    // import() to load global library and module.
    //
    this.workerOptions = null;

    this.worker = new Worker( this.workerURL, this.workerOptions );

    // Register callback from the web worker.
    this.worker.onmessage
      = AsyncWorker_Proxy.onmessage_from_AsyncWorker_Body.bind( this );
  }

//!!! (2022/09/16 Remarked) Not Worked.
  /**
   * Create a URL string of AsyncWorker_BodyStub.js which is the main (i.e. body)
   * javascript file of web worker. It is viewed as a classic javascript file (i.e.
   * not an importable module). But it will load specified workerModuleURL as a module.
   *
   * @param {string} workerModuleURL
   *   An (absolute) URL to a javascript module file. It will be imported
   * (asynchronously) by classic javascript file AsyncWorker_BodyStub.js.
   */
  static create_WorkerBodyStub_URL( workerModuleURL ) {
    let encodedWorkerModuleURL = encodeURIComponent( workerModuleURL );

    // Assume the web worker module javascript file is a sibling file (i.e. inside
    // the same folder) of this module file.
    let workerBodyStubURL = new URL( "AsyncWorker_BodyStub.js", import.meta.url );
    let url = `${workerBodyStubURL}?workerModuleURL=${encodedWorkerModuleURL}`;
    return url;
  }

  /**
   * Create a data URI representing the main (i.e. body) javascript file of web worker.
   * It is viewed as a classic javascript file (i.e. not an importable module). But
   * it will load specified workerModuleURL as a module.
   *
   * In module (non-classic) web worker, static import is available. But the function
   * importScripts() will not be avbailable. For solving this problem, using
   * classic (non-module) web worker so that some global library (e.g. tensorflow.js)
   * can be loaded by importScripts(). And use dynamic import() to load ourselves
   * modules because import() can be used in classic (non-module) script.
   *
   * @param {string} workerModuleURL
   *   An (absolute) URL to a javascript module file. It will be imported
   * (asynchronously) by this generated classic javascript file (as a dataURI).
   */
  static create_WorkerBodyStub_Codes_DataURI( workerModuleURL ) {

//!!! ...unfinished... (2022/09/15)
// What if loading workerModuleURL failed?
// Re-try (but should inform this WorkerProxy and user).

    // The codes do the following:
    //
    //   - Import the specified module URL.
    //   - Create a temporary message queue.
    //   - Collect all messages before
    //       AsyncWorker_Proxy.onmessage_from_AsyncWorker_Body() be registered
    //       as message handler.
    //
    let codes = ``
      + `import( "${workerModuleURL}" );\n`
      + `AsyncWorker_Body_temporaryMessageQueue = [];\n`
      + `onmessage = ( e ) => {\n`
      // + `  console.log( "Hello" );\n`
      // + `  console.log( e );\n`
      + `  AsyncWorker_Body_temporaryMessageQueue.push( e );\n`
      + `}\n`
      ;

    let workerDataURI
      = AsyncWorker_Proxy.createDataURI_byStringASCII( "text/javascript", codes );

    return workerDataURI;
  }

  /**
   * @param {string} strMimeType  The result mime type of the data URI.
   * @param {string} strASCII     The ASCII text to be embedded in data URI.
   *
   * @return {string} Return the data URI string.
   */
  static createDataURI_byStringASCII( strMimeType, strASCII ) {
    // let textEncoder = new TextEncoder();
    // let str_utf8 = textEncoder.encode( str );
    // let str_base64 = btoa( str_utf8 );
    let str_base64 = btoa( strASCII );
    let dataURI = `data:${strMimeType};base64,${str_base64}`;
    return dataURI;
  }

  /**
   * Send command and args (perhaps, with transferable object array) to WorkerBody
   * and expect the final result.
   *
   * @param {Array} commandArgs
   *   An array (i.e. [ comand, ...args ]) which will be sent to the WorkerBody.
   *
   *   - The command is a string which is the WorkerBody's method function to be
   *       called.
   *
   *   - The args is an array which will be destructured into multiple arguments
   *       and passed into the WorkerBody's method function.
   *
   * @param {Array} transferableObjectArray
   *   The transferable object array when postMessage. It could be undefined (but
   * can not be null).
   *
   * @return {Promise}
   *   Return a promise resolved to the final value of the processing's resulter
   * from WorkerBody. (i.e. Only the Xxx of { done: true, value: Xxx } resolved.
   * All other intermediate result { done: false, value: Yyy } are discarded.)
   */
  createPromise_by_postCommandArgs( commandArgs, transferableObjectArray ) {
    let resulter = this.createResulter_by_postCommandArgs(
      commandArgs, transferableObjectArray );
    return resulter.untilDone();
  }

  /**
   * Send command and args (perhaps, with transferable object array) to WorkerBody
   * and expect result.
   *
   * @param {Array} commandArgs
   *   An array (i.e. [ comand, ...args ]) which will be sent to the WorkerBody.
   *
   *   - The command is a string which is the WorkerBody's method function to be
   *       called.
   *
   *   - The args is an array which will be destructured into multiple arguments
   *       and passed into the WorkerBody's method function.
   *
   * @param {Array} transferableObjectArray
   *   The transferable object array when postMessage. It could be undefined (but
   * can not be null).
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async generator for receving result from WorkerBody of the processing.
   */
  createResulter_by_postCommandArgs( commandArgs, transferableObjectArray ) {
    let processingId = this.processingId_next;
    ++this.processingId_next;

    // Prepare the processing's result's receiving queue before sending it.
    let resulter = this.the_processingId_Resulter_Map.createResulter_by_processingId(
      processingId );

    let processingId_commandArgs = [ processingId, ...commandArgs ];
    this.worker.postMessage( processingId_commandArgs, transferableObjectArray );
    return resulter;
  }

  /**
   * Send command and args (perhaps, with transferable object array) to WorkerBody
   * without expecting result. (i.e. fire-and-forget)
   *
   * @param {Array} commandArgs
   *   An array (i.e. [ comand, ...args ]) which will be sent to the WorkerBody.
   *
   *   - The command is a string which is the WorkerBody's method function to be
   *       called.
   *
   *   - The args is an array which will be destructured into multiple arguments
   *       and passed into the WorkerBody's method function.
   *
   * @param {Array} transferableObjectArray
   *   The transferable object array when postMessage. It could be undefined (but
   * can not be null).
   */
  postCommandArgs( commandArgs, transferableObjectArray ) {
    let processingId_commandArgs = [ undefined, ...commandArgs ]; // no processingId.
    this.worker.postMessage( processingId_commandArgs, transferableObjectArray );
  }

  /**
   * Dispatch messages come from the owned web worker. Please register this method
   * as this WorkerProxy's Worker.onmessage.
   *
   * @param {AsyncWorker_Proxy} this
   *   The "this" should be binded to this AsyncWorker_Proxy object.
   */
  static onmessage_from_AsyncWorker_Body( e ) {

    // ( e.data == [ processingId, done, value ] )
    let [ processingId, done, value ] = e.data;

    this.the_processingId_Resulter_Map.resolve_or_reject_by_processingId_done_value(
      processingId, done, value );
  }

}
