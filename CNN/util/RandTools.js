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
 * This method will try to let neighbor channel's value bounds has obviously more
 * different.
 *
 *
 * @param {number[]|Recyclable.NumberArray_withBounds} io_numberArray
 *   The number array to be filled. If it is an instance of Recyclable.NumberArray_withBounds,
 * its .boundsArray_byChannel will be filled.
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
  height, width, channelCount,
  valueBegin = 0, valueStep = 1,
  randomOffsetMin = 0, randomOffsetMax = 0, divisorForRemainder = ( 2 ** 26 ) ) {

  // (Codes copied from getRandomIntInclusive())
  const randomOffsetMinReal = Math.min( randomOffsetMin, randomOffsetMax );
  const randomOffsetMaxReal = Math.max( randomOffsetMin, randomOffsetMax );
  const randomOffsetMinInt = Math.ceil( randomOffsetMinReal );
  const randomOffsetMaxInt  = Math.floor( randomOffsetMaxReal );
  const randomOffsetKindsInt = randomOffsetMaxInt - randomOffsetMinInt + 1;

  io_numberArray.length = height * width * channelCount;

  let valueStepPerChannel = valueStep * channelCount;
  let valueNoRandBegin = valueBegin;
  let valueNoRand;
  let randomOffset;
  let value;

  let arrayIndex = 0;

  if ( io_numberArray instanceof Recyclable.NumberArray_withBounds ) {
    io_numberArray.boundsArray_byChannel.length = channelCount;
    io_numberArray.boundsArray_byChannel.set_all_by_PositiveInfinity_NegativeInfinity();

    for ( let h = 0; h < height; ++h ) {
      for ( let w = 0; w < width; ++w ) {

        valueNoRand = valueNoRandBegin;
        for ( let c = 0; c < channelCount; ++c, ++arrayIndex ) {

//!!! (2022/08/04 Temp Remarked) for re-producible random.
          // randomOffset = Math.floor( ( Math.random() * randomOffsetKindsInt ) + randomOffsetMinInt );
          if ( ( arrayIndex % 2 ) == 0 )
            randomOffset = randomOffsetMinInt;
          else
            randomOffset = randomOffsetMaxInt;

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

//!!! (2022/08/04 Temp Remarked) for re-producible random.
          // randomOffset = Math.floor( ( Math.random() * randomOffsetKindsInt ) + randomOffsetMinInt );
          if ( ( arrayIndex % 2 ) == 0 )
            randomOffset = randomOffsetMinInt;
          else
            randomOffset = randomOffsetMaxInt;

          value = ( valueNoRand + randomOffset ) % divisorForRemainder;
          io_numberArray[ arrayIndex ] = value;
          valueNoRand += valueStepPerChannel;
        }
        valueNoRandBegin += valueStep;
      }
    }
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
  randomOffsetMin = 0, randomOffsetMax = 0, divisorForRemainder = ( 2 ** 26 ),
  oBounds = null ) {

  let numberArray = new Array();
  return fill_numberArray( numberArray,
    height, width, channelCount,
    valueBegin, valueStep,
    randomOffsetMin, randomOffsetMax,  divisorForRemainder );
}
