export { ChannelPartInfo };

//!!! (2022/02/23 Remarked) Use inputChannelCount instead of inChannelBegin and inChannelEnd.
//import * as ConvBiasActivation from "../ConvBiasActivation.js";

/**
 * Half channels information. Describe channel index range of lower half or higher half.
 *
 *
 * @member {number} inputChannelCount
 *   This ChannelPart includes how many input channels.
 *
 * @member {number} effectFilterY_passThrough, effectFilterX_passThrough
 *   For pass-through filters, there is only one position (inside the effect depthwise filter) with non-zero value. All other
 * positions of the filters should be zero.
 *   - Note: Unfortunately, the pass-through feature may not work for ( dilation > 1 ) because the non-zero-filter-value might
 *       be just at the dilation position which does not exist in a filter. So, only ( dilation == 1 ) is supported.
 *   - Negative value means this part is not for pass-through.
 *
 * @member {boolean} bPassThrough
 *   If true, this is the half channels for pass-through input to output.
 */
//!!! (2022/02/23 Remarked) Use inputChannelCount instead of inChannelBegin and inChannelEnd.
//class ChannelPartInfo extends ConvBiasActivation.ChannelPartInfo {
class ChannelPartInfo {

  /**
   */
//!!! (2022/02/23 Remarked) Use inputChannelCount instead of inChannelBegin and inChannelEnd.
//   constructor( inChannelBegin, inChannelEnd, effectFilterY_passThrough = -1, effectFilterX_passThrough = -1 ) {
//     super( inChannelBegin, inChannelEnd );
  constructor( inputChannelCount, effectFilterY_passThrough = -1, effectFilterX_passThrough = -1 ) {
    this.inputChannelCount = inputChannelCount;
    this.effectFilterY_passThrough = effectFilterY_passThrough;
    this.effectFilterX_passThrough = effectFilterX_passThrough;

    this.bPassThrough = ( ( this.effectFilterY_passThrough >= 0 ) && ( this.effectFilterX_passThrough >= 0 ) );
  }

  /**
   * @return {boolean} Return true, if the specified position should be non-zero for pass-through input to output.
   */
  isPassThrough_FilterPosition_NonZero( effectFilterY, effectFilterX ) {
    if ( ( effectFilterY == this.effectFilterY_passThrough ) && ( effectFilterX == this.effectFilterX_passThrough ) )
      return true;
    return false;
  }      
}

