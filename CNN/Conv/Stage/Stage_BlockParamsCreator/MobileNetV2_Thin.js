export { MobileNetV2_Thin };

import * as Pool from "../../../util/Pool.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
//import { Params } from "../Stage_Params.js";
import { MobileNetV1 } from "./MobileNetV1.js";

/**
 * Provide parameters for MobileNetV2_Thin (i.e. add-inut-to-output, pointwise1
 * is same size of pointwise20).
 *
 *
 */
class MobileNetV2_Thin extends MobileNetV1 {

  /**
   * Used as default Stage.BlockParamsCreator.MobileNetV2_Thin provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "Stage.BlockParamsCreator.MobileNetV2_Thin.Pool",
    MobileNetV2_Thin );

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
    // block0's input0_height, input0_width, input0_channelCount,
    // ConvBlockType, activation.    
    super.configTo_beforeBlock0();
  }

  /** @override */
  configTo_beforeBlockN_exceptBlock0( blockIndex, input_height, input_width ) {
    // block1, 2, 3, ...'s input0_height, input0_width.
    super.configTo_beforeBlockN_exceptBlock0(
      blockIndex, input_height, input_width );

    // In MobileNetV2:
    //   - All blocks (except block0) do add-input-to-output (without
    //       concatenation).
    //   - All blocks (include block0) do not use input1.
    this.nConvBlockTypeId = ValueDesc.ConvBlockType.Singleton.Ids
      .MOBILE_NET_V2_BODY_TAIL;
  }

  /** @override */
  configTo_beforeBlockLast() {
    super.configTo_beforeBlockLast(); // blockLast's pointwise20 bias.
  }

}
