export { ParamDescConfig, ParamDescConfigAll };
export { TestParams_Base as Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
import * as NameNumberArrayObject from "../../util/NameNumberArrayObject.js";
import * as FloatValue from "../../Unpacker/FloatValue.js";
import * as SequenceRandom_NumberArray from "./SequenceRandom_NumberArray.js";

/**
 * Describe which parameter and how many combination for the parameter.
 *
 *
 * @member {ParamDesc.Base} paramDesc
 *   Which parameter to be used in the permutation.
 *
 * @member {number[]} valueOutMinMax
 *   An integer array restricts the generator range to
 * [ valueOutMin, valueOutMax ]. Itself will be restricted to
 * [ paramDesc.valueDesc.range.min, paramDesc.valueDesc.range.max ] at most.
 * When this.kinds is large, this parameter could lower the kinds to reduce
 * test cases quantity. If null or undefined, only one value (between
 * [ paramDesc.valueDesc.range.min, paramDesc.valueDesc.range.max ] randomly)
 * will be generated. In fact, this is the valueOutMinMax parameter of
 * ValueRange.XXX.valueInputOutputGenerator().
 *
 */
class ParamDescConfig {
  constructor( paramDesc, valueOutMinMax ) {
    this.paramDesc = paramDesc;
    this.valueOutMinMax = valueOutMinMax;
  }
}


/**
 * Describe all ParamDescConfig.
 *
 *
 * @member {ParamDescConfig[]} paramDescConfigArray
 *   List all the parameters to be used in permutation combination.
 */
class ParamDescConfigAll {

  /**
   * 
   */
  constructor( paramDescConfigArray ) {
    this.paramDescConfigArray = paramDescConfigArray;

    // Prepare an re-usable object for placing the value pair of every
    // ParamDesc. (For reducing memory re-allocation.)
    //
    // (2025/06/19)
    {
      const paramValuePairArray = this.paramValuePairArray
        = new Array( paramDescConfigArray.length );

      for ( let i = 0; i < paramValuePairArray.length; ++i ) {
        paramValuePairArray[ i ] = {};
      }
    }
  }

  /**
   * @return {number}
   *   Return the amount of all the parameters permutation combination.
   */
  calcPermutationCombinationCount() {
    let paramDescConfig;
    const paramDescConfigArray = this.paramDescConfigArray;
    for ( let i = 0; i < paramDescConfigArray.length; ++i ) {
      paramDescConfig = paramDescConfigArray[ i ];
      const valueRange = paramDescConfig.paramDesc.valueDesc.range;

!!! ...unfinished... (2025/06/19)
      .valueOutMinMax_adjust_and_calcDifference
    }


  }
}


/**
 * @member {ParamDesc.Xxx} paramDesc
 *   Which parameter is changed.
 *
 * @member {number} inValue_original
 *   The parameter's original input value.
 *
 * @member {integer} outValue_original
 *   The parameter's original output value.
 *
 * @member {number} inValue_new
 *   The parameter's new input value.
 *
 * @member {integer} outValue_new
 *   The parameter's new output value. This is adjusted value of
 * outValue_specified.
 *
 * @member {integer} outValue_specified
 *  The parameter's output value which is wanted.
 */
class ParamValueChangeRecord extends Recyclable.Root {

  /**
   * Used as default TestParams.ParamValueChangeRecord provider for
   * conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "TestParams.ParamValueChangeRecord.Pool",
    ParamValueChangeRecord );

  /**
   */
  constructor( paramDesc,
    inValue_original, outValue_original,
    inValue_new, outValue_new,
    outValue_specified ) {

    super();
    this.#setAsConstructor_self(
      paramDesc,
      inValue_original, outValue_original,
      inValue_new, outValue_new,
      outValue_specified );
  }

  /** @override */
  setAsConstructor( paramDesc,
    inValue_original, outValue_original,
    inValue_new, outValue_new,
    outValue_specified ) {

    super.setAsConstructor();
    this.#setAsConstructor_self(
      paramDesc,
      inValue_original, outValue_original,
      inValue_new, outValue_new,
      outValue_specified );
  }

  /**  */
  #setAsConstructor_self( paramDesc,
    inValue_original, outValue_original,
    inValue_new, outValue_new,
    outValue_specified ) {

    this.paramDesc = paramDesc;
    this.inValue_original = inValue_original;
    this.outValue_original = outValue_original;
    this.inValue_new = inValue_new;
    this.outValue_new = outValue_new;
    this.outValue_specified = outValue_specified;
  }

  /** @override */
  disposeResources() {
    this.paramDesc = undefined;
    this.inValue_original = undefined;
    this.outValue_original = undefined;
    this.inValue_new = undefined;
    this.outValue_new = undefined;
    this.outValue_specified = undefined;
    super.disposeResources();
  }

}


/**
 * This is an object { config, id, in, out } which has one number and
 * two sub-objects.
 *
 * @member {object} config
 *   The configuration for generating parameters combination.
 *
 * @param {ParamDescConfig[]} config.paramDescConfigArray
 *   List all the parameters to be used in permutation combination.
 *
 * @member {number} id
 *   The numeric identifier of this testing parameter combination. No matter
 * onYield_isLegal() is true or false, every combination has its own id. The
 * first id is 0 (not 1).
 *
 * @member {number} yieldCount
 *   How many legal (i.e. ( onYield_isLegal() == true ) ) TestParams are
 * yielded.
 *
 * @member {Object} in
 *   The "in" sub-object's data members represent every parameters of some
 * (e.g. Block) Params's constructor. Besides, it also has the following
 * properties:
 *   - paramsNumberArrayObject: All (non-concatenated) parameters (include
 *       filters and biases) which will be packed into inputWeightArray.
 * 
 * @member {NameNumberArrayObject.weightArray_weightElementOffsetBegin} in_weights
 *   - weightArray: A number array from paramsNumberArrayObject with
 *       weightElementOffsetBegin.
 *   - weightElementOffsetBegin: The offset in inputWeightArray to the first
 *       parameter.
 *
 * @member {Object} out
 *   The "out" sub-object's data members represent the "should-be" result of
 * some (e.g. Block) Params.init(). That is, it has the data members of this.in
 * except inputWeightArray, weightElementOffsetBegin. Sub class is responsible
 * for creating and releasing it.
 *
 * @member {ParamValueChangeRecord[]} modifyParamValueHistory
 *   A record will be pushed into this list when calling
 * this.modifyParamValue(). When call this.modifyParamValue_restore_all(),
 * these value will be restored and this list will be cleared to empty.
 *
 */
class TestParams_Base extends Recyclable.Root {

  /**
   * Used as default TestParams.Base provider for conforming to Recyclable
   * interface.
   */
  static Pool = new Pool.Root( "TestParams.Base.Pool",
    TestParams_Base );

  /**
   */
  constructor( id = -1 ) {
    super();
    this.#setAsConstructor_self( id );
  }

  /** @override */
  setAsConstructor( id = -1 ) {
    super.setAsConstructor();
    this.#setAsConstructor_self( id );
  }

  /**  */
  #setAsConstructor_self( id = -1 ) {
    this.id = id;
    this.yieldCount = 0;

    if ( this.in ) {
      // Do nothing. Re-use it since it exists.
    } else {
      this.in = {};
      // All parameters which will be packed into weights array.
      this.in.paramsNumberArrayObject = new NameNumberArrayObject.Base();
    }

    this.in_weights
      = NameNumberArrayObject.weightArray_weightElementOffsetBegin.Pool
          .get_or_create_by();

    // Sub class is responsible for creating and releasing it.
    //this.out = undefined; //{};

    this.modifyParamValueHistory = Recyclable.Array.Pool.get_or_create_by( 0 );

    // For reducing same weights array re-generating.
    this.SequenceRandom_NumberArray_Bag
      = SequenceRandom_NumberArray.Bag.Pool.get_or_create_by();
    
    // For reducing array and object re-generating in .modifyParamValue()
    this.modifyParamValue_singleMinMax
      = Recyclable.Array.Pool.get_or_create_by( 2 );

    if ( this.modifyParamValue_valuePair ) {
      // Do nothing. Re-use it since it exists.
    } else {
      this.modifyParamValue_valuePair = {};
    }
  }

  /** @override */
  disposeResources() {
    //this.modifyParamValue_valuePair; // Keep and re-use.

    this.modifyParamValue_singleMinMax?.disposeResources_and_recycleToPool();
    this.modifyParamValue_singleMinMax = null;

    this.SequenceRandom_NumberArray_Bag?.disposeResources_and_recycleToPool();
    this.SequenceRandom_NumberArray_Bag = null;

    this.modifyParamValueHistory?.disposeResources_and_recycleToPool();
    this.modifyParamValueHistory = null;

    this.in_weights?.disposeResources_and_recycleToPool();
    this.in_weights = null;

    //this.in.paramsNumberArrayObject; // Keep and re-use.
    //this.in; // Keep and re-use.

    //!!! ...unfinished... (2022/06/27) What about other object properties?

    super.disposeResources();
  }

  /** */
  toString() {
    return `testParams.id=${this.id}`;
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
   *   If return true, the onYield_before() will be called. If return false, it
   * mean this configuration is illegal so that there is no yield will be done
   * (i.e. onYield_before() and onYield_after() will not be called).
   */
  onYield_isLegal() {
    return true;
  }

  /**
   * Called by permuteParamRecursively() when a combination of parameters is
   * complete and before this object to be yielded.
   *
   * The the following data should already be ready:
   *   - this.id
   *   - this.in_weights
   *   - this.in.paramsNumberArrayObject: Every should-be-packed parameter.
   *   - this.in.Xxx: every non-packed parameter.
   *   - this.out.Xxx: every parameter.
   *
   * This method should fill the following data:
   *   - this.in_weights.weightArray
   *
   * Sub-class should override this method.
   */
  onYield_before() {
  }

  /**
   * Called by permuteParamRecursively() when a combination of parameters is
   * complete and after this object has been yielded.
   *
   * Usually, this method should clear some temperary data members.
   *
   * Sub-class should override this method.
   */
  onYield_after() {
  }

  /**
   * Modify specified parameter's value and record in
   * this.modifyParamValueHistory so that they could be restore by
   * modifyParamValue_restore_all().
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

    // Confirm the new value is legal.
    let outValue_new = valueRange.adjust( outValue_specified );

    // Modify output value.
    this.out[ paramName ] = outValue_new;

    // Modify input value.
    let inValue_original, inValue_new;
    {
      // Only generate one new value.
      this.modifyParamValue_singleMinMax[ 0 ] = outValue_new;
      this.modifyParamValue_singleMinMax[ 1 ] = outValue_new;

      let valueInputOutputGenerator = valueRange.valueInputOutputGenerator(
        this.modifyParamValue_valuePair,
        undefined, this.modifyParamValue_singleMinMax );

      for ( let pair of valueInputOutputGenerator ) {
        inValue_new = pair.valueInput;

        if ( this.in[ paramName ] != undefined ) {
          inValue_original = this.in[ paramName ];
          this.in[ paramName ] = inValue_new;
        }

        if ( this.in.paramsNumberArrayObject[ paramName ] != undefined ) {
          // (should be a number (can not be a number array)).
          inValue_original = this.in.paramsNumberArrayObject[ paramName ];
          this.in.paramsNumberArrayObject[ paramName ] = inValue_new;
        }
      }
    }

    // Record modification (for restoring in the future).
    {
      let changeRecord = ParamValueChangeRecord.Pool.get_or_create_by(
        paramDesc,
        inValue_original, outValue_original,
        inValue_new, outValue_new,
        outValue_specified );

      this.modifyParamValueHistory.push( changeRecord );
    }
  }

  /**
   * Pop the this.modifyParamValueHistory to restore the last param
   * modification.
   *
   * @return {boolean}
   *   Return true, if a record has been popped and restored. Return false, if
   * no record could be popped.
   */
  modifyParamValue_pop_and_restore() {
    if ( this.modifyParamValueHistory.length <= 0 )
      return false; // No record needs be restored.

    let changeRecord = this.modifyParamValueHistory.pop();
    let paramName = changeRecord.paramDesc.paramName;

    if ( this.out[ paramName ] != undefined )
      this.out[ paramName ] = changeRecord.outValue_original;

    if ( this.in[ paramName ] != undefined ) {
      this.in[ paramName ] = changeRecord.inValue_original;
    }

    if ( this.in.paramsNumberArrayObject[ paramName ] != undefined ) {
      // (should be a number (can not be a number array)).
      this.in.paramsNumberArrayObject[ paramName ]
        = changeRecord.inValue_original;
    }

    changeRecord.disposeResources_and_recycleToPool();
    changeRecord = null;
    return true;
  }

  /**
   * Restore parameters' values according to this.modifyParamValueHistory. And
   * empty this.modifyParamValueHistory.
   */
  modifyParamValue_restore_all() {
    // Restored from the last to first.    
    while ( this.modifyParamValue_pop_and_restore() ) {
      // Do nothing.
    }
  }


  /**
   * Ensure io_object[ propertyName ] exists as a number array with specified
   * length. It will be filled with random number as
   * ( sequence_nunmer + random_number_offset ).
   *
   * @param {object} io_object
   *   The object to be checked and modified.
   *
   * @param {string} propertyName
   *   The property io_object[ propertyName ] will be ensured as a number
   * array.
   *
   * @param {number} height
   *   The length of axis0 of the io_object[ propertyName ].
   *
   * @param {number} width
   *   The length of axis1 of the io_object[ propertyName ].
   *
   * @param {number} channelCount
   *   The length of axis2 of the io_object[ propertyName ].
   *
   * @param {number} valueBegin
   *   The first value of filled sequence.
   *
   * @param {number} valueStep
   *   The incremental value of every next filled value in the sequence.
   *
   * @param {number} randomOffsetMin
   *   The random number offet lower bound.
   *
   * @param {number} randomOffsetMax
   *   The random number offet upperer bound.
   *
   * @param {number} divisorForRemainder
   *   The divisor for restricting value bounds.
   */
  static ensure_object_property_numberArray_length_filled(
    io_object, propertyName,
    height, width, channelCount,
    valueBegin = 0, valueStep = 1,
    randomOffsetMin = 0, randomOffsetMax = 0,
    divisorForRemainder = ( 2 ** 26 ) ) {

    if (
           // The property does not exist.
           ( io_object[ propertyName ] == undefined )

           // The property exists but is not an array.
        || ( !( io_object[ propertyName ] instanceof Array ) )
       ) {
      // Ensure array with specified length.
      io_object[ propertyName ] = new Array( elementCount );

    // The property exists and is an array.
    } else {
      // Ensure it with specified length.
      io_object[ propertyName ].length = elementCount;
    }

    RandTools.fill_numberArray( io_object[ propertyName ],
      height, width, channelCount,
      valueBegin, valueStep,
      randomOffsetMin, randomOffsetMax, divisorForRemainder );
  }

  /**
   * Similar to
   * TestParams_Base.ensure_object_property_numberArray_length_filled(). But
   * the property will be a shared number array. Its value may be shared with
   * other caller.
   *
   * This may have better performance because of number array re-using (instead
   * of re-generating).
   *
   *
   * @param {object} io_object
   *   The object to be checked and modified.
   *
   * @param {string} propertyName
   *   The property io_object[ propertyName ] will be ensured as a number
   * array.
   *
   * @param {number} height
   *   The length of axis0 of the io_object[ propertyName ].
   *
   * @param {number} width
   *   The length of axis1 of the io_object[ propertyName ].
   *
   * @param {number} channelCount
   *   The length of axis2 of the io_object[ propertyName ].
   *
   * @param {number} valueBegin
   *   The first value of filled sequence.
   *
   * @param {number} valueStep
   *   The incremental value of every next filled value in the sequence.
   *
   * @param {number} randomOffsetMin
   *   The random number offet lower bound.
   *
   * @param {number} randomOffsetMax
   *   The random number offet upperer bound.
   *
   * @param {number} divisorForRemainder
   *   The divisor for restricting value bounds.
   *
   */
  ensure_object_property_numberArray_length_existed(
    io_object, propertyName,
    height, width, channelCount,
    valueBegin = 0, valueStep = 1,
    randomOffsetMin = 0, randomOffsetMax = 0,
    divisorForRemainder = ( 2 ** 26 )
  ) {

    const alwaysFixedRandomMinMax = TestParams_Base.alwaysFixedRandomMinMax;

    io_object[ propertyName ]
      = this.SequenceRandom_NumberArray_Bag
          .get_by_elementCount_randomOffsetMin_randomOffsetMax(
            height, width, channelCount,
            valueBegin, valueStep,
            randomOffsetMin, randomOffsetMax, divisorForRemainder,
            alwaysFixedRandomMinMax
          );
  }

  /**
   * Fill an object's property as a number array.
   *
   * Similar to
   * TestParams_Base.ensure_object_property_numberArray_length_filled(). But
   * the property will be a shared number array. Its value may be shared with
   * other caller.
   *
   * This may have better performance because of number array re-using (instead
   * of re-generating).
   *
   *
   * @param {object} io_object
   *   The object to be checked and modified.
   *
   * @param {string} propertyName
   *   The property io_object[ propertyName ] will be ensured as a number array.
   * 
   * @param {number} height
   *   The length of axis0 of the io_object[ propertyName ].
   *
   * @param {number} width
   *   The length of axis1 of the io_object[ propertyName ].
   *
   * @param {number} channelCount
   *   The length of axis2 of the io_object[ propertyName ].
   */
  fill_object_property_numberArray( io_object, propertyName,
    height, width, channelCount
  ) {

    //!!! (2025/05/23 Remarked)
    // const {
    //   weightsValueBegin,
    //   weightsValueStep,
    //   weightsRandomOffset,
    //   weightsDivisorForRemainder
    // } = TestParams.Base.integer_numberArray_randomParams;

    // Use random weight range suitable for neural network filter.
    const {
      weightsValueBegin,
      weightsValueStep,
      weightsRandomOffset,
      weightsDivisorForRemainder
    } = TestParams_Base.filterWeights_numberArray_randomParams;

    const alwaysFixedRandomMinMax = TestParams_Base.alwaysFixedRandomMinMax;

    this.ensure_object_property_numberArray_length_existed(
      io_object, propertyName,
      height, width, channelCount,
      weightsValueBegin,
      weightsValueStep,
      weightsRandomOffset.min,
      weightsRandomOffset.max,
      weightsDivisorForRemainder,
      alwaysFixedRandomMinMax
    );
  }

  /**
   * Responsible for generating testing paramters combinations.
   *
   * @param {ParamDescConfigAll} aParamDescConfigAll
   *   List all the parameters to be used in permutation combination.
   *
   * @yield {Base}
   *   Yield this object itself. The returned object (it is this object itself)
   * should not be modified because it will be re-used.
   */
  static *ParamsGenerator( aParamDescConfigAll ) {
    this.config = aParamDescConfigAll;

    // Note: this.in and this.in.paramsNumberArrayObject will not be cleared.
    //       They will be reused directly.

    yield *TestParams_Base.permuteParamRecursively.call( this, 0 );
  }

  /**
   * This method will modify this.id and this.in.paramsNumberArrayObject. It
   * also calls itself recursively to permute all parameters.
   *
   * @param {number} currentParamDescIndex
   *   The index into the this.paramDescArray[]. It represents the current
   * parameter to be tried.
   *
   * @yield {Base}
   *   Every time one kind of parameters' combination is generated, the
   * "this" will be yielded.
   */
  static *permuteParamRecursively( currentParamDescConfigIndex ) {
    const config = this.config;
    const paramDescConfigArray = config.paramDescConfigArray;

    if ( currentParamDescConfigIndex >= paramDescConfigArray.length ) {
      // All parameters are used to be composed as one kind of combination.

      // Every combination has unique id no matter whether is legal to be
      // yielded.
      ++this.id;

      let bLegalToYield = this.onYield_isLegal();
      if ( bLegalToYield ) {

        ++this.yieldCount;  // Complete one kind of combination.

        this.onYield_before();
        yield this;
        this.onYield_after();

        // Restore this object because onYield_before() may modify it.
        this.modifyParamValue_restore_all();
      }

      // Stop this recursion. Back-track to another parameters combination.
      return;
    }

    let valuePair = config.paramValuePairArray[ currentParamDescConfigIndex ];

//!!! (2025/06/19 Modified)
// Create config.paramValuePairArray when config created (at class ParamDescConfigAll).
//     // Prepare an re-usable object for placing the value pair of current
//     // ParamDesc. (For reducing memory re-allocation.)
//     let valuePair;
//     {
//       let paramValuePairArray = config.paramValuePairArray;
//       if ( !paramValuePairArray ) {
//         paramValuePairArray = config.paramValuePairArray
//           = new Array( paramDescConfigArray.length );
//         for ( let i = 0; i < paramValuePairArray.length; ++i ) {
//           paramValuePairArray[ i ] = {};
//         }
//       }
//       valuePair = paramValuePairArray[ currentParamDescConfigIndex ];
//     }

    let nextParamDescConfigIndex = currentParamDescConfigIndex + 1;

    let paramDescConfig = paramDescConfigArray[ currentParamDescConfigIndex ];

    let paramDesc = paramDescConfig.paramDesc;
    for ( let pair of paramDesc.valueDesc.range.valueInputOutputGenerator(
      valuePair, undefined, paramDescConfig.valueOutMinMax ) ) {

      //!!! (2021/07/06 Temp Debug) Check the algorithm might be wrong.
      //if ( paramDesc.valueDesc.range.adjust( pair.valueInput )
      //       != pair.valueOutput )
      //  debugger;

      this.out[ paramDesc.paramName ] = pair.valueOutput;

      // Randomly place the parameter directly or in weights array.

      //!!! (2021/07/19 Temp Used) For testing without randomly.
      //const dice = 0;
      //const dice = 1;
      const dice = Math.random();
      if ( dice < 0.5 ) {
        // Try parameter value assigned directly (i.e. by specifying).      
        this.in[ paramDesc.paramName ] = pair.valueInput;
        yield *TestParams_Base.permuteParamRecursively.call( this,
          nextParamDescConfigIndex );

      } else {
        // Try parameter value assigned from inputWeightArray (i.e. by
        // evolution).
        this.in[ paramDesc.paramName ] = null;

        this.in.paramsNumberArrayObject[ paramDesc.paramName ]
          = pair.valueInput; // (number or number array)

        yield *TestParams_Base.permuteParamRecursively.call( this,
          nextParamDescConfigIndex );

        // So that it could be re-tried as by-specifying when backtracking.
        this.in.paramsNumberArrayObject[ paramDesc.paramName ]
          = undefined;
      }
    }
  }

}


/**
 * Parameters for generating integer random filter's weights.
 */
TestParams_Base.integer_numberArray_randomParams = {

  weightsValueBegin: 0,
  weightsValueStep: 10,

  //!!! (2022/08/03 Temp Remarked) Fixed to non-random to simplify debug.
  //weightsRandomOffset: { min: -0, max: +0 },
  //weightsRandomOffset = { min: -1, max: +1 },
  weightsRandomOffset: { min: -5, max: +5 },
  //weightsRandomOffset: { min: -50, max: +50 },
  //weightsRandomOffset: { min: -200, max: +200 },
  //weightsRandomOffset: { min: -11111, max: 11111 },
  //weightsRandomOffset: { min: 11, max: 11 },

  //weightsDivisorForRemainder: 4096,
  weightsDivisorForRemainder: 1024,
};

/**
 * Parameters suitable for generating random (embedding, depthwise, pointwise)
 * filter's weights.
 */
TestParams_Base.filterWeights_numberArray_randomParams = {

  // Use small but expressable floating value (e.g. 1/2, 1/4, 1/8, ...,
  // 1/(2**n)) so that the result of multiply-add will not be too large.
  weightsValueBegin: 0,
  weightsValueStep:  1 / ( 2 ** 3 ), // i.e. ( 1 / 8 )
  //weightsValueStep:  1 / ( 2 ** 5 ), // i.e. ( 1 / 32 )

  // Use larger negative variation to generate negative result.
  weightsRandomOffset: {

//!!! ...unfinished... (2025/05/23 Remarked)
//    min: - ( 2 ** 18 ),
    min: -50,
    max: +10
  },

  // Smaller divisor for increasing possibility of neural network result
  // value.
  //
  // Consider activation function clamp( -2, +2 ) is used. If filter weight's
  // absolute value is greater than 1.0, its convolution result's absolute
  // value might exceed 2.0 easily (since convolution is a kind of operation
  // with many multiply-add). The neural network result value will easily
  // become only either -2 or +2 after activation function applied.
  //
  // Restrict filter weight's absolute value less than 1.0 so that the neural
  // network could generate more other result value.
  weightsDivisorForRemainder: ( 2 ** 0 ), // i.e. 1
};

// (2025/05/26 Temp Remarked) Fixed to non-random to simplify debug.
//TestParams_Base.alwaysFixedRandomMinMax = false;
//TestParams_Base.alwaysFixedRandomMinMax = true;
TestParams_Base.alwaysFixedRandomMinMax = undefined;
