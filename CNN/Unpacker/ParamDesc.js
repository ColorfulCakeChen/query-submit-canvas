export { Base, Same, Bool };

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
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
 *
 * @member {ValueDesc.Same} valueDesc
 *   The range of the parameter's all possible values. It is an ValueDesc.Same object.
 *
 */
class Same extends Base {

  /**
   *
   */
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
 * @member {Symbol} paramNameKey
 *   The unique key of the parameter. It is defined as Symbol(paramName).
 *
 * @member {ValueDesc.Bool} valueDesc
 *   The boolean range of the parameter's all possible values. It is an ValueDesc.Bool object.
 *
 */
class Bool extends Base {

  /**
   *
   */
  constructor( paramName ) {
    super( paramName, ValueDesc.Bool.Singleton );
  }
}

