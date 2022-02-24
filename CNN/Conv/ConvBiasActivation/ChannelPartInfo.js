// (2022/02/24) Deprecated.

export { ChannelPartInfo };

/**
 * Half channels information. Describe channel index range of lower half or higher half.
 *
 * @member {number} inChannelBegin
 *   The beginning channel index of this half input channels.
 *
 * @member {number} inChannelEnd
 *   The ending channel index of this half input channels.
 *
 */
class ChannelPartInfo {

  /**
   *
   */
  constructor( inChannelBegin, inChannelEnd ) {
    this.inChannelBegin = inChannelBegin;
    this.inChannelEnd = inChannelEnd;
  }

}
