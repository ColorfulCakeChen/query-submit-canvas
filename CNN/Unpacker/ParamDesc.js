export { Base, Same, Bool, Int };
export { ActivationFunction };
export { channelCount1_pointwise1Before };
export { AvgMax_Or_ChannelMultiplier };
export { StridesPad };
export { ConvBlockType };

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
 * @member {ValueDesc.Same} valueDesc
 *   The range of the parameter's all possible values. It is a ValueDesc.Same object.
 */
class Same extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.Same.Singleton );
  }
}


/**
 * Describe some properties of a boolean parameter.
 *
 * @member {ValueDesc.Bool} valueDesc
 *   The boolean range of the parameter's all possible values. It is a ValueDesc.Bool object.
 */
class Bool extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.Bool.Singleton );
  }
}


/**
 * Describe some properties of an integer parameter.
 *
 * @member {ValueDesc.Int} valueDesc
 *   The integer range of the parameter's all possible values. It is a ValueDesc.Bool object.
 */
class Int extends Base {

  constructor( paramName, valueIntegerMin, valueIntegerMax, valueNames = [], valueObjects = [] ) {
    super( paramName, new ValueDesc.Int( valueIntegerMin, valueIntegerMax, valueNames, valueObjects ) );
  }
}


/**
 * Describe some properties of an activation function parameter.
 *
 * @member {ValueDesc.ActivationFunction} valueDesc
 *   The range of the parameter's all possible values. It is a ValueDesc.ActivationFunction object.
 */
class ActivationFunction extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.ActivationFunction.Singleton );
  }
}


/**
 * Describe some properties of an channelCount1_pointwise1Before parameter.
 *
 * @member {ValueDesc.channelCount1_pointwise1Before} valueDesc
 *   The range of the parameter's all possible values. It is a ValueDesc.channelCount1_pointwise1Before object.
 */
class channelCount1_pointwise1Before extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.channelCount1_pointwise1Before.Singleton );
  }
}


/**
 * Describe some properties of an depthwise operation parameter.
 *
 * @member {ValueDesc.AvgMax_Or_ChannelMultiplier} valueDesc
 *   The range of the parameter's all possible values. It is a ValueDesc.AvgMax_Or_ChannelMultiplier object.
 */
class AvgMax_Or_ChannelMultiplier extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.AvgMax_Or_ChannelMultiplier.Singleton );
  }
}


/**
 * Describe some properties of an strides and pad parameter.
 *
 * @member {ValueDesc.StridesPad} valueDesc
 *   The range of the parameter's all possible values. It is a ValueDesc.StridesPad object.
 */
class StridesPad extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.StridesPad.Singleton );
  }
}


/**
 * Describe some properties of an ConvBlockType parameter.
 *
 * @member {ValueDesc.ConvBlockType} valueDesc
 *   The range of the parameter's all possible values. It is a ValueDesc.ConvBlockType object.
 */
class ConvBlockType extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.ConvBlockType.Singleton );
  }
}
