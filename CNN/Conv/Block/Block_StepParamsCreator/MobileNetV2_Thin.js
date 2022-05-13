export { MobileNetV2_Thin };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Params.js";
import { MobileNetV1 } from "./MobileNetV1.js";

/**
 * Provide parameters for MobileNetV2_Thin (i.e. add-inut-to-output, pointwise1 is same size of pointwise21).
 *
 *
 */
class MobileNetV2_Thin extends MobileNetV1 {

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // step0's inputHeight0, inputWidth0, bias, activation.
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // step1, 2, 3, ...'s inputHeight0, inputWidth0.

    // In MobileNetV2:
    //   - All steps (except step0) do add-input-to-output (without concatenation).
    //   - All steps (include step0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT;
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // stepLast's pointwise21 bias.
  }

}

