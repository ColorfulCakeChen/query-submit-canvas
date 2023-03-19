export { NeuralOrchestra_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as HttpRequest from "../../util/HttpRequest.js";
import * as PartTime from "../../util/PartTime.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import * as NeuralWorker from "../NeuralWorker.js";
import * as DEvolution from "../DEvolution.js";

//!!! ...unfinished... (2023/03/18)
// Perhaps, .initer, .init_promise also not be recorded in this.
// (but .versus_load_promise seems necessary)

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
 * 1.1.1 Initialize (and also load one versus)
 *
 *   - call and await .init_promise_create().
 *   - After it resolved to true, go to 1.1.3
 *
 *
 * 1.1.2 Load another versus
 *
 *   - call .versus_load_promise_create()
 *   - go to 1.1.3
 *
 *
 * 1.1.3 Wait for versus loaded and neural networks created
 *
 *   - await .versus_load_promise, or
 *   - check .versus_loadOk asynchronously until become true, or
 *   - check .versus_load_progress.valuePercentage asynchronously until become 100.
 *   - go to 1.3
 *
 *
 * 1.2 With yourself progressParent
 *
 *
 * 1.2.1 Initialize (and also load one versus)
 *
 *   - call .initer_create() with yourself progressParent.
 *   - await .next() until { done: true, value: versus_loader }, go to 1.2.3
 *
 *
 * 1.2.2 Load another versus
 *
 *   - call .versus_loader_create() with yourself progressParent.
 *   - go to 1.2.3
 *
 *
 * 1.2.3 Wait for versus loaded and neural networks created
 *
 *   - await versus_loader.next() until { done: true, value: true }, or
 *   - check .versus_loadOk asynchronously until become true.
 *   - (.versus_load_progress is not used in this case.)
 *   - go to 1.3
 *
 *
 * 1.3 Process image, and report versus result
 *
 *   - call and await .imageData_process_promise_create()
 *   - call versusResultSender_send()
 *   - go to 1.1.2 or 1.2.2 (Load another versus)
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

// !!! (2023/03/18 Remarked) seems not necessary.
//  * @member {boolean} init_asyncGenerator_running_or_initOk
//  *   If true, it means either during initializing or after being initialized
//  * successfully.

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
 * false if wanting to call .init_promise_create() again.
 *
 * @member {boolean} init_asyncGenerator_running
 *   If true, a .init_asyncGenerator() is still executing. Please wait it
 * becoming false if wanting to call .initer_create() again.
 *

//!!! ...unfinished... (2023/03/18)
// Perhaps, .initer, .init_promise, .versus_load_promise also not
// be recorded in this.

 * @member {Promise( boolean )} init_promise
 *   The result of .init_promise_create().
 *
 * @member {AsyncGenerator} initer
 *   The result of .initer_create(). An instance of .init_asyncGenerator().
 *
 * @member {boolean} initOk
 *   If true, a .init_async() or .init_asyncGenerator() has been executed
 * and succeeded.
 *
 *
 * @member {boolean} workerProxies_init_async_running
 *   If true, a .workerProxies_init_async() is still executing. Please wait
 * it becoming false if wanting to call .workerProxies_init_promise_create()
 * again.
 *
 * @member {Promise( boolean )} workerProxies_init_promise
 *   The result of .workerProxies_init_promise_create().
 *
 * @member {boolean} workerProxies_initOk
 *   If true, a .workerProxies_init_async() has been executed and succeeded.
 *
 *
 * @member {boolean} imageData_process_async_running
 *   If true, a .imageData_process_async() is still executing.
 * Please wait it becoming false if wanting to call
 * .imageData_process_promise_create() again.
 *
 * @member {Promise( Float32Array[] )} imageData_process_promise
 *   The result of .imageData_process_promise_create().
 *
 *
 * @member {boolean} versus_load_async_running
 *   If true, a .versus_load_async() is still executing. Please wait it becoming
 * false if wanting to call .versus_load_promise_create() again.
 *
 * @member {boolean} versus_load_asyncGenerator_running
 *   If true, a .versus_load_asyncGenerator() is still executing. Please wait
 * it becoming false if wanting to call .versus_loader_create() again.
 *

//!!! ...unfinished... (2023/03/18)
// Perhaps, .initer, .init_promise, .versus_load_promise also not
// be recorded in this.
//
// It seems that .versus_load_promise must be kept because .init_async()
// can not returning a not-awaited promise.


 * @member {Promise( boolean )} versus_load_promise
 *   The result of .versus_load_promise_create().
 *
 * @member {AsyncGenerator} versus_loader
 *   The result of .versus_loader_create(). An instance of
 * .versus_load_asyncGenerator().


 * @member {ValueMax.Percentage.Aggregate} versus_load_progress
 *   The progress of loading versus summary, loading versus, creating neural
 * networks. If ( .versus_load_progress.valuePercentage == 100 ), all the
 * loading and creating has done.
 *   - It is used only if .init_async() is called.
 *   - If .init_asyncGenerator() is called directly, its progressParent
 *       parameter will be used instead.
 *
 * @member {boolean} versus_loadOk
 *   If true, a .versus_load_async() or .versus_load_asyncGenerator() has been
 * executed and succeeded.
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

    { // Checking pre-condition.
      const funcNameInMessage = "disposeResources";

      NeuralOrchestra_Base.throw_if_initializing.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, funcNameInMessage );
    }

    NeuralOrchestra_Base.versusResultSender_dispose.call( this );

    NeuralOrchestra_Base.versus_load_progress_dispose.call( this );
    this.versus_load_promise = undefined;
//!!! (2023/03/18 Remarked) No longer record in .versus_loader directly.
//    this.versus_loader = undefined;
    this.versus_loadOk = undefined;
    this.versus_load_asyncGenerator_running = undefined;
    this.versus_load_async_running = undefined;
    NeuralOrchestra_Base.versus_dispose.call( this );
    NeuralOrchestra_Base.versusSummary_dispose.call( this );

    this.imageData_process_promise = undefined;
    this.imageData_process_async_running = undefined;

    this.workerProxies_init_promise = undefined;
    this.workerProxies_initOk = undefined;
    this.workerProxies_init_async_running = undefined;
    NeuralOrchestra_Base.neuralNetParamsBase_dispose.call( this );
    NeuralOrchestra_Base.workerProxies_dispose.call( this );

    this.init_promise = undefined;
    this.initer = undefined;
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
   * Call .init_async() and record the returned promise in .init_promise.
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @return {Promise( boolean )}
   *   Return this.init_promise which is an instance of .init_async().
   */
  init_promise_create(
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,
    input_height, input_width,
    vocabularyChannelCount, blockCountTotalRequested, output_channelCount,
    delayMilliseconds ) {

    { // Checking pre-condition.
      const funcNameInMessage = "init_promise_create";

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.init_async_running, funcNameInMessage );

      // If .init_asyncGenerator() running, throw, too.
      NeuralOrchestra_Base.throw_if_initializing.call( this, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, funcNameInMessage );
    }

    this.init_async_running = true;
    this.initOk = undefined;

    this.init_promise = NeuralOrchestra_Base.init_async.call( this,
      downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
      sender_clientId,
      input_height, input_width,
      vocabularyChannelCount, blockCountTotalRequested, output_channelCount,
      delayMilliseconds
    );
    return this.init_promise;
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
   * @param {number} delayMilliseconds
   *   Mainly used when testing. If positive, this async method will complete
   * at least after so many milliseconds. Otherwise (negative or zero or
   * undefined), no extra delay.
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
  static async init_async(
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,
    input_height, input_width,
    vocabularyChannelCount, blockCountTotalRequested, output_channelCount,
    delayMilliseconds ) {

    const funcNameInMessage = "init_async";
    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.init_async_running, funcNameInMessage, "init_promise_create" );

      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, "init_async" );
    }

    try {
      // 1. Use internal independent progress.
      NeuralOrchestra_Base.versus_load_progress_create.call( this );

      // 2. Start to load (versus summary and) versus, initialize
      //    NeuralWorker.Proxies, and create neural networks.
      let initer = NeuralOrchestra_Base
        .initer_create_without_checking_precondition.call( this,
          this.versus_load_progress,
          downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
          sender_clientId,
          input_height, input_width,
          vocabularyChannelCount, blockCountTotalRequested, output_channelCount,
          delayMilliseconds
        );

      let initerNext;
      do {

//!!! ...unfinished... (2023/03/18) Is it possible not to record in this.initer?
        if ( initer !== this.initer )
          throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
            + `this.initer should not be changed.` );

        initerNext = await initer.next();
      } while ( !initerNext.done );

      // (Note: The .initOk will also be set.)
      let versus_loader = initerNext.value;

      if ( ( versus_loader != undefined ) != this.initOk )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `( versus_loader ( ${versus_loader} ) != undefined ) `
          + `should be the same as `
          + `this.initOk ( ${this.initOk} ).`
        );

      if ( !versus_loader )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `versus_loader ( ${versus_loader} ) `
          + `should not be undefined.`
        );

      // 3. Continue to load (versus summary and) versus and create neural
      //    networks.
      //
      // Note: It is not be awaited here. Caller is responsible for awaiting
      //       .versus_load_promise
      NeuralOrchestra_Base
        .versus_load_promise_create_without_checking_precondition.call( this,
          versus_loader, delayMilliseconds );

      return this.initOk;

    } catch ( e ) {
      debugger;
      // Note: Here should not modify .initOk because .init_asyncGenerator()
      //       will do.
      throw e;

    } finally {
      // 4. So that this async method could be executed again.
      this.init_async_running = false;
    }
  }


  /**
   * Create .initer (an instance of .init_asyncGenerator()).
   *
   *
   * @return {AsyncGenerator}
   *   Return this.initer which is an instance of .init_asyncGenerator().
   */
  initer_create(
    progressParent,
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,
    input_height, input_width,
    vocabularyChannelCount, blockCountTotalRequested, output_channelCount,
    delayMilliseconds ) {

    { // Checking pre-condition.
      const funcNameInMessage = "initer_create";

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.init_asyncGenerator_running, funcNameInMessage );

      // If .init_async() running, throw, too.
      NeuralOrchestra_Base.throw_if_initializing.call( this, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, funcNameInMessage );
    }

    return NeuralOrchestra_Base
      .initer_create_without_checking_precondition.call( this,
        progressParent, 
        downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
        sender_clientId,
        input_height, input_width,
        vocabularyChannelCount, blockCountTotalRequested, output_channelCount,
        delayMilliseconds );
  }

  /**
   * Create .initer (an instance of .init_asyncGenerator()).
   * 
   * Called by .init_async() and .initer_create(). It does not check
   * precondition.
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @return {AsyncGenerator}
   *   Return this.initer which is an instance of .init_asyncGenerator().
   */
  static initer_create_without_checking_precondition(
    progressParent,
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,
    input_height, input_width,
    vocabularyChannelCount, blockCountTotalRequested, output_channelCount,
    delayMilliseconds ) {

    this.init_asyncGenerator_running = true;
    this.initOk = undefined;

    this.initer = NeuralOrchestra_Base.init_asyncGenerator.call( this,
      progressParent, 
      downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
      sender_clientId,
      input_height, input_width,
      vocabularyChannelCount, blockCountTotalRequested, output_channelCount,
      delayMilliseconds );
    return this.initer;
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
   * Note2: After this async generator done, continue to versus_loader.next()
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
   * @param {number} delayMilliseconds
   *   Mainly used when testing. If positive, this async method will complete
   * at least after so many milliseconds. Otherwise (negative or zero or
   * undefined), no extra delay.
   *
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( AsyncGenerator )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: versus_loader }, if succeeded.
   *     - The this.initOk will be true.
   *     - The neural workers have been created and GPU shaders have been
   *         compiled.
   *     - But the versus summary and versus may still be loading (i.e. not
   *         yet complete).
   *       - The neural networks may also still not be created (since they
   *           need the versus data).
   *       - Please asynchronously check the returned value (versus_loader
   *           which is an instance of .versus_load_asyncGenerator()) or
   *           .versus_loadOk to determine whether completed.
   *
   *   - Resolved to { done: true, value: undefined }, if failed.
   *     - The this.initOk will be false.
   */
  static async* init_asyncGenerator(
    progressParent,
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,
    input_height, input_width,
    vocabularyChannelCount, blockCountTotalRequested, output_channelCount,
    delayMilliseconds
  ) {

    const funcNameInMessage = "init_asyncGenerator";
    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.init_asyncGenerator_running, funcNameInMessage, "initer_create" );

      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, funcNameInMessage );
    }

    try {
      // 0.

      // 0.1
      this.downloader_spreadsheetId = downloader_spreadsheetId;
      this.downloader_apiKey = downloader_apiKey;
      this.bLogFetcherEventToConsole = bLogFetcherEventToConsole;

      // 0.2
      // Note: Here should not call .versus_load_progress_dispose().
      NeuralOrchestra_Base.versus_dispose.call( this );
      NeuralOrchestra_Base.versusSummary_dispose.call( this );

      // 0.3
      let progressRoot = progressParent.root_get();
      let allPromiseSet = new Set();

      // 0.4
      let sleepPromise;
      if ( delayMilliseconds > 0 )
        sleepPromise = PartTime.sleep( delayMilliseconds );

      // 1. Load (versus summary and) versus. Create neural networks.

//!!! ...unfinished... (2023/03/18)
// Is it possible not to record in this.versus_loader?
// Just return versus_loader as this init_asuncGenerator returned value.
// In order to prevent outside caller misuse it.

      let versus_loader = NeuralOrchestra_Base
        .versus_loader_create_without_checking_precondition.call( this,
          progressParent, delayMilliseconds );

      let loaderNext = versus_loader.next();
      allPromiseSet.add( loaderNext );

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
        // If versus_loader.next() resolved, got an { done, value } object.
        // If .workerProxies_init_promise resolved, got a boolean value.
        let allPromise = Promise.race( allPromiseSet );
        let object_or_boolean = await allPromise;

        // 3.2 versus_loader.next() resolved.
        if ( object_or_boolean instanceof Object ) {

          let object = object_or_boolean;
          if ( object.done ) {

            // (Note: The .versus_loadOk will also be set.)
            let versus_loadOk = object.value;
            if ( versus_loadOk != this.versus_loadOk )
              throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
                + `versus_loadOk ( ${versus_loadOk} ) `
                + `should be the same as `
                + `this.versus_loadOk ( ${this.versus_loadOk} ).`
              );

            // 3.2.1
            // In theory, it should not execute to here because
            // versus_loader waits .workerProxies_init_promise internally.
            throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
              + `versus_loader `
              + `should not be done before `
              + `.workerProxies_init_promise`
            );

          // 3.2.2 DEvolution.Versus has been loaded a little. Report progress
          //       and schedule to wait it to load next a little.
          } else {
            // let progressRoot = object.value;
            yield progressRoot;

//!!! (2023/03/18 Remarked) No longer record in .versus_loader directly.
//             if ( versus_loader !== this.versus_loader )
//               throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
//                 + `this.versus_loader should not be changed.` );

            allPromiseSet.delete( loaderNext );
            loaderNext = versus_loader.next();
            allPromiseSet.add( loaderNext );
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

      // 3.4 The (unresolved) loaderNext should continue to be awaited. 
      //
      // Otherwise, the versus_loader.next() will be called one more time
      // by outside caller (including .init_async()).
      let versus_loader_prepended;
      {

//!!! (2023/03/18 Remarked) No longer record in .versus_loader directly.
//         if ( versus_loader !== this.versus_loader )
//           throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
//             + `this.versus_loader should not be changed.` );

        // Replace .versus_loader by a new asyn generator which will yield
        // the loaderNext first. Just like push the loaderNext back to the
        // original .versus_loader.

//!!! (2023/03/18 Remarked) No longer record in .versus_loader directly.
//        this.versus_loader = PartTime.prepend_asyncGenerator(
        versus_loader_prepended = PartTime.prepend_asyncGenerator(
          loaderNext, versus_loader );
      }

      // 4. Create Versus Result Reporter
      NeuralOrchestra_Base.versusResultSender_create.call( this, sender_clientId );

      // 5.
      this.initOk = true;

      // 6.
      if ( sleepPromise )
        await sleepPromise;

      return versus_loader_prepended;

    } catch ( e ) {
      debugger;
      this.initOk = false;
      throw e;

    } finally {
      // 7. So that this async generator could be executed again.
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
   *   Return this.workerProxies_init_promise which is an instance of
   * .workerProxies_init_async().
   */
  static workerProxies_init_promise_create() {

    { // Checking pre-condition.
      const funcNameInMessage = "workerProxies_init_promise_create";

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.workerProxies_init_async_running, funcNameInMessage );
    }

    this.workerProxies_init_async_running = true;
    this.workerProxies_initOk = undefined;

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
   *     - The neural workers have been created and GPU shaders have been
   *         compiled.
   *   - Resolved to false, if failed.
   */
  static async workerProxies_init_async() {

    { // Checking pre-condition.
      const funcNameInMessage = "workerProxies_init_async";

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.workerProxies_init_async_running, funcNameInMessage,
        "workerProxies_init_promise_create" );

      NeuralOrchestra_Base.throw_if_imageData_processing.call( this,
        funcNameInMessage );
    }

    let initOk;
    try {
      // 0.
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

    } catch ( e ) {
      debugger;
      this.workerProxies_initOk = false;
      throw e;

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

    { // Checking pre-condition.
      const funcNameInMessage = "workerProxies_compileShaders_async";

      NeuralOrchestra_Base.throw_if_imageData_processing.call( this,
        funcNameInMessage );
    }

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

    { // Checking pre-condition.
      const funcNameInMessage = "workerProxies_NeuralNetArray_create_async";

      NeuralOrchestra_Base.throw_if_imageData_processing.call( this,
        funcNameInMessage );
    }

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

    let neuralNet_createOk = await neuralNet_create_promise;
    return neuralNet_createOk;
  }


  /**
   * Call .imageData_process_async() and record the returned
   * promise in .imageData_process_promise.
   *
   * @return {Promise( Float32Array[] )}
   *   Return this.imageData_process_promise which is an instance
   * of .imageData_process_async().
   */
  imageData_process_promise_create(
    sourceImageData, delayMilliseconds ) {

    { // Checking pre-condition.
      const funcNameInMessage = "imageData_process_promise_create";

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.imageData_process_async_running, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_initializing.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_workerProxies_initializing.call( this,
        funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_versus_loadOk.call( this, funcNameInMessage );
    }

    this.imageData_process_async_running = true;
    this.imageData_process_promise
      = NeuralOrchestra_Base.imageData_process_async.call( this,
          sourceImageData, delayMilliseconds );
    return this.imageData_process_promise;
  }

  /**
   *
   * @param {ImageData} sourceImageData
   *   The input image datat which will be processed by neural workers.
   *
   * @param {number} delayMilliseconds
   *   Mainly used when testing. If positive, this async method will complete
   * at least after so many milliseconds. Otherwise (negative or zero or
   * undefined), no extra delay.
   *
   * @return {Promise( Float32Array[] )}
   *   Return a promise resolved to an array [ Float32Array, Float32Array ]
   * representing the (pair) neural networks' results.
   *   - Float32Array[ 0 ] is parent (chromosome) neural network's output.
   *   - Float32Array[ 1 ] is offspring (chromosome) neural network's output.
   */
  static async imageData_process_async(
    sourceImageData, delayMilliseconds ) {

    { // Checking pre-condition.
      const funcNameInMessage = "imageData_process_async";

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.imageData_process_async_running, funcNameInMessage,
        "imageData_process_promise_create" );

      NeuralOrchestra_Base.throw_if_initializing.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_workerProxies_initializing.call( this,
        funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_versus_loadOk.call( this, funcNameInMessage );
    }

    try {
      // 0.
      let sleepPromise;
      if ( delayMilliseconds > 0 )
        sleepPromise = PartTime.sleep( delayMilliseconds );

      // 1.
      let theFloat32ArrayArrayPromise
        = this.workerProxies.ImageData_process_async( sourceImageData );

      let theFloat32ArrayArray = await theFloat32ArrayArrayPromise;

      // 2.
      if ( sleepPromise )
        await sleepPromise;

      return theFloat32ArrayArray;

    } finally {
      // 3. So that this async method could be executed again.
      this.imageData_process_async_running = false;
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
   * @param {number} delayMilliseconds
   *   Mainly used when testing. If positive, this async method will complete
   * at least after so many milliseconds. Otherwise (negative or zero or
   * undefined), no extra delay.
   *
   * @return {Promise( boolean )}
   *   Return the newly created this.versus_load_promise which is an instance
   * of .versus_load_async().
   */
  versus_load_promise_create( delayMilliseconds ) {

    const funcNameInMessage = "versus_load_promise_create";
    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.versus_load_async_running, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_initializing.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base.throw_if_imageData_processing.call( this,
        funcNameInMessage );
    }

    // 1.
    let versus_loader;
    {
      // Use internal independent progress.
      NeuralOrchestra_Base.versus_load_progress_create.call( this );

      // Prepare versus_loader
      versus_loader = NeuralOrchestra_Base
        .versus_loader_create_without_checking_precondition.call( this,
          this.versus_load_progress, delayMilliseconds );

      // Note: Here needs not set .versus_loadOk to undefined because
      //       .versus_loader_create_without_checking_precondition() has
      //       done it.
    }

    // 2.
    return NeuralOrchestra_Base
      .versus_load_promise_create_without_checking_precondition.call( this,
        versus_loader, delayMilliseconds );
  }

  /**
   * Create .versus_load_promise (an instance of .versus_load_async()).
   *
   * Called by .init_async() and .versus_load_promise_create(). It does not
   * check precondition.
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @param {AsyncGenerator} versus_loader
   *   The async generator (an instance of .versus_load_asyncGenerator()) to
   * be wrapped by the created promise.
   *
   * @return {Promise( boolean )}
   *   Return the newly created this.versus_load_promise which is an instance
   * of .versus_load_async().
   */
  static versus_load_promise_create_without_checking_precondition(
    versus_loader, delayMilliseconds ) {

    this.versus_load_async_running = true;
    this.versus_load_promise = NeuralOrchestra_Base.versus_load_async.call(
      this, versus_loader, delayMilliseconds );
    return this.versus_load_promise;
  }

  /**
   * Call versus_loader.next() until done.
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @param {AsyncGenerator} versus_loader
   *   The async generator (an instance of .versus_load_asyncGenerator()) to
   * be wrapped by the created promise. It will be .next() until done by this
   * async method.
   *
   * @param {number} delayMilliseconds
   *   Mainly used when testing. If positive, this async method will complete
   * at least after so many milliseconds. Otherwise (negative or zero or
   * undefined), no extra delay.
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *     - Versus summary and versus are loaded. Neural networks are created.
   *   - Resolved to false, if failed.
   *   - When settled, the .versus_load_progress has been stopped.
   */
  static async versus_load_async( versus_loader, delayMilliseconds ) {

    const funcNameInMessage = "versus_load_async";
    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.versus_load_async_running, funcNameInMessage,
        "versus_load_promise_create" );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base.throw_if_imageData_processing.call( this,
        funcNameInMessage );
    }

    try {
      // 0.
      let sleepPromise;
      if ( delayMilliseconds > 0 )
        sleepPromise = PartTime.sleep( delayMilliseconds );

      // 1.
      if ( !versus_loader )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `versus_loader should have already existed.` );

      let loaderNext;
      do {
        loaderNext = await versus_loader.next();
      } while ( !loaderNext.done );

      // The result should be either true or false. If result is undefined,
      // the generator may have been terminated previously by throwing
      // exception. So, continue to throw exception to inform caller the
      // generator is illegal.
      if ( loaderNext.value === undefined )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `versus_loader is illegal `
          + `(e.g. has been terminated previously by throwing exception).` );

      let loadOk = loaderNext.value;
      if ( loadOk != this.versus_loadOk )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `loadOk ( ${loadOk} ) `
          + `should be the same as `
          + `this.versus_loadOk ( ${this.versus_loadOk} ).`
        );

      // 2.
      if ( sleepPromise )
        await sleepPromise;

      return loadOk;

    } catch ( e ) {
      debugger;
      // Note: Here should not modify .versus_loadOk because
      //       .versus_load_asyncGenerator() will do.
      throw e;

    } finally {
      // 3. So that this async method could be executed again.
      this.versus_load_async_running = false;
    }
  }


  /**
   * Create versus_loader (an instance of .versus_load_asyncGenerator()).
   *
   * When wanting to load the next versus with yourself progressParent, call
   * this method and call .next() until { done: true }.
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent. The
   * created progressToAdvance will be increased when every time advanced. The
   * progressParent.root_get() will be returned when every time yield.
   *
   * @param {number} delayMilliseconds
   *   Mainly used when testing. If positive, this async method will complete
   * at least after so many milliseconds. Otherwise (negative or zero or
   * undefined), no extra delay.
   *
   * @return {AsyncGenerator}
   *   Return the newly created versus_loader which is an instance of
   * .versus_load_asyncGenerator().
   */
  versus_loader_create( progressParent, delayMilliseconds ) {

    { // Checking pre-condition.
      const funcNameInMessage = "versus_loader_create";

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.versus_load_asyncGenerator_running, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_initializing.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base.throw_if_imageData_processing.call( this,
        funcNameInMessage );
    }

    let versus_loader = NeuralOrchestra_Base
      .versus_loader_create_without_checking_precondition.call( this,
        progressParent, delayMilliseconds );
    return versus_loader;
  }

  /**
   * Create an instance of .versus_load_asyncGenerator().
   * 
   * Called by .init_asyncGenerator(), .versus_load_async() and
   * .versus_loader_create().
   *
   * It does not check precondition. It does not record in .versus_loader
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @return {AsyncGenerator}
   *   Return the newly created versus_loader which is an instance of
   * .versus_load_asyncGenerator().
   */
  static versus_loader_create_without_checking_precondition(
    progressParent, delayMilliseconds ) {

    this.versus_load_asyncGenerator_running = true;
    this.versus_loadOk = undefined;

    let versus_loader = NeuralOrchestra_Base.versus_load_asyncGenerator.call(
      this, progressParent, delayMilliseconds );
    return versus_loader;
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
   * @param {number} delayMilliseconds
   *   Mainly used when testing. If positive, this async method will complete
   * at least after so many milliseconds. Otherwise (negative or zero or
   * undefined), no extra delay.
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
  static async* versus_load_asyncGenerator( progressParent, delayMilliseconds ) {

    const funcNameInMessage = "versus_load_asyncGenerator";

    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.versus_load_asyncGenerator_running, funcNameInMessage,
        "versus_loader_create" );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base.throw_if_imageData_processing.call( this,
        funcNameInMessage );
    }

    let progressRoot;
    let progressToAdvance;
    let neuralNet_createOk;
    try {
      // 0.

      // 0.1 Determine whether necessary to load versus summary.
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

      // 0.2 Prepare progress.
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

      // 0.3
      let sleepPromise;
      if ( delayMilliseconds > 0 )
        sleepPromise = PartTime.sleep( delayMilliseconds );

      // 1. Load versus summary.
      if ( versusSummary_needLoad ) {
        let versusSummary_loadOk
          = yield *this.versusSummary.rangeArray_load_asyncGenerator(
              progressVersusSummary, this.params_loading_retryWaiting );

        if ( !versusSummary_loadOk )
          throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
            + `Failed to load DEvolution.VersusSummary.rangeArray.`
          );
      }

      // 2. Load versus.
      NeuralOrchestra_Base.versus_dispose.call( this );
      this.versus = yield* this.versusSummary.versus_next_load_asyncGenerator(
        progressVersus, this.params_loading_retryWaiting );

      if ( !this.versus )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
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
      // Note: This is why versus_loader is impossible to complete
      //       before .workerProxies_init_promise complete inside
      //       .init_asyncGenerator().
      let workerProxies_initOk = await this.workerProxies_init_promise;
      if ( !workerProxies_initOk )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
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
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `Failed to create neural networks. `
          + `workerProxies={ ${this.workerProxies} }`
        );

      // 4.
      if ( sleepPromise )
        await sleepPromise;

    } catch ( e ) {
      debugger;
      this.versus_loadOk = false;
      throw e;

    } finally {
      // 5. So that this async generator could be executed again.
      this.versus_load_asyncGenerator_running = false;
    }

    // 6. Advance progress to 100% only if neural networks created successfully
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
   * Note1: The resolved .imageData_process_async() is an
   *       Float32Array[].
   *
   *   - Which one is parent (chromosome) neural network's output?
   *     - Float32Array[ 0 ]
   *
   *   - Which one is offspring (chromosome) neural network's output?
   *     - Float32Array[ 1 ]
   *
   *
   * Note2: If failed (e.g. Internet disconnected), the result may not be sent
   *        but caller of this method will not know that and will not be
   *        affected because the exception is thrown asynchronously.
   *
   *
   * @param {number} nNegativeZeroPositive
   *   The lose/draw/win value of the versus. (-1 or 0 or +1)
   *     - -1 (if parent lose offspring)
   *     -  0 (if parent draw offspring)
   *     - +1 (if parent win offspring)
   */
  versusResultSender_send( nNegativeZeroPositive ) {

    { // Checking pre-condition.
      const funcNameInMessage = "versusResultSender_send";

      // Prevent from .versusResultSender not existed.
      NeuralOrchestra_Base.throw_if_initializing.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );

      // Prevent from .versus not existed.
      NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_versus_loadOk.call( this, funcNameInMessage );
    }

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


  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_initializing( funcNameInMessage ) {
    if (   ( this.init_async_running )
        || ( this.init_asyncGenerator_running ) )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should not be executed during initializing.` );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_not_initOk( funcNameInMessage ) {
    if ( !this.initOk )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should be executed only if `
        + `this.initOk ( ${this.initOk} ) is true.` );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_workerProxies_initializing( funcNameInMessage ) {
    if ( this.workerProxies_init_async_running )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still initializing.` );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_imageData_processing( funcNameInMessage ) {
    if ( this.imageData_process_async_running )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still processing image.` );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_workerProxies_busy( funcNameInMessage ) {
    NeuralOrchestra_Base.throw_if_workerProxies_initializing.call( this,
      funcNameInMessage );
    NeuralOrchestra_Base.throw_if_imageData_processing.call( this,
      funcNameInMessage );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_versus_loading( funcNameInMessage ) {
    if (   ( this.versus_load_async_running )
        || ( this.versus_load_asyncGenerator_running ) )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should not be executed while `
        + `DEvolution.VersusSummary or DEvolution.Versus is still loading.` );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_not_versus_loadOk( funcNameInMessage ) {
    if ( !this.versus_loadOk )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should be executed only if `
        + `this.versus_loadOk ( ${this.versus_loadOk} ) is true.` );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_workerProxies_busy_or_versus_loading( funcNameInMessage ) {
    NeuralOrchestra_Base.throw_if_workerProxies_busy.call( this, funcNameInMessage );
    NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {boolean} b_still_running    If true, throw exception.
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_an_old_still_running( b_still_running, funcNameInMessage ) {
    if ( b_still_running )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `An old .${funcNameInMessage}() is still running.` );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {boolean} b                  If false, throw exception.
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   * @param {string} funcNameShouldBeCalledInMessage
   *   The function name which should be called instead. (e.g. init_promise_create)
   */
  static throw_call_another_if_false(
    b, funcNameInMessage, funcNameShouldBeCalledInMessage ) {

    if ( !b )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `Please call .${funcNameShouldBeCalledInMessage}() instead.` );
  }
 
}
