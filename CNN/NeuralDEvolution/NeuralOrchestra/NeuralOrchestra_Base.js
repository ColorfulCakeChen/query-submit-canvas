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
 * @member {string} downloader_spreadsheetId
 *   The Google Sheets spreadsheetId of neural network weights. Every worker will
 * load weights from the spreadsheet to initialize one neural network.
 *
 * @member {string} downloader_apiKey
 *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
 *   - If null, Google Visualization Table Query API will be used.
 *   - If not null, Google Sheets API v4 will be used.
 *
 * @member {string} submitter_measurement_id
 *   The measurement id of stream of property of Google Analytics v4.
 *
 * @member {string} submitter_api_secret
 *   The measurement api secret of stream of property of Google Analytics v4.
 * 
 * @member {string} submitter_client_id
 *   The client id when sending measurement protocol.
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
    this.evolutionVersusSubmitter_dispose();
    this.evolutionVersus_dispose();
    this.neuralNetParamsBase_dispose();
    this.workerProxies_dispose();
    this.evolutionVersusSummary_dispose();

    super.disposeResources();
  }

  get downloader_spreadsheetId() {
    return this.evolutionVersusSummary.weightsSpreadsheetId;
  }

  get downloader_apiKey() {
    return this.evolutionVersusSummary.weightsAPIKey;
  }

  get submitter_measurement_id() {
    return this.evolutionVersusSubmitter.measurement_id;
  }

  get submitter_api_secret() {
    return this.evolutionVersusSubmitter.api_secret;
  }

  get submitter_client_id() {
    return this.evolutionVersusSubmitter.client_id;
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
   *   - Load all differential evolution versus weights ranges (i.e. versus summary).
   *   - Create workers and compile GPU shaders.
   *
   *
   * @param {string} downloader_spreadsheetId
   *   The Google Sheets spreadsheetId of neural network weights.
   *
   * @param {string} downloader_apiKey
   *   The API key for accessing the Google Sheets spreadsheet of neural network weights.
   * (Note: api key can not be changed after this object created.)
   *   - If null, Google Visualization Table Query API will be used.
   *   - If not null, Google Sheets API v4 will be used.
   *
   *
   * @param {string} submitter_measurement_id
   *   The measurement id of stream of property of Google Analytics v4.
   *
   * @param {string} submitter_api_secret
   *   The measurement api secret of stream of property of Google Analytics v4.
   * 
   * @param {string} submitter_client_id
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
   * @return {Promise}
   *   Return a promise.
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async init_async(
    downloader_spreadsheetId, downloader_apiKey,

    submitter_measurement_id, submitter_api_secret, submitter_client_id,

    input_height = 72,
    input_width = 128,

    vocabularyChannelCount = 8, //4,
    blockCountTotalRequested = 100, //200, //50, //20, //10,
    output_channelCount = 16,
  ) {

    // 1. Versus Downloader.
    let versusSummaryDownloaderPromise = this.evolutionVersusSummary_init_async(
      downloader_spreadsheetId, downloader_apiKey );

    // 2. Versus Neural Workers.
    let neuralWorkerPromise;
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

      neuralWorkerPromise = this.workerProxies_init_async( neuralNetParamsBase );
    }

    // 3. Versus Result Reporter
    this.evolutionVersusSubmitter_init(
      submitter_measurement_id, submitter_api_secret, submitter_client_id );

    // 4.

//!!! ...unfinished... (2022/12/29) AbortSignal.timeout()?
// If downloading is failed (e.g. timeout), display message and re-try downloading.

    let allPromise = Promise.all( [
      versusSummaryDownloaderPromise, neuralWorkerPromise ] );
    return allPromise;
  }

  /**
   * This method will always block UI worker (because of compiling WebGL shaders)
   * even if it is called in non-UI worker. So it is suggested to call this method
   * during game splash screen displaying.
   *
   * @param {NeuralNet.ParamsBase} neuralNetParamsBase
   *   The neural network configuration. It will be used for both two neural networks.
   * It will be kept (i.e. owned and destroyed) by this NeuralOrchetra object.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
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
   * Create dummy neural networks in all neural web workers to compile WebGL shaders
   * in advance.
   *
   * @param {NeuralOrchestra_Base} this
   */
  static async workerProxies_compileShaders_async() {

//!!! (2022/12/29 Remarked) Call workerProxies_NeuralNetArray_create_async() instead.
//
//     // Although neural network configuration will be copied (not transferred)
//     // to workers, they still need be cloned because NeuralWorker.Proxy will
//     // keep (i.e. owned and destroyed) them.
//     let neuralNetParamsBaseArray;
//     {
//       let neuralNetParams0 = this.neuralNetParamsBase.clone();
//       let neuralNetParams1 = this.neuralNetParamsBase.clone();
//       neuralNetParamsBaseArray = [ neuralNetParams0, neuralNetParams1 ];
//     }
//
//     // Dummy neural network's weights.
//     //      
//     // Neural network weights will be transferred (not copied) to workers. So,
//     // all new dummy array buffer should be created.
//     //
//     const weightArrayLength = ( 5 * 1024 * 1024 );
//     const weightArrayByteLength = weightArrayLength * Float32Array.BYTES_PER_ELEMENT;
//     let weightArrayBufferArray = [
//       new ArrayBuffer( weightArrayByteLength ), new ArrayBuffer( weightArrayByteLength )
//     ];
//
//     // (2022//09/26 Remarked)
//     const bLogDryRunTime = true; // For observing dry-run performance and weight count.
//     //const bLogDryRunTime = false;
//     let bCreateOkPromise = this.workerProxies.NeuralNetArray_create_async(
//       neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime );
//
//     let bCreateOk = await bCreateOkPromise;
//     if ( !bCreateOk )
//       throw Error( `NeuralOrchestra_Base.workerProxies_compileShaders_async(): `
//         + `Failed to create neural networks. `
//         + `${this.workerProxies}`
//     );
//
//     return bCreateOk;


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
    let bCreateOkPromise = this.workerProxies_NeuralNetArray_create_async(
      weightArrayBufferArray, bLogDryRunTime );

    let bCreateOk = await bCreateOkPromise;
    if ( !bCreateOk )
      throw Error( `NeuralOrchestra_Base.workerProxies_compileShaders_async(): `
        + `Failed to create neural networks. `
        + `${this.workerProxies}`
      );

    return bCreateOk;
  }

  /**
   * Create neural networks in all neural web workers.
   *
   * @param {ArrayBuffer[]} weightArrayBufferArray
   *   An array of every neural network's weights. Every element will be interpreted
   * as Float32Array. Every element will be transferred to web worker (i.e. their
   * .byteLength will become zero).
   *
   * @param {boolean} bLogDryRunTime
   *   If true, the neural network dry-run time will be measured twice and logged to
   * console.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async workerProxies_NeuralNetArray_create_async(
    weightArrayBufferArray, bLogDryRunTime ) {

    // Although neural network configuration will be copied (not transferred)
    // to workers, they still need be cloned because NeuralWorker.Proxy will
    // keep (i.e. owned and destroyed) them.
    let neuralNetParamsBaseArray;
    {
      let neuralNetParams0 = this.neuralNetParamsBase.clone();
      let neuralNetParams1 = this.neuralNetParamsBase.clone();
      neuralNetParamsBaseArray = [ neuralNetParams0, neuralNetParams1 ];
    }

    let bCreateOkPromise = this.workerProxies.NeuralNetArray_create_async(
      neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime );

    return bCreateOkPromise;

//!!! (2022/12/29 Remarked) Moved to caller.
//     let bCreateOk = await bCreateOkPromise;
//     if ( !bCreateOk )
//       throw Error( `NeuralOrchestra_Base.workerProxies_NeuralNetArray_create_async(): `
//         + `Failed to create neural networks. `
//         + `${this.workerProxies}`
//       );
//
//     return bCreateOk;
  }

  /**
   *
   * @param {ImageData} sourceImageData
   *   The input image datat which will be processed by neural workers.
   *
   * @return {Promise( Float32Array[] )}
   *   Return a promise resolved to an array [ Float32Array, Float32Array ]
   * representing the neural networks' results.
   */
  async workerProxies_ImageData_process_async( sourceImageData ) {
    let theFloat32ArrayArrayPromise
      = this.workerProxies.NeuralNetArray_create_async( sourceImageData );
    return theFloat32ArrayArrayPromise;
  }

  /** */
  evolutionVersusSummary_dispose() {
    if ( this.evolutionVersusSummary ) {
      this.evolutionVersusSummary.disposeResources_and_recycleToPool();
      this.evolutionVersusSummary = null;
    }
  }

  /** Load all differential evolution versus weights ranges.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async evolutionVersusSummary_init_async(
    downloader_spreadsheetId, downloader_apiKey ) {

    this.evolutionVersusSummary_dispose();
    this.evolutionVersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
      downloader_spreadsheetId, downloader_apiKey );

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
   * Load the next versus data, and create neural networks by these versus data.
   *
   * @return {Promise}
   *   Return a promise.
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async evolutionVersus_next_load__and__workerProxies_NeuralNetArray_create__async() {

    // 1. Download versus.
    this.evolutionVersus_dispose();
    this.evolutionVersus = await this.evolutionVersusSummary.versus_next_load_async();

    if ( !this.evolutionVersus ) {

//!!! ...unfinished... (2022/12/29)
// If downloading is failed (e.g. timeout), display message and re-try downloading.

      // throw Error( `NeuralOrchestra_Base.`
      //   + `evolutionVersus_next_load__and__workerProxies_NeuralNetArray_create__async(): `
      //   + `Failed to load next versus.`
      //   + `${this.workerProxies}`
      // );

      return false;
    }

    // 2. Create neural networks.

    // Note: These Float32Array will be transferred to neural web workers (i.e.
    //       their .byteLength will become zero).
    let weightArrayBufferArray = [
      this.evolutionVersus.parentChromosomeFloat32Array.buffer,
      this.evolutionVersus.offspringChromosomeFloat32Array.buffer
    ];

    // In real-run, no need to observe dry-run performance and weight count.
    const bLogDryRunTime = false;
    let bCreateOkPromise = this.workerProxies_NeuralNetArray_create_async(
      weightArrayBufferArray, bLogDryRunTime );

    let bCreateOk = await bCreateOkPromise;
    if ( !bCreateOk )
      throw Error( `NeuralOrchestra_Base.`
        + `evolutionVersus_next_load__and__workerProxies_NeuralNetArray_create__async(): `
        + `Failed to create neural networks. `
        + `${this.workerProxies}`
      );
  
    return bCreateOk;
  }

  /** */
  evolutionVersusSubmitter_dispose() {
    if ( this.evolutionVersusSubmitter ) {
      this.evolutionVersusSubmitter.disposeResources_and_recycleToPool();
      this.evolutionVersusSubmitter = null;
    }
  }

  /** Create differential evolution versus result reporter. */
  evolutionVersusSubmitter_init(
    submitter_measurement_id, submitter_api_secret, submitter_client_id ) {

    this.evolutionVersusSubmitter_dispose();
    this.evolutionVersusSubmitter = DEvolution.VersusSubmitter.Pool.get_or_create_by(
      submitter_measurement_id, submitter_api_secret, submitter_client_id );
  }

  /**
   * Submit the result of the last differential evolution versus to server.
   *
   * @param {number} nNegativeZeroPositive
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   */
  evolutionVersusSubmitter_send( nNegativeZeroPositive ) {
    this.evolutionVersusSubmitter.send(
      this.evolutionVersus.versusId.versusIdString,
      nNegativeZeroPositive
    );
  }

}
