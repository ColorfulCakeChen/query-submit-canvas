export { NeuralOrchestra_Construct3 as Construct3 };

import * as PartTime from "../../util/PartTime.js";
import * as Pool from "../../util/Pool.js";
import * as RandTools from "../../util/RandTools.js";
import * as Recyclable from "../../util/Recyclable.js";
// import * as ValueDesc from "../../Unpacker/ValueDesc.js";
import * as NeuralNet from "../../Conv/NeuralNet.js";
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
 * @member {number} configJSONData.DrawingCanvas.implicit_input_width
 *   The implicit input width in DrawingCanvas.
 *   - The area from ( 0, 0 ) to ( explicit_input_height, implicit_input_width )
 *       in DrawingCanvas will be cleared (as color DrawingCanvas_clearColor).
 *   - The purpose is to ensure the area is empty to fill alignment mark and
 *       feedback for neural network processing.
 *   - This property is used only if ( .Fighter_bManualMode == true ).
 *   - If ( .Fighter_bManualMode == false ), the implicit input shape will be
 *       extracted from the created neural network.
 *
 * @member {number} configJSONData.AI.intervalSeconds
 *   How many time (in seconds) should be past before the next AI processing.
 *
 * @member {number[][]} configJSONData.alignmentMarkValueArrayArray
 *   An array with two sub-arrays. Every sub-array should has 4 elements. Every
 * element should be non-negative integer between [ 0, 255 ]. That is
 * [ [ R0, G0, B0, A0 ], [ R1, G1, B1, A1 ] ]. They represent every neural
 * network personating what alignment initially. A sub-array represents the
 * RGBA color of the alignment.
 *
 * @member {Object} configJSONData.Keyboard
 *   Configuration for Keyboard.
 *
 * @member {string} configJSONData.Keyboard.KeyDownArray_ObjectTypeName
 *   The KeyDownArray IArrayInstance's ObjectType name in Construct3. The
 * KeyDownArray should be a one dimension array (i.e. width is positive value,
 * height is 1, and depth is 1).
 *
 * @member {number[][]} configJSONData.Keyboard.KeyCodeArrayArray
 *   An array with two sub-arrays.
 *   - Its two sub-arrays should has the same length. The length represents
 *       the total action count of an alignment
 *       (i.e. ActionId_Count_Per_Alignment).
 *   - Every sub-array describes all usable key codes which can be pressed by
 *       AI when AI personates the alignment.
 *   - Every element of a sub-array should be a key code of keyboard.
 *   - The key code will be used as the array index into the
 *       .KeyDownArray_IArrayInstance.
 *
 *

//!!! ...unfinished... (2023/06/20)
// should be replaced by .versus_load_asyncPromise

 * @member {AsyncGenerator} versus_load_asyncGenerator
 *   If not null, a versus downloading is on going.
 *
 * @member {PartTime.AsyncGeneratorTicker} versus_load_asyncGeneratorTicker
 *   If not null, a versus downloading is on going.

//!!! ...unfinished... (2023/06/20)

 *
 * @member {AsyncGenerator} versus_load_asyncPromise
 *   If not null, a versus downloading is on going.
 *
 * @member {boolean} versus_load_progress_displaying
 *   If true, the versus downloading progress is displayed. Note: this
 * .versus_load_progress_displaying may be false even if a versus downloading
 * is on going.
 *
 *
 * @member {Promise( boolean )} alignmentMarkValueArrayArray_set_asyncPromise
 *   If not null, the alignmentMarkValueArrayArray setting request has been
 * issued.
 *
 * @member {Promise( boolean )} alignmentMarkValueArrayArray_swap_asyncPromise
 *   If not null, the alignmentMarkValueArrayArray swapping request has been
 * issued.
 *
 * @member {boolean} alignmentMarkValueArrayArray_operate_done
 *   Whether the alignmentMarkValueArrayArray_set_Xxx() or
 * alignmentMarkValueArrayArray_swap_Xxx() has completed so that neural network
 * can be activated to process image.
 *
 * @member {boolean} alignmentMarkValueArrayArray_swapped
 *   - If false, configJSONData.alignmentMarkValueArrayArray is used directly.
 *   - If true, swapped configJSONData.alignmentMarkValueArrayArray is used.
 *
 *
 * @member {Construct3.IDrawingCanvasInstance} DrawingCanvas
 *   The IDrawingCanvasInstance (in Construct3) to be used for painting all
 * game instances which will be seen by the neural network.
 *
 * @member {number[]} DrawingCanvas_clearColor
 *   A four elements number array [ 0, 0, 0, 0 ] representing the RGBA color
 * (Black transparent) for clearing the DrawingCanvas before painting any
 * instances and for clearing the implicit input area in the DrawingCanvas.
 *
 * @member {number} DrawingCanvas_implicit_input_height
 *   The implicit input height in DrawingCanvas. This property is come from the
 * parameters of .init_for_Construct3_runOnStartup_async(). And it is used only
 * if ( .Fighter_bManualMode == true ).
 *
 * @member {number} DrawingCanvas_implicit_input_width
 *   The implicit input width in DrawingCanvas. This property is come from the
 * configJSONData.DrawingCanvas.implicit_input_width. And it is used only if
 * ( .Fighter_bManualMode == true ).
 *
 * @member {Construct3.IInstance[]} DrawingCanvas_pasteInstanceArray
 *   The Construct3 game objects which has been painted recently.
 *
 * @member {Promise( ImageData )} DrawingCanvas_pasteInstancesPromise
 *   If not null, the DrawingCanvas is still painting (and may be also getting image
 * data) currently.
 *
 * @member {Promise} DrawingCanvas_try_process_by_AI_asyncPromise
 *   If exists and is pending, the AI is still trying to process the
 * DrawingCanvas and set the KeyDownArray.
 *
 * @member {boolean} DrawingCanvas_try_process_by_AI_done
 *   If true, the AI is not try to process the DrawingCanvas and set the
 * KeyDownArray.
 * 
 *
 * @member {boolean} AI_bTurnOn
 *   Whether activate AI. Only meaningful if ( .Fighter_bManualMode == false ).
 * Usually, it is only set to true when in Versus_Step_Xxx_Fighting state.
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
 *   - Even if ( .DrawingCanvas_try_process_by_AI_asyncPromise is fulfilled )
 *      or ( .DrawingCanvas_try_process_by_AI_done == true ), this
 *      .AI_processing may still be false.
 *
 * @member {number[]} AI_output_extractedValueArray
 *   A number array extracted from neural network outputs. It will be applied
 * to Fighter_KeyDownArray.
 *
 *
 * @member {Construct3.IArrayInstance} KeyDownArray_IArrayInstance
 *   The IArrayInstance (in Construct3) to be used for representing which
 * key (of keyboard) is pressing.
 *   - If .KeyDownArray_IArrayInstance.getAt( keyCode ) is truthy, the key (of
 *       the keyCode) is pressed now.
 *   - If .KeyDownArray_IArrayInstance.getAt( keyCode ) is falsy, the key (of
 *       the keyCode) is released now.
 *
 * @member {number} KeyDownArray_thresholdValue
 *   A number for judging whether AI want to press or release a key (of
 * keyboard). It equals ( vocabularyCountPerInputChannel / 2 ) because AI
 * output's value is between [ 0, vocabularyCountPerInputChannel ).
 * 
 *   - If ( AI_output_extractedValueArray[ i ] < KeyDownArray_thresholdValue ),
 *       it means AI wants to press the key (of keyboard).
 *
 *   - If ( AI_output_extractedValueArray[ i ] >= KeyDownArray_thresholdValue ),
 *       it means AI wants to release the key (of keyboard).
 *
 * @member {number} ActionId_Count_Per_Alignment
 *   The total action count of an alignment.
 *
 *
 * @member {number} Versus_Result_n1_0_p1
 *   The combined results of two versuses. It must be either undefined or a
 * number (-1 or 0 or +1) representing the lose/draw/win of two versuses.
 *   - -1 (if parent lose offspring)
 *   -  0 (if parent draw offspring)
 *   - +1 (if parent win offspring)
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
    return false;
  }

  get ActionId_Count_Per_Alignment() {
    return this.configJSONData.Keyboard.KeyCodeArrayArray[ 0 ].length;
  }

  /** @override */
  disposeResources() {

    this.Versus_Result_n1_0_p1 = undefined;

    this.KeyDownArray_value_for_KeyReleased = undefined;
    this.KeyDownArray_value_for_KeyPressed = undefined;
    this.KeyDownArray_thresholdValue = undefined;
    this.KeyDownArray_IArrayInstance = undefined;

    this.AI_output_extractedValueArray = undefined;
    this.AI_gameTime_endSeconds = undefined;
    this.AI_gameTime_beginSeconds = undefined;
    this.AI_bTurnOn = undefined;    

    this.alignmentMarkValueArrayArray_swapped = undefined;
    this.alignmentMarkValueArrayArray_operate_done = undefined;
    this.alignmentMarkValueArrayArray_swap_asyncPromise = undefined;
    this.alignmentMarkValueArrayArray_set_asyncPromise = undefined;

    this.DrawingCanvas_try_process_by_AI_done = undefined;
    this.DrawingCanvas_try_process_by_AI_asyncPromise = undefined;
    this.DrawingCanvas_pasteInstancesPromise = undefined;
    this.DrawingCanvas_pasteInstanceArray = undefined;
    this.DrawingCanvas_implicit_input_width = undefined;
    this.DrawingCanvas_implicit_input_height = undefined;
    this.DrawingCanvas_clearColor = undefined;
    this.DrawingCanvas = undefined;

    this.configJSONData = undefined;

    this.versus_load_asyncPromise = undefined;
    this.versus_load_progress_displaying = undefined;

//!!! ...unfinished... (2023/06/20)
// should be replaced by .versus_load_asyncPromise
//
//     this.versus_load_asyncGeneratorTicker = undefined;
//     this.versus_load_asyncGenerator = undefined;

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

    this.DrawingCanvas_implicit_input_height = explicit_input_height;

    this.KeyDownArray_thresholdValue
      = Math.floor( vocabularyCountPerInputChannel / 2 );

    this.Fighter_bManualMode = runtime.globalVars.Fighter_bManualMode;
    if ( this.Fighter_bManualMode ) {
      this.AI_bTurnOn = false; // Always no AI because no neural network.
      return true; // Init still ok.
    }

    const base = this.base;

    const downloader_apiKey = null;

//!!! ...unfinished... (2023/06/20)
// should be replaced by .versus_load_asyncPromise
//
//    const b_return_versus_load_asyncGenerator_instead_of_asyncPromise = true;
    const b_return_versus_load_asyncGenerator_instead_of_asyncPromise = false;

    let init_asyncPromise
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

//!!! ...unfinished... (2023/06/20)
// should be replaced by .versus_load_asyncPromise
//
//     let versus_load_asyncGenerator = await init_asyncPromise;
//     this.versus_load_asyncGenerator = versus_load_asyncGenerator;

    let { versus_load_asyncPromise } = await init_asyncPromise;
    this.versus_load_asyncPromise = versus_load_asyncPromise;

    const gameTime_initSeconds = runtime.gameTime;

    // So that it looks like that AI is not processing now.
    {
      this.AI_gameTime_beginSeconds = gameTime_initSeconds;
      this.AI_gameTime_endSeconds = gameTime_initSeconds;
      this.DrawingCanvas_try_process_by_AI_asyncPromise = Promise.resolve();
    }

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
    const funcNameInMessage = "ConfigJSON_set";

    const configJSONData = this.configJSONData
      = aIJSONInstance.getJsonDataCopy();

    const runtime = aIJSONInstance.runtime;

    // 1. DrawingCanvas

    // Note: The reason why to provide ObjectTypeName from Construct3's Event
    //       Sheet is that here needs not change even if these names are
    //       changed in Construct3.
    {
      const DrawingCanvas_ObjectTypeName
        = configJSONData.DrawingCanvas.ObjectTypeName;

      const DrawingCanvas = this.DrawingCanvas // IDrawingCanvasInstance
        = runtime.objects[ DrawingCanvas_ObjectTypeName ].getFirstInstance();

      this.DrawingCanvas_clearColor = [ 0, 0, 0, 0 ]; // RGBA. Black transparent.
      this.DrawingCanvas_pasteInstanceArray = []; // For reducing memory re-allocation.

      this.DrawingCanvas_implicit_input_width
        = configJSONData.DrawingCanvas.implicit_input_width;

      // (2023/05/29 Remarked) Not used.
      // DrawingCanvas.addEventListener( "resolutionchange",
      //  NeuralOrchestra_Construct3.Xxx.bind( this ) )
    }

    // 2. alignmentMarkValueArrayArray
    {
      const alignmentMarkValueArrayArray
        = configJSONData.alignmentMarkValueArrayArray;

      if (   ( alignmentMarkValueArrayArray == undefined )
          || ( alignmentMarkValueArrayArray[ 0 ] == undefined )
          || ( alignmentMarkValueArrayArray[ 1 ] == undefined )
          || ( alignmentMarkValueArrayArray[ 0 ].length != 4 )
          || ( alignmentMarkValueArrayArray[ 1 ].length != 4 ) )

        throw Error( `NeuralOrchestra.Construct3.${funcNameInMessage}(): `
          + `configJSONData.alignmentMarkValueArrayArray `
          + `=${RandTools.array_toString( alignmentMarkValueArrayArray )} `
          + `should be as [ [ R0, G0, B0, A0 ], [ R1, G1, B1, A1 ] ].`
        );
    }

    // 3. Keyboard
    {
      // 3.1
      const KeyDownArray_ObjectTypeName
        = configJSONData.Keyboard.KeyDownArray_ObjectTypeName;

      this.KeyDownArray_IArrayInstance
        = runtime.objects[ KeyDownArray_ObjectTypeName ].getFirstInstance();

      // 3.2
      const KeyCodeArrayArray = configJSONData.Keyboard.KeyCodeArrayArray;

      if (   ( KeyCodeArrayArray == undefined )
          || ( KeyCodeArrayArray[ 0 ] == undefined )
          || ( KeyCodeArrayArray[ 1 ] == undefined )
          || ( KeyCodeArrayArray[ 0 ].length
                 != KeyCodeArrayArray[ 1 ].length ) )
        throw Error( `NeuralOrchestra.Construct3.${funcNameInMessage}(): `
          + `configJSONData.KeyCodeArrayArray `
          + `=${RandTools.array_toString( KeyCodeArrayArray )} `
          + `should be as [ [ keyCode00, keyCode01, ..., keyCode0N ], `
          + `[ keyCode10, keyCode11, ..., keyCode1N ] ]. `
          + `That is, it should be an array which has two sub-arrays `
          + `with the same length.`
        );

      // 3.3
      this.KeyDownArray_value_for_KeyReleased = 0;
      this.KeyDownArray_value_for_KeyPressed = 1;

      // 3.4
      this.AI_output_extractedValueArray = new Array(); // For reduce memory re-allocation.
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

    const configJSONData = this.configJSONData;
    const runtime = DrawingCanvas.runtime;

    // 1. Painting.

    // 1.1 Clear to background color.
    const DrawingCanvas_clearColor = this.DrawingCanvas_clearColor;
    DrawingCanvas.clearCanvas( DrawingCanvas_clearColor );

    // 1.2 Paste all specified ObjectType's instances onto the DrawingCanvas.
    let pasteInstancesPromise;
    {
      const ObjectTypeNameArray
        = configJSONData.DrawingCanvas.ObjectTypeNameArray;

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

    // 1.3 Ensure the implicit input area is cleared.
    //
    // So that neural network will see the filled alignment mark and feedback
    // information clearly without noise.
    {
      const base = this.base;

      let implicit_input_height;
      let implicit_input_width = base.implicit_input_width;

      // If no neural network created, use implicit input shape from other method.
      if ( implicit_input_width == undefined ) {
        implicit_input_height = this.DrawingCanvas_implicit_input_height;
        implicit_input_width = this.DrawingCanvas_implicit_input_width;
      } else {
        implicit_input_height = base.implicit_input_height;
      }

      // "-1" for larger than DrawingCanvas to ensure clear completely. 
      const left = -1;
      const top = -1;
      const right = implicit_input_width;

      // "+1" for larger than DrawingCanvas to ensure clear completely. 
      const bottom = implicit_input_height + 1;

      DrawingCanvas.clearRect(
        left, top, right, bottom, DrawingCanvas_clearColor );
    }

    // 1.4 Await for painting completed.
    //
    // Note: Although the promise is for pasting instances, however, the
    //       .clearCanvas() and .clearRect() are also placced in the same
    //       drawing command queue. So, when pasting done, all other drawing
    //       commands also done.
    await pasteInstancesPromise;

    // 2. After painting compeletd, get the whole image and process it.
    {
      let getImagePixelData_asyncPromise = NeuralOrchestra_Construct3
        .DrawingCanvas_getImagePixelData_asyncPromise_create
        .call( this );

      if ( getImagePixelData_asyncPromise ) {
        // Only if necessary, wait for the image.
        let aImageData = await getImagePixelData_asyncPromise;

        // After ImageData got, try to process it by neural network.
        //
        // Note: Do not await it here.
        //
        // Q1: Why not await for trying of image data processing before return?
        // A1: So that the next .DrawingCanvas_paint_async() will not be
        //     blocked by the image processing trying.
        //
        // Q2: Why does the promise be recorded since it does not awaited here?
        // A2: Some operations (e.g. alignment marks setting/swapping, versus
        //     loading) need await for image data processing trying completed.
        this.DrawingCanvas_try_process_by_AI_asyncPromise
          = NeuralOrchestra_Construct3.DrawingCanvas_try_process_by_AI_async
              .call( this, runtime, aImageData );

        this.DrawingCanvas_try_process_by_AI_done = undefined;
        this.DrawingCanvas_try_process_by_AI_asyncPromise.then( () => {
          this.DrawingCanvas_try_process_by_AI_done = true;
        } );
      }
    }

    // 3. After image data got, the next painting is allowed.
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

    if ( !this.alignmentMarkValueArrayArray_operate_done )
      return null; // AI can not process image if alignment marks not yet ready.

    const AI_intervalSeconds = this.configJSONData.AI.intervalSeconds;
    if ( !( AI_intervalSeconds >= 0 ) )
      return null; // No interval means no need. At least, should be 0 seconds.

    if ( this.AI_processing )
      return null; // Previous AI processing has not yet completed.

    const runtime = DrawingCanvas.runtime;
    const gameTime_now = runtime.gameTime;
    const gameTime_deltaSeconds = gameTime_now - this.AI_gameTime_endSeconds;

    // Check whether has pass enough time (in seconds)
    //
    // Note: This works even if ( .AI_gameTime_endSeconds == undefined ).
    //       It will be viewed as elapsed time is enough to do the next AI
    //       processing.
    if ( !( gameTime_deltaSeconds >= AI_intervalSeconds ) )
      return null; // Need wait for more time elapsed.

    this.AI_gameTime_beginSeconds = gameTime_now;
    this.AI_gameTime_endSeconds = undefined;

    // Q: What if DrawingCanvas resolution changed during .getImagePixelData()?
    //    Wheteher will getImagePixelDataPromise never resolve?
    //
    // A: It is very likely that nothing special needs to be taken for
    //    resolution change because DrawingCanvas will only be recreated
    //    automatically when the first time painting after resolution changed.
    //    That is, it can only happen before (not after) .pasteInstances().
    //
    let getImagePixelData_asyncPromise = DrawingCanvas.getImagePixelData();
    return getImagePixelData_asyncPromise;
  }

  /**
   * Try to let neural networks process the DrawingCanvas and set the
   * KeyDownArray.
   *
   * @param {NeuralOrchestra_Construct3} this
   *
   * @param {Object} runtime
   *   Construct3 game engine runtime.
   *
   * @param {ImageData} aImageData
   *   The image data to be processed by neural networks.
   *
   * @return {Promise}
   *   Return a promise which always resolves to undefined.
   */
  static async DrawingCanvas_try_process_by_AI_async( runtime, aImageData ) {

    if ( !this.AI_processing )
      return; // Must have started an uncompleted AI processing.

    // Ensure alignment marks set or swapped.
    //
    // Q: Why not await a promise?
    // A: Because awaiting always pause execution (until next Browser tick)
    //    which reduces performance a little.
    if ( !this.alignmentMarkValueArrayArray_operate_done )
      return; // AI can not process image if alignment marks not yet ready.

    try {

      // Q: Why check AI turned on inside try-finally block?
      // A: So that it will finish the AI processing (by setting
      //    .AI_gameTime_endSeconds). Otherwise, it will block AI forever even
      //    if .AI_bTurnOn become true again.
      if ( !this.AI_bTurnOn )
        return; // No need to process image since AI is not activated.

      const base = this.base;
      const source_TypedArray = aImageData.data;
      const source_height = aImageData.height;
      const source_width = aImageData.width;

      //!!! (2023/06/04 Temp Test) Check input image whether black transparent.
      // NeuralOrchestra_Construct3.DrawingCanvas_input_check
      //   .call( this, aImageData );

      // Process image data.
      const TypedArray_process_asyncPromise
        = base.TypedArray_process_asyncPromise_create(
            source_TypedArray, source_height, source_width );

      // e.g. Int32ArrayArray
      const output_TypedArrayArray = await TypedArray_process_asyncPromise;

      // If AI is still turned on, apply processing result to KeyDownArray.
      if ( this.AI_bTurnOn ) {
        NeuralOrchestra_Construct3.KeyDownArray_set_by_output
          .call( this, output_TypedArrayArray );

      // If the AI has been turned off during the processing (e.g. game is
      // over). Do not let AI apply to KeyDownArray.
      } else {
        // Ensure all action keys (of keyboard) are not pressed.
        NeuralOrchestra_Construct3.KeyDownArray_clear.call( this );
      }

    } finally {
      // To allow the next AI processing.
      const gameTime_now = runtime.gameTime;
      this.AI_gameTime_endSeconds = gameTime_now;
    }
  }

  /**
   * Check the implicit and explicit input area of source_ImageData.
   *
   * @param {NeuralOrchestra_Construct3} this
   *
   * @param {ImageData} source_ImageData
   *   An ImageData which will be processed by the pair of neural workers.
   */
  static DrawingCanvas_input_check( source_ImageData ) {
    const funcNameInMessage = "DrawingCanvas_input_check";

    const base = this.base;

    // 1. Ensure ImageData size as neural network's input size.
    let source_ImageData_adjusted;
    if (   ( source_ImageData.height != base.input_height )
        || ( source_ImageData.width != base.input_width ) ) {

      let target_shape_height_width = [ base.input_height, base.input_width ];
      source_ImageData_adjusted
        = NeuralNet.ScaleFiller.createImageData_by_scale_ImageData(
            source_ImageData,
            target_shape_height_width );

    } else {
      source_ImageData_adjusted = source_ImageData;
    }

    const source_TypedArray = source_ImageData_adjusted.data;

    // 2. Check input area.

    // 2.1 Check implicit input area black transparent.
    NeuralOrchestra_Construct3.DrawingCanvas_implicit_input_check
      .call( this, source_TypedArray );

    // 2.2 Check explicit input area not black transparent.
    NeuralOrchestra_Construct3.DrawingCanvas_explicit_input_check
      .call( this, source_TypedArray );
  }

  /**
   * Check the implicit input area of source_TypedArray whether be cleared.
   *
   * @param {NeuralOrchestra_Construct3} this
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the pair of
   * neural workers. For example, ImageData.data which is coming from a canvas.
   */
  static DrawingCanvas_implicit_input_check( source_TypedArray ) {
    const funcNameInMessage = "DrawingCanvas_implicit_input_check";

    const base = this.base;
    const feedbackShape = base.feedbackShape;
    const pixelValueArray = this.DrawingCanvas_clearColor;

    if ( !feedbackShape )
      return; // No implicit input area could be checked.

    const bBlackTransparentAll = feedbackShape.implicit_input_is_by_pixel(
      source_TypedArray, pixelValueArray );

    if ( !bBlackTransparentAll )
      throw Error( `NeuralOrchestra.Construct3.${funcNameInMessage}(): `
        + `bBlackTransparentAll ( ${bBlackTransparentAll} ) `
        + `should be true.`
      );
  }

  /**
   * Check the explicit input area of source_TypedArray whether be not cleared.
   *
   * @param {NeuralOrchestra_Construct3} this
   *
   * @param {Uint8ClampedArray|Uint16Array|Uint32Array} source_TypedArray
   *   An unsigned integer TypedArray which will be processed by the pair of
   * neural workers. For example, ImageData.data which is coming from a canvas.
   */
  static DrawingCanvas_explicit_input_check( source_TypedArray ) {
    const funcNameInMessage = "DrawingCanvas_explicit_input_check";

    const base = this.base;
    const feedbackShape = base.feedbackShape;
    const pixelValueArray = this.DrawingCanvas_clearColor;

    if ( !feedbackShape )
      return; // No input area information could be used.

    const bBlackTransparentAll = feedbackShape.explicit_input_is_by_pixel(
      source_TypedArray, pixelValueArray );

    if ( bBlackTransparentAll )
      throw Error( `NeuralOrchestra.Construct3.${funcNameInMessage}(): `
        + `bBlackTransparentAll ( ${bBlackTransparentAll} ) `
        + `should be false.`
      );
  }

  /**
   * Extract value from output_TypedArrayArray, and apply them to KeyDownArray.
   *
   * @param {NeuralOrchestra_Construct3} this
   *
   * @param {Uint32Array[]} from_output_TypedArrayArray
   *   The TypedArrayArray which is generated from the neural networks.
   */
  static KeyDownArray_set_by_output( from_output_TypedArrayArray ) {
    //const funcNameInMessage = "KeyDownArray_set_by_output";

    // If the AI has been turned off during the image processing (e.g. game is
    // over). No need to apply to KeyDownArray.
    if ( !this.AI_bTurnOn )
      return;

    if ( !this.AI_processing )
      return; // Must have started an uncompleted AI processing.

    const KeyDownArray_IArrayInstance = this.KeyDownArray_IArrayInstance;
    if ( !KeyDownArray_IArrayInstance )
      return; // No KeyDownArray could be applied.

    const base = this.base;
    const feedbackShape = base.feedbackShape;

    const KeyDownArray_thresholdValue = this.KeyDownArray_thresholdValue;
    const KeyCodeArrayArray = this.configJSONData.Keyboard.KeyCodeArrayArray;

    const value_for_KeyReleased = this.KeyDownArray_value_for_KeyReleased;
    const value_for_KeyPressed = this.KeyDownArray_value_for_KeyPressed;

    // Every output pixel represents an action of an alignment.
    const from_output_pixelIndexBegin = 0;
    const from_output_pixelCount = this.ActionId_Count_Per_Alignment;

    const AI_output_extractedValueArray = this.AI_output_extractedValueArray;
    AI_output_extractedValueArray.length = from_output_pixelCount;

    // 1. Two neural networks personate two alignments.
    const neuralNetCount = from_output_TypedArrayArray.length;
    for ( let neuralNetIndex = 0;
      neuralNetIndex < neuralNetCount; ++neuralNetIndex ) {

      // 2. Extract output of one neural network.
      {
        const from_output_valueArray
          = from_output_TypedArrayArray[ neuralNetIndex ];

        // 2.1 If has implicit input, use feedbackShape to extract output.
        if ( feedbackShape ) {
          feedbackShape.valueArray_get_from_output_valueArray_1st_channel(
            AI_output_extractedValueArray, from_output_valueArray,
            from_output_pixelIndexBegin, from_output_pixelCount );

        // 2.2 Otherwise, no implicit input, use output continuously.
        } else {
          for ( let extractedIndex = 0;
            extractedIndex < from_output_pixelCount; ++extractedIndex )
            AI_output_extractedValueArray[ i ] = from_output_valueArray[ i ];
        }
      }

      // 3. Determine alignment id of the neural network.
      let alignmentId;
      {
        // 3.1 Swapped.
        if ( this.alignmentMarkValueArrayArray_swapped )
          alignmentId = neuralNetCount - neuralNetIndex - 1;

        // 3.2 Not swapped: alignment id is the same as neural network id.
        else
          alignmentId = neuralNetIndex;
      }

      // 4. Apply extracted output value to KeyDownArray.
      //
      // Q: How to convert neural network output value to control signal
      //    (i.e. 0 or 1)?
      // A: Using remainder operation (e.g. ( output % 2 ) ) seems relying
      //    the least significant bit (i.e. bit 0) too much. So, using
      //    threshold (e.g. ( >= 2 ) or ( < 2 ) ) may be better.
      //

      // All usable key codes of the alignment.
      const KeyCodeArray = KeyCodeArrayArray[ alignmentId ];

      for ( let extractedIndex = 0;
        extractedIndex < from_output_pixelCount; ++extractedIndex ) {
        const extractedValue = AI_output_extractedValueArray[ extractedIndex ];
        const keyCode = KeyCodeArray[ extractedIndex ];

        // 4.1 AI releases the key.
        if ( extractedValue < KeyDownArray_thresholdValue ) {
          KeyDownArray_IArrayInstance.setAt( value_for_KeyReleased, keyCode );

        // 4.2 AI presses the key.
        // ( extractedValue >= KeyDownArray_thresholdValue )
        } else {
          KeyDownArray_IArrayInstance.setAt( value_for_KeyPressed, keyCode );
        }
      }
    }
  }

  /**
   * Release (i.e. not pressed) all usable keys of all alignments.
   *
   * @param {NeuralOrchestra_Construct3} this
   */
  static KeyDownArray_clear() {
    //const funcNameInMessage = "KeyDownArray_clear";

    const KeyDownArray_IArrayInstance = this.KeyDownArray_IArrayInstance;
    if ( !KeyDownArray_IArrayInstance )
      return; // No KeyDownArray could be cleared.

    const KeyCodeArrayArray = this.configJSONData.Keyboard.KeyCodeArrayArray;

    const value_for_KeyReleased = this.KeyDownArray_value_for_KeyReleased;
    //const value_for_KeyPressed = this.KeyDownArray_value_for_KeyPressed;

    const alignmentIdCount = KeyCodeArrayArray.length;
    for ( let alignmentId = 0;
      alignmentId < alignmentIdCount; ++alignmentId ) {

      const KeyCodeArray = KeyCodeArrayArray[ alignmentId ];

      for ( let keyCodeIndex = 0;
        keyCodeIndex < KeyCodeArray.length; ++keyCodeIndex ) {
        const keyCode = KeyCodeArray[ keyCodeIndex ];
        KeyDownArray_IArrayInstance.setAt( value_for_KeyReleased, keyCode );
      }
    }
  }

  /**
   * The following variables will be set by this method:
   *
   *   - runtime.globalVars.Versus_EntityNo (string)
   *   - runtime.globalVars.Versus_Parent_GenerationNo (string)
   *   - runtime.globalVars.Versus_Offspring_GenerationNo (string)
   *   - runtime.globalVars.Versus_Parent_WinCount (number)
   *
   * @param {Object} runtime
   *   Construct3 game engine runtime.
   *
   * @param {DEvolution.Versus} versus
   *   The downloaded differential evolution versus. If null, the string
   * information will be set to "(Unknown)".
   */
  static VersusInfo_set_by_runtime_versus( runtime, versus ) {
    const globalVars = runtime.globalVars;

    const versusId = versus?.versusId;
    if ( versusId ) {

      globalVars.Versus_EntityNo
        = versusId.entityNoString; // (string)

      globalVars.Versus_Parent_GenerationNo
        = versusId.parentGenerationNoString; // (string)

      globalVars.Versus_Offspring_GenerationNo
        = versusId.offspringGenerationNoString; // (string)

      globalVars.Versus_Parent_WinCount
        = versusId.parentWinCount; // (number)

    } else {
      const strUnknown = "(Unknown)";
      globalVars.Versus_EntityNo = strUnknown; // (string)
      globalVars.Versus_Parent_GenerationNo = strUnknown; // (string)
      globalVars.Versus_Offspring_GenerationNo = strUnknown; // (string)
      globalVars.Versus_Parent_WinCount = -1; // (number)
    }
  }

  /**
   * When neural networks weights dowloading begins, the following variables
   * will be set by this method:
   *
   *   - runtime.globalVars.Versus_DownloadWeights_Progress (number)
   *
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_00_DownloadWeights_Begin( runtime ) {

//!!! ...unfinished... (2023/06/20)
// should be replaced by .versus_load_asyncPromise
//
//     if ( this.versus_load_asyncGeneratorTicker )
//       return; // Prevent re-enter.

    if ( this.versus_load_progress_displaying )
      return; // Prevent re-enter.

    // So that VersusInfo UI will display uknown if something wrong.
    NeuralOrchestra_Construct3.VersusInfo_set_by_runtime_versus.call( this,
      runtime, null );

    // So that the next time versus result summary could be calculated.
    this.Versus_Result_n1_0_p1 = undefined;

//!!! ...unfinished... (2023/06/20)
// should be replaced by .versus_load_asyncPromise
//
//     // Begin to download versus weights.
//     let versus_load_asyncGenerator = this.versus_load_asyncGenerator;
//     this.versus_load_asyncGeneratorTicker
//       = new PartTime.AsyncGeneratorTicker( versus_load_asyncGenerator );

    //const base = this.base;
    const globalVars = runtime.globalVars;

    // Update progress to game side (and game side will display it to UI).
    globalVars.Versus_DownloadWeights_Progress = 0;

    this.versus_load_progress_displaying = true;
  }

  /**
   * When neural networks weights are dowloading, the following variables
   * will be set by this method:
   *
   *   - runtime.globalVars.Versus_DownloadWeights_Progress (number)
   *
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
  static Versus_Step_01_DownloadWeights_Loading( runtime ) {

    // Note1: This method is expected to be re-entered multiple times until
    //        downloading is done.

    // Note2: In current design, if downloading is failed (e.g. timeout), it
    //        will retry automatically until succeeded. No extra message will
    //        be displayed but the progress (i.e. .valuePercentage) will be
    //        backtracked when retrying.

    const base = this.base;
    const globalVars = runtime.globalVars;

    // Update progress to game side (and game side will display it to UI).
    globalVars.Versus_DownloadWeights_Progress
      = base.versus_load_asyncPromise_progress.valuePercentage;

//!!! ...unfinished... (2023/06/16)
// Perhaps, use versus_load_asyncPromise.
// And use ( base.versus_loadOk != undefined ) as done.

    // Tick the downloading until done.
    //
    // Note: Suppose this method is called inside a requestAnimationFrame()
    //       callback.

//!!! (2023/06/20 Remarked) Replaced by .versus_load_asyncPromise
//    if ( this.versus_load_asyncGeneratorTicker.done() ) {

    if ( base.versus_loadOk != undefined ) { // true or false.

      // So that ticker could be created when the next time downloading is
      // requested.

//!!! (2023/06/20 Remarked) Replaced by .versus_load_asyncPromise
//       this.versus_load_asyncGeneratorTicker = null;
//       this.versus_load_asyncGenerator = null;

      this.versus_load_asyncPromise = null;
      this.versus_load_progress_displaying = false;

      // Extract versus information for UI displaying.
      NeuralOrchestra_Construct3.VersusInfo_set_by_runtime_versus.call( this,
        runtime, base.versus );

      // Since versus downloaded, change to the next state.
      ++runtime.globalVars.Versus_Step_Current;
    }
  }

  /**
   *
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_02_DownloadWeights_End( runtime ) {
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_03_ParentAlignment0_WaitVersusInfo( runtime ) {
    if ( this.alignmentMarkValueArrayArray_set_asyncPromise )
      return; // Prevent re-enter.

    const base = this.base;

    // Setup alignment marks (after AI image processing completed).
    {
      this.alignmentMarkValueArrayArray_set_asyncPromise
        = this.DrawingCanvas_try_process_by_AI_asyncPromise.then( () => {
            const configJSONData = this.configJSONData;
            const alignmentMarkValueArrayArray
              = configJSONData.alignmentMarkValueArrayArray;
            return base.alignmentMarkValueArrayArray_set_asyncPromise_create(
              alignmentMarkValueArrayArray );
          } );

      this.alignmentMarkValueArrayArray_swapped = false;
      this.alignmentMarkValueArrayArray_operate_done = undefined;
      this.alignmentMarkValueArrayArray_set_asyncPromise.then( bSetOk => {
        this.alignmentMarkValueArrayArray_operate_done = bSetOk;
      } );
    }

    // Ensure all action keys (of keyboard) are not pressed.
    NeuralOrchestra_Construct3.KeyDownArray_clear.call( this );
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_04_ParentAlignment0_WaitDrawingCanvas( runtime ) {
    // So that the next time setting is allowed.
    this.alignmentMarkValueArrayArray_set_asyncPromise = undefined;
  }


  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_05_ParentAlignment0_Fighting( runtime ) {
    // Turn on AI for fighting automatically by AI.
    if ( !this.AI_bTurnOn )
      this.AI_bTurnOn = true;
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_06_ParentAlignment0_End( runtime ) {
    // Turn off AI because fighting stopped.
    this.AI_bTurnOn = false;
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
 static Versus_Step_07_ParentAlignment1_WaitVersusInfo( runtime ) {
    if ( this.alignmentMarkValueArrayArray_swap_asyncPromise )
      return; // Prevent re-enter.

    const base = this.base;

    // Swap alignment marks (after AI image processing completed).
    {
      this.alignmentMarkValueArrayArray_swap_asyncPromise
        = this.DrawingCanvas_try_process_by_AI_asyncPromise.then( () => {
            return base
              .alignmentMarkValueArrayArray_swap_asyncPromise_create();
          } );

      this.alignmentMarkValueArrayArray_swapped = true;
      this.alignmentMarkValueArrayArray_operate_done = undefined;
      this.alignmentMarkValueArrayArray_swap_asyncPromise.then( bSwappedOk => {
        this.alignmentMarkValueArrayArray_operate_done = bSwappedOk;
      } );
    }

    // Ensure all action keys (of keyboard) are not pressed.
    NeuralOrchestra_Construct3.KeyDownArray_clear.call( this );
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_08_ParentAlignment1_WaitDrawingCanvas( runtime ) {
    // So that the next time swapping is allowed.
    this.alignmentMarkValueArrayArray_swap_asyncPromise = undefined;
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_09_ParentAlignment1_Fighting( runtime ) {
    // Turn on AI for fighting automatically by AI.
    if ( !this.AI_bTurnOn )
      this.AI_bTurnOn = true;
  }

  /**
   * This method will read the following variables and send versus result to
   * game server.
   *
   *   - runtime.globalVars should have Versus result.
   *
   *   - runtime.globalVars.Versus_Result_ParentAlignment0 (number)
   *       The versus result when Parent personates alignment 0.
   *       (-1: Offspring win. 0: Parent and Offspring draw. +1: Parent win.)
   *
   *   - runtime.globalVars.Versus_Result_ParentAlignment1 (number)
   *       The versus result when Parent personates alignment 1.
   *       (-1: Offspring win. 0: Parent and Offspring draw. +1: Parent win.)
   *
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_10_ParentAlignment1_End( runtime ) {
    if ( this.Versus_Result_n1_0_p1 != undefined )
      return; // Prevent re-enter.

    const base = this.base;

    // 1. Turn off AI because fighting stopped.
    this.AI_bTurnOn = false;

    // 2. Collect and combine win/draw/lose. Report to server.

    // 2.1
    const Versus_Result_ParentAlignment0
      = runtime.globalVars.Versus_Result_ParentAlignment0;

    const Versus_Result_ParentAlignment1
      = runtime.globalVars.Versus_Result_ParentAlignment1;

    const Versus_Result_Sum
      = Versus_Result_ParentAlignment0 + Versus_Result_ParentAlignment1;

    // 2.2 Combine results of two versus.
    {
      if ( Versus_Result_Sum < 0 )
        this.Versus_Result_n1_0_p1 = -1;
      else if ( Versus_Result_Sum > 0 )
        this.Versus_Result_n1_0_p1 = +1;
      else // ( Versus_Result_Sum == 0 )
        this.Versus_Result_n1_0_p1 = 0;
    }

    // 2.3 Report to server.
    base.versusResultSender_send( this.Versus_Result_n1_0_p1 );

//!!! ...unfinished... (2023/06/16)
// Perhaps, create versus_load_asyncPromise so that
// the downloading begins at this step (earlier than
// Versus_Step_00_DownloadWeights_Begin).

    // 3. Start downloading the next versus (after AI image processing trying
    //    completed).
    this.versus_load_asyncGenerator = NeuralOrchestra_Construct3
      .versus_load_asyncGenerator__await__DrawingCanvas_try_process_by_AI_asyncPromise
      .call( this );
  }

//!!! ...unfinished... (2023/06/20)
// should be replaced by 
// .versus_load_asyncPromise__await__DrawingCanvas_try_process_by_AI_asyncPromise()
  /**
   * A wrapped versus_load_asyncGenerator which will:
   *   - Await for the AI processing completed.
   *   - Create the real versus_load_asyncGenerator.
   *   - Delegate to the real versus_load_asyncGenerator.
   *
   * @param {NeuralOrchestra_Construct3} this
   * @param {NeuralOrchestra_Base} this.base
   * @param {Promise} this.DrawingCanvas_try_process_by_AI_asyncPromise
   */
  static async*
    versus_load_asyncGenerator__await__DrawingCanvas_try_process_by_AI_asyncPromise() {

    await this.DrawingCanvas_try_process_by_AI_asyncPromise;

    let versus_load_asyncGenerator_real = this.base
      .versus_load_asyncGenerator_create_with_asyncPromise_progress();

    let versus_load_asyncGenerator_real_result
      = yield* versus_load_asyncGenerator_real;

    return versus_load_asyncGenerator_real_result;
  }

//!!! ...unfinished... (2023/06/20)
  /**
   * A wrapped versus_load_asyncPromise which will:
   *   - Await for the AI processing completed.
   *   - Create the real versus_load_asyncPromise.
   *   - Delegate to the real versus_load_asyncPromise.
   *
   * @param {NeuralOrchestra_Construct3} this
   * @param {NeuralOrchestra_Base} this.base
   * @param {Promise} this.DrawingCanvas_try_process_by_AI_asyncPromise
   */
  static async
    versus_load_asyncPromise__await__DrawingCanvas_try_process_by_AI_asyncPromise() {

    await this.DrawingCanvas_try_process_by_AI_asyncPromise;

    let versus_load_asyncPromise_real = this.base
      .versus_load_asyncPromise_create();

    return versus_load_asyncPromise_real;
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
