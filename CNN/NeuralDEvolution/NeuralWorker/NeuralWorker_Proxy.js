export { NeuralWorker_Proxy as Proxy };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as AsyncWorker from "../../util/AsyncWorker.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";

// Although here (NeuralWorker_Proxy) will not use NeuralWorker_Body directly,
// prefetching it to cache it in disk is still a good idea. So that the web
// worker could still be created (from disk cache) even if internet
// disconnected later.
import * as NotUsed from "./NeuralWorker_Body.js";

//!!! ...unfinished... (2023/03/23)
// How to prefetch tensorflow.js?
// Perhaps, use HttpRequest.Fetcher() to prefetch tensorflow.js.
// Because here (NeuralWorker_Proxy) usually in inside a javascript
// module (which can not call importScripts() to prefetch tensorflow.js).
//
//importScripts( tensorflowJsURL ); // Load tensorflow.js library in global scope.
// because can not executed inside type="module"
//import { tensorflowJsURL } from "./NeuralWorker_Common.js";


//!!! ...unfinished... (2022/09/15)
// What if failed when:
//   - library (tensorflow.js) downloading
//   - worker starting (also a kind of library downloading)
//   - versus downloading
//   - versus result sending
//
// Perhaps, needs a life-cycle manager to handle them gracefully.


/**
 * Hold the worker and its related promise map. It is a wrapper of a neural
 * network web worker for handling and communicating easily.
 *
 * Note: Every neural network web worker can handle multiple (usually, one
 *       or two) neural network(s). Because sometimes it is more efficient
 *       to handle all neural networks in one web woker than in multiple web
 *       workers.
 *
 *
 */
class NeuralWorker_Proxy extends AsyncWorker.Proxy {

  /**
   * Used as default NeuralWorker.Proxy provider for conforming to Recyclable
   * interface.
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
   * Initialize this worker proxy. It will create one web worker and inform it
   * to initialize (e.g. load library), but not yet to create neural network.
   *
   * @param {number} workerId
   *   This id of this worker proxy (and web worker). This is the array index
   * in the parent container (i.e. WorkerProxies).
   *
   * @param {string} backendName
   *   Specify which backend should be used by tensorflow.js library.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  initWorker_async( workerId, backendName ) {
    this.workerId = workerId;
    return this.createPromise_by_postCommandArgs(
      [ "initWorker", workerId, backendName ]
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
   *   An array of every neural network's weights. Every element will be
   * interpreted as Float32Array. Every element will be transferred to web
   * worker (i.e. their .byteLength will become zero).
   *
   * @param {boolean} bLogDryRunTime
   *   If true, the neural network dry-run time will be measured twice and
   * logged to console.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  NeuralNetArray_create_async(
    neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime ) {

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
    let transferableObjectArray = new Array( weightArrayBufferArray.length );
    for ( let i = 0; i < weightArrayBufferArray.length; ++i ) {
      transferableObjectArray[ i ] = weightArrayBufferArray[ i ];
    }

    // 3. Inform web work to create neural networks.
    return this.createPromise_by_postCommandArgs(
      [ "NeuralNetArray_create",
        neuralNetParamsBaseArray, weightArrayBufferArray,
        bLogDryRunTime
      ],
      transferableObjectArray
    );
  }

  /**
   * @param {integer[]} markValueArray
   *   An array of values representing every neural network playing which
   * alignment.
   *   - It could be null or undefined or ( markValueArray.length == 0 ) to
   *       clear .alignmentMarkValueArray for not filling alignment mark into
   *       source TypedArray. (i.e. NO _FILL)
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  alignmentMarkValueArray_set_async( markValueArray ) {
    return this.createPromise_by_postCommandArgs(
      [ "alignmentMarkValueArray_set", markValueArray ]
    );
  }


  /**
   * Process input image data by all (suppose two) neural networks in this web
   * worker.
   *
   * This method is used for:
   *   - One web worker. The worker has two neural networks.
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__TWO_NET__ONE_SCALE__FILL (0)
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__TWO_NET__ONE_SCALE__NO_FILL (1)
   *
   *   - If ( bFill == true ), alignment mark filling.
   *     - The worker will download scaled Int32Array from GPU memory.
   *     - Fill alignment mark of the 1st neural network, upload and process it.
   *     - Fill alignment mark of the 2nd neural network, upload and process it.
   *
   *   - If ( bFill == false ), no alignment mark filling.
   *     - The worker needs not wait for downloading scaled Int32Array from GPU memory.
   *         and needs not upload alignment mark filled Int32Array to GPU.
   *     - So every neural network always output twice channels. For example,
   *       - The neural network output 100 channels.
   *       - channel [ 0, 49 ] are used if the neural network representing alignment A.
   *       - channel [ 50, 99 ] are used if the neural network representing alignment B.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It may be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array[] | Int32Array[]} previous_output_TypedArrayArray
   *   An array [ TypedArray, TypedArray ] representing the previous time
   * output of the (pair of) neural network(s).
   *
   * @param {boolean} bFill
   *   If true, the source_TypedArray will be filled by alignment mark before be
   * converted to tensor3d. If false, it will be converted to tensor3d directly
   * without filling alignment mark.
   *
   * @return {Promise( Float32Array | Int32Array )}
   *   Return a promise resolved to an array [ TypedArray, TypedArray ]
   * representing the neural networks' result. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  ONE_WORKER__ONE_SCALE__TypedArray_process_async(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArrayArray,
    bFill ) {

    // 1. Collect transferable objects.
    let transferableObjectArray;
    if ( previous_output_TypedArrayArray ) { // 1.1
      const previous_output_TypedArray0 = previous_output_TypedArrayArray[ 0 ];
      const previous_output_TypedArray1 = previous_output_TypedArrayArray[ 1 ];

      if ( previous_output_TypedArray0 ) {
        if ( previous_output_TypedArray1 ) { // 1.1.1
          transferableObjectArray = [ source_TypedArray.buffer,
            previous_output_TypedArray0.buffer,
            previous_output_TypedArray1.buffer ];
        } else { // 1.1.2
          transferableObjectArray = [ source_TypedArray.buffer,
            previous_output_TypedArray0.buffer ];
        }
      } else { // 1.2.1
        if ( previous_output_TypedArray1 ) {
          transferableObjectArray = [ source_TypedArray.buffer,
            previous_output_TypedArray1.buffer ];
        } else { // 1.2.2
          transferableObjectArray = [ source_TypedArray.buffer ];
        }
      }
    } else { // 1.2
      transferableObjectArray = [ source_TypedArray.buffer ];
    }

    // 2.
    return this.createPromise_by_postCommandArgs(
      [ "ONE_WORKER__ONE_SCALE__TypedArray_process",
        source_TypedArray, source_height, source_width,
        previous_output_TypedArrayArray,
        bFill ],
      transferableObjectArray
    );
  }


  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLY (2)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLIER (3)
   *     - The 1st worker calls this method.
   *
   *   - It will download scaled Int32Array from GPU memory. And post it back to
   *         WorkerProxy.
   *
   *   - Fill alignment mark of this neural network, upload to GPU and process it.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It may be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   *   - This usually is called for the 1st web worker in chain. The scaled
   *       Int32Array will be transferred back to WorkerProxy for the 2nd web
   *       worker.
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array|Int32Array} previous_output_TypedArray
   *   A TypedArray representing the previous time output of the neural network.
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async iterator tracking the result of processing. It will
   * yield two times, the 1st is an Int32Array, the 2nd is a Float32Array (or
   * Int32Array).
   *
   * @yield {Int32Array}
   *   Resolve to { done: false, value: Int32Array }. The value is an Int32Array
   * representing the scaled image data whose shape is this.neuralNetParamsBase's
   * [ input_height, input_width, input_channelCount ].
   *
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: TypedArray }. The value is a TypedArray
   * representing the neural network's result. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  TWO_WORKER__TWO_NET__ONE_SCALE__FILL__step0_TypedArray_process_asyncGenerator(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bApply_or_Applier ) {

    let transferableObjectArray;
    if ( previous_output_TypedArray )
      transferableObjectArray
        = [ source_TypedArray.buffer, previous_output_TypedArray.buffer ];
    else
      transferableObjectArray = [ source_TypedArray.buffer ];

    return this.createResulter_by_postCommandArgs(
      [ "TWO_WORKER__TWO_NET__ONE_SCALE__FILL__step0_TypedArray_process",
        source_TypedArray, source_height, source_width,
        previous_output_TypedArray,
        bApply_or_Applier ],
      transferableObjectArray
    );
  }

  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLY (4)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER (5)
   *     - The 1st worker calls this method.
   *
   *   - It will download scaled Int32Array from GPU memory. And post it back to
   *         WorkerProxy.
   *
   *   - No Fill alignment mark of this neural network, no upload to GPU,
   *       just process the scaled tensor directly.
   *
   * 
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It will not be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   *   - This usually is called for the 1st web worker in chain. The scaled
   *       Int32Array will be transferred back to WorkerProxy for the 2nd web
   *       worker.
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array|Int32Array} previous_output_TypedArray
   *   A TypedArray representing the previous time output of the neural network.
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async iterator tracking the result of processing. It will yield
   * two times, the 1st is an Int32Array, the 2nd is a Float32Array.
   *
   * @yield {Int32Array}
   *   Resolve to { done: false, value: Int32Array }. The value is an Int32Array
   * representing the scaled image data whose shape is this.neuralNetParamsBase's
   * [ input_height, input_width, input_channelCount ].
   *
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: TypedArray }. The value is a TypedArray
   * representing the neural network's result. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__step0_TypedArray_process_asyncGenerator(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bApply_or_Applier ) {

    let transferableObjectArray;
    if ( previous_output_TypedArray )
      transferableObjectArray
        = [ source_TypedArray.buffer, previous_output_TypedArray.buffer ];
    else
      transferableObjectArray = [ source_TypedArray.buffer ];

    return this.createResulter_by_postCommandArgs(
      [ "TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__step0_TypedArray_process",
        source_TypedArray, source_height, source_width,
        previous_output_TypedArray,
        bApply_or_Applier ],
      transferableObjectArray
    );
  }


  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLY (2)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLIER (3)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLY (4)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER (5)
   *     - The 2nd worker calls this method.
   *
   *   - One web worker. Every worker has one neural network. (inference usage)
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_NET__ONE_SCALE__FILL (7)
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_NET__ONE_SCALE__NO_FILL (8)          (inference usage)
   *     - The only one worker calls this method.
   *
   *   - (may or may not) Fill alignment mark and feedback of this neural network,
   *       upload to GPU and process it.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It may be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   *   - This usually is called for the 2nd web worker in chain. The web worker
   *       will accept a scaled Int32Array which is returned from the 1st web
   *       worker's first yieled of .TypedArray_process_asyncGenerator().
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array|Int32Array} previous_output_TypedArray
   *   A TypedArray representing the previous time output of the neural network.
   *
   * @param {boolean} bFill
   *   If true, the source_TypedArray will be filled by alignment mark before be
   * converted to tensor3d. If false, it will be converted to tensor3d directly
   * without filling alignment mark.
   *
   * @return {Promise( Float32Array | Int32Array )}
   *   Return a promise resolved to a TypedArray representing the neural
   * network's result. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  TWO_WORKER__TWO_NET__ONE_SCALE__step1_TypedArray_process_async(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bFill ) {

    let transferableObjectArray;
    if ( previous_output_TypedArray )
      transferableObjectArray
        = [ source_TypedArray.buffer, previous_output_TypedArray.buffer ];
    else
      transferableObjectArray = [ source_TypedArray.buffer ];

    return this.createPromise_by_postCommandArgs(
      [ "TWO_WORKER__TWO_NET__ONE_SCALE__step1_TypedArray_process",
        source_TypedArray, source_height, source_width,
        previous_output_TypedArray,
        bFill ],
      transferableObjectArray
    );
  }


  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL (6)
   *     - Both workers call this metohd.
   *       - The 1st worker uses ( bFork == true ).
   *       - The 2nd worker uses ( bFork == false ).
   *
   *   - Both workers scale source image data by themselves.
   *     - Advantage: The 1st worker needs not wait for downloading scaled
   *         Int32Array from GPU memory.
   *     - Disadvantage: The source image data is scaled twice.
   *
   *   - No alignment mark filling.
   *     - So every neural network always output twice channels. For example,
   *       - The neural network output 100 channels.
   *       - channel [ 0, 49 ] are used if the neural network representing alignment A.
   *       - channel [ 50, 99 ] are used if the neural network representing alignment B.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - Its shape needs not match this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ] because it will be scaled to the
   *       correct shape before passed into the neural network.
   *
   *   - It may be modified by filling with alignment mark and feedback
   *       information (i.e. previous time output of the neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Float32Array|Int32Array} previous_output_TypedArray
   *   A TypedArray representing the previous time output of the neural network.
   *
   * @param {boolean} bFork
   *   Whether yield the source_TypedArray.
   *
   *   - If true, the source_TypedArray will be yielded as an TypedArray.
   *       This is used for 1st worker.
   *
   *   - If false, the source_TypedArray will not yielded. This is used for 2nd
   *       worker.
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async iterator tracking the result of processing.
   *   - If ( bFork == true ), it will yield two times, the 1st is an DataImage,
   *       the 2nd is a Float32Array.
   *   - If ( bFork == false ), it will yield only one times, the Float32Array.
   *
   * @yield {Uint8ClampedArray|Uint16Array|Uint32Array|Int32Array}
   *   Resolve to { done: false, value: TypedArray }. The value is an TypedArray
   * which is just the (non-scaled) source_TypedArray.
   *
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: TypedArray }. The value is a TypedArray
   * representing the neural network's result. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   */
  TWO_WORKER__TWO_SCALE__TypedArray_process_asyncGenerator(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray,
    bFork ) {

//!!! ...unfinished... (2023/05/03) FILL or NO_FILL, _APPLY or _APPLIER.

    let transferableObjectArray;
    if ( previous_output_TypedArray )
      transferableObjectArray
        = [ source_TypedArray.buffer, previous_output_TypedArray.buffer ];
    else
      transferableObjectArray = [ source_TypedArray.buffer ];

    return this.createResulter_by_postCommandArgs(
      [ "TWO_WORKER__TWO_SCALE__TypedArray_process",
        source_TypedArray, source_height, source_width,
        previous_output_TypedArray,
        bFork ],
      transferableObjectArray
    );
  }

}

// Assume the web worker module javascript file is a sibling file (i.e. inside
// the same folder) of this module file.
NeuralWorker_Proxy.workerModuleURL
  = new URL( "NeuralWorker_Body.js", import.meta.url );
