export { NeuralWorker_Proxies as Proxies };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import { Proxy as NeuralWorker_Proxy } from "./NeuralWorker_Proxy.js";
import { Mode as NeuralWorker_Mode } from "./NeuralWorker_Mode.js";

//!!! ...unfinished... (2022/05/25)
// Perhaps, Using SharedArrayBuffer to pass input image between different web worker.
//

/**
 * The container of WorkerProxy. It orchestrates these WorkerProxy. Especially, it
 * transfers (scaled) source image data to and from web worker. This could maximize
 * parallel computing under the restriction of transferring source image data to
 * every web worker serially.
 *
 *
 * 1. Idea
 *
 *
 * 1.1 For NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__Xxx
 *
 * Since it is slow to transfer data between CPU and GPU (for WebGL), it seems
 * not feasible to use multiple workers (which will transfer data between CPU
 * and GPU multiple times) to process both competition side of a diffential
 * evolution iteration.
 *
 * So these ONE_WORKER__Xxx modes combine two neural networks of both competition
 * sides in one web worker. Although they compute serially (not parallelly), it
 * may still be faster than computing them in two workers because the memory
 * transferring between CPU and GPU is reduced.
 *
 *
 * 1.2 For NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__Xxx
 * 
 * Every worker handles one neural network. When .TypedArray_process_async() is
 * called, the input (usually a large memory block) will be transffered to the
 * 1st worker to start computing, and then transffered to the 2nd worker to
 * start computing, ... etc.
 *
 * When passing large data by Worker.postMessage(), it is preferred by
 * transferring (not by copying). If the large data wants to be transferred
 * (not copied) to many workers, the only possible way is to transferring them
 * serially.
 *
 * However, serially transferring hurts the performance. Workers are better to
 * compute parallelly. So every worker should transfer the (possible scaled)
 * source image data back to this WorkerProxies, and keep computing neural
 * network at the same time. And then, this WorkerProxies will transfer the
 * source image data to the next worker as soon as possible.
 *
 * Finally, this WorkerProxies collects all web workers' results in a promise.
 * The promise will resolve with an array of Float32Array. Every Float32Array
 * is the output of one neural network.
 *
 *
 * 2. Experiments
 *
 * According to performance testing (i.e. NeuralWorker_tester.js), there are
 * some observations.
 *
 *
 * 2.1 FILL and NO_FILL
 *
 * How does a neural network know which alignment (in a differential evolution
 * versus) it represents? There are two methods: FILL or NO_FILL.
 *
 *   - FILL means the input image will be filled some information (i.e.
 *       alignment mark) before it is processed by a neural network.
 *
 *     - The cost are downloading input image from GPU to CPU, filling alignment
 *         mark, and uploading it from CPU to GPU.
 *

//!!! ...unfinished... (2023/05/05)
// Deprecate NO_FILL.
// When alignment mark is specified, it and previous time output
// (i.e. feedback) will be filled automatically.

 *   - NO_FILL means the input image will not be filled any extra information
 *       before it is processed by a neural network.
 *
 *     - Instead, the neural network will simultaneously output results for
 *         both alignments.
 *         - For example, the neural network outputs 100 channels totally.
 *         - If the neural network represents alignment A,
 *             use output channels 0 - 49.
 *         - If the neural network represents alignment B,
 *             use output channels 50 - 99.
 *
 *     - The cost are doubling the output channel count.
 *
 * At first glance, we might guess doubling output channel count should be
 * slower. The memory downloading/modifying/uploading, however, are even
 * slower. In the result, the NO_FILL's performance is comparable to (if not
 * better than) FILL.
 *
 *
 * 2.2 (Pre-fill) recurrent information
 *
 * Except alignment mark, if recurrent feedback information (i.e. the previous
 * step's output of the neural network) is wanted, here is a possible method
 * without filling by neural network itself:
 *
 *   - Let DrawingCanvas be larger than Viewport.
 *
 *   - Arrange some 1 * 1 size TiledBackground (with pure white (RGBA all 255)
 *       image) world objects inside the DrawingCanvas (so that they visible
 *       by neural network ) but outside the Viewport (so that they are invisible
 *       by user).
 *
 *   - Use these TiledBackground world objects' color (RGB) and opacity (A) to
 *       express recurrent feedback information.
 *
 *   - Disadvantage: Drawing so many tiny world objects may be hurt performance.
 *       Filling recurrent feedback (i.e. previous output) into ImageData.data
 *       (Uint8ClampedArray) directly (after getting ImageData from DrawCanvas)
 *       should be faster.
 *
 *
 * 2.3 Backend "cpu"
 *
 *   - TWO_WORKER_Xxx is better than ONE_WORKER_Xxx.
 *
 *     - This is especially true if your computer has multiple (i.e. >= 2) CPU
 *         because computation could be done parallelly by different CPU.
 *
 *   - Xxx_APPLIER is far more better than Xxx_APPLY.
 *
 *     - This is because Xxx_APPLIER could deliver input image to another CPU
 *         (i.e. the 2nd computation) more earlier than Xxx_APPLY.
 *
 *
 * 2.4 Backend "webgl"
 *
 *   - ONE_WORKER_Xxx is better than (at least, comparable to) TWO_WORKER_Xxx.
 *
 *     - The possible reason is that the GPU is a shared resource among all web
 *         workers. Using more web workers just wastes more time to transfer
 *         input images between them (and then, they still needs take turns to
 *         use the same one GPU for computation).
 *
 *   - Xxx_APPLIER may or may not be better than Xxx_APPLY.
 *
 *     - The gain (if has) is not so obvious as in backend "cpu".
 *
 *     - The possible reason is that the 2nd worker needs wait for the GPU to be
 *         released by the 1st worker no matter how early (how fast) the input
 *         image is received by the 2nd worker (because the GPU is shared by
 *         all web workers).
 *
 *
 * 3. Summary
 *
 *   - Try mode ONE_WORKER__TWO_NET__ONE_SCALE__NO_FILL (0) with backend "webgl".
 *
 *   - If failed, try mode TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER (5) with
 *       backend "cpu".
 *
 *

!!! ...unfinished... (2023/05/08)
 *   - ( NeuralNet.Params.has_implicit_input == false )
 *       not fill.
 * 
 *   - ( NeuralNet.Params.has_implicit_input == true )
 *       will fill.
 *
 *     - alignmentMarkValueArray null or ( .length == 0 )
 *         not fill alignment mark.
 *
 *     - previous_output_TypedArrayArray null or ( .length == 0 )
 *         not fill feedback (i.e. previous time output).
 *

 *
 *
 *
 * @member {string} backendName
 *   Which backend (of tensorflow.js library) will be used by web worker. Either
 * "cpu" or "webgl".
 *
 * @member {number} nNeuralWorker_ModeId
 *   The numeric identifier of neural worker mode (i.e.
 * NeuralWorker.Mode.Singleton.Ids.Xxx).
 *
 * @member {number} neuralNetCount
 *   There are how many neural networks created. It is always 2 (because of
 * differential evolution) no matter how totalWorkerCount is.
 *
 * @member {number} totalWorkerCount
 *   There are how many web worker(s) created.
 *
 *
 * @member {integer[]} alignmentMarkValueArray
 *   An array of values representing every neural network is playing which
 * alignment currently.
 *
 *     - If ( NeuralNet.Params.has_implicit_input == true ), they will be
 *         filled (as alignment marks) into every input of the neural networks
 *         (i.e. source TypedArray).
 *
 *     - If ( NeuralNet.Params.has_implicit_input == true ) but you do not want
 *         filled alignment marks, please call
 *         .alignmentMarkValueArray_set_async( null ) to clear it to null.
 *
 * @member {boolean} alignmentMarkValueArray_nonEmpty
 *   Return true, if .alignmentMarkValueArray is null or
 * ( .alignmentMarkValueArray.length == 0 ).
 *
 * @member {Float32Array[] | Int32Array[]} previous_output_TypedArrayArray
 *   An array [ TypedArray, TypedArray ] representing the (previous time)
 * output of the (pair of) neural network(s).
 *
 *   - Its .length will be the same as .neuralNetCount.
 *
 *   - Its element is TypedArray which may be:
 *     - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
 *     - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
 *
 *   - When .TypedArray_process_async() is called, its content (i.e. the
 *       Float32Array or Int32Array) will become invalid because they will be
 *       transferred (not copied) to the web worker for used as feedback.
 *
 *     - If ( NeuralNet.Params.has_implicit_input == true ), the transferred
 *         previous_output_TypedArrayArray will be filled (as feedback) into
 *         the next time input of the neural networks (i.e. source TypedArray).
 *
 *     - If ( NeuralNet.Params.has_implicit_input == true ) but you do not want
 *         it be transferred and filled (as feedback), please clear it to null
 *         or let its ( .length == 0 ) before calling
 *         .TypedArray_process_async().
 *
 *   - When .NeuralNetArray_create_async() is called, its content will be
 *       cleared. Since there should be no previous output for newly created
 *       neural network.
 *
 * @member {boolean} previous_output_TypedArrayArray_nonEmpty
 *   Return true, if .previous_output_TypedArrayArray is null or
 * ( .previous_output_TypedArrayArray.length == 0 ).
 *
 *
 * @member {function} TypedArray_process_async
 *   This is a data member which is a pointer to a function which is one of
 * .apply__ONE_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL(),
 * .apply__TWO_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL(),
 * .apply__TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL(),
 * .apply__ONE_WORKER__ONE_NET__ONE_SCALE__FILL__or__NO_FILL(). It accepts an
 * unsigned integer TypedArray and height and width as input. It returns a
 * promise resolves to the .previous_output_TypedArrayArray.
 */
class NeuralWorker_Proxies extends Recyclable.Root {

  /**
   * Used as default NeuralWorker.Proxies provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "NeuralWorker.Proxies.Pool",
    NeuralWorker_Proxies, NeuralWorker_Proxies.setAsConstructor );

  /** */
  constructor() {
    super();
    NeuralWorker_Proxies.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    NeuralWorker_Proxies.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {
    this.TypedArray_process_async = undefined;

    this.previous_output_TypedArrayArray = undefined;
    this.alignmentMarkValueArray = undefined;

    this.workerProxyArray_dispose();

    this.hardwareConcurrency = undefined;
    this.neuralNetCount = undefined;

    this.nNeuralWorker_ModeId = undefined;
    this.backendName = undefined;

    super.disposeResources();
  }

  /**
   * Initialize this worker proxy controller. It will create two neural networks
   * in one or two web worker(s).
   *
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async init_async( backendName, nNeuralWorker_ModeId ) {

    // 0.
    this.backendName = backendName;
    this.nNeuralWorker_ModeId = nNeuralWorker_ModeId;

    this.neuralNetCount
      = NeuralWorker_Mode.neuralNetCount_get( this.nNeuralWorker_ModeId );

    this.hardwareConcurrency = navigator.hardwareConcurrency; // logical CPU count.

    // (At most) Two web workers are sufficient.
    //
    // Although we might want to create as many web worker as logical CPU count,
    // it might not be necessary because our neural networks are learning by
    // differential evolution. Differential evolution evaluates just two entities
    // every time.
    //
    // Note1: How could two neural networks determine all the actions of so many
    //        game objects? The method is to let the output of every neural
    //        network contains all actions of all game objects of all alignments.
    //
    // Note2: For NeuralWorker_Mode whose ( bFill == false ), only half of the
    //        output actions (i.e. actions of one alignment in the game world)
    //        will be used in one time.
    //
    let totalWorkerCount = NeuralWorker_Mode.workerCount_get( nNeuralWorker_ModeId );

    // 1. Web workers.
    let initOkArray;
    {
      // 1.0 Create workers.
      this.workerProxyArray_length_ensure( totalWorkerCount );

      // 1.1 Initialize workers.
      let initPromiseArray = new Array( totalWorkerCount );
      for ( let i = 0; i < totalWorkerCount; ++i ) {
        initPromiseArray[ i ] = this.workerProxyArray[ i ].initWorker_async(
          i, backendName );
      }

      initOkArray = await Promise.all( initPromiseArray );
    }

    // 1.2 Summary workers.
    let initOk = initOkArray.reduce(
      ( previousValue, currentValue ) => ( previousValue && currentValue ),
      true
    );

    // 2. Determine .TypedArray_process_async
    NeuralWorker_Proxies.setup_TypedArray_process.call( this );

    return initOk;
  }

  /** */
  workerProxyArray_dispose() {
    if ( this.workerProxyArray ) {
      this.workerProxyArray.disposeResources_and_recycleToPool();
      this.workerProxyArray = null;
    }
  }

  /**
   * This method will try to re-use exsited web workers (so that WebGL shaders
   * needs not be re-compiled again).
   * 
   * @param {integer} newLength
   *   The .workerProxyArray will become the speccified length (and have so
   * many NeuralWorker.Proxy).
   */
  workerProxyArray_length_ensure( newLength ) {
    // 1. Prepare container.
    if ( !this.workerProxyArray )
      this.workerProxyArray = Recyclable.OwnerArray.Pool.get_or_create_by();

    // 2. Create more worker proxy.
    if ( this.workerProxyArray.length < newLength ) {
      let deltaCount = newLength - this.workerProxyArray.length;
      let arrayIndexBegin = this.workerProxyArray.length;

      this.workerProxyArray.length = newLength; // Enlarge array.
      for ( let i = 0, arrayIndex = arrayIndexBegin;
        i < deltaCount;
        ++i, ++arrayIndex ) {

        let workerProxy = NeuralWorker_Proxy.Pool.get_or_create_by();
        this.workerProxyArray[ arrayIndex ] = workerProxy;
      }

    // 3. Reduce worker proxy.
    } else {
      for ( let arrayIndex = ( this.workerProxyArray.length - 1 );
        arrayIndex >= newLength;
        --arrayIndex ) {

        this.workerProxyArray[ arrayIndex ].disposeResources_and_recycleToPool();
        this.workerProxyArray[ arrayIndex ] = null;
      }

      this.workerProxyArray.length = newLength; // Shrink array.
    }
  }

  /**
   * Create neural networks in all web workers' body.
   *
   * @param {NeuralNet.ParamsBase[]} neuralNetParamsBaseArray
   *   An array of configurations for the neural network to be created. These
   * configurations (exclude the array) will be owned (i.e. kept and destroyed)
   * by this NeuralWorker.Proxy.
   *
   * @param {ArrayBuffer[]} weightArrayBufferArray
   *   An array of every neural network's weights. Every element will be
   * interpreted as Float32Array. Every element will be transferred to web worker
   * (i.e. their .byteLength will become zero).
   *
   * @param {boolean} bLogDryRunTime
   *   If true, the neural network dry-run time will be measured twice and logged
   * to console.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async NeuralNetArray_create_async(

//!!! ...unfinished... (2023/05/06)
// should specify whether fill alignment mark and feedback information
// because they affect input data shape which is needed for creating
// neural network. 

    neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime
  ) {

    const funcNameInMessage = "NeuralNetArray_create_async";

    if ( neuralNetParamsBaseArray.length != this.neuralNetCount )
      throw Error( `NeuralWorker.Proxies.${funcNameInMessage}(): `
        + `neuralNetParamsBaseArray.length ( ${neuralNetParamsBaseArray.length} ) `
        + `should be the same as .neuralNetCount ( ${this.neuralNetCount} ).`
      );

    if ( weightArrayBufferArray.length != this.neuralNetCount )
      throw Error( `NeuralWorker.Proxies.${funcNameInMessage}(): `
        + `weightArrayBufferArray.length ( ${weightArrayBufferArray.length} ) `
        + `should be the same as .neuralNetCount ( ${this.neuralNetCount} ).`
      );

    let createOk;

    // 0. Since new neural networks are created, discard any old previous output.
    {
      if ( this.previous_output_TypedArrayArray ) {
        this.previous_output_TypedArrayArray.length = this.neuralNetCount;
        this.previous_output_TypedArrayArray.fill( undefined );
      } else {
        this.previous_output_TypedArrayArray = new Array( this.neuralNetCount );
      }
    }

    // 1. Every worker creates one neural network.
    if ( this.workerProxyArray.length > 1 ) { // (i.e. two workers)

      let createPromiseArray = new Array( this.workerProxyArray.length );
      for ( let i = 0; i < this.workerProxyArray.length; ++i ) {
        createPromiseArray[ i ]
          = this.workerProxyArray[ i ].NeuralNetArray_create_async(
              [ neuralNetParamsBaseArray[ i ] ],
              [ weightArrayBufferArray[ i ] ],
              bLogDryRunTime
            );
      }

      let createOkArray = await Promise.all( createPromiseArray );

      createOk = createOkArray.reduce(
        ( previousValue, currentValue ) => ( previousValue && currentValue ),
        true
      );

    // 2. The only one worker creates all neural networks.
    } else {
      createOk = await this.workerProxyArray[ 0 ].NeuralNetArray_create_async(
        neuralNetParamsBaseArray, weightArrayBufferArray,
        bLogDryRunTime
      );
    }

    return createOk;
  }


//!!! ...unfinished... (2023/05/06)
// NeuralWorker_Proxies should also hold a alignmentMarkValueArray
// so that it can provide input_height and input_width (acccording
// to explicit_input_height and width)

  get alignmentMarkValueArray_nonEmpty() {
    if (   ( this.alignmentMarkValueArray )
        && ( this.alignmentMarkValueArray.length > 0 ) )
      return true;
    return false;
  }

  /**
   * @param {integer[]} markValueArray
   *   An array of values representing every neural network is playing which
   * alignment currently.
   *
   *   - It could be null or undefined or ( markValueArray.length == 0 ) to
   *       clear .alignmentMarkValueArray for not filling alignment mark into
   *       source TypedArray.
   *
   *   - Otherwise, markValueArray.length should be the same as
   *       this.neuralNetCount
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async alignmentMarkValueArray_set_async( markValueArray ) {
    const funcNameInMessage = "alignmentMarkValueArray_set_async";

    // 1.
    const markValueArray_nonEmpty
      = ( ( markValueArray ) && ( markValueArray.length > 0 ) );

    if ( markValueArray_nonEmpty ) {
      if ( markValueArray.length != this.neuralNetCount )
        throw Error( `NeuralWorker.Proxies.${funcNameInMessage}(): `
          + `markValueArray.length ( ${markValueArray.length} ) `
          + `should be either 0 or the same as `
          + `.neuralNetCount ( ${this.neuralNetCount} ).`
        );
    }

    // 2. Record it so that input_height and input_width (acccording to
    //    explicit_input_height and explicit_input_width) could be provided.
    this.alignmentMarkValueArray = markValueArray;

    // 3.

    // 3.1 Every worker sets one alignment mark value.
    let resultOk;
    if ( this.workerProxyArray.length > 1 ) { // (i.e. two workers)

      let resultPromiseArray = new Array( this.workerProxyArray.length );
      for ( let i = 0; i < this.workerProxyArray.length; ++i ) {

        let markValueArray_beSent;
        if ( markValueArray_nonEmpty )
          markValueArray_beSent = [ markValueArray[ i ] ];

        resultPromiseArray[ i ] = this.workerProxyArray[ i ]
          .alignmentMarkValueArray_set_async( markValueArray_beSent );
      }

      let resultOkArray = await Promise.all( resultPromiseArray );

      resultOk = resultOkArray.reduce(
        ( previousValue, currentValue ) => ( previousValue && currentValue ),
        true
      );

    // 3.2 The only one worker sets all alignment mark values.
    } else {
      resultOk = await this.workerProxyArray[ 0 ]
        .alignmentMarkValueArray_set_async( markValueArray );
    }

    return resultOk;
  }

  get previous_output_TypedArrayArray_nonEmpty() {
    if (   ( this.previous_output_TypedArrayArray )
        && ( this.previous_output_TypedArrayArray.length > 0 ) )
      return true;
    return false;
  }

  /**
   * Setup .TypedArray_process_async according to .nNeuralWorker_ModeId.
   *
   * @param {NeuralWorker_Proxies} this
   */
  static setup_TypedArray_process() {
//!!! (2023/05/04 Remarked)
// Use .NeuralWorker_ModeId__to__TypedArray_process__Array instead.
//     switch ( this.nNeuralWorker_ModeId ) {
//       case NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__TWO_NET__ONE_SCALE__FILL: // (0)
//       case NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__TWO_NET__ONE_SCALE__NO_FILL: // (1)
//         this.TypedArray_process_async
//           = NeuralWorker_Proxies.apply__ONE_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL;
//         break;
//
//       case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLY: // (2)
//       case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLIER: // (3)
//       case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLY: // (4)
//       case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER: // (5)
//         this.TypedArray_process_async
//           = NeuralWorker_Proxies.apply__TWO_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL;
//         break;
//
//       case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL: // (6)
//         this.TypedArray_process_async
//           = NeuralWorker_Proxies.apply__TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL;
//         break;
//
//       case NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_NET__ONE_SCALE__FILL: // (7)
//       case NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_NET__ONE_SCALE__NO_FILL: // (8)
//         this.TypedArray_process_async
//           = NeuralWorker_Proxies.apply__ONE_WORKER__ONE_NET__ONE_SCALE__FILL__or__NO_FILL;
//         break;
//
//       default:
//         throw Error( `NeuralWorker_Proxies.setup_TypedArray_process(): `
//           + `Unknown nNeuralWorker_ModeId ( ${this.nNeuralWorker_ModeId} ).`
//         );
//         break;
//     }

    this.TypedArray_process_async = NeuralWorker_Proxies
      .NeuralWorker_ModeId__to__TypedArray_process__Array[
        this.nNeuralWorker_ModeId ];

    if ( !this.TypedArray_process_async )
      throw Error( `NeuralWorker_Proxies.setup_TypedArray_process(): `
        + `Unknown nNeuralWorker_ModeId ( ${this.nNeuralWorker_ModeId} ). `
        + `{ ${this} }`
      );
  }

  /**
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the pair of
   * neural workers. For example, ImageData.data which is coming from a canvas.
   * Note that it may be modified by filling with alignment mark and feedback
   * information (i.e. previous time output of the neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @return {Promise( Float32Array[] | Int32Array[] )}
   *   Return a promise resolved to the .previous_output_TypedArrayArray.
   */
  static async apply__ONE_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL(
    source_TypedArray, source_height, source_width ) {

    let bFill = NeuralWorker_Mode.bFill_get( this.nNeuralWorker_ModeId );

    let worker0_promise = this.workerProxyArray[ 0 ]
      .ONE_WORKER__ONE_SCALE__TypedArray_process_async(
        source_TypedArray, source_height, source_width,
        this.previous_output_TypedArrayArray,
        bFill );

    let worker0_value_TypedArrayArray
      = this.previous_output_TypedArrayArray = await worker0_promise;

    return worker0_value_TypedArrayArray;
  }

  /**
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the pair of
   * neural workers. For example, ImageData.data which is coming from a canvas.
   * Note that it may be modified by filling with alignment mark and feedback
   * information (i.e. previous time output of the neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @return {Promise( Float32Array[] | Int32Array[] )}
   *   Return a promise resolved to the .previous_output_TypedArrayArray.
   */
  static async apply__TWO_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL(
    source_TypedArray, source_height, source_width ) {

    let modeInfo
      = NeuralWorker_Mode.Singleton.getInfo_byId( this.nNeuralWorker_ModeId );

    let bFill = modeInfo.bFill;
    let bApply_or_Applier = modeInfo.bApply_or_Applier;

    let worker0_resulter;
    if ( bFill ) {
      worker0_resulter = this.workerProxyArray[ 0 ]
        .TWO_WORKER__TWO_NET__ONE_SCALE__FILL__step0_TypedArray_process_asyncGenerator(
          source_TypedArray, source_height, source_width,
          this.previous_output_TypedArrayArray?.[ 0 ],
          bApply_or_Applier );
    } else {
      worker0_resulter = this.workerProxyArray[ 0 ]
        .TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__step0_TypedArray_process_asyncGenerator(
          source_TypedArray, source_height, source_width,
          this.previous_output_TypedArrayArray?.[ 0 ],
          bApply_or_Applier );
    }

    let { done: worker0_done_false, value: worker0_value_Int32Array }
      = await worker0_resulter.next();

    // Note: Use input_height and input_width of the neural network because
    //       the 1st web worker has scaled the source image. The 2nd web worker
    //       needs not scale again.
    const workerProxy1 = this.workerProxyArray[ 1 ];
    const neuralNetParams1 = workerProxy1.neuralNetParamsBaseArray[ 0 ];

    const source_height1 = neuralNetParams1.input_height;
    const source_width1 = neuralNetParams1.input_width;

    let worker1_promise = workerProxy1
      .TWO_WORKER__TWO_NET__ONE_SCALE__step1_Int32Array_process_async(
        worker0_value_Int32Array, source_height1, source_width1,
        this.previous_output_TypedArrayArray?.[ 1 ],
        bFill );

    let [
      { done: worker0_done_true, value: worker0_value_TypedArray },
      worker1_value_TypedArray
    ] = await Promise.all( [ worker0_resulter.next(), worker1_promise ] );

    this.previous_output_TypedArrayArray
      = [ worker0_value_TypedArray, worker1_value_TypedArray ];

    return this.previous_output_TypedArrayArray;
  }

  /**
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the pair of
   * neural workers. For example, ImageData.data which is coming from a canvas.
   * Note that it may be modified by filling with alignment mark and feedback
   * information (i.e. previous time output of the neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @return {Promise( Float32Array[] | Int32Array[] )}
   *   Return a promise resolved to the .previous_output_TypedArrayArray.
   */
  static async apply__TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL(
    source_TypedArray, source_height, source_width ) {

    const worker0_bFork = true;
    let worker0_resulter = this.workerProxyArray[ 0 ]
      .TWO_WORKER__TWO_SCALE__TypedArray_process_asyncGenerator(
        source_TypedArray, source_height, source_width,
        this.previous_output_TypedArrayArray?.[ 0 ],
        worker0_bFork );

    let { done: worker0_done_false, value: worker0_value_Int32Array }
      = await worker0_resulter.next();

    // Note: Use source_height and source_width because the 2nd web worker
    //       will scale the source image by itself.
    const worker1_bFork = false;
    let worker1_resulter = this.workerProxyArray[ 1 ]
      .TWO_WORKER__TWO_SCALE__TypedArray_process_asyncGenerator(
        worker0_value_Int32Array, source_height, source_width,
        this.previous_output_TypedArrayArray?.[ 1 ],
        worker1_bFork );

    let [
      { done: worker0_done_true, value: worker0_value_TypedArray },
      { done: worker1_done_true, value: worker1_value_TypedArray },
    ] = await Promise.all(
      [ worker0_resulter.next(), worker1_resulter.next() ] );

    this.previous_output_TypedArrayArray
      = [ worker0_value_TypedArray, worker1_value_TypedArray ];

    return this.previous_output_TypedArrayArray;
  }

  /**
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the pair of
   * neural workers. For example, ImageData.data which is coming from a canvas.
   * Note that it may be modified by filling with alignment mark and feedback
   * information (i.e. previous time output of the neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @return {Promise( Float32Array[] | Int32Array[] )}
   *   Return a promise resolved to the .previous_output_TypedArrayArray.
   */
  static async apply__ONE_WORKER__ONE_NET__ONE_SCALE__FILL__or__NO_FILL(
    source_TypedArray, source_height, source_width ) {

    let bFill = NeuralWorker_Mode.bFill_get( this.nNeuralWorker_ModeId );

    // Note:
    //
    // .TWO_WORKER__TWO_NET__ONE_SCALE__step1_Int32Array_process_async()
    //   - could scale (if necessary) and fill (if exists).
    //   - will not post back source TypedArray.
    //
    // So, it is suitable for neural network inference usage.
    //
    let worker0_promise = this.workerProxyArray[ 0 ]
      .TWO_WORKER__TWO_NET__ONE_SCALE__step1_Int32Array_process_async(
        source_TypedArray, source_height, source_width,
        this.previous_output_TypedArrayArray?.[ 0 ],
        bFill );

    let worker0_value_TypedArray = await worker1_promise;

    this.previous_output_TypedArrayArray
      = [ worker0_value_TypedArray ];

    return this.previous_output_TypedArrayArray;
  }


  get totalWorkerCount() {
    return this.workerProxyArray.length;
  }

  /** */
  toString() {
    let strNeuralWorker_Mode = NeuralWorker_Mode.Singleton
      .getNameWithInt_byId( this.nNeuralWorker_ModeId );

    let str = 
        `backendName=\"${this.backendName}\", `
      + `nNeuralWorker_ModeId=${strNeuralWorker_Mode}, `
      + `neuralNetCount=${this.neuralNetCount}, `
      + `hardwareConcurrency=${this.hardwareConcurrency}, `
      + `totalWorkerCount=${this.totalWorkerCount}`
    ;
    return str;
  }

}

/**
 * An array for mapping from NeuralWorker_Mode.Singleton.Ids.Xxx to
 * NeuralWorker_Proxies.apply__Xxx
 */
NeuralWorker_Proxies.NeuralWorker_ModeId__to__TypedArray_process__Array = [

  // ONE_WORKER__TWO_NET__ONE_SCALE__FILL (0)
  NeuralWorker_Proxies.apply__ONE_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL,

  // ONE_WORKER__TWO_NET__ONE_SCALE__NO_FILL (1)
  NeuralWorker_Proxies.apply__ONE_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL,


  // TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLY (2)
  NeuralWorker_Proxies.apply__TWO_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL,

  // TWO_WORKER__TWO_NET__ONE_SCALE__FILL__APPLIER (3)
  NeuralWorker_Proxies.apply__TWO_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL,

  // TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLY (4)
  NeuralWorker_Proxies.apply__TWO_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL,

  // TWO_WORKER__TWO_NET__ONE_SCALE__NO_FILL__APPLIER (5)
  NeuralWorker_Proxies.apply__TWO_WORKER__TWO_NET__ONE_SCALE__FILL__or__NO_FILL,


  // TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL (6)
  NeuralWorker_Proxies.apply__TWO_WORKER__TWO_NET__TWO_SCALE__NO_FILL,


  // ONE_WORKER__ONE_NET__ONE_SCALE__FILL (7)
  NeuralWorker_Proxies.apply__ONE_WORKER__ONE_NET__ONE_SCALE__FILL__or__NO_FILL,

  // ONE_WORKER__ONE_NET__ONE_SCALE__NO_FILL (8)
  NeuralWorker_Proxies.apply__ONE_WORKER__ONE_NET__ONE_SCALE__FILL__or__NO_FILL,

];
