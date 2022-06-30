export { Params, ParamsInfo };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";
//import * as ValueDesc from "./ValueDesc.js";
import * as ParamDesc from "./ParamDesc.js";
import { Base } from "./Weights_Base.js";

/**
 * Used by Weights.Params' constructor internally before calling parent (i.e. Weights.Base) class's constructor.
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
 *   A number array records where to extract parameters which is null in .initValueArray[]. Every element is the array index into
 * inputWeightArray[]. This array itself is indexed by ParamDesc.Xxx.seqId.
 *
 * @member {number[]} finalValueArray
 *   An number array records the parameter values which combined both by specifying (from constructor) and by evolution (from
 * inputWeightArray[]) and adjusted by ParamDesc.valueDesc.range.adjust(). This array itself is indexed by ParamDesc.Xxx.seqId.
 *
 * @member {number} parameterCountExtracted
 *   How many parameters are extracted from inputWeightArray[]. Only meaningful if Params.init() successfully.
 *
 * @member {number} parameterCount
 *   Always ( aParamDescSequenceArray.length ). This is the total parameter count provided by this object if Params.init()
 * successfully.
 *
 */
class ParamsInfo {

  /**
   * Used as default Weights.Params provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Weights.ParamsInfo.Pool", ParamsInfo, ParamsInfo.setAsConstructor );

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
  constructor( elementOffsetBegin, paramDescSequenceArray, ...restArgs ) {
    super();
    Base.setAsConstructor_self.call( this, elementOffsetBegin, paramDescSequenceArray, ...restArgs );
   }

  /** @override */
  static setAsConstructor( elementOffsetBegin, paramDescSequenceArray, ...restArgs ) {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this, elementOffsetBegin, paramDescSequenceArray, ...restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( elementOffsetBegin, paramDescSequenceArray, ...restArgs ) {
    this.paramDescSequenceArray = paramDescSequenceArray;
    this.parameterCount = paramDescSequenceArray.array.length;

    this.initValueArray = Recyclable.Array.get_or_create_by( this.parameterCount );
    this.inputWeightArrayIndexArray = Recyclable.Array.get_or_create_by( this.parameterCount );
    this.finalValueArray = Recyclable.Array.get_or_create_by( this.parameterCount );

    this.parameterCountExtracted = 0;
    for ( let i = 0; i < this.parameterCount; ++i ) {
      let paramDesc = paramDescSequenceArray.array[ i ];
      let initValue = this.initValueArray[ i ] = restArgs[ i ]; // Collect all parameters.

      // Collect what parameters should be extracted from input array (rather than use values in the .initValueArray).
      // At the same time, its array index (into inputWeightArray) will also be recorded for extracting its value in the future.
      {
        // A null value means it should be extracted from inputWeightArray. (i.e. by evolution)
        //
        // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
        //
        if ( null == initValue ) {
          // Record the index (into inputWeightArray[]).
          this.inputWeightArrayIndexArray[ i ] = elementOffsetBegin + this.parameterCountExtracted;
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

    this.parameterCount = undefined;
    this.paramDescSequenceArray = null; // Do not release it. Just un-reference it.

    super.disposeResources();
  }

}


/**
 * The parameters for the weights of a neural network layer.
 *
 * @member {Weights.ParamsInfo} paramsInfo
 *   The ParamsDesc list with their specified or extracted values.
 *
 * @member {number} parameterCountExtracted
 *   The count of the parameters extracted from inputWeightArray (i.e. by evolution). It should be the same as .elementExtractedCount.
 * Only meaningful if Params.init() successfully.
 *
 * @member {number} parameterCount
 *   The count of the all parameters (both directly given (i.e. by specifying) and extracted from inputWeightArray (i.e. by evolution) ).
 * It should be always the same as ( aParamDescSequenceArray.length ). This is the total parameter count provided by this object if
 * Params.init() successfully.
 *
 * @see Weights.Base
 */
class Params extends Base {

  /**
   * Used as default Weights.Params provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Weights.Params.Pool", Params, Params.setAsConstructor );

  /**
   */
  constructor( elementOffsetBegin, aParamDescSequenceArray, ...restArgs ) {
    let info = ParamsInfo.Pool.get_or_create_by( elementOffsetBegin, aParamDescSequenceArray, ...restArgs );
    super( elementOffsetBegin, info.parameterCountExtracted );
    Base.setAsConstructor_self.call( this, info );
  }

  /** @override */
  static setAsConstructor( elementOffsetBegin, aParamDescSequenceArray, ...restArgs ) {
    let info = ParamsInfo.Pool.get_or_create_by( elementOffsetBegin, aParamDescSequenceArray, ...restArgs );
    super.setAsConstructor( elementOffsetBegin, info.parameterCountExtracted );
    Base.setAsConstructor_self.call( this, info );
    return this;
  }

  /** @override */
  static setAsConstructor_self( aParamsInfo ) {
    this.info = aParamsInfo;
  }

  /** @override */
  disposeResources() {
    if ( this.info ) {
      this.info.disposeResources_and_recycleToPool();
      this.info = null;
    }
    super.disposeResources();
  }

  /**
   * Extract parameters from inputWeightArray.
   *
   * @return {boolean} Return false, if extraction failed.
   *
   * @override
   */
  init( inputWeightArray ) {

    let bBaseInitOk = super.init(); // Determine and check input weight array bounds.
    if ( !bBaseInitOk )
      return false;

    // Copy the adjusted extracted weights.
    //
    // Do not modify the original array data, because the original data is necessary when backtracking (to try
    // another neural network layer configuration.

    // Extract (by evolution) values from array, convert them, and put back into copied array and copied map.
    for ( let i = 0; i < this.info.parameterCount; ++i ) {
      let inputWeightArrayIndex = this.info.inputWeightArrayIndexArray[ i ];
      if ( inputWeightArrayIndex == undefined )
        continue; // This parameter has a specified value. No need to be extracted from inputWeightArray. (i.e. not by evolution)

      let paramDesc = this.info.paramDescSequenceArray.array[ i ];
      let extractedValue = inputWeightArray[ inputWeightArrayIndex ];
      let adjustedValue = paramDesc.valueDesc.range.adjust( extractedValue );
      this.info.finalValueArray[ i ] = adjustedValue;
    }

    this.bInitOk = true;
    return true;
  }

  get parameterCountExtracted() { return this.info.parameterCountExtracted; }

  get parameterCount()          { return this.info.parameterCount; }

  /**
   * @param {ParamDesc.Base} aParamDesc
   *   The aParamDesc.seqId will be used to access .info.finalValueArray[].
   *
   * @return {number}
   *   Return the specific ParamDesc's value (no matter by specified or by evolution).
   */
  getParamValue_byParamDesc( aParamDesc ) {
    let value = this.info.finalValueArray[ aParamDesc.seqId ];
    return value;
  }

}
