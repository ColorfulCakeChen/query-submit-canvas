export { OwnerArray };

import * as Pool from "../Pool.js";
import { Base } from "./Recyclable_Base.js";
import { Array as Recyclable_Array } from "./Recyclable_Array.js";

/**
 * Similar to Recyclable_Array but it owns its contents (which are instances of Recyclable.Base). It will release its contents
 * (by calling their .disposeResources_and_recycleToPool()) in .disposeResources().
 *
 *
 * Note: The behavior of this class's constructor (and .setAsConstructor()) is different from original Array (and Recyclable.Array).
 *
 *   - Original Array (and Recyclable.Array):
 *
 *     - If there is only one argument, it is viewed as the length of the newly created array.
 *
 *   - This Recyclable.OwnerArray:
 *
 *     - Even if there is only one argument, all arguments always are viewed as the contents the newly created array.
 *         The reason is for convenient and for avoiding un-initialized element object.
 *
 *
 */
class OwnerArray extends Recyclable_Array {

  /**
   * Used as default Recyclable.OwnerArray provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Recyclable.OwnerArray.Pool", OwnerArray, OwnerArray.setAsConstructor );

  /**
   * Every element of restArgs should be instance of Recyclable.Base (even if restArgs has only one element).
   *
   * Note: This behavior is different from original Array which will views the argement is length (not element) if only one argument
   *       is given.
   */
  constructor( ...restArgs ) {
    super( restArgs.length );
    OwnerArray.setAsConstructor_self.call( this, restArgs );
  }

  /**
   * Every element of restArgs should be Recyclable.Base object (even if restArgs has only one element).
   *
   * Note: This behavior is different from original Array which will views the argement is length (not element)
   *       if only one argument is given.
   *
   * @override
   */
  static setAsConstructor( ...restArgs ) {
    super.setAsConstructor( restArgs.length );
    OwnerArray.setAsConstructor_self.call( this, restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( objectArray ) {
    for ( let i = 0; i < objectArray.length; ++i ) {
      this[ i ] = objectArray[ i ];
    }
  }

  /** @override */
  disposeResources() {
    // Release all contents because they are owned by this OwnerArray.
    OwnerArray.sub_objects_disposeResources_fromIndex.call( this, 0 );
    super.disposeResources();
  }

  //!!! (2022/07/21 Remarked) Not work. It seems Array.length can not be overrided.
  // /**
  //  * All contents after this[ newLength ] will also be released (by calling their .disposeResources_and_recycleToPool()).
  //  */
  // set length( newLength ) {
  //   OwnerArray.sub_objects_disposeResources_fromIndex.call( this, newLength );
  //   super.length = newLength;
  // }

  /**
   * Release all contents (by calling their .disposeResources_and_recycleToPool() and set this container's length to zero).
   *
   * Note: Set OwnerArray.length = 0 directly will cause memory leak because the contents are not released.
   */
  clear() {
    OwnerArray.sub_objects_disposeResources_fromIndex.call( this, 0 );
    this.length = 0;
  }

  /**
   * Call all contents' .disposeResources(). Set them to null. But does NOT change this container's length.
   *
   * Note: Contents are disposed in reverse order because they are usually created in forward order.
   *
   * @param {number} fromIndex
   *   Dispose all owned objects between this[ fromIndex ] to this [ this.length - 1 ].
   */
  static sub_objects_disposeResources_fromIndex( fromIndex = 0 ) {
    for ( let i = ( this.length - 1 ); i >= fromIndex; --i ) {
      let object = this[ i ];
      if ( !object )
        continue;

      // Note: ( object instanceof Base ) does not work here because Recyclable.Base is not a class definition (in fact, it
      //       is a function return a class definition). So check whether .disposeResources_and_recycleToPool() exists instead.
      //
      if ( object.disposeResources_and_recycleToPool instanceof Function ) {
        object.disposeResources_and_recycleToPool();
        this[ i ] = null; // So that it will not become dangling object (since it has already been recycled).
      }
    }
  }

}

