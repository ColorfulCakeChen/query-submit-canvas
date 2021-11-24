export { ParamDescConfig, Base };

//import * as ParamDesc from "../../Unpacker/ParamDesc.js";
//import * as ValueDesc from "../../Unpacker/ValueDesc.js";
//import * as ValueRange from "../../Unpacker/ValueRange.js";


/**
 * Describe which parameter and how many combination for the parameter.
 *
 *
 * @member {ParamDesc.Base} paramDesc
 *   Which parameter to be used in the permutation.
 *
 * @member {number[]} valueOutMinMax
 *   An integer array restricts the generator range to [ valueOutMin, valueOutMax ]. Itself will be restricted to
 * [ paramDesc.valueDesc.range.min, paramDesc.valueDesc.range.max ] at most. When this.kinds is large, this parameter
 * could lower the kinds to reduce test cases quantity. If null or undefined, only one value (between
 * [ paramDesc.valueDesc.range.min, paramDesc.valueDesc.range.max ] randomly) will be generated. In fact, this is the
 * valueOutMinMax parameter of ValueRange.XXX.valueInputOutputGenerator().
 *
//!!! (2021/10/05 Remarked) Replaced by valueOutMinMax.
//  * @member {number} maxKinds
//  *   An integer restricts the generator range to [ 0, maxKinds ] instead of [ 0, paramDesc.valueDesc.range.kinds ].
//  * If ( maxKinds == undefined ), the default is paramDesc.valueDesc.range.kinds. This parameter could lower the kinds
//  * to reduce test cases quantity. If zero or negative, only one value (between [ 0, paramDesc.valueDesc.range.kinds ]
//  * randomly) will be generated. In fact, this is the maxKinds parameter of ValueRange.XXX.valueInputOutputGenerator().
 */
class ParamDescConfig {
  constructor( paramDesc, valueOutMinMax ) {
    this.paramDesc = paramDesc;
    this.valueOutMinMax = valueOutMinMax;
  }
}


/**
 * This is an object { config, id, in, out } which has one number and two sub-objects.
 *
 * @member {object} config
 *   The configuration for generating parameters combination.
 *
 * @param {ParamDescConfig[]} config.paramDescConfigArray
 *   List all the parameters to be used in permutation combination.
 *
 * @member {number} id
 *   The numeric identifier of this testing parameter combination.
 *
 * @member {object} in
 *   The "in" sub-object's data members represent every parameters of some (e.g. PointDepthPoint) Params's constructor. Besides,
 * it also has the following properties:
 *   - paramsNumberArrayObject: All (non-concatenated) parameters (include filters and biases) which will be packed into inputFloat32Array.
 *   - inputFloat32Array: A packed Float32Array from paramsNumberArrayObject with byteOffsetBegin.
 *   - byteOffsetBegin: The offset in inputFloat32Array to the first parameter.
 *
 * @member {object} out
 *   The "out" sub-object's data members represent the "should-be" result of some (e.g. PointDepthPoint) Params.extract().
 * That is, it has the data members of this.in except inputFloat32Array, byteOffsetBegin, weights.
 *
 */
class Base {

  /**
   *
   */
  constructor( id = -1 ) {
    this.id = id;
    this.in = { paramsNumberArrayObject: {} };
    this.out = {};
  }

  /**
   * Called by permuteParamRecursively() when a combination of parameters is complete and before this object to be yielded.
   *
   * The the following data should already be ready:
   *   - this.id
   *   - this.in.paramsNumberArrayObject: Every should-be-packed parameter.
   *   - this.in.Xxx: every non-packed parameter.
   *   - this.out.Xxx: every parameter.
   *
   * This method should fill the following data:
   *   - this.in.inputFloat32Array
   *   - this.in.byteOffsetBegin
   *
   * Sub-class should override this method.
   */
  onBefore_Yield() {
  }

  /**
   * Called by permuteParamRecursively() when a combination of parameters is complete and after this object has been yielded.
   *
   * Usually, this method should clear some temperary data members.
   *
   * Sub-class should override this method.
   */
  onAfter_Yield() {
  }

  /**
   *
   * @param {ParamDesc.Xxx} paramDesc
   *   The parameter to be doubled.
   *
   * @param {integer} newValue
   *   The new value to be placed at the parameter.
   */
  modifyParamValue( paramDesc, newValue ) {
    let paramName = paramDesc.paramName;

    let outValue_original = this.out[ paramName ];
    if ( outValue_original == undefined )
      return; // The parameter does not exist. No need to modify it.

    let valueDesc = paramDesc.valueDesc;
    let valueRange = valueDesc.range;

    let outValue_modified = valueRange.adjust( newValue ); // force legal.

    let singleMinMax = [ outValue_modified, outValue_modified ]; // Only generate one new value.
    for ( let pair of valueRange.valueInputOutputGenerator( undefined, singleMinMax ) ) {

      if ( this.in[ paramName ] != undefined ) {
        this.in[ paramName ] = pair.valueInput;
      }

      if ( this.in.paramsNumberArrayObject[ paramName ] != undefined ) {     // Note: If the element exists, it must be an array.
        this.in.paramsNumberArrayObject[ paramName ][ 0 ] = pair.valueInput; // The value is always at the element 0.
      }
    }
  }

  /**
   * Responsible for generating testing paramters combinations.
   *
   * @param {ParamDescConfig[]} paramDescConfigArray
   *   List all the parameters to be used in permutation combination.
   *
   * @yield {Base}
   *   Yield this object itself. The returned object (it is this object itself) should not be modified because it will be re-used.
   */
  static * ParamsGenerator( paramDescConfigArray ) {
    this.config = { paramDescConfigArray: paramDescConfigArray };

    this.in.paramsNumberArrayObject = {}; // All parameters which will be packed into weights array.
    yield *Base.permuteParamRecursively.call( this, 0 );
  }

  /**
   * This method will modify this.id and this.in.paramsNumberArrayObject. It also calls itself recursively to permute all parameters.
   *
   * @param {number} currentParamDescIndex
   *   The index into the this.paramDescArray[]. It represents the current parameter to be tried.
   *
   * @yield {Base}
   *   Every time one kind of parameters' combination is generated, the this.result will be yielded.
   */
  static * permuteParamRecursively( currentParamDescConfigIndex ) {

    if ( currentParamDescConfigIndex >= this.config.paramDescConfigArray.length ) {
      // All parameters are used to be composed as one kind of combination.

      ++this.id;  // Complete one kind of combination.

      this.onBefore_Yield();
      yield this;
      this.onAfter_Yield();

      return; // Stop this recusive. Back-track to another parameters combination.
    }

    let nextParamDescConfigIndex = currentParamDescConfigIndex + 1;

    let paramDescConfig = this.config.paramDescConfigArray[ currentParamDescConfigIndex ];
    let paramDesc = paramDescConfig.paramDesc;
    for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator( undefined, paramDescConfig.valueOutMinMax ) ) {

      //!!! (2021/07/06 Temp Debug) Check the algorithm might be wrong.
      //if ( paramDesc.valueDesc.range.adjust( pair.valueInput ) != pair.valueOutput )
      //  debugger;

      this.out[ paramDesc.paramName ] = pair.valueOutput;

      // Randomly place the parameter directly or in weights array.
//!!! (2021/07/19 Temp Remarked)
      let dice = Math.random();
//      let dice = 0;
      if ( dice < 0.5 ) {
        // Try parameter value assigned directly (i.e. by specifying).      
        this.in[ paramDesc.paramName ] = pair.valueInput;
        yield *Base.permuteParamRecursively.call( this, nextParamDescConfigIndex );

      } else {
        // Try parameter value assigned from inputFloat32Array (i.e. by evolution).
        this.in[ paramDesc.paramName ] = null;
        this.in.paramsNumberArrayObject[ paramDesc.paramName ] = [ pair.valueInput ];
        yield *Base.permuteParamRecursively.call( this, nextParamDescConfigIndex );

        this.in.paramsNumberArrayObject[ paramDesc.paramName ] = undefined; // So that it could be re-tried as by-specifying when backtracking.
      }
    }
  }

}
