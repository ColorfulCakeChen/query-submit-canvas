export { NeuralWorker_Proxies as Proxies };

import * as Pool from "../util/Pool.js";
import * as Recyclable from "../util/Recyclable.js";
//import * as GSheets from "../util/GSheets.js";
//import * as ValueMax from "../util/ValueMax.js";
import * as NeuralNet from "../Conv/NeuralNet.js";
import * as DEvolution from "../DEvolution.js";
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
 * 1. For NeuralWorker_Mode.Singleton.Ids.ONE_WORKER__Xxx
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
 * 2. For NeuralWorker_Mode.Singleton.Ids.TWO_WORKER__Xxx
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
 *
 * @member {string} weightsSpreadsheetId
 *   The Google Sheets spreadsheetId of neural network weights. Every worker will
 * load weights from the spreadsheet to initialize one neural network.
 *
 * @member {string} weightsAPIKey
 *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
 *   - If null, Google Visualization Table Query API will be used.
 *   - If not null, Google Sheets API v4 will be used.
 *
 * @member {numner} nNeuralWorker_ModeId
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
 * @member {number} totalWorkerCount
 *   There are how many web worker(s) created.
 *
 * @member {DEvolution.VersusSummary} evolutionVersusSummary
 *   The range list of all differential evolution versus (i.e. parent versus offspring).
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

    if ( this.evolutionVersusSummary ) {
      this.evolutionVersusSummary.disposeResources_and_recycleToPool();
      this.evolutionVersusSummary = null;
    }

    this.disposeWorkers();

    this.hardwareConcurrency = undefined;
    this.neuralNetCount = undefined;

    this.nNeuralWorker_ModeId = undefined;
    this.weightsAPIKey = undefined;
    this.weightsSpreadsheetId = undefined;

    super.disposeResources();
  }

  /**
   * 
   */
   disposeWorkers() {
    if ( this.workerProxyArray ) {
      this.workerProxyArray.disposeResources_and_recycleToPool();
      this.workerProxyArray = null;
    }
  }

  /**
   * Initialize this worker proxy controller. It will create two neural networks in
   * one or two web worker(s).
   *
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if success.
   *   - Resolved to false, if failed.
   */
  async init_async( weightsSpreadsheetId, weightsAPIKey, nNeuralWorker_ModeId ) {

    // 0.
    this.weightsSpreadsheetId = weightsSpreadsheetId;
    this.weightsAPIKey = weightsAPIKey;
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

    // 1. Create web workers.
    let initOkArray;
    {
      // Prepare container of all worker proxy.
      {
        if ( this.workerProxyArray )
          this.workerProxyArray.clear();
        else
          this.workerProxyArray = Pool.OwnerArray.Pool.get_or_create_by();

        this.workerProxyArray.length = totalWorkerCount;
      }

      let initPromiseArray = new Array( totalWorkerCount );
      for ( let i = 0; i < totalWorkerCount; ++i ) {
        this.workerProxyArray[ i ] = WorkerProxy.Pool.get_or_create_by();
        initPromiseArray[ i ] = this.workerProxyArray[ i ].initWorker_async( i );
      }

      initOkArray = await Promise.all( initPromiseArray );
    }

    // 2. Summary.
    let initOk = initOkArray.reduce(
      ( previousValue, currentValue ) => ( previousValue && currentValue ),
      true
    );

    // 3.
    NeuralWorker_Proxies.setup_apply.call( this );

    return initOk;
  }


//!!! ...unfinished... (2022/09/21)

  /** Load all differential evolution versus weights ranges. */
  async evolutionVersusSummary_load_async() {

    if ( !this.evolutionVersusSummary ) {
      this.evolutionVersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
        this.weightsSpreadsheetId, this.weightsAPIKey );
    }

    this.evolutionVersusSummary.rangeArray_load_async();

//!!! ...unfinished... (2022/08/27)

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
   *
   * @param {ImageData} sourceImageData
   *   The source image data to be processed. It will be scaled to the correct shape
   * before passed into the neural network.
   *
   * @return {Promise}
   *   Return a promise resolved to an array of Float32Array representing the neural
   * networks' result.
   */
  ImageData_process_async( sourceImageData ) {
    return this.apply_async( sourceImageData );
  }


  /**
   * Setup .apply_async according to .nNeuralWorker_ModeId.
   *
   * @param {NeuralWorker_Proxies} this
   */
  static setup_apply() {
    switch ( this.nNeuralWorker_ModeId ) {
      case NeuralWorker_Mode.Ids.ONE_WORKER__ONE_SCALE__FILL: // (0)
      case NeuralWorker_Mode.Ids.ONE_WORKER__ONE_SCALE__NO_FILL: // (1)
        this.apply_async
          = NeuralWorker_Proxies.apply__ONE_WORKER__ONE_SCALE__FILL__OR__NO_FILL;
        break;

      case NeuralWorker_Mode.Ids.TWO_WORKER__ONE_SCALE__FILL: // (2)
      case NeuralWorker_Mode.Ids.TWO_WORKER__ONE_SCALE__NO_FILL: // (3)
        this.apply_async
          = NeuralWorker_Proxies.apply__TWO_WORKER__ONE_SCALE__FILL__OR__NO_FILL;
        break;

      case NeuralWorker_Mode.Ids.TWO_WORKER__TWO_SCALE__NO_FILL: // (4)
        this.apply_async = NeuralWorker_Proxies.apply__TWO_WORKER__TWO_SCALE__NO_FILL;
        break;

      default:
        throw Error( `NeuralWorker_Proxies.setup_apply(): `
          + `Unknown nNeuralWorker_ModeId ( ${nNeuralWorker_ModeId} ).`
        );
        break;
    }
  }

  /** */
  static async apply__ONE_WORKER__ONE_SCALE__FILL__OR__NO_FILL( sourceImageData ) {
    let bFill = NeuralWorker_Mode.bFill_get( this.nNeuralWorker_ModeId );

    let worker0_promise = this.workerProxyArray[ 0 ]
      .ImageData_scale_once_process_multiple_async( sourceImageData, bFill );

    let worker0_value_Float32ArrayArray = await worker0_promise;
    return worker0_value_Float32ArrayArray;
  }

  /** */
  static async apply__TWO_WORKER__ONE_SCALE__FILL__OR__NO_FILL( sourceImageData ) {
    let bFill = NeuralWorker_Mode.bFill_get( this.nNeuralWorker_ModeId );

    let worker0_resulter = this.workerProxyArray[ 0 ]
      .ImageData_scale_fork_fillable_process_asyncGenerator( sourceImageData, bFill );

    let { done: worker0_done_false, value: worker0_value_Int32Array }
      = await worker0_resulter.next();

    let worker1_promise = this.workerProxyArray[ 1 ]
      .Int32Array_fillable_process_async( worker0_value_Int32Array, bFill );

    let [
      { done: worker0_done_true, value: worker0_value_Float32Array },
      worker1_value_Float32Array
    ] = await Promise.all( [ worker0_resulter.next(), worker1_promise ] );

    return [ worker0_value_Float32Array, worker1_value_Float32Array ];
  }

  /** */
  static async apply__TWO_WORKER__TWO_SCALE__NO_FILL( sourceImageData ) {
    const worker0_bFork = true;
    const worker1_bFork = false;

    let worker0_resulter = this.workerProxyArray[ 0 ]
      .ImageData_scale_forkable_process_asyncGenerator(
        sourceImageData, worker0_bFork );

    let { done: worker0_done_false, value: worker0_value_ImageData }
      = await worker0_resulter.next();

    let worker1_resulter = this.workerProxyArray[ 1 ]
      .ImageData_scale_forkable_process_asyncGenerator(
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

