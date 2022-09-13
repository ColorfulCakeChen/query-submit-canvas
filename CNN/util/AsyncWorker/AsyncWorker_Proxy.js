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
 * @member {string} workerURL
 *   The worker's source codes URL.
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
  constructor( workerURL ) {
    super();
    AsyncWorker_Proxy.setAsConstructor_self.call( this, workerURL );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    AsyncWorker_Proxy.setAsConstructor_self.call( this, workerURL );
    return this;
  }

  /** @override */
  static setAsConstructor_self( workerURL ) {

    // Q: What if processingId become too large (e.g. infinity)?
    // A: Because Number.MAX_SAFE_INTEGER is pretty large (at least, 2 ** 52 ),
    //    it is not so easy to become out of bounds.
    //
    this.processingId_next = 0;

    if ( this.the_processingId_Resulter_Map )
      this.the_processingId_Resulter_Map.clear();
    else
      this.the_processingId_Resulter_Map = new processingId_Resulter_Map();

    AsyncWorker_Proxy.createWorker.call( this, workerURL );
  }

  /** @override */
  disposeResources() {

    if ( this.worker ) {
      // Note: No processingId, because this command needs not return value.
      this.postCommandArgs( "disposeResources" );
      this.worker = null;
    }

    this.workerOptions = undefined;
    this.workerURL = workerURL;

    this.the_processingId_Resulter_Map.clear();

    this.processingId_next = undefined;

    super.disposeResources();
  }

  /**
   * @param {AsyncWorker_Proxy} this
   *   The worker proxy.
   */
  static createWorker( workerURL ) {

//!!! ...unfinished... (2022/09/13)
// Perhaps, use a data uri contains the following source codes as workerURL:
//
// ( async () => {
//   await import( worker_body_relative_path );
// } )();
//
//
  
    let codes = '\
      onmessage = ( e ) => {\
        console.log( "Hello" );\
        console.log( e );\
      };\
    ';

    let codes_base64 = btoa( codes );
    let workerDataURI = `data:text/javascript;base64,${codes_base64}`;
    this.workerURL = workerDataURI;
 
  
//!!! (2022/09/13 Temp Remarked) Test workerDataURI
//    this.workerURL = workerURL;

    // Should not use "module" type worker, otherwise the worker can not use
    // importScripts() to load tensorflow.js library.
    //
    //this.workerOptions = { type: "module" }; // So that the worker script could use import statement.
    this.workerOptions = null;

    this.worker = new Worker( this.workerURL, this.workerOptions );

    // Register callback from the web worker.
    this.worker.onmessage = AsyncWorker_Proxy.onmessage_from_AsyncWorker_Body.bind( this );
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
   *   - The args is an array which will be destructured into multiple argements
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
   *   - The args is an array which will be destructured into multiple argements
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

    this.worker.postMessage( commandArgs, transferableObjectArray );
    return resulter;
  }

  /**
   * Send command and args (perhaps, with transferable object array) to WorkerBody
   * without expecting result. (i.e. fire-and-forget)
   *
   * @param {Array} commandArgs
   *   An array (i.e. [ comand, ...args ]) which will be sent to the WorkerBody.
   *
   * @param {Array} transferableObjectArray
   *   The transferable object array when postMessage. It could be undefined (but
   * can not be null).
   */
  postCommandArgs( commandArgs, transferableObjectArray ) {
    this.worker.postMessage( commandArgs, transferableObjectArray );
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

    this.the_processingId_Resulter_Map.resolve_by_processingId_done_value(
      processingId, done, value );
  }

}
