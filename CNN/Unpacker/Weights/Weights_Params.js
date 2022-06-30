export { Params };

import * as FloatValue from "./FloatValue.js";
import * as ParamDesc from "./ParamDesc.js";
import { Base } from "./Weights_Base.js";

/**
 * The parameters for the weights of a neural network layer.
 *
 * @member {ParamDesc.SequenceArray} aParamDescSequenceArray
 *   An array describes how many and what kinds of parameters should be extracted.
 *
 * @member {number[]} initValueArray
 *   An number array records the parameter values which is specified by ...restArgs of constructor. If a parameter value is null,
 * it means the parameter should be extracted from inputWeightArray (i.e. by evolution). Otherwise, the parameter value is by
 * specifying (from constructor). This array itself is indexed by ParamDesc.Xxx.seqId.
 *
 * @member {number[]} inputWeightArrayIndexArray
 *   A number array records where to extract parameters which is null in .initValueArray[]. Every element is the array index into
 * inputWeightArray[]. This array itself is indexed by ParamDesc.Xxx.seqId.
 *
 * @member {number[]} finalValueArray
 *   An number array records the parameter values which combined both by specifying (from constructor) and by evolution (from
 * inputWeightArray[]) and adjusted by ParamDesc.valueDesc.range.adjust(). This array itself is indexed by ParamDesc.Xxx.seqId.
 *

//!!! ...unfinished... (2022/06/30)
 * @member {Map} parameterMapModified
 *   All parameters provided by this object. Its entry is [ key, value ]. The key of the entry [ key, value ] is a ParamDesc.Xxx object
 * (the same as the key of the init()'s parameterMap). The value of the entry [ key, value ] is adjusted parameter value
 * which is combined from the value of the init()'s parameterMap and inputFloat32Array (or fixedWeights).
 *
 * @member {number} parameterCountExtracted
 *   How many parameters are extracted from inputWeightArray[]. Only meaningful if extract() successfully.
 *
 * @member {number} parameterCount
 *   Always ( aParamDescSequenceArray.length ). This is the total parameter count provided by this object
 * if extract() successfully.
 *
 */
class Params extends Base {

  /**
   * Used as default Weights.Params provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Weights.Params.Pool", Params, Params.setAsConstructor );

  /**
   *
   *
   *
   * @param {number} elementOffsetBegin
   *   The beginning position (i.e. array index) to extract from inputWeightsArray. If this value is negative, the extraction will
   * fail (i.e. ( bInitOk == false ) ).
   *
   *

//!!! ...unfinished... (2022/06/30)
   * @param {Map} parameterMap
   *   Describe what parameters to be used or extracted.
   *   - The key of this parameterMap's entry [ key, value ] should be a ParamDesc.Xxx object (one of ParamDesc.Base,
   *       ParamDesc.Same, ParamDesc.Bool) describing the parameter.
   *
   *     - The key.valueDesc should be a ValueDesc.Xxx object (one of ValueDesc.Same, ValueDesc.Bool, ValueDesc.Int).
   *       The key.valueDesc.range should be a ValueRange.Xxx object (one of ValueRange.Same, ValueRange.Bool, ValueRange.Int).
   *       The key.valueDesc.range.adjust() is a function for adjusting the parameter value.
   *
   *   - The value of this parameterMap's entry [ key, value ]:
   *
   *     - If ( null != value ), the returned value of key.range.adjust( value ) will be used as the parameter's
   *       value. (i.e. by specifying)
   *
   *     - If ( null == value ), the parameter will be extracted from inputFloat32Array (or fixedWeights).The
   *       returned value of key.valueDesc.range.adjust( extractedValue ) will be used as the parameter's value. (i.e. by evolution)
   *
   * @param {(Float32Array|number[])} fixedWeights
   *   If null, extract parameters from inputFloat32Array. If not null, extract parameters from it instead of
   * inputFloat32Array. When not null, it should have parameterCountExtracted elements (i.e. the count of non-null values
   * of parameterMap).
   */
  constructor( elementOffsetBegin, aParamDescSequenceArray, ...restArgs ) {
    
    super( elementOffsetBegin, aParamDescSequenceArray.length );
    Base.setAsConstructor_self.call( this, aParamDescSequenceArray, ...restArgs );
    



    // If has fixedWeights, use it as priviledge input.
    let privilegeInput;
    if ( fixedWeights ) {
      if ( fixedWeights instanceof Float32Array )
        privilegeInput = fixedWeights;
      else
        privilegeInput = new Float32Array( fixedWeights );  // Convert to Float32Array.
    }

    let privilegeByteOffsetBegin = 0; // fixedWeights always be extracted at the beginning.

    let parameterMapModified, arrayIndexMap, parameterCountExtracted;
    if ( parameterMap ) {

//!!! ...unfinished... (2022/06/27)
// Whether possible use static  ParamDescArray and static ParamDesc_to_SequenceId_Map? (avoid dynamic Map for reducing memory re-allocation)
//
// parameterModifiedArray replaces parameterMapModified.
// parameterExtractingIndexArray replaces arrayIndexMap.
//
//
//
//
//

      parameterMapModified = new Map; // Collect all parameters.

      // Collect what parameters should be extracted from input array (rather than use values in the parameterMap).
      // At the same time, its array index will also be recorded for extracting its value from array.
      arrayIndexMap = new Map();
      {
        let i = 0;

        for ( let [ paramDesc, value ] of parameterMap ) {

          // A null value means it should be extracted from inputFloat32Array (or fixedWeights). (i.e. by evolution)
          //
          // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
          if ( null == value ) {
            // Record the index (into this.weightsModified[]) and the adjuster.
            arrayIndexMap.set( paramDesc, i );
            ++i;
          } else {
            // A non-null value means it is the parameter's value (which should also be adjusted).
            let adjustedValue = paramDesc.valueDesc.range.adjust( value );
            parameterMapModified.set( paramDesc, adjustedValue );
          }
        }

      }

      parameterCountExtracted = arrayIndexMap.size; // Determine how many parameters should be extracted from array.
    }

    super( inputFloat32Array, byteOffsetBegin, [ parameterCountExtracted ], privilegeInput, privilegeByteOffsetBegin );

    this.parameterMap = parameterMap;
    this.parameterMapModified = parameterMapModified;
    this.arrayIndexMap = arrayIndexMap;
  }

  /** @override */
  static setAsConstructor( elementOffsetBegin, aParamDescSequenceArray, ...restArgs ) {
    super( elementOffsetBegin, aParamDescSequenceArray.length );
    Base.setAsConstructor_self.call( this, aParamDescSequenceArray, ...restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( aParamDescSequenceArray, ...restArgs ) {

    this.initValueArray = Recyclable.Array.get_or_create_by( aParamDescSequenceArray.length );
    this.inputWeightArrayIndexArray = Recyclable.Array.get_or_create_by( aParamDescSequenceArray.length );
    this.finalValueArray = Recyclable.Array.get_or_create_by( aParamDescSequenceArray.length );

//!!! ...unfinished... (2022/06/30)

    this.elementOffsetBegin = elementOffsetBegin;
    this.elementCount = elementCount;
  }

  /** @override */
  disposeResources() {

    if ( this.finalValueArray ) {
      this.finalValueArray.disposeResources_and_recycleToPool();
      this.finalValueArray = null;
    }

    if ( this.inputWeightArrayIndexArray ) {
      this.inputWeightArrayIndexArray.disposeResources_and_recycleToPool();
      this.inputWeightArrayIndexArray = null;
    }

    if ( this.initValueArray ) {
      this.initValueArray.disposeResources_and_recycleToPool();
      this.initValueArray = null;
    }

//!!! ...unfinished... (2022/06/30)

    this.bInitOk = undefined;
    this.elementOffsetEnd = undefined;
    this.elementCount = undefined;
    this.elementOffsetBegin = undefined;
    super.disposeResources();
  }

  /**
   * Extract parameters from inputFloat32Array.
   *
   * @return {boolean} Return false, if extraction failed.
   *
   * @override
   */
  extract() {

    this.weightsModified = null; // So that distinguishable if re-initialization failed.

    if ( !this.parameterMap )
      return false;  // Do not know what parameters to be used or extracted.

    let bExtractOk = super.extract(); // Extract a block of input array.
    if ( !bExtractOk )
      return false;

    // Copy the adjusted extracted weights.
    //
    // Do not modify the original array data, because the original data is necessary when backtracking (to try
    // another neural network layer configuration.
    this.weightsModified = new Float32Array( this.weights.length );

    // Extract (by evolution) values from array, convert them, and put back into copied array and copied map.
    for ( let [ paramDesc, arrayIndex ] of this.arrayIndexMap ) {
      let extractedValue = this.weights[ arrayIndex ];
      let adjustedValue = paramDesc.valueDesc.range.adjust( extractedValue );
      this.weightsModified[ arrayIndex ] = adjustedValue;  // Record in array.
      this.parameterMapModified.set( paramDesc, adjustedValue ); // Record in map, too.
    }

    return bExtractOk;
  }

  /** @return {number} The count of the parameters extracted from inputFloat32Array. (i.e. by evolution) */
  get parameterCountExtracted() { return this.weightCount; }

  /**
   * @return {number}
   *   The count of the all parameters (both directly given (i.e. by specifying) and extracted from inputFloat32Array (i.e. by evolution) ).
   */
  get parameterCount()          { return this.parameterMapModified.size; }

}
