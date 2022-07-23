export { Base };

import * as Pool from "./Pool.js";
import * as Recyclable from "./Recyclable.js";

/**
 *
 */
class Base extends Recyclable.Root {

  /**
   * Used as default NameNumberArrayObject_To_NumberArray.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NameNumberArrayObject_To_NumberArray.Base.Pool", Base, Base.setAsConstructor );

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
    this.weightsArray = Recyclable.Array.Pool.get_or_create_by( 0 );
  }

  /** @override */
  disposeResources() {
    this.weightsElementOffsetBegin = undefined;

    if ( this.weightsArray ) {
      this.weightsArray.disposeResources_and_recycleToPool();
      this.weightsArray = null;
    }

    super.disposeResources();
  }

  /**
   * Concatenate multiple number arrays into one NumberArray (this.weightsArray) in a specified order.
   *
   * It fills two data members of this object { weightsArray, weightsElementOffsetBegin }.
   *   - this.weightsArray: A number array which is the concatenated result of the numberArrayArray.
   *   - this.weightsElementOffsetBegin: A random offset element count inside weightsArray.
   *
   * Note: The this.weightsArray is re-used. So caller should not modify it.
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
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsArray.
   *
   */
  setByConcat( nameOrderArray, nameNumberArrayObject, weightsElementOffsetBegin = 0 ) {

    this.weightsElementOffsetBegin = weightsElementOffsetBegin; // Skip the un-used element count.

    // 1. Calculate the total length include the extra offset.
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

    // 2. Concatenate all number array into a (re-used) Float32Array.
    {
      this.weightsArray.length = weightsTotalLength;

      for ( let i = 0; i < this.weightsElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
        this.weightsArray[ i ] = -i;
      }

      let offset = weightsElementOffsetBegin;
      for ( let i = 0; i < nameOrderArray.length; ++i ) { // Concatenate all number array into a Float32Array.
        let name = nameOrderArray[ i ];
        let number_or_numberArray = nameNumberArrayObject[ name ];

        if ( number_or_numberArray != undefined ) {
          if ( number_or_numberArray instanceof Array ) {
            for ( let j = 0; j < number_or_numberArray.length; ++j ) { // 2.1
              this.weightsArray[ offset ] = number_or_numberArray[ j ]; // Assume number array.
              ++offset;
            }
          } else { // 2.2
            this.weightsArray[ offset ] = number_or_numberArray; // Assume number.
            ++offset;
          }
        }
      }
    }
  }

  /**
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
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsArray.
   *
   * @param {string[]} nameToBeFound
   *   A name string to be searched. It should be one element of nameOrderArray[].
   *
   * @return {number}
   *   - Return the element index of this.weightsArray) of the nameToBeFound, if found.
   *   - Return negative value, if not found.
   */
   weightsElementIndex_find_byName(
    nameOrderArray, nameNumberArrayObject, weightsElementOffsetBegin,
    nameToBeFound
   ) {
    let weightsElementIndex = -1;

    // (Use the same looping logic of .setByConcat())
    let weightsTotalLength = weightsElementOffsetBegin;
    for ( let i = 0; i < nameOrderArray.length; ++i ) {
      let name = nameOrderArray[ i ];
      if ( name == nameToBeFound) {
        weightsElementIndex = weightsTotalLength;
        break;
      }

      let number_or_numberArray = nameNumberArrayObject[ name ];
      if ( number_or_numberArray != undefined ) {
        if ( number_or_numberArray instanceof Array ) {
          weightsTotalLength += number_or_numberArray.length; // Assume number array.
        } else {
          weightsTotalLength += 1; // Assume number.
        }
      }
    }

    return weightsElementIndex;
   }

}
