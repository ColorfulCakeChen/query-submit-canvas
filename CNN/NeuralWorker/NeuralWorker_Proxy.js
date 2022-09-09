export { PendingPromiseInfo };
export { NeuralWorker_Proxy as Proxy };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
//import * as ValueMax from "../util/ValueMax.js";
import * as NeuralNet from "../Conv/NeuralNet.js";

/**
 * Hold a processing's id, promise, resolve (fulfilling function object), reject
 * (rejecting function object).
 *
 * @member {number}   processingId The id of the processing.
 * @member {number}   workerId     The array index of the worker owns this processing.
 * @member {Promise}  promise      The pending promise for the processing.
 *
 * @member {function} resolve
 *   The fulfilling function object of the pending promise for the processing.
 *
 * @member {function} reject
 *   The rejecting function object of the pending promise for the processing.
 */
class PromiseResolveReject {

  constructor( processingId, workerId ) {
    this.processingId = processingId;
    this.workerId = workerId;

    this.promise = new Promise( ( resolve, reject ) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

}

/**
 * Hold two PromiseResolveReject.
 *
 * @member {PromiseResolveReject} process
 *   The promise for reporting worker's function execution done.
 *
 * @member {PromiseResolveReject} relay
 *   The promise for reporting scaledSourceImageData received from this web worker.
 */
class ProcessRelayPromises {

  constructor( processingId, workerId ) {
    this.process = new PromiseResolveReject( processingId, workerId );
    this.relay = new PromiseResolveReject( processingId, workerId );
  }

}

/**
 * Hold the worker and its related promise map. It is a wrapper of a neural network
 * web worker for handling and communicating easily.
 *
 * @member {number} workerId  The array index of this worker proxy.
 * @member {Worker} worker    The worker.
 *
 * @member {Map}    pendingPromiseInfoMap
 *   The map for promise of the unhandled processing.
 */
class NeuralWorker_Proxy extends Recyclable.Root {

  /**
   * Used as default NeuralWorker.Proxy provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralWorker.Proxy.Pool",
    NeuralWorker_Proxy, NeuralWorker_Proxy.setAsConstructor );

  /** */
  constructor() {
    super();
    NeuralWorker_Proxy.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    NeuralWorker_Proxy.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Every worker has a result pending promise map. The key of the map is processing
    // id. The value of the map is a ProcessRelayPromises.
    if ( this.processRelayPromisesMap )
      this.processRelayPromisesMap.clear();
    else
      this.processRelayPromisesMap = new Map();
  }

  /** @override */
  disposeResources() {
    this.disposeWorker();

    this.workerOptions = undefined;
    this.workerURL = undefined;

    this.tensorflowJsURL = undefined;
    this.workerId = undefined;

    this.processRelayPromisesMap.clear();
    super.disposeResources();
  }

  /**
   * Initialize this worker proxy. It will create one web worker and inform it to
   * create one neural network.
   *
   * @param {number} workerId
   *   This id of this worker proxy (and web worker). This is the array index in the
   * parent container (i.e. WorkerProxies).
   *
   * @param {string} tensorflowJsURL
   *   The URL of tensorflow javascript library. Every worker will load the library
   * from the URL.
   */
  async init_async( processingId, workerId, tensorflowJsURL ) {

    this.workerId = workerId;
    this.tensorflowJsURL = tensorflowJsURL;

//!!! ...unfinished... (2022/08/24) Why not use "./NeuralWorker_Body.js"?
// The import.meta.url should extract the path (exclude file name)

    // Assume the main (i.e. body) javascript file of neural network web worker is
    // a sibling file (i.e. inside the same folder) of this module file.
    this.workerURL = new URL( "NeuralWorker_Body.js", import.meta.url );

    // Should not use "module" type worker, otherwise the worker can not use
    // importScripts() to load tensorflow.js library.
    //
    //this.workerOptions = { type: "module" }; // So that the worker script could use import statement.
    this.workerOptions = null;

    let worker = this.worker = new Worker( this.workerURL, this.workerOptions );

    // Register callback from the web worker.
    worker.onmessage = NeuralWorker_Proxy.onmessage_from_NeuralWorker_Body.bind( this );

    // Worker Initialization message.
    let data = {
      processingId: processingId,
      command: "initWorker_async",
      args: {
        workerId: workerId,
        tensorflowJsURL: tensorflowJsURL,
      }
    };
    worker.postMessage( data );  // Inform the worker to initialize.

//!!! ...unfinished... (2022/08/27)
// Perhaps, use MessageChannel instead of window.onmessage().
// Otherwise, original window.onmessage() will be replaced (i.e. destroyed) by our system.

//!!! ...unfinished... (2022/09/09)
// should await NeuralWorker_Body report init done.

  }

  /**
   * 
   */
  disposeWorker() {

//!!! ...unfinished... (2022/09/08) also MessagePort.close().

    {
      let data = { command: "disposeWorker" };
      this.worker.postMessage( data );
      this.worker = null;
    }

  }

  /**
   * @param {Object} neuralNetParamsBase
   *   The configuration of the neural network to be created.
   *
   * @param {ArrayBuffer} weightArrayBuffer
   *   The neural network's weights. It will be interpreted as Float32Array.
   */
  async neuralNet_create_async( processingId, neuralNetParamsBase, weightArrayBuffer ) {
    let data = {
      processingId: processingId,
      command: "neuralNet_create_async",
      args: {
        neuralNetParamsBase: neuralNetParamsBase,
        weightArrayBuffer: weightArrayBuffer,
      }
    };
    this.worker.postMessage( data, [ weightArrayBuffer ] );

//!!! ...unfinished... (2022/09/09)
// should await its done.

  }

  /**
   * @param {number} markValue
   *   A value representing which alignment this neural network plays currently.
   */
  async alignmentMark_setValue_async( processingId, markValue ) {


//!!! ...unfinished... (2022/09/09) needs processingId for reporting.

    let data = {
      processingId: processingId,
      command: "alignmentMark_setValue",
      args: {
        markValue: markValue,
      }
    };
    worker.postMessage( data );

//!!! ...unfinished... (2022/09/09)
// should await its done.

  }


  /**
   * @param {number} processingId
   *   The processing id for distinguishing different processing request and result.
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. Its shape should be [ height, width,
   * channelCount ] = [ this.neuralNet.sourceImageHeightWidth[ 0 ],
   * this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ].
   * This usually is called for the first web worker in chain. The web worker will
   * transfer back a scaled typed-array. The scaled typed-array should be used to call
   * the next web worker's typedArray_transferBack_processTensor_async().
   *
   * @return {Promise}
   *   Return a promise which will be resolved when this (WorkerProxy owned) web
   * worker's neural network computing done. It resolved with a typed-array which
   * comes from the output tensor of the web worker's neural network.
   */
  imageData_transferBack_processTensor_async( processingId, sourceImageData ) {

    // Prepare promises and their function object (resolve and reject) in a map so that
    // the promises can be found and resolved when processing is done.
    //
    //   - The processRelayPromises.relay.promise will be await by outter (i.e.
    //       WorkerProxies) to transfer source typed-array to every web worker
    //       serially.
    //
    //   - The processRelayPromises.process.promise will be returned as the result
    //       of this processTensor().
    //
    let processRelayPromises = new ProcessRelayPromises( processingId, this.workerId );
    this.processRelayPromisesMap.set( processingId, processRelayPromises );

    // Transfer (not copy) the source image data to this (worker proxy owned) web worker.
    let message = {
      command: "imageData_transferBack_processTensor",
      processingId: processingId,

//!!! ...unfinished... (2022/09/08)
// ImageData may not be transferred directly. Perhaps, transfer its .data.buffer
// (a Uint8Array) directly along with its ( height, width, channelCount ) information.
      sourceImageData: sourceImageData

      // height: ???,
      // width: ???,
      // channelCount: ???,
    };

    this.worker.postMessage( message, [ message.sourceImageData.data.buffer ] );

    // Now, sourceImageData.data.buffer has become invalid because it is transferred
    // (not copied) to web worker.

    return processRelayPromises.process.promise;
  }

  /**
   * @param {number} processingId
   *   The processing id for distinguishing different processing request and result.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-data to be processed. Its shape should be [ height, width,
   * channelCount ] = [ this.neuralNet.sourceImageHeightWidth[ 0 ],
   * this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ].
   * This usually is come from the previous web work by on_transferBackSourceTypedArray().
   * This usually is called for the second (and after) web worker in chain. The web
   * worker will tansfer back this scaled typed-array. The scaled typed-array should
   * continuously be used to call the next web worker's
   * typedArray_transferBack_processTensor_async().
   *
   * @return {Promise}
   *   Return a promise which will be resolved when this (WorkerProxy owned) web
   * worker's neural network computing done. It resolved with a typed-array which
   * comes from the output tensor of the web worker's neural network.
   */
  typedArray_transferBack_processTensor_async( processingId, sourceTypedArray ) {

    // Prepare promises and their function object (resolve and reject) in a map so that
    // the promises can be found and resolved when processing is done.
    //
    //   - The processRelayPromises.relay.promise will be await by outter (i.e.
    //       WorkerProxies) to transfer source typed-array to every web worker
    //       serially.
    //
    //   - The processRelayPromises.process.promise will be returned as the result
    //       of this processTensor().
    //
    let processRelayPromises = new ProcessRelayPromises( processingId, this.workerId );
    this.processRelayPromisesMap.set( processingId, processRelayPromises );
    
    // Transfer (not copy) the source typed-array to this (worker proxy owned) web worker.
    let message = {
      command: "typedArray_transferBack_processTensor",
      processingId: processingId,
      sourceTypedArray: sourceTypedArray
    };

    this.worker.postMessage( message, [ message.sourceTypedArray.buffer ] );

    // Now, sourceTypedArray.buffer has become invalid because it is transferred
    // (not copied) to web worker.

    return processRelayPromises.process.promise;
  }

  /**
   * This will not transfer source back to WorkerProxy. This is different from
   * typedArray_transferBack_processTensor_async().
   *
   * @param {number} processingId
   *   The processing id for distinguishing different processing request and result.
   *
   * @param {Float32Array} sourceTypedArray
   *   The source typed-data to be processed. Its shape should be [ height, width,
   * channelCount ] = [ this.neuralNet.sourceImageHeightWidth[ 0 ],
   * this.neuralNet.sourceImageHeightWidth[ 1 ], this.neuralNet.config.sourceChannelCount ].
   * This usually is come from the previous web work by on_transferBackSourceTypedArray().
   *
   * @return {Promise}
   *   Return a promise which will be resolved when this (WorkerProxy owned) web
   * worker's neural network computing done. It resolved with a typed-array which
   * comes from the output tensor of the web worker's neural network.
   */
  typedArray_processTensor_async( processingId, sourceTypedArray ) {

    // Prepare promises and their function object (resolve and reject) in a map so that
    // the promises can be found and resolved when processing is done.
    //
    //   - The processRelayPromises.relay.promise will not be used because the source
    //       typed-array will not be transferred back here.
    //
    //   - The processRelayPromises.process.promise will be returned as the result
    //       of this processTensor().
    //
    let processRelayPromises = new ProcessRelayPromises( processingId, this.workerId );
    this.processRelayPromisesMap.set( processingId, processRelayPromises );

    // Copy (not transfer) the source typed-array to this (worker proxy owned) web worker.
    let message = {
      command: "typedArray_processTensor",
      processingId: processingId,
      sourceTypedArray: sourceTypedArray
    };

    this.worker.postMessage( message );

    return processRelayPromises.process.promise;
  }

  /**
   * Called when the scaled source typed-array from web worker is received.
   */
  on_transferBackSourceTypedArray( workerId, processingId, sourceTypedArray ) {

    if ( workerId != this.workerId )
      return; // Ignore if wrong worker id.

    let processRelayPromises = this.processRelayPromisesMap.get( processingId );
    if ( !processRelayPromises )
      return; // Ignore if processing id does not existed. (e.g. already handled)

    // This will be received by WorkerProxies.
    processRelayPromises.relay.resolve( sourceTypedArray );

    // Here, the processRelayPromises should not be removed from processRelayPromisesMap.
    // It will be removed when processTensor() done completely (i.e. inside
    // on_processTensorResult()).
  }

//!!! (2022/09/09 Remarked) no longer necessary.
//   /**
//    * Called when the processed tensor from web worker is received.
//    *
//    * @param {number} workerId
//    *   The id of the worker which sent the result back.
//    *
//    * @param {number} processingId
//    *   The processing id of the result.
//    *
//    * @param {TypedArray} resultTypedArray
//    *   The result of the returned processing. It is the downloaded data of the result
//    * tensor.
//    */
//   on_processTensorResult( workerId, processingId, resultTypedArray ) {
//
//     if ( workerId != this.workerId )
//       return; // Ignore if wrong worker id.
//
//     let processRelayPromises = this.processRelayPromisesMap.get( processingId );
//     if ( !processRelayPromises )
//       return; // Discard result with non-existed processing id. (e.g. already handled old processing result)
//
//     processRelayPromises.process.promise.resolve( resultTypedArray );
//
// //!!! ...unfinished... When will fail?
//     //processRelayPromises.reject();
//
// //!!! ...unfinished... Whether should the older (i.e. smaller) processingId be cleared from map? (Could the processing be out of order?)
//
//     // Clear the info entry of handled processing result.
//     this.processRelayPromisesMap.delete( processingId );
//   }

  /**
   * Dispatch messages come from the owned web worker.
   *
   * @param {Base} this
   *   Should be binded to this object.
   */
  static onmessage_from_NeuralWorker_Body( e ) {

    // e.data == { processingId, workerId, result }
    let processingId = e.data.processingId;
    let workerId = e.data.workerId;
    let result = e.data.result;

    if ( workerId != this.workerId )
      return; // Ignore if wrong worker id.

    // Discard result with non-existed processing id. (e.g. already handled old
    // processing result)
    let processRelayPromises = this.processRelayPromisesMap.get( processingId );
    if ( !processRelayPromises )
      return;

    processRelayPromises.process.resolve( result );

//!!! ...unfinished... When will fail?
    //processRelayPromises.reject();

//!!! ...unfinished... Whether should the older (i.e. smaller) processingId be cleared from map? (Could the processing be out of order?)

//!!! ...unfinished... (2022/09/09)
// What about processRelayPromises.relay?
// When to resolve it (before the promise be deleted)?

    // Clear the info entry of handled processing result.
    this.processRelayPromisesMap.delete( processingId );


//!!! (2022/09/09 Remarked) Using processingId look up instead.
//     let message = e.data;
//
//     switch ( message.command ) {
// //!!! ...unfinished... 
//       case "initWorker_done": //{ command: "initWorker_done",  };
//         break;
//
// //!!! ...unfinished... 
//       case "reportInitProgress": //{ command: "reportInitProgress", subCommand, workerId, ,  };
//         this.on_reportInitProgress( message );
//         break;
//
//       case "transferBackSourceTypedArray": //{ command: "transferBackSourceTypedArray", workerId, processingId, sourceTypedArray };
//         this.on_transferBackSourceTypedArray(
//           message.workerId, message.processingId, message.sourceTypedArray );
//         break;
//
//       case "processTensorResult": //{ command: "processTensorResult", workerId, processingId, resultTypedArray };
//         this.on_processTensorResult(
//           message.workerId, message.processingId, message.resultTypedArray );
//         break;
//
//     }
  }

}
