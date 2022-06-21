export { Float32ArrayPool as Float32Array };

import { Root } from "./Pool_Base.js";

/**
 * Providing Array by specifying length.
 *
 */
class Float32ArrayPool extends Root {
  
  constructor() {
    super( Float32Array, Float32ArrayPool.setAsConstructor_by_length );
  }

  /**
   * @param {Array} this
   *   The array object to be set length.
   *
   * @param {number} newLength
   *   The this.length to be set to newLength.
   */
  static setAsConstructor_by_length( newLength ) {
    
//!!! ...unfinished... (2022/06/21) adjust ArrayBuffer.
    this.length = newLength;
  }

}
