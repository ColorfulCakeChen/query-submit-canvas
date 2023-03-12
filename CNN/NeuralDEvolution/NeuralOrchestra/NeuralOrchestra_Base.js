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
 *   The neural network configuration. It will be used for both two neural networks.
 * It will be kept (i.e. owned and destroyed) by this NeuralOrchetra object.
 *
 * @member {DEvolution.VersusSummary} versusSummary
 *   The downloaded versus summary of the differential evolution.
 *
 * @member {DEvolution.Versus} versus
 *   The downloaded current versus of the differential evolution.
 *
 *
 * @member {boolean} init_async_running
 *   If true, a .init_async() is still executing. Please wait it becoming to
 * false if wanting to call again.
 *
 * @member {boolean} init_asyncGenerator_running
 *   If true, a .init_asyncGenerator() is still executing. Please wait it
 * becoming to false if wanting to call again.
 *
 * @member {boolean} initOk
 *   If true, a .init_async() has been executed and succeeded.
 *
 *
 * @member {boolean} workerProxies_init_async_running
 *   If true, a .workerProxies_init_async() is still executing. Please wait
 * it becoming to false if wanting to call again.
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
 * @member {boolean} versus_load_async_running
 *   If true, a .versus_load_async() is still executing. Please wait it becoming
 * to false if wanting to call again.
 *
 * @member {boolean} versus_load_asyncGenerator_running
 *   If true, a .versus_load_asyncGenerator() is still executing. Please wait
 * it becoming to false if wanting to call again.
 *
 * @member {Promise( boolean )} versus_load_promise
 *   The promise of whether .versus_load_progress still be advancing.
 *   - If settled, the .versus_load_progress has been stopped.
 *   - If resolved to true, it means versus summary loaded, versus loaded, and
 *       neural networks created.
 *
 * @member {AsyncGenerator} versus_loader_async
 *   A .versus_load_asyncGenerator() instance.
 *
 * @member {ValueMax.Percentage.Aggregate} versus_load_progress
 *   The progress of loading versus summary, loading versus, creating neural
 * networks. If ( .versus_load_progress.valuePercentage == 100 ), all the
 * loading and creating has done.
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
    this.params_loading_retryWaiting_create();
  }

  /** @override */
  disposeResources() {
    this.versusResultSender_dispose();

    this.versus_load_progress_dispose();
    this.versus_load_promise = undefined;
    this.versus_loader_async = undefined;
    this.versus_loadOk = undefined;
    this.versus_load_asyncGenerator_running = undefined;
    this.versus_load_async_running = undefined;
    this.versus_dispose();
    this.versusSummary_dispose();

    this.workerProxies_init_promise = undefined;
    this.workerProxies_initOk = undefined;
    this.workerProxies_init_async_running = undefined;
    this.neuralNetParamsBase_dispose();
    this.workerProxies_dispose();

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

    this.neuralNetParamsBase_dispose();

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

  /** */
  neuralNetParamsBase_dispose() {
    if ( this.neuralNetParamsBase ) {
      this.neuralNetParamsBase.disposeResources_and_recycleToPool();
      this.neuralNetParamsBase = null;
    }
  }


  /** */
  versus_load_progress_create() {
    this.versus_load_progress_dispose();
    this.versus_load_progress
      = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
  }

  /** */
  versus_load_progress_dispose() {
    if ( this.versus_load_progress ) {
      this.versus_load_progress.disposeResources_and_recycleToPool();
      this.versus_load_progress = null;
    }
  }


  /**
   * Call .init_asyncGenerator() and .versus_load_promise_create() internally.
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
      this.init_async_running = true;

      // 1. Use internal independent progress.
      this.versus_load_progress_create();

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
   *         (since they need the versus data). Please check .versus_loader_async
   *         or .versus_load_progress or .versus_loadOk to determine whether
   *         complete.
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

    try {
      this.init_asyncGenerator_running = true;

      this.initOk = false;

      // 0.
      this.downloader_spreadsheetId = downloader_spreadsheetId;
      this.downloader_apiKey = downloader_apiKey;
      this.bLogFetcherEventToConsole = bLogFetcherEventToConsole;

      this.versus_load_progress_dispose();
      this.versus_dispose();
      this.versusSummary_dispose();

      let progressRoot = progressParent.root_get();
      let allPromiseSet = new Set();

      // 1. Load (versus summary and) versus. Create neural networks.
      this.versus_loader_async_create( progressParent );

      let loader_next = this.versus_loader_async.next();
      allPromiseSet.add( loader_next );

      // 2. Initialize NeuralWorker.Proxies
      {
        // It will be used by .workerProxies_init_async()
        NeuralOrchestra_Base.neuralNetParamsBase_create.call( this,
          input_height, input_width,
          vocabularyChannelCount,
          blockCountTotalRequested,
          output_channelCount );

        this.workerProxies_create();
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
        // If .versus_loader_async.next() resolved, got an { done, value } object.
        // If .workerProxies_init_promise resolved, got a boolean value.
        let allPromise = Promise.race( allPromiseSet );
        let object_or_boolean = await allPromise;

        // 3.2 .versus_loader_async.next() resolved.
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
            // .versus_loader_async waits .workerProxies_init_promise internally.
            throw Error( `NeuralOrchestra.Base.init_asyncGenerator(): `
              + `.versus_loader_async `
              + `should not be done before `
              + `.workerProxies_init_promise`
            );

          // 3.2.2 DEvolution.Versus has been loaded a little. Report progress
          //       and schedule to wait it to load next a little.
          } else {
            // let progressRoot = object.value;
            yield progressRoot;

            allPromiseSet.delete( loader_next );
            loader_next = this.versus_loader_async.next();
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
      this.versusResultSender_init( sender_clientId );

      // 5.
      this.initOk = true;
      return this.initOk;

    } finally {
      // 6. So that this async generator could be executed again.
      this.init_asyncGenerator_running = false;
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

    let initOk;
    try {
      this.workerProxies_init_async_running = true;
      this.workerProxies_initOk = false;

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
   */
  async workerProxies_ImageData_process_async( sourceImageData ) {
    let theFloat32ArrayArrayPromise
      = this.workerProxies.ImageData_process_async( sourceImageData );
    return theFloat32ArrayArrayPromise;
  }

  /** */
  workerProxies_create() {
    this.workerProxies_dispose();
    this.workerProxies = NeuralWorker.Proxies.Pool.get_or_create_by();
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
   * Call .versus_load_async() and record the returned promise in
   * .versus_load_promise.
   *
   * @param {AsyncGenerator} this.versus_loader_async
   *   - If .versus_loader_async does not exist, a new .versus_load_progress
   *       and .versus_loader_async will be created.
   *
   *   - If .versus_loader_async has already existed (i.e. not null), it will
   *       be used directly (and no extra progress object will be created too).
   *       (Usually, this case is used by init_async().)
   *
   * @return {Promise( boolean )}
   *   Return this.versus_load_promise
   */
  versus_load_promise_create() {

    if ( !this.versus_loader_async ) {
      this.versus_load_progress_create();
      this.versus_loader_async_create( this.versus_load_progress );
    }

    this.versus_load_promise
      = NeuralOrchestra_Base.versus_load_async.call( this );
    return this.versus_load_promise;
  }

  /**
   * Call .versus_loader_async.next() until done.
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @param {AsyncGenerator} this.versus_loader_async
   *   - The .versus_loader_async should have already existed (i.e. not null).
   *       It will be .next() until done by this async method.
   *   - The .versus_loader_async will be clear to null when this method done.
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

      if ( !this.versus_loader_async )
        throw Error( `NeuralOrchestra.Base.versus_load_async(): `
          + `this.versus_loader_async should have already existed.` );

      let loaderNext;
      do {
        loaderNext = await this.versus_loader_async.next();
      } while ( loaderNext.done == false );

      let bLoadOk = loaderNext.value;
      return bLoadOk;

    } catch ( e ) {
      //console.error( e );
      throw e; // Unknown error, should be said loundly.

    } finally {
      // 2. So that this async method could be executed again.
      this.versus_load_async_running = false;

      // Prevent a completed loader to be re-used.
      this.versus_loader_async = null;
    }
  }

  /**
   * Create .versus_loader_async
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   */
  versus_loader_async_create( progressParent ) {
    this.versus_loader_async
      = NeuralOrchestra_Base.versus_load_asyncGenerator.call(
          this, progressParent );
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
        this.versusSummary = DEvolution.VersusSummary.Pool.get_or_create_by(
          this.downloader_spreadsheetId, this.downloader_apiKey );

        this.versusSummary.bLogFetcherEventToConsole
          = this.bLogFetcherEventToConsole;

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


  /** Create differential evolution versus result reporter. */
  versusResultSender_init( sender_clientId ) {
    this.versusResultSender_dispose();
    this.versusResultSender = DEvolution.VersusResultSender
      .MultiEventName.Pool.get_or_create_by( sender_clientId );
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
  versusResultSender_send( nNegativeZeroPositive ) {
    this.versusResultSender.post_by_versusId_NegativeZeroPositive(
      this.versus.versusId, nNegativeZeroPositive );
  }

  /** */
  versusResultSender_dispose() {
    if ( this.versusResultSender ) {
      this.versusResultSender.disposeResources_and_recycleToPool();
      this.versusResultSender = null;
    }
  }

}
