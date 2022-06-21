export { Base };

/**
 * A pool for recycling (re-using) objects.
 *
 * It could be used to improve performance by reducing memory re-allocation.
 *
 */
class Base {
  
  /**
   * @param {Class} objectClass
   *   The class for all newly created objects.
   *
   * @param {function} pfnSetAsConstructor
   *   A function works as its constructor. Before .get_or_create_by() returns a recycled object, its .pfnSetAsConstructor() method
   * will be called to re-initilaize it.
   */
  constructor( objectClass, pfnSetAsConstructor ) {
    this.objectClass = objectClass;
    this.pfnSetAsConstructor = pfnSetAsConstructor;

    this.recycledObjects = new Set(); // Using set for handling object be recycled multiple times.
  }

  /**
   *
   * @return {object}
   *   An obeject which is an instance of this.ObjectClass. If it is newly created, all RestArgs will be passed into its constructor.
   * If it is re-used (i.e. from recycled) object, all RestArgs will be passed into its .pfnSetAsConstructor() method.
   */
  get_or_create_by( ...restArgs ) {
    let returnedObject;
    if ( this.recycledObjects.size > 0 ) {
      let values = this.recycledObjects.values();
      returnedObject = values.next().value; // Get the first object.
      this.pfnSetAsConstructor.apply( returnedObject, RestArgs );
    } else {
      returnedObject = new ( this.objectClass )( ...restArgs );
    }
    return returnedObject;
  }

  /**
   * @param {Object} 
   *   The object (which should be an instance of this.ObjectClass) to be recycled.
   */
  recycle( objectToBeRecycled ) {
    this.recycledObjects.add( objectToBeRecycled );
  }

}
