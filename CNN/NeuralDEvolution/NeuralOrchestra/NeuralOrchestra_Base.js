export { NeuralOrchestra_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import * as NeuralWorker from "../NeuralWorker.js";
import * as DEvolution from "../DEvolution.js";

/**
 * Orchestrate neural networks with differential evolution.
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
 * @member {string} backendName
 *   Which backend (of tensorflow.js library) is used by web worker. Either "cpu"
 * or "webgl".
 *
 * @member {number} nNeuralWorker_ModeId
 *   The numeric identifier of neural worker mode (i.e.
 * NeuralWorker.Mode.Singleton.Ids.Xxx).
 *
 * @member {NeuralNet.ParamsBase} neuralNetParamsBase
 *   The neural network configuration. It will be used for both two neural networks.
 * It will be kept (i.e. owned and destroyed) by this NeuralOrchetra object.
 *
 */
class NeuralOrchestra_Base extends Recyclable.Root {

  /**
   * Used as default NeuralOrchestra.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralOrchestra.Base.Pool",
    NeuralOrchestra_Base, NeuralOrchestra_Base.setAsConstructor );

  /** */
  constructor( weightsSpreadsheetId, weightsAPIKey ) {
    super();
    NeuralOrchestra_Base.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey
    );
  }

  /** @override */
  static setAsConstructor( weightsSpreadsheetId, weightsAPIKey ) {
    super.setAsConstructor();
    NeuralOrchestra_Base.setAsConstructor_self.call( this,
      weightsSpreadsheetId, weightsAPIKey
    );
    return this;
  }

  /** @override */
  static setAsConstructor_self(
    weightsSpreadsheetId, weightsAPIKey ) {

    this.evolutionVersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
      weightsSpreadsheetId, weightsAPIKey );

    this.workerProxies = NeuralWorker.Proxies.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    this.neuralNetParamsBase_dispose();
    this.workerProxies_dispose();
    this.evolutionVersusSummary_dispose();

    super.disposeResources();
  }

  get weightsSpreadsheetId() {
    return this.evolutionVersusSummary.weightsSpreadsheetId;
  }

  get weightsAPIKey( ) {
    return this.evolutionVersusSummary.weightsAPIKey;
  }

  get backendName() {
    return this.workerProxies.backendName;
  }

  get nNeuralWorker_ModeId() {
    return this.workerProxies.nNeuralWorker_ModeId;
  }

  /** */
  neuralNetParamsBase_dispose() {
    if ( this.neuralNetParamsBase ) {
      this.neuralNetParamsBase.disposeResources_and_recycleToPool();
      this.neuralNetParamsBase = null;
    }
  }

  /** */
  workerProxies_dispose() {
    if ( this.workerProxies ) {
      this.workerProxies.disposeResources_and_recycleToPool();
      this.workerProxies = null;
    }
  }

  /**
   *   - Load all differential evolution versus weights ranges.
   *   - Create workers and compile GPU shaders.
   *
   */
  async init() {

    // 1.
    let networkPromise = this.evolutionVersusSummary_load_async();

    // 2.
    let neuralWorkPromise;
    {
      const input_height = 72;
      const input_width = 128;
      const input_channelCount = 4;

      const vocabularyChannelCount = 8; //4;
      const vocabularyCountPerInputChannel = 256;

      const nConvStageType
        = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID;

      const blockCountTotalRequested = 100; //200; //50; //20; //10;
      const output_channelCount = 64; //8; //4; //400; //300; //64;

      // The neuralNet should not keep-input-tensor because the input image is
      // created from canvas in real time.
      const bKeepInputTensor = false;

      let neuralNetParamsBase = NeuralNet.ParamsBase.Pool.get_or_create_by(
        input_height, input_width, input_channelCount,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        nConvStageType,
        blockCountTotalRequested_ShuffleNet, output_channelCount, bKeepInputTensor
      );

      neuralWorkPromise = this.workerProxies_init_async( neuralNetParamsBase );
    }

    let allPromise = Promise.all( [ networkPromise, neuralWorkPromise ] );
    return allPromise;
  }

  /**
   * This method will block UI worker (because of compiling WebGL shaders), so it is
   * suggested call this method during game splash screen displaying.
   *
   * @param {NeuralNet.ParamsBase} neuralNetParamsBase
   *   The neural network configuration. It will be used for both two neural networks.
   * It will be kept (i.e. owned and destroyed) by this NeuralOrchetra object.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if success.
   *   - Resolved to false, if failed.
   */
  async workerProxies_init_async( neuralNetParamsBase ) {
    this.neuralNetParamsBase_dispose();
    this.neuralNetParamsBase = neuralNetParamsBase;

    // 1. Try backend "webgl" first.
    //
    // Backend "webgl" has best performance with one web worker (NO_FILL).
    //
    let initOkPromise = this.workerProxies.init_async( "webgl",
      NeuralWorker.Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__NO_FILL // (0) 
    );
 
    let initOk = await initOkPromise;
    if ( initOk ) {
      let bCreateOk // For WebGL, compile WebGL shaders in advance.
        = NeuralOrchestra_Base.workerProxies_compileShaders_async.call( this );
      return bCreateOk;
    }

    // 2. If backend "webgl" initialization failed, try backend "cpu".
    //
    // Backend "cpu" has best performance with two web workers (NO_FILL) by .applier().
    //
    initOkPromise = this.workerProxies.init_async( "cpu",
      NeuralWorker.Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL__APPLIER // (5) 
    );
  
    initOk = await initOkPromise;
    return initOk;
  }

  /**
   * Create dummy neural networks in all web worker to compile WebGL shaders in advance.
   *
   * @param {NeuralOrchestra_Base} this
   */
  static workerProxies_compileShaders_async() {

    // Although neural network configuration will be copied (not transferred)
    // to workers, they still need be cloned because NeuralWorker.Proxy will
    // keep (i.e. owned and destroyed) them.
    let neuralNetParamsBaseArray;
    {
      let neuralNetParams0 = this.neuralNetParamsBase.clone();
      let neuralNetParams1 = this.neuralNetParamsBase.clone();
      neuralNetParamsBaseArray = [ neuralNetParams0, neuralNetParams1 ];
    }

    // Dummy neural network's weights.
    //      
    // Neural network weights will be transferred (not copied) to workers. So,
    // all new dummy array buffer should be created.
    //
    const weightArrayLength = ( 5 * 1024 * 1024 );
    const weightArrayByteLength = weightArrayLength * Float32Array.BYTES_PER_ELEMENT;
    let weightArrayBufferArray = [
      new ArrayBuffer( weightArrayByteLength ), new ArrayBuffer( weightArrayByteLength )
    ];

    // (2022//09/26 Remarked)
    //const bLogDryRunTime = true; // For observing dry-run performance.
    const bLogDryRunTime = false;
    let bCreateOkPromise = this.workerProxies.NeuralNetArray_create_async(
      neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime );

    let bCreateOk = await bCreateOkPromise;
    if ( !bCreateOk )
      throw Error( `NeuralOrchestra_Base.workerProxies_compileShaders_async(): `
        + `Failed to create neural networks. `
        + `${this.workerProxies}`
    );

    return bCreateOk;
  }

  /** */
  evolutionVersusSummary_dispose() {
    if ( this.evolutionVersusSummary ) {
      this.evolutionVersusSummary.disposeResources_and_recycleToPool();
      this.evolutionVersusSummary = null;
    }
  }

  /** Load all differential evolution versus weights ranges. */
  async evolutionVersusSummary_load_async() {

    this.evolutionVersusSummary.rangeArray_load_async();

//!!! ...unfinished... (2022/09/21)


  }

}
