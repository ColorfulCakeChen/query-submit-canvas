export { Base, Concrete, Aggregate };

/**
 * The base class for representing valuePercentage as number berween [0, 100] inclusive. Acceptable by Receiver.Base.
 *
 * The maxPercentage always returns 100. The valuePercentage() returns number berween [0, 100] inclusive.
 *
 * @member {Percentage.Base} parent The direct parent Percentage.Base of this Percentage.Base.
 */
class Base {

  /**
   * @param {Percentage.Base} parent The direct parent Percentage.Base of this Percentage.Base.
   */
  Base( parent = null ) {
    this.parent = parent;
  }

  /** Dummy. Do nothing. Sub-class should override this method. */
  resetValue() {
  }

  /**
   * @return {Percentage.Base} The root Percentage.Base of the whole Percentage hierarchy. The root's value() represents the whole percentage.
   */
  getRoot() {
    if ( this.parent )
      return this.parent.getRoot();
    return this; // If no parent, this is the root.
  }

  /**
   * Dummy.
   * @return {number} Always 0. Sub-class should override this method.
   */
  get valuePercentage() {
    return 0;
  }

  /** @return {number} Always 100. Sub-class should NOT override this method. */
  get maxPercentage() {
    return 100;
  }
}

/**
 * Collect value and max and represents them as percentage.
 *
 * The Concrete.maxPercentage always returns 100. The Concrete.valuePercentage returns number berween [0, 100] inclusive.
 *
 * @member {number} value A positive number between [ 0, max ]. Usually, caller will increase it.
 * @member {number} max   A positive number indicates the maximum value of this.value.
 */
class Concrete extends Base {
  /**
   * @param {Percentage.Base} parent
   *   The direct parent Percentage.Base of this Percentage.Concrete.
   *
   * @param {number} max
   *   The possible maximum value of this.value. If negative, indicates not initialized. This is different from maxPercentage.
   * The maxPercentage is always 100. The this.max, however, could be zero or any positive value. If max is negative, the
   * the valuePercentage will always be 0 (to avoid Aggregate.valuePercentage immediately 100). If max is zero, the
   * valuePercentage will always be 100 (to avoid divide by zero and avoid Aggregate.valuePercentage never 100).
   */
  constructor( parent = null, max = -1 ) {
    super( parent );
    this.value = 0;
    this.max = max; // Negative indicates not initialized.
  }

  /** Reset this.value to 0. */
  resetValue() {
    this.value = 0;
  }

  /**
   * @return {number}
   *   The progress as number between [0, 100] inclusive.
   *   Always 0, if this.total is negative.
   *   Always 100, if this.total is zero.
   *   Otherwise, return the ratio of ( this.accumulation / this.total ).
   */
  get valuePercentage() {
    if (this.max < 0)
      return 0;   // If max is not negative (i.e. initialized), return 0 (to avoid Aggregate.valuePercentage immediately 100).
    if (this.max == 0)
      return 100; // If max is indeed zero, return 100 (to avoid divide by zero and avoid Aggregate.valuePercentage never 100).

    let value = Math.max( 0, Math.min( this.value, this.max ) ); // Restrict between [0, total].
    let percentage = ( value / this.max ) * 100;
    return percentage;
  }
}

/**
 * Aggregate all children ( valuePercentage / maxPercentage ) and represents them as percentage.
 */
class Aggregate extends Base {
  /**
   * @param {Percentage.Base} parent
   *   The direct parent Percentage.Base of this Percentage.Aggregate.
   *
   * @param {Percentage.Base[]} children
   *   An array of Percentage.Base which will be aggregated. Their parent will be set to this Percentage.Aggregate.
   */
  constructor( parent = null, children = [] ) {
    super( parent );
    this.childProgressParts = children;

    for ( let i = 0; i < this.childProgressParts.length; ++i ) {
      let progressPart = this.childProgressParts[ i ];
      if ( progressPart )
        progressPart.parent = this;
    }
  }

  /**
   * @param {Percentage.Base} progressPart
   *   Another Progress.Percentage object. Its parent will be set to this object.
   */
  addChild( progressPart ) {
    if ( !progressPart )
      return;
    this.childProgressParts.push( progressPart );
    progressPart.parent = this;
  }

  /** Reset all children's this.value to 0. */
  resetValue() {
    for ( let i = 0; i < this.childProgressParts.length; ++i ) {
      let progressPart = this.childProgressParts[ i ];
      if ( progressPart ) {
        progressPart.resetValue();
      }
    }
  }

  /**
   * @return {number} The sum of all children's ( valuePercentage / maxPercentage ) as number between [0, 100] inclusive.
   */
  get valuePercentage() {
    let valueSum = 0, maxSum = 0;

    // Use integer array index is faster than iterator.
    //for (let progressPart of this.childProgressParts) {
    for ( let i = 0; i < this.childProgressParts.length; ++i ) {
      let progressPart = this.childProgressParts[ i ];
      if ( !progressPart )
        continue;

      let partMax = progressPart.maxPercentage;
      if ( partMax <= 0 )
        continue; // Skip illegal progress.

      let partValue = progressPart.valuePercentage;
      partValue = Math.max( 0, Math.min( partValue, partMax ) ); // Restrict between [0, partMax].

      valueSum += partValue;
      maxSum += partMax;
    }

    if ( maxSum <= 0 )
      return 0; // Return zero if the total max is illegal. (to avoid divide by zero.)

    let percentage = ( valueSum / maxSum ) * 100;
    return percentage;
  }

}
