export { NeuralWorker_Proxy as Proxy };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
import * as AsyncWorker from "../util/AsyncWorker.js";
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
    this.NeuralNetParamsBaseArray_dispose();
    this.workerId = undefined;
    super.disposeResources();
  }

  /** Release the neural network configuration. */
  NeuralNetParamsBaseArray_dispose() {
    if ( this.neuralNetParamsBaseArray ) {
      this.neuralNetParamsBaseArray.disposeResources_and_recycleToPool();
      this.neuralNetParamsBaseArray = null;
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
   * Create neural network(s) in the web worker body.
   *
   * @param {NeuralNet.ParamsBase[]} neuralNetParamsBaseArray
   *   An array of configurations for the neural network to be created. These
   * configurations (exclude the array) will be owned (i.e. kept and destroyed)
   * by this NeuralWorker.Proxy.
   *
   * @param {ArrayBuffer[]} weightArrayBufferArray
   *   An array of every neural network's weights. Every element  will be interpreted
   * as Float32Array.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if success.
   *   - Resolved to false, if failed.
   */
  NeuralNetArray_create_async( neuralNetParamsBaseArray, weightArrayBufferArray ) {

    // 1. Record neural network configuration.
    {
      if ( this.neuralNetParamsBaseArray )
        this.neuralNetParamsBaseArray.clear();
      else
        this.neuralNetParamsBaseArray = Recyclable.OwnerArray.Pool.get_or_create_by();

      this.neuralNetParamsBaseArray.length = neuralNetParamsBaseArray.length;
      for ( let i = 0; i < weightArrayBufferArray.length; ++i ) {
        this.neuralNetParamsBaseArray[ i ] = neuralNetParamsBaseArray[ i ];
      }
    }

    // 2. Collect the transferable object array. 
    let transferableObjectArray = weightArrayBufferArray.length;
    for ( let i = 0; i < weightArrayBufferArray.length; ++i ) {
      transferableObjectArray[ i ] = weightArrayBufferArray[ i ].buffer;
    }

    // 3. Inform web work to create neural networks.
    return this.createPromise_by_postCommandArgs(
      [ "NeuralNetArray_create", neuralNetParamsBaseArray, weightArrayBufferArray ],
      transferableObjectArray
    );
  }

  /**
   * @param {integer[]} markValueArray
   *   An array of values representing every neural network playing which alignment.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if success.
   *   - Resolved to false, if failed.
   */
  alignmentMarkArray_setValue_async( markValueArray ) {
    return this.createPromise_by_postCommandArgs(
      [ "alignmentMarkArray_setValue", markValueArray ]
    );
  }


  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *   - It will download scaled Int32Array from GPU memory. And post it back to
   *         WorkerProxy.
   *   - Fill alignment mark of this neural network, upload to GPU and process it.
   *   - The 1st worker calls this method.
   *
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
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *   - (may or may not) Fill alignment mark of this neural network, upload to GPU
   *       and process it.
   *   - The 2nd worker calls this method.
   *
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
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *   - Both workers scale source image data by themselves.
   *   - No alignment mark filling.
   *   - The 1st worker call this method.
   *
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
  ImageData_scale_fork_process_asyncGenerator( sourceImageData ) {
    const bFork = true;
    return this.createResulter_by_postCommandArgs(
      [ "ImageData_scale_forkable_process", sourceImageData, bFork ],
      [ sourceImageData.data.buffer ]
    );
  }


  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *   - Both workers scale source image data by themselves.
   *   - No alignment mark filling.
   *   - The 2nd worker call this method.
   *
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
  ImageData_scale_process_async( sourceImageData ) {
    const bFork = false;
    return this.createPromise_by_postCommandArgs(
      [ "ImageData_scale_forkable_process", sourceImageData, bFork ],
      [ sourceImageData.data.buffer ]
    );
  }


  /**
   * This method is used for:
   *   - One web worker. The worker has two neural networks.
   *   - If ( bFill == true ), alignment mark filling.
   *   - If ( bFill == false ), no alignment mark filling.
   *
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. Its shape needs not match
   * this.neuralNetParamsBase's [ input_height, input_width, input_channelCount ]
   * because it will be scaled to the correct shape before passed into the neural
   * network.
   *
   * @param {boolean} bFill
   *   If true, the source Int32Array will be filled by alignment mark before be
   * converted to tensor3d. If false, it will be converted to tensor3d directly
   * without filling alignment mark.
   *
   * @return {Promise}
   *   Return a promise resolved to an array of Float32Array representing the neural
   * networks' result.
   */
  ImageData_scale_once_process_multiple_async( sourceImageData, bFill ) {
    const bFork = false;
    return this.createPromise_by_postCommandArgs(
      [ "ImageData_scale_once_process_multiple", sourceImageData, bFill ],
      [ sourceImageData.data.buffer ]
    );
  }

}

// Assume the web worker module javascript file is a sibling file (i.e. inside
// the same folder) of this module file.
NeuralWorker_Proxy.workerModuleURL
  = new URL( "NeuralWorker_Body.js", import.meta.url );
