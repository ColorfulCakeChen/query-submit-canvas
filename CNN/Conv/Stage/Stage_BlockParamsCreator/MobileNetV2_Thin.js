export { MobileNetV2_Thin };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Stage_Params.js";
import { MobileNetV1 } from "./MobileNetV1.js";

/**
 * Provide parameters for MobileNetV2_Thin (i.e. add-inut-to-output, pointwise1 is same size of pointwise21).
 *
 *
 */
class MobileNetV2_Thin extends MobileNetV1 {

  constructor( stageParams ) {
    super( stageParams );
  }

  /** @override */
  configTo_beforeBlock0() {
    super.configTo_beforeBlock0(); // block0's inputHeight0, inputWidth0, bias, activation.
  }

  /** @override */
  configTo_afterBlock0() {
    super.configTo_afterBlock0(); // block1, 2, 3, ...'s inputHeight0, inputWidth0.

    // In MobileNetV2:
    //   - All blocks (except block0) do add-input-to-output (without concatenation).
    //   - All blocks (include block0) do not use input1.
    this.channelCount1_pointwise1Before = ValueDesc.channelCount1_pointwise1Before.Singleton.Ids.ONE_INPUT_ADD_TO_OUTPUT;
  }

  /** @override */
  configTo_beforeBlockLast() {
    super.configTo_beforeBlockLast(); // blockLast's pointwise21 bias.
  }

}

