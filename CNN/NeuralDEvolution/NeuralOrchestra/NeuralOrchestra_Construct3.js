export { NeuralOrchestra_Construct3 as Construct3 };

import * as PartTime from "../../util/PartTime.js";
import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
// import * as ValueDesc from "../../Unpacker/ValueDesc.js";
// import * as NeuralNet from "../../Conv/NeuralNet.js";
//import * as DEvolution from "../DEvolution.js";
import { Base as NeuralOrchestra_Base } from "./NeuralOrchestra_Base.js";

/**
 * Orchestrate neural networks with differential evolution, and inter-operate
 * with Construct3 Game Engine.
 *
 *
 * @member {boolean} Fighter_bManualMode
 *   If true, there is no neural network be created. (Note: DrawingCanvas will
 * always be painted no mater how this flag is.)
 *
 *
 * @member {Object} configJSONData
 *   A configuration object comes from Construct3 by .ConfigJSON_set().
 *
 * @member {Object} configJSONData.DrawingCanvas
 *   Configuration for DrawingCanvas.
 *
 * @member {string} configJSONData.DrawingCanvas.ObjectTypeName
 *   The IDrawingCanvasInstance's ObjectType name in Construct3.
 *
 * @member {string[]} configJSONData.DrawingCanvas.ObjectTypeNameArray
 *   All ObjectType names (in Construct3) whose all instances will be pasted
 * onto the DrawingCanvas every game tick.
 *
 * @member {number} configJSONData.AI.intervalSeconds
 *   How many time (in seconds) should be past before the next AI processing.
 *
 *
 * @member {Construct3.IDrawingCanvasInstance} DrawingCanvas
 *   The IDrawingCanvasInstance (in Construct3) to be used for painting all
 * game instances which will be seen by the neural network.
 *
 * @member {number[]} DrawingCanvas_clearColor
 *   A four elements number array [ 0, 0, 0, 1 ] representing the RGBA color
 * for clearing the DrawingCanvas before painting any instances.
 *
 * @member {Construct3.IInstance[]} DrawingCanvas_pasteInstanceArray
 *   The Construct3 game objects which has been painted recently.
 *
 * @member {Promise( ImageData )} DrawingCanvas_pasteInstancesPromise
 *   If not null, the DrawingCanvas is still painting (and may be also getting image
 * data) currently.
 * 
 *
 * @member {boolean} AI_bTurnOn
 *   Whether activate AI. Only meaningful if ( .Fighter_bManualMode == false ).
 * Usually, it is set to true when in Versus_Step_Xxx_Fighting state.
 * If true,
 *   - An image data will be got from the DrawingCanvas when:
 *     - DrawingCanvas.pasteInstances() has done. And,
 *     - The previous AI processing has done. And,
 *     - At least configJSONData.AI.intervalSeconds elapsed after the previous
 *        AI processing.
 *   - Then, the image data will be sent to the neural network. The result will
 *       be used to modify KeyDownArray.
 *
 * @member {number} AI_gameTime_beginSeconds
 *   The beginning game time (in seconds) of the AI processing.
 *
 * @member {number} AI_gameTime_endSeconds
 *   The ending game time (in seconds) of the AI processing.
 *   - If ( !( AI_gameTime_endSeconds >= 0 ) ), it means an AI processing is
 *       still going and has not yet done.
 *   - If ( AI_gameTime_endSeconds >= 0 ), it means there is no AI processing
 *       currently.
 *
 * @member {boolean} AI_processing
 *   True, if ( !( AI_gameTime_endSeconds >= 0 ) ), it means an AI processing
 * is still going and has not yet done.
 */
class NeuralOrchestra_Construct3 extends Recyclable.Root {

  /**
   * Used as default NeuralOrchestra.Construct3 provider for conforming to
   * Recyclable interface.
   */
  static Pool = new Pool.Root( "NeuralOrchestra.Construct3.Pool",
    NeuralOrchestra_Construct3, NeuralOrchestra_Construct3.setAsConstructor );

  /** */
  constructor() {
    super();
    NeuralOrchestra_Construct3.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    NeuralOrchestra_Construct3.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.base = new NeuralOrchestra_Base();
  }

  get AI_processing() {
    if ( !( this.AI_gameTime_endSeconds >= 0 ) )
      return true;
    // Note: It works even if ( .AI_gameTime_endSeconds == undefined ).
    return false;
  }

  /** @override */
  disposeResources() {

//!!! ...unfinished... (2023/05/28)
// should clear all data members.

    this.alignmentMarkArrayArray_operate_done = undefined;

    this.AI_gameTime_endSeconds = undefined;
    this.AI_gameTime_beginSeconds = undefined;
    this.AI_bTurnOn = undefined;    

    this.DrawingCanvas_pasteInstancesPromise = undefined;
    this.DrawingCanvas_pasteInstanceArray = undefined;
    this.DrawingCanvas_clearColor = undefined;
    this.DrawingCanvas = undefined;

    this.configJSONData = undefined;

    this.versus_load_asyncGeneratorTicker = undefined;
    this.versus_load_asyncGenerator = undefined;

    this.init_asyncPromise = undefined;

    this.Fighter_bManualMode = undefined;

    if ( this.base ) {
      this.base.disposeResources_and_recycleToPool();
      this.base = undefined;
    }
    super.disposeResources();
  }

  /**
   * Please call this method in Construct3's runOnStartup().
   * 
   *   - runtime.globalVars.Fighter_bManualMode: If true, there is no neural
   *       network be created.
   *
   *
   * 
   * @param {Object} runtime
   *   Construct3 game engine runtime.
   *
   * @param {boolean} runtime.globalVars.Fighter_bManualMode
   *   If true, there is no neural network be created.
   *
   * @return {Promise( boolean )}
   *   Return a promise. It resolves to true, if successful.
   */
  async init_for_Construct3_runOnStartup_async(
    runtime,

    downloader_spreadsheetId, bLogFetcherEventToConsole,
    sender_clientId,

    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    nNeuralWorker_ImplicitInputModeId,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    blockCountTotalRequested,
    output_channelCount
  ) {

    this.Fighter_bManualMode = runtime.globalVars.Fighter_bManualMode;
    if ( this.Fighter_bManualMode ) {
      this.AI_bTurnOn = false; // Always no AI because no neural network.
      return true; // Init still ok.
    }

    const base = this.base;

    const downloader_apiKey = null;
    const b_return_versus_load_asyncGenerator_instead_of_asyncPromise = true;

    let init_asyncPromise = this.init_asyncPromise
      = base.init_asyncPromise_create(
        downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
        sender_clientId,

        explicit_input_height, explicit_input_width, explicit_input_channelCount,
        nNeuralWorker_ImplicitInputModeId,
        vocabularyChannelCount, vocabularyCountPerInputChannel,
        blockCountTotalRequested,
        output_channelCount,

        b_return_versus_load_asyncGenerator_instead_of_asyncPromise
      );

    let versus_load_asyncGenerator = await init_asyncPromise;
    this.versus_load_asyncGenerator = versus_load_asyncGenerator;

    const gameTime_initSeconds = runtime.gameTime;

//!!! (2023/05/29 Temp Remarked) This is not necessary.
//     // So that it looks like that AI is not processing now.
//     this.AI_gameTime_beginSeconds = gameTime_initSeconds;
//     this.AI_gameTime_endSeconds = gameTime_initSeconds;

    this.init_asyncPromise = null;

    return base.initOk;
  }

  /**
   * Usually, call this method inside Construct3's .OnAfterProjectStart() event
   * because the ConfigJSON has not been initilized until the Construct3's
   * "On start of layout" event.
   *
   *
   * @param {Construct3.IJSONInstance} aIJSONInstance
   *   A Construct3 JSON plugin which defines the game configuration.
   */
  ConfigJSON_set( aIJSONInstance ) {

    const configJSONData = this.configJSONData
      = aIJSONInstance.getJsonDataCopy();

    const runtime = aIJSONInstance.runtime;

    // Note: The reason why to provide ObjectTypeName from Construct3's Event
    //       Sheet is that here needs not change even if these names are
    //       changed in Construct3.
    {
      const DrawingCanvas_ObjectTypeName
        = configJSONData.DrawingCanvas.ObjectTypeName;

      const DrawingCanvas = this.DrawingCanvas // IDrawingCanvasInstance
        = runtime.objects[ DrawingCanvas_ObjectTypeName ].getFirstInstance();

      this.DrawingCanvas_clearColor = [ 0, 0, 0, 1 ]; // RGBA. Black opacity.
      this.DrawingCanvas_pasteInstanceArray = []; // For reducing memory re-allocation.

      //!!! ...unfinished... (2023/05/29)
      // DrawingCanvas.addEventListener( "resolutionchange",
      //  NeuralOrchestra_Construct3.Xxx.bind( this ) )
    }
  }

  /**
   * Called by Construct3 game engine every game tick.
   *
   *   - runtime.globalVars.Versus_Step_X_Yyy: The defined step constants.
   *
   *   - runtime.globalVars.Versus_Step_Current: The current game step. It's
   *       value should be one of runtime.globalVars.Versus_Step_X_Yyy
   *
   *
   * @param {Object} runtime
   *   Construct3 game engine runtime.
   *
   */
  tick( runtime ) {

    // Note: Still draw canvas even if ( Fighter_bManualMode == true ).
    NeuralOrchestra_Construct3.DrawingCanvas_paint_async.call( this );

    if ( this.Fighter_bManualMode )
      return; // No neural network to operate.

    let pfnStep = NeuralOrchestra_Construct3.Versus_Step_Function_Array[
      runtime.globalVars.Versus_Step_Current ];

//!!! ...unfinished... (2023/04/09)
// Perhaps, let the returned valud of pfnStep() representing the new state id.
// So that they can determine going to which state.
// If undefined, means do not change state.
    pfnStep.call( this, runtime );
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static async DrawingCanvas_paint_async() {
    const DrawingCanvas = this.DrawingCanvas;
    if ( !DrawingCanvas )
      return; // No canvas to paint.

    if ( this.DrawingCanvas_pasteInstancesPromise )
      return; // Previous painting has not yet completed. Do not paint again.

    const runtime = DrawingCanvas.runtime;

    // Clear to background color.
    DrawingCanvas.clearCanvas( this.DrawingCanvas_clearColor );

    // Paste all specified ObjectType's instances onto the DrawingCanvas.
    let pasteInstancesPromise;
    {
      const ObjectTypeNameArray
        = this.configJSONData.DrawingCanvas.ObjectTypeNameArray;

      const pasteInstanceArray = this.DrawingCanvas_pasteInstanceArray;
      pasteInstanceArray.length = 0;
      for ( let i = 0; i < ObjectTypeNameArray.length; ++i ) {
        const ObjectTypeName = ObjectTypeNameArray[ i ];
        const ObjectType = runtime.objects[ ObjectTypeName ];
        pasteInstanceArray.push( ...ObjectType.instances() );
      }
  
      pasteInstancesPromise = this.DrawingCanvas_pasteInstancesPromise
        = DrawingCanvas.pasteInstances( pasteInstanceArray );
    }

    await pasteInstancesPromise;

    // After painting compeletd, get the whole image and process it.
    {
      let getImagePixelData_asyncPromise = NeuralOrchestra_Construct3
        .DrawingCanvas_getImagePixelData_asyncPromise_create
        .call( this );

      if ( getImagePixelData_asyncPromise ) {
        // Only if necessary, wait for the image.
        let aImageData = await getImagePixelData_asyncPromise;

        // After ImageData got, process it by neural network.
        //
        // Note: Do not await it.
        //
        // Q: Why not await image data processing before return?
        // A: So that the next .DrawingCanvas_paint_async() will not be blocked
        //    by the image processing.
        NeuralOrchestra_Construct3.DrawingCanvas_process_by_AI_async
          .call( this, runtime, aImageData );
      }
    }

    // After image data got, the next painting is allowed.
    //
    // Note: When DrawingCanvas.getImagePixelData() is pending, do not continue
    //       to .pasteInstances(). Otherwise, the .getImagePixelData() will be
    //       always pending (i.e. never fulfilled).
    this.DrawingCanvas_pasteInstancesPromise = null;
  }

  /**
   * The following data members might be modified by this method: 
   *   - .AI_gameTime_beginSeconds
   *   - .AI_gameTime_endSeconds
   *
   *
   * Q: Why does this method just return a promise? Why does not it just await
   *    the promise by itself?
   * A: So that the caller .DrawingCanvas_paint_async() can use lesser await
   *    (i.e. use await only if necessary). Lesser await improve performance
   *    because every await pauses execution to next Browser tick.
   *
   *
   * @param {NeuralOrchestra_Construct3} this
   *
   * @return {Promise( ImageData )}
   *   Return a promise (resolved to ImageData), if AI can process the image.
   * Return null, if AI can not or needs not process image.
   */
  static DrawingCanvas_getImagePixelData_asyncPromise_create() {
    if ( !this.AI_bTurnOn )
      return null; // No need to get image since AI is not activated.

    const DrawingCanvas = this.DrawingCanvas;
    if ( !DrawingCanvas )
      return null; // No canvas to get image.

    if ( !this.alignmentMarkArrayArray_operate_done )
      return null; // AI can not process image if alignment marks not yet ready.

    const AI_intervalSeconds = this.configJSONData?.AI?.intervalSeconds;
    if ( !( AI_intervalSeconds >= 0 ) )
      return null; // No interval means no need. At least, should be 0 seconds.

    if ( this.AI_processing )
      return null; // Previous AI processing has not yet completed.

    const runtime = DrawingCanvas.runtime;
    const gameTime_beginSeconds = runtime.gameTime;
    const gameTime_deltaSeconds
      = gameTime_beginSeconds - this.AI_gameTime_endSeconds;

    // Check whether has pass enough time (in seconds)
    //
    // Note: This works even if ( .AI_gameTime_endSeconds == undefined ).
    //       It will be viewed as elapsed time is enough to do the next AI
    //       processing.
    if ( !( gameTime_deltaSeconds >= AI_intervalSeconds ) )
      return null; // Need wait for more time elapsed.

    this.AI_gameTime_beginSeconds = gameTime_beginSeconds;
    this.AI_gameTime_endSeconds = undefined;

    // Q: What if DrawingCanvas resolution changed during .getImagePixelData()?
    //    Wheteher will getImagePixelDataPromise never resolve?
    //
    // A: It is very likely that nothing special needs to be taken for
    //    resolution change because DrawingCanvas will only be recreated
    //    automatically when the first time painting after resolution changed.
    //
    let getImagePixelData_asyncPromise = DrawingCanvas.getImagePixelData();
    return getImagePixelData_asyncPromise;
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   *
   * @param {Object} runtime
   *   Construct3 game engine runtime.
   *
   * @param {ImageData} aImageData
   *   The image data to be processed by neural networks.
   */
  static async DrawingCanvas_process_by_AI_async( runtime, aImageData ) {
    if ( !this.AI_bTurnOn )
      return; // No need to process image since AI is not activated.

    if ( !this.AI_processing )
      return; // Must have started an uncompleted AI processing.

    if ( !runtime )
      return; // No Construct3 game engine runtime to report result.

    if ( !aImageData )
      return; // No image data to process.

    // Ensure alignment marks set or swapped.
    //
    // Q: Why not await a promise?
    // A: Because awaiting always pause execution (until next Browser tick)
    //    which reduces performance a little.
    if ( !this.alignmentMarkArrayArray_operate_done )
      return; // AI can not process image if alignment marks not yet ready.

    // Process image data.
    const base = this.base;
    const source_TypedArray = aImageData.data;
    const source_height = aImageData.height;
    const source_width = aImageData.width;

    let TypedArray_process_asyncPromise
      = base.TypedArray_process_asyncPromise_create(
          source_TypedArray, source_height, source_width );

    let Int32ArrayArray = await TypedArray_process_asyncPromise;

    // If AI is still turned on,, apply processing result to KeyDownArray.
    if ( this.AI_bTurnOn ) {

//!!! ...unfinished... (2023/05/30)
// If still ( this.AI_bTurnOn == true ), apply processing result to KeyDownArray


    // Otherwise, the AI has been turned off during the processing (e.g. game
    // is over). No need to apply to KeyDownArray.
    }

    // To allow the next AI processing.
    const gameTime_endSeconds = runtime.gameTime;
    this.AI_gameTime_endSeconds = gameTime_endSeconds;
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_00_DownloadWeights_Begin( runtime ) {
    //const base = this.base;

    if ( !this.versus_load_asyncGeneratorTicker ) {
      let versus_load_asyncGenerator = this.versus_load_asyncGenerator;
      this.versus_load_asyncGeneratorTicker
        = new PartTime.AsyncGeneratorTicker( versus_load_asyncGenerator );
    }
  }

  /**
   * When neural networks weights are dowloading, the following variables
   * will be set by this method:
   *
   *   - runtime.globalVars.Versus_DownloadWeights_Progress (number)
   *
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_01_DownloadWeights_Loading( runtime ) {
    const base = this.base;

//!!! ...unfinished... (2022/12/29) AbortSignal.timeout()?
// If downloading is failed (e.g. timeout), display message and re-try downloading.

//!!! ...unfinished... (2023/03/10)
// Perhaps, check this.versus_load_progress
// (may be loading versusSummary + versus, or loading versus only.)


//!!! ...unfinished... (2023/04/08)
// Since this should inside a requestAnimationFrame() callback.
// Update progress to UI. And then, call versus_load_asyncGenerator.next()
//

//!!! ...unfinished... (2023/05/24)
    //update_to_UI();

    runtime.globalVars.Versus_DownloadWeights_Progress
      = base.versus_load_asyncPromise_progress.valuePercentage;

    // If versus loaded, change to the next state.
    if ( this.versus_load_asyncGeneratorTicker.done() ) {
      ++runtime.globalVars.Versus_Step_Current;
    }
  }

  /**
   * When neural networks weights dowloading finished, the following variables
   * will be set by this method:
   *
   *   - runtime.globalVars.Versus_EntityNo (string)
   *   - runtime.globalVars.Versus_Parent_GenerationNo (string)
   *   - runtime.globalVars.Versus_Offspring_GenerationNo (string)
   *   - runtime.globalVars.Versus_Parent_WinCount (number)
   *
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_02_DownloadWeights_End( runtime ) {

    // So that ticker could be created when the next time downloading.
    this.versus_load_asyncGeneratorTicker = null;

    const base = this.base;

    let versus = base.versus;
    if ( !versus )
      return;

    let versusId = versus.versusId;
    if ( !versusId )
      return;

    runtime.globalVars.Versus_EntityNo = versusId.entityNoString; // (string)

    runtime.globalVars.Versus_Parent_GenerationNo
      = versusId.parentGenerationNoString; // (string)

    runtime.globalVars.Versus_Offspring_GenerationNo
      = versusId.offspringGenerationNoString; // (string)

    runtime.globalVars.Versus_Parent_WinCount
      = versusId.parentWinCount; // (number)
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_03_ParentAlignment0_WaitVersusInfo( runtime ) {
    const base = this.base;

    {
//!!! ...unfinished... (2023/05/29)
// How to await alignment mark setting?
//
//     let alignmentMarkArrayArray_set_asyncPromise
//       = base.alignmentMarkArrayArray_set_asyncPromise_create( ??? );

      this.alignmentMarkArrayArray_operate_done = undefined;
      alignmentMarkArrayArray_set_asyncPromise.then( bSetOk => {
        this.alignmentMarkArrayArray_operate_done = bSetOk;
      } );
    }

//!!! ...unfinished... (2023/05/29)
// Clear KeyDownArray


  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_04_ParentAlignment0_WaitDrawingCanvas( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }


  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_05_ParentAlignment0_Fighting( runtime ) {

//!!! ...unfinished... (2023/05/29)
    if ( !this.AI_bTurnOn )
      this.AI_bTurnOn = true;

//!!! ...unfinished... (2023/04/14)
// Perhaps, use IBinaryDataInstance to recurrent output to game scene.
// So, set IWorldIntance.colorRga[] of game object.
//
// Get ImageData from DrawCanvas. Fill recurrent output into
// ImageData.data (Uint8ClampedArray) directly.

//!!! ...unfinished... (2023/05/24)
//    let theDrawingCanvas = runtime.objects.DrawingCanvas.getFirstInstance();

//!!! ...unfinished... (2023/05/26)
// Every tick should theDrawingCanvas.PasteInstances()
// and await it for getting completed image.
//
// But not every tick call neural network's .TypedArray_process().
// Call .TypedArray_process() only if:
//   - theDrawingCanvas.PasteInstances() promise resolved.
//   - Previous .TypedArray_process() has done.
//   - A specific elapsed time has gone after the time of the previous
//        .TypedArray_process() done.

  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_06_ParentAlignment0_End( runtime ) {

//!!! ...unfinished... (2023/05/29)
    this.AI_bTurnOn = false;


  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
 static Versus_Step_07_ParentAlignment1_WaitVersusInfo( runtime ) {

    {
//!!! ...unfinished... (2023/05/29)
// How to await alignment mark swapping?
//
// let alignmentMarkArrayArray_swap_asyncPromise
//     = base.alignmentMarkArrayArray_swap_asyncPromise_create( ??? );

      this.alignmentMarkArrayArray_operate_done = undefined;
      alignmentMarkArrayArray_swap_asyncPromise.then( bSwappedOk => {
        this.alignmentMarkArrayArray_operate_done = bSwappedOk;
      } );
    }

//!!! ...unfinished... (2023/05/29)
// Clear KeyDownArray

  }
  
  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_08_ParentAlignment1_WaitDrawingCanvas( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_09_ParentAlignment1_Fighting( runtime ) {

//!!! ...unfinished... (2023/05/29)
    if ( !this.AI_bTurnOn )
      this.AI_bTurnOn = true;


//!!! ...unfinished... (2022/10/27)

//!!! ...unfinished... (2023/03/16)
// Q: How to convert neural network output floating-point number to
//    control signal (i.e. 0 or 1)?
// A: Using remainder operation (e.g. ( output % 2 ) ) seems relying
//    the least significant bit (i.e. bit 0) too much. Perhaps, using
//    threshold (e.g. ( >= 2 ) or ( < 2 ) ) is better.
//

  }

  /**
   * This method will send versus result to game server.
   *
   *   - runtime.globalVars should have Versus result.
   *       (-1: Offspring win. 0: Parent and Offspring draw. +1: Parent win.)
   *
   *   - runtime.globalVars.Versus_Result_ParentAlignment0
   *       The versus result when Parent personates alignment 0.
   *
   *   - runtime.globalVars.Versus_Result_ParentAlignment1
   *       The versus result when Parent personates alignment 1.
   *
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_10_ParentAlignment1_End( runtime ) {

//!!! ...unfinished... (2023/05/29)
    this.AI_bTurnOn = false;

//!!! ...unfinished... (2022/10/28)
// Perhaps, start downloading the next versus here, too.

//!!! ...unfinished... (2023/03/10)
// Perhaps, call this.versus_next_load_async(),
// and then change state to Versus_Step_00_DownloadWeights_Begin.

  }

}

/** */
NeuralOrchestra_Construct3.Versus_Step_Function_Array = [
  NeuralOrchestra_Construct3.Versus_Step_00_DownloadWeights_Begin,
  NeuralOrchestra_Construct3.Versus_Step_01_DownloadWeights_Loading,
  NeuralOrchestra_Construct3.Versus_Step_02_DownloadWeights_End,
  NeuralOrchestra_Construct3.Versus_Step_03_ParentAlignment0_WaitVersusInfo,
  NeuralOrchestra_Construct3.Versus_Step_04_ParentAlignment0_WaitDrawingCanvas,
  NeuralOrchestra_Construct3.Versus_Step_05_ParentAlignment0_Fighting,
  NeuralOrchestra_Construct3.Versus_Step_06_ParentAlignment0_End,
  NeuralOrchestra_Construct3.Versus_Step_07_ParentAlignment1_WaitVersusInfo,
  NeuralOrchestra_Construct3.Versus_Step_08_ParentAlignment1_WaitDrawingCanvas,
  NeuralOrchestra_Construct3.Versus_Step_09_ParentAlignment1_Fighting,
  NeuralOrchestra_Construct3.Versus_Step_10_ParentAlignment1_End,
];
