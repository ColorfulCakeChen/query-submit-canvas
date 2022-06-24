export { Float32ArrayPool as Float32Array };

import { Root } from "./Pool_Base.js";

/**
 * Providing Float32Array by specifying length.
 *
 * It will try to re-use Float32Array or its underlying ArrayBuffer as possible.
 *
 *
 * Note:
 *
 * This pool's performance may NOT be good enough. Because Float32Array's property can not be adjusted, it is almost necessary
 * to be re-created. This violates the basic principle (i.e. reducing memory re-allocation) of pool.
 *
 * Using MultiLayerMap might be better for Float32Array because all Float32Array with the same specification could be re-used
 * directly without re-creating.
 *
 *
 */
class Float32ArrayPool extends Root {
  
  constructor() {
    super( "Pool.Float32Array", Float32Array, Float32ArrayPool.setAsConstructor_by_length );
  }

  /**
   * @param {Array} this
   *   The array object to be set length.
   *
   * @param {number} newLength
   *   The this.length to be set to newLength.
   *
   * @return {Float32Array}
   *   Return a Float32Array object.
   *   - If this.length is the same as required, it will be returned directly.
   *   - Otherwise, if this.buffer is large enough, it will be used to create (and return) a new Float32Array object.
   *   - Otherise, a new ArrayBuffer will be created to create (and return) a new Float32Array object.
   */
  static setAsConstructor_by_length( newLength ) {

    // 1.
    if ( this.length == newLength )
      return this;

    // 2.
    let arrayBuffer;
    {
      let newByteLength = newLength * Float32Array.BYTES_PER_ELEMENT;
      if ( this.buffer.byteLength >= newByteLength )
        arrayBuffer = this.buffer;
      else
        arrayBuffer = new ArrayBuffer( newByteLength ); // Create new buffer when old buffer is not large enough.
    }

    // 3.
    let newFloat32Array = new Float32Array( arrayBuffer, 0, newLength );
    return newFloat32Array;
  }

}


/**
 * Used as default Float32Array provider.
 */
Float32ArrayPool.Singleton = new Float32ArrayPool();
