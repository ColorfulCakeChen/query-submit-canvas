export { Base, Same, Bool, Int };

import * as ValueDesc from "./ValueDesc.js";


/**
 * Describe some properties of a parameter.
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
//!!! ...unfinished... (2021/03/15) Perhaps, there is no longer need Symbol() key. Because the whole ParamDesc object is used as key.
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
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
    this.paramNameKey = Symbol( paramName );
    this.valueDesc = valueDesc;
  }
}


/**
 * Describe some properties of a non-converting parameter.
 *
 * @member {string} paramName
 *   The name of the parameter. It is a string. It should be a legal identifer too (i.e. A-Z, a-z, 0-9 (not at first character), and "_").
 *
//!!! ...unfinished... (2021/03/15) Perhaps, there is no longer need Symbol() key. Because the whole ParamDesc object is used as key.
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
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
//!!! ...unfinished... (2021/03/15) Perhaps, there is no longer need Symbol() key. Because the whole ParamDesc object is used as key.
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
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
//!!! ...unfinished... (2021/03/15) Perhaps, there is no longer need Symbol() key. Because the whole ParamDesc object is used as key.
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
 *
 * @member {ValueDesc.Int} valueDesc
 *   The boolean range of the parameter's all possible values. It is an ValueDesc.Bool object.
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
//!!! ...unfinished... (2021/03/15) Perhaps, there is no longer need Symbol() key. Because the whole ParamDesc object is used as key.
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
 *
 * @member {ValueDesc.ActivationFunction} valueDesc
 *   The boolean range of the parameter's all possible values. It is an ValueDesc.ActivationFunction object.
 *
 */
class ActivationFunction extends Base {

  constructor( paramName ) {
    super( paramName, ValueDesc.ActivationFunction.Singleton );
  }
}
