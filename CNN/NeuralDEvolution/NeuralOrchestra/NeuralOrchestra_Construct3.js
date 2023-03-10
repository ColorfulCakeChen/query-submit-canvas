export { NeuralOrchestra_Construct3 as Construct3 };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
// import * as ValueDesc from "../../Unpacker/ValueDesc.js";
// import * as NeuralNet from "../../Conv/NeuralNet.js";
//import * as DEvolution from "../DEvolution.js";
import { Base } from "./NeuralOrchestra_Base.js";

/**
 * Orchestrate neural networks with differential evolution, and inter-operate with
 * Construct3 Game Engine.
 *
 *
 */
class NeuralOrchestra_Construct3 extends Base {

  /**
   * Used as default NeuralOrchestra.Construct3 provider for conforming to Recyclable interface.
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

//!!! ...unfinished... (2022/10/20)

  }

  /** @override */
  disposeResources() {

//!!! ...unfinished... (2022/10/20)

    super.disposeResources();
  }

  /**
   * Called by Construct3 game engine every game tick.
   *
   *   - runtime.globalVars.Versus_Step_X_Yyy: The defined step constants.
   *
   *   - runtime.globalVars.Versus_Step_Current: The current game step. It's value
   *       should be one of runtime.globalVars.Versus_Step_X_Yyy
   *
   *
   * @param {Object} runtime
   *   Construct3 game engine runtime.
   *
   */
  tick( runtime ) {

//!!! ...unfinished... (2022/10/27)
    let pfnStep = NeuralOrchestra_Construct3.Versus_Step_Function_Array[
      runtime.globalVars.Versus_Step_Current ];

    pfnStep.call( this, runtime );
  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_00_DownloadWeights_Begin( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }

  /**
   * When neural networks weights dowloading finished, the following variables will
   * be set by this method:
   *
   *   - runtime.globalVars.Versus_EntityNo (string)
   *   - runtime.globalVars.Versus_Parent_GenerationNo (string)
   *   - runtime.globalVars.Versus_Offspring_GenerationNo (string)
   *   - runtime.globalVars.Versus_Parent_WinCount (number)
   *
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_01_DownloadWeights_Loading( runtime ) {

//!!! ...unfinished... (2022/10/27)

//!!! ...unfinished... (2022/12/29) AbortSignal.timeout()?
// If downloading is failed (e.g. timeout), display message and re-try downloading.

//!!! ...unfinished... (2023/03/10)
// Perhaps, check this.versus_load_progress
// (may be loading versusSummary + versus, or loading versus only.)

  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_02_DownloadWeights_End( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_03_ParentAlignment0_WaitVersusInfo( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_04_ParentAlignment0_WaitDrawingCanvas( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }


  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_05_ParentAlignment0_Fighting( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_06_ParentAlignment0_End( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }
  
  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
 static Versus_Step_07_ParentAlignment1_WaitVersusInfo( runtime ) {

//!!! ...unfinished... (2022/10/28)


  }
  
  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_08_ParentAlignment1_WaitDrawingCanvas( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_09_ParentAlignment1_Fighting( runtime ) {

//!!! ...unfinished... (2022/10/27)


  }

  /**
   * This method will send versus result to game server.
   *
   *   - runtime.globalVars should have Versus result.
   *       (-1: Offspring win. 0: Parent and Offspring draw. +1: Parent win.)
   *
   *   - runtime.globalVars.Versus_Result_ParentAlignment0
   *       The versus result when Parent plays alignment 0.
   *
   *   - runtime.globalVars.Versus_Result_ParentAlignment1
   *       The versus result when Parent plays alignment 1.
   *
   * @param {NeuralOrchestra_Construct3.Construct3} this
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
