export { Same, Bool, Int, ActivationFunction, AvgMax_Or_ChannelMultiplier };

import * as ValueRange from "./ValueRange.js";


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
 * @member {ValueRange.Int} range
 *   The integer range of the parameter's all possible values. It is an ValueRange.Int object with ( min = valueIntegerMin )
 * and ( max = valueIntegerMax ).
 *
 * @member {string[]} valueNames
 *   The string names of the parameter's all named values. It is an array of strings. They should be all legal identifers too (i.e. A-Z,
 * a-z, 0-9 (not at first character), and "_"). They will become the properties' names of this.Ids. Note that
 * ( valueNames.length <= range.kinds ). This means that only first valueNames.length values have names. So, it is possible
 * that all values do not have names (when valueNames[] is empty).
 *
 * @member {object[]} valueObjects
 *   The extra objects of the parameter values. It is an array of objects. They will become the properties' names of this.extraObjects.
 * Note that ( valueObjects.length <= range.kinds ). This means that only first valueObjects.length values have names. So, it is possible
 * that all values do not have extra objects (when valueObjects[] is empty).
 *
 * @member {Object} Ids
 *   An object contains the parameter's all named values. It is just like a name-to-integer Map (this.nameToIntegerMap), but
 * could be accessed by dot (.) operator (not by .get() method). This could be used as a constant enumeration. The
 * this.Ids.valueName will be valueInteger. Or, the this.Ids[ valueName ] will be valueInteger. That is:
 *   - this.Ids[ valueNames[ 0 ] ] = valueIntegers[ 0 ] = ( valueIntegerMin + 0 )
 *   - this.Ids[ valueNames[ 1 ] ] = valueIntegers[ 1 ] = ( valueIntegerMin + 1 )
 *   - ...
 *   - this.Ids[ valueNames[ ( valueNames.length - 1 ) ] ] = valueIntegers[ valueNames.length - 1 ] = ( valueIntegerMin + ( valueNames.length - 1 ) )
 *
 * @member {Map} nameToIntegerMap
 *   A map object contains the parameter's all named values. Using this.nameToIntegerMap.get( name ) could get the integer value of
 * the name.
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
   *   The last (i.e. maximum) integer of the parameter's all possible values. It should equal ( valueIntegerMin + ( valueNames.length - 1 ) ).
   */
  constructor( valueIntegerMin, valueIntegerMax, valueNames = [], valueObjects = [] ) {

    this.range = new ValueRange.Int( valueIntegerMin, valueIntegerMax );
    this.valueNames = valueNames;
    this.valueObjects = valueObjects;

    this.Ids = {};
    this.integerToNameMap = new Map;
    this.nameToIntegerMap = new Map;
    for ( let i = 0; i < valueNames.length; ++i ) {
      let integerId = ( valueIntegerMin + i );
      let name = valueNames[ i ];
      this.Ids[ name ] = integerId;
      this.integerToNameMap.set( integerId, name );
      this.nameToIntegerMap.set( name, integerId );
    }

    this.integerToObjectMap = new Map;
    for ( let i = 0; i < valueObjects.length; ++i ) {
      let integerId = ( valueIntegerMin + i );
      let object = valueObjects[ i ];
      this.integerToObjectMap.set( integerId, object );
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

}


/**
 * Describe activation function parameter's id, range, name.
 *
 *
 * It could be shared between different parameter description.
 */
class ActivationFunction extends Int {

  constructor() {
    super( 0, 6,
      [ "NONE",  "RELU",  "RELU6",  "COS",  "SIN",  "SIGMOID",  "TANH" ],
      [   null, tf.relu, tf.relu6, tf.cos, tf.sin, tf.sigmoid, tf.tanh ]
    );
  }

}

/** The only one ValueDesc.ActivationFunction instance. */
ActivationFunction.Singleton = new ActivationFunction;


/** Describe depthwise operation's id, range, name.
 *
 * Convert number value into integer between [ -2, 32 ] representing depthwise operation:
 *   - -2: average pooling. (AVG)
 *   - -1: maximum pooling. (MAX)
 *   -  0: no depthwise operation. (NONE)
 *   - [ 1, 32 ]: depthwise convolution with channel multiplier between 1 and 32 (inclusive).
 */
class AvgMax_Or_ChannelMultiplier extends Int {

  constructor() {
    super( -2, 32, [ "AVG", "MAX", "NONE" ] );
  }

}

/** The only one ValueDesc.AvgMax_Or_ChannelMultiplier instance. */
AvgMax_Or_ChannelMultiplier.Singleton = new AvgMax_Or_ChannelMultiplier;


/** Describe id, range, name of channelCount1_pointwise1Before.
 *
 * Convert number value into integer between [ -2, 32 ] representing depthwise operation:
 *   - -2: ONE_INPUT_TWO_DEPTHWISE
 *   - -1: ONE_INPUT_ADD_TO_OUTPUT
 *   -  0: ONE_INPUT
 *   - [ 1, ( 10 * 1024 ) ]: TWO_INPUTS with the second input channel count between 1 and 10240 (inclusive).
 */
class channelCount1_pointwise1Before extends Int {

  constructor() {
    super( -2, ( 10 * 1024 ), [
      "ONE_INPUT_TWO_DEPTHWISE",
      "ONE_INPUT_ADD_TO_OUTPUT",
      "ONE_INPUT",

      // i.e. "TWO_INPUTS_1", "TWO_INPUTS_2", ..., "TWO_INPUTS_10240".
      ... [ ... new Array( 10 * 1024 ).keys() ].map( x => "TWO_INPUTS_" + ( x + 1 ) )
    ] );
  }

}

/** The only one ValueDesc.AvgMax_Or_ChannelMultiplier instance. */
channelCount1_pointwise1Before.Singleton = new channelCount1_pointwise1Before;
