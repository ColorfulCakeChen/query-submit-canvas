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
   * converted to tensor3d. If false, it will be converted to tensor3d directly
   * without filling alignment mark.
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

}

// Assume the web worker module javascript file is a sibling file (i.e. inside
// the same folder) of this module file.
NeuralWorker_Proxy.workerModuleURL
  = new URL( "NeuralWorker_Body.js", import.meta.url );
