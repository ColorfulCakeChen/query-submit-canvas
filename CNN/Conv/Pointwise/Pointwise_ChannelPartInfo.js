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
    this.setAsConstructor( inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough );
  }

  /**
   *
   * @return {ChannelPartInfo}
   *   Return the this object.
   */
  setAsConstructor( inChannelBegin, inChannelEnd, outputChannelCount, bPassThrough ) {
    this.inChannelBegin = inChannelBegin;
    this.inChannelEnd = inChannelEnd;    
    this.outputChannelCount = outputChannelCount;
    this.bPassThrough = bPassThrough;
    return this;
  }

}


/**
 * Providing ChannelPartInfo.
 *
 */
class ChannelPartInfoPool extends Pool.Root {

  constructor() {
    super( ChannelPartInfo, ChannelPartInfo.setAsConstructor );
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
   * @return {ChannelPartInfo}
   *   Return the this object.
   */
  setAsConstructor( aChannelPartInfoArray ) {
    this.aChannelPartInfoArray = aChannelPartInfoArray;
    return this;
  }

}


/**
 * Providing FiltersBiasesPartInfo.
 *
 */
class FiltersBiasesPartInfoPool extends Pool.Root {

  constructor() {
    super( FiltersBiasesPartInfo, FiltersBiasesPartInfo.setAsConstructor );
  }

}

/**
 * Used as default Pointwise.FiltersBiasesPartInfo provider.
 */
FiltersBiasesPartInfoPool.Singleton = new FiltersBiasesPartInfoPool();

