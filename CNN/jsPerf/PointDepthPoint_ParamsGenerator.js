export { Base };

//import * as ParamDesc from "../Unpacker/ParamDesc.js";
import * as ValueDesc from "../Unpacker/ValueDesc.js";
import * as ValueRange from "../Unpacker/ValueRange.js";
import * as PointDepthPoint from "../Conv/PointDepthPoint.js";
import * as PointDepthPoint_Reference from "./PointDepthPoint_Reference.js";

class Base {

  constructor() {
  }

//!!! ...unfinished... (2021/05/21 Remarked) should use ValueRange.Same.valueGenerator()
  /**
   * @param {number} valueRangeMin
   *
   * @param {number} valueRangeMax
   *
   * @yield {number[]}
   *   Yield an array with two elements: [ valueInput, valueOutput ]. The valueOutput is a value from valueRangeMin to valueRangeMax.
   * The valueInput is a value which 
   */
  static *ValuePairGenerator( valueRangeMin, valueRangeMax ) {
     let generatedValuePair;
//!!! ...unfinished... (2021/05/21)
  }

}
