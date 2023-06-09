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
 *     - await it resolved to versus_load_asyncGenerator or
 *         { versus_load_asyncPromise }.
 *   - Or, call .init_asyncGenerator_create_with_asyncPromise_progress()
 *     - await .next() until { done: true, value: versus_load_asyncGenerator }
 *   - go to 1.1.3
 *
 *
 * 1.1.2 Load another versus
 *
 *   - call .versus_load_asyncPromise_create(), or
 *   - call .versus_load_asyncGenerator_create_with_asyncPromise_progress().
 *   - go to 1.1.3
 *
 *
 * 1.1.3 Wait for versus loaded and neural networks created
 *
 *   - await versus_load_asyncPromise until resolved, or await
 *       versus_load_asyncGenerator.next() until { done: true, value: true }.
 *   - .versus_loadOk asynchronously should be true.
 *   - .versus_load_asyncPromise_progress.valuePercentage should be 100.
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
 *   - await versus_load_asyncPromise until resolved, or await
 *       versus_load_asyncGenerator.next() until { done: true, value: true }.
 *   - .versus_loadOk asynchronously should be true.
 *   - (.versus_load_asyncPromise_progress is not used in this case.)
 *   - go to 1.3
 *
 *
 * 1.3 Process image, and report versus result
 *
 *   - call and await .alignmentMarkValueArrayArray_set_asyncPromise_create()
 *   - call and await .TypedArray_process_asyncPromise_create() repeatedly.
 *   - call and await .alignmentMarkValueArrayArray_swap_asyncPromise_create()
 *   - call and await .TypedArray_process_asyncPromise_create() repeatedly.
 *   - call .versusResultSender_send()
 *   - go to 1.1.2 or 1.2.2 (Load another versus)
 *
 *
 * 2. Configuration for 250K filter weights and execution 2 times per second
 *
 *   - explicit_input_height = 72
 *   - explicit_input_width = 114
 *   - explicit_input_channelCount = 4
 *   - vocabularyChannelCount = 4
 *   - vocabularyCountPerInputChannel = 256
 *   - blockCountTotalRequested = 39
 *   - output_channelCount = 128
 *
 *
 * Note1: If ( implicit_input_mode
 *          == IMPLICIT_INPUT__FILL_ALIGNMENT_MARK__FILL_PREVIOUS_OUTPUT(5) ):
 *
 *          - implicit_input_width will be 14
 *          - input_width will be 128
 *
 *
 * Note2: The ( output_channelCount = 128 ) is important.
 *
 *   - If it is lesser (e.g. 64), the stageCount will also be lesser. Because
 *       image is shrinked less times, its performance will be slower (i.e. can
 *       not achieve 2 times per second). Although its filter weights will also
 *       be lesser.
 *
 *   - If it is more (e.g. 256), the stageCount will also be more. Because
 *       image is shrinked more times, its performance will be faster (i.e. can
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
 * 2.3 Configuration_4_120
 *
 *   - vocabularyChannelCount = 4
 *   - blockCountTotalRequested = 120
 *   - output_channelCount = 64
 *
 * It will get ( stageCount = 2 ).
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
 * @member {number} explicit_input_height
 *   The explicit (i.e. user visible) input image's height (pixel count). It is
 * equal to or less than .input_height.
 *
 * @member {number} explicit_input_width
 *   The explicit (i.e. user visible) input image's width (pixel count). It is
 * equal to or less than .input_width.
 *
 * @member {number} explicit_input_channelCount
 *   The explicit (i.e. user visible) input image's channel count. It is always
 * equal to .input_channelCount. For RGA input image, it should be 4.
 *
 * @member {number} nNeuralWorker_ImplicitInputModeId
 *   The numeric identifier of the neural network implicit input mode
 * (NeuralWorker.ImplicitInputMode.Singleton.Ids.Xxx).
 *
 * @member {boolean} has_implicit_input
 *   - If true, there will be extra space in the input image for filling
 *       alignment mark and/or previous time output.
 *
 *     - In this case, the .output_asInputValueRange should also be true so
 *         that the previous time output is suitable for feedback.
 *
 *   - If false, there will be no extra space in the input image for filling
 *       alignment mark and/or previous time output.
 *
 * @member {number} vocabularyChannelCount
 *   In the embedding layer, every vocabulary will have how many embedding
 * channels. Every input channel will be expanded into so many embedding
 * channels. It could be viewed as embeddingChannelCountPerInputChannel. It
 * must be ( >= 2 ) because the embedding layer always has
 * ( bEmbedVocabularyId == true ).
 *
 * @member {number} vocabularyCountPerInputChannel
 *   In the embedding layer, every input channel will have how many
 * vocabularies. This is also vocabulary count per vocabulary table (because
 * every input channel has a vocabulary table). For an image data (R-G-B-A
 * four channels), there will be 256 vocabularies per input channel because
 * every channel is represented by one byte (8 bits) which has 2^8 = 256 kinds
 * of possible values.
 * 
 * @member {number} blockCountTotalRequested
 *   How many blocks of the whole neural network are wanted. It will be
 * spreaded to every stage. Note that every stage will have at least 2 blocks.
 *
 * @member {number} output_channelCount
 *   Every neural network output tensor's channel count.
 *
 * @member {boolean} output_asInputValueRange
 *   If true, restrict output value to the (neural network) input value range
 * (i.e. non-negative integer which can be used in embedding looking up). This
 * is useful if the output will be used as the recurrent feedback of the next
 * time input. It should be true if ( has_implicit_input == true ).
 *
 *
 * @member {number} input_height
 *   The input image's height. It exists only after NeuralWorker.Proxies
 * created.
 *
 * @member {number} input_width
 *   The input image's width. It exists only after NeuralWorker.Proxies
 * created.
 *
 * @member {number} input_channelCount
 *   The input image's channel count. It exists only after NeuralWorker.Proxies
 * created.
 *
 *
 * @member {number} implicit_input_height
 *   The implicit input image's height. It exists only after
 * NeuralWorker.Proxies created.
 *
 * @member {number} implicit_input_width
 *   The implicit input image's width. It exists only after
 * NeuralWorker.Proxies created.
 *
 * @member {number} implicit_input_channelCount
 *   The implicit input image's channel count. It exists only after
 * NeuralWorker.Proxies created.
 *
 *
 * @member {number} output_height
 *   The output image's height. It exists only after NeuralWorker.Proxies
 * created.
 *
 * @member {number} output_width
 *   The output image's width. It exists only after NeuralWorker.Proxies
 * created.
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
 *
 * @member {NeuralNet.ParamsBase} neuralNetParamsBase
 *   The neural network configuration. It will be used for both two neural
 * networks. It will be kept (i.e. owned and destroyed) by this
 * NeuralOrchestra object.
 *
 *
 * @member {Uint8ClampedArray[]|Int32Array[]|number[][]} alignmentMarkValueArrayArray
 *   (Please see NeuralWorker.Proxies explanation.)
 *
 * @member {boolean} alignmentMarkValueArrayArray_nonEmpty
 *   (Please see NeuralWorker.Proxies explanation.)
 *
 * @member {Float32Array[] | Int32Array[]} previous_output_TypedArrayArray
 *   (Please see NeuralWorker.Proxies explanation.)
 *
 * @member {boolean} previous_output_TypedArrayArray_nonEmpty
 *   (Please see NeuralWorker.Proxies explanation.)
 *
 *
 * @member {DEvolution.VersusSummary} versusSummary
 *   The downloaded versus summary of the differential evolution.
 *
 * @member {DEvolution.Versus} versus
 *   The downloaded current versus of the differential evolution.
 *
 *
 * @member {boolean} init_asyncPromise_running
 *   If true, a .init_asyncPromise_create() is still executing. Please wait it
 * becoming false if wanting to call .init_asyncPromise_create() again.
 *
 * @member {boolean} init_asyncGenerator_running
 *   If true, a .init_asyncGenerator_create() is still executing. Please wait
 * it becoming false if wanting to call .init_asyncGenerator_create() again.
 *
 * @member {boolean} initOk
 *   If true, a .init_async() or .init_asyncGenerator() or
 * .init_asyncGenerator_create_with_asyncPromise_progress() has been executed
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
 * @member {boolean} TypedArray_process_asyncPromise_running
 *   If true, a .TypedArray_process_asyncPromise_create() is still executing.
 * Please wait it becoming false if wanting to call
 * .TypedArray_process_asyncPromise_create() again.
 *
 * @member {boolean} TypedArray_processOk
 *   If true, a .TypedArray_process_asyncPromise_create() has been executed and
 * succeeded.
 *
 * 
 * @member {boolean} versus_load_asyncPromise_running
 *   If true, a .versus_load_asyncPromise() is still executing. Please wait it
 * becoming false if wanting to call .versus_load_asyncPromise_create() again.
 *
 * @member {boolean} versus_load_asyncGenerator_running
 *   If true, a .versus_load_asyncGenerator() is still executing. Please wait
 * it becoming false if wanting to call .versus_load_asyncGenerator_create()
 * again.
 *
 * @member {ValueMax.Percentage.Aggregate} versus_load_asyncPromise_progress
 *   The progress of loading versus summary, loading versus, creating neural
 * networks. When all the workerProxies initializing, versus summary and
 * versus loading, neural networks creating have done, it should be
 *  ( .versus_load_asyncPromise_progress.valuePercentage == 100 ).
 *   - It is used only if one of the following is called:
 *     - .init_asyncPromise_create() or
 *     - .init_asyncGenerator_create_with_asyncPromise_progress() or
 *     - .versus_load_asyncPromise_create() or
 *     - .versus_load_asyncGenerator_create_with_asyncPromise_progress().
 *   - If .init_asyncGenerator_create() or .versus_load_asyncGenerator_create()
 *       is called, their progressParent parameter will be used instead.
 *
 * @member {boolean} versus_loadOk
 *   If true, a .versus_load_asyncPromise() or .versus_load_asyncGenerator()
 * or .versus_load_asyncGenerator_create_with_asyncPromise_progress()
 * has been executed and succeeded.
 *
 *
 * @see NeuralWorker.Proxies
 *
 */
class NeuralOrchestra_Base extends
  NonReentrant.asyncPromise(
    "TypedArray_process", relay_TypedArray_process_asyncPromise,

  NonReentrant.asyncPromise(
    "alignmentMarkValueArrayArray_set",
    relay_alignmentMarkValueArrayArray_set_asyncPromise,

  NonReentrant.asyncPromise(
    "alignmentMarkValueArrayArray_swap",
    relay_alignmentMarkValueArrayArray_swap_asyncPromise,

  NonReentrant.asyncPromise_by_asyncGenerator(
    "versus_load", relay_versus_load_asyncGenerator,
    null, // Use default versus_load_asyncPromise_progress object.

  NonReentrant.asyncPromise_by_asyncGenerator(
    "init", relay_init_asyncGenerator,
    "versus_load_asyncPromise_progress", // Use versus_load's progress object.

  Recyclable.Root ) ) ) ) ) {

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
        .throw_if_init_asyncPromise_or_asyncGenerator_running
        .call( this, funcNameInMessage );

      NeuralOrchestra_Base
        .throw_if_versus_loading_or_workerProxies_busy
        .call( this, funcNameInMessage );
    }

    NeuralOrchestra_Base.versusResultSender_dispose.call( this );

    NeuralOrchestra_Base.versus_dispose.call( this );
    NeuralOrchestra_Base.versusSummary_dispose.call( this );

    this.workerProxies_initOk = undefined;
    this.workerProxies_init_asyncPromise_running = undefined;
    NeuralOrchestra_Base.neuralNetParamsBase_dispose.call( this );
    NeuralOrchestra_Base.workerProxies_dispose.call( this );

    this.nNeuralWorker_ImplicitInputModeId = undefined;
    this.bLogFetcherEventToConsole = undefined;
    this.downloader_apiKey = undefined;
    this.downloader_spreadsheetId = undefined;

    this.params_loading_retryWaiting = undefined;

    super.disposeResources();
  }


  get sender_clientId() {
    return this.versusResultSender?.clientId;
  }


  get explicit_input_height() {
    return this.neuralNetParamsBase?.explicit_input_height;
  }

  get explicit_input_width() {
    return this.neuralNetParamsBase?.explicit_input_width;
  }

  get explicit_input_channelCount() {
    return this.neuralNetParamsBase?.explicit_input_channelCount;
  }

  get has_implicit_input() {
    return this.neuralNetParamsBase?.has_implicit_input;
  }


  get vocabularyChannelCount() {
    return this.neuralNetParamsBase?.vocabularyChannelCount;
  }

  get vocabularyCountPerInputChannel() {
    return this.neuralNetParamsBase?.vocabularyCountPerInputChannel;
  }


  get blockCountTotalRequested() {
    return this.neuralNetParamsBase?.blockCountTotalRequested;
  }


  get output_channelCount() {
    return this.neuralNetParamsBase?.output_channelCount;
  }

  get output_asInputValueRange() {
    return this.neuralNetParamsBase?.output_asInputValueRange;
  }


  get input_height() {
    return this.workerProxies?.input_height;
  }

  get input_width() {
    return this.workerProxies?.input_width;
  }

  get input_channelCount() {
    return this.workerProxies?.input_channelCount;
  }


  get implicit_input_height() {
    return this.workerProxies?.implicit_input_height;
  }

  get implicit_input_width() {
    return this.workerProxies?.implicit_input_width;
  }

  get implicit_input_channelCount() {
    return this.workerProxies?.implicit_input_channelCount;
  }


  get output_height() {
    return this.workerProxies?.output_height;
  }

  get output_width() {
    return this.workerProxies?.output_width;
  }


  get feedbackShape() {
    return this.workerProxies?.feedbackShape;
  }


  get backendName() {
    return this.workerProxies?.backendName;
  }

  get nNeuralWorker_ModeId() {
    return this.workerProxies?.nNeuralWorker_ModeId;
  }


  get alignmentMarkValueArrayArray() {
    return this.workerProxies?.alignmentMarkValueArrayArray;
  }

  get alignmentMarkValueArrayArray_nonEmpty() {
    return this.workerProxies?.alignmentMarkValueArrayArray_nonEmpty;
  }

  get previous_output_TypedArrayArray() {
    return this.workerProxies?.previous_output_TypedArrayArray;
  }

  get previous_output_TypedArrayArray_nonEmpty() {
    return this.workerProxies?.previous_output_TypedArrayArray_nonEmpty;
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
   * 
   */
  static neuralNetParamsBase_create(
    explicit_input_height = 72,
    explicit_input_width = 128,
    explicit_input_channelCount = 4,

    nNeuralWorker_ImplicitInputModeId
      = NeuralWorker.ImplicitInputMode.Singleton.Ids
          .IMPLICIT_INPUT__FILL_ALIGNMENT_MARK__FILL_PREVIOUS_OUTPUT, // (5)

    vocabularyChannelCount = 4,
    vocabularyCountPerInputChannel = 256,
    blockCountTotalRequested = 39,
    output_channelCount = 64
  ) {

    NeuralOrchestra_Base.neuralNetParamsBase_dispose.call( this );

    const theImplicitInputModeInfo = NeuralWorker.ImplicitInputMode.Singleton
      .getInfo_byId( nNeuralWorker_ImplicitInputModeId );

    const has_implicit_input = theImplicitInputModeInfo.has_implicit_input;

    // Use faster convolution neural network architecture.
    //
    // Although using SHUFFLE_NET_V2_BY_MOBILE_NET_V1_PAD_VALID (6) is even
    // faster, however, using SHUFFLE_NET_V2_BY_MOBILE_NET_V1 (5) is safer
    // because it will not drop the edge pixels of the image to be processed.
    //
    const nConvStageType
      = ValueDesc.ConvStageType.Singleton.Ids.SHUFFLE_NET_V2_BY_MOBILE_NET_V1; // (5)

    const output_asInputValueRange
      = theImplicitInputModeInfo.output_asInputValueRange;

    // The neuralNet should not keep-input-tensor because the input image is
    // created from canvas in real time.
    const bKeepInputTensor = false;

    this.neuralNetParamsBase = NeuralNet.ParamsBase.Pool.get_or_create_by(
      explicit_input_height, explicit_input_width, explicit_input_channelCount,
      has_implicit_input,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      nConvStageType,
      blockCountTotalRequested,
      output_channelCount, output_asInputValueRange,
      bKeepInputTensor
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
   * (This method's parameters are almost the same as .init_asyncGenerator()
   * except without the 1st parameter progressParent because the
   * .versus_load_asyncPromise_progress is used instead.)
   *
   * @return {Promise( AsyncGenerator | { Promise } )}
   *   Return a newly created init_asyncPromise which is an instance of
   * .init_asyncPromise() which will loop .init_asyncGenerator() until done.
   *   - Please see also .init_asyncGenerator() explanation for the promise.
   *   - The .versus_load_asyncPromise_progress could be used to display
   *       progress. When all the workerProxies initializing, versus summary
   *       and versus loading, neural networks creating have done, it should
   *       be ( .versus_load_asyncPromise_progress.valuePercentage == 100 ).
   */
  init_asyncPromise_create(
    downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
    sender_clientId,

    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    nNeuralWorker_ImplicitInputModeId,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    blockCountTotalRequested,
    output_channelCount,

    b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
    init_asyncGenerator_delayPromise,
    versus_load_asyncGenerator_delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage = "init_asyncPromise_create";

      NeuralOrchestra_Base
        .throw_if_versus_loading_or_workerProxies_busy
        .call( this, funcNameInMessage );
    }

    return super.init_asyncPromise_create.apply( this, arguments );
  }

  /**
   * (This method's parameters are the same as .init_asyncGenerator())
   *
   * @return {AsyncGenerator}
   *   Return a newly created init_asyncGenerator which is an instance of
   * .init_asyncGenerator().
   */
  init_asyncGenerator_create( ...restArgs ) {

    { // Checking pre-condition.
      const funcNameInMessage = "init_asyncGenerator_create";

      NeuralOrchestra_Base
        .throw_if_versus_loading_or_workerProxies_busy
        .call( this, funcNameInMessage );
    }

    return super.init_asyncGenerator_create.apply( this, restArgs );
  }

  /**
   * (This method's parameters are almost the same as .init_asyncGenerator()
   * except without the 1st parameter progressParent because the
   * .versus_load_asyncPromise_progress is used instead.)
   *
   * @return {AsyncGenerator}
   *   Return a newly created init_asyncGenerator which is an instance of
   * .init_asyncGenerator().
   */
  init_asyncGenerator_create_with_asyncPromise_progress( ...restArgs ) {

    { // Checking pre-condition.
      const funcNameInMessage
        = "init_asyncGenerator_create_with_asyncPromise_progress";

      NeuralOrchestra_Base
        .throw_if_versus_loading_or_workerProxies_busy
        .call( this, funcNameInMessage );
    }

    return super.init_asyncGenerator_create_with_asyncPromise_progress
      .apply( this, restArgs );
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
   *   A boolean flag determines what this async generater's final awaited
   * .next() returns.
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
   * @yield {Promise( AsyncGenerator | { Promise } )}
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

    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    nNeuralWorker_ImplicitInputModeId,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    blockCountTotalRequested,
    output_channelCount,

    b_return_versus_load_asyncGenerator_instead_of_asyncPromise,
    init_asyncGenerator_delayPromise,
    versus_load_asyncGenerator_delayPromise
  ) {

    try {
      // 0.

      // 0.1
      this.downloader_spreadsheetId = downloader_spreadsheetId;
      this.downloader_apiKey = downloader_apiKey;
      this.bLogFetcherEventToConsole = bLogFetcherEventToConsole;
      this.nNeuralWorker_ImplicitInputModeId = nNeuralWorker_ImplicitInputModeId;

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
          explicit_input_height, explicit_input_width,
          explicit_input_channelCount,
          nNeuralWorker_ImplicitInputModeId,
          vocabularyChannelCount, vocabularyCountPerInputChannel,
          blockCountTotalRequested,
          output_channelCount
        );

        NeuralOrchestra_Base.workerProxies_create.call( this );

        workerProxies_init_asyncPromise
          = NeuralOrchestra_Base.workerProxies_init_async.call( this );

        allPromiseSet.add( workerProxies_init_asyncPromise );
      }

      // 2. Load (versus summary and) versus. Create neural networks.
      let versus_load_asyncGenerator = NeuralOrchestra_Base
        .versus_load_asyncGenerator_create_without_checking_precondition
        .call( this,
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
        // - If versus_load_asyncGenerator.next() resolved, got an
        //     { done, value } object.
        // - If workerProxies_init_asyncPromise resolved, got a boolean value.
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
            // versus_load_asyncGenerator waits .workerProxies_init_asyncPromise
            // internally.
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
   * NeuralOrchestra object. Its .nConvStageTypeId may be modified according
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
        .throw_if_init_asyncPromise_and_asyncGenerator_not_running
        .call( this, funcNameInMessage );

      NeuralOrchestra_Base
        .throw_if_workerProxies_busy_except_workerProxies_init
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
      // and one web worker.
      //
      {
        neuralNetParamsBase
          .nConvStageTypeId_adjust_for_backend_webgl_if_ShuffleNetV2();

        initOkPromise = this.workerProxies.init_async( "webgl",
          NeuralWorker.Mode.Singleton.Ids.ONE_WORKER__TWO_NET, // (0) 
          this.nNeuralWorker_ImplicitInputModeId
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
      // and two web workers by .applier().
      //
      {
        neuralNetParamsBase
          .nConvStageTypeId_adjust_for_backend_cpu_if_ShuffleNetV2();

        initOkPromise = this.workerProxies.init_async( "cpu",
          NeuralWorker.Mode.Singleton.Ids.TWO_WORKER__TWO_NET__APPLIER, // (2) 
          this.nNeuralWorker_ImplicitInputModeId
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
        .throw_if_init_asyncPromise_and_asyncGenerator_not_running
        .call( this, funcNameInMessage );

      NeuralOrchestra_Base
        .throw_if_workerProxies_busy_except_workerProxies_init
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
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
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
   *   An array of every neural network's weights. Every element will be
   * interpreted as Float32Array. Every element will be transferred to web
   * worker (i.e. their .byteLength will become zero).
   *
   * @param {boolean} bLogDryRunTime
   *   If true, the neural network dry-run time will be measured twice and
   * logged to console.
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

      NeuralOrchestra_Base
        .throw_if_workerProxies_busy_except_workerProxies_init
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

    let neuralNet_create_promise
      = this.workerProxies.NeuralNetArray_create_async(
          neuralNetParamsBaseArray, weightArrayBufferArray, bLogDryRunTime );

    let neuralNet_createOk = await neuralNet_create_promise;
    return neuralNet_createOk;
  }


  /**
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  alignmentMarkValueArrayArray_set_asyncPromise_create(
    alignmentMarkValueArrayArray, delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage
        = "alignmentMarkValueArrayArray_set_asyncPromise_create";

      NeuralOrchestra_Base
        .throw_if_not_initOk_or_not_versus_loadOk_or_workerProxies_busy
        .call( this, funcNameInMessage );
    }

    return super
      .alignmentMarkValueArrayArray_set_asyncPromise_create(
        alignmentMarkValueArrayArray, delayPromise );
  }

  /**
   *
   * @param {Uint8ClampedArray[]|Int32Array[]|number[][]} alignmentMarkValueArrayArray
   *   (Please see NeuralWorker.Proxies explanation.)
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, this async method will await
   * it before complete. If null or undefined, no extra delay awaiting.
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  static async alignmentMarkValueArrayArray_set_asyncPromise(
    alignmentMarkValueArrayArray, delayPromise ) {

    try {
      // 1.
      let resultOkPromise
        = this.workerProxies.alignmentMarkValueArrayArray_set_async(
            alignmentMarkValueArrayArray );

      let resultOk = await resultOkPromise;

      // 2.
      if ( delayPromise )
        await delayPromise;

      this.alignmentMarkValueArrayArray_setOk = resultOk;
      return resultOk;

    } catch ( e ) {
      //debugger;
      //console.error( e );
      this.alignmentMarkValueArrayArray_setOk = false;
      throw e;

    } finally {
    }
  }


  /**
   * Swap .alignmentMarkValueArrayArray[ 0 ] and
   * .alignmentMarkValueArrayArray[ 1 ].
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  alignmentMarkValueArrayArray_swap_asyncPromise_create( delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage
        = "alignmentMarkValueArrayArray_swap_asyncPromise_create";

      NeuralOrchestra_Base
        .throw_if_not_initOk_or_not_versus_loadOk_or_workerProxies_busy
        .call( this, funcNameInMessage );
    }

    return super
      .alignmentMarkValueArrayArray_swap_asyncPromise_create( delayPromise );
  }

  /**
   * Swap .alignmentMarkValueArrayArray[ 0 ] and
   * .alignmentMarkValueArrayArray[ 1 ].
   *
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, this async method will await
   * it before complete. If null or undefined, no extra delay awaiting.
   *
   * @return {Promise( boolean )}
   *   Return a promise:
   *   - Resolved to true, if succeeded.
   *   - Resolved to false, if failed.
   */
  static async alignmentMarkValueArrayArray_swap_asyncPromise( delayPromise ) {

    try {
      // 1.
      let resultOkPromise
        = this.workerProxies.alignmentMarkValueArrayArray_swap_async();

      let resultOk = await resultOkPromise;

      // 2.
      if ( delayPromise )
        await delayPromise;

      this.alignmentMarkValueArrayArray_swapOk = resultOk;
      return resultOk;

    } catch ( e ) {
      //debugger;
      //console.error( e );
      this.alignmentMarkValueArrayArray_swapOk = false;
      throw e;

    } finally {
    }
  }


  /**
   *
   * @return {Promise( Float32Array[] | Int32Array[] )}
   *   Return a promise resolved to an array [ TypedArray, TypedArray ]
   * representing the result of the pair of neural networks. The TypedArray may
   * be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ) )
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ) )
   * The order is:
   *   - TypedArrayArray[ 0 ] is parent (chromosome) neural network's output.
   *   - TypedArrayArray[ 1 ] is offspring (chromosome) neural network's output.
   */
  TypedArray_process_asyncPromise_create(
    source_TypedArray, source_height, source_width, delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage = "TypedArray_process_asyncPromise_create";

      NeuralOrchestra_Base
        .throw_if_not_initOk_or_not_versus_loadOk_or_workerProxies_busy
        .call( this, funcNameInMessage );
    }

    return super
      .TypedArray_process_asyncPromise_create(
        source_TypedArray, source_height, source_width, delayPromise );
  }

  /**
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the pair of
   * neural workers. For example, ImageData.data which is coming from a canvas.
   * Note that it may be modified by filling with alignment mark and feedback
   * information (i.e. previous time output of the neural network).
   *
   * @param {number} source_height
   *   The height (in pixels) of the source_TypedArray. For example,
   * ImageData.height.
   *
   * @param {number} source_width
   *   The width (in pixels) of the source_TypedArray. For example,
   * ImageData.width.
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, this async method will await
   * it before complete. If null or undefined, no extra delay awaiting.
   *
   * @return {Promise( Float32Array[] | Int32Array[] )}
   *   Return a promise resolved to an array [ TypedArray, TypedArray ]
   * representing the result of the pair of neural networks. The TypedArray may
   * be:
   *   - Float32Array (if ( neuralNetParams.output_asInputValueRange == false ))
   *   - Int32Array (if ( neuralNetParams.output_asInputValueRange == true ))
   * The order is:
   *   - TypedArrayArray[ 0 ] is parent (chromosome) neural network's output.
   *   - TypedArrayArray[ 1 ] is offspring (chromosome) neural network's output.
   */
  static async TypedArray_process_asyncPromise(
    source_TypedArray, source_height, source_width, delayPromise ) {

    try {
      // 1.
      let theFloat32ArrayArrayPromise
        = this.workerProxies.TypedArray_process_async(
            source_TypedArray, source_height, source_width );

      let theFloat32ArrayArray = await theFloat32ArrayArrayPromise;

      // 2.
      if ( delayPromise )
        await delayPromise;

      this.TypedArray_processOk = true;
      return theFloat32ArrayArray;

    } catch ( e ) {
      //debugger;
      //console.error( e );
      this.TypedArray_processOk = false;
      throw e;

    } finally {
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
   * When wanting to load the next versus with the
   * .versus_load_asyncPromise_progress, call this method and await it
   * resolved.
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, the async method will
   * await it before complete. If null or undefined, no extra delay awaiting.
   *
   * @return {Promise( boolean )}
   *   Return a newly created versus_load_asyncPromise which is an instance
   * of .versus_load_asyncPromise() which will loop
   * .versu_load_asyncGenerator() until done.
   */
  versus_load_asyncPromise_create( delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage = "versus_load_asyncPromise_create";

      NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running
        .call( this, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base
        .throw_if_versus_loading_or_workerProxies_busy_except_workerProxies_init
        .call( this, funcNameInMessage );
    }

    // For outside caller, no workerProxies_init_asyncPromise.
    const workerProxies_init_asyncPromise = null;

    // Note: The same name (i.e. .versus_load_asyncPromise_create()) method
    //       of parent class (i.e. NonReentrant.asyncPromise_by_asyncGenerator)
    //       has one more parameter (i.e. workerProxies_init_asyncPromise).
    return super.versus_load_asyncPromise_create(
      workerProxies_init_asyncPromise, delayPromise );
  }

  /**
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
   *   Return a newly created versus_load_asyncGenerator which is an instance of
   * .versus_load_asyncGenerator().
   */
  versus_load_asyncGenerator_create( progressParent, delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage = "versus_load_asyncGenerator_create";

      NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running
        .call( this, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base
        .throw_if_versus_loading_or_workerProxies_busy_except_workerProxies_init
        .call( this, funcNameInMessage );
    }

    // For outside caller, no workerProxies_init_asyncPromise.
    const workerProxies_init_asyncPromise = null;

    // Note: The same name (i.e. .versus_load_asyncGenerator_create()) method
    //       of parent class (i.e. NonReentrant.asyncPromise_by_asyncGenerator)
    //       has one more parameter (i.e. workerProxies_init_asyncPromise).
    return super.versus_load_asyncGenerator_create(
      progressParent, workerProxies_init_asyncPromise, delayPromise );
  }

  /**
   * When wanting to load the next versus with the
   * .versus_load_asyncPromise_progress, call this method and call .next()
   * until { done: true }.
   *
   * @param {Promise} delayPromise
   *   Mainly used when unit testing. If not null, the async generator will
   * await it before complete. If null or undefined, no extra delay awaiting.
   *
   * @return {AsyncGenerator}
   *   Return a newly created versus_load_asyncGenerator which is an instance of
   * .versus_load_asyncGenerator().
   */
  versus_load_asyncGenerator_create_with_asyncPromise_progress( delayPromise ) {

    { // Checking pre-condition.
      const funcNameInMessage
        = "versus_load_asyncGenerator_create_with_asyncPromise_progress";

      NeuralOrchestra_Base.throw_if_init_asyncPromise_or_asyncGenerator_running
        .call( this, funcNameInMessage );

      NeuralOrchestra_Base.throw_if_not_initOk.call( this, funcNameInMessage );

      // Prevent the nueral networks from being changed during they are processing.
      NeuralOrchestra_Base
        .throw_if_versus_loading_or_workerProxies_busy_except_workerProxies_init
        .call( this, funcNameInMessage );
    }

    // For outside caller, no workerProxies_init_asyncPromise.
    const workerProxies_init_asyncPromise = null;

    // Note: The same name (i.e. .versus_load_asyncGenerator_create()) method
    //       of parent class (i.e. NonReentrant.asyncPromise_by_asyncGenerator)
    //       has one more parameter (i.e. workerProxies_init_asyncPromise).
    return super.versus_load_asyncGenerator_create_with_asyncPromise_progress(
      workerProxies_init_asyncPromise, delayPromise );
  }

  /**
   *
   * 1.
   *
   * Please call .versus_load_asyncPromise_create() or
   * .versus_load_asyncGenerator_create() to create this generator.
   *
   * When this generator is executing, it should not be created another
   * instance. Please do that after the executing generator done.
   *
   *
   * 2. 
   *
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
   * 3. Progress
   *
   * When advancing progress to 100%, .versus_load_asyncGenerator_running
   * has not yet been set to false. So, in fact, caller can not re-execute
   * this generator immediately when progress become 100%. Awaiting the
   * finale .next() to { done: true, value } is more reliable.
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
   *   The instance of .workerProxies_init_async().
   *   - If not null, it awaited before creating neural networks.
   *     - This case is used by .init_asyncGenerator() (i.e. internal caller).
   *   - If null, the .initOk must already be true.
   *     - This case is used by .versus_load_asyncPromise_create() and
   *         .versus_load_asyncGenerator_create() (i.e. outside caller).
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

    let progressRoot;
    let progressToAdvance;
    let neuralNet_createOk;
    try {
      // 0.

      // 0.1 Determine whether necessary to load versus summary.
      let versusSummary_needLoad;
      if ( this.versusSummary ) {
        if ( this.versusSummary.rangeArray_loadOk ) {
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
          ValueMax.Percentage.Aggregate.Pool.get_or_create_by( 2 ) );
      }

      let progressVersus = progressParent.child_add(
        ValueMax.Percentage.Aggregate.Pool.get_or_create_by( 4 ) );

      progressToAdvance = progressParent.child_add(
        ValueMax.Percentage.Concrete.Pool.get_or_create_by( 2, 1 ) );

      // 1. Load versus summary.
      if ( versusSummary_needLoad ) {
        let versusSummary_rangeArray_loadOk
          = yield *this.versusSummary.rangeArray_load_asyncGenerator_create(
              progressVersusSummary, this.params_loading_retryWaiting );

        if ( !versusSummary_rangeArray_loadOk )
          throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
            + `Failed to load DEvolution.VersusSummary.rangeArray.`
          );
      }

      // 2. Load versus.
      NeuralOrchestra_Base.versus_dispose.call( this );
      this.versus
        = yield* this.versusSummary.versus_next_load_asyncGenerator_create(
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

      // 5.
      if ( neuralNet_createOk ) {
        this.versus_loadOk = true;

        // Only if neural networks created successfully, advance progress to 100%.
        progressToAdvance.value_advance();
        yield progressRoot;

      } else {
        this.versus_loadOk = false;
      }

      return this.versus_loadOk;

    } catch ( e ) {
      //debugger;
      this.versus_loadOk = false;
      throw e;

    } finally {
    }
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
   * Note: The resolved .TypedArray_process_asyncPromise_create() is an
   *       Float32Array[] or Int32Array[].
   *
   *   - Which one is parent (chromosome) neural network's output?
   *     - Float32Array[ 0 ] (or Int32Array[ 0 ])
   *
   *   - Which one is offspring (chromosome) neural network's output?
   *     - Float32Array[ 1 ] (or Int32Array[ 1 ])
   *
   *
   * @param {number} n1_0_p1
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
  versusResultSender_send( n1_0_p1 ) {

    const funcNameInMessage = "versusResultSender_send";
    { // Checking pre-condition.

      // Prevent from .versusResultSender not existed.
      NeuralOrchestra_Base
        .throw_if_init_asyncPromise_or_asyncGenerator_running
        .call( this, funcNameInMessage );
      NeuralOrchestra_Base
        .throw_if_not_initOk
        .call( this, funcNameInMessage );

      // Prevent from .versus not existed.
      NeuralOrchestra_Base
        .throw_if_versus_load_asyncPromise_or_asyncGenerator_running
        .call( this, funcNameInMessage );
      NeuralOrchestra_Base
        .throw_if_not_versus_loadOk
        .call( this, funcNameInMessage );
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
      this.versus.versusId, n1_0_p1 );
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
  static throw_if_workerProxies_init_asyncPromise_running( funcNameInMessage ) {
    if ( this.workerProxies_init_asyncPromise_running )
      throw Error( `NeuralOrchestra.Base.${funcNameInMessage}(): `
        + `should not be executed while `
        + `NeuralWorker.Proxies is still initializing.` );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_workerProxies_busy_except_workerProxies_init(
    funcNameInMessage ) {

    NeuralOrchestra_Base
      .throw_if_alignmentMarkValueArrayArray_set_asyncPromise_running
      .call( this, funcNameInMessage );

    NeuralOrchestra_Base
      .throw_if_alignmentMarkValueArrayArray_swap_asyncPromise_running
      .call( this, funcNameInMessage );

    NeuralOrchestra_Base
      .throw_if_TypedArray_process_asyncPromise_running
      .call( this, funcNameInMessage );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_workerProxies_busy( funcNameInMessage ) {
    NeuralOrchestra_Base
      .throw_if_workerProxies_init_asyncPromise_running
      .call( this, funcNameInMessage );
    NeuralOrchestra_Base
      .throw_if_workerProxies_busy_except_workerProxies_init
      .call( this, funcNameInMessage );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_versus_loading_or_workerProxies_busy_except_workerProxies_init(
    funcNameInMessage ) {

    NeuralOrchestra_Base
      .throw_if_workerProxies_busy_except_workerProxies_init
      .call( this, funcNameInMessage );
    NeuralOrchestra_Base
      .throw_if_versus_load_asyncPromise_or_asyncGenerator_running
      .call( this, funcNameInMessage );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_versus_loading_or_workerProxies_busy( funcNameInMessage ) {
    NeuralOrchestra_Base
      .throw_if_workerProxies_busy
      .call( this, funcNameInMessage );
    NeuralOrchestra_Base
      .throw_if_versus_load_asyncPromise_or_asyncGenerator_running
      .call( this, funcNameInMessage );
  }

  /**
   * @param {NeuralOrchestra_Base} this
   * @param {string} funcNameInMessage   The caller function name. (e.g. init_async)
   */
  static throw_if_not_initOk_or_not_versus_loadOk_or_workerProxies_busy(
    funcNameInMessage ) {

    NeuralOrchestra_Base
      .throw_if_init_asyncPromise_or_asyncGenerator_running
      .call( this, funcNameInMessage );

    NeuralOrchestra_Base
      .throw_if_versus_loading_or_workerProxies_busy
      .call( this, funcNameInMessage );

    NeuralOrchestra_Base
      .throw_if_not_initOk
      .call( this, funcNameInMessage );

    NeuralOrchestra_Base
      .throw_if_not_versus_loadOk
      .call( this, funcNameInMessage );
  }

}


/**
 * @param {NeuralOrchestra_Base} this
 *
 * @return {AsyncGenerator}
 *   Return the newly created instance of
 * NeuralOrchestra_Base.init_asyncGenerator().
 */
function relay_init_asyncGenerator() {
  return NeuralOrchestra_Base.init_asyncGenerator.apply( this, arguments );
}

/**
 * @param {NeuralOrchestra_Base} this
 *
 * @return {Promise}
 *   Return the newly created instance of
 * NeuralOrchestra_Base.alignmentMarkValueArrayArray_set_asyncPromise().
 */
function relay_alignmentMarkValueArrayArray_set_asyncPromise() {
  return NeuralOrchestra_Base.alignmentMarkValueArrayArray_set_asyncPromise
    .apply( this, arguments );
}

/**
 * @param {NeuralOrchestra_Base} this
 *
 * @return {Promise}
 *   Return the newly created instance of
 * NeuralOrchestra_Base.alignmentMarkValueArrayArray_swap_asyncPromise().
 */
function relay_alignmentMarkValueArrayArray_swap_asyncPromise() {
  return NeuralOrchestra_Base.alignmentMarkValueArrayArray_swap_asyncPromise
    .apply( this, arguments );
}

/**
 * @param {NeuralOrchestra_Base} this
 *
 * @return {Promise}
 *   Return the newly created instance of
 * NeuralOrchestra_Base.TypedArray_process_asyncPromise().
 */
function relay_TypedArray_process_asyncPromise() {
  return NeuralOrchestra_Base.TypedArray_process_asyncPromise
    .apply( this, arguments );
}

/**
 * @param {NeuralOrchestra_Base} this
 *
 * @return {AsyncGenerator}
 *   Return the newly created instance of
 * NeuralOrchestra_Base.versus_load_asyncGenerator().
 */
function relay_versus_load_asyncGenerator() {
  return NeuralOrchestra_Base.versus_load_asyncGenerator
    .apply( this, arguments );
}
