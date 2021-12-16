export { Base };

import * as ConvBiasActivation from "../../../Conv/ConvBiasActivation.js";

/**
 * Image composed from numbers. For testing.
 *
 *
 * @member {number}   height    Image height
 * @member {number}   width     Image width
 * @member {number}   depth     Image channel count
 * @member {number[]|Float32Array} dataArray Image data
 *
 * @member {ConvBiasActivation.ValueBoundsSet} valueBoundsSet
 *   The element value bounds set of the pointwise or depthwise convolution.
 */
class Base {
  
  constructor( height, width, depth, dataArray, valueBoundsSet = new ConvBiasActivation.ValueBoundsSet() ) {
    this.height = height;
    this.width = width;
    this.depth = depth;
    this.dataArray = dataArray;
    this.valueBoundsSet = valueBoundsSet;
  }

}
 
