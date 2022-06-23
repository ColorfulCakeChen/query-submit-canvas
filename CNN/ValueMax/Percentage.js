export { Base };
export { Concrete };
export { ConcretePool };
export { Aggregate };
export { AggregatePool };

import * as Pool from "../util/Pool.js";

/**
 * The base class for representing valuePercentage as number berween [0, 100] inclusive. Acceptable by Receiver.Base.
 *
 * The maxPercentage always returns 100. The valuePercentage returns number berween [0, 100] inclusive.
 *
 * @member {Percentage.Base} parent The direct parent Percentage.Base of this Percentage.Base.
 */
class Base {

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

//!!! (2020/12/12 Remarked) This object is tended to be created new every time. There is no need to reset.
//   /** Dummy. Do nothing. Sub-class should override this method. */
//   resetValue() {
//   }

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

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    //this.disposeResources();
    ConcretePool.Singleton.recycle( this );
  }

//!!! (2020/12/12 Remarked) This object is tended to be created new every time. There is no need to reset.
//   /** Reset this.value to 0. */
//   resetValue() {
//     this.value = 0;
//   }

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
 * Used as default ValueMax.Concrete provider.
 */
ConcretePool.Singleton = new ConcretePool();


/**
 * Aggregate all children ( valuePercentage / maxPercentage ) and represents them as percentage.
 */
class Aggregate extends Base {

  /**
   * @param {Percentage.Base[]} children
   *   An array of Percentage.Base which will be aggregated. Their parent will be set to this Percentage.Aggregate.
   */
  constructor( children = [] ) {
    super();
    this.setAsConstructor( children );
  }

//!!! ...unfinished... (2022/06/23) should use Pool.Array
  /**
   * @param {Percentage.Base[]} children
   *   An array of Percentage.Base which will be aggregated. Their parent will be set to this Percentage.Aggregate.
   *
   * @return {Aggregate}
   *   Return the this object.
   */
  setAsConstructor( children = [] ) {
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

//!!! ...unfinished... (2022/06/23) should use Pool.Array to recycle.

  }

  /**
   * After calling this method, this object should be viewed as disposed and should not be operated again.
   */
  disposeResources_and_recycleToPool() {
    this.disposeResources();
    AggregatePool.Singleton.recycle( this );
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

//!!! (2020/12/12 Remarked) This object is tended to be created new every time. There is no need to reset.
//   /** Reset all children's this.value to 0. */
//   resetValue() {
//     for ( let i = 0; i < this.children.length; ++i ) {
//       let child = this.children[ i ];
//       if ( child ) {
//         child.resetValue();
//       }
//     }
//   }

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
 * Used as default ValueMax.Aggregate provider.
 */
AggregatePool.Singleton = new AggregatePool();

