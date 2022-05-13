export { MobileNetV2 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Block_Params.js";
import { MobileNetV2_Thin } from "./MobileNetV2_Thin.js";

/**
 * Provide parameters for MobileNetV2 (i.e. add-inut-to-output, pointwise1 is tiwce size of pointwise21).
 *
 *
 */
class MobileNetV2 extends MobileNetV2_Thin {

  constructor( blockParams ) {
    super( blockParams );
  }

  /** @override */
  configTo_beforeStep0() {
    super.configTo_beforeStep0(); // step0's inputHeight0, inputWidth0, bias, activation.

    let blockParams = this.blockParams;

    if ( blockParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0;                                  // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 4;                   // Quadruple of input0. (Double of pointwise21.)

    } else {
      this.pointwise1ChannelCount = blockParams.sourceChannelCount * 4; // Quadruple of input0. (Double of pointwise21.)
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }
  }

  /** @override */
  configTo_afterStep0() {
    super.configTo_afterStep0(); // step1, 2, 3, ... are almost the same as MobileNetV2_Thin.

    let blockParams = this.blockParams;

    // Except
    if ( blockParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0;                                       // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2;                        // Double of pointwise21. (Quadruple of step0's input0.)

    } else {
      this.pointwise1ChannelCount = this.channelCount0_pointwise1Before * 2; // Double of pointwise21. (Quadruple of step0's input0.)
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }
  }

  /** @override */
  configTo_beforeStepLast() {
    super.configTo_beforeStepLast(); // stepLast is the same as MobileNetV2_Thin.
  }

}

