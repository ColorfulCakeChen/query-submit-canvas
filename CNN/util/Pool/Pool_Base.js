export { Base, Root };

/**
 * A pool for recycling (re-using) objects.
 *
 * It could be used to improve performance by reducing memory re-allocation.
 *
 * @member {object[]} issuedObjectArray
 *   All object returned by .get_or_create_by() will be recorded in this array.
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

    this.issuedObjectArray = new Array();
    this.sessionKeptObjectSet = new Set(); // For reducing memory re-allocation.

//!!! ...unfinished... (2022/06/21)
// should be a MultiLayerMap whose leaf node is an Array object.
// All objects with the same specification will be recycled into the same Array.
// This is more useful for Float32Array because of reducing more memory re-allocation.
//

    this.recycledObjectArray = new Array(); // For fetching efficiently (without creating iterator).
    this.recycledObjectSet = new Set(); // For checking object recycled multiple times.
  }

  /**
   * @return {number}
   *   Return the quantity of recycled objects.
   */
  get size() {
    return this.recycledObjectSet.size;
  }

  /**
   *
   * @return {object}
   *   An obeject which is an instance of this.ObjectClass. If it is newly created, all RestArgs will be passed into its constructor.
   * If it is re-used (i.e. from recycled) object, all RestArgs will be passed into its .pfnSetAsConstructor() method.
   */
  get_or_create_by( ...restArgs ) {
    let returnedObject;
    if ( this.recycledObjectArray.length > 0 ) {
      let candicatedObject = this.recycledObjectArray.pop();
      this.recycledObjectSet.delete( candicatedObject ); // Removed from set.
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
    if ( !this.recycledObjectSet.has( objectToBeRecycled ) ) { // Avoiding duplicately.
      this.recycledObjectSet.add( objectToBeRecycled );
      this.recycledObjectArray.push( objectToBeRecycled );
      return true;
    }
    return false;
  }

  /**
   * Discard all recycled objects.
   */
  clear() {
    this.recycledObjectArray.length = 0;
    this.recycledObjectSet.clear();
  }

  /**
   * @return {iterator)
   *   Return an iterator object that contains all recycled objects.
   */
  * values() {
    yield* this.recycledObjectArray.values();
  }

  /**
   * Start a auto-recycle session. This method will append a SESSION_BORDER_MARK to .issuedObjectArray
   */
  session_push() {
    const SESSION_BORDER_MARK = this; // Use an object which is not possible be listed in the array as an session-border-mark.
    this.issuedObjectArray.push( SESSION_BORDER_MARK );
  }

  /**
   * End a auto-recycle session. This method will pop all objects from .issuedObjectArrayappend until encountering SESSION_BORDER_MARK.
   *
   *   - If the popped objects are not listed in keptObjectArray, they will be recycled.
   *
   *   - If the popped objects are listed in keptObjectArray, they will not be recycled and will become belonging to the parent
   *       session.
   *
   * @param {object[]} keptObjectArray
   *   The objects which will not be recycled.
   */
  session_pop( keptObjectArray ) {
    if ( this.issuedObjectArray.length <= 0 )
      return;

    const SESSION_BORDER_MARK = this; // Use an object which is not possible be listed in the array as an session-border-mark.

    // Prepare object list to be kept (i.e. not be recycled).
    {
      this.sessionKeptObjectSet.clear();
      if ( keptObjectArray )
      for ( let i = 0; i < keptObjectArray.length; ++i ) {
        let keptObject = keptObjectArray[ i ];
        if ( keptObject )
          this.sessionKeptObjectSet.add( keptObject );
      }
    }

    for ( let i = ( this.issuedObjectArray.length - 1 ); i >= 0; --i ) {
    }
  }

}


/**
 * Almost the same as Pool.Base class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of Pool.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base() {
}

