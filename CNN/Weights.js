export { Base, IntegerRange, To, ParamDesc, Params };

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
 * Provides methods for converting weight to integer between min and max (both are integers).
 */
class IntegerRange {

  /**
   * @param {number} min The minimum value (as integer).
   * @param {number} max The maximum value (as integer).
   */
  constructor( min, max ) {
    this.valueMin = Math.trunc( Math.min( min, max ) ); // Confirm the minimum. Convert to an integer.
    this.valueMax = Math.trunc( Math.max( min, max ) ); // Confirm the maximum. Convert to an integer.
    this.valueKinds = ( this.valueMax - this.valueMin ) + 1; // How many possible integer between them.
  }

  /**
   * @return {number} Return the trucated value (i.e. integer). The returned value is forcibly between min and max (as integer too).
   */
  adjust( value ) {
    let valueInt = Math.trunc( value ); // Convert to an integer.

//!!! (2021/03/09 Remarked) The result is wierd when min and max have different sign.
//     // Because remainder always has the same sign as dividend, force the dividend to zeor or positive for processing easily.
//     let result = valueMin + ( To.IntegerZeroPositive( value ) % valueKinds );

    // Rearrange valueInt between valueMin and valueMax fairly (in probability).
    //
    // A1: Why not use remainder operator (%) directly?
    // Q1: Because remainder always has the same sign as dividend, this can not handle the situation which valueMin and
    //     valueMax have different sign.
    //
    // A2: Why not just restrict all value less than valueMin to valueMin and value greater than valueMax to valueMax?
    // Q2: Although this could restrict value in range, it will skew the probability of every value in the range.
    //     Unfair probability is harmful to evolution algorithm.
    //
    let quotient = ( valueInt - this.valueMin ) / this.valueKinds;
    let quotientInt = Math.floor( quotient );  // So that negative value could be handled correctly.
    let result = valueInt - ( quotientInt * this.valueKinds );
    return result;
  }

  /**
   * @return {function}
   *   Return a function object. When calling the returned function object with one value parameter, it will return
   * the adjusted value which is retricted by this IntegerRange.
   */
  getAdjuster() {
    return this.restrict.bind( this );
  }
}


/**
 * Provides static methods for converting weight to parameter.
 */
class To {

  /** @return {any} Return the input value directly. */
  static Same( v ) {
    return v;
  }

  /** @return {number} Return the absolute value of the trucated value (i.e. integer). */
  static IntegerZeroPositive( v ) {
    return Math.abs( Math.trunc( v ) );
  }

//!!! (2021/03/14) Perhaps, could be replaced by IntegerRange( 0, 1 )?
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

}


//!!! ...unfinished... (2021/03/14)
// Could define a class contains one parameter's key (symbol), range (and adjuster), ids (string?-number), idToNameMap (number-string), nameToIdMap (string-number)?
// But all parameters' keys should be browsable by iterator.
//
// ids is already a kinds of string-number. Perhaps, nameToIdMap should be derived from ids automatically.
//
// Where is Functions? What about boolean and Same()?

/**
 * Describe some properties of an integer parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
 *
 * @member {string[]} valueNames
 *   The string names of the parameter's all possible values. It is an array of strings. They should be all legal identifers too (i.e. A-Z,
 * a-z, 0-9 (not at first character), and "_"). They will become the properties' names of this.valueNameInteger.
 *
 * @member {IntegerRange} valueIntegerRange
 *   The integer range of the parameter's all possible values. It is an IntegerRange object with ( min = valueIntegerMin )
 * and ( max = valueIntegerMax = valueIntegerMin + ( valueNames.length - 1 ) ) ).
 *
 * @member {number[]} valueIntegers
 *   The integers of the parameter's all possible values.
 *
//!!! ...unfinished... (2021/03/14) named as Ids?
 * @member {Object} valueNameInteger
 *   An object contains the parameter's all possible values. It is just like a Map, but could be accessed by dot (.) operator
 * (not by .get() method). The this.valueNameInteger.valueName will be valueInteger. Or, the this.valueNameInteger[ valueName ]
 * will be valueInteger.
 *
 * 
 *
 *
 */
class ParamDescInteger {

  /**
   *
   * @param {number} valueIntegerMin
   *   The first (i.e. minimum) integer of the parameter's all possible values. It will be combined with valueNames.length and valueNames[]
   * to define this.valueNameInteger:
   *   - this.valueNameInteger[ valueNames[ 0 ] ] = ( valueIntegerMin + 0 )
   *   - this.valueNameInteger[ valueNames[ 1 ] ] = ( valueIntegerMin + 1 )
   *   - ...
   *   - this.valueNameInteger[ valueNames[ ( valueNames.length - 1 ) ] ] = ( valueIntegerMin + ( valueNames.length - 1 ) )
   *
   * @param {number} valueIntegerMax
   *   The last (i.e. maximum) integer of the parameter's all possible values. It should equal ( valueIntegerMin + ( valueNames.length - 1 ) ).
   */
  constructor( paramName, valueIntegerMin, valueIntegerMax, valueNames ) {
    this.paramName = paramName;
    this.valueNames = valueNames;

    this.paramNameKey = Symbol( paramName );
    this.valueIntegerRange = new IntegerRange( valueIntegerMin, valueIntegerMax );

    If ( valueIntegerMax != ( valueIntegerMin + ( valueNames.length - 1 ) ) ) {
      let errMsg = `ParamDescInteger: ( valueIntegerMax = ${valueIntegerMax} )`
        + ` should equal ( valueIntegerMin + ( valueNames.length - 1 ) ) = ( ${valueIntegerMin} + ( ${valueNames.length} - 1 ) )`;
      throw errMsg;
    }

    this.valueIntegers = new Array( valueNames.length );
    this.valueNameInteger = {};
    for ( let i = 0; i < valueNames.length; ++i ) {
//!!! ...unfinished... (2021/03/14) Ids???
      this.valueNameInteger[ valueNames[ i ] ] = this.valueIntegers[ i ] = ( valueIntegerMin + i );
    }

  }
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
   *   - The value of this parameterMap's entry [ key, value ] should be an array [ parameterValue, parameterAdjuster ].
   *     - If ( null == value ), it will be viewed as an array [ parameterValue, parameterAdjuster ] = [ null, To.Same ].
   *
   *     - The parameterAdjuster is a function for adjusting the parameter value. If ( null == parameterAdjuster ),
   *       the To.Same() will be used as adjuster function.
   *
   *     - If ( null != parameterValue ), the returned value of parameterAdjuster( parameterValue ) will be used as the
   *       parameter's value. (i.e. by specifying)
   *
   *     - If ( null == parameterValue ), the parameter will be extracted from inputFloat32Array (or fixedWeights).The
   *       returned value of parameterAdjuster( extractedValue ) will be used as the parameter's value. (i.e. by evolution)
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

      let parameterValue, parameterAdjuster;
      for ( let [ key, value_and_adjuster ] of parameterMap ) {

        // A null (or undefined) value_and_adjuster means it should be extracted from inputFloat32Array or fixedWeights,
        // and using To.Same() as adjuster function. (i.e. by evolution)
        if ( null == value_and_adjuster ) {
          parameterValue = null;
          parameterAdjuster = To.Same;
        } else {
          parameterValue = value_and_adjuster[ 0 ];
          parameterAdjuster = value_and_adjuster[ 1 ];
        }

        // Always should have adjuster function. At least, using the-same-value function.
        if ( null == parameterAdjuster )
          parameterAdjuster = To.Same;

        // A null parameterValue means it should be extracted from inputFloat32Array (or fixedWeights). (i.e. by evolution)
        //
        // Note: This is different from ( !value ). If value is 0, ( !value ) is true but ( null == value ) is false.
        if ( null == parameterValue ) {
          // Record the index (into this.weightsModified[]) and the adjuster.
          arrayIndexMap.set( key, { arrayIndex: i, adjusterFunction: parameterAdjuster } );
          ++i;
        } else {
          // A non-null value means it is the parameter's value (after adjusted).
          let adjustedValue = parameterAdjuster( parameterValue );
          this.parameterMapModified.set( key, adjustedValue );
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

    // Copy the adjusted extracted weights.
    //
    // Do not modify the original array data, because the original data is necessary when backtracking (to try
    // another neural network layer configuration.
    this.weightsModified = new Float32Array( this.weights.length );

    // Extract (by evolution) values from array, convert them, and put back into copied array and copied map.
    for ( let [ key, { arrayIndex, adjusterFunction } ] of arrayIndexMap ) {
      let extractedValue = this.weights[ arrayIndex ];
      let adjustedValue = adjusterFunction( extractedValue );
      this.weightsModified[ arrayIndex ] = adjustedValue;  // Record in array.
      this.parameterMapModified.set( key, adjustedValue ); // Record in map, too.
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
