export { ParamDescConfig, Base };


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
 */
class ParamDescConfig {
  constructor( paramDesc, valueOutMinMax ) {
    this.paramDesc = paramDesc;
    this.valueOutMinMax = valueOutMinMax;
  }
}


/**
 * @member {ParamDesc.Xxx} paramDesc    Which parameter is changed.
 * @member {number}  inValue_original    The parameter's original input value.
 * @member {integer} outValue_original  The parameter's original output value.
 * @member {number}  inValue_new         The parameter's new input value.
 * @member {integer} outValue_new       The parameter's new output value. This is adjusted value of outValue_specified.
 * @member {integer} outValue_specified The parameter's output value which is wanted.
 */
class ParamValueChangeRecord {
  constructor( paramDesc, inValue_original, outValue_original, inValue_new, outValue_new, outValue_specified ) {
    this.paramDesc = paramDesc;
    this.inValue_original = inValue_original;
    this.outValue_original = outValue_original;
    this.inValue_new = inValue_new;
    this.outValue_new = outValue_new;
    this.outValue_specified = outValue_specified;
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
 *   The numeric identifier of this testing parameter combination. No matter onYield_isLegal() is true or false, every combination
 * has its own id. The first id is 0 (not 1).
 *
 * @member {number} yieldCount
 *   How many legal (i.e. ( onYield_isLegal() == true ) ) TestParams are yielded.
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
 * @member {ParamValueChangeRecord[]} modifyParamValueHistory
 *   A record will be pushed into this list when calling this.modifyParamValue(). When call this.restoreParamValues(),
 * these value will be restored and this list will be cleared to empty.
 *
 */
class Base {

  /**
   *
   */
  constructor( id = -1 ) {
    this.id = id;
    this.yieldCount = 0;
    this.in = { paramsNumberArrayObject: {} };
    this.out = {};
    this.modifyParamValueHistory = [];
  }

  /**
   * Called by permuteParamRecursively() before onYield_before() is called.
   *
   * The the following data should already be ready:
   *   - this.id
   *   - this.in.paramsNumberArrayObject: Every should-be-packed parameter.
   *   - this.in.Xxx: every non-packed parameter.
   *   - this.out.Xxx: every parameter.
   *
   * Sub-class should override this method.
   *
   * @return {boolean}
   *   If return true, the onYield_before() will be called. If return false, it mean this configuration is illegal so that there
   * is no yield will be done (i.e. onYield_before() and onYield_after() will not be called).
   */
  onYield_isLegal() {
    return true;
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
  onYield_before() {
  }

  /**
   * Called by permuteParamRecursively() when a combination of parameters is complete and after this object has been yielded.
   *
   * Usually, this method should clear some temperary data members.
   *
   * Sub-class should override this method.
   */
  onYield_after() {
  }

  /**
   * Modify specified parameter's value and record in this.modifyParamValueHistory so that they could be restore by restoreParamValues().
   *
   * @param {ParamDesc.Xxx} paramDesc
   *   The parameter to be doubled.
   *
   * @param {integer} outValue_specified
   *   The new value to be placed at the this.out[ paramDesc.paramName ].
   */
  modifyParamValue( paramDesc, outValue_specified ) {
    let paramName = paramDesc.paramName;

    let outValue_original = this.out[ paramName ];
    if ( outValue_original == undefined )
      return; // The parameter does not exist. No need to modify it.

    let valueDesc = paramDesc.valueDesc;
    let valueRange = valueDesc.range;

    let outValue_new = valueRange.adjust( outValue_specified ); // Confirm the new value is legal.

    this.out[ paramName ] = outValue_new;

    let inValue_original, inValue_new;

    let singleMinMax = [ outValue_new, outValue_new ]; // Only generate one new value.
    for ( let pair of valueRange.valueInputOutputGenerator( undefined, singleMinMax ) ) {

      inValue_new = pair.valueInput;

      if ( this.in[ paramName ] != undefined ) {
        inValue_original = this.in[ paramName ];
        this.in[ paramName ] = inValue_new;
      }

      if ( this.in.paramsNumberArrayObject[ paramName ] != undefined ) { // Note: If the element exists, it must be an array.
        inValue_original = this.in.paramsNumberArrayObject[ paramName ][ 0 ];
        this.in.paramsNumberArrayObject[ paramName ][ 0 ] = inValue_new; // The value is always at the element 0.
      }
    }

    let changeRecord = new ParamValueChangeRecord( paramDesc, inValue_original, outValue_original, inValue_new, outValue_new, outValue_specified );
    this.modifyParamValueHistory.push( changeRecord );
  }

  /**
   * Restore parameters' values according to this.modifyParamValueHistory. And empty this.modifyParamValueHistory.
   */
  restoreParamValues() {
    for ( let i = this.modifyParamValueHistory.length - 1; i >= 0; --i ) { // From the last to first.
      let changeRecord = this.modifyParamValueHistory[ i ];
      let paramName = changeRecord.paramDesc.paramName;

      if ( this.out[ paramName ] != undefined )
        this.out[ paramName ] = changeRecord.outValue_original;

      if ( this.in[ paramName ] != undefined ) {
        this.in[ paramName ] = changeRecord.inValue_original;
      }

      if ( this.in.paramsNumberArrayObject[ paramName ] != undefined ) { // Note: If the element exists, it must be an array.
        this.in.paramsNumberArrayObject[ paramName ][ 0 ] = changeRecord.inValue_original; // The value is always at the element 0.
      }
    }
    
    this.modifyParamValueHistory.length = 0; // Clear history.
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

      ++this.id; // Every combination has unique id no matter whether is legal to be yielded.

      let bLegalToYield = this.onYield_isLegal();
      if ( bLegalToYield ) {

        ++this.yieldCount;  // Complete one kind of combination.

        this.onYield_before();
        yield this;
        this.onYield_after();
        this.restoreParamValues(); // Restore this object because onYield_before() may modify it.
      }

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

      //!!! (2021/07/19 Temp Used) For testing without randomly.
      //let dice = 0;
      let dice = Math.random();
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
