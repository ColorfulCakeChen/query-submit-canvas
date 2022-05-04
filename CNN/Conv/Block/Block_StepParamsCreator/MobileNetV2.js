export { MobileNetV2 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Param.js";
import { MobileNetV2_Thin } from "./MobileNetV2_Thin.js";

/**
 * Provide parameters for MobileNetV2 (i.e. add-inut-to-output, pointwise1 is tiwce size of pointwise21).
 *
 *
 */
class MobileNetV2 extends MobileNetV2_Thin {

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // step0's inputHeight0, inputWidth0, bias, activation.

    let blockParams = this.blockParams;

    If ( blockParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0;                                  // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 4;                   // Quadruple of input0. (Double of pointwise21.)

    } else {
      this.pointwise1ChannelCount = blockParams.sourceChannelCount * 4; // Quadruple of input0. (Double of pointwise21.)
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // step1, 2, 3, ...'s inputHeight0, inputWidth0.
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // stepLast's pointwise21 bias.
  }

}

