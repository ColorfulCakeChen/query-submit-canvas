export { OwnerArray };

import * as Pool from "../Pool.js";
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
   * Every element of restArgs should be instance of ChannelPartInfo (even if restArgs has only one element).
   *
   * Note: This behavior is different from original Array which will views the argement is length (not element) if only one argument
   *       is given.
   */
  constructor( ...restArgs ) {
    super( restArgs.length );
    OwnerArray.setAsConstructor_self.call( this, restArgs );
  }

  /**
   * Every element of restArgs should be instance of ChannelPartInfo (even if restArgs has only one element).
   *
   * Note: This behavior is different from original Array which will views the argement is length (not element) if only one argument
   *       is given.
   *
   * @override
   */
  static setAsConstructor( ...restArgs ) {
    super.setAsConstructor( restArgs.length );
    OwnerArray.setAsConstructor_self.call( this, restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor( objectArray ) {
    for ( let i = 0; i < objectArray.length; ++i ) {
      this[ i ] = objectArray[ i ];
    }
  }

  /** @override */
  disposeResources() {
    
    // Release all contents since they are owned by this OwnerArray.
    for ( let i = 0; i < this.length; ++i ) {
      let object = this[ i ];
      if ( object instanceof Recyclable.Base ) {
        object.disposeResources_and_recycleToPool();
        this[ i ] = null; // So that it will not become dangling object (since it has already been recycled).
      }
    }

    super.disposeResources();
  }

}

