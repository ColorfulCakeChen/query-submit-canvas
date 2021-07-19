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
    let minReal = Math.min( min, max );
    let maxReal = Math.max( min, max );
    let minInt = Math.ceil( minReal );
    let maxInt  = Math.floor( maxReal );
    let kindsInt = maxInt - minInt + 1;
    return Math.floor( ( Math.random() * kindsInt ) + minInt );
  }
}

/** The only one ValueRange.Same instance. */
Same.Singleton = new Same;


/**
 * Provides methods for converting weight (a number) to boolean.
 */
class Bool extends Same {

  constructor( min, max ) {
    super();
    this.kinds = 2; // Boolean has only two kinds.
  }

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
   * @param {number} maxKinds
   *   An integer restricts the generator range to [ 0, maxKinds ] instead of [ 0, this.kinds ]. Default is this.kinds.
   * When this.kinds is large, this parameter could lower the kinds to reduce test cases quantity. If zero or negative,
   * only one value (between [ 0, this.kinds ] randomly) will be generated.
   *
   * @override
   */
  * valueInputOutputGenerator( offsetMultiplier = Same.getRandomIntInclusive( -100, +100 ), maxKinds = this.kinds ) {

    let baseInt = Math.trunc( offsetMultiplier );
    let baseIntEven = baseInt * 2; // Any integer multiplied by 2 will be an even number.
    let baseIntEvenSign = Math.sign( baseIntEven );

    // If no sign (i.e. baseIntEven is zero), choose positive sign. Otherwise, there will no fractional part at all.
    if ( baseIntEvenSign == 0 ) {
      baseIntEvenSign = 1;
    }

    // A: Why not use Math.random() to generate value between [ 0, 1 ) directly?
    // Q: In order to avoid rounded into another integer when converted from Float64 (here) to Float32 (weights array),
    //    the random value should not too close to 1. For example, 1.9999999999999999999 might become 2.0 when converted
    //    from Float64 to Float32.
    let randomFractionalPart1 = Same.getRandomIntInclusive( 0, 99 ) / 1000;
    let randomFractionalPart2 = Same.getRandomIntInclusive( 0, 99 ) / 1000;

    // An even value with fractional part will become 0 by Bool.adjust().
    let valueInputZero = ( baseIntEven + 0 ) + ( baseIntEvenSign * randomFractionalPart1 );
    let valueInputOutputZero = { valueInput: valueInputZero, valueOutput: 0 };

    // A odd value with fractional part will become 1 by Bool.adjust().
    let valueInputOne  = ( baseIntEven + 1 ) + ( baseIntEvenSign * randomFractionalPart2 );
    let valueInputOutputOne = { valueInput: valueInputOne, valueOutput: 1 };

    // Yield kinds according to maxKinds.
    if ( maxKinds >= 2 ) {
      yield valueInputOutputZero; // Both zero and one.
      yield valueInputOutputOne;
    } else if ( maxKinds >= 1 ) {
      yield valueInputOutputZero; // Always zero. (Although, not so meaningful.)
      //yield valueInputOutputOne;
    } else {
      let index = Same.getRandomIntInclusive( 0, ( this.kinds - 1 ) );
      if ( index == 0 )
        yield valueInputOutputZero; // Randomly choose zero.
      else
        yield valueInputOutputOne;  // Randomly choose one.
    }
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

  /**
   * @param {number} baseIntCongruence
   *   An integer which is divisible by this.kinds. This will be used to offset the index value to generate valueInput.
   *
   * @param {number} index
   *   An integer between [ 0, this.kinds ).
   *
   * @return {object}
   *   Return an object { valueInput, valueOutput }. The valueInput is a floating-point value composed from baseIntCongruence, this.min
   * and index. The valueOutput is an integer value. When call this.adjust( valueInput ) will return valueOutput.
   */
  get_valueInputOutput_byIndex( baseIntCongruence, index ) {
    let valueOutputInt = ( this.min + index );

    // An integer which could become valueOutputInt when adjusted by Int.adjust().
    let valueInputInt = baseIntCongruence + valueOutputInt;
    let valueInputIntSign = Math.sign( valueInputInt );

    // If no sign (i.e. valueInputInt is zero), choose positive sign. Otherwise, there will no fractional part at all.
    if ( valueInputIntSign == 0 ) {
      valueInputIntSign = 1;
    }

    // A: Why not use Math.random() to generate value between [ 0, 1 ) directly?
    // Q: In order to avoid rounded into another integer when converted from Float64 (here) to Float32 (weights array),
    //    the random value should not too close to 1. For example, 1.9999999999999999999 might become 2.0 when converted
    //    from Float64 to Float32.
    let randomFractionalPart = Same.getRandomIntInclusive( 0, 99 ) / 1000;

    // An floating-point number (the integer with fractional part) which could become valueOutputInt when adjusted by Int.adjust().
    let valueInputFloat = valueInputInt + ( valueInputIntSign * randomFractionalPart );

    //!!! (2021/07/06 Temp Test) When the random fractional part is converted (from Float64) into Float32, it might shifted to different value.
    //if ( this.adjust( new Float32Array( [ valueInputFloat ] )[ 0 ] ) != valueOutputInt )
    //  debugger;

    return { valueInput: valueInputFloat, valueOutput: valueOutputInt };
  }

  /**
   * For ValueRange.Int, this.kinds two-value pairs will be generated in sequence.
   *
   * @param {number} offsetMultiplier
   *   An integer multiplier. The ( offsetMultiplier * this.kinds ) will be used as the first test value. The default value
   * is Same.getRandomIntInclusive( -10, +10 ). The -10 and +10 is just chosen arbitrarily.
   *
   * @param {number} maxKinds
   *   An integer restricts the generator range to [ 0, maxKinds ] instead of [ 0, this.kinds ]. Default is this.kinds.
   * When this.kinds is large, this parameter could lower the kinds to reduce test cases quantity. If zero or negative,
   * only one value (between [ 0, this.kinds ] randomly) will be generated.
   *
   * @override
   */
  * valueInputOutputGenerator( offsetMultiplier = Same.getRandomIntInclusive( -10, +10 ), maxKinds = this.kinds ) {

    // An integer which has the same remainder as offsetMultiplier when divided by this.kinds.
    let baseIntCongruence = Math.trunc( offsetMultiplier ) * this.kinds;

    if ( maxKinds > 0 ) {
      let testKinds = Math.min( maxKinds, this.kinds );
      for ( let i = 0; i < testKinds; ++i ) {
        let valueInputOutput = this.get_valueInputOutput_byIndex( baseIntCongruence, i );
        yield valueInputOutput;
      }
    } else {
      let index = Same.getRandomIntInclusive( 0, ( this.kinds - 1 ) );
      let valueInputOutput = this.get_valueInputOutput_byIndex( baseIntCongruence, index );
      yield valueInputOutput;
    }
  }

}
