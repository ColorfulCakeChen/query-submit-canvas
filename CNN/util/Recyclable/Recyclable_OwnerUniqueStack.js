export { OwnerUniqueStack };

import * as Pool from "../Pool.js";
import { Base } from "./Recyclable_Base.js";
import { OwnerArray } from "./Recyclable_OwnerArray.js";

/**
 * Similar to Recyclable_Array but it only has push(), pop(), clear() operations. The .push() will prevent the same object be append
 * multiple times
 *
 * It is better than pure Set object because you could traverse .array without generating iterator object.
 *
 *
 * Note: The behavior of this class's constructor (and .setAsConstructor()) is different from original Array (and Recyclable.Array).
 *
 *   - Original Array (and Recyclable.Array):
 *
 *     - If there is only one argument, it is viewed as the length of the newly created array.
 *
 *   - This Recyclable.OwnerArray and Recyclable.OwnerUniqueStack:
 *
 *     - Even if there is only one argument, all arguments always are viewed as the contents the newly created array.
 *         The reason is for convenient and for avoiding un-initialized element object.
 *
 */
class OwnerUniqueStack extends Recyclable.Root {

  /**
   * Used as default Recyclable.OwnerUniqueStack provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "Recyclable.OwnerUniqueStack.Pool", OwnerUniqueStack, OwnerUniqueStack.setAsConstructor );

  /**
   * Every element of restArgs should be instance of Recyclable.Base (even if restArgs has only one element).
   *
   * Note: This behavior is different from original Array which will views the argement is length (not element) if only one argument
   *       is given.
   */
  constructor( ...restArgs ) {
    super();
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
    super.setAsConstructor();
    OwnerArray.setAsConstructor_self.call( this, restArgs );
    return this;
  }

  /** @override */
  static setAsConstructor_self( objectArray ) {
    this.array = OwnerArray.Pool.get_or_create_by();

    if ( this.set ) {
      this.set.clear(); // Re-use the Set object for reducing memory re-allocation.
    } else {
      this.set = new Set();
    }

//!!!
    for ( let i = 0; i < objectArray.length; ++i ) {
      this[ i ] = objectArray[ i ];
    }
  }

  /**
   * @param {Recyclable.Base} object
   *   A recyclable object to be appended into this container. If the object has already existed, it will not be append again.
   * It could be null or undefined (and the null and undefined will be appended if it has never been appended before).
   *
   * @return {boolean}
   *   Return true, if the object is appended. Return false, if the object has already existed (so does not be appended again).
   */
  push( object ) {
    if ( this.set.has( object ) )
      return false;

    this.array.push( object );
    this.set.add( object );
  }

  /** @override */
  disposeResources() {

    if ( this.set ) {
      this.set.clear();
      // Do not release the Set object for reducing memory re-allocation.
    }

    if ( this.array ) {
      this.array.disposeResources_and_recycleToPool();
      this.array = null;
    }

    super.disposeResources();
  }

}

