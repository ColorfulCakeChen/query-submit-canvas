export { IssuedObjects };
export { All };


//!!! ...unfinished... (2022/06/25)
// Whether possible Pool.All knows which Pool.Xxx this object should be recycled to?
// So there is not necessary override .disposeResources_and_recycleToPool() for every (sub) classes of pooled object.
//
// Solution: Use Recyclable as base class.


/**
 * Collect all issued objects which can be recycled to a Pool.Base.
 *
 *
 *
 * @member {Object[]} inSessionArray
 *   If an issued object is belong to a session, it will be here.
 *
 * @member {Pool.Base[]} inSessionRecyclePoolArray
 *   Every in-session issued objects' corresponding recycle pool.
 *
 * @member {Map} toInSessionArrayIndexMap
 *   Map every issued object to its array index in .inSessionArray[].
 *   - If an issued objects is belong to a session, this map's value is the array index to .inSessionArray[].
 *   - If an issued objects is not belong to any session, this map's value is a negative value (e.g. -1).
 *
 * @member {Pool.Base[]} registeredPoolArray
 *   Every instance of Pool.Base will automatically register itself in this list. This list will never be cleared (i.e. a Pool.Base
 * is never be released).
 *
 * @member {Set} sessionKeptObjectSet
 *   Temporary object list for speeding up searching of whether kept (i.e. not recycled) an object. Internally used by .session_pop().
 *
 * @member {Object[]} movingObjectArray
 *   Temporary object list for moving kept (i.e. not recycled) objects to the parent session when a session is popping. Internally
 * used by .session_pop().
 *
 * @member {Pool.Base[]} movingObjectRecyclePoolArray
 *   Temporary pool list for moving kept (i.e. not recycled) objects to the parent session when a session is popping. Internally
 * used by .session_pop().
 *
 * @member {number} issuedCount
 *   The total quantity of all issued objects.
 *
 * @member {boolean} isCurrentInSession
 *   Whether current is in session.
 *
 */
class IssuedObjects {

  constructor() {

    // Q: Why not integrate .inSession and .inSessionRecyclePool into one extra object?
    // A: In order to reduce memory allocation (for the extra object). Because memory allocation reducing is the main purpose
    //    of this recycling pool.
    //

    this.inSessionArray = new Array();
    this.inSessionRecyclePoolArray = new Array();
    this.toInSessionArrayIndexMap = new Map();

    this.registeredPoolArray = new Array();

    // For reducing memory re-allocation when handling objects automatic recycling between sessions.
    this.sessionKeptObjectSet = new Set();
    this.movingObjectArray = new Array();
    this.movingObjectRecyclePoolArray = new Array();
  }

  get issuedCount() {
    return this.toInSessionArrayIndexMap.size;
  }

  get isCurrentInSession() {
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
   *
   * @param {IssuedObjects} this
   *   The container for managing issued objects.
   *
   * @param {Object} issuedObject
   *   The object which will be recorded as issued.
   *
   * @param {Object} recyclePool
   *   This recycle pool will be used when the issued object is recycled automatically. This will be recorded only if current is in
   * session.
   *
   * @return {boolean} Always return true.
   */
  static issuedObject_add( issuedObject, recyclePool ) {
    if ( this.isCurrentInSession ) {
      let arrayIndex = this.inSessionArray.length;
      this.inSessionArray.push( issuedObject );
      this.inSessionRecyclePoolArray.push( recyclePool );
      this.toInSessionArrayIndexMap.set( issuedObject, arrayIndex );

    } else {
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
   *
   * @param {IssuedObjects} this
   *   The container for managing issued objects.
   *
   * @param {Object} issuedObject
   *   The object which will be removed from this issued objects list.
   *
   * @return {boolean}
   *   Return true, if the object is found and removed. Return false, if the object is not found.
   */
  static issuedObject_remove( issuedObject ) {
    let arrayIndex = this.toInSessionArrayIndexMap.get( issuedObject );
    if ( arrayIndex == undefined )
      return false; // 1. Not a (recorded) issued object.

    if ( arrayIndex >= 0 ) { // 2. The object is belong to a session.
      this.inSessionArray[ arrayIndex ] = null;
      this.inSessionRecyclePoolArray[ arrayIndex ] = null;
      this.toInSessionArrayIndexMap.delete( issuedObject );

    } else { // 3. The object is not belong to any session.
      this.toInSessionArrayIndexMap.delete( issuedObject );
    }

    return true;
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
   * inside IssuedObjects) will be kept (i.e. not be recycled) and become belonging to the parent session.
   */
  sessionCall( pfn ) {
    Session.session_push.call( this );
    let returnedValue;
    try {
      returnedValue = pfn();
    } finally {
      Session.session_pop.call( this, returnedValue );
    }
    return returnedValue;
  }

  /**
   * Start a auto-recycling session. This method will append a SESSION_BORDER_MARK to in-session array.
   *
   * @param {IssuedObjects} this
   *   The list for handling the objects issuing/recycling.
   */
  static session_push() {
    this.inSessionArray.push( IssuedObjects.SESSION_BORDER_MARK );
    this.inSessionRecyclePoolArray.push( IssuedObjects.SESSION_BORDER_MARK );
  }

  /**
   * End a auto-recycling session. This method will pop all objects from IssuedObjects.array until encountering SESSION_BORDER_MARK.
   *
   *   - If the popped objects are not listed in keptObjectArray, they will be recycled.
   *
   *   - If the popped objects are listed in keptObjectArray, they will not be recycled and will become belonging to the parent
   *       session.
   *
   * @param {IssuedObjects} this
   *   The list for handling the objects issuing/recycling.
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
                throw Error( `Pool.IssuedObjects.session_pop(): `
                  + `The object to be kept (i.e. not to be recycled) ( ${keptObject} ) `
                  + `should not already be recycled (i.e. should not be inside .recycledObjects).`
                );

              this.sessionKeptObjectSet.add( keptObject );
            }
          }
        } else if ( keptObjectOrArray instanceof Object ) { // 1.2 A single object to be kept.
          
          if ( this.recycledObjects.has( keptObjectOrArray ) )
            throw Error( `Pool.IssuedObjects.session_pop(): `
              + `The object to be kept (i.e. not to be recycled) ( ${keptObjectOrArray} ) `
              + `should not already be recycled (i.e. should not be inside .recycledObjects).`
            );

          this.sessionKeptObjectSet.add( keptObjectOrArray );
        }
      }
    }

    // 2. Recycle the last session's issued all objects (except objects should be kept).

    this.movingObjectArray.length = 0;
    this.movingObjectRecyclePoolArray.length = 0;

    while ( this.inSessionArray.length > 0 ) {

      // 2.1
      let issuedObject = this.inSessionArray.pop();
      let recyclePool = this.inSessionRecyclePoolArray.pop();
      {
        if ( issuedObject == null )
          continue; // 2.1.1 The object has been recycled (before this session end).

        if ( issuedObject == SESSION_BORDER_MARK )
          break; // 2.1.2 All objects of the last session have been popped.

        this.toInSessionArrayIndexMap.delete( issuedObject ); // 2.1.3 No longer an issued object.
      }

      if ( this.sessionKeptObjectSet.has( issuedObject ) ) { // 2.2 Found an object which should not be recycled.
        this.movingObjectArray.push( issuedObject ); // Collect it temporarily for moving it to parent session later.
        this.movingObjectRecyclePoolArray.push( recyclePool );

      } else { // 2.3 Otherwise, recycle it.
        if ( issuedObject.disposeResources instanceof Function ) {
          issuedObject.disposeResources(); // Dispose its resources before recycle it.
        }
        recyclePool.recycle( issuedObject );
      }
    }

    // 3. Re-push the objects which should be kept to the parent session.
    while ( this.movingObjectArray.length > 0 ) {
      let movingObject = this.movingObjectArray.pop();
      let recyclePool = this.movingObjectRecyclePoolArray.pop();
      this.add( movingObject, recyclePool ); // Moved (i.e. belonged) to parent session. Become an issued object again.
    }

    // 4. Reduce memory footprint.
    this.sessionKeptObjectSet.clear();
  }

}

/**
 * In the .inSessionArray and .inSessionRecyclePoolArray, this SESSION_BORDER_MARK will be placed between sessions. In fact, it
 * is just the IssuedObjects class object itself. The reason is that it is impossible to be an legal issued object of itself.
 */
IssuedObjects.SESSION_BORDER_MARK = IssuedObjects;

/**
 * The only one (global) list of all issued (recyclable) objects.
 */
IssuedObjects.Singleton = new IssuedObjects();

/**
 * An alias to the only one (global) list of all issued (recyclable) objects.
 */
let All = IssuedObjects.Singleton;
