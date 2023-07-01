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
//// Load tensorflow.js library in global scope.
//importScripts( tensorflowJsURL );
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
 * @member {NeuralNet.ParamsBase[]} neuralNetParamsBaseArray
 *   An array of configurations for the neural network to be created. These
 * configurations is come from .NeuralNetArray_create_async() parameters and
 * is owned (i.e. kept and destroyed)by this NeuralWorker.Proxy.
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


  get input_height() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.inferencedParams.input_height;
  }

  get input_width() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.inferencedParams.input_width;
  }

  get input_channelCount() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.inferencedParams.input_channelCount;
  }


  get implicit_input_height() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.inferencedParams.implicit_input_height;
  }

  get implicit_input_width() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.inferencedParams.implicit_input_width;
  }

  get implicit_input_channelCount() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.inferencedParams.implicit_input_channelCount;
  }


  get explicit_input_height() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.explicit_input_height;
  }

  get explicit_input_width() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.explicit_input_width;
  }

  get explicit_input_channelCount() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.explicit_input_channelCount;
  }


  get output_height() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.inferencedParams.output_height;
  }

  get output_width() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.inferencedParams.output_width;
  }

  get output_channelCount() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.output_channelCount;
  }


  get feedbackShape() {
    return this.neuralNetParamsBaseArray?.[ 0 ]
      ?.inferencedParams.feedbackShape;
  }


  /** @override */
  disposeResources() {
    this.NeuralNetParamsBaseArray_dispose();
    this.neuralNetCount = undefined;
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
   * Note: The .alignmentMarkValueArrayArray will be cleared.
   *
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
  async initWorker_async( workerId, backendName ) {
    this.workerId = workerId;
    return this.createPromise_by_postCommandArgs(
      [ "initWorker", workerId, backendName ]
    );
  }

  /**
   * Create neural network(s) in the web worker body.
   *
   * Note: The .alignmentMarkValueArrayArray will be cleared.
   *
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
  async NeuralNetArray_create_async(
    neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime ) {

    const funcNameInMessage = "NeuralNetArray_create_async";

    if ( neuralNetParamsBaseArray.length != weightArrayBufferArray.length )
      throw Error( `NeuralWorker.Proxy.${funcNameInMessage}(): `
        + `neuralNetParamsBaseArray.length `
        + `( ${neuralNetParamsBaseArray.length} ) `
        + `should be the same as `
        + `weightArrayBufferArray.length `
        + `( ${weightArrayBufferArray.length} ).`
      );

    this.neuralNetCount = neuralNetParamsBaseArray.length;

    // 1. Record neural network configuration.
    {
      if ( this.neuralNetParamsBaseArray )
        this.neuralNetParamsBaseArray.clear();
      else
        this.neuralNetParamsBaseArray
          = Recyclable.OwnerArray.Pool.get_or_create_by();

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

    // 3.1
    let createOkPromise = this.createPromise_by_postCommandArgs(
      [ "NeuralNetArray_create",
        neuralNetParamsBaseArray, weightArrayBufferArray,
        bLogDryRunTime
      ],
      transferableObjectArray
    );

    // 3.2 After sending basic parameters to the neural worker body, generate
    //     inference parameters so that the outside caller could reference
    //     them (if necessary).
    //
    // Note: Because the neural worker body will also generate inference
    //       parameters by itself, there is not necessary to send them to the
    //       neural worker body.
    for ( let neuralNetIndex = 0;
      neuralNetIndex < neuralNetParamsBaseArray.length;
      ++neuralNetIndex ) {

      let neuralNetParamsBase = neuralNetParamsBaseArray[ neuralNetIndex ];
      neuralNetParamsBase.inferencedParams_create();
    }

    // 3.3
    let createOk = await createOkPromise;
    return createOk;
  }

  /**
   * 
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async alignmentMarkValueArrayArray_set_async(
    alignmentMarkValueArrayArray ) {

    // 1. Handle TypedArray.
    let alignmentMarkValueArrayArray_clone;
    let transferableObjectArray;
    {
      alignmentMarkValueArrayArray_clone
        = new Array( alignmentMarkValueArrayArray.length );

      for ( let i = 0; i < alignmentMarkValueArrayArray.length; ++i ) {
        const alignmentMarkValueArray = alignmentMarkValueArrayArray[ i ];

        // 1.1 If normal array, use it directly because it will be cloned
        //     automatically when posting to web worker.
        if ( alignmentMarkValueArray instanceof Array ) {
          alignmentMarkValueArrayArray_clone[ i ] = alignmentMarkValueArray;

        // 1.2 If TypedArray, clone them for transferring.
        } else if ( alignmentMarkValueArray.buffer != undefined ) {
          let alignmentMarkValueArray_clone = alignmentMarkValueArray.slice();

          alignmentMarkValueArrayArray_clone[ i ]
            = alignmentMarkValueArray_clone;

          if ( !transferableObjectArray )
            transferableObjectArray
              = [ alignmentMarkValueArray_clone.buffer ];
          else
            transferableObjectArray.push(
              alignmentMarkValueArray_clone.buffer );

        } else { // 1.3 Unknown element type.
          throw Error( `NeuralWorker_Proxy`
            + `.alignmentMarkValueArrayArray_set_async(): `
            + `alignmentMarkValueArrayArray[ ${i} ] `
            + `( ${alignmentMarkValueArray} ) `
            + `should be either an Array or TypedArray.`
          );
        }
      }
    }

    // 2.
    return this.createPromise_by_postCommandArgs(
      [ "alignmentMarkValueArrayArray_set",
        alignmentMarkValueArrayArray_clone ],
      transferableObjectArray
    );
  }

  /**
   * Process input image data by all (suppose two) neural networks in this web
   * worker.
   *
   * This method is used for:
   *   - One web worker. The worker has two neural networks.
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__TWO_NET (0)
   *
   *   - If has alignment mark and/or feedback (i.e. previous time output):
   *
   *     - Fill alignment mark and/or feedback (i.e. previous time output) of
   *         the 1st neural network, upload to GPU and process it.
   *
   *     - Fill alignment mark and/or feedback (i.e. previous time output) of
   *         the 2nd neural network, upload to GPU and process it.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - If its shape matches this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ], performacne will be better.
   *
   *   - It may be modified by filling with alignment mark and/or feedback
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
   * output of the (pair of) neural network(s). It could be null which means do
   * not fill feedback (i.e. previous time output) into the source_TypedArray.
   *
   * @return {Promise( Float32Array | Int32Array )}
   *   Return a promise resolved to an array [ TypedArray, TypedArray ]
   * representing the neural networks' result. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ))
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ))
   */
  async ONE_WORKER__TWO_NET__TypedArray_process_async(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArrayArray ) {

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
      [ "ONE_WORKER__TWO_NET__TypedArray_process",
        source_TypedArray, source_height, source_width,
        previous_output_TypedArrayArray ],
      transferableObjectArray
    );
  }

  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLY (1)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLIER (2)
   *     - The 1st worker calls this method.
   *
   *   - It will download scaled Int32Array from GPU memory. And post it back
   *       to WorkerProxy.
   *
   *   - If has alignment mark and/or feedback (i.e. previous time output):
   *
   *     - Fill alignment mark and/or feedback (i.e. previous time output) of
   *         this neural network, upload to GPU and process it.
   *
   *
   * Note: This is a non-async method but return an async-generator-like
   *       object. So, it can be viewed as an async generator.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - If its shape matches this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ], performacne will be better.
   *
   *   - It may be modified by filling with alignment mark and/or feedback
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
   *   A TypedArray representing the previous time output of the neural
   * network. It could be null which means do not fill feedback (i.e. previous
   * time output) into the source_TypedArray.
   *
   * @return {AsyncWorker.Resulter}
   *   Return an async iterator tracking the result of processing. It will
   * yield two times, the 1st is an Int32Array, the 2nd is a Float32Array (or
   * Int32Array).
   *
   * @yield {Int32Array}
   *   Resolve to { done: false, value: Int32Array }. The value is an
   * Int32Array representing the scaled image data whose shape is
   * this.neuralNetParamsBase's [ input_height, input_width,
   * input_channelCount ].
   *
   * @yield {Float32Array|Int32Array}
   *   Resolve to { done: true, value: TypedArray }. The value is a TypedArray
   * representing the neural network's result. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ))
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ))
   */
  TWO_WORKER__TWO_NET__step0__TypedArray_process_asyncGenerator(
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
      [ "TWO_WORKER__TWO_NET__step0__TypedArray_process",
        source_TypedArray, source_height, source_width,
        previous_output_TypedArray,
        bApply_or_Applier ],
      transferableObjectArray
    );
  }

  /**
   * This method is used for:
   *   - Two web workers. Every worker has one neural network.
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLY (1)
   *     - NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLIER (2)
   *     - The 2nd worker calls this method.
   *
   *   - One web worker. Every worker has one neural network. (inference usage)
   *     - NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_NET (3)
   *     - The only one worker calls this method.
   *
   *   - If has alignment mark and/or feedback (i.e. previous time output):
   *
   *     - Fill alignment mark and/or feedback (i.e. previous time output) of
   *         this neural network, upload to GPU and process it.
   *
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   *
   *   - If its shape matches this.neuralNetParamsBase's [ input_height,
   *       input_width, input_channelCount ], performacne will be better.
   *
   *   - It may be modified by filling with alignment mark and/or feedback
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
   *   A TypedArray representing the previous time output of the neural
   * network. It could be null which means do not fill feedback (i.e. previous
   * time output) into the source_TypedArray.
   *
   * @return {Promise( Float32Array | Int32Array )}
   *   Return a promise resolved to a TypedArray representing the neural
   * network's result. The TypedArray may be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ))
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ))
   */
  async TWO_WORKER__TWO_NET__step1__TypedArray_process_async(
    source_TypedArray, source_height, source_width,
    previous_output_TypedArray ) {

    let transferableObjectArray;
    if ( previous_output_TypedArray )
      transferableObjectArray
        = [ source_TypedArray.buffer, previous_output_TypedArray.buffer ];
    else
      transferableObjectArray = [ source_TypedArray.buffer ];

    return this.createPromise_by_postCommandArgs(
      [ "TWO_WORKER__TWO_NET__step1__TypedArray_process",
        source_TypedArray, source_height, source_width,
        previous_output_TypedArray ],
      transferableObjectArray
    );
  }

}

// Assume the web worker module javascript file is a sibling file (i.e. inside
// the same folder) of this module file.
NeuralWorker_Proxy.workerModuleURL
  = new URL( "NeuralWorker_Body.js", import.meta.url );
