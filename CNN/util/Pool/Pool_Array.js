export { ArrayPool as Array };

import { Root } from "./Pool_Base.js";

/**
 * Providing Array by specifying length.
 *
 */
class ArrayPool extends Root {
  
  constructor() {
    super( Array, ArrayPool.setAsConstructor_by_length );
  }

  /**
   * @param {Array} this
   *   The array object to be set length.
   *
   * @param {number} newLength
   *   The this.length to be set to newLength.
   */
  static setAsConstructor_by_length( newLength ) {
    this.length = newLength;
  }

}
