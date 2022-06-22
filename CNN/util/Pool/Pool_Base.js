export { Base, Root };

/**
 * A pool for recycling (re-using) objects.
 *
 * It could be used to improve performance by reducing memory re-allocation.
 *
 *
 * @member {object[]} issuedObjectArray
 *   All objects returned by .get_or_create_by() will be recorded in this array.
 *
 * @member {Set} sessionKeptObjectSet
 *   Temporary object list for speeding up searching of whether kept (i.e. not recycled) an object.
 *
 * @member {object[]} movingObjectArray
 *   Temporary object list for moving kept (i.e. not recycled) objects to the parent session.
 *
 * @member {object[]} recycledObjectArray
 *   All objects passed into .recycle() will be recorded in this array.
 *
 * @member {Set} recycledObjectSet
 *   Same content as .recycledObjectArray for avoiding recycle object duplicately.
 *
 */
let Base = ( ParentClass = Object ) => class Base extends ParentClass {

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
    this.movingObjectArray = new Array(); // For reducing memory re-allocation.

//!!! ...unfinished... (2022/06/21)
// should be a MultiLayerMap whose leaf node is an Array object.
// All objects with the same specification will be recycled into the same Array.
// This is more useful for Float32Array because of reducing more memory re-allocation.
//

    this.recycledObjectArray = new Array(); // For fetching efficiently (without creating iterator).
    this.recycledObjectSet = new Set(); // For checking object recycled multiple times.
  }

  /**
   * @return {number} Return the quantity of issued objects.
   */
  get issuedCount() {
    return this.issuedObjectArray.length;
  }

  /**
   * @return {number} Return the quantity of recycled objects.
   */
  get recycledCount() {
    return this.recycledObjectSet.length;
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
   * Discard all recycled objects. (Note: The issued objects list are not influenced.)
   */
  recycledClear() {
    this.recycledObjectArray.length = 0;
    this.recycledObjectSet.clear();
  }

  /**
   * @return {iterator)
   *   Return an iterator object that contains all recycled objects.
   */
  * recycledValues() {
    yield* this.recycledObjectArray.values();
  }

  /**
   * Start a auto-recycle session. This method will append a SESSION_BORDER_MARK to .issuedObjectArray
   *
   * @param {Base} this
   *   The pool for handling the objects issuing/recycling.
   */
  static session_push() {
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
   * @param {Base} this
   *   The pool for handling the objects issuing/recycling.
   *
   * @param {object|object[]} keptObjectOrArray
   *   An object or an object array. If the object(s) is not null, they will be kept (i.e. not be recycled) and be moved to parent session.
   */
  static session_pop( keptObjectOrArray ) {
    const SESSION_BORDER_MARK = this; // Use an object which is not possible be listed in the array as an session-border-mark.

    // 1. Prepare object list to be kept (i.e. not be recycled).
    {
      this.sessionKeptObjectSet.clear();
      if ( keptObjectOrArray ) {
        if ( keptObjectOrArray instanceof Array ) { // 1.1 An array of objects.
          for ( let i = 0; i < keptObjectOrArray.length; ++i ) {
            let keptObject = keptObjectOrArray[ i ];
            if ( keptObject )
              this.sessionKeptObjectSet.add( keptObject );
          }
        } else if ( keptObjectOrArray instanceof Object ) { // 1.2 An single object.
          this.sessionKeptObjectSet.add( keptObjectOrArray );
        }
      }
    }

    // 2. Recycle the last session's issued all objects (except objects should be kept).
    this.movingObjectArray.length = 0;
    while ( this.issuedObjectArray.length > 0 ) {
      let issuedObject = this.issuedObjectArray.pop();
      if ( issuedObject == SESSION_BORDER_MARK )
        break; // All objects of the last session have been popped.

      if ( this.sessionKeptObjectSet.has( issuedObject ) ) { // Found an object which should not be recycled.
        this.movingObjectArray.push( issuedObject ); // Collect it temporarily for moving it to parent session later.
      } else {
        this.recycle( issuedObject ); // Otherwise, recycle it.
      }
    }

    // 3. Re-push the objects which should be kept to the parent session.
    while ( this.movingObjectArray.length > 0 ) {
      let movingObject = this.movingObjectArray.pop();
      this.issuedObjectArray.push( movingObject ); // Moved (i.e. belonged) to parent session.
    }

    // 4. Reduce memory footprint.
    this.sessionKeptObjectSet.clear();
  }

  /**
   * Create a session. Call th function. End the session and recycle all issued objects (except the returned objects of the function).
   *
   *
   * @param {function} pfn
   *   A function to be called. It is viewed as a session. All objects the function got by .get_or_create_by() will be recycled
   * except the objects of the function's returned value (an object or an object array).
   *
   * @return {any}
   *   Return anything which the pfn() returned. If the returned value is an object or an array of object, these objects (if they
   * inside .issuedObjectArray) will be kept (i.e. not be recycled) and become belonging to the parent session.
   */
  sessionCall( pfn ) {
    Base.session_push.call( this );
    let returnedValue;
    try {
      returnedValue = pfn();
    } finally {
      Base.session_pop.call( this, returnedValue );
    }
  }

}


/**
 * Almost the same as Pool.Base class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of Pool.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base() {
}

