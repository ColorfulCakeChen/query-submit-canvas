export { ChannelPartInfo };

/**
 * Half channels information. Describe channel index range of lower half or higher half.
 *
 * @member {number} beginIndex
 *   The beginning channel index of this half channels.
 *
 * @member {number} endIndex
 *   The ending channel index of this half channels.
 *
 */
class ChannelPartInfo {

  /**
   *
   */
  constructor( beginIndex, endIndex ) {
    this.beginIndex = beginIndex;
    this.endIndex = endIndex;
  }

}
