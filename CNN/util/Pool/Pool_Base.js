export { Base, Root };

import { IssuedObjects } from "./Pool_IssuedObjects.js"

/**
 * A pool for recycling (re-using) objects. It collects all recycled (i.e. could be re-issued) objects of Pool.Base.
 * This could improve performance by reducing memory re-allocation.
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
 * @member {Object} recycledObjectArray
 *   For fetching object efficiently (without creating iterator).
 *
 * @member {Set} recycledObjectSet
 *   The same content as .recycledObjectArray for checking object whether is recycled multiple times.
 *
 * @member {number} recycledCount
 *   The quantity of recycled objects.
 *
 */
let Base = ( ParentClass = Object ) => class Base extends ParentClass {

  /**
   * This constructor will register this object to Pool.All.registeredPoolArray list. And it will never be removed from the list.
   *
   */
  constructor( poolName, objectClass, pfn_SetAsConstructor_ReturnObject, ...restArgs ) {
    super( ...restArgs );

    this.poolName = poolName;
    this.objectClass = objectClass;
    this.pfn_SetAsConstructor_ReturnObject = pfn_SetAsConstructor_ReturnObject;

    this.recycledObjectArray = new Array();
    this.recycledObjectSet = new Set();

    IssuedObjects.Singleton.registeredPoolArray.push( this ); // Register to the only one global All pool list.
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
    let candicatedObject = this.recycledObjectArray.pop();
    if ( candicatedObject != null ) {
      returnedObject = this.pfn_SetAsConstructor_ReturnObject.apply( candicatedObject, restArgs );

    // 1.2 Create new object.
    } else {
      returnedObject = new ( this.objectClass )( ...restArgs );
    }

    // 2. Tracking the issued object for recycling automatically by session_pop().
    IssuedObjects.issued_add.call( IssuedObjects.Singleton, returnedObject, this );

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

    // 1. Recycle it.
    let bRecycleOk = Base.recycled_add.call( this, objectToBeRecycled );

    // 2. Removed it from issued object list. Otheriwse, the list will become larger and larger.
    if ( bRecycleOk )
      IssuedObjects.issued_remove.call( IssuedObjects.Singleton, objectToBeRecycled );

    return bRecycleOk;
  }

  get recycledCount() {
    return this.recycledObjectArray.length;
  }

  /**
   * @param {Base}
   *   The Pool.Base object for handling the recycled bojects.
   *
   * @return {boolean} Return true, if the object is recorded in this recycle bin.
   */
  recycled_has( object ) {
    return this.recycledObjectSet.has( object );
  }

  /**
   * Discard all recycled objects (in this Pool.Base). (Note: The issued objects list are not influenced.)
   *
   * @param {Base}
   *   The Pool.Base object for handling the recycled bojects.
   */
  recycled_removeAll() {
    this.recycledObjectArray.length = 0;
    this.recycledObjectSet.clear();
  }


//!!! (2022/06/23 Remarked) seems not used.
//   /**
//    * @return {iterator)
//    *   Return an iterator object that contains all recycled objects.
//    */
//   * recycledValues() {
//     yield* this.recycledObjectArray.values();
//   }

  /**
   *
   * @param {Base}
   *   The Pool.Base object for handling the recycled bojects.
   *
   * @param {Object} objectToBeRecycled
   *   The object to be recorded as recycled.
   *
   * @return {boolean}
   *   - Return true, if the object is recycled.
   *   - Return false, if the object is null, or has already been a recycled object.
   *
   * @throws {Error}
   *   If the object has already been a recycled object.
   * 
   * @throws {Error}
   *   If the object is not an instance of this.objectClass.
   * 
   */
  static recycled_add( objectToBeRecycled ) {
    if ( objectToBeRecycled == null )
      return false; // 1. Can not recycle a null object.

    if ( this.recycledObjectSet.has( objectToBeRecycled ) ) { // 2. Avoid recycling one object multiple times (i.e. duplicately).

      throw Error(
        `Pool.Base.recycled_add(): `
          + `An object ( ${objectToBeRecycled} ) is recycled multiple times. `
          + `This may imply some problem (e.g. resource not transferred properly).`
        );

      return false;
    }

    // 3. Only recycle objects of specific class.
    if ( !( objectToBeRecycled instanceof this.objectClass ) )
      throw Error( `Pool.Base.recycled_add(): `
        + `The object to be recycled ( ${objectToBeRecycled} ) `
        + `should be an instance of class ( ${this.objectClass} ).`
      );

    // 4. Record it as recycled.
    this.recycledObjectSet.add( objectToBeRecycled );
    this.recycledObjectArray.push( objectToBeRecycled );
    return true;
  }

  /**
   *
   * @param {Base}
   *   The Pool.Base object for handling the recycled bojects.
   *
   * @return {Object}
   *   Pop the last object and return it. It may be null, if there is no object in this recycle bin.
   */
  static recycled_pop() {
    let object = this.recycledObjectArray.pop();
    if ( object == undefined )
      return null;
    this.recycledObjectSet.delete( object ); // Removed from set.
    return object;
  }

}


/**
 * Almost the same as Pool.Base class except its parent class is fixed to Object. In other words, caller can not
 * specify the parent class of Pool.Root (so it is named "Root" which can not have parent class).
 */
class Root extends Base() {
}

