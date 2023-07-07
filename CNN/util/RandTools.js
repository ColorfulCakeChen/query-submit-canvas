export { getRandomIntInclusive_by_minInt_kindsInt, getRandomIntInclusive };
export { getRandomInt_TruncatedBinaryExponent };
export { fill_numberArray, generate_numberArray };
export { shuffle_Array };
export { array_toString };

import * as FloatValue from "../Unpacker/FloatValue.js";
import * as Recyclable from "./Recyclable.js";

/**
 * Return a random integer between [ minInt, ( minInt + kindsInt - 1 ) ]. (This
 * function comes from MDN's Math.random() example.)
 *
 * @param {integer} minInt
 *   The minimum integer. (inclusive)
 *
 * @param {integer} kindsInt
 *   How many kinds between minInt and maxInt (inclusive).
 */
function getRandomIntInclusive_by_minInt_kindsInt( minInt, kindsInt ) {
  return Math.floor( ( Math.random() * kindsInt ) + minInt );
}

/**
 * Return a random integer between min and max. (This function comes from MDN's
 * Math.random().)
 *
 * @param {number} min
 *   The minimum integer. (inclusive)
 *
 * @param {number} max
 *   The maximum integer. (inclusive)
 */
function getRandomIntInclusive( min, max ) {
  let minReal = Math.min( min, max );
  let maxReal = Math.max( min, max );
  let minInt = Math.ceil( minReal );
  let maxInt  = Math.floor( maxReal );
  let kindsInt = maxInt - minInt + 1;
  //return Math.floor( ( Math.random() * kindsInt ) + minInt );
  return getRandomIntInclusive_by_minInt_kindsInt( minInt, kindsInt );
}

/**
 * Algorithm for randomized truncated (binary) exponential backoff.
 *
 * @param {number} exponent
 *   Either zero or a positive number (could be non-integer) for the exponent
 * number of a two's power. (i.e. the B in ( 2 ** B ) ) Usually, this is the
 * current retry times in a exponential backoff algorithm.
 *
 * @param {number} exponentMax
 *   Either zero or a positive number (could be non-integer) as the maximum
 * exponent number for restricting the exponent number.
 *
 * @return {number}
 *   Return a random integer between
 * [ 1, ( 2 ** Math.min( exponent, exponentMax ) ) ].
 */
function getRandomInt_TruncatedBinaryExponent( exponent, exponentMax ) {
  let exponentRestricted = Math.min( exponent, exponentMax );
  let exponentZeroOrPositive = Math.max( 0, exponentRestricted );
  let power = ( 2 ** exponentZeroOrPositive );
  let randomInt = getRandomIntInclusive( 1, power );
  return randomInt;
}

/**
 * This method will try to let neighbor channel's value bounds has obviously
 * more different.
 *
 *
 * @param {number[]|Recyclable.NumberArray_withBounds} io_numberArray
 *   The number array to be filled. If it is an instance of
 * Recyclable.NumberArray_withBounds, its .boundsArray_byChannel will be
 * filled.
 *
 * @param {number} height        The length of axis0 of the io_numberArray.
 * @param {number} width         The length of axis1 of the io_numberArray.
 * @param {number} channelCount  The length of axis2 of the io_numberArray.
 *
 * @param {number} valueBegin
 *   The first value of filled sequence.
 *
 * @param {number} valueStep
 *   The incremental value of every next filled value in the sequence.
 *
 * @param {number} randomOffsetMin
 *   Every element of the generated number array will been shifted from the
 * sequence id between [ randomOffsetMin, randomOffsetMax ] (inclusive)
 * randomly.
 *
 * @param {number} randomOffsetMax
 *   Every element of the generated number array will been shifted from the
 * sequence id between [ randomOffsetMin, randomOffsetMax ] (inclusive)
 * randomly.
 *
 * @param {number} divisorForRemainder
 *   The generated value will be divided by divisorForRemainder. The remainder
 * will be the real output value. This is used for restricted the value bounds.
 *
 * @param {boolean} alwaysFixedRandomMinMax
 *   If true, the generated values will be fixed every time (i.e. non-random;
 * reproducible random). It is mainly used for debug.
 *
 * @return {number[]|Recyclable.NumberArray_withBounds}
 *   Return the io_numberArray.
 */
function fill_numberArray( io_numberArray,
  height, width, channelCount,
  valueBegin = 0, valueStep = 1,
  randomOffsetMin = 0, randomOffsetMax = 0,
  divisorForRemainder = ( 2 ** 26 ),
  alwaysFixedRandomMinMax = false
) {

  // (Codes copied from getRandomIntInclusive())
  const randomOffsetMinReal = Math.min( randomOffsetMin, randomOffsetMax );
  const randomOffsetMaxReal = Math.max( randomOffsetMin, randomOffsetMax );
  const randomOffsetMinInt = Math.ceil( randomOffsetMinReal );
  const randomOffsetMaxInt  = Math.floor( randomOffsetMaxReal );
  const randomOffsetKindsInt = randomOffsetMaxInt - randomOffsetMinInt + 1;

  // (Note: If TypedArray, its .length can not be modified.)
  if ( io_numberArray instanceof Array )
    io_numberArray.length = height * width * channelCount;

  let valueStepPerChannel = valueStep * channelCount;
  let valueNoRandBegin = valueBegin;
  let valueNoRand;
  let randomOffset;
  let value;

  let arrayIndex = 0;

  try {
    if ( io_numberArray instanceof Recyclable.NumberArray_withBounds ) {
      io_numberArray.boundsArray_byChannel.length = channelCount;
      io_numberArray.boundsArray_byChannel
        .set_all_by_PositiveInfinity_NegativeInfinity();

      for ( let h = 0; h < height; ++h ) {
        for ( let w = 0; w < width; ++w ) {

          valueNoRand = valueNoRandBegin;
          for ( let c = 0; c < channelCount; ++c, ++arrayIndex ) {

            if ( !alwaysFixedRandomMinMax ) { // For normal random.
              randomOffset = getRandomIntInclusive_by_minInt_kindsInt(
                randomOffsetMinInt, randomOffsetKindsInt );

            } else { // For reproducible random (i.e. non-random).
                if ( ( arrayIndex % 2 ) == 0 )
                randomOffset = randomOffsetMinInt;
              else
                randomOffset = randomOffsetMaxInt;
            }

            value = ( valueNoRand + randomOffset ) % divisorForRemainder;
            io_numberArray[ arrayIndex ] = value;
            io_numberArray.boundsArray_byChannel.enlarge_one_byN( c, value );

            valueNoRand += valueStepPerChannel;
          }
          valueNoRandBegin += valueStep;
        }
      }

    } else {

      for ( let h = 0; h < height; ++h ) {
        for ( let w = 0; w < width; ++w ) {

          valueNoRand = valueNoRandBegin;
          for ( let c = 0; c < channelCount; ++c, ++arrayIndex ) {

            if ( !alwaysFixedRandomMinMax ) { // For normal random.
              randomOffset = getRandomIntInclusive_by_minInt_kindsInt(
                randomOffsetMinInt, randomOffsetKindsInt );

            } else { // For reproducible random (i.e. non-random).
              if ( ( arrayIndex % 2 ) == 0 )
                randomOffset = randomOffsetMinInt;
              else
                randomOffset = randomOffsetMaxInt;
            }

            value = ( valueNoRand + randomOffset ) % divisorForRemainder;
            io_numberArray[ arrayIndex ] = value;
            valueNoRand += valueStepPerChannel;
          }
          valueNoRandBegin += valueStep;
        }
      }
    }

  } catch ( e ) {
    debugger;
    throw e;
  }

  return io_numberArray;
}

/**
 *
 * @param {number} height        The length of axis0 of the io_numberArray.
 * @param {number} width         The length of axis1 of the io_numberArray.
 * @param {number} channelCount  The length of axis2 of the io_numberArray.
 *
 * @return {number[]}
 *   Return a number array.
 *
 * @see fill_integerArray()
 */
function generate_numberArray(
  height, width, channelCount,
  valueBegin = 0, valueStep = 1,
  randomOffsetMin = 0, randomOffsetMax = 0,
  divisorForRemainder = ( 2 ** 26 ),
  alwaysFixedRandomMinMax
) {
  let numberArray = new Array();
  return fill_numberArray( numberArray,
    height, width, channelCount,
    valueBegin, valueStep,
    randomOffsetMin, randomOffsetMax, divisorForRemainder,
    alwaysFixedRandomMinMax );
}

/**
 * Swap elements randomly.
 *
 * @param {Array} io_array
 *   The array to be shuffled.
 */
function shuffle_Array( io_array ) {
  const minInt = 0;
  const maxInt = io_array.length - 1;
  const kindsInt = maxInt - minInt + 1;

  let swapIndex, tempElement;
  for ( let i = 0; i <= maxInt; ++i ) {

    // Randomly select another index to be swapped.
    swapIndex = getRandomIntInclusive_by_minInt_kindsInt( minInt, kindsInt );

    tempElement = io_array[ swapIndex ];
    io_array[ swapIndex ] = io_array[ i ];
    io_array[ i ] = tempElement;
  }
}

/**
 * @param {any[]} anArray
 *   An array to be converted to a string. It can have nested sub-array as
 * element.
 *
 * @return {string}
 *   Return a string representing the array's content.
 */
function array_toString( anArray ) {
  let str;
  if ( anArray != undefined ) {
    if ( anArray.length != undefined ) { // 1. Assume it is an array.

      if ( anArray.length > 0 ) { // 1.1 non-empty array.
        let strArray = new Array( anArray.length );
        for ( let i = 0; i < anArray.length; ++i ) {
          strArray[ i ] = array_toString( anArray[ i ] );
        }
        str = `[ ${strArray.join( ", " )} ]`;

      } else { // 1.2 empty array.
        str = "[]";
      }
  
    } else { // 2. Assume it is not an array.
      str = `${anArray}`;
    }
  } else { // 3. undefined or null.
    str = `${anArray}`;
  }
  return str;
}
