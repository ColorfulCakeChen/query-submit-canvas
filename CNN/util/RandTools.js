export { getRandomIntInclusive, generate_numberArray };

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
 * @return {number[]}
 *   Return a number array.
 */
function generate_numberArray( elementCount, randomOffsetMin = 0, randomOffsetMax = 0 ) {
  let numberArray = new Array( elementCount );
  for ( let i = 0; i < elementCount; ++i ) {
    numberArray[ i ] = i + getRandomIntInclusive( randomOffsetMin, randomOffsetMax );
  }
  return numberArray;
}
