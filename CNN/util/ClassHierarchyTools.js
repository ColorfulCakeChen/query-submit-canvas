export { ParentPrototype_of_Class };
export { ParentClass_of_Class };

export { MostDerived_Prototype };
export { MostDerived_ClassName };
export { SecondMostDerived_Prototype };
export { SecondMostDerived_Class };
export { SecondMostDerived_ClassName };


/**
 * @param {Function} aClass
 *   The constructor function (e.g. anObject.constructor) to be queried.
 *
 * @return {Object}
 *   Return the prototype of the parent class which the aClass inherits from.
 */
function ParentPrototype_of_Class( aClass ) {
  return Reflect.getPrototypeOf( aClass ).prototype;
}

/**
 * @param {Function} aClass
 *   The constructor function (e.g. anObject.constructor) to be queried.
 *
 * @return {Function}
 *   Return the parent class (i.e. constructor function) which the aClass
 * inherits from.
 */
function ParentClass_of_Class( aClass ) {
  return ParentPrototype_of_Class( aClass ).constructor;
}


/**
 * @param {Object} anObject
 *   The object to be queried.
 *
 * @return {Object}
 *   Return the prototype of the most derived prototype of the object
 * instance anObject.
 */
function MostDerived_Prototype_of_Instance( anObject ) {
  // The same as Reflect.getPrototypeOf( anObject )
  return anObject.constructor.prototype;
}

/**
 * @param {Object} anObject
 *   The object to be queried.
 *
 * @return {Function}
 *   Return the class (i.e. constructor function) of the most derived
 * class which the object instance anObject belongs to.
 */
function MostDerived_Class_of_Instance( anObject ) {
  return anObject.constructor;
}

/**
 * @param {Object} anObject
 *   The object to be queried.
 *
 * @return {string}
 *   Return the class name of the most derived class which the object instance
 * anObject belongs to.
 */
function MostDerived_ClassName_of_Instance( anObject ) {
  return anObject.constructor.name;
}


/**
 * @param {Object} anObject
 *   The object to be queried.
 *
 * @return {Object}
 *   Return the prototype of the 2nd most derived prototype which the object
 * instance anObject belongs to.
 */
function SecondMostDerived_Prototype_of_Instance( anObject ) {
  return ParentPrototype_of_Class( anObject.constructor );
}

/**
 * @param {Object} anObject
 *   The object to be queried.
 *
 * @return {Function}
 *   Return the class (i.e. constructor function) of the 2nd most derived
 * class which the object instance anObject belongs to.
 */
function SecondMostDerived_Class_of_Instance( anObject ) {
  return SecondMostDerived_Prototype_of_Instance( anObject ).constructor;
}

/**
 * @param {Object} anObject
 *   The object to be queried.
 *
 * @return {string}
 *   Return the class (i.e. constructor function) name of the 2nd most
 * derived class which the object instance anObject belongs to.
 */
function SecondMostDerived_ClassName_of_Instance( anObject ) {
  return SecondMostDerived_Class( anObject ).name;
}
