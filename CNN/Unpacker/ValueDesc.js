export { Same, Bool, Int };

import * as ValueRange from "./ValueRange.js";


/**
 * Describe some properties of a non-converting parameter.
 *
 * @member {ValueRange.Same} range
 *   The range of the parameter's all possible values. It is a ValueRange.Same object.
 *
 */
class Same {

  /**
   *
   */
  constructor() {
    this.range = ValueRange.Same.Singleton;
  }
}


/**
 * Describe some properties of a boolean parameter.
 *
 * @member {ValueRange.Bool} range
 *   The boolean range of the parameter's all possible values. It is a ValueRange.Bool object.
 *
 */
class Bool {

  /**
   *
   */
  constructor() {
    this.range = ValueRange.Bool.Singleton;
  }
}


//!!! ...unfinished... (2021/03/14)
// Could define a class contains one parameter's key (symbol), range (and adjuster), ids (string?-number), idToNameMap (number-string), nameToIdMap (string-number)?
// But all parameters' keys should be browsable by iterator.
//
// ids is already a kinds of string-number. Perhaps, nameToIdMap should be derived from ids automatically.
//
// Where is Functions?

/**
 * Describe some properties of an integer parameter.
 *
 * @member {ValueRange.Int} range
 *   The integer range of the parameter's all possible values. It is an ValueRange.Int object with ( min = valueIntegerMin )
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
class Int {

  /**
   *
   * @param {number} valueIntegerMin
   *   The first (i.e. minimum) integer of the parameter's all possible values.
   *
   * @param {number} valueIntegerMax
   *   The last (i.e. maximum) integer of the parameter's all possible values. It should equal ( valueIntegerMin + ( valueNames.length - 1 ) ).
   */
  constructor( valueIntegerMin, valueIntegerMax, valueNames ) {

    this.range = new ValueRange.Int( valueIntegerMin, valueIntegerMax );

    if ( !valueNames )
      valueNames = []; // ( valueNames == null ), means all values are no names.

    this.valueNames = valueNames;

    this.valueIntegers = new Array( valueNames.length ); // ( valueNames.length <= range.kinds )
    this.Ids = {};
    for ( let i = 0; i < valueNames.length; ++i ) {
      this.Ids[ valueNames[ i ] ] = this.valueIntegers[ i ] = ( valueIntegerMin + i );
    }

  }
}
