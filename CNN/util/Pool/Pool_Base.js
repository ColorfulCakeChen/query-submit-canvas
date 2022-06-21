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
   * @param {function} pfn_SetAsConstructor_ReturnObject
   *   A function set contents like its constructor and return an object. Before .get_or_create_by() returns a recycled object,
   * its .pfnSetAsConstructor() method will be called to re-initilaize it. Its return value will be the final returned object.
   */
  constructor( objectClass, pfn_SetAsConstructor_ReturnObject ) {
    this.objectClass = objectClass;
    this.pfn_SetAsConstructor_ReturnObject = pfn_SetAsConstructor_ReturnObject;

//!!! ...unfinished... (2022/06/21)
// should be a MultiLayerMap whose leaf node is an Array object.
// All objects with the same specification will be recycled into the same Array.
// This is more useful for Float32Array.
//

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
      let candicatedObject = this.objectArray.pop();
      this.objectSet.delete( candicatedObject ); // Removed from set.
      returnedObject =this.pfn_SetAsConstructor_ReturnObject.apply( candicatedObject, restArgs );
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
 * Almost the same as Pool.Base class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of Pool.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base() {
}

