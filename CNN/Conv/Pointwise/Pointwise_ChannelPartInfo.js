export { ChannelPartInfo };

import * as ConvBiasActivation from "../ConvBiasActivation.js";

/**
 * Half channels information. Describe channel index range of lower half or higher half.
 *
 *   - When input channel index is between [ this.beginIndex, this.endIndex ], the input channel will be used as normal (i.e. multiplied by
 *       filters and biases weights extracted from source weights).
 *
 *   - When input channel index is outside [ this.beginIndex, this.endIndex ], the input channel will be past-through (i.e. multiplied by
 *       filters 1 and biases 0).
 *
 *
 * @member {number} outChannelCount
 *   The output channel count which uses this input channel index range as non-pass-through range.
 */
class ChannelPartInfo extends ConvBiasActivation.ChannelPartInfo {

  /**
   */
  constructor( beginIndex, endIndex, outChannelCount ) {
    super( beginIndex, endIndex );
    this.outChannelCount = outChannelCount;
  }

  /**
   * @return {boolean}
   *   Return true, if the specified input channel index is out of this [ beginIndex, endIndex ] range.
   */
  isPassThrough_byInputChannelIndex( inChannelIndex ) {
    if ( ( inChannelIndex < this.beginIndex ) || ( inChannelIndex > this.endIndex ) )
      return true;
    return false;
  }      
}

