export { ParamDescConfig, Base };

import * as RandTools from "../../util/RandTools.js";
//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
//import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as ValueRange from "../../Unpacker/ValueRange.js";

/**
 * Describe which parameter and how many combination for the parameter.
 *
 * @member {ParamDesc.Base} paramDesc
 *   Which parameter to be used in the permutation.
 *
 * @member {number} maxKinds
 *   An integer restricts the generator range to [ 0, maxKinds ] instead of [ 0, paramDesc.valueDesc.range.kinds ].
 * If ( maxKinds == undefined ), the default is paramDesc.valueDesc.range.kinds. This parameter could lower the kinds
 * to reduce test cases quantity. If zero or negative, only one value (between [ 0, paramDesc.valueDesc.range.kinds ]
 * randomly) will be generated. In fact, this is the maxKinds parameter of ValueRange.XXX.valueInputOutputGenerator().
 *
 *
 *
 */
class ParamDescConfig {
  constructor( paramDesc, maxKinds ) {
    this.paramDesc = this.paramDesc;
    this.maxKinds = this.maxKinds;
  }
}


/**
 * Responsible for generating testing Params.
 */
class Base {

  /**
   * @param {ParamDescConfig[]} paramDescConfigArray
   *   List all the parameters to be used in permutation combination.
   *
   */
  constructor( paramDescConfigArray ) {
    this.paramDescConfigArray = paramDescConfigArray;
  }

  /**
   *
   *
   *
   * @yield {Base}
   *   Yield an object PointDepthPoint_Base.Base.
   */
  * ParamsGenerator() {

    this.paramsNumberArrayObject = {}; // All parameters which will be packed into weights array.
    this.result = new Base();

    yield *this.permuteParamRecursively( 0 );
  }

  /**
   * This method will modify this.result and this.paramsNumberArrayObject. It also calls itself recursively to permute all parameters.
   *
   * @param {number} currentParamDescIndex
   *   The index into the this.paramDescArray[]. It represents the current parameter to be tried.
   *
   * @yield {Base}
   *   Every time one kind of parameters' combination is generated, the this.result will be yielded.
   */
  * permuteParamRecursively( currentParamDescConfigIndex ) {

    if ( currentParamDescConfigIndex >= this.paramDescConfigArray.length ) { // All parameters are used to be composed as one kind of combination.
      ++this.result.id;  // Complete one kind of combination.

      // For testing not start at the offset 0.
      let weightsElementOffsetBegin = RandTools.getRandomIntInclusive( 0, 3 ); // Skip a random un-used element count.

      this.result.set_By_ParamsNumberArrayMap_ParamsOut(
        this.channelCount0_pointwise1Before, this.paramsNumberArrayObject, this.result.out, weightsElementOffsetBegin );

      yield this.result;
      return; // Stop this recusive. Back-track to another parameters combination.
    }

    let nextParamDescConfigIndex = currentParamDescConfigIndex + 1;

    let paramDescConfig = this.paramDescConfigArray[ currentParamDescConfigIndex ];
    let paramDesc = paramDescConfig.paramDesc;
    for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( undefined, paramDescConfig.maxKinds ) ) {

      //!!! (2021/07/06 Temp Debug) Check the algorithm might be wrong.
      //if ( paramDesc.valueDesc.range.adjust( pair.valueInput ) != pair.valueOutput )
      //  debugger;

      this.result.out[ paramDesc.paramName ] = pair.valueOutput;

      // Randomly place the parameter directly or in weights array.
//!!! (2021/07/19 Temp Remarked)
      let dice = Math.random();
//      let dice = 0;
      if ( dice < 0.5 ) {
        // Try parameter value assigned directly (i.e. by specifying).      
        this.result.in[ paramDesc.paramName ] = pair.valueInput;
        yield *this.permuteParamRecursively( nextParamDescConfigIndex );

      } else {
        // Try parameter value assigned from inputFloat32Array (i.e. by evolution).
        this.result.in[ paramDesc.paramName ] = null;
        this.paramsNumberArrayObject[ paramDesc.paramName ] = [ pair.valueInput ];
        yield *this.permuteParamRecursively( nextParamDescConfigIndex );

        this.paramsNumberArrayObject[ paramDesc.paramName ] = undefined; // So that it could be re-tried as by-specifying when backtracking.
      }
    }
  }

}
