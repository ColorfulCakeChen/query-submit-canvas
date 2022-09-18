export { NeuralWorker_Proxy as Proxy };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as AsyncWorker from "../util/AsyncWorker.js";
//import * as ValueMax from "../util/ValueMax.js";
import * as NeuralNet from "../Conv/NeuralNet.js";

//!!! ...unfinished... (2022/09/15)
// What if failed when:
//   - library (tensorflow.js) downloading
//   - worker starting (also a kind of library downloading)
//   - versus downloading
//   - versus result sending
//
// Perhaps, needs a life-cycle manager to handle them gracefully.

/**
 * Hold the worker and its related promise map. It is a wrapper of a neural network
 * web worker for handling and communicating easily.
 *
 */
class NeuralWorker_Proxy extends AsyncWorker.Proxy {

  /**
   * Used as default NeuralWorker.Proxy provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralWorker.Proxy.Pool",
    NeuralWorker_Proxy, NeuralWorker_Proxy.setAsConstructor );

  /** */
  constructor() {
    super( NeuralWorker_Proxy.workerModuleURL );
    NeuralWorker_Proxy.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor( NeuralWorker_Proxy.workerModuleURL );
    NeuralWorker_Proxy.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    this.NeuralNetParamsBase_dispose();
    this.workerId = undefined;
    super.disposeResources();
  }

  /** Release the neural network configuration. */
  NeuralNetParamsBase_dispose() {
    if ( this.neuralNetParamsBase ) {
      this.neuralNetParamsBase.disposeResources_and_recycleToPool();
      this.neuralNetParamsBase = null;
    }
  }

  /**
   * Initialize this worker proxy. It will create one web worker and inform it to
   * create one neural network.
   *
   * @param {number} workerId
   *   This id of this worker proxy (and web worker). This is the array index in the
   * parent container (i.e. WorkerProxies).
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if success.
   *   - Resolved to false, if failed.
   */
  initWorker_async( workerId ) {
    this.workerId = workerId;
    return this.createPromise_by_postCommandArgs(
      [ "initWorker", workerId ]
    );
  }

  /**
   * @param {NeuralNet.ParamsBase} neuralNetParamsBase
   *   The configuration of the neural network to be created. This configuration will be
   * owned (i.e. kept and destroyed) by this NeuralWorker.Proxy.
   *
   * @param {ArrayBuffer} weightArrayBuffer
   *   The neural network's weights. It will be interpreted as Float32Array.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if success.
   *   - Resolved to false, if failed.
   */
  NeuralNet_create_async( neuralNetParamsBase, weightArrayBuffer ) {
    this.NeuralNetParamsBase_dispose();
    this.neuralNetParamsBase = neuralNetParamsBase;
    return this.createPromise_by_postCommandArgs(
      [ "NeuralNet_create", neuralNetParamsBase, weightArrayBuffer ],
      [ weightArrayBuffer ]
    );
  }

  /**
   * @param {integer} markValue
   *   A value representing which alignment this neural network plays currently.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if success.
   *   - Resolved to false, if failed.
   */
  alignmentMark_setValue_async( markValue ) {
    return this.createPromise_by_postCommandArgs(
      [ "alignmentMark_setValue", markValue ]
    );
  }

  /**
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed.
   *
   *   - Its shape needs not match this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the correct
   *       shape before passed into the neural network.
   *
   *   - This usually is called for the 1st web worker in chain. The scaled Int32Array
   *       will be transferred back to WorkerProxy for the 2nd web worker.
   *
   *   - The scale Int32Array will be filled by alignment mark, and then converted into
   *       tensor3d, and then processed by neural network.
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async generator tracking the result of processing. It will yield two
   * times, the 1st is an Int32Array, the 2nd is a Float32Array.
   *
   * @yield {Int32Array}
   *   Resolve to { done: false, value: Int32Array }. The value is an Int32Array
   * representing the scaled image data whose shape is this.neuralNetParamsBase's
   * [ input_height, input_width, input_channelCount ].
   *
   * @yield {Float32Array}
   *   Resolve to { done: true, value: Float32Array }. The value is a Float32Array
   * representing the neural network's result whose channel count is
   * this.neuralNetParamsBase.output_channelCount.
   */
  ImageData_scale_fork_fill_process_asyncGenerator( sourceImageData ) {
    return this.createResulter_by_postCommandArgs(
      [ "ImageData_scale_fork_fill_process", sourceImageData ],
      [ sourceImageData.data.buffer ]
    );
  }

  /**
   *
   * @param {Int32Array} sourceInt32Array
   *   The source image data to be processed.
   *
   *   - Its shape must match this.neuralNetParamsBase's [ input_height, input_width,
   *       input_channelCount ] because it will not be scaled and will be passed into
   *       neural network directly.
   *
   *   - This usually is called for the 2nd web worker in chain. The web worker will
   *       accept a scaled Int32Array which is returned from the 1st web worker's
   *       first yieled of .ImageData_process_asyncGenerator().
   *
   * @param {boolean} bFill
   *   If true, the source Int32Array will be filled by alignment mark before be
   * converted to tensor3d. If false, it will be converted to tensor3d without
   * filling alignment mark.
   *
   * @return {Promise}
   *   Return a promise resolved to a Float32Array representing the neural network's
   * result whose channel count is this.neuralNetParamsBase.output_channelCount.
   */
  Int32Array_fillable_process_async( sourceInt32Array, bFill ) {
    return this.createPromise_by_postCommandArgs(
      [ "Int32Array_fillable_process", sourceInt32Array, bFill ],
      [ sourceInt32Array.buffer ]
    );
  }


  /**
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. Its shape needs not match
   * this.neuralNetParamsBase's [ input_height, input_width, input_channelCount ]
   * because it will be scaled to the correct shape before passed into the neural
   * network.
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async generator tracking the result of processing. It will yield two
   * times, the 1st is an DataImage, the 2nd is a Float32Array.
   *
   * @yield {ImageData}
   *   Resolve to { done: false, value: ImageData }. The value is an ImageData
   * which is just the (non-scaled) source image data.
   *
   * @yield {Float32Array}
   *   Resolve to { done: true, value: Float32Array }. The value is a Float32Array
   * representing the neural network's result whose channel count is
   * this.neuralNetParamsBase.output_channelCount.
   */
  async* ImageData_scale_fork_process_asyncGenerator( sourceImageData ) {
    const bFork = true;
    return this.createResulter_by_postCommandArgs(
      [ "ImageData_scale_forkable_process", sourceImageData, bFork ],
      [ sourceImageData.data.buffer ]
    );
  }

  /**
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. Its shape needs not match
   * this.neuralNetParamsBase's [ input_height, input_width, input_channelCount ]
   * because it will be scaled to the correct shape before passed into the neural
   * network.
   *
   * @return {Promise}
   *   Return a promise resolved to a Float32Array representing the neural network's
   * result whose channel count is this.neuralNetParamsBase.output_channelCount.
   */
   async* ImageData_scale_process_async( sourceImageData ) {
    const bFork = false;
    return this.createPromise_by_postCommandArgs(
      [ "ImageData_scale_forkable_process", sourceImageData, bFork ],
      [ sourceImageData.data.buffer ]
    );
  }



//!!! ...unfinished... (2022/09/12) Old Codes.
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
   * 

//!!! ...unfinished... (2022/09/12)

   * @return {AsyncWorker.Resulter}
   *   An async generator tracking the result of this method. Its final promise:
   *   - Resolved to { done: false, value: ???true }, if ???success.
   *   - Resolved to { done: true, value: true }, if success.
   *   - Resolved to { done: true, value: false }, if failed.
   */
  imageData_transferBack_processTensor_async( processingId, sourceImageData ) {

    let processRelayPromises = create_and_return_ProcessRelayPromises( processingId );

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

    let processRelayPromises = create_and_return_ProcessRelayPromises( processingId );
    
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

    let processRelayPromises = create_and_return_ProcessRelayPromises( processingId );

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
   * Prepare promises and their function object (resolve and reject) in a map so that
   * the promises can be found and resolved when processing is done.
   *
   *   - The processRelayPromises.relay.promise will be await by outter (i.e.
   *       WorkerProxies) to transfer source typed-array to every web worker
   *       serially.
   *
   *   - The processRelayPromises.process.promise will be returned as the result
   *       of this processTensor().
   * 
   */
  create_and_return_ProcessRelayPromises( processingId ) {
    let processRelayPromises = new ProcessRelayPromises( processingId, this.workerId );
    this.processRelayPromisesMap.set( processingId, processRelayPromises );
    return processRelayPromises;
  }

//!!! (2022/09/09 Remarked) Using super class (AsyncWorker_Proxy) instead.
//   /**
//    * Dispatch messages come from the owned web worker.
//    *
//    * @param {Base} this
//    *   Should be binded to this object.
//    */
//   static onmessage_from_NeuralWorker_Body( e ) {
//
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
//  }

}

// Assume the web worker module javascript file is a sibling file (i.e. inside
// the same folder) of this module file.
NeuralWorker_Proxy.workerModuleURL
  = new URL( "NeuralWorker_Body.js", import.meta.url );
