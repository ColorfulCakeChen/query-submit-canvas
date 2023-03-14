export { NeuralOrchestra_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as HttpRequest from "../../util/HttpRequest.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import * as NeuralWorker from "../NeuralWorker.js";
import * as DEvolution from "../DEvolution.js";

/**
 * Orchestrate neural networks with differential evolution.
 *
 *
 * 1. Usage
 *
 * There are mainly two using methods according to whether you want provide
 * yourself progressParent.
 *
 *
 * 1.1 Without yourself progressParent
 *
 *
 * 1.1.1
 *
 *   - Initialize (and also load one versus):
 *     - call and await .init_async().
 *     - After it resolved to true, go to 1.1.2
 *
 *   - Load another versus:
 *     - call .versus_load_promise_create()
 *     - go to 1.1.2
 *
 *
 * 1.1.2
 *
 *   - Wait for versus loaded and neural networks created:
 *     - await .versus_load_promise, or
 *     - check .versus_loadOk asynchronously until become true, or
 *     - check .versus_load_progress.valuePercentage asynchronously until become 100.
 *   - go to 1.3
 *
 *
 * 1.2 With yourself progressParent
 *
 *
 * 1.2.1
 *
 *   - Initialize (and also load one versus):
 *     - call .init_asyncGeneraotr() with yourself progressParent.
 *     - await .next() until { done: true, value: true }, go to 1.2.2
 *
 *   - Load another versus:
 *     - call .versus_loader_create() with yourself progressParent.
 *     - go to 1.2.2
 *
 *
 * 1.2.2
 *
 *   - Wait for versus loaded and neural networks created:
 *     - await .versus_loader.next() until { done: true, value: true }, or
 *     - check .versus_loadOk asynchronously until become true.
 *     - (.versus_load_progress is not used.)
 *   - go to 1.3
 *
 *
 * 1.3 Process image, and report versus result
 *
 *   - call and await .workerProxies_ImageData_process_async()
 *   - call versusResultSender_send()
 *
 *
 * 2. Configuration for 250K filter weights and executing 2 times per second
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
 * 2.1 Configuration_4_39
 *
 *   - vocabularyChannelCount = 4
 *   - blockCountTotalRequested = 39
 *
 * It will get ( stageCount = 3 ). Its performance in backend webgl is faster
 * than Configuration_2_52.
 *
 *
 * 2.2 Configuration_2_52
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
 *   The API key for accessing the Google Sheets spreadsheet of neural network
 * weights.
 *   - If null, Google Visualization Table Query API will be used.
 *   - If not null, Google Sheets API v4 will be used.
 *
 * @member {boolean} bLogFetcherEventToConsole
 *   If true, some debug messages of HttpRequest.Fetcher will be logged to console.
 *
 * @member {string} sender_clientId
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
 *   The neural network configuration. It will be used for both two neural
 * networks. It will be kept (i.e. owned and destroyed) by this
 * NeuralOrchetra object.
 *
 * @member {DEvolution.VersusSummary} versusSummary
 *   The downloaded versus summary of the differential evolution.
 *
 * @member {DEvolution.Versus} versus
 *   The downloaded current versus of the differential evolution.
 *
 *
 * @member {boolean} init_async_running
 *   If true, a .init_async() is still executing. Please wait it becoming
 * false if wanting to call again.
 *
 * @member {boolean} init_asyncGenerator_running
 *   If true, a .init_asyncGenerator() is still executing. Please wait it
 * becoming false if wanting to call again.
 *
 * @member {boolean} initOk
 *   If true, a .init_async() has been executed and succeeded.
 *
 *
 * @member {boolean} workerProxies_init_async_running
 *   If true, a .workerProxies_init_async() is still executing. Please wait
 * it becoming false if wanting to call again.
 *
 * @member {boolean} workerProxies_initOk
 *   If true, a .workerProxies_init_async() has been executed and succeeded.
 *
 * @member {Promise( boolean )} workerProxies_init_promise
 *   The promise of .workerProxies_init_async().
 *   - Resolved to true, if succeeded.
 *     - The neural workers have been created and GPU shaders have been
 *         compiled.
 *   - Resolved to false, if failed.
 *
 *
 * @member {boolean} workerProxies_ImageData_process_async_running
 *   If true, a .workerProxies_ImageData_process_async() is still executing.
 * Please wait it becoming false if wanting to call again.
 *
 *
 * @member {boolean} versus_load_async_running
 *   If true, a .versus_load_async() is still executing. Please wait it becoming
 * false if wanting to call again.
 *
 * @member {boolean} versus_load_asyncGenerator_running
 *   If true, a .versus_load_asyncGenerator() is still executing. Please wait
 * it becoming false if wanting to call again.
 *
 * @member {Promise( boolean )} versus_load_promise
 *   The promise of whether .versus_load_progress still be advancing.
 *   - If settled, the .versus_load_progress has been stopped.
 *   - If resolved to true, it means versus summary loaded, versus loaded, and
 *       neural networks created.
 *
 * @member {AsyncGenerator} versus_loader
 *   A .versus_load_asyncGenerator() instance.
 *
 * @member {ValueMax.Percentage.Aggregate} versus_load_progress
 *   The progress of loading versus summary, loading versus, creating neural
 * networks. If ( .versus_load_progress.valuePercentage == 100 ), all the
 * loading and creating has done.
 *   - It is used only if .init_async() is called.
 *   - If .init_asyncGenerator() is called directly, itself progressParent
 *       parameter will be used instead.
 *
 * @member {boolean} versus_loadOk
 *   If true, a .versus_load_asyncGenerator() has been executed and succeeded.
 */
class NeuralOrchestra_Base extends Recyclable.Root {

  /**
   * Used as default NeuralOrchestra.Base provider for conforming to
   * Recyclable interface.
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
    NeuralOrchestra_Base.params_loading_retryWaiting_create.call( this );
  }

  /** @override */
  disposeResources() {
    NeuralOrchestra_Base.versusResultSender_dispose.call( this );

    NeuralOrchestra_Base.versus_load_progress_dispose.call( this );
    this.versus_load_promise = undefined;
    this.versus_loader = undefined;
    this.versus_loadOk = undefined;
    this.versus_load_asyncGenerator_running = undefined;
    this.versus_load_async_running = undefined;
    NeuralOrchestra_Base.versus_dispose.call( this );
    NeuralOrchestra_Base.versusSummary_dispose.call( this );

    this.workerProxies_ImageData_process_async_running = undefined;

    this.workerProxies_init_promise = undefined;
    this.workerProxies_initOk = undefined;
    this.workerProxies_init_async_running = undefined;
    NeuralOrchestra_Base.neuralNetParamsBase_dispose.call( this );
    NeuralOrchestra_Base.workerProxies_dispose.call( this );

    this.initOk = undefined;
    this.init_asyncGenerator_running = undefined;
    this.init_async_running = undefined;

    this.bLogFetcherEventToConsole = undefined;
    this.downloader_apiKey = undefined;
    this.downloader_spreadsheetId = undefined;

    this.params_loading_retryWaiting = undefined;

    super.disposeResources();
  }

  get sender_clientId() {
    return this.versusResultSender?.clientId;
  }

  get backendName() {
    return this.workerProxies.backendName;
  }

  get nNeuralWorker_ModeId() {
    return this.workerProxies.nNeuralWorker_ModeId;
  }

  /**
   * Create .params_loading_retryWaiting
   *
   * @param {NeuralOrchestra_Base} this
   */
  static params_loading_retryWaiting_create() {
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

  /**
   * @param {NeuralOrchestra_Base} this
   */
  static neuralNetParamsBase_create(
    input_height = 72,
    input_width = 131, // = ( 128 + 3 ),

    vocabularyChannelCount = 4, //8
    blockCountTotalRequested = 39, //100, //200, //50, //20, //10,
    output_channelCount = 64 //16
  ) {

    NeuralOrchestra_Base.neuralNetParamsBase_dispose.call( this );

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

    this.neuralNetParamsBase = NeuralNet.ParamsBase.Pool.get_or_create_by(
      input_height, input_width, input_channelCount,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageType,
      blockCountTotalRequested, output_channelCount, bKeepInputTensor
    );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   */
  static neuralNetParamsBase_dispose() {
    if ( this.neuralNetParamsBase ) {
      this.neuralNetParamsBase.disposeResources_and_recycleToPool();
      this.neuralNetParamsBase = null;
    }
  }


  /**
   * Call .init_asyncGenerator() and .versus_load_promise_create() internally.
   *
   *
   * Note1: Although this is an async method, it will always block main worker
   *        (i.e. UI worker). (Please see also .init_asyncGenerator() explanation.)
   *
   * Note2: For the same reason, after this async method resolved, continue to
   *        await .versus_load_promise will not block main worker. (Please see
   *        also .init_asyncGenerator() explanation.)
   *
   *
   * @return {Promise}
   *   Return a promise (i.e. the .workerProxies_init_promise).
   *   - Resolved to true, if succeeded.
   *     - The neural workers have been created and GPU shaders have been
   *         compiled.
   *     - But the versus summary and versus may still be loading (i.e. not
   *         yet complete). The neural networks may also still not be created
   *         (since they need the versus data). Please check .versus_load_promise
   *         or .versus_load_progress or .versus_loadOk to determine whether
   *         complete.
   * 
   *   - Resolved to false, if failed.
   */
  async init_async(
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,

    sender_clientId,

    input_height,
    input_width,

    vocabularyChannelCount,
    blockCountTotalRequested,
    output_channelCount
  ) {

    if ( this.init_async_running )
      throw Error( `NeuralOrchestra.Base.init_async(): `
        + `should not be executed multiple times simultaneously.` );

    try {
      // 0. Prevent re-entrance.
      this.init_async_running = true;

      // 1. Use internal independent progress.
      NeuralOrchestra_Base.versus_load_progress_create.call( this );

      // 2. Start to load (versus summary and) versus, initialize
      //    NeuralWorker.Proxies, and create neural networks.
      let initer_async = this.init_asyncGenerator(
        this.versus_load_progress,
        downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
        sender_clientId,
        input_height, input_width,
        vocabularyChannelCount,
        blockCountTotalRequested,
        output_channelCount
      );
    
      let initer_next;
      do {
        initer_next = await initer_async.next();
      } while ( !initer_next.done );

      // (Note: The .initOk will also be set.)
      let initOk = initer_next.value;
      if ( initOk != this.initOk )
        throw Error( `NeuralOrchestra.Base.init_async(): `
          + `initOk ( ${initOk} ) `
          + `should be the same as `
          + `this.initOk ( ${this.initOk} ).`
        );

      // 3. Continue to load (versus summary and) versus and create neural
      //    networks.
      //
      // Note: It is not be awaited here. Caller should .versus_load_promise
      this.versus_load_promise_create();

      return this.initOk;

    } finally {
      // 4. So that this async method could be executed again.
      this.init_async_running = false;
    }
  }

  /**
   *   - Load all differential evolution versus weights ranges (i.e. versus summary).
   *   - Load one versus.
   *   - Create neural workers and compile GPU shaders.
   *   - Create neural networks.
   *
   *
   * Note1: Although this is an async generator, it will always block main worker
   *        (i.e. UI worker) due to GPU shader compiling no matter it is called
   *        in which web worker. So, it is highly recommended to call it when
   *        display a static splash screen.
   *
   * Note2: After this async generator done, continue to .versus_loader.next()
   *        which will not block main worker. So, it is recommended to do that
   *        with an animated screen for displaying loading progress.
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
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
   * @param {string} sender_clientId
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
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( boolean )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: true }, if succeeded.
   *     - The neural workers have been created and GPU shaders have been
   *         compiled.
   *     - But the versus summary and versus may still be loading (i.e. not
   *         yet complete). The neural networks may also still not be created
   *         (since they need the versus data). Please check .versus_loader
   *         or .versus_loadOk to determine whether complete.
   * 
   *   - Resolved to { done: true, value: false }, if failed.
   */
  async* init_asyncGenerator(
    progressParent,

    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,

    sender_clientId,

    input_height,
    input_width,

    vocabularyChannelCount,
    blockCountTotalRequested,
    output_channelCount
  ) {

    if ( this.init_asyncGenerator_running )
      throw Error( `NeuralOrchestra.Base.init_asyncGenerator(): `
        + `should not be executed multiple times simultaneously.` );

    if ( this.workerProxies_init_async_running )
      throw Error( `NeuralOrchestra.Base.init_asyncGenerator(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still initializing.` );

    if ( this.workerProxies_ImageData_process_async_running )
      throw Error( `NeuralOrchestra.Base.init_asyncGenerator(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still processing image.` );

    if (   ( this.versus_load_async_running )
        || ( this.versus_load_asyncGenerator_running ) )
      throw Error( `NeuralOrchestra.Base.init_asyncGenerator(): `
        + `should not be executed while `
        + `DEvolution.VersusSummary or DEvolution.Versus is still loading.` );
      
    try {
      // 0.
      this.initOk = false;

      // 0.1 Prevent re-entrance.
      this.init_asyncGenerator_running = true;

      // 0.2
      this.downloader_spreadsheetId = downloader_spreadsheetId;
      this.downloader_apiKey = downloader_apiKey;
      this.bLogFetcherEventToConsole = bLogFetcherEventToConsole;

      // 0.3
      // Note: Here should not call .versus_load_progress_dispose().
      NeuralOrchestra_Base.versus_dispose.call( this );
      NeuralOrchestra_Base.versusSummary_dispose.call( this );

      // 0.4
      let progressRoot = progressParent.root_get();
      let allPromiseSet = new Set();

      // 1. Load (versus summary and) versus. Create neural networks.
      this.versus_loader_create( progressParent );

      let loader_next = this.versus_loader.next();
      allPromiseSet.add( loader_next );

      // 2. Initialize NeuralWorker.Proxies
      {
        // It will be used by .workerProxies_init_async()
        NeuralOrchestra_Base.neuralNetParamsBase_create.call( this,
          input_height, input_width,
          vocabularyChannelCount,
          blockCountTotalRequested,
          output_channelCount );

          NeuralOrchestra_Base.workerProxies_create.call( this );
        NeuralOrchestra_Base.workerProxies_init_promise_create.call( this );
        allPromiseSet.add( this.workerProxies_init_promise );
      }

      // 3. Wait NeuralWorker.Proxies initialization to complete, and
      //    advance DEvolution.Versus loading simultaneously.
      //
      // Note: Here does not wait for DEvolution.Versus loading complete.
      //       Here mainly waits for neural workers creating and GPU shaders
      //       compiling to complete. However, here let they going in parallel.
      let workerProxies_init_done = false;
      do {

        // 3.1
        //
        // If .versus_loader.next() resolved, got an { done, value } object.
        // If .workerProxies_init_promise resolved, got a boolean value.
        let allPromise = Promise.race( allPromiseSet );
        let object_or_boolean = await allPromise;

        // 3.2 .versus_loader.next() resolved.
        if ( object_or_boolean instanceof Object ) {

          let object = object_or_boolean;
          if ( object.done ) {

            // (Note: The .versus_loadOk will also be set.)
            let versus_loadOk = object.value;
            if ( versus_loadOk != this.versus_loadOk )
              throw Error( `NeuralOrchestra.Base.init_asyncGenerator(): `
                + `versus_loadOk ( ${versus_loadOk} ) `
                + `should be the same as `
                + `this.versus_loadOk ( ${this.versus_loadOk} ).`
              );

            // 3.2.1
            // In theory, it should not execute to here because
            // .versus_loader waits .workerProxies_init_promise internally.
            throw Error( `NeuralOrchestra.Base.init_asyncGenerator(): `
              + `.versus_loader `
              + `should not be done before `
              + `.workerProxies_init_promise`
            );

          // 3.2.2 DEvolution.Versus has been loaded a little. Report progress
          //       and schedule to wait it to load next a little.
          } else {
            // let progressRoot = object.value;
            yield progressRoot;

            allPromiseSet.delete( loader_next );
            loader_next = this.versus_loader.next();
            allPromiseSet.add( loader_next );
          }

        // 3.3 .workerProxies_init_promise resolved.
        //     (Note: The .workerProxies_initOk will also be set.)
        } else {
          let workerProxies_initOk = object_or_boolean; // should be a boolean value.
          if ( workerProxies_initOk != this.workerProxies_initOk )
            throw Error( `NeuralOrchestra.Base.init_asyncGenerator(): `
              + `workerProxies_initOk ( ${workerProxies_initOk} ) `
              + `should be the same as `
              + `this.workerProxies_initOk ( ${this.workerProxies_initOk} ).`
            );

          workerProxies_init_done = true;

          if ( !workerProxies_initOk )
            throw Error( `NeuralOrchestra.Base.init_asyncGenerator(): `
              + `Failed to initialize NeuralWorker.Proxies. `
              + `workerProxies={ ${this.workerProxies} }`
            );
        }

      } while ( !workerProxies_init_done );

      // 4. Create Versus Result Reporter
      NeuralOrchestra_Base.versusResultSender_create.call( this, sender_clientId );

      // 5.
      this.initOk = true;
      return this.initOk;

    } finally {
      // 6. So that this async generator could be executed again.
      this.init_asyncGenerator_running = false;
    }
  }


  /**
   * @param {NeuralOrchestra_Base} this
   */
  static workerProxies_create() {
    NeuralOrchestra_Base.workerProxies_dispose.call( this );
    this.workerProxies = NeuralWorker.Proxies.Pool.get_or_create_by();
  }

  /**
   * @param {NeuralOrchestra_Base} this
   */
  static workerProxies_dispose() {
    if ( this.workerProxies ) {
      this.workerProxies.disposeResources_and_recycleToPool();
      this.workerProxies = null;
    }
  }

  /**
   * Call .workerProxies_init_async() and record the returned promise in
   * .workerProxies_init_promise.
   *
   * @param {NeuralOrchestra_Base} this
   * @param {NeuralNet.ParamsBase} this.neuralNetParamsBase
   *
   * @return {Promise( boolean )}
   *   Return this.workerProxies_init_promise
   */
  static workerProxies_init_promise_create() {
    this.workerProxies_init_promise
      = NeuralOrchestra_Base.workerProxies_init_async.call( this );
    return this.workerProxies_init_promise;
  }

  /**
   * This method will always block UI worker (because of compiling WebGL shaders)
   * even if it is called in non-UI worker. So it is suggested to call this method
   * during game splash screen displaying.
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @param {NeuralNet.ParamsBase} this.neuralNetParamsBase
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
  static async workerProxies_init_async() {

    if ( this.workerProxies_init_async_running )
      throw Error( `NeuralOrchestra.Base.workerProxies_init_async(): `
        + `should not be executed multiple times simultaneously.` );

    if ( this.workerProxies_ImageData_process_async_running )
      throw Error( `NeuralOrchestra.Base.workerProxies_init_async(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still processing image.` );

    let initOk;
    try {
      // 0.
      this.workerProxies_initOk = false;

      // 0.1 Prevent re-entrance.
      this.workerProxies_init_async_running = true;

      // 0.2
      let neuralNetParamsBase = this.neuralNetParamsBase;
      let initOkPromise;

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
        if ( initOk ) { // For WebGL, compile WebGL shaders in advance.
          let compilePromise
            = NeuralOrchestra_Base.workerProxies_compileShaders_async.call( this );

          let compileOk = await compilePromise;

          this.workerProxies_initOk = compileOk;
          return this.workerProxies_initOk;
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
        this.workerProxies_initOk = initOk;
        return this.workerProxies_initOk;
      }

    } finally {
      // 3. So that this async method could be executed again.
      this.workerProxies_init_async_running = false;
    }
  }

  /**
   * Create dummy neural networks in all neural web workers to compile WebGL
   * shaders in advance.
   *
   * @param {NeuralOrchestra_Base} this
   * @param {NeuralNet.ParamsBase} this.neuralNetParamsBase
   */
  static async workerProxies_compileShaders_async() {

    if ( this.workerProxies_ImageData_process_async_running )
      throw Error( `NeuralOrchestra.Base.workerProxies_compileShaders_async(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still processing image.` );

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
    let neuralNet_create_promise
      = NeuralOrchestra_Base.workerProxies_NeuralNetArray_create_async.call(
        this, weightArrayBufferArray, bLogDryRunTime );

    let createOk = await neuralNet_create_promise;
    if ( !createOk )
      throw Error( `NeuralOrchestra.Base.workerProxies_compileShaders_async(): `
        + `Failed to create neural networks. `
        + `workerProxies={ ${this.workerProxies} }`
      );

    return createOk;
  }

  /**
   * Create neural networks in all neural web workers.
   *
   * This method is called by:
   *   - either .workerProxies_compileShaders_async(),
   *   - or .versus_load_asyncGenerator().
   *
   *
   * @param {NeuralOrchestra_Base} this
   * @param {NeuralNet.ParamsBase} this.neuralNetParamsBase
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
  static async workerProxies_NeuralNetArray_create_async(
    weightArrayBufferArray, bLogDryRunTime ) {

    if ( this.workerProxies_ImageData_process_async_running )
      throw Error( `NeuralOrchestra.Base.workerProxies_NeuralNetArray_create_async(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still processing image.` );

    // Although neural network configuration will be copied (not transferred)
    // to workers, they still need be cloned because NeuralWorker.Proxy will
    // keep (i.e. owned and destroyed) them.
    let neuralNetParamsBaseArray;
    {
      let neuralNetParams0 = this.neuralNetParamsBase.clone();
      let neuralNetParams1 = this.neuralNetParamsBase.clone();
      neuralNetParamsBaseArray = [ neuralNetParams0, neuralNetParams1 ];
    }

    let neuralNet_create_promise = this.workerProxies.NeuralNetArray_create_async(
      neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime );

    return neuralNet_create_promise;
  }

  /**
   *
   * @param {ImageData} sourceImageData
   *   The input image datat which will be processed by neural workers.
   *
   * @return {Promise( Float32Array[] )}
   *   Return a promise resolved to an array [ Float32Array, Float32Array ]
   * representing the (pair) neural networks' results.
   *   - Float32Array[ 0 ] is parent (chromosome) neural network's output.
   *   - Float32Array[ 1 ] is offspring (chromosome) neural network's output.
   */
  async workerProxies_ImageData_process_async( sourceImageData ) {

    if ( this.workerProxies_ImageData_process_async_running )
      throw Error( `NeuralOrchestra.Base.workerProxies_ImageData_process_async(): `
        + `should not be executed multiple times simultaneously.` );

    if ( !this.initOk )
      throw Error( `NeuralOrchestra.Base.workerProxies_ImageData_process_async(): `
        + `should be executed only if `
        + `this.initOk ( ${this.initOk} ) is true.` );

    if ( !this.versus_loadOk )
      throw Error( `NeuralOrchestra.Base.workerProxies_ImageData_process_async(): `
        + `should be executed only if `
        + `this.versus_loadOk ( ${this.versus_loadOk} ) is true.` );

    try {
      // 0. Prevent re-entrance.
      this.workerProxies_ImageData_process_async_running = true;

      // 1.
      let theFloat32ArrayArrayPromise
        = this.workerProxies.ImageData_process_async( sourceImageData );

      return theFloat32ArrayArrayPromise;

    } finally {
      // 2. So that this async method could be executed again.
      this.workerProxies_ImageData_process_async_running = false;
    }
  }


  /**
   * @param {NeuralOrchestra_Base} this
   */
  static versus_load_progress_create() {
    NeuralOrchestra_Base.versus_load_progress_dispose.call( this );
    this.versus_load_progress
      = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
  }

  /**
   * @param {NeuralOrchestra_Base} this
   */
  static versus_load_progress_dispose() {
    if ( this.versus_load_progress ) {
      this.versus_load_progress.disposeResources_and_recycleToPool();
      this.versus_load_progress = null;
    }
  }


  /**
   * @param {NeuralOrchestra_Base} this
   */
  static versusSummary_create(
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole ) {

    NeuralOrchestra_Base.versusSummary_dispose.call( this );
    this.versusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
      downloader_spreadsheetId, downloader_apiKey );

    this.versusSummary.bLogFetcherEventToConsole = bLogFetcherEventToConsole;
  }

  /**
   * @param {NeuralOrchestra_Base} this
   */
  static versusSummary_dispose() {
    if ( this.versusSummary ) {
      this.versusSummary.disposeResources_and_recycleToPool();
      this.versusSummary = null;
    }
  }


  /**
   * @param {NeuralOrchestra_Base} this
   */
  static versus_dispose() {
    if ( this.versus ) {
      this.versus.disposeResources_and_recycleToPool();
      this.versus = null;
    }
  }

  /**
   * Create .versus_load_promise (an instance of .versus_load_async()).
   *
   *
   * @param {AsyncGenerator} this.versus_loader
   *   - If .versus_loader does not exist, a new .versus_load_progress
   *       and .versus_loader will be created.
   *       (Usually, this case is used when you want to load the next versus
   *       without yourself progressParent.)
   *
   *   - If .versus_loader has already existed (i.e. not null), it will
   *       be used directly (and no extra progress object will be created too).
   *       (Usually, this case is used by .init_async().)
   *
   * @return {Promise( boolean )}
   *   Return the newly created this.versus_load_promise
   */
  versus_load_promise_create() {

    // Case 1: Outside caller calls this method.
    if ( !this.versus_loader ) {
      NeuralOrchestra_Base.versus_load_progress_create.call( this );
      this.versus_loader_create( this.versus_load_progress );

    // Case 2: .init_async() calls this method.
    }

    this.versus_load_promise
      = NeuralOrchestra_Base.versus_load_async.call( this );
    return this.versus_load_promise;
  }

  /**
   * Call .versus_loader.next() until done.
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @param {AsyncGenerator} this.versus_loader
   *   - The .versus_loader should have already existed (i.e. not null).
   *       It will be .next() until done by this async method.
   *   - The .versus_loader will be clear to null when this method done.
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *     - Versus summary and versus are loaded. Neural networks are created.
   *   - Resolved to false, if failed.
   */
  static async versus_load_async() {

    if ( this.versus_load_async_running )
      throw Error( `NeuralOrchestra.Base.versus_load_async(): `
        + `should not be executed multiple times simultaneously.` );

    try {
      this.versus_load_async_running = true;

      if ( !this.versus_loader )
        throw Error( `NeuralOrchestra.Base.versus_load_async(): `
          + `this.versus_loader should have already existed.` );

      let loaderNext;
      do {
        loaderNext = await this.versus_loader.next();
      } while ( loaderNext.done == false );

      // The result should be either true or false. If result is undefined,
      // the generator has been terminated previously by throwing exception.
      // So, continue to throw exception to inform caller the generator is
      // illegal.
      if ( loaderNext.value === undefined )
        throw Error( `NeuralOrchestra.Base.versus_load_async(): `
          + `this.versus_loader is illegal `
          + `(e.g. has been terminated previously by throwing exception).` );

      let bLoadOk = loaderNext.value;
      return bLoadOk;

    } finally {
      // 2. So that this async method could be executed again.
      this.versus_load_async_running = false;

      // Prevent a finished versus loader to be re-used.
      this.versus_loader = null;
    }
  }

  /**
   * Create .versus_loader (an instance of .versus_load_asyncGenerator()).
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @return {AsyncGenerator}
   *   Return the newly created this.versus_loader
   */
  versus_loader_create( progressParent ) {
    this.versus_loader = NeuralOrchestra_Base.versus_load_asyncGenerator.call(
      this, progressParent );
    return this.versus_loader;
  }

  /**
   *   - Load all differential evolution versus weights ranges (if not yet loaded).
   *     - Record in .versusSummary
   *
   *   - Load one versus.
   *     - Record in .versus
   *
   *   - Create neural networks by the versus data.
   *     - Record in .workerProxies
   *
   *
   * If this generator is executing, it should not create another same generator.
   * Please do that after the executing generator done.
   *
   *
   * @param {NeuralOrchestra_Base} this
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
   *     - .versus_loadOk will also be set to true.
   *   - Resolved to { done: true, value: false }, if failed.
   *     - .versus_loadOk will also be set to false.
   */
  static async* versus_load_asyncGenerator( progressParent ) {

    if ( this.versus_load_asyncGenerator_running )
      throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
        + `should not be executed multiple times simultaneously.` );

    let initRunning_or_initOk
      = ( this.init_asyncGenerator_running ) || ( this.initOk );
    if ( !initRunning_or_initOk )
      throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
        + `should be executed `
        + `either during initializing `
        + `or after initialization successful.` );

    // Prevent the nueral networks from being changed during they are processing.
    if ( this.workerProxies_ImageData_process_async_running )
      throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still processing image.` );

    let progressRoot;
    let progressToAdvance;
    let neuralNet_createOk;
    try {
      // 0.
      this.versus_loadOk = undefined;

      // 0.1 Prevent re-entrance.
      this.versus_load_asyncGenerator_running = true;

      // 0.2 Determine whether necessary to load versus summary.
      let versusSummary_needLoad;
      if ( this.versusSummary ) {
        if ( this.versusSummary.loadOk ) {
          versusSummary_needLoad = false; // Already loaded.
        } else {
          versusSummary_needLoad = true;
        }
      } else {
        NeuralOrchestra_Base.versusSummary_create.call( this,
          this.downloader_spreadsheetId, this.downloader_apiKey,
          this.bLogFetcherEventToConsole );
        versusSummary_needLoad = true;
      }

      // 0.3 Prepare progress.
      progressRoot = progressParent.root_get();

      let progressVersusSummary;
      if ( versusSummary_needLoad ) {
        progressVersusSummary = progressParent.child_add(
          ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );
      }

      let progressVersus = progressParent.child_add(
        ValueMax.Percentage.Aggregate.Pool.get_or_create_by() );

      progressToAdvance = progressParent.child_add(
        ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2 ) );

      // 1. Load versus summary.
      if ( versusSummary_needLoad ) {
        let versusSummary_loadOk
          = yield *this.versusSummary.rangeArray_load_asyncGenerator(
              progressVersusSummary, this.params_loading_retryWaiting );

        if ( !versusSummary_loadOk )
          throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
            + `Failed to load DEvolution.VersusSummary.rangeArray.`
          );
      }

      // 2. Load versus.
      NeuralOrchestra_Base.versus_dispose.call( this );
      this.versus = yield* this.versusSummary.versus_next_load_asyncGenerator(
        progressVersus, this.params_loading_retryWaiting );

      if ( !this.versus )
        throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
          + `Failed to load DEvolution.Versus.`
        );

      // 3. Create neural networks.

      // Note: These Float32Array will be transferred to neural web workers
      //       (i.e. their .byteLength will become zero).
      let weightArrayBufferArray = [
        this.versus.parentChromosomeFloat32Array.buffer,
        this.versus.offspringChromosomeFloat32Array.buffer
      ];

      // 3.1 Before creating neural networks, the neural web workers should
      //     be ready.
      //
      // Note: This is why .versus_loader is impossible to complete
      //       before .workerProxies_init_promise complete inside
      //       .init_asyncGenerator().
      let workerProxies_initOk = await this.workerProxies_init_promise;
      if ( !workerProxies_initOk )
        throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
          + `Failed to initialize NeuralWorker.Proxies. `
          + `workerProxies={ ${this.workerProxies} }`
        );

      progressToAdvance.value_advance();
      yield progressRoot;

      // 3.2 Create neural networks.

      let bLogDryRunTime;
      {
        // If log message is required, observe dry-run performance and weight count.
        if ( this.bLogFetcherEventToConsole )
          bLogDryRunTime = true;

        // In real-run, no need to observe dry-run performance and weight count.
        else
          bLogDryRunTime = false;
      }

      let neuralNet_create_promise
        = NeuralOrchestra_Base.workerProxies_NeuralNetArray_create_async.call(
            this, weightArrayBufferArray, bLogDryRunTime );

      neuralNet_createOk = await neuralNet_create_promise;
      if ( !neuralNet_createOk )
        throw Error( `NeuralOrchestra.Base.versus_load_asyncGenerator(): `
          + `Failed to create neural networks. `
          + `workerProxies={ ${this.workerProxies} }`
        );

    } finally {
      // 4. So that this async generator could be executed again.
      this.versus_load_asyncGenerator_running = false;
    }

    // 5. Advance progress to 100% only if neural networks created successfully
    //    and .versus_load_asyncGenerator_running has been set to false (so
    //    that caller can re-execute this generator immediately when progress
    //    become 100%).
    if ( neuralNet_createOk ) {
      this.versus_loadOk = true;

      progressToAdvance.value_advance();
      yield progressRoot;

    } else {
      this.versus_loadOk = false;
    }

    return this.versus_loadOk;
  }


  /**
   * Create differential evolution versus result reporter.
   * @param {NeuralOrchestra_Base} this
   */
  static versusResultSender_create( sender_clientId ) {
    NeuralOrchestra_Base.versusResultSender_dispose.call( this );
    this.versusResultSender = DEvolution.VersusResultSender
      .MultiEventName.Pool.get_or_create_by( sender_clientId );
  }

  /**
   * Submit the result of the last differential evolution versus to server.
   *
   *
   * Note: The resolved .workerProxies_ImageData_process_async() is an
   *       Float32Array[].
   *
   *   - Which one is parent (chromosome) neural network's output?
   *     - Float32Array[ 0 ]
   *
   *   - Which one is offspring (chromosome) neural network's output?
   *     - Float32Array[ 1 ]
   *
   *
   * @param {number} nNegativeZeroPositive
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   */
  versusResultSender_send( nNegativeZeroPositive ) {

    // Prevent from .versusResultSender not existed.
    if ( !this.initOk )
      throw Error( `NeuralOrchestra.Base.versusResultSender_send(): `
        + `should be executed only if `
        + `this.initOk ( ${this.initOk} ) is true.` );

    // Prevent from .versus not existed.
    if ( !this.versus_loadOk )
      throw Error( `NeuralOrchestra.Base.versusResultSender_send(): `
        + `should be executed only if `
        + `this.versus_loadOk ( ${this.versus_loadOk} ) is true.` );

    this.versusResultSender.post_by_versusId_NegativeZeroPositive(
      this.versus.versusId, nNegativeZeroPositive );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   */
  static versusResultSender_dispose() {
    if ( this.versusResultSender ) {
      this.versusResultSender.disposeResources_and_recycleToPool();
      this.versusResultSender = null;
    }
  }
 
}
