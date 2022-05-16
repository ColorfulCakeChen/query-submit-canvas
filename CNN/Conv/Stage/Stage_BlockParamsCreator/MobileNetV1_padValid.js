export { MobileNetV1_padValid };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Stage_Params.js";
import { MobileNetV1 } from "./MobileNetV1.js";

/**
 * This class is almost the same as MobileNetV1 except the depthwise convolution's padding is "valid" (instead of "same").
 *
 * (It is for the same reason of class ShuffleNetV2_ByMobileNetV1_padValid. Please its explanation.)
 *
 * @see ShuffleNetV2_ByMobileNetV1_padValid
 */
class MobileNetV1_padValid extends MobileNetV1 {

  constructor( stageParams ) {
    super( stageParams );
  }

  /** @override */
  configTo_beforeBlock0() {
    super.configTo_beforeBlock0(); // Block0 is almost the same as MobileNetV1.

    // Except padding is "valid" (not "same").
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID;
  }

  /** @override */
  configTo_afterBlock0() {
    super.configTo_afterBlock0(); // Block1, 2, 3, ... are almost the same as MobileNetV1.

    // Except padding is "valid" (not "same").
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID;
  }
}

