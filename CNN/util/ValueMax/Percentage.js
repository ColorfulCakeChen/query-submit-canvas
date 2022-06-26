export { Base };
export { BasePool };
export { Concrete };
export { ConcretePool };
export { Aggregate };
export { AggregatePool };

import * as Pool from "../util/Pool.js";
import * as Pool from "../util/Recyclable.js";

/**
 * The base class for representing valuePercentage as number berween [0, 100] inclusive. Acceptable by Receiver.Base.
 *
 * The maxPercentage always returns 100. The valuePercentage returns number berween [0, 100] inclusive.
 *
 * @member {Percentage.Base} parent The direct parent Percentage.Base of this Percentage.Base.
 */
class Base extends Recyclable.Root {

  /**
   *
   */
  constructor() {
    this.setAsConstructor();
  }

  /**
   * @return {Base}
   *   Return the this object.
   */
  setAsConstructor() {
    this.parent = null;
    return this;
  }

  ///**
  // * Sub-class should override this method (and call super.disposeResources() before return).
  // */
  //disposeResources() {
  //  super.disposeResources();
  //}

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
 * Providing ValueMax.Base
 *
 */
class BasePool extends Pool.Root {

  constructor() {
    super( Base, Base.setAsConstructor );
  }

}

/**
 * Used as default ValueMax.Base provider for conforming to Recyclable interface.
 */
Base.Pool = new BasePool();


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
   * @param {number} max
   *   The possible maximum value of this.value. If negative, indicates not initialized. This is different from maxPercentage.
   * The maxPercentage is always 100. The this.max, however, could be zero or any positive value. If max is negative, the
   * the valuePercentage will always be 0 (to avoid Aggregate.valuePercentage immediately 100). If max is zero, the
   * valuePercentage will always be 100 (to avoid divide by zero and avoid Aggregate.valuePercentage never 100).
   */
  constructor( max = -1 ) {
    super();
    this.setAsConstructor( max );
  }

  /**
   * @param {number} max
   *   The possible maximum value of this.value. If negative, indicates not initialized. This is different from maxPercentage.
   * The maxPercentage is always 100. The this.max, however, could be zero or any positive value. If max is negative, the
   * the valuePercentage will always be 0 (to avoid Aggregate.valuePercentage immediately 100). If max is zero, the
   * valuePercentage will always be 100 (to avoid divide by zero and avoid Aggregate.valuePercentage never 100).
   *
   * @return {Concrete}
   *   Return the this object.
   */
  setAsConstructor( max = -1 ) {
    super.setAsConstructor();
    this.value = 0;
    this.max = max; // Negative indicates not initialized.
    return this;
  }

  ///**
  // * Sub-class should override this method (and call super.disposeResources() before return).
  // */
  //disposeResources() {
  //  super.disposeResources();
  //}

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
 * Providing ValueMax.Concrete
 *
 */
class ConcretePool extends Pool.Root {

  constructor() {
    super( Concrete, Concrete.setAsConstructor );
  }

}

/**
 * Used as default ValueMax.Concrete provider for conforming to Recyclable interface.
 */
Concrete.Pool = new ConcretePool();


/**
 * Aggregate all children ( valuePercentage / maxPercentage ) and represents them as percentage.
 */
class Aggregate extends Base {

  /**
   * @param {Percentage.Base[]} children
   *   An array of Percentage.Base which will be aggregated. Their parent will be set to this Percentage.Aggregate.
   */
  constructor( children = Pool.Array.Singleton.get_or_create_by( 0 ) ) {
    super();
    this.setAsConstructor( children );
  }

  /**
   * @param {Percentage.Base[]} children
   *   An array of Percentage.Base which will be aggregated. Their parent will be set to this Percentage.Aggregate.
   *
   * @return {Aggregate}
   *   Return the this object.
   */
  setAsConstructor( children = Pool.Array.Singleton.get_or_create_by( 0 ) ) {
    super.setAsConstructor();

    this.children = children;

    for ( let i = 0; i < this.children.length; ++i ) {
      let child = this.children[ i ];
      if ( child )
        child.parent = this;
    }
    return this;
  }

  /**
   * Sub-class should override this method (and call super.disposeResources() before return).
   */
  disposeResources() {
    if ( this.children ) {

      for ( let i = 0; i < this.children.length; ++i ) {
        let child = this.children[ i ];
        if ( child ) {
          child.disposeResources_and_recycleToPool();
          this.children[ i ] = null;
        }
      }

      Pool.Array.Singleton.recycle( this.children );
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


/**
 * Providing ValueMax.Aggregate
 *
 */
class AggregatePool extends Pool.Root {

  constructor() {
    super( Aggregate, Aggregate.setAsConstructor );
  }

}

/**
 * Used as default ValueMax.Aggregate provider for conforming to Recyclable interface.
 */
Aggregate.Pool = new AggregatePool();

