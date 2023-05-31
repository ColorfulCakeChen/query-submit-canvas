export { NeuralWorker_Proxies as Proxies };

import * as Pool from "../../util/Pool.js";
import * as RandTools from "../../util/RandTools.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import { Proxy as NeuralWorker_Proxy } from "./NeuralWorker_Proxy.js";
import { Mode as NeuralWorker_Mode } from "./NeuralWorker_Mode.js";
import { ImplicitInputMode as NeuralWorker_ImplicitInputMode }
  from "./NeuralWorker_ImplicitInputMode.js";


//!!! ...unfinished... (2022/05/25)
// Perhaps, Using SharedArrayBuffer to pass input image between different web
// worker.
//

/**
 * The container of NeuralWorker_Proxy. It orchestrates these
 * NeuralWorker_Proxy. Especially, it transfers (possible scaled) source image
 * data to and from web worker. This could maximize parallel computing under
 * the restriction of transferring source image data to every web worker
 * serially.
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
 * So these ONE_WORKER__Xxx modes combine two neural networks of both
 * competition sides in one web worker. Although they compute serially (not
 * parallelly), it may still be faster than computing them in two workers
 * because the memory transferring between CPU and GPU is reduced.
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
 * transferring (i.e. by not copying). If the large data wants to be
 * transferred (not copied) to many workers, the only possible way is to
 * transferring them serially.
 *
 * However, serially transferring hurts the performance. Workers are better to
 * compute parallelly. So every worker should transfer the (possible scaled)
 * source image data back to this WorkerProxies, and keep computing neural
 * network at the same time. And then, this WorkerProxies will transfer the
 * source image data to the next worker as soon as possible.
 *
 * Finally, this NeiralWorker_Proxies collects all web workers' results into a
 * promise. The promise will resolve with an array of Float32Array (or
 * Int32Array). Every Float32Array (or Int32Array) is the output of one neural
 * network.
 *
 *
 * 2. Experiments
 *
 * According to performance testing (i.e. NeuralWorker_tester.js), there are
 * some observations.
 *
 *
 * 2.1 Filling alignment mark and/or feedback
 *
 * If specify ( neuralNetParamsBase.has_implicit_input == true ) when calling
 * .NeuralNetArray_create_async(). And provide an enlarged (with respect to
 * neuralNetParamsBase.explicit_input_Xxx) image as input to
 * .TypedArray_process_async(). Then, the follwing two issues could be handled:
 * 
 *   - How does a neural network know which alignment (in a differential
 *       evolution versus) it represents (i.e. personates) currently?
 *
 *     - Please call .alignmentMarkValueArrayArray_set_async() to provide
 *         alignement mark values of both comprtition sides.
 *
 *   - What if a neural network needs itself previous time output as feedback?
 *
 *     - Please ensure ( neuralNetParamsBase.output_asInputValueRange == true )
 *         so that the neural network's output is feasible for feedback.
 *
 *
 * The cost is:
 *
 *   - Filling extra information (i.e. alignment mark and/or feedback) takes
 *       extra time.
 *
 *   - Processing the enlarged input image is usually slower a little.
 *
 *
 * How to provided an enlarged input image?
 *
 *     - Let DrawingCanvas be larger than Viewport.
 *
 *
 * 2.2 Backend "cpu"
 *
 *   - TWO_WORKER__Xxx is better than ONE_WORKER__Xxx.
 *
 *     - This is especially true if your computer has multiple (i.e. >= 2) CPU
 *         because computation could be done parallelly by different CPU.
 *
 *   - Xxx__APPLIER is far more better than Xxx__APPLY.
 *
 *     - This is because Xxx__APPLIER could deliver input image to another CPU
 *         (i.e. the 2nd computation) more earlier than Xxx__APPLY. This
 *         increases the computational parallelism.
 *
 *
 * 2.3 Backend "webgl"
 *
 *   - ONE_WORKER__Xxx is better than (at least, comparable to) TWO_WORKER__Xxx.
 *
 *     - The possible reason is that the GPU is a shared resource among all web
 *         workers. Using more web workers just wastes more time to transfer
 *         input images between them (and then, they still needs take turns to
 *         use the same one GPU for computation).
 *
 *   - Xxx__APPLIER may or may not be better than Xxx__APPLY.
 *
 *     - The gain (if has) is not so obvious as in backend "cpu".
 *
 *     - The possible reason is that the 2nd worker needs wait for the GPU to
 *         be released by the 1st worker no matter how early (how fast) the
 *         input image is received by the 2nd worker (because the GPU is shared
 *         by all web workers).
 *
 *
 * 3. Summary
 *
 *   - Try mode ONE_WORKER__TWO_NET (0) with backend "webgl".
 *
 *   - If failed, try mode TWO_WORKER__TWO_NET__APPLIER (2) with backend "cpu".
 *
 *
 *
 * @member {string} backendName
 *   Which backend (of tensorflow.js library) will be used by web worker.
 * Either "cpu" or "webgl".
 *
 * @member {number} nNeuralWorker_ModeId
 *   The numeric identifier of neural worker mode (i.e.
 * NeuralWorker.Mode.Singleton.Ids.Xxx).
 *
 * @member {NeuralWorker_Mode_Info} ModeInfo
 *   The information of the nNeuralWorker_ModeId.
 *
 * @member {number} nNeuralWorker_ImplicitInputModeId
 *   The numeric identifier of the neural network implicit input mode
 * (NeuralWorker.ImplicitInputMode.Singleton.Ids.Xxx).
 *
 * @member {NeuralWorker_ImplicitInputMode_Info} ImplicitInputModeInfo
 *   The information of the nNeuralWorker_ImplicitInputModeId.
 *
 * @member {number} neuralNetCount
 *   There are how many neural networks created. It is always 2 (because of
 * differential evolution) no matter how totalWorkerCount is.
 *
 * @member {number} totalWorkerCount
 *   There are how many web worker(s) created.
 *
 *
 * @member {Uint8ClampedArray[]|Int32Array[]|number[][]} alignmentMarkValueArrayArray
 *   An array with two non-negative integer arrays representing every neural
 * network personating which alignment currently. Every non-negative integer
 * array's .length should be the same as .input_channelCount becasue it
 * represents a pixel.
 *
 *   - It could be null or undefined or
 *       ( alignmentMarkValueArrayArray.length == 0 ) for not filling alignment
 *       mark into source TypedArray.
 *
 *   - Otherwise, alignmentMarkValueArrayArray.length should be the same as
 *       this.neuralNetCount
 *
 *     - If ( NeuralNet.Params.has_implicit_input == true ), they will be
 *         filled (as alignment marks) into every input of the neural
 *         networks (i.e. source TypedArray).
 *
 *     - If ( NeuralNet.Params.has_implicit_input == true ) but you do not
 *         want to fill alignment marks, please call
 *         .alignmentMarkValueArrayArray_set_async( null ) to clear it.
 *
 * @member {boolean} alignmentMarkValueArrayArray_nonEmpty
 *   Return true, if .alignmentMarkValueArrayArray is null or
 * ( .alignmentMarkValueArrayArray.length == 0 ).
 *
 * @member {Float32Array[] | Int32Array[]} previous_output_TypedArrayArray
 *   An array [ TypedArray, TypedArray ] representing the (previous time)
 * output of the (pair of) neural network(s).
 *
 *   - When .init_async() and .NeuralNetArray_create_async() it will be cleared
 *       to undefined.
 *
 *     - After .TypedArray_process_async() succesfully, it will be non-null and
 *         its .length will be the same as .neuralNetCount.
 *
 *   - Its element is TypedArray which may be:
 *     - Float32Array, if ( neuralNetParams.output_asInputValueRange == false ).
 *     - Int32Array, if ( neuralNetParams.output_asInputValueRange == true ).
 *
 *   - If ( .ImplicitInputModeInfo.implicit_input_bFillPreviousOutput == true ):
 *
 *     - When .TypedArray_process_async() is called, its content (i.e. the
 *       Float32Array or Int32Array) will become invalid because they will be
 *       transferred (not copied) to the web worker for used as feedback.
 *
 *     - The transferred previous_output_TypedArrayArray will be used to fill
 *         (as feedback) into the next time input of the neural networks (i.e.
 *         source TypedArray).
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


  get input_height() {
    return this.workerProxyArray?.[ 0 ]?.input_height;
  }

  get input_width() {
    return this.workerProxyArray?.[ 0 ]?.input_width;
  }

  get input_channelCount() {
    return this.workerProxyArray?.[ 0 ]?.input_channelCount;
  }


  get implicit_input_height() {
    return this.workerProxyArray?.[ 0 ]?.implicit_input_height;
  }

  get implicit_input_width() {
    return this.workerProxyArray?.[ 0 ]?.implicit_input_width;
  }

  get implicit_input_channelCount() {
    return this.workerProxyArray?.[ 0 ]?.implicit_input_channelCount;
  }


  get explicit_input_height() {
    return this.workerProxyArray?.[ 0 ]?.explicit_input_height;
  }

  get explicit_input_width() {
    return this.workerProxyArray?.[ 0 ]?.explicit_input_width;
  }

  get explicit_input_channelCount() {
    return this.workerProxyArray?.[ 0 ]?.explicit_input_channelCount;
  }


  get output_height() {
    return this.workerProxyArray?.[ 0 ]?.output_height;
  }

  get output_width() {
    return this.workerProxyArray?.[ 0 ]?.output_width;
  }

  get output_channelCount() {
    return this.workerProxyArray?.[ 0 ]?.output_channelCount;
  }


  /** @override */
  disposeResources() {
    this.TypedArray_process_async = undefined;

    this.previous_output_TypedArrayArray = undefined;
    this.alignmentMarkValueArrayArray = undefined;

    this.workerProxyArray_dispose();

    this.hardwareConcurrency = undefined;
    this.neuralNetCount = undefined;

    this.ImplicitInputModeInfo = undefined;
    this.nNeuralWorker_ImplicitInputModeId = undefined;

    this.ModeInfo = undefined;
    this.nNeuralWorker_ModeId = undefined;
    this.backendName = undefined;

    super.disposeResources();
  }

  /**
   * Initialize this worker proxy controller. It will create two neural
   * networks in one or two web worker(s).
   *
   * The .alignmentMarkValueArrayArray and .previous_output_TypedArrayArray
   * will be cleared.
   *
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async init_async(
    backendName, nNeuralWorker_ModeId, nNeuralWorker_ImplicitInputModeId ) {

    // 0.
    this.backendName = backendName;
    this.nNeuralWorker_ModeId = nNeuralWorker_ModeId;
    this.nNeuralWorker_ImplicitInputModeId = nNeuralWorker_ImplicitInputModeId;

    this.ModeInfo = NeuralWorker_Mode.Singleton
      .getInfo_byId( nNeuralWorker_ModeId );

    this.neuralNetCount = this.ModeInfo.neuralNetCount;

    this.ImplicitInputModeInfo = NeuralWorker_ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralWorker_ImplicitInputModeId );

    this.hardwareConcurrency = navigator.hardwareConcurrency; // logical CPU count.

    // (At most) Two web workers are sufficient.
    //
    // Although we might want to create as many web worker as logical CPU count,
    // it might not be necessary because our neural networks are learning by
    // differential evolution. Differential evolution evaluates just two entities
    // every time.
    //
    // Note: How could two neural networks determine all the actions of so
    //       many game objects? The method is to let the output of every neural
    //       network contains all actions of all game objects of all alignments.
    //
    let totalWorkerCount = this.ModeInfo.workerCount;

    // Since (re-)initialization, no alignment marks and no previous outputs.
    {
      // Note: NeuralWorker_Body will clear it, too.
      this.alignmentMarkValueArrayArray = undefined;

      this.previous_output_TypedArrayArray = undefined;
    }

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
   * The .alignmentMarkValueArrayArray and .previous_output_TypedArrayArray
   * will be cleared.
   *
   *
   * @param {NeuralNet.ParamsBase[]} neuralNetParamsBaseArray
   *   An array of configurations for the neural network to be created. These
   * configurations (exclude the array) will be owned (i.e. kept and destroyed)
   * by this NeuralWorker.Proxies. Its content may be modified according to
   * .nNeuralWorker_ImplicitInputModeId.
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
    neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime ) {

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

    // Ensure neuralNetParamsBase has correct flags combination according to
    // implicit input mode.
    //
    // Note: ( implicit_input_bFillPreviousOutput == true ) but
    //       ( output_asInputValueRange == false ) is a little illegal
    //       combination.
    {
      for ( let neuralNetIndex = 0;
        neuralNetIndex < this.neuralNetCount; ++neuralNetIndex ) {

        let neuralNetParamsBase = neuralNetParamsBaseArray[ neuralNetIndex ];

        neuralNetParamsBase.has_implicit_input
          = this.ImplicitInputModeInfo.has_implicit_input;

        neuralNetParamsBase.output_asInputValueRange
          = this.ImplicitInputModeInfo.output_asInputValueRange;
      }
    }

    // Since (re-)creation, no alignment marks and no previous outputs.
    {
      // Note: NeuralWorker_Body will clear it, too.
      this.alignmentMarkValueArrayArray = undefined;

      this.previous_output_TypedArrayArray = undefined;
    }

    let createOk;

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

  get alignmentMarkValueArrayArray_nonEmpty() {
    if (   ( this.alignmentMarkValueArrayArray )
        && ( this.alignmentMarkValueArrayArray.length > 0 ) )
      return true;
    return false;
  }

  /**
   * 
   * @param {Uint8ClampedArray[]|Int32Array[]|number[][]} alignmentMarkValueArrayArray
   *   (Please see NeuralWorker.Proxies explanation.) This array will be kept
   * by this NeuralWorker.Proxies object directly.
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async alignmentMarkValueArrayArray_set_async( alignmentMarkValueArrayArray ) {
    const funcNameInMessage = "alignmentMarkValueArrayArray_set_async";

    // Send alignment mark value array array only if requested.
    if ( !this.ImplicitInputModeInfo.implicit_input_bFillAlignmentMark )
      throw Error( `NeuralWorker.Proxies.${funcNameInMessage}(): `
        + `.ImplicitInputModeInfo.implicit_input_bFillAlignmentMark `
        + `( ${this.ImplicitInputModeInfo.implicit_input_bFillAlignmentMark} ) `
        + `should be true `
        + `for setting alignment mark value array array.`
      );

    // 1.
    const alignmentMarkValueArrayArray_nonEmpty
      = (   ( alignmentMarkValueArrayArray )
         && ( alignmentMarkValueArrayArray.length > 0 ) );

    if ( alignmentMarkValueArrayArray_nonEmpty ) {
      if ( alignmentMarkValueArrayArray.length != this.neuralNetCount )
        throw Error( `NeuralWorker.Proxies.${funcNameInMessage}(): `
          + `alignmentMarkValueArrayArray.length `
          + `( ${alignmentMarkValueArrayArray.length} ) `
          + `should be either 0 or the same as `
          + `.neuralNetCount ( ${this.neuralNetCount} ).`
        );
    }

    // 2. Record it for reference.
    this.alignmentMarkValueArrayArray = alignmentMarkValueArrayArray;

    // 3.

    // 3.1 Every worker sets one alignment mark value.
    let resultOk;
    if ( this.workerProxyArray.length > 1 ) { // (i.e. two workers)

      let resultPromiseArray = new Array( this.workerProxyArray.length );
      for ( let i = 0; i < this.workerProxyArray.length; ++i ) {

        let alignmentMarkValueArrayArray_beSent;
        if ( alignmentMarkValueArrayArray_nonEmpty )
          alignmentMarkValueArrayArray_beSent
            = [ alignmentMarkValueArrayArray[ i ] ];

        resultPromiseArray[ i ] = this.workerProxyArray[ i ]
          .alignmentMarkValueArrayArray_set_async(
            alignmentMarkValueArrayArray_beSent );
      }

      let resultOkArray = await Promise.all( resultPromiseArray );

      resultOk = resultOkArray.reduce(
        ( previousValue, currentValue ) => ( previousValue && currentValue ),
        true
      );

    // 3.2 The only one worker sets all alignment mark values.
    } else {
      resultOk = await this.workerProxyArray[ 0 ]
        .alignmentMarkValueArrayArray_set_async(
          alignmentMarkValueArrayArray );
    }

    return resultOk;
  }

  /**
   * Swap .alignmentMarkValueArrayArray[ 0 ] and
   * .alignmentMarkValueArrayArray[ 1 ].
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async alignmentMarkValueArrayArray_swap_async() {
    const funcNameInMessage = "alignmentMarkValueArrayArray_swap_async";

    // 1.
    if ( !this.alignmentMarkValueArrayArray_nonEmpty )
      throw Error( `NeuralWorker.Proxies.${funcNameInMessage}(): `
        + `.alignmentMarkValueArrayArray_nonEmpty `
        + `( ${this.alignmentMarkValueArrayArray_nonEmpty} ) `
        + `should be true for swapping.`
      );

    if ( this.alignmentMarkValueArrayArray.length != 2 )
      throw Error( `NeuralWorker.Proxies.${funcNameInMessage}(): `
        + `.alignmentMarkValueArrayArray.length `
        + `( ${this.alignmentMarkValueArrayArray.length} ) `
        + `should be 2 for swapping.`
      );

    return this.alignmentMarkValueArrayArray_set_async(
      [ this.alignmentMarkValueArrayArray[ 1 ],
        this.alignmentMarkValueArrayArray[ 0 ] ] );
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
   * Note that it may be modified by filling with alignment mark and/or feedback
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
  static async apply__ONE_WORKER__TWO_NET(
    source_TypedArray, source_height, source_width ) {

    // Send previous time output only if requested.
    let previous_output_TypedArrayArray;
    if ( this.ImplicitInputModeInfo.implicit_input_bFillPreviousOutput )
      previous_output_TypedArrayArray = this.previous_output_TypedArrayArray;

    let worker0_promise = this.workerProxyArray[ 0 ]
      .ONE_WORKER__TWO_NET__TypedArray_process_async(
        source_TypedArray, source_height, source_width,
        previous_output_TypedArrayArray
      );

    this.previous_output_TypedArrayArray = await worker0_promise;

    return this.previous_output_TypedArrayArray;
  }

  /**
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the pair of
   * neural workers. For example, ImageData.data which is coming from a canvas.
   * Note that it may be modified by filling with alignment mark and/or feedback
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
  static async apply__TWO_WORKER__TWO_NET(
    source_TypedArray, source_height, source_width ) {

    // Send previous time output only if requested.
    let previous_output_TypedArrayArray;
    if ( this.ImplicitInputModeInfo.implicit_input_bFillPreviousOutput )
      previous_output_TypedArrayArray = this.previous_output_TypedArrayArray;

    let bApply_or_Applier = this.ModeInfo.bApply_or_Applier;

    let worker0_resulter = this.workerProxyArray[ 0 ]
      .TWO_WORKER__TWO_NET__step0__TypedArray_process_asyncGenerator(
        source_TypedArray, source_height, source_width,
        previous_output_TypedArrayArray?.[ 0 ],
        bApply_or_Applier );

    let { done: worker0_done_false, value: worker0_value_Int32Array }
      = await worker0_resulter.next();

    // Note: Use input_height and input_width of the neural network because
    //       the 1st web worker has scaled the source image. The 2nd web worker
    //       needs not scale again.
    const workerProxy1 = this.workerProxyArray[ 1 ];
    const workerProxy1_neuralNetIndex0 = 0;
    const neuralNetParams1
      = workerProxy1.neuralNetParamsBaseArray[ workerProxy1_neuralNetIndex0 ];

    const source_height1 = neuralNetParams1.inferencedParams.input_height;
    const source_width1 = neuralNetParams1.inferencedParams.input_width;

    let worker1_promise = workerProxy1
      .TWO_WORKER__TWO_NET__step1__TypedArray_process_async(
        worker0_value_Int32Array, source_height1, source_width1,
        previous_output_TypedArrayArray?.[ 1 ] );

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
   *   An unsigned integer TypedArray which will be processed by the neural
   * worker. For example, ImageData.data which is coming from a canvas.
   * Note that it may be modified by filling with alignment mark and/or feedback
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
  static async apply__ONE_WORKER__ONE_NET(
    source_TypedArray, source_height, source_width ) {

    // Send previous time output only if requested.
    let previous_output_TypedArrayArray;
    if ( this.ImplicitInputModeInfo.implicit_input_bFillPreviousOutput )
      previous_output_TypedArrayArray = this.previous_output_TypedArrayArray;

    // Note:
    //
    // .TWO_WORKER__TWO_NET__step1__TypedArray_process_async()
    //   - could scale (if necessary) and fill (if exists).
    //   - will not post back source TypedArray.
    //
    // So, it is suitable for single neural network inference usage.
    //
    let worker0_promise = this.workerProxyArray[ 0 ]
      .TWO_WORKER__TWO_NET__step1__TypedArray_process_async(
        source_TypedArray, source_height, source_width,
        previous_output_TypedArrayArray?.[ 0 ] );

    let worker0_value_TypedArray = await worker0_promise;

    this.previous_output_TypedArrayArray = [ worker0_value_TypedArray ];

    return this.previous_output_TypedArrayArray;
  }


  get totalWorkerCount() {
    return this.workerProxyArray.length;
  }

  /** */
  toString() {
    let strNeuralWorker_Mode
      = NeuralWorker_Mode.Singleton
          .getNameWithInt_byId( this.nNeuralWorker_ModeId );

    let strNeuralWorker_ImplicitInputMode
      = NeuralWorker_ImplicitInputMode.Singleton
          .getNameWithInt_byId( this.nNeuralWorker_ImplicitInputModeId );

    let str = 
        `backendName=\"${this.backendName}\", `
      + `nNeuralWorker_ModeId=${strNeuralWorker_Mode}, `
      + `nNeuralWorker_ImplicitInputModeId=`
        + `${strNeuralWorker_ImplicitInputMode}, `
      + `neuralNetCount=${this.neuralNetCount}, `
      + `hardwareConcurrency=${this.hardwareConcurrency}, `
      + `totalWorkerCount=${this.totalWorkerCount}, `
      + `alignmentMarkValueArrayArray=`
        + `${RandTools.array_toString( this.alignmentMarkValueArrayArray )}`
      ;
    return str;
  }

}

/**
 * An array for mapping from NeuralWorker_Mode.Singleton.Ids.Xxx to
 * NeuralWorker_Proxies.apply__Xxx
 */
NeuralWorker_Proxies.NeuralWorker_ModeId__to__TypedArray_process__Array = [

  // ONE_WORKER__TWO_NET (0)
  NeuralWorker_Proxies.apply__ONE_WORKER__TWO_NET,

  // TWO_WORKER__TWO_NET__APPLY (1)
  NeuralWorker_Proxies.apply__TWO_WORKER__TWO_NET,

  // TWO_WORKER__TWO_NET__APPLIER (2)
  NeuralWorker_Proxies.apply__TWO_WORKER__TWO_NET,

  // ONE_WORKER__ONE_NET (3)
  NeuralWorker_Proxies.apply__ONE_WORKER__ONE_NET,

];
