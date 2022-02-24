export { ChannelPartInfo, FiltersBiasesPartInfo };

/**
 * Half channels information. Describe channel index range of lower half or higher half.
 *
 * @member {number} inChannelBegin
 *   The beginning input channel index of this part.
 *
 * @member {number} inChannelEnd
 *   The ending input channel index of this part.
 *
 * @member {number} outputChannelCount
 *   The channel count of output.
 *
 * @member {boolean} bPassThrough
 *   If true, this is a pass-through part and it will pass-through input channel index in [ inChannelBegin, inChannelEnd ) to output.
 * Otherwise, this is a non-pass-through part and it will using filters and biases extracted from weights array to convolve input channel
 * index in [ inChannelBegin, inChannelEnd ) to output.
 */
class ChannelPartInfo {

  /**
   */
  constructor( inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough ) {
    this.inChannelBegin = inChannelBegin;
    this.inChannelEnd = inChannelEnd;    
    this.outputChannelCount = outputChannelCount;
    this.bPassThrough = bPassThrough;
  }

}

/**
 * Describe a range for a (pointwise) filters and a biases.
 *
 *
 * @member {number} inputChannelCount
 *   The input channel count of this parts.
 *
 * @member {ChannelPartInfo[]} aChannelPartInfoArray
 *   Every input-output relationship of this parts.
 *
 */
class FiltersBiasesPartInfo {

  /**
   *
   */
  constructor( inputChannelCount, aChannelPartInfoArray ) {
    this.inputChannelCount = inputChannelCount;
    this.aChannelPartInfoArray = aChannelPartInfoArray;
  }

}
