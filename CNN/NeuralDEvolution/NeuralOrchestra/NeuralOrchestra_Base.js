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
 * A possible 250K filter weights configuration:
 *   - input_height = 72
 *   - input_width = 131 (= ( 128 + 3 ) )
 *   - vocabularyChannelCount = 4
 *   - blockCountTotalRequested = 39
 *   - output_channelCount = 64
 *
 * It will get ( stageCount = 3 ). The extra 3 pixels of input_width are used
 * for recurrent feedback (i.e. the neural network output of the previous game
 * tick).
 *
 *
 * Another possible 250K filter weights configuration:
 *   - input_height = 72
 *   - input_width = 131 (= ( 128 + 3 ) )
 *   - vocabularyChannelCount = 2
 *   - blockCountTotalRequested = 52
 *   - output_channelCount = 64
 *
 * It will get ( stageCount = 4 ).
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
 * @member {string} submitter_clientId
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
 * @member {DEvolution.VersusSummary} devolutionVersusSummary
 *   The downloaded versus summary of the differential evolution.
 *
 * @member {DEvolution.Versus} devolutionVersus
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
    this.devolutionVersusSubmitter_dispose();
    this.devolutionVersus_dispose();
    this.neuralNetParamsBase_dispose();
    this.workerProxies_dispose();
    this.devolutionVersusSummary_dispose();

    super.disposeResources();
  }

  get downloader_spreadsheetId() {
    return this.devolutionVersusSummary.weightsSpreadsheetId;
  }

  get downloader_apiKey() {
    return this.devolutionVersusSummary.weightsAPIKey;
  }

  get submitter_clientId() {
    return this.devolutionVersusSubmitter.clientId;
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

//!!! ...unfinished... (2023/02/10)
// devolutionVersusSummaryDownloading
//   - should begin before shader compiling.
//   - its progress should be displayed after shader compiling and be combined
//       with devolutionVersus downloading.
//

//!!! ...unfinished... (2023/02/26)
// devolutionVersusSummary_load_asyncGenerator()
// set flag ( bVersusSummary_loaded = true )
// or ( progressVersusSummaryLoading.valuePercentage == 100 ) when done.
// (For letting construct.net to detect inside runtime.tick())
//
// devolutionVersus_load_asyncGenerator()
// set flag ( bVersus_loaded = true )
// or ( progressVersusLoading.valuePercentage == 100 ) when done.
// (For letting construct.net to detect inside runtime.tick())
//
// devolution_VersusSummary_Versus_load_asyncGenerator()
// call devolutionVersusSummary_load_asyncGenerator()
// and then devolutionVersus_load_asyncGenerator().
//
// async_neuralWorker_initer()
// call devolution_VersusSummary_Versus_load_asyncGenerator() too.
// It will be resolved when neuralWorker initialized.
// But the devolution_VersusSummary_Versus_load_asyncGenerator()
// should continue to be passed the next construct.net runtime state to
// continue loading.
//


//!!! ...unfinished... (2023/03/09)
// versusSummary_or_versus_load_promise
// versusSummary_or_versus_load_progress
//
// workerProxies_init_promise
//


  /**
   *   - Load all differential evolution versus weights ranges (i.e. versus summary).
   *   - Create workers and compile GPU shaders.
   *
   *
   * @param {string} downloader_spreadsheetId
   *   The Google Sheets spreadsheetId of neural network weights.
   *
   * @param {string} downloader_apiKey
   *   The API key for accessing the Google Sheets spreadsheet of neural network
   * weights. (Note: api key can not be changed after this object created.)
   *   - If null, Google Visualization Table Query API will be used.
   *   - If not null, Google Sheets API v4 will be used.
   *
   *
   * @param {string} submitter_clientId
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
   *   In the embedding layer, every vocabulary will have how many embedding
   * channels. Every input channel will be expanded into so many embedding
   * channels. It could be viewed as embeddingChannelCountPerInputChannel.
   * It must be ( >= 2 ) because it always has ( bEmbedVocabularyId == true ).
   *
   * @param {number} blockCountTotalRequested
   *   How many blocks of the whole neural network are wanted. It will be
   * spreaded to every stage. Note that every stage will have at least 2 blocks.
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

    submitter_clientId,

    input_height = 72,
    input_width = 131, // = ( 128 + 3 ),

    vocabularyChannelCount = 4, //8
    blockCountTotalRequested = 39, //100, //200, //50, //20, //10,
    output_channelCount = 64, //16,
  ) {

    // 1. Versus Downloader.
    let versusSummaryDownloaderPromise = this.devolutionVersusSummary_init_async(
      downloader_spreadsheetId, downloader_apiKey );

    // 2. Versus Neural Workers.
    let neuralWorkerPromise;
    {
      // Because image comes from canvas, the tf.browser.fromPixels() handle a RGBA
      // 4 channels faster than RGB 3 channels input.
      const input_channelCount = 4;

      // For image, every RGBA input channel always has 256 (= 2 ** 8) possible values.
      const vocabularyCountPerInputChannel = 256;

      // Use faster convolution neural network architecture.
      //
      // Although using SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (6) is even
      // faster, however, using SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5) is safer
      // because it will not drop the edge pixels of the image to be processed.
      //
      const nConvStageType
        = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1; // (5)

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
    this.devolutionVersusSubmitter_init( submitter_clientId );

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
   *   The neural network configuration. It will be used for both two neural
   * networks. It will be kept (i.e. owned and destroyed) by this NeuralOrchetra
   * object. Its .nConvStageTypeId may be modified according to which backend
   * (webgl or cpu) is used finally for gaining the best performance.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async workerProxies_init_async( neuralNetParamsBase ) {
    this.neuralNetParamsBase_dispose();
    this.neuralNetParamsBase = neuralNetParamsBase;

    let initOkPromise;
    let initOk;

    // 1. Try backend "webgl" first.
    //
    // Backend "webgl" has best performance with SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5)
    // and one web worker (NO_FILL).
    //
    {
      neuralNetParamsBase.nConvStageTypeId_adjust_for_backend_webgl_if_ShuffleNetV2();

      initOkPromise = this.workerProxies.init_async( "webgl",
        NeuralWorker.Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__NO_FILL // (0) 
      );

      initOk = await initOkPromise;
      if ( initOk ) {
        let bCreateOk // For WebGL, compile WebGL shaders in advance.
          = NeuralOrchestra_Base.workerProxies_compileShaders_async.call( this );
        return bCreateOk;
      }
    }

    // 2. If backend "webgl" initialization failed, try backend "cpu".
    //
    // Backend "cpu" has best performance with SHUFFLE_NET_V2 (4)
    // and two web workers (NO_FILL) by .applier().
    //
    {
      neuralNetParamsBase.nConvStageTypeId_adjust_for_backend_cpu_if_ShuffleNetV2();

      initOkPromise = this.workerProxies.init_async( "cpu",
        NeuralWorker.Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL__APPLIER // (5) 
      );

      initOk = await initOkPromise;
    }

    return initOk;
  }

  /**
   * Create dummy neural networks in all neural web workers to compile WebGL shaders
   * in advance.
   *
   * @param {NeuralOrchestra_Base} this
   */
  static async workerProxies_compileShaders_async() {

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
        + `workerProxies={ ${this.workerProxies} }`
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
//         + `workerProxies={ ${this.workerProxies} }`
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
  devolutionVersusSummary_dispose() {
    if ( this.devolutionVersusSummary ) {
      this.devolutionVersusSummary.disposeResources_and_recycleToPool();
      this.devolutionVersusSummary = null;
    }
  }

  /** Load all differential evolution versus weights ranges.
   *
   * @return {Promise}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async devolutionVersusSummary_init_async(
    downloader_spreadsheetId, downloader_apiKey ) {

    this.devolutionVersusSummary_dispose();
    this.devolutionVersusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
      downloader_spreadsheetId, downloader_apiKey );

    return this.devolutionVersusSummary.rangeArray_load_async();
  }


  /** */
  devolutionVersus_dispose() {
    if ( this.devolutionVersus ) {
      this.devolutionVersus.disposeResources_and_recycleToPool();
      this.devolutionVersus = null;
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
  async devolutionVersus_next_load__and__workerProxies_NeuralNetArray_create__async() {

    // 1. Download versus.
    this.devolutionVersus_dispose();
    this.devolutionVersus = await this.devolutionVersusSummary.versus_next_load_async();

    if ( !this.devolutionVersus ) {

//!!! ...unfinished... (2022/12/29)
// If downloading is failed (e.g. timeout), display message and re-try downloading.

      // throw Error( `NeuralOrchestra_Base.`
      //   + `devolutionVersus_next_load__and__workerProxies_NeuralNetArray_create__async(): `
      //   + `Failed to load next versus.`
      //   + `workerProxies={ ${this.workerProxies} }`
      // );

      return false;
    }

    // 2. Create neural networks.

    // Note: These Float32Array will be transferred to neural web workers (i.e.
    //       their .byteLength will become zero).
    let weightArrayBufferArray = [
      this.devolutionVersus.parentChromosomeFloat32Array.buffer,
      this.devolutionVersus.offspringChromosomeFloat32Array.buffer
    ];

    // In real-run, no need to observe dry-run performance and weight count.
    const bLogDryRunTime = false;
    let bCreateOkPromise = this.workerProxies_NeuralNetArray_create_async(
      weightArrayBufferArray, bLogDryRunTime );

    let bCreateOk = await bCreateOkPromise;
    if ( !bCreateOk )
      throw Error( `NeuralOrchestra_Base.`
        + `devolutionVersus_next_load__and__workerProxies_NeuralNetArray_create__async(): `
        + `Failed to create neural networks. `
        + `workerProxies={ ${this.workerProxies} }`
      );
  
    return bCreateOk;
  }

  /** */
  devolutionVersusSubmitter_dispose() {
    if ( this.devolutionVersusSubmitter ) {
      this.devolutionVersusSubmitter.disposeResources_and_recycleToPool();
      this.devolutionVersusSubmitter = null;
    }
  }

  /** Create differential evolution versus result reporter. */
  devolutionVersusSubmitter_init( submitter_clientId ) {
    this.devolutionVersusSubmitter_dispose();
    this.devolutionVersusSubmitter = DEvolution.VersusSubmitter
      .MultiEventName.Pool.get_or_create_by( submitter_clientId );
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
  devolutionVersusSubmitter_send( nNegativeZeroPositive ) {
    this.devolutionVersusSubmitter.post_by_versusId_NegativeZeroPositive(
      this.devolutionVersus.versusId, nNegativeZeroPositive );
  }

}
