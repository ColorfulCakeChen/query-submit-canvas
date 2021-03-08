export { Base, To, Params };

/**
 * A base class for extracting and keeping weights. It composes of a Float32Array and a shape. It can
 * be used as CNN (depthwise, pointwise and bias) filter weights.
 *
 * @member {Float32Array} defaultInput
 *   The default input Float32Array. Its byteOffset will be checked against defaultByteOffsetBegin.
 * Its content will be interpret as weights if privilegeInput is null. Otherwise, its content
 * will be ignored if privilegeInput is not null.
 *
 * @member {number} defaultByteOffsetBegin
 *   The weights[] begins at defaultInput's defaultByteOffsetBegin (relative to defaultInput.buffer,
 * not to defaultInput.byteOffset). If this value less than defaultInput.byteOffset, the
 * initialization will fail (i.e. ( isValid() == false ) ).
 *
 * @member {number} defaultByteOffsetEnd
 *   The weights[] ends at defaultInput's defaultByteOffsetEnd (not inclusive) (relative to
 * defaultInput.buffer, not to defaultInput.byteOffset).
 *
 * @member {Float32Array} privilegeInput
 *   The privilege input Float32Array. If not null, its content will be interpret as weights and
 * the content of defaultInput will be ignored.
 *
 * @member {number} privilegeByteOffsetBegin
 *   The weights[] begins at privilegeInput's privilegeByteOffsetBegin (relative to privilegeInput.buffer,
 * not to privilegeInput.byteOffset). If this value less than privilegeInput.byteOffset, the
 * initialization will fail (i.e. ( isValid() == false ) ).
 *
 * @member {number} privilegeByteOffsetEnd
 *   The weights[] ends at privilegeInput's privilegeByteOffsetEnd (not inclusive) (relative
 * to privilegeInput.buffer, not to privilegeInput.byteOffset).
 *
 * @member {(number[]|number|null)} shape
 *   The weights shape (element count for every dimension). The shape could be an array, and the shape.length represents
 * dimension. The shape could also be a scalar (0-dimension shape), i.e. ( shape.length == 0 ) is legal and means
 * extracting so many elements from defaultInput or privilegeInput. If shape is too large (exceeds the defaultInput
 * (or, privilegeInput if not null) bounding) or shape is NaN, the initialization will fail (i.e. ( isValid() == false ) ).
 * The shape could be null, and means extracting zero element (i.e. extracting nothing) from defaultInput or privilegeInput.
 *
 * @member {Float32Array} weights
 *  The values. It is a reference (sub-range) to the underlying defaultInput (or privilegeInput).
 */
class Base {

  /**
   * Create Float32Array weights[] over the defaultInput (or privilegeInput) according to the specific
   * byteOffsetBegin, shape, and weightConverter.
   *
   * The defaultInput and privilegeInput can not both be null. If one of them is null, the non-null is used.
   * If both are non-null, the privilegeInput will be used.
   *
   * @return {boolean} Return false, if initialization failed.
   */ 
  init( defaultInput, defaultByteOffsetBegin, privilegeInput, privilegeByteOffsetBegin, shape ) {

    this.defaultInput =   defaultInput;
    this.privilegeInput = privilegeInput;
    this.shape =          shape;
    this.weights =        null;   // So that ( isValid() == false ) if re-initialization failed.

    //let weightCount =     ( shape ) ? shape.reduce( ( accumulator, currentValue ) => accumulator * currentValue ) : 0;
    let weightCount =     ( shape ) ? tf.util.sizeFromShape( shape ) : 0; // It can handle ( 0 == shape.length ) (i.e. scalar).
    let weightByteCount = weightCount * Float32Array.BYTES_PER_ELEMENT;

    let input, byteOffsetBegin;
    let byteOffsetEnd; // Not inclusive. It will be used as the next filter's beginning.

    if ( privilegeInput ) {       // privilegeInput first.

      if ( privilegeByteOffsetBegin < privilegeInput.byteOffset )
        return false;  // Failed, the privilege beginning position is illegal (less than bounding).

      input = privilegeInput;
      byteOffsetBegin = this.privilegeByteOffsetBegin = privilegeByteOffsetBegin;
      byteOffsetEnd =   this.privilegeByteOffsetEnd =   privilegeByteOffsetBegin + weightByteCount;
      this.defaultByteOffsetBegin = this.defaultByteOffsetEnd = defaultByteOffsetBegin; // Stay at beginning for not used.

    } else if ( defaultInput ) {  // defaultInput second.

      if ( defaultByteOffsetBegin < defaultInput.byteOffset )
        return false;  // Failed, the default beginning position is illegal (less than bounding).

      input = defaultInput;
      byteOffsetBegin = this.defaultByteOffsetBegin = defaultByteOffsetBegin;
      byteOffsetEnd =   this.defaultByteOffsetEnd =   defaultByteOffsetBegin + weightByteCount;
      this.privilegeByteOffsetBegin = this.privilegeByteOffsetEnd = privilegeByteOffsetBegin; // Stay at beginning for not used.

    } else {
      return false;  // Failed, both privilege and default input are null.
    }

    // Bounded by the input.byteLength.
    let legalByteOffsetEnd = input.byteOffset + input.byteLength;
    if ( byteOffsetEnd > legalByteOffsetEnd )
      return false;  // Failed, if shape is too large (or NaN).

    this.weights = new Float32Array( input.buffer, byteOffsetBegin, weightCount );  // Share the underlying array buffer.
    return true;     // Success.
  }

  /** @return Return true, if initialization is success (i.e. ( this.weights != null )). */
  isValid()                      { return ( this.weights ) ? true : false; }

  get weightByteCount()          { return this.weights.byteLength; }
  get weightCount()              { return this.weights.length; }
}


/**
 * Provides static methods for converting weight to parameter.
 */
class To {

  /** @return {number} Return the absolute value of the trucated value (i.e. integer). */
  static IntegerZeroPositive( v ) {
    return Math.abs( Math.trunc( v ) );
  }

  /**
   * @return {number} Return the trucated value (i.e. integer). The returned value is forcibly between min and max (as integer too).
   */
  static IntegerRange( value, min, max ) {
    let valueMin = Math.trunc( Math.min( min, max ) ); // Confirm the minimum. Convert to an integer.
    let valueMax = Math.trunc( Math.max( min, max ) ); // Confirm the maximum. Convert to an integer.
    let valueKinds = ( valueMax - valueMin ) + 1; // How many possible integer between them.

    // Because remainder always has the same sign as dividend, force the dividend to zeor or positive for processing easily.
    let result = valueMin + ( To.IntegerZeroPositive( value ) % valueKinds );
    return result;
  }

  /** @return {boolean} Convert number value into false or true. */
  static Boolean( value ) {
    // If value is not an integer, the remainder will always not zero. So convert it to integer first.
    //
    // According to negative or positive, the remainder could be one of [ -1, 0, +1 ].
    // So simply check it whether is 0 (instead of check both -1 and +1), could result in false or true.
    return ( ( Math.trunc( value ) % 2 ) != 0 );
  }

  /**
   * @param {any[]} lookUpArray
   *   The value will be converted into an integer between [ 0, lookUpArray.length ). Use it as array index.
   * Return lookUpArray[ index ].
   *
   * @return {any}
   *   Convert number value into an integer between [ 0, lookUpArray.length ). Use it as array index. Return
   * the looked up element value.
   */
  static ArrayElement( value, lookUpArray ) {
    let i = To.IntegerZeroPositive( value ) % lookUpArray.length;
    return lookUpArray[ i ];
  }

//!!! (2021/03/08 Remarked) No longer need it.
//   /**
//    * @return {any} If ( null == value ), return anotherValue. Otherwise, return value.
//    */
//   static AnotherIfNull( value, anotherValue ) {
//     if ( null == value )
//       return anotherValue;
//     return value;
//   }

}


/**
 * The parameters for the weights of a neural network layer.
 *
 * @member {Map} parameterMapModified
 *   All parameters provided by this object. Its entry is [ key, value ]. The key of the entry [ key, value ] is the same as
 * the key of the init()'s parameterMap. The value of the entry [ key, value ] is parameter_value
 * (i.e. not [ parameter_value, parameter_converter ] ) which is combined from the parameter_value of the init()'s parameterMap
 * and inputFloat32Array (or fixedWeights).
 *
 * @member {number} parameterCountExtracted
 *   How many parameters are extracted from inputFloat32Array or fixedWeights in fact. Only existed if init()
 * successfully. The same as this.weightCount (i.e. length of this.weights[] and this.weightsModified[]).
 *
 * @member {number} parameterCount
 *   Always ( parameterMap.size ). This is the total parameter count provided by this object
 * if init() successfully.
 *
 * @member {number} inChannels
 *   The input channel count of this neural network layer.
 *
 * @member {number} channelMultiplier
 *   Every input channel will be expanded into how many channels.
 *
 * @member {number} outChannels
 *   The output channel count of this neural network layer.
 *
 * @member {Float32Array} weightsModified
 *  The copied extracted values. They are copied from inputFloat32Array or fixedWeights, and then converted
 * to positive integer. Its length will be the same as parameterCountExtracted.
 */
class Params extends Base {

  /**
   *
   *
   * @param {Float32Array} inputFloat32Array
   *   A Float32Array whose values will be interpret as weights. It should have ( parameterCountExtractedAtLeast ) or
   * ( parameterCountExtractedAtLeast + 1 ) or ( parameterCountExtractedAtLeast + 2 ) elements according to the
   * value of channelMultiplier and outChannels.
   *
   * @param {number} byteOffsetBegin
   *   The position to start to decode from the inputFloat32Array. This is relative to the inputFloat32Array.buffer
   * (not to the inputFloat32Array.byteOffset).
   *
   * @param {Map} parameterMap
   *   Describe what parameters to be used or extracted.
   *   - The key of this parameterMap's entry [ key, value ] will be viewed as parameter name.
   *   - The value of this parameterMap's entry [ key, value ] should be an array [ parameter_value, parameter_converter ].
   *     - If the parameter_value is non-null, it will be used as the parameter's value directly (i.e. by specifying)
   *       and the parameter_converter will be ignored.
   *     - If the parameter_value is null, the parameter's will be extracted from inputFloat32Array (or fixedWeights),
   *       and past into the parameter_converter (viewed as a function). The returned value of the function will become the
   *       parameter's value. (i.e. by evolution)
   *   - If the value of this parameterMap's entry [ key, value ] is null, it will be viewed as an array
   *      [ parameter_value, parameter_converter ] = [ null, To.IntegerZeroPositive ]. (i.e. by evolution)
   *
   * @param {(Float32Array|number[])} fixedWeights
   *   If null, extract parameters from inputFloat32Array. If not null, extract parameters from it instead of
   * inputFloat32Array. When not null, it should have parameterCountExtracted elements (i.e. the count of non-null values
   * of parameterMap).
   *
   * @return {boolean} Return false, if initialization failed.
   *
   * @override
   */
  init( inputFloat32Array, byteOffsetBegin, parameterMap, fixedWeights = null ) {

    this.weightsModified = this.parameterMapModified = null; // So that distinguishable if re-initialization failed.

    if ( !parameterMap )
      return false;  // Do not know what parameters to be used or extracted.

    this.parameterMapModified = new Map; // Collect all parameters.

    // Collect what parameters should be extracted from input array (rather than use values in the parameterMap).
    // At the same time, its array index will also be recorded for extracting its value from array.
    let arrayIndexMap = new Map();
    {
      let i = 0;
//!!! (2021/03/08 Remarked) Old Codes.
//       for ( let [ key, value ] of parameterMap ) {
//         // A null (or undefined) value means it should be extracted from inputFloat32Array or fixedWeights, and
//         // using To.IntegerZeroPositive() as converter function. (i.e. by evolution)
//         //
//         // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
//         if ( null == value ) {
//           value = To.IntegerZeroPositive;
//         }
//
//         // A function value means it should be extracted from inputFloat32Array (or fixedWeights), and
//         // using the function as converter. (i.e. by evolution)
//         if ( ( typeof value ) === "function" ) {
//           // Record the index (into this.weightsModified[]) and the converter.
//           arrayIndexMap.set( key, { arrayIndex: i, converterFunction: value } );
//           ++i;
//         }
//       }

      let value, converter;
      for ( let [ key, value_converter ] of parameterMap ) {

        // A null (or undefined) value_converter means it should be extracted from inputFloat32Array or fixedWeights,
        // and using To.IntegerZeroPositive() as converter function. (i.e. by evolution)
        if ( null == value_converter ) {
          value = null;
          converter = To.IntegerZeroPositive;
        } else {
          value = value_converter[ 0 ];
          converter = value_converter[ 1 ];
        }

        // A null value means it should be extracted from inputFloat32Array (or fixedWeights), and
        // using the converter as converter function. (i.e. by evolution)
        //
        // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
        if ( null == value ) {
          // Record the index (into this.weightsModified[]) and the converter.
          arrayIndexMap.set( key, { arrayIndex: i, converterFunction: converter } );
          ++i;
        } else {
          // A non-null value means it is the parameter's value directly.
          this.parameterMapModified.set( key, value );
        }
      }

    }

    let parameterCountExtracted = arrayIndexMap.size; // Determine how many parameters should be extracted from array.

    // If has fixedWeights, use it as priviledge input.
    let privilegeInput;
    if ( fixedWeights ) {
      if ( fixedWeights instanceof Float32Array )
        privilegeInput = fixedWeights;
      else
        privilegeInput = new Float32Array( fixedWeights );  // Convert to Float32Array.
    }

    // Extract a block of input array.
    let bInitOk = super.init( inputFloat32Array, byteOffsetBegin, privilegeInput, 0, [ parameterCountExtracted ] );

    if ( !bInitOk )
      return false;

    // Copy and convert to integer.
    //
    // Do not modify the original array data, because the original data is necessary when backtracking (to try
    // another neural network layer configuration)
    this.weightsModified = new Float32Array( this.weights.length );

    // Extract (by evolution) values from array, convert them, and put back into copied array and copied map.
    for ( let [ key, { arrayIndex, converterFunction } ] of arrayIndexMap ) {
      let extractedValue = this.weights[ arrayIndex ];
      let convertedValue = converterFunction( extractedValue );
      this.weightsModified[ arrayIndex ] = convertedValue;  // Record in array.
      this.parameterMapModified.set( key, convertedValue ); // Record in map, too.
    }

    return bInitOk;
  }

  /** @return {number} The count of the parameters extracted from inputFloat32Array. (i.e. by evolution) */
  get parameterCountExtracted() { return this.weightCount; }

  /**
   * @return {number}
   *   The count of the all parameters (both directly given (i.e. by specifying) and extracted from inputFloat32Array (i.e. by evolution) ).
   */
  get parameterCount()          { return this.parameterMapModified.size; }

}
