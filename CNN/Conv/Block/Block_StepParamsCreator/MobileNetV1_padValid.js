export { MobileNetV1_padValid };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Param.js";
import { MobileNetV1 } from "./MobileNetV1.js";

/**
 * This class is almost the same as MobileNetV1 except the depthwise convolution's padding is "valid" (instead of "same").
 *
 * (It is for the same reason of class ShuffleNetV2_ByMobileNetV1_padValid. Please its explanation.)
 *
 * @see ShuffleNetV2_ByMobileNetV1_padValid
 */
class MobileNetV1_padValid extends MobileNetV1 {

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // Step0 is almost the same as MobileNetV1.

    // Except padding is "valid" (not "same").
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID;
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // Step1, 2, 3, ... are almost the same as MobileNetV1.

    // Except padding is "valid" (not "same").
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID;
  }
}

