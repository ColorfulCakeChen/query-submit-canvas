export { Base, Same, Bool, Int, ActivationFunction, AvgMax_Or_ChannelMultiplier };
export {  channelCount1_pointwise1Before, pointwise22ChannelCount };

import * as ValueDesc from "./ValueDesc.js";


/**
 * Describe some properties of a parameter.
 * Usually, a ParamDesc object is also be used as the unique key of a parameter.
 *
 * Q: Why are there ValueDesc and ParamDesc two layers?
 * A: Let different parameter descriptions (ParamDesc) share the same value description (ValueDesc).
 *    It is especially useful for integer parameter ( new ParamDesc.Base( paramName, new ValueDesc.Int() ) ).
 *    For non-converting and boolean parameter, using ParamDesc.Same and ParamDesc.Bool is enough.
 *
 * @example
 * let fruitKinds = new ValueDesc.Int( 0, 2, [ APPLE, ORANGE, BANANA ] );
 * Params.lunch = new ParamDesc.Base( "lunch", fruitKinds );
 * Params.dinner = new ParamDesc.Base( "dinner", fruitKinds );
 *
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {ValueDesc.Xxx} valueDesc
 *   The description of the parameter's all possible values. It should be a ValueDesc.Xxx object (one of ValueDesc.Same,
 * ValueDesc.Bool, ValueDesc.Int). For example, ValueDesc.Same.Singleton, ValueDesc.Bool.Singleton.
 *
 */
class Base {

  /**
   *
   */
  constructor( paramName, valueDesc ) {
    this.paramName = paramName;
    // (2021/04/09 Remarked) There is no longer need Symbol() key. Because the whole ParamDesc object is used as key.
    //this.paramNameKey = Symbol( paramName );
    this.valueDesc = valueDesc;
  }

  /**
   * @return {string}
   *   Return the value's string (or name if it has).
   */
  getStringOfValue( value ) {
    return this.valueDesc.getStringOf( value );
  }
}


/**
 * Describe some properties of a non-converting parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {ValueDesc.Same} valueDesc
 *   The range of the parameter's all possible values. It is an ValueDesc.Same object.
 *
 */
class Same extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.Same.Singleton );
  }
}


/**
 * Describe some properties of a boolean parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {ValueDesc.Bool} valueDesc
 *   The boolean range of the parameter's all possible values. It is an ValueDesc.Bool object.
 *
 */
class Bool extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.Bool.Singleton );
  }
}


/**
 * Describe some properties of an integer parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {ValueDesc.Int} valueDesc
 *   The integer range of the parameter's all possible values. It is an ValueDesc.Bool object.
 *
 */
class Int extends Base {

  constructor( paramName, valueIntegerMin, valueIntegerMax, valueNames = [], valueObjects = [] ) {
    super( paramName, new ValueDesc.Int( valueIntegerMin, valueIntegerMax, valueNames, valueObjects ) );
  }
}


/**
 * Describe some properties of an activation function parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {ValueDesc.ActivationFunction} valueDesc
 *   The range of the parameter's all possible values. It is an ValueDesc.ActivationFunction object.
 */
class ActivationFunction extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.ActivationFunction.Singleton );
  }
}


/**
 * Describe some properties of an depthwise operation parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {ValueDesc.AvgMax_Or_ChannelMultiplier} valueDesc
 *   The range of the parameter's all possible values. It is an ValueDesc.AvgMax_Or_ChannelMultiplier object.
 */
class AvgMax_Or_ChannelMultiplier extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton );
  }
}


/**
 * Describe some properties of an channelCount1_pointwise1Before parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {ValueDesc.channelCount1_pointwise1Before} valueDesc
 *   The range of the parameter's all possible values. It is an ValueDesc.channelCount1_pointwise1Before object.
 */
class channelCount1_pointwise1Before extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.channelCount1_pointwise1Before.Singleton );
  }
}


/**
 * Describe some properties of an pointwise22ChannelCount parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
 * @member {ValueDesc.pointwise22ChannelCount} valueDesc
 *   The range of the parameter's all possible values. It is an ValueDesc.pointwise22ChannelCount object.
 */
class pointwise22ChannelCount extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.pointwise22ChannelCount.Singleton );
  }
}
