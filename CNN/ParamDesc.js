export { IntegerRange, IntegerDesc, BooleanDesc };


/**
 * Provides methods for converting nothing (just return original value).
 */
class SameRange {

  /** @return {any} Return the input value directly. */
  adjust( value ) {
    return value;
  }

  /**
   * @return {function}
   *   Return a function object. When calling the returned function object with one value parameter, it will return
   * the adjusted value which is retricted by this object.
   */
  getAdjuster() {
    return this.adjust.bind( this );
  }
}

/** The only one SameRange instance. */
SameRange.Singleton = new SameRange;


/**
 * Provides methods for converting weight to integer between min and max (both are integers).
 */
class IntegerRange {

  /**
   * @param {number} min The minimum value (as integer).
   * @param {number} max The maximum value (as integer).
   */
  constructor( min, max ) {
    this.min = Math.trunc( Math.min( min, max ) ); // Confirm the minimum. Convert to an integer.
    this.max = Math.trunc( Math.max( min, max ) ); // Confirm the maximum. Convert to an integer.
    this.kinds = ( this.max - this.min ) + 1; // How many possible integer between them.
  }

  /**
   * @return {number} Return the trucated value (i.e. integer). The returned value is forcibly between min and max (as integer too).
   */
  adjust( value ) {
    let valueInt = Math.trunc( value ); // Convert to an integer.

    // Rearrange valueInt between min and max fairly (in probability).
    //
    // A1: Why not use remainder operator (%) directly?
    // Q1: Because remainder always has the same sign as dividend, this can not handle the situation which min and
    //     max have different sign.
    //
    // A2: Why not just restrict all value less than min to valueMin and value greater than max to max?
    // Q2: Although this could restrict value in range, it will skew the probability of every value in the range.
    //     Unfair probability could be harmful to evolution algorithm.
    //
    let quotient = ( valueInt - this.min ) / this.kinds;
    let quotientInt = Math.floor( quotient );  // So that negative value could be handled correctly.
    let result = valueInt - ( quotientInt * this.kinds );
    return result;
  }

  /**
   * @return {function}
   *   Return a function object. When calling the returned function object with one value parameter, it will return
   * the adjusted value which is retricted by this object.
   */
  getAdjuster() {
    return this.adjust.bind( this );
  }
}


/**
 * Provides methods for converting weight to boolean.
 */
class BooleanRange {

  /** @return {boolean} Convert number value into false or true. */
  adjust( value ) {
    // If value is not an integer, the remainder will always not zero. So convert it to integer first.
    //
    // According to negative or positive, the remainder could be one of [ -1, 0, +1 ].
    // So simply check it whether is 0 (instead of check both -1 and +1), could result in false or true.
    return ( ( Math.trunc( value ) % 2 ) != 0 );
  }

  /**
   * @return {function}
   *   Return a function object. When calling the returned function object with one value parameter, it will return
   * the adjusted value which is retricted by this object.
   */
  getAdjuster() {
    return this.adjust.bind( this );
  }
}

/** The only one BooleanRange instance. */
BooleanRange.Singleton = new BooleanRange;


/**
 * Describe some properties of a non-converting parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
 *
 * @member {SameRange} range
 *   The range of the parameter's all possible values. It is an SameRange object.
 *
 */
class SameDesc {

  /**
   *
   */
  constructor( paramName ) {
    this.paramName = paramName;

    this.paramNameKey = Symbol( paramName );
    this.range = SameRange.Singleton;
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
 * @member {IntegerRange} range
 *   The integer range of the parameter's all possible values. It is an IntegerRange object with ( min = valueIntegerMin )
 * and ( max = valueIntegerMax ).
 *
 * @member {string[]} valueNames
 *   The string names of the parameter's all named values. It is an array of strings. They should be all legal identifers too (i.e. A-Z,
 * a-z, 0-9 (not at first character), and "_"). They will become the properties' names of this.valueNameInteger. Note that
 * ( valueNames.length <= range.kinds ). This means that only first valueNames.length values have names. So, it is possible
 * that all values are no names (when valueNames[] is empty).
 *
 * @member {number[]} valueIntegers
 *   The integer values of the parameter's all named values. ( valueIntegers.length == valueNames.length == valueNameInteger.lenth ).
 *
 * @member {Object} Ids
 *   An object contains the parameter's all named values. It is just like a Map, but could be accessed by dot (.) operator
 * (not by .get() method). The this.Ids.valueName will be valueInteger. Or, the this.Ids[ valueName ]
 * will be valueInteger. That is:
 *   - this.Ids[ valueNames[ 0 ] ] = valueIntegers[ 0 ] = ( valueIntegerMin + 0 )
 *   - this.Ids[ valueNames[ 1 ] ] = valueIntegers[ 1 ] = ( valueIntegerMin + 1 )
 *   - ...
 *   - this.Ids[ valueNames[ ( valueNames.length - 1 ) ] ] = valueIntegers[ valueNames.length - 1 ] = ( valueIntegerMin + ( valueNames.length - 1 ) )
 *
 */
class IntegerDesc {

  /**
   *
   * @param {number} valueIntegerMin
   *   The first (i.e. minimum) integer of the parameter's all possible values.
   *
   * @param {number} valueIntegerMax
   *   The last (i.e. maximum) integer of the parameter's all possible values. It should equal ( valueIntegerMin + ( valueNames.length - 1 ) ).
   */
  constructor( paramName, valueIntegerMin, valueIntegerMax, valueNames ) {
    this.paramName = paramName;

    if ( !valueNames )
      valueNames = []; // ( valueNames == null ), means all values are no names.

    this.valueNames = valueNames;

    this.paramNameKey = Symbol( paramName );
    this.range = new IntegerRange( valueIntegerMin, valueIntegerMax );

//!!! (2021/03/14 Remarked) It is possible and legal.
//     If ( valueIntegerMax != ( valueIntegerMin + ( valueNames.length - 1 ) ) ) {
//       let errMsg = `ParamDescInteger: ( valueIntegerMax = ${valueIntegerMax} )`
//         + ` should equal ( valueIntegerMin + ( valueNames.length - 1 ) ) = ( ${valueIntegerMin} + ( ${valueNames.length} - 1 ) )`;
//       throw errMsg;
//     }

    this.valueIntegers = new Array( valueNames.length ); // ( valueNames.length <= range.kinds )
    this.Ids = {};
    for ( let i = 0; i < valueNames.length; ++i ) {
      this.Ids[ valueNames[ i ] ] = this.valueIntegers[ i ] = ( valueIntegerMin + i );
    }

  }
}


/**
 * Describe some properties of a boolean parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
 *
 * @member {BooleanRange} range
 *   The boolean range of the parameter's all possible values. It is an BooleanRange object.
 *
 */
class BooleanDesc {

  /**
   *
   */
  constructor( paramName ) {
    this.paramName = paramName;

    this.paramNameKey = Symbol( paramName );
    this.range = BooleanRange.Singleton;
  }
}
