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
 * @member {DEvolution.VersusSummary} evolutionVersusSummary
 *   The downloaded versus summary of the differential evolution.
 *
 * @member {DEvolution.Versus} evolutionVersus
 *   The downloaded current versus of the differential evolution.
 *
 */
class NeuralOrchestra_Base extends Recyclable.Root {

  /**
   * Used as default NeuralOrchestra.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralOrchestra.Base.Pool",
    NeuralOrchestra_Base, NeuralOrchestra_Base.setAsConstructor );

  /** */
  constructor() {
    super();
    NeuralOrchestra_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    NeuralOrchestra_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.workerProxies = NeuralWorker.Proxies.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    this.evolutionVersus_dispose();
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
   *
   * @param {string} weightsSpreadsheetId
   *   The Google Sheets spreadsheetId of neural network weights.
   *
   * @param {string} weightsAPIKey
   *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
   * (Note: api key can not be changed after this object created.)
   *   - If null, Google Visualization Table Query API will be used.
   *   - If not null, Google Sheets API v4 will be used.
   *
   *
   * @param {string} measurement_id
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {string} api_secret
   *   The measurement api secret of stream of property of Google Analytics v4.
   * 
   * @param {string} client_id
   *   The client id when sending measurement protocol.
   *
   *
   * @param {number} input_height
   *   The input image's height.
   *
   * @param {number} input_width
   *   The input image's width.
   *
   * @param {number} vocabularyChannelCount
   *   In the embedding layer, every vocabulary will have how many embedding channels.
   * Every input channel will be expanded into so many embedding channels. It could
   * be viewed as embeddingChannelCountPerInputChannel. It must be ( >= 2 ) because
   * it always has ( bEmbedVocabularyId == true ).
   *
   * @param {number} blockCountTotalRequested
   *   How many blocks of the whole neural network are wanted. It will be spreaded to
   * every stage. Note that every stage will have at least 2 blocks.
   *
   * @param {number} output_channelCount
   *   The output tensor's channel count.
   *
   */
  async init(
    weightsSpreadsheetId, weightsAPIKey,

    measurement_id, api_secret, client_id,

    input_height = 72,
    input_width = 128,

    vocabularyChannelCount = 8, //4,
    blockCountTotalRequested = 100, //200, //50, //20, //10,
    output_channelCount = 16,
  ) {

    // 1. Versus Downloader.
    let networkPromise
      = this.evolutionVersusSummary_init_async( weightsSpreadsheetId, weightsAPIKey );

    // 2. Versus Neural Networks.
    let neuralWorkPromise;
    {
      // Because image comes from canvas, the tf.browser.fromPixels() handle a RGBA
      // 4 channels faster than RGB 3 channels input.
      const input_channelCount = 4;

      // For image, every RGBA input channel always has 256 (= 2 ** 8) possible values.
      const vocabularyCountPerInputChannel = 256;

      // Always use the fastest convolution neural network architecture.
      const nConvStageType
        = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID;

      // The neuralNet should not keep-input-tensor because the input image is
      // created from canvas in real time.
      const bKeepInputTensor = false;

      let neuralNetParamsBase = NeuralNet.ParamsBase.Pool.get_or_create_by(
        input_height, input_width, input_channelCount,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        nConvStageType,
        blockCountTotalRequested, output_channelCount, bKeepInputTensor
      );

      neuralWorkPromise = this.workerProxies_init_async( neuralNetParamsBase );
    }

    // 3. Versus Result Reporter
    {
      this.evolutionVersusSubmitter_init( measurement_id, api_secret, client_id );
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

//!!! ...unfinished... (2022/10/27)
// Provide a function which could accept weight array and bLogDryRunTime.
// And then, call NeuralNetArray_create_async().

  /**
   * Create dummy neural networks in all web worker to compile WebGL shaders in advance.
   *
   * @param {NeuralOrchestra_Base} this
   */
  static async workerProxies_compileShaders_async() {

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
    const bLogDryRunTime = true; // For observing dry-run performance and weight count.
    //const bLogDryRunTime = false;
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
  async evolutionVersusSummary_init_async( weightsSpreadsheetId, weightsAPIKey ) {

    this.evolutionVersusSummary_dispose();
    this.evolutionVersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
      weightsSpreadsheetId, weightsAPIKey );

    return this.evolutionVersusSummary.rangeArray_load_async();
  }

  /** */
  evolutionVersus_dispose() {
    if ( this.evolutionVersus ) {
      this.evolutionVersus.disposeResources_and_recycleToPool();
      this.evolutionVersus = null;
    }
  }

  /**
   * Load the next versus data.
   *
   * @return {Promise( DEvolution.Versus )}
   *   Return a promise.
   *   - It will resolve to a true ???, if succeed.
   *   - It will resolve to false ???, if failed.
   */
  async evolutionVersus_next_load_async() {

//!!! ...unfinished... (2022/10/20)
    this.evolutionVersus_dispose();
    this.evolutionVersus = await this.evolutionVersusSummary.versus_next_load_async();

    if ( !this.evolutionVersus )
      return false ???;

    this.evolutionVersus.parentChromosomeFloat32Array;
    this.evolutionVersus.offspringChromosomeFloat32Array;

    return true ???;
  }


  /** */
  evolutionVersusSubmitter_dispose() {
    if ( this.evolutionVersusSubmitter ) {
      this.evolutionVersusSubmitter.disposeResources_and_recycleToPool();
      this.evolutionVersusSubmitter = null;
    }
  }

  /** Create differential evolution versus result reporter. */
  evolutionVersusSubmitter_init( measurement_id, api_secret, client_id ) {

    this.evolutionVersusSubmitter_dispose();
    this.evolutionVersusSubmitter = DEvolution.VersusSubmitter.Pool.get_or_create_by(
      measurement_id, api_secret, client_id );
  }

}
