export { MobileNetV1_padValid };

import * as Pool from "../../../util/Pool.js";
import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
//import { Params } from "../Stage_Params.js";
import { MobileNetV1 } from "./MobileNetV1.js";

/**
 * This class is almost the same as MobileNetV1 except the depthwise convolution's padding is "valid" (instead of "same").
 *
 * (It is for the same reason of class ShuffleNetV2_ByMobileNetV1_padValid. Please its explanation.)
 *
 * @see ShuffleNetV2_ByMobileNetV1_padValid
 */
class MobileNetV1_padValid extends MobileNetV1 {

  /**
   * Used as default Stage.BlockParamsCreator.MobileNetV1_padValid provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root(
    "Stage.BlockParamsCreator.MobileNetV1_padValid.Pool", MobileNetV1_padValid, MobileNetV1_padValid.setAsConstructor );

  /**
   */
  constructor( stageParams ) {
    super( stageParams );
    MobileNetV1_padValid.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( stageParams ) {
    super.setAsConstructor( stageParams );
    MobileNetV1_padValid.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    // Do nothing.
  }

  ///** @override */
  //disposeResources() {
  //  super.disposeResources();
  //}
  
  /** @override */
  configTo_beforeBlock0() {
    super.configTo_beforeBlock0(); // Block0 is almost the same as MobileNetV1.

    // Except padding is "valid" (not "same").
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID;
  }

  /** @override */
  configTo_beforeBlockN_exceptBlock0( blockIndex ) {
    super.configTo_beforeBlockN_exceptBlock0( blockIndex ); // Block1, 2, 3, ... are almost the same as MobileNetV1.

    // Except padding is "valid" (not "same").
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID;
  }
}

