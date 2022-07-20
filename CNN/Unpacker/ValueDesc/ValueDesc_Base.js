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
  getName_byId( value ) {
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
  getName_byId( value ) {
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
 *   An object contains all the named values. It is constructed from Infos.Xxx and Infos.Xxx.id. The Objects.keys( Ids ).length
 * could be less than .range.kinds (i.e. some number value could have no name). It is just like a name-to-integer Map, but could
 * be accessed by dot (.) operator (not by .get() method). It could be used as a constant enumeration. The this.Ids.valueName
 * (or this.Ids[ valueName ]) will be valueInteger.
 *
 * @member {Object} Infos
 *   An object contains all named integer values' information. Its evey property should a Int.Info (or sub-class) object.
 * This Infos object will be kept (i.e. not cloned) by this ValueDesc.Int object.  The Objects.keys( Infos ).length could
 * be less than .range.kinds (i.e. some number value could have no extra information object). It is just like a name-to-object
 * Map, but could be accessed by dot (.) operator (not by .get() method). This could be used as a constant enumeration.
 * The this.Infos.valueName (or this.Infos[ valueName ]) will be an Int.Info (sub-class) instance.
 *
 * @member {Map} integerToNameMap
 *   A map object contains integer value to its name. Using this.integerToNameMap.get( integerValue ) could get the name of
 * the integer value.
 *
 * @member {Map} integerToInfoMap
 *   A map object contains integer value to its information. Using this.integerToObjectMap.get( integerValue ) could get the
 * information object of the integer value.
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
  constructor( valueIntegerMin, valueIntegerMax, Infos = {} ) {

    this.range = new ValueRange.Int( valueIntegerMin, valueIntegerMax );
    this.Infos = Infos;

    let infoArray = Object.values( Infos );
    if ( infoArray.length > this.range.kinds )
      throw Error( `ValueDesc.Int.constructor(): Range violation: `
        + `Object.keys( Infos ).length ( ${infoArray.length} ) should be <= range.kinds ( ${this.range.kinds} ).`
      );

    {
      this.Ids = {};
      this.integerToNameMap = new Map;
      this.integerToInfoMap = new Map;

      let nameForProgramArray = Object.keys( Infos );
      for ( let i = 0; i < nameArray.length; ++i ) {
        let info = infoArray[ i ];

        let integerId = info.id;
        if ( ( integerId < this.range.min ) || ( integerId > this.range.max ) ) // Ensure the number value is in range.
          throw Error( `ValueDesc.Int.constructor(): Range violation: `
            + `integerId ( ${integerId} ) should be in range [ ${this.range.min}, ${this.range.max} ].`
          );

        let nameForProgram = nameForProgramArray[ i ]; // This is name could be twisted by JavaScript codes compressor.
        let nameForMessage = info.nameForMessage; // This is name will not be twisted by JavaScript codes compressor.

        this.Ids[ nameForProgram ] = integerId;
        this.integerToNameMap.set( integerId, nameForMessage );
        this.integerToInfoMap.set( integerId, info );
      }
    }
  }

  /**
   * @return {string}
   *   Return the name of the integerValue. If no name, return the string of the integer value (e.g. "1", "2", ..., "64").
   */
  getName_byId( integerValue ) {
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
  getInfo_byId( integerValue ) {
    let info = this.integerToInfoMap.get( integerValue );
    return info;
  }

}


/**
 * Provide number identifier and string name of a integer value.
 */
Int.Info = class Int_Info {

  /**
   * 
   * @param {number} id
   *   The number identifier of the integer value. In fact, this is the integer value itself.
   *
   * @param {string} nameForMessage
   *   The string name of the integer value. Usually, it is used for debug message. This is why it is a string (so that
   * it will not be twisted by JavaScript codes compressor).
   */
  constructor( id, nameForMessage ) {
    this.id = id;
    this.nameForMessage = nameForMessage;
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

