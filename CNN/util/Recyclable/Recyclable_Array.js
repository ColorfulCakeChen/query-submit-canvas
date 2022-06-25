export { Recyclable_Array as Array };
export { Recyclable_ArrayPool as ArrayPool };

import { Base } from "./Recyclable_Base.js";
import * as Pool from "../Pool.js";

/**
 * Almost the same as class Array but combined with Recyclable.Base interface.
 */
class Recyclable_Array extends Base( Array ) {

  /**
   * @param {Array} this
   *   The array object to be set length.
   *
   * @param {number} newLength
   *   The this.length to be set to newLength.
   *
   * @return {Array}
   *   Return the this object.
   */
  static setAsConstructor_by_length( newLength ) {
    this.length = newLength;
    return this;
  }

}


/**
 * Providing Recyclable.Array by specifying length.
 *
 */
class Recyclable_ArrayPool extends Pool.Root {
  
  constructor() {
    super( "Recyclable.ArrayPool", Recyclable_Array, Recyclable_Array.setAsConstructor_by_length );
  }

}

/**
 * Used as default Recyclable_Array provider.
 */
Recyclable_ArrayPool.Singleton = new Recyclable_ArrayPool();


/**
 * An alias to Recyclable.ArrayPool.Singleton for conforming to Recyclable interface.
 */
Recyclable_Array.Pool = Recyclable_ArrayPool.Singleton

