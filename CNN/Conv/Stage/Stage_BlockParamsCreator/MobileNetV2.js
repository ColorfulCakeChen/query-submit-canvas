export { MobileNetV2 };

import * as Pool from "../../../util/Pool.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
//import { Params } from "../Stage_Params.js";
import { MobileNetV2_Thin } from "./MobileNetV2_Thin.js";

/**
 * Provide parameters for MobileNetV2 (i.e. add-inut-to-output, pointwise1 is
 * tiwce size of pointwise20).
 *
 *
 */
class MobileNetV2 extends MobileNetV2_Thin {

  /**
   * Used as default Stage.BlockParamsCreator.MobileNetV2 provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "Stage.BlockParamsCreator.MobileNetV2.Pool",
    MobileNetV2 );

  /**
   */
  constructor( stageParams ) {
    super( stageParams );
    this.#setAsConstructor_self();
  }

  /** @override */
  setAsConstructor( stageParams ) {
    super.setAsConstructor( stageParams );
    this.#setAsConstructor_self();
  }

  /**  */
  #setAsConstructor_self() {
    // Do nothing.
  }

  ///** @override */
  //disposeResources() {
  //  super.disposeResources();
  //}

  /** @override */
  configTo_beforeBlock0() {
    // block0's input0_height, input0_width, input0_channelCount, activation.
    super.configTo_beforeBlock0();

    let stageParams = this.stageParams;

    if ( stageParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount
        = 0;                                  // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier
        = 4;                                  // Quadruple of input0. (Double of pointwise20.)

    } else {
      this.pointwise1ChannelCount
        = stageParams.input_channelCount * 4; // Quadruple of input0. (Double of pointwise20.)
      this.depthwise_AvgMax_Or_ChannelMultiplier
        = 1;
    }
  }

  /** @override */
  configTo_beforeBlockN_exceptBlock0( blockIndex, input_height, input_width ) {
    // block1, 2, 3, ... are almost the same as MobileNetV2_Thin.
    super.configTo_beforeBlockN_exceptBlock0(
      blockIndex, input_height, input_width );

    let stageParams = this.stageParams;

    // Except
    if ( stageParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount
        = 0;                            // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier
        = 2;                            // Double of pointwise20. (Quadruple of block0's input0.)

    } else {
      this.pointwise1ChannelCount
        = this.input0_channelCount * 2; // Double of pointwise20. (Quadruple of block0's input0.)
      this.depthwise_AvgMax_Or_ChannelMultiplier
        = 1;
    }
  }

  /** @override */
  configTo_beforeBlockLast() {
    // blockLast is the same as MobileNetV2_Thin.
    super.configTo_beforeBlockLast();
  }

}
