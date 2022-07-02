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

    this.push.apply( this, objectArray );
  }

  get length() {
    return this.array.length;
  }

  /**
   * Append objects to the end of the array. If an object has been added before, the object will not be appended again.
   *
   * @param {Recyclable.Base[]} restArgs
   *   The recyclable objects to be appended into this container. If an object has already existed, it will not be append again.
   * Object could be null or undefined (and the null and undefined will be appended if it has never been added before).
   *
   * @return {number}
   *   Return the this.length.
   */
  push( ...restArgs ) {
    for ( let i = 0; i < restArgs.length; ++i ) {
      let object = restArgs[ i ];
      if ( this.set.has( object ) )
        continue;
      this.array.push( object );
      this.set.add( object );
    }
    return this.array.length;
  }

  /**
   * @return {Object}
   *   Return undefined, if there is no element. Otherwise, return the last obejct of the array.
   */
  pop() {
    if ( this.array.length <= 0 )
      return undefined;
    let object = this.array.pop();
    this.set.delete( object );
    return object;
  }

  /**
   * Release all contents.
   */
  clear() {
    this.array.disposeResources(); // Note: Just .disposeResources(). Do not .recycleToPool().
    this.set.clear();
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

