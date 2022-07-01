export { ChannelPartInfo };
export { FiltersBiasesPartInfo };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

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
class ChannelPartInfo extends Recyclable.Root {

  /**
   * Used as default Depthwise.ChannelPartInfo provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Depthwise.ChannelPartInfo.Pool", ChannelPartInfo, ChannelPartInfo.setAsConstructor );

  /**
   */
  constructor( inputChannelCount, effectFilterY_passThrough = -1, effectFilterX_passThrough = -1 ) {
    super();
    ChannelPartInfo.setAsConstructor_self.call( this, inputChannelCount, effectFilterY_passThrough, effectFilterX_passThrough );
  }

  /** @override */
  static setAsConstructor( inputChannelCount, effectFilterY_passThrough = -1, effectFilterX_passThrough = -1 ) {
    super.setAsConstructor();
    ChannelPartInfo.setAsConstructor_self.call( this, inputChannelCount, effectFilterY_passThrough, effectFilterX_passThrough );
    return this;
  }

  /** @override */
  static setAsConstructor_self( inputChannelCount, effectFilterY_passThrough = -1, effectFilterX_passThrough = -1 ) {
    this.inputChannelCount = inputChannelCount;
    this.effectFilterY_passThrough = effectFilterY_passThrough;
    this.effectFilterX_passThrough = effectFilterX_passThrough;

    this.bPassThrough = ( ( this.effectFilterY_passThrough >= 0 ) && ( this.effectFilterX_passThrough >= 0 ) );
  }

  /** @override */
  disposeResources() {
    this.bPassThrough = undefined;
    this.effectFilterX_passThrough = undefined;
    this.effectFilterY_passThrough = undefined;
    this.inputChannelCount = undefined;
    super.disposeResources();
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
 * Describe a range for a (depthwise) filters and a biases.
 *
 * It is an array of ChannelPartInfo. Every element describes input-output relationship of this parts. It owns and will
 * release these ChannelPartInfo.
 *
 */
class FiltersBiasesPartInfo extends Recyclable.OwnerArray {

  /**
   * Used as default Depthwise.FiltersBiasesPartInfo provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Depthwise.FiltersBiasesPartInfo.Pool", FiltersBiasesPartInfo, FiltersBiasesPartInfo.setAsConstructor );

  /**
   * Every element of restArgs should be instance of ChannelPartInfo (even if restArgs has only one element).
   *
   * Note: This behavior is different from original Array which will views the argement is length (not element) if only one argument
   *       is given.
   */
  constructor( ...restArgs ) {
    super( ...restArgs );
    FiltersBiasesPartInfo.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor( ...restArgs ) {
    super.setAsConstructor( ...restArgs );
    FiltersBiasesPartInfo.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor() {
    // Do nothing.
  }

  /** @override */
  disposeResources() {
    super.disposeResources();
  }

}

