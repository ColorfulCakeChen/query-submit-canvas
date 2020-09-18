export {Base, Concrete, Aggregate};

/**
 * The base class for representing progress as number berween [0, 100] inclusive. Acceptable by Receiver.Base.
 *
 * The max() always returns 100. The value() returns number berween [0, 100] inclusive.
 */
class Base {

  /** Dummy. Do nothing. Sub-class should override this method. */
  resetAccumulation() {
  }

  /**
   * Dummy.
   * @return Always return 0. Sub-class should override this method.
   */
  get value() {
    return 0;
  }

  /** @return Always is 100. Sub-class should NOT override this method. */
  get max() {
    return 100;
  }
}

/**
 * Aggregate all progress and represents them as percentag. Acceptable by Receiver.Base.
 *
 * The Concrete.max always returns 100. The Concrete.value returns number berween [0, 100] inclusive.
 */
class Concrete extends Base {
  /**
   * @param {number} total
   *   The possible maximum value of this.accumulation. If negative, indicates not initialized. This is different from this.max.
   * The this.max is always 100. The this.total, however, could be zero or any positive value. If this.total is zero, the
   * this.value will always 100 (otherwise, will divide by zero).
   */
  constructor( total = -1 ) {
    super();
    this.accumulation = 0;
    this.total = total; // Negative indicates not initialized.
  }

  /** Reset this.accumulation to 0. */
  resetAccumulation() {
    this.accumulation = 0;
  }

  /**
   * @return
   *   The progress as number between [0, 100] inclusive.
   *   Always 0, if this.total is negative.
   *   Always 100, if this.total is zero.
   *   Otherwise, return the ratio of ( this.accumulation / this.total ).
   */
  get value() {
    if (this.total < 0)
      return 0;   // Return 0 if total is not initialized. Otherwise, the Aggregate.value will immediately 100.
    if (this.total == 0)
      return 100; // Return 100 if total is indeed zero. Otherwise, the Aggregate.value will never 100.

    let accumulation = Math.max(0, Math.min(this.accumulation, this.total)); // Restrict between [0, total].
    let percentage = ( accumulation / this.total ) * 100;
    return percentage;
  }
}

/**
 * Aggregate all children progress and represents them as percentage.
 */
class Aggregate extends Base {
  /**
   * @param {Percentage.Base[]} children An array of Percentage which will be aggregate.
   */
  constructor(children = []) {
    super();
    this.childProgressParts = children;
  }

  /**
   * @param {Percentage.Base} progressPart Another Progress.Percentage object.
   */
  addChild(progressPart) {
    this.childProgressParts.push(progressPart);
  }

  /** Reset all children's this.accumulation to 0. */
  resetAccumulation() {
    for ( let i = 0; i < this.childProgressParts.length; ++i ) {
      let progressPart = this.childProgressParts[ i ];
      if ( progressPart ) {
        progressPart.resetAccumulation();
      }
    }
  }

  /**
   * @return The average of all children progress as number between [0, 100] inclusive.
   */
  get value() {
    let valueSum = 0, maxSum = 0;

    // Use integer array index is faster than iterator.
    //for (let progressPart of this.childProgressParts) {
    for ( let i = 0; i < this.childProgressParts.length; ++i ) {
      let progressPart = this.childProgressParts[ i ];
      if ( !progressPart )
        continue;

      let partMax = progressPart.max;
      if ( partMax <= 0 )
        continue; // Skip illegal progress.

      let partValue = progressPart.value;
      partValue = Math.max( 0, Math.min( partValue, partMax ) ); // Restrict between [0, partMax].

      valueSum += partValue;
      maxSum += partMax;
    }

    if ( maxSum <= 0 )
      return 0; // Return zero if the total is illegal. (to avoid divide by zero.)

    let percentage = ( valueSum / maxSum ) * 100;
    return percentage;
  }

}
