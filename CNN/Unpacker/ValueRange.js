export { Same, Bool, Int };


/**
 * Provides methods for converting nothing (just return original value).
 */
class Same {

  /** @return {any} Return the input value directly. */
  adjust( value ) {
    return value;
  }

  /**
   * @return {function}
   *   Return a function object. When calling the returned function object with one value parameter, it will return
   * the adjusted value which is retricted by this object.
   */
  getAdjuster() {
    return this.adjust.bind( this );
  }

  /**
   * Return a generator which produces a sequence of two-value pair.
   *
   * For ValueRange.Same, there is no meaningful testable value pair could be generated. The reason is that any value is legal for it.
   *
   * @param {number} offsetMultiplier
   *   An integer multiplier. The ( offsetMultiplier * this.kinds ) will be used as the first test value. The default value
   * is Same.getRandomIntInclusive( -10, +10 ). The -10 and +10 is just chosen arbitrarily.
   *
   * @yield {object}
   *   Every time yield an array with two number properties: { valueInput, valueOutput }. The valueOutput is a value from valueRangeMin to
   * valueRangeMax. The valueInput is a value which could be adjusted to valueOutput by this ValueRange object.
   */
  * valueInputOutputGenerator( offsetMultiplier = Same.getRandomIntInclusive( -10, +10 ) ) {
    yield { valueInput: offsetMultiplier, valueOutput: offsetMultiplier };
  }

  /**
   * Return a random integer between min and max. (This function comes from MDN's Math.random().)
   *
   * @param {number} min The the minimum integer. (inclusive)
   * @param {number} max The the maximum integer. (inclusive)
   */
  static getRandomIntInclusive( min, max ) {
    min = Math.ceil( min );
    max = Math.floor( max );
    return Math.floor( Math.random() * ( max - min + 1 ) + min );
  }
}

/** The only one ValueRange.Same instance. */
Same.Singleton = new Same;


/**
 * Provides methods for converting weight (a number) to boolean.
 */
class Bool extends Same {

  /** @return {boolean} Convert number value into false or true. */
  adjust( value ) {
    // If value is not an integer, the remainder will always not zero. So convert it to integer first.
    //
    // According to negative or positive, the remainder could be one of [ -1, 0, +1 ].
    // So simply check it whether is 0 (instead of check both -1 and +1), could result in false or true.
    return ( ( Math.trunc( value ) % 2 ) != 0 );
  }

  /**
   * For ValueRange.Bool, two two-value pairs will be generated in sequence.
   *
   * @param {number} offsetMultiplier
   *   An integer multiplier. The ( offsetMultiplier * this.kinds ) will be used as the first test value. The default value
   * is Same.getRandomIntInclusive( -100, +100 ). The -100 and +100 is just chosen arbitrarily.
   *
   * @override
   */
  * valueInputOutputGenerator( offsetMultiplier = Same.getRandomIntInclusive( -100, +100 ) ) {

    let baseInt = Math.trunc( offsetMultiplier );
    let baseIntEven = baseInt * 2; // Any integer multiplied by 2 will be an even number.
    let baseIntEvenSign = Math.sign( baseIntEven );

//!!! (2021/07/06 Remarked) sign should be positive in this case.
//     // If no sign (i.e. baseIntEven is zero), choose the sign randomly. Otherwise, there will no fractional part at all.
//     if ( baseIntEvenSign == 0 ) {
//       if ( Math.random() >= 0.5 )
//         baseIntEvenSign = 1;
//       else
//         baseIntEvenSign = -1;
//     }

    // If no sign (i.e. baseIntEven is zero), choose positive sign. Otherwise, there will no fractional part at all.
    if ( baseIntEvenSign == 0 ) {
      baseIntEvenSign = 1;
    }

    // An even value with fractional part will become 0 by Bool.adjust().
    let valueInputZero = ( baseIntEven + 0 ) + ( baseIntEvenSign * Math.random() );

    // (2021/07/06 Temp Debug) The above algorithm might be wrong.
    if ( this.adjust( valueInputZero ) != 0 )
      debugger;

    yield { valueInput: valueInputZero, valueOutput: 0 };


    // A odd value with fractional part will become 1 by Bool.adjust().
    let valueInputOne  = ( baseIntEven + 1 ) + ( baseIntEvenSign * Math.random() );

    // (2021/07/06 Temp Debug) The above algorithm might be wrong.
    if ( this.adjust( valueInputOne ) != 1 )
      debugger;

    yield { valueInput: valueInputOne, valueOutput: 1 };
  }

}

/** The only one ValueRange.Bool instance. */
Bool.Singleton = new Bool;


/**
 * Provides methods for converting weight (a number) to integer between min and max (both are integers).
 */
class Int extends Same {

  /**
   * @param {number} min The minimum value (as integer).
   * @param {number} max The maximum value (as integer).
   */
  constructor( min, max ) {
    super();
    this.min = Math.trunc( Math.min( min, max ) ); // Confirm the minimum. Convert to an integer.
    this.max = Math.trunc( Math.max( min, max ) ); // Confirm the maximum. Convert to an integer.
    this.kinds = ( this.max - this.min ) + 1; // How many possible integer between them.
  }

  /**
   * @return {number} Return the trucated value (i.e. integer). The returned value is forcibly between min and max (as integer too).
   */
  adjust( value ) {
    let valueInt = Math.trunc( value ); // Convert to an integer.

    // Rearrange valueInt between min and max fairly (in probability).
    //
    // A1: Why not use remainder operator (%) directly?
    // Q1: Because remainder always has the same sign as dividend, this can not handle the situation which min and
    //     max have different sign.
    //
    // A2: Why not just restrict all value less than min to valueMin and value greater than max to max?
    // Q2: Although this could restrict value in range, it will skew the probability of every value in the range.
    //     Unfair probability could be harmful to evolution algorithm.
    //
    let quotient = ( valueInt - this.min ) / this.kinds;
    let quotientInt = Math.floor( quotient );  // So that negative value could be handled correctly.
    let result = valueInt - ( quotientInt * this.kinds );
    return result;
  }

//!!! ...unfinished... (2021/05/26) Maybe need a parameter to restrict the maximum generated value count, or value upper bound.
// Otherwise, too large value may not feasible to be tested.


  /**
   * For ValueRange.Int, this.kinds two-value pairs will be generated in sequence.
   *
   * @param {number} offsetMultiplier
   *   An integer multiplier. The ( offsetMultiplier * this.kinds ) will be used as the first test value. The default value
   * is Same.getRandomIntInclusive( -10, +10 ). The -10 and +10 is just chosen arbitrarily.
   *
   * @param {number} maxKinds
   *   An integer restricts the generator range to [ 0, maxKinds ] instead of [ 0, this.kinds ]. Default is this.kinds.
   * When this.kinds is large, this parameter could lower the kinds to reduce test cases quantity.
   *
   * @override
   */
  * valueInputOutputGenerator( offsetMultiplier = Same.getRandomIntInclusive( -10, +10 ), maxKinds = this.kinds ) {

    // An integer which has the same remainder as offsetMultiplier when divided by this.kinds.
    let baseIntCongruence = Math.trunc( offsetMultiplier ) * this.kinds;

    let testKinds = Math.min( maxKinds, this.kinds );
    for ( let i = 0; i < testKinds; ++i ) {
      let valueOutputInt = ( this.min + i );

      // An integer which could become valueOutputInt when adjusted by Int.adjust().
      let valueInputInt = baseIntCongruence + valueOutputInt;
      let valueInputIntSign = Math.sign( valueInputInt );

//!!! (2021/07/06 Remarked) sign should be positive in this case.
//       // If no sign (i.e. valueInputInt is zero), choose the sign randomly. Otherwise, there will no fractional part at all.
//       if ( valueInputIntSign == 0 ) {
//         if ( Math.random() >= 0.5 )
//           valueInputIntSign = 1;
//         else
//           valueInputIntSign = -1;
//       }

      // If no sign (i.e. valueInputInt is zero), choose positive sign. Otherwise, there will no fractional part at all.
      if ( valueInputIntSign == 0 ) {
        valueInputIntSign = 1;
      }

      // An floating-point number (the integer with fractional part) which could become valueOutputInt when adjusted by Int.adjust().
      let valueInputFloat = valueInputInt + ( valueInputIntSign * Math.random() );

//!!! (2021/07/06 Remarked) Moved to outer test case.
//       // Test: the above algorithm might be wrong.
//       tf.util.assert( this.adjust( valueInputFloat ) == valueOutputInt,
//         `ValueRange.Int( ${this.min}, ${this.max} ).valueInputOutputGenerator(): `
//           + `this.adjust( ${valueInputFloat} ) return ( ${this.adjust( valueInputFloat )} ) should be ( ${valueOutputInt} ).` );

      // (2021/07/06 Temp Debug) The above algorithm might be wrong.
      if ( this.adjust( valueInputFloat ) != valueOutputInt )
        debugger;

      yield { valueInput: valueInputFloat, valueOutput: valueOutputInt };
    }
  }

}
