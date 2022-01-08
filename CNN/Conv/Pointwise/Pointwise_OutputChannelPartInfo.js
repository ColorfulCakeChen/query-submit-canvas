export { ChannelPartInfo };

import * as ConvBiasActivation from "../ConvBiasActivation.js";

/**
 * Half channels information. Describe channel index range of lower half or higher half.
 *
 * @member {number} outputChannelCount
 *   The channel count of output.
 *
 * @member {boolean} bPassThrough
 *   If true, this is a pass-through part and it will pass-through input channel index in [ inChannelBegin, inChannelEnd ) to output.
 * Otherwise, this is a non-pass-through part and it will using filters and biases extracted from weights array to convolve input channel
 * index in [ inChannelBegin, inChannelEnd ) to output.
 */
class ChannelPartInfo extends ConvBiasActivation.ChannelPartInfo {

  /**
   */
  constructor( inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough ) {
    super( inChannelBegin, inChannelEnd );
    this.outputChannelCount = outputChannelCount;
    this.bPassThrough = bPassThrough;
  }

}

