export { ArrayPool as Array };

import { Root } from "./Pool_Base.js";

/**
 *
 */
class ArrayPool extends Root {
  
  constructor() {
    super( Array, ArrayPool.setAsConstructor_by_length );
  }

  /**
   * @param {Array} this
   *   
   *
   * @param {number} length
   *
   */
  static setAsConstructor_by_length( length ) {
    }
}
