export { Base };

import * as Pool from "../../util/Pool.js";
import * as Recyclable from "../../util/Recyclable.js";

//!!! (2022/06/30 deprecated)
// Because Float32Array always needs to be re-created, this is time and space consuming.

/**
 *
 */
class Base extends Recyclable.Root {

  /**
   * Used as default NameNumberArrayObject_To_Float32Array.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NameNumberArrayObject_To_Float32Array.Base.Pool", Base, Base.setAsConstructor );

  /**
   */
  constructor() {
    super();
    Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
  }

  /** @override */
  disposeResources() {

    // Note: It seems that both .underlyingArrayBuffer and .weightsFloat32Array are re-usable. Do not dispose them.

    super.disposeResources();
  }

  /**
   * @param {number} byteLength
   *   The underlyingArrayBuffer will be large enough to contain so many bytes.
   */
  ensureArrayBuffer_byByte( byteLength ) {
    if ( ( !this.underlyingArrayBuffer ) || ( this.underlyingArrayBuffer.byteLength < byteLength ) ) {
      this.underlyingArrayBuffer = new ArrayBuffer( byteLength );

    // Otherwise, this.underlyingArrayBuffer already has the enough space. Use it directly.
    }
  }

  /**
   * @param {number} elementCount
   *   The underlyingArrayBuffer will be large enough to contain so many (Float32) elements.
   */
  ensureArrayBuffer_byFloat32( elementCount ) {
    this.ensureArrayBuffer_byByte( elementCount * Float32Array.BYTES_PER_ELEMENT );
  }

  /**
   * @param {number} elementCount
   *   Prepare this.weightsFloat32Array[] (which uses the underlyingArrayBuffer) so that its length equals elementCount.
   */
  prepare_weightsFloat32Array( elementCount ) {
    if ( ( !this.weightsFloat32Array ) || ( this.weightsFloat32Array.length != elementCount ) ) {
      this.ensureArrayBuffer_byFloat32( elementCount );
      this.weightsFloat32Array = new Float32Array( this.underlyingArrayBuffer, 0, elementCount );

    // Otherwise, this.weightsFloat32Array already has the required length. Use it directly.
    }
  }

  /**
   * Concatenate multiple number arrays into one Float32Array (this.weightsFloat32Array) in a specified order.
   *
   * It fills two data members of this object { weightsFloat32Array, weightsByteOffsetBegin }.
   *   - this.weightsFloat32Array: A Float32Array which is the concatenated result of the numberArrayArray.
   *   - this.weightsByteOffsetBegin: A random offset byte count inside weightsFloat32Array.
   *
   * Note: A re-usable ArrayBuffer will be used as the underlying ArrayBuffer of the this.weightsFloat32Array.
   *       The this.weightsFloat32Array itself may also be re-used. So caller should not modify it.
   *
   *
   * @param {string[]} nameOrderArray
   *   An array of string. Every element is a string name of a parameter. The number array in nameNumberArrayObject will be concatenated
   * according to the element order of this nameOrderArray[].
   *
   * @param {object} nameNumberArrayObject
   *   An object whose all properties are number or number array. It is a map from a string name to a number or number array. The names
   * should be found in nameOrderArray[].
   *
   * @param {number} weightsElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsFloat32Array.
   *
   * @returned {number} weightsElementOffsetBegin
   */
  set_byConcat( nameOrderArray, nameNumberArrayObject, weightsElementOffsetBegin = 0 ) {

    this.weightsByteOffsetBegin = weightsElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT; // Skip the un-used byte count.

    // Calculate the total length include the extra offset.
    let weightsTotalLength = weightsElementOffsetBegin;
    for ( let i = 0; i < nameOrderArray.length; ++i ) {
      let name = nameOrderArray[ i ];
      let number_or_numberArray = nameNumberArrayObject[ name ];
      if ( number_or_numberArray != undefined ) {
        if ( number_or_numberArray instanceof Array ) {
          weightsTotalLength += number_or_numberArray.length; // Assume number array.
        } else {
          weightsTotalLength += 1; // Assume number.
        }
      }
    }

    // Concatenate all number array into a (re-used) Float32Array.
    this.prepare_weightsFloat32Array( weightsTotalLength );
    {
      for ( let i = 0; i < this.weightsElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
        this.weightsFloat32Array[ i ] = -i;
      }

      let offset = weightsElementOffsetBegin;
      for ( let i = 0; i < nameOrderArray.length; ++i ) { // Concatenate all number array into a Float32Array.
        let name = nameOrderArray[ i ];
        let number_or_numberArray = nameNumberArrayObject[ name ];

        if ( number_or_numberArray != undefined ) {
          if ( number_or_numberArray instanceof Array ) {
            this.weightsFloat32Array.set( number_or_numberArray, offset ); // Assume number array.
            offset += number_or_numberArray.length;
          } else {
            this.weightsFloat32Array[ offset ] = number_or_numberArray; // Assume number.
            offset += 1;
          }
        }
      }
    }
  }

}
