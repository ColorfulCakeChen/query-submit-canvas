export { IssuedObjects };


//!!! ...unfinished... (2022/06/25)
// Whether possible Pool.All knows which Pool.Xxx this object should be recycled to?
// So there is not necessary override .disposeResources_and_recycleToPool() for every (sub) classes of pooled object.
//
// Solution: Use Recyclable as base class.

//!!! ...unfinished... (2022/06/25)
// A global IssuedObjects seems enough. Multiple RecycledObjects for different recycle pool are necessary.



/**
 * Collect all issued objects of Pool.Base.
 *
 *

//!!! (2022/06/25 Remarked) seems not needed because .toInSessionArrayIndexMap seems enough.
//  * @member {Set} notInSessionSet
//  *   If an issued object is not belong to any session, it will be here.

 *
 * @member {Object[]} inSessionArray
 *   If an issued object is belong to a session, it will be here.
 *

//!!! ...unfinished... (2022/06/25)

 * @member {Pool.Base[]} inSessionRecyclePoolArray
 *   Every in-session issued objects' corresponding recycle pool.
 *

 * @member {Map} toInSessionArrayIndexMap
 *   Map every issued object to its array index in .inSessionArray[].
 *   - If an issued objects is belong to a session, this map's value is the array index to .inSessionArray[].
 *   - If an issued objects is not belong to any session, this map's value is a negative value (e.g. -1).
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

//!!! (2022/06/25 Remarked) seems not needed because .toInSessionArrayIndexMap seems enough.
//    this.notInSessionSet = new Set();

    this.inSessionArray = new Array();
    this.toInSessionArrayIndexMap = new Map();
  }

  get issuedCount() {
    return this.toInSessionArrayIndexMap.size;
  }

  get isInSession() {
    // Note: If current is in session, the .inSessionArray will have a SESSION_BORDER_MARK at least.
    if ( this.inSessionArray.length > 0 )
      return true;
    return false;
  }

  /**
   * Every object will be recorded in .toInSessionArrayIndexMap which is fast for removing in the future.
   *
   * If current is in a session, the object will also be recorded in .inSessionArray which could be visit in sequential when the
   * session is ended.
   *
   * @return {boolean} Always return true.
   */
  add( issuedObject ) {
    if ( this.isInSession ) {
      let arrayIndex = this.inSessionArray.length;
      this.inSessionArray.push( issuedObject );
      this.toInSessionArrayIndexMap.set( issuedObject, arrayIndex );
    } else {

//!!! (2022/06/25 Remarked) seems not needed because .toInSessionArrayIndexMap seems enough.
//      this.notInSessionSet.add( issuedObject );

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

//!!! (2022/06/25 Remarked) seems not needed because .toInSessionArrayIndexMap seems enough.
//   * - If the object is not recorded in a session (i.e. in .notInSessionSet), it will be remove from .notInSessionSet directly.

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

//!!! (2022/06/25 Remarked) seems not needed because .toInSessionArrayIndexMap seems enough.
//      this.notInSessionSet.delete( object );

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

              if ( this.recycledObjects.has( keptObject ) )
                throw Error( `Pool.Base.session_pop(): `
                  + `The object to be kept (i.e. not to be recycled) ( ${keptObject} ) `
                  + `should not already be recycled (i.e. should not be inside .recycledObjects).`
                );

              this.sessionKeptObjectSet.add( keptObject );
            }
          }
        } else if ( keptObjectOrArray instanceof Object ) { // 1.2 A single object to be kept.
          
          if ( this.recycledObjects.has( keptObjectOrArray ) )
            throw Error( `Pool.Base.session_pop(): `
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
 * In the .InSessionArray, this SESSION_BORDER_MARK will be placed between sessions. In fact, it is just the IssuedObjects class object
 * itself. The reason is that it is impossible to be an legal issued object of itself.
 */
IssuedObjects.SESSION_BORDER_MARK = IssuedObjects;


IssuedObjects.sessionKeptObjectSet = new Set(); // For reducing memory re-allocation.
IssuedObjects.movingObjectArray = new Array(); // For reducing memory re-allocation.
