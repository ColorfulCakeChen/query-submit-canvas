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
   * For ValueRange.Same, there is no testable value pair coulde be generated. The reason is that any value is legal for it.
   *
   * @yield {object}
   *   Every time yield an array with two number properties: { valueInput, valueOutput }. The valueOutput is a value from valueRangeMin to
   * valueRangeMax. The valueInput is a value which could be adjusted to valueOutput by this ValueRange object.
   */
  * valueInputOutputPairGenerator() {
    return;
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
   * @override
   */
  * valueInputOutputPairGenerator() {

    let randomBaseInt = Same.getRandomIntInclusive( -100, +100 ); // (-100 and +100 just chosen arbitrarily.)
    let randomBaseIntEven = randomBaseInt * 2; // Any integer multiplied by 2 will be an even number.

    // An even value with fractional part will become 0 by Bool.adjust().
    let valueInputZero = ( randomBaseIntEven + 0 ) + Math.random();
    yield { valueInput: valueInputZero, valueOutput: 0 };

    // A odd value with fractional part will become 1 by Bool.adjust().
    let valueInputOne  = ( randomBaseIntEven + 1 ) + Math.random();
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

  /**
   * For ValueRange.Int, this.kinds two-value pairs will be generated in sequence.
   *
   * @override
   */
  * valueInputOutputPairGenerator() {

    let randomBaseInt = Same.getRandomIntInclusive( -10, +10 ); // (-10 and +10 just chosen arbitrarily.)

    // An integer which has the same remainder as randomBaseInt when divided by this.kinds.
    let randomBaseIntCongruence = randomBaseInt * this.kinds;

    for ( let i = 0; i < this.kinds; ++i ) {
      let valueOutputInt = ( this.min + i );

      // An integer which could become valueOutputInt when adjusted by Int.adjust().
      let valueInputInt = randomBaseIntCongruence + valueOutputInt;

      // An floating-point number (the integer with fractional part) which could become valueOutputInt when adjusted by Int.adjust().
      let valueInputFloat = valueInputInt + Math.random();

      yield { valueInput: valueInputFloat, valueOutput: valueOutputInt };
    }
  }

}
