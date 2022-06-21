export { Base, Root };

/**
 * A pool for recycling (re-using) objects.
 *
 * It could be used to improve performance by reducing memory re-allocation.
 *
 */
let Base = ( ParentClass = Object ) => class PadInfoCalculator extends ParentClass {
  
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

    this.objectArray = new Array(); // For fetching efficientlys.
    this.objectSet = new Set(); // For checking object recycled multiple times.
  }

  /**
   * @return {number}
   *   Return the quantity of recycled objects.
   */
  get size() {
    return this.objectSet.size;
  }

  /**
   *
   * @return {object}
   *   An obeject which is an instance of this.ObjectClass. If it is newly created, all RestArgs will be passed into its constructor.
   * If it is re-used (i.e. from recycled) object, all RestArgs will be passed into its .pfnSetAsConstructor() method.
   */
  get_or_create_by( ...restArgs ) {
    let returnedObject;
    if ( this.objectArray.length > 0 ) {
      returnedObject = this.objectArray.pop();
      this.objectSet.delete( returnedObject ); // Removed from set.
      this.pfnSetAsConstructor.apply( returnedObject, restArgs );
    } else {
      returnedObject = new ( this.objectClass )( ...restArgs );
    }
    return returnedObject;
  }

  /**
   * @param {Object} objectToBeRecycled
   *   The object (which should be an instance of this.ObjectClass) to be recycled.
   *
   * @return {boolean}
   *   Return true, if the object is recycled. Return false, if the object has already been recycled.
   */
  recycle( objectToBeRecycled ) {
    if ( !this.objectSet.has( objectToBeRecycled ) ) { // Avoiding duplicately.
      this.objectSet.add( objectToBeRecycled );
      this.objectArray.push( objectToBeRecycled );
      return true;
    }
    return false;
  }

  /**
   * Discard all recycled objects.
   */
  clear() {
    this.objectArray.length = 0;
    this.objectSet.clear();
  }

  /**
   * @return {iterator)
   *   Return an iterator object that contains all recycled objects.
   */
  * values() {
    yield* this.objectArray.values();
  }

}


/**
 * Almost the same as Base class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of ObjectPool.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base() {
}

