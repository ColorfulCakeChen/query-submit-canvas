export { Params, ParamsInfo };

//import * as ValueDesc from "./ValueDesc.js";
import * as ParamDesc from "./ParamDesc.js";
import { Base } from "./Weights_Base.js";

/**
 * Used by Weights.Params' constructor internally before calling parent (i.e. Weights.Base) class's constructor.
 *
 * @member {ParamDesc.SequenceArray} paramDescSequenceArray
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
   */
  constructor( aParamDescSequenceArray, ...restArgs ) {
    super();
    Base.setAsConstructor_self.call( this, aParamDescSequenceArray, ...restArgs );
   }

  /** @override */
  static setAsConstructor( elementOffsetBegin, aParamDescSequenceArray, ...restArgs ) {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this, aParamDescSequenceArray, ...restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( aParamDescSequenceArray, ...restArgs ) {
    this.paramDescSequenceArray = aParamDescSequenceArray;
    this.parameterCount = aParamDescSequenceArray.array.length;

    this.initValueArray = Recyclable.Array.get_or_create_by( this.parameterCount );
    this.inputWeightArrayIndexArray = Recyclable.Array.get_or_create_by( this.parameterCount );
    this.finalValueArray = Recyclable.Array.get_or_create_by( this.parameterCount );

    this.parameterCountExtracted = 0;
    for ( let i = 0; i < this.parameterCount; ++i ) {
      let paramDesc = aParamDescSequenceArray[ i ];
      let initValue = this.initValueArray[ i ] = restArgs[ i ]; // Collect all parameters.

      // Collect what parameters should be extracted from input array (rather than use values in the .initValueArray).
      // At the same time, its array index (into inputWeightArray) will also be recorded for extracting its value in the future.
      {
        // A null value means it should be extracted from inputWeightArray. (i.e. by evolution)
        //
        // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
        //
        if ( null == initValue ) {
          this.inputWeightArrayIndexArray[ i ] = this.parameterCountExtracted; // Record the index (into inputWeightArray[]).
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
    
    super.disposeResources();
  }

}


/**
 * The parameters for the weights of a neural network layer.
 *
 * @member {Weights.ParamsInfo} paramsInfo
 *   The ParamsDesc with their specified or extracted values.
 *
 * @see Weights.Base
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
   * @param {any[]} restArgs
   *   Describe the parameters specified value. They should be arranged as the order inside aParamDescSequenceArray.
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
   */
  constructor( elementOffsetBegin, aParamDescSequenceArray, ...restArgs ) {
    let prepareInfo = ParamsInfo.Pool.get_or_create_by( aParamDescSequenceArray, ...restArgs );
    super( elementOffsetBegin, prepareInfo.parameterCount );
    Base.setAsConstructor_self.call( this, prepareInfo );
    prepareInfo.disposeResources_and_recycleToPool();
    prepareInfo = null;
  }

  /** @override */
  static setAsConstructor( elementOffsetBegin, aParamDescSequenceArray, ...restArgs ) {
    let prepareInfo = ParamsInfo.Pool.get_or_create_by( aParamDescSequenceArray, ...restArgs );
    super.setAsConstructor( elementOffsetBegin, prepareInfo.parameterCount );
    Base.setAsConstructor_self.call( this, prepareInfo );
    prepareInfo.disposeResources_and_recycleToPool();
    prepareInfo = null;
    return this;
  }

  /** @override */
  static setAsConstructor_self( aParamsInfo ) {
    
    // Transfer the owner of these resource.

    this.initValueArray = Recyclable.Array.get_or_create_by( aParamDescSequenceArray.length );
    this.inputWeightArrayIndexArray = Recyclable.Array.get_or_create_by( aParamDescSequenceArray.length );
    this.finalValueArray = Recyclable.Array.get_or_create_by( aParamDescSequenceArray.length );

//!!! ...unfinished... (2022/06/30)
    let 
    for ( let i = 0; i < aParamDescSequenceArray.length; ++i ) {
      let initValue = this.initValueArray[ i ] = restArgs[ i ]; // Collect all parameters.

      // Collect what parameters should be extracted from input array (rather than use values in the parameterMap).
      // At the same time, its array index will also be recorded for extracting its value from array.
      {

        // A null value means it should be extracted from inputFloat32Array (or fixedWeights). (i.e. by evolution)
        //
        // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
        if ( null == initValue ) {
          // Record the index (into this.weightsModified[]) and the adjuster.
          this.inputWeightArrayIndexArray[ i ] = 
          arrayIndexMap.set( paramDesc, i );
          ++i;
        } else {
          // A non-null value means it is the parameter's value (which should also be adjusted).
          let adjustedValue = paramDesc.valueDesc.range.adjust( value );
          parameterMapModified.set( paramDesc, adjustedValue );
        }

      }

      parameterCountExtracted = arrayIndexMap.size; // Determine how many parameters should be extracted from array.
    }

    }

   


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

    super.disposeResources();
  }

  /**
   * Extract parameters from inputFloat32Array.
   *
   * @return {boolean} Return false, if extraction failed.
   *
   * @override
   */
  init() {

//!!! ...unfinished... (2022/06/30)

    this.weightsModified = null; // So that distinguishable if re-initialization failed.

    if ( !this.parameterMap )
      return false;  // Do not know what parameters to be used or extracted.

    let bExtractOk = super.init(); // Extract a block of input array.
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
