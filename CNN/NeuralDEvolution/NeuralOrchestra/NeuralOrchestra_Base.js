export { NeuralOrchestra_Base as Base };

import * as HttpRequest from "../../util/HttpRequest.js";
import * as NonReentrant from "../../util/NonReentrant.js";
import * as PartTime from "../../util/PartTime.js";
import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as ValueMax from "../../util/ValueMax.js";
import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
import * as NeuralWorker from "../NeuralWorker.js";
import * as DEvolution from "../DEvolution.js";


//!!! ...unfinished... (2023/03/21)
// Only if ( this.initOk === undefined ), init_asyncXxx() can be called.
// Prevent from being re-initialized. So that unit testing can be accelerated.


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
 *   - call and await .init_asyncPromise_create().
 *   - After it resolved to true, go to 1.1.3
 *
 *
 * 1.1.2 Load another versus
 *
 *   - call .versus_load_asyncPromise_create()
 *   - go to 1.1.3
 *
 *
 * 1.1.3 Wait for versus loaded and neural networks created
 *
 *   - await versus_load_asyncPromise, or
 *   - check .versus_loadOk asynchronously until become true, or
 *   - check .versus_load_asyncPromise_progress.valuePercentage asynchronously
 *       until become 100.
 *   - go to 1.3
 *
 *
 * 1.2 With yourself progressParent
 *
 *
 * 1.2.1 Initialize (and also load one versus)
 *
 *   - call .init_asyncGenerator_create() with yourself progressParent.
 *   - await .next() until { done: true, value: versus_load_asyncGenerator }
 *   - go to 1.2.3
 *
 *
 * 1.2.2 Load another versus
 *
 *   - call .versus_load_asyncGenerator_create() with yourself progressParent.
 *   - go to 1.2.3
 *
 *
 * 1.2.3 Wait for versus loaded and neural networks created
 *
 *   - await versus_load_asyncGenerator.next() until { done: true, value: true }, or
 *   - check .versus_loadOk asynchronously until become true.
 *   - (.versus_load_asyncPromise_progress is not used in this case.)
 *   - go to 1.3
 *
 *
 * 1.3 Process image, and report versus result
 *
 *   - call and await .imageData_process_asyncPromise_create()
 *   - call versusResultSender_send()
 *   - go to 1.1.2 or 1.2.2 (Load another versus)
 *
 *
 * 2. Configuration for 250K filter weights and executing 2 times per second
 *
 *   - input_height = 72
 *   - input_width = 131 (= ( 128 + 3 ) )
 *   - output_channelCount_per_alignment = 64
 *   - (i.e. output_channelCount = 64 * 2 = 128)
 *
 * The extra +3 pixels of input_width are used for recurrent feedback (i.e.
 * the neural network output of the previous game tick).
 *
 * The ( output_channelCount_per_alignment = 64 ) is important.
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
 *   The Google Sheets spreadsheetId of neural network weights. The weights
 * loaded from the spreadsheet will be passed to every neural worker to
 * initialize the neural network.
 *
 * @member {string} downloader_apiKey
 *   The API key for accessing the Google Sheets spreadsheet of neural network
 * weights.
 *   - If null, Google Visualization Table Query API will be used.
 *   - If not null, Google Sheets API v4 will be used.
 *
 * @member {boolean} bLogFetcherEventToConsole
 *   If true, some debug messages of HttpRequest.Fetcher will be logged to
 * console.
 *
 *
 * @member {string} sender_clientId
 *   The client id when sending measurement protocol.
 *
 *
 * @member {number} input_height
 *   The input image's height.
 *
 * @member {number} input_width
 *   The input image's width.
 *
 * @member {number} vocabularyChannelCount
 *   In the embedding layer, every vocabulary will have how many embedding
 * channels. Every input channel will be expanded into so many embedding
 * channels. It could be viewed as embeddingChannelCountPerInputChannel.
 * It must be ( >= 2 ) because it always has ( bEmbedVocabularyId == true ).
 *
 * @member {number} blockCountTotalRequested
 *   How many blocks of the whole neural network are wanted. It will be
 * spreaded to every stage. Note that every stage will have at least 2 blocks.
 *
 * @member {number} output_channelCount_per_alignment
 *   The output tensor's channel count for one alignment of the versus. It is
 * half the output tensor's channel count.
 * 
 * @member {number} output_channelCount
 *   The output tensor's channel count. (= output_channelCount_per_alignment * 2)
 *
 *
 * @member {string} backendName
 *   Which backend (of tensorflow.js library) is used by web worker. Either
 * "cpu" or "webgl".
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
 * @member {boolean} init_asyncPromise_running
 *   If true, a .init_async() is still executing. Please wait it becoming
 * false if wanting to call .init_asyncPromise_create() again.
 *
 * @member {boolean} init_asyncGenerator_running
 *   If true, a .init_asyncGenerator() is still executing. Please wait it
 * becoming false if wanting to call .init_asyncGenerator_create() again.
 *
 * @member {boolean} initOk
 *   If true, a .init_async() or .init_asyncGenerator() has been executed
 * and succeeded.
 *
 *
 * @member {boolean} workerProxies_init_asyncPromise_running
 *   If true, a .workerProxies_init_async() is still executing. Please wait
 * it becoming false if wanting to call .workerProxies_init_async() again.
 *
 * @member {boolean} workerProxies_initOk
 *   If true, a .workerProxies_init_async() has been executed and succeeded.
 *
 *
 * @member {boolean} imageData_process_asyncPromise_running
 *   If true, a .imageData_process_asyncPromise_create() is still executing.
 * Please wait it becoming false if wanting to call
 * .imageData_process_asyncPromise_create() again.
 *
 * 
 * @member {boolean} versus_load_asyncPromise_running
 *   If true, a .versus_load_async() is still executing. Please wait it
 * becoming false if wanting to call .versus_load_asyncPromise_create() again.
 *
 * @member {boolean} versus_load_asyncGenerator_running
 *   If true, a .versus_load_asyncGenerator() is still executing. Please wait
 * it becoming false if wanting to call .versus_load_asyncGenerator_create()
 * again.
 *

//!!! (2023/03/29 Remarked) No longer record in this.versus_load_asyncPromise
//  * @member {Promise( boolean )} versus_load_asyncPromise
//  *   The result of .versus_load_asyncPromise_create().

 *
 * @member {ValueMax.Percentage.Aggregate} versus_load_asyncPromise_progress
 *   The progress of loading versus summary, loading versus, creating neural
 * networks. If ( .versus_load_asyncPromise_progress.valuePercentage == 100 ),
 * all the loading and creating has done.
 *   - It is used only if .init_async() is called.
 *   - If .init_asyncGenerator() is called directly, its progressParent
 *       parameter will be used instead.
 *
 * @member {boolean} versus_loadOk
 *   If true, a .versus_load_async() or .versus_load_asyncGenerator() has been
 * executed and succeeded.
 */
class NeuralOrchestra_Base
  extends NonReentrant.asyncPromise(
    "imageData_process", relay_imageData_process_asyncPromise,
    Recyclable.Root ) {

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

      NeuralOrchestra_Base
        .throw_if_init_asyncPromise_or_asyncGenerator_running.call( this,
          funcNameInMessage );

      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, funcNameInMessage );
    }

    NeuralOrchestra_Base.versusResultSender_dispose.call( this );

    NeuralOrchestra_Base.versus_load_asyncPromise_progress_dispose.call( this );

//!!! (2023/03/29 Remarked) No longer record in this.versus_load_asyncPromise
//    this.versus_load_asyncPromise = undefined;

    this.versus_loadOk = undefined;
    this.versus_load_asyncGenerator_running = undefined;
    this.versus_load_asyncPromise_running = undefined;
    NeuralOrchestra_Base.versus_dispose.call( this );
    NeuralOrchestra_Base.versusSummary_dispose.call( this );

//!!! (2023/03/30) Replaced by NonReentrant.asyncPromise
//    this.imageData_process_asyncPromise_running = undefined;

    this.workerProxies_initOk = undefined;
    this.workerProxies_init_asyncPromise_running = undefined;
    NeuralOrchestra_Base.neuralNetParamsBase_dispose.call( this );
    NeuralOrchestra_Base.workerProxies_dispose.call( this );

    this.initOk = undefined;
    this.init_asyncGenerator_running = undefined;
    this.init_asyncPromise_running = undefined;

    this.output_channelCount_per_alignment = undefined;
    this.bLogFetcherEventToConsole = undefined;
    this.downloader_apiKey = undefined;
    this.downloader_spreadsheetId = undefined;

    this.params_loading_retryWaiting = undefined;

    super.disposeResources();
  }

  get sender_clientId() {
    return this.versusResultSender?.clientId;
  }

  get input_height() {
    return this.neuralNetParamsBase?.input_height;
  }

  get input_width() {
    return this.neuralNetParamsBase?.input_width;
  }

  get vocabularyChannelCount() {
    return this.neuralNetParamsBase?.vocabularyChannelCount;
  }

  get blockCountTotalRequested() {
    return this.neuralNetParamsBase?.blockCountTotalRequested;
  }

  get output_channelCount() {
    return this.neuralNetParamsBase?.output_channelCount;
  }

  get backendName() {
    return this.workerProxies?.backendName;
  }

  get nNeuralWorker_ModeId() {
    return this.workerProxies?.nNeuralWorker_ModeId;
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
    output_channelCount = 64 * 2 //16
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
   * Call .init_async() and return init_asyncPromise.
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @return {Promise( boolean )}
   *   Return init_asyncPromise which is an instance of .init_async().
   */
  init_asyncPromise_create(
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,
    input_height, input_width,
    vocabularyChannelCount,
    blockCountTotalRequested, output_channelCount_per_alignment,
    b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
    init_asyncGenerator_delayPromise,
    versus_load_asyncGenerator_delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage = "init_asyncPromise_create";

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.init_asyncPromise_running, funcNameInMessage );

      // If .init_asyncGenerator() running, throw, too.
      NeuralOrchestra_Base
        .throw_if_init_asyncPromise_or_asyncGenerator_running.call( this,
          funcNameInMessage );

//!!! ...unfinished... (2023/03/28)
// How to integrate these precondition checking to the NonReentrant_Xxx base class?
// Perhaps, by overriding same name method.

      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, funcNameInMessage );
    }

    this.init_asyncPromise_running = true;
    this.initOk = undefined;

    let init_asyncPromise = NeuralOrchestra_Base.init_async.call( this,
      downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
      sender_clientId,
      input_height, input_width,
      vocabularyChannelCount,
      blockCountTotalRequested, output_channelCount_per_alignment,
      b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
      init_asyncGenerator_delayPromise,
      versus_load_asyncGenerator_delayPromise
    );
    return init_asyncPromise;
  }

  /**
   * Call .init_asyncGenerator() and .versus_load_asyncPromise_create()
   * internally.
   *
   *
   * Note1: Although this is an async method, it will always block main worker
   *        (i.e. UI worker). (Please see also .init_asyncGenerator()
   *        explanation.)
   *
   * Note2: For the same reason, after this async method resolved, continue to
   *        await versus_load_asyncGenerator or versus_load_asyncPromise will
   *        not block main worker. (Please see also .init_asyncGenerator()
   *        explanation.)
   *
   *
   * @param {Promise} init_asyncGenerator_delayPromise
   *   Mainly used when unit testing. If not null, this async method will
   * await it before complete. If null or undefined, no extra delay awaiting.
   *
   * @param {Promise} versus_load_asyncGenerator_delayPromise
   *   Mainly used when unit testing. If not null, the
   * versus_load_asyncGenerator async generator will await it before complete.
   * If null or undefined, no extra delay awaiting.
   *
   * @return {Promise}
   *   Return a promise (i.e. init_asyncPromise).
   *   - Resolved to versus_load_asyncGenerator or
   *       { versus_load_asyncPromise }, if succeeded.
   *     - The neural workers have been created and GPU shaders have been
   *         compiled.
   * 
   *     - But the versus summary and versus may still be loading (i.e. not
   *         yet complete).
   *       - The neural networks may also still not be created (since they
   *           need the versus data).
   *       - Please asynchronously check the returned value
   *           (versus_load_asyncGenerator or versus_load_asyncPromise) or
   *           .versus_load_asyncPromise_progress or .versus_loadOk to
   *           determine whether versus loading completed.
   * 
   *   - Resolved to false, if failed.
   */
  static async init_async(
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,
    input_height, input_width,
    vocabularyChannelCount,
    blockCountTotalRequested, output_channelCount_per_alignment,
    b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
    init_asyncGenerator_delayPromise,
    versus_load_asyncGenerator_delayPromise ) {

    const funcNameInMessage = "init_async";
    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.init_asyncPromise_running, funcNameInMessage,
        "init_asyncPromise_create" );

      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, "init_async" );
    }

    try {
      // 1. Use internal independent progress.
      NeuralOrchestra_Base.versus_load_asyncPromise_progress_create.call( this );

      // 2. Start to load (versus summary and) versus, initialize
      //    NeuralWorker.Proxies, and create neural networks.
      let init_asyncGenerator = NeuralOrchestra_Base
        .init_asyncGenerator_create_without_checking_precondition.call( this,
          this.versus_load_asyncPromise_progress,
          downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
          sender_clientId,
          input_height, input_width,
          vocabularyChannelCount,
          blockCountTotalRequested, output_channelCount_per_alignment,
          b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
          init_asyncGenerator_delayPromise,
          versus_load_asyncGenerator_delayPromise
        );

      let init_asyncGeneratorNext;
      do {
        init_asyncGeneratorNext = await init_asyncGenerator.next();
      } while ( !init_asyncGeneratorNext.done );

      // (Note: The .initOk will also be set.)
      let versus_load_asyncGenerator_or_wrapped_asyncPromise
        = init_asyncGeneratorNext.value;

      if ( ( versus_load_asyncGenerator_or_wrapped_asyncPromise != undefined )
             != this.initOk )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `( versus_load_asyncGenerator_or_wrapped_asyncPromise ( `
            + `${versus_load_asyncGenerator_or_wrapped_asyncPromise} ) != undefined ) `
          + `should be the same as `
          + `this.initOk ( ${this.initOk} ).`
        );

      if ( !versus_load_asyncGenerator_or_wrapped_asyncPromise )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `versus_load_asyncGenerator_or_wrapped_asyncPromise ( `
            + `${versus_load_asyncGenerator_or_wrapped_asyncPromise} ) `
          + `should not be undefined.`
        );

//!!! ...unfinished... (2023/03/29) 
// Use versus_load_asyncGenerator_or_wrapped_asyncPromise instead.
//       // 3. Continue to load (versus summary and) versus and create neural
//       //    networks.
//       //
//       // Note: It is not be awaited here. Caller is responsible for awaiting
//       //       .versus_load_asyncPromise
//       NeuralOrchestra_Base
//         .versus_load_asyncPromise_create_without_checking_precondition.call( this,
//           versus_load_asyncGenerator );
//
//       return this.initOk;

      return versus_load_asyncGenerator_or_wrapped_asyncPromise;

    } catch ( e ) {
      //debugger;
      // Note: Here should not modify .initOk because .init_asyncGenerator()
      //       will do.
      throw e;

    } finally {
      // 4. So that this async method could be executed again.
      this.init_asyncPromise_running = false;
    }
  }


  /**
   * Create init_asyncGenerator (an instance of .init_asyncGenerator()).
   *
   *
   * @return {AsyncGenerator}
   *   Return init_asyncGenerator which is an instance of .init_asyncGenerator().
   */
  init_asyncGenerator_create(
    progressParent,
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,
    input_height, input_width,
    vocabularyChannelCount,
    blockCountTotalRequested, output_channelCount_per_alignment,
    b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
    init_asyncGenerator_delayPromise,
    versus_load_asyncGenerator_delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage = "init_asyncGenerator_create";

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.init_asyncGenerator_running, funcNameInMessage );

      // If .init_async() running, throw, too.
      NeuralOrchestra_Base
        .throw_if_init_asyncPromise_or_asyncGenerator_running.call( this,
          funcNameInMessage );

//!!! ...unfinished... (2023/03/28)
// How to integrate these precondition checking to the NonReentrant_Xxx base class?
// Perhaps, by overriding same name method.

      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, funcNameInMessage );
    }

    return NeuralOrchestra_Base
      .init_asyncGenerator_create_without_checking_precondition.call( this,
        progressParent, 
        downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
        sender_clientId,
        input_height, input_width,
        vocabularyChannelCount,
        blockCountTotalRequested, output_channelCount_per_alignment,
        b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
        init_asyncGenerator_delayPromise, versus_load_asyncGenerator_delayPromise );
  }

  /**
   * Create init_asyncGenerator (an instance of .init_asyncGenerator()).
   * 
   * Called by .init_async() and .init_asyncGenerator_create(). It does not check
   * precondition.
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @return {AsyncGenerator}
   *   Return init_asyncGenerator which is an instance of .init_asyncGenerator().
   */
  static init_asyncGenerator_create_without_checking_precondition( ...restArgs ) {
    this.init_asyncGenerator_running = true;
    this.initOk = undefined;

    let init_asyncGenerator = NeuralOrchestra_Base.init_asyncGenerator.apply(
      this, restArgs );
    return init_asyncGenerator;
  }

  /**
   *   - Load all differential evolution versus weights ranges (i.e. versus
   *       summary).
   *   - Load one versus.
   *   - Create neural workers and compile GPU shaders.
   *   - Create neural networks.
   *
   *
   * Note1: Although this is an async generator, it will always block main
   *        worker (i.e. UI worker) due to GPU shader compiling no matter it
   *        is called in which web worker. So, it is highly recommended to
   *        call it when display a static splash screen.
   *
   * Note2: After this async generator done, continuing to call
   *        versus_load_asyncGenerator.next() will not block main worker.
   *        So, it is recommended to do that with an animated screen for
   *        displaying loading progress.
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent.
   * The created progressToAdvance will be increased when every time advanced.
   * The progressParent.root_get() will be returned when every time yield.
   *
   * @param {boolean} b_return_versus_load_asyncGenerator_instead_of_asyncPromise
   *   A boolean flag determines what this async generater's final awaited .next()
   * returns.
   *   - If truthy, { done: true, value: versus_load_asyncGenerator }.
   *   - If falsy,  { done: true, value: { versus_load_asyncPromise } }.
   *       (Note that the versus_load_asyncPromise is wrapped in an object.)
   *
   * @param {Promise} init_asyncGenerator_delayPromise
   *   Mainly used when unit testing. If not null, this async generator will
   * await it before complete. If null or undefined, no extra delay awaiting.
   *
   * @param {Promise} versus_load_asyncGenerator_delayPromise
   *   Mainly used when unit testing. If not null, the
   * versus_load_asyncGenerator async generator will await it before complete.
   * If null or undefined, no extra delay awaiting.
   *
   *
   * @yield {Promise( ValueMax.Percentage.Aggregate )}
   *   Yield a promise resolves to { done: false, value: progressParent.root_get() }.
   *
   * @yield {Promise( AsyncGenerator )}
   *   Yield a promise:
   *   - Resolved to { done: true, value: versus_load_asyncGenerator } or
   *       { done: true, value: { versus_load_asyncPromise } }, if succeeded.
   *     - The this.initOk will be true.
   *     - The neural workers have been created and GPU shaders have been
   *         compiled.
   *     - But the versus summary and versus may still be loading (i.e. not
   *         yet complete).
   *       - The neural networks may also still not be created (since they
   *           need the versus data).
   *       - Please asynchronously check the returned value
   *           (versus_load_asyncGenerator or versus_load_asyncPromise) or
   *           .versus_loadOk to determine whether versus loading completed.
   *
   *   - Resolved to { done: true, value: undefined }, if failed.
   *     - The this.initOk will be false.
   */
  static async* init_asyncGenerator(
    progressParent,
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,
    input_height, input_width,
    vocabularyChannelCount,
    blockCountTotalRequested, output_channelCount_per_alignment,
    b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
    init_asyncGenerator_delayPromise,
    versus_load_asyncGenerator_delayPromise
  ) {

    const funcNameInMessage = "init_asyncGenerator";
    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.init_asyncGenerator_running, funcNameInMessage,
        "init_asyncGenerator_create" );

      NeuralOrchestra_Base.throw_if_workerProxies_busy_or_versus_loading.call(
        this, funcNameInMessage );
    }

    try {
      // 0.

      // 0.1
      this.downloader_spreadsheetId = downloader_spreadsheetId;
      this.downloader_apiKey = downloader_apiKey;
      this.bLogFetcherEventToConsole = bLogFetcherEventToConsole;
      this.output_channelCount_per_alignment = output_channelCount_per_alignment;

      // Because NO_FILL NeuralWorker.Mode will be used, the real
      // output_channelCount will be twice of output_channelCount_per_alignment.
      let output_channelCount = output_channelCount_per_alignment * 2;

      // 0.2
      // Note: Here should not call .versus_load_asyncPromise_progress_dispose().
      NeuralOrchestra_Base.versus_dispose.call( this );
      NeuralOrchestra_Base.versusSummary_dispose.call( this );

      // 0.3
      let progressRoot = progressParent.root_get();
      let allPromiseSet = new Set();

      // 1. Initialize NeuralWorker.Proxies
      let workerProxies_init_asyncPromise;
      {
        // It will be used by .workerProxies_init_async()
        NeuralOrchestra_Base.neuralNetParamsBase_create.call( this,
          input_height, input_width,
          vocabularyChannelCount,
          blockCountTotalRequested,
          output_channelCount );

        NeuralOrchestra_Base.workerProxies_create.call( this );

//!!! (2023/03/29 Remarked) Old Codes
// Integrate .workerProxies_init_asyncPromise_create() into .workerProxies_init_async()
//         workerProxies_init_asyncPromise
//           = NeuralOrchestra_Base.workerProxies_init_asyncPromise_create.call( this );

        workerProxies_init_asyncPromise
          = NeuralOrchestra_Base.workerProxies_init_async.call( this );

        allPromiseSet.add( workerProxies_init_asyncPromise );
      }

      // 2. Load (versus summary and) versus. Create neural networks.
      let versus_load_asyncGenerator = NeuralOrchestra_Base
        .versus_load_asyncGenerator_create_without_checking_precondition.call( this,
          progressParent, workerProxies_init_asyncPromise,
          versus_load_asyncGenerator_delayPromise );

      let loaderNext = versus_load_asyncGenerator.next();
      allPromiseSet.add( loaderNext );

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
        // If versus_load_asyncGenerator.next() resolved, got an { done, value } object.
        // If workerProxies_init_asyncPromise resolved, got a boolean value.
        let allPromise = Promise.race( allPromiseSet );
        let object_or_boolean = await allPromise;

        // 3.2 versus_load_asyncGenerator.next() resolved.
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
            // versus_load_asyncGenerator waits .workerProxies_init_asyncPromise internally.
            throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
              + `versus_load_asyncGenerator `
              + `should not be done before `
              + `workerProxies_init_asyncPromise resolved.`
            );

          // 3.2.2 DEvolution.Versus has been loaded a little. Report progress
          //       and schedule to wait it to load next a little.
          } else {
            // let progressRoot = object.value;
            yield progressRoot;

            allPromiseSet.delete( loaderNext );
            loaderNext = versus_load_asyncGenerator.next();
            allPromiseSet.add( loaderNext );
          }

        // 3.3 workerProxies_init_asyncPromise resolved.
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
      // Otherwise, the versus_load_asyncGenerator.next() will be called one
      // more time by outside caller (including .init_async()).
      let versus_load_asyncGenerator_prepended;
      {
        // Replace versus_load_asyncGenerator by a new async generator which
        // will yield the loaderNext first. Just like push the loaderNext back
        // to the original versus_load_asyncGenerator.
        versus_load_asyncGenerator_prepended = PartTime.prepend_asyncGenerator(
          loaderNext, versus_load_asyncGenerator );
      }

      // 3.5 Continue to load (versus summary and) versus and create neural
      //     networks.
      let returnValue;
      if ( b_return_versus_load_asyncGenerator_instead_of_asyncPromise ) {
        returnValue = versus_load_asyncGenerator_prepended;

      } else {
        let versus_load_asyncPromise = NeuralOrchestra_Base
          .versus_load_asyncPromise_create_without_checking_precondition.call(
            this, versus_load_asyncGenerator_prepended );

        // Note: Wrap promise inside an object so that .init_async() will not
        //       await it. (The caller of .init_async() should await it.)
        returnValue = { versus_load_asyncPromise  };
      }

      // 4. Create Versus Result Reporter
      NeuralOrchestra_Base.versusResultSender_create.call( this, sender_clientId );

      // 5.
      if ( init_asyncGenerator_delayPromise )
        await init_asyncGenerator_delayPromise;

      // 6.
      this.initOk = true;
      return returnValue;

    } catch ( e ) {
      //debugger;
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
   * This method will always block UI worker (because of compiling WebGL
   * shaders) even if it is called in non-UI worker. So it is suggested to
   * call this method during game splash screen displaying.
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @param {NeuralNet.ParamsBase} this.neuralNetParamsBase
   *   The neural network configuration. It will be used for both two neural
   * networks. It will be kept (i.e. owned and destroyed) by this
   * NeuralOrchetra object. Its .nConvStageTypeId may be modified according
   * to which backend (webgl or cpu) is used finally for gaining the best
   * performance.
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

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.workerProxies_init_asyncPromise_running, funcNameInMessage );

      NeuralOrchestra_Base
        .throw_if_init_asyncPromise_and_asyncGenerator_not_running.call( this,
          funcNameInMessage );

//!!! ...unfinished... (2023/03/28)
// How to integrate these precondition checking to the NonReentrant_Xxx base class?
// Perhaps, by overriding same name method.

      NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
        .call( this, funcNameInMessage );
    }

    this.workerProxies_init_asyncPromise_running = true;
    this.workerProxies_initOk = undefined;

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
        neuralNetParamsBase
          .nConvStageTypeId_adjust_for_backend_webgl_if_ShuffleNetV2();

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
        neuralNetParamsBase
          .nConvStageTypeId_adjust_for_backend_cpu_if_ShuffleNetV2();

        initOkPromise = this.workerProxies.init_async( "cpu",
          NeuralWorker.Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL__APPLIER // (5) 
        );

        initOk = await initOkPromise;
        this.workerProxies_initOk = initOk;
        return this.workerProxies_initOk;
      }

    } catch ( e ) {
      //debugger;
      this.workerProxies_initOk = false;
      throw e;

    } finally {
      // 3. So that this async method could be executed again.
      this.workerProxies_init_asyncPromise_running = false;
    }
  }

//!!! (2023/03/29 Remarked) Old Codes
// Integrate .workerProxies_init_asyncPromise_create() into .workerProxies_init_async()
//   /**
//    * Call .workerProxies_init_async() and return workerProxies_init_asyncPromise.
//    *
//    * @param {NeuralOrchestra_Base} this
//    * @param {NeuralNet.ParamsBase} this.neuralNetParamsBase
//    *
//    * @return {Promise( boolean )}
//    *   Return workerProxies_init_asyncPromise which is an instance of
//    * .workerProxies_init_async().
//    */
//   static workerProxies_init_asyncPromise_create() {
//
//     { // Checking pre-condition.
//       const funcNameInMessage = "workerProxies_init_asyncPromise_create";
//
//       NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
//         this.workerProxies_init_asyncPromise_running, funcNameInMessage );
//
// //!!! ...unfinished... (2023/03/29)
// // Perhaps, should check init_asyncGenerator_or_asyncPromise_running == true.
//
// //!!! ...unfinished... (2023/03/28)
// // How to integrate these precondition checking to the NonReentrant_Xxx base class?
// // Perhaps, by overriding same name method.
//
//       NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
//         .call( this, funcNameInMessage );
//     }
//
//     this.workerProxies_init_asyncPromise_running = true;
//     this.workerProxies_initOk = undefined;
//
//     let workerProxies_init_asyncPromise
//       = NeuralOrchestra_Base.workerProxies_init_async.call( this );
//     return workerProxies_init_asyncPromise;
//   }
//
//   /**
//    * This method will always block UI worker (because of compiling WebGL
//    * shaders) even if it is called in non-UI worker. So it is suggested to
//    * call this method during game splash screen displaying.
//    *
//    * @param {NeuralOrchestra_Base} this
//    *
//    * @param {NeuralNet.ParamsBase} this.neuralNetParamsBase
//    *   The neural network configuration. It will be used for both two neural
//    * networks. It will be kept (i.e. owned and destroyed) by this
//    * NeuralOrchetra object. Its .nConvStageTypeId may be modified according
//    * to which backend (webgl or cpu) is used finally for gaining the best
//    * performance.
//    *
//    * @return {Promise}
//    *   Return a promise:
//    *   - Resolved to true, if succeeded.
//    *     - The neural workers have been created and GPU shaders have been
//    *         compiled.
//    *   - Resolved to false, if failed.
//    */
//   static async workerProxies_init_async() {
//
//     { // Checking pre-condition.
//       const funcNameInMessage = "workerProxies_init_async";
//
//       NeuralOrchestra_Base.throw_call_another_if_false.call( this,
//         this.workerProxies_init_asyncPromise_running, funcNameInMessage,
//         "workerProxies_init_asyncPromise_create" );
//
// //!!! ...unfinished... (2023/03/29)
// // Perhaps, should check init_asyncGenerator_or_asyncPromise_running == true.
//
// //!!! ...unfinished... (2023/03/28)
// // How to integrate these precondition checking to the NonReentrant_Xxx base class?
// // Perhaps, by overriding same name method.
//
//       NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
//         .call( this, funcNameInMessage );
//     }
//
//     let initOk;
//     try {
//       // 0.
//       let neuralNetParamsBase = this.neuralNetParamsBase;
//       let initOkPromise;
//
//       // 1. Try backend "webgl" first.
//       //
//       // Backend "webgl" has best performance with SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5)
//       // and one web worker (NO_FILL).
//       //
//       {
//         neuralNetParamsBase
//           .nConvStageTypeId_adjust_for_backend_webgl_if_ShuffleNetV2();
//
//         initOkPromise = this.workerProxies.init_async( "webgl",
//           NeuralWorker.Mode.Singleton.Ids.ONE_WORKER__ONE_SCALE__NO_FILL // (0) 
//         );
//
//         initOk = await initOkPromise;
//         if ( initOk ) { // For WebGL, compile WebGL shaders in advance.
//           let compilePromise
//             = NeuralOrchestra_Base.workerProxies_compileShaders_async.call( this );
//
//           let compileOk = await compilePromise;
//
//           this.workerProxies_initOk = compileOk;
//           return this.workerProxies_initOk;
//         }
//       }
//
//       // 2. If backend "webgl" initialization failed, try backend "cpu".
//       //
//       // Backend "cpu" has best performance with SHUFFLE_NET_V2 (4)
//       // and two web workers (NO_FILL) by .applier().
//       //
//       {
//         neuralNetParamsBase
//           .nConvStageTypeId_adjust_for_backend_cpu_if_ShuffleNetV2();
//
//         initOkPromise = this.workerProxies.init_async( "cpu",
//           NeuralWorker.Mode.Singleton.Ids.TWO_WORKER__ONE_SCALE__NO_FILL__APPLIER // (5) 
//         );
//
//         initOk = await initOkPromise;
//         this.workerProxies_initOk = initOk;
//         return this.workerProxies_initOk;
//       }
//
//     } catch ( e ) {
//       debugger;
//       this.workerProxies_initOk = false;
//       throw e;
//
//     } finally {
//       // 3. So that this async method could be executed again.
//       this.workerProxies_init_asyncPromise_running = false;
//     }
//   }

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

      NeuralOrchestra_Base
        .throw_if_init_asyncPromise_and_asyncGenerator_not_running.call( this,
          funcNameInMessage );

      NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
        .call( this, funcNameInMessage );
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

      NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
        .call( this, funcNameInMessage );
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
   *
   * @return {Promise( Float32Array[] )}
   *   Return a newly created imageData_process_asyncPromise which is an
   * instance of .imageData_process_async().
   */
  imageData_process_asyncPromise_create( sourceImageData, delayPromise ) {

//!!! ...unfinished... (2023/03/29) needs NonReentrant_asyncPromise.Xxx();

    { // Checking pre-condition.
      const funcNameInMessage = "imageData_process_asyncPromise_create";

//!!! ...unfinished... (2023/03/29) NonReentrant.asyncPromise will do some check.
//       NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
//         this.imageData_process_asyncPromise_running, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running
        .call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_workerProxies_init_asyncPromise_running
        .call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_versus_loadOk.call( this, funcNameInMessage );
    }

    return super
      .imageData_process_asyncPromise_create( sourceImageData, delayPromise );
  }

  /**
   *
   * @param {ImageData} sourceImageData
   *   The input image datat which will be processed by neural workers.
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, this async method will await
   * it before complete. If null or undefined, no extra delay awaiting.
   *
   * @return {Promise( Float32Array[] )}
   *   Return a promise resolved to an array [ Float32Array, Float32Array ]
   * representing the (pair) neural networks' results.
   *   - Float32Array[ 0 ] is parent (chromosome) neural network's output.
   *   - Float32Array[ 1 ] is offspring (chromosome) neural network's output.
   */
  static async imageData_process_asyncPromise( sourceImageData, delayPromise ) {

//!!! ...unfinished... (2023/03/29) NonReentrant.asyncPromise will do some check.
//     { // Checking pre-condition.
//       const funcNameInMessage = "imageData_process_async";
//
//       NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
//         this.imageData_process_asyncPromise_running, funcNameInMessage );
//
// //!!! ...unfinished... (2023/03/28)
// // How to integrate these precondition checking to the NonReentrant_Xxx base class?
// // Perhaps, by overriding same name method.
//
//       NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running
//         .call( this, funcNameInMessage );
//
//       NeuralOrchestra_Base.throw_if_workerProxies_init_asyncPromise_running.call( this,
//         funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_not_versus_loadOk.call( this, funcNameInMessage );
//     }
//
//     this.imageData_process_asyncPromise_running = true;

    try {
      // 1.
      let theFloat32ArrayArrayPromise
        = this.workerProxies.ImageData_process_async( sourceImageData );

      let theFloat32ArrayArray = await theFloat32ArrayArrayPromise;

      // 2.
      if ( delayPromise )
        await delayPromise;

      this.imageData_process = true;
      return theFloat32ArrayArray;

    } catch ( e ) {
      //debugger;
      //console.error( e );
      this.imageData_process = false;
      throw e;

    } finally {

//!!! ...unfinished... (2023/03/29) NonReentrant.asyncPromise will do.
//       // 3. So that this async method could be executed again.
//       this.imageData_process_asyncPromise_running = false;
    }
  }

//!!! (2023/03/29 Remarked) Old Codes
// Integrate .imageData_process_asyncPromise_create() into .imageData_process_async()
//   /**
//    * Call .imageData_process_async() and return imageData_process_asyncPromise.
//    *
//    * @return {Promise( Float32Array[] )}
//    *   Return imageData_process_asyncPromise which is an instance
//    * of .imageData_process_async().
//    */
//   imageData_process_asyncPromise_create( sourceImageData, delayPromise ) {
//
//     { // Checking pre-condition.
//       const funcNameInMessage = "imageData_process_asyncPromise_create";
//
//       NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
//         this.imageData_process_asyncPromise_running, funcNameInMessage );
//
// //!!! ...unfinished... (2023/03/28)
// // How to integrate these precondition checking to the NonReentrant_Xxx base class?
// // Perhaps, by overriding same name method.
//
//       NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running.call( this, funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_workerProxies_init_asyncPromise_running.call( this,
//         funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_not_versus_loadOk.call( this, funcNameInMessage );
//     }
//
//     this.imageData_process_asyncPromise_running = true;
//     let imageData_process_asyncPromise
//       = NeuralOrchestra_Base.imageData_process_async.call( this,
//           sourceImageData, delayPromise );
//     return imageData_process_asyncPromise;
//   }
//
//   /**
//    *
//    * @param {ImageData} sourceImageData
//    *   The input image datat which will be processed by neural workers.
//    *
//    * @param {Promise} delayPromise
//    *   Mainly used when unit testing. If not null, this async method will await
//    * it before complete. If null or undefined, no extra delay awaiting.
//    *
//    * @return {Promise( Float32Array[] )}
//    *   Return a promise resolved to an array [ Float32Array, Float32Array ]
//    * representing the (pair) neural networks' results.
//    *   - Float32Array[ 0 ] is parent (chromosome) neural network's output.
//    *   - Float32Array[ 1 ] is offspring (chromosome) neural network's output.
//    */
//   static async imageData_process_async( sourceImageData, delayPromise ) {
//
//     { // Checking pre-condition.
//       const funcNameInMessage = "imageData_process_async";
//
//       NeuralOrchestra_Base.throw_call_another_if_false.call( this,
//         this.imageData_process_asyncPromise_running, funcNameInMessage,
//         "imageData_process_asyncPromise_create" );
//
//       NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running.call( this, funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_workerProxies_init_asyncPromise_running.call( this,
//         funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );
//       NeuralOrchestra_Base.throw_if_not_versus_loadOk.call( this, funcNameInMessage );
//     }
//
//     try {
//       // 1.
//       let theFloat32ArrayArrayPromise
//         = this.workerProxies.ImageData_process_async( sourceImageData );
//
//       let theFloat32ArrayArray = await theFloat32ArrayArrayPromise;
//
//       // 2.
//       if ( delayPromise )
//         await delayPromise;
//
//       return theFloat32ArrayArray;
//
//     } finally {
//       // 3. So that this async method could be executed again.
//       this.imageData_process_asyncPromise_running = false;
//     }
//   }


  /**
   * @param {NeuralOrchestra_Base} this
   */
  static versus_load_asyncPromise_progress_create() {
    NeuralOrchestra_Base.versus_load_asyncPromise_progress_dispose.call( this );
    this.versus_load_asyncPromise_progress
      = ValueMax.Percentage.Aggregate.Pool.get_or_create_by();
  }

  /**
   * @param {NeuralOrchestra_Base} this
   */
  static versus_load_asyncPromise_progress_dispose() {
    if ( this.versus_load_asyncPromise_progress ) {
      this.versus_load_asyncPromise_progress.disposeResources_and_recycleToPool();
      this.versus_load_asyncPromise_progress = null;
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
   * Create versus_load_asyncPromise (an instance of .versus_load_async()).
   *
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, the async method will
   * await it before complete. If null or undefined, no extra delay awaiting.
   *
   * @return {Promise( boolean )}
   *   Return the newly created versus_load_asyncPromise which is an instance
   * of .versus_load_async().
   */
  versus_load_asyncPromise_create( delayPromise ) {

    const funcNameInMessage = "versus_load_asyncPromise_create";
    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.versus_load_asyncPromise_running, funcNameInMessage );

//!!! ...unfinished... (2023/03/28)
// How to integrate these precondition checking to the NonReentrant_Xxx base class?
// Perhaps, by overriding same name method.

      NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
        .call( this, funcNameInMessage );
    }

    // 1.
    let versus_load_asyncGenerator;
    {
      // Use internal independent progress.
      NeuralOrchestra_Base.versus_load_asyncPromise_progress_create.call( this );

      // Prepare versus_load_asyncGenerator
      const workerProxies_init_asyncPromise = null; // For outside caller.
      versus_load_asyncGenerator = NeuralOrchestra_Base
        .versus_load_asyncGenerator_create_without_checking_precondition.call( this,
          this.versus_load_asyncPromise_progress,
          workerProxies_init_asyncPromise, delayPromise );

      // Note: Here needs not set .versus_loadOk to undefined because
      //       .versus_load_asyncGenerator_create_without_checking_precondition() has
      //       done it.
    }

    // 2.
    let versus_load_asyncPromise = NeuralOrchestra_Base
      .versus_load_asyncPromise_create_without_checking_precondition.call( this,
        versus_load_asyncGenerator );
    return versus_load_asyncPromise;
  }

  /**
   * Create versus_load_asyncPromise (an instance of .versus_load_async()).
   *
   * Called by .init_async() and .versus_load_asyncPromise_create(). It does not
   * check precondition.
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @param {AsyncGenerator} versus_load_asyncGenerator
   *   The async generator (an instance of .versus_load_asyncGenerator()) to
   * be wrapped by the created promise.
   *
   * @return {Promise( boolean )}
   *   Return the newly created this.versus_load_asyncPromise which is an instance
   * of .versus_load_async().
   */
  static versus_load_asyncPromise_create_without_checking_precondition(
    versus_load_asyncGenerator ) {

//!!! (2023/03/25 Remarked) no longer record in .versus_load_asyncPromise
// !!! ...unfinished... (2023/03/25)
// // Perhaps, only init_async() will record in this.versus_load_asyncPromise
//     this.versus_load_asyncPromise_running = true;
//     this.versus_load_asyncPromise = NeuralOrchestra_Base.versus_load_async.call(
//       this, versus_load_asyncGenerator );
//     return this.versus_load_asyncPromise;

    this.versus_load_asyncPromise_running = true;
    let versus_load_asyncPromise = NeuralOrchestra_Base.versus_load_async.call(
      this, versus_load_asyncGenerator );
    return versus_load_asyncPromise;

  }

  /**
   * Call versus_load_asyncGenerator.next() until done.
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @param {AsyncGenerator} versus_load_asyncGenerator
   *   The async generator (an instance of .versus_load_asyncGenerator()) to
   * be wrapped by the created promise. It will be .next() until done by this
   * async method.
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *     - Versus summary and versus are loaded. Neural networks are created.
   *   - Resolved to false, if failed.
   *   - When settled, the .versus_load_asyncPromise_progress has been stopped.
   */
  static async versus_load_async( versus_load_asyncGenerator ) {

    const funcNameInMessage = "versus_load_async";
    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.versus_load_asyncPromise_running, funcNameInMessage,
        "versus_load_asyncPromise_create" );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
        .call( this, funcNameInMessage );
    }

    try {
      // 1.
      if ( !versus_load_asyncGenerator )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `versus_load_asyncGenerator should have already existed.` );

      let loaderNextPromise;
      let loaderNext;
      do {
        loaderNextPromise = versus_load_asyncGenerator.next();
        loaderNext = await loaderNextPromise;
      } while ( !loaderNext.done );

      // The result should be either true or false. If result is undefined,
      // the generator may have been terminated previously by throwing
      // exception. So, continue to throw exception to inform caller the
      // generator is illegal.
      if ( loaderNext.value === undefined )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `versus_load_asyncGenerator is illegal `
          + `(e.g. has been terminated previously by throwing exception).` );

      let loadOk = loaderNext.value;
      if ( loadOk != this.versus_loadOk )
        throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
          + `loadOk ( ${loadOk} ) `
          + `should be the same as `
          + `this.versus_loadOk ( ${this.versus_loadOk} ).`
        );

      return loadOk;

    } catch ( e ) {
      //debugger;
      // Note: Here should not modify .versus_loadOk because
      //       .versus_load_asyncGenerator() will do.
      throw e;

    } finally {
      // 2. So that this async method could be executed again.
      this.versus_load_asyncPromise_running = false;
    }
  }


  /**
   * Create versus_load_asyncGenerator (an instance of .versus_load_asyncGenerator()).
   *
   * When wanting to load the next versus with yourself progressParent, call
   * this method and call .next() until { done: true }.
   *
   *
   * @param {ValueMax.Percentage.Aggregate} progressParent
   *   Some new progressToAdvance will be created and added to progressParent.
   * The created progressToAdvance will be increased when every time advanced.
   * The progressParent.root_get() will be returned when every time yield.
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, the async generator will
   * await it before complete. If null or undefined, no extra delay awaiting.
   *
   * @return {AsyncGenerator}
   *   Return the newly created versus_load_asyncGenerator which is an instance of
   * .versus_load_asyncGenerator().
   */
  versus_load_asyncGenerator_create( progressParent, delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage = "versus_load_asyncGenerator_create";

      NeuralOrchestra_Base.throw_if_an_old_still_running.call( this,
        this.versus_load_asyncGenerator_running, funcNameInMessage );

//!!! ...unfinished... (2023/03/28)
// How to integrate these precondition checking to the NonReentrant_Xxx base class?
// Perhaps, by overriding same name method.

      NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
        .call( this, funcNameInMessage );
    }

    const workerProxies_init_asyncPromise = null; // For outside caller.
    let versus_load_asyncGenerator = NeuralOrchestra_Base
      .versus_load_asyncGenerator_create_without_checking_precondition.call( this,
        progressParent, workerProxies_init_asyncPromise, delayPromise );
    return versus_load_asyncGenerator;
  }

  /**
   * Create an instance of .versus_load_asyncGenerator().
   * 
   * Called by .init_asyncGenerator(), .versus_load_async() and
   * .versus_load_asyncGenerator_create().
   *
   * It does not check precondition. It does not record in .versus_load_asyncGenerator
   *
   *
   * @param {NeuralOrchestra_Base} this
   *
   * @return {AsyncGenerator}
   *   Return the newly created versus_load_asyncGenerator which is an instance of
   * .versus_load_asyncGenerator().
   */
  static versus_load_asyncGenerator_create_without_checking_precondition(
    progressParent, workerProxies_init_asyncPromise, delayPromise ) {

    this.versus_load_asyncGenerator_running = true;
    this.versus_loadOk = undefined;

    let versus_load_asyncGenerator = NeuralOrchestra_Base.versus_load_asyncGenerator.call(
      this, progressParent, workerProxies_init_asyncPromise, delayPromise );
    return versus_load_asyncGenerator;
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
   *   Some new progressToAdvance will be created and added to progressParent.
   * The created progressToAdvance will be increased when every time advanced.
   * The progressParent.root_get() will be returned when every time yield.
   *
   * @param {Promise( boolean )} workerProxies_init_asyncPromise
   *   The an instance of .workerProxies_init_async().
   *   - If not null, it awaited before creating neural networks.
   *     - This case is used by .init_asyncGenerator()
   *   - If null, the .initOk must already be true.
   *     - This case is used by .versus_load_asyncGenerator_create() (i.e.
   *         outside caller).
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, this async generator will
   * await it before complete. If null or undefined, no extra delay awaiting.
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
  static async* versus_load_asyncGenerator(
    progressParent, workerProxies_init_asyncPromise, delayPromise ) {

    const funcNameInMessage = "versus_load_asyncGenerator";

    { // Checking pre-condition.

      NeuralOrchestra_Base.throw_call_another_if_false.call( this,
        this.versus_load_asyncGenerator_running, funcNameInMessage,
        "versus_load_asyncGenerator_create" );

      if ( workerProxies_init_asyncPromise ) {
        // If has workerProxies_init_asyncPromise, must during initializing.
        NeuralOrchestra_Base
          .throw_if_init_asyncPromise_and_asyncGenerator_not_running.call(
            this, funcNameInMessage );
       } else {
        // If no workerProxies_init_asyncPromise, the initOk must be true.
        NeuralOrchestra_Base.throw_if_not_initOk.call( this,
          funcNameInMessage );
      }

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
        .call( this, funcNameInMessage );
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
      // Note: This is why versus_load_asyncGenerator is impossible to complete
      //       before workerProxies_init_asyncPromise complete inside
      //       .init_asyncGenerator().
      let workerProxies_initOk;
      if ( workerProxies_init_asyncPromise ) {
        workerProxies_initOk = await workerProxies_init_asyncPromise;
      } else {
        workerProxies_initOk = this.workerProxies_initOk;
      }

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
      if ( delayPromise )
        await delayPromise;

    } catch ( e ) {
      //debugger;
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
   * Note: The resolved .imageData_process_asyncPromise_create() is an
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
   *
   * @return {boolean}
   *   - Return true, if the versus is not expired and the specified result
   *       will be tried to send to server.
   *     - This does not means the sending is succeeded. It is still possible
   *         failed (e.g. Internet disconnected). However, even if sending
   *         is failed, the caller of this method will not be informed and will
   *         not be affected because the exception is thrown asynchronously.
   *
   *   - Return false, if the versus is expired. The specified result will
   *       not be sent. It will be just discarded to prenvent server from
   *       being confused.
   */
  versusResultSender_send( nNegativeZeroPositive ) {

    const funcNameInMessage = "versusResultSender_send";
    { // Checking pre-condition.

      // Prevent from .versusResultSender not existed.
      NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );

      // Prevent from .versus not existed.
      NeuralOrchestra_Base.throw_if_versus_loading.call( this, funcNameInMessage );
      NeuralOrchestra_Base.throw_if_not_versus_loadOk.call( this, funcNameInMessage );
    }

    // Check current time and the versus downloaded time.
    let nowTimeMilliseconds = Date.now();
    let bExpired = this.versus.isExpired_byNowTime( nowTimeMilliseconds );

    // If the interval is too long so that the versus is expired, discard the
    // versus result (i.e. do not send it to server) and log a warning message
    // (because this should not be a usual case).
    //
    // Note: Sending result of expired versus to server will increase the
    //       possibility of confusing server.
    if ( bExpired ) {
      let versusIdString = this.versus.versusId.versusIdString;
      console.warn( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `versus ( \"${versusIdString}\" ) is expired.` );
      return false;
    }

    this.versusResultSender.post_by_versusId_NegativeZeroPositive(
      this.versus.versusId, nNegativeZeroPositive );
    return true;
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
  static throw_if_init_asyncPromise_or_asyncGenerator_running( funcNameInMessage ) {
    if (   ( this.init_asyncPromise_running )
        || ( this.init_asyncGenerator_running ) )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should not be executed during initializing.` );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_init_asyncPromise_and_asyncGenerator_not_running( funcNameInMessage ) {
    if (   ( !this.init_asyncPromise_running )
        && ( !this.init_asyncGenerator_running ) )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should be executed during initializing.` );
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
  static throw_if_workerProxies_init_asyncPromise_running( funcNameInMessage ) {
    if ( this.workerProxies_init_asyncPromise_running )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still initializing.` );
  }

//!!! (2023/03/30) Replaced by NonReentrant.asyncPromise
//   /**
//    * @param {NeuralOrchestra_Base} this
//    * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
//    */
//   static throw_if_imageData_process_asyncPromise_running( funcNameInMessage ) {
//     if ( this.imageData_process_asyncPromise_running )
//       throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
//         + `should not be executed while `
//         + `NeuralWorker.Proxies is still processing image.` );
//   }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_workerProxies_busy( funcNameInMessage ) {
    NeuralOrchestra_Base.throw_if_workerProxies_init_asyncPromise_running.call( this,
      funcNameInMessage );
    NeuralOrchestra_Base.throw_if_imageData_process_asyncPromise_running
      .call( this, funcNameInMessage );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_versus_loading( funcNameInMessage ) {
    if (   ( this.versus_load_asyncPromise_running )
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
   *   The function name which should be called instead. (e.g. init_asyncPromise_create)
   */
  static throw_call_another_if_false(
    b, funcNameInMessage, funcNameShouldBeCalledInMessage ) {

    if ( !b )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `Please call .${funcNameShouldBeCalledInMessage}() instead.` );
  }

}


/**
 *
 * @param {NeuralOrchestra_Base} this
 *
 * @return {Promise}
 *   Return the newly created instance of
 * NeuralOrchestra_Base.imageData_process_asyncPromise().
 */
function relay_imageData_process_asyncPromise( ...restArgs ) {
  return NeuralOrchestra_Base.imageData_process_asyncPromise.apply(
    this, restArgs );
}

