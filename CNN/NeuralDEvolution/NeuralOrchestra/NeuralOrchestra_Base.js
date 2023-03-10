export { NeuralOrchestra_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as HttpRequest from "../../util/HttpRequest.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import * as NeuralWorker from "../NeuralWorker.js";
import * as DEvolution from "../DEvolution.js";

/**
 * Orchestrate neural networks with differential evolution.
 *
 *
 * 1. Configuration for 250K filter weights and executing 2 times per second
 *
 *   - input_height = 72
 *   - input_width = 131 (= ( 128 + 3 ) )
 *   - output_channelCount = 64
 *
 * The extra +3 pixels of input_width are used for recurrent feedback (i.e.
 * the neural network output of the previous game tick).
 *
 * The ( output_channelCount = 64 ) is important.
 *
 *   - If it is lesser (e.g. 32), the stageCount will also be lesser. Because
 *       image is shrinked less times, its performancce is slower (i.e. can not
 *       achieve 2 times per second). Although its filter weights will also be
 *       lesser.
 *
 *   - If it is more (e.g. 128), the stageCount will also be more. Because
 *       image is shrinked more times, its performancce is faster (i.e. can
 *       exceed 2 times per second). However, its filter weights will also be
 *       more (than 250K).
 *
 *
 * 1.1 Configuration_4_39
 *
 *   - vocabularyChannelCount = 4
 *   - blockCountTotalRequested = 39
 *
 * It will get ( stageCount = 3 ). Its performance in backend webgl is faster
 * than Configuration_2_52.
 *
 *
 * 1.2 Configuration_2_52
 *
 *   - vocabularyChannelCount = 2
 *   - blockCountTotalRequested = 52
 *
 * It will get ( stageCount = 4 ). Its performance in backend cpu is faster
 * than Configuration_4_39.
 *
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
 * @member {DEvolution.VersusSummary} versusSummary
 *   The downloaded versus summary of the differential evolution.
 *
 * @member {DEvolution.Versus} versus
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
    this.params_loading_retryWaiting_create();
    this.workerProxies = NeuralWorker.Proxies.Pool.get_or_create_by();
  }

  /** @override */
  disposeResources() {
    this.versusSubmitter_dispose();
    this.versus_dispose();
    this.neuralNetParamsBase_dispose();
    this.workerProxies_dispose();
    this.versusSummary_dispose();
    this.versusSummary_and_versus_load_progress_dispose();
    this.params_loading_retryWaiting = undefined;

    super.disposeResources();
  }

  get downloader_spreadsheetId() {
    return this.versusSummary.weightsSpreadsheetId;
  }

  get downloader_apiKey() {
    return this.versusSummary.weightsAPIKey;
  }

  get submitter_clientId() {
    return this.versusSubmitter.clientId;
  }

  get backendName() {
    return this.workerProxies.backendName;
  }

  get nNeuralWorker_ModeId() {
    return this.workerProxies.nNeuralWorker_ModeId;
  }

  /** Create .params_loading_retryWaiting */
  params_loading_retryWaiting_create() {
    const loadingMillisecondsMax = ( 60 * 1000 );
    const loadingMillisecondsInterval = ( 5 * 1000 );

    const retryTimesMax = -1; // retry infinite times
    const retryWaitingSecondsExponentMax = 6; // i.e. ( 2 ** 6 ) = 64 seconds
    const retryWaitingMillisecondsInterval = ( 1000 );

    this.params_loading_retryWaiting
      = new HttpRequest.Params_loading_retryWaiting(
          loadingMillisecondsMax, loadingMillisecondsInterval,
          retryTimesMax,
          retryWaitingSecondsExponentMax, retryWaitingMillisecondsInterval
        );
  }

  /** */
  versusSummary_and_versus_load_progress_dispose() {
    if ( this.versusSummary_and_versus_load_progress ) {
      this.versusSummary_and_versus_load_progress.disposeResources_and_recycleToPool();
      this.versusSummary_and_versus_load_progress = null;
    }
  }

  /** */
  neuralNetParamsBase_dispose() {
    if ( this.neuralNetParamsBase ) {
      this.neuralNetParamsBase.disposeResources_and_recycleToPool();
      this.neuralNetParamsBase = null;
    }
  }

//!!! ...unfinished... (2023/02/10)
// versusSummaryDownloading
//   - should begin before shader compiling.
//   - its progress should be displayed after shader compiling and be combined
//       with versus downloading.
//

//!!! ...unfinished... (2023/02/26)
// versusSummary_load_asyncGenerator()
// set flag ( bVersusSummary_loaded = true )
// or ( progressVersusSummaryLoading.valuePercentage == 100 ) when done.
// (For letting construct.net to detect inside runtime.tick())
//
// versus_load_asyncGenerator()
// set flag ( bVersus_loaded = true )
// or ( progressVersusLoading.valuePercentage == 100 ) when done.
// (For letting construct.net to detect inside runtime.tick())
//
// devolution_VersusSummary_Versus_load_asyncGenerator()
// call versusSummary_load_asyncGenerator()
// and then versus_load_asyncGenerator().
//
// async_neuralWorker_initer()
// call devolution_VersusSummary_Versus_load_asyncGenerator() too.
// It will be resolved when neuralWorker initialized.
// But the devolution_VersusSummary_Versus_load_asyncGenerator()
// should continue to be passed the next construct.net runtime state to
// continue loading.
//


//!!! ...unfinished... (2023/03/09)
// versusSummary_load_promise
// versusSummary_and_versus_load_promise
// versusSummary_and_versus_load_progress
//
// versus_load_promise
// versus_load_progress
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

//!!! ...unfinished... (2023/03/10)

    // 1. Versus Downloader.
    this.downloader_spreadsheetId = downloader_spreadsheetId;
    this.downloader_apiKey = downloader_apiKey;

    this.versusSummary_and_versus_load_promise
      = this.versusSummary_and_versus_load_async( ??? );

    // 2. Neural Workers.
    {
      // Because image comes from canvas, the tf.browser.fromPixels() handle a
      // RGBA 4 channels faster than RGB 3 channels input.
      const input_channelCount = 4;

      // For image, every RGBA input channel always has 256 (= 2 ** 8) possible
      // values.
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

      this.workerProxies_init_promise
        = this.workerProxies_init_async( neuralNetParamsBase );
    }

    // 3. Versus Result Reporter
    this.versusSubmitter_init( submitter_clientId );

    // 4.

//!!! ...unfinished... (2022/12/29) AbortSignal.timeout()?
// If downloading is failed (e.g. timeout), display message and re-try downloading.

    let allPromise = Promise.all( [
      ???this.versusSummary_or_versus_load_promise,
      this.workerProxies_init_promise ] );
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
   * Create dummy neural networks in all neural web workers to compile WebGL
   * shaders in advance.
   *
   * @param {NeuralOrchestra_Base} this
   */
  static async workerProxies_compileShaders_async() {

    // Dummy neural network's weights.
    //      
    // Neural network weights will be transferred (not copied) to workers. So,
    // all new dummy array buffer should be created.
    //
    // Note: The dummy array size should not too large (e.g. larger than
    //       ( 10 * 1024 * 1024 )). Otherwise, it will fail in mobile phone.
    //
    const weightArrayLength = ( 5 * 1024 * 1024 );
    const weightArrayByteLength
      = weightArrayLength * Float32Array.BYTES_PER_ELEMENT;

    let weightArrayBufferArray = [
      new ArrayBuffer( weightArrayByteLength ),
      new ArrayBuffer( weightArrayByteLength )
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
   * representing the (pair) neural networks' results.
   */
  async workerProxies_ImageData_process_async( sourceImageData ) {
    let theFloat32ArrayArrayPromise
      = this.workerProxies.ImageData_process_async( sourceImageData );
    return theFloat32ArrayArrayPromise;
  }

  /** */
  workerProxies_dispose() {
    if ( this.workerProxies ) {
      this.workerProxies.disposeResources_and_recycleToPool();
      this.workerProxies = null;
    }
  }


  /** */
  versusSummary_dispose() {
    if ( this.versusSummary ) {
      this.versusSummary.disposeResources_and_recycleToPool();
      this.versusSummary = null;
    }
  }

  /** */
  versus_dispose() {
    if ( this.versus ) {
      this.versus.disposeResources_and_recycleToPool();
      this.versus = null;
    }
  }

  /**
   * Load all differential evolution versus weights ranges. And then, load one
   * versus.
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  async versus_load_async() {

    if ( this.versusSummary_and_versus_load_progress )
      this.versusSummary_and_versus_load_progress.child_disposeAll();
    else
      this.versusSummary_and_versus_load_progress
        = ValueMax.Percentage.Aggregate.Pool.get_or_create_by()

    let progressRoot = progressParent.root_get();
    let progressFetcher = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 1 ) );


//!!! ...unfinished... (2023/03/10)
    this.versusSummary_load_asyncGenerator

  }

  /**
   *   - Load all differential evolution versus weights ranges (if not yet loaded).
   *   - Load one versus.
   *   - Create neural networks by the versus data.
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( boolean )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: true }, if succeeded.
   *   - Resolved to { done: true, value: false }, if failed.
   */
  async* versus_load_asyncGenerator( progressParent ) {

    // 0.

    // 0.1 Determine whether necessary to load versus summary.
    let versusSummary_bNeedLoad;
    if ( this.versusSummary ) {
      if ( this.versusSummary.bLoaded ) {
        versusSummary_bNeedLoad = false; // Already loaded.
      } else {
        versusSummary_bNeedLoad = true;
      }
    } else {
      this.versusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
        this.downloader_spreadsheetId, this.downloader_apiKey );
      versusSummary_bNeedLoad = true;
    }

    // 0.2 Prepare progress.
    let progressRoot = progressParent.root_get();

    let progressVersusSummary;
    if ( versusSummary_bNeedLoad ) {
      progressVersusSummary = progressParent.child_add(
        ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
    }

    let progressVersus = progressParent.child_add(
      ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

    let progressToAdvance = progressParent.child_add(
      ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) );

    // 1. Load versus summary.
    if ( versusSummary_bNeedLoad ) {
      let versusSummary_loadOk
        = yield *this.versusSummary.rangeArray_load_asyncGenerator(
            progressVersusSummary, this.params_loading_retryWaiting );
  
      if ( !versusSummary_loadOk ) {
        throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
          + `Failed to load DEvolution.VersusSummary.rangeArray.`
        );
        return false;
      }
    }

    // 2. Load versus.
    this.versus_dispose();
    this.versus = yield* this.versusSummary.versus_next_load_asyncGenerator(
      progressVersus, this.params_loading_retryWaiting );

    if ( !this.versus ) {
      throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
        + `Failed to load DEvolution.Versus.`
      );
      return false;
    }

    // 3. Create neural networks.

    // Note: These Float32Array will be transferred to neural web workers (i.e.
    //       their .byteLength will become zero).
    let weightArrayBufferArray = [
      this.versus.parentChromosomeFloat32Array.buffer,
      this.versus.offspringChromosomeFloat32Array.buffer
    ];

    // 3.1 Before creating neural network, the neural web workers should be ready.
    let workerProxies_initOk = await this.workerProxies_init_promise;
    if ( !workerProxies_initOk )
      throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
        + `Failed to initialize NeuralWorker.Proxies. `
        + `workerProxies={ ${this.workerProxies} }`
      );

    progressToAdvance.value_advance();
    yield progressRoot;

    // 3.2 Create neural networks.

    // In real-run, no need to observe dry-run performance and weight count.
    const bLogDryRunTime = false;
    let bCreateOkPromise = this.workerProxies_NeuralNetArray_create_async(
      weightArrayBufferArray, bLogDryRunTime );

    let bCreateOk = await bCreateOkPromise;
    if ( !bCreateOk )
      throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
        + `Failed to create neural networks. `
        + `workerProxies={ ${this.workerProxies} }`
      );
  
    progressToAdvance.value_advance();
    yield progressRoot;
  
    return bCreateOk;
  }


  /** Create differential evolution versus result reporter. */
  versusSubmitter_init( submitter_clientId ) {
    this.versusSubmitter_dispose();
    this.versusSubmitter = DEvolution.VersusSubmitter
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
  versusSubmitter_send( nNegativeZeroPositive ) {
    this.versusSubmitter.post_by_versusId_NegativeZeroPositive(
      this.versus.versusId, nNegativeZeroPositive );
  }

  /** */
  versusSubmitter_dispose() {
    if ( this.versusSubmitter ) {
      this.versusSubmitter.disposeResources_and_recycleToPool();
      this.versusSubmitter = null;
    }
  }

}
