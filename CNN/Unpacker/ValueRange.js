export { Same, Int, Bool };

import * as RandTools from "../util/RandTools.js";

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
   * is RandTools.getRandomIntInclusive( -10, +10 ). The -10 and +10 is just chosen arbitrarily.
   *
   * @yield {object}
   *   Every time yield an array with two number properties: { valueInput, valueOutput }. The valueOutput is a value from valueRangeMin to
   * valueRangeMax. The valueInput is a value which could be adjusted to valueOutput by this ValueRange object.
   */
  * valueInputOutputGenerator( offsetMultiplier = RandTools.getRandomIntInclusive( -10, +10 ) ) {
    yield { valueInput: offsetMultiplier, valueOutput: offsetMultiplier };
  }

}

/** The only one ValueRange.Same instance. */
Same.Singleton = new Same;


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
    let randomFractionalPart = RandTools.getRandomIntInclusive( 0, 99 ) / 1000;

    // An floating-point number (the integer with fractional part) which could become valueOutputInt when adjusted by Int.adjust().
    let valueInputFloat = valueInputInt + ( valueInputIntSign * randomFractionalPart );

    //!!! (2021/07/06 Temp Test) When the random fractional part is converted (from Float64) into Float32, it might shifted to different value.
    if ( this.adjust( new Float32Array( [ valueInputFloat ] )[ 0 ] ) != valueOutputInt )
     debugger;

    //!!! (2022/06/16 Temp Test)
    //if ( this.adjust( valueInputFloat ) != valueOutputInt )
    // debugger;

    return { valueInput: valueInputFloat, valueOutput: valueOutputInt };
  }

  /**
   * For ValueRange.Int, this.kinds two-value pairs will be generated in sequence.
   *
   * @param {number} offsetMultiplier
   *   An integer multiplier. The ( offsetMultiplier * this.kinds ) will be used as the first test value. The default value
   * is RandTools.getRandomIntInclusive( -10, +10 ). The -10 and +10 is just chosen arbitrarily.
   *
   * @param {number[]} valueOutMinMax
   *   An integer array restricts the generator range to [ valueOutMin, valueOutMax ]. Itself will be restricted to
   * [ this.min, this.max ] at most. When this.kinds is large, this parameter could lower the kinds to reduce test
   * cases quantity. If null or undefined, only one value (between [ this.min, this.max ] randomly) will be generated.
   *
   *
   * @return {object}
   *   Return an object { valueInput, valueOutput }. The valueInput is a floating-point value. The valueOutput is an integer value.
   * When call this.adjust( valueInput ) will return valueOutput.
   *
   * @override
   */
  * valueInputOutputGenerator( offsetMultiplier = RandTools.getRandomIntInclusive( -10, +10 ), valueOutMinMax ) {

    // An integer which has the same remainder as offsetMultiplier when divided by this.kinds.
    let baseIntCongruence = Math.trunc( offsetMultiplier ) * this.kinds;

    if ( valueOutMinMax ) {
      let valueOutMin = Math.max( Math.min( valueOutMinMax[ 0 ], valueOutMinMax[ 1 ] ), this.min ); // The smaller one of valueOutMinMax.
      let valueOutMax = Math.min( Math.max( valueOutMinMax[ 0 ], valueOutMinMax[ 1 ] ), this.max ); // The larger one of valueOutMinMax.

      let indexLower = valueOutMin - this.min; // index is 0-base.
      let indexUpper = valueOutMax - this.min;

      for ( let i = indexLower; i <= indexUpper; ++i ) {
        let valueInputOutput = this.get_valueInputOutput_byIndex( baseIntCongruence, i );
        yield valueInputOutput;
      }
    } else {
      let index = RandTools.getRandomIntInclusive( 0, ( this.kinds - 1 ) );
      let valueInputOutput = this.get_valueInputOutput_byIndex( baseIntCongruence, index );
      yield valueInputOutput;
    }
  }

}


/**
 * Provides methods for converting weight (a number) to boolean.
 */
class Bool extends Int {

  constructor() {
    super( 0, 1 ); // Boolean has only two kinds [ 0, 1 ].
  }

  /** @return {boolean} Convert number value into false or true.
   * @override
   */
  adjust( value ) {
    return ( super.adjust( value ) != 0 ); // Convert into boolean.
  }

  /**
   * @param {number} baseIntCongruence
   *   An integer which is divisible by this.kinds. This will be used to offset the index value to generate valueInput.
   *
   * @param {number} index
   *   An integer between [ 0, this.kinds ).
   *
   * @return {object}
   *   Return an object { valueInput, valueOutput }. The valueInput is a floating-point value. The valueOutput is a boolean value.
   * When call this.adjust( valueInput ) will return valueOutput.
   *
   * @override
   */
  get_valueInputOutput_byIndex( baseIntCongruence, index ) {
    let valueInputOutput = super.get_valueInputOutput_byIndex( baseIntCongruence, index );
    valueInputOutput.valueOutput = ( valueInputOutput.valueOutput != 0 ); // Convert into boolean.
    return valueInputOutput;
  }

  /**
   * For ValueRange.Bool, two two-value pairs will be generated in sequence.
   *
   * @param {number} offsetMultiplier
   *   An integer multiplier. The ( offsetMultiplier * this.kinds ) will be used as the first test value. The default value
   * is RandTools.getRandomIntInclusive( -100, +100 ). The -100 and +100 is just chosen arbitrarily.
   *
   * @param {number[]} valueOutMinMax
   *   An integer restricts the generator range to [ valueOutMin, valueOutMax ]. Itself will be restricted to [ this.min, this.max ]
   * at most. When this.kinds is large, this parameter could lower the kinds to reduce test cases quantity. If null or undefined,
   * only one value (between [ this.min, this.max ] randomly) will be generated.
   *
   * @return {object}
   *   Return an object { valueInput, valueOutput }. The valueInput is a floating-point value. The valueOutput is a boolean value.
   * When call this.adjust( valueInput ) will return valueOutput.
   *
   * @override
   */
  * valueInputOutputGenerator( offsetMultiplier = RandTools.getRandomIntInclusive( -100, +100 ), valueOutMinMax ) {
    yield* super.valueInputOutputGenerator( offsetMultiplier, valueOutMinMax );
  }

}

/** The only one ValueRange.Bool instance. */
Bool.Singleton = new Bool;

