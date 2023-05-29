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
 * @member {number} AI_gameTime_previous_beginSeconds
 *   The beginning game time (in seconds) of the previous AI processing.
 *   - If ( AI_gameTime_previous_beginSeconds == undefined ), it means there is
 *       no AI processing currently.
 *
 * @member {number} AI_gameTime_previous_endSeconds
 *   The ending game time (in seconds) of the previous AI processing.
 *   - If ( AI_gameTime_previous_beginSeconds >= 0 ) but
 *       ( AI_gameTime_previous_endSeconds == undefined ), it means an AI
 *       processing is still going and has not yet done.
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

  /** @override */
  disposeResources() {

//!!! ...unfinished... (2023/05/28)
// should clear all data members.


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

    let init_asyncPromise = base.init_asyncPromise_create(
      downloader_spreadsheetId, downloader_apiKey, bLogFetcherEventToConsole,
      sender_clientId,

      explicit_input_height, explicit_input_width, explicit_input_channelCount,
      nNeuralWorker_ImplicitInputModeId,
      vocabularyChannelCount, vocabularyCountPerInputChannel,
      blockCountTotalRequested,
      output_channelCount,

      b_return_versus_load_asyncGenerator_instead_of_asyncPromise
    );

    this.init_asyncPromise = init_asyncPromise;

    let versus_load_asyncGenerator = await init_asyncPromise;
    this.versus_load_asyncGenerator = versus_load_asyncGenerator;

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

    {
      const DrawingCanvas_ObjectTypeName
        = configJSONData.DrawingCanvas.ObjectTypeName;

      this.DrawingCanvas // IDrawingCanvasInstance
        = runtime.objects[ DrawingCanvas_ObjectTypeName ].getFirstInstance();

      this.DrawingCanvas_clearColor = [ 0, 0, 0, 1 ]; // RGBA. Black opacity.
      this.DrawingCanvas_pasteInstanceArray = []; // For reducing memory re-allocation.
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

    NeuralOrchestra_Construct3.DrawingCanvas_paint_async.call( this );

//!!! ...unfinished... (2023/05/27)
// Still draw canvas when ( Fighter_bManualMode == true )
//
// Perhaps, specify IWorldInstance to be drawn by layer (e.g. by layer number).
// Problem: Some instances of the layer is not necessary to be drawn.
//          Perhaps, use visible flag of every instance. But, what the drawing
//          order?
//
// So, giving ObjectType name list should be better.
// Perhaps, in Construct3, use push names (by ObjectClass.ObjectTypeName) of
// object types (of DrawingCanvas and objects to be drawn onto DrawinCanvas)
// into a JSON object type. Pass the JSON object type instance to method
// .init_for_Construct3_runOnStartup_async()
//
//   - Advantage: If these object types are renamed, the .ObjectTypeName is
//       still correct.
//
    if ( this.Fighter_bManualMode )
      return; // No neural network.

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

//!!! ...unfinished... (2023/05/28)
    // After painting compeletd, get the whole image for processing
    // by neural network.
    // await NeuralOrchestra_Construct3.DrawingCanvas_getImageData_and_process_by_AI_async
    //   .call( this );

    // After image data got, allow the next painting.
    //
    // Note: Do not continue to .pasteInstances() when the
    //       .DrawingCanvas_getImagePixelDataPromise is still pending.
    //       Otherwise, the .DrawingCanvas_getImagePixelDataPromise will
    //       always be pending (i.e. never fulfilled).
    this.DrawingCanvas_pasteInstancesPromise = null;

//!!! ...unfinished... (2023/05/28)
// Perhaps, no need to await process by neural network.
// What if process_by_AI not yet done but the next painting comes?
//
//     // After ImageData got, process it by neural network.
//     ???await NeuralOrchestra_Construct3.DrawingCanvas_process_by_AI_async.call( this );

//!!! ...unfinished... (2023/05/28)
// apply processing result to KeyDownArray?

  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static DrawingCanvas_getImageData_and_process_by_AI_async() {
    if ( !this.AI_bTurnOn )
      return; // No need to get image since AI is not activated.

    const DrawingCanvas = this.DrawingCanvas;
    if ( !DrawingCanvas )
      return; // No canvas to get image.

    if ( this.DrawingCanvas_getImagePixelDataPromise )
      return; // Previous getting has not yet completed. Do not get again.

//!!! ...unfinished... (2023/05/29)
// should also check the previous AI processing whether has done.
// Perhaps,
//   AI_promise_all = Promise.all( [
//     .DrawingCanvas_getImagePixelDataPromise,
//     .alignmentMarkValueArrayArray_Xxx_Promise,
//     .AI_TypeArray_process_Promise,
//     .KeyDownArray_set_Promise,
//   ] );
//
// initOkArray = await Promise.all( initPromiseArray );
// }
//
// // Summary workers.
// let initOk = initOkArray.reduce(
//   ( previousValue, currentValue ) => ( previousValue && currentValue ),
//   true
// );

    const AI_intervalSeconds = this.configJSONData?.AI?.intervalSeconds;
    if ( !( AI_intervalSeconds >= 0 ) )
      return; // At least, should be 0 seconds (i.e. no interval).

//!!! ...unfinished... (2023/05/28)
// check whether has pass enough time (in seconds)
    const runtime = DrawingCanvas.runtime;

    const gameTime_begin = runtime.gameTime;
    const gameTime_delta
      = gameTime_begin - this.AI_gameTime_previous_endSeconds;

    if ( !( gameTime_delta >= AI_intervalSeconds ) )
      return; // Need wait for more time elapsed.

    this.AI_gameTime_previous_beginSeconds = gameTime_begin;
    this.AI_gameTime_previous_endSeconds = undefined;

//!!! ...unfinished... (2023/05/28)
// should also check
//   - previous neural network processing whether done.
//   - the time elapsed (after the previous neural network processing) whether
//       greater than specified interval. (e.g. 0.5 seconds)
//   - now is in Fighting state.

    let getImagePixelDataPromise = this.DrawingCanvas_getImagePixelDataPromise
      = DrawingCanvas.getImagePixelData();

    await getImagePixelDataPromise;

//!!! ...unfinished... (2023/05/28)
//     // After ImageData got, process it by neural network.
//     NeuralOrchestra_Construct3.DrawingCanvas_process_by_AI_async.call( this );
//     await ???;


//!!! ...unfinished... (2023/05/28)
    const gameTime_end = runtime.gameTime;
    this.AI_gameTime_previous_endSeconds = gameTime_end;

    // To allow the next getting.
    this.DrawingCanvas_getImagePixelDataPromise = null;

//!!! ...unfinished... (2023/05/28)

  }

//!!! ...unfinished... (2023/05/28)
  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static async DrawingCanvas_process_by_AI_async() {
    if ( !this.AI_bTurnOn )
      return; // No need to process image since AI is not activated.

    const DrawingCanvas = this.DrawingCanvas;
    if ( !DrawingCanvas )
      return; // No canvas to get image.

    const runtime = DrawingCanvas.runtime;

    if ( this.DrawingCanvas_process_by_AI_Promise )
      return; // Previous AI processing has not yet completed. Do not processing again.

//!!! ...unfinished... (2023/05/28)
// If still ( this.AI_bTurnOn == true ), Set KeyDownArray

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

//!!! ...unfinished... (2023/05/29)
// alignmentMarkArrayArray_set()
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

//!!! ...unfinished... (2023/05/28)
// alignmentMarkArrayArray_swap()
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
