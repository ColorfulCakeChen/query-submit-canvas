export { MobileNetV2 };

import * as ValueDesc from "../../../Unpacker/ValueDesc.js";
import { Params } from "../Stage_Params.js";
import { MobileNetV2_Thin } from "./MobileNetV2_Thin.js";

/**
 * Provide parameters for MobileNetV2 (i.e. add-inut-to-output, pointwise1 is tiwce size of pointwise21).
 *
 *
 */
class MobileNetV2 extends MobileNetV2_Thin {

  constructor( stageParams ) {
    super( stageParams );
  }

  /** @override */
  configTo_beforeBlock0() {
    super.configTo_beforeBlock0(); // block0's inputHeight0, inputWidth0, bias, activation.

    let stageParams = this.stageParams;

    if ( stageParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0;                                  // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 4;                   // Quadruple of input0. (Double of pointwise21.)

    } else {
      this.pointwise1ChannelCount = stageParams.sourceChannelCount * 4; // Quadruple of input0. (Double of pointwise21.)
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }
  }

  /** @override */
  configTo_afterBlock0() {
    super.configTo_afterBlock0(); // block1, 2, 3, ... are almost the same as MobileNetV2_Thin.

    let stageParams = this.stageParams;

    // Except
    if ( stageParams.bPointwise1 == false ) {
      this.pointwise1ChannelCount = 0;                                       // NoPointwise1.
      this.depthwise_AvgMax_Or_ChannelMultiplier = 2;                        // Double of pointwise21. (Quadruple of block0's input0.)

    } else {
      this.pointwise1ChannelCount = this.channelCount0_pointwise1Before * 2; // Double of pointwise21. (Quadruple of block0's input0.)
      this.depthwise_AvgMax_Or_ChannelMultiplier = 1;
    }
  }

  /** @override */
  configTo_beforeBlockLast() {
    super.configTo_beforeBlockLast(); // blockLast is the same as MobileNetV2_Thin.
  }

}

