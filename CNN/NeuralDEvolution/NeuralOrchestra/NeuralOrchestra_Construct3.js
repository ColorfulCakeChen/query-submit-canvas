export { NeuralOrchestra_Construct3 as Construct3 };

// import * as Pool from "../../util/Pool.js";
// import * as Recyclable from "../../util/Recyclable.js";
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
   *
   *
   *
   *
   *
   *
   *
   * @param {Object} runtime
   *   Construct3 game engine runtime.
   *
   */
  tick( runtime ) {

//!!! ...unfinished... (2022/10/20)
    runtime.globalVars.Versus_Step_0_DownloadWeights_Begin
    runtime.globalVars.Versus_Step_1_DownloadWeights_Loading
    runtime.globalVars.Versus_Step_2_DownloadWeights_End
    runtime.globalVars.Versus_Step_3_ParentAlignment0_Begin
    runtime.globalVars.Versus_Step_4_ParentAlignment0_Fighting
    runtime.globalVars.Versus_Step_5_ParentAlignment0_End
    runtime.globalVars.Versus_Step_6_ParentAlignment1_Begin
    runtime.globalVars.Versus_Step_7_ParentAlignment1_Fighting
    runtime.globalVars.Versus_Step_8_ParentAlignment1_End

  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_0_DownloadWeights_Begin( runtime ) {

  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_1_DownloadWeights_Loading( runtime ) {

  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_2_DownloadWeights_End( runtime ) {

  }

  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_3_ParentAlignment0_Begin( runtime ) {

  }
  
  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_4_ParentAlignment0_Fighting( runtime ) {

  }
  
  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_5_ParentAlignment0_End( runtime ) {

  }
  
  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_6_ParentAlignment1_Begin( runtime ) {

  }
  
  /**
   * @param {NeuralOrchestra_Construct3.Construct3} this
   */
  static Versus_Step_7_ParentAlignment1_Fighting( runtime ) {

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
  static Versus_Step_8_ParentAlignment1_End( runtime ) {

  }

}
