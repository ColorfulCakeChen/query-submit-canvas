export { IssuedObjects };
export { All };

//import { Base } from "./Pool_Base.js";

/**
 * Collect all issued objects which can be recycled to a Pool.Base.
 *
 *
 *
 * @member {Object[]} inSessionArray
 *   If an issued object is belong to a session, it will be here.
 *
 * @member {Map} toInSessionArrayIndexMap
 *   Map every issued object to its array index in .inSessionArray[].
 *   - If an issued objects is belong to a session, this map's value is the
 *       array index to .inSessionArray[].
 *   - If an issued objects is not belong to any session, this map's value is a
 *       negative value (e.g. -1).
 *
 * @member {Pool.Base[]} registeredPoolArray
 *   Every instance of Pool.Base will automatically register itself in this
 * list. This list will never be cleared (i.e. a Pool.Base is never be
 * released).
 *
 * @member {Set} sessionKeptObjectSet
 *   Temporary object list for speeding up searching of whether kept (i.e. not
 * recycled) an object. Internally used by .session_pop().
 *
 * @member {Object[]} movingObjectArray
 *   Temporary object list for moving kept (i.e. not recycled) objects to the
 * parent session when a session is popping. Internally used by .session_pop().
 *
 * @member {number} issuedCount
 *   The total quantity of all issued objects.
 *
 * @member {boolean} isCurrentInSession
 *   Whether current is in session.
 *
 */
class IssuedObjects {

  /** */
  constructor() {
    this.inSessionArray = new Array();

    this.toInSessionArrayIndexMap = new Map();

    this.registeredPoolArray = new Array();

    // For reducing memory re-allocation when handling objects automatic
    // recycling between sessions.
    this.sessionKeptObjectSet = new Set();
    this.movingObjectArray = new Array();
  }

  get issuedCount() {
    return this.toInSessionArrayIndexMap.size;
  }

  get isCurrentInSession() {
    // Note: If current is in session, the .inSessionArray will have a
    //       SESSION_BORDER_MARK at least.
    if ( this.inSessionArray.length > 0 )
      return true;
    return false;
  }

  /**
   * Every object will be recorded in .toInSessionArrayIndexMap which is fast
   * for removing in the future.
   *
   * If current is in a session, the object will also be recorded in
   * .inSessionArray which could be visit in sequential when the session is
   * ended.
   *
   *
   * @param {IssuedObjects} this
   *   The container for managing issued objects.
   *
   * @param {Object} issuedObject
   *   The object which will be recorded as issued.
   *
   * @return {boolean}
   *   Always return true.
   */
  static issued_add( issuedObject ) {
    if ( this.isCurrentInSession ) {
      let arrayIndex = this.inSessionArray.length;
      this.inSessionArray.push( issuedObject );

      this.toInSessionArrayIndexMap.set( issuedObject, arrayIndex );

    } else {
      this.toInSessionArrayIndexMap.set( issuedObject, -1 );
    }
    return true;
  }

  /**
   * Removed from this issued object list. (Usually, for preparing to recycle
   * it.)
   *
   * - If the object is recorded in a session, the object in .inSessionArray[]
   *     will be modified to null. So that it will not be recycled (again)
   *     wrongly when the session is ended.
   *
   *     - Considering what will happen if it is re-issued again in the other
   *         session. If it is not marked as null, it might be recycled wrongly
   *         when this session is ended.
   *
   *
   * @param {IssuedObjects} this
   *   The container for managing issued objects.
   *
   * @param {Object} issuedObject
   *   The object which will be removed from this issued objects list.
   *
   * @return {boolean}
   *   Return true, if the object is found and removed. Return false, if the
   * object is not found.
   */
  static issued_remove( issuedObject ) {
    let arrayIndex = this.toInSessionArrayIndexMap.get( issuedObject );
    if ( arrayIndex == undefined ) {

      throw Error( `Pool.IssuedObjects.issued_remove(): `
        + `Try to remove an un-issued object ( ${issuedObject} ). `
        + `This may imply some problem `
        + `(e.g. recycle a resource multiple times).`
      );

      return false; // 1. Not a (recorded) issued object.
    }

    if ( arrayIndex >= 0 ) { // 2. The object is belong to a session.
      this.inSessionArray[ arrayIndex ] = null;

      this.toInSessionArrayIndexMap.delete( issuedObject );

    } else { // 3. The object is not belong to any session.
      this.toInSessionArrayIndexMap.delete( issuedObject );
    }

    return true;
  }

  /**
   * Create a session.
   *   - Call the pfn function.
   *   - End the session and recycle all issued objects (except the returned
   *       objects of the function).
   *
   *
   * @param {function} pfn
   *   A function to be called. It is viewed as a session. All objects the
   * function got by .get_or_create_by() will be recycled except the objects of
   * the function's returned value (an object or an object array).
   *
   * @param {Object} thisArg
   *   The value of this provided for the call to function pfn.
   *
   * @param {any} restArgs
   *   All other arguments will be passes into thisArg.pfn().
   *
   * @return {any}
   *   Return anything which the pfn() returned. If the returned value is an
   * object or an array of object, these objects (if they inside IssuedObjects)
   * will be kept (i.e. not be recycled) and become belonging to the parent
   * session.
   */
  sessionCall( pfn, thisArg, ...restArgs ) {
    IssuedObjects.session_push.call( this );
    let returnedValue;
    try {
      returnedValue = pfn.apply( thisArg, restArgs );
    } finally {
      IssuedObjects.session_pop.call( this, returnedValue );
    }
    return returnedValue;
  }

  /**
   * Start a auto-recycling session. This method will append a
   * SESSION_BORDER_MARK to in-session array.
   *
   * @param {IssuedObjects} this
   *   The list for handling the objects issuing/recycling.
   */
  static session_push() {
    this.inSessionArray.push( IssuedObjects.SESSION_BORDER_MARK );
  }

  /**
   * Collect objects which need to be kept (i.e. not recycled) into
   * .sessionKeptObjectSet
   *
   * @param {IssuedObjects} this
   *   The list for handling the objects issuing/recycling.
   *
   * @param {Object|Object[]} keptObjectOrArray
   *   An object or an object array. If the object(s) is not null, they will be
   * kept (i.e. not be recycled) and be moved to parent session.
   */
  static sessionKeptObjectSet_collect_from( keptObjectOrArray ) {
    this.sessionKeptObjectSet.clear();

    if ( !keptObjectOrArray )
      return;

    // Note:
    //
    // In theory, it is possible to collect all nested properties (and skip
    // objects which have already been searched for avoiding duplication)
    // recursively. In reality, however, this process has some problems:
    //
    //   - Many iterator objects might be generated for visiting container
    //       (e.g. Set, Map). Generating many objects violates this recycle
    //       pool system's principle (i.e. reducing memory re-allocation).
    //
    //   - Time consuming. For example, if a object property is just pure
    //       number Array (e.g. NumberImage.Base.dataArray), visiting its every
    //       element for finding recyclable object is unnecessary, meaningless
    //       and just wasting CPU time.
    //
    //   - And, even if ignoring these above problems, it is still has the
    //       problem which the nested children object may be disposed before
    //       their owner parent object. This will result in recycling the same
    //       object duplicately (i.e. Pool.Base.recycled_add() is called
    //       multiple times with the same object).
    //
    //
    // Suggestion: Perhaps, caller could use a Recyclabe.OwnerUniqueStack to
    //             collect and dispose recyclable objects by caller itself.
    //             That may be better than using Pool.All.sessionCall().
    //

    // 1.1 An array of objects to be kept.
    if ( keptObjectOrArray instanceof Array ) {
      for ( let i = 0; i < keptObjectOrArray.length; ++i ) {
        let keptObject = keptObjectOrArray[ i ];
        if ( keptObject ) {
          this.sessionKeptObjectSet.add( keptObject );
        }
      }

    // 1.2 A single object to be kept.
    } else if ( keptObjectOrArray instanceof Object ) {
      this.sessionKeptObjectSet.add( keptObjectOrArray );
    }
  }

  /**
   * End a auto-recycling session. This method will pop all objects from
   * IssuedObjects.array until encountering SESSION_BORDER_MARK.
   *
   *   - If the popped objects are not listed in keptObjectArray, they will be
   *       recycled.
   *
   *   - If the popped objects are listed in keptObjectArray, they will not be
   *       recycled and will become belonging to the parent session.
   *
   * @param {IssuedObjects} this
   *   The list for handling the objects issuing/recycling.
   *
   * @param {Object|Object[]} keptObjectOrArray
   *   An object or an object array. If the object(s) is not null, they will be
   * kept (i.e. not be recycled) and be moved to parent session.
   */
  static session_pop( keptObjectOrArray ) {
    const SESSION_BORDER_MARK = IssuedObjects.SESSION_BORDER_MARK;

    // 1. Prepare object list to be kept (i.e. not be recycled).
    IssuedObjects.sessionKeptObjectSet_collect_from.call( this );

    // 2. Recycle the last session's issued all objects (except objects should
    //    be kept).

    this.movingObjectArray.length = 0;

    while ( this.inSessionArray.length > 0 ) {

      // 2.1
      let issuedObject = this.inSessionArray.pop();

      {
        if ( issuedObject == null )
          // 2.1.1 The object has been recycled (before this session end).
          continue;

        if ( issuedObject == SESSION_BORDER_MARK )
          break; // 2.1.2 All objects of the last session have been popped.

        // 2.1.3 No longer an issued object.
        this.toInSessionArrayIndexMap.delete( issuedObject );
      }

      // 2.2 Found an object which should not be recycled.
      if ( this.sessionKeptObjectSet.has( issuedObject ) ) {
        // Collect it temporarily for moving it to parent session later.
        this.movingObjectArray.push( issuedObject );

      } else { // 2.3 Otherwise, recycle it.
        if ( issuedObject.disposeResources instanceof Function ) {
          // Dispose its resources before recycle it, if necessary.
          issuedObject.disposeResources();
        }

        // Q: Why not just call Pool.Base.recycle()?
        // A: Because the issued object list has already been processed in the
        //    aboved codes, it is not necessary to re-process again. Calling
        //    .recycled_add() will be more efficient than .recycle().
        //
        let recyclePool = issuedObject.constructor.Pool;
        recyclePool.constructor.recycled_add.call( recyclePool, issuedObject );
      }
    }

    // 3. Re-push the objects which should be kept to the parent session.
    while ( this.movingObjectArray.length > 0 ) {
      let movingObject = this.movingObjectArray.pop();

      // Moved (i.e. belonged) to parent session. Become an issued object (of
      // different session), again.
      IssuedObjects.issued_add.call( this, movingObject );
    }

    // 4. Reduce memory footprint.
    this.sessionKeptObjectSet.clear();
  }

}

/**
 * In the .inSessionArray and .inSessionRecyclePoolArray, this
 * SESSION_BORDER_MARK will be placed between sessions. In fact, it is just the
 * IssuedObjects class object itself. The reason is that it is impossible to be
 * an legal issued object of itself.
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
