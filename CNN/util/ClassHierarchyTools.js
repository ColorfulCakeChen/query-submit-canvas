export { MostDerived_Prototype };
export { MostDerived_ClassName };
export { SecondMostDerived_Prototype };
export { SecondMostDerived_Class };
export { SecondMostDerived_ClassName };

/**
 * @param {Object} x
 *   The object to be queried.
 *
 * @return {Object}
 *   Return the prototype of the most derived prototype of the object x.
 */
function MostDerived_Prototype( x ) {
  return x.constructor.prototype; // The same as Reflect.getPrototypeOf( x )
}

/**
 * @param {Object} x
 *   The object to be queried.
 *
 * @return {Function}
 *   Return the class (i.e. constructor function) of the most derived
 * class which the object x belongs to.
 */
function MostDerived_Class( x ) {
  return x.constructor;
}

/**
 * @param {Object} x
 *   The object to be queried.
 *
 * @return {string}
 *   Return the class name of the most derived class which the object x
 * belongs to.
 */
function MostDerived_ClassName( x ) {
  return x.constructor.name;
}

/**
 * @param {Object} x
 *   The object to be queried.
 *
 * @return {Object}
 *   Return the prototype of the 2nd most derived prototype which the object
 * x belongs to.
 */
function SecondMostDerived_Prototype( x ) {
  return Reflect.getPrototypeOf( x.constructor ).prototype;
}

/**
 * @param {Object} x
 *   The object to be queried.
 *
 * @return {Function}
 *   Return the class (i.e. constructor function) of the 2nd most derived
 * class which the object x belongs to.
 */
function SecondMostDerived_Class( x ) {
  return SecondMostDerived_Prototype( x ).constructor;
}

/**
 * @param {Object} x
 *   The object to be queried.
 *
 * @return {string}
 *   Return the class (i.e. constructor function) name of the 2nd most
 * derived class which the object x belongs to.
 */
function SecondMostDerived_ClassName( x ) {
  return SecondMostDerived_Class( x ).name;
}
