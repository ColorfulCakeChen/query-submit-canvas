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
 * @param {number} valueBegin
 *   The first value of filled sequence.
 *
 * @param {number} valueStep
 *   The incremental value of every next filled value in the sequence.
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
function fill_numberArray( io_numberArray,
  valueBegin = 0, valueStep = 1,
  randomOffsetMin = 0, randomOffsetMax = 0, divisorForRemainder = ( 2 ** 26 ) ) {

  // (Codes copied from getRandomIntInclusive())
  const randomOffsetMinReal = Math.min( randomOffsetMin, randomOffsetMax );
  const randomOffsetMaxReal = Math.max( randomOffsetMin, randomOffsetMax );
  const randomOffsetMinInt = Math.ceil( randomOffsetMinReal );
  const randomOffsetMaxInt  = Math.floor( randomOffsetMaxReal );
  const randomOffsetKindsInt = randomOffsetMaxInt - randomOffsetMinInt + 1;

  let valueNoRand = valueBegin;
  let randomOffset;
  let value;
  //let alter = +1; // extra value for descreasing uniform.
  //let alter = +0; // extra value for descreasing uniform.

  if ( io_numberArray instanceof Recyclable.NumberArray_withBounds ) {
    let lowerBound = +Infinity;
    let upperBound = -Infinity;
    for ( let i = 0; i < io_numberArray.length; ++i ) {

//!!! (2022/08/04 Temp Remarked) for re-producible random.
//      randomOffset = Math.floor( ( Math.random() * randomOffsetKindsInt ) + randomOffsetMinInt );
      if ( ( i % 2 ) == 0 )
        randomOffset = randomOffsetMinInt;
      else
        randomOffset = randomOffsetMaxInt;

      value = ( valueNoRand + randomOffset ) % divisorForRemainder;
      if ( value > upperBound )
        upperBound = value;
      if ( value < lowerBound )
        lowerBound = value;
      io_numberArray[ i ] = value;
      valueNoRand += valueStep;
      //alter = -alter;
    }
    io_numberArray.lowerBound = lowerBound;
    io_numberArray.upperBound = upperBound;

  } else {
    for ( let i = 0; i < io_numberArray.length; ++i ) {

//!!! (2022/08/04 Temp Remarked) for re-producible random.
//      randomOffset = Math.floor( ( Math.random() * randomOffsetKindsInt ) + randomOffsetMinInt );
      if ( ( i % 2 ) == 0 )
        randomOffset = randomOffsetMinInt;
      else
        randomOffset = randomOffsetMaxInt;

      value = ( valueNoRand + randomOffset ) % divisorForRemainder;
      io_numberArray[ i ] = value;
      valueNoRand += valueStep;
      //alter = -alter;
    }
  }

  return io_numberArray;
}

/**
 *
 * @param {number} elementCount
 *   The returned number array will have so many elements.
 *
 * @return {number[]}
 *   Return a number array.
 *
 * @see fill_integerArray()
 */
function generate_numberArray( elementCount,
  valueBegin = 0, valueStep = 1,
  randomOffsetMin = 0, randomOffsetMax = 0, divisorForRemainder = ( 2 ** 26 ),
  oBounds = null ) {

  let numberArray = new Array( elementCount );
  return fill_numberArray( numberArray,
    valueBegin, valueStep,
    randomOffsetMin, randomOffsetMax,  divisorForRemainder );
}
