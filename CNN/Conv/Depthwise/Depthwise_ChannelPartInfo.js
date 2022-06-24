export { ChannelPartInfo };
export { ChannelPartInfoPool };
export { FiltersBiasesPartInfo };
export { FiltersBiasesPartInfoPool };

import * as Pool from "../../util/Pool.js";

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
class ChannelPartInfo {

  /**
   */
  constructor( inputChannelCount, effectFilterY_passThrough = -1, effectFilterX_passThrough = -1 ) {
    this.setAsConstructor( inputChannelCount, effectFilterY_passThrough, effectFilterX_passThrough );
  }

  /**
   * @return {ChannelPartInfo}
   *   Return the this object.
   */
  setAsConstructor( inputChannelCount, effectFilterY_passThrough = -1, effectFilterX_passThrough = -1 ) {
    this.inputChannelCount = inputChannelCount;
    this.effectFilterY_passThrough = effectFilterY_passThrough;
    this.effectFilterX_passThrough = effectFilterX_passThrough;

    this.bPassThrough = ( ( this.effectFilterY_passThrough >= 0 ) && ( this.effectFilterX_passThrough >= 0 ) );
    return this;
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    //this.disposeResources();
    ChannelPartInfoPool.Singleton.recycle( this );
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


/**
 * Providing ChannelPartInfo.
 *
 */
class ChannelPartInfoPool extends Pool.Root {

  constructor() {
    super( "Depthwise.ChannelPartInfoPool", ChannelPartInfo, ChannelPartInfo.setAsConstructor );
  }

}

/**
 * Used as default Depthwise.ChannelPartInfo provider.
 */
ChannelPartInfoPool.Singleton = new ChannelPartInfoPool();


/**
 * Describe a range for a (depthwise) filters and a biases.
 *
 *
 * @member {ChannelPartInfo[]} aChannelPartInfoArray
 *   Every input-output relationship of this parts.
 *
 */
class FiltersBiasesPartInfo {

  /**
   *
   */
  constructor( aChannelPartInfoArray ) {
    this.aChannelPartInfoArray = aChannelPartInfoArray;
  }

  /**
   *
   * @return {FiltersBiasesPartInfo}
   *   Return the this object.
   */
  setAsConstructor( aChannelPartInfoArray ) {
    this.aChannelPartInfoArray = aChannelPartInfoArray;
    return this;
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    //this.disposeResources();
    FiltersBiasesPartInfoPool.Singleton.recycle( this );
  }

}


/**
 * Providing FiltersBiasesPartInfo.
 *
 */
class FiltersBiasesPartInfoPool extends Pool.Root {

  constructor() {
    super( "Depthwise.FiltersBiasesPartInfoPool", FiltersBiasesPartInfo, FiltersBiasesPartInfo.setAsConstructor );
  }

}

/**
 * Used as default Depthwise.FiltersBiasesPartInfo provider.
 */
FiltersBiasesPartInfoPool.Singleton = new FiltersBiasesPartInfoPool();

