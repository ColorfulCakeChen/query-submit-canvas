export { All, Base, Root };


//!!! ...unfinished... (2022/06/25)
// Whether possible Pool.All knows which Pool.Xxx this object should be recycled to?
// So there is not necessary override .disposeResources_and_recycleToPool() for every (sub) classes of pooled object.
//
// Solution: Use Recyclable as base class.

//!!! ...unfinished... (2022/06/25)
// A global IssuedObjects seems enough. Multiple RecycledObjects for different recycle pool are necessary.


/**
 * Every instance of Pool.Base will automatically register itself in this list.
 *
 * This list will never be cleared.
 */
let All = [];



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

      throw Error(
        `Pool.RecycledObjects.add(): `
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

    if ( !( objectToBeRecycled instanceof this.objectClass ) )
      throw Error( `Pool.Base.recycle(): `
        + `The object to be recycled ( ${objectToBeRecycled} ) `
        + `should be an instance of class ( ${this.objectClass} ).`
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


}


/**
 * Almost the same as Pool.Base class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of Pool.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base() {
}

