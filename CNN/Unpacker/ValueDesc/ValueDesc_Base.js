export { Same, Bool, Int };

import * as ValueRange from "../ValueRange.js";

/**
 * Describe some properties of a non-converting parameter.
 *
 * @member {ValueRange.Same} range
 *   The range of the parameter's all possible values. It is a ValueRange.Same object.
 *
 */
class Same {

  constructor() {
    this.range = ValueRange.Same.Singleton;
  }

  /** @return {string} Return the string value. */
  getStringOf( value ) {
    return value.toString();
  }
}

/** The only one ValueDesc.Same instance. */
Same.Singleton = new Same;


/**
 * Describe some properties of a boolean parameter.
 *
 * @member {ValueRange.Bool} range
 *   The boolean range of the parameter's all possible values. It is a ValueRange.Bool object.
 *
 */
class Bool {

  constructor() {
    this.range = ValueRange.Bool.Singleton;
  }

  /** @return {string} Return the string value. */
  getStringOf( value ) {
    return value.toString();
  }
}

/** The only one ValueDesc.Bool instance. */
Bool.Singleton = new Bool;


/**
 * Describe some properties of an integer parameter.
 *
 *
 * Q: Why use object literal instead of string array?
 * A: So that JaveScript codes compressor could work properly.
 *
 *
 *
 * @member {ValueRange.Int} range
 *   The integer range of the parameter's all possible values. It is an ValueRange.Int object with ( min = valueIntegerMin )
 * and ( max = valueIntegerMax ).
 *
 * @member {Object} Ids
 *   An object contains all the named values. Its length could be less than .range.kinds (i.e. some number value could have no
 * name). It is just like a name-to-integer Map, but could be accessed by dot (.) operator (not by .get() method). This Ids
 * object will be kept (i.e. not cloned) by this ValueDesc.Int object. It could be used as a constant enumeration. The
 * this.Ids.valueName will be valueInteger. Or, the this.Ids[ valueName ] will be valueInteger. That is:
 *   - this.Ids.Xxx = ( valueIntegerMin + 0 )
 *   - this.Ids.Yyy = ( valueIntegerMin + 1 )
 *   - ...
 *   - this.Ids.Zzz = ( valueIntegerMin + ( valueNames.length - 1 ) )
 *
 * @member {Object} Infos
 *   An object contains the parameter's all names' extra information objects. Its length could be less than .range.kinds (i.e.
 * some number value could have no extra information object). It is just like a name-to-object Map, but could be accessed by dot (.)
 * operator (not by .get() method). This could be used as a constant enumeration. The this.Infos.valueName will be an object.
 * Or, the this.Infos[ valueName ] will be object. That is:
 *   - this.Infos.Xxx = object_for_( valueIntegerMin + 0 )
 *   - this.Infos.Yyy = object_for_( valueIntegerMin + 1 )
 *   - ...
 *   - this.Infos.Zzz = object_for_( valueIntegerMin + ( valueNames.length - 1 ) )
 *
 * @member {Map} integerToNameMap
 *   A map object contains the parameter's all named values. Using this.integerToNameMap.get( integerValue ) could get the name of
 * the integer value.
 *
 * @member {Map} integerToObjectMap
 *   A map object contains the parameter's all object values. Using this.integerToObjectMap.get( integerValue ) could get the extra
 * object of the integer value.
 *
 */
class Int {

  /**
   *
   * @param {number} valueIntegerMin
   *   The first (i.e. minimum) integer of the parameter's all possible values.
   *
   * @param {number} valueIntegerMax
   *   The last (i.e. maximum) integer of the parameter's all possible values.
   */
  constructor( valueIntegerMin, valueIntegerMax, Ids, Infos ) {

    this.range = new ValueRange.Int( valueIntegerMin, valueIntegerMax );
    this.Ids = Ids;
    this.Infos = Infos;

    // Ids
    {
      let nameArray = Object.keys( Ids );
      let valueArray = Object.values( Ids );
      if ( nameArray.length > this.range.kinds )
        throw Error( `ValueDesc.Int.constructor(): Range violation: `
          + `Object.keys( Ids ).length ( ${nameArray.length} ) should be <= range.kinds ( ${this.range.kinds} ).`
        );

      this.integerToNameMap = new Map;
      for ( let i = 0; i < nameArray.length; ++i ) {
        let integerId = valueArray[ i ];

        if ( ( integerId < this.range.min ) || ( integerId > this.range.max ) ) // Ensure the number value is in range.
          throw Error( `ValueDesc.Int.constructor(): Range violation: `
            + `integerId ( ${integerId} ) should be in range [ ${this.range.min}, ${this.range.max} ].`
          );

        let name = nameArray[ i ];
        this.integerToNameMap.set( integerId, name );
      }
    }

    // Infos
    this.integerToObjectMap = new Map;
    if ( Infos ) {
      let nameArray = Object.keys( Infos );
      let objectArray = Object.values( Infos );
      if ( nameArray.length > this.range.kinds )
        throw Error( `ValueDesc.Int.constructor(): Range violation: `
          + `Object.keys( Infos ).length ( ${nameArray.length} ) should be <= range.kinds ( ${this.range.kinds} ).`
        );

      for ( let i = 0; i < nameArray.length; ++i ) {
        let name = nameArray[ i ];
        let integerId = Ids[ name ];

        if ( integerId == undefined )
          throw Error( `ValueDesc.Int.constructor(): Unknown name: `
            + `Info name ( ${name} ) should have number value.`
          );

        let object = objectArray[ i ];
        this.integerToObjectMap.set( integerId, object );
      }
    }
  }

  /**
   * @return {string}
   *   Return the name of the integerValue. If no name, return the string of the integer value (e.g. "1", "2", ..., "64").
   */
  getStringOf( integerValue ) {
    let name = this.integerToNameMap.get( integerValue ); // Look up whether has name (e.g. "AVG", "MAX", "NONE").
    if ( null == name ) {
      name = integerValue.toString();
    }
    return name;
  }

  /**
   *
   * @param {number} integerValue
   *   It should be one of ValueDesc.Yyy.Singleton.Ids.Xxx.
   *
   * @return {Object}
   *   Return the extra information object of the integerValue. Return undefined, if not found.
   */
  getInfoById( integerValue ) {
    let info = this.integerToObjectMap.get( integerValue );
    return info;
  }

}


//!!! (2022/07/19 Remarked) Old Codes. Use object literal instead of string array.
// /**
//  * Describe some properties of an integer parameter.
//  *
//  * @member {ValueRange.Int} range
//  *   The integer range of the parameter's all possible values. It is an ValueRange.Int object with ( min = valueIntegerMin )
//  * and ( max = valueIntegerMax ).
//  *
//  * @member {string[]} valueNames
//  *   The string names of the parameter's all named values. It is an array of strings. They should be all legal identifers too (i.e. A-Z,
//  * a-z, 0-9 (not at first character), and "_"). They will become the properties' names of this.Ids. Note that
//  * ( valueNames.length <= range.kinds ). This means that only first valueNames.length values have names. So, it is possible
//  * that all values do not have names (when valueNames[] is empty).
//  *
//  * @member {object[]} valueObjects
//  *   The extra objects of the parameter values. It is an array of objects. They will become the properties' names of this.extraObjects.
//  * Note that ( valueObjects.length <= range.kinds ). This means that only first valueObjects.length values have names. So, it is possible
//  * that all values do not have extra objects (when valueObjects[] is empty).
//  *
//  * @member {Object} Ids
//  *   An object contains the parameter's all named values. It is just like a name-to-integer Map (this.nameToIntegerMap), but
//  * could be accessed by dot (.) operator (not by .get() method). This could be used as a constant enumeration. The
//  * this.Ids.valueName will be valueInteger. Or, the this.Ids[ valueName ] will be valueInteger. That is:
//  *   - this.Ids[ valueNames[ 0 ] ] = valueIntegers[ 0 ] = ( valueIntegerMin + 0 )
//  *   - this.Ids[ valueNames[ 1 ] ] = valueIntegers[ 1 ] = ( valueIntegerMin + 1 )
//  *   - ...
//  *   - this.Ids[ valueNames[ ( valueNames.length - 1 ) ] ] = valueIntegers[ valueNames.length - 1 ] = ( valueIntegerMin + ( valueNames.length - 1 ) )
//  *
//  * @member {Map} nameToIntegerMap
//  *   A map object contains the parameter's all named values. Using this.nameToIntegerMap.get( name ) could get the integer value of
//  * the name.
//  *
//  * @member {Map} integerToNameMap
//  *   A map object contains the parameter's all named values. Using this.integerToNameMap.get( integerValue ) could get the name of
//  * the integer value.
//  *
//  * @member {Map} integerToObjectMap
//  *   A map object contains the parameter's all object values. Using this.integerToObjectMap.get( integerValue ) could get the extra
//  * object of the integer value.
//  *
//  */
// class Int {
//
// !!! ...unfinished... (2022/07/19)
// // name to number, name to object map should object property syntax (instead of string) so that javascript could work.
//
//   /**
//    *
//    * @param {number} valueIntegerMin
//    *   The first (i.e. minimum) integer of the parameter's all possible values.
//    *
//    * @param {number} valueIntegerMax
//    *   The last (i.e. maximum) integer of the parameter's all possible values. It should equal ( valueIntegerMin + ( valueNames.length - 1 ) ).
//    */
//   constructor( valueIntegerMin, valueIntegerMax, valueNames = [], valueObjects = [] ) {
//
//     this.range = new ValueRange.Int( valueIntegerMin, valueIntegerMax );
//     this.valueNames = valueNames;
//     this.valueObjects = valueObjects;
//
//     if ( valueNames.length > this.range.kinds )
//       throw Error( `ValueDesc.Int.constructor(): Range violation: `
//         + `valueNames.length ( ${valueNames.length} ) <= range.kinds ( ${this.range.kinds} ).`
//       );
//
//     if ( valueObjects.length > this.range.kinds )
//       throw Error( `ValueDesc.Int.constructor(): Range violation: `
//         + `valueObjects.length ( ${valueObjects.length} ) <= range.kinds ( ${this.range.kinds} ).`
//       );
//
//     this.Ids = {};
//     this.integerToNameMap = new Map;
//     this.nameToIntegerMap = new Map;
//     for ( let i = 0; i < valueNames.length; ++i ) {
//       let integerId = ( valueIntegerMin + i );
//       let name = valueNames[ i ];
//       this.Ids[ name ] = integerId;
//       this.integerToNameMap.set( integerId, name );
//       this.nameToIntegerMap.set( name, integerId );
//     }
//
//     this.integerToObjectMap = new Map;
//     for ( let i = 0; i < valueObjects.length; ++i ) {
//       let integerId = ( valueIntegerMin + i );
//       let object = valueObjects[ i ];
//       this.integerToObjectMap.set( integerId, object );
//     }
//   }
//
//   /**
//    * @return {string}
//    *   Return the name of the integerValue. If no name, return the string of the integer value (e.g. "1", "2", ..., "64").
//    */
//   getStringOf( integerValue ) {
//     let name = this.integerToNameMap.get( integerValue ); // Look up whether has name (e.g. "AVG", "MAX", "NONE").
//     if ( null == name ) {
//       name = integerValue.toString();
//     }
//     return name;
//   }
//
// }

