export { OutputChannelPartInfo };

/**
 * Half channels information. Describe channel index range of lower half or higher half.
 *
 * @member {number} outputChannelCount
 *   The channel count of output.
 *
 * @member {number} inputChannelIndexStart
 *   If non-negative (i.e. zero or positive), this is a pass-through part and it is the input channel index (included) to start to be
 * past-through from input to output. If negative, this is a non-pass-through part (i.e. using filters and biases extracted from weights
 * array).
 */
class OutputChannelPartInfo {

  /**
   */
  constructor( outputChannelCount, inputChannelIndexStart = -1 ) {
    this.outputChannelCount = outputChannelCount;
    this.inputChannelIndexStart = inputChannelIndexStart;
  }

  /**
   * @return {boolean}
   *   If ( this.inputChannelIndexStart >= 0 ), return true which means this is a pass-through part.
   */
  isPassThrough() {
    if ( this.inputChannelIndexStart >= 0 )
      return true;
    return false;
  }

}

