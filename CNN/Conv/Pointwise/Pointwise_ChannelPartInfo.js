export { ChannelPartInfo };
export { FiltersBiasesPartInfo };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

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
class ChannelPartInfo extends Recyclable.Root {

  /**
   * Used as default Pointwise.ChannelPartInfo provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Pointwise.ChannelPartInfo.Pool", ChannelPartInfo, ChannelPartInfo.setAsConstructor );

  /**
   */
  constructor( inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough ) {
    super();
    ChannelPartInfo.setAsConstructor_self.call( this, inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough );
  }

  /** @override */
  static setAsConstructor( inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough ) {
    super.setAsConstructor();
    ChannelPartInfo.setAsConstructor_self.call( this, inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough );
    return this;
  }

  /** @override */
  static setAsConstructor_self( inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough ) {
    this.inChannelBegin = inChannelBegin;
    this.inChannelEnd = inChannelEnd;    
    this.outputChannelCount = outputChannelCount;
    this.bPassThrough = bPassThrough;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {
    this.bPassThrough = undefined;
    this.outputChannelCount = undefined;
    this.inChannelEnd = undefined;    
    this.inChannelBegin = undefined;
    super.disposeResources();
  }

}


/**
 * Describe a range for a (pointwise) filters and a biases.
 *
 *
 * @member {ChannelPartInfo[]} aChannelPartInfoArray
 *   Every input-output relationship of this parts.
 *
 */
class FiltersBiasesPartInfo extends Recyclable.Root {

  /**
   * Used as default Pointwise.FiltersBiasesPartInfo provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Pointwise.FiltersBiasesPartInfo.Pool", FiltersBiasesPartInfo, FiltersBiasesPartInfo.setAsConstructor );

  /**
   *
   */
  constructor( aChannelPartInfoArray ) {
    super();
    FiltersBiasesPartInfo.setAsConstructor_self.call( this, aChannelPartInfoArray );
  }

  /** @override */
  static setAsConstructor( aChannelPartInfoArray ) {
    super.setAsConstructor();
    FiltersBiasesPartInfo.setAsConstructor_self.call( this, aChannelPartInfoArray );
    return this;
  }

  /** @override */
  static setAsConstructor_self( aChannelPartInfoArray ) {
    this.aChannelPartInfoArray = aChannelPartInfoArray;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {
    this.aChannelPartInfoArray = null; // Because the array is not created by this FiltersBiasesPartInfo, do not recyclye it here.
    super.disposeResources();
  }

}

