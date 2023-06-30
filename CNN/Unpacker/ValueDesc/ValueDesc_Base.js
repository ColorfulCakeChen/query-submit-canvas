export { Same, Bool, Int };

import * as ValueRange from "../ValueRange.js";

/**
 * Describe some properties of a non-converting parameter.
 *
 * @member {ValueRange.Same} range
 *   The range of the parameter's all possible values. It is a ValueRange.Same
 * object.
 *
 */
class Same {

  constructor() {
    this.range = ValueRange.Same.Singleton;
  }

  /** @return {string} Return the string value. */
  getName_byId( value ) {
    return String( value ); // workable even if undefined, null, NaN, Infinity.
  }
}

/** The only one ValueDesc.Same instance. */
Same.Singleton = new Same;


/**
 * Describe some properties of a boolean parameter.
 *
 * @member {ValueRange.Bool} range
 *   The boolean range of the parameter's all possible values. It is a
 * ValueRange.Bool object.
 *
 */
class Bool {

  constructor() {
    this.range = ValueRange.Bool.Singleton;
  }

  /** @return {string} Return the string value. */
  getName_byId( value ) {
    return String( value );
  }
}

/** The only one ValueDesc.Bool instance. */
Bool.Singleton = new Bool;


/**
 * Describe some properties of an integer parameter.
 *
 *
 * Q: Why uses object literal instead of string array?
 * A: So that JaveScript codes compressor could work properly.
 *
 *
 *
 * @member {ValueRange.Int} range
 *   The integer range of the parameter's all possible values. It is an
 * ValueRange.Int object with ( min = valueIntegerMin ) and
 * ( max = valueIntegerMax ).
 *
 * @member {Object} Ids
 *   An object contains all the named values. It is constructed from Infos.Xxx
 * and Infos.Xxx.id. The Objects.keys( Ids ).length could be less than
 * .range.kinds (i.e. some number value could have no name). It is just like a
 * name-to-integer Map, but could be accessed by dot (.) operator (not by
 * .get() method). It could be used as a constant enumeration. The
 * this.Ids.valueName (or this.Ids[ valueName ]) will be valueInteger.
 *
 * @member {Object} Infos
 *   An object contains all named integer values' information. Its every
 * property should a Int.Info (or sub-class) object. This Infos object will be
 * kept (i.e. not cloned) by this ValueDesc.Int object. The
 * Objects.keys( Infos ).length could be less than .range.kinds (i.e. some
 * number value could have no extra information object). It is just like a
 * name-to-object Map, but could be accessed by dot (.) operator (not by
 * .get() method). This could be used as a constant enumeration. The
 * this.Infos.valueName (or this.Infos[ valueName ]) will be an
 * Int.Info (or sub-class) instance.
 *
 * @member {Map} integerToInfoMap
 *   A map object contains integer value to its information. Using
 * this.integerToObjectMap.get( integerValue ) could get the information object
 * of the integer value.
 *
 * @member {Map} integerToNameMap
 *   A map object contains integer value to its name. Using
 * this.integerToNameMap.get( integerValue ) could get the name of the integer
 * value.
 *
 * @member {Map} integerToNameWithIntMap
 *   A map object contains integer value to its name (e.g. "Xxx") with integer
 * (e.g. "Xxx( 12 )"). Using this.integerToNameWithIntMap.get( integerValue )
 * could get the name with integer of the integer value.
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
        + `Object.keys( Infos ).length ( ${infoArray.length} ) `
        + `should be <= range.kinds ( ${this.range.kinds} ).`
      );

    {
      this.Ids = {};
      this.integerToInfoMap = new Map;
      this.integerToNameMap = new Map;
      this.integerToNameWithIntMap = new Map;

      let nameForProgramArray = Object.keys( Infos );
      for ( let i = 0; i < infoArray.length; ++i ) {
        let info = infoArray[ i ];

        let integerId = info.id;

        // Ensure the number value is in range.
        if ( ( integerId < this.range.min ) || ( integerId > this.range.max ) )
          throw Error( `ValueDesc.Int.constructor(): Range violation: `
            + `integerId ( ${integerId} ) should be in range `
            + `[ ${this.range.min}, ${this.range.max} ].`
          );

        // This is the name which could be twisted by JavaScript codes
        // compressor.
        let nameForProgram = nameForProgramArray[ i ];

        // This is the name which will not be twisted by JavaScript codes
        // compressor.
        let nameForMessage = info.nameForMessage;

        // Ensure integerId not duplicated.
        const checkingInfo = this.integerToInfoMap.get( integerId );
        if ( checkingInfo !== undefined )
          throw Error( `ValueDesc.Int.constructor(): Range violation: `
            + `integerId ( ${integerId} ) appears multiple times.`
          );

        this.Ids[ nameForProgram ] = integerId;
        this.integerToInfoMap.set( integerId, info );
        this.integerToNameMap.set( integerId, nameForMessage );

        this.integerToNameWithIntMap
          .set( integerId, `${nameForMessage}(${integerId})` );
      }
    }
  }

  /**
   * @param {number} integerValue
   *   It should be one of ValueDesc.Yyy.Singleton.Ids.Xxx.
   *
   * @return {string}
   *   Return the integerValue's name (e.g. "AVG", "MAX", "NONE"). If no name,
   * return the string of the integer value (e.g. "1", "2", ..., "64").
   */
  getName_byId( integerValue ) {
    // Look up whether has name (e.g. "AVG", "MAX", "NONE").
    let name = this.integerToNameMap.get( integerValue );
    if ( name === undefined ) {
      name = String( integerValue );
    }
    return name;
  }

  /**
   * @param {number} integerValue
   *   It should be one of ValueDesc.Yyy.Singleton.Ids.Xxx.
   *
   * @return {string}
   *   Return the integerValue's name with integer (e.g. "AVG(-2)", "MAX(-1)",
   * "NONE(0)"). If no name, return the string of the integer value (e.g. "1",
   * "2", ..., "64").
   */
  getNameWithInt_byId( integerValue ) {
    // Look up whether has name (e.g. "AVG(-2)", "MAX(-1)", "NONE(0)").
    let nameWithInt = this.integerToNameWithIntMap.get( integerValue );
    if ( nameWithInt === undefined ) {
      nameWithInt = String( integerValue );
    }
    return nameWithInt;
  }

  /**
   *
   * @param {number} integerValue
   *   It should be one of ValueDesc.Yyy.Singleton.Ids.Xxx.
   *
   * @return {Object}
   *   - Return the extra information object of the integerValue.
   *   - Return undefined, if not found.
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
   *   The number identifier of the integer value. In fact, this is the integer
   * value itself.
   *
   * @param {string} nameForMessage
   *   The string name of the integer value. Usually, it is used for debug
   * message. This is why it is a string (so that it will not be twisted by
   * JavaScript codes compressor).
   */
  constructor( id, nameForMessage ) {
    this.id = id;
    this.nameForMessage = nameForMessage;
  }

}
