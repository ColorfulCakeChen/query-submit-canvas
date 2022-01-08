export { ChannelPartInfo };

import * as ConvBiasActivation from "../ConvBiasActivation.js";

/**
 * Half channels information. Describe channel index range of lower half or higher half.
 *

//!!! (2022/01/08 Remarked) Wrong!
//  *   - When input channel index is between [ this.beginIndex, this.endIndex ], the input channel will be used as normal (i.e. multiplied by
//  *       filters and biases weights extracted from source weights).
//  *
//  *   - When input channel index is outside [ this.beginIndex, this.endIndex ], the input channel will be past-through (i.e. multiplied by
//  *       filters 1 and biases 0).

 *
 *
 * @member {number} outChannelCount
 *   The output channel count which uses [ this.beginIndex, this.endIndex ] as input channel index range.
 *
 * @member {boolean} bPassThrough
 *   If true, the output channel will pass-through input to output. 
 */
class ChannelPartInfo extends ConvBiasActivation.ChannelPartInfo {

  /**
   */
  constructor( beginIndex, endIndex, outChannelCount, bPassThrough ) {
    super( beginIndex, endIndex );
    this.outChannelCount = outChannelCount;
    this.bPassThrough = bPassThrough;
  }

//!!! (2022/01/08 Remarked) Wrong!
//   /**
//    * @return {boolean}
//    *   Return true, if the specified input channel index is out of this [ beginIndex, endIndex ] range.
//    */
//   isPassThrough_byInputChannelIndex( inChannelIndex ) {
//     if ( ( inChannelIndex < this.beginIndex ) || ( inChannelIndex > this.endIndex ) )
//       return true;
//     return false;
//   }      
}

