export { ChannelPartInfo, ChannelPart, FiltersBiasesPartInfo };

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
 * The value of generator FiltersBiasesPartInfo.ChannelPartGenerator( this.outputChannelCount, inChannel ).next().
 */
class ChannelPart {

//   ChannelPart.info (i.e. ChannelPartInfo)
//   ChannelPart.outChannelSub
//   ChannelPart.outChannel
//   ChannelPart.outChannelEnd
//   ChannelPart.inChannelToBegin

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

  /**
   *
   * @param {number} outputChannelCount
   *   The total output channel count which is used as the upper bounds of yielded ChannelPart.outChannel.
   *
   * @param {number} inChannel
   *   The current input channel index which is used to calculate ChannelPart.inChannelToBegin.
   *
   * @return {Generator}
   *   Return a generator whose .next().value will be a ChannelPart object.
   */
  * ChannelPartGenerator( outputChannelCount, inChannel ) {

//!!! ...unfifnished... (2022/04/01)

  }

//!!! ...unfifnished... (2022/02/24)
//   /**
//    * @return {number}
//    *   Total output channel count of this.aChannelPartInfoArray.
//    */
//   get outputChannelCountTotal() {
//   }
}
