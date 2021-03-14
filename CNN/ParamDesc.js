export { IntegerRange, Integer };

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
class Integer {

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
