export { ShuffleNetV2_ByMobileNetV1_padValid };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Param.js";
import { ShuffleNetV2_ByMobileNetV1 } from "./ShuffleNetV2_ByMobileNetV1.js";

/**
 * This class is almost the same as ShuffleNetV2_ByMobileNetV1 except the depthwise convolution's padding is "valid" (instead of "same").
 *
 *
 * 1. Reason
 *
 * Q: Why is this configuration necessary?
 * A: The right-most pixel of depthwise convolution seems wrong when ( strides = 1, pad = "same" ) in backend WebGL of some
 *    platforms (e.g. mobile phone Moto e40). But the issue does not exist when ( strides = 2, pad = "same" ) or ( pad = "valid" )
 *    in those platforms.
 *
 * For achieving ShuffleNetV2 with depthwise padding "valid", ShuffleNetV2_ByMobileNetV1 is necessary because other ShuffleNetV2_ByXxx
 * (with depthwise padding "same") could not concatenate two channel groups whic have different image size (due to padding "valid").
 *
 *
 * 2. Drawback
 *
 * The disadvantage is that the right-most and bottom-most pixels will be dropped when pass-through the higher half of depthwise
 * convolution due to padding "valid".
 *
 *
 * 2.1 Drawback and 1D data
 *
 * Although 1D data (e.g. voice) has only one line (i.e. the only bottom-most data) which should not be dropped (otherwise,
 * all data are dropped), this disadvantage will not be a diaster for 1D data.
 *
 * The reason is that depthwise filter size (in some direction) can not be larger than input data size (in that diecrtion).
 * For 1D data, this means that only depthwise convolution with ( depthwiseFilterHeight == 1 ) could be used.
 *
 * When filter size is 1 (in some direction), the output size (in that direction) will always be the same as input even
 * if ( pad = "valid" ). So, the only one bottom-most data will not be dropped diasterly.
 *
 */
class ShuffleNetV2_ByMobileNetV1_padValid extends ShuffleNetV2_ByMobileNetV1 {

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // Step0 is almost the same as ShuffleNetV2_ByMobileNetV1.

    // Except padding is "valid" (not "same").
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_2_PAD_VALID;
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // Step1, 2, 3, ... are almost the same as ShuffleNetV2_ByMobileNetV1.

    // Except padding is "valid" (not "same").
    this.depthwiseStridesPad = ValueDesc.StridesPad.Singleton.Ids.STRIDES_1_PAD_VALID;
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // StepLast is the same as ShuffleNetV2_ByMobileNetV1.
  }
}

