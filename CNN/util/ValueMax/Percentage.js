export { Base };
export { Concrete };
export { Aggregate };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";

/**
 * The base class for representing valuePercentage as number berween [0, 100] inclusive. Acceptable by Receiver.Base.
 *
 * The maxPercentage always returns 100. The valuePercentage returns number berween [0, 100] inclusive.
 *
 * @member {Percentage.Base} parent The direct parent Percentage.Base of this Percentage.Base.
 */
class Base extends Recyclable.Root {

  /**
   * Used as default ValueMax.Percentage.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ValueMax.Percentage.Base.Pool", Base, Base.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.parent = null;
  }

  /** @override */
  disposeResources() {
    if ( this.parent ) {
      if ( this.parent instanceof Aggregate ) {

!!! ...unfinished... (2022/06/30)
// should remove self from parent.
// Otherwise, when parent .disposeResources(), this object will be disposed again.
//
// How to remove fast?

      }
    }
    this.parent = null;
    super.disposeResources();
  }

  /**
   * @return {Percentage.Base} The root Percentage.Base of the whole Percentage hierarchy. The root's valuePercentage represents the whole percentage.
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
   * Used as default ValueMax.Percentage.Concrete provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ValueMax.Percentage.Concrete.Pool", Concrete, Concrete.setAsConstructor );

  /**
   * @param {number} max
   *   The possible maximum value of this.value. If negative, indicates not initialized. This is different from maxPercentage.
   * The maxPercentage is always 100. The this.max, however, could be zero or any positive value. If max is negative, the
   * the valuePercentage will always be 0 (to avoid Aggregate.valuePercentage immediately 100). If max is zero, the
   * valuePercentage will always be 100 (to avoid divide by zero and avoid Aggregate.valuePercentage never 100).
   */
  constructor( max = -1 ) {
    super();
    Concrete.setAsConstructor_self.call( this, max );
  }

  /** @override */
  static setAsConstructor( max = -1 ) {
    super.setAsConstructor();
    Concrete.setAsConstructor_self.call( this, max );
    return this;
  }

  /** @override */
  static setAsConstructor_self( max = -1 ) {
    this.value = 0;
    this.max = max; // Negative indicates not initialized.
  }

  /** @override */
  disposeResources() {
    this.max = undefined;
    this.value = undefined;
    super.disposeResources();
  }

  /**
   * @return {number}
   *   The progress as number between [0, 100] inclusive.
   *   Always 0, if this.max is negative.
   *   Always 100, if this.max is zero.
   *   Otherwise, return the ratio of ( this.value / this.max ).
   */
  get valuePercentage() {
    if (this.max < 0)
      return 0;   // If max is negative (i.e. not initialized), return 0 (to avoid Aggregate.valuePercentage immediately 100).
    if (this.max == 0)
      return 100; // If max is indeed zero, return 100 (to avoid divide by zero and avoid Aggregate.valuePercentage never 100).

    let value = Math.max( 0, Math.min( this.value, this.max ) ); // Restrict between [0, total].
    let percentage = ( value / this.max ) * 100;
    return percentage;
  }
}


/**
 * Aggregate all children ( valuePercentage / maxPercentage ) and represents them as percentage.
 *
 * @member {Percentage.Base[]} children
 *   An array of Percentage.Base which will be aggregated. Their parent will be set to this Percentage.Aggregate.
 */
class Aggregate extends Base {

  /**
   * Used as default ValueMax.Percentage.Aggregate provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ValueMax.Percentage.Aggregate.Pool", Aggregate, Aggregate.setAsConstructor );

  /**
   */
  constructor() {
    super();
    Aggregate.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    Aggregate.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.children = Recyclable.Array.Pool.get_or_create_by( 0 );
  }

  /** @override */
  disposeResources() {
    if ( this.children ) {

      for ( let i = 0; i < this.children.length; ++i ) {
        let child = this.children[ i ];
        if ( child ) {
          child.disposeResources_and_recycleToPool();
          this.children[ i ] = null;
        }
      }

      this.children.disposeResources_and_recycleToPool();
      this.children = null;
    }
    super.disposeResources();
  }

  /**
   * @param {Percentage.Base} child
   *   Another Percentage.Base object. Its parent will be set to this object.
   *
   * @return {Percentage.Base} Return the child for cascading easily.
   */
  addChild( child ) {
    if ( !child )
      return null;
    this.children.push( child );
    child.parent = this;
    return child;
  }

  /**
   * @return {number} The sum of all children's ( valuePercentage / maxPercentage ) as number between [0, 100] inclusive.
   */
  get valuePercentage() {
    let valueSum = 0, maxSum = 0;

    // Use integer array index is faster than iterator.
    //for (let child of this.children) {
    for ( let i = 0; i < this.children.length; ++i ) {
      let child = this.children[ i ];
      if ( !child )
        continue;

      let partMax = child.maxPercentage;
      if ( partMax <= 0 )
        continue; // Skip illegal progress. (This is impossible because maxPercentage is always 100.)

      let partValue = child.valuePercentage;
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
