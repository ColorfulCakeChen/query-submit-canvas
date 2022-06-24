export { All, Base, Root };

/**
 * Every instance of Pool.Base will automatically register itself in this list.
 *
 * This list will never be cleared.
 */
let All = [];


/**
 * Collect all issued objects of Pool.Base.
 *
 *
 * @member {Set} notInSessionSet
 *   If an issued object is not belong to any session, it will be here.
 *
 * @member {Array} inSessionArray
 *   If an issued object is belong to a session, it will be here.
 *
 * @member {Map} toInSessionArrayIndexMap
 *   Map every issued object to its array index in .inSessionArray[].
 *   - If an issued objects is belong to a session, this map's value is the array index to .inSessionArray[].
 *   - If an issued objects is not belong to any session, this map's value is a negative value (e.g. -1) meaning it is inside .notInSessionSet.
 *
 * @member {number} issuedCount
 *   The total quantity of all issued objects.
 *
 * @member {boolean} isInSession()
 *   Whether current is in session.
 *
 */
class IssuedObjects {

  constructor() {
    this.notInSessionSet = new Set();
    this.inSessionArray = new Array();
    this.toInSessionArrayIndexMap = new Map();
  }

  get issuedCount() {
    //return ( this.notInSessionSet.size + this.inSessionArray.length );
    return this.toInSessionArrayIndexMap.size;
  }

  get isInSession() {
    // Note: If current is in session, the .inSessionArray will have a SESSION_BORDER_MARK at least.
    if ( this.inSessionArray.length > 0 )
      return true;
    return false;
  }

  /**
   * If current is in a session, the object will be recorded in .inSessionArray which could be visit in sequential when the session is ended.
   * Otherwise, it will be recorded in .notInSessionSet which is fast for removing in the future.
   *
   * @return {boolean} Always return true.
   */
  add( issuedObject ) {
    if ( this.isInSession ) {
      let arrayIndex = this.inSessionArray.length;
      this.inSessionArray.push( issuedObject );
      this.toInSessionArrayIndexMap.set( issuedObject, arrayIndex );
    } else {
      this.notInSessionSet.add( issuedObject );
      this.toInSessionArrayIndexMap.set( issuedObject, -1 );
    }
    return true;
  }

  /**
   * Removed from this issued object list. (Usually, for preparing to recycle it.)
   *
   * - If the object is recorded in a session, the object in .inSessionArray[] will be modified to null. So that it will not be recycled
   *     (again) wrongly when the session is ended.
   *
   *     - Considering what will happen if it is re-issued again in the other session. If it is not marked as null, it might be recycled
   *         wrongly when this session is ended.
   *
   * - If the object is not recorded in a session (i.e. in .notInSessionSet), it will be remove from .notInSessionSet directly.
   *
   *
   * @return {boolean}
   *   If the object is found and removed, return true. If the object is not found, return false.
   */
  remove( object ) {
    let arrayIndex = this.toInSessionArrayIndexMap.get( object );
    if ( arrayIndex == undefined )
      return false; // 1. Not a (recorded) issued object.

    if ( arrayIndex >= 0 ) { // 2. The object is belong to a session.
      this.inSessionArray[ arrayIndex ] = null;
      this.toInSessionArrayIndexMap.delete( object );

    } else { // 3. The object is not belong to any session.
      this.notInSessionSet.delete( object );
      this.toInSessionArrayIndexMap.delete( object );
    }
    return true;
  }

  /**
   *
   * @return {Object}
   *   Pop the last issued object in session, return it.
   *   - It may be null.
   *   - It may be IssuedObjects.SESSION_BORDER_MARK.
   *
   */
  inSessionArray_pop() {
    let returnedObject = this.inSessionArray.pop();

    if (   ( returnedObject != null )
        && ( returnedObject != IssuedObjects.SESSION_BORDER_MARK )
       ) {
      this.remove( returnedObject );
    }

    return returnedObject;
  }

  /**
   * Append a SESSION_BORDER_MARK to .array
   */
  append_session_border_mark() {
    this.inSessionArray.push( IssuedObjects.SESSION_BORDER_MARK );
  }

}

/**
 * In the .InSessionArray, this SESSION_BORDER_MARK will be placed between sessions. In fact, it is just the IssuedObjects class object
 * itself. The reason is that it is impossible to be an legal issued object of itself.
 */
IssuedObjects.SESSION_BORDER_MARK = IssuedObjects;


/**
 * Collect all recycled (i.e. could be re-issued) objects of Pool.Base.
 *
 *
 * @member {Array} array
 *   For fetching object efficiently (without creating iterator).
 *
 * @member {Set} set
 *   The same content as .array for checking object whether is recycled multiple times.
 *
 * @member {number} recycledCount
 *   The quantity of recycled objects.
 *
 */
class RecycledObjects {

  constructor() {
    this.array = new Array();
    this.set = new Set();
  }

  get recycledCount() {
    return this.array.length;
  }

  /**
   *
   * @param {Object} objectToBeRecycled
   *   The object to be recorded as recycled.
   *
   * @return {boolean}
   *   - Return true, if the object is recycled.
   *   - Return false, if the object has already been a recycled object.
   */
  add( objectToBeRecycled ) {
    if ( this.set.has( objectToBeRecycled ) ) { // Avoid recycling one object multiple times (i.e. duplicately).

      tf.util.assert( false,
        `Pool.RecycledObjects.add() `
          + `An object ( ${objectToBeRecycled} ) is recycled multiple times. `
          + `This may imply some problem (e.g. resource not transferred properly).`
      );

      return false;

    } else { // Record it as recycled.
      this.set.add( objectToBeRecycled );
      this.array.push( objectToBeRecycled );
      return true;
    }
  }

  /**
   *
   * @return {Object}
   *   Pop the last object and return it. It may be null, if there is no object in this recycle bin.
   */
  pop() {
    let object = this.array.pop();
    if ( object == undefined )
      return null;
    this.set.delete( object ); // Removed from set.
    return object;
  }

  /**
   * Dicard all objects in this recycle bin.
   */
  removeAll() {
    this.array.length = 0;
    this.set.clear();
  }

  /**
   * @return {boolean} Return true, if the object is recorded in this recycle bin.
   */
  has( object ) {
    return this.set.has( object );
  }

}


/**
 * A pool for recycling (re-using) objects.
 *
 * It could be used to improve performance by reducing memory re-allocation.
 *
 *
 * @member {string} poolName
 *   The string name of this pool.
 *
 * @member {Class} objectClass
 *   The class for all newly created objects. If the instance of this objectClass has a method .disposeResources(), it will be called
 * when .sessionCall()'s ending (i.e. in .session_pop()) to release more resources.
 *
 * @member {function} pfn_SetAsConstructor_ReturnObject
 *   A function set contents like its constructor and return an object. Before .get_or_create_by() returns a recycled object,
 * its .pfnSetAsConstructor() method will be called to re-initilaize it. Its return value will be the final returned object.
 *
 * @member {IssuedObjects} issuedObjects
 *   All objects returned by .get_or_create_by() will be recorded here.
 *
 * @member {RecycledObjects} recycledObjects
 *   All objects passed into .recycle() will be recorded here.
 *
 * @member {Set} sessionKeptObjectSet
 *   Temporary object list for speeding up searching of whether kept (i.e. not recycled) an object.
 *
 * @member {object[]} movingObjectArray
 *   Temporary object list for moving kept (i.e. not recycled) objects to the parent session when a session is popped.
 *
 * @member {number} issuedCount
 *   The total quantity of all issued objects.
 *
 * @member {number} recycledCount
 *   The quantity of recycled objects.
 *
 */
let Base = ( ParentClass = Object ) => class Base extends ParentClass {

  /**
   * This constructor will register this object to Pool.All[] list. And it will never be removed from the list.
   *
   */
  constructor( poolName, objectClass, pfn_SetAsConstructor_ReturnObject, ...restArgs ) {
    super( ...restArgs );

    this.poolName = poolName;
    this.objectClass = objectClass;
    this.pfn_SetAsConstructor_ReturnObject = pfn_SetAsConstructor_ReturnObject;

    this.issuedObjects = new IssuedObjects()
    this.recycledObjects = new RecycledObjects();

    this.sessionKeptObjectSet = new Set(); // For reducing memory re-allocation.
    this.movingObjectArray = new Array(); // For reducing memory re-allocation.

    All.push( this );
  }

  get issuedCount() {
    return this.issuedObjects.issuedCount;
  }

  get recycledCount() {
    return this.recycledObjects.recycledCount;
  }

  /**
   *
   * @return {object}
   *   An obeject which is an instance of this.ObjectClass. If it is newly created, all RestArgs will be passed into its constructor.
   * If it is re-used (i.e. from recycled) object, all RestArgs will be passed into its .pfnSetAsConstructor() method.
   */
  get_or_create_by( ...restArgs ) {
    let returnedObject;

    // 1.

    // 1.1 Get recycled object.
    //
    // Note: candicatedObject and returnedObject may not be the same one object. It is possible the pfn_SetAsConstructor_ReturnObject()
    //       returns a different object.
    //
    let candicatedObject = this.recycledObjects.pop();
    if ( candicatedObject != null ) {
      returnedObject = this.pfn_SetAsConstructor_ReturnObject.apply( candicatedObject, restArgs );

    // 1.2 Create new object.
    } else {
      returnedObject = new ( this.objectClass )( ...restArgs );
    }

    // 2. Tracking the issued object for recycling automatically by session_pop().
    this.issuedObjects.add( returnedObject );

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

    if ( objectToBeRecycled == null )
      return false; // 1. Can not recycle a null object.

    tf.util.assert( ( objectToBeRecycled instanceof this.objectClass ),
      `Pool.Base.recycle() `
        + `The object to be recycled ( ${objectToBeRecycled} ) `
        + `should not an instance of class ( ${this.objectClass} ).`
    );

    // 2. If the object is issued by this pool, it should be removed from issued object list. Otheriwse, the list will become larger
    //    and larger.
    this.issuedObjects.remove( objectToBeRecycled );

    // 3. Recycle it.
    let bRecycleOk = this.recycledObjects.add( objectToBeRecycled );
    return bRecycleOk;
  }

  /**
   * Discard all recycled objects. (Note: The issued objects list are not influenced.)
   */
  recycledClear() {
    this.recycledObjects.removeAll();
  }

//!!! (2022/06/23 Remarked) seems not used.
//   /**
//    * @return {iterator)
//    *   Return an iterator object that contains all recycled objects.
//    */
//   * recycledValues() {
//     yield* this.recycledObjects.array.values();
//   }

  /**
   * Start a auto-recycling session. This method will append a SESSION_BORDER_MARK to .issuedObjects.array
   *
   * @param {Base} this
   *   The pool for handling the objects issuing/recycling.
   */
  static session_push() {
    this.issuedObjects.append_session_border_mark();
  }

  /**
   * End a auto-recycling session. This method will pop all objects from .issuedObjects.array until encountering SESSION_BORDER_MARK.
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
    const SESSION_BORDER_MARK = IssuedObjects.SESSION_BORDER_MARK;

    // 1. Prepare object list to be kept (i.e. not be recycled).
    {
      this.sessionKeptObjectSet.clear();
      if ( keptObjectOrArray ) {
        if ( keptObjectOrArray instanceof Array ) { // 1.1 An array of objects to be kept.
          for ( let i = 0; i < keptObjectOrArray.length; ++i ) {
            let keptObject = keptObjectOrArray[ i ];
            if ( keptObject ) {

              tf.util.assert( ( !this.recycledObjects.has( keptObject ) ),
                `Pool.Base.session_pop() `
                  + `The object to be kept (i.e. not to be recycled) ( ${keptObject} ) `
                  + `should not already be recycled (i.e. should not be inside .recycledObjects).`
              );

              this.sessionKeptObjectSet.add( keptObject );
            }
          }
        } else if ( keptObjectOrArray instanceof Object ) { // 1.2 A single object to be kept.
          
          tf.util.assert( ( !this.recycledObjects.has( keptObjectOrArray ) ),
            `Pool.Base.session_pop() `
              + `The object to be kept (i.e. not to be recycled) ( ${keptObjectOrArray} ) `
              + `should not already be recycled (i.e. should not be inside .recycledObjects).`
          );

          this.sessionKeptObjectSet.add( keptObjectOrArray );
        }
      }
    }

    // 2. Recycle the last session's issued all objects (except objects should be kept).
    this.movingObjectArray.length = 0;
    while ( this.issuedObjects.inSessionArray.length > 0 ) {
      let issuedObject = this.issuedObjects.inSessionArray_pop();
      if ( issuedObject == null )
        continue; // 2.1 The object has been recycled (before this session end).

      if ( issuedObject == SESSION_BORDER_MARK )
        break; // 2.2 All objects of the last session have been popped.

      if ( this.sessionKeptObjectSet.has( issuedObject ) ) { // 2.3 Found an object which should not be recycled.
        this.movingObjectArray.push( issuedObject ); // Collect it temporarily for moving it to parent session later.

      } else { // 2.4 Otherwise, recycle it.
        if ( issuedObject.disposeResources instanceof Function ) {
          issuedObject.disposeResources(); // Dispose its resources before recycle it.
        }
        this.recycle( issuedObject );
      }
    }

    // 3. Re-push the objects which should be kept to the parent session.
    while ( this.movingObjectArray.length > 0 ) {
      let movingObject = this.movingObjectArray.pop();
      this.issuedObjects.add( movingObject ); // Moved (i.e. belonged) to parent session.
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
   * inside .issuedObjects) will be kept (i.e. not be recycled) and become belonging to the parent session.
   */
  sessionCall( pfn ) {
    Base.session_push.call( this );
    let returnedValue;
    try {
      returnedValue = pfn();
    } finally {
      Base.session_pop.call( this, returnedValue );
    }
    return returnedValue;
  }

}


/**
 * Almost the same as Pool.Base class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of Pool.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base() {
}

