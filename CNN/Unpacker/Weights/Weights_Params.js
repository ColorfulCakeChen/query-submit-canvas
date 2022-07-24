export { Params };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
//import * as ValueDesc from "../ValueDesc.js";
import * as ParamDesc from "../ParamDesc.js";
import { Root } from "./Weights_Base.js";

/**
 * The parameters for the weights of a neural network layer.
 *
 * @member {number} weightElementOffsetBegin
 *   The beginning position (i.e. array index) to extract from inputWeightsArray. If this value is negative, the extraction will
 * fail (i.e. ( bInitOk == false ) ).
 *
 * @member {number} weightElementOffsetEnd
 *   The ending position (i.e. array index) after extracting from inputWeightsArray. It is not inclusive and can be used as the
 * beginning position of next (another) extraction. It is meaningful only if ( bInitOk == true ).
 *
 * @member {number} weightsElementExtractedCount
 *   The same as parameterCountExtracted.
 *
 * @member {ParamDesc.SequenceArray} paramDescSequenceArray
 *   An array describes how many and what kinds of parameters should be extracted. It will be referenced (i.e. kept without cloned)
 * and will not be released by this ParamsInfo object.
 *
 * @member {number[]} initValueArray
 *   An number array records the parameter values which is specified by ...restArgs of constructor. If a parameter value is null,
 * it means the parameter should be extracted from inputWeightArray (i.e. by evolution). Otherwise, the parameter value is by
 * specifying (from constructor). This array itself is indexed by ParamDesc.Xxx.seqId.
 *
 * @member {number[]} inputWeightArrayIndexArray
 *   A number array records where to extract parameters which is null in .initValueArray[]. Every element is the relative
 * array index into inputWeightArray[ weightElementOffsetBegin ]. This array itself is indexed by ParamDesc.Xxx.seqId.
 *
 * @member {number[]} finalValueArray
 *   An number array records the parameter values which combined both by specifying (from constructor) and by evolution (from
 * inputWeightArray[]) and adjusted by ParamDesc.valueDesc.range.adjust(). This array itself is indexed by ParamDesc.Xxx.seqId.
 *
 * @member {number} parameterCountExtracted
 *   The count of the parameters extracted from inputWeightArray (i.e. by evolution). It should be the same as .weightsElementExtractedCount.
 * Only meaningful if Params.init() successfully.
 *
 * @member {number} parameterCount
 *   The count of the all parameters (both directly given (i.e. by specifying) and extracted from inputWeightArray (i.e. by evolution) ).
 * It should be always the same as ( aParamDescSequenceArray.array.length ). This is the total parameter count provided by this object if
 * Params.init() successfully.
 *
 * @member {boolean} bInitOk
 *   If .init() success, it will be true.
 *
 * @see Weights.Base
 */
class Params extends Root {

  /**
   * Used as default Weights.Params provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Weights.Params.Pool", Params, Params.setAsConstructor );

  /**
   *
   * @param {any[]} restArgs
   *   Describe the specified parameters value. They should be arranged as the order of paramDescSequenceArray. For every element:
   *
   *     - If ( null != value ), the returned value of paramDesc.range.adjust( value ) will be used as the parameter's
   *         value. (i.e. by specifying)
   *
   *     - If ( null == value ), the parameter will be extracted from inputWeightArray. The returned value of
   *         paramDesc.valueDesc.range.adjust( extractedValue ) will be used as the parameter's value. (i.e. by evolution)
   *
   */
  constructor( paramDescSequenceArray, ...restArgs ) {
    super();
    Params.setAsConstructor_self.call( this, paramDescSequenceArray, ...restArgs );
   }

  /** @override */
  static setAsConstructor( paramDescSequenceArray, ...restArgs ) {
    super.setAsConstructor();
    Params.setAsConstructor_self.call( this, paramDescSequenceArray, ...restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( paramDescSequenceArray, ...restArgs ) {
    this.paramDescSequenceArray = paramDescSequenceArray;
    let parameterCount = paramDescSequenceArray.array.length;

    this.initValueArray = Recyclable.Array.Pool.get_or_create_by( parameterCount );
    this.inputWeightArrayIndexArray = Recyclable.Array.Pool.get_or_create_by( parameterCount );
    this.finalValueArray = Recyclable.Array.Pool.get_or_create_by( parameterCount );

    this.parameterCountExtracted = 0;
    for ( let i = 0; i < parameterCount; ++i ) {
      let paramDesc = paramDescSequenceArray.array[ i ];
      let initValue = this.initValueArray[ i ] = restArgs[ i ]; // Collect all specified parameters.

      // Collect what parameters should be extracted from input array (rather than use values in the .initValueArray).
      // At the same time, its array index (into inputWeightArray) will also be recorded for extracting its value in the future.
      {
        // A null value means it should be extracted from inputWeightArray. (i.e. by evolution)
        //
        // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
        //
        if ( null == initValue ) {
          // Record the index (into inputWeightArray[]).
          this.inputWeightArrayIndexArray[ i ] = this.parameterCountExtracted;
          this.finalValueArray[ i ] = undefined;
          ++this.parameterCountExtracted;

        } else {  // A non-null value means it is the parameter's value (which should also be adjusted).
          this.inputWeightArrayIndexArray[ i ] = undefined; // Indicates this parameter needs not be extracted from inputWeightArray.
          let adjustedValue = paramDesc.valueDesc.range.adjust( initValue );
          this.finalValueArray[ i ] = adjustedValue;
        }
      }
    }
  }

  /** @override */
  disposeResources() {
    this.parameterCountExtracted = undefined;

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

    this.paramDescSequenceArray = null; // Do not release it. Just un-reference it.

    super.disposeResources();
  }

  /**
   * Extract parameters from inputWeightArray.
   *
   * @return {boolean} Return false, if extraction failed.
   *
   * @override
   */
  init( inputWeightArray, weightElementOffsetBegin ) {

    // Determine and check input weight array bounds.
    let bBaseInitOk = super.init( inputWeightArray, weightElementOffsetBegin, this.parameterCountExtracted );
    if ( !bBaseInitOk )
      return false;

    // Copy the adjusted extracted weights.
    //
    // Do not modify the original array data, because the original data is necessary when backtracking (to try
    // another neural network layer configuration.

    // Extract (by evolution) values from array, convert them, and put back into copied array and copied map.
    const parameterCount = this.parameterCount;
    for ( let i = 0; i < parameterCount; ++i ) {
      let inputWeightArrayIndex = this.inputWeightArrayIndexArray[ i ];
      if ( inputWeightArrayIndex == undefined )
        continue; // This parameter has a specified value. No need to be extracted from inputWeightArray. (i.e. not by evolution)

      let absoluteArrayIndex = weightElementOffsetBegin + inputWeightArrayIndex;
      let extractedValue = inputWeightArray[ absoluteArrayIndex ];

      let paramDesc = this.paramDescSequenceArray.array[ i ];
      let adjustedValue = paramDesc.valueDesc.range.adjust( extractedValue );
      this.finalValueArray[ i ] = adjustedValue;
    }

    this.bInitOk = true;
    return true;
  }

  get parameterCount() {
    return this.paramDescSequenceArray.array.length;
  }

  /**
   * @param {ParamDesc.Base} aParamDesc
   *   The aParamDesc.seqId will be used to access .finalValueArray[].
   *
   * @return {number}
   *   Return the specific ParamDesc's value (no matter by specified or by evolution).
   */
  getParamValue_byParamDesc( aParamDesc ) {
    let value = this.finalValueArray[ aParamDesc.seqId ];
    return value;
  }

}
