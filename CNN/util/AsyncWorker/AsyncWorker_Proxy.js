export { AsyncWorker_Proxy as Proxy };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";
import { PromiseResolveReject } from "./AsyncWorker_PromiseResolveReject.js";
import { processingId_Resulter_Map } from "./AsyncWorker_processingId_Resulter_Map.js";
import { Resulter } from "./AsyncWorker_Resulter.js";
import * as AsyncWorker_Checker from "./AsyncWorker_Checker.js";

/**
 * Hold the worker and its related promise map. It is a wrapper of a web
 * worker for handling and communicating easily.
 *
 *
 * 1. Web Worker Body Stub
 *
 * In module (non-classic) web worker, static import is available. But the
 * function importScripts() will not be avbailable. For solving this
 * problem, using classic (non-module) web worker so that some global
 * library (e.g. tensorflow.js) can be loaded by importScripts(). And use
 * dynamic import() to load ourselves modules because import() can be used
 * in classic (non-module) script.
 *
 *
 * 2. Prefectch
 *
 * Q: What if failed when loading workerModuleURL (e.g. Internet disconnected)?
 * A: Although it can use (binary) exponential back-off waiting and retry,
 *    however, it seems that retry importing does not work even network
 *    connection has been recovery.
 *
 * A possible solution is prefetching all these modules in Xxx_Proxy side.
 * Then, even if Internet disconnected when creating worker body, they
 * can still be loaded from disk cache (by browser automatically).
 *
 *
 *
 * @member {string} workerModuleURL
 *   The (absolute) module URL of the worker body class. It will be loaded
 * (asynchronously) by web worker body stub. The class must be exported as
 * default. An instance of the worker body class (e.g. NeuralWorker_Body) will
 * be created and put in its .Singleton (e.g. NeuralWorker_Body.Singleton).
 *
 * @member {Worker} worker
 *   The worker.
 *
 * @member {number} processingId_next
 *   The next processing id. Zero means no command has been sent. Every
 * postCommand_and_expectResult() call will use a new id. (If it becomes too
 * large, it will be wrapped to 1 (not 0 because 0 means no id has been issued)
 * to restart counting).
 *
 * @member {processingId_Resulter_Map} the_processingId_Resulter_Map
 *   Every worker has a result pending promise map. The key of the map is
 * processing id. The value of the map is a AsyncWorker.Resulter.
 *
 */
class AsyncWorker_Proxy extends Recyclable.Root {

  /**
   * Used as default AsyncWorker.Proxy provider for conforming to Recyclable
   * interface.
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

    // Since the web worker has been informed to be terminated, reject all
    // Resulters' pending promises so that all awaiters (on these promises)
    // will not be blocked forever.
    this.the_processingId_Resulter_Map.reject_all_pending_by_errorReason(
      AsyncWorker_Proxy.disposeResources_rejectReason );

    this.workerBlobObjectURL_dispose();

    this.workerOptions = undefined;
    this.workerURL = undefined;
    this.workerModuleURL = undefined;

    this.the_processingId_Resulter_Map.clear();

    this.processingId_next = undefined;

    super.disposeResources();
  }

  /** */
  workerBlobObjectURL_dispose() {
    if ( this.workerBlobObjectURL ) {
      URL.revokeObjectURL( this.workerBlobObjectURL );
      this.workerBlobObjectURL = null;
    }
  }

  /**
   * @param {AsyncWorker_Proxy} this
   *   The worker proxy.
   */
  static createWorker_byModuleURL( workerModuleURL ) {
    this.workerModuleURL = workerModuleURL;

    // Use blob object URL as a workaround for cross origin web worker problem
    // (which will be encountered if using data URI or using query parameters
    // in the WorkerBodyStub_URL).
    this.workerBlobObjectURL = AsyncWorker_Proxy
      .WorkerBodyStub_create_Codes_BlobObjectURL( workerModuleURL );

    this.workerURL = this.workerBlobObjectURL;

    // Q: Why not use "module" type worker?
    // A: A "module" type worker can not use importScripts() to load global
    //    library. (e.g. tensorflow.js)
    //
    // On the other hand, a "classic" type worker can use both importScripts()
    // and import() to load global library and module.
    //
    this.workerOptions = null;

    this.worker = new Worker( this.workerURL, this.workerOptions );

    // Register callback from the web worker.
    this.worker.onmessage
      = AsyncWorker_Proxy.onmessage_from_AsyncWorker_Body.bind( this );
  }

  /**
   * @return {string}
   *   Return a newly created BlobObjectURL string representing the main (i.e.
   * web worker body stub) javascript file of web worker. It is viewed as a
   * classic javascript file (i.e. not an importable module). But it will load
   * specified workerModuleURL as a module.
   */
  static WorkerBodyStub_create_Codes_BlobObjectURL( workerModuleURL ) {
    let codes = AsyncWorker_Proxy
      .WorkerBodyStub_create_Codes_String( workerModuleURL );

    let blob = new Blob( [ codes ],
      { type: AsyncWorker_Proxy.JS_MIME_TYPE_STRING } );

    let workerBlobObjectURL = URL.createObjectURL( blob );
    return workerBlobObjectURL;
  }

  /**
   *
   * @return {string}
   *   Return a javascript codes string representing the main (i.e. web worker
   * body stub) javascript file of web worker. It is viewed as a classic
   * javascript file (i.e. not an importable module). But it will load
   * specified workerModuleURL as a module.
   */
  static WorkerBodyStub_create_Codes_String( workerModuleURL ) {

    // The codes do the following:
    //
    //   - Import the specified module URL.
    //   - Create a singleton instance of worker body class (which must have
    //       been exported as default).
    //   - Create a temporary message queue.
    //   - Collect all messages before
    //       AsyncWorker_Proxy.onmessage_from_AsyncWorker_Body() be registered
    //       as message handler.
    //
    let codes = ``
      + `( async () => {\n`
      + `  const workerModuleURL = "${workerModuleURL}";\n`
      + `  let importPromise = import( workerModuleURL );\n`
      + `  let importModule = await importPromise;\n`
      + `  importModule.default.Singleton = new importModule.default();\n`
      + `} )();\n`
      + `AsyncWorker_Body_temporaryMessageQueue = [];\n`
      + `onmessage = ( e ) => {\n`
      // + `  console.log( "Hello" );\n`
      // + `  console.log( e );\n`
      + `  AsyncWorker_Body_temporaryMessageQueue.push( e );\n`
      + `}\n`
      ;


    // Q: What if import( workerModuleURL ) failed?
    // A: It will fail forever unless user reload web page.
    //
    // Although we can design some mechanism to use (binary) exponential
    // back-off waiting and retry import(), it seems that retry importing does
    // not work even network connection has been recovery. (This is according
    // to experiment.)
    //



//!!! (2023/03/22 Added and Remarked) Not workable old codes.
// //!!! ...unfinished... (2023/03/22)
// // Perhaps, use (binary) exponential back-off waiting and retry.
// //
// // Experiment result: It seems that retry importing does not work
// // even network connection has been recovery.
//
//     // The codes do the following:
//     //
//     //   - Import the specified module URL.
//     //   - Create a temporary message queue.
//     //   - Collect all messages before
//     //       AsyncWorker_Proxy.onmessage_from_AsyncWorker_Body() be registered
//     //       as message handler.
//     //
//     let codes = ``
//       + `( async () => {\n`
//       + `  function sleep( delayMilliseconds ) {\n`
//       + `    return new Promise( ( resolve ) => {\n`
//       + `      setTimeout( () => resolve(), delayMilliseconds );\n`
//       + `    } );\n`
//       + `  }\n`
//       + `\n`
//       + `  function getRandomIntInclusive_by_minInt_kindsInt( minInt, kindsInt ) {\n`
//       + `    return Math.floor( ( Math.random() * kindsInt ) + minInt );\n`
//       + `  }\n`
//       + `\n`
//       + `  function getRandomIntInclusive( min, max ) {\n`
//       + `    let minReal = Math.min( min, max );\n`
//       + `    let maxReal = Math.max( min, max );\n`
//       + `    let minInt = Math.ceil( minReal );\n`
//       + `    let maxInt  = Math.floor( maxReal );\n`
//       + `    let kindsInt = maxInt - minInt + 1;\n`
//       + `    return getRandomIntInclusive_by_minInt_kindsInt( minInt, kindsInt );\n`
//       + `  }\n`
//       + `\n`
//       + `  function getRandomInt_TruncatedBinaryExponent( exponent, exponentMax ) {\n`
//       + `    let exponentRestricted = Math.min( exponent, exponentMax );\n`
//       + `    let exponentZeroOrPositive = Math.max( 0, exponentRestricted );\n`
//       + `    let power = ( 2 ** exponentZeroOrPositive );\n`
//       + `    let randomInt = getRandomIntInclusive( 0, power );\n`
//       + `    return randomInt;\n`
//       + `  }\n`
//       + `\n`
//       + `  function importBody() {\n`
//       + `    const workerModuleURL = "${workerModuleURL}";\n`
//       + `    let importPromise = import( workerModuleURL );\n`
//       + `    return importPromise;\n`
//       + `  }\n`
//       + `\n`
//       + `  const retryWaitingSecondsExponentMax = 6;\n`
//       + `  let retryTimesCur = 0;\n`
//       + `  let importDone = false;\n`
//       + `  let importModule;\n`
//       + `  do {\n`
//       + `    try {\n`
//       + `      let importPromise = importBody();\n`
//       + `      importModule = await importPromise;\n`
//       + `      importDone = true;\n`
//       + `    } catch ( e ) {\n`
//       // + `      debugger;\n`
//       + `      ++retryTimesCur;\n`
//       + `      let retryWaitingMillisecondsMax\n`
//       + `            = 1000 * getRandomInt_TruncatedBinaryExponent(\n`
//       + `                retryTimesCur, retryWaitingSecondsExponentMax );\n`
//       + `      console.log( \`Wait \${retryWaitingMillisecondsMax} milliseconds...\` );\n`
//       + `      await sleep( retryWaitingMillisecondsMax );\n`
//       + `      console.log( \`Retry import worker body...\` );\n`
//       + `    }\n`
//       + `  } while ( !importDone );\n`
//       + `  importModule.default.Singleton = new importModule.default();\n`
//       + `} )();\n`
//       + `\n`
//       + `AsyncWorker_Body_temporaryMessageQueue = [];\n`
//       + `onmessage = ( e ) => {\n`
//       // + `  console.log( "Hello" );\n`
//       // + `  console.log( e );\n`
//       + `  AsyncWorker_Body_temporaryMessageQueue.push( e );\n`
//       + `}\n`
//       ;

    return codes;
  }

  /**
   * Send command and args (perhaps, with transferable object array) to
   * WorkerBody and expect the final result.
   *
   * @param {Array} commandArgs
   *   An array (i.e. [ comand, ...args ]) which will be sent to the WorkerBody.
   *
   *   - The command is a string which is the WorkerBody's method function to
   *       be called.
   *
   *   - The args is an array which will be destructured into multiple
   *       arguments and passed into the WorkerBody's method function.
   *
   * @param {Array} transferableObjectArray
   *   The transferable object array when postMessage. It could be undefined
   * (but can not be null).
   *
   * @return {Promise}
   *   Return a promise resolved to the final value of the processing's
   * resulter from WorkerBody. (i.e. Only the Xxx of { done: true, value: Xxx }
   * resolved. All other intermediate result { done: false, value: Yyy } are
   * discarded.)
   */
  createPromise_by_postCommandArgs( commandArgs, transferableObjectArray ) {
    let resulter = this.createResulter_by_postCommandArgs(
      commandArgs, transferableObjectArray );
    return resulter.untilDone();
  }

  /**
   * Send command and args (perhaps, with transferable object array) to
   * WorkerBody and expect result.
   *
   * @param {Array} commandArgs
   *   An array (i.e. [ comand, ...args ]) which will be sent to the WorkerBody.
   *
   *   - The command is a string which is the WorkerBody's method function to
   *       be called.
   *
   *   - The args is an array which will be destructured into multiple
   *       arguments and passed into the WorkerBody's method function.
   *
   * @param {Array} transferableObjectArray
   *   The transferable object array when postMessage. It could be undefined
   * (but can not be null).
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async iterator for receving result from WorkerBody of the
   * processing.
   */
  createResulter_by_postCommandArgs( commandArgs, transferableObjectArray ) {
    let processingId = this.processingId_next;

    // Q: What if processingId become too large (e.g. infinity)?
    // A: Because Number.MAX_SAFE_INTEGER is pretty large (at least, 2 ** 52 ),
    //    it is not so easy to become out of bounds.
    //
    // (2025/06/11 Modified)
    // If it becomes too large, it will be wrapped to 1 (not 0 because 0 means
    // no id has been issued) to restart counting).
    //
    if ( this.processingId_next === Number.MAX_SAFE_INTEGER )
      this.processingId_next = 1;
    else
      ++this.processingId_next;

    // Prepare the processing's result's receiving queue before sending it.
    let resulter = this.the_processingId_Resulter_Map
      .createResulter_by_processingId( processingId );

    let processingId_commandArgs = [ processingId, ...commandArgs ];
    this.worker.postMessage(
      processingId_commandArgs, transferableObjectArray );

    // Check large objects are transferred (rather than copied) to ensure
    // performance.
    {
      let bTransferred = AsyncWorker_Checker
        .ImageData_ArrayBuffer_TypedArray_isTransferred( commandArgs );

      if ( !bTransferred )
        throw Error( `AsyncWorker_Proxy.createResulter_by_postCommandArgs(): `
          + `bTransferred ( ${bTransferred} ) should be ( true ) `
          + `after commandArgs transferred to worker. `
          + `commandArgs=[ ${commandArgs} ]`
        );
    }

    return resulter;
  }

  /**
   * Send command and args (perhaps, with transferable object array) to
   * WorkerBody without expecting result. (i.e. fire-and-forget)
   *
   * @param {Array} commandArgs
   *   An array (i.e. [ comand, ...args ]) which will be sent to the WorkerBody.
   *
   *   - The command is a string which is the WorkerBody's method function to
   *       be called.
   *
   *   - The args is an array which will be destructured into multiple
   *       arguments and passed into the WorkerBody's method function.
   *
   * @param {Array} transferableObjectArray
   *   The transferable object array when postMessage. It could be undefined
   * (but can not be null).
   */
  postCommandArgs( commandArgs, transferableObjectArray ) {
    // Note: no processingId.
    let processingId_commandArgs = [ undefined, ...commandArgs ];

    this.worker.postMessage(
      processingId_commandArgs, transferableObjectArray );

    // Check large objects are transferred (rather than copied) to ensure
    // performance.
    {
      let bTransferred = AsyncWorker_Checker
        .ImageData_ArrayBuffer_TypedArray_isTransferred( commandArgs );

      if ( !bTransferred )
        throw Error( `AsyncWorker_Proxy.postCommandArgs(): `
          + `bTransferred ( ${bTransferred} ) should be ( true ) `
          + `after commandArgs transferred to worker. `
          + `commandArgs=[ ${commandArgs} ]`
        );
    }
  }

  /**
   * Dispatch messages come from the owned web worker. Please register this
   * method as this WorkerProxy's Worker.onmessage.
   *
   * @param {AsyncWorker_Proxy} this
   *   The "this" should be binded to this AsyncWorker_Proxy object.
   */
  static onmessage_from_AsyncWorker_Body( e ) {

    // If the web worker source is blob object URL, revoke it after worker
    // created successfully for release resource.
    this.workerBlobObjectURL_dispose();

    // ( e.data == [ processingId, done, value ] )
    let [ processingId, done, value ] = e.data;

    this.the_processingId_Resulter_Map .resolve_or_reject_by_processingId_done_value(
        processingId, done, value );
  }

}

AsyncWorker_Proxy.JS_MIME_TYPE_STRING = "text/javascript";

AsyncWorker_Proxy.disposeResources_rejectReason
  = "AsyncWorker.Proxy.disposeResources() is called.";
