export { Base };

/**
 *
 */
class Base {

  /**
   * Concatenate multiple number arrays into one Float32Array in a specified order.
   *
   * It fills two data members of this object { weightsFloat32Array, weightsByteOffsetBegin }.
   *   - this.weightsFloat32Array: A Float32Array which is the concatenated result of the numberArrayArray.
   *   - this.weightsByteOffsetBegin: A random offset byte count inside weightsFloat32Array.
   *
   * @param {string[]} nameOrderArray
   *   An array of string. Every element is a string name of a parameter. The number array in nameNumberArrayObject will be concatenated
   * according to the element order of this nameOrderArray[].
   *
   * @param {object} nameNumberArrayObject
   *   An object whose all properties are number array. It is a map from a string name to a number array. The names should be found
   * in nameOrderArray[].
   *
   * @param {number} weightsElementOffsetBegin
   *   Offset how many elements (4 bytes per element) at the beginning of the result weightsFloat32Array.
   */
  setByConcat( nameOrderArray, nameNumberArrayObject, weightsElementOffsetBegin = 0 ) {

    this.weightsByteOffsetBegin = weightsElementOffsetBegin * Float32Array.BYTES_PER_ELEMENT; // Skip the un-used byte count.

    // Calculate the total length include the extra offset.
    let weightsTotalLength = weightsElementOffsetBegin;
    for ( let i = 0; i < nameOrderArray.length; ++i ) {
      let name = nameOrderArray[ i ];
      let numberArray = nameNumberArrayObject[ name ];
      if ( numberArray ) {
        weightsTotalLength += numberArray.length;
      }
    }

    // Concatenate all number array into a Float32Array.
    this.weightsFloat32Array = new Float32Array( weightsTotalLength );
    {
      for ( let i = 0; i < this.weightsElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
        this.weightsFloat32Array[ i ] = -i;
      }

      let offset = weightsElementOffsetBegin;
      for ( let i = 0; i < nameOrderArray.length; ++i ) { // Concatenate all number array into a Float32Array.
      let name = nameOrderArray[ i ];
      let numberArray = nameNumberArrayObject[ name ];
        if ( numberArray ) {
          this.weightsFloat32Array.set( numberArray, offset );
          offset += numberArray.length;
        }
      }
    }

//!!! (2021/08/11 Remarked) Replace by codes without temporary array.
//     // Prepare weights source and offset into a temporary array. So that they can be accessed by loop and total length could be calculated.
//     let weightsTotalLength = weightsElementOffsetBegin;
//     let weightsSourceArray = [];
//     for ( let i = 0; i < paramsNameOrderArray.length; ++i ) {
//       let paramName = paramsNameOrderArray[ i ];
//       let numberArray = paramsNumberArrayObject[ paramName ];
//       if ( numberArray ) {
//         weightsSourceArray.push( { offset: weightsTotalLength, weights: numberArray } );
//         weightsTotalLength += numberArray.length;
//       }
//     }
//
//     // Concatenate all number array into a Float32Array.
//     this.weightsFloat32Array = new Float32Array( weightsTotalLength );
//     {
//       for ( let i = 0; i < this.weightsElementOffsetBegin; ++i ) { // Make-up the un-used weight values.
//         this.weightsFloat32Array[ i ] = -i;
//       }
//
//       for ( let i = 0; i < weightsSourceArray.length; ++i ) { // Concatenate all number array into a Float32Array.
//         this.weightsFloat32Array.set( weightsSourceArray[ i ].weights, weightsSourceArray[ i ].offset );
//       }
//     }

  }

}
