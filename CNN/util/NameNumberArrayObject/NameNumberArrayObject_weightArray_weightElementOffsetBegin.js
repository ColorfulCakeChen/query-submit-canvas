export { weightArray_weightElementOffsetBegin };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";

/**
 * Mainly used as the composed result of NameNumberArrayObject.Base object.
 *
 *
 * @member {number[]} weightArray
 *   A number array which is the composed result of NameNumberArrayObject.Base object.
 *
 * @member {number} weightElementOffsetBegin
 *   The valid element index of the .weightArray[]. Used for simulating extracting weights from
 * .weightArray[]'s internal.
 */
class weightArray_weightElementOffsetBegin extends Recyclable.Root {

  /**
   * Used as default NameNumberArrayObject.weightArray_weightElementOffsetBegin provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "NameNumberArrayObject.weightArray_weightElementOffsetBegin.Pool",
    weightArray_weightElementOffsetBegin, weightArray_weightElementOffsetBegin.setAsConstructor );

  /**
   */
  constructor() {
    super();
    weightArray_weightElementOffsetBegin.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    weightArray_weightElementOffsetBegin.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.weightArray = Recyclable.Array.Pool.get_or_create_by( 0 );
  }

  /** @override */
  disposeResources() {
    this.weightElementOffsetBegin = undefined;

    if ( this.weightArray ) {
      this.weightArray.disposeResources_and_recycleToPool();
      this.weightArray = null;
    }

    super.disposeResources();
  }

  /**
   * Concatenate multiple number arrays into one NumberArray (this.weightArray) in a specified order.
   *
   * It fills two data members of this object { weightArray, weightElementOffsetBegin }.
   *   - this.weightArray: A number array which is the concatenated result of the numberArrayArray.
   *   - this.weightElementOffsetBegin: A random offset element count inside weightArray.
   *
   * Note: The this.weightArray is re-used. So caller should not modify it.
   *
   *
   * @param {string[]} nameOrderArray
   *   An array of string. Every element is a string name of a parameter. The number array in nameNumberArrayObject will be concatenated
   * according to the element order of this nameOrderArray[].
   *
   * @param {NameNumberArrayObject.Base} nameNumberArrayObject
   *   An object whose all properties are number or number array. It is a map from a string name to a number or number array. The names
   * should be found in nameOrderArray[].
   *
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightArray.
   *
   */
  set_byConcat( nameOrderArray, nameNumberArrayObject, weightElementOffsetBegin = 0 ) {

    this.weightElementOffsetBegin = weightElementOffsetBegin; // Skip the un-used element count.

    // 1. Calculate the total length include the extra offset.
    let weightsTotalLength = weightElementOffsetBegin;
    {
      // 1.1 String named properties.
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

      // 1.2 Integer numeric properties.
      for ( let i = 0; i < nameNumberArrayObject.length; ++i ) {
        let number_or_numberArray = nameNumberArrayObject[ i ];
        if ( number_or_numberArray != undefined ) {
          if ( number_or_numberArray instanceof Array ) {
            weightsTotalLength += number_or_numberArray.length; // Assume number array.
          } else {
            weightsTotalLength += 1; // Assume number.
          }
        }
      }
    }
  
    // 2. Concatenate all number array into a (re-used) Float32Array.
    {
      this.weightArray.length = weightsTotalLength;

      for ( let i = 0; i < this.weightElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
        this.weightArray[ i ] = -i;
      }

      let offset = weightElementOffsetBegin;

      // 2.1 String named properties.
      for ( let i = 0; i < nameOrderArray.length; ++i ) { // Concatenate all number array into a Float32Array.
        let name = nameOrderArray[ i ];
        let number_or_numberArray = nameNumberArrayObject[ name ];

        if ( number_or_numberArray != undefined ) {
          if ( number_or_numberArray instanceof Array ) {
            for ( let j = 0; j < number_or_numberArray.length; ++j ) { // 2.1.1
              this.weightArray[ offset ] = number_or_numberArray[ j ]; // Assume number array.
              ++offset;
            }
          } else { // 2.1.2
            this.weightArray[ offset ] = number_or_numberArray; // Assume number.
            ++offset;
          }
        }
      }

      // 2.2 Integer numeric properties.
      for ( let i = 0; i < nameNumberArrayObject.length; ++i ) { // Concatenate all number array into a Float32Array.
        let number_or_numberArray = nameNumberArrayObject[ i ];

        if ( number_or_numberArray != undefined ) {
          if ( number_or_numberArray instanceof Array ) {
            for ( let j = 0; j < number_or_numberArray.length; ++j ) { // 2.2.1
              this.weightArray[ offset ] = number_or_numberArray[ j ]; // Assume number array.
              ++offset;
            }
          } else { // 2.2.2
            this.weightArray[ offset ] = number_or_numberArray; // Assume number.
            ++offset;
          }
        }
      }
    }
  }

  /**
   * Note: The numeric properties of nameNumberArrayObject is ignored in this method.
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
   * @param {number} weightElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightArray.
   *
   * @param {string[]|number} nameToBeFound
   *   A name string or an integer which represents the property be searched. If a string, it should
   * be one element of nameOrderArray[].
   *
   * @return {number}
   *   - Return the element index of this.weightArray) of the nameToBeFound, if found.
   *   - Return negative value, if not found.
   */
   static weightElementIndex_find_byName(
    nameOrderArray, nameNumberArrayObject, weightElementOffsetBegin,
    nameToBeFound
   ) {
    let weightElementIndex = -1;

    let weightsTotalLength = weightElementOffsetBegin;

    // 1. (Use the same looping logic of .set_byConcat().)

    // 1.1 String named properties.
    for ( let i = 0; i < nameOrderArray.length; ++i ) {
      let name = nameOrderArray[ i ];
      if ( name == nameToBeFound) {
        weightElementIndex = weightsTotalLength;
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

    // 1.2 Integer numeric properties. (If not found in string named property, search integer numeric property.)
    if ( weightElementIndex < 0 ) {
      for ( let i = 0; i < nameNumberArrayObject.length; ++i ) {
        if ( i == nameToBeFound) {
          weightElementIndex = weightsTotalLength;
          break;
        }
  
        let number_or_numberArray = nameNumberArrayObject[ i ];
        if ( number_or_numberArray != undefined ) {
          if ( number_or_numberArray instanceof Array ) {
            weightsTotalLength += number_or_numberArray.length; // Assume number array.
          } else {
            weightsTotalLength += 1; // Assume number.
          }
        }
      }
    }

    return weightElementIndex;
   }

}
