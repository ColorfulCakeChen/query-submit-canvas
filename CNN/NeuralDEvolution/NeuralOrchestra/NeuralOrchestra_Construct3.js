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
    if ( this.base ) {
      this.base.disposeResources_and_recycleToPool();
      this.base = undefined;
    }
    super.disposeResources();
  }

  /**
   * Please call this method in Construct3's runOnStartup().
   * 
   * @return {Promise( boolean )}
   *   Return a promise. It resolves to true, if successful.
   */
  async init_for_Construct3_runOnStartup_async(
    downloader_spreadsheetId, bLogFetcherEventToConsole,
    sender_clientId,

    explicit_input_height, explicit_input_width, explicit_input_channelCount,
    nNeuralWorker_ImplicitInputModeId,
    vocabularyChannelCount, vocabularyCountPerInputChannel,
    blockCountTotalRequested,
    output_channelCount
  ) {
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

    return base.initOk;
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
    update_to_UI();

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

//!!! ...unfinished... (2022/10/27)
    this.versus_load_asyncGeneratorTicker = null;
  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_03_ParentAlignment0_WaitVersusInfo( runtime ) {

//!!! ...unfinished... (2022/10/27)


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

//!!! ...unfinished... (2023/04/14)
// Perhaps, use IBinaryDataInstance to recurrent output to game scene.
// So, set IWorldIntance.colorRga[] of game object.
//
// Get ImageData from DrawCanvas. Fill recurrent output into
// ImageData.data (Uint8ClampedArray) directly.

  }

  /**
   * @param {NeuralOrchestra_Construct3} this
   */
  static Versus_Step_06_ParentAlignment0_End( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }
  
  /**
   * @param {NeuralOrchestra_Construct3} this
   */
 static Versus_Step_07_ParentAlignment1_WaitVersusInfo( runtime ) {

//!!! ...unfinished... (2022/10/28)


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
