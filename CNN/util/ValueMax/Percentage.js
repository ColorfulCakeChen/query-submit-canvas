export { ValueMax_Percentage_Base as Base };
export { Concrete };
export { Aggregate };

import * as Pool from "../Pool.js";
import * as Recyclable from "../Recyclable.js";

/**
 * The base class for representing valuePercentage as number between [0, 100] inclusive.
 * Acceptable by Receiver.Base.
 *
 *   - The maxPercentage always returns 100.
 *   - The valuePercentage returns number between [0, 100] inclusive.
 *
 * @member {Percentage.Base} parent The direct parent Percentage.Base of this Percentage.Base.
 */
class ValueMax_Percentage_Base extends Recyclable.Root {

  /**
   * Used as default ValueMax.Percentage.Base provider for conforming to Recyclable interface.
   */
  static Pool = new Pool.Root( "ValueMax.Percentage.Base.Pool",
    ValueMax_Percentage_Base, ValueMax_Percentage_Base.setAsConstructor );

  /**
   *
   */
  constructor() {
    super();
    ValueMax_Percentage_Base.setAsConstructor_self.call( this );
  }

  /** @override */
  static setAsConstructor() {
    super.setAsConstructor();
    ValueMax_Percentage_Base.setAsConstructor_self.call( this );
    return this;
  }

  /** @override */
  static setAsConstructor_self() {
    this.parent = null;
    this.valuePercentage_cached = undefined;
  }

  /** @override */
  disposeResources() {

    // In theory, here should remove this child object from parent (i.e. Aggregate)
    // so that the parent will not dispose (and recycle) this child object once again.
    // In fact, however, this is an expensive action (because a linear search should
    // be done. So, the better choice is to dispose the whole tree from root object
    // by caller to avoid this problem.
    //
    //if ( this.parent ) {
    //  if ( this.parent instanceof Aggregate ) {
    //    // Do nothing currently.
    //  }
    //}

    this.valuePercentage_cached = undefined;
    this.parent = undefined;
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
   * Invalidate .valuePercentage_cached (i.e. let it become undefined). This method
   * will invalidate parent's .valuePercentage_cached, too.
   */
  valuePercentage_cached_invalidate() {
    this.valuePercentage_cached = undefined;
    if ( this.parent )
      this.parent.valuePercentage_cached_invalidate();
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
 * The Concrete.maxPercentage always returns 100. The Concrete.valuePercentage returns
 * number between [ 0, 100 ] inclusive.
 *
 * @member {number} value
 *   A positive number between [ 0, max ]. Usually, caller will increase it.
 *
 * @member {number} max
 *   A positive number indicates the maximum value of this.value.
 */
class Concrete extends ValueMax_Percentage_Base {

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
   * Add advancedValue to .value (and invalidate .valuePercentage_cached).
   *
   * @param {number} advancedValue
   *   Add how many to .value. default is 1.
   */
  value_advance( advancedValue = 1 ) {
    this.value += advancedValue;
    this.valuePercentage_cached_invalidate();
  }
  
  /**
   * @return {number}
   *   The progress as number between [0, 100] inclusive.
   *   Always 0, if this.max is negative.
   *   Always 100, if this.max is zero.
   *   Otherwise, return the ratio of ( this.value / this.max ).
   */
  get valuePercentage() {
    if ( this.valuePercentage_cached != undefined )
      return this.valuePercentage_cached;

    if (this.max < 0)
      return 0;   // If max is negative (i.e. not initialized), return 0 (to avoid Aggregate.valuePercentage immediately 100).
    if (this.max == 0)
      return 100; // If max is indeed zero, return 100 (to avoid divide by zero and avoid Aggregate.valuePercentage never 100).

    let value = Math.max( 0, Math.min( this.value, this.max ) ); // Restrict between [0, total].
    this.valuePercentage_cached = ( value / this.max ) * 100;
    return this.valuePercentage_cached;
  }
}


/**
 * Aggregate all children ( valuePercentage / maxPercentage ) and represents them as
 * percentage.
 *
 * @member {Percentage.Base[]} children
 *   An array of Percentage.Base which will be aggregated. Their parent are set
 * to this Percentage.Aggregate.
 */
class Aggregate extends ValueMax_Percentage_Base {

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
   * Append child (and invalidate .valuePercentage_cached).
   *
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

    this.valuePercentage_cached_invalidate();
     
    return child;
  }

  /**
   * @return {number} The sum of all children's ( valuePercentage / maxPercentage ) as number between [0, 100] inclusive.
   */
  get valuePercentage() {
    if ( this.valuePercentage_cached != undefined )
      return this.valuePercentage_cached;
    
    let valueSum = 0, maxSum = 0;

    // Use integer array index is faster than iterator.
    //for (let child of this.children) {
    for ( let i = 0; i < this.children.length; ++i ) {
      let child = this.children[ i ];
      if ( !child )
        continue;

      let partMax = child.maxPercentage;
      if ( partMax <= 0 )
        continue; // Skip illegal progress. (Note: maxPercentage should always be 100.)

      let partValue = child.valuePercentage;
      partValue = Math.max( 0, Math.min( partValue, partMax ) ); // Restrict between [ 0, partMax ].

      valueSum += partValue;
      maxSum += partMax;
    }

    if ( maxSum <= 0 )
      return 0; // Return zero if the total max is illegal. (to avoid divide by zero.)

    this.valuePercentage_cached = ( valueSum / maxSum ) * 100;
    return this.valuePercentage_cached;
  }

}
