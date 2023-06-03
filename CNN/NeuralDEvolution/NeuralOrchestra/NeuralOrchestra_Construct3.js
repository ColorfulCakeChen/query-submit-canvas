export { NeuralOrchestra_Construct3 as Construct3 };

import * as PartTime from "../../util/PartTime.js";
import * as Pool from "../../util/Pool.js";
import * as RandTools from "../../util/RandTools.js";
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
 * @member {boolean} alignmentMarkValueArrayArray_operate_done
 *   Whether the alignmentMarkValueArrayArray_set_Xxx() or
 * alignmentMarkValueArrayArray_swap_Xxx() has completed so that neural network
 * can be activated to process image.
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
 *
 * @member {number[]} AI_output_extractedArray
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
 *   - If ( AI_output_extractedArray[ i ] < KeyDownArray_thresholdValue ),
 *       it means AI wants to press the key (of keyboard).
 *
 *   - If ( AI_output_extractedArray[ i ] >= KeyDownArray_thresholdValue ),
 *       it means AI wants to release the key (of keyboard).
 *
 * @member {number} ActionId_Count_Per_Alignment
 *   The total action count of an alignment.
 *
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

  get ActionId_Count_Per_Alignment() {
    return this.configJSONData.Keyboard.KeyCodeArrayArray[ 0 ].length;
  }

  /** @override */
  disposeResources() {

//!!! ...unfinished... (2023/05/28)
// should clear all data members.

    this.KeyDownArray_thresholdValue = undefined;
    this.KeyDownArray_IArrayInstance = undefined;

    this.AI_output_extractedArray = undefined;
    this.AI_gameTime_endSeconds = undefined;
    this.AI_gameTime_beginSeconds = undefined;
    this.AI_bTurnOn = undefined;    

    this.alignmentMarkValueArrayArray_operate_done = undefined;

    this.DrawingCanvas_pasteInstancesPromise = undefined;
    this.DrawingCanvas_pasteInstanceArray = undefined;
    this.DrawingCanvas_implicit_input_width = undefined;
    this.DrawingCanvas_implicit_input_height = undefined;
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
    // // So that it looks like that AI is not processing now.
    // this.AI_gameTime_beginSeconds = gameTime_initSeconds;
    // this.AI_gameTime_endSeconds = gameTime_initSeconds;

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

      //!!! ...unfinished... (2023/05/29)
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

      this.AI_output_extractedArray = new Array(); // For reduce memory re-allocation.
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
    if ( !this.alignmentMarkValueArrayArray_operate_done )
      return; // AI can not process image if alignment marks not yet ready.

    try {
      const base = this.base;
      const source_TypedArray = aImageData.data;
      const source_height = aImageData.height;
      const source_width = aImageData.width;

//!!! ...unfinished... (2023/06/03)
      //!!! (2023/06/03 Temp Test) Check implicit input area black transparent.
      NeuralOrchestra_Construct3.DrawingCanvas_implicit_input_check
        .call( this, source_TypedArray );

      // Process image data.
      const TypedArray_process_asyncPromise
        = base.TypedArray_process_asyncPromise_create(
            source_TypedArray, source_height, source_width );

      // e.g. Int32ArrayArray
      const output_TypedArrayArray = await TypedArray_process_asyncPromise;

      // If the AI has been turned off during the processing (e.g. game is
      // over). No need to apply to KeyDownArray.
      if ( !this.AI_bTurnOn )
        return;

      // Since AI is still turned on, apply processing result to KeyDownArray.
      NeuralOrchestra_Construct3.KeyDownArray_set_by_output
        .call( this, output_TypedArrayArray );

    } finally {
      // To allow the next AI processing.
      const gameTime_endSeconds = runtime.gameTime;
      this.AI_gameTime_endSeconds = gameTime_endSeconds;
    }
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
        + `should be as true.`
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

    const value_for_KeyReleased = 0;
    const value_for_KeyPressed = 1;

    // Every output pixel represents an action of an alignment.
    const from_output_pixelIndexBegin = 0;
    const from_output_pixelCount = this.ActionId_Count_Per_Alignment;

    const AI_output_extractedArray = this.AI_output_extractedArray;
    AI_output_extractedArray.length = from_output_pixelCount;

    // 1.
    // Alignemnt count should be 2.
    const alignmentIdCount = from_output_valueArrayArray.length;
    for ( let alignmentId = 0;
      alignmentId < alignmentIdCount; ++alignmentId ) {

      // 2.
      const from_output_valueArray
        = from_output_TypedArrayArray[ alignmentId ];

      // 2.1 If has implicit input, use feedbackShape to extract output.
      if ( feedbackShape ) {
        feedbackShape.valueArray_get_from_output_valueArray_1st_channel(
          AI_output_extractedArray, from_output_valueArray,
          from_output_pixelIndexBegin, from_output_pixelCount );

      // 2.2 Otherwise, no implicit input, use output continuously.
      } else {
        for ( let extractedIndex = 0;
          extractedIndex < from_output_pixelCount; ++extractedIndex )
          AI_output_extractedArray[ i ] = from_output_valueArray[ i ];
      }

      // 3. Apply extracted value to KeyDownArray.

      // All usable key codes of the alignment.
      const KeyCodeArray = KeyCodeArrayArray[ alignmentId ];

      for ( let extractedIndex = 0;
        extractedIndex < from_output_pixelCount; ++extractedIndex ) {
        const extractedValue = AI_output_extractedArray[ extractedIndex ];
        const keyCode = KeyCodeArray[ extractedIndex ];

        // 3.1 AI releases the key.
        if ( extractedValue < KeyDownArray_thresholdValue ) {
          KeyDownArray_IArrayInstance.setAt( value_for_KeyReleased, keyCode );

        // 3.2 AI presses the key.
        // ( extractedValue >= KeyDownArray_thresholdValue )
        } else {
          KeyDownArray_IArrayInstance.setAt( value_for_KeyPressed, keyCode );
        }
      }
    }
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

    // Setup alignment marks.
    {
      const configJSONData = this.configJSONData;

      const alignmentMarkValueArrayArray
        = configJSONData.alignmentMarkValueArrayArray;

      let alignmentMarkValueArrayArray_set_asyncPromise
        = base.alignmentMarkValueArrayArray_set_asyncPromise_create(
            alignmentMarkValueArrayArray );

      this.alignmentMarkValueArrayArray_operate_done = undefined;
      alignmentMarkValueArrayArray_set_asyncPromise.then( bSetOk => {
        this.alignmentMarkValueArrayArray_operate_done = bSetOk;
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

    // Swap alignment marks.
    {
      let alignmentMarkValueArrayArray_swap_asyncPromise
        = base.alignmentMarkValueArrayArray_swap_asyncPromise_create();

      this.alignmentMarkValueArrayArray_operate_done = undefined;
      alignmentMarkValueArrayArray_swap_asyncPromise.then( bSwappedOk => {
        this.alignmentMarkValueArrayArray_operate_done = bSwappedOk;
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
