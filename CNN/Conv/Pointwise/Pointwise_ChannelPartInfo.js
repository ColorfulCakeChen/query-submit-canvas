export { ChannelPartInfo };
export { ChannelPartInfoPool };
export { FiltersBiasesPartInfo };
export { FiltersBiasesPartInfoPool };

import * as Pool from "../../util/Pool.js";

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
    ChannelPartInfo.setAsConstructor.call( this, inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough );
  }

  /**
   *
   * @param {ChannelPartInfo} this
   *   The object to be initialized.
   *
   * @return {ChannelPartInfo}
   *   Return the this object.
   */
  static setAsConstructor( inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough ) {
    this.inChannelBegin = inChannelBegin;
    this.inChannelEnd = inChannelEnd;    
    this.outputChannelCount = outputChannelCount;
    this.bPassThrough = bPassThrough;
    return this;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {
    this.bPassThrough = undefined;
    this.outputChannelCount = undefined;
    this.inChannelEnd = undefined;    
    this.inChannelBegin = undefined;
    //super.disposeResources();
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    ChannelPartInfoPool.Singleton.recycle( this );
  }

}


/**
 * Providing ChannelPartInfo.
 *
 */
class ChannelPartInfoPool extends Pool.Root {

  constructor() {
    super( "Pointwise.ChannelPartInfoPool", ChannelPartInfo, ChannelPartInfo.setAsConstructor );
  }

}

/**
 * Used as default Pointwise.ChannelPartInfo provider.
 */
ChannelPartInfoPool.Singleton = new ChannelPartInfoPool();


/**
 * Describe a range for a (pointwise) filters and a biases.
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
   * @param {FiltersBiasesPartInfo} this
   *   The object to be initialized.
   *
   * @return {FiltersBiasesPartInfo}
   *   Return the this object.
   */
  static setAsConstructor( aChannelPartInfoArray ) {
    this.aChannelPartInfoArray = aChannelPartInfoArray;
    return this;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {
    this.aChannelPartInfoArray = null; // Because the array is not created by this FiltersBiasesPartInfo, do not recyclye it here.
    //super.disposeResources();
  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    FiltersBiasesPartInfoPool.Singleton.recycle( this );
  }

}


/**
 * Providing FiltersBiasesPartInfo.
 *
 */
class FiltersBiasesPartInfoPool extends Pool.Root {

  constructor() {
    super( "Pointwise.FiltersBiasesPartInfoPool", FiltersBiasesPartInfo, FiltersBiasesPartInfo.setAsConstructor );
  }

}

/**
 * Used as default Pointwise.FiltersBiasesPartInfo provider.
 */
FiltersBiasesPartInfoPool.Singleton = new FiltersBiasesPartInfoPool();

