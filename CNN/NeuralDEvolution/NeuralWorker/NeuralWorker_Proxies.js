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
 * parallel computing under the restriction transferring source image data to every
 * web worker serially.
 *
 *
 * 1. Idea
 *
 *
 * 1.1 For NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__Xxx
 *
 * Since it is slow to transfer data between CPU and GPU (for WebGL), it seems not
 * feasible to use multiple workers (which will transfer data between CPU and GPU
 * multiple times) to process both competition side of an diffential evolution
 * iteration.
 *
 * So these ONE_WORKER__Xxx mode combine two neural networks of both competition
 * sides in one web worker. Although they compute serially (not parallelly), they
 * still may be faster than compute them in two worker because the reduced memory
 * transferring between CPU and GPU.
 *
 *
 * 1.2 For NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__Xxx
 * 
 * Every worker handles one neural network. When .ImageData_process_async() is called,
 * the input (usually a large memory block) will be transffered to the 1st worker to
 * start computing, and then transffered to the 2nd worker to start computing, ... etc.
 *
 * When passing large data by Worker.postMessage(), it is preferred by transferring
 * (not by copying). If the large data wants to be transferred (not copied) to many
 * workers, the only possible way is to transferring them serially.
 *
 * However, serially transferring hurts the performance. Workers are better to compute
 * parallelly. So every worker should transfer the (possible scaled) source image data
 * back to this WorkerProxies, and keep computing neural network at the same time. And
 * then, this WorkerProxies will transfer the source image data to the next worker
 * as soon as possible.
 *
 * Finally, this WorkerProxies collects all web workers' results in a promise. The
 * promise will resolve with an array of Float32Array. Every Float32Array is the
 * output of one neural network.
 *
 *
 * 2. Experiments
 *
 * According to performance testing (i.e. NeuralWorker_tester.js), there are some
 * observations.
 *
 *
 * 2.0 FILL and NO_FILL
 *
 * How does a neural network know which alignment (in a differential evolution versus)
 * it represents? There are two methods: FILL or NO_FILL.
 *
 *   - FILL means the input image will be filled some information (i.e. alignment mark)
 *       before it is processed by a neural network.
 *
 *     - The cost are downloading input image from GPU to CPU, filling alignement mark,
 *         and upload it from CPU to GPU.
 *
 *   - NO_FILL means the input image will not be filled any extra information (i.e.
 *       alignment mark) before it is processed by a neural network. Instead, it will
 *       simultaneously output results of both alignments (suppose A and B).
 *
 *     - The cost are doubling the output channel count so that half output channels
 *         are for alignment A and the other half output channels are for alignment B.
 *
 * At first glance, we might guess doubling output channel count should be slower.
 * The memory downloading/modifying/uploading, however, are even slower. In the result,
 * the NO_FILL's performance is comparable (if not better) to FILL.
 *
 *
 * 2.1 Backend "cpu"
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
 * 2.2 Backend "webgl"
 *
 *   - ONE_WORKER_Xxx is better than TWO_WORKER_Xxx.
 *
 *     - The possible reason is that the GPU is a shared resource among all web
 *         workers. Using more web workers is just wasting more time to transfer
 *         input image (and then use just the same one GPU to do the computation).
 *
 *   - Xxx_APPLIER may or may not be better than Xxx_APPLY.
 *
 *     - The gain (if has) is not so obvious as in backend "cpu".
 *

 
!!! ...unfinished... (2022/09/25)

 *
 * 
 *
 *
 *
 *
 *
 *
 * @member {number} nNeuralWorker_ModeId
 *   The numeric identifier of neural worker mode (i.e.
 * NeuralWorker.Mode.Singleton.Ids.Xxx).
 *
 * @member {number} neuralNetCount
 *   There are how many neural networks created. It is always 2 (because of differential
 * evolution) no matter how totalWorkerCount is.
 *
 * @member {number} totalWorkerCount
 *   There are how many web worker(s) created.
 *
 * @member {function} ImageData_process_async
 *   This is a data member which is a pointer to a function. The function accepts
 * ImageData as input. It returns a promise resolved to an array
 * [ Float32Array, Float32Array ] representing the neural networks' results.
 */
class NeuralWorker_Proxies extends Recyclable.Root {

  /**
   * Used as default NeuralWorker.Proxies provider for conforming to Recyclable interface.
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
    this.ImageData_process_async = undefined;

    this.workerProxyArray_dispose();

    this.hardwareConcurrency = undefined;
    this.neuralNetCount = undefined;

    this.nNeuralWorker_ModeId = undefined;

    super.disposeResources();
  }

  /**
   * Initialize this worker proxy controller. It will create two neural networks in
   * one or two web worker(s).
   *
   *
   * @param {string} backendName
   *   Specify which backend should be used by tensorflow.js library.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if success.
   *   - Resolved to false, if failed.
   */
  async init_async( nNeuralWorker_ModeId, backendName = "webgl" ) {

    // 0.
    this.nNeuralWorker_ModeId = nNeuralWorker_ModeId;

    this.neuralNetCount = 2; // Always two neural network (for differential evolution).
    this.hardwareConcurrency = navigator.hardwareConcurrency; // logical CPU count.

    // Two web workers are sufficient.
    //
    // Although we might want create as many web worker as logical CPU count, it might
    // not need because our neural networks are learning by differential evolution.
    // Differential evolution evaluates just two entities every time.
    //
    // Note1: How could the two neural networks determine all the actions of so many
    //        game objects? The method is to let the output of one neural network
    //        contains all actions of all game objects.
    //
    // Note2: For NeuralWorker_Mode whose ( bFill == false ), only half of the output
    //        actions (i.e. actions of one alignment in the game world) will be used
    //        in one time.
    //
    let totalWorkerCount = NeuralWorker_Mode.workerCount_get( nNeuralWorker_ModeId );

    // 1. Web workers.
    let initOkArray;
    {
      // 1.0 Prepare container of all worker proxy.
      {
        if ( this.workerProxyArray )
          this.workerProxyArray.clear(); // Release old worker proxy.
        else
          this.workerProxyArray = Recyclable.OwnerArray.Pool.get_or_create_by();

        this.workerProxyArray.length = totalWorkerCount;
      }

      // 1.1 Create workers.
      let initPromiseArray = new Array( totalWorkerCount );
      for ( let i = 0; i < totalWorkerCount; ++i ) {
        this.workerProxyArray[ i ] = NeuralWorker_Proxy.Pool.get_or_create_by();
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

    // 2. Determine .ImageData_process_async
    NeuralWorker_Proxies.setup_ImageData_process.call( this );

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
   * Create neural networks in the web worker body.
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
  async NeuralNetArray_create_async( neuralNetParamsBaseArray, weightArrayBufferArray ) {

    if ( neuralNetParamsBaseArray.length != this.neuralNetCount )
      throw Error( `NeuralWorker.Proxies.NeuralNetArray_create_async(): `
        + `neuralNetParamsBaseArray.length ( ${neuralNetParamsBaseArray.length} ) `
        + `should be ${this.neuralNetCount}.`
      );

    if ( weightArrayBufferArray.length != this.neuralNetCount )
      throw Error( `NeuralWorker.Proxies.NeuralNetArray_create_async(): `
        + `weightArrayBufferArray.length ( ${weightArrayBufferArray.length} ) `
        + `should be ${this.neuralNetCount}.`
      );

    let createOk;

    // 1. Every worker create one neural network.
    if ( this.workerProxyArray.length > 1 ) { // (i.e. two workers)

      let createPromiseArray = new Array( this.workerProxyArray.length );
      for ( let i = 0; i < this.workerProxyArray.length; ++i ) {
        createPromiseArray[ i ] = this.workerProxyArray[ i ].NeuralNetArray_create_async(
          [ neuralNetParamsBaseArray[ i ] ], [ weightArrayBufferArray[ i ] ] );
      }

      let createOkArray = await Promise.all( createPromiseArray );

      createOk = createOkArray.reduce(
        ( previousValue, currentValue ) => ( previousValue && currentValue ),
        true
      );
  
    // 2. The only worker creates all neural networks.
    } else {
      createOk = await this.workerProxyArray[ 0 ].NeuralNetArray_create_async(
        neuralNetParamsBaseArray, weightArrayBufferArray );
    }

    return createOk;
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
  async alignmentMarkArray_setValue_async( markValueArray ) {

    if ( markValueArray.length != this.neuralNetCount )
      throw Error( `NeuralWorker.Proxies.alignmentMarkArray_setValue_async(): `
        + `markValueArray.length ( ${markValueArray.length} ) `
        + `should be ${this.neuralNetCount}.`
      );

    let resultOk;

    // 1. Every worker set one alignment mark value.
    if ( this.workerProxyArray.length > 1 ) { // (i.e. two workers)

      let resultPromiseArray = new Array( this.workerProxyArray.length );
      for ( let i = 0; i < this.workerProxyArray.length; ++i ) {
        resultPromiseArray[ i ]
          = this.workerProxyArray[ i ].alignmentMarkArray_setValue_async(
            [ markValueArray[ i ] ] );
      }

      let resultOkArray = await Promise.all( resultPromiseArray );

      resultOk = resultOkArray.reduce(
        ( previousValue, currentValue ) => ( previousValue && currentValue ),
        true
      );
  
    // 2. The only worker sets all alignment mark values.
    } else {
      resultOk = await this.workerProxyArray[ 0 ].alignmentMarkArray_setValue_async(
        markValueArray );
    }

    return resultOk;
  }


  /**
   * Setup .ImageData_process_async according to .nNeuralWorker_ModeId.
   *
   * @param {NeuralWorker_Proxies} this
   */
  static setup_ImageData_process() {
    switch ( this.nNeuralWorker_ModeId ) {
      case NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__FILL: // (0)
      case NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__NO_FILL: // (1)
        this.ImageData_process_async
          = NeuralWorker_Proxies.apply__ONE_WORKER__ONE_SCALE__FILL__or__NO_FILL;
        break;

      case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__FILL__APPLY: // (2)
      case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__FILL__APPLIER: // (3)
      case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL__APPLY: // (4)
      case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL__APPLIER: // (5)
        this.ImageData_process_async
          = NeuralWorker_Proxies.apply__TWO_WORKER__ONE_SCALE__FILL__or__NO_FILL;
        break;

      case NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__TWO_SCALE__NO_FILL: // (6)
        this.ImageData_process_async
          = NeuralWorker_Proxies.apply__TWO_WORKER__TWO_SCALE__NO_FILL;
        break;

      default:
        throw Error( `NeuralWorker_Proxies.setup_ImageData_process(): `
          + `Unknown nNeuralWorker_ModeId ( ${this.nNeuralWorker_ModeId} ).`
        );
        break;
    }
  }

  /** */
  static async apply__ONE_WORKER__ONE_SCALE__FILL__or__NO_FILL( sourceImageData ) {
    let bFill = NeuralWorker_Mode.bFill_get( this.nNeuralWorker_ModeId );

    let worker0_promise = this.workerProxyArray[ 0 ]
      .ONE_WORKER__ONE_SCALE__ImageData_process_async( sourceImageData, bFill );

    let worker0_value_Float32ArrayArray = await worker0_promise;
    return worker0_value_Float32ArrayArray;
  }

  /** */
  static async apply__TWO_WORKER__ONE_SCALE__FILL__or__NO_FILL( sourceImageData ) {
    let modeInfo = NeuralWorker_Mode.Singleton.getInfo_byId( this.nNeuralWorker_ModeId );
    let bFill = modeInfo.bFill;
    let bApply_or_Applier = modeInfo.bApply_or_Applier;

    let worker0_resulter;
    if ( bFill ) {
      worker0_resulter = this.workerProxyArray[ 0 ]
        .TWO_WORKER__ONE_SCALE__FILL__step0_ImageData_process_asyncGenerator(
          sourceImageData, bApply_or_Applier );
    } else {
      worker0_resulter = this.workerProxyArray[ 0 ]
        .TWO_WORKER__ONE_SCALE__NO_FILL__step0_ImageData_process_asyncGenerator(
          sourceImageData, bApply_or_Applier );
    }

    let { done: worker0_done_false, value: worker0_value_Int32Array }
      = await worker0_resulter.next();

    let worker1_promise = this.workerProxyArray[ 1 ]
      .TWO_WORKER__ONE_SCALE__step1_Int32Array_process_async(
        worker0_value_Int32Array, bFill );

    let [
      { done: worker0_done_true, value: worker0_value_Float32Array },
      worker1_value_Float32Array
    ] = await Promise.all( [ worker0_resulter.next(), worker1_promise ] );

    return [ worker0_value_Float32Array, worker1_value_Float32Array ];
  }

  /** */
  static async apply__TWO_WORKER__TWO_SCALE__NO_FILL( sourceImageData ) {
    const worker0_bFork = true;
    let worker0_resulter = this.workerProxyArray[ 0 ]
      .TWO_WORKER__TWO_SCALE__ImageData_process_asyncGenerator(
        sourceImageData, worker0_bFork );

    let { done: worker0_done_false, value: worker0_value_ImageData }
      = await worker0_resulter.next();

    const worker1_bFork = false;
    let worker1_resulter = this.workerProxyArray[ 1 ]
      .TWO_WORKER__TWO_SCALE__ImageData_process_asyncGenerator(
        worker0_value_ImageData, worker1_bFork );

    let [
      { done: worker0_done_true, value: worker0_value_Float32Array },
      { done: worker1_done_true, value: worker1_value_Float32Array },
    ] = await Promise.all( [ worker0_resulter.next(), worker1_resulter.next() ] );

    return [ worker0_value_Float32Array, worker1_value_Float32Array ];
  }


  get totalWorkerCount() {
    return this.workerProxyArray.length;
  }

}

