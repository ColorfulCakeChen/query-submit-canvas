export { getRandomIntInclusive, fill_numberArray, generate_numberArray };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as Recyclable from "./Recyclable.js";

/**
 * Return a random integer between min and max. (This function comes from MDN's Math.random().)
 *
 * @param {number} min The the minimum integer. (inclusive)
 * @param {number} max The the maximum integer. (inclusive)
 */
function getRandomIntInclusive( min, max ) {
  let minReal = Math.min( min, max );
  let maxReal = Math.max( min, max );
  let minInt = Math.ceil( minReal );
  let maxInt  = Math.floor( maxReal );
  let kindsInt = maxInt - minInt + 1;
  return Math.floor( ( Math.random() * kindsInt ) + minInt );
}

/**
 *
 * @param {number[]|Recyclable.NumberArray_withBounds} io_numberArray
 *   The number array to be filled. If it is an instance of Recyclable.NumberArray_withBounds, its
 * .lowerBound and .upperBound will be filled.
 *
 * @param {number} randomOffsetMin
 *   Every element of the generated number array will been shifted from the sequence id between
 * [ randomOffsetMin, randomOffsetMax ] (inclusive) randomly.
 *
 * @param {number} randomOffsetMax
 *   Every element of the generated number array will been shifted from the sequence id between
 * [ randomOffsetMin, randomOffsetMax ] (inclusive) randomly.
 *
 * @param {number} divisorForRemainder
 *   The generated value will be divided by divisorForRemainder. The remainder will be the real
 * output value. This is used for restricted the value bounds.
 *
 * @return {number[]|Recyclable.NumberArray_withBounds}
 *   Return the io_numberArray.
 */
function fill_numberArray(
  io_numberArray, randomOffsetMin = 0, randomOffsetMax = 0, divisorForRemainder = ( 2 ** 26 ) ) {

  if ( io_numberArray instanceof Recyclable.NumberArray_withBounds ) {
    let lowerBound = +Infinity;
    let upperBound = -Infinity;
    let value;
    for ( let i = 0; i < io_numberArray.length; ++i ) {
      value = ( i + getRandomIntInclusive( randomOffsetMin, randomOffsetMax ) ) % divisorForRemainder;
      if ( value > upperBound )
        upperBound = value;
      if ( value < lowerBound )
        lowerBound = value;
      io_numberArray[ i ] = value;
    }
    io_numberArray.lowerBound = lowerBound;
    io_numberArray.upperBound = upperBound;

  } else {
    for ( let i = 0; i < io_numberArray.length; ++i ) {
      io_numberArray[ i ] = ( i + getRandomIntInclusive( randomOffsetMin, randomOffsetMax ) ) % divisorForRemainder;
    }
  }

//!!! (2022/07/26) should find out real bounds (not inferenced bounds).
// Otherwise, it will not match Embedding's real bounds.
//   if ( oBounds ) {
//     oBounds
//       .set_byLowerUpper( 0, io_numberArray.length - 1 ) // Basically, value is between [ 0, ( io_numberArray.length - 1 ) ].
//       .add_byLowerUpper( randomOffsetMin, randomOffsetMax ); // Plus the random range.
//   }

  return io_numberArray;
}

/**
 *
 * @param {number} elementCount
 *   The returned number array will have so many elements.
 *
 * @param {number} randomOffsetMin
 *   Every element of the generated number array will been shifted from the sequence id between
 * [ randomOffsetMin, randomOffsetMax ] (inclusive) randomly.
 *
 * @param {number} randomOffsetMax
 *   Every element of the generated number array will been shifted from the sequence id between
 * [ randomOffsetMin, randomOffsetMax ] (inclusive) randomly.
 *
 * @param {FloatValue.Bounds} oBounds
 *   If not null, it will be filled as the value lower and upper bounds of the returned number array.
 *
 * @return {number[]}
 *   Return a number array.
 */
function generate_numberArray(
  elementCount, randomOffsetMin = 0, randomOffsetMax = 0, divisorForRemainder = ( 2 ** 26 ),
  oBounds = null ) {

  let numberArray = new Array( elementCount );
  return fill_numberArray( numberArray, randomOffsetMin, randomOffsetMax,  divisorForRemainder, oBounds );
}
